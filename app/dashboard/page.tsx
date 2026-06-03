import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { VenSharesLogo } from "@/components/venshares-logo";
import { VenUserButton } from "@/components/ven-user-button";
import { AddProjectPanel } from "@/components/dashboard/add-project-panel";
import { listProjectsForCurrentUser } from "@/app/dashboard/projects/actions";
import { getVenRoleForCurrentUser } from "@/lib/ven-role.server";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const venRole = await getVenRoleForCurrentUser();
  const projects =
    venRole === "inventor" ? await listProjectsForCurrentUser() : [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <VenSharesLogo />
          <div className="flex items-center gap-4">
            <Link
              href="/idea-arena"
              className="text-sm font-medium text-slate-700 hover:text-[#22c55e]"
            >
              Idea Arena
            </Link>
            <VenUserButton />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600 mb-6">
          Account type:{" "}
          <span className="font-medium text-slate-900">
            {venRole === "professional"
              ? "Skilled professional"
              : venRole === "inventor"
                ? "Inventor"
                : "Not set (complete sign-up or sign in again)"}
          </span>
        </p>

        {venRole === "professional" ? (
          <div className="mb-8 space-y-3">
            <p className="text-slate-600 text-sm">
              Adding projects is available to inventor accounts.
            </p>
            <p>
              <Link
                href="/dashboard/profile"
                className="text-sm font-medium text-[#22c55e] hover:underline"
              >
                Edit profile skills
              </Link>
            </p>
          </div>
        ) : null}

        {venRole === "inventor" ? (
          <AddProjectPanel projects={projects} />
        ) : null}

        <Link href="/" className="text-[#22c55e] font-medium hover:underline">
          Back to home
        </Link>
      </main>
    </div>
  );
}
