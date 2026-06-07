import "server-only";

import { loadProjectTemplateForProject } from "@/lib/project-templates.server";
import { isProjectUuid } from "@/lib/projects-arena";
import { normalizeRequiredJobCategoriesFromDb } from "@/lib/skills-match";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  buildProgressGraph,
  dependenciesStateToJson,
  mergeMilestoneState,
  parseProjectDependenciesState,
  parseWorkspaceProgressDependencies,
  type NodeDependenciesOverrides,
  type ProgressGraphView,
  type ProjectDependenciesState,
  type ProjectMilestoneState,
} from "@/lib/workspace-progress-graph";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";
import {
  ensureWorkspaceProgressChecklistSynced,
  persistWorkspaceProgress,
} from "@/lib/workspace-progress-sync";

function milestoneStatesEqual(
  a: ProjectMilestoneState,
  b: ProjectMilestoneState,
): boolean {
  if (a.milestones.length !== b.milestones.length) return false;
  return a.milestones.every(
    (m, i) =>
      m.id === b.milestones[i]?.id &&
      m.completed === b.milestones[i]?.completed,
  );
}

function isMissingDependenciesColumn(error: {
  code?: string;
  message: string;
}): boolean {
  return (
    error.code === "42703" &&
    error.message.includes("workspace_progress_dependencies")
  );
}

export async function ensureWorkspaceProgressDependenciesSynced(
  projectId: string,
): Promise<ProjectDependenciesState | null> {
  if (!isProjectUuid(projectId)) return null;

  const supabase = createServerSupabaseClient();
  const { data: row, error } = await supabase
    .from("projects")
    .select("workspace_progress_dependencies")
    .eq("id", projectId)
    .maybeSingle();

  if (error && isMissingDependenciesColumn(error)) {
    return parseProjectDependenciesState({}, true);
  }

  if (error || !row) {
    console.log("MYDEBUG →", error?.message);
    return null;
  }

  const raw = row.workspace_progress_dependencies;
  const parsed = parseWorkspaceProgressDependencies(raw);
  const hadPersisted = (parsed.milestones?.length ?? 0) > 0;

  const merged = parseProjectDependenciesState(raw, !hadPersisted);
  const parsedState = parseProjectDependenciesState(raw, false);

  if (!milestoneStatesEqual(merged.milestoneState, parsedState.milestoneState)) {
    const { error: updateErr } = await supabase
      .from("projects")
      .update({
        workspace_progress_dependencies: dependenciesStateToJson(merged),
      })
      .eq("id", projectId);

    if (updateErr && !isMissingDependenciesColumn(updateErr)) {
      console.log("MYDEBUG →", updateErr.message);
    }
  }

  return merged;
}

export async function buildProgressGraphForProject(
  projectId: string,
): Promise<{
  graph: ProgressGraphView;
  checklist: WorkspaceProgressChecklist;
  milestoneState: ProjectMilestoneState;
  nodeDependencies: NodeDependenciesOverrides;
  required: import("@/lib/professional-onboarding").ProfessionalJobCategory[];
} | null> {
  const progressBundle = await ensureWorkspaceProgressChecklistSynced(projectId);
  if (!progressBundle) return null;

  const supabase = createServerSupabaseClient();
  const { data: row, error } = await supabase
    .from("projects")
    .select("required_job_categories, workspace_progress_dependencies")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !row) {
    console.log("MYDEBUG →", error?.message);
    return null;
  }

  const required = normalizeRequiredJobCategoriesFromDb(
    row.required_job_categories,
  );

  const depsSync = await ensureWorkspaceProgressDependenciesSynced(projectId);
  const depsState =
    depsSync ?? parseProjectDependenciesState({}, true);
  const { milestoneState, nodeDependencies } = depsState;

  const templateBundle = await loadProjectTemplateForProject(projectId);
  const templateBaseOverrides =
    templateBundle?.dependencyOverrides?.nodeDependencies;

  const graph = buildProgressGraph(
    progressBundle.checklist,
    milestoneState,
    required,
    nodeDependencies,
    templateBaseOverrides,
  );

  return {
    graph,
    checklist: progressBundle.checklist,
    milestoneState,
    nodeDependencies,
    required,
  };
}

export async function persistWorkspaceProgressGraphToggle(
  projectId: string,
  checklist: WorkspaceProgressChecklist,
  milestoneState: ProjectMilestoneState,
  nodeDependencies: NodeDependenciesOverrides = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isProjectUuid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  const checklistPersist = await persistWorkspaceProgress(projectId, checklist);
  if (!checklistPersist.ok) return checklistPersist;

  return persistNodeDependencies(projectId, milestoneState, nodeDependencies);
}

export async function persistNodeDependencies(
  projectId: string,
  milestoneState: ProjectMilestoneState,
  nodeDependencies: NodeDependenciesOverrides,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isProjectUuid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  const supabase = createServerSupabaseClient();
  const { error: depsErr } = await supabase
    .from("projects")
    .update({
      workspace_progress_dependencies: dependenciesStateToJson({
        milestoneState,
        nodeDependencies,
      }),
    })
    .eq("id", projectId);

  if (depsErr) {
    if (isMissingDependenciesColumn(depsErr)) {
      return { ok: true };
    }
    console.log("MYDEBUG →", depsErr.message);
    return { ok: false, error: "Could not save progress dependencies." };
  }

  return { ok: true };
}

export async function loadMergedProgressForToggle(projectId: string) {
  return buildProgressGraphForProject(projectId);
}
