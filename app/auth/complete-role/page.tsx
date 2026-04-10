import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { setVenRoleFromCompleteRole } from "@/app/auth/complete-role/actions";
import { getVenRoleFromPublicMetadata } from "@/lib/ven-role";

export default async function CompleteRolePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  if (getVenRoleFromPublicMetadata(user.publicMetadata as Record<string, unknown>)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2 text-center">
        Finish setting up your account
      </h1>
      <p className="text-slate-600 mb-10 max-w-md text-center text-sm leading-relaxed">
        Choose how you&apos;ll use VenShares. You can sign out from the profile
        menu if you need a different account.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <form action={setVenRoleFromCompleteRole} className="flex-1">
          <input type="hidden" name="venRole" value="inventor" />
          <button
            type="submit"
            className="ven-cta w-full text-center px-8 py-4 rounded-full font-medium"
          >
            Inventor
          </button>
        </form>
        <form action={setVenRoleFromCompleteRole} className="flex-1">
          <input type="hidden" name="venRole" value="professional" />
          <button
            type="submit"
            className="w-full text-center px-8 py-4 rounded-full font-medium border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
          >
            Skilled professional
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
