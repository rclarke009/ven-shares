"use client";

import { useUser } from "@clerk/nextjs";

import {
  getVenRolesFromPublicMetadata,
  hasInventorRole,
  hasProfessionalRole,
  type VenRole,
} from "./ven-role";

/**
 * Client hook: roles from Clerk `publicMetadata` (empty while loading or signed out).
 */
export function useVenRoles(): {
  venRoles: VenRole[];
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
} {
  const { user, isLoaded, isSignedIn } = useUser();
  const venRoles = user
    ? getVenRolesFromPublicMetadata(
        user.publicMetadata as Record<string, unknown>,
      )
    : [];
  return { venRoles, isLoaded, isSignedIn };
}

/** @deprecated Use `useVenRoles`. Returns first role only. */
export function useVenRole(): {
  venRole: VenRole | undefined;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
} {
  const { venRoles, isLoaded, isSignedIn } = useVenRoles();
  return { venRole: venRoles[0], isLoaded, isSignedIn };
}

export function useHasInventorRole(): boolean {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded || !isSignedIn || !user) return false;
  return hasInventorRole(user.publicMetadata as Record<string, unknown>);
}

export function useHasProfessionalRole(): boolean {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded || !isSignedIn || !user) return false;
  return hasProfessionalRole(user.publicMetadata as Record<string, unknown>);
}

/**
 * True when the signed-in user is a skilled professional (Idea Arena task eligibility).
 */
export function useIsProfessional(): boolean {
  return useHasProfessionalRole();
}
