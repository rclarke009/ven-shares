export type WorkspacePreviewKind = "image" | "pdf" | "text";

/** Max bytes for in-browser text/CSV fetch; larger files show a download hint only. */
export const MAX_TEXT_PREVIEW_BYTES = 512 * 1024;

const IMAGE_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
]);

const PDF_EXT = new Set(["pdf"]);

const TEXT_EXT = new Set(["txt", "csv"]);

function extFromFilename(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0 || i === filename.length - 1) return "";
  return filename.slice(i + 1).toLowerCase();
}

function kindFromMime(mime: string): WorkspacePreviewKind | null {
  const m = mime.toLowerCase().trim();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("application/pdf")) return "pdf";
  if (m === "text/plain" || m.startsWith("text/plain")) return "text";
  if (m === "text/csv" || m.startsWith("text/csv")) return "text";
  return null;
}

function kindFromExtension(filename: string): WorkspacePreviewKind | null {
  const ext = extFromFilename(filename);
  if (IMAGE_EXT.has(ext)) return "image";
  if (PDF_EXT.has(ext)) return "pdf";
  if (TEXT_EXT.has(ext)) return "text";
  return null;
}

export function getWorkspacePreviewKind(file: {
  content_type: string | null;
  filename: string;
}): WorkspacePreviewKind | null {
  const mime = file.content_type?.trim() ?? "";
  if (mime && mime !== "application/octet-stream") {
    const fromMime = kindFromMime(mime);
    if (fromMime) return fromMime;
  }
  return kindFromExtension(file.filename);
}

export function isTextPreviewTooLarge(byteSize: number): boolean {
  return byteSize > MAX_TEXT_PREVIEW_BYTES;
}
