"use client";

import { useState, useTransition } from "react";

import { setJobCategoryCompleted } from "@/app/idea-arena/[projectId]/category-actions";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";

type CategoryCompletionControlProps = {
  projectId: string;
  category: ProfessionalJobCategory;
  isComplete: boolean;
};

export function CategoryCompletionControl({
  projectId,
  category,
  isComplete,
}: CategoryCompletionControlProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onPress() {
    setError("");
    startTransition(() => {
      void (async () => {
        const result = await setJobCategoryCompleted(
          projectId,
          category,
          !isComplete,
        );
        if (!result.ok) {
          setError(result.error);
        }
      })();
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onPress}
        disabled={pending}
        className="text-[11px] font-semibold rounded-md px-2.5 py-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-60 transition-colors"
      >
        {pending ? "Saving…" : isComplete ? "Reopen slot" : "Mark complete"}
      </button>
      {error ? (
        <p className="text-[11px] text-red-600 mt-1 leading-snug">{error}</p>
      ) : null}
    </div>
  );
}
