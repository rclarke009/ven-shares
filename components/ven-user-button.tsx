"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { ClipboardList, UserCircle } from "lucide-react";

import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  getVenRoleFromPublicMetadata,
  isProfessionalVenRole,
} from "@/lib/ven-role";

export function VenUserButton() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <UserButton />;
  }

  const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const role = getVenRoleFromPublicMetadata(meta);
  const isProfessional = isProfessionalVenRole(role);
  const onboardingComplete = isProfessionalOnboardingComplete(meta);

  return (
    <UserButton>
      {isProfessional ? (
        <UserButton.MenuItems>
          {!onboardingComplete ? (
            <UserButton.Link
              href="/onboarding/professional"
              label="Complete your profile"
              labelIcon={<ClipboardList className="size-4" aria-hidden />}
            />
          ) : (
            <UserButton.Link
              href="/dashboard/profile"
              label="Profile & skills"
              labelIcon={<UserCircle className="size-4" aria-hidden />}
            />
          )}
        </UserButton.MenuItems>
      ) : null}
    </UserButton>
  );
}
