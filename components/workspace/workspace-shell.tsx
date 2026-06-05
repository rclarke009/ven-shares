"use client";

import Link from "next/link";
import {
  Activity,
  Image,
  LayoutList,
  MessageCircle,
  Video,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  actionWorkspacePresenceHeartbeat,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import type { ArenaCategorySlot } from "@/lib/projects-arena";
import type { ArenaCategoryCoverage } from "@/lib/arena-team-display";
import type { ProjectRequiredSkill } from "@/lib/project-required-skills";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";
import {
  boardParamFromCategory,
  messageActivityBoardSuffix,
  messageBoardLabel,
  resolveBoardCategory,
  TEAM_BOARD_PARAM,
} from "@/lib/workspace-message-boards";
import { writeWorkspaceLastView } from "@/lib/workspace-last-view";
import type { WorkspacePickerProject } from "@/lib/workspace-project-picker.server";

import { EditProjectForm } from "@/components/dashboard/edit-project-form";
import { WorkspaceAppShell } from "@/components/workspace/workspace-app-shell";
import { WorkspaceMessagesPanel } from "@/components/workspace/workspace-messages-panel";
import { WorkspaceOrganizerPanel } from "@/components/workspace/workspace-progress-panel";
import { WorkspaceProjectHero } from "@/components/workspace/workspace-project-hero";
import { WorkspaceTeamRoster } from "@/components/workspace/workspace-team-roster";

export type WorkspaceFileDTO = {
  id: string;
  uploaded_by_clerk_user_id: string;
  filename: string;
  content_type: string | null;
  byte_size: number;
  job_category: string | null;
  description: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by_clerk_user_id: string | null;
};

const TABS = [
  { id: "activity" as const, label: "Activity", icon: Activity },
  { id: "messages" as const, label: "Messages", icon: MessageCircle },
  { id: "organizer" as const, label: "Organizer", icon: LayoutList },
  { id: "meeting" as const, label: "Meeting", icon: Video },
];

const SETTINGS_TAB = {
  id: "settings" as const,
  label: "Arena Card Details",
  icon: Image,
};

type BaseTabId = (typeof TABS)[number]["id"];
type TabId = BaseTabId | "settings";

export type WorkspaceEditableProject = {
  id: string;
  title: string;
  description: string | null;
  required_job_categories: string[];
  representative_image_path: string | null;
  hero_image_path: string | null;
  project_required_skills: ProjectRequiredSkill[];
};

export type WorkspaceMessageDTO = {
  id: string;
  author_clerk_user_id: string;
  body: string;
  reply_to_id: string | null;
  job_category: string | null;
  is_urgent: boolean;
  created_at: string;
};

export type WorkspaceArchivedMessageDTO = WorkspaceMessageDTO & {
  deleted_at: string;
  deleted_by_clerk_user_id: string | null;
};

export type WorkspaceActivityDTO = {
  id: string;
  actor_clerk_user_id: string;
  kind: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type WorkspaceRosterEntryDTO = {
  clerk_user_id: string;
  display_name: string;
  role: "owner" | "member";
  status_text: string;
  updated_at: string | null;
};

type WorkspaceShellProps = {
  owned: WorkspacePickerProject[];
  joined: WorkspacePickerProject[];
  projectId: string;
  projectTitle: string;
  heroImagePath: string | null;
  representativeImagePath: string | null;
  currentUserId: string;
  initialTab: string;
  highlightMessageId: string | null;
  initialBoardParam: string;
  messages: WorkspaceMessageDTO[];
  archivedMessages: WorkspaceArchivedMessageDTO[];
  requiredJobCategories: ProfessionalJobCategory[];
  files: WorkspaceFileDTO[];
  activities: WorkspaceActivityDTO[];
  roster: WorkspaceRosterEntryDTO[];
  nameMap: Record<string, string>;
  progressChecklist: WorkspaceProgressChecklist;
  progressCategoryStatuses: ArenaCategorySlot[];
  categoryCoverage: ArenaCategoryCoverage[];
  viewerCoveredCategories: ProfessionalJobCategory[];
  isProjectOwner: boolean;
  editableProject: WorkspaceEditableProject | null;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function activityDescription(
  kind: string,
  payload: Record<string, unknown> | null,
): string {
  if (kind === "message_posted") {
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    const suffix = messageActivityBoardSuffix(category);
    const urgent = payload?.is_urgent === true;
    return urgent
      ? `Posted an urgent message${suffix}`
      : `Posted a message${suffix}`;
  }
  if (kind === "message_deleted") {
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return `Archived a message${messageActivityBoardSuffix(category)}`;
  }
  if (kind === "file_uploaded") {
    const name =
      typeof payload?.filename === "string" ? payload.filename : "a file";
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return category ? `Uploaded ${name} for ${category}` : `Uploaded ${name}`;
  }
  if (kind === "file_deleted") {
    const name =
      typeof payload?.filename === "string" ? payload.filename : "a file";
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return category ? `Archived ${name} from ${category}` : `Archived ${name}`;
  }
  if (kind === "file_updated") {
    const name =
      typeof payload?.filename === "string" ? payload.filename : "a file";
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return category
      ? `Updated description for ${name} in ${category}`
      : `Updated description for ${name}`;
  }
  if (kind === "status_updated") {
    const s =
      typeof payload?.status_text === "string" ? payload.status_text : "";
    return s ? `Set status: ${s}` : "Updated status";
  }
  return kind.replace(/_/g, " ");
}

function activityMessagePermalink(
  payload: Record<string, unknown> | null,
): string | null {
  const messageId =
    typeof payload?.message_id === "string" ? payload.message_id : null;
  if (!messageId) return null;
  const category =
    typeof payload?.job_category === "string" ? payload.job_category : null;
  const board = boardParamFromCategory(category);
  const params = new URLSearchParams({
    tab: "messages",
    board,
    m: messageId,
  });
  return `?${params.toString()}`;
}

function isUrgentMessageActivity(
  kind: string,
  payload: Record<string, unknown> | null,
): boolean {
  return kind === "message_posted" && payload?.is_urgent === true;
}

function isBaseTabId(v: string): v is BaseTabId {
  return TABS.some((t) => t.id === v);
}

function resolveTabId(
  v: string,
  isProjectOwner: boolean,
): TabId {
  if (v === "settings") {
    return isProjectOwner ? "settings" : "messages";
  }
  if (v === "progress" || v === "files") {
    return "organizer";
  }
  if (isBaseTabId(v)) return v;
  return "messages";
}

export function WorkspaceShell({
  owned,
  joined,
  projectId,
  projectTitle,
  heroImagePath,
  representativeImagePath,
  currentUserId,
  initialTab,
  highlightMessageId,
  initialBoardParam,
  messages,
  archivedMessages,
  requiredJobCategories,
  files,
  activities,
  roster,
  nameMap,
  progressChecklist,
  progressCategoryStatuses,
  categoryCoverage,
  viewerCoveredCategories,
  isProjectOwner,
  editableProject,
}: WorkspaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState<TabId>(() =>
    resolveTabId(initialTab, isProjectOwner),
  );
  const [, startTransition] = useTransition();

  const messageBoardCategories = useMemo(
    () =>
      requiredJobCategories.length > 0
        ? requiredJobCategories
        : progressCategoryStatuses.map((s) => s.category),
    [requiredJobCategories, progressCategoryStatuses],
  );

  const messageBoards = useMemo(
    () => [
      { category: null as string | null, label: messageBoardLabel(null) },
      ...messageBoardCategories.map((category) => ({
        category,
        label: messageBoardLabel(category),
      })),
    ],
    [messageBoardCategories],
  );

  const activeBoardCategory = useMemo(() => {
    const boardParam = searchParams.get("board") ?? initialBoardParam;
    return resolveBoardCategory(boardParam, messageBoardCategories);
  }, [searchParams, initialBoardParam, messageBoardCategories]);

  const activeBoardParam = boardParamFromCategory(activeBoardCategory);

  useEffect(() => {
    writeWorkspaceLastView(currentUserId, projectId);
  }, [currentUserId, projectId]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTabState(resolveTabId(t, isProjectOwner));
  }, [searchParams, isProjectOwner]);

  useEffect(() => {
    if (highlightMessageId) {
      setTabState("messages");
    }
  }, [highlightMessageId]);

  useEffect(() => {
    void actionWorkspacePresenceHeartbeat(projectId);
    const id = window.setInterval(() => {
      void actionWorkspacePresenceHeartbeat(projectId);
    }, 90_000);
    return () => window.clearInterval(id);
  }, [projectId]);

  function setTab(next: TabId) {
    setTabState(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    if (next === "messages" && !params.get("board")) {
      params.set("board", TEAM_BOARD_PARAM);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function setMessageBoard(category: string | null) {
    setTabState("messages");
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "messages");
    params.set("board", boardParamFromCategory(category));
    params.delete("m");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const projectSidebar = (
    <>
      {TABS.map(({ id, label, icon: Icon }) => (
        <div key={id}>
          <button
            type="button"
            onClick={() => setTab(id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              tab === id
                ? "bg-slate-500/80 text-white"
                : "text-slate-200 hover:bg-slate-600/80"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            {label}
          </button>
          {id === "messages" && tab === "messages" ? (
            <ul
              className="mt-1 ml-4 space-y-0.5 border-l border-slate-600 pl-2"
              aria-label="Message boards"
            >
              {messageBoards.map(({ category, label: boardLabel }) => {
                const param = boardParamFromCategory(category);
                const isActive = param === activeBoardParam;
                return (
                  <li key={param}>
                    <button
                      type="button"
                      onClick={() => setMessageBoard(category)}
                      className={`block w-full rounded-md px-2 py-1.5 text-left text-xs leading-snug transition-colors ${
                        isActive
                          ? "bg-slate-600/90 font-semibold text-white"
                          : "text-slate-300 hover:bg-slate-600/60 hover:text-white"
                      }`}
                    >
                      {boardLabel}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ))}
      {isProjectOwner ? (
        <button
          type="button"
          onClick={() => setTab("settings")}
          aria-label={SETTINGS_TAB.label}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            tab === "settings"
              ? "bg-slate-500/80 text-white"
              : "text-slate-200 hover:bg-slate-600/80"
          }`}
        >
          <SETTINGS_TAB.icon
            className="h-5 w-5 shrink-0 opacity-90"
            aria-hidden
          />
          {SETTINGS_TAB.label}
        </button>
      ) : null}
    </>
  );

  return (
    <WorkspaceAppShell
      owned={owned}
      joined={joined}
      activeProjectId={projectId}
      currentUserId={currentUserId}
      projectSidebar={projectSidebar}
      projectSidebarFooter={<WorkspaceTeamRoster roster={roster} />}
    >
      <WorkspaceProjectHero
        projectId={projectId}
        projectTitle={projectTitle}
        heroImagePath={heroImagePath}
        representativeImagePath={representativeImagePath}
      />
      <div className="flex-1 p-6 overflow-auto">
        {tab === "activity" ? (
          <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Recent activity
            </h2>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-600">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => {
                  const urgent = isUrgentMessageActivity(a.kind, a.payload);
                  const messageLink = activityMessagePermalink(a.payload);
                  return (
                    <li
                      key={a.id}
                      className={`text-sm border-b border-slate-100 pb-3 last:border-0 ${
                        urgent
                          ? "border-l-4 border-l-red-400 pl-3 -ml-3"
                          : ""
                      }`}
                    >
                      <span className="font-medium text-slate-900">
                        {nameMap[a.actor_clerk_user_id] ?? "Someone"}
                      </span>
                      <span
                        className={
                          urgent ? "font-semibold text-red-800" : "text-slate-600"
                        }
                      >
                        {" "}
                        {activityDescription(a.kind, a.payload)}
                      </span>
                      {messageLink ? (
                        <Link
                          href={messageLink}
                          className="block text-xs font-medium text-[#15803d] hover:underline mt-1"
                        >
                          View message
                        </Link>
                      ) : null}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTime(a.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "messages" ? (
          <WorkspaceMessagesPanel
            projectId={projectId}
            currentUserId={currentUserId}
            isProjectOwner={isProjectOwner}
            requiredJobCategories={messageBoardCategories}
            messages={messages}
            archivedMessages={archivedMessages}
            nameMap={nameMap}
            highlightMessageId={highlightMessageId}
            initialBoardParam={initialBoardParam}
          />
        ) : null}

        {tab === "organizer" ? (
          <WorkspaceOrganizerPanel
            projectId={projectId}
            projectTitle={projectTitle}
            checklist={progressChecklist}
            categoryStatuses={progressCategoryStatuses}
            categoryCoverage={categoryCoverage}
            files={files}
            nameMap={nameMap}
            currentUserId={currentUserId}
            viewerCoveredCategories={viewerCoveredCategories}
            isProjectOwner={isProjectOwner}
          />
        ) : null}

        {tab === "meeting" ? (
          <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
            <Video className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-700 font-medium">Meeting</p>
            <p className="text-sm text-slate-500 mt-2">Coming soon.</p>
          </div>
        ) : null}

        {tab === "settings" && editableProject ? (
          <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Arena Card Details
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Set your workspace banner and Idea Arena card image, plus title,
              summary, and the team skills professionals need to join.
            </p>
            <EditProjectForm
              key={`${editableProject.id}-${editableProject.hero_image_path ?? ""}-${editableProject.representative_image_path ?? ""}-${editableProject.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("|")}-${editableProject.title}`}
              project={editableProject}
              variant="workspace"
            />
          </div>
        ) : null}
      </div>
    </WorkspaceAppShell>
  );
}
