---
name: Project image and skills
overview: "Optional representative image (Supabase Storage), expanded shared skill presets for inventors (grouped picker), optional custom skills (name + short description) for display, while join-gate matching stays on preset `required_job_categories` only."
todos:
  - id: migration-image-custom
    content: "Migration: representative_image_path; storage bucket; project_custom_skills table"
  - id: catalog-shared
    content: "Expand shared allowlist in lib; normalize helpers (higher cap for inventors); sync professional onboarding options"
  - id: server-actions-full
    content: "createProject + update actions: image upload, presets + custom skills; list queries embed custom rows"
  - id: dashboard-ui-skills
    content: "AddProjectForm + per-project edit: grouped category UI, Add custom skill, caps/validation copy"
  - id: arena-display
    content: "Project card/detail: Supabase image URL; Team needed = preset chips + custom skill cards"
  - id: phase2-admin-skill-approval
    content: "Deferred: approval_status + admin queue; filter custom skills for professionals; optional catalog promotion"
    status: pending
isProject: false
---

# Project image, expanded skill categories, and custom skills

## Relationship to existing join gate

[`lib/skills-match.ts`](lib/skills-match.ts) and [`join_team_skills_gate_8eb72e37.plan.md`](join_team_skills_gate_8eb72e37.plan.md) use **`required_job_categories`** on `projects` and **exact string overlap** with Clerk `professionalJobCategories`. That stays the source of truth for **who can join**.

**Custom skills** (inventor-defined name + description) are **for communication in Idea Arena only**; they do **not** participate in automatic overlap checks unless you later add fuzzy matching or professional-entered tags (out of scope).

**Rule:** Keep requiring **at least one preset** category on the project so professionals can still be gated meaningfully. Custom rows are additive context (“we also need someone who can …”).

### Phase 1 vs phase 2 (admin approval)

- **Phase 1:** Custom skills save with the project and appear in Idea Arena to **everyone who can view the project** (same visibility as title/description), with no moderation queue.
- **Phase 2 (deferred):** Route **created** skills through **admin approval** before they are shown to **incoming professionals** (or before they can be promoted into a shared catalog for onboarding—product choice). Implementation sketch: add `approval_status` (e.g. `pending` | `approved` | `rejected`) on `project_custom_skills` (or a separate `skill_suggestions` table keyed by inventor submission); an **admin** surface (role-gated, e.g. Clerk admin flag or allowlist) lists pending items; on **approve**, either flip the row to visible-to-professionals or copy the label into a curated `VEN_SKILL_PRESET_OPTIONS` append list. Arena queries for **professional** viewers filter to `approved` only; inventors always see their own pending + approved copy. Email or in-app notification to inventor on decision is optional.

## 1. Shared skill catalog (lots of categories)

- Introduce a **single canonical list** of preset labels used everywhere matching matters. Prefer one module, e.g. extend [`lib/professional-onboarding.ts`](lib/professional-onboarding.ts) or add [`lib/ven-skill-presets.ts`](lib/ven-skill-presets.ts) that exports:
  - `VEN_SKILL_PRESET_OPTIONS` — flat array of **many** distinct strings (target roughly **25–40+**), covering legal, product, engineering disciplines, software, design, GTM, ops, manufacturing, regulatory, data, etc.
  - Optional **`VEN_SKILL_PRESET_GROUPS`**: `{ groupLabel: string; options: readonly string[] }[]` for dashboard UI only (labels are not stored; only the option strings are persisted).

- **Professionals:** Update [`components/onboarding/professional-onboarding-form.tsx`](components/onboarding/professional-onboarding-form.tsx) to render options from this catalog (still enforce a **reasonable max**, e.g. 5, so profiles stay focused). [`normalizeProfessionalJobCategories`](lib/professional-onboarding.ts) should allowlist against `VEN_SKILL_PRESET_OPTIONS` (same strings).

- **Inventors:** [`createProject`](app/dashboard/projects/actions.ts) / [`updateProjectRequiredCategories`](app/dashboard/projects/actions.ts) should normalize against the **same** allowlist but allow a **higher max** for projects (e.g. **8–12** presets per project) — implement e.g. `normalizeProjectRequiredJobCategories(selected: string[])` that dedupes, allowlists, and caps at the inventor limit.

- **Types:** `ProfessionalJobCategory` can become an alias of the preset string union type, or you keep one exported type derived from `VEN_SKILL_PRESET_OPTIONS` so [`skills-match.ts`](lib/skills-match.ts) stays type-safe.

## 2. Custom “create a new skill”

- **Table** `project_custom_skills`: `id`, `project_id` → `projects(id)` ON DELETE CASCADE, `skill_name` text NOT NULL, `skill_description` text NOT NULL (short, max length enforced in app), `sort_order` int, `created_at`. RLS: none (service role only), consistent with `projects`.

- **Server:** On create/update project, parse repeated custom rows from `FormData` (e.g. `custom_skill_name[]` / `custom_skill_description[]`). Replace strategy on update: delete existing custom rows for `project_id`, then insert new set (same pattern as a normalized child table).

- **Validation:** Trim fields; drop rows where both empty; require name if description only; cap count (e.g. **5–8** custom rows). Presets and custom are independent except **presets** must still satisfy “at least one” for join readiness.

## 3. Representative image (unchanged from prior design)

- `projects.representative_image_path` (nullable), Supabase bucket `project-images` (public read, uploads via service role).
- Server action: insert project → upload → update path; on upload failure after insert, delete orphan row.
- [`components/idea-arena/utils.ts`](components/idea-arena/utils.ts): public URL if path set, else Picsum fallback.
- [`next.config.ts`](next.config.ts): `remotePatterns` for `*.supabase.co` storage public URLs.

## 4. Dashboard UI

- [`components/dashboard/add-project-form.tsx`](components/dashboard/add-project-form.tsx): wire **categories** (currently expected by actions but not in UI per join plan) as a **grouped** control: accordion or fieldsets by `VEN_SKILL_PRESET_GROUPS`, checkboxes with `name="categories"` and `value={optionString}`.
- **“Create a new skill”** button: append a client-side row (name + description inputs) with stable indexed names for FormData; allow remove.
- Per-project edit (wherever `updateProjectRequiredCategories` is or will be): same grouped presets + custom list, prefilled from `listProjectsForCurrentUser` (extend select to include `project_custom_skills`).

## 5. Idea Arena display

- Extend [`ArenaProject`](lib/projects-arena.ts) (and selects) with `representative_image_path`, `required_job_categories`, and `custom_skills: { skill_name; skill_description }[]`.
- [`project-detail-view.tsx`](components/idea-arena/project-detail-view.tsx): **Team still needed** shows preset labels (chips) plus custom skills (title + short description). Join-gate messaging from [`join_team_skills_gate`](join_team_skills_gate_8eb72e37.plan.md) stays based on presets only.
- **Phase 2:** When approval exists, pass `venRole` (or server-computed flags) into the detail view so **professionals** only see approved custom skills; inventors see full list including pending.

## 6. Migration ordering

- One new migration (e.g. `005_...`) after existing `required_job_categories` migration: add `representative_image_path`, create `project_custom_skills`, storage bucket + public read policy. Align [`002_projects_dev_reset.sql`](supabase/migrations/002_projects_dev_reset.sql) if it recreates `projects` so new columns exist after reset.

## Summary

| Concern | Mechanism |
|--------|-----------|
| Many preset categories | Expanded shared list + grouped inventor UI; professionals use same strings (smaller max) |
| Create new skill | `project_custom_skills`; display-only for matching |
| Phase 2 | Admin approval before custom skills surface to professionals (optional promotion into shared presets) |
| Join team | Unchanged: overlap on `required_job_categories` presets only |
| Cover image | Storage path on `projects` + public URL in arena |
