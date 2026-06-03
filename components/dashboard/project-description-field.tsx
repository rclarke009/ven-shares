const DESCRIPTION_PLACEHOLDER =
  "e.g. Most wheelchairs only use pushing muscles… A push-and-pull system lets operators use lats too, get a full workout, and climb hills without rolling back.";

type ProjectDescriptionFieldProps = {
  id?: string;
  defaultValue?: string;
  /** Match edit form workspace vs dashboard textarea sizing. */
  variant?: "dashboard" | "workspace";
};

export function ProjectDescriptionField({
  id = "project-description",
  defaultValue,
  variant = "dashboard",
}: ProjectDescriptionFieldProps) {
  const isWorkspace = variant === "workspace";
  const labelClass = isWorkspace
    ? "block text-sm font-medium text-slate-700"
    : "block text-sm font-medium text-slate-700 mb-1";
  const textareaClass = isWorkspace
    ? "mt-1 w-full min-h-[10rem] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
    : "w-full min-h-[10rem] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-[#22c55e] focus:outline-none focus:ring-1 focus:ring-[#22c55e]";

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        Description{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <p className={`text-xs text-slate-500 ${isWorkspace ? "mt-1" : "mt-0.5 mb-1"}`}>
        Describe the problem, your solution, and who it helps. A few detailed
        sentences work best — professionals use this to decide whether to join.
      </p>
      <textarea
        id={id}
        name="description"
        rows={8}
        maxLength={4000}
        defaultValue={defaultValue}
        placeholder={DESCRIPTION_PLACEHOLDER}
        className={textareaClass}
      />
    </div>
  );
}
