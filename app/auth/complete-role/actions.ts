"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  VEN_ROLE_METADATA_KEY,
  getVenRoleFromPublicMetadata,
  isVenRole,
  type VenRole,
} from "@/lib/ven-role";

export async function setVenRoleFromCompleteRole(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const raw = formData.get("venRole");
  if (typeof raw !== "string" || !isVenRole(raw)) {
    redirect("/auth/complete-role");
  }
  const venRole = raw as VenRole;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata as Record<string, unknown>;
  if (getVenRoleFromPublicMetadata(meta)) {
    redirect("/dashboard");
  }

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      [VEN_ROLE_METADATA_KEY]: venRole,
    },
  });

  if (venRole === "professional") {
    const refreshed = await client.users.getUser(userId);
    const nextMeta = refreshed.publicMetadata as Record<string, unknown>;
    if (!isProfessionalOnboardingComplete(nextMeta)) {
      redirect("/onboarding/professional");
    }
  }

  redirect("/dashboard");
}
