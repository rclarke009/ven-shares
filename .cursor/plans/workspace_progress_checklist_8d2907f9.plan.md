---
name: Workspace progress checklist
overview: "Implement the workspace **Progress** tab with a per–job-category checklist: a **standard template** (major → minor tasks) plus **team-added items**, collapsible sections, and **no checklist UI on the project detail page**. When **all checklist leaves** for a category are complete, persist that as today’s **`completed_job_categories`** so Idea Arena **project cards** keep showing “complete” without new list-query logic."
todos:
  - id: migration-jsonb
    content: Add projects.workspace_progress_checklist jsonb + document shape
    status: completed
  - id: lib-template-merge
    content: Add lib/workspace-progress-template.ts + merge/leaf-completion helpers + sync to completed_job_categories
    status: completed
  - id: workspace-actions
    content: "Server actions: toggle leaf, add custom item, revalidate paths"
    status: completed
  - id: workspace-ui
    content: workspace-progress-panel + wire WorkspaceShell Progress tab; pass data from workspace/page.tsx
    status: completed
  - id: detail-cleanup
    content: Remove CategoryCompletionControl from ProjectDetailView; optional shortcuts in Progress only
    status: completed
  - id: dashboard-intersect
    content: When required_job_categories changes, trim checklist JSON + completions
    status: completed
  - id: legacy-complete-seed
    content: Handle existing completed_job_categories + empty checklist without card regression
    status: completed
isProject: false
---

# Workspace Progress: standard + custom checklists → arena card

## Goals (from your iteration)

- **Standard checklist** per team “skill” (maps to existing [`ProfessionalJobCategory`](lib/professional-onboarding.ts) / `required_job_categories`), with **major → minor** hierarchy and **expand/collapse** in the UI.
- **Users can add** extra majors/minors (or flat custom rows—pick one shape and stick to it).
- **Checklist UI exists only inside** [`WorkspaceShell`](components/workspace/workspace-shell.tsx) **Progress** tab (replace the current “Coming soon” stub around lines 687–693).
- **Arena project card** “complete” for a slot should match **all items for that skill done**—reuse the existing card pipeline that reads [`category_statuses`](lib/projects-arena.ts) derived from `completed_job_categories` (see `mapArenaRow`, lines 115–127), so we **sync** checklist completion to that column rather than parsing checklist JSON on every arena list query.

## Data model

- Add a nullable `jsonb` column on `public.projects`, e.g. `workspace_progress_checklist`, default `'{}'::jsonb` (new migration under [`supabase/migrations/`](supabase/migrations/)).
- **Shape (conceptual)**: keyed by category string (exact `ProfessionalJobCategory` value). Each category holds ordered **major** nodes; each major has ordered **minor** (leaf) nodes. Every node needs: stable `id`, `title`, `standard | custom`, `completed` (only meaningful on **leaves**), `sort_order` (or infer order from array position).
- **Standard content** lives in code (e.g. [`lib/workspace-progress-template.ts`](lib/workspace-progress-template.ts))—one template list per enum value in `PROFESSIONAL_JOB_CATEGORY_OPTIONS`, with stable deterministic ids (e.g. prefixed `std:`) so toggles survive deploys.
- **Lazy merge on read**: when loading Progress data for a project, for each `required_job_categories` entry, if JSON is missing/incomplete for that category, **merge in** the standard tree (do not wipe existing custom rows). Persist merged result on first toggle/add to avoid repeated merge (optional optimization).

## Server actions and auth

- Extend or colocate with existing workspace actions in [`app/idea-arena/[projectId]/workspace/actions.ts`](app/idea-arena/[projectId]/workspace/actions.ts):
  - `toggleProgressLeaf(projectId, category, leafId, completed)`
  - `addProgressItem(...)` (custom major or minor under a major)
  - Optional: `deleteProgressItem(...)` for custom-only nodes- Reuse [`getWorkspaceAccessFlags`](lib/workspace-access.ts) / same rule as [`setJobCategoryCompleted`](app/idea-arena/[projectId]/category-actions.ts): **owner or team member** can update.
- After each mutation: recompute **per category** whether **every leaf** (standard + custom) is `completed`. If yes → ensure category is in `completed_job_categories` (ordered per `required_job_categories`); if no → remove it. Call existing normalization patterns from [`category-actions.ts`](app/idea-arena/[projectId]/category-actions.ts) / dashboard filter logic. Then `revalidatePath` `/idea-arena` and `/idea-arena/[projectId]` (and workspace path if needed).

## Workspace UI

- New client component e.g. [`components/workspace/workspace-progress-panel.tsx`](components/workspace/workspace-progress-panel.tsx) used inside `WorkspaceShell` when `tab === "progress"`.
- Props: `projectId`, `categories` (from server: required list + `category_statuses` or coverage summary if you want badges), initial checklist JSON, `canManage`.
- **Accordion behavior**: skill (category) → majors → minors; independent open/closed state (React `useState` per section or one `Set` of expanded ids).
- **Leaf** = checkbox; **Mark complete / Reopen** at category level can be **removed** in favor of automation, or kept as a **shortcut** (“Mark all done” / “Clear all”)—recommend **shortcut only** to avoid duplicating two sources of truth.
- Move [`CategoryCompletionControl`](components/idea-arena/category-completion-control.tsx) usage from [`ProjectDetailView`](components/idea-arena/project-detail-view.tsx) (lines 174–179) **into this panel** only, **or** delete the control and replace with checkbox-driven sync (preferred single source: leaves only + optional shortcuts).

## Project detail / arena

- [`app/idea-arena/[projectId]/workspace/page.tsx`](app/idea-arena/[projectId]/workspace/page.tsx): load checklist column + arena category data (reuse `getProjectByIdForArena` or a slimmer query + `getArenaTeamDisplay` if you need coverage). Pass into `WorkspaceShell` as new props.
- [`ProjectDetailView`](components/idea-arena/project-detail-view.tsx): remove per-row completion controls; keep **Needed / In progress / Complete** badges driven by existing `category_statuses` (still accurate once checklist syncs `completed_job_categories`).
- [`ProjectCard`](components/idea-arena/project-card.tsx): **no change** if `category_statuses` remains the source of “complete” via sync.

## Edge cases

- **Required categories change** (dashboard edit): intersect checklist JSON keys and `completed_job_categories` with new required set (mirror [`updateProjectWithMediaAndSkills`](app/dashboard/projects/actions.ts) behavior for completions).
- **Empty required categories**: Progress tab shows empty state.
- **Legacy projects** with manual `completed_job_categories` but empty checklist: on first open, merged standard tree is all unchecked—either accept that **card stays complete until someone edits** (stale) or run a one-time “if completed but no leaves, seed leaves as completed” rule; call out in implementation (recommend **seed leaves completed** when category already in `completed_job_categories` to avoid regressing cards).

## Testing (manual)

- Workspace: expand/collapse, toggle leaves, add custom item, verify DB JSON and `completed_job_categories` update.
- Arena: card slot turns complete only when all leaves done; uncheck one leaf → slot no longer complete.
- Access: non-member cannot open workspace (existing); member can edit.
