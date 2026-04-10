---
name: Arena card membership border
overview: Show inventors and professionals which Idea Arena carousel cards are theirs by enriching the server-side project list with a per-viewer relation (owner vs team member) and styling `ProjectCard` with a subtle distinct border—without exposing other users’ Clerk IDs to the client.
todos:
  - id: arena-list-enrich
    content: Add listProjectsForArenaForViewer() in lib/projects-arena.ts (batch project_members, compute myRelation, keep ArenaProject mapping).
    status: completed
  - id: page-wire
    content: Use new list on app/idea-arena/page.tsx and pass myRelation to ProjectCard.
    status: completed
  - id: card-style
    content: Extend ProjectCard with myRelation styling + optional aria-label; resolve border vs selected ring.
    status: completed
isProject: false
---

# Idea Arena: membership highlight on project cards

## Context

- The Idea Arena index at [`app/idea-arena/page.tsx`](app/idea-arena/page.tsx) renders [`ProjectCard`](components/idea-arena/project-card.tsx) in a horizontal scroller; data comes from [`listProjectsForArena`](lib/projects-arena.ts).
- **Owner** = `projects.clerk_user_id === currentUserId` (see [`getWorkspaceAccessFlags`](lib/workspace-access.ts)). **Team member** = row in `project_members` for that user; owners are not inserted into `project_members` ([`joinProjectAsProfessional`](lib/project-members.ts) blocks self-join), so the two relations are mutually exclusive per project.
- Supabase uses the service role from the server client, so selecting `clerk_user_id` for mapping is fine ([`001_projects.sql`](supabase/migrations/001_projects.sql)).

## Approach

1. **Add a list API that returns arena projects plus viewer-only flags** (new function in [`lib/projects-arena.ts`](lib/projects-arena.ts), e.g. `listProjectsForArenaForViewer()`):
   - Reuse the same `.select(...)` as today but **include `clerk_user_id` only inside this function** to compute flags; map rows to the existing `ArenaProject` shape so no other call sites leak owner ids.
   - After loading projects, one batched query: `project_members` with `.eq("clerk_user_id", userId).in("project_id", projectIds)` and build a `Set` of ids.
   - For each row: `myRelation = row.clerk_user_id === userId ? "owner" : memberIds.has(row.id) ? "team" : null`.
   - Return type: `ArenaProject & { myRelation: "owner" | "team" | null }` (or a small named type `ArenaProjectCardData`).

2. **Wire the page** [`app/idea-arena/page.tsx`](app/idea-arena/page.tsx): call the new function instead of `listProjectsForArena`, pass `myRelation` into each `ProjectCard`.

3. **Style [`ProjectCard`](components/idea-arena/project-card.tsx)**:
   - Extend props with `myRelation?: "owner" | "team" | null`.
   - Apply a **thin, consistent border** (e.g. 2px) when `myRelation` is set—**distinct colors**: e.g. emerald for **owner** (aligns with existing dashboard/workspace green accents), violet or amber for **team** so it reads differently from selection.
   - **Interaction with `selected`**: today selection uses `ring-2 ring-sky-500 ring-offset-2`. Keep that behavior; the membership border can remain on the base `Link` so both states are visible (ring outside, border on the card). Tune classes so unselected cards still read clearly.
   - Optional a11y: add an `aria-label` on the `Link` when `myRelation` is set (e.g. append “— your project” / “— you’re on this team”) so screen readers get the same cue.

4. **Optional UX** (only if it feels unclear in the UI): one line of helper text under the carousel explaining the two border colors. Skip unless you want explicit legend copy.

## Out of scope (unless you ask)

- Changing [`getProjectByIdForArena`](lib/projects-arena.ts) or the project detail layout; this plan targets the **carousel cards** only.
- Showing other users’ ownership on cards (privacy-preserving by design).

## Verification

- Sign in as an **inventor** with at least one project: that card shows the **owner** border; others do not.
- Sign in as a **professional** who has joined a project: that card shows the **team** border.
- Selection (`?selected=` / first card) still shows the sky ring; membership border still visible where applicable.
