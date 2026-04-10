import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArenaHeader } from "@/components/idea-arena/arena-header";
import { ProjectCard } from "@/components/idea-arena/project-card";
import { listProjectsForArena } from "@/lib/projects-arena";

export default async function IdeaArenaPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const projects = await listProjectsForArena();
  const sp = await searchParams;
  const selectedParam = sp.selected;
  const selectedId =
    selectedParam && projects.some((p) => p.id === selectedParam)
      ? selectedParam
      : projects[0]?.id;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <ArenaHeader />
      <section className="hero-bg py-14 md:py-20 px-6 text-center">
        <p className="text-lg md:text-2xl text-slate-900 max-w-3xl mx-auto font-medium drop-shadow-sm">
          If you find a job you love, you&apos;ll never work again...
        </p>
      </section>

      <section className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10 pb-16">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Idea Arena</h2>
        {projects.length === 0 ? (
          <p className="text-slate-600 text-sm max-w-lg">
            No projects yet. Inventors can add projects from the{" "}
            <Link href="/dashboard" className="text-[#22c55e] font-medium hover:underline">
              dashboard
            </Link>
            .
          </p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                selected={p.id === selectedId}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white/80 py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600">
          <p>Copyright VenShares 2024–2026</p>
          <Link href="/" className="font-semibold text-slate-900 hover:text-[#22c55e]">
            Contact Us
          </Link>
        </div>
      </footer>
    </div>
  );
}
