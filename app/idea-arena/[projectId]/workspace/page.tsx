import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ArenaHeader } from "@/components/idea-arena/arena-header";
import {
  WorkspaceShell,
  type WorkspaceActivityDTO,
  type WorkspaceArchivedMessageDTO,
  type WorkspaceMessageDTO,
  type WorkspaceRosterEntryDTO,
} from "@/components/workspace/workspace-shell";
import { getProjectByIdForArena, isProjectUuid } from "@/lib/projects-arena";
import { loadWorkspaceOrganizerBundle } from "@/lib/workspace-organizer-bundle.server";
import {
  boardParamFromCategory,
  resolveBoardCategory,
  TEAM_BOARD_PARAM,
} from "@/lib/workspace-message-boards";
import {
  assertWorkspaceAccess,
  getWorkspaceAccessFlags,
} from "@/lib/workspace-access";
import { resolveClerkDisplayNames } from "@/lib/workspace-display-names";
import {
  getWorkspaceProjectMeta,
  listMemberClerkIdsForProject,
  listWorkspaceActivities,
  listArchivedWorkspaceMessages,
  listWorkspaceMessages,
  listWorkspacePresence,
} from "@/lib/workspace";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string; m?: string; board?: string }>;
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
  boardParam,
}: {
  projectId: string;
  tab: string | undefined;
  messageId: string | undefined;
  boardParam: string | undefined;
}) {
  const userId = await assertWorkspaceAccess(projectId);
  const accessFlags = await getWorkspaceAccessFlags(projectId, userId);

  const meta = await getWorkspaceProjectMeta(projectId);
  if (!meta) notFound();

  const organizerBundle = await loadWorkspaceOrganizerBundle(projectId, userId);
  if (!organizerBundle) notFound();

  const arenaProject = await getProjectByIdForArena(projectId);
  if (!arenaProject) notFound();

  const [messages, archivedMessages, activities, presence, memberIds] =
    await Promise.all([
      listWorkspaceMessages(projectId),
      listArchivedWorkspaceMessages(projectId),
      listWorkspaceActivities(projectId),
      listWorkspacePresence(projectId),
      listMemberClerkIdsForProject(projectId),
    ]);

  const allIds = new Set<string>();
  allIds.add(meta.clerk_user_id);
  for (const id of memberIds) allIds.add(id);
  for (const m of messages) allIds.add(m.author_clerk_user_id);
  for (const m of archivedMessages) {
    allIds.add(m.author_clerk_user_id);
    if (m.deleted_by_clerk_user_id) allIds.add(m.deleted_by_clerk_user_id);
  }
  for (const a of activities) allIds.add(a.actor_clerk_user_id);
  for (const f of organizerBundle.files) {
    allIds.add(f.uploaded_by_clerk_user_id);
    if (f.deleted_by_clerk_user_id) allIds.add(f.deleted_by_clerk_user_id);
  }
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
    job_category: m.job_category ?? null,
    is_urgent: m.is_urgent,
    created_at: m.created_at,
  }));

  const archivedMessagesDto: WorkspaceArchivedMessageDTO[] =
    archivedMessages.map((m) => ({
      id: m.id,
      author_clerk_user_id: m.author_clerk_user_id,
      body: m.body,
      reply_to_id: m.reply_to_id,
      job_category: m.job_category ?? null,
      is_urgent: m.is_urgent,
      created_at: m.created_at,
      deleted_at: m.deleted_at!,
      deleted_by_clerk_user_id: m.deleted_by_clerk_user_id,
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

  const highlightMessage = highlightMessageId
    ? messages.find((m) => m.id === highlightMessageId)
    : undefined;

  const rawBoardParam =
    boardParam ??
    (highlightMessage
      ? boardParamFromCategory(highlightMessage.job_category ?? null)
      : TEAM_BOARD_PARAM);

  const initialBoardParam = boardParamFromCategory(
    resolveBoardCategory(rawBoardParam, arenaProject.required_job_categories),
  );

  return (
    <WorkspaceShell
      projectId={projectId}
      projectTitle={meta.title}
      currentUserId={userId}
      initialTab={tab ?? "messages"}
      highlightMessageId={highlightMessageId}
      initialBoardParam={initialBoardParam}
      messages={messagesDto}
      archivedMessages={archivedMessagesDto}
      requiredJobCategories={arenaProject.required_job_categories}
      files={organizerBundle.files}
      activities={activitiesDto}
      roster={roster}
      nameMap={nameMapRecord}
      progressChecklist={organizerBundle.checklist}
      progressCategoryStatuses={organizerBundle.categoryStatuses}
      categoryCoverage={organizerBundle.categoryCoverage}
      viewerCoveredCategories={organizerBundle.viewerCoveredCategories}
      isProjectOwner={accessFlags.isOwner}
      editableProject={
        accessFlags.isOwner
          ? {
              id: arenaProject.id,
              title: arenaProject.title,
              description: arenaProject.description,
              required_job_categories: arenaProject.required_job_categories,
              representative_image_path: arenaProject.representative_image_path,
              project_required_skills: arenaProject.project_required_skills,
            }
          : null
      }
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
          boardParam={sp.board}
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
