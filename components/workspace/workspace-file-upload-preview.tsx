"use client";

import { File, FileImage, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { renderPdfFirstPageDataUrl } from "@/lib/workspace-pdf-thumbnail.client";
import {
  getWorkspacePreviewKind,
  hasVisualThumbnail,
  type WorkspacePreviewKind,
} from "@/lib/workspace-preview";

const PREVIEW_BOX =
  "h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100";

type WorkspaceFileUploadPreviewProps = {
  file: File | null;
};

function PreviewPlaceholder({ kind }: { kind: "file" | "pdf" | "image" }) {
  const Icon = kind === "pdf" ? FileText : kind === "image" ? FileImage : File;
  return (
    <div
      className={`${PREVIEW_BOX} flex items-center justify-center text-slate-400`}
      aria-hidden
    >
      <Icon className="h-6 w-6" />
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div
      className={`${PREVIEW_BOX} animate-pulse bg-slate-200`}
      aria-hidden
    />
  );
}

export function WorkspaceFileUploadPreview({
  file,
}: WorkspaceFileUploadPreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<WorkspacePreviewKind | null>(null);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      setLoading(false);
      setKind(null);
      return;
    }

    const previewKind = getWorkspacePreviewKind({
      content_type: file.type || null,
      filename: file.name,
    });
    setKind(previewKind);

    if (!hasVisualThumbnail(previewKind)) {
      setSrc(null);
      setLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setLoading(true);
    setSrc(null);

    (async () => {
      if (previewKind === "image") {
        objectUrl = URL.createObjectURL(file);
        if (!cancelled) {
          setSrc(objectUrl);
          setLoading(false);
        }
        return;
      }

      if (previewKind === "pdf") {
        try {
          const buf = await file.arrayBuffer();
          const dataUrl = await renderPdfFirstPageDataUrl(buf);
          if (!cancelled) {
            setSrc(dataUrl);
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setSrc(null);
            setLoading(false);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!file) return null;

  if (!hasVisualThumbnail(kind)) {
    return <PreviewPlaceholder kind="file" />;
  }

  if (loading || !src) {
    return <PreviewSkeleton />;
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`${PREVIEW_BOX} object-cover`}
    />
  );
}
