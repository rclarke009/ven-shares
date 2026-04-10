"use client";

import { useUser } from "@clerk/nextjs";

import {
  getVenRoleFromPublicMetadata,
  isProfessionalVenRole,
  type VenRole,
} from "./ven-role";

/**
 * Client hook: `venRole` from Clerk `publicMetadata` (undefined while loading or signed out).
 */
export function useVenRole(): {
  venRole: VenRole | undefined;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
} {
  const { user, isLoaded, isSignedIn } = useUser();
  const venRole = user
    ? getVenRoleFromPublicMetadata(
        user.publicMetadata as Record<string, unknown>,
      )
    : undefined;
  return { venRole, isLoaded, isSignedIn };
}

/**
 * True when the signed-in user is a skilled professional (Idea Arena task eligibility).
 */
export function useIsProfessional(): boolean {
  const { venRole, isLoaded, isSignedIn } = useVenRole();
  if (!isLoaded || !isSignedIn) return false;
  return isProfessionalVenRole(venRole);
}
