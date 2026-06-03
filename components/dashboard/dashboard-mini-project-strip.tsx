"use client";

import Link from "next/link";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  categoryAbbrev,
  deriveProjectOverallStatus,
  miniStatusChipClasses,
  overallStatusDotClasses,
  overallStatusLabel,
  summarizeCategoryStatuses,
  type DashboardMiniProjectSummary,
} from "@/lib/dashboard-mini-status";

function storageKey(userId: string): string {
  return `ven-shares:dashboard-mini-strip-collapsed:${userId}`;
}

function readCollapsed(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeCollapsed(key: string, collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, collapsed ? "true" : "false");
  } catch {
    // Quota or private browsing — ignore
  }
}

type DashboardMiniProjectStripProps = {
  projects: DashboardMiniProjectSummary[];
  currentUserId: string;
};

export function DashboardMiniProjectStrip({
  projects,
  currentUserId,
}: DashboardMiniProjectStripProps) {
  const key = storageKey(currentUserId);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed(key));
    setHydrated(true);
  }, [key]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(key, next);
      return next;
    });
  }, [key]);

  if (projects.length === 0) return null;

  const isCollapsed = hydrated ? collapsed : false;

  return (
    <section className="mb-6" aria-label="Project overview">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-800">Overview</h2>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-expanded={!isCollapsed}
          aria-controls="dashboard-mini-project-strip"
        >
          {isCollapsed ? (
            <>
              Show overview
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </>
          ) : (
            <>
              Hide overview
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </button>
      </div>

      {isCollapsed ? null : (
        <div
          id="dashboard-mini-project-strip"
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1"
        >
          {projects.map((project) => {
            const overall = deriveProjectOverallStatus(project.categoryStatuses);
            const skillsSummary = summarizeCategoryStatuses(
              project.categoryStatuses,
            );
            const workspaceHref = `/idea-arena/${project.projectId}/workspace?tab=organizer`;
            const ariaLabel = `${project.projectTitle}. ${overallStatusLabel(overall)}. ${skillsSummary}. Open workspace.`;

            return (
              <Link
                key={project.projectId}
                href={workspaceHref}
                aria-label={ariaLabel}
                className="group shrink-0 snap-start w-[min(100%,160px)] min-w-[140px] rounded-lg border border-slate-200 bg-white shadow-sm p-3 transition-shadow hover:shadow-md hover:ring-2 hover:ring-sky-500/30 hover:ring-offset-1"
              >
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ring-1 ${overallStatusDotClasses(overall)}`}
                    title={overallStatusLabel(overall)}
                    aria-hidden
                  />
                  <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug min-w-0">
                    {project.projectTitle}
                  </h3>
                </div>
                {project.categoryStatuses.length > 0 ? (
                  <div className="flex flex-wrap gap-1" aria-hidden>
                    {project.categoryStatuses.map(({ category, status }) => (
                      <span
                        key={category}
                        title={category}
                        className={`inline-flex h-5 min-w-5 px-0.5 items-center justify-center rounded text-[8px] font-bold leading-none ${miniStatusChipClasses(status)}`}
                      >
                        {status === "complete" ? (
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        ) : (
                          categoryAbbrev(category)
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 leading-snug">
                    No skills listed
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
