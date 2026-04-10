import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  DollarSign,
  Globe,
  Lightbulb,
  PencilRuler,
  Scale,
  Tv,
} from "lucide-react";

import type { ArenaProject } from "@/lib/projects-arena";
import type { VenRole } from "@/lib/ven-role";

import { arenaProjectImageUrl } from "./utils";
import { JoinTeamForm } from "./join-team-form";

const TEAM_BADGES = [PencilRuler, Tv, DollarSign, Lightbulb] as const;

function placeholderInitials(title: string): string {
  const words = title.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function avatarColor(seed: string): string {
  const hues = [200, 160, 40, 280, 340];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h += seed.charCodeAt(i);
  return `hsl(${hues[h % hues.length]} 55% 42%)`;
}

type ProjectDetailViewProps = {
  project: ArenaProject;
  venRole: VenRole | undefined;
  alreadyJoined: boolean;
  /** When set, professional cannot use Join Team (skill gate). */
  joinTeamSkillMessage?: string;
};

export function ProjectDetailView({
  project,
  venRole,
  alreadyJoined,
  joinTeamSkillMessage,
}: ProjectDetailViewProps) {
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
                {project.required_job_categories.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {project.required_job_categories.map((cat) => (
                      <li
                        key={cat}
                        className="rounded-full bg-white/90 border border-slate-300/80 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm"
                      >
                        {cat}
                      </li>
                    ))}
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
                  <ul className="mt-4 space-y-2">
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
                ) : null}
              </div>
              {venRole === "professional" ? (
                alreadyJoined ? (
                  <p className="text-sm font-semibold text-[#15803d] shrink-0 text-right max-w-48 sm:max-w-none">
                    You’re on this team.
                  </p>
                ) : joinTeamSkillMessage ? (
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
          <div className="lg:w-[120px] bg-slate-700 flex flex-row lg:flex-col items-center justify-center gap-3 lg:gap-4 py-4 lg:py-8 px-4 border-t lg:border-t-0 lg:border-l border-slate-600">
            {TEAM_BADGES.map((Icon, i) => (
              <div key={i} className="relative shrink-0">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white/30"
                  style={{
                    backgroundColor: avatarColor(`${project.id}-d-${i}`),
                  }}
                >
                  {placeholderInitials(project.title)}
                </div>
                <span className="absolute -top-0.5 -left-0.5 h-5 w-5 rounded-full bg-sky-400 flex items-center justify-center border border-white">
                  <Icon className="h-3 w-3 text-white" aria-hidden />
                </span>
              </div>
            ))}
            <ChevronDown className="h-5 w-5 text-slate-400 hidden lg:block" aria-hidden />
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link
          href={`/idea-arena?selected=${project.id}`}
          className="text-[#22c55e] font-medium hover:underline"
        >
          Back to Idea Arena
        </Link>
      </p>
    </div>
  );
}
