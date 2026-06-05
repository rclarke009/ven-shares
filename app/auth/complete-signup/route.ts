import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  getVenRolesFromPublicMetadata,
  isVenRole,
  mergeVenRolesMetadata,
  type VenRole,
} from "@/lib/ven-role";
import { SIGNUP_ROLE_COOKIE } from "@/lib/signup-role-cookie";

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return redirect(request, "/");
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(SIGNUP_ROLE_COOKIE)?.value;
  const fromCookie: VenRole | undefined =
    raw === "inventor" || raw === "professional" ? raw : undefined;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata as Record<string, unknown>;
  const existing = getVenRolesFromPublicMetadata(meta);

  if (fromCookie && isVenRole(fromCookie) && !existing.includes(fromCookie)) {
    const next = [...existing, fromCookie];
    await client.users.updateUser(userId, {
      publicMetadata: mergeVenRolesMetadata(meta, next),
    });
  }

  const refreshed = await client.users.getUser(userId);
  const nextMeta = refreshed.publicMetadata as Record<string, unknown>;
  const roles = getVenRolesFromPublicMetadata(nextMeta);

  let destination = "/workspace";
  if (roles.includes("professional") && !isProfessionalOnboardingComplete(nextMeta)) {
    destination = "/onboarding/professional";
  } else if (roles.length > 1) {
    destination = "/workspace?tab=inventor";
  } else if (roles.includes("professional")) {
    destination = "/workspace?tab=professional";
  }

  const res = redirect(request, destination);
  res.cookies.set(SIGNUP_ROLE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
