import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  getProfessionalJobCategoriesFromMetadata,
  intersectProfessionalWithRequiredCategories,
  normalizeRequiredJobCategoriesFromDb,
} from "@/lib/skills-match";

const ARENA_PROJECT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isArenaProjectUuid(id: string): boolean {
  return ARENA_PROJECT_UUID_RE.test(id);
}

/** PostgREST / Postgres when `project_members.covered_job_categories` is not in the schema. */
export function isMissingCoveredJobCategoriesColumn(error: {
  code?: string;
  message: string;
}): boolean {
  if (!error.message.includes("covered_job_categories")) return false;
  return error.code === "PGRST204" || error.code === "42703";
}

type ProjectMemberPreviewRow = {
  project_id?: unknown;
  clerk_user_id?: unknown;
  covered_job_categories?: unknown;
};

type ProjectMemberDetailRow = {
  clerk_user_id?: unknown;
  covered_job_categories?: unknown;
};

export type ArenaTeamMemberDisplay = {
  clerkUserId: string;
  displayName: string;
  imageUrl: string | null;
  /** Categories this member contributes toward this project (persisted or live fallback). */
  coveredCategories: ProfessionalJobCategory[];
};

export type ArenaCategoryCoverage = {
  category: ProfessionalJobCategory;
  covered: boolean;
  members: ArenaTeamMemberDisplay[];
};

function displayNameFromClerkUser(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  if (user.username) return user.username;
  return "Team member";
}

function normalizeCoveredFromDb(value: unknown): ProfessionalJobCategory[] {
  return normalizeRequiredJobCategoriesFromDb(value);
}

type ClerkUserRecord = NonNullable<
  Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>
>;

function buildArenaTeamMemberDisplay(
  clerkUserId: string,
  coveredRaw: unknown,
  clerkUser: ClerkUserRecord | null,
  requiredCategories: ProfessionalJobCategory[],
): ArenaTeamMemberDisplay {
  const fromDb = normalizeCoveredFromDb(coveredRaw);

  if (clerkUser) {
    const live = getProfessionalJobCategoriesFromMetadata(
      clerkUser.publicMetadata as Record<string, unknown>,
    );
    const coveredCategories =
      fromDb.length > 0
        ? intersectProfessionalWithRequiredCategories(fromDb, requiredCategories)
        : intersectProfessionalWithRequiredCategories(live, requiredCategories);
    return {
      clerkUserId,
      displayName: displayNameFromClerkUser(clerkUser),
      imageUrl: clerkUser.imageUrl?.trim() || null,
      coveredCategories,
    };
  }

  const coveredCategories =
    fromDb.length > 0
      ? intersectProfessionalWithRequiredCategories(fromDb, requiredCategories)
      : [];

  return {
    clerkUserId,
    displayName: "Team member",
    imageUrl: null,
    coveredCategories,
  };
}

/**
 * Batched team roster for Idea Arena list cards. One Supabase query + deduped Clerk lookups.
 */
export async function getArenaTeamPreviewForProjects(
  projects: {
    id: string;
    required_job_categories: ProfessionalJobCategory[];
  }[],
): Promise<Map<string, ArenaTeamMemberDisplay[]>> {
  const out = new Map<string, ArenaTeamMemberDisplay[]>();
  if (projects.length === 0) return out;

  const requiredByProjectId = new Map(
    projects.map((p) => [p.id, p.required_job_categories] as const),
  );
  const projectIds = projects.map((p) => p.id);

  const supabase = createServerSupabaseClient();
  const previewPrimary = await supabase
    .from("project_members")
    .select("project_id, clerk_user_id, covered_job_categories")
    .in("project_id", projectIds);
  let rows: ProjectMemberPreviewRow[] | null =
    previewPrimary.data as ProjectMemberPreviewRow[] | null;
  let error = previewPrimary.error;

  if (error && isMissingCoveredJobCategoriesColumn(error)) {
    const retry = await supabase
      .from("project_members")
      .select("project_id, clerk_user_id")
      .in("project_id", projectIds);
    rows = retry.data as ProjectMemberPreviewRow[] | null;
    error = retry.error;
  }

  if (error) {
    console.log("MYDEBUG →", error.message);
    for (const id of projectIds) out.set(id, []);
    return out;
  }

  const rowsByProject = new Map<
    string,
    { clerk_user_id: string; covered_job_categories: unknown }[]
  >();
  const uniqueClerkIds = new Set<string>();

  for (const row of rows ?? []) {
    const pid = typeof row.project_id === "string" ? row.project_id : "";
    const cid =
      typeof row.clerk_user_id === "string" ? row.clerk_user_id : "";
    if (!pid || !cid) continue;
    uniqueClerkIds.add(cid);
    let list = rowsByProject.get(pid);
    if (!list) {
      list = [];
      rowsByProject.set(pid, list);
    }
    list.push({
      clerk_user_id: cid,
      covered_job_categories: row.covered_job_categories ?? [],
    });
  }

  const client = await clerkClient();
  const clerkById = new Map<string, ClerkUserRecord | null>();
  await Promise.all(
    [...uniqueClerkIds].map(async (id) => {
      try {
        const user = await client.users.getUser(id);
        clerkById.set(id, user);
      } catch {
        console.log("MYDEBUG →", "clerk getUser failed", id);
        clerkById.set(id, null);
      }
    }),
  );

  for (const projectId of projectIds) {
    const required = requiredByProjectId.get(projectId) ?? [];
    const memberRows = rowsByProject.get(projectId) ?? [];
    const members: ArenaTeamMemberDisplay[] = memberRows.map((r) =>
      buildArenaTeamMemberDisplay(
        r.clerk_user_id,
        r.covered_job_categories,
        clerkById.get(r.clerk_user_id) ?? null,
        required,
      ),
    );
    out.set(projectId, members);
  }

  return out;
}

/**
 * Loads project team members with Clerk profile fields and per-category coverage
 * for Idea Arena. Legacy rows with empty `covered_job_categories` use live Clerk metadata.
 */
export async function getArenaTeamDisplay(
  projectId: string,
  requiredCategories: ProfessionalJobCategory[],
): Promise<{
  members: ArenaTeamMemberDisplay[];
  categoryCoverage: ArenaCategoryCoverage[];
}> {
  if (!isArenaProjectUuid(projectId)) {
    return {
      members: [],
      categoryCoverage: requiredCategories.map((category) => ({
        category,
        covered: false,
        members: [],
      })),
    };
  }

  const supabase = createServerSupabaseClient();
  const detailPrimary = await supabase
    .from("project_members")
    .select("clerk_user_id, covered_job_categories")
    .eq("project_id", projectId);
  let rows: ProjectMemberDetailRow[] | null =
    detailPrimary.data as ProjectMemberDetailRow[] | null;
  let error = detailPrimary.error;

  if (error && isMissingCoveredJobCategoriesColumn(error)) {
    const retry = await supabase
      .from("project_members")
      .select("clerk_user_id")
      .eq("project_id", projectId);
    rows = retry.data as ProjectMemberDetailRow[] | null;
    error = retry.error;
  }

  if (error) {
    console.log("MYDEBUG →", error.message);
    return {
      members: [],
      categoryCoverage: requiredCategories.map((category) => ({
        category,
        covered: false,
        members: [],
      })),
    };
  }

  const client = await clerkClient();
  const members: ArenaTeamMemberDisplay[] = [];

  for (const row of rows ?? []) {
    const clerkUserId =
      typeof row.clerk_user_id === "string" ? row.clerk_user_id : "";
    if (!clerkUserId) continue;

    let user: ClerkUserRecord | null = null;
    try {
      user = await client.users.getUser(clerkUserId);
    } catch {
      console.log("MYDEBUG →", "clerk getUser failed", clerkUserId);
    }

    members.push(
      buildArenaTeamMemberDisplay(
        clerkUserId,
        row.covered_job_categories ?? [],
        user,
        requiredCategories,
      ),
    );
  }

  const categoryCoverage: ArenaCategoryCoverage[] = requiredCategories.map(
    (category) => {
      const forCat = members.filter((m) => m.coveredCategories.includes(category));
      return {
        category,
        covered: forCat.length > 0,
        members: forCat,
      };
    },
  );

  return { members, categoryCoverage };
}
