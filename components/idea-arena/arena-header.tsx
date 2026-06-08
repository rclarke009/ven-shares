"use client";

import Link from "next/link";

import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { WorkspaceNavLink } from "@/components/workspace/workspace-nav-link";
import { VenSharesLogo } from "@/components/venshares-logo";
import { VenUserButton } from "@/components/ven-user-button";
import type { VenUserButtonProfileMode } from "@/lib/ven-role";

const nav = [
  { label: "INVENT", href: "/#inventors" },
  { label: "EARN", href: "/#professionals" },
  { label: "INVEST", href: "/#how-it-works" },
  { label: "HELP", href: "/#how-it-works" },
] as const;

type ArenaHeaderProps = {
  profileMode: VenUserButtonProfileMode;
  contextWorkspaceHref?: string;
};

export function ArenaHeader({
  profileMode,
  contextWorkspaceHref,
}: ArenaHeaderProps) {
  return (
    <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <VenSharesLogo />
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
        <div className="flex items-center gap-4 shrink-0">
          <AdminNavLink />
          <WorkspaceNavLink contextWorkspaceHref={contextWorkspaceHref} />
          <VenUserButton profileMode={profileMode} />
        </div>
      </div>
    </header>
  );
}
