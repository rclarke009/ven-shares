---
name: Inventor workspace CTA
overview: The project detail page hides the workspace link for inventors because the UI is gated on professional membership only, even though the backend already allows project owners into the workspace. Fix by driving the CTA from the same access rules as `canAccessWorkspace` and tailoring the headline for owners vs team members.
todos:
  - id: workspace-flags
    content: Add getWorkspaceAccessFlags + refactor canAccessWorkspace in lib/workspace-access.ts
    status: completed
  - id: arena-page
    content: Pass canOpenWorkspace + isProjectOwner from idea-arena [projectId] page.tsx
    status: completed
  - id: detail-view
    content: Gate workspace CTA on canOpenWorkspace; owner vs member headline in project-detail-view.tsx
    status: completed
isProject: false
---

# Show workspace CTA for inventors (project owners)

## Root cause

- [`components/idea-arena/project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx) only renders “You’re on this team” + **Open workspace** when `venRole === "professional"` and `alreadyJoined` (lines 159–171).
- [`app/idea-arena/[projectId]/page.tsx`](app/idea-arena/[projectId]/page.tsx) sets `alreadyJoined` only for professionals; inventors always get `false` (lines 45–48):

```45:48:app/idea-arena/[projectId]/page.tsx
  const alreadyJoined =
    venRole === "professional"
      ? await getMembershipForCurrentUser(projectId)
      : false;
```

- Inventors in the **else** branch see “Team join is for skilled professionals.” (lines 179–182 in the detail view) even when they own the project.
- [`lib/workspace-access.ts`](lib/workspace-access.ts) already grants access when `project.clerk_user_id === userId` (owner), so this is a **UI conditional bug**, not an auth bug.

## Recommended fix

1. **Expose access + owner in one place**  
   Add something like `getWorkspaceAccessFlags(projectId, userId)` in [`lib/workspace-access.ts`](lib/workspace-access.ts) that returns `{ canAccess: boolean; isOwner: boolean }`, using the same query pattern as today (load project → if owner, allow; else check `project_members`). Implement `canAccessWorkspace` as a thin wrapper that returns `.canAccess` so call sites stay stable (including [`assertWorkspaceAccess`](lib/workspace-access.ts)).

2. **Idea Arena project page**  
   In [`app/idea-arena/[projectId]/page.tsx`](app/idea-arena/[projectId]/page.tsx), call `getWorkspaceAccessFlags` once and pass into `ProjectDetailView`:
   - `canOpenWorkspace` = `canAccess`
   - `isProjectOwner` = `isOwner` (for copy only)

3. **`ProjectDetailView` layout logic**  
   In [`components/idea-arena/project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx), restructure the right-hand action block:
   - If **`canOpenWorkspace`**: show the green workspace block (same **Open workspace** link). Headline: **`isProjectOwner`** → e.g. “This is your project.” (or “Project workspace”) · **else** → keep “You’re on this team.” for professionals who are members.
   - Else if **`venRole === "professional"`**: keep existing join flow (`joinTeamSkillMessage`, `JoinTeamForm`).
   - Else: keep “Team join is for skilled professionals.”

No change to [`ArenaProject`](lib/projects-arena.ts) typing is required; owner is inferred server-side via the new flags.

## Verification

- Log in as **inventor** on a project you own: project detail shows workspace CTA and link matches [`/idea-arena/[projectId]/workspace`](app/idea-arena/[projectId]/workspace/page.tsx) (same as dashboard).
- Log in as **professional** who joined: behavior unchanged (headline + button).
- Log in as **inventor** viewing someone else’s project (no membership): still no workspace CTA; still sees the “skilled professionals” note.
