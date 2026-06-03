"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import {
  createProject,
  type CreateProjectState,
} from "@/app/dashboard/projects/actions";
import { PROFESSIONAL_JOB_CATEGORY_OPTIONS } from "@/lib/professional-onboarding";

import { ProjectDescriptionField } from "./project-description-field";
import { ProjectRequiredSkillRows } from "./project-required-skill-rows";

const initialState: CreateProjectState = { ok: false, error: "" };

const fileFieldButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

type AddProjectFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function AddProjectForm({
  onSuccess,
  onCancel,
}: AddProjectFormProps = {}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [skillRowsKey, setSkillRowsKey] = useState(0);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    createProject,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
      startTransition(() => {
        setSelected([]);
        setImageFileName(null);
        setSkillRowsKey((k) => k + 1);
      });
      onSuccess?.();
    }
  }, [state.ok, onSuccess]);

  function toggleCategory(value: string) {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : [...prev, value],
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Add a project
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="project-title"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Title
          </label>
          <input
            id="project-title"
            name="title"
            type="text"
            required
            maxLength={500}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22c55e] focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            placeholder="Your invention or venture name"
          />
        </div>
        <ProjectDescriptionField />
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-slate-700">
            Minimum team skills{" "}
            <span className="font-normal text-slate-500">(required)</span>
          </legend>
          <p className="text-xs text-slate-500">
            Select every category your team needs at minimum. Professionals can
            join if they match at least one — they do not need every box checked.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 mt-2">
            {PROFESSIONAL_JOB_CATEGORY_OPTIONS.map((cat) => {
              const isChecked = selected.includes(cat);
              return (
                <li key={cat}>
                  <label
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer text-sm ${
                      isChecked
                        ? "border-[#22c55e] bg-green-50/50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="categories"
                      value={cat}
                      checked={isChecked}
                      onChange={() => toggleCategory(cat)}
                      className="mt-1 size-4 rounded border-slate-300 text-[#22c55e] focus:ring-[#22c55e]"
                    />
                    <span className="text-slate-800">{cat}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1">
            Representative image{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#22c55e] has-[input:focus-visible]:ring-offset-2">
              <input
                id="representative_image"
                name="representative_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) =>
                  setImageFileName(e.target.files?.[0]?.name ?? null)
                }
              />
              <label
                htmlFor="representative_image"
                className={fileFieldButtonClass}
              >
                Add a file
              </label>
            </div>
            {imageFileName ? (
              <span className="text-sm text-slate-600 truncate max-w-[min(100%,16rem)]">
                {imageFileName}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            JPEG, PNG, or WebP, up to 5MB.
          </p>
        </div>
        <ProjectRequiredSkillRows key={skillRowsKey} />
      </div>
      {state.error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mt-3 text-sm text-[#15803d]">Project saved.</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16a34a] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save project"}
        </button>
        {onCancel ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
