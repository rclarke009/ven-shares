import "server-only";

import { listProjectsForCurrentUser } from "@/app/dashboard/projects/actions";
import { listJoinedProjectsForCurrentUser } from "@/lib/project-members";
import {
  isCurrentUserInventor,
  isCurrentUserProfessional,
} from "@/lib/ven-role.server";

export type WorkspacePickerProject = {
  id: string;
  title: string;
  representative_image_path: string | null;
  relation: "owner" | "member";
};

export async function loadWorkspaceProjectPickerForUser(
  userId: string,
): Promise<{
  owned: WorkspacePickerProject[];
  joined: WorkspacePickerProject[];
}> {
  void userId;

  const hasInventor = await isCurrentUserInventor();
  const hasProfessional = await isCurrentUserProfessional();

  const ownedProjects = hasInventor ? await listProjectsForCurrentUser() : [];
  const joinedProjects = hasProfessional
    ? await listJoinedProjectsForCurrentUser()
    : [];

  const owned: WorkspacePickerProject[] = ownedProjects.map((p) => ({
    id: p.id,
    title: p.title,
    representative_image_path: p.representative_image_path,
    relation: "owner" as const,
  }));

  const ownedIds = new Set(owned.map((p) => p.id));
  const joined: WorkspacePickerProject[] = joinedProjects
    .filter((p) => !ownedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      representative_image_path: p.representative_image_path,
      relation: "member" as const,
    }));

  return { owned, joined };
}
