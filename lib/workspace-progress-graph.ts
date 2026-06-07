import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  collectLeavesForCategory,
  setLeafCompleted,
  stdSubtaskId,
  type WorkspaceProgressChecklist,
} from "@/lib/workspace-progress-checklist";

export const JOURNEY_SECTION_ID = "venShares-journey";

export function stdJourneyMilestoneId(index: number): string {
  return `std:journey:${index}`;
}

/** Curated skill leaf ids referenced by cross-links in the graph template. */
export const GRAPH_SKILL_CROSS_LINK_IDS = {
  financeEntityStructure: stdSubtaskId("Finance", 1, 1, 0),
  accountingEntityCompliance: stdSubtaskId("Accounting", 1, 0, 0),
  engineeringHandoff: stdSubtaskId("Engineering / product", 1, 2, 0),
} as const;

export type ProgressGraphNodeKind = "milestone" | "skill";

export type ProgressGraphNodeDef = {
  id: string;
  kind: ProgressGraphNodeKind;
  title: string;
  description?: string;
  category?: ProfessionalJobCategory;
  dependsOn: string[];
};

export type ResolvedProgressNode = {
  id: string;
  kind: ProgressGraphNodeKind;
  title: string;
  description?: string;
  category?: string;
  completed: boolean;
  dependsOn: string[];
  locked: boolean;
  blockers: { id: string; title: string }[];
};

export type ProgressGraphSection = {
  id: string;
  title: string;
  nodeIds: string[];
};

export type ProgressGraphView = {
  nodes: ResolvedProgressNode[];
  sections: ProgressGraphSection[];
};

export type ProjectMilestoneState = {
  milestones: { id: string; completed: boolean }[];
};

export type NodeDependenciesOverrides = Record<string, string[]>;

export type WorkspaceProgressDependenciesJson = {
  milestones?: { id: string; completed: boolean }[];
  /** When present for a nodeId, fully replaces template dependsOn for that node. */
  nodeDependencies?: NodeDependenciesOverrides;
};

export type ProjectDependenciesState = {
  milestoneState: ProjectMilestoneState;
  nodeDependencies: NodeDependenciesOverrides;
};

const MILESTONE_DEFS: Omit<ProgressGraphNodeDef, "kind">[] = [
  {
    id: stdJourneyMilestoneId(0),
    title: "Idea submitted",
    description:
      "Project is live on VenShares. Refine the description and upload supporting files as needed.",
    dependsOn: [],
  },
  {
    id: stdJourneyMilestoneId(1),
    title: "IP and viability reviewed",
    description:
      "Skilled professionals confirmed feasibility and an IP (intellectual property) protection path.",
    dependsOn: [stdJourneyMilestoneId(0)],
  },
  {
    id: stdJourneyMilestoneId(2),
    title: "Team assembled",
    description:
      "Contributors are on the team for the skills this project needs.",
    dependsOn: [stdJourneyMilestoneId(1)],
  },
  {
    id: stdJourneyMilestoneId(3),
    title: "Crowdfunding funded",
    description:
      "VenShares crowdfunding shows funded status — market acceptance confirmed.",
    dependsOn: [stdJourneyMilestoneId(2)],
  },
  {
    id: stdJourneyMilestoneId(4),
    title: "Product built and launched",
    description:
      "MVP or production build is shipped (requires team in place and funding).",
    dependsOn: [stdJourneyMilestoneId(2), stdJourneyMilestoneId(3)],
  },
  {
    id: stdJourneyMilestoneId(5),
    title: "Business entity formed",
    description:
      "EIN obtained, entity registered, and bank / accounting setup started.",
    dependsOn: [stdJourneyMilestoneId(3), stdJourneyMilestoneId(4)],
  },
];

/** Milestones + curated skill nodes with explicit cross-links. */
export const PROGRESS_GRAPH_TEMPLATE: ProgressGraphNodeDef[] = [
  ...MILESTONE_DEFS.map((m) => ({ ...m, kind: "milestone" as const })),
  {
    id: GRAPH_SKILL_CROSS_LINK_IDS.financeEntityStructure,
    kind: "skill",
    title: "Align entity structure with funding plan",
    category: "Finance",
    dependsOn: [stdJourneyMilestoneId(3)],
  },
  {
    id: GRAPH_SKILL_CROSS_LINK_IDS.accountingEntityCompliance,
    kind: "skill",
    title: "Align tax filings and entity compliance",
    category: "Accounting",
    dependsOn: [stdJourneyMilestoneId(5)],
  },
  {
    id: GRAPH_SKILL_CROSS_LINK_IDS.engineeringHandoff,
    kind: "skill",
    title: "Hand off artifacts for manufacturing or launch",
    category: "Engineering / product",
    dependsOn: [stdJourneyMilestoneId(4)],
  },
];

const templateById = new Map(
  PROGRESS_GRAPH_TEMPLATE.map((def) => [def.id, def]),
);

function parseNodeDependenciesFromRaw(
  raw: unknown,
): NodeDependenciesOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const result: NodeDependenciesOverrides = {};
  for (const [nodeId, depsRaw] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!nodeId || !Array.isArray(depsRaw)) continue;
    const deps: string[] = [];
    for (const d of depsRaw) {
      if (typeof d === "string" && d) deps.push(d);
    }
    result[nodeId] = deps;
  }
  return result;
}

export function parseNodeDependencies(raw: unknown): NodeDependenciesOverrides {
  return parseNodeDependenciesFromRaw(raw);
}

export function parseWorkspaceProgressDependencies(
  raw: unknown,
): WorkspaceProgressDependenciesJson {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const result: WorkspaceProgressDependenciesJson = {};

  const milestonesRaw = o.milestones;
  if (Array.isArray(milestonesRaw)) {
    const milestones: { id: string; completed: boolean }[] = [];
    for (const m of milestonesRaw) {
      if (!m || typeof m !== "object") continue;
      const mo = m as Record<string, unknown>;
      const id = typeof mo.id === "string" ? mo.id : "";
      if (!id) continue;
      milestones.push({ id, completed: mo.completed === true });
    }
    if (milestones.length > 0) result.milestones = milestones;
  }

  const nodeDeps = parseNodeDependenciesFromRaw(o.nodeDependencies);
  if (Object.keys(nodeDeps).length > 0) {
    result.nodeDependencies = nodeDeps;
  }

  return result;
}

export function parseProjectDependenciesState(
  raw: unknown,
  seedIdeaSubmitted: boolean,
): ProjectDependenciesState {
  const parsed = parseWorkspaceProgressDependencies(raw);
  return {
    milestoneState: mergeMilestoneState(raw, seedIdeaSubmitted),
    nodeDependencies: parsed.nodeDependencies ?? {},
  };
}

export function mergeMilestoneState(
  raw: unknown,
  seedIdeaSubmitted: boolean,
): ProjectMilestoneState {
  const parsed = parseWorkspaceProgressDependencies(raw);
  const byId = new Map<string, boolean>();
  for (const m of parsed.milestones ?? []) {
    byId.set(m.id, m.completed);
  }

  const milestones = MILESTONE_DEFS.map((def) => {
    const persisted = byId.get(def.id);
    if (persisted !== undefined) {
      return { id: def.id, completed: persisted };
    }
    if (def.id === stdJourneyMilestoneId(0) && seedIdeaSubmitted) {
      return { id: def.id, completed: true };
    }
    return { id: def.id, completed: false };
  });

  return { milestones };
}

export function milestoneStateToJson(
  state: ProjectMilestoneState,
  nodeDependencies: NodeDependenciesOverrides = {},
): WorkspaceProgressDependenciesJson {
  return dependenciesStateToJson({ milestoneState: state, nodeDependencies });
}

export function dependenciesStateToJson(
  state: ProjectDependenciesState,
): WorkspaceProgressDependenciesJson {
  const json: WorkspaceProgressDependenciesJson = {
    milestones: state.milestoneState.milestones,
  };
  if (Object.keys(state.nodeDependencies).length > 0) {
    json.nodeDependencies = state.nodeDependencies;
  }
  return json;
}

export function getDefaultDependsOn(
  nodeId: string,
  templateBaseOverrides?: NodeDependenciesOverrides,
): string[] {
  if (
    templateBaseOverrides &&
    Object.prototype.hasOwnProperty.call(templateBaseOverrides, nodeId)
  ) {
    return [...(templateBaseOverrides[nodeId] ?? [])];
  }
  return templateById.get(nodeId)?.dependsOn ?? [];
}

export function resolveDependsOn(
  nodeId: string,
  overrides: NodeDependenciesOverrides,
  templateBaseOverrides?: NodeDependenciesOverrides,
): string[] {
  if (Object.prototype.hasOwnProperty.call(overrides, nodeId)) {
    return [...(overrides[nodeId] ?? [])];
  }
  return getDefaultDependsOn(nodeId, templateBaseOverrides);
}

export function hasNodeDependencyOverride(
  nodeId: string,
  overrides: NodeDependenciesOverrides,
): boolean {
  return Object.prototype.hasOwnProperty.call(overrides, nodeId);
}

export function applyNodeDependencies(
  overrides: NodeDependenciesOverrides,
  nodeId: string,
  dependsOn: string[],
): NodeDependenciesOverrides {
  return { ...overrides, [nodeId]: [...dependsOn] };
}

export function resetNodeDependenciesOverride(
  overrides: NodeDependenciesOverrides,
  nodeId: string,
): NodeDependenciesOverrides {
  const next = { ...overrides };
  delete next[nodeId];
  return next;
}

export function stripNodeFromDependencies(
  overrides: NodeDependenciesOverrides,
  removedNodeId: string,
): NodeDependenciesOverrides {
  const next: NodeDependenciesOverrides = {};
  for (const [nodeId, deps] of Object.entries(overrides)) {
    if (nodeId === removedNodeId) continue;
    const filtered = deps.filter((d) => d !== removedNodeId);
    next[nodeId] = filtered;
  }
  return next;
}

function wouldCreateDependencyCycle(
  nodeIds: Set<string>,
  getDependsOn: (id: string) => string[],
  nodeId: string,
  newDependsOn: string[],
): boolean {
  for (const dep of newDependsOn) {
    if (dep === nodeId) return true;
    const visited = new Set<string>();
    const stack = [dep];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === nodeId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const next of getDependsOn(current)) {
        if (nodeIds.has(next)) stack.push(next);
      }
    }
  }
  return false;
}

export function validateNodeDependencies(
  view: ProgressGraphView,
  nodeId: string,
  dependsOn: string[],
  overrides: NodeDependenciesOverrides,
): { ok: true } | { ok: false; error: string } {
  const nodeIds = new Set(view.nodes.map((n) => n.id));
  if (!nodeIds.has(nodeId)) {
    return { ok: false, error: "Task not found." };
  }

  const uniqueDeps = [...new Set(dependsOn)];
  for (const depId of uniqueDeps) {
    if (depId === nodeId) {
      return { ok: false, error: "A task cannot depend on itself." };
    }
    if (!nodeIds.has(depId)) {
      return { ok: false, error: "Prerequisite not found." };
    }
  }

  const getDependsOn = (id: string) =>
    id === nodeId ? uniqueDeps : resolveDependsOn(id, overrides);

  if (wouldCreateDependencyCycle(nodeIds, getDependsOn, nodeId, uniqueDeps)) {
    return {
      ok: false,
      error: "That would create a circular dependency.",
    };
  }

  return { ok: true };
}

function milestoneCompleted(
  state: ProjectMilestoneState,
  id: string,
): boolean {
  return state.milestones.find((m) => m.id === id)?.completed ?? false;
}

function nodeMetaFromTemplate(id: string): ProgressGraphNodeDef | null {
  return templateById.get(id) ?? null;
}

function isMilestoneId(id: string): boolean {
  return id.startsWith("std:journey:");
}

export function findSkillCategoryForLeaf(
  checklist: WorkspaceProgressChecklist,
  required: ProfessionalJobCategory[],
  leafId: string,
): ProfessionalJobCategory | null {
  for (const category of required) {
    const block = checklist[category];
    if (!block) continue;
    const leaves = collectLeavesForCategory(block);
    if (leaves.some((l) => l.id === leafId)) return category;
  }
  return null;
}

export function buildProgressGraph(
  checklist: WorkspaceProgressChecklist,
  milestoneState: ProjectMilestoneState,
  required: ProfessionalJobCategory[],
  nodeDependencies: NodeDependenciesOverrides = {},
  templateBaseOverrides?: NodeDependenciesOverrides,
): ProgressGraphView {
  const nodeMap = new Map<string, ResolvedProgressNode>();

  for (const def of MILESTONE_DEFS) {
    nodeMap.set(def.id, {
      id: def.id,
      kind: "milestone",
      title: def.title,
      description: def.description,
      completed: milestoneCompleted(milestoneState, def.id),
      dependsOn: resolveDependsOn(
        def.id,
        nodeDependencies,
        templateBaseOverrides,
      ),
      locked: false,
      blockers: [],
    });
  }

  for (const category of required) {
    const block = checklist[category];
    if (!block) continue;
    for (const leaf of collectLeavesForCategory(block)) {
      const tmpl = nodeMetaFromTemplate(leaf.id);
      nodeMap.set(leaf.id, {
        id: leaf.id,
        kind: "skill",
        title: leaf.title,
        description: tmpl?.description,
        category,
        completed: leaf.completed,
        dependsOn: resolveDependsOn(
          leaf.id,
          nodeDependencies,
          templateBaseOverrides,
        ),
        locked: false,
        blockers: [],
      });
    }
  }

  const nodes = [...nodeMap.values()];

  for (const node of nodes) {
    const blockers: { id: string; title: string }[] = [];
    for (const depId of node.dependsOn) {
      const dep = nodeMap.get(depId);
      if (!dep) continue;
      if (!dep.completed) {
        blockers.push({ id: dep.id, title: dep.title });
      }
    }
    node.blockers = blockers;
    node.locked = blockers.length > 0;
  }

  const sections: ProgressGraphSection[] = [
    {
      id: JOURNEY_SECTION_ID,
      title: "VenShares journey",
      nodeIds: MILESTONE_DEFS.map((m) => m.id),
    },
  ];

  for (const category of required) {
    const block = checklist[category];
    if (!block) continue;
    const leaves = collectLeavesForCategory(block);
    if (leaves.length === 0) continue;
    sections.push({
      id: `skill:${category}`,
      title: category,
      nodeIds: leaves.map((l) => l.id),
    });
  }

  return { nodes, sections };
}

export function countProgressGraph(view: ProgressGraphView): {
  done: number;
  total: number;
} {
  const total = view.nodes.length;
  const done = view.nodes.filter((n) => n.completed).length;
  return { done, total };
}

export function getNodeFromGraph(
  view: ProgressGraphView,
  nodeId: string,
): ResolvedProgressNode | undefined {
  return view.nodes.find((n) => n.id === nodeId);
}

export function getTransitiveDependents(
  view: ProgressGraphView,
  nodeId: string,
): string[] {
  const dependents = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const node of view.nodes) {
      if (node.dependsOn.includes(current) && !dependents.has(node.id)) {
        dependents.add(node.id);
        queue.push(node.id);
      }
    }
  }
  return [...dependents];
}

export function blockersMessage(blockers: { title: string }[]): string {
  if (blockers.length === 0) return "";
  if (blockers.length === 1) {
    return `Complete “${blockers[0].title}” first.`;
  }
  const names = blockers.map((b) => `“${b.title}”`).join(", ");
  return `Complete ${names} first.`;
}

export type GraphToggleResult = {
  milestoneState: ProjectMilestoneState;
  checklist: WorkspaceProgressChecklist;
  toggledIds: string[];
};

export function applyGraphNodeCompleted(
  checklist: WorkspaceProgressChecklist,
  milestoneState: ProjectMilestoneState,
  required: ProfessionalJobCategory[],
  nodeId: string,
  completed: boolean,
  nodeDependencies: NodeDependenciesOverrides = {},
): GraphToggleResult | null {
  const view = buildProgressGraph(
    checklist,
    milestoneState,
    required,
    nodeDependencies,
  );
  const node = getNodeFromGraph(view, nodeId);
  if (!node) return null;

  if (completed && node.locked) {
    return null;
  }

  let nextMilestones = milestoneState.milestones.map((m) => ({ ...m }));
  let nextChecklist = JSON.parse(
    JSON.stringify(checklist),
  ) as WorkspaceProgressChecklist;
  const toggledIds: string[] = [];

  function setNode(id: string, value: boolean) {
    if (isMilestoneId(id)) {
      nextMilestones = nextMilestones.map((m) =>
        m.id === id ? { ...m, completed: value } : m,
      );
      if (!toggledIds.includes(id)) toggledIds.push(id);
      return;
    }
    const category = findSkillCategoryForLeaf(nextChecklist, required, id);
    if (!category) return;
    const updated = setLeafCompleted(nextChecklist, category, id, value);
    if (updated) {
      nextChecklist = updated;
      if (!toggledIds.includes(id)) toggledIds.push(id);
    }
  }

  setNode(nodeId, completed);

  if (!completed) {
    const freshView = buildProgressGraph(
      nextChecklist,
      { milestones: nextMilestones },
      required,
      nodeDependencies,
    );
    const dependents = getTransitiveDependents(freshView, nodeId);
    for (const depId of dependents) {
      setNode(depId, false);
    }
  }

  return {
    milestoneState: { milestones: nextMilestones },
    checklist: nextChecklist,
    toggledIds,
  };
}
