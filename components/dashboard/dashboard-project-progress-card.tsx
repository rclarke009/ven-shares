import Link from "next/link";

import { WorkspaceOrganizerPanel } from "@/components/workspace/workspace-progress-panel";
import { countChecklistLeaves } from "@/lib/dashboard-progress-stats";
import type { WorkspaceOrganizerBundle } from "@/lib/workspace-organizer-bundle.server";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type DashboardProjectProgressCardProps = {
  bundle: WorkspaceOrganizerBundle;
  currentUserId: string;
  isProjectOwner?: boolean;
};

export function DashboardProjectProgressCard({
  bundle,
  currentUserId,
  isProjectOwner = true,
}: DashboardProjectProgressCardProps) {
  const { done, total } = countChecklistLeaves(bundle.checklist);
  const workspaceHref = `/workspace/${bundle.projectId}?tab=organizer`;
  const settingsHref = `/workspace/${bundle.projectId}?tab=settings`;

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <header className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            {bundle.projectTitle}
          </h2>
          <time
            dateTime={bundle.createdAt}
            className="text-xs text-slate-500 shrink-0"
          >
            {formatDate(bundle.createdAt)}
          </time>
        </div>
        {total > 0 ? (
          <p className="text-sm text-slate-600 mt-1">
            {done} / {total} tasks complete
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link
            href={workspaceHref}
            className="font-semibold text-[#15803d] hover:underline"
          >
            Open workspace
          </Link>
          {isProjectOwner ? (
            <Link
              href={settingsHref}
              className="font-medium text-slate-600 hover:text-[#22c55e] hover:underline"
            >
              Arena Card Details
            </Link>
          ) : null}
        </div>
      </header>
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <WorkspaceOrganizerPanel
          projectId={bundle.projectId}
          projectTitle={bundle.projectTitle}
          checklist={bundle.checklist}
          categoryStatuses={bundle.categoryStatuses}
          categoryCoverage={bundle.categoryCoverage}
          files={bundle.files}
          nameMap={bundle.nameMap}
          currentUserId={currentUserId}
          viewerCoveredCategories={bundle.viewerCoveredCategories}
          isProjectOwner={isProjectOwner}
        />
      </div>
    </article>
  );
}
