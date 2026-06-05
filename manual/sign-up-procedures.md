# Sign-up procedures: Inventor vs Professional

Use these steps to verify sign-up and to onboard users later (this doubles as the basis for the user manual).

Each path sets Clerk `publicMetadata.venRoles` (array) after account creation. Legacy accounts may still have a single `venRole` string until their next profile update (lazy migration).

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
5. **Verify:** On `/dashboard`, you see the inventor view (Add new project). Clerk **`publicMetadata.venRoles`** should include **`inventor`**.

Optional: Legacy users may still show **`publicMetadata.venRole`** = **`inventor`** until their metadata is updated.

## Create a Professional user

Use a **separate** test email (or a new browser profile / incognito window) so you are not reusing an account that already has roles set.

1. Open the home page (`/`).
2. Use any path that targets **professional** sign-up, for example:
   - Hero: **Join as Professional**, or  
   - **For Skilled Professionals** section: **Join VenShares!**, or  
   - **Sign up as Professional** from the hub at `/auth/signup`, or  
   - Navigate directly to **`/auth/signup/professional`**.
3. Complete the Clerk sign-up form.
4. After success, you should be redirected through **`/auth/complete-signup`** to **`/onboarding/professional`** (not the dashboard until onboarding is done).
5. On **Personalize your profile**, choose up to five **Job categories**, select **Hours per week**, and click **Continue to dashboard**.
6. **Verify:** You land on **`/dashboard?tab=professional`** with the professional view. Until onboarding is complete, middleware sends **professional-only** users back to **`/onboarding/professional`** when they try to use the rest of the app.

Optional: In the Clerk Dashboard, confirm **`publicMetadata.venRoles`** includes **`professional`** and **`publicMetadata.professionalOnboardingComplete`** is **`true`** after you submit the onboarding form.

## Dual-role account (inventor + professional)

1. At **`/auth/complete-role`** (if prompted), choose **Both inventor and professional**, or sign up as one role and add the second later from the dashboard **Add … profile** card (also available in the account avatar menu, and on professional onboarding for adding inventor).
2. Complete professional onboarding if the professional role was added.
3. **Verify:** On **`/dashboard`**, **Inventor** and **Professional** tabs appear. Switch tabs with **`?tab=inventor`** and **`?tab=professional`**.
4. **Inventor tab:** create and manage your own projects.
5. **Professional tab:** browse joined teams; use Idea Arena to join **other** inventors’ projects (you cannot join your own project).

If professional onboarding is incomplete but you also have the inventor role, the inventor tab remains available; the professional tab shows a link to finish onboarding.

## After sign-up: Idea Arena and Join Team

Skilled professionals can open **`/idea-arena`** to browse inventor projects and use **Join Team** on a project detail page when their **job categories** overlap the project’s **team skills needed** categories. Testing steps and database requirements are in [how-to-join-a-project-team.md](how-to-join-a-project-team.md).

**Inventors** add projects from **`/dashboard`** (Inventor tab if dual-role), including optional **representative images** and optional **required skills** (name + short description) shown on the project detail page; see [how-to-add-a-project.md](how-to-add-a-project.md).

## Notes

- **Role is set from the sign-up URL:** Middleware sets a short-lived cookie when you visit `/auth/signup/inventor` or `/auth/signup/professional`. The completion route **appends** the role to `venRoles` if missing. Signed-in users who visit those URLs are sent to **`/auth/add-role/{role}`** instead of Clerk sign-up again.
- **Generic login:** The nav **Login** button opens the Clerk sign-in modal. Signing in does **not** change roles; new roles come from sign-up completion, complete-role, or add-role flows.
- **If roles are missing on the dashboard:** Confirm the redirect to `/auth/complete-signup` ran, Clerk allows that URL, and complete **`/auth/complete-role`** if middleware sends you there.
- **Legacy `venRole`:** Existing test users with only `venRole` continue to work via a read shim until any metadata write migrates them to `venRoles`.
