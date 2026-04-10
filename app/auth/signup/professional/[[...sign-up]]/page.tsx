"use client";

import { SignUp } from "@clerk/nextjs";

export default function ProfessionalSignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-12">
      <SignUp
        path="/auth/signup/professional"
        routing="path"
        signInUrl="/auth/sign-in"
        forceRedirectUrl="/auth/complete-signup"
      />
    </div>
  );
}
