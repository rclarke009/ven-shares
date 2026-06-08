import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import type { WorkspaceFileDTO } from "@/components/workspace/workspace-shell";
import type {
  ArenaCategoryCoverage,
  ArenaTeamMemberDisplay,
} from "@/lib/arena-team-display";
import {
  getArenaTeamDisplay,
  resolveViewerCoveredCategories,
} from "@/lib/arena-team";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import type { ArenaCategorySlot } from "@/lib/projects-arena";
import { getProjectByIdForArena, isProjectUuid } from "@/lib/projects-arena";
import { getProfessionalJobCategoriesFromMetadata } from "@/lib/skills-match";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { resolveClerkDisplayNames } from "@/lib/workspace-display-names";
import { ensureWorkspaceProgressChecklistSynced } from "@/lib/workspace-progress-sync";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";
import {
  buildProgressGraphForProject,
} from "@/lib/workspace-progress-dependencies-sync";
import type {
  NodeDependenciesOverrides,
  ProgressGraphView,
  ProjectMilestoneState,
} from "@/lib/workspace-progress-graph";
import {
  getWorkspaceProjectMeta,
  listMemberClerkIdsForProject,
  listWorkspaceFiles,
} from "@/lib/workspace";

export type WorkspaceOrganizerBundle = {
  projectId: string;
  projectTitle: string;
  createdAt: string;
  checklist: WorkspaceProgressChecklist;
  progressGraph: ProgressGraphView;
  milestoneState: ProjectMilestoneState;
  nodeDependencies: NodeDependenciesOverrides;
  categoryStatuses: ArenaCategorySlot[];
  categoryCoverage: ArenaCategoryCoverage[];
  arenaTeamMembers: ArenaTeamMemberDisplay[];
  files: WorkspaceFileDTO[];
  nameMap: Record<string, string>;
  viewerCoveredCategories: ProfessionalJobCategory[];
};

type LoadOptions = {
  /** When true, only the project owner may load (inventor dashboard). */
  ownerOnly?: boolean;
  /** When true, require owner or team membership via workspace access. */
  requireAccess?: boolean;
};

/**
 * Data required to render WorkspaceOrganizerPanel (workspace Organizer tab or dashboard card).
 */
export async function loadWorkspaceOrganizerBundle(
  projectId: string,
  userId: string,
  options: LoadOptions = {},
): Promise<WorkspaceOrganizerBundle | null> {
  if (!isProjectUuid(projectId)) return null;

  const meta = await getWorkspaceProjectMeta(projectId);
  if (!meta) return null;

  if (options.ownerOnly) {
    if (meta.clerk_user_id !== userId) return null;
  } else if (options.requireAccess) {
    if (!(await canAccessWorkspace(projectId, userId))) return null;
  }

  const progressBundle = await ensureWorkspaceProgressChecklistSynced(projectId);
  if (!progressBundle) return null;

  const graphBundle = await buildProgressGraphForProject(projectId);
  if (!graphBundle) return null;

  const arenaProject = await getProjectByIdForArena(projectId);
  if (!arenaProject) return null;

  const { members, categoryCoverage } = await getArenaTeamDisplay(
    projectId,
    arenaProject.required_job_categories,
  );

  const clerkUser = await currentUser();
  const profileSkills = getProfessionalJobCategoriesFromMetadata(
    clerkUser?.publicMetadata as Record<string, unknown>,
  );
  const viewerCoveredCategories = resolveViewerCoveredCategories(
    userId,
    members,
    arenaProject.required_job_categories,
    profileSkills,
  );

  const [files, memberIds] = await Promise.all([
    listWorkspaceFiles(projectId),
    listMemberClerkIdsForProject(projectId),
  ]);

  const allIds = new Set<string>();
  allIds.add(meta.clerk_user_id);
  for (const id of memberIds) allIds.add(id);
  for (const m of members) allIds.add(m.clerkUserId);
  for (const f of files) {
    allIds.add(f.uploaded_by_clerk_user_id);
    if (f.deleted_by_clerk_user_id) allIds.add(f.deleted_by_clerk_user_id);
  }

  const nameMapRecord = Object.fromEntries(
    (await resolveClerkDisplayNames([...allIds])).entries(),
  );

  const filesDto: WorkspaceFileDTO[] = files.map((f) => ({
    id: f.id,
    uploaded_by_clerk_user_id: f.uploaded_by_clerk_user_id,
    filename: f.filename,
    content_type: f.content_type,
    byte_size: Number(f.byte_size),
    job_category: f.job_category ?? null,
    description: f.description ?? null,
    created_at: f.created_at,
    deleted_at: f.deleted_at ?? null,
    deleted_by_clerk_user_id: f.deleted_by_clerk_user_id ?? null,
  }));

  return {
    projectId,
    projectTitle: meta.title,
    createdAt: arenaProject.created_at,
    checklist: progressBundle.checklist,
    progressGraph: graphBundle.graph,
    milestoneState: graphBundle.milestoneState,
    nodeDependencies: graphBundle.nodeDependencies,
    categoryStatuses: arenaProject.category_statuses,
    categoryCoverage,
    arenaTeamMembers: members,
    files: filesDto,
    nameMap: nameMapRecord,
    viewerCoveredCategories,
  };
}

export async function loadWorkspaceOrganizerBundlesForOwner(
  projectIds: string[],
  userId: string,
): Promise<WorkspaceOrganizerBundle[]> {
  const results = await Promise.all(
    projectIds.map((id) =>
      loadWorkspaceOrganizerBundle(id, userId, { ownerOnly: true }),
    ),
  );
  return results.filter((b): b is WorkspaceOrganizerBundle => b !== null);
}

export async function loadWorkspaceOrganizerBundlesForMember(
  projectIds: string[],
  userId: string,
): Promise<WorkspaceOrganizerBundle[]> {
  const results = await Promise.all(
    projectIds.map((id) =>
      loadWorkspaceOrganizerBundle(id, userId, { requireAccess: true }),
    ),
  );
  return results.filter((b): b is WorkspaceOrganizerBundle => b !== null);
}
