"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

const nav = [
  { label: "INVENT", href: "/#inventors" },
  { label: "EARN", href: "/#professionals" },
  { label: "INVEST", href: "/#how-it-works" },
  { label: "HELP", href: "/#how-it-works" },
] as const;

export function ArenaHeader() {
  const { signOut } = useClerk();

  return (
    <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-bold shrink-0 text-slate-900">
          VENSHARES
        </Link>
        <nav className="hidden md:flex items-center justify-center gap-8 text-xs font-medium tracking-wide text-slate-900 flex-1">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="hover:text-[#22c55e] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="ven-cta text-sm px-6 py-2 shrink-0"
          onClick={() => void signOut({ redirectUrl: "/" })}
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
}
