"use client";

import { ChevronDown, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useRef, useState } from "react";

import {
  actionDeleteWorkspaceFile,
  actionGetWorkspaceFileDownloadUrl,
  actionUploadWorkspaceFile,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import {
  WorkspaceFilePreviewDialog,
  MAX_TEXT_PREVIEW_BYTES,
} from "@/components/workspace/workspace-file-preview-dialog";
import type { WorkspaceFileDTO } from "@/components/workspace/workspace-shell";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  getWorkspacePreviewKind,
  isTextPreviewTooLarge,
} from "@/lib/workspace-preview";

const workspaceFileChooseButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

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

function useWorkspaceFileActions(projectId: string) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<WorkspaceFileDTO | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewTextOversized, setPreviewTextOversized] = useState(false);

  const closePreview = useCallback(() => {
    setPreviewTarget(null);
    setPreviewUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewText(null);
    setPreviewTextOversized(false);
  }, []);

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

  async function onConfirmDelete(fileId: string) {
    setDeleteError(null);
    setDeleteBusy(fileId);
    try {
      const r = await actionDeleteWorkspaceFile(projectId, fileId);
      if (!r.ok) {
        setDeleteError(r.error);
      } else {
        setPendingDeleteId(null);
        router.refresh();
      }
    } finally {
      setDeleteBusy(null);
    }
  }

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
        setPreviewText(text);
      } catch {
        setPreviewError("Could not load file text. Try opening in a new tab.");
      }
      setPreviewLoading(false);
      return;
    }

    setPreviewUrl(r.url);
    setPreviewLoading(false);
  }

  return {
    deleteError,
    pendingDeleteId,
    deleteBusy,
    downloadBusy,
    previewTarget,
    previewUrl,
    previewLoading,
    previewError,
    previewText,
    previewTextOversized,
    closePreview,
    onDownload,
    onConfirmDelete,
    openPreview,
    onRequestDelete: (fileId: string) => {
      setPendingDeleteId(fileId);
      setDeleteError(null);
    },
    onCancelDelete: () => {
      setPendingDeleteId(null);
      setDeleteError(null);
    },
    setPreviewError,
  };
}

type FileRowProps = {
  file: WorkspaceFileDTO;
  nameMap: Record<string, string>;
  canRemove: boolean;
  allowPreview: boolean;
  pendingDeleteId: string | null;
  deleteBusy: string | null;
  downloadBusy: string | null;
  previewLoading: boolean;
  previewTargetId: string | null;
  onDownload: (fileId: string) => void;
  onPreview: (file: WorkspaceFileDTO) => void;
  onRequestDelete: (fileId: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (fileId: string) => void;
};

function FileRow({
  file,
  nameMap,
  canRemove,
  allowPreview,
  pendingDeleteId,
  deleteBusy,
  downloadBusy,
  previewLoading,
  previewTargetId,
  onDownload,
  onPreview,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: FileRowProps) {
  const previewable = allowPreview && getWorkspacePreviewKind(file) !== null;
  const showDeleteConfirm = pendingDeleteId === file.id;

  if (showDeleteConfirm) {
    return (
      <li className="px-3 py-2.5 bg-slate-50/50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            Remove this file? It will move to Removed files.
          </p>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={deleteBusy === file.id}
              onClick={onCancelDelete}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteBusy === file.id}
              onClick={() => void onConfirmDelete(file.id)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {deleteBusy === file.id ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="px-3 py-2.5 bg-slate-50/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {file.filename}
          </p>
          {file.description ? (
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
              {file.description}
            </p>
          ) : null}
          <p className="text-xs text-slate-500 mt-0.5">
            {nameMap[file.uploaded_by_clerk_user_id] ?? "Someone"} ·{" "}
            {formatBytes(file.byte_size)} · {formatTime(file.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {previewable ? (
            <button
              type="button"
              disabled={previewLoading && previewTargetId === file.id}
              onClick={() => void onPreview(file)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              aria-label={`Preview ${file.filename}`}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            disabled={downloadBusy === file.id}
            onClick={() => void onDownload(file.id)}
            className="text-xs font-medium text-[#15803d] hover:underline disabled:opacity-50"
          >
            {downloadBusy === file.id ? "…" : "Download"}
          </button>
          {canRemove ? (
            <button
              type="button"
              onClick={() => onRequestDelete(file.id)}
              className="text-xs font-medium text-slate-500 hover:text-red-700 hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

type SkillFileUploadFormProps = {
  projectId: string;
  jobCategory: ProfessionalJobCategory;
  formIdSuffix: string;
};

function SkillFileUploadForm({
  projectId,
  jobCategory,
  formIdSuffix,
}: SkillFileUploadFormProps) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-2 mb-3"
      action={async (formData) => {
        setUploadError(null);
        const r = await actionUploadWorkspaceFile(projectId, formData);
        if (!r.ok) {
          setUploadError(r.error);
        } else {
          setFileName(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          router.refresh();
        }
      }}
    >
      <input type="hidden" name="job_category" value={jobCategory} />
      <label className="sr-only" htmlFor={`${fileInputId}-${formIdSuffix}-desc`}>
        File description
      </label>
      <textarea
        id={`${fileInputId}-${formIdSuffix}-desc`}
        name="description"
        rows={2}
        maxLength={500}
        placeholder="Description (optional)…"
        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800 placeholder:text-slate-400"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#22c55e] has-[input:focus-visible]:ring-offset-2">
          <input
            ref={fileInputRef}
            id={`${fileInputId}-${formIdSuffix}`}
            name="file"
            type="file"
            required
            className="sr-only"
            onChange={(e) =>
              setFileName(e.target.files?.[0]?.name ?? null)
            }
          />
          <label
            htmlFor={`${fileInputId}-${formIdSuffix}`}
            className={workspaceFileChooseButtonClass}
          >
            Choose file
          </label>
        </div>
        {fileName ? (
          <span className="text-xs text-slate-600 truncate max-w-[min(100%,12rem)]">
            {fileName}
          </span>
        ) : null}
        <button
          type="submit"
          className="ven-cta text-xs px-3 py-2 rounded-lg"
        >
          Upload
        </button>
      </div>
      {uploadError ? (
        <p className="text-xs text-red-600">{uploadError}</p>
      ) : null}
    </form>
  );
}

type OrganizerSkillFilesProps = {
  projectId: string;
  category: ProfessionalJobCategory;
  files: WorkspaceFileDTO[];
  nameMap: Record<string, string>;
  currentUserId: string;
  isProjectOwner: boolean;
};

export function OrganizerSkillFiles({
  projectId,
  category,
  files,
  nameMap,
  currentUserId,
  isProjectOwner,
}: OrganizerSkillFilesProps) {
  const actions = useWorkspaceFileActions(projectId);
  const [removedExpanded, setRemovedExpanded] = useState(false);

  const activeFiles = useMemo(
    () =>
      files.filter((f) => f.job_category === category && !f.deleted_at),
    [files, category],
  );
  const removedFiles = useMemo(
    () =>
      files.filter((f) => f.job_category === category && f.deleted_at),
    [files, category],
  );

  const formIdSuffix = category.replace(/[^a-zA-Z0-9]+/g, "-");

  const rowProps = {
    nameMap,
    pendingDeleteId: actions.pendingDeleteId,
    deleteBusy: actions.deleteBusy,
    downloadBusy: actions.downloadBusy,
    previewLoading: actions.previewLoading,
    previewTargetId: actions.previewTarget?.id ?? null,
    onDownload: actions.onDownload,
    onPreview: actions.openPreview,
    onRequestDelete: actions.onRequestDelete,
    onCancelDelete: actions.onCancelDelete,
    onConfirmDelete: actions.onConfirmDelete,
    allowPreview: true,
  };

  return (
    <div className="border-t border-slate-200/80 px-4 py-4 bg-slate-50/30">
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Files
      </h4>
      <SkillFileUploadForm
        projectId={projectId}
        jobCategory={category}
        formIdSuffix={formIdSuffix}
      />
      {activeFiles.length === 0 ? (
        <p className="text-xs text-slate-500 mb-2">No files for this skill yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden mb-2">
          {activeFiles.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              canRemove={
                f.uploaded_by_clerk_user_id === currentUserId || isProjectOwner
              }
              {...rowProps}
            />
          ))}
        </ul>
      )}
      {actions.deleteError ? (
        <p className="text-xs text-red-600 mb-2">{actions.deleteError}</p>
      ) : null}
      {removedFiles.length > 0 ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setRemovedExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-slate-100/80 text-left hover:bg-slate-100 transition text-xs"
            aria-expanded={removedExpanded}
          >
            <span className="font-medium text-slate-600">
              Removed files ({removedFiles.length})
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${removedExpanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {removedExpanded ? (
            <ul className="divide-y divide-slate-100">
              {removedFiles.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50/30"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {f.filename}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Removed by{" "}
                      {nameMap[f.deleted_by_clerk_user_id ?? ""] ?? "Someone"}{" "}
                      · {formatTime(f.deleted_at ?? f.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actions.downloadBusy === f.id}
                    onClick={() => void actions.onDownload(f.id)}
                    className="text-xs font-medium text-slate-500 hover:text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
                  >
                    {actions.downloadBusy === f.id ? "…" : "Download"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <WorkspaceFilePreviewDialog
        target={actions.previewTarget}
        previewUrl={actions.previewUrl}
        previewLoading={actions.previewLoading}
        previewError={actions.previewError}
        previewText={actions.previewText}
        previewTextOversized={actions.previewTextOversized}
        onClose={actions.closePreview}
        onPreviewError={actions.setPreviewError}
      />
    </div>
  );
}

type OrganizerUncategorizedFilesProps = {
  projectId: string;
  files: WorkspaceFileDTO[];
  nameMap: Record<string, string>;
  currentUserId: string;
  isProjectOwner: boolean;
};

export function OrganizerUncategorizedFiles({
  projectId,
  files,
  nameMap,
  currentUserId,
  isProjectOwner,
}: OrganizerUncategorizedFilesProps) {
  const actions = useWorkspaceFileActions(projectId);
  const [removedExpanded, setRemovedExpanded] = useState(false);

  const activeFiles = useMemo(
    () => files.filter((f) => !f.job_category && !f.deleted_at),
    [files],
  );
  const removedFiles = useMemo(
    () => files.filter((f) => !f.job_category && f.deleted_at),
    [files],
  );

  if (activeFiles.length === 0 && removedFiles.length === 0) {
    return null;
  }

  const rowProps = {
    nameMap,
    pendingDeleteId: actions.pendingDeleteId,
    deleteBusy: actions.deleteBusy,
    downloadBusy: actions.downloadBusy,
    previewLoading: actions.previewLoading,
    previewTargetId: actions.previewTarget?.id ?? null,
    onDownload: actions.onDownload,
    onPreview: actions.openPreview,
    onRequestDelete: actions.onRequestDelete,
    onCancelDelete: actions.onCancelDelete,
    onConfirmDelete: actions.onConfirmDelete,
    allowPreview: false,
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4">
      <h3 className="text-sm font-semibold text-slate-900">Uncategorized files</h3>
      <p className="text-xs text-slate-500 mt-1 mb-3">
        Uploaded before skill folders were added.
      </p>
      {activeFiles.length === 0 ? (
        <p className="text-xs text-slate-500">No active uncategorized files.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden mb-2">
          {activeFiles.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              canRemove={
                f.uploaded_by_clerk_user_id === currentUserId || isProjectOwner
              }
              {...rowProps}
            />
          ))}
        </ul>
      )}
      {actions.deleteError ? (
        <p className="text-xs text-red-600 mb-2">{actions.deleteError}</p>
      ) : null}
      {removedFiles.length > 0 ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setRemovedExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-slate-100/80 text-left hover:bg-slate-100 transition text-xs"
            aria-expanded={removedExpanded}
          >
            <span className="font-medium text-slate-600">
              Removed uncategorized ({removedFiles.length})
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${removedExpanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {removedExpanded ? (
            <ul className="divide-y divide-slate-100">
              {removedFiles.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50/30"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {f.filename}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Removed by{" "}
                      {nameMap[f.deleted_by_clerk_user_id ?? ""] ?? "Someone"}{" "}
                      · {formatTime(f.deleted_at ?? f.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actions.downloadBusy === f.id}
                    onClick={() => void actions.onDownload(f.id)}
                    className="text-xs font-medium text-slate-500 hover:text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
                  >
                    {actions.downloadBusy === f.id ? "…" : "Download"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
