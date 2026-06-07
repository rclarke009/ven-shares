import { notFound } from "next/navigation";

import { TemplateEditorShell } from "@/components/admin/template-editor-shell";
import { loadProjectTemplateById } from "@/lib/project-templates.server";

type PageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function EditTemplatePage({ params }: PageProps) {
  const { templateId } = await params;
  const template = await loadProjectTemplateById(templateId);
  if (!template) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        Edit: {template.name}
      </h1>
      <TemplateEditorShell template={template} />
    </div>
  );
}
