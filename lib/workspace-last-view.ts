const STORAGE_PREFIX = "ven-shares:workspace-last-view:";

export type WorkspaceLastView = "all" | string;

export function workspaceLastViewStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function readWorkspaceLastView(userId: string): WorkspaceLastView | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(workspaceLastViewStorageKey(userId));
    if (!raw) return null;
    if (raw === "all") return "all";
    return raw;
  } catch {
    return null;
  }
}

export function writeWorkspaceLastView(
  userId: string,
  view: WorkspaceLastView,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(workspaceLastViewStorageKey(userId), view);
  } catch {
    // Quota or private browsing — ignore
  }
}

export function workspaceHrefForLastView(
  userId: string,
  lastView: WorkspaceLastView | null,
): string {
  if (!lastView || lastView === "all") return "/workspace";
  return `/workspace/${lastView}`;
}

export function workspaceHrefFromStorage(userId: string): string {
  return workspaceHrefForLastView(userId, readWorkspaceLastView(userId));
}
