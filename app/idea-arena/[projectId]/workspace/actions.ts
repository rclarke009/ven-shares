"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isProjectUuid } from "@/lib/projects-arena";
import { canAccessWorkspace } from "@/lib/workspace-access";
import {
  WORKSPACE_FILES_BUCKET,
  MAX_WORKSPACE_FILE_BYTES,
  getWorkspaceFileById,
  heartbeatWorkspacePresence,
  postWorkspaceMessage,
  uploadWorkspaceFileRecord,
  upsertWorkspacePresence,
} from "@/lib/workspace";

function workspacePath(projectId: string) {
  return `/idea-arena/${projectId}/workspace`;
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
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isProjectUuid(projectId)) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canAccessWorkspace(projectId, userId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const result = await postWorkspaceMessage(projectId, userId, body, replyToId);
  if (result.ok) {
    revalidatePath(workspacePath(projectId));
  }
  return result;
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
  );

  if (!rec.ok) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([storagePath]);
    return rec;
  }

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
