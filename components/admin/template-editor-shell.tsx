"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  actionDeleteTemplate,
  actionSaveTemplate,
  type AdminTemplateActionState,
} from "@/app/admin/templates/actions";
import { PROFESSIONAL_JOB_CATEGORY_OPTIONS } from "@/lib/professional-onboarding";
import {
  slugifyTemplateName,
  type ChecklistDefinition,
  type ProjectTemplateRow,
  type TemplateDependencyOverrides,
  type TemplateSuggestedSkill,
} from "@/lib/project-templates";

import { TemplateChecklistEditor } from "./template-checklist-editor";
import { TemplateDependenciesEditor } from "./template-dependencies-editor";

type TabId = "overview" | "skills" | "checklist" | "dependencies";

const initialState: AdminTemplateActionState = { ok: false, error: "" };

type TemplateEditorShellProps = {
  template?: ProjectTemplateRow | null;
};

export function TemplateEditorShell({ template }: TemplateEditorShellProps) {
  const router = useRouter();
  const isNew = !template?.id;

  const [tab, setTab] = useState<TabId>("overview");
  const [name, setName] = useState(template?.name ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!template?.slug);
  const [description, setDescription] = useState(template?.description ?? "");
  const [isPublished, setIsPublished] = useState(template?.is_published ?? false);
  const [sortOrder, setSortOrder] = useState(
    String(template?.sort_order ?? 0),
  );
  const [categories, setCategories] = useState<string[]>(
    template?.required_job_categories ?? [],
  );
  const [checklistDefinition, setChecklistDefinition] =
    useState<ChecklistDefinition>(template?.checklist_definition ?? {});
  const [dependencyOverrides, setDependencyOverrides] =
    useState<TemplateDependencyOverrides>(
      template?.dependency_overrides ?? { nodeDependencies: {} },
    );
  const [suggestedSkills, setSuggestedSkills] = useState<TemplateSuggestedSkill[]>(
    template?.suggested_skills ?? [],
  );

  const [state, formAction, isPending] = useActionState(
    actionSaveTemplate,
    initialState,
  );

  useEffect(() => {
    if (state.ok && state.id) {
      router.push(`/admin/templates/${state.id}`);
      router.refresh();
    }
  }, [state.ok, state.id, router]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugifyTemplateName(name));
    }
  }, [name, slugTouched]);

  const checklistJson = useMemo(
    () => JSON.stringify(checklistDefinition),
    [checklistDefinition],
  );
  const depsJson = useMemo(
    () => JSON.stringify(dependencyOverrides),
    [dependencyOverrides],
  );
  const skillsJson = useMemo(
    () => JSON.stringify(suggestedSkills),
    [suggestedSkills],
  );

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  async function handleDelete() {
    if (!template?.id) return;
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    const result = await actionDeleteTemplate(template.id);
    if (result.ok) {
      router.push("/admin/templates");
      router.refresh();
    } else {
      window.alert(result.error);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "skills", label: "Skills" },
    { id: "checklist", label: "Checklist" },
    { id: "dependencies", label: "Dependencies" },
  ];

  return (
    <form action={formAction} className="space-y-6">
      {template?.id ? (
        <input type="hidden" name="id" value={template.id} />
      ) : null}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="sort_order" value={sortOrder} />
      {isPublished ? (
        <input type="hidden" name="is_published" value="on" />
      ) : null}
      {categories.map((cat) => (
        <input key={cat} type="hidden" name="categories" value={cat} />
      ))}
      <input type="hidden" name="checklist_definition_json" value={checklistJson} />
      <input type="hidden" name="dependency_overrides_json" value={depsJson} />
      <input type="hidden" name="suggested_skills_json" value={skillsJson} />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="size-4 rounded border-slate-300 text-[#22c55e]"
              />
              Published (visible in Add Project picker)
            </label>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sort order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      ) : null}

      {tab === "skills" ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 mb-2">
              Required skill categories
            </legend>
            <ul className="grid gap-2 sm:grid-cols-2">
              {PROFESSIONAL_JOB_CATEGORY_OPTIONS.map((cat) => {
                const checked = categories.includes(cat);
                return (
                  <li key={cat}>
                    <label className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer text-sm border-slate-200">
                      <input
                        type="checkbox"
                        name="categories"
                        value={cat}
                        checked={checked}
                        onChange={() => toggleCategory(cat)}
                        className="mt-1 size-4 rounded border-slate-300 text-[#22c55e]"
                      />
                      <span>{cat}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Suggested arena skills (optional)
              </span>
              <button
                type="button"
                onClick={() =>
                  setSuggestedSkills((prev) => [
                    ...prev,
                    { skill_name: "", skill_description: "" },
                  ])
                }
                className="text-xs font-medium text-[#15803d] hover:underline"
              >
                Add skill
              </button>
            </div>
            {suggestedSkills.map((row, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={row.skill_name}
                  onChange={(e) => {
                    const next = [...suggestedSkills];
                    next[i] = { ...row, skill_name: e.target.value };
                    setSuggestedSkills(next);
                  }}
                  placeholder="Skill name"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={row.skill_description}
                  onChange={(e) => {
                    const next = [...suggestedSkills];
                    next[i] = { ...row, skill_description: e.target.value };
                    setSuggestedSkills(next);
                  }}
                  placeholder="Description"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "checklist" ? (
        <TemplateChecklistEditor
          categories={categories}
          definition={checklistDefinition}
          onChange={(next) => startTransition(() => setChecklistDefinition(next))}
        />
      ) : null}

      {tab === "dependencies" ? (
        <TemplateDependenciesEditor
          categories={categories}
          checklistDefinition={checklistDefinition}
          overrides={dependencyOverrides}
          onChange={(next) => startTransition(() => setDependencyOverrides(next))}
        />
      ) : null}

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16a34a] disabled:opacity-60"
        >
          {isPending ? "Saving…" : isNew ? "Create template" : "Save template"}
        </button>
        {!isNew ? (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
