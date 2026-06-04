import Link from "next/link";

export function DashboardProfessionalHeader() {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Your teams</h1>
          <p className="text-slate-600 text-sm mt-1">
            Track checklist progress on teams you&apos;ve joined.
          </p>
          <p className="text-slate-600 text-sm mt-2">
            Update job categories and availability from your account menu (top
            right) → Manage account → Skills &amp; availability.
          </p>
        </div>
        <Link
          href="/idea-arena"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:border-[#22c55e] hover:text-[#15803d] shrink-0 transition-colors"
        >
          Browse Idea Arena
        </Link>
      </div>
    </div>
  );
}
