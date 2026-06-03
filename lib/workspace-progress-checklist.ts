import {
  resolveProfessionalJobCategory,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";

export type WorkspaceProgressArchivable = {
  archived_at?: string | null;
};

export type WorkspaceProgressSubtask = WorkspaceProgressArchivable & {
  id: string;
  title: string;
  standard: boolean;
  completed: boolean;
};

export type WorkspaceProgressLeaf = {
  id: string;
  title: string;
  completed: boolean;
};

export type WorkspaceProgressTask = WorkspaceProgressArchivable & {
  id: string;
  title: string;
  standard: boolean;
  completed: boolean;
  subtasks: WorkspaceProgressSubtask[];
};

export type WorkspaceProgressTaskList = WorkspaceProgressArchivable & {
  id: string;
  title: string;
  standard: boolean;
  tasks: WorkspaceProgressTask[];
};

export type WorkspaceProgressCategoryBlock = {
  taskLists: WorkspaceProgressTaskList[];
};

/** Keyed by exact `ProfessionalJobCategory` string. */
export type WorkspaceProgressChecklist = Record<
  string,
  WorkspaceProgressCategoryBlock
>;

type TemplateSubtask = { title: string };
type TemplateTask = { title: string; subtasks: TemplateSubtask[] };
type TemplateTaskList = { title: string; tasks: TemplateTask[] };

function categorySlug(category: ProfessionalJobCategory): string {
  return category.replace(/[^a-zA-Z0-9]+/g, "_");
}

export function stdTaskListId(
  category: ProfessionalJobCategory,
  listIndex: number,
): string {
  return `std:${categorySlug(category)}:M${listIndex}`;
}

export function stdTaskId(
  category: ProfessionalJobCategory,
  listIndex: number,
  taskIndex: number,
): string {
  return `std:${categorySlug(category)}:M${listIndex}:T${taskIndex}`;
}

/** Legacy-compatible subtask id for standard template rows (matches former minor ids). */
export function stdSubtaskId(
  category: ProfessionalJobCategory,
  listIndex: number,
  taskIndex: number,
  subIndex: number,
): string {
  if (subIndex === 0) {
    return `std:${categorySlug(category)}:M${listIndex}:m${taskIndex}`;
  }
  return `std:${categorySlug(category)}:M${listIndex}:T${taskIndex}:s${subIndex}`;
}

function taskFromMinorTitle(title: string): TemplateTask {
  return { title, subtasks: [{ title }] };
}

function taskListFromMajor(title: string, minorTitles: string[]): TemplateTaskList {
  return { title, tasks: minorTitles.map(taskFromMinorTitle) };
}

/** Default task lists / tasks / subtasks per job category (stable ids derived from indices). */
export const WORKSPACE_PROGRESS_STANDARD_TEMPLATE: Record<
  ProfessionalJobCategory,
  TemplateTaskList[]
> = {
  "Patent / IP (intellectual property) law": [
    taskListFromMajor("Discovery & strategy", [
      "Review invention disclosure and prior art snapshot",
      "Confirm freedom-to-operate goals",
      "Outline IP (intellectual property) strategy (patents, trade secrets, timing)",
    ]),
    taskListFromMajor("Filing & prosecution", [
      "Draft and file patent application materials",
      "Respond to office actions / examiner updates",
      "Finalize claims aligned with product roadmap",
    ]),
  ],
  "Engineering / product": [
    taskListFromMajor("Requirements & architecture", [
      "Capture requirements and success metrics",
      "Define system architecture and interfaces",
      "Identify technical risks and mitigations",
    ]),
    taskListFromMajor("Build & validation", [
      "Implement core functionality and integrations",
      "Test and document performance / reliability",
      "Hand off artifacts for manufacturing or launch",
    ]),
  ],
  Finance: [
    taskListFromMajor("Modeling & runway", [
      "Build financial model and key assumptions",
      "Review cash runway and funding needs",
      "Support due diligence data room",
    ]),
    taskListFromMajor("Strategy & reporting", [
      "Define KPIs (key performance indicators) and reporting cadence for investors",
      "Align entity structure with funding plan",
      "Prepare board / investor updates",
    ]),
  ],
  Accounting: [
    taskListFromMajor("Bookkeeping & controls", [
      "Set up chart of accounts and bookkeeping cadence",
      "Reconcile accounts and manage AP/AR (accounts payable / accounts receivable)",
      "Establish internal controls",
    ]),
    taskListFromMajor("Compliance & close", [
      "Align tax filings and entity compliance",
      "Close monthly / quarterly books",
      "Support audit and data-room requests",
    ]),
  ],
  "Marketing / growth": [
    taskListFromMajor("Positioning & audience", [
      "Define ICP (ideal customer profile), messaging, and channel mix",
      "Create core assets (site, deck, one-pager)",
      "Set measurement plan and KPIs (key performance indicators)",
    ]),
    taskListFromMajor("Launch & iteration", [
      "Run campaigns and experiments",
      "Optimize funnel and creative",
      "Report learnings to the team",
    ]),
  ],
  Operations: [
    taskListFromMajor("Process & systems", [
      "Map critical workflows and owners",
      "Implement tools for inventory / fulfillment / support",
      "Define SLAs (service-level agreements) and escalation paths",
    ]),
    taskListFromMajor("Scale & quality", [
      "Monitor operational KPIs (key performance indicators)",
      "Run retros and continuous improvements",
      "Document runbooks for handoff",
    ]),
  ],
  "Design / UX (user experience)": [
    taskListFromMajor("Research & IA (information architecture)", [
      "Synthesize user research and jobs-to-be-done",
      "Define information architecture and flows",
      "Establish design system / UI (user interface) patterns",
    ]),
    taskListFromMajor("Delivery & validation", [
      "Produce high-fidelity mocks and prototypes",
      "Usability test and iterate",
      "Prepare assets for engineering handoff",
    ]),
  ],
  "Sales / business development": [
    taskListFromMajor("Pipeline & playbook", [
      "Define ICP (ideal customer profile), offer, and pricing narrative",
      "Build prospect lists and outreach sequences",
      "Create CRM (customer relationship management) stages and forecasting rules",
    ]),
    taskListFromMajor("Close & expand", [
      "Run discovery and demos",
      "Negotiate terms and contracts",
      "Onboard customers and expansion plan",
    ]),
  ],
  "Manufacturing / supply chain": [
    taskListFromMajor("Sourcing & planning", [
      "Qualify suppliers and materials",
      "Build BOM (bill of materials), lead times, and MOQs (minimum order quantities)",
      "Plan production schedule and inventory buffers",
    ]),
    taskListFromMajor("Quality & logistics", [
      "Define QC (quality control) checkpoints and certifications",
      "Coordinate shipping, import/export, and warehousing",
      "Monitor cost and delivery performance",
    ]),
  ],
  "Software development": [
    taskListFromMajor("Foundation", [
      "Set up repo, CI/CD (continuous integration / deployment), and environments",
      "Implement core services and APIs (application programming interfaces)",
      "Add observability, security basics, and backups",
    ]),
    taskListFromMajor("Ship & maintain", [
      "Complete features behind flags or releases",
      "Test, fix bugs, and document",
      "Operate releases and incident response",
    ]),
  ],
  "Regulatory / compliance": [
    taskListFromMajor("Scope & filings", [
      "Map applicable regulations and markets",
      "Prepare submissions / registrations",
      "Align labeling, claims, and evidence",
    ]),
    taskListFromMajor("Ongoing compliance", [
      "Establish QMS (quality management system) / audit trail as needed",
      "Monitor law and standard updates",
      "Train team on policies and controls",
    ]),
  ],
};

export function isProgressItemArchived(
  item: WorkspaceProgressArchivable,
): boolean {
  return typeof item.archived_at === "string" && item.archived_at.length > 0;
}

function parseArchivedAt(raw: unknown): string | null {
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

function parseSubtask(raw: unknown): WorkspaceProgressSubtask | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const title = typeof o.title === "string" ? o.title : "";
  if (!id || !title) return null;
  const archived_at = parseArchivedAt(o.archived_at);
  return {
    id,
    title,
    standard: o.standard === true,
    completed: o.completed === true,
    ...(archived_at ? { archived_at } : {}),
  };
}

function parseTask(raw: unknown): WorkspaceProgressTask | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const title = typeof o.title === "string" ? o.title : "";
  if (!id || !title) return null;
  const subtasksRaw = o.subtasks;
  const subtasks: WorkspaceProgressSubtask[] = [];
  if (Array.isArray(subtasksRaw)) {
    for (const s of subtasksRaw) {
      const parsed = parseSubtask(s);
      if (parsed) subtasks.push(parsed);
    }
  }
  const archived_at = parseArchivedAt(o.archived_at);
  return {
    id,
    title,
    standard: o.standard === true,
    completed: o.completed === true,
    subtasks,
    ...(archived_at ? { archived_at } : {}),
  };
}

function parseTaskList(raw: unknown): WorkspaceProgressTaskList | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const title = typeof o.title === "string" ? o.title : "";
  if (!id || !title) return null;
  const tasksRaw = o.tasks;
  const tasks: WorkspaceProgressTask[] = [];
  if (Array.isArray(tasksRaw)) {
    for (const t of tasksRaw) {
      const parsed = parseTask(t);
      if (parsed) tasks.push(parsed);
    }
  }
  const archived_at = parseArchivedAt(o.archived_at);
  return {
    id,
    title,
    standard: o.standard === true,
    tasks,
    ...(archived_at ? { archived_at } : {}),
  };
}

/** Active (non-archived) task lists for UI and completion. */
export function filterActiveTaskLists(
  block: WorkspaceProgressCategoryBlock | undefined,
): WorkspaceProgressTaskList[] {
  if (!block?.taskLists?.length) return [];
  return block.taskLists
    .filter((list) => !isProgressItemArchived(list))
    .map((list) => ({
      ...list,
      tasks: list.tasks
        .filter((task) => !isProgressItemArchived(task))
        .map((task) => ({
          ...task,
          subtasks: task.subtasks.filter((s) => !isProgressItemArchived(s)),
        })),
    }));
}

export type ArchivedProgressEntry =
  | { kind: "taskList"; item: WorkspaceProgressTaskList; archived_at: string }
  | { kind: "task"; item: WorkspaceProgressTask; archived_at: string }
  | { kind: "subtask"; item: WorkspaceProgressSubtask; archived_at: string };

export function collectArchivedProgressEntries(
  block: WorkspaceProgressCategoryBlock | undefined,
): ArchivedProgressEntry[] {
  if (!block?.taskLists?.length) return [];
  const out: ArchivedProgressEntry[] = [];
  for (const list of block.taskLists) {
    if (isProgressItemArchived(list) && list.archived_at) {
      out.push({ kind: "taskList", item: list, archived_at: list.archived_at });
      continue;
    }
    for (const task of list.tasks) {
      if (isProgressItemArchived(task) && task.archived_at) {
        out.push({ kind: "task", item: task, archived_at: task.archived_at });
        continue;
      }
      for (const sub of task.subtasks) {
        if (isProgressItemArchived(sub) && sub.archived_at) {
          out.push({ kind: "subtask", item: sub, archived_at: sub.archived_at });
        }
      }
    }
  }
  out.sort(
    (a, b) =>
      new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime(),
  );
  return out;
}

function legacyMinorToTask(
  minor: {
    id: string;
    title: string;
    standard: boolean;
    completed: boolean;
  },
  minorIndex: number,
  listId: string,
): WorkspaceProgressTask {
  const taskId = minor.id.startsWith("std:")
    ? `${listId}:T${minorIndex}`
    : `cust:task:${minor.id}`;
  return {
    id: taskId,
    title: minor.title,
    standard: minor.standard,
    completed: false,
    subtasks: [
      {
        id: minor.id,
        title: minor.title,
        standard: minor.standard,
        completed: minor.completed,
      },
    ],
  };
}

function parseLegacyMajorsBlock(
  majorsRaw: unknown[],
): WorkspaceProgressTaskList[] {
  const taskLists: WorkspaceProgressTaskList[] = [];
  for (const m of majorsRaw) {
    if (!m || typeof m !== "object") continue;
    const mo = m as Record<string, unknown>;
    const id = typeof mo.id === "string" ? mo.id : "";
    const title = typeof mo.title === "string" ? mo.title : "";
    const standard = mo.standard === true;
    if (!id || !title) continue;

    const minorsRaw = mo.minors;
    const tasks: WorkspaceProgressTask[] = [];
    if (Array.isArray(minorsRaw)) {
      let minorIndex = 0;
      for (const n of minorsRaw) {
        if (!n || typeof n !== "object") continue;
        const no = n as Record<string, unknown>;
        const minor = {
          id: typeof no.id === "string" ? no.id : crypto.randomUUID(),
          title: typeof no.title === "string" ? no.title : "",
          standard: no.standard === true,
          completed: no.completed === true,
        };
        if (!minor.title) continue;
        tasks.push(legacyMinorToTask(minor, minorIndex, id));
        minorIndex++;
      }
    }
    taskLists.push({ id, title, standard, tasks });
  }
  return taskLists;
}

function parseCategoryBlock(val: unknown): WorkspaceProgressCategoryBlock | null {
  if (!val || typeof val !== "object" || Array.isArray(val)) return null;
  const block = val as Record<string, unknown>;

  const taskListsRaw = block.taskLists;
  if (Array.isArray(taskListsRaw)) {
    const taskLists: WorkspaceProgressTaskList[] = [];
    for (const tl of taskListsRaw) {
      const parsed = parseTaskList(tl);
      if (parsed) taskLists.push(parsed);
    }
    return { taskLists };
  }

  const majorsRaw = block.majors;
  if (Array.isArray(majorsRaw)) {
    return { taskLists: parseLegacyMajorsBlock(majorsRaw) };
  }

  return null;
}

export function parseWorkspaceProgressChecklist(
  raw: unknown,
): WorkspaceProgressChecklist {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: WorkspaceProgressChecklist = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const category = resolveProfessionalJobCategory(key);
    if (!category) continue;
    const block = parseCategoryBlock(val);
    if (block) out[category] = block;
  }
  return out;
}

function categoryHadPersistedData(
  raw: unknown,
  category: ProfessionalJobCategory,
): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const block = (raw as Record<string, unknown>)[category];
  if (!block || typeof block !== "object" || Array.isArray(block)) return false;
  const b = block as Record<string, unknown>;
  const taskLists = b.taskLists;
  if (Array.isArray(taskLists) && taskLists.length > 0) return true;
  const majors = b.majors;
  return Array.isArray(majors) && majors.length > 0;
}

function collectTemplateSubtaskIds(
  category: ProfessionalJobCategory,
): Set<string> {
  const set = new Set<string>();
  const tmpl = WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];
  for (let li = 0; li < tmpl.length; li++) {
    const list = tmpl[li];
    for (let ti = 0; ti < list.tasks.length; ti++) {
      const task = list.tasks[ti];
      for (let si = 0; si < task.subtasks.length; si++) {
        set.add(stdSubtaskId(category, li, ti, si));
      }
    }
  }
  return set;
}

function collectTemplateTaskIds(
  category: ProfessionalJobCategory,
): Set<string> {
  const set = new Set<string>();
  const tmpl = WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];
  for (let li = 0; li < tmpl.length; li++) {
    const list = tmpl[li];
    for (let ti = 0; ti < list.tasks.length; ti++) {
      set.add(stdTaskId(category, li, ti));
    }
  }
  return set;
}

function findSubtaskInBlock(
  block: WorkspaceProgressCategoryBlock | undefined,
  subtaskId: string,
): WorkspaceProgressSubtask | undefined {
  if (!block) return undefined;
  for (const list of block.taskLists) {
    if (isProgressItemArchived(list)) continue;
    for (const task of list.tasks) {
      if (isProgressItemArchived(task)) continue;
      const found = task.subtasks.find((s) => s.id === subtaskId);
      if (found && !isProgressItemArchived(found)) return found;
    }
  }
  return undefined;
}

export type ProgressItemStatus = "not_started" | "in_progress" | "completed";

export function collectLeavesForTask(
  task: WorkspaceProgressTask,
): WorkspaceProgressLeaf[] {
  if (isProgressItemArchived(task)) return [];
  const activeSubtasks = task.subtasks.filter((s) => !isProgressItemArchived(s));
  if (activeSubtasks.length === 0) {
    return [
      {
        id: task.id,
        title: task.title,
        completed: task.completed,
      },
    ];
  }
  return activeSubtasks.map((sub) => ({
    id: sub.id,
    title: sub.title,
    completed: sub.completed,
  }));
}

export function collectLeavesForTaskList(
  taskList: WorkspaceProgressTaskList,
): WorkspaceProgressLeaf[] {
  if (isProgressItemArchived(taskList)) return [];
  return taskList.tasks
    .filter((task) => !isProgressItemArchived(task))
    .flatMap((task) => collectLeavesForTask(task));
}

export function deriveProgressItemStatus(
  leaves: WorkspaceProgressLeaf[],
): ProgressItemStatus {
  if (leaves.length === 0) return "not_started";
  if (leaves.every((leaf) => leaf.completed)) return "completed";
  if (leaves.some((leaf) => leaf.completed)) return "in_progress";
  return "not_started";
}

export function deriveTaskListStatus(
  taskList: WorkspaceProgressTaskList,
): ProgressItemStatus {
  return deriveProgressItemStatus(collectLeavesForTaskList(taskList));
}

export function deriveTaskStatus(task: WorkspaceProgressTask): ProgressItemStatus {
  return deriveProgressItemStatus(collectLeavesForTask(task));
}

export function progressItemStatusLabel(status: ProgressItemStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    default:
      return "Not started";
  }
}

export function collectLeavesForCategory(
  block: WorkspaceProgressCategoryBlock | undefined,
): WorkspaceProgressLeaf[] {
  return filterActiveTaskLists(block).flatMap((list) =>
    collectLeavesForTaskList(list),
  );
}

export function categoryAllLeavesComplete(
  block: WorkspaceProgressCategoryBlock | undefined,
): boolean {
  const leaves = collectLeavesForCategory(block);
  if (leaves.length === 0) return false;
  return leaves.every((l) => l.completed);
}

export function categoryHasAnyLeafCompleted(
  block: WorkspaceProgressCategoryBlock | undefined,
): boolean {
  const leaves = collectLeavesForCategory(block);
  return leaves.some((l) => l.completed);
}

/** Ordered completed categories: subset of `required` where every leaf is checked. */
export function completedCategoriesFromChecklist(
  required: ProfessionalJobCategory[],
  checklist: WorkspaceProgressChecklist,
): ProfessionalJobCategory[] {
  return required.filter((c) =>
    categoryAllLeavesComplete(checklist[c]),
  );
}

function mergeSubtasksForStandardTask(
  category: ProfessionalJobCategory,
  listIndex: number,
  taskIndex: number,
  templateSubtasks: TemplateSubtask[],
  oldTask: WorkspaceProgressTask | undefined,
  existing: WorkspaceProgressCategoryBlock | undefined,
  templateSubtaskIds: Set<string>,
  persisted: boolean,
  completedSet: Set<ProfessionalJobCategory>,
): WorkspaceProgressSubtask[] {
  const templateById = new Map<string, WorkspaceProgressSubtask>();
  for (let si = 0; si < templateSubtasks.length; si++) {
    const subtaskId = stdSubtaskId(category, listIndex, taskIndex, si);
    const oldSub =
      findSubtaskInBlock(existing, subtaskId) ??
      oldTask?.subtasks.find((s) => s.id === subtaskId);
    const defaultCompleted = !persisted && completedSet.has(category);
    templateById.set(subtaskId, {
      id: subtaskId,
      title: templateSubtasks[si].title,
      standard: true,
      completed: oldSub ? oldSub.completed : defaultCompleted,
    });
  }

  const customById = new Map<string, WorkspaceProgressSubtask>();
  if (oldTask) {
    for (const s of oldTask.subtasks) {
      if (!templateSubtaskIds.has(s.id)) {
        customById.set(s.id, { ...s });
      }
    }
  }

  const ordered: WorkspaceProgressSubtask[] = [];
  const seen = new Set<string>();

  if (oldTask) {
    for (const s of oldTask.subtasks) {
      const merged = templateById.get(s.id) ?? customById.get(s.id);
      if (merged) {
        ordered.push(merged);
        seen.add(s.id);
      }
    }
  }

  for (let si = 0; si < templateSubtasks.length; si++) {
    const subtaskId = stdSubtaskId(category, listIndex, taskIndex, si);
    if (!seen.has(subtaskId)) {
      ordered.push(templateById.get(subtaskId)!);
      seen.add(subtaskId);
    }
  }

  for (const [id, sub] of customById) {
    if (!seen.has(id)) {
      ordered.push(sub);
      seen.add(id);
    }
  }

  return ordered;
}

function mergeTasksForStandardTaskList(
  category: ProfessionalJobCategory,
  listIndex: number,
  tList: TemplateTaskList,
  oldTaskList: WorkspaceProgressTaskList | undefined,
  existing: WorkspaceProgressCategoryBlock | undefined,
  templateSubtaskIds: Set<string>,
  templateTaskIds: Set<string>,
  persisted: boolean,
  completedSet: Set<ProfessionalJobCategory>,
): WorkspaceProgressTask[] {
  const mergedById = new Map<string, WorkspaceProgressTask>();

  for (let ti = 0; ti < tList.tasks.length; ti++) {
    const tTask = tList.tasks[ti];
    const taskId = stdTaskId(category, listIndex, ti);
    const oldTask = oldTaskList?.tasks.find((t) => t.id === taskId);
    mergedById.set(taskId, {
      id: taskId,
      title: tTask.title,
      standard: true,
      completed: false,
      subtasks: mergeSubtasksForStandardTask(
        category,
        listIndex,
        ti,
        tTask.subtasks,
        oldTask,
        existing,
        templateSubtaskIds,
        persisted,
        completedSet,
      ),
    });
  }

  const customById = new Map<string, WorkspaceProgressTask>();
  if (oldTaskList) {
    for (const t of oldTaskList.tasks) {
      if (!templateTaskIds.has(t.id) && t.id.startsWith("cust:")) {
        customById.set(t.id, {
          id: t.id,
          title: t.title,
          standard: false,
          completed: t.completed,
          subtasks: t.subtasks.map((s) => ({ ...s })),
        });
      }
    }
  }

  const ordered: WorkspaceProgressTask[] = [];
  const seen = new Set<string>();

  if (oldTaskList) {
    for (const t of oldTaskList.tasks) {
      let merged = mergedById.get(t.id) ?? customById.get(t.id);
      if (!merged) {
        merged = {
          id: t.id,
          title: t.title,
          standard: t.standard,
          completed: t.completed,
          subtasks: t.subtasks.map((s) => ({ ...s })),
        };
      }
      ordered.push(merged);
      seen.add(t.id);
    }
  }

  for (let ti = 0; ti < tList.tasks.length; ti++) {
    const taskId = stdTaskId(category, listIndex, ti);
    if (!seen.has(taskId)) {
      ordered.push(mergedById.get(taskId)!);
      seen.add(taskId);
    }
  }

  for (const [id, task] of customById) {
    if (!seen.has(id)) {
      ordered.push(task);
      seen.add(id);
    }
  }

  return ordered;
}

export function mergeChecklistWithTemplates(
  required: ProfessionalJobCategory[],
  rawFromDb: unknown,
  completedJobCategories: ProfessionalJobCategory[],
): WorkspaceProgressChecklist {
  const parsed = parseWorkspaceProgressChecklist(rawFromDb);
  const completedSet = new Set(completedJobCategories);

  const next: WorkspaceProgressChecklist = {};

  for (const category of required) {
    const existing = parsed[category];
    const persisted = categoryHadPersistedData(rawFromDb, category);
    const templateSubtaskIds = collectTemplateSubtaskIds(category);
    const templateTaskIds = collectTemplateTaskIds(category);
    const template = WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];

    const mergedTaskLists: WorkspaceProgressTaskList[] = [];

    for (let li = 0; li < template.length; li++) {
      const tList = template[li];
      const taskListId = stdTaskListId(category, li);
      const oldTaskList = existing?.taskLists.find((l) => l.id === taskListId);

      mergedTaskLists.push({
        id: taskListId,
        title: tList.title,
        standard: true,
        tasks: mergeTasksForStandardTaskList(
          category,
          li,
          tList,
          oldTaskList,
          existing,
          templateSubtaskIds,
          templateTaskIds,
          persisted,
          completedSet,
        ),
      });
    }

    if (existing?.taskLists?.length) {
      for (const list of existing.taskLists) {
        if (list.id.startsWith("cust:")) {
          mergedTaskLists.push({
            id: list.id,
            title: list.title,
            standard: false,
            tasks: list.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              standard: t.standard,
              completed: t.completed,
              subtasks: t.subtasks.map((s) => ({ ...s })),
            })),
          });
        }
      }
    }

    next[category] = { taskLists: mergedTaskLists };
  }

  return next;
}

export function checklistsEqual(
  a: WorkspaceProgressChecklist,
  b: WorkspaceProgressChecklist,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Keep only keys in `required` (same merge will re-add templates for new categories). */
export function trimChecklistToRequired(
  checklist: WorkspaceProgressChecklist,
  required: ProfessionalJobCategory[],
): WorkspaceProgressChecklist {
  const next: WorkspaceProgressChecklist = {};
  for (const c of required) {
    const block = checklist[c];
    if (block) next[c] = cloneChecklistBlock(block);
  }
  return next;
}

export function cloneChecklist(
  checklist: WorkspaceProgressChecklist,
): WorkspaceProgressChecklist {
  return JSON.parse(JSON.stringify(checklist)) as WorkspaceProgressChecklist;
}

function cloneChecklistBlock(
  block: WorkspaceProgressCategoryBlock,
): WorkspaceProgressCategoryBlock {
  return JSON.parse(JSON.stringify(block)) as WorkspaceProgressCategoryBlock;
}

export function setLeafCompleted(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  leafId: string,
  completed: boolean,
): WorkspaceProgressChecklist | null {
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  for (const list of block.taskLists) {
    if (isProgressItemArchived(list)) continue;
    for (const task of list.tasks) {
      if (isProgressItemArchived(task)) continue;
      const activeSubtasks = task.subtasks.filter(
        (s) => !isProgressItemArchived(s),
      );
      if (activeSubtasks.length === 0 && task.id === leafId) {
        task.completed = completed;
        return next;
      }
      const found = activeSubtasks.find((s) => s.id === leafId);
      if (found) {
        found.completed = completed;
        return next;
      }
    }
  }
  return null;
}

export function addCustomTaskList(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  title: string,
): WorkspaceProgressChecklist | null {
  const trimmed = title.trim();
  if (!trimmed) return null;
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  block.taskLists.push({
    id: `cust:${crypto.randomUUID()}`,
    title: trimmed,
    standard: false,
    tasks: [],
  });
  return next;
}

export function addCustomTask(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  taskListId: string,
  title: string,
): WorkspaceProgressChecklist | null {
  const trimmed = title.trim();
  if (!trimmed) return null;
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  const taskList = block.taskLists.find((l) => l.id === taskListId);
  if (!taskList) return null;
  taskList.tasks.push({
    id: `cust:${crypto.randomUUID()}`,
    title: trimmed,
    standard: false,
    completed: false,
    subtasks: [],
  });
  return next;
}

export function addCustomSubtask(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  taskId: string,
  title: string,
): WorkspaceProgressChecklist | null {
  const trimmed = title.trim();
  if (!trimmed) return null;
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  for (const list of block.taskLists) {
    const task = list.tasks.find((t) => t.id === taskId);
    if (!task) continue;
    if (task.subtasks.length === 0) {
      task.completed = false;
    }
    task.subtasks.push({
      id: `cust:${crypto.randomUUID()}`,
      title: trimmed,
      standard: false,
      completed: false,
    });
    return next;
  }
  return null;
}

export function setAllLeavesInCategory(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  completed: boolean,
): WorkspaceProgressChecklist | null {
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  for (const list of block.taskLists) {
    if (isProgressItemArchived(list)) continue;
    for (const task of list.tasks) {
      if (isProgressItemArchived(task)) continue;
      const activeSubtasks = task.subtasks.filter(
        (s) => !isProgressItemArchived(s),
      );
      if (activeSubtasks.length === 0) {
        task.completed = completed;
      } else {
        for (const sub of activeSubtasks) {
          sub.completed = completed;
        }
      }
    }
  }
  return next;
}

function arrayMoveByIndex<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  const [removed] = newArray.splice(from, 1);
  newArray.splice(to, 0, removed);
  return newArray;
}

export function moveTaskInCategory(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  taskId: string,
  targetTaskListId: string,
  targetIndex: number,
): WorkspaceProgressChecklist | null {
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;

  let sourceList: WorkspaceProgressTaskList | undefined;
  let task: WorkspaceProgressTask | undefined;
  let sourceIndex = -1;

  for (const list of block.taskLists) {
    const idx = list.tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      sourceList = list;
      task = list.tasks[idx];
      sourceIndex = idx;
      break;
    }
  }
  if (!task || !sourceList) return null;

  const targetList = block.taskLists.find((l) => l.id === targetTaskListId);
  if (!targetList) return null;

  const clampedTarget = Math.max(
    0,
    Math.min(targetIndex, targetList.tasks.length),
  );

  if (sourceList.id === targetList.id) {
    if (sourceIndex === clampedTarget) return null;
    sourceList.tasks = arrayMoveByIndex(
      sourceList.tasks,
      sourceIndex,
      clampedTarget,
    );
    return next;
  }

  sourceList.tasks.splice(sourceIndex, 1);
  const insertIndex = Math.max(
    0,
    Math.min(clampedTarget, targetList.tasks.length),
  );
  targetList.tasks.splice(insertIndex, 0, task);
  return next;
}

export function reorderSubtasksInTask(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  taskId: string,
  orderedSubtaskIds: string[],
): WorkspaceProgressChecklist | null {
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;

  for (const list of block.taskLists) {
    const task = list.tasks.find((t) => t.id === taskId);
    if (!task) continue;

    const byId = new Map(task.subtasks.map((s) => [s.id, s]));
    if (orderedSubtaskIds.length !== task.subtasks.length) return null;
    if (!orderedSubtaskIds.every((id) => byId.has(id))) return null;

    task.subtasks = orderedSubtaskIds.map((id) => byId.get(id)!);
    return next;
  }
  return null;
}

export type ProgressCustomItemKind = "taskList" | "task" | "subtask";

export function archiveCustomProgressItem(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  kind: ProgressCustomItemKind,
  itemId: string,
): WorkspaceProgressChecklist | null {
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;

  const now = new Date().toISOString();

  if (kind === "taskList") {
    const list = block.taskLists.find((l) => l.id === itemId);
    if (!list || list.standard) return null;
    if (isProgressItemArchived(list)) return next;
    list.archived_at = now;
    return next;
  }

  if (kind === "task") {
    for (const list of block.taskLists) {
      const task = list.tasks.find((t) => t.id === itemId);
      if (!task) continue;
      if (task.standard) return null;
      if (isProgressItemArchived(task)) return next;
      task.archived_at = now;
      return next;
    }
    return null;
  }

  for (const list of block.taskLists) {
    for (const task of list.tasks) {
      const sub = task.subtasks.find((s) => s.id === itemId);
      if (!sub) continue;
      if (sub.standard) return null;
      if (isProgressItemArchived(sub)) return next;
      sub.archived_at = now;
      return next;
    }
  }
  return null;
}

/** @deprecated Use archiveCustomProgressItem */
export const deleteCustomProgressItem = archiveCustomProgressItem;
