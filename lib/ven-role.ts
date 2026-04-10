/**
 * VenShares user role (Clerk `publicMetadata.venRole`).
 *
 * **Idea Arena:** only `professional` may sign up for tasks. Enforce in API routes /
 * Server Actions with `isCurrentUserProfessional` from `@/lib/ven-role.server`; in
 * client UI with `useIsProfessional` from `@/lib/ven-role.client`.
 *
 * Deferred profile fields from design PDFs (inventor file upload + address; professional
 * job categories ≤5, hours bands, ID/citizenship/NDA/bank) belong in onboarding after
 * account creation — see `@/lib/onboarding-deferred`.
 */
export const VEN_ROLE_METADATA_KEY = "venRole" as const;

export type VenRole = "inventor" | "professional";

export function isVenRole(value: unknown): value is VenRole {
  return value === "inventor" || value === "professional";
}

export function isProfessionalVenRole(value: unknown): boolean {
  return value === "professional";
}

export function getVenRoleFromPublicMetadata(
  metadata: Record<string, unknown> | null | undefined,
): VenRole | undefined {
  const raw = metadata?.[VEN_ROLE_METADATA_KEY];
  return isVenRole(raw) ? raw : undefined;
}
