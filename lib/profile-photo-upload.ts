const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProfilePhotoReadResult =
  | { ok: true; skip: true }
  | { ok: true; skip: false; file: File }
  | { ok: false; error: string };

/**
 * Optional profile photo from FormData (JPEG, PNG, WebP, max 5MB).
 * Empty field = skip (keep existing Clerk image).
 */
export async function readProfilePhotoFromFormData(
  formData: FormData,
  fieldName = "profile_photo",
): Promise<ProfilePhotoReadResult> {
  const entry = formData.get(fieldName);
  if (!entry || typeof entry === "string") return { ok: true, skip: true };
  const file = entry as File;
  if (file.size === 0) return { ok: true, skip: true };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Profile photo must be 5MB or smaller." };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Use JPEG, PNG, or WebP for your profile photo." };
  }
  return { ok: true, skip: false, file };
}
