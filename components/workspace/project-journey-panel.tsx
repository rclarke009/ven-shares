"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { actionProgressToggleGraphNode } from "@/app/idea-arena/[projectId]/workspace/actions";
import {
  applyGraphNodeCompleted,
  blockersMessage,
  buildProgressGraph,
  countProgressGraph,
  type ProgressGraphView,
  type ProjectMilestoneState,
  type ResolvedProgressNode,
} from "@/lib/workspace-progress-graph";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";

type ProjectJourneyPanelProps = {
  projectId: string;
  checklist: WorkspaceProgressChecklist;
  milestoneState: ProjectMilestoneState;
  requiredCategories: ProfessionalJobCategory[];
};

type MilestoneRowProps = {
  projectId: string;
  node: ResolvedProgressNode;
  expanded: boolean;
  pending: boolean;
  onToggleExpand: (nodeId: string) => void;
  onToggle: (nodeId: string, completed: boolean) => void;
};

function MilestoneRow({
  projectId,
  node,
  expanded,
  pending,
  onToggleExpand,
  onToggle,
}: MilestoneRowProps) {
  const checkboxId = `${projectId}-graph-${node.id}`;
  const blockerText = blockersMessage(node.blockers);

  return (
    <li
      className={`rounded-lg border ${
        node.locked
          ? "border-slate-100 bg-slate-50/80 opacity-75"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={node.completed}
          disabled={pending || node.locked}
          title={node.locked ? blockerText : undefined}
          aria-describedby={
            node.locked ? `${checkboxId}-blockers` : undefined
          }
          onChange={(e) => onToggle(node.id, e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#15803d] focus:ring-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => onToggleExpand(node.id)}
              className="flex min-w-0 flex-1 items-start gap-1.5 text-left"
              aria-expanded={expanded}
            >
              <ChevronDown
                className={`mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
                aria-hidden
              />
              <span
                className={`text-sm leading-snug font-medium ${node.locked ? "text-slate-400" : node.completed ? "text-slate-500 line-through" : "text-slate-800"}`}
              >
                {node.title}
              </span>
            </button>
            {node.locked ? (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-slate-100 text-slate-500">
                Locked
              </span>
            ) : node.completed ? (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-emerald-100 text-emerald-800">
                Done
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-sky-50 text-sky-800">
                Ready
              </span>
            )}
          </div>
          {node.locked && blockerText ? (
            <p
              id={`${checkboxId}-blockers`}
              className="mt-1 text-xs text-slate-400 pl-5"
            >
              {blockerText}
            </p>
          ) : null}
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-slate-100 px-3 py-2.5 pl-9 text-sm text-slate-600 leading-snug">
          {node.description ? <p>{node.description}</p> : null}
          {node.locked && node.blockers.length > 0 ? (
            <ul className="mt-2 list-disc pl-4 text-xs text-slate-500 space-y-0.5">
              {node.blockers.map((b) => (
                <li key={b.id}>Waiting on: {b.title}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function ProjectJourneyPanel({
  projectId,
  checklist,
  milestoneState,
  requiredCategories,
}: ProjectJourneyPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [localMilestones, setLocalMilestones] = useState(milestoneState);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setLocalChecklist(checklist);
    setLocalMilestones(milestoneState);
  }, [checklist, milestoneState]);

  const view = useMemo(
    () =>
      buildProgressGraph(localChecklist, localMilestones, requiredCategories),
    [localChecklist, localMilestones, requiredCategories],
  );

  const counts = useMemo(() => countProgressGraph(view), [view]);

  const nodeById = useMemo(
    () => new Map(view.nodes.map((n) => [n.id, n])),
    [view.nodes],
  );

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const toggleNode = useCallback(
    (nodeId: string, completed: boolean) => {
      setError(null);

      const snapshotChecklist = localChecklist;
      const snapshotMilestones = localMilestones;
      const result = applyGraphNodeCompleted(
        snapshotChecklist,
        snapshotMilestones,
        requiredCategories,
        nodeId,
        completed,
      );
      if (!result) {
        const node = view.nodes.find((n) => n.id === nodeId);
        setError(
          node ? blockersMessage(node.blockers) : "Could not update task.",
        );
        return;
      }

      setLocalChecklist(result.checklist);
      setLocalMilestones(result.milestoneState);

      startTransition(async () => {
        const actionResult = await actionProgressToggleGraphNode(
          projectId,
          nodeId,
          completed,
        );
        if (!actionResult.ok) {
          setLocalChecklist(snapshotChecklist);
          setLocalMilestones(snapshotMilestones);
          setError(
            "error" in actionResult && actionResult.error
              ? actionResult.error
              : "Something went wrong.",
          );
          return;
        }
        router.refresh();
      });
    },
    [
      localChecklist,
      localMilestones,
      requiredCategories,
      projectId,
      router,
      view.nodes,
    ],
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          VenShares project journey
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Track milestones and skill tasks in order. Locked items unlock when
          their prerequisites are complete.
        </p>
        <p className="text-sm font-medium text-slate-700 mt-2">
          {counts.done} / {counts.total} items complete
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {view.sections.map((section) => {
        const sectionNodes = section.nodeIds
          .map((id) => nodeById.get(id))
          .filter((n): n is ResolvedProgressNode => n !== undefined);

        if (sectionNodes.length === 0) return null;

        return (
          <section key={section.id} aria-labelledby={`${section.id}-heading`}>
            <h3
              id={`${section.id}-heading`}
              className="text-sm font-semibold text-slate-800 mb-2"
            >
              {section.title}
            </h3>
            <ul className="space-y-2">
              {sectionNodes.map((node) => (
                <MilestoneRow
                  key={node.id}
                  projectId={projectId}
                  node={node}
                  expanded={expandedNodes.has(node.id)}
                  pending={pending}
                  onToggleExpand={toggleExpand}
                  onToggle={toggleNode}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
