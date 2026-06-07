import { stdJourneyMilestoneId } from "@/lib/workspace-progress-graph";

export const MILESTONE_NODE_WIDTH = 148;
export const MILESTONE_NODE_HEIGHT = 88;
export const MILESTONE_GRID_GAP_X = 40;
export const MILESTONE_GRID_GAP_Y = 36;

export type FlowchartNodePosition = {
  id: string;
  col: number;
  row: number;
};

/** Fixed grid positions for the six VenShares journey milestones. */
export const MILESTONE_FLOWCHART_NODES: FlowchartNodePosition[] = [
  { id: stdJourneyMilestoneId(0), col: 0, row: 0 },
  { id: stdJourneyMilestoneId(1), col: 1, row: 0 },
  { id: stdJourneyMilestoneId(2), col: 2, row: 0 },
  { id: stdJourneyMilestoneId(3), col: 3, row: 0 },
  { id: stdJourneyMilestoneId(4), col: 3, row: 1 },
  { id: stdJourneyMilestoneId(5), col: 4, row: 0 },
];

export const MILESTONE_FLOWCHART_EDGES: { from: string; to: string }[] = [
  { from: stdJourneyMilestoneId(0), to: stdJourneyMilestoneId(1) },
  { from: stdJourneyMilestoneId(1), to: stdJourneyMilestoneId(2) },
  { from: stdJourneyMilestoneId(2), to: stdJourneyMilestoneId(3) },
  { from: stdJourneyMilestoneId(2), to: stdJourneyMilestoneId(4) },
  { from: stdJourneyMilestoneId(3), to: stdJourneyMilestoneId(5) },
  { from: stdJourneyMilestoneId(4), to: stdJourneyMilestoneId(5) },
];

const positionById = new Map(
  MILESTONE_FLOWCHART_NODES.map((node) => [node.id, node]),
);

export function journeyNodeDomId(nodeId: string): string {
  return `journey-node-${nodeId}`;
}

export function organizerSkillDomId(category: string): string {
  return `organizer-skill-${category}`;
}

export function flowchartNodeTopLeft(pos: FlowchartNodePosition): {
  x: number;
  y: number;
} {
  return {
    x: pos.col * (MILESTONE_NODE_WIDTH + MILESTONE_GRID_GAP_X),
    y: pos.row * (MILESTONE_NODE_HEIGHT + MILESTONE_GRID_GAP_Y),
  };
}

export function flowchartNodeCenter(nodeId: string): { x: number; y: number } | null {
  const pos = positionById.get(nodeId);
  if (!pos) return null;
  const tl = flowchartNodeTopLeft(pos);
  return {
    x: tl.x + MILESTONE_NODE_WIDTH / 2,
    y: tl.y + MILESTONE_NODE_HEIGHT / 2,
  };
}

/** SVG path between two milestone node centers (orthogonal routing). */
export function milestoneEdgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dy) < 4) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  if (dx > 0 && dy > 0) {
    const midY = from.y + dy / 2;
    return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
  }

  if (dx > 0 && dy < 0) {
    const midX = from.x + dx / 2;
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  }

  const midX = from.x + dx / 2;
  return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
}

export function getMilestoneFlowchartDimensions(): { width: number; height: number } {
  const maxCol = Math.max(...MILESTONE_FLOWCHART_NODES.map((n) => n.col));
  const maxRow = Math.max(...MILESTONE_FLOWCHART_NODES.map((n) => n.row));
  return {
    width:
      (maxCol + 1) * MILESTONE_NODE_WIDTH + maxCol * MILESTONE_GRID_GAP_X,
    height:
      (maxRow + 1) * MILESTONE_NODE_HEIGHT + maxRow * MILESTONE_GRID_GAP_Y,
  };
}

export function getMilestonePosition(nodeId: string): FlowchartNodePosition | undefined {
  return positionById.get(nodeId);
}
