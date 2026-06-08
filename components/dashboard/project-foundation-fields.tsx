import {
  PROJECT_FOUNDATION_FIELD_DEFS,
  type ProjectFoundation,
} from "@/lib/project-foundation";

type ProjectFoundationFieldsProps = {
  defaultValues?: ProjectFoundation;
  variant?: "dashboard" | "workspace";
};

export function ProjectFoundationFields({
  defaultValues,
  variant = "dashboard",
}: ProjectFoundationFieldsProps) {
  const isWorkspace = variant === "workspace";
  const legendClass = isWorkspace
    ? "block text-sm font-medium text-slate-700"
    : "block text-sm font-medium text-slate-700";
  const introClass = `text-xs text-slate-500 ${isWorkspace ? "mt-1" : "mt-0.5"}`;
  const fieldLabelClass = isWorkspace
    ? "block text-sm font-medium text-slate-700"
    : "block text-sm font-medium text-slate-700 mb-1";
  const hintClass = `text-xs text-slate-500 ${isWorkspace ? "mt-0.5" : "mb-1"}`;
  const textareaClass = isWorkspace
    ? "mt-1 w-full min-h-[6rem] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
    : "w-full min-h-[6rem] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22c55e] focus:outline-none focus:ring-1 focus:ring-[#22c55e]";

  return (
    <fieldset className="space-y-4">
      <legend className={legendClass}>
        Project foundation{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </legend>
      <p className={introClass}>
        Structured details help professionals decide whether to join. Fill in
        what you have now — you can update anytime from project settings.
      </p>
      <div className={`space-y-4 ${isWorkspace ? "mt-3" : "mt-2"}`}>
        {PROJECT_FOUNDATION_FIELD_DEFS.map((def) => (
          <div key={def.key}>
            <label htmlFor={def.formName} className={fieldLabelClass}>
              {def.label}
            </label>
            <p className={hintClass}>{def.hint}</p>
            <textarea
              id={def.formName}
              name={def.formName}
              rows={4}
              maxLength={def.maxLength}
              defaultValue={defaultValues?.[def.key] ?? ""}
              placeholder={def.placeholder}
              className={textareaClass}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
