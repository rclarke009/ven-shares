export function buildSkillRecommendInvite(opts: {
  origin: string;
  projectId: string;
  projectTitle: string;
  skillCategory: string;
}): { inviteUrl: string; mailtoHref: string } {
  const { origin, projectId, projectTitle, skillCategory } = opts;
  const base = origin.replace(/\/$/, "");
  const inviteUrl = `${base}/idea-arena/${projectId}`;

  const subject = `VenShares — ${skillCategory} needed on “${projectTitle}”`;
  const body = [
    `Hi,`,
    ``,
    `I'm working on “${projectTitle}” on VenShares and we need help with ${skillCategory}.`,
    ``,
    `If you're interested (or know someone who would be a good fit), you can view the project and join the team here:`,
    inviteUrl,
    ``,
    `VenShares connects inventors with skilled professionals. You'll need a professional account to join.`,
  ].join("\n");

  const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { inviteUrl, mailtoHref };
}
