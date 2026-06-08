import Link from "next/link";

import { AddOppositeRolePrompt } from "@/components/dashboard/add-opposite-role-prompt";
import { ideaArenaHrefMatchingMySkills } from "@/lib/arena-skill-filter";
import { DashboardAddProjectHeader } from "@/components/dashboard/dashboard-add-project-header";
import { DashboardProfessionalHeader } from "@/components/dashboard/dashboard-professional-header";
import { DashboardProjectProgressStack } from "@/components/dashboard/dashboard-project-progress-stack";
import { DashboardRoleTabs } from "@/components/dashboard/dashboard-role-tabs";
import type { PublishedTemplatePickerItem } from "@/lib/project-templates";
import type { WorkspaceOrganizerBundle } from "@/lib/workspace-organizer-bundle.server";
import type { VenRole } from "@/lib/ven-role";

type WorkspaceDashboardPanelProps = {
  userId: string;
  venRoles: VenRole[];
  hasInventor: boolean;
  hasProfessional: boolean;
  activeTab: "inventor" | "professional";
  proOnboardingComplete: boolean;
  joinedProjectsCount: number;
  bundles: WorkspaceOrganizerBundle[];
  professionalBundles: WorkspaceOrganizerBundle[];
  projectsCount: number;
  projectTemplates: PublishedTemplatePickerItem[];
};

export function WorkspaceDashboardPanel({
  userId,
  venRoles,
  hasInventor,
  hasProfessional,
  activeTab,
  proOnboardingComplete,
  joinedProjectsCount,
  bundles,
  professionalBundles,
  projectsCount,
  projectTemplates,
}: WorkspaceDashboardPanelProps) {
  const showTabs = hasInventor && hasProfessional;
  const showInventorPanel = showTabs ? activeTab === "inventor" : hasInventor;
  const showProfessionalPanel = showTabs
    ? activeTab === "professional"
    : hasProfessional;
  const showAddOppositeRole = hasInventor !== hasProfessional;
  const missingRole = hasInventor ? "professional" : "inventor";

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto">
        {showTabs ? <DashboardRoleTabs activeTab={activeTab} /> : null}

        {showProfessionalPanel ? (
          <>
            <DashboardProfessionalHeader />
            {!proOnboardingComplete ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 mb-10">
                <p className="text-base text-slate-700 mb-3">
                  Finish your professional profile to join teams in Idea Arena.
                </p>
                <Link
                  href="/onboarding/professional"
                  className="inline-flex text-sm font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg px-4 py-2 transition-colors"
                >
                  Complete professional profile
                </Link>
              </div>
            ) : joinedProjectsCount === 0 ? (
              <p className="text-xl text-slate-700 leading-relaxed mb-10 max-w-2xl">
                You haven&apos;t joined a team yet.{" "}
                <Link
                  href={ideaArenaHrefMatchingMySkills()}
                  className="text-[#22c55e] font-semibold hover:underline"
                >
                  Browse Idea Arena
                </Link>{" "}
                to find projects that match your skills.
              </p>
            ) : (
              <DashboardProjectProgressStack
                bundles={professionalBundles}
                currentUserId={userId}
                isProjectOwner={false}
              />
            )}
          </>
        ) : null}

        {showInventorPanel ? (
          <>
            <DashboardAddProjectHeader templates={projectTemplates} />
            {projectsCount === 0 ? (
              <p className="text-slate-600 text-base mb-10">
                No projects yet. Click Add new project to get started.
              </p>
            ) : (
              <DashboardProjectProgressStack
                bundles={bundles}
                currentUserId={userId}
              />
            )}
          </>
        ) : null}

        {venRoles.length === 0 ? (
          <>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Workspace
            </h1>
            <p className="text-slate-600 mb-6">
              Account type:{" "}
              <span className="font-medium text-slate-900">
                Not set (complete sign-up or sign in again)
              </span>
            </p>
          </>
        ) : null}

        {showAddOppositeRole ? (
          <AddOppositeRolePrompt missingRole={missingRole} />
        ) : null}
      </div>
    </div>
  );
}
