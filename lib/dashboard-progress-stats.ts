import {
  collectLeavesForCategory,
  type WorkspaceProgressChecklist,
} from "@/lib/workspace-progress-checklist";

export function countChecklistLeaves(
  checklist: WorkspaceProgressChecklist,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const block of Object.values(checklist)) {
    const leaves = collectLeavesForCategory(block);
    total += leaves.length;
    done += leaves.filter((l) => l.completed).length;
  }
  return { done, total };
}
