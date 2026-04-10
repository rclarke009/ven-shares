"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  actionProgressAddCustomMajor,
  actionProgressAddCustomMinor,
  actionProgressSetCategoryLeaves,
  actionProgressToggleLeaf,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import type { ArenaCategorySlot } from "@/lib/projects-arena";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";
import { categoryAllLeavesComplete, collectLeavesForCategory } from "@/lib/workspace-progress-checklist";

function slotBadge(status: ArenaCategorySlot["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "complete":
      return {
        label: "Complete",
        className: "bg-emerald-100 text-emerald-900",
      };
    case "in_progress":
      return {
        label: "In progress",
        className: "bg-sky-100 text-sky-900",
      };
    default:
      return {
        label: "Needed",
        className: "bg-amber-100 text-amber-900",
      };
  }
}

type WorkspaceProgressPanelProps = {
  projectId: string;
  checklist: WorkspaceProgressChecklist;
  categoryStatuses: ArenaCategorySlot[];
};

export function WorkspaceProgressPanel({
  projectId,
  checklist,
  categoryStatuses,
}: WorkspaceProgressPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(
    () => new Set(categoryStatuses.map((s) => s.category)),
  );
  const [expandedMajors, setExpandedMajors] = useState<Set<string>>(
    () => new Set(),
  );
  const [newMajorTitle, setNewMajorTitle] = useState<Record<string, string>>(
    {},
  );
  const [newMinorTitle, setNewMinorTitle] = useState<Record<string, string>>(
    {},
  );

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const toggleSkill = useCallback((category: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const toggleMajor = useCallback((majorId: string) => {
    setExpandedMajors((prev) => {
      const next = new Set(prev);
      if (next.has(majorId)) next.delete(majorId);
      else next.add(majorId);
      return next;
    });
  }, []);

  const run = useCallback(
    (fn: () => Promise<{ ok: boolean; error?: string }>) => {
      setError(null);
      startTransition(() => {
        void (async () => {
          const result = await fn();
          if (!result.ok) {
            setError("error" in result && result.error ? result.error : "Something went wrong.");
            return;
          }
          refresh();
        })();
      });
    },
    [refresh],
  );

  const leafCounts = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const slot of categoryStatuses) {
      const leaves = collectLeavesForCategory(checklist[slot.category]);
      const total = leaves.length;
      const done = leaves.filter((l) => l.completed).length;
      map.set(slot.category, { done, total });
    }
    return map;
  }, [checklist, categoryStatuses]);

  if (categoryStatuses.length === 0) {
    return (
      <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-600">
        This project doesn’t list team skills yet. The inventor can add them
        from the dashboard.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {categoryStatuses.map((slot) => {
          const block = checklist[slot.category];
          const majors = block?.majors ?? [];
          const counts = leafCounts.get(slot.category) ?? { done: 0, total: 0 };
          const badge = slotBadge(slot.status);
          const skillOpen = expandedSkills.has(slot.category);
          const allDone = categoryAllLeavesComplete(block);

          return (
            <li
              key={slot.category}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleSkill(slot.category)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/80 transition-colors"
 aria-expanded={skillOpen}
              >
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${skillOpen ? "rotate-0" : "-rotate-90"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {slot.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {counts.total === 0
                      ? "No tasks yet"
                      : `${counts.done} / ${counts.total} tasks done`}
                  </p>
                </div>
              </button>

              {skillOpen ? (
                <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50/40">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending || counts.total === 0}
                      onClick={() =>
                        run(() =>
                          actionProgressSetCategoryLeaves(
                            projectId,
                            slot.category as ProfessionalJobCategory,
                            true,
                          ),
                        )
                      }
                      className="text-xs font-semibold rounded-md px-2.5 py-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Check all
                    </button>
                    <button
                      type="button"
                      disabled={pending || counts.total === 0}
                      onClick={() =>
                        run(() =>
                          actionProgressSetCategoryLeaves(
                            projectId,
                            slot.category as ProfessionalJobCategory,
                            false,
                          ),
                        )
                      }
                      className="text-xs font-semibold rounded-md px-2.5 py-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Clear all
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {majors.map((major) => {
                      const majorOpen = expandedMajors.has(major.id);
                      return (
                        <li
                          key={major.id}
                          className="rounded-xl border border-slate-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleMajor(major.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50/80 rounded-xl"
                            aria-expanded={majorOpen}
                          >
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${majorOpen ? "rotate-0" : "-rotate-90"}`}
                              aria-hidden
                            />
                            <span className="min-w-0">{major.title}</span>
                            {!major.standard ? (
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                Custom
                              </span>
                            ) : null}
                          </button>
                          {majorOpen ? (
                            <div className="border-t border-slate-100 px-3 py-2 space-y-2">
                              <ul className="space-y-1.5">
                                {major.minors.map((min) => (
                                  <li key={min.id} className="flex gap-2 items-start">
                                    <input
                                      type="checkbox"
                                      id={`${projectId}-${min.id}`}
                                      checked={min.completed}
                                      disabled={pending}
                                      onChange={(e) =>
                                        run(() =>
                                          actionProgressToggleLeaf(
                                            projectId,
                                            slot.category as ProfessionalJobCategory,
                                            min.id,
                                            e.target.checked,
                                          ),
                                        )
                                      }
                                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#15803d] focus:ring-[#15803d]"
                                    />
                                    <label
                                      htmlFor={`${projectId}-${min.id}`}
                                      className={`text-sm leading-snug cursor-pointer ${min.completed ? "text-slate-500 line-through" : "text-slate-800"}`}
                                    >
                                      {min.title}
                                    </label>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex gap-2 items-center pt-1">
                                <input
                                  type="text"
                                  value={newMinorTitle[major.id] ?? ""}
                                  onChange={(e) =>
                                    setNewMinorTitle((prev) => ({
                                      ...prev,
                                      [major.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add a task…"
                                  className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
                                />
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() => {
                                    const t = (newMinorTitle[major.id] ?? "").trim();
                                    if (!t) return;
                                    run(async () => {
                                      const r = await actionProgressAddCustomMinor(
                                        projectId,
                                        slot.category as ProfessionalJobCategory,
                                        major.id,
                                        t,
                                      );
                                      if (r.ok) {
                                        setNewMinorTitle((prev) => ({
                                          ...prev,
                                          [major.id]: "",
                                        }));
                                      }
                                      return r;
                                    });
                                  }}
                                  className="text-xs font-semibold text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-200/80">
                    <input
                      type="text"
                      value={newMajorTitle[slot.category] ?? ""}
                      onChange={(e) =>
                        setNewMajorTitle((prev) => ({
                          ...prev,
                          [slot.category]: e.target.value,
                        }))
                      }
                      placeholder="New major workstream…"
                      className="flex-1 min-w-48 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        const t = (newMajorTitle[slot.category] ?? "").trim();
                        if (!t) return;
                        run(async () => {
                          const r = await actionProgressAddCustomMajor(
                            projectId,
                            slot.category as ProfessionalJobCategory,
                            t,
                          );
                          if (r.ok) {
                            setNewMajorTitle((prev) => ({
                              ...prev,
                              [slot.category]: "",
                            }));
                          }
                          return r;
                        });
                      }}
                      className="text-xs font-semibold rounded-md px-2.5 py-1.5 bg-[#15803d] text-white hover:bg-[#166534] disabled:opacity-50"
                    >
                      Add major
                    </button>
                  </div>

                  {allDone && counts.total > 0 ? (
                    <p className="text-xs text-emerald-800 font-medium">
                      All tasks for this skill are done — the Idea Arena card
                      shows this slot as complete.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
