"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Briefcase, ClipboardList } from "lucide-react";

import { ProfessionalSkillsProfilePanel } from "@/components/profile/professional-skills-profile-panel";
import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  getVenRoleFromPublicMetadata,
  isProfessionalVenRole,
  type VenUserButtonProfileMode,
} from "@/lib/ven-role";

const userButtonAppearance = {
  elements: {
    userButtonAvatarBox: { width: "2.5rem", height: "2.5rem" },
    userButtonTrigger: { padding: 0 },
  },
};

function resolveProfileModeFromClient(
  isLoaded: boolean,
  meta: Record<string, unknown>,
): VenUserButtonProfileMode | undefined {
  if (!isLoaded) return undefined;
  const role = getVenRoleFromPublicMetadata(meta);
  if (role === "inventor") return "inventor";
  if (role === "professional") {
    return isProfessionalOnboardingComplete(meta)
      ? "professional-complete"
      : "professional-incomplete";
  }
  return "signed-out";
}

type VenUserButtonProps = {
  profileMode?: VenUserButtonProfileMode;
};

export function VenUserButton({ profileMode: profileModeProp }: VenUserButtonProps) {
  const { user, isLoaded } = useUser();

  const username = isLoaded ? user?.username?.trim() : null;

  const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const profileMode =
    profileModeProp ?? resolveProfileModeFromClient(isLoaded, meta);

  const showSkillsPages = profileMode === "professional-complete";
  const showOnboardingLink = profileMode === "professional-incomplete";

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <UserButton
        key={profileMode ?? "loading"}
        appearance={userButtonAppearance}
      >
        {showSkillsPages ? (
          <UserButton.UserProfilePage
            label="Skills & availability"
            url="skills"
            labelIcon={<Briefcase className="size-4" aria-hidden />}
          >
            <ProfessionalSkillsProfilePanel />
          </UserButton.UserProfilePage>
        ) : null}
        {showSkillsPages ? (
          <UserButton.UserProfilePage label="account" />
        ) : null}
        {showSkillsPages ? (
          <UserButton.UserProfilePage label="security" />
        ) : null}
        {showSkillsPages ? (
          <UserButton.MenuItems>
            <UserButton.Action
              label="Skills & availability"
              labelIcon={<Briefcase className="size-4" aria-hidden />}
              open="skills"
            />
          </UserButton.MenuItems>
        ) : null}
        {showOnboardingLink ? (
          <UserButton.MenuItems>
            <UserButton.Link
              href="/onboarding/professional"
              label="Complete your profile"
              labelIcon={<ClipboardList className="size-4" aria-hidden />}
            />
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
