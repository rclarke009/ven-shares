import { publicProjectImageUrl } from "@/lib/project-image-url";

/** Uses uploaded cover when set; otherwise a deterministic placeholder. */
export function arenaProjectImageUrl(project: {
  id: string;
  representative_image_path: string | null;
}): string {
  const custom = publicProjectImageUrl(project.representative_image_path);
  if (custom) return custom;
  return `https://picsum.photos/seed/${encodeURIComponent(project.id)}/400/400`;
}
