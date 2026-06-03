"use client";

import { Archive } from "lucide-react";

type WorkspaceArchiveControlProps = {
  /** When set, shows confirm UI instead of the archive icon trigger. */
  showConfirm?: boolean;
  confirmMessage?: string;
  pending?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  onRequestArchive?: () => void;
  disabled?: boolean;
  /** sm = progress rows; md = messages/files (default) */
  size?: "sm" | "md";
  className?: string;
};

export function WorkspaceArchiveControl({
  confirmMessage = "",
  pending = false,
  onCancel,
  onConfirm,
  showConfirm = false,
  onRequestArchive,
  disabled = false,
  size = "md",
  className = "",
}: WorkspaceArchiveControlProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize =
    size === "sm"
      ? "h-7 w-7 rounded-md"
      : "h-9 w-9 rounded-lg";

  if (showConfirm) {
    return (
      <div
        className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full ${className}`}
      >
        <p className={size === "sm" ? "text-xs text-slate-700" : "text-sm text-slate-700"}>
          {confirmMessage}
        </p>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={pending}
            onClick={() => onCancel?.()}
            className={
              size === "sm"
                ? "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                : "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            }
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onConfirm?.()}
            className={
              size === "sm"
                ? "rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
                : "rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
            }
          >
            {pending ? "Archiving…" : "Archive"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={(e) => {
        e.stopPropagation();
        onRequestArchive?.();
      }}
      className={`inline-flex shrink-0 items-center justify-center border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 ${buttonSize} ${className}`}
      aria-label="Archive"
    >
      <Archive className={iconSize} aria-hidden />
    </button>
  );
}
