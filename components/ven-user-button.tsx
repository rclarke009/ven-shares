"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { ClipboardList, UserCircle } from "lucide-react";

import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  getVenRoleFromPublicMetadata,
  isProfessionalVenRole,
} from "@/lib/ven-role";

const userButtonAppearance = {
  elements: {
    userButtonAvatarBox: { width: "2.5rem", height: "2.5rem" },
    userButtonTrigger: { padding: 0 },
  },
};

export function VenUserButton() {
  const { user, isLoaded } = useUser();

  const username = isLoaded ? user?.username?.trim() : null;

  const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const role = getVenRoleFromPublicMetadata(meta);
  const isProfessional = isProfessionalVenRole(role);
  const onboardingComplete = isProfessionalOnboardingComplete(meta);

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <UserButton appearance={userButtonAppearance}>
        {isLoaded && isProfessional ? (
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
      {username ? (
        <span className="max-w-20 truncate text-[10px] font-medium text-slate-600 leading-tight">
          @{username}
        </span>
      ) : null}
    </div>
  );
}
