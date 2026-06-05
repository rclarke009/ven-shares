---
name: Rename dashboard heading
overview: Change the inventor dashboard page heading from "Your progress" to "My projects" in the existing header component.
todos:
  - id: update-heading
    content: Change h1 in dashboard-add-project-header.tsx from "Your progress" to "My projects"
    status: completed
isProject: false
---

# Rename dashboard heading to "My projects"

## Context

The inventor dashboard header lives in [`components/dashboard/dashboard-add-project-header.tsx`](components/dashboard/dashboard-add-project-header.tsx). When the dashboard was refactored into a progress hub, the title was changed from the older **"Your projects"** (still present in unused [`components/dashboard/add-project-panel.tsx`](components/dashboard/add-project-panel.tsx)) to **"Your progress"**:

```18:21:components/dashboard/dashboard-add-project-header.tsx
          <h1 className="text-2xl font-semibold text-slate-900">Your progress</h1>
          <p className="text-slate-600 text-sm mt-1">
            Track and update checklist progress across your projects.
          </p>
```

This is the only user-facing "progress" page title on the dashboard. The professional tab already uses a separate heading ("Your teams") in [`components/dashboard/dashboard-professional-header.tsx`](components/dashboard/dashboard-professional-header.tsx).

## Change

**Single file:** [`components/dashboard/dashboard-add-project-header.tsx`](components/dashboard/dashboard-add-project-header.tsx)

- Update the `<h1>` text from `Your progress` to **`My projects`** (sentence case, matching the existing `Your teams` pattern but using "My" as requested).

**Subtitle:** Leave unchanged unless you want it updated later — it still accurately describes what the cards below do (checklist progress per project).

No other files need changes: internal component names like `DashboardProjectProgressStack` are implementation details, not user-visible labels.

## Verification

- Open `/dashboard` as an inventor (or `/dashboard?tab=inventor` if dual-role).
- Confirm the page header reads **My projects** and the Add new project button still works.
