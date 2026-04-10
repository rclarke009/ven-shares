import "server-only";

import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isProjectUuid } from "@/lib/projects-arena";

export type WorkspaceAccessFlags = {
  canAccess: boolean;
  isOwner: boolean;
};

export async function getWorkspaceAccessFlags(
  projectId: string,
  userId: string,
): Promise<WorkspaceAccessFlags> {
  if (!isProjectUuid(projectId)) {
    return { canAccess: false, isOwner: false };
  }

  const supabase = createServerSupabaseClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, clerk_user_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.log("MYDEBUG →", projectError.message);
    return { canAccess: false, isOwner: false };
  }
  if (!project) return { canAccess: false, isOwner: false };

  const isOwner = project.clerk_user_id === userId;
  if (isOwner) return { canAccess: true, isOwner: true };

  const { data: member, error: memberError } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (memberError) {
    console.log("MYDEBUG →", memberError.message);
    return { canAccess: false, isOwner: false };
  }
  return { canAccess: member != null, isOwner: false };
}

export async function canAccessWorkspace(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const { canAccess } = await getWorkspaceAccessFlags(projectId, userId);
  return canAccess;
}

/** Call from Server Components / actions after auth; throws notFound when denied. */
export async function assertWorkspaceAccess(projectId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) notFound();
  const ok = await canAccessWorkspace(projectId, userId);
  if (!ok) notFound();
  return userId;
}
