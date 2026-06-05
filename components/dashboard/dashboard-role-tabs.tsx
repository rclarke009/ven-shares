import Link from "next/link";

type DashboardRoleTabsProps = {
  activeTab: "inventor" | "professional";
};

export function DashboardRoleTabs({ activeTab }: DashboardRoleTabsProps) {
  const tabClass = (tab: "inventor" | "professional") =>
    tab === activeTab
      ? "bg-slate-900 text-white"
      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300";

  return (
    <nav
      className="inline-flex rounded-full p-1 bg-slate-100 border border-slate-200 mb-8"
      aria-label="Dashboard role"
    >
      <Link
        href="/dashboard?tab=inventor"
        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tabClass("inventor")}`}
        aria-current={activeTab === "inventor" ? "page" : undefined}
      >
        Inventor
      </Link>
      <Link
        href="/dashboard?tab=professional"
        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tabClass("professional")}`}
        aria-current={activeTab === "professional" ? "page" : undefined}
      >
        Professional
      </Link>
    </nav>
  );
}
