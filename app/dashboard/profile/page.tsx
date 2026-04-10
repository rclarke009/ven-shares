import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { updateProfessionalProfileSkills } from "@/app/dashboard/profile/actions";
import { ProfessionalOnboardingForm } from "@/components/onboarding/professional-onboarding-form";
import {
  getProfessionalHoursBandFromMetadata,
} from "@/lib/professional-onboarding";
import { getProfessionalJobCategoriesFromMetadata } from "@/lib/skills-match";
import { getVenRoleFromPublicMetadata } from "@/lib/ven-role";

export default async function ProfessionalProfilePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  const meta = user.publicMetadata as Record<string, unknown>;
  const role = getVenRoleFromPublicMetadata(meta);
  if (role !== "professional") {
    redirect("/dashboard");
  }

  const initialCategories = getProfessionalJobCategoriesFromMetadata(meta);
  const hoursBand = getProfessionalHoursBandFromMetadata(meta);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b bg-white/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <Link href="/" className="text-2xl font-bold">
            Ven<span className="text-[#22c55e]">Shares</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-[#22c55e]"
            >
              Dashboard
            </Link>
            <Link
              href="/idea-arena"
              className="text-sm font-medium text-slate-700 hover:text-[#22c55e]"
            >
              Idea Arena
            </Link>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Edit profile skills
        </h1>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          Update your job categories and weekly availability. Account email,
          password, and security are managed from your profile menu (top right).
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ProfessionalOnboardingForm
            key={`${hoursBand ?? ""}-${initialCategories.join(",")}`}
            initialCategories={initialCategories}
            initialHours={hoursBand ?? ""}
            formAction={updateProfessionalProfileSkills}
            submitLabel="Save profile"
            showOnboardingCopy={false}
          />
        </div>
      </main>
    </div>
  );
}
