---
name: UserButton onboarding links
overview: Yes—you can keep Clerk’s default account menu and add VenShares-specific entries (onboarding and profile) using Clerk’s built-in UserButton customization API, optionally driven by `publicMetadata` so only professionals see the right links.
todos:
  - id: ven-user-button
    content: Add client VenUserButton with UserButton.MenuItems + conditional Link(s) from publicMetadata
    status: completed
  - id: replace-headers
    content: Swap UserButton for VenUserButton in page.tsx, dashboard, profile headers
    status: completed
  - id: client-onboarding-helper
    content: Expose isProfessionalOnboardingComplete (or equivalent) for client if not already importable
    status: completed
isProject: false
---

# Keep Clerk user menu and add onboarding / profile

## Answer

**Yes.** Clerk’s [`UserButton`](https://clerk.com/docs/nextjs/guides/customizing-clerk/adding-items/user-button) is designed for this: you keep the avatar, default “Manage account,” and sign-out, and you **append (or reorder)** your own items inside `<UserButton.MenuItems>` using `<UserButton.Link />` (in-app routes like [`/onboarding/professional`](app/onboarding/professional/page.tsx) and [`/dashboard/profile`](app/dashboard/profile/page.tsx)) or `<UserButton.Action />` for custom behavior.

You do **not** need to replace Clerk’s menu with a fully custom dropdown unless you want total control over layout or to merge unrelated product nav into the same popover.

## How this fits your app today

- Headers use bare `<UserButton />` in [`app/page.tsx`](app/page.tsx), [`app/dashboard/page.tsx`](app/dashboard/page.tsx), and [`app/dashboard/profile/page.tsx`](app/dashboard/profile/page.tsx).
- Professional onboarding state lives in Clerk **`publicMetadata`** (see [`lib/professional-onboarding.ts`](lib/professional-onboarding.ts)); [`middleware.ts`](middleware.ts) already redirects incomplete professionals to `/onboarding/professional`.

So “management of onboarding” in the menu can mean:

1. **While incomplete** — a prominent link, e.g. “Complete your profile,” → `/onboarding/professional` (same as the middleware target).
2. **After complete** — a link, e.g. “Profile & skills” (or “Edit availability & categories”) → `/dashboard/profile` (or whatever route you use for ongoing edits).

Inventors should not see (1)/(2) unless you want a generic “Profile” link for everyone.

## Implementation sketch

- Add a small **client** wrapper (e.g. `components/ven-user-button.tsx`) that:
  - Uses Clerk’s `useUser()` to read `publicMetadata`.
  - Uses existing helpers [`getVenRoleFromPublicMetadata`](lib/ven-role.ts) and [`isProfessionalOnboardingComplete`](lib/professional-onboarding.ts) (import from client-safe modules—you already have [`lib/ven-role.client.ts`](lib/ven-role.client.ts); mirror or share onboarding completion check in a client-safe file if needed).
  - Renders:

```tsx
<UserButton>
  <UserButton.MenuItems>
    {/* conditional UserButton.Link rows for professionals */}
  </UserButton.MenuItems>
</UserButton>
```

- Replace `<UserButton />` with the wrapper in the three header locations above so behavior is consistent.

Optional polish (Clerk-supported): reorder default blocks (`UserButton.UserProfilePage`, sign-out) per docs if you want “Complete setup” above “Manage account.”

## Trade-offs (short)

| Approach | Pros | Cons |
|----------|------|------|
| **Extend `UserButton` (recommended)** | Official API, keeps Clerk account UX, minimal code | Menu styling still Clerk’s |
| **Custom dropdown + `useClerk().openUserProfile()`** | Full visual control | You reimplement menu, accessibility, and “manage account” entry points |
| **Custom `UserProfile` pages inside Clerk modal** | Onboarding feels “inside” Clerk | More Clerk wiring; your onboarding UI is currently full-page |

## Verification

- Sign in as **professional** with incomplete metadata: menu shows link to onboarding; clicking it hits `/onboarding/professional` (middleware already allows that path).
- Sign in as **professional** complete: menu shows profile/skills link; inventors do not see professional-only items (unless you add separate inventor links).

No database or middleware changes are required for the menu alone; only UI composition and optional client-side helpers for metadata checks.
