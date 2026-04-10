"use client";

import { useActionState, useMemo, useState } from "react";

import type { ProfessionalOnboardingActionState } from "@/app/onboarding/professional/actions";
import {
  PROFESSIONAL_HOURS_BANDS,
  PROFESSIONAL_JOB_CATEGORY_OPTIONS,
  type ProfessionalHoursBandValue,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";

const MAX_CATEGORIES = 5;

export type ProfessionalOnboardingFormProps = {
  initialCategories?: ProfessionalJobCategory[];
  initialHours?: ProfessionalHoursBandValue | "";
  formAction: (
    prev: ProfessionalOnboardingActionState,
    formData: FormData,
  ) => Promise<ProfessionalOnboardingActionState>;
  submitLabel: string;
  showOnboardingCopy?: boolean;
};

export function ProfessionalOnboardingForm({
  initialCategories = [],
  initialHours = "",
  formAction,
  submitLabel,
  showOnboardingCopy = true,
}: ProfessionalOnboardingFormProps) {
  const [selected, setSelected] = useState<string[]>(() => [
    ...initialCategories,
  ]);
  const initialState = useMemo<ProfessionalOnboardingActionState>(() => ({}), []);
  const [state, submitAction, pending] = useActionState(
    formAction,
    initialState,
  );

  function toggleCategory(value: string) {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((x) => x !== value);
      }
      if (prev.length >= MAX_CATEGORIES) return prev;
      return [...prev, value];
    });
  }

  const categoriesLegend = showOnboardingCopy
    ? `Job categories (choose up to ${MAX_CATEGORIES})`
    : `Job categories (up to ${MAX_CATEGORIES})`;
  const categoriesBlurb = showOnboardingCopy
    ? "We use this to personalize projects you see in the Idea Arena."
    : "We use this for Idea Arena matching and Join Team eligibility.";

  return (
    <form action={submitAction} className="space-y-8">
      {state.error ? (
        <p
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900 mb-2 block">
          {categoriesLegend}
        </legend>
        <p className="text-sm text-slate-600 mb-3">{categoriesBlurb}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PROFESSIONAL_JOB_CATEGORY_OPTIONS.map((cat) => {
            const isChecked = selected.includes(cat);
            const atCap = selected.length >= MAX_CATEGORIES;
            const disabled = !isChecked && atCap;
            return (
              <li key={cat}>
                <label
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
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
                  <span className="text-sm text-slate-800">{cat}</span>
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
        <label
          htmlFor="hours"
          className="text-sm font-semibold text-slate-900 block mb-2"
        >
          Hours per week
        </label>
        <select
          id="hours"
          name="hours"
          required
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#22c55e] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/20"
          defaultValue={initialHours || ""}
        >
          <option value="" disabled>
            Select availability
          </option>
          {PROFESSIONAL_HOURS_BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-[#22c55e] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#16a34a] disabled:opacity-60 transition-colors"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
