import Image from "next/image";
import Link from "next/link";
import { Globe, Scale } from "lucide-react";

import type {
  ArenaCategoryCoverage,
  ArenaTeamMemberDisplay,
} from "@/lib/arena-team";
import type { ArenaCategorySlotStatus, ArenaProject } from "@/lib/projects-arena";
import type { VenRole } from "@/lib/ven-role";

import { ArenaUserAvatar } from "./arena-user-avatar";
import { CategoryCompletionControl } from "./category-completion-control";
import { arenaProjectImageUrl } from "./utils";
import { JoinTeamForm } from "./join-team-form";

function categoryRowClass(status: ArenaCategorySlotStatus): string {
  switch (status) {
    case "complete":
      return "border-emerald-200/90 bg-emerald-50/60";
    case "in_progress":
      return "border-sky-200/90 bg-sky-50/50";
    default:
      return "border-amber-200/90 bg-amber-50/80 border-dashed";
  }
}

function categoryStatusBadge(status: ArenaCategorySlotStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "complete":
      return {
        label: "Complete",
        className: "text-emerald-900/90 bg-emerald-100/90",
      };
    case "in_progress":
      return {
        label: "In progress",
        className: "text-sky-900/90 bg-sky-100/90",
      };
    default:
      return {
        label: "Needed",
        className: "text-amber-800/90 bg-amber-100/70",
      };
  }
}

type ProjectDetailViewProps = {
  project: ArenaProject;
  venRole: VenRole | undefined;
  canOpenWorkspace: boolean;
  isProjectOwner: boolean;
  /** Inventor or team member: can mark job categories complete / reopen. */
  canManageCategoryCompletion: boolean;
  /** When set, professional cannot use Join Team (skill gate). */
  joinTeamSkillMessage?: string;
  teamMembers: ArenaTeamMemberDisplay[];
  categoryCoverage: ArenaCategoryCoverage[];
  /** Query string for Idea Arena list (no leading `?`). */
  returnToArenaQuery: string;
};

export function ProjectDetailView({
  project,
  venRole,
  canOpenWorkspace,
  isProjectOwner,
  canManageCategoryCompletion,
  joinTeamSkillMessage,
  teamMembers,
  categoryCoverage,
  returnToArenaQuery,
}: ProjectDetailViewProps) {
  const coverageByCategory = new Map(
    categoryCoverage.map((c) => [c.category, c]),
  );
  const src = arenaProjectImageUrl(project);
  const summary =
    project.description?.trim() ||
    "No summary yet. The inventor can add more detail from the dashboard.";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="rounded-3xl border border-slate-200/80 bg-[#f0f0f0] shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6 lg:p-8 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 mb-4 leading-tight">
              {project.title}
            </h1>
            <div className="aspect-square max-w-md relative bg-slate-800 rounded-xl overflow-hidden mb-6 mx-auto lg:mx-0">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <Image
                src={src}
                alt=""
                fill
                className="object-cover mix-blend-normal"
                sizes="(max-width: 1024px) 100vw, 28rem"
                priority
              />
            </div>
            <p className="text-slate-800 text-sm leading-relaxed">
              <span className="font-bold">Summary: </span>
              {summary}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  Team skills needed:
                </p>
                {project.category_statuses.length > 0 ? (
                  <ul className="flex flex-col gap-2 max-w-xl">
                    {project.category_statuses.map(({ category, status }) => {
                      const cov = coverageByCategory.get(category);
                      const coverMembers = cov?.members ?? [];
                      const badge = categoryStatusBadge(status);
                      return (
                        <li
                          key={category}
                          className={`rounded-xl border px-3 py-2.5 shadow-sm ${categoryRowClass(status)}`}
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-xs font-semibold text-slate-900">
                              {category}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            {status === "complete" ? (
                              <span className="text-[10px] font-medium text-slate-600">
                                No longer needed
                              </span>
                            ) : null}
                            {coverMembers.length > 0 ? (
                              <div className="flex flex-row items-center pl-0.5">
                                {coverMembers.map((m, i) => (
                                  <span
                                    key={m.clerkUserId}
                                    className={i > 0 ? "-ml-2" : ""}
                                  >
                                    <ArenaUserAvatar
                                      displayName={m.displayName}
                                      imageUrl={m.imageUrl}
                                      size={26}
                                    />
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          {status !== "complete" && coverMembers.length > 0 ? (
                            <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                              Covered by{" "}
                              {coverMembers.map((m) => m.displayName).join(", ")}
                            </p>
                          ) : null}
                          {status === "complete" && coverMembers.length > 0 ? (
                            <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                              Previously covered by{" "}
                              {coverMembers.map((m) => m.displayName).join(", ")}
                            </p>
                          ) : null}
                          {canManageCategoryCompletion ? (
                            <CategoryCompletionControl
                              projectId={project.id}
                              category={category}
                              isComplete={status === "complete"}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-300/90 text-slate-700 border border-slate-400/50">
                      <Globe className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-300/90 text-slate-700 border border-slate-400/50">
                      <Scale className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-xs text-slate-600 max-w-xs">
                      Not listed yet — the inventor can add team skills from the
                      dashboard.
                    </span>
                  </div>
                )}
                {project.project_required_skills.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-800 mb-2">
                      More detail from the inventor:
                    </p>
                    <ul className="space-y-2">
                      {project.project_required_skills.map((s, i) => (
                        <li
                          key={`${s.skill_name}-${i}`}
                          className="rounded-lg border border-slate-300/80 bg-white/80 px-3 py-2 text-xs text-slate-800"
                        >
                          <span className="font-semibold">{s.skill_name}</span>
                          {s.skill_description.trim() ? (
                            <p className="mt-1 text-slate-600 leading-snug">
                              {s.skill_description}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              {canOpenWorkspace ? (
                <div className="shrink-0 text-right max-w-48 sm:max-w-none space-y-2">
                  <p className="text-sm font-semibold text-[#15803d]">
                    {isProjectOwner
                      ? "This is your project."
                      : "You’re on this team."}
                  </p>
                  <Link
                    href={`/idea-arena/${project.id}/workspace`}
                    className="inline-flex text-sm font-semibold text-white bg-[#15803d] hover:bg-[#166534] rounded-lg px-4 py-2 transition-colors"
                  >
                    Open workspace
                  </Link>
                </div>
              ) : venRole === "professional" ? (
                joinTeamSkillMessage ? (
                  <p className="text-sm text-slate-600 shrink-0 text-right max-w-xs sm:max-w-sm leading-snug">
                    {joinTeamSkillMessage}
                  </p>
                ) : (
                  <JoinTeamForm projectId={project.id} />
                )
              ) : (
                <p className="text-sm text-slate-600 shrink-0 text-right max-w-56">
                  Team join is for skilled professionals.
                </p>
              )}
            </div>
          </div>
          <div className="lg:min-w-[156px] lg:max-w-[220px] bg-slate-700 flex flex-col py-4 lg:py-6 px-3 border-t lg:border-t-0 lg:border-l border-slate-600">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-center mb-3">
              Team
            </p>
            <div className="min-w-0 flex-1">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center leading-snug px-1">
                  No professionals on this team yet.
                </p>
              ) : (
                <ul className="flex flex-row lg:flex-col gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 justify-start lg:items-center">
                  {teamMembers.map((m) => (
                    <li
                      key={m.clerkUserId}
                      className="flex flex-col items-center gap-1.5 shrink-0 w-[92px] lg:w-full"
                    >
                      <ArenaUserAvatar
                        displayName={m.displayName}
                        imageUrl={m.imageUrl}
                        size={48}
                      />
                      <span className="text-[11px] text-white text-center leading-tight font-medium line-clamp-2 w-full px-0.5">
                        {m.displayName}
                      </span>
                      {m.coveredCategories.length > 0 ? (
                        <span className="text-[10px] text-slate-400 text-center leading-snug line-clamp-4 px-0.5">
                          {m.coveredCategories.join(" · ")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 text-center italic">
                          On the team
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link
          href={
            returnToArenaQuery
              ? `/idea-arena?${returnToArenaQuery}`
              : `/idea-arena?selected=${project.id}`
          }
          className="text-[#22c55e] font-medium hover:underline"
        >
          Back to Idea Arena
        </Link>
      </p>
    </div>
  );
}
