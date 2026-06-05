"use client";

import { File, FileImage, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { actionGetWorkspaceFileDownloadUrl } from "@/app/idea-arena/[projectId]/workspace/actions";
import { renderPdfFirstPageDataUrl } from "@/lib/workspace-pdf-thumbnail.client";
import {
  getWorkspacePreviewKind,
  hasVisualThumbnail,
} from "@/lib/workspace-preview";

const THUMB_BOX =
  "h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100";

type WorkspaceFileThumbnailProps = {
  projectId: string;
  fileId: string;
  filename: string;
  content_type: string | null;
  /** When true, skip lazy viewport gate (e.g. upload picker). */
  eager?: boolean;
  dimmed?: boolean;
  onThumbClick?: () => void;
};

function ThumbnailPlaceholder({ kind }: { kind: "file" | "pdf" | "image" }) {
  const Icon = kind === "pdf" ? FileText : kind === "image" ? FileImage : File;
  return (
    <div
      className={`${THUMB_BOX} flex items-center justify-center text-slate-400`}
      aria-hidden
    >
      <Icon className="h-6 w-6" />
    </div>
  );
}

function ThumbnailSkeleton() {
  return (
    <div
      className={`${THUMB_BOX} animate-pulse bg-slate-200`}
      aria-hidden
    />
  );
}

export function WorkspaceFileThumbnail({
  projectId,
  fileId,
  filename,
  content_type,
  eager = false,
  dimmed = false,
  onThumbClick,
}: WorkspaceFileThumbnailProps) {
  const kind = getWorkspacePreviewKind({ content_type, filename });
  const visual = hasVisualThumbnail(kind);

  const [visible, setVisible] = useState(eager);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSrc(null);
    setFailed(false);
    if (!eager) setVisible(false);
  }, [projectId, fileId, filename, content_type, eager]);

  useEffect(() => {
    if (eager || visible) return;
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "80px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager, visible]);

  useEffect(() => {
    if (!visible || !visual || failed) return;
    let cancelled = false;

    (async () => {
      const r = await actionGetWorkspaceFileDownloadUrl(
        projectId,
        fileId,
        "display",
      );
      if (cancelled) return;
      if (!r.ok) {
        setFailed(true);
        return;
      }

      if (kind === "image") {
        setSrc(r.url);
        return;
      }

      if (kind === "pdf") {
        try {
          const res = await fetch(r.url);
          if (!res.ok) {
            setFailed(true);
            return;
          }
          const buf = await res.arrayBuffer();
          const dataUrl = await renderPdfFirstPageDataUrl(buf);
          if (cancelled) return;
          if (dataUrl) setSrc(dataUrl);
          else setFailed(true);
        } catch {
          if (!cancelled) setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, visual, failed, projectId, fileId, kind]);

  const wrapperClass = dimmed ? "opacity-60" : "";

  if (!visual || failed) {
    const placeholderKind =
      kind === "pdf" ? "pdf" : kind === "image" ? "image" : "file";
    return (
      <div ref={rootRef} className={wrapperClass}>
        <ThumbnailPlaceholder kind={placeholderKind} />
      </div>
    );
  }

  if (!visible || !src) {
    return (
      <div ref={rootRef} className={wrapperClass}>
        <ThumbnailSkeleton />
      </div>
    );
  }

  const img = (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`${THUMB_BOX} object-cover ${onThumbClick ? "cursor-pointer" : ""}`}
      onError={() => setFailed(true)}
    />
  );

  if (onThumbClick) {
    return (
      <div ref={rootRef} className={wrapperClass}>
        <button
          type="button"
          onClick={onThumbClick}
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          aria-label={`Preview ${filename}`}
        >
          {img}
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={wrapperClass}>
      {img}
    </div>
  );
}
