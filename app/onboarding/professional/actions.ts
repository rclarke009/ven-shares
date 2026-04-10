"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  PROFESSIONAL_HOURS_BAND_KEY,
  PROFESSIONAL_JOB_CATEGORIES_KEY,
  PROFESSIONAL_ONBOARDING_COMPLETE_KEY,
  isValidProfessionalHoursBand,
  normalizeProfessionalJobCategories,
} from "@/lib/professional-onboarding";
import { getVenRoleFromPublicMetadata } from "@/lib/ven-role";

export type ProfessionalOnboardingActionState = {
  error?: string;
};

export async function completeProfessionalOnboarding(
  _prev: ProfessionalOnboardingActionState,
  formData: FormData,
): Promise<ProfessionalOnboardingActionState> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "You need to be signed in." };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata as Record<string, unknown>;
  const role = getVenRoleFromPublicMetadata(meta);
  if (role !== "professional") {
    return { error: "This onboarding is for skilled professional accounts." };
  }

  const hoursRaw = formData.get("hours");
  if (!isValidProfessionalHoursBand(hoursRaw)) {
    return { error: "Please choose a valid hours-per-week option." };
  }

  const selected = formData.getAll("categories").filter(
    (v): v is string => typeof v === "string",
  );
  const categories = normalizeProfessionalJobCategories(selected);
  if (categories.length === 0) {
    return { error: "Choose at least one job category (up to five)." };
  }

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      [PROFESSIONAL_JOB_CATEGORIES_KEY]: categories,
      [PROFESSIONAL_HOURS_BAND_KEY]: hoursRaw,
      [PROFESSIONAL_ONBOARDING_COMPLETE_KEY]: true,
    },
  });

  redirect("/dashboard");
}
