import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

function displayNameFromClerkUser(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  if (user.username) return user.username;
  return "Team member";
}

export async function resolveClerkDisplayNames(
  userIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const client = await clerkClient();
  const map = new Map<string, string>();

  await Promise.all(
    unique.map(async (id) => {
      try {
        const user = await client.users.getUser(id);
        map.set(id, displayNameFromClerkUser(user));
      } catch {
        console.log("MYDEBUG →", "clerk getUser failed", id);
        map.set(id, "Unknown user");
      }
    }),
  );

  return map;
}
