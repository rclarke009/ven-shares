"use client";

import { useEffect } from "react";

import { WorkspaceAppShell } from "@/components/workspace/workspace-app-shell";
import { WorkspaceDashboardPanel } from "@/components/workspace/workspace-dashboard-panel";
import { writeWorkspaceLastView } from "@/lib/workspace-last-view";
import type { PublishedTemplatePickerItem } from "@/lib/project-templates";
import type { WorkspaceOrganizerBundle } from "@/lib/workspace-organizer-bundle.server";
import type { WorkspacePickerProject } from "@/lib/workspace-project-picker.server";
import type { VenRole } from "@/lib/ven-role";

type WorkspaceDashboardShellProps = {
  owned: WorkspacePickerProject[];
  joined: WorkspacePickerProject[];
  currentUserId: string;
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

export function WorkspaceDashboardShell(props: WorkspaceDashboardShellProps) {
  const { currentUserId, owned, joined, ...panelProps } = props;

  useEffect(() => {
    writeWorkspaceLastView(currentUserId, "all");
  }, [currentUserId]);

  return (
    <WorkspaceAppShell
      owned={owned}
      joined={joined}
      activeProjectId={null}
      currentUserId={currentUserId}
    >
      <WorkspaceDashboardPanel userId={currentUserId} {...panelProps} />
    </WorkspaceAppShell>
  );
}
