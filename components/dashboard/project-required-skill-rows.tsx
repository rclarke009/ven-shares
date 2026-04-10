"use client";

import { useCallback, useState } from "react";

type Row = { key: string; skill_name: string; skill_description: string };

type ProjectRequiredSkillRowsProps = {
  initialRows?: { skill_name: string; skill_description: string }[];
};

export function ProjectRequiredSkillRows({
  initialRows = [],
}: ProjectRequiredSkillRowsProps) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialRows.length > 0
      ? initialRows.map((r, i) => ({
          key: `init-${i}-${r.skill_name}`,
          skill_name: r.skill_name,
          skill_description: r.skill_description,
        }))
      : [],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        skill_name: "",
        skill_description: "",
      },
    ]);
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">
          Required skills{" "}
          <span className="font-normal text-slate-500">(optional)</span>
        </span>
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-medium text-[#15803d] hover:underline"
        >
          Add skill
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Name each skill and add a short description (up to 10 skills).
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          No skills listed yet. Use Add skill to describe help you need beyond the
          team categories above.
        </p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.key}
            className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2"
          >
            <div className="flex justify-between gap-2 items-start">
              <label className="block flex-1 text-xs font-medium text-slate-600 min-w-0">
                Skill name
                <input
                  name="skill_name"
                  defaultValue={row.skill_name}
                  maxLength={120}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  placeholder="e.g. PCB layout"
                />
              </label>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="shrink-0 text-xs text-red-600 hover:underline pt-5"
              >
                Remove
              </button>
            </div>
            <label className="block text-xs font-medium text-slate-600">
              Short description
              <textarea
                name="skill_description"
                defaultValue={row.skill_description}
                rows={2}
                maxLength={500}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                placeholder="What you need from someone with this skill"
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
