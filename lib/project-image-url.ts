const BUCKET = "project-images";

/** Public object URL for Next/Image when `path` is stored on the project row. */
export function publicProjectImageUrl(
  representativeImagePath: string | null | undefined,
): string | null {
  if (!representativeImagePath?.trim()) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const path = representativeImagePath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
