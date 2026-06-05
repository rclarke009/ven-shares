import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { addVenRole } from "@/app/auth/complete-role/actions";
import { isVenRole, type VenRole } from "@/lib/ven-role";

type RouteProps = {
  params: Promise<{ role: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteProps,
) {
  const { role: raw } = await params;
  if (!isVenRole(raw)) {
    redirect("/workspace");
  }
  await addVenRole(raw as VenRole);
}
