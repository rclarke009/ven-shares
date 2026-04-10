import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ArenaHeader } from "@/components/idea-arena/arena-header";
import { ArenaSkillFilter } from "@/components/idea-arena/arena-skill-filter";
import { ProjectCard } from "@/components/idea-arena/project-card";
import {
  effectiveArenaSkillFilter,
  filterArenaProjectsBySkillMode,
  buildIdeaArenaQueryString,
  parseArenaSkillFilterParams,
} from "@/lib/arena-skill-filter";
import { listProjectsForArenaForViewer } from "@/lib/projects-arena";
import { getProfessionalJobCategoriesFromMetadata } from "@/lib/skills-match";
import { getVenRoleForCurrentUser } from "@/lib/ven-role.server";

export default async function IdeaArenaPage({
  searchParams,
}: {
  searchParams: Promise<{
    selected?: string;
    skillFilter?: string;
    needCat?: string | string[];
  }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const allProjects = await listProjectsForArenaForViewer();
  const sp = await searchParams;
  const venRole = await getVenRoleForCurrentUser();
  const isProfessional = venRole === "professional";
  const clerkUser = isProfessional ? await currentUser() : null;
  const professionalCategories = getProfessionalJobCategoriesFromMetadata(
    clerkUser?.publicMetadata as Record<string, unknown> | undefined,
  );

  const parsedRaw = parseArenaSkillFilterParams(sp);
  const parsed = effectiveArenaSkillFilter(parsedRaw, isProfessional);
  const filteredProjects = filterArenaProjectsBySkillMode(
    allProjects,
    parsed,
    professionalCategories,
  );

  const selectedParam = sp.selected;
  const selectedId =
    selectedParam && filteredProjects.some((p) => p.id === selectedParam)
      ? selectedParam
      : filteredProjects[0]?.id;

  const emptyMineNoProfile =
    isProfessional &&
    parsed.mode === "mine" &&
    professionalCategories.length === 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <ArenaHeader />
      <section className="hero-bg py-14 md:py-20 px-6 text-center">
        <p className="text-lg md:text-2xl text-white max-w-3xl mx-auto font-medium drop-shadow-md">
          If you find a job you love, you&apos;ll never work again...
        </p>
      </section>

      <section className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10 pb-16">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Idea Arena</h2>
        <Suspense fallback={null}>
          <ArenaSkillFilter showMatchesMine={isProfessional} />
        </Suspense>

        {allProjects.length === 0 ? (
          <p className="text-slate-600 text-sm max-w-lg">
            No projects yet. Inventors can add projects from the{" "}
            <Link href="/dashboard" className="text-[#22c55e] font-medium hover:underline">
              dashboard
            </Link>
            .
          </p>
        ) : emptyMineNoProfile ? (
          <p className="text-slate-600 text-sm max-w-lg">
            Add your job categories to your profile to see jobs that match your
            skills.{" "}
            <Link
              href="/dashboard/profile"
              className="text-[#22c55e] font-medium hover:underline"
            >
              Edit profile skills
            </Link>
            .
          </p>
        ) : filteredProjects.length === 0 ? (
          <div className="text-slate-600 text-sm max-w-lg space-y-2">
            <p>No projects match this filter.</p>
            {parsed.mode === "need" && parsed.needCategories.length === 0 ? (
              <p className="text-slate-500">
                Choose at least one team skill above, or switch to{" "}
                <span className="font-medium text-slate-700">All jobs</span>.
              </p>
            ) : (
              <p className="text-slate-500">
                Try <span className="font-medium text-slate-700">All jobs</span>{" "}
                or adjust your filter.
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory">
            {filteredProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                myRelation={p.myRelation}
                selected={p.id === selectedId}
                detailSearch={
                  buildIdeaArenaQueryString({
                    selected: p.id,
                    skillFilter: parsed.mode,
                    needCategories: parsed.needCategories,
                  }) || undefined
                }
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
