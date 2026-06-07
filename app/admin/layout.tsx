import Link from "next/link";

import { assertSiteAdmin } from "@/lib/site-admin.server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertSiteAdmin();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/templates"
              className="text-lg font-semibold text-slate-900 hover:text-[#15803d]"
            >
              VenShares Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/templates"
                className="font-medium text-slate-700 hover:text-[#15803d]"
              >
                Project templates
              </Link>
            </nav>
          </div>
          <Link
            href="/workspace"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Back to workspace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
