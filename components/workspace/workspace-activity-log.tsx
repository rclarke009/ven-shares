import Link from "next/link";

import type { WorkspaceActivityDTO } from "@/components/workspace/workspace-shell";
import {
  boardParamFromCategory,
  messageActivityBoardSuffix,
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

function activityDescription(
  kind: string,
  payload: Record<string, unknown> | null,
): string {
  if (kind === "message_posted") {
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    const suffix = messageActivityBoardSuffix(category);
    const urgent = payload?.is_urgent === true;
    return urgent
      ? `Posted an urgent message${suffix}`
      : `Posted a message${suffix}`;
  }
  if (kind === "message_deleted") {
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return `Archived a message${messageActivityBoardSuffix(category)}`;
  }
  if (kind === "file_uploaded") {
    const name =
      typeof payload?.filename === "string" ? payload.filename : "a file";
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return category ? `Uploaded ${name} for ${category}` : `Uploaded ${name}`;
  }
  if (kind === "file_deleted") {
    const name =
      typeof payload?.filename === "string" ? payload.filename : "a file";
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return category ? `Archived ${name} from ${category}` : `Archived ${name}`;
  }
  if (kind === "file_updated") {
    const name =
      typeof payload?.filename === "string" ? payload.filename : "a file";
    const category =
      typeof payload?.job_category === "string" ? payload.job_category : null;
    return category
      ? `Updated description for ${name} in ${category}`
      : `Updated description for ${name}`;
  }
  if (kind === "status_updated") {
    const s =
      typeof payload?.status_text === "string" ? payload.status_text : "";
    return s ? `Set status: ${s}` : "Updated status";
  }
  return kind.replace(/_/g, " ");
}

function activityMessagePermalink(
  payload: Record<string, unknown> | null,
): string | null {
  const messageId =
    typeof payload?.message_id === "string" ? payload.message_id : null;
  if (!messageId) return null;
  const category =
    typeof payload?.job_category === "string" ? payload.job_category : null;
  const board = boardParamFromCategory(category);
  const params = new URLSearchParams({
    tab: "messages",
    board,
    m: messageId,
  });
  return `?${params.toString()}`;
}

function isUrgentMessageActivity(
  kind: string,
  payload: Record<string, unknown> | null,
): boolean {
  return kind === "message_posted" && payload?.is_urgent === true;
}

type WorkspaceActivityLogProps = {
  activities: WorkspaceActivityDTO[];
  nameMap: Record<string, string>;
};

export function WorkspaceActivityLog({
  activities,
  nameMap,
}: WorkspaceActivityLogProps) {
  return (
    <div className="border-t border-slate-600/80 p-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
        Activity log
      </p>
      {activities.length === 0 ? (
        <p className="text-xs text-slate-500">No activity yet.</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {activities.map((a) => {
            const urgent = isUrgentMessageActivity(a.kind, a.payload);
            const messageLink = activityMessagePermalink(a.payload);
            return (
              <li
                key={a.id}
                className={`text-xs leading-snug ${
                  urgent ? "border-l-2 border-l-red-400 pl-2" : ""
                }`}
              >
                <span className="font-medium text-white">
                  {nameMap[a.actor_clerk_user_id] ?? "Someone"}
                </span>
                <span className={urgent ? "text-red-300" : "text-slate-300"}>
                  {" "}
                  {activityDescription(a.kind, a.payload)}
                </span>
                {messageLink ? (
                  <Link
                    href={messageLink}
                    className="block text-[11px] font-medium text-emerald-400 hover:underline mt-0.5"
                  >
                    View message
                  </Link>
                ) : null}
                <p className="text-slate-500 mt-0.5">{formatTime(a.created_at)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
