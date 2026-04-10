# How to join a project team (Idea Arena)

Use this to test **Join Team** on a project detail page and to document skilled professionals’ steps (future user manual).

Only **skilled professional** accounts that have **finished professional onboarding** can join a team. Inventors and other roles see explanatory copy instead of a join action.

## Prerequisites

1. **Professional account:** Complete sign-up as a professional and finish **Personalize your profile** at `/onboarding/professional` (job categories and hours per week). See [sign-up-procedures.md](sign-up-procedures.md).
2. **At least one project:** An inventor must have created a project so it appears in the Idea Arena (see [how-to-add-a-project.md](how-to-add-a-project.md)).
3. **Environment:** `.env.local` must include the same Supabase variables as for projects:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **`SUPABASE_SERVICE_ROLE_KEY`** (server-only; required for reading projects and writing memberships). Never commit this key or expose it in the browser.
4. **Database:** Apply migrations so the needed tables and columns exist (for example run the SQL in the Supabase SQL editor in order):
   - [`../supabase/migrations/001_projects.sql`](../supabase/migrations/001_projects.sql) (or the dev reset in [../supabase/migrations/002_projects_dev_reset.sql](../supabase/migrations/002_projects_dev_reset.sql) if you use that in dev),
   - [`../supabase/migrations/004_projects_required_categories.sql`](../supabase/migrations/004_projects_required_categories.sql) so projects have **`required_job_categories`** (the join gate compares these to the professional’s job categories),
   - [`../supabase/migrations/005_project_image_and_required_skills.sql`](../supabase/migrations/005_project_image_and_required_skills.sql) if you want cover images and inventor-written **required skills** to appear in the arena (optional for join logic, but needed for full UI parity),
   - [`../supabase/migrations/003_project_members.sql`](../supabase/migrations/003_project_members.sql) for the `project_members` table used by Join Team.

## Steps (professional)

1. Sign in as a **skilled professional** (separate account from the inventor who owns the test project).
2. Open **`/idea-arena`** (for example from the home page nav when signed in, or go to the URL directly).
3. Open a project (card or link) so you are on **`/idea-arena/<project-id>`**.
4. Click **Join Team**.
5. **Verify:** The page should show **You’re on this team.** (after a short refresh). Reloading the page should keep that state.

## Steps (inventor — negative check)

1. Sign in as an **inventor**.
2. Open **`/idea-arena`** and any project detail page.
3. **Verify:** You should see **Team join is for skilled professionals.** and no working Join Team button for inventors.

## What you see on a project (Idea Arena)

- **Cover image:** If the inventor uploaded a **representative image**, the project card and detail page use it; otherwise a deterministic placeholder image is shown.
- **Team skills needed:** The detail page lists **job category** chips from **`required_job_categories`** (same vocabulary as professional onboarding). Join eligibility is based only on **overlap between those categories and your profile categories**, not on the optional free-text skills below.
- **Required skills (detail):** If the inventor added rows under **Required skills** on the dashboard, each appears as a **name** and **short description** under the category section. They are for context only; they do not change the automatic match check.

## Notes

- **Inventor must set categories:** If **`required_job_categories`** is empty, **Join Team** is not offered to professionals; they see copy explaining that the inventor needs to add team skills from the dashboard ([how-to-add-a-project.md](how-to-add-a-project.md)).
- **No overlap:** If your job categories do not match any of the project’s categories, you see an explanatory message instead of **Join Team** (you can update your profile categories or pick another project).
- **Duplicate join:** Submitting again (for example via a stale tab) should show an error such as **You’re already on this team.** (unique membership per user per project).
- **Data:** Memberships are stored in Supabase `project_members` (`project_id`, `clerk_user_id`). The app uses the service role on the server only; row level security is enabled with no public policies, same pattern as `projects`.
- **Own project:** The server rejects joining if your Clerk user id matches the project owner’s id (normally only relevant if roles or data were mixed in testing).
