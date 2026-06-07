"use client";

import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { SkillTeamRoster } from "@/components/idea-arena/skill-team-roster";
import type { WorkspaceRosterEntryDTO } from "@/components/workspace/workspace-shell";
import type { ArenaCategoryCoverage } from "@/lib/arena-team-display";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  flowchartNodeCenter,
  flowchartNodeTopLeft,
  getMilestoneFlowchartDimensions,
  MILESTONE_FLOWCHART_EDGES,
  MILESTONE_FLOWCHART_NODES,
  MILESTONE_NODE_HEIGHT,
  MILESTONE_NODE_WIDTH,
  milestoneEdgePath,
} from "@/lib/workspace-progress-flowchart-layout";
import {
  blockersMessage,
  buildProgressGraph,
  countProgressGraph,
  JOURNEY_SECTION_ID,
  stdJourneyMilestoneId,
  type NodeDependenciesOverrides,
  type ProjectMilestoneState,
  type ResolvedProgressNode,
} from "@/lib/workspace-progress-graph";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";

type ProjectRoadmapPanelProps = {
  projectId: string;
  checklist: WorkspaceProgressChecklist;
  milestoneState: ProjectMilestoneState;
  nodeDependencies: NodeDependenciesOverrides;
  requiredCategories: ProfessionalJobCategory[];
  categoryCoverage: ArenaCategoryCoverage[];
  roster: WorkspaceRosterEntryDTO[];
};

function journeyHref(projectId: string, nodeId: string): string {
  const params = new URLSearchParams({
    tab: "journey",
    node: nodeId,
  });
  return `/workspace/${projectId}?${params.toString()}`;
}

function organizerHref(projectId: string, category: string): string {
  const params = new URLSearchParams({
    tab: "organizer",
    skill: category,
  });
  return `/workspace/${projectId}?${params.toString()}`;
}

function StatusBadge({ node }: { node: ResolvedProgressNode }) {
  if (node.locked) {
    return (
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-slate-100 text-slate-500">
        Locked
      </span>
    );
  }
  if (node.completed) {
    return (
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-emerald-100 text-emerald-800">
        Done
      </span>
    );
  }
  return (
    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-sky-50 text-sky-800">
      Ready
    </span>
  );
}

function CompletionMark({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
        aria-hidden
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-300"
      aria-hidden
    >
      <Circle className="h-3 w-3" />
    </span>
  );
}

function MilestoneFlowchart({
  projectId,
  nodes,
  roster,
  categoryCoverage,
}: {
  projectId: string;
  nodes: Map<string, ResolvedProgressNode>;
  roster: WorkspaceRosterEntryDTO[];
  categoryCoverage: ArenaCategoryCoverage[];
}) {
  const { width, height } = getMilestoneFlowchartDimensions();
  const teamAssembledId = stdJourneyMilestoneId(2);
  const coveredSkills = categoryCoverage.filter((c) => c.covered).length;
  const totalSkills = categoryCoverage.length;

  const edgePaths = useMemo(() => {
    return MILESTONE_FLOWCHART_EDGES.map(({ from, to }) => {
      const fromCenter = flowchartNodeCenter(from);
      const toCenter = flowchartNodeCenter(to);
      if (!fromCenter || !toCenter) return null;
      return {
        key: `${from}-${to}`,
        d: milestoneEdgePath(fromCenter, toCenter),
      };
    }).filter((p): p is { key: string; d: string } => p !== null);
  }, []);

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="relative min-w-max"
        style={{ width, height }}
        role="img"
        aria-label="VenShares journey milestone flowchart"
      >
        <svg
          className="pointer-events-none absolute inset-0 text-slate-300"
          width={width}
          height={height}
          aria-hidden
        >
          <defs>
            <marker
              id="roadmap-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
            </marker>
          </defs>
          {edgePaths.map(({ key, d }) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              markerEnd="url(#roadmap-arrow)"
            />
          ))}
        </svg>

        {MILESTONE_FLOWCHART_NODES.map((pos) => {
          const node = nodes.get(pos.id);
          if (!node) return null;
          const tl = flowchartNodeTopLeft(pos);
          const isTeamAssembled = pos.id === teamAssembledId;
          const memberNames = roster
            .filter((r) => r.role !== "owner")
            .slice(0, 3)
            .map((r) => r.display_name);

          return (
            <Link
              key={pos.id}
              href={journeyHref(projectId, pos.id)}
              className={`absolute flex flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-shadow hover:ring-2 hover:ring-[#15803d]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803d] ${
                node.locked
                  ? "border-slate-100 bg-slate-50/90 opacity-80"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
              style={{
                left: tl.x,
                top: tl.y,
                width: MILESTONE_NODE_WIDTH,
                minHeight: MILESTONE_NODE_HEIGHT,
              }}
            >
              <div className="flex items-start gap-2">
                <CompletionMark completed={node.completed} />
                <span
                  className={`text-xs font-semibold leading-snug ${
                    node.locked
                      ? "text-slate-400"
                      : node.completed
                        ? "text-slate-500 line-through"
                        : "text-slate-800"
                  }`}
                >
                  {node.title}
                </span>
              </div>
              <div className="pl-7">
                <StatusBadge node={node} />
              </div>
              {isTeamAssembled && totalSkills > 0 ? (
                <p className="pl-7 text-[11px] text-slate-500 leading-snug">
                  {coveredSkills}/{totalSkills} skills covered
                  {memberNames.length > 0
                    ? ` · ${memberNames.join(", ")}${roster.filter((r) => r.role !== "owner").length > memberNames.length ? "…" : ""}`
                    : ""}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SkillTaskCard({
  projectId,
  node,
}: {
  projectId: string;
  node: ResolvedProgressNode;
}) {
  const blockerText = blockersMessage(node.blockers);

  return (
    <Link
      href={journeyHref(projectId, node.id)}
      className={`block rounded-lg border px-3 py-2 transition-shadow hover:ring-2 hover:ring-[#15803d]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803d] ${
        node.locked
          ? "border-slate-100 bg-slate-50/80 opacity-75"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-2">
        <CompletionMark completed={node.completed} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span
              className={`text-xs font-medium leading-snug ${
                node.locked
                  ? "text-slate-400"
                  : node.completed
                    ? "text-slate-500 line-through"
                    : "text-slate-800"
              }`}
            >
              {node.title}
            </span>
            <StatusBadge node={node} />
          </div>
          {node.locked && blockerText ? (
            <p className="mt-1 text-[11px] text-slate-400">{blockerText}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function SkillSwimlane({
  projectId,
  sectionTitle,
  category,
  nodes,
  coverage,
  done,
  total,
}: {
  projectId: string;
  sectionTitle: string;
  category: string;
  nodes: ResolvedProgressNode[];
  coverage: ArenaCategoryCoverage | undefined;
  done: number;
  total: number;
}) {
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link
        href={organizerHref(projectId, category)}
        className="block border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#15803d]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{sectionTitle}</h3>
          <span className="text-xs text-slate-500">
            {done}/{total}
          </span>
        </div>
        <SkillTeamRoster
          teamLead={coverage?.teamLead ?? null}
          otherMembers={coverage?.otherMembers ?? []}
          variant="compact"
        />
      </Link>
      <ul className="flex flex-col gap-2 p-3">
        {nodes.map((node) => (
          <li key={node.id}>
            <SkillTaskCard projectId={projectId} node={node} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectRoadmapPanel({
  projectId,
  checklist,
  milestoneState,
  nodeDependencies,
  requiredCategories,
  categoryCoverage,
  roster,
}: ProjectRoadmapPanelProps) {
  const view = useMemo(
    () =>
      buildProgressGraph(
        checklist,
        milestoneState,
        requiredCategories,
        nodeDependencies,
      ),
    [checklist, milestoneState, requiredCategories, nodeDependencies],
  );

  const counts = useMemo(() => countProgressGraph(view), [view]);

  const nodeById = useMemo(
    () => new Map(view.nodes.map((n) => [n.id, n])),
    [view.nodes],
  );

  const coverageByCategory = useMemo(
    () => new Map(categoryCoverage.map((c) => [c.category, c])),
    [categoryCoverage],
  );

  const skillSections = view.sections.filter((s) => s.id !== JOURNEY_SECTION_ID);

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Project roadmap</h2>
        <p className="text-sm text-slate-600 mt-1">
          Visual overview of milestones and skill tasks. Click any item to open
          it in Journey or Organizer.
        </p>
        <p className="text-sm font-medium text-slate-700 mt-2">
          {counts.done} / {counts.total} items complete
        </p>
      </div>

      <section aria-labelledby="roadmap-milestones-heading">
        <h3
          id="roadmap-milestones-heading"
          className="text-sm font-semibold text-slate-800 mb-3"
        >
          VenShares journey
        </h3>
        <MilestoneFlowchart
          projectId={projectId}
          nodes={nodeById}
          roster={roster}
          categoryCoverage={categoryCoverage}
        />
      </section>

      {skillSections.length > 0 ? (
        <section aria-labelledby="roadmap-skills-heading">
          <h3
            id="roadmap-skills-heading"
            className="text-sm font-semibold text-slate-800 mb-3"
          >
            Skill tasks
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {skillSections.map((section) => {
              const sectionNodes = section.nodeIds
                .map((id) => nodeById.get(id))
                .filter((n): n is ResolvedProgressNode => n !== undefined);
              if (sectionNodes.length === 0) return null;

              const category = section.id.startsWith("skill:")
                ? section.id.slice("skill:".length)
                : section.title;
              const done = sectionNodes.filter((n) => n.completed).length;
              const total = sectionNodes.length;

              return (
                <SkillSwimlane
                  key={section.id}
                  projectId={projectId}
                  sectionTitle={section.title}
                  category={category}
                  nodes={sectionNodes}
                  coverage={coverageByCategory.get(
                    category as ProfessionalJobCategory,
                  )}
                  done={done}
                  total={total}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
