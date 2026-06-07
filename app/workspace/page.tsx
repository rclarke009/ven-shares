import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { listProjectsForCurrentUser } from "@/app/dashboard/projects/actions";
import { listPublishedTemplatesForPicker } from "@/lib/project-templates.server";
import { WorkspaceDashboardShell } from "@/components/workspace/workspace-dashboard-shell";
import { WorkspacePageChrome } from "@/components/workspace/workspace-page-chrome";
import { listJoinedProjectsForCurrentUser } from "@/lib/project-members";
import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  getVenRolesForCurrentUser,
  getVenUserButtonProfileMode,
  isCurrentUserInventor,
  isCurrentUserProfessional,
} from "@/lib/ven-role.server";
import { loadWorkspaceProjectPickerForUser } from "@/lib/workspace-project-picker.server";
import {
  loadWorkspaceOrganizerBundlesForMember,
  loadWorkspaceOrganizerBundlesForOwner,
} from "@/lib/workspace-organizer-bundle.server";

type WorkspacePageProps = {
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

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const sp = await searchParams;
  const venRoles = await getVenRolesForCurrentUser();
  const hasInventor = await isCurrentUserInventor();
  const hasProfessional = await isCurrentUserProfessional();
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

  const { owned, joined } = await loadWorkspaceProjectPickerForUser(userId);
  const profileMode = await getVenUserButtonProfileMode();
  const projectTemplates = hasInventor
    ? await listPublishedTemplatesForPicker()
    : [];

  return (
    <WorkspacePageChrome profileMode={profileMode}>
      <WorkspaceDashboardShell
        owned={owned}
        joined={joined}
        currentUserId={userId}
        venRoles={venRoles}
        hasInventor={hasInventor}
        hasProfessional={hasProfessional}
        activeTab={activeTab}
        proOnboardingComplete={proOnboardingComplete}
        joinedProjectsCount={joinedProjects.length}
        bundles={bundles}
        professionalBundles={professionalBundles}
        projectsCount={projects.length}
        projectTemplates={projectTemplates}
      />
    </WorkspacePageChrome>
  );
}
