import type { WorkspaceOrganizerBundle } from "@/lib/workspace-organizer-bundle.server";
import { toMiniProjectSummaries } from "@/lib/dashboard-mini-status";

import { DashboardMiniProjectStrip } from "./dashboard-mini-project-strip";
import { DashboardProjectProgressCard } from "./dashboard-project-progress-card";

type DashboardProjectProgressStackProps = {
  bundles: WorkspaceOrganizerBundle[];
  currentUserId: string;
};

export function DashboardProjectProgressStack({
  bundles,
  currentUserId,
}: DashboardProjectProgressStackProps) {
  const miniSummaries = toMiniProjectSummaries(bundles);

  return (
    <>
      <DashboardMiniProjectStrip
        projects={miniSummaries}
        currentUserId={currentUserId}
      />
      <div className="flex flex-col gap-6">
        {bundles.map((bundle) => (
          <DashboardProjectProgressCard
            key={bundle.projectId}
            bundle={bundle}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </>
  );
}
