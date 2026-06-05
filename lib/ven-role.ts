/**
 * VenShares user roles (Clerk `publicMetadata.venRoles`, legacy `venRole`).
 *
 * **Idea Arena:** only users with the `professional` role may join teams. Enforce in
 * API routes / Server Actions with `isCurrentUserProfessional` from `@/lib/ven-role.server`;
 * in client UI with `useIsProfessional` from `@/lib/ven-role.client`.
 *
 * Deferred profile fields from design PDFs (inventor file upload + address; professional
 * job categories ≤5, hours bands, ID/citizenship/NDA/bank) belong in onboarding after
 * account creation — see `@/lib/onboarding-deferred`.
 */
export const VEN_ROLES_METADATA_KEY = "venRoles" as const;

/** @deprecated Legacy single-role key; read via shim only. New writes use `venRoles`. */
export const VEN_ROLE_METADATA_KEY = "venRole" as const;

export type VenRole = "inventor" | "professional";

/** Drives Clerk UserButton modal pages and menu links from server-known auth state. */
export type VenUserButtonProfileMode =
  | "signed-out"
  | "inventor"
  | "professional-incomplete"
  | "professional-complete";

export function isVenRole(value: unknown): value is VenRole {
  return value === "inventor" || value === "professional";
}

export function isProfessionalVenRole(value: unknown): boolean {
  return value === "professional";
}

/**
 * @deprecated Use `getVenRolesFromPublicMetadata`. Returns first role only (legacy).
 */
export function getVenRoleFromPublicMetadata(
  metadata: Record<string, unknown> | null | undefined,
): VenRole | undefined {
  const roles = getVenRolesFromPublicMetadata(metadata);
  return roles[0];
}

export function getVenRolesFromPublicMetadata(
  metadata: Record<string, unknown> | null | undefined,
): VenRole[] {
  const raw = metadata?.[VEN_ROLES_METADATA_KEY];
  if (Array.isArray(raw)) {
    const filtered = raw.filter(isVenRole);
    return [...new Set(filtered)];
  }
  const single = metadata?.[VEN_ROLE_METADATA_KEY];
  return isVenRole(single) ? [single] : [];
}

export function hasInventorRole(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return getVenRolesFromPublicMetadata(metadata).includes("inventor");
}

export function hasProfessionalRole(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return getVenRolesFromPublicMetadata(metadata).includes("professional");
}

/** Writes `venRoles` and clears legacy `venRole` for lazy migration. */
export function mergeVenRolesMetadata(
  existingMeta: Record<string, unknown>,
  nextRoles: VenRole[],
): Record<string, unknown> {
  const deduped = [...new Set(nextRoles.filter(isVenRole))];
  const next: Record<string, unknown> = {
    ...existingMeta,
    [VEN_ROLES_METADATA_KEY]: deduped,
  };
  delete next[VEN_ROLE_METADATA_KEY];
  return next;
}
