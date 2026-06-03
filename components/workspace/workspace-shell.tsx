"use client";

import Link from "next/link";
import {
  Activity,
  LayoutList,
  MessageCircle,
  Settings,
  Video,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
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
} from "@/lib/workspace-message-boards";

import { EditProjectForm } from "@/components/dashboard/edit-project-form";
import { WorkspaceMessagesPanel } from "@/components/workspace/workspace-messages-panel";
import { WorkspaceOrganizerPanel } from "@/components/workspace/workspace-progress-panel";

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
  label: "Settings",
  icon: Settings,
};

type BaseTabId = (typeof TABS)[number]["id"];
type TabId = BaseTabId | "settings";

export type WorkspaceEditableProject = {
  id: string;
  title: string;
  description: string | null;
  required_job_categories: string[];
  representative_image_path: string | null;
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
  projectId: string;
  projectTitle: string;
  currentUserId: string;
  initialTab: string;
  highlightMessageId: string | null;
  initialBoardParam: string;
  messages: WorkspaceMessageDTO[];
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
    return `Removed a message${messageActivityBoardSuffix(category)}`;
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
    return category ? `Removed ${name} from ${category}` : `Removed ${name}`;
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
  projectId,
  projectTitle,
  currentUserId,
  initialTab,
  highlightMessageId,
  initialBoardParam,
  messages,
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
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#e8eef5]">
      <aside className="w-52 shrink-0 bg-slate-700 text-slate-100 flex flex-col border-r border-slate-600">
        <nav className="flex flex-col gap-0.5 p-3 pt-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-slate-500/80 text-white"
                  : "text-slate-200 hover:bg-slate-600/80"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              {label}
            </button>
          ))}
          {isProjectOwner ? (
            <button
              type="button"
              onClick={() => setTab("settings")}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === "settings"
                  ? "bg-slate-500/80 text-white"
                  : "text-slate-200 hover:bg-slate-600/80"
              }`}
            >
              <Settings className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              {SETTINGS_TAB.label}
            </button>
          ) : null}
        </nav>
        <div className="mt-auto p-3 border-t border-slate-600/80">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Team
          </p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {roster.map((r) => (
              <li key={r.clerk_user_id} className="text-xs">
                <span className="font-medium text-white">
                  {r.display_name}
                </span>
                <span className="text-slate-400">
                  {" "}
                  · {r.role === "owner" ? "Owner" : "Member"}
                </span>
                {r.status_text.trim() ? (
                  <p className="text-slate-300 mt-0.5 leading-snug">
                    {r.status_text}
                  </p>
                ) : null}
                {r.updated_at ? (
                  <p className="text-slate-500 mt-0.5">
                    {formatTime(r.updated_at)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-slate-200/80 bg-white/90 px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-900 truncate">
            {projectTitle}
          </h1>
          <Link
            href={`/idea-arena/${projectId}`}
            className="text-sm font-medium text-[#22c55e] hover:underline shrink-0"
          >
            Project page
          </Link>
        </div>

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
              requiredJobCategories={
                requiredJobCategories.length > 0
                  ? requiredJobCategories
                  : progressCategoryStatuses.map((s) => s.category)
              }
              messages={messages}
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
            <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">
                Project settings
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Update how this project appears in Idea Arena and what skills
                professionals need to join.
              </p>
              <EditProjectForm
                key={`${editableProject.id}-${editableProject.representative_image_path ?? ""}-${editableProject.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("|")}-${editableProject.title}`}
                project={editableProject}
                variant="workspace"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
