export function workspaceHrefForArenaMember(
  projectId: string,
  relation: "owner" | "team",
): string {
  const tab = relation === "owner" ? "get-started" : "organizer";
  return `/workspace/${projectId}?tab=${tab}`;
}
