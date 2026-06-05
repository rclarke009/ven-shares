import { redirect } from "next/navigation";

import { isProjectUuid } from "@/lib/projects-arena";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    tab?: string;
    m?: string;
    board?: string;
    file?: string;
  }>;
};

export default async function LegacyWorkspaceRedirect({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const sp = await searchParams;

  if (!isProjectUuid(projectId)) {
    redirect("/workspace");
  }

  const qs = new URLSearchParams();
  if (sp.tab) qs.set("tab", sp.tab);
  if (sp.m) qs.set("m", sp.m);
  if (sp.board) qs.set("board", sp.board);
  if (sp.file) qs.set("file", sp.file);

  const query = qs.toString();
  redirect(query ? `/workspace/${projectId}?${query}` : `/workspace/${projectId}`);
}
