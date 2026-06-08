const STORAGE_PREFIX = "ven-shares:workspace-last-view:";
const TAB_STORAGE_PREFIX = "ven-shares:workspace-last-tab:";

export type WorkspaceLastView = "all" | string;

export type WorkspaceDefaultTab = "get-started" | "journey";

const VALID_WORKSPACE_TAB_IDS = new Set([
  "journey",
  "roadmap",
  "messages",
  "organizer",
  "meeting",
  "get-started",
  "settings",
  "progress",
  "files",
  "activity",
]);

export function workspaceLastViewStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function workspaceLastTabStorageKey(
  userId: string,
  projectId: string,
): string {
  return `${TAB_STORAGE_PREFIX}${userId}:${projectId}`;
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

export function readWorkspaceLastTab(
  userId: string,
  projectId: string,
): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      workspaceLastTabStorageKey(userId, projectId),
    );
    if (!raw || !VALID_WORKSPACE_TAB_IDS.has(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeWorkspaceLastTab(
  userId: string,
  projectId: string,
  tab: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      workspaceLastTabStorageKey(userId, projectId),
      tab,
    );
  } catch {
    // Quota or private browsing — ignore
  }
}

export function defaultWorkspaceTab(
  isProjectOwner: boolean,
): WorkspaceDefaultTab {
  return isProjectOwner ? "get-started" : "journey";
}

export function resolveWorkspaceTab(
  userId: string,
  projectId: string,
  isProjectOwner: boolean,
): string {
  const stored = readWorkspaceLastTab(userId, projectId);
  if (!stored) return defaultWorkspaceTab(isProjectOwner);
  if (
    !isProjectOwner &&
    (stored === "get-started" || stored === "settings")
  ) {
    return defaultWorkspaceTab(isProjectOwner);
  }
  return stored;
}

export function workspaceHrefForLastView(
  userId: string,
  lastView: WorkspaceLastView | null,
): string {
  if (!lastView || lastView === "all") return "/workspace";
  const storedTab = readWorkspaceLastTab(userId, lastView);
  if (!storedTab) return `/workspace/${lastView}`;
  return `/workspace/${lastView}?tab=${storedTab}`;
}

export function workspaceHrefFromStorage(userId: string): string {
  return workspaceHrefForLastView(userId, readWorkspaceLastView(userId));
}
