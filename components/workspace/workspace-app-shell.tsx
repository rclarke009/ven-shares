"use client";

import type { WorkspacePickerProject } from "@/lib/workspace-project-picker.server";

import { WorkspaceProjectPicker } from "@/components/workspace/workspace-project-picker";

type WorkspaceAppShellProps = {
  owned: WorkspacePickerProject[];
  joined: WorkspacePickerProject[];
  activeProjectId: string | null;
  currentUserId: string;
  projectSidebar?: React.ReactNode;
  projectSidebarFooter?: React.ReactNode;
  children: React.ReactNode;
};

export function WorkspaceAppShell({
  owned,
  joined,
  activeProjectId,
  currentUserId,
  projectSidebar,
  projectSidebarFooter,
  children,
}: WorkspaceAppShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#e8eef5]">
      <aside className="w-60 shrink-0 bg-slate-700 text-slate-100 flex flex-col border-r border-slate-600">
        <WorkspaceProjectPicker
          owned={owned}
          joined={joined}
          activeProjectId={activeProjectId}
          currentUserId={currentUserId}
        />
        {projectSidebar ? (
          <nav className="flex flex-col gap-0.5 p-3 flex-1 min-h-0 overflow-y-auto">
            {projectSidebar}
          </nav>
        ) : (
          <div className="flex-1" />
        )}
        {projectSidebarFooter}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
