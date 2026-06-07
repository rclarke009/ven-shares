"use client";

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

type TemplateDependenciesEditorProps = {
  categories: string[];
  checklistDefinition: ChecklistDefinition;
  overrides: TemplateDependencyOverrides;
  onChange: (next: TemplateDependencyOverrides) => void;
};

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
  const prerequisiteOptions = [
    ...MILESTONE_OPTIONS,
    ...leaves.map((l) => ({ id: l.id, title: l.label })),
  ];

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

  if (leaves.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Add checklist tasks on the Checklist tab to configure dependencies.
      </p>
    );
  }

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
      <ul className="space-y-3">
        {leaves.map((leaf) => {
          const selected = nodeDependencies[leaf.id] ?? [];
          return (
            <li
              key={leaf.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-900">{leaf.title}</p>
              <p className="text-xs text-slate-500 mb-2">
                {leaf.category}
                {leaf.taskListTitle &&
                leaf.taskListTitle !== leaf.title &&
                !isPlaceholderChecklistTitle(leaf.taskListTitle)
                  ? ` · ${leaf.taskListTitle}`
                  : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {prerequisiteOptions
                  .filter((opt) => opt.id !== leaf.id)
                  .map((opt) => {
                    const isOn = selected.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleDep(leaf.id, opt.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium border ${
                          isOn
                            ? "border-[#22c55e] bg-green-50 text-[#15803d]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {opt.title}
                      </button>
                    );
                  })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
