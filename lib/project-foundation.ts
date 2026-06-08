export type ProjectFoundationKey =
  | "problem_statement"
  | "vision"
  | "goals"
  | "target_customer"
  | "prior_knowledge"
  | "pitch_deck";

export type ProjectFoundation = Record<ProjectFoundationKey, string | null>;

export const PROJECT_FOUNDATION_FIELD_DEFS: {
  key: ProjectFoundationKey;
  formName: string;
  label: string;
  hint: string;
  placeholder: string;
  maxLength: number;
}[] = [
  {
    key: "problem_statement",
    formName: "foundation_problem_statement",
    label: "Problem statement",
    hint: "What pain or gap exists today?",
    placeholder:
      "e.g. Wheelchair users can only exercise pushing muscles, missing upper-body strength and cardio variety.",
    maxLength: 2000,
  },
  {
    key: "vision",
    formName: "foundation_vision",
    label: "Vision",
    hint: "What does success look like in 3–5 years?",
    placeholder:
      "e.g. A widely available push-and-pull wheelchair that gives users a full workout and safer hill climbs.",
    maxLength: 2000,
  },
  {
    key: "goals",
    formName: "foundation_goals",
    label: "Goals",
    hint: "Near-term milestones or metrics you are working toward.",
    placeholder:
      "e.g. Working prototype, 10 user tests, provisional patent filed by Q3.",
    maxLength: 2000,
  },
  {
    key: "target_customer",
    formName: "foundation_target_customer",
    label: "Target customer",
    hint: "Who is the primary user or buyer?",
    placeholder:
      "e.g. Active manual wheelchair users aged 25–55 who want fitness and outdoor mobility.",
    maxLength: 2000,
  },
  {
    key: "prior_knowledge",
    formName: "foundation_prior_knowledge",
    label: "Prior knowledge",
    hint: "Research, prototypes, patents, or domain experience you already have.",
    placeholder:
      "e.g. Mechanical engineering background, early CAD model, prior art search started.",
    maxLength: 2000,
  },
  {
    key: "pitch_deck",
    formName: "foundation_pitch_deck",
    label: "Pitch deck",
    hint: "Outline or key points from your deck. Upload the full file from workspace Files when ready.",
    placeholder:
      "e.g. Slide 1: Problem — … Slide 2: Solution — … Slide 3: Market size — …",
    maxLength: 2000,
  },
];

const FOUNDATION_KEYS: ProjectFoundationKey[] = PROJECT_FOUNDATION_FIELD_DEFS.map(
  (d) => d.key,
);

export const EMPTY_PROJECT_FOUNDATION: ProjectFoundation = {
  problem_statement: null,
  vision: null,
  goals: null,
  target_customer: null,
  prior_knowledge: null,
  pitch_deck: null,
};

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseProjectFoundationFromFormData(
  formData: FormData,
): ProjectFoundation {
  const out = { ...EMPTY_PROJECT_FOUNDATION };
  for (const def of PROJECT_FOUNDATION_FIELD_DEFS) {
    const raw = formData.get(def.formName);
    const text = typeof raw === "string" ? raw : "";
    const trimmed = trimToNull(text);
    if (trimmed && trimmed.length > def.maxLength) {
      out[def.key] = trimmed.slice(0, def.maxLength);
    } else {
      out[def.key] = trimmed;
    }
  }
  return out;
}

export function parseProjectFoundationFromDb(raw: unknown): ProjectFoundation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_PROJECT_FOUNDATION };
  }
  const o = raw as Record<string, unknown>;
  const out = { ...EMPTY_PROJECT_FOUNDATION };
  for (const key of FOUNDATION_KEYS) {
    const val = o[key];
    out[key] = typeof val === "string" ? trimToNull(val) : null;
  }
  return out;
}

export function projectFoundationToJson(
  foundation: ProjectFoundation,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const key of FOUNDATION_KEYS) {
    out[key] = foundation[key];
  }
  return out;
}

export function hasAnyFoundationContent(foundation: ProjectFoundation): boolean {
  return FOUNDATION_KEYS.some((key) => !!foundation[key]?.trim());
}
