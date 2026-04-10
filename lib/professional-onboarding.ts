/**
 * Clerk `publicMetadata` keys for skilled professional onboarding (post sign-up).
 * @see lib/onboarding-deferred.ts — uploads/legal steps stay deferred.
 */
export const PROFESSIONAL_ONBOARDING_COMPLETE_KEY =
  "professionalOnboardingComplete" as const;
export const PROFESSIONAL_JOB_CATEGORIES_KEY =
  "professionalJobCategories" as const;
export const PROFESSIONAL_HOURS_BAND_KEY = "professionalHoursBand" as const;

export const PROFESSIONAL_JOB_CATEGORY_OPTIONS = [
  "Patent / IP law",
  "Engineering / product",
  "Finance / accounting",
  "Marketing / growth",
  "Operations",
  "Design / UX",
  "Sales / business development",
  "Manufacturing / supply chain",
  "Software development",
  "Regulatory / compliance",
] as const;

export type ProfessionalJobCategory =
  (typeof PROFESSIONAL_JOB_CATEGORY_OPTIONS)[number];

export const PROFESSIONAL_HOURS_BANDS = [
  { value: "1-5", label: "1–5 hours" },
  { value: "5-10", label: "5–10 hours" },
  { value: "15-20", label: "15–20 hours" },
  { value: "25-30", label: "25–30 hours" },
  { value: "35-40", label: "35–40 hours" },
  { value: "all-in", label: "I'm all in" },
] as const;

export type ProfessionalHoursBandValue =
  (typeof PROFESSIONAL_HOURS_BANDS)[number]["value"];

const HOURS_VALUES = new Set<string>(
  PROFESSIONAL_HOURS_BANDS.map((b) => b.value),
);

export function isProfessionalOnboardingComplete(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return metadata?.[PROFESSIONAL_ONBOARDING_COMPLETE_KEY] === true;
}

export function isValidProfessionalHoursBand(
  value: unknown,
): value is ProfessionalHoursBandValue {
  return typeof value === "string" && HOURS_VALUES.has(value);
}

export function getProfessionalHoursBandFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ProfessionalHoursBandValue | null {
  const raw = metadata?.[PROFESSIONAL_HOURS_BAND_KEY];
  return isValidProfessionalHoursBand(raw) ? raw : null;
}

export function normalizeProfessionalJobCategories(
  selected: string[],
): ProfessionalJobCategory[] {
  const allowed = new Set<string>(PROFESSIONAL_JOB_CATEGORY_OPTIONS);
  const out: ProfessionalJobCategory[] = [];
  for (const s of selected) {
    if (allowed.has(s) && !out.includes(s as ProfessionalJobCategory)) {
      out.push(s as ProfessionalJobCategory);
    }
    if (out.length >= 5) break;
  }
  return out;
}
