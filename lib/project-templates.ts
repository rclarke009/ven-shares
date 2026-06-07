import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  GRAPH_SKILL_CROSS_LINK_IDS,
  stdJourneyMilestoneId,
  type NodeDependenciesOverrides,
} from "@/lib/workspace-progress-graph";
import {
  stdSubtaskId,
  stdTaskId,
  stdTaskListId,
  WORKSPACE_PROGRESS_STANDARD_TEMPLATE,
  type WorkspaceProgressChecklist,
} from "@/lib/workspace-progress-checklist";

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

/** Collect all leaf node ids + titles from a checklist definition for dependency editor. */
export function collectLeafDefsFromChecklistDefinition(
  required: ProfessionalJobCategory[],
  definition: ChecklistDefinition,
): { id: string; title: string; category: string }[] {
  const leaves: { id: string; title: string; category: string }[] = [];
  for (const category of required) {
    const lists =
      getTaskListDefForCategory(definition, category) ??
      WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];
    for (let li = 0; li < lists.length; li++) {
      const tList = lists[li];
      for (let ti = 0; ti < tList.tasks.length; ti++) {
        const task = tList.tasks[ti];
        const subs = task.subtasks.length > 0 ? task.subtasks : [{ title: task.title }];
        for (let si = 0; si < subs.length; si++) {
          leaves.push({
            id: stdSubtaskId(category, li, ti, si),
            title: subs[si].title,
            category,
          });
        }
      }
    }
  }
  return leaves;
}
