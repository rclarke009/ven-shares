import "server-only";

import { auth } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

import type { ProjectRequiredSkill } from "@/lib/project-required-skills";

/** Public fields for Idea Arena UI (no clerk_user_id). */
export type ArenaProject = {
  id: string;
  title: string;
  description: string | null;
  required_job_categories: string[];
  representative_image_path: string | null;
  project_required_skills: ProjectRequiredSkill[];
  created_at: string;
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

function mapArenaRow(row: Record<string, unknown>): ArenaProject {
  const cats = row.required_job_categories;
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    required_job_categories: Array.isArray(cats)
      ? cats.filter((x): x is string => typeof x === "string")
      : [],
    representative_image_path:
      typeof row.representative_image_path === "string"
        ? row.representative_image_path
        : null,
    project_required_skills: normalizeSkillRows(row.project_required_skills),
    created_at: row.created_at as string,
  };
}

export async function listProjectsForArena(): Promise<ArenaProject[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      required_job_categories,
      representative_image_path,
      created_at,
      project_required_skills ( skill_name, skill_description, sort_order )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapArenaRow(row as Record<string, unknown>));
}

export async function getProjectByIdForArena(
  id: string,
): Promise<ArenaProject | null> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(id)) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      required_job_categories,
      representative_image_path,
      created_at,
      project_required_skills ( skill_name, skill_description, sort_order )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.log("MYDEBUG →", error.message);
    return null;
  }

  if (!data) return null;

  return mapArenaRow(data as Record<string, unknown>);
}
