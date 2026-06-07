"use client";

import { useMemo, useState } from "react";

import {
  collectLeafDefsFromChecklistDefinition,
  isPlaceholderChecklistTitle,
  type ChecklistDefinition,
  type TemplateDependencyOverrides,
} from "@/lib/project-templates";
import { stdJourneyMilestoneId } from "@/lib/workspace-progress-graph";

const MILESTONE_OPTIONS = [
  { id: stdJourneyMilestoneId(0), title: "Idea submitted" },
  { id: stdJourneyMilestoneId(1), title: "IP and viability reviewed" },
  { id: stdJourneyMilestoneId(2), title: "Team assembled" },
  { id: stdJourneyMilestoneId(3), title: "Crowdfunding funded" },
  { id: stdJourneyMilestoneId(4), title: "Product built and launched" },
  { id: stdJourneyMilestoneId(5), title: "Business entity formed" },
];

const SUMMARY_CHIP_LIMIT = 3;

type TemplateDependenciesEditorProps = {
  categories: string[];
  checklistDefinition: ChecklistDefinition;
  overrides: TemplateDependencyOverrides;
  onChange: (next: TemplateDependencyOverrides) => void;
};

function SelectedSummaryChips({
  selected,
  titleById,
}: {
  selected: string[];
  titleById: Map<string, string>;
}) {
  if (selected.length === 0) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
        None
      </span>
    );
  }

  const visible = selected.slice(0, SUMMARY_CHIP_LIMIT);
  const rest = selected.length - visible.length;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {visible.map((id) => (
        <span
          key={id}
          className="rounded-full border border-[#22c55e]/30 bg-green-50 px-2 py-0.5 text-xs text-[#15803d]"
        >
          {titleById.get(id) ?? id}
        </span>
      ))}
      {rest > 0 ? (
        <span className="text-xs text-slate-500">+{rest} more</span>
      ) : null}
    </span>
  );
}

export function TemplateDependenciesEditor({
  categories,
  checklistDefinition,
  overrides,
  onChange,
}: TemplateDependenciesEditorProps) {
  const leaves = collectLeafDefsFromChecklistDefinition(
    categories as import("@/lib/professional-onboarding").ProfessionalJobCategory[],
    checklistDefinition,
  );

  const nodeDependencies = overrides.nodeDependencies ?? {};
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {},
  );

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of MILESTONE_OPTIONS) map.set(m.id, m.title);
    for (const leaf of leaves) map.set(leaf.id, leaf.label);
    return map;
  }, [leaves]);

  const leavesByCategory = useMemo(() => {
    const grouped = new Map<string, typeof leaves>();
    for (const leaf of leaves) {
      const list = grouped.get(leaf.category) ?? [];
      list.push(leaf);
      grouped.set(leaf.category, list);
    }
    return grouped;
  }, [leaves]);

  const categoriesWithLeaves = categories.filter(
    (cat) => (leavesByCategory.get(cat)?.length ?? 0) > 0,
  );

  function setDeps(nodeId: string, deps: string[]) {
    const next = { ...nodeDependencies, [nodeId]: deps };
    if (deps.length === 0) delete next[nodeId];
    onChange({ nodeDependencies: next });
  }

  function toggleDep(nodeId: string, depId: string) {
    const current = nodeDependencies[nodeId] ?? [];
    const next = current.includes(depId)
      ? current.filter((d) => d !== depId)
      : [...current, depId];
    setDeps(nodeId, next);
  }

  function expandAllCategories() {
    const next: Record<string, boolean> = {};
    for (const cat of categoriesWithLeaves) next[cat] = true;
    setOpenCategories(next);
  }

  function collapseAllCategories() {
    setOpenCategories({});
  }

  if (leaves.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Add checklist tasks on the Checklist tab to configure dependencies.
      </p>
    );
  }

  const otherLeaves = leaves;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Journey milestones are fixed for all templates. Set optional prerequisites
        for skill tasks below.
      </p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-700 mb-2">
          VenShares journey milestones
        </p>
        <ul className="text-xs text-slate-600 space-y-1">
          {MILESTONE_OPTIONS.map((m) => (
            <li key={m.id}>{m.title}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={expandAllCategories}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={collapseAllCategories}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
        >
          Collapse all
        </button>
      </div>

      <div className="space-y-3">
        {categoriesWithLeaves.map((category) => {
          const categoryLeaves = leavesByCategory.get(category) ?? [];
          return (
            <details
              key={category}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
              open={!!openCategories[category]}
              onToggle={(e) =>
                setOpenCategories((prev) => ({
                  ...prev,
                  [category]: e.currentTarget.open,
                }))
              }
            >
              <summary className="cursor-pointer px-4 py-3 font-medium text-slate-900">
                {category}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {categoryLeaves.length} task
                  {categoryLeaves.length === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="space-y-2 border-t border-slate-100 px-4 py-4">
                {categoryLeaves.map((leaf) => {
                  const selected = nodeDependencies[leaf.id] ?? [];
                  const taskMeta =
                    leaf.taskListTitle &&
                    leaf.taskListTitle !== leaf.title &&
                    !isPlaceholderChecklistTitle(leaf.taskListTitle)
                      ? leaf.taskListTitle
                      : null;

                  return (
                    <details
                      key={leaf.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/50"
                    >
                      <summary className="cursor-pointer px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-slate-900">
                            {leaf.title}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                            {selected.length === 0
                              ? "No prerequisites"
                              : `${selected.length} prerequisite${selected.length === 1 ? "" : "s"}`}
                          </span>
                        </div>
                        {taskMeta ? (
                          <p className="mt-0.5 text-xs text-slate-500">{taskMeta}</p>
                        ) : null}
                        <div className="mt-2">
                          <SelectedSummaryChips
                            selected={selected}
                            titleById={titleById}
                          />
                        </div>
                      </summary>
                      <div className="space-y-4 border-t border-slate-200 px-3 py-3">
                        <fieldset>
                          <legend className="mb-2 text-xs font-medium text-slate-700">
                            Journey milestones
                          </legend>
                          <ul className="space-y-1.5">
                            {MILESTONE_OPTIONS.map((opt) => {
                              const isOn = selected.includes(opt.id);
                              return (
                                <li key={opt.id}>
                                  <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                    <input
                                      type="checkbox"
                                      checked={isOn}
                                      onChange={() => toggleDep(leaf.id, opt.id)}
                                      className="mt-0.5 size-4 rounded border-slate-300 text-[#22c55e]"
                                    />
                                    <span>{opt.title}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </fieldset>
                        <fieldset>
                          <legend className="mb-2 text-xs font-medium text-slate-700">
                            Other skill tasks
                          </legend>
                          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                            <ul className="space-y-1.5">
                              {otherLeaves
                                .filter((opt) => opt.id !== leaf.id)
                                .map((opt) => {
                                  const isOn = selected.includes(opt.id);
                                  return (
                                    <li key={opt.id}>
                                      <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={isOn}
                                          onChange={() =>
                                            toggleDep(leaf.id, opt.id)
                                          }
                                          className="mt-0.5 size-4 rounded border-slate-300 text-[#22c55e]"
                                        />
                                        <span className="text-xs sm:text-sm">
                                          {opt.label}
                                        </span>
                                      </label>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        </fieldset>
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
