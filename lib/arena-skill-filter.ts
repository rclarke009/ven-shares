import {
  PROFESSIONAL_JOB_CATEGORY_OPTIONS,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";
import type { ArenaProject } from "@/lib/projects-arena";
import {
  normalizeRequiredJobCategoriesFromDb,
  professionalCanJoinProject,
} from "@/lib/skills-match";

export type ArenaSkillFilterMode = "all" | "mine" | "need";

const CATEGORY_SET = new Set<string>(PROFESSIONAL_JOB_CATEGORY_OPTIONS);

export type ParsedArenaSkillFilter = {
  mode: ArenaSkillFilterMode;
  needCategories: ProfessionalJobCategory[];
};

function asStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Normalize one URL param value to a single mode (invalid → all). */
function parseSkillFilterMode(raw: string | string[] | undefined): ArenaSkillFilterMode {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "mine" || v === "need") return v;
  return "all";
}

export function parseArenaSkillFilterParams(
  sp: Record<string, string | string[] | undefined>,
): ParsedArenaSkillFilter {
  const mode = parseSkillFilterMode(sp.skillFilter);
  const needRaw = asStringArray(sp.needCat);
  const needCategories: ProfessionalJobCategory[] = [];
  for (const v of needRaw) {
    if (
      CATEGORY_SET.has(v) &&
      !needCategories.includes(v as ProfessionalJobCategory)
    ) {
      needCategories.push(v as ProfessionalJobCategory);
    }
  }
  return { mode, needCategories };
}

/** Non-professionals cannot use mine; coerce to all for filtering. */
export function effectiveArenaSkillFilter(
  parsed: ParsedArenaSkillFilter,
  isProfessional: boolean,
): ParsedArenaSkillFilter {
  if (parsed.mode === "mine" && !isProfessional) {
    return { mode: "all", needCategories: [] };
  }
  return parsed;
}

export function filterArenaProjectsBySkillMode<T extends ArenaProject>(
  projects: readonly T[],
  parsed: ParsedArenaSkillFilter,
  professionalCategories: ProfessionalJobCategory[],
): T[] {
  if (parsed.mode === "all") return [...projects];

  if (parsed.mode === "mine") {
    return projects.filter((p) => {
      const required = normalizeRequiredJobCategoriesFromDb(
        p.required_job_categories,
      );
      if (required.length === 0) return false;
      return professionalCanJoinProject(professionalCategories, required);
    });
  }

  if (parsed.needCategories.length === 0) return [];

  const needSet = new Set(parsed.needCategories);
  return projects.filter((p) => {
    const required = normalizeRequiredJobCategoriesFromDb(
      p.required_job_categories,
    );
    return required.some((c) => needSet.has(c));
  });
}

export function buildIdeaArenaSearchParams(opts: {
  selected?: string;
  skillFilter?: ArenaSkillFilterMode;
  needCategories?: ProfessionalJobCategory[];
}): URLSearchParams {
  const params = new URLSearchParams();
  if (opts.selected) params.set("selected", opts.selected);
  if (opts.skillFilter && opts.skillFilter !== "all") {
    params.set("skillFilter", opts.skillFilter);
  }
  for (const c of opts.needCategories ?? []) {
    params.append("needCat", c);
  }
  return params;
}

/** Query string for “Back to Idea Arena” / list links (no leading `?`). */
export function buildIdeaArenaQueryString(opts: {
  selected?: string;
  skillFilter?: ArenaSkillFilterMode;
  needCategories?: ProfessionalJobCategory[];
}): string {
  return buildIdeaArenaSearchParams(opts).toString();
}
