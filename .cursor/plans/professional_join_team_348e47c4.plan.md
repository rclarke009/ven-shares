---
name: Professional Join Team
overview: "Add a minimal “Join Team” flow for signed-in professionals who have completed simple onboarding: persist membership in Supabase, gate by role and duplicate joins, and replace the disabled button in Idea Arena detail with a working action plus clear copy for inventors and incomplete professionals."
todos:
  - id: migration-project-members
    content: Add supabase/migrations/003_project_members.sql (FK, unique (project_id, clerk_user_id), RLS no policies)
    status: completed
  - id: lib-join-mutation
    content: "Add lib/project-members.ts: membership lookup + joinProjectAsProfessional with role/onboarding/UUID checks"
    status: completed
  - id: server-action-revalidate
    content: Add app/idea-arena/actions.ts server action + revalidatePath for arena list and detail
    status: completed
  - id: detail-page-props
    content: Extend idea-arena/[projectId]/page.tsx to pass join state; update ProjectDetailView CTA and copy
    status: completed
isProject: false
---

# Professional Join Team (Idea Arena)

## Prerequisites (already satisfied)

- **Auth and roles:** [`lib/ven-role.server.ts`](lib/ven-role.server.ts) exposes `isCurrentUserProfessional()`, `getVenRoleForCurrentUser()`, and `isCurrentUserProfessionalOnboardingComplete()`.
- **Professional onboarding gate:** [`middleware.ts`](middleware.ts) already redirects incomplete professionals to `/onboarding/professional`, so anyone reaching `/idea-arena` as a professional has completed onboarding.
- **Data access pattern:** Projects use the service-role Supabase client server-side only ([`lib/supabase-server.ts`](lib/supabase-server.ts)); RLS stays enabled with no policies ([`supabase/migrations/001_projects.sql`](supabase/migrations/001_projects.sql)) — new tables should follow the same pattern.

No additional prerequisite work is required before this slice.

## Data model

Add a new migration (e.g. [`supabase/migrations/003_project_members.sql`](supabase/migrations/003_project_members.sql)):

- Table `public.project_members` (name can be adjusted, but keep it explicit):
  - `id` uuid PK default `gen_random_uuid()`
  - `project_id` uuid **not null** references `public.projects(id)` **on delete cascade**
  - `clerk_user_id` text **not null** (the professional who joined)
  - `created_at` timestamptz default `now()`
  - **Unique constraint** on `(project_id, clerk_user_id)` so a user cannot join twice
- Index on `project_id` for lookups; optional index on `clerk_user_id` if you list “my projects” later.
- `enable row level security` with **no policies** (server service role only), matching `projects`.

## Server layer

1. **Queries / mutations** (new small module, e.g. [`lib/project-members.ts`](lib/project-members.ts) or colocated with arena):

   - `getMembershipForCurrentUser(projectId: string): Promise<boolean>` — returns whether the signed-in user already has a row for that project.
   - `joinProjectAsProfessional(projectId: string): Promise<{ ok: true } | { ok: false; error: string }>`:
     - Require `auth().userId`.
     - Require `getVenRoleForCurrentUser() === "professional"`.
     - Require `isCurrentUserProfessionalOnboardingComplete()` (defense in depth even though middleware usually ensures this).
     - Validate UUID (reuse [`isProjectUuid`](lib/projects-arena.ts) or share a tiny `lib/uuid.ts` if you want to avoid coupling).
     - Verify project exists (reuse `getProjectByIdForArena` or a lightweight `select 1`).
     - `insert` into `project_members`; on unique violation, return a friendly “Already on this team” message.
     - Optionally: if `projects.clerk_user_id === userId`, reject (should not happen for `professional`, but cheap guard).

2. **Server Action** (e.g. [`app/idea-arena/actions.ts`](app/idea-arena/actions.ts) with `"use server"`):

   - Thin wrapper around `joinProjectAsProfessional` that calls `revalidatePath("/idea-arena")` and `revalidatePath(\`/idea-arena/${projectId}\`)` on success.
   - Return a small result type for the UI (success vs error message), following the pattern in [`app/dashboard/projects/actions.ts`](app/dashboard/projects/actions.ts).

## UI

1. **[`app/idea-arena/[projectId]/page.tsx`](app/idea-arena/[projectId]/page.tsx)**  
   After loading the project, compute server-side:

   - `role` via `getVenRoleForCurrentUser()`
   - `alreadyJoined` via `getMembershipForCurrentUser(projectId)` when user is a professional
   - Pass these into the detail view (e.g. `joinState` prop).

2. **[`components/idea-arena/project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx)**  
   Replace the hard-coded disabled button with behavior driven by props:

   - **Professional, not joined:** show primary **Join Team** control wired to the server action (either a `<form action={...}>` with hidden `projectId`, or a tiny client button calling `startTransition` + action — prefer the simplest pattern consistent with your Next version per [AGENTS.md](AGENTS.md)).
   - **Professional, already joined:** show success state (e.g. “You’re on this team”) and disable or hide the join CTA.
   - **Inventor (or non-professional):** show disabled or static text: e.g. “Team join is for skilled professionals” (no server mutation).
   - **Error path:** surface action error (inline under button or brief banner).

3. **Optional polish (same slice if small):** deterministic “team rail” could later read member count from DB; for v1, only the CTA state change is enough.

## Security checklist

- Never expose service role to the client.
- All checks (role, onboarding, project exists, duplicate join) happen in the server action / lib called only from server.
- Do not leak whether a project exists to anonymous users (page already requires sign-in).

## Verification

- Sign in as **professional** (onboarding complete) → open a project → **Join Team** → refresh → see “already joined” state.
- Same user → join again → friendly duplicate message (or idempotent UX if you treat duplicate as success — pick one and document in code).
- Sign in as **inventor** → no join; explanatory copy only.
- Run migration against local Supabase before manual testing.

## Out of scope (follow-ups)

- Inventor approval workflow, NDAs, skill matching, notifications.
- “Leave team” and listing all members on the card rail.
- Row-level security for client-side Supabase (not in use today).
