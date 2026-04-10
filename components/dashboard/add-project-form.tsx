"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import {
  createProject,
  type CreateProjectState,
} from "@/app/dashboard/projects/actions";
import { PROFESSIONAL_JOB_CATEGORY_OPTIONS } from "@/lib/professional-onboarding";

import { ProjectRequiredSkillRows } from "./project-required-skill-rows";

const initialState: CreateProjectState = { ok: false, error: "" };

const MAX_CATEGORIES = 5;

const fileFieldButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

export function AddProjectForm() {
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
    }
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
        <div>
          <label
            htmlFor="project-description"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id="project-description"
            name="description"
            rows={3}
            maxLength={4000}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22c55e] focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            placeholder="Short summary"
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-slate-700">
            Team skills needed{" "}
            <span className="font-normal text-slate-500">(required)</span>
          </legend>
          <p className="text-xs text-slate-500">
            Professionals need at least one matching job category to join.
            Choose up to {MAX_CATEGORIES}.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 mt-2">
            {PROFESSIONAL_JOB_CATEGORY_OPTIONS.map((cat) => {
              const isChecked = selected.includes(cat);
              const atCap = selected.length >= MAX_CATEGORIES;
              const disabled = !isChecked && atCap;
              return (
                <li key={cat}>
                  <label
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer text-sm ${
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
                      className="mt-1 size-4 rounded border-slate-300 text-[#22c55e] focus:ring-[#22c55e]"
                    />
                    <span className="text-slate-800">{cat}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-slate-500">
            {selected.length} / {MAX_CATEGORIES} selected
          </p>
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
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16a34a] disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save project"}
      </button>
    </form>
  );
}
