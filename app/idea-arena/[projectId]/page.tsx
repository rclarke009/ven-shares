import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { ArenaHeader } from "@/components/idea-arena/arena-header";
import { ProjectDetailView } from "@/components/idea-arena/project-detail-view";
import { getArenaTeamDisplay } from "@/lib/arena-team";
import { getMembershipForCurrentUser } from "@/lib/project-members";
import {
  buildIdeaArenaQueryString,
  effectiveArenaSkillFilter,
  parseArenaSkillFilterParams,
} from "@/lib/arena-skill-filter";
import { getProjectByIdForArena, isProjectUuid } from "@/lib/projects-arena";
import {
  getProfessionalJobCategoriesFromMetadata,
  getProfessionalJoinSkillBlockReason,
  normalizeRequiredJobCategoriesFromDb,
} from "@/lib/skills-match";
import {
  isCurrentUserProfessional,
  getVenUserButtonProfileMode,
} from "@/lib/ven-role.server";
import { getWorkspaceAccessFlags } from "@/lib/workspace-access";
import { workspaceHrefForArenaMember } from "@/lib/workspace-arena-nav";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IdeaArenaProjectPage({
  params,
  searchParams,
}: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const { projectId } = await params;
  if (!isProjectUuid(projectId)) {
    notFound();
  }

  const project = await getProjectByIdForArena(projectId);
  if (!project) {
    notFound();
  }

  const requiredForArena = normalizeRequiredJobCategoriesFromDb(
    project.required_job_categories,
  );
  const { members: teamMembers, categoryCoverage } = await getArenaTeamDisplay(
    projectId,
    requiredForArena,
  );

  const isProfessional = await isCurrentUserProfessional();
  const sp = await searchParams;
  const parsedRaw = parseArenaSkillFilterParams(sp);
  const parsed = effectiveArenaSkillFilter(
    parsedRaw,
    isProfessional,
  );
  const returnToArenaQuery = buildIdeaArenaQueryString({
    selected: projectId,
    skillFilter: parsed.mode,
    needCategories: parsed.needCategories,
  });

  const { canAccess: canOpenWorkspace, isOwner: isProjectOwner } =
    await getWorkspaceAccessFlags(projectId, userId);
  const alreadyJoined =
    isProfessional
      ? await getMembershipForCurrentUser(projectId)
      : false;

  let joinTeamSkillMessage: string | undefined;
  if (isProfessional && !alreadyJoined) {
    const required = normalizeRequiredJobCategoriesFromDb(
      project.required_job_categories,
    );
    const clerkUser = await currentUser();
    const profCategories = getProfessionalJobCategoriesFromMetadata(
      clerkUser?.publicMetadata as Record<string, unknown> | undefined,
    );
    const block = getProfessionalJoinSkillBlockReason(
      profCategories,
      required,
    );
    if (block === "no_required_skills") {
      joinTeamSkillMessage =
        "This project doesn’t list needed team skills yet, so joining isn’t available. The inventor can add them from the dashboard.";
    } else if (block === "no_overlap") {
      joinTeamSkillMessage =
        "None of your job categories match what this team is looking for. You can update your profile under professional onboarding settings or explore other projects.";
    }
  }

  const profileMode = await getVenUserButtonProfileMode();

  const contextWorkspaceHref = canOpenWorkspace
    ? workspaceHrefForArenaMember(
        projectId,
        isProjectOwner ? "owner" : "team",
      )
    : undefined;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <ArenaHeader
        profileMode={profileMode}
        contextWorkspaceHref={contextWorkspaceHref}
      />
      <main className="flex-1">
        <ProjectDetailView
          project={project}
          isProfessional={isProfessional}
          canOpenWorkspace={canOpenWorkspace}
          isProjectOwner={isProjectOwner}
          joinTeamSkillMessage={joinTeamSkillMessage}
          teamMembers={teamMembers}
          categoryCoverage={categoryCoverage}
          returnToArenaQuery={returnToArenaQuery}
        />
      </main>
      <footer className="border-t border-slate-200 bg-white/80 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600">
          <p>Copyright VenShares 2024–2026</p>
        </div>
      </footer>
    </div>
  );
}
