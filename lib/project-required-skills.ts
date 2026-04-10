const MAX_SKILL_ROWS = 10;
const MAX_SKILL_NAME_LEN = 120;
const MAX_SKILL_DESC_LEN = 500;

/** Persisted shape for `project_required_skills` rows (and Arena embed). */
export type ProjectRequiredSkill = {
  skill_name: string;
  skill_description: string;
  sort_order: number;
};

export type ParsedRequiredSkill = {
  skill_name: string;
  skill_description: string;
  sort_order: number;
};

/**
 * Reads paired skill_name / skill_description entries from FormData (same indices).
 */
export function parseRequiredSkillsFromFormData(
  formData: FormData,
): { ok: true; skills: ParsedRequiredSkill[] } | { ok: false; error: string } {
  const names = formData
    .getAll("skill_name")
    .filter((v): v is string => typeof v === "string");
  const descriptions = formData
    .getAll("skill_description")
    .filter((v): v is string => typeof v === "string");

  const n = Math.max(names.length, descriptions.length);
  const skills: ParsedRequiredSkill[] = [];

  for (let i = 0; i < n; i++) {
    const name = (names[i] ?? "").trim();
    const desc = (descriptions[i] ?? "").trim();
    if (!name && !desc) continue;
    if (!name) {
      return {
        ok: false,
        error: "Each skill needs a name when a description is filled in.",
      };
    }
    if (name.length > MAX_SKILL_NAME_LEN) {
      return { ok: false, error: "A skill name is too long." };
    }
    if (desc.length > MAX_SKILL_DESC_LEN) {
      return { ok: false, error: "A skill description is too long." };
    }
    skills.push({
      skill_name: name,
      skill_description: desc,
      sort_order: skills.length,
    });
    if (skills.length > MAX_SKILL_ROWS) {
      return {
        ok: false,
        error: `You can add at most ${MAX_SKILL_ROWS} skills.`,
      };
    }
  }

  return { ok: true, skills };
}
