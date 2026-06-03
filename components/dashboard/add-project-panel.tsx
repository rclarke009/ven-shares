"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProjectRow } from "@/app/dashboard/projects/actions";

import { AddProjectForm } from "./add-project-form";
import { EditProjectForm } from "./edit-project-form";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type AddProjectPanelProps = {
  projects: ProjectRow[];
};

export function AddProjectPanel({ projects }: AddProjectPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  function closeForm() {
    setIsOpen(false);
  }

  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Your projects</h2>
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16a34a]"
          >
            Add new project
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="mb-6">
          <AddProjectForm onSuccess={closeForm} onCancel={closeForm} />
        </div>
      ) : null}

      {projects.length === 0 ? (
        <p className="text-slate-600 text-sm">
          No projects yet. Click Add new project to get started.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
          {projects.map((p) => (
            <li
              key={p.id}
              className="px-4 py-4 first:rounded-t-xl last:rounded-b-xl"
            >
              <p className="font-medium text-slate-900">{p.title}</p>
              {p.description ? (
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                  {p.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                {formatDate(p.created_at)}
              </p>
              <p className="mt-2">
                <Link
                  href={`/idea-arena/${p.id}/workspace`}
                  className="text-sm font-semibold text-[#15803d] hover:underline"
                >
                  Open workspace
                </Link>
              </p>
              {p.required_job_categories?.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {p.required_job_categories.map((c) => (
                    <li
                      key={c}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 inline-block">
                  Add team skills so professionals can join this project.
                </p>
              )}
              <EditProjectForm
                key={`${p.id}-${p.representative_image_path ?? ""}-${p.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("·")}-${p.title}`}
                project={p}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
