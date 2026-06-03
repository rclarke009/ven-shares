"use client";

import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  actionDeleteWorkspaceMessage,
  actionPostWorkspaceMessage,
  actionUpsertWorkspacePresence,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import type { WorkspaceMessageDTO } from "@/components/workspace/workspace-shell";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  boardParamFromCategory,
  messageBoardLabel,
  messagesMatchBoard,
  resolveBoardCategory,
  TEAM_BOARD_PARAM,
} from "@/lib/workspace-message-boards";

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

function messagePermalink(boardParam: string, messageId: string): string {
  const params = new URLSearchParams({
    tab: "messages",
    board: boardParam,
    m: messageId,
  });
  return `?${params.toString()}`;
}

type WorkspaceMessagesPanelProps = {
  projectId: string;
  currentUserId: string;
  isProjectOwner: boolean;
  requiredJobCategories: ProfessionalJobCategory[];
  messages: WorkspaceMessageDTO[];
  nameMap: Record<string, string>;
  highlightMessageId: string | null;
  initialBoardParam: string;
};

export function WorkspaceMessagesPanel({
  projectId,
  currentUserId,
  isProjectOwner,
  requiredJobCategories,
  messages,
  nameMap,
  highlightMessageId,
  initialBoardParam,
}: WorkspaceMessagesPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [msgPending, startMsgTransition] = useTransition();
  const [refreshPending, startRefreshTransition] = useTransition();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const highlightMessage = highlightMessageId
    ? messages.find((m) => m.id === highlightMessageId)
    : undefined;

  const activeBoardCategory = useMemo(() => {
    const fromUrl = searchParams.get("board") ?? initialBoardParam;
    const fromHighlight = highlightMessage
      ? (highlightMessage.job_category ?? null)
      : null;
    const boardParam =
      highlightMessage && !searchParams.get("board")
        ? boardParamFromCategory(fromHighlight)
        : fromUrl;
    return resolveBoardCategory(boardParam, requiredJobCategories);
  }, [
    searchParams,
    initialBoardParam,
    highlightMessage,
    requiredJobCategories,
  ]);

  const activeBoardParam = boardParamFromCategory(activeBoardCategory);

  const boardMessages = useMemo(
    () =>
      messages.filter((m) =>
        messagesMatchBoard(m.job_category ?? null, activeBoardCategory),
      ),
    [messages, activeBoardCategory],
  );

  const urgentCount = useMemo(
    () => boardMessages.filter((m) => m.is_urgent).length,
    [boardMessages],
  );

  const messageById = useMemo(() => {
    const m = new Map<string, WorkspaceMessageDTO>();
    for (const x of messages) m.set(x.id, x);
    return m;
  }, [messages]);

  const replyPreview = replyToId ? messageById.get(replyToId) : undefined;

  const setBoard = useCallback(
    (category: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "messages");
      params.set("board", boardParamFromCategory(category));
      params.delete("m");
      startRefreshTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, startRefreshTransition],
  );

  const refresh = useCallback(() => {
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router, startRefreshTransition]);

  useEffect(() => {
    if (!highlightMessage) return;
    const correctBoard = boardParamFromCategory(
      highlightMessage.job_category ?? null,
    );
    const currentBoard = searchParams.get("board") ?? initialBoardParam;
    if (currentBoard !== correctBoard) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "messages");
      params.set("board", correctBoard);
      params.set("m", highlightMessage.id);
      startRefreshTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }
  }, [
    highlightMessage,
    searchParams,
    initialBoardParam,
    pathname,
    router,
    startRefreshTransition,
  ]);

  useEffect(() => {
    if (highlightMessageId) {
      const el = document.getElementById(`msg-${highlightMessageId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightMessageId, boardMessages, activeBoardParam]);

  async function onConfirmDelete(messageId: string) {
    setDeleteError(null);
    setDeleteBusy(messageId);
    try {
      const r = await actionDeleteWorkspaceMessage(projectId, messageId);
      if (!r.ok) {
        setDeleteError(r.error);
        return;
      }
      setPendingDeleteId(null);
      if (replyToId === messageId) setReplyToId(null);
      router.refresh();
    } finally {
      setDeleteBusy(null);
    }
  }

  function onSubmitMessage(formData: FormData) {
    setMsgError(null);
    const body = String(formData.get("body") ?? "");
    startMsgTransition(async () => {
      const r = await actionPostWorkspaceMessage(
        projectId,
        body,
        replyToId,
        activeBoardCategory,
        isUrgent,
      );
      if (!r.ok) {
        setMsgError(r.error);
        return;
      }
      setReplyToId(null);
      setIsUrgent(false);
      if (bodyRef.current) bodyRef.current.value = "";
      router.refresh();
    });
  }

  const boards: { category: string | null; label: string }[] = [
    { category: null, label: messageBoardLabel(null) },
    ...requiredJobCategories.map((category) => ({
      category,
      label: messageBoardLabel(category),
    })),
  ];

  return (
    <div className="max-w-3xl flex flex-col gap-4 h-full min-h-[320px]">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                {messageBoardLabel(activeBoardCategory)}
              </h2>
              {urgentCount > 0 ? (
                <p className="text-xs text-amber-700 mt-1">
                  {urgentCount} urgent message{urgentCount === 1 ? "" : "s"} on
                  this board
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshPending || msgPending}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshPending ? "animate-spin" : ""}`}
                aria-hidden
              />
              {refreshPending ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Message boards
            </p>
            <div className="flex flex-wrap gap-2">
            {boards.map(({ category, label }) => {
              const param = boardParamFromCategory(category);
              const isActive = param === activeBoardParam;
              return (
                <button
                  key={param}
                  type="button"
                  onClick={() => setBoard(category)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#15803d] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]">
          {boardMessages.length === 0 ? (
            <li className="text-sm text-slate-600">No messages yet.</li>
          ) : (
            boardMessages.map((m) => {
              const canDelete =
                isProjectOwner || m.author_clerk_user_id === currentUserId;
              const showDeleteConfirm = pendingDeleteId === m.id;
              const boardParam = boardParamFromCategory(
                m.job_category ?? null,
              );

              if (showDeleteConfirm) {
                return (
                  <li
                    key={m.id}
                    id={`msg-${m.id}`}
                    className="rounded-xl px-3 py-2 bg-slate-50 border border-slate-200"
                  >
                    <p className="text-sm text-slate-700">
                      Remove this message? It will be deleted permanently.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button
                        type="button"
                        disabled={deleteBusy === m.id}
                        onClick={() => setPendingDeleteId(null)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteBusy === m.id}
                        onClick={() => void onConfirmDelete(m.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deleteBusy === m.id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={m.id}
                  id={`msg-${m.id}`}
                  className={`rounded-xl px-3 py-2 ${
                    highlightMessageId === m.id
                      ? "bg-amber-50 ring-1 ring-amber-200"
                      : m.is_urgent
                        ? "bg-red-50/80 ring-1 ring-red-200"
                        : "bg-slate-50"
                  }`}
                >
                  {m.reply_to_id ? (
                    <p className="text-xs text-slate-500 mb-1">
                      Replying to{" "}
                      <Link
                        href={messagePermalink(boardParam, m.reply_to_id)}
                        className="text-[#15803d] font-medium hover:underline"
                      >
                        earlier message
                      </Link>
                    </p>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-slate-900">
                        {nameMap[m.author_clerk_user_id] ?? "Someone"}
                        {m.author_clerk_user_id === currentUserId ? " (you)" : ""}
                      </span>
                      {m.is_urgent ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                          Urgent
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">
                    {m.body}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setReplyToId(m.id)}
                      className="text-[11px] font-medium text-[#15803d] hover:underline"
                    >
                      Reply
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDeleteId(m.id);
                        }}
                        className="text-[11px] font-medium text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {deleteError ? (
          <p className="px-4 text-sm text-red-600">{deleteError}</p>
        ) : null}

        <form
          className="p-4 border-t border-slate-100 space-y-2"
          action={onSubmitMessage}
        >
          {replyToId ? (
            <div className="flex items-start justify-between gap-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-xs text-sky-900">
              <span className="min-w-0">
                Replying to a message on this board
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
            ref={bodyRef}
            id="ws-msg-body"
            name="body"
            rows={3}
            required
            disabled={msgPending}
            placeholder="Write a message…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isUrgent}
              disabled={msgPending}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            Mark as urgent
          </label>
          {msgError ? <p className="text-sm text-red-600">{msgError}</p> : null}
          <button
            type="submit"
            disabled={msgPending}
            className="ven-cta text-sm px-5 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
          >
            {msgPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Send"
            )}
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
            const r = await actionUpsertWorkspacePresence(projectId, statusText);
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
  );
}

export { TEAM_BOARD_PARAM };
