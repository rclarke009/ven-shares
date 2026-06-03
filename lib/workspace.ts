import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export const WORKSPACE_FILES_BUCKET = "project-workspace-files";

export const MAX_WORKSPACE_MESSAGE_LENGTH = 8000;
export const MAX_WORKSPACE_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_WORKSPACE_FILE_DESCRIPTION_LENGTH = 500;

export type WorkspaceFileRow = {
  id: string;
  project_id: string;
  uploaded_by_clerk_user_id: string;
  storage_path: string;
  filename: string;
  content_type: string | null;
  byte_size: number;
  job_category: string | null;
  description: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by_clerk_user_id: string | null;
};

export type WorkspaceMessageRow = {
  id: string;
  project_id: string;
  author_clerk_user_id: string;
  body: string;
  reply_to_id: string | null;
  job_category: string | null;
  is_urgent: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by_clerk_user_id: string | null;
};

export type WorkspaceActivityRow = {
  id: string;
  project_id: string;
  actor_clerk_user_id: string;
  kind: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type WorkspacePresenceRow = {
  project_id: string;
  clerk_user_id: string;
  status_text: string;
  updated_at: string;
};

export type WorkspaceProjectMeta = {
  id: string;
  title: string;
  clerk_user_id: string;
};

export async function getWorkspaceProjectMeta(
  projectId: string,
): Promise<WorkspaceProjectMeta | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, clerk_user_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    console.log("MYDEBUG →", error.message);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id as string,
    title: data.title as string,
    clerk_user_id: data.clerk_user_id as string,
  };
}

export async function listMemberClerkIdsForProject(
  projectId: string,
): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("clerk_user_id")
    .eq("project_id", projectId);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }
  return (data ?? [])
    .map((r) => r.clerk_user_id as string)
    .filter(Boolean);
}

export async function listWorkspaceFiles(
  projectId: string,
): Promise<WorkspaceFileRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_workspace_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }
  return (data ?? []) as WorkspaceFileRow[];
}

export async function listWorkspaceMessages(
  projectId: string,
  limit = 200,
): Promise<WorkspaceMessageRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_workspace_messages")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    ...(row as WorkspaceMessageRow),
    job_category: (row.job_category as string | null) ?? null,
    is_urgent: Boolean(row.is_urgent),
    deleted_at: (row.deleted_at as string | null) ?? null,
    deleted_by_clerk_user_id:
      (row.deleted_by_clerk_user_id as string | null) ?? null,
  }));
}

export async function getWorkspaceMessageById(
  projectId: string,
  messageId: string,
): Promise<WorkspaceMessageRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_workspace_messages")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", messageId)
    .maybeSingle();

  if (error) {
    console.log("MYDEBUG →", error.message);
    return null;
  }
  if (!data) return null;
  return {
    ...(data as WorkspaceMessageRow),
    job_category: (data.job_category as string | null) ?? null,
    is_urgent: Boolean(data.is_urgent),
    deleted_at: (data.deleted_at as string | null) ?? null,
    deleted_by_clerk_user_id:
      (data.deleted_by_clerk_user_id as string | null) ?? null,
  };
}

export async function listWorkspaceActivities(
  projectId: string,
  limit = 100,
): Promise<WorkspaceActivityRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_workspace_activities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }
  return (data ?? []) as WorkspaceActivityRow[];
}

export async function listWorkspacePresence(
  projectId: string,
): Promise<WorkspacePresenceRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_workspace_presence")
    .select("*")
    .eq("project_id", projectId);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }
  return (data ?? []) as WorkspacePresenceRow[];
}

export async function insertWorkspaceActivity(
  projectId: string,
  actorClerkUserId: string,
  kind: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("project_workspace_activities").insert({
    project_id: projectId,
    actor_clerk_user_id: actorClerkUserId,
    kind,
    payload,
  });
  if (error) console.log("MYDEBUG →", error.message);
}

export async function postWorkspaceMessage(
  projectId: string,
  authorClerkUserId: string,
  body: string,
  replyToId: string | null,
  jobCategory: string | null,
  isUrgent: boolean,
  allowedJobCategories: readonly string[],
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty." };
  }
  if (trimmed.length > MAX_WORKSPACE_MESSAGE_LENGTH) {
    return { ok: false, error: "Message is too long." };
  }

  if (jobCategory !== null && !allowedJobCategories.includes(jobCategory)) {
    return { ok: false, error: "Invalid message board." };
  }

  const supabase = createServerSupabaseClient();

  if (replyToId) {
    const parent = await getWorkspaceMessageById(projectId, replyToId);
    if (!parent || parent.deleted_at) {
      return { ok: false, error: "Reply target not found." };
    }
    const parentCategory = parent.job_category ?? null;
    const boardCategory = jobCategory ?? null;
    if (parentCategory !== boardCategory) {
      return { ok: false, error: "Reply must stay on the same message board." };
    }
  }

  const { data, error } = await supabase
    .from("project_workspace_messages")
    .insert({
      project_id: projectId,
      author_clerk_user_id: authorClerkUserId,
      body: trimmed,
      reply_to_id: replyToId,
      job_category: jobCategory,
      is_urgent: isUrgent,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.log("MYDEBUG →", error?.message);
    return { ok: false, error: "Could not send message." };
  }

  const id = data.id as string;
  await insertWorkspaceActivity(projectId, authorClerkUserId, "message_posted", {
    message_id: id,
    ...(jobCategory ? { job_category: jobCategory } : {}),
    ...(isUrgent ? { is_urgent: true } : {}),
  });
  return { ok: true, id };
}

export async function softDeleteWorkspaceMessage(
  projectId: string,
  messageId: string,
  deletedByClerkUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await getWorkspaceMessageById(projectId, messageId);
  if (!row) {
    return { ok: false, error: "Message not found." };
  }
  if (row.deleted_at) {
    return { ok: false, error: "Message is already removed." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("project_workspace_messages")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_clerk_user_id: deletedByClerkUserId,
    })
    .eq("project_id", projectId)
    .eq("id", messageId)
    .is("deleted_at", null);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return { ok: false, error: "Could not remove message." };
  }

  await insertWorkspaceActivity(
    projectId,
    deletedByClerkUserId,
    "message_deleted",
    {
      message_id: messageId,
      ...(row.job_category ? { job_category: row.job_category } : {}),
    },
  );
  return { ok: true };
}

export async function heartbeatWorkspacePresence(
  projectId: string,
  clerkUserId: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("project_workspace_presence")
    .select("status_text")
    .eq("project_id", projectId)
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  const text =
    typeof existing?.status_text === "string" ? existing.status_text : "";
  const { error } = await supabase.from("project_workspace_presence").upsert(
    {
      project_id: projectId,
      clerk_user_id: clerkUserId,
      status_text: text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,clerk_user_id" },
  );
  if (error) console.log("MYDEBUG →", error.message);
}

export async function upsertWorkspacePresence(
  projectId: string,
  clerkUserId: string,
  statusText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = statusText.trim().slice(0, 200);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("project_workspace_presence").upsert(
    {
      project_id: projectId,
      clerk_user_id: clerkUserId,
      status_text: text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,clerk_user_id" },
  );

  if (error) {
    console.log("MYDEBUG →", error.message);
    return { ok: false, error: "Could not update status." };
  }

  await insertWorkspaceActivity(projectId, clerkUserId, "status_updated", {
    status_text: text,
  });
  return { ok: true };
}

export async function uploadWorkspaceFileRecord(
  projectId: string,
  uploadedByClerkUserId: string,
  storagePath: string,
  filename: string,
  contentType: string | null,
  byteSize: number,
  jobCategory: string,
  description: string | null,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_workspace_files")
    .insert({
      project_id: projectId,
      uploaded_by_clerk_user_id: uploadedByClerkUserId,
      storage_path: storagePath,
      filename,
      content_type: contentType,
      byte_size: byteSize,
      job_category: jobCategory,
      description,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.log("MYDEBUG →", error?.message);
    return { ok: false, error: "Could not save file record." };
  }

  const id = data.id as string;
  await insertWorkspaceActivity(
    projectId,
    uploadedByClerkUserId,
    "file_uploaded",
    {
      file_id: id,
      filename,
      job_category: jobCategory,
      ...(description ? { description } : {}),
    },
  );
  return { ok: true, id };
}

export async function getWorkspaceFileById(
  projectId: string,
  fileId: string,
): Promise<WorkspaceFileRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_workspace_files")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", fileId)
    .maybeSingle();

  if (error) {
    console.log("MYDEBUG →", error.message);
    return null;
  }
  return data as WorkspaceFileRow | null;
}

export async function softDeleteWorkspaceFile(
  projectId: string,
  fileId: string,
  deletedByClerkUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await getWorkspaceFileById(projectId, fileId);
  if (!row) {
    return { ok: false, error: "File not found." };
  }
  if (row.deleted_at) {
    return { ok: false, error: "File is already removed." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("project_workspace_files")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_clerk_user_id: deletedByClerkUserId,
    })
    .eq("project_id", projectId)
    .eq("id", fileId)
    .is("deleted_at", null);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return { ok: false, error: "Could not remove file." };
  }

  await insertWorkspaceActivity(
    projectId,
    deletedByClerkUserId,
    "file_deleted",
    {
      file_id: fileId,
      filename: row.filename,
      ...(row.job_category ? { job_category: row.job_category } : {}),
    },
  );
  return { ok: true };
}
