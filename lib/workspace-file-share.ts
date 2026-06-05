export function buildWorkspaceFileShareInvite(opts: {
  origin: string;
  projectId: string;
  projectTitle: string;
  fileId: string;
  filename: string;
  description?: string | null;
  jobCategory?: string | null;
}): { shareUrl: string; mailtoHref: string } {
  const {
    origin,
    projectId,
    projectTitle,
    fileId,
    filename,
    description,
    jobCategory,
  } = opts;
  const base = origin.replace(/\/$/, "");
  const params = new URLSearchParams({ tab: "organizer", file: fileId });
  const shareUrl = `${base}/workspace/${projectId}?${params.toString()}`;

  const subject = `VenShares — file on “${projectTitle}”: ${filename}`;
  const bodyLines = [
    `Hi,`,
    ``,
    `I'm sharing a file from “${projectTitle}” on VenShares:`,
    ``,
    `File: ${filename}`,
  ];
  if (description?.trim()) {
    bodyLines.push(`Description: ${description.trim()}`);
  }
  if (jobCategory) {
    bodyLines.push(`Skill area: ${jobCategory}`);
  }
  bodyLines.push(
    ``,
    `View it in the project workspace:`,
    shareUrl,
    ``,
    `You'll need a VenShares account with access to this project.`,
  );

  const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

  return { shareUrl, mailtoHref };
}
