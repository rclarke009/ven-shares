import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { setVenRoleFromCompleteRole } from "@/app/auth/complete-role/actions";
import { getVenRolesFromPublicMetadata } from "@/lib/ven-role";

export default async function CompleteRolePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  if (
    getVenRolesFromPublicMetadata(
      user.publicMetadata as Record<string, unknown>,
    ).length > 0
  ) {
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2 text-center">
        Finish setting up your account
      </h1>
      <p className="text-slate-600 mb-10 max-w-md text-center text-base leading-relaxed">
        Choose how you&apos;ll use VenShares. You can add the other role
        anytime from your dashboard.
      </p>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <form action={setVenRoleFromCompleteRole}>
          <input type="hidden" name="roleChoice" value="inventor" />
          <button
            type="submit"
            className="ven-cta w-full text-center px-8 py-4 rounded-full font-medium"
          >
            Inventor
          </button>
        </form>
        <form action={setVenRoleFromCompleteRole}>
          <input type="hidden" name="roleChoice" value="professional" />
          <button
            type="submit"
            className="w-full text-center px-8 py-4 rounded-full font-medium border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
          >
            Skilled professional
          </button>
        </form>
        <form action={setVenRoleFromCompleteRole}>
          <input type="hidden" name="roleChoice" value="both" />
          <button
            type="submit"
            className="w-full text-center px-8 py-4 rounded-full font-medium border-2 border-[#22c55e] text-[#15803d] hover:bg-[#22c55e] hover:text-white transition-colors"
          >
            Both inventor and professional
          </button>
        </form>
      </div>
      <p className="mt-10 text-sm text-slate-500">
        Wrong place?{" "}
        <Link href="/" className="text-[#22c55e] font-medium hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
