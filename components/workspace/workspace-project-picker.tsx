"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { arenaProjectImageUrl } from "@/components/idea-arena/utils";
import { AnchoredMenuPanel } from "@/components/workspace/anchored-menu-panel";
import { writeWorkspaceLastView } from "@/lib/workspace-last-view";
import type { WorkspacePickerProject } from "@/lib/workspace-project-picker.server";

type WorkspaceProjectPickerProps = {
  owned: WorkspacePickerProject[];
  joined: WorkspacePickerProject[];
  activeProjectId: string | null;
  currentUserId: string;
};

function pickerCollapsedStorageKey(userId: string): string {
  return `ven-shares:workspace-picker-collapsed:${userId}`;
}

function readPickerCollapsed(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writePickerCollapsed(key: string, collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, collapsed ? "true" : "false");
  } catch {
    // Quota or private browsing — ignore
  }
}

function ProjectThumb({ project }: { project: WorkspacePickerProject }) {
  const src = arenaProjectImageUrl(project);
  return (
    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-500/60 bg-slate-800">
      <Image src={src} alt="" fill className="object-cover" sizes="32px" />
    </span>
  );
}

function DropdownOption({
  project,
  isActive,
  onSelect,
}: {
  project: WorkspacePickerProject;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(project.id)}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
        isActive
          ? "bg-slate-100 font-medium text-slate-900"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <ProjectThumb project={project} />
      <span className="truncate">{project.title}</span>
    </button>
  );
}

function DropdownGroup({
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
    <div role="group" aria-label={label}>
      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {projects.map((project) => (
        <DropdownOption
          key={project.id}
          project={project}
          isActive={activeProjectId === project.id}
          onSelect={onSelect}
        />
      ))}
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
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const collapseKey = pickerCollapsedStorageKey(currentUserId);
  const [sectionCollapsed, setSectionCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const isAllProjects = activeProjectId === null;

  useEffect(() => {
    setSectionCollapsed(readPickerCollapsed(collapseKey));
    setHydrated(true);
  }, [collapseKey]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, closeMenu]);

  function selectAll() {
    writeWorkspaceLastView(currentUserId, "all");
    closeMenu();
    router.push("/workspace");
  }

  function selectProject(id: string) {
    writeWorkspaceLastView(currentUserId, id);
    closeMenu();
    router.push(`/workspace/${id}`);
  }

  const toggleSectionCollapsed = useCallback(() => {
    setSectionCollapsed((prev) => {
      const next = !prev;
      writePickerCollapsed(collapseKey, next);
      if (next) closeMenu();
      return next;
    });
  }, [collapseKey, closeMenu]);

  const isSectionCollapsed = hydrated ? sectionCollapsed : false;

  return (
    <div
      ref={rootRef}
      className="border-b border-slate-600/80 p-3 pb-4"
    >
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Projects
        </p>
        <button
          type="button"
          onClick={toggleSectionCollapsed}
          className="inline-flex items-center rounded-md p-1 text-slate-400 hover:bg-slate-600/60 hover:text-slate-200 transition-colors"
          aria-expanded={!isSectionCollapsed}
          aria-controls="workspace-project-picker-body"
          aria-label={isSectionCollapsed ? "Show projects" : "Hide projects"}
        >
          {isSectionCollapsed ? (
            <ChevronDown className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronUp className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      {isSectionCollapsed ? null : (
        <div id="workspace-project-picker-body">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
              menuOpen
                ? "bg-slate-500/80 text-white"
                : "bg-slate-600/50 text-slate-100 hover:bg-slate-600/80"
            }`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="workspace-project-picker-menu"
            aria-label="Choose project"
          >
            <LayoutGrid className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            <span className="truncate flex-1 font-medium">Choose Project</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 opacity-80 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          <AnchoredMenuPanel
            open={menuOpen}
            triggerRef={triggerRef}
            menuRef={menuRef}
            className="min-w-[14rem] max-w-[min(18rem,calc(100vw-1rem))] py-1"
          >
            <div
              id="workspace-project-picker-menu"
              className="max-h-64 overflow-y-auto"
            >
              <button
                type="button"
                role="menuitem"
                onClick={selectAll}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isAllProjects
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <LayoutGrid
                  className="h-5 w-5 shrink-0 text-slate-500"
                  aria-hidden
                />
                <span>All Projects</span>
              </button>
              <DropdownGroup
                label="My projects"
                projects={owned}
                activeProjectId={activeProjectId}
                onSelect={selectProject}
              />
              <DropdownGroup
                label="Teams I'm on"
                projects={joined}
                activeProjectId={activeProjectId}
                onSelect={selectProject}
              />
            </div>
          </AnchoredMenuPanel>
        </div>
      )}
    </div>
  );
}
