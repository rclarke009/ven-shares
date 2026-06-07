import Link from "next/link";

import { TemplateList } from "@/components/admin/template-list";
import { listAllProjectTemplates } from "@/lib/project-templates.server";

export default async function AdminTemplatesPage() {
  const templates = await listAllProjectTemplates();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Project templates
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Business-type starting templates with tasks, milestones, and
            dependencies for new projects.
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className="rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16a34a]"
        >
          New template
        </Link>
      </div>
      <TemplateList templates={templates} />
    </div>
  );
}
