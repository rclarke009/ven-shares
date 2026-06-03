import {
  PROFESSIONAL_JOB_CATEGORY_OPTIONS,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";

export type WorkspaceProgressSubtask = {
  id: string;
  title: string;
  standard: boolean;
  completed: boolean;
};

export type WorkspaceProgressTask = {
  id: string;
  title: string;
  standard: boolean;
  subtasks: WorkspaceProgressSubtask[];
};

export type WorkspaceProgressTaskList = {
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
  "Patent / IP law": [
    taskListFromMajor("Discovery & strategy", [
      "Review invention disclosure and prior art snapshot",
      "Confirm freedom-to-operate goals",
      "Outline IP strategy (patents, trade secrets, timing)",
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
      "Define KPIs and reporting cadence for investors",
      "Align entity structure with funding plan",
      "Prepare board / investor updates",
    ]),
  ],
  Accounting: [
    taskListFromMajor("Bookkeeping & controls", [
      "Set up chart of accounts and bookkeeping cadence",
      "Reconcile accounts and manage AP/AR",
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
      "Define ICP, messaging, and channel mix",
      "Create core assets (site, deck, one-pager)",
      "Set measurement plan and KPIs",
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
      "Define SLAs and escalation paths",
    ]),
    taskListFromMajor("Scale & quality", [
      "Monitor operational KPIs",
      "Run retros and continuous improvements",
      "Document runbooks for handoff",
    ]),
  ],
  "Design / UX": [
    taskListFromMajor("Research & IA", [
      "Synthesize user research and jobs-to-be-done",
      "Define information architecture and flows",
      "Establish design system / UI patterns",
    ]),
    taskListFromMajor("Delivery & validation", [
      "Produce high-fidelity mocks and prototypes",
      "Usability test and iterate",
      "Prepare assets for engineering handoff",
    ]),
  ],
  "Sales / business development": [
    taskListFromMajor("Pipeline & playbook", [
      "Define ICP, offer, and pricing narrative",
      "Build prospect lists and outreach sequences",
      "Create CRM stages and forecasting rules",
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
      "Build BOM, lead times, and MOQs",
      "Plan production schedule and inventory buffers",
    ]),
    taskListFromMajor("Quality & logistics", [
      "Define QC checkpoints and certifications",
      "Coordinate shipping, import/export, and warehousing",
      "Monitor cost and delivery performance",
    ]),
  ],
  "Software development": [
    taskListFromMajor("Foundation", [
      "Set up repo, CI/CD, and environments",
      "Implement core services and APIs",
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
      "Establish QMS / audit trail as needed",
      "Monitor law and standard updates",
      "Train team on policies and controls",
    ]),
  ],
};

function isProfessionalJobCategory(s: string): s is ProfessionalJobCategory {
  return (PROFESSIONAL_JOB_CATEGORY_OPTIONS as readonly string[]).includes(s);
}

function parseSubtask(raw: unknown): WorkspaceProgressSubtask | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const title = typeof o.title === "string" ? o.title : "";
  if (!id || !title) return null;
  return {
    id,
    title,
    standard: o.standard === true,
    completed: o.completed === true,
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
  return { id, title, standard: o.standard === true, subtasks };
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
  return { id, title, standard: o.standard === true, tasks };
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
    if (!isProfessionalJobCategory(key)) continue;
    const block = parseCategoryBlock(val);
    if (block) out[key] = block;
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
    for (const task of list.tasks) {
      const found = task.subtasks.find((s) => s.id === subtaskId);
      if (found) return found;
    }
  }
  return undefined;
}

export function collectLeavesForCategory(
  block: WorkspaceProgressCategoryBlock | undefined,
): WorkspaceProgressSubtask[] {
  if (!block?.taskLists?.length) return [];
  const out: WorkspaceProgressSubtask[] = [];
  for (const list of block.taskLists) {
    for (const task of list.tasks) {
      for (const sub of task.subtasks) {
        out.push(sub);
      }
    }
  }
  return out;
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

      const mergedTasks: WorkspaceProgressTask[] = [];

      for (let ti = 0; ti < tList.tasks.length; ti++) {
        const tTask = tList.tasks[ti];
        const taskId = stdTaskId(category, li, ti);
        const oldTask = oldTaskList?.tasks.find((t) => t.id === taskId);

        const mergedSubtasks: WorkspaceProgressSubtask[] = [];

        for (let si = 0; si < tTask.subtasks.length; si++) {
          const subtaskId = stdSubtaskId(category, li, ti, si);
          const oldSub =
            findSubtaskInBlock(existing, subtaskId) ??
            oldTask?.subtasks.find((s) => s.id === subtaskId);
          const defaultCompleted =
            !persisted && completedSet.has(category);
          mergedSubtasks.push({
            id: subtaskId,
            title: tTask.subtasks[si].title,
            standard: true,
            completed: oldSub ? oldSub.completed : defaultCompleted,
          });
        }

        if (oldTask) {
          for (const s of oldTask.subtasks) {
            if (!templateSubtaskIds.has(s.id)) {
              mergedSubtasks.push({ ...s });
            }
          }
        }

        mergedTasks.push({
          id: taskId,
          title: tTask.title,
          standard: true,
          subtasks: mergedSubtasks,
        });
      }

      if (oldTaskList) {
        for (const t of oldTaskList.tasks) {
          if (!templateTaskIds.has(t.id) && t.id.startsWith("cust:")) {
            mergedTasks.push({
              id: t.id,
              title: t.title,
              standard: false,
              subtasks: t.subtasks.map((s) => ({ ...s })),
            });
          }
        }
      }

      mergedTaskLists.push({
        id: taskListId,
        title: tList.title,
        standard: true,
        tasks: mergedTasks,
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
    for (const task of list.tasks) {
      const found = task.subtasks.find((s) => s.id === leafId);
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
    for (const task of list.tasks) {
      for (const sub of task.subtasks) {
        sub.completed = completed;
      }
    }
  }
  return next;
}
