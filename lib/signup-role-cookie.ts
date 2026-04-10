/** Short-lived httpOnly cookie set by middleware on role-specific sign-up URLs. */
export const SIGNUP_ROLE_COOKIE = "vs_signup_role" as const;

export const SIGNUP_ROLE_COOKIE_MAX_AGE_SEC = 15 * 60;
