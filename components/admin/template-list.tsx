import Link from "next/link";

import type { ProjectTemplateRow } from "@/lib/project-templates";

type TemplateListProps = {
  templates: ProjectTemplateRow[];
};

export function TemplateList({ templates }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        No templates yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
      {templates.map((t) => (
        <li key={t.id} className="px-4 py-4 first:rounded-t-xl last:rounded-b-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{t.name}</p>
              <p className="mt-1 text-sm text-slate-600">{t.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                Slug: {t.slug} · {t.required_job_categories.length} skill
                {t.required_job_categories.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  t.is_published
                    ? "bg-green-50 text-[#15803d]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.is_published ? "Published" : "Draft"}
              </span>
              <Link
                href={`/admin/templates/${t.id}`}
                className="text-sm font-semibold text-[#15803d] hover:underline"
              >
                Edit
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
