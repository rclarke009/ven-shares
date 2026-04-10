import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isProjectUuid } from "@/lib/projects-arena";
import {
  getProfessionalJobCategoriesFromMetadata,
  intersectProfessionalWithRequiredCategories,
  normalizeRequiredJobCategoriesFromDb,
  professionalCanJoinProject,
} from "@/lib/skills-match";
import {
  getVenRoleForCurrentUser,
  isCurrentUserProfessionalOnboardingComplete,
} from "@/lib/ven-role.server";

export type JoinProjectResult =
  | { ok: true }
  | { ok: false; error: string };

export async function getMembershipForCurrentUser(
  projectId: string,
): Promise<boolean> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) return false;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    console.log("MYDEBUG →", error.message);
    return false;
  }

  return data != null;
}

export async function joinProjectAsProfessional(
  projectId: string,
): Promise<JoinProjectResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }

  const role = await getVenRoleForCurrentUser();
  if (role !== "professional") {
    return { ok: false, error: "Only skilled professionals can join a team." };
  }

  const onboardingOk = await isCurrentUserProfessionalOnboardingComplete();
  if (!onboardingOk) {
    return {
      ok: false,
      error: "Finish your professional profile before joining a team.",
    };
  }

  if (!isProjectUuid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  const supabase = createServerSupabaseClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, clerk_user_id, required_job_categories")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.log("MYDEBUG →", projectError.message);
    return { ok: false, error: "Could not load project. Try again." };
  }

  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  if (project.clerk_user_id === userId) {
    return { ok: false, error: "You can’t join your own project." };
  }

  const required = normalizeRequiredJobCategoriesFromDb(
    project.required_job_categories,
  );
  if (required.length === 0) {
    return {
      ok: false,
      error:
        "This project doesn’t list needed team skills yet. The inventor must add them from the dashboard before professionals can join.",
    };
  }

  const clerkUser = await currentUser();
  const profCategories = getProfessionalJobCategoriesFromMetadata(
    clerkUser?.publicMetadata as Record<string, unknown> | undefined,
  );
  if (!professionalCanJoinProject(profCategories, required)) {
    return {
      ok: false,
      error:
        "None of your job categories match what this team is looking for. Update your professional profile or browse other projects.",
    };
  }

  const covered = intersectProfessionalWithRequiredCategories(
    profCategories,
    required,
  );

  const { error: insertError } = await supabase.from("project_members").insert({
    project_id: projectId,
    clerk_user_id: userId,
    covered_job_categories: covered,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "You’re already on this team." };
    }
    console.log("MYDEBUG →", insertError.message);
    return { ok: false, error: "Could not join team. Try again." };
  }

  return { ok: true };
}
