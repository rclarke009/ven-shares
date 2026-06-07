"use server";

import { revalidatePath } from "next/cache";

import {
  parseChecklistDefinition,
  parseSuggestedSkills,
  parseTemplateDependencyOverrides,
  slugifyTemplateName,
} from "@/lib/project-templates";
import {
  deleteProjectTemplate,
  saveProjectTemplate,
} from "@/lib/project-templates.server";
import { assertSiteAdmin } from "@/lib/site-admin.server";

export type AdminTemplateActionState = {
  ok: boolean;
  error: string;
  id?: string;
};

function parseTemplateFormData(formData: FormData) {
  const id = (formData.get("id") as string)?.trim() || undefined;
  const name = (formData.get("name") as string)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string)?.trim() ?? "";
  const slug = slugRaw || slugifyTemplateName(name);
  const description = (formData.get("description") as string)?.trim() ?? "";
  const is_published = formData.get("is_published") === "on";
  const sort_order = Number.parseInt(
    (formData.get("sort_order") as string) ?? "0",
    10,
  );
  const categories = formData.getAll("categories").filter(
    (v): v is string => typeof v === "string",
  );

  let checklist_definition = {};
  let dependency_overrides = {};
  let suggested_skills: ReturnType<typeof parseSuggestedSkills> = [];

  const checklistJson = (formData.get("checklist_definition_json") as string)?.trim();
  if (checklistJson) {
    try {
      checklist_definition = parseChecklistDefinition(JSON.parse(checklistJson));
    } catch {
      return { ok: false as const, error: "Invalid checklist data." };
    }
  }

  const depsJson = (formData.get("dependency_overrides_json") as string)?.trim();
  if (depsJson) {
    try {
      dependency_overrides = parseTemplateDependencyOverrides(
        JSON.parse(depsJson),
      );
    } catch {
      return { ok: false as const, error: "Invalid dependency data." };
    }
  }

  const skillsJson = (formData.get("suggested_skills_json") as string)?.trim();
  if (skillsJson) {
    try {
      suggested_skills = parseSuggestedSkills(JSON.parse(skillsJson));
    } catch {
      return { ok: false as const, error: "Invalid suggested skills data." };
    }
  }

  return {
    ok: true as const,
    input: {
      id,
      name,
      slug,
      description,
      is_published,
      sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      required_job_categories: categories,
      checklist_definition,
      dependency_overrides,
      suggested_skills,
    },
  };
}

export async function actionSaveTemplate(
  _prev: AdminTemplateActionState,
  formData: FormData,
): Promise<AdminTemplateActionState> {
  await assertSiteAdmin();

  const parsed = parseTemplateFormData(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const result = await saveProjectTemplate(parsed.input);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${result.id}`);
  revalidatePath("/workspace");

  return { ok: true, error: "", id: result.id };
}

export async function actionDeleteTemplate(
  templateId: string,
): Promise<AdminTemplateActionState> {
  await assertSiteAdmin();

  const result = await deleteProjectTemplate(templateId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/templates");
  return { ok: true, error: "" };
}
