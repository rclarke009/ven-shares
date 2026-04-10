"use client";

import Image from "next/image";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  updateProjectWithMediaAndSkills,
  type ProjectRow,
  type UpdateProjectMediaState,
} from "@/app/dashboard/projects/actions";
import { publicProjectImageUrl } from "@/lib/project-image-url";
import { PROFESSIONAL_JOB_CATEGORY_OPTIONS } from "@/lib/professional-onboarding";

import { ProjectRequiredSkillRows } from "./project-required-skill-rows";

const MAX_CATEGORIES = 5;

type EditProjectFormProps = {
  project: Pick<
    ProjectRow,
    | "id"
    | "title"
    | "description"
    | "required_job_categories"
    | "representative_image_path"
    | "project_required_skills"
  >;
};

const fileFieldButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

export function EditProjectForm({ project }: EditProjectFormProps) {
  const [selected, setSelected] = useState<string[]>(() => [
    ...project.required_job_categories,
  ]);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const initialState = useMemo<UpdateProjectMediaState>(
    () => ({ ok: false, error: "" }),
    [],
  );
  const [state, formAction, pending] = useActionState(
    updateProjectWithMediaAndSkills,
    initialState,
  );

  const previewUrl = publicProjectImageUrl(project.representative_image_path);

  useEffect(() => {
    if (!state.ok) return;
    if (imageInputRef.current) imageInputRef.current.value = "";
    startTransition(() => {
      setImageFileName(null);
    });
  }, [state.ok]);

  function toggleCategory(value: string) {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((x) => x !== value);
      }
      if (prev.length >= MAX_CATEGORIES) return prev;
      return [...prev, value];
    });
  }

  return (
    <form action={formAction} className="mt-4 pt-4 border-t border-slate-100">
      <input type="hidden" name="projectId" value={project.id} />
      <p className="text-sm font-medium text-slate-800 mb-3">Edit project</p>
      {state.error ? (
        <p
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-[#15803d] mb-3">Project updated.</p>
      ) : null}

      <div className="space-y-3 mb-4">
        <label className="block text-xs font-medium text-slate-700">
          Title
          <input
            name="title"
            type="text"
            required
            maxLength={500}
            defaultValue={project.title}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Description{" "}
          <span className="font-normal text-slate-500">(optional)</span>
          <textarea
            name="description"
            rows={3}
            maxLength={4000}
            defaultValue={project.description ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <div>
          <span className="block text-xs font-medium text-slate-700 mb-1">
            Representative image{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </span>
          {previewUrl ? (
            <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-slate-200 mb-2">
              <Image
                src={previewUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#22c55e] has-[input:focus-visible]:ring-offset-2">
              <input
                ref={imageInputRef}
                id={`representative_image_${project.id}`}
                name="representative_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) =>
                  setImageFileName(e.target.files?.[0]?.name ?? null)
                }
              />
              <label
                htmlFor={`representative_image_${project.id}`}
                className={fileFieldButtonClass}
              >
                Add a file
              </label>
            </div>
            {imageFileName ? (
              <span className="text-xs text-slate-600 truncate max-w-[min(100%,14rem)]">
                {imageFileName}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            JPEG, PNG, or WebP, up to 5MB. Uploading replaces the current image.
          </p>
        </div>
      </div>

      <p className="text-xs font-medium text-slate-800 mb-2">
        Team skills needed (categories)
      </p>
      <p className="text-xs text-slate-500 mb-2">
        Professionals need at least one match. Up to {MAX_CATEGORIES}.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 mb-3">
        {PROFESSIONAL_JOB_CATEGORY_OPTIONS.map((cat) => {
          const isChecked = selected.includes(cat);
          const atCap = selected.length >= MAX_CATEGORIES;
          const disabled = !isChecked && atCap;
          return (
            <li key={cat}>
              <label
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 cursor-pointer text-xs ${
                  isChecked
                    ? "border-[#22c55e] bg-green-50/50"
                    : disabled
                      ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                      : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={cat}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => toggleCategory(cat)}
                  className="mt-0.5 size-3.5 rounded border-slate-300 text-[#22c55e] focus:ring-[#22c55e]"
                />
                <span className="text-slate-800 leading-snug">{cat}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-slate-500 mb-3">
        {selected.length} / {MAX_CATEGORIES} selected
      </p>

      <ProjectRequiredSkillRows
        key={`${project.id}-${project.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("|")}`}
        initialRows={project.project_required_skills}
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save project"}
      </button>
    </form>
  );
}
