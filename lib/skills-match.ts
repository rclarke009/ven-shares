import {
  PROFESSIONAL_JOB_CATEGORIES_KEY,
  normalizeProfessionalJobCategories,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";

export function normalizeRequiredJobCategoriesFromDb(
  value: unknown,
): ProfessionalJobCategory[] {
  if (value == null) return [];
  const raw = Array.isArray(value) ? value : [];
  const strings = raw.filter((x): x is string => typeof x === "string");
  return normalizeProfessionalJobCategories(strings);
}

export function professionalCanJoinProject(
  professionalCategories: ProfessionalJobCategory[],
  requiredCategories: ProfessionalJobCategory[],
): boolean {
  if (requiredCategories.length === 0) return false;
  const profSet = new Set(professionalCategories);
  return requiredCategories.some((r) => profSet.has(r));
}

export type ProfessionalJoinSkillBlockReason =
  | "ok"
  | "no_required_skills"
  | "no_overlap";

export function getProfessionalJoinSkillBlockReason(
  professionalCategories: ProfessionalJobCategory[],
  requiredCategories: ProfessionalJobCategory[],
): ProfessionalJoinSkillBlockReason {
  if (requiredCategories.length === 0) return "no_required_skills";
  if (!professionalCanJoinProject(professionalCategories, requiredCategories)) {
    return "no_overlap";
  }
  return "ok";
}

export function getProfessionalJobCategoriesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ProfessionalJobCategory[] {
  const raw = metadata?.[PROFESSIONAL_JOB_CATEGORIES_KEY];
  if (!Array.isArray(raw)) return [];
  const strings = raw.filter((x): x is string => typeof x === "string");
  return normalizeProfessionalJobCategories(strings);
}
