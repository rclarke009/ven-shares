#!/usr/bin/env node
/**
 * One-time bootstrap: set publicMetadata.isSiteAdmin for designated emails.
 * Requires CLERK_SECRET_KEY in env. Preserves existing public_metadata fields.
 */
const ADMIN_EMAILS = ["rclarke009@gmail.com", "jbird357@icloud.com"];

const secret = process.env.CLERK_SECRET_KEY;
if (!secret) {
  console.error("CLERK_SECRET_KEY is required.");
  process.exit(1);
}

async function clerkFetch(path, init = {}) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return body;
}

async function findUserByEmail(email) {
  const data = await clerkFetch(
    `/users?email_address=${encodeURIComponent(email)}&limit=1`,
  );
  const users = data?.data ?? data;
  if (Array.isArray(users) && users.length > 0) return users[0];
  return null;
}

async function grantAdmin(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    console.warn(`SKIP: no Clerk user for ${email} — sign up first, then re-run.`);
    return false;
  }
  const existing = user.public_metadata ?? {};
  if (existing.isSiteAdmin === true) {
    console.log(`OK: ${email} already site admin (${user.id})`);
    return true;
  }
  const updated = await clerkFetch(`/users/${user.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      public_metadata: { ...existing, isSiteAdmin: true },
    }),
  });
  console.log(`OK: granted site admin to ${email} (${updated.id})`);
  return true;
}

async function main() {
  let ok = 0;
  for (const email of ADMIN_EMAILS) {
    if (await grantAdmin(email)) ok += 1;
  }
  console.log(`Done: ${ok}/${ADMIN_EMAILS.length} processed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
