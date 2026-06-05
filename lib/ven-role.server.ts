import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { isProfessionalOnboardingComplete } from "./professional-onboarding";
import {
  getVenRolesFromPublicMetadata,
  hasInventorRole,
  hasProfessionalRole,
  type VenRole,
  type VenUserButtonProfileMode,
} from "./ven-role";

/**
 * Server-only: read all roles from the signed-in Clerk user.
 */
export async function getVenRolesForCurrentUser(): Promise<VenRole[]> {
  const user = await currentUser();
  if (!user) return [];
  return getVenRolesFromPublicMetadata(
    user.publicMetadata as Record<string, unknown>,
  );
}

/**
 * @deprecated Use `getVenRolesForCurrentUser`. Returns first role only.
 */
export async function getVenRoleForCurrentUser(): Promise<VenRole | undefined> {
  const roles = await getVenRolesForCurrentUser();
  return roles[0];
}

/**
 * Server-only: true if the current user may sign up for Idea Arena tasks (professionals).
 */
export async function isCurrentUserProfessional(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  return hasProfessionalRole(user.publicMetadata as Record<string, unknown>);
}

/**
 * Server-only: true if the current user is an inventor (e.g. may create projects).
 */
export async function isCurrentUserInventor(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  return hasInventorRole(user.publicMetadata as Record<string, unknown>);
}

/**
 * Server-only: true when the signed-in user finished simple professional onboarding.
 */
export async function isCurrentUserProfessionalOnboardingComplete(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  return isProfessionalOnboardingComplete(
    user.publicMetadata as Record<string, unknown>,
  );
}

/**
 * Server-only: stable profile mode for VenUserButton (avoids client isLoaded mount race).
 */
export async function getVenUserButtonProfileMode(): Promise<VenUserButtonProfileMode> {
  const user = await currentUser();
  if (!user) return "signed-out";

  const meta = user.publicMetadata as Record<string, unknown>;
  const roles = getVenRolesFromPublicMetadata(meta);

  if (hasProfessionalRole(meta)) {
    return isProfessionalOnboardingComplete(meta)
      ? "professional-complete"
      : "professional-incomplete";
  }
  if (roles.includes("inventor")) return "inventor";
  return "signed-out";
}
