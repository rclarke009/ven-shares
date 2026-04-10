import "server-only";

import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { isProjectUuid } from "@/lib/projects-arena";
import { normalizeRequiredJobCategoriesFromDb } from "@/lib/skills-match";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import {
  type WorkspaceProgressChecklist,
  checklistsEqual,
  completedCategoriesFromChecklist,
  mergeChecklistWithTemplates,
  parseWorkspaceProgressChecklist,
} from "@/lib/workspace-progress-checklist";

function sameOrdered(
  a: ProfessionalJobCategory[],
  b: ProfessionalJobCategory[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x === b[i]);
}

function isMissingWorkspaceProgressColumn(error: {
  code?: string;
  message: string;
}): boolean {
  return (
    error.code === "42703" &&
    error.message.includes("workspace_progress_checklist")
  );
}

/**
 * Merges standard templates + legacy seeding, persists when the merged checklist
 * or derived `completed_job_categories` differs from the database.
 */
export async function ensureWorkspaceProgressChecklistSynced(
  projectId: string,
): Promise<{ checklist: WorkspaceProgressChecklist } | null> {
  if (!isProjectUuid(projectId)) return null;

  const supabase = createServerSupabaseClient();
  const primary = await supabase
    .from("projects")
    .select(
      "required_job_categories, completed_job_categories, workspace_progress_checklist",
    )
    .eq("id", projectId)
    .maybeSingle();

  let row: Record<string, unknown> | null = null;
  let rawChecklistUnknown: unknown = {};
  let checklistColumnAvailable = true;

  if (primary.error && isMissingWorkspaceProgressColumn(primary.error)) {
    checklistColumnAvailable = false;
    const legacy = await supabase
      .from("projects")
      .select("required_job_categories, completed_job_categories")
      .eq("id", projectId)
      .maybeSingle();
    if (legacy.error || !legacy.data) {
      console.log("MYDEBUG →", legacy.error?.message);
      return null;
    }
    row = legacy.data as Record<string, unknown>;
    rawChecklistUnknown = {};
  } else if (primary.error) {
    console.log("MYDEBUG →", primary.error.message);
    return null;
  } else {
    row = (primary.data as Record<string, unknown> | null) ?? null;
    rawChecklistUnknown =
      row?.workspace_progress_checklist !== undefined
        ? row.workspace_progress_checklist
        : {};
  }

  if (!row) return null;

  const required = normalizeRequiredJobCategoriesFromDb(
    row.required_job_categories,
  );
  const completedDb = normalizeRequiredJobCategoriesFromDb(
    row.completed_job_categories,
  );

  const merged = mergeChecklistWithTemplates(
    required,
    rawChecklistUnknown,
    completedDb,
  );
  const computed = completedCategoriesFromChecklist(required, merged);
  const rawParsed = parseWorkspaceProgressChecklist(rawChecklistUnknown);

  const needWrite =
    !checklistsEqual(merged, rawParsed) || !sameOrdered(computed, completedDb);

  if (needWrite) {
    const payload: Record<string, unknown> = checklistColumnAvailable
      ? {
          completed_job_categories: computed,
          workspace_progress_checklist: merged,
        }
      : { completed_job_categories: computed };
    const { error: updateErr } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", projectId);

    if (updateErr) {
      console.log("MYDEBUG →", updateErr.message);
    }
  }

  return { checklist: merged };
}

export async function persistWorkspaceProgress(
  projectId: string,
  checklist: WorkspaceProgressChecklist,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isProjectUuid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }

  const supabase = createServerSupabaseClient();
  const { data: row, error: fetchErr } = await supabase
    .from("projects")
    .select("required_job_categories")
    .eq("id", projectId)
    .maybeSingle();

  if (fetchErr || !row) {
    console.log("MYDEBUG →", fetchErr?.message);
    return { ok: false, error: "Could not load project." };
  }

  const required = normalizeRequiredJobCategoriesFromDb(
    row.required_job_categories,
  );
  const computed = completedCategoriesFromChecklist(required, checklist);

  const { error: updateErr } = await supabase
    .from("projects")
    .update({
      workspace_progress_checklist: checklist,
      completed_job_categories: computed,
    })
    .eq("id", projectId);

  if (updateErr) {
    if (isMissingWorkspaceProgressColumn(updateErr)) {
      const { error: fallbackErr } = await supabase
        .from("projects")
        .update({ completed_job_categories: computed })
        .eq("id", projectId);
      if (fallbackErr) {
        console.log("MYDEBUG →", fallbackErr.message);
        return { ok: false, error: "Could not save progress." };
      }
      return { ok: true };
    }
    console.log("MYDEBUG →", updateErr.message);
    return { ok: false, error: "Could not save progress." };
  }

  return { ok: true };
}
