---
name: Subtitle text-base rollout
overview: Standardize descriptive page copy (section subtitles, empty states, and page intros) from `text-sm` to `text-base`, matching the already-updated professional dashboard header subtitle.
todos:
  - id: dashboard-workspace-home
    content: Update dashboard + workspace-dashboard-panel subtitles and empty states to text-base
    status: completed
  - id: idea-arena
    content: Update Idea Arena empty states and project-detail join helper copy to text-base
    status: completed
  - id: workspace-tabs
    content: Update workspace tab intros, get-started, journey, roadmap, files, messages, progress empty states to text-base
    status: completed
  - id: profile-onboarding
    content: Update profile, onboarding, complete-role, and skills panel page intros to text-base
    status: completed
  - id: visual-spot-check
    content: Spot-check key pages in browser for consistent subtitle sizing
    status: completed
isProject: false
---

# Subtitle font size rollout (`text-sm` → `text-base`)

## Reference

The target size is already set in [`components/dashboard/dashboard-professional-header.tsx`](components/dashboard/dashboard-professional-header.tsx):

```5:7:components/dashboard/dashboard-professional-header.tsx
      <p className="text-slate-600 text-base mt-1">
        Track checklist progress on teams you&apos;ve joined.
      </p>
```

The old size appears on the workspace empty state in [`components/workspace/workspace-dashboard-panel.tsx`](components/workspace/workspace-dashboard-panel.tsx):

```68:71:components/workspace/workspace-dashboard-panel.tsx
              <p className="text-slate-600 text-sm mb-10">
                You haven&apos;t joined a team yet. Use Idea Arena in the header
                to find projects that match your skills.
              </p>
```

**Change pattern:** replace `text-sm` with `text-base` on prose-style guidance copy. Keep all other classes (`text-slate-600`, spacing, `leading-relaxed`, etc.) unchanged.

## Scope: include

These are the same UI role — subtitles under headings, empty-state guidance, or page intros — not dense UI chrome.

### Workspace dashboard (home)

| File | What to update |
|------|----------------|
| [`components/workspace/workspace-dashboard-panel.tsx`](components/workspace/workspace-dashboard-panel.tsx) | Pro onboarding banner body (line 57), both empty states (lines 68, 86) |
| [`components/dashboard/dashboard-add-project-header.tsx`](components/dashboard/dashboard-add-project-header.tsx) | “Track and update checklist progress…” subtitle (mirror of professional header) |
| [`components/dashboard/add-project-panel.tsx`](components/dashboard/add-project-panel.tsx) | “No projects yet…” empty state only |
| [`components/dashboard/add-opposite-role-prompt.tsx`](components/dashboard/add-opposite-role-prompt.tsx) | Prompt body paragraph |

### Idea Arena

| File | What to update |
|------|----------------|
| [`app/idea-arena/page.tsx`](app/idea-arena/page.tsx) | Three empty/filter messages (lines 99, 107, 120) |
| [`components/idea-arena/project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx) | Join-team helper lines (lines 279, 286) — same guidance tone as dashboard empty states |

### Workspace tab intros

| File | What to update |
|------|----------------|
| [`components/workspace/workspace-shell.tsx`](components/workspace/workspace-shell.tsx) | Arena Card Details intro (line 476) |
| [`components/workspace/project-get-started-panel.tsx`](components/workspace/project-get-started-panel.tsx) | Panel subtitle under “Get Started” + step intro body under each step title |
| [`components/workspace/project-journey-panel.tsx`](components/workspace/project-journey-panel.tsx) | Panel intro under “VenShares project journey” (line 507) |
| [`components/workspace/project-roadmap-panel.tsx`](components/workspace/project-roadmap-panel.tsx) | Panel intro under “Project roadmap” (line 355) |
| [`components/workspace/workspace-progress-panel.tsx`](components/workspace/workspace-progress-panel.tsx) | Dashed empty state (“doesn’t list team skills yet”) |
| [`components/workspace/workspace-files-panel.tsx`](components/workspace/workspace-files-panel.tsx) | `emptyMessage` paragraph only |
| [`components/workspace/workspace-messages-panel.tsx`](components/workspace/workspace-messages-panel.tsx) | “No messages yet.” empty state only |

### Profile & onboarding pages

| File | What to update |
|------|----------------|
| [`app/dashboard/profile/page.tsx`](app/dashboard/profile/page.tsx) | Intro under “Edit profile skills” |
| [`app/onboarding/professional/page.tsx`](app/onboarding/professional/page.tsx) | Intro under “Personalize your profile” |
| [`app/auth/complete-role/page.tsx`](app/auth/complete-role/page.tsx) | Intro under “Finish setting up your account” |
| [`components/profile/professional-skills-profile-panel.tsx`](components/profile/professional-skills-profile-panel.tsx) | Loading, role-guard, and onboarding-incomplete guidance paragraphs |

## Scope: exclude (intentionally leave `text-sm`)

- **Footers** — [`app/idea-arena/page.tsx`](app/idea-arena/page.tsx), [`components/workspace/workspace-page-chrome.tsx`](components/workspace/workspace-page-chrome.tsx)
- **Admin** — templates admin pages/editors
- **Form controls** — inputs, selects, textarea content in add/edit project forms
- **Loading / preview states** — file preview dialogs, “Loading preview…”
- **Message thread previews** — truncated message body in messages panel (line 424)
- **Expanded journey item descriptions** — inline content inside accordion rows (line 282 in journey panel)
- **Stat/metadata lines** — “X / Y items complete”, timestamps, pill labels, nav links, buttons, error alerts
- **Listed project descriptions** — user-authored content in project lists (not UI chrome)

## Implementation approach

Mechanical find-and-replace per file: change only the `text-sm` class on the targeted elements to `text-base`. No shared CSS utility or component extraction — the codebase already uses inline Tailwind on these elements.

Example for the triggering empty state:

```tsx
// before
<p className="text-slate-600 text-sm mb-10">

// after
<p className="text-slate-600 text-base mb-10">
```

For elements that combine size on a parent (e.g. dashed empty box with `text-center text-sm text-slate-600`), change to `text-center text-base text-slate-600`.

## Verification

After edits, spot-check in browser:

1. **Workspace → Professional tab** — empty state and onboarding banner match header subtitle size
2. **Workspace → Inventor tab** — “My projects” subtitle and empty state match
3. **Idea Arena** — empty/filter messages readable at new size
4. **Workspace tabs** — Get Started, Journey, Roadmap, Settings, Files, Messages intros/empty states
5. **Profile / onboarding / complete-role** — page intros under h1 headings

No build or migration changes required — Tailwind class-only updates across ~17 files.
