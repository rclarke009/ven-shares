"use client";

import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  actionProgressResetNodeDependencies,
  actionProgressSetNodeDependencies,
  actionProgressToggleGraphNode,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import {
  applyGraphNodeCompleted,
  applyNodeDependencies,
  blockersMessage,
  buildProgressGraph,
  countProgressGraph,
  getDefaultDependsOn,
  hasNodeDependencyOverride,
  resetNodeDependenciesOverride,
  type NodeDependenciesOverrides,
  type ProgressGraphSection,
  type ProgressGraphView,
  type ProjectMilestoneState,
  type ResolvedProgressNode,
} from "@/lib/workspace-progress-graph";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { journeyNodeDomId } from "@/lib/workspace-progress-flowchart-layout";

type ProjectJourneyPanelProps = {
  projectId: string;
  checklist: WorkspaceProgressChecklist;
  milestoneState: ProjectMilestoneState;
  nodeDependencies: NodeDependenciesOverrides;
  requiredCategories: ProfessionalJobCategory[];
};

type PrerequisitesEditorProps = {
  node: ResolvedProgressNode;
  view: ProgressGraphView;
  nodeDependencies: NodeDependenciesOverrides;
  pending: boolean;
  onSetDependencies: (nodeId: string, dependsOn: string[]) => void;
  onResetDependencies: (nodeId: string) => void;
};

function PrerequisitesEditor({
  node,
  view,
  nodeDependencies,
  pending,
  onSetDependencies,
  onResetDependencies,
}: PrerequisitesEditorProps) {
  const [selectedId, setSelectedId] = useState("");
  const nodeById = useMemo(
    () => new Map(view.nodes.map((n) => [n.id, n])),
    [view.nodes],
  );
  const hasOverride = hasNodeDependencyOverride(node.id, nodeDependencies);
  const defaultDeps = getDefaultDependsOn(node.id);
  const canReset = hasOverride;

  const candidateSections = useMemo(() => {
    const currentDeps = new Set(node.dependsOn);
    return view.sections
      .map((section) => ({
        ...section,
        nodeIds: section.nodeIds.filter(
          (id) => id !== node.id && !currentDeps.has(id),
        ),
      }))
      .filter((section) => section.nodeIds.length > 0);
  }, [view.sections, node.id, node.dependsOn]);

  const handleAdd = () => {
    const id = selectedId.trim();
    if (!id || node.dependsOn.includes(id)) return;
    onSetDependencies(node.id, [...node.dependsOn, id]);
    setSelectedId("");
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Prerequisites
        </p>
        {hasOverride ? (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
            Custom
          </span>
        ) : null}
      </div>

      {node.dependsOn.length === 0 ? (
        <p className="text-xs text-slate-400 mb-2">None — this item can start anytime.</p>
      ) : (
        <ul className="space-y-1 mb-2">
          {node.dependsOn.map((depId) => {
            const dep = nodeById.get(depId);
            return (
              <li
                key={depId}
                className="flex items-center justify-between gap-2 text-xs text-slate-600"
              >
                <span className="min-w-0 truncate">
                  {dep?.title ?? depId}
                  {dep?.completed ? (
                    <span className="ml-1 text-emerald-600">(done)</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    onSetDependencies(
                      node.id,
                      node.dependsOn.filter((d) => d !== depId),
                    )
                  }
                  className="shrink-0 text-[#15803d] hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {candidateSections.length > 0 ? (
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedId}
            disabled={pending}
            onChange={(e) => setSelectedId(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800 bg-white disabled:opacity-50"
            aria-label="Add prerequisite"
          >
            <option value="">Add prerequisite…</option>
            {candidateSections.map((section) => (
              <optgroup key={section.id} label={section.title}>
                {section.nodeIds.map((id) => {
                  const candidate = nodeById.get(id);
                  if (!candidate) return null;
                  return (
                    <option key={id} value={id}>
                      {candidate.title}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !selectedId}
            onClick={handleAdd}
            className="text-xs font-semibold text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
          >
            Add
          </button>
        </div>
      ) : null}

      {canReset ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => onResetDependencies(node.id)}
          className="mt-2 text-xs text-slate-500 hover:text-slate-700 hover:underline disabled:opacity-50"
        >
          Reset to defaults
          {defaultDeps.length > 0
            ? ` (${defaultDeps.length} built-in)`
            : " (no built-in prerequisites)"}
        </button>
      ) : null}
    </div>
  );
}

type MilestoneRowProps = {
  projectId: string;
  node: ResolvedProgressNode;
  view: ProgressGraphView;
  nodeDependencies: NodeDependenciesOverrides;
  expanded: boolean;
  highlighted: boolean;
  pending: boolean;
  onToggleExpand: (nodeId: string) => void;
  onToggle: (nodeId: string, completed: boolean) => void;
  onSetDependencies: (nodeId: string, dependsOn: string[]) => void;
  onResetDependencies: (nodeId: string) => void;
};

function MilestoneRow({
  projectId,
  node,
  view,
  nodeDependencies,
  expanded,
  highlighted,
  pending,
  onToggleExpand,
  onToggle,
  onSetDependencies,
  onResetDependencies,
}: MilestoneRowProps) {
  const checkboxId = `${projectId}-graph-${node.id}`;
  const blockerText = blockersMessage(node.blockers);

  return (
    <li
      id={journeyNodeDomId(node.id)}
      className={`rounded-lg border transition-shadow ${
        highlighted ? "ring-2 ring-[#15803d]/50 ring-offset-2" : ""
      } ${
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
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-slate-100 text-slate-500">
                Locked
              </span>
            ) : node.completed ? (
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-emerald-100 text-emerald-800">
                Done
              </span>
            ) : (
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-sky-50 text-sky-800">
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
          <PrerequisitesEditor
            node={node}
            view={view}
            nodeDependencies={nodeDependencies}
            pending={pending}
            onSetDependencies={onSetDependencies}
            onResetDependencies={onResetDependencies}
          />
        </div>
      ) : null}
    </li>
  );
}

export function ProjectJourneyPanel({
  projectId,
  checklist,
  milestoneState,
  nodeDependencies,
  requiredCategories,
}: ProjectJourneyPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [localMilestones, setLocalMilestones] = useState(milestoneState);
  const [localNodeDependencies, setLocalNodeDependencies] =
    useState(nodeDependencies);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setLocalChecklist(checklist);
    setLocalMilestones(milestoneState);
    setLocalNodeDependencies(nodeDependencies);
  }, [checklist, milestoneState, nodeDependencies]);

  const view = useMemo(
    () =>
      buildProgressGraph(
        localChecklist,
        localMilestones,
        requiredCategories,
        localNodeDependencies,
      ),
    [
      localChecklist,
      localMilestones,
      requiredCategories,
      localNodeDependencies,
    ],
  );

  const highlightParam = searchParams.get("node");

  useEffect(() => {
    if (!highlightParam) return;

    const node = view.nodes.find((n) => n.id === highlightParam);
    if (!node) return;

    const setupTimer = window.setTimeout(() => {
      setExpandedNodes((prev) => new Set(prev).add(highlightParam));
      setHighlightNodeId(highlightParam);

      requestAnimationFrame(() => {
        const el = document.getElementById(journeyNodeDomId(highlightParam));
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }, 0);

    const fadeTimer = window.setTimeout(() => {
      setHighlightNodeId(null);
    }, 3000);

    return () => {
      window.clearTimeout(setupTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [highlightParam, view.nodes]);

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
        localNodeDependencies,
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
      localNodeDependencies,
      requiredCategories,
      projectId,
      router,
      view.nodes,
    ],
  );

  const setNodeDependencies = useCallback(
    (nodeId: string, dependsOn: string[]) => {
      setError(null);
      const snapshot = localNodeDependencies;
      const next = applyNodeDependencies(snapshot, nodeId, dependsOn);
      setLocalNodeDependencies(next);

      startTransition(async () => {
        const actionResult = await actionProgressSetNodeDependencies(
          projectId,
          nodeId,
          dependsOn,
        );
        if (!actionResult.ok) {
          setLocalNodeDependencies(snapshot);
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
    [localNodeDependencies, projectId, router],
  );

  const resetNodeDependencies = useCallback(
    (nodeId: string) => {
      setError(null);
      const snapshot = localNodeDependencies;
      const next = resetNodeDependenciesOverride(snapshot, nodeId);
      setLocalNodeDependencies(next);

      startTransition(async () => {
        const actionResult = await actionProgressResetNodeDependencies(
          projectId,
          nodeId,
        );
        if (!actionResult.ok) {
          setLocalNodeDependencies(snapshot);
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
    [localNodeDependencies, projectId, router],
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          VenShares project journey
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Track milestones and skill tasks in order. Expand any item to set
          prerequisites. Locked items unlock when their prerequisites are
          complete.
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

      {view.sections.map((section: ProgressGraphSection) => {
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
                  view={view}
                  nodeDependencies={localNodeDependencies}
                  expanded={expandedNodes.has(node.id)}
                  highlighted={highlightNodeId === node.id}
                  pending={pending}
                  onToggleExpand={toggleExpand}
                  onToggle={toggleNode}
                  onSetDependencies={setNodeDependencies}
                  onResetDependencies={resetNodeDependencies}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
