import type { ArenaCategorySlot, ArenaCategorySlotStatus } from "@/lib/projects-arena";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";

export type DashboardMiniProjectSummary = {
  projectId: string;
  projectTitle: string;
  categoryStatuses: ArenaCategorySlot[];
};

export type ProjectOverallStatus = ArenaCategorySlotStatus | "empty";

export function categoryAbbrev(category: ProfessionalJobCategory): string {
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

export function miniStatusChipClasses(status: ArenaCategorySlotStatus): string {
  switch (status) {
    case "complete":
      return "bg-emerald-500 text-white ring-1 ring-emerald-600/40";
    case "in_progress":
      return "bg-sky-500 text-white ring-1 ring-sky-600/40";
    default:
      return "bg-amber-200 text-amber-950 ring-1 ring-amber-400/50";
  }
}

export function deriveProjectOverallStatus(
  slots: ArenaCategorySlot[],
): ProjectOverallStatus {
  if (slots.length === 0) return "empty";
  if (slots.some((s) => s.status === "needed")) return "needed";
  if (slots.some((s) => s.status === "in_progress")) return "in_progress";
  return "complete";
}

export function overallStatusDotClasses(status: ProjectOverallStatus): string {
  switch (status) {
    case "complete":
      return "bg-emerald-500 ring-emerald-600/40";
    case "in_progress":
      return "bg-sky-500 ring-sky-600/40";
    case "needed":
      return "bg-amber-400 ring-amber-500/50";
    default:
      return "bg-slate-300 ring-slate-400/50";
  }
}

export function overallStatusLabel(status: ProjectOverallStatus): string {
  switch (status) {
    case "complete":
      return "All areas complete";
    case "in_progress":
      return "In progress";
    case "needed":
      return "Areas need attention";
    default:
      return "No skills listed";
  }
}

export function summarizeCategoryStatuses(slots: ArenaCategorySlot[]): string {
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

export function toMiniProjectSummaries(
  bundles: Array<{
    projectId: string;
    projectTitle: string;
    categoryStatuses: ArenaCategorySlot[];
  }>,
): DashboardMiniProjectSummary[] {
  return bundles.map((b) => ({
    projectId: b.projectId,
    projectTitle: b.projectTitle,
    categoryStatuses: b.categoryStatuses,
  }));
}
