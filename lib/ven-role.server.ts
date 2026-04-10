import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import {
  isProfessionalOnboardingComplete,
} from "./professional-onboarding";
import {
  getVenRoleFromPublicMetadata,
  isProfessionalVenRole,
  type VenRole,
} from "./ven-role";

/**
 * Server-only: read `venRole` from the signed-in Clerk user.
 */
export async function getVenRoleForCurrentUser(): Promise<VenRole | undefined> {
  const user = await currentUser();
  if (!user) return undefined;
  return getVenRoleFromPublicMetadata(
    user.publicMetadata as Record<string, unknown>,
  );
}

/**
 * Server-only: true if the current user may sign up for Idea Arena tasks (professionals).
 */
export async function isCurrentUserProfessional(): Promise<boolean> {
  const role = await getVenRoleForCurrentUser();
  return isProfessionalVenRole(role);
}

/**
 * Server-only: true if the current user is an inventor (e.g. may create projects).
 */
export async function isCurrentUserInventor(): Promise<boolean> {
  const role = await getVenRoleForCurrentUser();
  return role === "inventor";
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
