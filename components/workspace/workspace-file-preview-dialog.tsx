"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef } from "react";

import {
  MAX_TEXT_PREVIEW_BYTES,
  getWorkspacePreviewKind,
} from "@/lib/workspace-preview";

export type WorkspaceFilePreviewTarget = {
  id: string;
  filename: string;
  content_type: string | null;
  byte_size: number;
};

type WorkspaceFilePreviewDialogProps = {
  target: WorkspaceFilePreviewTarget | null;
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  previewText: string | null;
  previewTextOversized: boolean;
  onClose: () => void;
  onPreviewError: (message: string) => void;
};

export function WorkspaceFilePreviewDialog({
  target,
  previewUrl,
  previewLoading,
  previewError,
  previewText,
  previewTextOversized,
  onClose,
  onPreviewError,
}: WorkspaceFilePreviewDialogProps) {
  const previewTitleId = useId();
  const previewCloseRef = useRef<HTMLButtonElement>(null);

  const previewKind = target ? getWorkspacePreviewKind(target) : null;

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  useEffect(() => {
    if (!target) return;
    const id = window.requestAnimationFrame(() => {
      previewCloseRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [target]);

  const handleImageError = useCallback(() => {
    onPreviewError("Could not display this image. Try opening in a new tab.");
  }, [onPreviewError]);

  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
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
            {target.filename}
          </h2>
          <button
            ref={previewCloseRef}
            type="button"
            onClick={onClose}
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
                This file is too large to preview here. Download it or open it in
                a new tab.
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
              alt={target.filename}
              className="max-h-[min(70vh,600px)] w-auto max-w-full object-contain mx-auto"
              onError={handleImageError}
            />
          ) : null}

          {!previewLoading && !previewError && previewKind === "pdf" && previewUrl ? (
            <iframe
              title={`PDF preview: ${target.filename}`}
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
  );
}

export { MAX_TEXT_PREVIEW_BYTES };
