"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
  parseRequiredSkillsFromFormData,
  type ParsedRequiredSkill,
  type ProjectRequiredSkill,
} from "@/lib/project-required-skills";
import { readRepresentativeImageFromFormData } from "@/lib/representative-image-upload";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { normalizeProfessionalJobCategories } from "@/lib/professional-onboarding";
import { isProjectUuid } from "@/lib/projects-arena";
import { normalizeRequiredJobCategoriesFromDb } from "@/lib/skills-match";
import {
  completedCategoriesFromChecklist,
  mergeChecklistWithTemplates,
  parseWorkspaceProgressChecklist,
  trimChecklistToRequired,
} from "@/lib/workspace-progress-checklist";
import { getVenRoleForCurrentUser } from "@/lib/ven-role.server";

import type { RepresentativeImageOk } from "@/lib/representative-image-upload";

const STORAGE_BUCKET = "project-images";

export type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  clerk_user_id: string;
  required_job_categories: string[];
  representative_image_path: string | null;
  project_required_skills: ProjectRequiredSkill[];
  created_at: string;
};

export type CreateProjectState = {
  ok: boolean;
  error: string;
};

export type UpdateProjectMediaState = {
  ok: boolean;
  error: string;
};

function normalizeSkillRows(
  raw: unknown,
): ProjectRequiredSkill[] {
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
    out.push({
      skill_name: name,
      skill_description: desc,
      sort_order: sort,
    });
  }
  return out.sort((a, b) => a.sort_order - b.sort_order);
}

async function uploadRepresentativeImage(
  projectId: string,
  image: Extract<RepresentativeImageOk, { skip: false }>,
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const supabase = createServerSupabaseClient();
  const path = `${projectId}/${image.fileName}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, image.buffer, {
    contentType: image.contentType,
    upsert: true,
  });
  if (error) {
    console.log("MYDEBUG →", error.message);
    return { ok: false, message: "Could not upload image. Try again." };
  }
  return { ok: true, path };
}

async function insertSkills(
  projectId: string,
  skills: ParsedRequiredSkill[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (skills.length === 0) return { ok: true };
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("project_required_skills").insert(
    skills.map((s) => ({
      project_id: projectId,
      skill_name: s.skill_name,
      skill_description: s.skill_description,
      sort_order: s.sort_order,
    })),
  );
  if (error) {
    console.log("MYDEBUG →", error.message);
    return { ok: false, message: "Could not save skills. Try again." };
  }
  return { ok: true };
}

async function replaceSkillsForProject(
  projectId: string,
  skills: ParsedRequiredSkill[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createServerSupabaseClient();
  const { error: delError } = await supabase
    .from("project_required_skills")
    .delete()
    .eq("project_id", projectId);
  if (delError) {
    console.log("MYDEBUG →", delError.message);
    return { ok: false, message: "Could not update skills. Try again." };
  }
  return insertSkills(projectId, skills);
}

export async function listProjectsForCurrentUser(): Promise<ProjectRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const venRole = await getVenRoleForCurrentUser();
  if (venRole !== "inventor") return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      clerk_user_id,
      required_job_categories,
      representative_image_path,
      created_at,
      project_required_skills ( skill_name, skill_description, sort_order )
    `,
    )
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const cats = r.required_job_categories;
    return {
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string | null) ?? null,
      clerk_user_id: r.clerk_user_id as string,
      required_job_categories: Array.isArray(cats)
        ? cats.filter((x): x is string => typeof x === "string")
        : [],
      representative_image_path:
        typeof r.representative_image_path === "string"
          ? r.representative_image_path
          : null,
      project_required_skills: normalizeSkillRows(r.project_required_skills),
      created_at: r.created_at as string,
    };
  });
}

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }

  const venRole = await getVenRoleForCurrentUser();
  if (venRole !== "inventor") {
    return { ok: false, error: "Only inventors can add projects." };
  }

  const title = (formData.get("title") as string)?.trim() ?? "";
  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  const descriptionRaw = (formData.get("description") as string)?.trim();
  const description = descriptionRaw ? descriptionRaw : null;

  const selected = formData.getAll("categories").filter(
    (v): v is string => typeof v === "string",
  );
  const required_job_categories = normalizeProfessionalJobCategories(selected);
  if (required_job_categories.length === 0) {
    return {
      ok: false,
      error: "Choose at least one team skill needed (up to five).",
    };
  }

  const imageRead = await readRepresentativeImageFromFormData(formData);
  if (!imageRead.ok) {
    return { ok: false, error: imageRead.error };
  }

  const skillsParse = parseRequiredSkillsFromFormData(formData);
  if (!skillsParse.ok) {
    return { ok: false, error: skillsParse.error };
  }

  const supabase = createServerSupabaseClient();
  const { data: inserted, error: insertError } = await supabase
    .from("projects")
    .insert({
      title,
      description,
      clerk_user_id: userId,
      required_job_categories,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    console.log("MYDEBUG →", insertError?.message);
    return { ok: false, error: "Could not save project. Try again." };
  }

  const projectId = inserted.id as string;

  let imagePath: string | null = null;
  if (!imageRead.skip) {
    const up = await uploadRepresentativeImage(projectId, imageRead);
    if (!up.ok) {
      await supabase.from("projects").delete().eq("id", projectId);
      return { ok: false, error: up.message };
    }
    imagePath = up.path;
    const { error: pathErr } = await supabase
      .from("projects")
      .update({ representative_image_path: imagePath })
      .eq("id", projectId);
    if (pathErr) {
      console.log("MYDEBUG →", pathErr.message);
      await supabase.from("projects").delete().eq("id", projectId);
      return { ok: false, error: "Could not save project. Try again." };
    }
  }

  const skillsOk = await insertSkills(projectId, skillsParse.skills);
  if (!skillsOk.ok) {
    await supabase.from("projects").delete().eq("id", projectId);
    return { ok: false, error: skillsOk.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/idea-arena");
  return { ok: true, error: "" };
}

export async function updateProjectWithMediaAndSkills(
  _prev: UpdateProjectMediaState,
  formData: FormData,
): Promise<UpdateProjectMediaState> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }

  const venRole = await getVenRoleForCurrentUser();
  if (venRole !== "inventor") {
    return { ok: false, error: "Only inventors can update projects." };
  }

  const projectId = (formData.get("projectId") as string)?.trim() ?? "";
  if (!isProjectUuid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  const title = (formData.get("title") as string)?.trim() ?? "";
  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  const descriptionRaw = (formData.get("description") as string)?.trim();
  const description = descriptionRaw ? descriptionRaw : null;

  const selected = formData.getAll("categories").filter(
    (v): v is string => typeof v === "string",
  );
  const required_job_categories = normalizeProfessionalJobCategories(selected);
  if (required_job_categories.length === 0) {
    return {
      ok: false,
      error: "Choose at least one team skill needed (up to five).",
    };
  }

  const imageRead = await readRepresentativeImageFromFormData(formData);
  if (!imageRead.ok) {
    return { ok: false, error: imageRead.error };
  }

  const skillsParse = parseRequiredSkillsFromFormData(formData);
  if (!skillsParse.ok) {
    return { ok: false, error: skillsParse.error };
  }

  const supabase = createServerSupabaseClient();

  function isMissingWorkspaceProgressColumn(error: {
    code?: string;
    message: string;
  }): boolean {
    return (
      error.code === "42703" &&
      error.message.includes("workspace_progress_checklist")
    );
  }

  const primary = await supabase
    .from("projects")
    .select("id, completed_job_categories, workspace_progress_checklist")
    .eq("id", projectId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  let row: Record<string, unknown> | null = null;
  let checklistColumnAvailable = true;

  if (primary.error && isMissingWorkspaceProgressColumn(primary.error)) {
    checklistColumnAvailable = false;
    const legacy = await supabase
      .from("projects")
      .select("id, completed_job_categories")
      .eq("id", projectId)
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (legacy.error) {
      console.log("MYDEBUG →", legacy.error.message);
      return { ok: false, error: "Could not update project. Try again." };
    }
    row = (legacy.data as Record<string, unknown> | null) ?? null;
  } else if (primary.error) {
    console.log("MYDEBUG →", primary.error.message);
    return { ok: false, error: "Could not update project. Try again." };
  } else {
    row = (primary.data as Record<string, unknown> | null) ?? null;
  }

  if (!row) {
    return { ok: false, error: "Project not found." };
  }

  const prevCompleted = normalizeRequiredJobCategoriesFromDb(
    row.completed_job_categories,
  );
  const requiredSet = new Set(required_job_categories);
  const completedIntersect = prevCompleted.filter((c) =>
    requiredSet.has(c),
  );

  let completed_job_categories = completedIntersect;
  let workspace_progress_checklist: Record<string, unknown> | undefined;

  if (checklistColumnAvailable) {
    const trimmed = trimChecklistToRequired(
      parseWorkspaceProgressChecklist(row.workspace_progress_checklist),
      required_job_categories,
    );
    const merged = mergeChecklistWithTemplates(
      required_job_categories,
      trimmed,
      completedIntersect,
    );
    completed_job_categories = completedCategoriesFromChecklist(
      required_job_categories,
      merged,
    );
    workspace_progress_checklist = merged as unknown as Record<string, unknown>;
  }

  const updatePayload: Record<string, unknown> = {
    title,
    description,
    required_job_categories,
    completed_job_categories,
  };
  if (workspace_progress_checklist !== undefined) {
    updatePayload.workspace_progress_checklist = workspace_progress_checklist;
  }

  const { error: updateErr } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", projectId)
    .eq("clerk_user_id", userId);

  if (updateErr) {
    console.log("MYDEBUG →", updateErr.message);
    return { ok: false, error: "Could not update project. Try again." };
  }

  if (!imageRead.skip) {
    const up = await uploadRepresentativeImage(projectId, imageRead);
    if (!up.ok) {
      return { ok: false, error: up.message };
    }
    const { error: pathErr } = await supabase
      .from("projects")
      .update({ representative_image_path: up.path })
      .eq("id", projectId)
      .eq("clerk_user_id", userId);
    if (pathErr) {
      console.log("MYDEBUG →", pathErr.message);
      return { ok: false, error: "Could not save image. Try again." };
    }
  }

  const skillsOk = await replaceSkillsForProject(projectId, skillsParse.skills);
  if (!skillsOk.ok) {
    return { ok: false, error: skillsOk.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/idea-arena");
  revalidatePath(`/idea-arena/${projectId}`);
  return { ok: true, error: "" };
}
