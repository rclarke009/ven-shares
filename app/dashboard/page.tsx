import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { DashboardAddProjectHeader } from "@/components/dashboard/dashboard-add-project-header";
import { DashboardProfessionalHeader } from "@/components/dashboard/dashboard-professional-header";
import { DashboardProjectProgressStack } from "@/components/dashboard/dashboard-project-progress-stack";
import { DashboardRoleTabs } from "@/components/dashboard/dashboard-role-tabs";
import { VenSharesLogo } from "@/components/venshares-logo";
import { VenUserButtonFromServer } from "@/components/ven-user-button-from-server";
import { listProjectsForCurrentUser } from "@/app/dashboard/projects/actions";
import { listJoinedProjectsForCurrentUser } from "@/lib/project-members";
import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  getVenRolesForCurrentUser,
  isCurrentUserInventor,
  isCurrentUserProfessional,
} from "@/lib/ven-role.server";
import {
  loadWorkspaceOrganizerBundlesForMember,
  loadWorkspaceOrganizerBundlesForOwner,
} from "@/lib/workspace-organizer-bundle.server";

type DashboardPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function resolveActiveTab(
  tabParam: string | undefined,
  hasInventor: boolean,
  hasProfessional: boolean,
): "inventor" | "professional" {
  if (tabParam === "professional" && hasProfessional) return "professional";
  if (tabParam === "inventor" && hasInventor) return "inventor";
  if (hasInventor) return "inventor";
  if (hasProfessional) return "professional";
  return "inventor";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const sp = await searchParams;
  const venRoles = await getVenRolesForCurrentUser();
  const hasInventor = await isCurrentUserInventor();
  const hasProfessional = await isCurrentUserProfessional();
  const showTabs = hasInventor && hasProfessional;

  const activeTab = resolveActiveTab(sp.tab, hasInventor, hasProfessional);

  const user = await currentUser();
  const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const proOnboardingComplete = isProfessionalOnboardingComplete(meta);

  const projects = hasInventor ? await listProjectsForCurrentUser() : [];
  const joinedProjects = hasProfessional
    ? await listJoinedProjectsForCurrentUser()
    : [];

  const bundles =
    hasInventor && projects.length > 0
      ? await loadWorkspaceOrganizerBundlesForOwner(
          projects.map((p) => p.id),
          userId,
        )
      : [];

  const professionalBundles =
    joinedProjects.length > 0
      ? await loadWorkspaceOrganizerBundlesForMember(
          joinedProjects.map((p) => p.id),
          userId,
        )
      : [];

  const showInventorPanel = showTabs
    ? activeTab === "inventor"
    : hasInventor;
  const showProfessionalPanel = showTabs
    ? activeTab === "professional"
    : hasProfessional;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <VenSharesLogo />
          <div className="flex items-center gap-4">
            <Link
              href="/idea-arena"
              className="text-sm font-medium text-slate-700 hover:text-[#22c55e]"
            >
              Idea Arena
            </Link>
            <VenUserButtonFromServer />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {showTabs ? <DashboardRoleTabs activeTab={activeTab} /> : null}

        {showProfessionalPanel ? (
          <>
            <DashboardProfessionalHeader />
            {!proOnboardingComplete ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 mb-10">
                <p className="text-sm text-slate-700 mb-3">
                  Finish your professional profile to join teams in Idea Arena.
                </p>
                <Link
                  href="/onboarding/professional"
                  className="inline-flex text-sm font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg px-4 py-2 transition-colors"
                >
                  Complete professional profile
                </Link>
              </div>
            ) : joinedProjects.length === 0 ? (
              <p className="text-slate-600 text-sm mb-10">
                You haven&apos;t joined a team yet. Use Idea Arena in the header
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
            <DashboardAddProjectHeader />
            {projects.length === 0 ? (
              <p className="text-slate-600 text-sm mb-10">
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
              Dashboard
            </h1>
            <p className="text-slate-600 mb-6">
              Account type:{" "}
              <span className="font-medium text-slate-900">
                Not set (complete sign-up or sign in again)
              </span>
            </p>
          </>
        ) : null}

        <Link
          href="/"
          className="text-[#22c55e] font-medium hover:underline mt-10 inline-block"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
