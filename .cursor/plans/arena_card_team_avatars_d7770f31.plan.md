---
name: Arena card team avatars
overview: Fix the empty “no professionals on this team” roster when Clerk user fetch fails, and add a team preview column on Idea Arena project cards with avatars and job-category labels, backed by batched `project_members` + deduped Clerk lookups on the list page.
todos:
  - id: harden-arena-team
    content: "Refactor lib/arena-team.ts: shared member builder; on Clerk failure keep row with fallback name + DB-covered categories"
    status: completed
  - id: batch-team-preview
    content: "listProjectsForArenaForViewer: batch project_members + deduped Clerk fetch; attach teamPreview to ArenaProjectForViewer"
    status: completed
  - id: project-card-rail
    content: "project-card.tsx: team rail with ArenaUserAvatar + grouped category labels; widen column; empty state copy"
    status: completed
isProject: false
---

# Arena project card team avatars and roster fix

## What’s going wrong today

- **[`components/idea-arena/project-card.tsx`](components/idea-arena/project-card.tsx)** — The right rail (`w-[52px]`) renders **one dot per required team skill** (needed / in progress / complete), not people. Nothing there reflects “who joined,” so it can feel like “no professionals” even when you’re on the team and the left column shows progress chips.
- **[`components/idea-arena/project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx)** (lines245–248) — The sidebar shows **“No professionals on this team yet.”** when `teamMembers.length === 0`.
- **[`lib/arena-team.ts`](lib/arena-team.ts)** (lines 91–96) — On `clerkClient.users.getUser` failure, the loop **`continue`s and drops that member entirely**. If every fetch fails (transient Clerk error, misconfiguration, etc.), the UI shows an empty team despite rows in `project_members`. **[`lib/workspace-display-names.ts`](lib/workspace-display-names.ts)** already uses a softer pattern: catch and fall back to `"Unknown user"`.

## Approach

### 1. Harden team roster loading (detail + shared builder)

- In [`lib/arena-team.ts`](lib/arena-team.ts), **stop skipping members** when Clerk fails. For failed fetches:
  - Use **`displayName: "Team member"`** (or align with `"Unknown user"` — pick one string and use consistently).
  - **`imageUrl: null`** so [`ArenaUserAvatar`](components/idea-arena/arena-user-avatar.tsx) shows initials.
  - **`coveredCategories`**: if `covered_job_categories` in DB is non-empty, still run `intersectProfessionalWithRequiredCategories(fromDb, requiredCategories)` so labels like “Legal” / “Software development” can appear even without Clerk metadata. If DB is empty and Clerk failed, fall back to `[]` and keep the existing **“On the team”** line in the detail sidebar.

- Refactor slightly so **one internal helper** builds an `ArenaTeamMemberDisplay` from `(row, clerkUser | null, requiredCategories)` to avoid duplicating logic between the detail path and the new list path.

### 2. Batched team preview for the Idea Arena list

- Extend **[`ArenaProjectForViewer`](lib/projects-arena.ts)** with something like **`teamPreview: ArenaTeamMemberDisplay[]`** (import the type from `arena-team` or re-export it from `projects-arena` to keep the card’s imports clean).

- In **[`listProjectsForArenaForViewer`](lib/projects-arena.ts)** (after `listProjectsForArena()` returns rows):
  1. Query Supabase once: `project_members` with `.select("project_id, clerk_user_id, covered_job_categories").in("project_id", ids)`.
  2. **Dedupe** all `clerk_user_id` values across projects.
  3. Resolve Clerk users in parallel (same pattern as [`resolveClerkDisplayNames`](lib/workspace-display-names.ts): `Promise.all` over unique ids). Reuse the hardened member builder so behavior matches the detail page.
  4. For each project, attach **`teamPreview`** (full member list, or cap at **3–4** with a small **“+N”** hint if you want to limit card height — optional).

- **Performance note:** Deduping Clerk IDs keeps load reasonable when the same person appears on multiple projects. If the project count grows large, you can add a simple concurrency limit later; not required for the first iteration.

### 3. Project card UI (right rail)

- Update **[`components/idea-arena/project-card.tsx`](components/idea-arena/project-card.tsx)**:
  - Accept `teamPreview` (via extended `ArenaProject` / `ArenaProjectForViewer` on `project`).
  - Replace the status-dot column with a **team column**: for each member, render [`ArenaUserAvatar`](components/idea-arena/arena-user-avatar.tsx) (e.g. size **28–32**) and **category text** underneath.
  - **Label rule (your stated preference):** **Group skills under one avatar** — `coveredCategories.join(" · ")` with `line-clamp-2` and `title` for full text. If `coveredCategories` is empty, show **“On the team”** (same semantics as detail view).
  - **Empty `teamPreview`:** Short muted line, e.g. **“No team yet”** (avoids implying category dots were “people”).
  - **Layout:** Widen the rail from `52px` to roughly **`64–80px`**, keep vertical stacking / `overflow-y-auto` with `max-h` if many members so the card doesn’t grow unbounded. Remove or relocate the **ChevronDown** if it no longer matches the metaphor (optional cleanup).

- **[`app/idea-arena/page.tsx`](app/idea-arena/page.tsx)** — No structural change beyond types flowing through; `ProjectCard` already receives `project={p}`.

## Verification

- Join a project as a professional with known categories → **detail** sidebar lists you; **card** rail shows your avatar and **Legal · Software development** (or whatever categories intersect required skills).
- Temporarily simulate Clerk failure (or use an invalid user id in DB in a dev branch): member row should **still appear** with fallback name and DB-derived categories when present.
- Owner / non-member: card shows **“No team yet”** (or only members if others joined); left column category chips unchanged.
