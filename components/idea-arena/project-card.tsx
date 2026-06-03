import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import type {
  ArenaCategorySlotStatus,
  ArenaProjectForViewer,
} from "@/lib/projects-arena";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";

import { ArenaUserAvatar } from "./arena-user-avatar";
import { arenaProjectImageUrl } from "./utils";

const TEAM_RAIL_PREVIEW_MAX = 4;
const DESC_PREVIEW_MAX = 1000;
const ARIA_DESC_SNIPPET_MAX = 120;

function categoryAbbrev(category: ProfessionalJobCategory): string {
  const bySlash = category
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  if (bySlash.length >= 2) {
    const a = bySlash[0][0];
    const b = bySlash[1][0];
    return `${a}${b}`.toUpperCase();
  }
  const words = category.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return category.slice(0, 2).toUpperCase();
}

function slotClasses(status: ArenaCategorySlotStatus): string {
  switch (status) {
    case "complete":
      return "bg-emerald-500 text-white ring-1 ring-emerald-600/40";
    case "in_progress":
      return "bg-sky-500 text-white ring-1 ring-sky-600/40";
    default:
      return "bg-amber-200 text-amber-950 ring-1 ring-amber-400/50";
  }
}

function summarizeStatuses(
  slots: ArenaProjectForViewer["category_statuses"],
): string {
  let needed = 0;
  let inProgress = 0;
  let complete = 0;
  for (const s of slots) {
    if (s.status === "needed") needed++;
    else if (s.status === "in_progress") inProgress++;
    else complete++;
  }
  const parts: string[] = [];
  if (needed) parts.push(`${needed} needed`);
  if (inProgress) parts.push(`${inProgress} in progress`);
  if (complete) parts.push(`${complete} complete`);
  return parts.length ? parts.join(", ") : "No team skills listed";
}

type ProjectCardProps = {
  project: ArenaProjectForViewer;
  selected: boolean;
  /** Query string for Idea Arena filters (no leading `?`). */
  detailSearch?: string;
};

export function ProjectCard({
  project,
  selected,
  detailSearch,
}: ProjectCardProps) {
  const src = arenaProjectImageUrl(project);
  const slots = project.category_statuses;
  const skillsSummary = summarizeStatuses(slots);
  const myRelation = project.myRelation;
  const teamPreview = project.teamPreview;

  const rawDescription = project.description?.trim() ?? "";
  const isDescriptionTruncated = rawDescription.length > DESC_PREVIEW_MAX;
  const descriptionPreview = isDescriptionTruncated
    ? rawDescription.slice(0, DESC_PREVIEW_MAX)
    : rawDescription;
  const ariaDescSnippet = rawDescription
    ? rawDescription.length > ARIA_DESC_SNIPPET_MAX
      ? `${rawDescription.slice(0, ARIA_DESC_SNIPPET_MAX)}…`
      : rawDescription
    : "";

  const href =
    detailSearch && detailSearch.length > 0
      ? `/idea-arena/${project.id}?${detailSearch}`
      : `/idea-arena/${project.id}`;

  const membershipBorderClass =
    myRelation === "owner"
      ? "border-2 border-emerald-600"
      : myRelation === "team"
        ? "border-2 border-violet-600"
        : "border border-slate-200/80";

  const descPart = ariaDescSnippet ? ` ${ariaDescSnippet}` : "";
  const ariaLabel =
    myRelation === "owner"
      ? `${project.title} — your project.${descPart} ${skillsSummary}`
      : myRelation === "team"
        ? `${project.title} — you're on this team.${descPart} ${skillsSummary}`
        : `${project.title}.${descPart} ${skillsSummary}.`;

  const shownMembers = teamPreview.slice(0, TEAM_RAIL_PREVIEW_MAX);
  const extraCount = Math.max(0, teamPreview.length - TEAM_RAIL_PREVIEW_MAX);

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`group flex rounded-2xl bg-[#f0f0f0] shadow-md overflow-hidden w-[min(100%,292px)] shrink-0 snap-start transition-shadow hover:shadow-lg ${membershipBorderClass} ${
        selected ? "ring-2 ring-sky-500 ring-offset-2" : ""
      }`}
    >
      <div className="flex-1 p-3 min-w-0 flex flex-col">
        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2 leading-snug">
          {project.title}
        </h3>
        <div className="aspect-4/3 relative bg-slate-300 rounded-lg overflow-hidden mb-2">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="200px"
          />
        </div>
        {descriptionPreview ? (
          <p className="text-[11px] text-slate-700 leading-snug mb-2">
            <span className="font-semibold">Summary: </span>
            {descriptionPreview}
            {isDescriptionTruncated ? (
              <>
                …{" "}
                <span className="text-[#22c55e] font-medium group-hover:underline">
                  Show more
                </span>
              </>
            ) : null}
          </p>
        ) : null}
        {slots.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-auto" aria-hidden>
            {slots.map(({ category, status }) => (
              <span
                key={category}
                title={category}
                className={`inline-flex h-6 min-w-6 px-1 items-center justify-center rounded-md text-[9px] font-bold leading-none ${slotClasses(status)}`}
              >
                {status === "complete" ? (
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                ) : (
                  categoryAbbrev(category)
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-auto text-[10px] text-slate-500 leading-snug">
            Team skills not listed yet.
          </p>
        )}
      </div>
      <div className="w-[76px] shrink-0 bg-slate-700 flex flex-col items-stretch py-3 px-1.5 border-l border-slate-600/80">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 text-center mb-2">
          Team
        </p>
        <div className="flex-1 min-h-0 max-h-[200px] overflow-y-auto flex flex-col items-center gap-3 px-0.5">
          {teamPreview.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center leading-snug">
              No team yet
            </p>
          ) : (
            <>
              {shownMembers.map((m) => {
                const label =
                  m.coveredCategories.length > 0
                    ? m.coveredCategories.join(" · ")
                    : "On the team";
                return (
                  <div
                    key={m.clerkUserId}
                    className="flex flex-col items-center gap-1 w-full min-w-0"
                  >
                    <ArenaUserAvatar
                      displayName={m.displayName}
                      imageUrl={m.imageUrl}
                      size={32}
                      className="ring-1 ring-slate-500/80"
                    />
                    <span
                      className="text-[9px] text-slate-200 text-center leading-tight font-medium line-clamp-2 w-full"
                      title={label}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
              {extraCount > 0 ? (
                <span className="text-[10px] font-semibold text-slate-300">
                  +{extraCount}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
