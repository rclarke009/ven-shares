import {
  PROFESSIONAL_JOB_CATEGORY_OPTIONS,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";

export type WorkspaceProgressMinor = {
  id: string;
  title: string;
  standard: boolean;
  completed: boolean;
};

export type WorkspaceProgressMajor = {
  id: string;
  title: string;
  standard: boolean;
  minors: WorkspaceProgressMinor[];
};

export type WorkspaceProgressCategoryBlock = {
  majors: WorkspaceProgressMajor[];
};

/** Keyed by exact `ProfessionalJobCategory` string. */
export type WorkspaceProgressChecklist = Record<
  string,
  WorkspaceProgressCategoryBlock
>;

type TemplateMajor = { title: string; minors: { title: string }[] };

function categorySlug(category: ProfessionalJobCategory): string {
  return category.replace(/[^a-zA-Z0-9]+/g, "_");
}

export function stdMajorId(
  category: ProfessionalJobCategory,
  majorIndex: number,
): string {
  return `std:${categorySlug(category)}:M${majorIndex}`;
}

export function stdMinorId(
  category: ProfessionalJobCategory,
  majorIndex: number,
  minorIndex: number,
): string {
  return `std:${categorySlug(category)}:M${majorIndex}:m${minorIndex}`;
}

/** Default majors/minors per job category (stable ids derived from indices). */
export const WORKSPACE_PROGRESS_STANDARD_TEMPLATE: Record<
  ProfessionalJobCategory,
  TemplateMajor[]
> = {
  "Patent / IP law": [
    {
      title: "Discovery & strategy",
      minors: [
        { title: "Review invention disclosure and prior art snapshot" },
        { title: "Confirm freedom-to-operate goals" },
        { title: "Outline IP strategy (patents, trade secrets, timing)" },
      ],
    },
    {
      title: "Filing & prosecution",
      minors: [
        { title: "Draft and file patent application materials" },
        { title: "Respond to office actions / examiner updates" },
        { title: "Finalize claims aligned with product roadmap" },
      ],
    },
  ],
  "Engineering / product": [
    {
      title: "Requirements & architecture",
      minors: [
        { title: "Capture requirements and success metrics" },
        { title: "Define system architecture and interfaces" },
        { title: "Identify technical risks and mitigations" },
      ],
    },
    {
      title: "Build & validation",
      minors: [
        { title: "Implement core functionality and integrations" },
        { title: "Test and document performance / reliability" },
        { title: "Hand off artifacts for manufacturing or launch" },
      ],
    },
  ],
  "Finance / accounting": [
    {
      title: "Modeling & controls",
      minors: [
        { title: "Build financial model and key assumptions" },
        { title: "Set up bookkeeping / reporting cadence" },
        { title: "Review cash runway and funding needs" },
      ],
    },
    {
      title: "Compliance & close",
      minors: [
        { title: "Align tax and entity structure" },
        { title: "Support due diligence data room" },
        { title: "Close monthly / quarterly reporting" },
      ],
    },
  ],
  "Marketing / growth": [
    {
      title: "Positioning & audience",
      minors: [
        { title: "Define ICP, messaging, and channel mix" },
        { title: "Create core assets (site, deck, one-pager)" },
        { title: "Set measurement plan and KPIs" },
      ],
    },
    {
      title: "Launch & iteration",
      minors: [
        { title: "Run campaigns and experiments" },
        { title: "Optimize funnel and creative" },
        { title: "Report learnings to the team" },
      ],
    },
  ],
  Operations: [
    {
      title: "Process & systems",
      minors: [
        { title: "Map critical workflows and owners" },
        { title: "Implement tools for inventory / fulfillment / support" },
        { title: "Define SLAs and escalation paths" },
      ],
    },
    {
      title: "Scale & quality",
      minors: [
        { title: "Monitor operational KPIs" },
        { title: "Run retros and continuous improvements" },
        { title: "Document runbooks for handoff" },
      ],
    },
  ],
  "Design / UX": [
    {
      title: "Research & IA",
      minors: [
        { title: "Synthesize user research and jobs-to-be-done" },
        { title: "Define information architecture and flows" },
        { title: "Establish design system / UI patterns" },
      ],
    },
    {
      title: "Delivery & validation",
      minors: [
        { title: "Produce high-fidelity mocks and prototypes" },
        { title: "Usability test and iterate" },
        { title: "Prepare assets for engineering handoff" },
      ],
    },
  ],
  "Sales / business development": [
    {
      title: "Pipeline & playbook",
      minors: [
        { title: "Define ICP, offer, and pricing narrative" },
        { title: "Build prospect lists and outreach sequences" },
        { title: "Create CRM stages and forecasting rules" },
      ],
    },
    {
      title: "Close & expand",
      minors: [
        { title: "Run discovery and demos" },
        { title: "Negotiate terms and contracts" },
        { title: "Onboard customers and expansion plan" },
      ],
    },
  ],
  "Manufacturing / supply chain": [
    {
      title: "Sourcing & planning",
      minors: [
        { title: "Qualify suppliers and materials" },
        { title: "Build BOM, lead times, and MOQs" },
        { title: "Plan production schedule and inventory buffers" },
      ],
    },
    {
      title: "Quality & logistics",
      minors: [
        { title: "Define QC checkpoints and certifications" },
        { title: "Coordinate shipping, import/export, and warehousing" },
        { title: "Monitor cost and delivery performance" },
      ],
    },
  ],
  "Software development": [
    {
      title: "Foundation",
      minors: [
        { title: "Set up repo, CI/CD, and environments" },
        { title: "Implement core services and APIs" },
        { title: "Add observability, security basics, and backups" },
      ],
    },
    {
      title: "Ship & maintain",
      minors: [
        { title: "Complete features behind flags or releases" },
        { title: "Test, fix bugs, and document" },
        { title: "Operate releases and incident response" },
      ],
    },
  ],
  "Regulatory / compliance": [
    {
      title: "Scope & filings",
      minors: [
        { title: "Map applicable regulations and markets" },
        { title: "Prepare submissions / registrations" },
        { title: "Align labeling, claims, and evidence" },
      ],
    },
    {
      title: "Ongoing compliance",
      minors: [
        { title: "Establish QMS / audit trail as needed" },
        { title: "Monitor law and standard updates" },
        { title: "Train team on policies and controls" },
      ],
    },
  ],
};

function isProfessionalJobCategory(s: string): s is ProfessionalJobCategory {
  return (PROFESSIONAL_JOB_CATEGORY_OPTIONS as readonly string[]).includes(s);
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
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const majorsRaw = (val as Record<string, unknown>).majors;
    if (!Array.isArray(majorsRaw)) continue;
    const majors: WorkspaceProgressMajor[] = [];
    for (const m of majorsRaw) {
      if (!m || typeof m !== "object") continue;
      const mo = m as Record<string, unknown>;
      const id = typeof mo.id === "string" ? mo.id : "";
      const title = typeof mo.title === "string" ? mo.title : "";
      const standard = mo.standard === true;
      const minorsRaw = mo.minors;
      const minors: WorkspaceProgressMinor[] = [];
      if (Array.isArray(minorsRaw)) {
        for (const n of minorsRaw) {
          if (!n || typeof n !== "object") continue;
          const no = n as Record<string, unknown>;
          minors.push({
            id: typeof no.id === "string" ? no.id : crypto.randomUUID(),
            title: typeof no.title === "string" ? no.title : "",
            standard: no.standard === true,
            completed: no.completed === true,
          });
        }
      }
      if (id && title) {
        majors.push({ id, title, standard, minors });
      }
    }
    out[key] = { majors };
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
  const majors = (block as Record<string, unknown>).majors;
  return Array.isArray(majors) && majors.length > 0;
}

function collectTemplateMinorIds(
  category: ProfessionalJobCategory,
): Set<string> {
  const set = new Set<string>();
  const tmpl = WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];
  for (let mi = 0; mi < tmpl.length; mi++) {
    const majors = tmpl[mi];
    for (let mj = 0; mj < majors.minors.length; mj++) {
      set.add(stdMinorId(category, mi, mj));
    }
  }
  return set;
}

export function collectLeavesForCategory(
  block: WorkspaceProgressCategoryBlock | undefined,
): WorkspaceProgressMinor[] {
  if (!block?.majors?.length) return [];
  const out: WorkspaceProgressMinor[] = [];
  for (const maj of block.majors) {
    for (const min of maj.minors) {
      out.push(min);
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
    const templateMinorIds = collectTemplateMinorIds(category);
    const template = WORKSPACE_PROGRESS_STANDARD_TEMPLATE[category];

    const mergedMajors: WorkspaceProgressMajor[] = [];

    for (let mi = 0; mi < template.length; mi++) {
      const tMaj = template[mi];
      const majorId = stdMajorId(category, mi);
      const oldMajor = existing?.majors.find((m) => m.id === majorId);

      const mergedMinors: WorkspaceProgressMinor[] = [];

      for (let mj = 0; mj < tMaj.minors.length; mj++) {
        const minorId = stdMinorId(category, mi, mj);
        const oldMin = oldMajor?.minors.find((n) => n.id === minorId);
        const defaultCompleted =
          !persisted && completedSet.has(category);
        mergedMinors.push({
          id: minorId,
          title: tMaj.minors[mj].title,
          standard: true,
          completed: oldMin ? oldMin.completed : defaultCompleted,
        });
      }

      if (oldMajor) {
        for (const n of oldMajor.minors) {
          if (!templateMinorIds.has(n.id)) {
            mergedMinors.push({ ...n });
          }
        }
      }

      mergedMajors.push({
        id: majorId,
        title: tMaj.title,
        standard: true,
        minors: mergedMinors,
      });
    }

    if (existing?.majors?.length) {
      for (const maj of existing.majors) {
        if (maj.id.startsWith("cust:")) {
          mergedMajors.push({
            id: maj.id,
            title: maj.title,
            standard: false,
            minors: maj.minors.map((n) => ({ ...n })),
          });
        }
      }
    }

    next[category] = { majors: mergedMajors };
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
  for (const maj of block.majors) {
    const found = maj.minors.find((m) => m.id === leafId);
    if (found) {
      found.completed = completed;
      return next;
    }
  }
  return null;
}

export function addCustomMajor(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  title: string,
): WorkspaceProgressChecklist | null {
  const trimmed = title.trim();
  if (!trimmed) return null;
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  block.majors.push({
    id: `cust:${crypto.randomUUID()}`,
    title: trimmed,
    standard: false,
    minors: [],
  });
  return next;
}

export function addCustomMinor(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  majorId: string,
  title: string,
): WorkspaceProgressChecklist | null {
  const trimmed = title.trim();
  if (!trimmed) return null;
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  const major = block.majors.find((m) => m.id === majorId);
  if (!major) return null;
  major.minors.push({
    id: `cust:${crypto.randomUUID()}`,
    title: trimmed,
    standard: false,
    completed: false,
  });
  return next;
}

export function setAllLeavesInCategory(
  checklist: WorkspaceProgressChecklist,
  category: ProfessionalJobCategory,
  completed: boolean,
): WorkspaceProgressChecklist | null {
  const next = cloneChecklist(checklist);
  const block = next[category];
  if (!block) return null;
  for (const maj of block.majors) {
    for (const min of maj.minors) {
      min.completed = completed;
    }
  }
  return next;
}
