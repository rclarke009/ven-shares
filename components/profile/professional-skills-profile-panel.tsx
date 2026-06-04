"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { updateProfessionalProfileSkills } from "@/app/dashboard/profile/actions";
import { ProfessionalOnboardingForm } from "@/components/onboarding/professional-onboarding-form";
import {
  getProfessionalHoursBandFromMetadata,
  isProfessionalOnboardingComplete,
} from "@/lib/professional-onboarding";
import { getProfessionalJobCategoriesFromMetadata } from "@/lib/skills-match";
import {
  getVenRoleFromPublicMetadata,
  isProfessionalVenRole,
} from "@/lib/ven-role";

export function ProfessionalSkillsProfilePanel() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <p className="text-sm text-slate-600 py-4">Loading your profile…</p>
    );
  }

  const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const role = getVenRoleFromPublicMetadata(meta);

  if (!isProfessionalVenRole(role)) {
    return (
      <p className="text-sm text-slate-600 py-4">
        Skills and availability are only for skilled professional accounts.
      </p>
    );
  }

  if (!isProfessionalOnboardingComplete(meta)) {
    return (
      <div className="py-4 space-y-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          Finish your professional profile setup before editing skills here.
        </p>
        <Link
          href="/onboarding/professional"
          className="text-sm font-medium text-[#22c55e] hover:underline"
        >
          Complete your profile
        </Link>
      </div>
    );
  }

  const initialCategories = getProfessionalJobCategoriesFromMetadata(meta);
  const hoursBand = getProfessionalHoursBandFromMetadata(meta);

  return (
    <div className="py-2 pr-1">
      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Job categories and weekly availability for Idea Arena matching. Your
        profile photo is under Account.
      </p>
      <ProfessionalOnboardingForm
        key={`skills-${hoursBand ?? ""}-${initialCategories.join(",")}`}
        initialCategories={initialCategories}
        initialHours={hoursBand ?? ""}
        formAction={updateProfessionalProfileSkills}
        submitLabel="Save"
        showOnboardingCopy={false}
        showProfilePhoto={false}
        variant="compact"
      />
    </div>
  );
}
