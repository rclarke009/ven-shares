import "server-only";

import { isProjectUuid } from "@/lib/projects-arena";
import { normalizeRequiredJobCategoriesFromDb } from "@/lib/skills-match";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  buildProgressGraph,
  mergeMilestoneState,
  milestoneStateToJson,
  parseWorkspaceProgressDependencies,
  type ProgressGraphView,
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
): Promise<{ milestoneState: ProjectMilestoneState } | null> {
  if (!isProjectUuid(projectId)) return null;

  const supabase = createServerSupabaseClient();
  const { data: row, error } = await supabase
    .from("projects")
    .select("workspace_progress_dependencies")
    .eq("id", projectId)
    .maybeSingle();

  if (error && isMissingDependenciesColumn(error)) {
    return {
      milestoneState: mergeMilestoneState({}, true),
    };
  }

  if (error || !row) {
    console.log("MYDEBUG →", error?.message);
    return null;
  }

  const raw = row.workspace_progress_dependencies;
  const parsed = parseWorkspaceProgressDependencies(raw);
  const hadPersisted = (parsed.milestones?.length ?? 0) > 0;

  const merged = mergeMilestoneState(raw, !hadPersisted);
  const parsedState = mergeMilestoneState(raw, false);

  if (!milestoneStatesEqual(merged, parsedState)) {
    const { error: updateErr } = await supabase
      .from("projects")
      .update({
        workspace_progress_dependencies: milestoneStateToJson(merged),
      })
      .eq("id", projectId);

    if (updateErr && !isMissingDependenciesColumn(updateErr)) {
      console.log("MYDEBUG →", updateErr.message);
    }
  }

  return { milestoneState: merged };
}

export async function buildProgressGraphForProject(
  projectId: string,
): Promise<{
  graph: ProgressGraphView;
  checklist: WorkspaceProgressChecklist;
  milestoneState: ProjectMilestoneState;
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
  const milestoneState =
    depsSync?.milestoneState ?? mergeMilestoneState({}, true);

  const graph = buildProgressGraph(
    progressBundle.checklist,
    milestoneState,
    required,
  );

  return {
    graph,
    checklist: progressBundle.checklist,
    milestoneState,
    required,
  };
}

export async function persistWorkspaceProgressGraphToggle(
  projectId: string,
  checklist: WorkspaceProgressChecklist,
  milestoneState: ProjectMilestoneState,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isProjectUuid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  const checklistPersist = await persistWorkspaceProgress(projectId, checklist);
  if (!checklistPersist.ok) return checklistPersist;

  const supabase = createServerSupabaseClient();
  const { error: depsErr } = await supabase
    .from("projects")
    .update({
      workspace_progress_dependencies: milestoneStateToJson(milestoneState),
    })
    .eq("id", projectId);

  if (depsErr) {
    if (isMissingDependenciesColumn(depsErr)) {
      return { ok: true };
    }
    console.log("MYDEBUG →", depsErr.message);
    return { ok: false, error: "Could not save milestone progress." };
  }

  return { ok: true };
}

export async function loadMergedProgressForToggle(projectId: string) {
  return buildProgressGraphForProject(projectId);
}
