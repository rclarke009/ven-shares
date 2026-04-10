# How to add a project

Use this to test **Add a project** and to document inventors’ steps (future user manual).

Only **inventor** accounts can create projects. Skilled professionals see a short note on the dashboard instead of the form.

## Prerequisites

1. **Inventor account:** Complete sign-up as an inventor (see [sign-up-procedures.md](sign-up-procedures.md)) or sign in with an existing inventor account.
2. **Environment:** `.env.local` must include:
   - Clerk keys (same as sign-up).
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (used elsewhere in the app).
   - **`SUPABASE_SERVICE_ROLE_KEY`** (server-only; required for saving projects). Never commit this key or expose it in the browser.
3. **Database:** The `projects` table (and related objects) must exist in Supabase. From the repo, apply migrations in order (for example run each file in the Supabase SQL editor):
   - [`../supabase/migrations/001_projects.sql`](../supabase/migrations/001_projects.sql) on a fresh database, **or**
   - If you previously had a broken `projects` table (e.g. missing `clerk_user_id` in dev), [`../supabase/migrations/002_projects_dev_reset.sql`](../supabase/migrations/002_projects_dev_reset.sql) drops and recreates `projects` (and related dev-only shapes; destroys existing rows in that table).
   - [`../supabase/migrations/004_projects_required_categories.sql`](../supabase/migrations/004_projects_required_categories.sql) adds **`required_job_categories`** on `projects` (needed for **Join Team** matching in the Idea Arena).
   - [`../supabase/migrations/005_project_image_and_required_skills.sql`](../supabase/migrations/005_project_image_and_required_skills.sql) adds **`representative_image_path`**, the **`project_required_skills`** table, and the public Storage bucket **`project-images`** (cover uploads).
   - To test **Join Team**, also apply [`../supabase/migrations/003_project_members.sql`](../supabase/migrations/003_project_members.sql). See [how-to-join-a-project-team.md](how-to-join-a-project-team.md).

## Steps (create a project)

1. Open the app and sign in (for example via **Login** on the home page).
2. Go to **`/dashboard`** (or land there after sign-up).
3. Confirm **Account type** shows **Inventor**.
4. In **Add a project**, enter a **Title** (required).
5. Optionally enter a **Description**.
6. Under **Team skills needed**, select **at least one** job category (up to five). These are the same labels professionals pick during onboarding; at least one overlap is required before a professional can **Join Team** on this project.
7. Optionally choose a **Representative image** (JPEG, PNG, or WebP, up to 5 MB). It appears on the project card and detail page in the Idea Arena instead of a placeholder.
8. Optionally use **Add skill** to list **required skills** with a **short description** each (free text, up to ten rows). These are shown on the project detail page in addition to the category chips; they do **not** replace category matching for join.
9. Click **Save project**.
10. **Verify:** You should see **Project saved.** and the new project under **Your projects** with title, optional description, category tags, date, and an **Edit project** section.

If something fails, check the browser and server logs; common issues are missing `SUPABASE_SERVICE_ROLE_KEY`, migrations not applied (especially **005** if image upload or skills fail), or not signed in as an inventor.

## Steps (edit an existing project)

1. On **`/dashboard`**, under **Your projects**, expand **Edit project** for a row.
2. Update title, description, optional new **Representative image** (uploading replaces the previous file in Storage), categories, and required skill rows, then click **Save project**.

## Notes

- **Professionals:** Accounts with **Skilled professional** do not get the add-project form; adding projects is for inventors only. Professionals browse projects in the Idea Arena and may **join a team** on a project detail page (see [how-to-join-a-project-team.md](how-to-join-a-project-team.md)).
- **Data:** Each project is stored with your Clerk user id and appears only in your list on the dashboard (server-side reads filtered by user). **`project_required_skills`** rows are tied to the project and removed if the project is deleted (cascade).
- **Images:** The app stores only the **object path** inside the bucket (for example `{project_id}/cover.jpg`). The public URL is built with **`NEXT_PUBLIC_SUPABASE_URL`**; no extra env vars are required beyond what you already use for Supabase. Uploads use the **service role** on the server; the bucket is **public read** so Idea Arena can show images with `next/image`.
- **Join Team:** If no categories are selected, professionals see a message that the project is not ready for joining until the inventor adds team skills from the dashboard (see [how-to-join-a-project-team.md](how-to-join-a-project-team.md)).
