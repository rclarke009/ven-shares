import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { DashboardAddProjectHeader } from "@/components/dashboard/dashboard-add-project-header";
import { DashboardProfessionalHeader } from "@/components/dashboard/dashboard-professional-header";
import { DashboardProjectProgressStack } from "@/components/dashboard/dashboard-project-progress-stack";
import { VenSharesLogo } from "@/components/venshares-logo";
import { VenUserButtonFromServer } from "@/components/ven-user-button-from-server";
import { listProjectsForCurrentUser } from "@/app/dashboard/projects/actions";
import { listJoinedProjectsForCurrentUser } from "@/lib/project-members";
import { getVenRoleForCurrentUser } from "@/lib/ven-role.server";
import {
  loadWorkspaceOrganizerBundlesForMember,
  loadWorkspaceOrganizerBundlesForOwner,
} from "@/lib/workspace-organizer-bundle.server";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const venRole = await getVenRoleForCurrentUser();
  const projects =
    venRole === "inventor" ? await listProjectsForCurrentUser() : [];

  const joinedProjects =
    venRole === "professional"
      ? await listJoinedProjectsForCurrentUser()
      : [];

  const bundles =
    venRole === "inventor" && projects.length > 0
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
        {venRole === "professional" ? (
          <>
            <DashboardProfessionalHeader />
            {joinedProjects.length === 0 ? (
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
        ) : venRole === "inventor" ? (
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
        ) : (
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
        )}

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
