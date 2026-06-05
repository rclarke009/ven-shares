import { ArenaHeader } from "@/components/idea-arena/arena-header";
import type { VenUserButtonProfileMode } from "@/lib/ven-role";

type WorkspacePageChromeProps = {
  profileMode: VenUserButtonProfileMode;
  children: React.ReactNode;
};

export function WorkspacePageChrome({
  profileMode,
  children,
}: WorkspacePageChromeProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <ArenaHeader profileMode={profileMode} />
      {children}
      <footer className="border-t border-slate-200 bg-white/80 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600">
          <p>Copyright VenShares 2024–2026</p>
        </div>
      </footer>
    </div>
  );
}
