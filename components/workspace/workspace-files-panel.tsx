"use client";

import { ChevronDown, Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  actionArchiveWorkspaceFile,
  actionGetWorkspaceFileDownloadUrl,
  actionUploadWorkspaceFile,
} from "@/app/idea-arena/[projectId]/workspace/actions";
import { WorkspaceArchiveControl } from "@/components/workspace/workspace-archive-control";
import { WorkspaceFileThumbnail } from "@/components/workspace/workspace-file-thumbnail";
import { WorkspaceFileUploadPreview } from "@/components/workspace/workspace-file-upload-preview";
import type { ArenaCategorySlot } from "@/lib/projects-arena";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { useWorkspaceSkillExpand } from "@/lib/use-workspace-skill-expand";
import {
  MAX_TEXT_PREVIEW_BYTES,
  getWorkspacePreviewKind,
  isTextPreviewTooLarge,
} from "@/lib/workspace-preview";

export type WorkspaceFileDTO = {
  id: string;
  uploaded_by_clerk_user_id: string;
  filename: string;
  content_type: string | null;
  byte_size: number;
  job_category: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by_clerk_user_id: string | null;
};

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

function groupActiveFiles(files: WorkspaceFileDTO[]): {
  projectLevel: WorkspaceFileDTO[];
  bySkill: Map<ProfessionalJobCategory, WorkspaceFileDTO[]>;
} {
  const projectLevel: WorkspaceFileDTO[] = [];
  const bySkill = new Map<ProfessionalJobCategory, WorkspaceFileDTO[]>();

  for (const f of files) {
    if (!f.job_category) {
      projectLevel.push(f);
      continue;
    }
    const category = f.job_category as ProfessionalJobCategory;
    const list = bySkill.get(category) ?? [];
    list.push(f);
    bySkill.set(category, list);
  }

  return { projectLevel, bySkill };
}

type FileUploadFormProps = {
  projectId: string;
  formIdSuffix: string;
  jobCategory?: ProfessionalJobCategory;
  onUploadError: (error: string | null) => void;
};

function FileUploadForm({
  projectId,
  formIdSuffix,
  jobCategory,
  onUploadError,
}: FileUploadFormProps) {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <form
      className="mb-4 flex flex-col gap-2"
      action={async (formData) => {
        onUploadError(null);
        setUploadError(null);
        const r = await actionUploadWorkspaceFile(projectId, formData);
        if (!r.ok) {
          setUploadError(r.error);
          onUploadError(r.error);
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
      {jobCategory ? (
        <input type="hidden" name="job_category" value={jobCategory} />
      ) : null}
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
          <span className="text-xs text-slate-600 truncate max-w-[min(100%,14rem)]">
            {fileName}
          </span>
        ) : null}
        <button
          type="submit"
          className="ven-cta text-sm px-4 py-2 rounded-lg"
        >
          Upload
        </button>
      </div>
      {uploadError ? (
        <p className="text-sm text-red-600">{uploadError}</p>
      ) : null}
    </form>
  );
}

type WorkspaceFileRowProps = {
  projectId: string;
  file: WorkspaceFileDTO;
  nameMap: Record<string, string>;
  canArchive: boolean;
  pendingArchiveId: string | null;
  archiveBusy: string | null;
  downloadBusy: string | null;
  previewLoading: boolean;
  previewTargetId: string | null;
  onDownload: (fileId: string) => void;
  onPreview: (file: WorkspaceFileDTO) => void;
  onRequestArchive: (fileId: string) => void;
  onCancelArchive: () => void;
  onConfirmArchive: (fileId: string) => void;
};

function WorkspaceFileRow({
  projectId,
  file,
  nameMap,
  canArchive,
  pendingArchiveId,
  archiveBusy,
  downloadBusy,
  previewLoading,
  previewTargetId,
  onDownload,
  onPreview,
  onRequestArchive,
  onCancelArchive,
  onConfirmArchive,
}: WorkspaceFileRowProps) {
  const previewable = getWorkspacePreviewKind(file) !== null;
  const showArchiveConfirm = pendingArchiveId === file.id;

  if (showArchiveConfirm) {
    return (
      <li className="px-4 py-3 bg-slate-50/50">
        <WorkspaceArchiveControl
          showConfirm
          confirmMessage="Archive this file? It will move to archived files."
          pending={archiveBusy === file.id}
          onCancel={onCancelArchive}
          onConfirm={() => void onConfirmArchive(file.id)}
        />
      </li>
    );
  }

  return (
    <li className="px-4 py-3 bg-slate-50/50">
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
            <p className="text-sm font-medium text-slate-900 truncate">
              {file.filename}
            </p>
            <p className="text-xs text-slate-500">
              {nameMap[file.uploaded_by_clerk_user_id] ?? "Someone"} ·{" "}
              {formatBytes(file.byte_size)} · {formatTime(file.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {previewable ? (
            <button
              type="button"
              disabled={previewLoading && previewTargetId === file.id}
              onClick={() => void onPreview(file)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              aria-label={`Preview ${file.filename}`}
            >
              <Eye className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            disabled={downloadBusy === file.id}
            onClick={() => void onDownload(file.id)}
            className="text-sm font-medium text-[#15803d] hover:underline disabled:opacity-50"
          >
            {downloadBusy === file.id ? "…" : "Download"}
          </button>
          {canArchive ? (
            <WorkspaceArchiveControl
              pending={archiveBusy === file.id}
              onRequestArchive={() => onRequestArchive(file.id)}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}

type FileListProps = {
  projectId: string;
  files: WorkspaceFileDTO[];
  emptyMessage: string;
  nameMap: Record<string, string>;
  currentUserId: string;
  isProjectOwner: boolean;
  pendingArchiveId: string | null;
  archiveBusy: string | null;
  downloadBusy: string | null;
  previewLoading: boolean;
  previewTargetId: string | null;
  onDownload: (fileId: string) => void;
  onPreview: (file: WorkspaceFileDTO) => void;
  onRequestArchive: (fileId: string) => void;
  onCancelArchive: () => void;
  onConfirmArchive: (fileId: string) => void;
};

function FileList({
  projectId,
  files,
  emptyMessage,
  nameMap,
  currentUserId,
  isProjectOwner,
  pendingArchiveId,
  archiveBusy,
  downloadBusy,
  previewLoading,
  previewTargetId,
  onDownload,
  onPreview,
  onRequestArchive,
  onCancelArchive,
  onConfirmArchive,
}: FileListProps) {
  if (files.length === 0) {
    return <p className="text-base text-slate-600 mb-2">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden mb-2">
      {files.map((f) => (
        <WorkspaceFileRow
          key={f.id}
          projectId={projectId}
          file={f}
          nameMap={nameMap}
          canArchive={
            f.uploaded_by_clerk_user_id === currentUserId || isProjectOwner
          }
          pendingArchiveId={pendingArchiveId}
          archiveBusy={archiveBusy}
          downloadBusy={downloadBusy}
          previewLoading={previewLoading}
          previewTargetId={previewTargetId}
          onDownload={onDownload}
          onPreview={onPreview}
          onRequestArchive={onRequestArchive}
          onCancelArchive={onCancelArchive}
          onConfirmArchive={onConfirmArchive}
        />
      ))}
    </ul>
  );
}

type WorkspaceFilesPanelProps = {
  projectId: string;
  files: WorkspaceFileDTO[];
  categoryStatuses: ArenaCategorySlot[];
  nameMap: Record<string, string>;
  currentUserId: string;
  viewerCoveredCategories: ProfessionalJobCategory[];
  isProjectOwner: boolean;
};

export function WorkspaceFilesPanel({
  projectId,
  files,
  categoryStatuses,
  nameMap,
  currentUserId,
  viewerCoveredCategories,
  isProjectOwner,
}: WorkspaceFilesPanelProps) {
  const router = useRouter();
  const previewTitleId = useId();
  const previewCloseRef = useRef<HTMLButtonElement>(null);

  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [archiveBusy, setArchiveBusy] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const { expandedSkills, toggleSkill } = useWorkspaceSkillExpand({
    projectId,
    userId: currentUserId,
    userSkills: viewerCoveredCategories,
    allCategories: categoryStatuses.map((s) => s.category),
  });

  const [previewTarget, setPreviewTarget] = useState<WorkspaceFileDTO | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewTextOversized, setPreviewTextOversized] = useState(false);

  const activeFiles = useMemo(
    () => files.filter((f) => !f.deleted_at),
    [files],
  );
  const deprecatedFiles = useMemo(
    () => files.filter((f) => f.deleted_at),
    [files],
  );
  const { projectLevel, bySkill } = useMemo(
    () => groupActiveFiles(activeFiles),
    [activeFiles],
  );

  const previewKind = previewTarget
    ? getWorkspacePreviewKind(previewTarget)
    : null;

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
        setPreviewText(text);
      } catch {
        setPreviewError(
          "Could not load file text. Try opening in a new tab.",
        );
      }
      setPreviewLoading(false);
      return;
    }

    setPreviewUrl(r.url);
    setPreviewLoading(false);
  }

  const fileListProps = {
    projectId,
    nameMap,
    currentUserId,
    isProjectOwner,
    pendingArchiveId,
    archiveBusy,
    downloadBusy,
    previewLoading,
    previewTargetId: previewTarget?.id ?? null,
    onDownload,
    onPreview: openPreview,
    onRequestArchive: (fileId: string) => {
      setPendingArchiveId(fileId);
      setArchiveError(null);
    },
    onCancelArchive: () => {
      setPendingArchiveId(null);
      setArchiveError(null);
    },
    onConfirmArchive,
  };

  return (
    <>
      <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Project files
        </h2>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-800 mb-1">
            General project files
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Files that apply to the whole project, not a specific skill.
          </p>
          <FileUploadForm
            projectId={projectId}
            formIdSuffix="project"
            onUploadError={() => {}}
          />
          <FileList
            {...fileListProps}
            files={projectLevel}
            emptyMessage="No general project files yet."
          />
        </div>

        {categoryStatuses.length > 0 ? (
          <ul className="space-y-3">
            {categoryStatuses.map((slot) => {
              const skillFiles =
                bySkill.get(slot.category as ProfessionalJobCategory) ?? [];
              const skillOpen = expandedSkills.has(slot.category);

              return (
                <li
                  key={slot.category}
                  className="rounded-xl border border-slate-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSkill(slot.category)}
                    className="flex w-full items-center gap-3 px-4 py-3 bg-slate-50/80 text-left hover:bg-slate-50 transition-colors"
                    aria-expanded={skillOpen}
                  >
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${skillOpen ? "rotate-0" : "-rotate-90"}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900 text-sm">
                        {slot.category}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {skillFiles.length === 0
                          ? "No files yet"
                          : `${skillFiles.length} file${skillFiles.length === 1 ? "" : "s"}`}
                      </p>
                    </div>
                  </button>

                  {skillOpen ? (
                    <div className="px-4 py-3 border-t border-slate-100">
                      <FileUploadForm
                        projectId={projectId}
                        formIdSuffix={slot.category.replace(/[^a-zA-Z0-9]+/g, "-")}
                        jobCategory={slot.category as ProfessionalJobCategory}
                        onUploadError={() => {}}
                      />
                      <FileList
                        {...fileListProps}
                        files={skillFiles}
                        emptyMessage="No files for this skill yet."
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {archiveError ? (
          <p className="text-sm text-red-600 mt-3">{archiveError}</p>
        ) : null}

        {deprecatedFiles.length > 0 ? (
          <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setArchivedExpanded((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 bg-slate-100/80 text-left hover:bg-slate-100 transition"
              aria-expanded={archivedExpanded}
            >
              <span className="text-sm font-medium text-slate-600">
                Archived files ({deprecatedFiles.length})
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${archivedExpanded ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {archivedExpanded ? (
              <ul className="divide-y divide-slate-100">
                {deprecatedFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50/30"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <WorkspaceFileThumbnail
                        projectId={projectId}
                        fileId={f.id}
                        filename={f.filename}
                        content_type={f.content_type}
                        dimmed
                      />
                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-500 truncate">
                          {f.filename}
                        </p>
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Archived
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Archived by{" "}
                        {nameMap[f.deleted_by_clerk_user_id ?? ""] ??
                          "Someone"}{" "}
                        · {formatTime(f.deleted_at ?? f.created_at)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Uploaded by{" "}
                        {nameMap[f.uploaded_by_clerk_user_id] ?? "Someone"} ·{" "}
                        {formatBytes(f.byte_size)} · {formatTime(f.created_at)}
                        {f.job_category ? ` · ${f.job_category}` : null}
                      </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={downloadBusy === f.id}
                      onClick={() => void onDownload(f.id)}
                      className="text-sm font-medium text-slate-500 hover:text-[#15803d] hover:underline disabled:opacity-50 shrink-0"
                    >
                      {downloadBusy === f.id ? "…" : "Download"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
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
    </>
  );
}
