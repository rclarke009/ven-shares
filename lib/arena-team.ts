import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isProjectUuid } from "@/lib/projects-arena";
import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import {
  getProfessionalJobCategoriesFromMetadata,
  intersectProfessionalWithRequiredCategories,
  normalizeRequiredJobCategoriesFromDb,
} from "@/lib/skills-match";

export type ArenaTeamMemberDisplay = {
  clerkUserId: string;
  displayName: string;
  imageUrl: string | null;
  /** Categories this member contributes toward this project (persisted or live fallback). */
  coveredCategories: ProfessionalJobCategory[];
};

export type ArenaCategoryCoverage = {
  category: ProfessionalJobCategory;
  covered: boolean;
  members: ArenaTeamMemberDisplay[];
};

function displayNameFromClerkUser(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  if (user.username) return user.username;
  return "Team member";
}

function normalizeCoveredFromDb(value: unknown): ProfessionalJobCategory[] {
  return normalizeRequiredJobCategoriesFromDb(value);
}

/**
 * Loads project team members with Clerk profile fields and per-category coverage
 * for Idea Arena. Legacy rows with empty `covered_job_categories` use live Clerk metadata.
 */
export async function getArenaTeamDisplay(
  projectId: string,
  requiredCategories: ProfessionalJobCategory[],
): Promise<{
  members: ArenaTeamMemberDisplay[];
  categoryCoverage: ArenaCategoryCoverage[];
}> {
  if (!isProjectUuid(projectId)) {
    return {
      members: [],
      categoryCoverage: requiredCategories.map((category) => ({
        category,
        covered: false,
        members: [],
      })),
    };
  }

  const supabase = createServerSupabaseClient();
  const { data: rows, error } = await supabase
    .from("project_members")
    .select("clerk_user_id, covered_job_categories")
    .eq("project_id", projectId);

  if (error) {
    console.log("MYDEBUG →", error.message);
    return {
      members: [],
      categoryCoverage: requiredCategories.map((category) => ({
        category,
        covered: false,
        members: [],
      })),
    };
  }

  const client = await clerkClient();
  const members: ArenaTeamMemberDisplay[] = [];

  for (const row of rows ?? []) {
    const clerkUserId =
      typeof row.clerk_user_id === "string" ? row.clerk_user_id : "";
    if (!clerkUserId) continue;

    let user: Awaited<ReturnType<typeof client.users.getUser>> | null = null;
    try {
      user = await client.users.getUser(clerkUserId);
    } catch {
      console.log("MYDEBUG →", "clerk getUser failed", clerkUserId);
      continue;
    }

    const fromDb = normalizeCoveredFromDb(row.covered_job_categories);
    const live = getProfessionalJobCategoriesFromMetadata(
      user.publicMetadata as Record<string, unknown>,
    );
    const coveredCategories =
      fromDb.length > 0
        ? intersectProfessionalWithRequiredCategories(fromDb, requiredCategories)
        : intersectProfessionalWithRequiredCategories(live, requiredCategories);

    const imageUrl = user.imageUrl?.trim() || null;

    members.push({
      clerkUserId,
      displayName: displayNameFromClerkUser(user),
      imageUrl,
      coveredCategories,
    });
  }

  const categoryCoverage: ArenaCategoryCoverage[] = requiredCategories.map(
    (category) => {
      const forCat = members.filter((m) => m.coveredCategories.includes(category));
      return {
        category,
        covered: forCat.length > 0,
        members: forCat,
      };
    },
  );

  return { members, categoryCoverage };
}
