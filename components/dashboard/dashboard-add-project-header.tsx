"use client";

import { useState } from "react";

import type { PublishedTemplatePickerItem } from "@/lib/project-templates";

import { AddProjectForm } from "./add-project-form";

type DashboardAddProjectHeaderProps = {
  templates: PublishedTemplatePickerItem[];
};

export function DashboardAddProjectHeader({
  templates,
}: DashboardAddProjectHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  function closeForm() {
    setIsOpen(false);
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My projects</h1>
          <p className="text-slate-600 text-base mt-1">
            Track and update checklist progress across your projects.
          </p>
        </div>
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16a34a] shrink-0"
          >
            Add new project
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="mt-4">
          <AddProjectForm
            templates={templates}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </div>
      ) : null}
    </div>
  );
}
