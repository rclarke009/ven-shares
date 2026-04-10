"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ProfessionalOnboardingActionState } from "@/app/onboarding/professional/actions";
import {
  PROFESSIONAL_HOURS_BAND_KEY,
  PROFESSIONAL_JOB_CATEGORIES_KEY,
  isValidProfessionalHoursBand,
  normalizeProfessionalJobCategories,
} from "@/lib/professional-onboarding";
import { readProfilePhotoFromFormData } from "@/lib/profile-photo-upload";
import { getVenRoleFromPublicMetadata } from "@/lib/ven-role";

export async function updateProfessionalProfileSkills(
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
    return { error: "Only skilled professional accounts can update this profile." };
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

  const photoRead = await readProfilePhotoFromFormData(formData);
  if (!photoRead.ok) {
    return { error: photoRead.error };
  }
  if (!photoRead.skip) {
    try {
      await client.users.updateUserProfileImage(userId, {
        file: photoRead.file,
      });
    } catch {
      return {
        error:
          "Could not upload profile photo. Try a smaller file or a different format.",
      };
    }
  }

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      [PROFESSIONAL_JOB_CATEGORIES_KEY]: categories,
      [PROFESSIONAL_HOURS_BAND_KEY]: hoursRaw,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/idea-arena");
  revalidatePath("/onboarding/professional");
  redirect("/dashboard");
}
