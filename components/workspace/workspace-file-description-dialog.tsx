"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { actionUpdateWorkspaceFileDescription } from "@/app/idea-arena/[projectId]/workspace/actions";
import type { WorkspaceFileDTO } from "@/components/workspace/workspace-shell";

type WorkspaceFileDescriptionDialogProps = {
  projectId: string;
  file: WorkspaceFileDTO | null;
  onClose: () => void;
  onSaved: () => void;
};

export function WorkspaceFileDescriptionDialog({
  projectId,
  file,
  onClose,
  onSaved,
}: WorkspaceFileDescriptionDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setDraft(file.description ?? "");
    setError(null);
    setPending(false);
  }, [file]);

  const handleClose = useCallback(() => {
    if (pending) return;
    onClose();
  }, [pending, onClose]);

  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [file, handleClose]);

  useEffect(() => {
    if (!file) return;
    const id = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [file]);

  async function onSave() {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const r = await actionUpdateWorkspaceFileDescription(
        projectId,
        file.id,
        draft,
      );
      if (!r.ok) {
        setError(r.error);
      } else {
        onSaved();
        onClose();
      }
    } finally {
      setPending(false);
    }
  }

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2
            id={titleId}
            className="min-w-0 text-sm font-semibold text-slate-900 truncate pr-2"
          >
            Edit description
          </h2>
          <button
            ref={closeRef}
            type="button"
            disabled={pending}
            onClick={handleClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500 truncate">{file.filename}</p>
          <label className="sr-only" htmlFor={`${titleId}-desc`}>
            File description
          </label>
          <textarea
            id={`${titleId}-desc`}
            rows={4}
            maxLength={500}
            value={draft}
            disabled={pending}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Description (optional)…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
          />
          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={handleClose}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void onSave()}
              className="ven-cta text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
