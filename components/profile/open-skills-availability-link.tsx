"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";

import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import { hasProfessionalRole } from "@/lib/ven-role";

const linkClassName = "text-[#22c55e] font-medium hover:underline";

type OpenSkillsAvailabilityLinkProps = {
  children?: React.ReactNode;
};

export function OpenSkillsAvailabilityLink({
  children = "Skills & availability",
}: OpenSkillsAvailabilityLinkProps) {
  const clerk = useClerk();
  const { user, isLoaded } = useUser();

  const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const canOpenSkillsModal =
    isLoaded &&
    hasProfessionalRole(meta) &&
    isProfessionalOnboardingComplete(meta);

  if (canOpenSkillsModal) {
    return (
      <button
        type="button"
        className={linkClassName}
        onClick={() =>
          clerk.openUserProfile({ __experimental_startPath: "/skills" })
        }
      >
        {children}
      </button>
    );
  }

  return (
    <Link href="/onboarding/professional" className={linkClassName}>
      {children}
    </Link>
  );
}
