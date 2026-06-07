import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  stdSubtaskId,
  stdTaskId,
  stdTaskListId,
  WORKSPACE_PROGRESS_STANDARD_TEMPLATE,
  type WorkspaceProgressChecklist,
} from "@/lib/workspace-progress-checklist";
import {
  GRAPH_SKILL_CROSS_LINK_IDS,
  stdJourneyMilestoneId,
  type NodeDependenciesOverrides,
} from "@/lib/workspace-progress-graph";

function templateCategorySlug(category: string): string {
  return category.replace(/[^a-zA-Z0-9]+/g, "_");
}

function buildListIndexMapAfterMove(
  length: number,
  fromIndex: number,
  toIndex: number,
): number[] {
  const order = Array.from({ length }, (_, i) => i);
  const [removed] = order.splice(fromIndex, 1);
  order.splice(toIndex, 0, removed);
  const map = new Array<number>(length);
  for (let newIdx = 0; newIdx < length; newIdx++) {
    map[order[newIdx]] = newIdx;
  }
  return map;
}

function remapStdNodeIdForCategoryListIndex(
  nodeId: string,
  category: string,
  indexMap: number[],
): string {
  const slug = templateCategorySlug(category);
  const prefix = `std:${slug}:M`;
  if (!nodeId.startsWith(prefix)) return nodeId;
  const rest = nodeId.slice(prefix.length);
  const match = /^(\d+)(.*)$/.exec(rest);
  if (!match) return nodeId;
  const oldLi = Number.parseInt(match[1], 10);
  const suffix = match[2];
  if (oldLi < 0 || oldLi >= indexMap.length) return nodeId;
  const newLi = indexMap[oldLi];
  return `${prefix}${newLi}${suffix}`;
}

/** Re-map checklist node ids after reordering milestone groups within a category. */
export function remapNodeDependenciesForTaskListReorder(
  category: string,
  fromIndex: number,
  toIndex: number,
  listCount: number,
  nodeDependencies: NodeDependenciesOverrides = {},
): NodeDependenciesOverrides {
  if (fromIndex === toIndex || listCount <= 1) return nodeDependencies;
  const indexMap = buildListIndexMapAfterMove(listCount, fromIndex, toIndex);
  const remapped: NodeDependenciesOverrides = {};
  for (const [nodeId, deps] of Object.entries(nodeDependencies)) {
    const newNodeId = remapStdNodeIdForCategoryListIndex(
      nodeId,
      category,
      indexMap,
    );
    remapped[newNodeId] = deps.map((depId) =>
      remapStdNodeIdForCategoryListIndex(depId, category, indexMap),
    );
  }
  return remapped;
}

export function moveTaskListsInOrder<T>(
  lists: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const next = [...lists];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export type TemplateSubtaskDef = { title: string };
export type TemplateTaskDef = { title: string; subtasks: TemplateSubtaskDef[] };
export type TemplateTaskListDef = { title: string; tasks: TemplateTaskDef[] };

export type ChecklistDefinition = Record<
  string,
  { taskLists: TemplateTaskListDef[] }
>;

export type TemplateSuggestedSkill = {
  skill_name: string;
  skill_description: string;
};

export type TemplateDependencyOverrides = {
  nodeDependencies?: NodeDependenciesOverrides;
};

export type ProjectTemplateRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_published: boolean;
  sort_order: number;
  required_job_categories: string[];
  checklist_definition: ChecklistDefinition;
  dependency_overrides: TemplateDependencyOverrides;
  suggested_skills: TemplateSuggestedSkill[];
  created_at: string;
  updated_at: string;
  updated_by_clerk_user_id: string | null;
};

export type PublishedTemplatePickerItem = Pick<
  ProjectTemplateRow,
  "id" | "slug" | "name" | "description" | "required_job_categories" | "suggested_skills"
>;

export const DEFAULT_TEMPLATE_SLUG = "general-startup";

export function slugifyTemplateName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function standardTemplateToChecklistDefinition(): ChecklistDefinition {
  const out: ChecklistDefinition = {};
  for (const [category, taskLists] of Object.entries(
    WORKSPACE_PROGRESS_STANDARD_TEMPLATE,
  )) {
    out[category] = {
      taskLists: taskLists.map((tl) => ({
        title: tl.title,
        tasks: tl.tasks.map((t) => ({
          title: t.title,
          subtasks: t.subtasks.map((s) => ({ title: s.title })),
        })),
      })),
    };
  }
  return out;
}

export function defaultDependencyOverrides(): TemplateDependencyOverrides {
  return {
    nodeDependencies: {
      [GRAPH_SKILL_CROSS_LINK_IDS.financeEntityStructure]: [
        stdJourneyMilestoneId(3),
      ],
      [GRAPH_SKILL_CROSS_LINK_IDS.accountingEntityCompliance]: [
        stdJourneyMilestoneId(5),
      ],
      [GRAPH_SKILL_CROSS_LINK_IDS.engineeringHandoff]: [
        stdJourneyMilestoneId(4),
      ],
    },
  };
}

export function parseChecklistDefinition(raw: unknown): ChecklistDefinition {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ChecklistDefinition = {};
  for (const [category, blockRaw] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!blockRaw || typeof blockRaw !== "object" || Array.isArray(blockRaw)) {
      continue;
    }
    const block = blockRaw as Record<string, unknown>;
    const listsRaw = block.taskLists;
    if (!Array.isArray(listsRaw)) continue;
    const taskLists: TemplateTaskListDef[] = [];
    for (const listRaw of listsRaw) {
      if (!listRaw || typeof listRaw !== "object") continue;
      const list = listRaw as Record<string, unknown>;
      const listTitle = typeof list.title === "string" ? list.title : "";
      if (!listTitle) continue;
      const tasksRaw = list.tasks;
      const tasks: TemplateTaskDef[] = [];
      if (Array.isArray(tasksRaw)) {
        for (const taskRaw of tasksRaw) {
          if (!taskRaw || typeof taskRaw !== "object") continue;
          const task = taskRaw as Record<string, unknown>;
          const taskTitle = typeof task.title === "string" ? task.title : "";
          if (!taskTitle) continue;
          const subtasksRaw = task.subtasks;
          const subtasks: TemplateSubtaskDef[] = [];
          if (Array.isArray(subtasksRaw)) {
            for (const subRaw of subtasksRaw) {
              if (!subRaw || typeof subRaw !== "object") continue;
              const sub = subRaw as Record<string, unknown>;
              const subTitle = typeof sub.title === "string" ? sub.title : "";
              if (subTitle) subtasks.push({ title: subTitle });
            }
          }
          if (subtasks.length === 0) subtasks.push({ title: taskTitle });
          tasks.push({ title: taskTitle, subtasks });
        }
      }
      if (tasks.length > 0) taskLists.push({ title: listTitle, tasks });
    }
    if (taskLists.length > 0) out[category] = { taskLists };
  }
  return out;
}

export function parseTemplateDependencyOverrides(
  raw: unknown,
): TemplateDependencyOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const nodeDepsRaw = o.nodeDependencies;
  if (!nodeDepsRaw || typeof nodeDepsRaw !== "object" || Array.isArray(nodeDepsRaw)) {
    return {};
  }
  const nodeDependencies: NodeDependenciesOverrides = {};
  for (const [nodeId, depsRaw] of Object.entries(
    nodeDepsRaw as Record<string, unknown>,
  )) {
    if (!nodeId || !Array.isArray(depsRaw)) continue;
    const deps = depsRaw.filter((d): d is string => typeof d === "string" && !!d);
    nodeDependencies[nodeId] = deps;
  }
  return { nodeDependencies };
}

export function parseSuggestedSkills(raw: unknown): TemplateSuggestedSkill[] {
  if (!Array.isArray(raw)) return [];
  const out: TemplateSuggestedSkill[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const skill_name = typeof o.skill_name === "string" ? o.skill_name : "";
    const skill_description =
      typeof o.skill_description === "string" ? o.skill_description : "";
    if (skill_name.trim()) {
      out.push({ skill_name: skill_name.trim(), skill_description });
    }
  }
  return out;
}

export function getTaskListDefForCategory(
  definition: ChecklistDefinition | null | undefined,
  category: ProfessionalJobCategory,
): TemplateTaskListDef[] | null {
  if (!definition) return null;
  const block = definition[category];
  if (!block?.taskLists?.length) return null;
  return block.taskLists;
}

/** Build a fresh checklist (all incomplete) from a template definition. */
export function buildInitialChecklistFromDefinition(
  required: ProfessionalJobCategory[],
  definition: ChecklistDefinition,
): WorkspaceProgressChecklist {
  const checklist: WorkspaceProgressChecklist = {};

  for (const category of required) {
    const taskListsDef =
      getTaskListDefForCategory(definition, category) ??
      WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];

    const taskLists = taskListsDef.map((tList, li) => ({
      id: stdTaskListId(category, li),
      title: tList.title,
      standard: true,
      tasks: tList.tasks.map((task, ti) => {
        const subtasks = task.subtasks.map((sub, si) => ({
          id: stdSubtaskId(category, li, ti, si),
          title: sub.title,
          standard: true,
          completed: false,
        }));
        return {
          id: stdTaskId(category, li, ti),
          title: task.title,
          standard: true,
          completed: false,
          subtasks,
        };
      }),
    }));

    checklist[category] = { taskLists };
  }

  return checklist;
}

const PLACEHOLDER_CHECKLIST_TITLES = new Set([
  "new task",
  "new subtask",
  "new milestone group",
]);

export function isPlaceholderChecklistTitle(title: string): boolean {
  return PLACEHOLDER_CHECKLIST_TITLES.has(title.trim().toLowerCase());
}

/** Prefer the task title when a single subtask still carries a placeholder name. */
export function effectiveChecklistLeafTitle(
  taskTitle: string,
  subtaskTitle: string,
  subtaskCount: number,
): string {
  if (subtaskCount === 1) {
    if (!isPlaceholderChecklistTitle(taskTitle)) return taskTitle;
    if (!isPlaceholderChecklistTitle(subtaskTitle)) return subtaskTitle;
    return taskTitle;
  }
  if (!isPlaceholderChecklistTitle(subtaskTitle)) {
    if (
      taskTitle !== subtaskTitle &&
      !isPlaceholderChecklistTitle(taskTitle)
    ) {
      return `${taskTitle} → ${subtaskTitle}`;
    }
    return subtaskTitle;
  }
  return taskTitle !== subtaskTitle
    ? `${taskTitle} → ${subtaskTitle}`
    : taskTitle;
}

export function formatChecklistLeafLabel(
  category: string,
  taskListTitle: string,
  taskTitle: string,
  subtaskTitle: string,
  subtaskCount: number,
): string {
  const leafTitle = effectiveChecklistLeafTitle(
    taskTitle,
    subtaskTitle,
    subtaskCount,
  );
  const parts = [category];
  if (
    taskListTitle &&
    !isPlaceholderChecklistTitle(taskListTitle) &&
    taskListTitle !== leafTitle
  ) {
    parts.push(taskListTitle);
  }
  parts.push(leafTitle);
  return parts.join(" › ");
}

export type ChecklistLeafDef = {
  id: string;
  category: string;
  taskListTitle: string;
  taskTitle: string;
  subtaskTitle: string;
  /** Primary display title for this leaf. */
  title: string;
  /** Full label for dependency picker pills. */
  label: string;
};

/** Standard task lists for one skill category (for admin seed / reset). */
export function getStandardTaskListsForCategory(
  category: string,
): TemplateTaskListDef[] | null {
  const lists =
    WORKSPACE_PROGRESS_STANDARD_TEMPLATE[
      category as ProfessionalJobCategory
    ];
  if (!lists) return null;
  return lists.map((tl) => ({
    title: tl.title,
    tasks: tl.tasks.map((t) => ({
      title: t.title,
      subtasks: t.subtasks.map((s) => ({ title: s.title })),
    })),
  }));
}

/** Collect all leaf node ids + titles from a checklist definition for dependency editor. */
export function collectLeafDefsFromChecklistDefinition(
  required: ProfessionalJobCategory[],
  definition: ChecklistDefinition,
): ChecklistLeafDef[] {
  const leaves: ChecklistLeafDef[] = [];
  for (const category of required) {
    const lists =
      getTaskListDefForCategory(definition, category) ??
      WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];
    for (let li = 0; li < lists.length; li++) {
      const tList = lists[li];
      for (let ti = 0; ti < tList.tasks.length; ti++) {
        const task = tList.tasks[ti];
        const subs =
          task.subtasks.length > 0 ? task.subtasks : [{ title: task.title }];
        for (let si = 0; si < subs.length; si++) {
          const subtaskTitle = subs[si].title;
          const title = effectiveChecklistLeafTitle(
            task.title,
            subtaskTitle,
            subs.length,
          );
          leaves.push({
            id: stdSubtaskId(category, li, ti, si),
            category,
            taskListTitle: tList.title,
            taskTitle: task.title,
            subtaskTitle,
            title,
            label: formatChecklistLeafLabel(
              category,
              tList.title,
              task.title,
              subtaskTitle,
              subs.length,
            ),
          });
        }
      }
    }
  }
  return leaves;
}
