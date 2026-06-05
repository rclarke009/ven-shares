"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  getVenRolesFromPublicMetadata,
  isVenRole,
  mergeVenRolesMetadata,
  type VenRole,
} from "@/lib/ven-role";

function parseRoleChoice(raw: FormDataEntryValue | null): VenRole[] | null {
  if (typeof raw !== "string") return null;
  if (raw === "both") return ["inventor", "professional"];
  if (isVenRole(raw)) return [raw];
  return null;
}

export async function setVenRoleFromCompleteRole(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const nextRoles = parseRoleChoice(formData.get("roleChoice"));
  if (!nextRoles) {
    redirect("/auth/complete-role");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata as Record<string, unknown>;
  if (getVenRolesFromPublicMetadata(meta).length > 0) {
    redirect("/workspace");
  }

  await client.users.updateUser(userId, {
    publicMetadata: mergeVenRolesMetadata(meta, nextRoles),
  });

  if (
    nextRoles.includes("professional") &&
    !isProfessionalOnboardingComplete(meta)
  ) {
    redirect("/onboarding/professional");
  }

  redirect(
    nextRoles.length > 1 ? "/workspace?tab=inventor" : "/workspace",
  );
}

export async function addVenRole(role: VenRole) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  if (!isVenRole(role)) {
    redirect("/workspace");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata as Record<string, unknown>;
  const existing = getVenRolesFromPublicMetadata(meta);

  if (existing.includes(role)) {
    redirect(
      role === "professional"
        ? "/workspace?tab=professional"
        : "/workspace?tab=inventor",
    );
  }

  const next = [...existing, role];
  await client.users.updateUser(userId, {
    publicMetadata: mergeVenRolesMetadata(meta, next),
  });

  if (role === "professional") {
    const refreshed = await client.users.getUser(userId);
    const nextMeta = refreshed.publicMetadata as Record<string, unknown>;
    if (!isProfessionalOnboardingComplete(nextMeta)) {
      redirect("/onboarding/professional");
    }
    redirect("/workspace?tab=professional");
  }

  redirect("/workspace?tab=inventor");
}
