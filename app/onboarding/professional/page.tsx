import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { completeProfessionalOnboarding } from "@/app/onboarding/professional/actions";
import { ProfessionalOnboardingForm } from "@/components/onboarding/professional-onboarding-form";
import { isProfessionalOnboardingComplete } from "@/lib/professional-onboarding";
import { getVenRoleFromPublicMetadata } from "@/lib/ven-role";

export default async function ProfessionalOnboardingPage() {
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
  if (isProfessionalOnboardingComplete(meta)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b bg-white/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link href="/" className="text-2xl font-bold">
            Ven<span className="text-[#22c55e]">Shares</span>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Personalize your profile
        </h1>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          Skilled professionals on VenShares work with inventors and IP. Later
          you&apos;ll add verification documents; for now, tell us your focus
          areas and availability.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ProfessionalOnboardingForm
            initialProfileImageUrl={user.imageUrl}
            formAction={completeProfessionalOnboarding}
            submitLabel="Continue to dashboard"
            showOnboardingCopy
          />
        </div>
      </main>
    </div>
  );
}
