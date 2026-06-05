import { redirect } from "next/navigation";

type DashboardPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const sp = await searchParams;
  const tab = sp.tab;
  if (tab === "inventor" || tab === "professional") {
    redirect(`/workspace?tab=${tab}`);
  }
  redirect("/workspace");
}
