"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-12">
      <SignIn
        path="/auth/sign-in"
        routing="path"
        signUpUrl="/auth/signup"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
