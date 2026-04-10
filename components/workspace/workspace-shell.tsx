"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Eye,
  FileText,
  MessageCircle,
  Users,
  Video,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  MAX_TEXT_PREVIEW_BYTES,
  getWorkspacePreviewKind,
  isTextPreviewTooLarge,
} from "@/lib/workspace-preview";

import {
  actionGetWorkspaceFileDownloadUrl,
  actionPostWorkspaceMessage,
  actionUploadWorkspaceFile,
  actionUpsertWorkspacePresence,
  actionWorkspacePresenceHeartbeat,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import type { ArenaCategorySlot } from "@/lib/projects-arena";
import type { WorkspaceProgressChecklist } from "@/lib/workspace-progress-checklist";

import { WorkspaceProgressPanel } from "@/components/workspace/workspace-progress-panel";

const TABS = [
  { id: "activity" as const, label: "Activity", icon: Activity },
  { id: "messages" as const, label: "Messages", icon: MessageCircle },
  { id: "files" as const, label: "Files", icon: FileText },
  { id: "progress" as const, label: "Progress", icon: BarChart3 },
  { id: "meeting" as const, label: "Meeting", icon: Video },
];

const workspaceFileChooseButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

export type WorkspaceMessageDTO = {
  id: string;
  author_clerk_user_id: string;
  body: string;
  reply_to_id: string | null;
  created_at: string;
};

export type WorkspaceFileDTO = {
  id: string;
  uploaded_by_clerk_user_id: string;
  filename: string;
  content_type: string | null;
  byte_size: number;
  created_at: string;
};

export type WorkspaceActivityDTO = {
  id: string;
  actor_clerk_user_id: string;
  kind: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type WorkspaceRosterEntryDTO = {
  clerk_user_id: string;
  display_name: string;
  role: "owner" | "member";
  status_text: string;
  updated_at: string | null;
};

type WorkspaceShellProps = {
  projectId: string;
  projectTitle: string;
  currentUserId: string;
  initialTab: string;
  highlightMessageId: string | null;
  messages: WorkspaceMessageDTO[];
  files: WorkspaceFileDTO[];
  activities: WorkspaceActivityDTO[];
  roster: WorkspaceRosterEntryDTO[];
  nameMap: Record<string, string>;
  progressChecklist: WorkspaceProgressChecklist;
  progressCategoryStatuses: ArenaCategorySlot[];
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function activityDescription(
  kind: string,
  payload: Record<string, unknown> | null,
): string {
  if (kind === "message_posted") return "Posted a message";
  if (kind === "file_uploaded") {
    const name =
      typeof payload?.filename === "string" ? payload.filename : "a file";
    return `Uploaded ${name}`;
  }
  if (kind === "status_updated") {
    const s =
      typeof payload?.status_text === "string" ? payload.status_text : "";
    return s ? `Set status: ${s}` : "Updated status";
  }
  return kind.replace(/_/g, " ");
}

function isTabId(v: string): v is (typeof TABS)[number]["id"] {
  return TABS.some((t) => t.id === v);
}

export function WorkspaceShell({
  projectId,
  projectTitle,
  currentUserId,
  initialTab,
  highlightMessageId,
  messages,
  files,
  activities,
  roster,
  nameMap,
  progressChecklist,
  progressCategoryStatuses,
}: WorkspaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState<(typeof TABS)[number]["id"]>(() =>
    isTabId(initialTab) ? initialTab : "messages",
  );
  const [, startTransition] = useTransition();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [workspaceUploadFileName, setWorkspaceUploadFileName] = useState<
    string | null
  >(null);
  const workspaceFileInputId = useId();
  const previewTitleId = useId();
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<WorkspaceFileDTO | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewTextOversized, setPreviewTextOversized] = useState(false);

  const messageById = useMemo(() => {
    const m = new Map<string, WorkspaceMessageDTO>();
    for (const x of messages) m.set(x.id, x);
    return m;
  }, [messages]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && isTabId(t)) setTabState(t);
  }, [searchParams]);

  useEffect(() => {
    if (highlightMessageId) {
      setTabState("messages");
    }
  }, [highlightMessageId]);

  useEffect(() => {
    if (tab === "messages" && highlightMessageId) {
      const el = document.getElementById(`msg-${highlightMessageId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [tab, highlightMessageId, messages]);

  useEffect(() => {
    void actionWorkspacePresenceHeartbeat(projectId);
    const id = window.setInterval(() => {
      void actionWorkspacePresenceHeartbeat(projectId);
    }, 90_000);
    return () => window.clearInterval(id);
  }, [projectId]);

  function setTab(next: (typeof TABS)[number]["id"]) {
    setTabState(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  async function onDownload(fileId: string) {
    setDownloadBusy(fileId);
    try {
      const r = await actionGetWorkspaceFileDownloadUrl(projectId, fileId);
      if (r.ok) {
        window.open(r.url, "_blank", "noopener,noreferrer");
      } else {
        console.log("MYDEBUG →", r.error);
      }
    } finally {
      setDownloadBusy(null);
    }
  }

  const closePreview = useCallback(() => {
    setPreviewTarget(null);
    setPreviewUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewText(null);
    setPreviewTextOversized(false);
  }, []);

  useEffect(() => {
    if (!previewTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewTarget, closePreview]);

  useEffect(() => {
    if (!previewTarget) return;
    const id = window.requestAnimationFrame(() => {
      previewCloseRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [previewTarget]);

  async function openPreview(f: WorkspaceFileDTO) {
    const kind = getWorkspacePreviewKind(f);
    if (!kind) return;

    setPreviewTarget(f);
    setPreviewUrl(null);
    setPreviewText(null);
    setPreviewTextOversized(false);
    setPreviewError(null);
    setPreviewLoading(true);

    const r = await actionGetWorkspaceFileDownloadUrl(projectId, f.id);
    if (!r.ok) {
      console.log("MYDEBUG →", r.error);
      setPreviewError(r.error || "Could not load preview.");
      setPreviewLoading(false);
      return;
    }

    if (kind === "text") {
      if (isTextPreviewTooLarge(f.byte_size)) {
        setPreviewUrl(r.url);
        setPreviewTextOversized(true);
        setPreviewLoading(false);
        return;
      }
      try {
        const res = await fetch(r.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let text = await res.text();
        if (text.length > MAX_TEXT_PREVIEW_BYTES) {
          text =
            text.slice(0, MAX_TEXT_PREVIEW_BYTES) +
            "\n\n… (preview truncated. Download for the full file.)";
        }
        setPreviewUrl(r.url);
        setPreviewText(text);
      } catch (e) {
        console.log("MYDEBUG →", e);
        setPreviewError(
          "Could not load file text. Try opening in a new tab.",
        );
        setPreviewUrl(r.url);
      }
      setPreviewLoading(false);
      return;
    }

    setPreviewUrl(r.url);
    setPreviewLoading(false);
  }

  const previewKind = previewTarget
    ? getWorkspacePreviewKind(previewTarget)
    : null;

  const replyPreview = replyToId ? messageById.get(replyToId) : undefined;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#e8eef5]">
      <aside className="w-52 shrink-0 bg-slate-700 text-slate-100 flex flex-col border-r border-slate-600">
        <nav className="flex flex-col gap-0.5 p-3 pt-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-slate-500/80 text-white"
                  : "text-slate-200 hover:bg-slate-600/80"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-3 border-t border-slate-600/80">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Team
          </p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {roster.map((r) => (
              <li key={r.clerk_user_id} className="text-xs">
                <span className="font-medium text-white">
                  {r.display_name}
                </span>
                <span className="text-slate-400">
                  {" "}
                  · {r.role === "owner" ? "Owner" : "Member"}
                </span>
                {r.status_text.trim() ? (
                  <p className="text-slate-300 mt-0.5 leading-snug">
                    {r.status_text}
                  </p>
                ) : null}
                {r.updated_at ? (
                  <p className="text-slate-500 mt-0.5">
                    {formatTime(r.updated_at)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-slate-200/80 bg-white/90 px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-900 truncate">
            {projectTitle}
          </h1>
          <Link
            href={`/idea-arena/${projectId}`}
            className="text-sm font-medium text-[#22c55e] hover:underline shrink-0"
          >
            Project page
          </Link>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {tab === "activity" ? (
            <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Recent activity
              </h2>
              {activities.length === 0 ? (
                <p className="text-sm text-slate-600">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {activities.map((a) => (
                    <li
                      key={a.id}
                      className="text-sm border-b border-slate-100 pb-3 last:border-0"
                    >
                      <span className="font-medium text-slate-900">
                        {nameMap[a.actor_clerk_user_id] ?? "Someone"}
                      </span>
                      <span className="text-slate-600">
                        {" "}
                        {activityDescription(a.kind, a.payload)}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTime(a.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === "messages" ? (
            <div className="max-w-3xl flex flex-col gap-4 h-full min-h-[320px]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">
                    Team messages
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Permalink: add{" "}
                    <code className="text-slate-700">?m=message-id</code> to
                    this URL.
                  </p>
                </div>
                <ul className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]">
                  {messages.length === 0 ? (
                    <li className="text-sm text-slate-600">No messages yet.</li>
                  ) : (
                    messages.map((m) => (
                      <li
                        key={m.id}
                        id={`msg-${m.id}`}
                        className={`rounded-xl px-3 py-2 ${
                          highlightMessageId === m.id
                            ? "bg-amber-50 ring-1 ring-amber-200"
                            : "bg-slate-50"
                        }`}
                      >
                        {m.reply_to_id ? (
                          <p className="text-xs text-slate-500 mb-1">
                            Replying to{" "}
                            <Link
                              href={`?tab=messages&m=${m.reply_to_id}`}
                              className="text-[#15803d] font-medium hover:underline"
                            >
                              earlier message
                            </Link>
                          </p>
                        ) : null}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {nameMap[m.author_clerk_user_id] ?? "Someone"}
                            {m.author_clerk_user_id === currentUserId
                              ? " (you)"
                              : ""}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0">
                            {formatTime(m.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">
                          {m.body}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 min-w-0 max-w-full">
                          <p className="text-[11px] text-slate-400 font-mono min-w-0 max-w-full break-all">
                            id: {m.id}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyToId(m.id);
                              setTab("messages");
                            }}
                            className="text-[11px] font-medium text-[#15803d] hover:underline"
                          >
                            Reply
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
                <form
                  className="p-4 border-t border-slate-100 space-y-2"
                  action={async (formData) => {
                    setMsgError(null);
                    const body = String(formData.get("body") ?? "");
                    const r = await actionPostWorkspaceMessage(
                      projectId,
                      body,
                      replyToId,
                    );
                    if (!r.ok) setMsgError(r.error);
                    else {
                      setReplyToId(null);
                      router.refresh();
                    }
                  }}
                >
                  {replyToId ? (
                    <div className="flex items-start justify-between gap-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-xs text-sky-900">
                      <span className="min-w-0">
                        Replying to{" "}
                        <span className="font-mono break-all">{replyToId}</span>
                        {replyPreview ? (
                          <span className="block text-sky-800 mt-1 line-clamp-2">
                            {replyPreview.body}
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-sky-700 font-medium hover:underline"
                        onClick={() => setReplyToId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                  <label className="sr-only" htmlFor="ws-msg-body">
                    Message
                  </label>
                  <textarea
                    id="ws-msg-body"
                    name="body"
                    rows={3}
                    required
                    placeholder="Write a message…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                  {msgError ? (
                    <p className="text-sm text-red-600">{msgError}</p>
                  ) : null}
                  <button
                    type="submit"
                    className="ven-cta text-sm px-5 py-2 rounded-lg"
                  >
                    Send
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Your status
                </h3>
                <form
                  className="flex flex-col sm:flex-row gap-2"
                  action={async (formData) => {
                    setPresenceError(null);
                    const statusText = String(formData.get("statusText") ?? "");
                    const r = await actionUpsertWorkspacePresence(
                      projectId,
                      statusText,
                    );
                    if (!r.ok) setPresenceError(r.error);
                    else router.refresh();
                  }}
                >
                  <input
                    name="statusText"
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Reviewing wireframes"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
                  >
                    Save status
                  </button>
                </form>
                {presenceError ? (
                  <p className="text-sm text-red-600 mt-2">{presenceError}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "files" ? (
            <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Files
              </h2>
              <form
                className="mb-6 flex flex-col gap-2"
                action={async (formData) => {
                  setUploadError(null);
                  const r = await actionUploadWorkspaceFile(projectId, formData);
                  if (!r.ok) setUploadError(r.error);
                  else router.refresh();
                }}
              >
                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-2">
                    Upload
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#22c55e] has-[input:focus-visible]:ring-offset-2">
                      <input
                        id={workspaceFileInputId}
                        name="file"
                        type="file"
                        required
                        className="sr-only"
                        onChange={(e) =>
                          setWorkspaceUploadFileName(
                            e.target.files?.[0]?.name ?? null,
                          )
                        }
                      />
                      <label
                        htmlFor={workspaceFileInputId}
                        className={workspaceFileChooseButtonClass}
                      >
                        Choose file
                      </label>
                    </div>
                    {workspaceUploadFileName ? (
                      <span className="text-xs text-slate-600 truncate max-w-[min(100%,14rem)]">
                        {workspaceUploadFileName}
                      </span>
                    ) : null}
                  </div>
                </div>
                {uploadError ? (
                  <p className="text-sm text-red-600">{uploadError}</p>
                ) : null}
                <button
                  type="submit"
                  className="ven-cta text-sm px-5 py-2 rounded-lg w-fit"
                >
                  Upload file
                </button>
              </form>
              {files.length === 0 ? (
                <p className="text-sm text-slate-600">No files yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {files.map((f) => {
                    const previewable = getWorkspacePreviewKind(f) !== null;
                    return (
                      <li
                        key={f.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {f.filename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {nameMap[f.uploaded_by_clerk_user_id] ?? "Someone"} ·{" "}
                            {formatBytes(f.byte_size)} ·{" "}
                            {formatTime(f.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {previewable ? (
                            <button
                              type="button"
                              disabled={
                                previewLoading && previewTarget?.id === f.id
                              }
                              onClick={() => void openPreview(f)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                              aria-label={`Preview ${f.filename}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={downloadBusy === f.id}
                            onClick={() => void onDownload(f.id)}
                            className="text-sm font-medium text-[#15803d] hover:underline disabled:opacity-50"
                          >
                            {downloadBusy === f.id ? "…" : "Download"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {tab === "progress" ? (
            <WorkspaceProgressPanel
              projectId={projectId}
              checklist={progressChecklist}
              categoryStatuses={progressCategoryStatuses}
            />
          ) : null}

          {tab === "meeting" ? (
            <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
              <Video className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-700 font-medium">Meeting</p>
              <p className="text-sm text-slate-500 mt-2">Coming soon.</p>
            </div>
          ) : null}
        </div>
      </div>

      {previewTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closePreview}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={previewTitleId}
            className="flex max-h-[min(90vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <h2
                id={previewTitleId}
                className="min-w-0 text-sm font-semibold text-slate-900 truncate pr-2"
              >
                {previewTarget.filename}
              </h2>
              <button
                ref={previewCloseRef}
                type="button"
                onClick={closePreview}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {previewLoading ? (
                <p className="text-sm text-slate-600">Loading preview…</p>
              ) : null}

              {!previewLoading && previewError ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-600">{previewError}</p>
                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#15803d] hover:underline"
                    >
                      Open in new tab
                    </a>
                  ) : null}
                </div>
              ) : null}

              {!previewLoading &&
              !previewError &&
              previewTextOversized &&
              previewKind === "text" ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    This file is too large to preview here. Download it or open
                    it in a new tab.
                  </p>
                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#15803d] hover:underline"
                    >
                      Open in new tab
                    </a>
                  ) : null}
                </div>
              ) : null}

              {!previewLoading &&
              !previewError &&
              !previewTextOversized &&
              previewKind === "image" &&
              previewUrl ? (
                <img
                  src={previewUrl}
                  alt={previewTarget.filename}
                  className="max-h-[min(70vh,600px)] w-auto max-w-full object-contain mx-auto"
                  onError={() =>
                    setPreviewError(
                      "Could not display this image. Try opening in a new tab.",
                    )
                  }
                />
              ) : null}

              {!previewLoading &&
              !previewError &&
              previewKind === "pdf" &&
              previewUrl ? (
                <iframe
                  title={`PDF preview: ${previewTarget.filename}`}
                  src={previewUrl}
                  className="h-[min(70vh,600px)] w-full rounded-lg border border-slate-200 bg-slate-100"
                />
              ) : null}

              {!previewLoading &&
              !previewError &&
              !previewTextOversized &&
              previewKind === "text" &&
              previewText !== null ? (
                <pre className="max-h-[min(70vh,600px)] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 whitespace-pre-wrap wrap-break-word">
                  {previewText}
                </pre>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
