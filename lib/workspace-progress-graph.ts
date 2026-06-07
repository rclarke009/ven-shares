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

export type WorkspaceProgressDependenciesJson = {
  milestones?: { id: string; completed: boolean }[];
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

export function parseWorkspaceProgressDependencies(
  raw: unknown,
): WorkspaceProgressDependenciesJson {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const milestonesRaw = o.milestones;
  if (!Array.isArray(milestonesRaw)) return {};
  const milestones: { id: string; completed: boolean }[] = [];
  for (const m of milestonesRaw) {
    if (!m || typeof m !== "object") continue;
    const mo = m as Record<string, unknown>;
    const id = typeof mo.id === "string" ? mo.id : "";
    if (!id) continue;
    milestones.push({ id, completed: mo.completed === true });
  }
  return { milestones };
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
): WorkspaceProgressDependenciesJson {
  return { milestones: state.milestones };
}

function milestoneCompleted(
  state: ProjectMilestoneState,
  id: string,
): boolean {
  return state.milestones.find((m) => m.id === id)?.completed ?? false;
}

function dependsOnForNode(id: string): string[] {
  return templateById.get(id)?.dependsOn ?? [];
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
): ProgressGraphView {
  const nodeMap = new Map<string, ResolvedProgressNode>();

  for (const def of MILESTONE_DEFS) {
    nodeMap.set(def.id, {
      id: def.id,
      kind: "milestone",
      title: def.title,
      description: def.description,
      completed: milestoneCompleted(milestoneState, def.id),
      dependsOn: [...def.dependsOn],
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
        dependsOn: dependsOnForNode(leaf.id),
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
): GraphToggleResult | null {
  const view = buildProgressGraph(checklist, milestoneState, required);
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
