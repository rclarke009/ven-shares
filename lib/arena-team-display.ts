import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";

export type ArenaTeamMemberDisplay = {
  clerkUserId: string;
  displayName: string;
  imageUrl: string | null;
  /** Categories this member contributes toward this project (persisted or live fallback). */
  coveredCategories: ProfessionalJobCategory[];
  /** When this member joined the project (from project_members.created_at). */
  joinedAt: string;
  /** Project owner (inventor) vs professional team member. */
  role?: "owner" | "member";
};

/** Label under avatar on Idea Arena team rails. */
export function arenaTeamMemberRailLabel(m: ArenaTeamMemberDisplay): string {
  if (m.role === "owner") return "Inventor";
  if (m.coveredCategories.length > 0) return m.coveredCategories.join(" · ");
  return "On the team";
}

export type ArenaCategoryCoverage = {
  category: ProfessionalJobCategory;
  covered: boolean;
  teamLead: ArenaTeamMemberDisplay | null;
  otherMembers: ArenaTeamMemberDisplay[];
  /** All covering members, team lead first. */
  members: ArenaTeamMemberDisplay[];
};
