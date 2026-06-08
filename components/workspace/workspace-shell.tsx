"use client";

import {
  Image,
  LayoutList,
  Map,
  MessageCircle,
  Rocket,
  Route,
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
import type { ProjectFoundation } from "@/lib/project-foundation";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import type { ArenaCategoryCoverage, ArenaTeamMemberDisplay } from "@/lib/arena-team-display";
import type { ArenaCategorySlot } from "@/lib/projects-arena";
import type { ArenaProject } from "@/lib/projects-arena";
import type { ProjectRequiredSkill } from "@/lib/project-required-skills";
import type { ProjectImageCropMeta } from "@/lib/project-image-crop";
import type { ProjectMilestoneState } from "@/lib/workspace-progress-graph";
import type { NodeDependenciesOverrides } from "@/lib/workspace-progress-graph";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";
import {
  boardParamFromCategory,
  messageBoardLabel,
  resolveBoardCategory,
  TEAM_BOARD_PARAM,
} from "@/lib/workspace-message-boards";
import { writeWorkspaceLastView } from "@/lib/workspace-last-view";
import type { WorkspacePickerProject } from "@/lib/workspace-project-picker.server";

import { EditProjectForm } from "@/components/dashboard/edit-project-form";
import { WorkspaceActivityLog } from "@/components/workspace/workspace-activity-log";
import { WorkspaceAppShell } from "@/components/workspace/workspace-app-shell";
import { WorkspaceMessagesPanel } from "@/components/workspace/workspace-messages-panel";
import { WorkspaceOrganizerPanel } from "@/components/workspace/workspace-progress-panel";
import { ProjectGetStartedPanel } from "@/components/workspace/project-get-started-panel";
import { ProjectJourneyPanel } from "@/components/workspace/project-journey-panel";
import { ProjectRoadmapPanel } from "@/components/workspace/project-roadmap-panel";
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
  { id: "journey" as const, label: "Journey", icon: Route },
  { id: "roadmap" as const, label: "Roadmap", icon: Map },
  { id: "messages" as const, label: "Messages", icon: MessageCircle },
  { id: "organizer" as const, label: "Organizer", icon: LayoutList },
  { id: "meeting" as const, label: "Meeting", icon: Video },
];

const GET_STARTED_TAB = {
  id: "get-started" as const,
  label: "Get Started",
  icon: Rocket,
};

const SETTINGS_TAB = {
  id: "settings" as const,
  label: "Arena Card Details",
  icon: Image,
};

type BaseTabId = (typeof TABS)[number]["id"];
type TabId = BaseTabId | "settings" | "get-started";

export type WorkspaceEditableProject = {
  id: string;
  title: string;
  description: string | null;
  project_foundation: ProjectFoundation;
  required_job_categories: string[];
  representative_image_path: string | null;
  representative_image_original_path: string | null;
  representative_image_crop: ProjectImageCropMeta | null;
  hero_image_path: string | null;
  hero_image_original_path: string | null;
  hero_image_crop: ProjectImageCropMeta | null;
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
  progressMilestoneState: ProjectMilestoneState;
  progressNodeDependencies: NodeDependenciesOverrides;
  progressCategoryStatuses: ArenaCategorySlot[];
  categoryCoverage: ArenaCategoryCoverage[];
  viewerCoveredCategories: ProfessionalJobCategory[];
  isProjectOwner: boolean;
  editableProject: WorkspaceEditableProject | null;
  arenaProject: ArenaProject | null;
  arenaTeamMembers: ArenaTeamMemberDisplay[];
};

function isBaseTabId(v: string): v is BaseTabId {
  return TABS.some((t) => t.id === v);
}

function resolveTabId(
  v: string,
  isProjectOwner: boolean,
): TabId {
  if (v === "get-started") {
    return isProjectOwner ? "get-started" : "messages";
  }
  if (v === "settings") {
    return isProjectOwner ? "settings" : "messages";
  }
  if (v === "progress" || v === "files") {
    return "organizer";
  }
  if (v === "activity") {
    return "messages";
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
  progressMilestoneState,
  progressNodeDependencies,
  progressCategoryStatuses,
  categoryCoverage,
  viewerCoveredCategories,
  isProjectOwner,
  editableProject,
  arenaProject,
  arenaTeamMembers,
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
      {isProjectOwner ? (
        <button
          type="button"
          onClick={() => setTab("get-started")}
          aria-label={GET_STARTED_TAB.label}
          className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            tab === "get-started"
              ? "bg-slate-500/80 text-white"
              : "text-slate-200 hover:bg-slate-600/80"
          }`}
        >
          <GET_STARTED_TAB.icon
            className="h-5 w-5 shrink-0 opacity-90"
            aria-hidden
          />
          {GET_STARTED_TAB.label}
        </button>
      ) : null}
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
      projectSidebarFooter={
        <div className="mt-auto flex flex-col">
          <WorkspaceActivityLog activities={activities} nameMap={nameMap} />
          <WorkspaceTeamRoster roster={roster} />
        </div>
      }
    >
      <WorkspaceProjectHero
        projectId={projectId}
        projectTitle={projectTitle}
        heroImagePath={heroImagePath}
        representativeImagePath={representativeImagePath}
      />
      <div className="flex-1 p-6 overflow-auto">
        {tab === "journey" ? (
          <ProjectJourneyPanel
            projectId={projectId}
            checklist={progressChecklist}
            milestoneState={progressMilestoneState}
            nodeDependencies={progressNodeDependencies}
            requiredCategories={requiredJobCategories}
          />
        ) : null}

        {tab === "roadmap" ? (
          <ProjectRoadmapPanel
            projectId={projectId}
            checklist={progressChecklist}
            milestoneState={progressMilestoneState}
            nodeDependencies={progressNodeDependencies}
            requiredCategories={requiredJobCategories}
            categoryCoverage={categoryCoverage}
            roster={roster}
          />
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

        {tab === "get-started" && editableProject && arenaProject ? (
          <ProjectGetStartedPanel
            projectId={projectId}
            editableProject={editableProject}
            arenaProject={arenaProject}
            teamMembers={arenaTeamMembers}
            categoryCoverage={categoryCoverage}
          />
        ) : null}

        {tab === "settings" && editableProject ? (
          <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Arena Card Details
            </h2>
            <p className="text-base text-slate-600 mb-4">
              Set your Idea Arena card image and workspace banner, plus title,
              summary, and the team skills professionals need to join.
            </p>
            <EditProjectForm
              key={`${editableProject.id}-${editableProject.hero_image_path ?? ""}-${editableProject.hero_image_original_path ?? ""}-${editableProject.representative_image_path ?? ""}-${editableProject.representative_image_original_path ?? ""}-${JSON.stringify(editableProject.representative_image_crop)}-${JSON.stringify(editableProject.hero_image_crop)}-${editableProject.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("|")}-${editableProject.title}`}
              project={editableProject}
              variant="workspace"
            />
          </div>
        ) : null}
      </div>
    </WorkspaceAppShell>
  );
}
