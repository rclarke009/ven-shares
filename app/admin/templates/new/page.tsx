import { TemplateEditorShell } from "@/components/admin/template-editor-shell";

export default function NewTemplatePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        New project template
      </h1>
      <TemplateEditorShell />
    </div>
  );
}
