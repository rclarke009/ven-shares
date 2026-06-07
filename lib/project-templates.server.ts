import "server-only";

import { auth } from "@clerk/nextjs/server";

import {
  normalizeProjectRequiredJobCategories,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import {
  DEFAULT_TEMPLATE_SLUG,
  defaultDependencyOverrides,
  parseChecklistDefinition,
  parseSuggestedSkills,
  parseTemplateDependencyOverrides,
  standardTemplateToChecklistDefinition,
  type ChecklistDefinition,
  type ProjectTemplateRow,
  type PublishedTemplatePickerItem,
  type TemplateDependencyOverrides,
  type TemplateSuggestedSkill,
} from "@/lib/project-templates";

function mapTemplateRow(row: Record<string, unknown>): ProjectTemplateRow {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    is_published: row.is_published === true,
    sort_order:
      typeof row.sort_order === "number" && Number.isFinite(row.sort_order)
        ? row.sort_order
        : 0,
    required_job_categories: Array.isArray(row.required_job_categories)
      ? row.required_job_categories.filter((x): x is string => typeof x === "string")
      : [],
    checklist_definition: parseChecklistDefinition(row.checklist_definition),
    dependency_overrides: parseTemplateDependencyOverrides(
      row.dependency_overrides,
    ),
    suggested_skills: parseSuggestedSkills(row.suggested_skills),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    updated_by_clerk_user_id:
      typeof row.updated_by_clerk_user_id === "string"
        ? row.updated_by_clerk_user_id
        : null,
  };
}

export async function ensureDefaultProjectTemplate(): Promise<ProjectTemplateRow | null> {
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("project_templates")
    .select("id")
    .eq("slug", DEFAULT_TEMPLATE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    return loadProjectTemplateById(existing.id as string);
  }

  const allCategories = Object.keys(
    standardTemplateToChecklistDefinition(),
  ) as ProfessionalJobCategory[];

  const { data: inserted, error } = await supabase
    .from("project_templates")
    .insert({
      slug: DEFAULT_TEMPLATE_SLUG,
      name: "General startup",
      description:
        "Default VenShares template with standard tasks across all skill categories.",
      is_published: true,
      sort_order: 0,
      required_job_categories: allCategories,
      checklist_definition: standardTemplateToChecklistDefinition(),
      dependency_overrides: defaultDependencyOverrides(),
      suggested_skills: [],
    })
    .select("*")
    .single();

  if (error || !inserted) {
    console.log("MYDEBUG →", error?.message);
    return null;
  }

  return mapTemplateRow(inserted as Record<string, unknown>);
}

export async function listPublishedTemplatesForPicker(): Promise<
  PublishedTemplatePickerItem[]
> {
  await ensureDefaultProjectTemplate();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_templates")
    .select(
      "id, slug, name, description, required_job_categories, suggested_skills",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      slug: r.slug as string,
      name: r.name as string,
      description: (r.description as string) ?? "",
      required_job_categories: Array.isArray(r.required_job_categories)
        ? r.required_job_categories.filter(
            (x): x is string => typeof x === "string",
          )
        : [],
      suggested_skills: parseSuggestedSkills(r.suggested_skills),
    };
  });
}

export async function listAllProjectTemplates(): Promise<ProjectTemplateRow[]> {
  await ensureDefaultProjectTemplate();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.log("MYDEBUG →", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapTemplateRow(row as Record<string, unknown>),
  );
}

export async function loadProjectTemplateById(
  id: string,
): Promise<ProjectTemplateRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.log("MYDEBUG →", error?.message);
    return null;
  }

  return mapTemplateRow(data as Record<string, unknown>);
}

export async function loadPublishedTemplateById(
  id: string,
): Promise<ProjectTemplateRow | null> {
  const template = await loadProjectTemplateById(id);
  if (!template?.is_published) return null;
  return template;
}

export async function loadProjectTemplateForProject(
  projectId: string,
): Promise<{
  templateId: string | null;
  checklistDefinition: ChecklistDefinition | null;
  dependencyOverrides: TemplateDependencyOverrides | null;
} | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("template_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    console.log("MYDEBUG →", error?.message);
    return null;
  }

  const templateId =
    typeof data.template_id === "string" ? data.template_id : null;
  if (!templateId) {
    return { templateId: null, checklistDefinition: null, dependencyOverrides: null };
  }

  const template = await loadProjectTemplateById(templateId);
  if (!template) {
    return { templateId, checklistDefinition: null, dependencyOverrides: null };
  }

  return {
    templateId,
    checklistDefinition: template.checklist_definition,
    dependencyOverrides: template.dependency_overrides,
  };
}

export type SaveProjectTemplateInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  is_published: boolean;
  sort_order: number;
  required_job_categories: string[];
  checklist_definition: ChecklistDefinition;
  dependency_overrides: TemplateDependencyOverrides;
  suggested_skills: TemplateSuggestedSkill[];
};

export async function saveProjectTemplate(
  input: SaveProjectTemplateInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { userId } = await auth();
  const categories = normalizeProjectRequiredJobCategories(
    input.required_job_categories,
  );
  if (categories.length === 0) {
    return { ok: false, error: "Select at least one skill category." };
  }

  const name = input.name.trim();
  const slug = input.slug.trim();
  if (!name) return { ok: false, error: "Name is required." };
  if (!slug) return { ok: false, error: "Slug is required." };

  const supabase = createServerSupabaseClient();
  const payload = {
    name,
    slug,
    description: input.description.trim(),
    is_published: input.is_published,
    sort_order: input.sort_order,
    required_job_categories: categories,
    checklist_definition: input.checklist_definition,
    dependency_overrides: input.dependency_overrides,
    suggested_skills: input.suggested_skills,
    updated_at: new Date().toISOString(),
    updated_by_clerk_user_id: userId ?? null,
  };

  if (input.id) {
    const { error } = await supabase
      .from("project_templates")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      console.log("MYDEBUG →", error.message);
      return { ok: false, error: "Could not save template." };
    }
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("project_templates")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    console.log("MYDEBUG →", error?.message);
    return {
      ok: false,
      error: error?.message?.includes("unique")
        ? "Slug already in use."
        : "Could not create template.",
    };
  }

  return { ok: true, id: data.id as string };
}

export async function deleteProjectTemplate(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const { count, error: countErr } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("template_id", id);

  if (countErr) {
    console.log("MYDEBUG →", countErr.message);
    return { ok: false, error: "Could not check template usage." };
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Template is in use by projects. Unpublish instead of deleting.",
    };
  }

  const { error } = await supabase.from("project_templates").delete().eq("id", id);
  if (error) {
    console.log("MYDEBUG →", error.message);
    return { ok: false, error: "Could not delete template." };
  }

  return { ok: true };
}
