import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import {
  SIGNUP_ROLE_COOKIE,
  SIGNUP_ROLE_COOKIE_MAX_AGE_SEC,
} from "@/lib/signup-role-cookie";
import { getVenRoleFromPublicMetadata, type VenRole } from "@/lib/ven-role";

const isSignupRolePath = createRouteMatcher([
  "/auth/signup/inventor(.*)",
  "/auth/signup/professional(.*)",
]);

const isAuthPath = createRouteMatcher(["/auth(.*)"]);
const isProfessionalOnboardingPath = createRouteMatcher([
  "/onboarding/professional(.*)",
]);
const isApiPath = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

function roleFromSignupPath(pathname: string): VenRole | null {
  if (pathname.startsWith("/auth/signup/inventor")) return "inventor";
  if (pathname.startsWith("/auth/signup/professional")) return "professional";
  return null;
}

export default clerkMiddleware(async (auth, req) => {
  if (isSignupRolePath(req)) {
    const role = roleFromSignupPath(req.nextUrl.pathname);
    if (role) {
      const res = NextResponse.next();
      res.cookies.set(SIGNUP_ROLE_COOKIE, role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SIGNUP_ROLE_COOKIE_MAX_AGE_SEC,
      });
      return res;
    }
  }

  if (isAuthPath(req) || isProfessionalOnboardingPath(req) || isApiPath(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.next();
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata as Record<string, unknown>;
  const role = getVenRoleFromPublicMetadata(meta);
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/complete-role";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (
    role === "professional" &&
    !isProfessionalOnboardingComplete(meta)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding/professional";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
