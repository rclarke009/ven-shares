import "server-only";

/**
 * Optional Clerk helpers — wire ClerkProvider in your root layout when ready.
 * @see https://clerk.com/docs/quickstarts/nextjs
 */
export { auth, clerkClient, clerkMiddleware } from "@clerk/nextjs/server";
