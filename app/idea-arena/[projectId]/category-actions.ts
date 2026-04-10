"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { isProjectUuid } from "@/lib/projects-arena";
import { normalizeRequiredJobCategoriesFromDb } from "@/lib/skills-match";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getWorkspaceAccessFlags } from "@/lib/workspace-access";

export type SetJobCategoryCompletedState = {
  ok: boolean;
  error: string;
};

export async function setJobCategoryCompleted(
  projectId: string,
  category: ProfessionalJobCategory,
  completed: boolean,
): Promise<SetJobCategoryCompletedState> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!isProjectUuid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  const { canAccess } = await getWorkspaceAccessFlags(projectId, userId);
  if (!canAccess) {
    return {
      ok: false,
      error: "Only the inventor or a team member can update category status.",
    };
  }

  const supabase = createServerSupabaseClient();
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("required_job_categories, completed_job_categories")
    .eq("id", projectId)
    .maybeSingle();

  if (fetchError || !project) {
    console.log("MYDEBUG →", fetchError?.message);
    return { ok: false, error: "Could not load project." };
  }

  const required = normalizeRequiredJobCategoriesFromDb(
    project.required_job_categories,
  );
  if (!required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  const current = normalizeRequiredJobCategoriesFromDb(
    project.completed_job_categories,
  );
  const filtered = current.filter((c) => required.includes(c));
  const nextSet = new Set(filtered);
  if (completed) {
    nextSet.add(category);
  } else {
    nextSet.delete(category);
  }
  const nextOrdered = required.filter((c) => nextSet.has(c));

  const { error: updateErr } = await supabase
    .from("projects")
    .update({ completed_job_categories: nextOrdered })
    .eq("id", projectId);

  if (updateErr) {
    console.log("MYDEBUG →", updateErr.message);
    return { ok: false, error: "Could not update. Try again." };
  }

  revalidatePath("/idea-arena");
  revalidatePath(`/idea-arena/${projectId}`);
  return { ok: true, error: "" };
}
