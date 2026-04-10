import Link from "next/link";

export default function SignUpHubPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2 text-center">
        Create your VenShares account
      </h1>
      <p className="text-slate-600 mb-10 max-w-md text-center">
        Choose how you&apos;ll use VenShares so we can tailor your experience.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/auth/signup/inventor"
          className="ven-cta text-center px-8 py-4 rounded-full font-medium"
        >
          Sign up as Inventor
        </Link>
        <Link
          href="/auth/signup/professional"
          className="text-center px-8 py-4 rounded-full font-medium border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
        >
          Sign up as Professional
        </Link>
      </div>
      <p className="mt-10 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-[#22c55e] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
