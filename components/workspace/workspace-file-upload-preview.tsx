"use client";

import { useEffect, useState } from "react";

import { renderPdfFirstPageDataUrl } from "@/lib/workspace-pdf-thumbnail.client";
import {
  getWorkspacePreviewKind,
  hasVisualThumbnail,
} from "@/lib/workspace-preview";

const PREVIEW_BOX =
  "h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 object-cover";

type WorkspaceFileUploadPreviewProps = {
  file: File | null;
};

export function WorkspaceFileUploadPreview({
  file,
}: WorkspaceFileUploadPreviewProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }

    const kind = getWorkspacePreviewKind({
      content_type: file.type || null,
      filename: file.name,
    });
    if (!hasVisualThumbnail(kind)) {
      setSrc(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      if (kind === "image") {
        objectUrl = URL.createObjectURL(file);
        if (!cancelled) setSrc(objectUrl);
        return;
      }

      if (kind === "pdf") {
        try {
          const buf = await file.arrayBuffer();
          const dataUrl = await renderPdfFirstPageDataUrl(buf);
          if (!cancelled) setSrc(dataUrl);
        } catch {
          if (!cancelled) setSrc(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={PREVIEW_BOX}
    />
  );
}
