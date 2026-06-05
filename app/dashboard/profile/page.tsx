import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { VenSharesLogo } from "@/components/venshares-logo";
import { VenUserButtonFromServer } from "@/components/ven-user-button-from-server";
import { updateProfessionalProfileSkills } from "@/app/dashboard/profile/actions";
import { ProfessionalOnboardingForm } from "@/components/onboarding/professional-onboarding-form";
import {
  getProfessionalHoursBandFromMetadata,
} from "@/lib/professional-onboarding";
import { getProfessionalJobCategoriesFromMetadata } from "@/lib/skills-match";
import { hasProfessionalRole } from "@/lib/ven-role";

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
  if (!hasProfessionalRole(meta)) {
    redirect("/workspace");
  }

  const initialCategories = getProfessionalJobCategoriesFromMetadata(meta);
  const hoursBand = getProfessionalHoursBandFromMetadata(meta);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b bg-white/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <VenSharesLogo />
          <div className="flex items-center gap-4">
            <Link
              href="/workspace"
              className="text-sm font-medium text-slate-700 hover:text-[#22c55e]"
            >
              Workspace
            </Link>
            <Link
              href="/idea-arena"
              className="text-sm font-medium text-slate-700 hover:text-[#22c55e]"
            >
              Idea Arena
            </Link>
            <VenUserButtonFromServer />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Edit profile skills
        </h1>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          Update your job categories, weekly availability, and profile photo.
          You can also edit categories and hours from your account menu (top
          right) → Manage account → Skills &amp; availability.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ProfessionalOnboardingForm
            key={`${hoursBand ?? ""}-${initialCategories.join(",")}-${user.imageUrl ?? ""}`}
            initialCategories={initialCategories}
            initialHours={hoursBand ?? ""}
            initialProfileImageUrl={user.imageUrl}
            formAction={updateProfessionalProfileSkills}
            submitLabel="Save profile"
            showOnboardingCopy={false}
            variant="full"
            showProfilePhoto
          />
        </div>
      </main>
    </div>
  );
}
