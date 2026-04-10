import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { VEN_ROLE_METADATA_KEY, getVenRoleFromPublicMetadata, isVenRole, type VenRole } from "@/lib/ven-role";
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
  const existing = user.publicMetadata[VEN_ROLE_METADATA_KEY];
  const hasExisting = typeof existing === "string" && existing.length > 0;

  if (!hasExisting && fromCookie && isVenRole(fromCookie)) {
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        [VEN_ROLE_METADATA_KEY]: fromCookie,
      },
    });
  }

  const refreshed = await client.users.getUser(userId);
  const venRoleForRedirect = getVenRoleFromPublicMetadata(
    refreshed.publicMetadata as Record<string, unknown>,
  );

  const destination =
    venRoleForRedirect === "professional"
      ? "/onboarding/professional"
      : "/dashboard";

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
