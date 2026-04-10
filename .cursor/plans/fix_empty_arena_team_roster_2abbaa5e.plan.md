---
name: Fix empty arena team roster
overview: Idea Arena’s team rail and detail sidebar load `project_members` with a select that includes `covered_job_categories`. If that column is missing (migration006 not applied) or PostgREST rejects the select, the query fails and the UI shows an empty roster—while the workspace still lists people because it only selects `clerk_user_id`. The fix is to fall back to a minimal select and treat coverage as empty, matching the pattern already used for failed joins in `project-members.ts`.
todos:
  - id: arena-team-fallback
    content: Add covered_job_categories missing-column detection + retry minimal select in getArenaTeamDisplay and getArenaTeamPreviewForProjects (lib/arena-team.ts)
    status: completed
  - id: covered-union-fallback
    content: "Optional: same fallback in fetchCoveredUnionByProjectIds (lib/projects-arena.ts) for teamCoversCategory accuracy"
    status: completed
  - id: verify-migration
    content: Confirm Supabase has project_members.covered_job_categories (migration 006) in deployed DB
    status: completed
isProject: false
---

# Fix “no professionals” / “No team yet” when members exist

## What’s going wrong

Two surfaces show empty team UI when [`teamMembers`](components/idea-arena/project-detail-view.tsx) / [`teamPreview`](components/idea-arena/project-card.tsx) are empty:

- Detail: **“No professionals on this team yet.”** ([`project-detail-view.tsx` ~276–279](components/idea-arena/project-detail-view.tsx))
- Cards: **“No team yet”** ([`project-card.tsx` ~150–153](components/idea-arena/project-card.tsx))

Both are driven by [`getArenaTeamDisplay`](lib/arena-team.ts) and [`getArenaTeamPreviewForProjects`](lib/arena-team.ts), which run:

```ts
.select("project_id, clerk_user_id, covered_job_categories") // preview
.select("clerk_user_id, covered_job_categories") // detail
```

On **any** Supabase error, preview fills every project with `[]` and detail returns `{ members: [] }` ([`arena-team.ts` ~113–116, ~201–210](lib/arena-team.ts)).

Meanwhile the **workspace** roster loads members with **no** `covered_job_categories` in the select ([`listMemberClerkIdsForProject`](lib/workspace.ts) ~78–81). So a database that never ran [006_project_members_covered_categories.sql](supabase/migrations/006_project_members_covered_categories.sql) (or any PostgREST/schema mismatch on that column) yields:

- Workspace: still shows owner + member IDs from `project_members`
- Idea Arena: **empty** team rail everywhereAn older plan assumed Clerk `getUser` failures dropped rows; current code already keeps rows via [`buildArenaTeamMemberDisplay`](lib/arena-team.ts) when `clerkUser` is null, so that path is **not** the remaining cause.

**Product nuance:** The Idea Arena “Team” column is **professionals in `project_members` only**—the inventor is **not** included (unlike the workspace sidebar, which always adds the owner first in [`workspace/page.tsx` ~85–106](app/idea-arena/[projectId]/workspace/page.tsx)). If the only “person on the team” you expect is the owner, the empty state is logically correct; the fix below still helps when real `project_members` rows exist but the arena query fails.

## Recommended implementation

1. **Harden [`lib/arena-team.ts`](lib/arena-team.ts)**  
   - Add a small helper, e.g. `isMissingCoveredJobCategoriesColumn(error)`, mirroring [`project-members.ts`](lib/project-members.ts) (~172–175): treat `PGRST204` (and/or `42703` if exposed) when the message references `covered_job_categories`.  
   - **Detail path** (`getArenaTeamDisplay`): on that error, retry `.select("clerk_user_id")` only and build members with `covered_job_categories` treated as `[]` / unknown (same as today’s null-Clerk branch: display name fallback, `coveredCategories` from DB only if we have no column—so `[]`, show **“On the team”**).  
   - **Preview path** (`getArenaTeamPreviewForProjects`): same fallback so cards get avatars/names for each row.

2. **Optional consistency** — [`fetchCoveredUnionByProjectIds`](lib/projects-arena.ts) (~83–86) also selects `covered_job_categories` and **silently** returns an empty map on error, which breaks `teamCoversCategory` on skill rows. Apply the same fallback there so category rows and arena team UI stay aligned (small change, same file).

3. **Verify in your environment** — Ensure migration 006 is applied in Supabase (`covered_job_categories` exists). The code fallback protects older/partial DBs and avoids silent empty rosters.

4. **Optional copy tweak** (only if you want less confusion with workspace): rename the sidebar label from **“Team”** to **“Professionals”** on the detail rail and card rail so it’s obvious the inventor is listed elsewhere—not required for the bug fix.

## Files to touch

- [`lib/arena-team.ts`](lib/arena-team.ts) — fallback select + error detection  
- [`lib/projects-arena.ts`](lib/projects-arena.ts) — optional `fetchCoveredUnionByProjectIds` fallback  
- (Optional) [`components/idea-arena/project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx), [`components/idea-arena/project-card.tsx`](components/idea-arena/project-card.tsx) — label “Professionals” if desired
