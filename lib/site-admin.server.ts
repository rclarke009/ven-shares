import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { isSiteAdminFromPublicMetadata } from "@/lib/site-admin";

export async function isCurrentUserSiteAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  return isSiteAdminFromPublicMetadata(
    user.publicMetadata as Record<string, unknown>,
  );
}

export async function assertSiteAdmin(): Promise<void> {
  const ok = await isCurrentUserSiteAdmin();
  if (!ok) redirect("/workspace");
}
