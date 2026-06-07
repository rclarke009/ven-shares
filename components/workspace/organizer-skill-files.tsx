"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  actionArchiveWorkspaceFile,
  actionGetWorkspaceFileDownloadUrl,
  actionUploadWorkspaceFile,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import { WorkspaceFileDescriptionDialog } from "@/components/workspace/workspace-file-description-dialog";
import { WorkspaceFileMoreMenu } from "@/components/workspace/workspace-file-more-menu";
import { WorkspaceFileThumbnail } from "@/components/workspace/workspace-file-thumbnail";
import { WorkspaceFileUploadPreview } from "@/components/workspace/workspace-file-upload-preview";
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

type ArchivedFileRowProps = {
  projectId: string;
  file: WorkspaceFileDTO;
  nameMap: Record<string, string>;
  downloadBusy: string | null;
  onDownload: (fileId: string) => void;
  onPreview: (file: WorkspaceFileDTO) => void;
};

function ArchivedFileRow({
  projectId,
  file,
  nameMap,
  downloadBusy,
  onDownload,
  onPreview,
}: ArchivedFileRowProps) {
  const previewable = getWorkspacePreviewKind(file) !== null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50/30">
      <div className="flex min-w-0 items-start gap-3">
        <WorkspaceFileThumbnail
          projectId={projectId}
          fileId={file.id}
          filename={file.filename}
          content_type={file.content_type}
          dimmed
          onThumbClick={
            previewable ? () => void onPreview(file) : undefined
          }
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {previewable ? (
              <button
                type="button"
                onClick={() => void onPreview(file)}
                className="text-xs font-medium text-slate-500 truncate text-left hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] rounded"
                aria-label={`Preview ${file.filename}`}
              >
                {file.filename}
              </button>
            ) : (
              <p className="text-xs font-medium text-slate-500 truncate">
                {file.filename}
              </p>
            )}
            <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Archived
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Archived by{" "}
            {nameMap[file.deleted_by_clerk_user_id ?? ""] ?? "Someone"} ·{" "}
            {formatTime(file.deleted_at ?? file.created_at)}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={downloadBusy === file.id}
        onClick={() => void onDownload(file.id)}
        className="text-xs font-medium text-slate-500 hover:text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
      >
        {downloadBusy === file.id ? "…" : "Download"}
      </button>
    </li>
  );
}

function useWorkspaceFileActions(projectId: string) {
  const router = useRouter();
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [archiveBusy, setArchiveBusy] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);
  const [editDescriptionTarget, setEditDescriptionTarget] =
    useState<WorkspaceFileDTO | null>(null);
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

  async function onConfirmArchive(fileId: string) {
    setArchiveError(null);
    setArchiveBusy(fileId);
    try {
      const r = await actionArchiveWorkspaceFile(projectId, fileId);
      if (!r.ok) {
        setArchiveError(r.error);
      } else {
        setPendingArchiveId(null);
        router.refresh();
      }
    } finally {
      setArchiveBusy(null);
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
    archiveError,
    pendingArchiveId,
    archiveBusy,
    downloadBusy,
    editDescriptionTarget,
    setEditDescriptionTarget,
    previewTarget,
    previewUrl,
    previewLoading,
    previewError,
    previewText,
    previewTextOversized,
    closePreview,
    onDownload,
    onConfirmArchive,
    openPreview,
    onRequestArchive: (fileId: string) => {
      setPendingArchiveId(fileId);
      setArchiveError(null);
    },
    onCancelArchive: () => {
      setPendingArchiveId(null);
      setArchiveError(null);
    },
    setPreviewError,
    onDescriptionSaved: () => router.refresh(),
  };
}

type FileRowProps = {
  file: WorkspaceFileDTO;
  nameMap: Record<string, string>;
  projectId: string;
  projectTitle: string;
  canManage: boolean;
  allowPreview: boolean;
  highlighted: boolean;
  pendingArchiveId: string | null;
  archiveBusy: string | null;
  downloadBusy: string | null;
  onDownload: (fileId: string) => void;
  onPreview: (file: WorkspaceFileDTO) => void;
  onEditDescription: (file: WorkspaceFileDTO) => void;
  onRequestArchive: (fileId: string) => void;
  onCancelArchive: () => void;
  onConfirmArchive: (fileId: string) => void;
};

function FileRow({
  file,
  nameMap,
  projectId,
  projectTitle,
  canManage,
  allowPreview,
  highlighted,
  pendingArchiveId,
  archiveBusy,
  downloadBusy,
  onDownload,
  onPreview,
  onEditDescription,
  onRequestArchive,
  onCancelArchive,
  onConfirmArchive,
}: FileRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const showArchiveConfirm = pendingArchiveId === file.id;

  useEffect(() => {
    if (!highlighted || !rowRef.current) return;
    rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlighted]);

  if (showArchiveConfirm) {
    return (
      <li ref={rowRef} id={`file-${file.id}`} className="px-3 py-2.5 bg-slate-50/50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            Archive this file? It will move to archived files.
          </p>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={archiveBusy === file.id}
              onClick={onCancelArchive}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={archiveBusy === file.id}
              onClick={() => void onConfirmArchive(file.id)}
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
            >
              {archiveBusy === file.id ? "Archiving…" : "Archive"}
            </button>
          </div>
        </div>
      </li>
    );
  }

  const previewable = allowPreview && getWorkspacePreviewKind(file) !== null;

  return (
    <li
      ref={rowRef}
      id={`file-${file.id}`}
      className={`px-3 py-2.5 bg-slate-50/50 ${highlighted ? "ring-2 ring-inset ring-amber-200" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <WorkspaceFileThumbnail
            projectId={projectId}
            fileId={file.id}
            filename={file.filename}
            content_type={file.content_type}
            onThumbClick={
              previewable ? () => void onPreview(file) : undefined
            }
          />
          <div className="min-w-0">
            {file.description ? (
              <p className="text-sm font-medium text-slate-900 line-clamp-2">
                {file.description}
              </p>
            ) : null}
            {previewable ? (
              <button
                type="button"
                onClick={() => void onPreview(file)}
                className={`truncate text-left hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] rounded max-w-full ${
                  file.description
                    ? "mt-0.5 text-xs font-medium text-slate-500"
                    : "text-sm font-medium text-slate-900"
                }`}
                aria-label={`Preview ${file.filename}`}
              >
                {file.filename}
              </button>
            ) : (
              <p
                className={`truncate ${
                  file.description
                    ? "mt-0.5 text-xs font-medium text-slate-500"
                    : "text-sm font-medium text-slate-900"
                }`}
              >
                {file.filename}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {nameMap[file.uploaded_by_clerk_user_id] ?? "Someone"} ·{" "}
              {formatBytes(file.byte_size)} · {formatTime(file.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={downloadBusy === file.id}
            onClick={() => void onDownload(file.id)}
            className="text-xs font-medium text-[#15803d] hover:underline disabled:opacity-50"
          >
            {downloadBusy === file.id ? "…" : "Download"}
          </button>
          <WorkspaceFileMoreMenu
            file={file}
            projectId={projectId}
            projectTitle={projectTitle}
            allowPreview={allowPreview}
            canEdit={canManage}
            canArchive={canManage}
            onPreview={onPreview}
            onEditDescription={onEditDescription}
            onRequestArchive={onRequestArchive}
          />
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
          setSelectedFile(null);
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
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setSelectedFile(f);
              setFileName(f?.name ?? null);
            }}
          />
          <label
            htmlFor={`${fileInputId}-${formIdSuffix}`}
            className={workspaceFileChooseButtonClass}
          >
            Choose file
          </label>
        </div>
        <WorkspaceFileUploadPreview file={selectedFile} />
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
  projectTitle: string;
  category: ProfessionalJobCategory;
  files: WorkspaceFileDTO[];
  nameMap: Record<string, string>;
  currentUserId: string;
  isProjectOwner: boolean;
  highlightFileId?: string | null;
};

export function OrganizerSkillFiles({
  projectId,
  projectTitle,
  category,
  files,
  nameMap,
  currentUserId,
  isProjectOwner,
  highlightFileId = null,
}: OrganizerSkillFilesProps) {
  const actions = useWorkspaceFileActions(projectId);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const activeFiles = useMemo(
    () =>
      files.filter((f) => f.job_category === category && !f.deleted_at),
    [files, category],
  );
  const archivedFiles = useMemo(
    () =>
      files.filter((f) => f.job_category === category && f.deleted_at),
    [files, category],
  );

  const formIdSuffix = category.replace(/[^a-zA-Z0-9]+/g, "-");

  const rowProps = {
    nameMap,
    projectId,
    projectTitle,
    pendingArchiveId: actions.pendingArchiveId,
    archiveBusy: actions.archiveBusy,
    downloadBusy: actions.downloadBusy,
    onDownload: actions.onDownload,
    onPreview: actions.openPreview,
    onEditDescription: actions.setEditDescriptionTarget,
    onRequestArchive: actions.onRequestArchive,
    onCancelArchive: actions.onCancelArchive,
    onConfirmArchive: actions.onConfirmArchive,
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
              highlighted={highlightFileId === f.id}
              canManage={
                f.uploaded_by_clerk_user_id === currentUserId || isProjectOwner
              }
              {...rowProps}
            />
          ))}
        </ul>
      )}
      {actions.archiveError ? (
        <p className="text-xs text-red-600 mb-2">{actions.archiveError}</p>
      ) : null}
      {archivedFiles.length > 0 ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setArchivedExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-slate-100/80 text-left hover:bg-slate-100 transition text-xs"
            aria-expanded={archivedExpanded}
          >
            <span className="font-medium text-slate-600">
              Archived files ({archivedFiles.length})
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${archivedExpanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {archivedExpanded ? (
            <ul className="divide-y divide-slate-100">
              {archivedFiles.map((f) => (
                <ArchivedFileRow
                  key={f.id}
                  projectId={projectId}
                  file={f}
                  nameMap={nameMap}
                  downloadBusy={actions.downloadBusy}
                  onDownload={actions.onDownload}
                  onPreview={actions.openPreview}
                />
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
      <WorkspaceFileDescriptionDialog
        projectId={projectId}
        file={actions.editDescriptionTarget}
        onClose={() => actions.setEditDescriptionTarget(null)}
        onSaved={actions.onDescriptionSaved}
      />
    </div>
  );
}

type OrganizerUncategorizedFilesProps = {
  projectId: string;
  projectTitle: string;
  files: WorkspaceFileDTO[];
  nameMap: Record<string, string>;
  currentUserId: string;
  isProjectOwner: boolean;
  highlightFileId?: string | null;
};

export function OrganizerUncategorizedFiles({
  projectId,
  projectTitle,
  files,
  nameMap,
  currentUserId,
  isProjectOwner,
  highlightFileId = null,
}: OrganizerUncategorizedFilesProps) {
  const actions = useWorkspaceFileActions(projectId);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const activeFiles = useMemo(
    () => files.filter((f) => !f.job_category && !f.deleted_at),
    [files],
  );
  const archivedFiles = useMemo(
    () => files.filter((f) => !f.job_category && f.deleted_at),
    [files],
  );

  if (activeFiles.length === 0 && archivedFiles.length === 0) {
    return null;
  }

  const rowProps = {
    nameMap,
    projectId,
    projectTitle,
    pendingArchiveId: actions.pendingArchiveId,
    archiveBusy: actions.archiveBusy,
    downloadBusy: actions.downloadBusy,
    onDownload: actions.onDownload,
    onPreview: actions.openPreview,
    onEditDescription: actions.setEditDescriptionTarget,
    onRequestArchive: actions.onRequestArchive,
    onCancelArchive: actions.onCancelArchive,
    onConfirmArchive: actions.onConfirmArchive,
    allowPreview: true,
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
              highlighted={highlightFileId === f.id}
              canManage={
                f.uploaded_by_clerk_user_id === currentUserId || isProjectOwner
              }
              {...rowProps}
            />
          ))}
        </ul>
      )}
      {actions.archiveError ? (
        <p className="text-xs text-red-600 mb-2">{actions.archiveError}</p>
      ) : null}
      {archivedFiles.length > 0 ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setArchivedExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-slate-100/80 text-left hover:bg-slate-100 transition text-xs"
            aria-expanded={archivedExpanded}
          >
            <span className="font-medium text-slate-600">
              Archived uncategorized ({archivedFiles.length})
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${archivedExpanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {archivedExpanded ? (
            <ul className="divide-y divide-slate-100">
              {archivedFiles.map((f) => (
                <ArchivedFileRow
                  key={f.id}
                  projectId={projectId}
                  file={f}
                  nameMap={nameMap}
                  downloadBusy={actions.downloadBusy}
                  onDownload={actions.onDownload}
                  onPreview={actions.openPreview}
                />
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
      <WorkspaceFileDescriptionDialog
        projectId={projectId}
        file={actions.editDescriptionTarget}
        onClose={() => actions.setEditDescriptionTarget(null)}
        onSaved={actions.onDescriptionSaved}
      />
    </div>
  );
}
