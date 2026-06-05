export const PROJECT_IMAGES_BUCKET = "project-images";

/** Unique storage path so replaced images get a new public URL (cache bust). */
export function versionedProjectImageStoragePath(
  projectId: string,
  fileName: string,
): string {
  const match = /^(.+)\.([^.]+)$/.exec(fileName);
  const base = match?.[1] ?? fileName;
  const ext = match?.[2] ?? "bin";
  return `${projectId}/${base}-${Date.now()}.${ext}`;
}

/** Public object URL for Next/Image when `path` is stored on the project row. */
export function publicProjectImageUrl(
  representativeImagePath: string | null | undefined,
): string | null {
  if (!representativeImagePath?.trim()) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const path = representativeImagePath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${PROJECT_IMAGES_BUCKET}/${path}`;
}
