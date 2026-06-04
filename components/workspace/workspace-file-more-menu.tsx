"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkspaceFileDTO } from "@/components/workspace/workspace-shell";
import { buildWorkspaceFileShareInvite } from "@/lib/workspace-file-share";
import { getWorkspacePreviewKind } from "@/lib/workspace-preview";

type WorkspaceFileMoreMenuProps = {
  file: WorkspaceFileDTO;
  projectId: string;
  projectTitle: string;
  allowPreview: boolean;
  canEdit: boolean;
  canArchive: boolean;
  onPreview: (file: WorkspaceFileDTO) => void;
  onEditDescription: (file: WorkspaceFileDTO) => void;
  onRequestArchive: (fileId: string) => void;
};

export function WorkspaceFileMoreMenu({
  file,
  projectId,
  projectTitle,
  allowPreview,
  canEdit,
  canArchive,
  onPreview,
  onEditDescription,
  onRequestArchive,
}: WorkspaceFileMoreMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewable = allowPreview && getWorkspacePreviewKind(file) !== null;

  const close = useCallback(() => {
    setOpen(false);
    setForwardOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!open || !menuRef.current || !rootRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const rootRect = rootRef.current.getBoundingClientRect();
    const clippingAncestors: Array<{
      tag: string;
      className: string;
      overflow: string;
      overflowY: string;
      rect: DOMRect;
    }> = [];

    let el: HTMLElement | null = rootRef.current.parentElement;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const overflow = style.overflow;
      const overflowY = style.overflowY;
      if (
        overflow === "hidden" ||
        overflow === "clip" ||
        overflowY === "hidden" ||
        overflowY === "clip"
      ) {
        clippingAncestors.push({
          tag: el.tagName,
          className: el.className.slice(0, 120),
          overflow,
          overflowY,
          rect: el.getBoundingClientRect(),
        });
      }
      el = el.parentElement;
    }

    const menuBottom = menuRect.bottom;
    const clippedBy = clippingAncestors.filter(
      (a) => menuBottom > a.rect.bottom || menuRect.top < a.rect.top,
    );

    // #region agent log
    fetch("http://127.0.0.1:7631/ingest/b7a73249-9195-4c44-b33e-29a5fc0583a9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "a8e89e",
      },
      body: JSON.stringify({
        sessionId: "a8e89e",
        location: "workspace-file-more-menu.tsx:open-effect",
        message: "More menu opened — layout diagnostics",
        data: {
          menuRect: {
            top: menuRect.top,
            bottom: menuRect.bottom,
            height: menuRect.height,
          },
          triggerRect: {
            top: rootRect.top,
            bottom: rootRect.bottom,
          },
          clippingAncestorCount: clippingAncestors.length,
          clippingAncestors,
          likelyClippedBy: clippedBy,
          menuExtendsBelowTrigger: menuRect.bottom > rootRect.bottom,
        },
        timestamp: Date.now(),
        hypothesisId: "A-B-E",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
  }, [open]);

  const buildInvite = useCallback(
    () =>
      buildWorkspaceFileShareInvite({
        origin: window.location.origin,
        projectId,
        projectTitle,
        fileId: file.id,
        filename: file.filename,
        description: file.description,
        jobCategory: file.job_category,
      }),
    [projectId, projectTitle, file],
  );

  const handleEmailLink = useCallback(() => {
    window.location.href = buildInvite().mailtoHref;
    close();
  }, [buildInvite, close]);

  const handleCopyLink = useCallback(async () => {
    const url = buildInvite().shareUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      close();
    } catch {
      window.prompt("Copy this file link:", url);
      close();
    }
  }, [buildInvite, close]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
          setForwardOpen(false);
        }}
        className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
      >
        {copied ? "Copied!" : "More …"}
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {previewable ? (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                close();
                onPreview(file);
              }}
              className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Preview
            </button>
          ) : null}

          <div className="relative">
            <button
              type="button"
              role="menuitem"
              aria-expanded={forwardOpen}
              onClick={(e) => {
                e.stopPropagation();
                setForwardOpen((v) => !v);
              }}
              className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Forward
            </button>
            {forwardOpen ? (
              <div className="border-t border-slate-100 bg-slate-50/80 py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEmailLink();
                  }}
                  className="block w-full px-4 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Email link
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleCopyLink();
                  }}
                  className="block w-full px-4 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Copy link
                </button>
              </div>
            ) : null}
          </div>

          {canEdit ? (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                close();
                onEditDescription(file);
              }}
              className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Edit desc
            </button>
          ) : null}

          {canArchive ? (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                close();
                onRequestArchive(file.id);
              }}
              className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Archive
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
