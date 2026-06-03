import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";

export type ArenaTeamMemberDisplay = {
  clerkUserId: string;
  displayName: string;
  imageUrl: string | null;
  /** Categories this member contributes toward this project (persisted or live fallback). */
  coveredCategories: ProfessionalJobCategory[];
  /** When this member joined the project (from project_members.created_at). */
  joinedAt: string;
};

export type ArenaCategoryCoverage = {
  category: ProfessionalJobCategory;
  covered: boolean;
  teamLead: ArenaTeamMemberDisplay | null;
  otherMembers: ArenaTeamMemberDisplay[];
  /** All covering members, team lead first. */
  members: ArenaTeamMemberDisplay[];
};
