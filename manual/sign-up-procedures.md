# Sign-up procedures: Inventor vs Professional

Use these steps to verify sign-up and to onboard users later (this doubles as the basis for the user manual).

Each path sets Clerk `publicMetadata.venRole` to `inventor` or `professional` after account creation.

## Prerequisites

1. **Environment:** `.env.local` includes valid Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and any other variables your project requires).
2. **Clerk Dashboard:** Allowlist your app URLs (including `http://localhost:3000` for local dev) and include **`/auth/complete-signup`** in allowed redirect paths so post–sign-up redirects succeed.
3. **Run the app:** From the project root, start the dev server (for example `npm run dev`) and open the site in a browser (typically `http://localhost:3000`).

## Create an Inventor user

1. Open the home page (`/`).
2. Use any path that targets **inventor** sign-up, for example:
   - Hero: **Get Started as Inventor**, or  
   - **For Inventors** section: **Join as Inventor**, or  
   - **Sign up as Inventor** from the hub at `/auth/signup` (if you use it), or  
   - Navigate directly to **`/auth/signup/inventor`**.
3. Complete the Clerk sign-up form (email, password, OAuth, or whatever your Clerk instance allows).
4. After a successful sign-up, the app should redirect you through **`/auth/complete-signup`** and then to **`/dashboard`**.
5. **Verify:** On `/dashboard`, the line **Account type** should show **Inventor** (or equivalent wording for `venRole === inventor`).

Optional: In the Clerk Dashboard, open the user and confirm **`publicMetadata.venRole`** is **`inventor`**.

## Create a Professional user

Use a **separate** test email (or a new browser profile / incognito window) so you are not reusing an account that already has `venRole` set.

1. Open the home page (`/`).
2. Use any path that targets **professional** sign-up, for example:
   - Hero: **Join as Professional**, or  
   - **For Skilled Professionals** section: **Join VenShares!**, or  
   - **Sign up as Professional** from the hub at `/auth/signup`, or  
   - Navigate directly to **`/auth/signup/professional`**.
3. Complete the Clerk sign-up form.
4. After success, you should be redirected through **`/auth/complete-signup`** to **`/onboarding/professional`** (not the dashboard until onboarding is done).
5. On **Personalize your profile**, choose up to five **Job categories**, select **Hours per week**, and click **Continue to dashboard**.
6. **Verify:** You land on **`/dashboard`** with **Account type** showing **Skilled professional** (or equivalent for `venRole === professional`). Until onboarding is complete, middleware sends professionals back to **`/onboarding/professional`** when they try to use the rest of the app.

Optional: In the Clerk Dashboard, confirm **`publicMetadata.venRole`** is **`professional`** and **`publicMetadata.professionalOnboardingComplete`** is **`true`** after you submit the onboarding form.

## After sign-up: Idea Arena and Join Team

Skilled professionals can open **`/idea-arena`** to browse inventor projects and use **Join Team** on a project detail page when their **job categories** overlap the project’s **team skills needed** categories. Testing steps and database requirements are in [how-to-join-a-project-team.md](how-to-join-a-project-team.md).

**Inventors** add projects from **`/dashboard`**, including optional **representative images** and optional **required skills** (name + short description) shown on the project detail page; see [how-to-add-a-project.md](how-to-add-a-project.md).

## Notes

- **Role is set from the sign-up URL:** Middleware sets a short-lived cookie when you visit `/auth/signup/inventor` or `/auth/signup/professional`. The completion route reads it once and writes `venRole`. If you start sign-up on one path and never complete it, or you use an old session, behavior may differ; use a fresh visit to the correct URL before signing up.
- **Generic login:** The nav **Login** button opens the Clerk sign-in modal. Signing in does **not** change `venRole`; it only applies to **new** sign-ups that complete the flow above.
- **If `venRole` is missing on the dashboard:** Confirm the redirect to `/auth/complete-signup` ran, Clerk allows that URL, and the user did not already have `venRole` set from a prior test (idempotent: existing `venRole` is not overwritten).
