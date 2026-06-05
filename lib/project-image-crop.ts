export type ProjectImageCropMeta = {
  crop: { x: number; y: number };
  zoom: number;
};

export type ProjectImageCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DEFAULT_PROJECT_IMAGE_CROP: ProjectImageCropMeta = {
  crop: { x: 0, y: 0 },
  zoom: 1,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseProjectImageCrop(raw: unknown): ProjectImageCropMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const cropRaw = o.crop;
  if (!cropRaw || typeof cropRaw !== "object") return null;
  const cropObj = cropRaw as Record<string, unknown>;
  const x = cropObj.x;
  const y = cropObj.y;
  const zoom = o.zoom;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(zoom)) {
    return null;
  }
  return { crop: { x, y }, zoom };
}

export function parseProjectImageCropJson(
  json: string | null | undefined,
): ProjectImageCropMeta | null {
  if (!json?.trim()) return null;
  try {
    return parseProjectImageCrop(JSON.parse(json));
  } catch {
    return null;
  }
}

export function serializeProjectImageCrop(meta: ProjectImageCropMeta): string {
  return JSON.stringify(meta);
}

export function parseProjectImageCropFromFormData(
  formData: FormData,
  fieldName: string,
): ProjectImageCropMeta | null {
  const raw = formData.get(fieldName);
  if (typeof raw !== "string") return null;
  return parseProjectImageCropJson(raw);
}
