"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { isSiteAdminFromPublicMetadata } from "@/lib/site-admin";

const defaultLinkClass =
  "text-sm font-medium text-slate-700 hover:text-[#22c55e] transition-colors";

type AdminNavLinkProps = {
  className?: string;
};

export function AdminNavLink({ className }: AdminNavLinkProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return null;
  if (
    !isSiteAdminFromPublicMetadata(
      user.publicMetadata as Record<string, unknown>,
    )
  ) {
    return null;
  }
  if (pathname.startsWith("/admin")) return null;

  return (
    <Link href="/admin/templates" className={className ?? defaultLinkClass}>
      Admin
    </Link>
  );
}
