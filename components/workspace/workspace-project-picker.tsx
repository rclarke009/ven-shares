"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { arenaProjectImageUrl } from "@/components/idea-arena/utils";
import { writeWorkspaceLastView } from "@/lib/workspace-last-view";
import type { WorkspacePickerProject } from "@/lib/workspace-project-picker.server";

type WorkspaceProjectPickerProps = {
  owned: WorkspacePickerProject[];
  joined: WorkspacePickerProject[];
  activeProjectId: string | null;
  currentUserId: string;
};

function ProjectRow({
  project,
  isActive,
  onSelect,
}: {
  project: WorkspacePickerProject;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const src = arenaProjectImageUrl(project);

  return (
    <li>
      <Link
        href={`/workspace/${project.id}`}
        onClick={() => onSelect(project.id)}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
          isActive
            ? "bg-slate-500/80 text-white font-medium"
            : "text-slate-200 hover:bg-slate-600/80"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-500/60 bg-slate-800">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
          />
        </span>
        <span className="truncate">{project.title}</span>
      </Link>
    </li>
  );
}

function ProjectGroup({
  label,
  projects,
  activeProjectId,
  onSelect,
}: {
  label: string;
  projects: WorkspacePickerProject[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
}) {
  if (projects.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
        {label}
      </p>
      <ul className="space-y-0.5">
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            isActive={activeProjectId === project.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}

export function WorkspaceProjectPicker({
  owned,
  joined,
  activeProjectId,
  currentUserId,
}: WorkspaceProjectPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAllProjects = activeProjectId === null;

  function selectAll() {
    writeWorkspaceLastView(currentUserId, "all");
    if (pathname !== "/workspace") {
      router.push("/workspace");
    }
  }

  function selectProject(id: string) {
    writeWorkspaceLastView(currentUserId, id);
  }

  return (
    <div className="border-b border-slate-600/80 p-3 pb-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
        Projects
      </p>
      <Link
        href="/workspace"
        onClick={selectAll}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
          isAllProjects
            ? "bg-slate-500/80 text-white font-medium"
            : "text-slate-200 hover:bg-slate-600/80"
        }`}
        aria-current={isAllProjects ? "page" : undefined}
      >
        <LayoutGrid className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
        <span>All Projects</span>
      </Link>
      <ProjectGroup
        label="My projects"
        projects={owned}
        activeProjectId={activeProjectId}
        onSelect={selectProject}
      />
      <ProjectGroup
        label="Teams I'm on"
        projects={joined}
        activeProjectId={activeProjectId}
        onSelect={selectProject}
      />
    </div>
  );
}
