"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnchoredMenuPanel } from "@/components/workspace/anchored-menu-panel";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
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
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      close();
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
        ref={triggerRef}
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

      <AnchoredMenuPanel
        open={open}
        triggerRef={triggerRef}
        menuRef={menuRef}
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
      </AnchoredMenuPanel>
    </div>
  );
}
