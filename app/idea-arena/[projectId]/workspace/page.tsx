import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ArenaHeader } from "@/components/idea-arena/arena-header";
import {
  WorkspaceShell,
  type WorkspaceActivityDTO,
  type WorkspaceFileDTO,
  type WorkspaceMessageDTO,
  type WorkspaceRosterEntryDTO,
} from "@/components/workspace/workspace-shell";
import { assertWorkspaceAccess } from "@/lib/workspace-access";
import { resolveClerkDisplayNames } from "@/lib/workspace-display-names";
import { isProjectUuid } from "@/lib/projects-arena";
import {
  getWorkspaceProjectMeta,
  listMemberClerkIdsForProject,
  listWorkspaceActivities,
  listWorkspaceFiles,
  listWorkspaceMessages,
  listWorkspacePresence,
} from "@/lib/workspace";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string; m?: string }>;
};

function WorkspaceFallback() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#e8eef5] text-slate-600 text-sm">
      Loading workspace…
    </div>
  );
}

async function WorkspacePageContent({
  projectId,
  tab,
  messageId,
}: {
  projectId: string;
  tab: string | undefined;
  messageId: string | undefined;
}) {
  const userId = await assertWorkspaceAccess(projectId);

  const meta = await getWorkspaceProjectMeta(projectId);
  if (!meta) notFound();

  const [files, messages, activities, presence, memberIds] = await Promise.all([
    listWorkspaceFiles(projectId),
    listWorkspaceMessages(projectId),
    listWorkspaceActivities(projectId),
    listWorkspacePresence(projectId),
    listMemberClerkIdsForProject(projectId),
  ]);

  const allIds = new Set<string>();
  allIds.add(meta.clerk_user_id);
  for (const id of memberIds) allIds.add(id);
  for (const m of messages) allIds.add(m.author_clerk_user_id);
  for (const a of activities) allIds.add(a.actor_clerk_user_id);
  for (const f of files) allIds.add(f.uploaded_by_clerk_user_id);
  for (const p of presence) allIds.add(p.clerk_user_id);

  const nameMapRecord = Object.fromEntries(
    (await resolveClerkDisplayNames([...allIds])).entries(),
  );

  const presenceByUser = new Map(
    presence.map((p) => [
      p.clerk_user_id,
      { status_text: p.status_text, updated_at: p.updated_at },
    ]),
  );

  const roster: WorkspaceRosterEntryDTO[] = [];
  const ownerPresence = presenceByUser.get(meta.clerk_user_id);
  roster.push({
    clerk_user_id: meta.clerk_user_id,
    display_name:
      nameMapRecord[meta.clerk_user_id] ?? "Project owner",
    role: "owner",
    status_text: ownerPresence?.status_text ?? "",
    updated_at: ownerPresence?.updated_at ?? null,
  });

  for (const mid of memberIds) {
    if (mid === meta.clerk_user_id) continue;
    const pr = presenceByUser.get(mid);
    roster.push({
      clerk_user_id: mid,
      display_name: nameMapRecord[mid] ?? "Team member",
      role: "member",
      status_text: pr?.status_text ?? "",
      updated_at: pr?.updated_at ?? null,
    });
  }

  const messagesDto: WorkspaceMessageDTO[] = messages.map((m) => ({
    id: m.id,
    author_clerk_user_id: m.author_clerk_user_id,
    body: m.body,
    reply_to_id: m.reply_to_id,
    created_at: m.created_at,
  }));

  const filesDto: WorkspaceFileDTO[] = files.map((f) => ({
    id: f.id,
    uploaded_by_clerk_user_id: f.uploaded_by_clerk_user_id,
    filename: f.filename,
    content_type: f.content_type,
    byte_size: Number(f.byte_size),
    created_at: f.created_at,
  }));

  const activitiesDto: WorkspaceActivityDTO[] = activities.map((a) => ({
    id: a.id,
    actor_clerk_user_id: a.actor_clerk_user_id,
    kind: a.kind,
    payload:
      a.payload &&
      typeof a.payload === "object" &&
      !Array.isArray(a.payload)
        ? (a.payload as Record<string, unknown>)
        : null,
    created_at: a.created_at,
  }));

  const highlightMessageId =
    messageId && messages.some((m) => m.id === messageId) ? messageId : null;

  return (
    <WorkspaceShell
      projectId={projectId}
      projectTitle={meta.title}
      currentUserId={userId}
      initialTab={tab ?? "messages"}
      highlightMessageId={highlightMessageId}
      messages={messagesDto}
      files={filesDto}
      activities={activitiesDto}
      roster={roster}
      nameMap={nameMapRecord}
    />
  );
}

export default async function WorkspacePage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const sp = await searchParams;

  if (!isProjectUuid(projectId)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <ArenaHeader />
      <Suspense fallback={<WorkspaceFallback />}>
        <WorkspacePageContent
          projectId={projectId}
          tab={sp.tab}
          messageId={sp.m}
        />
      </Suspense>
      <footer className="border-t border-slate-200 bg-white/80 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600">
          <p>Copyright VenShares 2024–2026</p>
        </div>
      </footer>
    </div>
  );
}
