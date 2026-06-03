"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { resolveProfessionalJobCategory } from "@/lib/professional-onboarding";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isProjectUuid } from "@/lib/projects-arena";
import {
  addCustomSubtask,
  addCustomTask,
  addCustomTaskList,
  deleteCustomProgressItem,
  mergeChecklistWithTemplates,
  moveTaskInCategory,
  reorderSubtasksInTask,
  setAllLeavesInCategory,
  setLeafCompleted,
  type ProgressCustomItemKind,
} from "@/lib/workspace-progress-checklist";
import { persistWorkspaceProgress } from "@/lib/workspace-progress-sync";
import { normalizeRequiredJobCategoriesFromDb } from "@/lib/skills-match";
import { canAccessWorkspace } from "@/lib/workspace-access";
import {
  WORKSPACE_FILES_BUCKET,
  MAX_WORKSPACE_FILE_BYTES,
  MAX_WORKSPACE_FILE_DESCRIPTION_LENGTH,
  getWorkspaceFileById,
  getWorkspaceMessageById,
  getWorkspaceProjectMeta,
  heartbeatWorkspacePresence,
  postWorkspaceMessage,
  softDeleteWorkspaceFile,
  softDeleteWorkspaceMessage,
  uploadWorkspaceFileRecord,
  upsertWorkspacePresence,
} from "@/lib/workspace";

function workspacePath(projectId: string) {
  return `/idea-arena/${projectId}/workspace`;
}

function revalidateArenaAndWorkspace(projectId: string) {
  revalidatePath("/idea-arena");
  revalidatePath(`/idea-arena/${projectId}`);
  revalidatePath(workspacePath(projectId));
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

async function loadMergedChecklist(projectId: string) {
  const supabase = createServerSupabaseClient();
  const primary = await supabase
    .from("projects")
    .select(
      "required_job_categories, completed_job_categories, workspace_progress_checklist",
    )
    .eq("id", projectId)
    .maybeSingle();

  let row: Record<string, unknown> | null = null;

  if (primary.error && isMissingWorkspaceProgressColumn(primary.error)) {
    const legacy = await supabase
      .from("projects")
      .select("required_job_categories, completed_job_categories")
      .eq("id", projectId)
      .maybeSingle();
    if (legacy.error || !legacy.data) {
      console.log("MYDEBUG →", legacy.error?.message);
      return null;
    }
    row = { ...legacy.data, workspace_progress_checklist: {} } as Record<
      string,
      unknown
    >;
  } else if (primary.error || !primary.data) {
    console.log("MYDEBUG →", primary.error?.message);
    return null;
  } else {
    row = primary.data as Record<string, unknown>;
  }

  const required = normalizeRequiredJobCategoriesFromDb(
    row.required_job_categories,
  );
  const completed = normalizeRequiredJobCategoriesFromDb(
    row.completed_job_categories,
  );
  const merged = mergeChecklistWithTemplates(
    required,
    row.workspace_progress_checklist,
    completed,
  );
  return { required, merged };
}

export async function actionProgressToggleLeaf(
  projectId: string,
  category: ProfessionalJobCategory,
  leafId: string,
  completed: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  const next = setLeafCompleted(loaded.merged, category, leafId, completed);
  if (!next) return { ok: false, error: "Task not found." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

export async function actionProgressAddCustomTaskList(
  projectId: string,
  category: ProfessionalJobCategory,
  title: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  const next = addCustomTaskList(loaded.merged, category, title);
  if (!next) return { ok: false, error: "Could not add task list." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

export async function actionProgressAddCustomTask(
  projectId: string,
  category: ProfessionalJobCategory,
  taskListId: string,
  title: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  const next = addCustomTask(loaded.merged, category, taskListId, title);
  if (!next) return { ok: false, error: "Could not add task." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

export async function actionProgressAddCustomSubtask(
  projectId: string,
  category: ProfessionalJobCategory,
  taskId: string,
  title: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  const next = addCustomSubtask(loaded.merged, category, taskId, title);
  if (!next) return { ok: false, error: "Could not add subtask." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

export async function actionProgressSetCategoryLeaves(
  projectId: string,
  category: ProfessionalJobCategory,
  completed: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  const next = setAllLeavesInCategory(loaded.merged, category, completed);
  if (!next) return { ok: false, error: "Could not update tasks." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

export async function actionProgressMoveTask(
  projectId: string,
  category: ProfessionalJobCategory,
  taskId: string,
  targetTaskListId: string,
  targetIndex: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  if (!Number.isInteger(targetIndex) || targetIndex < 0) {
    return { ok: false, error: "Invalid position." };
  }

  const next = moveTaskInCategory(
    loaded.merged,
    category,
    taskId,
    targetTaskListId,
    targetIndex,
  );
  if (!next) return { ok: false, error: "Could not move task." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

export async function actionProgressReorderSubtasks(
  projectId: string,
  category: ProfessionalJobCategory,
  taskId: string,
  orderedSubtaskIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  if (!Array.isArray(orderedSubtaskIds) || orderedSubtaskIds.length === 0) {
    return { ok: false, error: "Invalid subtask order." };
  }

  const next = reorderSubtasksInTask(
    loaded.merged,
    category,
    taskId,
    orderedSubtaskIds,
  );
  if (!next) return { ok: false, error: "Could not reorder subtasks." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

export async function actionProgressDeleteCustomItem(
  projectId: string,
  category: ProfessionalJobCategory,
  kind: ProgressCustomItemKind,
  itemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(category)) {
    return { ok: false, error: "That category is not part of this project." };
  }

  const next = deleteCustomProgressItem(
    loaded.merged,
    category,
    kind,
    itemId,
  );
  if (!next) return { ok: false, error: "That item cannot be removed." };

  const persist = await persistWorkspaceProgress(projectId, next);
  if (!persist.ok) return persist;

  revalidateArenaAndWorkspace(projectId);
  return { ok: true };
}

function safeStorageFileSegment(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return base || "file";
}

const ALLOWED_UPLOAD_PREFIXES = [
  "image/",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
];
const ALLOWED_UPLOAD_EXACT = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function isAllowedUploadMime(mime: string): boolean {
  const m = mime.toLowerCase().trim();
  if (ALLOWED_UPLOAD_EXACT.has(m)) return true;
  return ALLOWED_UPLOAD_PREFIXES.some((p) => m.startsWith(p));
}

export async function actionPostWorkspaceMessage(
  projectId: string,
  body: string,
  replyToId: string | null,
  jobCategory: string | null,
  isUrgent: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const supabase = createServerSupabaseClient();
  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("required_job_categories")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr || !projectRow) {
    return { ok: false, error: "Project not found." };
  }

  const requiredCategories = normalizeRequiredJobCategoriesFromDb(
    projectRow.required_job_categories,
  );

  const normalizedCategory =
    jobCategory === null || jobCategory === ""
      ? null
      : resolveProfessionalJobCategory(jobCategory);

  if (
    jobCategory !== null &&
    jobCategory !== "" &&
    normalizedCategory === null
  ) {
    return { ok: false, error: "Invalid message board." };
  }

  const boardCategory = normalizedCategory;

  const result = await postWorkspaceMessage(
    projectId,
    userId,
    body,
    replyToId,
    boardCategory,
    isUrgent,
    requiredCategories,
  );
  if (result.ok) {
    revalidatePath(workspacePath(projectId));
  }
  return result;
}

export async function actionDeleteWorkspaceMessage(
  projectId: string,
  messageId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const row = await getWorkspaceMessageById(projectId, messageId);
  if (!row) {
    return { ok: false, error: "Message not found." };
  }
  if (row.deleted_at) {
    return { ok: false, error: "Message is already removed." };
  }

  const meta = await getWorkspaceProjectMeta(projectId);
  if (!meta) {
    return { ok: false, error: "Project not found." };
  }

  const isAuthor = userId === row.author_clerk_user_id;
  const isOwner = userId === meta.clerk_user_id;
  if (!isAuthor && !isOwner) {
    return { ok: false, error: "You can’t remove this message." };
  }

  const result = await softDeleteWorkspaceMessage(projectId, messageId, userId);
  if (!result.ok) return result;

  revalidatePath(workspacePath(projectId));
  return { ok: true };
}

export async function actionUpsertWorkspacePresence(
  projectId: string,
  statusText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const result = await upsertWorkspacePresence(projectId, userId, statusText);
  if (result.ok) {
    revalidatePath(workspacePath(projectId));
  }
  return result;
}

export async function actionWorkspacePresenceHeartbeat(
  projectId: string,
): Promise<void> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) return;
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return;
  await heartbeatWorkspacePresence(projectId, userId);
}

export async function actionUploadWorkspaceFile(
  projectId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "Choose a file to upload." };
  }
  if (file.size > MAX_WORKSPACE_FILE_BYTES) {
    return { ok: false, error: "File is too large (max 25 MB)." };
  }
  const mime = file.type || "application/octet-stream";
  if (!isAllowedUploadMime(mime)) {
    return { ok: false, error: "This file type isn’t allowed." };
  }

  const rawCategory = formData.get("job_category");
  if (typeof rawCategory !== "string" || !rawCategory.trim()) {
    return { ok: false, error: "Choose a skill for this file." };
  }
  const resolved = resolveProfessionalJobCategory(rawCategory.trim());
  if (!resolved) {
    return { ok: false, error: "Invalid skill category." };
  }
  const loaded = await loadMergedChecklist(projectId);
  if (!loaded) return { ok: false, error: "Could not load project." };
  if (!loaded.required.includes(resolved)) {
    return {
      ok: false,
      error: "That category is not part of this project.",
    };
  }
  const jobCategory = resolved;

  const rawDescription = formData.get("description");
  let description: string | null = null;
  if (typeof rawDescription === "string" && rawDescription.trim()) {
    const trimmed = rawDescription.trim();
    if (trimmed.length > MAX_WORKSPACE_FILE_DESCRIPTION_LENGTH) {
      return { ok: false, error: "Description is too long (max 500 characters)." };
    }
    description = trimmed;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = crypto.randomUUID();
  const storagePath = `${projectId}/${fileId}-${safeStorageFileSegment(file.name)}`;

  const supabase = createServerSupabaseClient();
  const { error: upErr } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (upErr) {
    console.log("MYDEBUG →", upErr.message);
    return { ok: false, error: "Could not upload file." };
  }

  const rec = await uploadWorkspaceFileRecord(
    projectId,
    userId,
    storagePath,
    file.name.slice(0, 500),
    mime,
    file.size,
    jobCategory,
    description,
  );

  if (!rec.ok) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([storagePath]);
    return rec;
  }

  revalidatePath(workspacePath(projectId));
  return { ok: true };
}

export async function actionDeleteWorkspaceFile(
  projectId: string,
  fileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const row = await getWorkspaceFileById(projectId, fileId);
  if (!row) {
    return { ok: false, error: "File not found." };
  }
  if (row.deleted_at) {
    return { ok: false, error: "File is already removed." };
  }

  const meta = await getWorkspaceProjectMeta(projectId);
  if (!meta) {
    return { ok: false, error: "Project not found." };
  }

  const isUploader = userId === row.uploaded_by_clerk_user_id;
  const isOwner = userId === meta.clerk_user_id;
  if (!isUploader && !isOwner) {
    return { ok: false, error: "You can’t remove this file." };
  }

  const result = await softDeleteWorkspaceFile(projectId, fileId, userId);
  if (!result.ok) return result;

  revalidatePath(workspacePath(projectId));
  return { ok: true };
}

export async function actionGetWorkspaceFileDownloadUrl(
  projectId: string,
  fileId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const row = await getWorkspaceFileById(projectId, fileId);
  if (!row) {
    return { ok: false, error: "File not found." };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .createSignedUrl(row.storage_path, 120);

  if (error || !data?.signedUrl) {
    console.log("MYDEBUG →", error?.message);
    return { ok: false, error: "Could not create download link." };
  }

  return { ok: true, url: data.signedUrl };
}
