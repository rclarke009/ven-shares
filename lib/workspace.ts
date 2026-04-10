import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export const WORKSPACE_FILES_BUCKET = "project-workspace-files";

export const MAX_WORKSPACE_MESSAGE_LENGTH = 8000;
export const MAX_WORKSPACE_FILE_BYTES = 25 * 1024 * 1024;

export type WorkspaceFileRow = {
  id: string;
  project_id: string;
  uploaded_by_clerk_user_id: string;
  storage_path: string;
  filename: string;
  content_type: string | null;
  byte_size: number;
  created_at: string;
};

export type WorkspaceMessageRow = {
  id: string;
  project_id: string;
  author_clerk_user_id: string;
  body: string;
  reply_to_id: string | null;
  created_at: string;
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
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }
  return (data ?? []) as WorkspaceMessageRow[];
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
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty." };
  }
  if (trimmed.length > MAX_WORKSPACE_MESSAGE_LENGTH) {
    return { ok: false, error: "Message is too long." };
  }

  const supabase = createServerSupabaseClient();

  if (replyToId) {
    const { data: parent } = await supabase
      .from("project_workspace_messages")
      .select("id")
      .eq("project_id", projectId)
      .eq("id", replyToId)
      .maybeSingle();
    if (!parent) {
      return { ok: false, error: "Reply target not found." };
    }
  }

  const { data, error } = await supabase
    .from("project_workspace_messages")
    .insert({
      project_id: projectId,
      author_clerk_user_id: authorClerkUserId,
      body: trimmed,
      reply_to_id: replyToId,
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
  });
  return { ok: true, id };
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
    { file_id: id, filename },
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
