/** Clerk `publicMetadata` key for VenShares site administrators (rclarke009@gmail.com, jbird357@icloud.com). */
export const SITE_ADMIN_METADATA_KEY = "isSiteAdmin" as const;

export function isSiteAdminFromPublicMetadata(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return metadata?.[SITE_ADMIN_METADATA_KEY] === true;
}
