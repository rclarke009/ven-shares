import "server-only";

import { auth } from "@clerk/nextjs/server";

import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { normalizeRequiredJobCategoriesFromDb } from "@/lib/skills-match";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import type { ProjectRequiredSkill } from "@/lib/project-required-skills";
import {
  getArenaTeamPreviewForProjects,
  type ArenaTeamMemberDisplay,
} from "@/lib/arena-team";
import {
  categoryAllLeavesComplete,
  categoryHasAnyLeafCompleted,
  mergeChecklistWithTemplates,
} from "@/lib/workspace-progress-checklist";

export type ArenaCategorySlotStatus = "needed" | "in_progress" | "complete";

export type ArenaCategorySlot = {
  category: ProfessionalJobCategory;
  status: ArenaCategorySlotStatus;
  /** True when at least one project member lists this category in covered_job_categories (union). */
  teamCoversCategory: boolean;
  /** True when the merged workspace checklist has at least one completed leaf in this category. */
  workspaceChecklistStarted: boolean;
};

/** Public fields for Idea Arena UI (no clerk_user_id). */
export type ArenaProject = {
  id: string;
  title: string;
  description: string | null;
  required_job_categories: ProfessionalJobCategory[];
  completed_job_categories: ProfessionalJobCategory[];
  representative_image_path: string | null;
  project_required_skills: ProjectRequiredSkill[];
  created_at: string;
  category_statuses: ArenaCategorySlot[];
};

export type ArenaProjectViewerRelation = "owner" | "team" | null;

export type ArenaProjectForViewer = ArenaProject & {
  myRelation: ArenaProjectViewerRelation;
  teamPreview: ArenaTeamMemberDisplay[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isProjectUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function normalizeSkillRows(raw: unknown): ProjectRequiredSkill[] {
  if (!Array.isArray(raw)) return [];
  const out: ProjectRequiredSkill[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const name = typeof o.skill_name === "string" ? o.skill_name : "";
    const desc =
      typeof o.skill_description === "string" ? o.skill_description : "";
    const sort =
      typeof o.sort_order === "number" && Number.isFinite(o.sort_order)
        ? o.sort_order
        : out.length;
    out.push({ skill_name: name, skill_description: desc, sort_order: sort });
  }
  return out.sort((a, b) => a.sort_order - b.sort_order);
}

async function fetchCoveredUnionByProjectIds(
  projectIds: string[],
): Promise<Map<string, Set<ProfessionalJobCategory>>> {
  const map = new Map<string, Set<ProfessionalJobCategory>>();
  if (projectIds.length === 0) return map;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id, covered_job_categories")
    .in("project_id", projectIds);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const pid = row.project_id as string;
    const cats = normalizeRequiredJobCategoriesFromDb(
      row.covered_job_categories,
    );
    let set = map.get(pid);
    if (!set) {
      set = new Set();
      map.set(pid, set);
    }
    for (const c of cats) {
      set.add(c);
    }
  }

  return map;
}

function mapArenaRow(
  row: Record<string, unknown>,
  coveredUnion: Set<ProfessionalJobCategory>,
): ArenaProject {
  const cats = row.required_job_categories;
  const requiredRaw = Array.isArray(cats)
    ? cats.filter((x): x is string => typeof x === "string")
    : [];
  const rawCompleted = row.completed_job_categories;
  const completedRaw = Array.isArray(rawCompleted)
    ? rawCompleted.filter((x): x is string => typeof x === "string")
    : [];

  const required_job_categories =
    normalizeRequiredJobCategoriesFromDb(requiredRaw);
  const completed_job_categories =
    normalizeRequiredJobCategoriesFromDb(completedRaw);

  const rawChecklist = row.workspace_progress_checklist;
  const mergedChecklist = mergeChecklistWithTemplates(
    required_job_categories,
    rawChecklist ?? {},
    completed_job_categories,
  );

  const category_statuses: ArenaCategorySlot[] = required_job_categories.map(
    (category) => {
      const block = mergedChecklist[category];
      const teamCoversCategory = coveredUnion.has(category);
      const workspaceChecklistStarted = categoryHasAnyLeafCompleted(block);
      let status: ArenaCategorySlotStatus;
      if (categoryAllLeavesComplete(block)) {
        status = "complete";
      } else if (workspaceChecklistStarted || teamCoversCategory) {
        status = "in_progress";
      } else {
        status = "needed";
      }
      return {
        category,
        status,
        teamCoversCategory,
        workspaceChecklistStarted,
      };
    },
  );

  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    required_job_categories,
    completed_job_categories,
    representative_image_path:
      typeof row.representative_image_path === "string"
        ? row.representative_image_path
        : null,
    project_required_skills: normalizeSkillRows(row.project_required_skills),
    created_at: row.created_at as string,
    category_statuses,
  };
}

const ARENA_PROJECT_SELECT = `
      id,
      title,
      description,
      required_job_categories,
      completed_job_categories,
      workspace_progress_checklist,
      representative_image_path,
      created_at,
      project_required_skills ( skill_name, skill_description, sort_order )
    `;

/** DBs with migration 007 but not 008 omit workspace_progress_checklist. */
const ARENA_PROJECT_SELECT_WITHOUT_WORKSPACE_CHECKLIST = `
      id,
      title,
      description,
      required_job_categories,
      completed_job_categories,
      representative_image_path,
      created_at,
      project_required_skills ( skill_name, skill_description, sort_order )
    `;

/** DBs that have not applied migration 007 omit this column. */
const ARENA_PROJECT_SELECT_LEGACY = `
      id,
      title,
      description,
      required_job_categories,
      representative_image_path,
      created_at,
      project_required_skills ( skill_name, skill_description, sort_order )
    `;

function isMissingCompletedJobCategoriesColumn(error: {
  code?: string;
  message: string;
}): boolean {
  return (
    error.code === "42703" &&
    error.message.includes("completed_job_categories")
  );
}

function isMissingWorkspaceProgressChecklistColumn(error: {
  code?: string;
  message: string;
}): boolean {
  return (
    error.code === "42703" &&
    error.message.includes("workspace_progress_checklist")
  );
}

export async function listProjectsForArena(): Promise<ArenaProject[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createServerSupabaseClient();
  const primary = await supabase
    .from("projects")
    .select(ARENA_PROJECT_SELECT)
    .order("created_at", { ascending: false });

  let rows: Record<string, unknown>[];

  if (
    primary.error &&
    isMissingCompletedJobCategoriesColumn(primary.error)
  ) {
    const legacy = await supabase
      .from("projects")
      .select(ARENA_PROJECT_SELECT_LEGACY)
      .order("created_at", { ascending: false });
    if (legacy.error) {
      console.log("MYDEBUG →", legacy.error.message);
      return [];
    }
    rows = (legacy.data ?? []) as Record<string, unknown>[];
  } else if (
    primary.error &&
    isMissingWorkspaceProgressChecklistColumn(primary.error)
  ) {
    const fallback = await supabase
      .from("projects")
      .select(ARENA_PROJECT_SELECT_WITHOUT_WORKSPACE_CHECKLIST)
      .order("created_at", { ascending: false });
    if (fallback.error) {
      console.log("MYDEBUG →", fallback.error.message);
      return [];
    }
    rows = (fallback.data ?? []) as Record<string, unknown>[];
  } else if (primary.error) {
    console.log("MYDEBUG →", primary.error.message);
    return [];
  } else {
    rows = (primary.data ?? []) as Record<string, unknown>[];
  }

  const ids = rows.map((r) => r.id as string);
  const unionMap = await fetchCoveredUnionByProjectIds(ids);

  return rows.map((row) => {
    const id = row.id as string;
    return mapArenaRow(row, unionMap.get(id) ?? new Set());
  });
}

/** Idea Arena list row for the signed-in viewer (owner vs team member border on cards). */
export async function listProjectsForArenaForViewer(): Promise<
  ArenaProjectForViewer[]
> {
  const { userId } = await auth();
  if (!userId) return [];

  const projects = await listProjectsForArena();
  if (projects.length === 0) return [];

  const ids = projects.map((p) => p.id);
  const supabase = createServerSupabaseClient();

  const { data: projectRows, error: projectError } = await supabase
    .from("projects")
    .select("id, clerk_user_id")
    .in("id", ids);

  if (projectError) {
    console.log("MYDEBUG →", projectError.message);
  }

  const ownerByProjectId = new Map<string, string>();
  for (const row of projectRows ?? []) {
    ownerByProjectId.set(
      row.id as string,
      row.clerk_user_id as string,
    );
  }

  const { data: memberRows, error: memberError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("clerk_user_id", userId)
    .in("project_id", ids);

  if (memberError) {
    console.log("MYDEBUG →", memberError.message);
  }

  const teamProjectIds = new Set(
    (memberRows ?? []).map((m) => m.project_id as string),
  );

  const teamPreviewMap = await getArenaTeamPreviewForProjects(
    projects.map((p) => ({
      id: p.id,
      required_job_categories: p.required_job_categories,
    })),
  );

  return projects.map((p) => {
    const ownerId = ownerByProjectId.get(p.id);
    let myRelation: ArenaProjectViewerRelation = null;
    if (ownerId === userId) myRelation = "owner";
    else if (teamProjectIds.has(p.id)) myRelation = "team";
    return {
      ...p,
      myRelation,
      teamPreview: teamPreviewMap.get(p.id) ?? [],
    };
  });
}

export async function getProjectByIdForArena(
  id: string,
): Promise<ArenaProject | null> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(id)) return null;

  const supabase = createServerSupabaseClient();
  const primary = await supabase
    .from("projects")
    .select(ARENA_PROJECT_SELECT)
    .eq("id", id)
    .maybeSingle();

  let data: Record<string, unknown> | null;

  if (
    primary.error &&
    isMissingCompletedJobCategoriesColumn(primary.error)
  ) {
    const legacy = await supabase
      .from("projects")
      .select(ARENA_PROJECT_SELECT_LEGACY)
      .eq("id", id)
      .maybeSingle();
    if (legacy.error) {
      console.log("MYDEBUG →", legacy.error.message);
      return null;
    }
    data = (legacy.data as Record<string, unknown> | null) ?? null;
  } else if (
    primary.error &&
    isMissingWorkspaceProgressChecklistColumn(primary.error)
  ) {
    const fallback = await supabase
      .from("projects")
      .select(ARENA_PROJECT_SELECT_WITHOUT_WORKSPACE_CHECKLIST)
      .eq("id", id)
      .maybeSingle();
    if (fallback.error) {
      console.log("MYDEBUG →", fallback.error.message);
      return null;
    }
    data = (fallback.data as Record<string, unknown> | null) ?? null;
  } else if (primary.error) {
    console.log("MYDEBUG →", primary.error.message);
    return null;
  } else {
    data = (primary.data as Record<string, unknown> | null) ?? null;
  }

  if (!data) return null;

  const unionMap = await fetchCoveredUnionByProjectIds([id]);
  return mapArenaRow(data, unionMap.get(id) ?? new Set());
}
