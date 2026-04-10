const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extForMime(m: string): string {
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return "bin";
}

export type RepresentativeImageOk =
  | { ok: true; skip: true }
  | {
      ok: true;
      skip: false;
      buffer: Buffer;
      contentType: string;
      /** Filename segment only, e.g. cover.jpg */
      fileName: string;
    }
  | { ok: false; error: string };

export async function readRepresentativeImageFromFormData(
  formData: FormData,
  fieldName = "representative_image",
): Promise<RepresentativeImageOk> {
  const entry = formData.get(fieldName);
  if (!entry || typeof entry === "string") return { ok: true, skip: true };
  const file = entry as File;
  if (file.size === 0) return { ok: true, skip: true };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Use JPEG, PNG, or WebP for the image." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extForMime(file.type);
  return {
    ok: true,
    skip: false,
    buffer,
    contentType: file.type,
    fileName: `cover.${ext}`,
  };
}
