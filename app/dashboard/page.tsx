import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { VenUserButton } from "@/components/ven-user-button";
import { AddProjectForm } from "@/components/dashboard/add-project-form";
import { EditProjectForm } from "@/components/dashboard/edit-project-form";
import { listProjectsForCurrentUser } from "@/app/dashboard/projects/actions";
import { getVenRoleForCurrentUser } from "@/lib/ven-role.server";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const venRole = await getVenRoleForCurrentUser();
  const projects =
    venRole === "inventor" ? await listProjectsForCurrentUser() : [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <Link href="/" className="text-2xl font-bold">
            Ven<span className="text-[#22c55e]">Shares</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/idea-arena"
              className="text-sm font-medium text-slate-700 hover:text-[#22c55e]"
            >
              Idea Arena
            </Link>
            <VenUserButton />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600 mb-6">
          Account type:{" "}
          <span className="font-medium text-slate-900">
            {venRole === "professional"
              ? "Skilled professional"
              : venRole === "inventor"
                ? "Inventor"
                : "Not set (complete sign-up or sign in again)"}
          </span>
        </p>

        {venRole === "professional" ? (
          <div className="mb-8 space-y-3">
            <p className="text-slate-600 text-sm">
              Adding projects is available to inventor accounts.
            </p>
            <p>
              <Link
                href="/dashboard/profile"
                className="text-sm font-medium text-[#22c55e] hover:underline"
              >
                Edit profile skills
              </Link>
            </p>
          </div>
        ) : null}

        {venRole === "inventor" ? (
          <div className="space-y-8 mb-10">
            <AddProjectForm />
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Your projects
              </h2>
              {projects.length === 0 ? (
                <p className="text-slate-600 text-sm">
                  No projects yet. Add one above.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
                  {projects.map((p) => (
                    <li
                      key={p.id}
                      className="px-4 py-4 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <p className="font-medium text-slate-900">{p.title}</p>
                      {p.description ? (
                        <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                          {p.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDate(p.created_at)}
                      </p>
                      <p className="mt-2">
                        <Link
                          href={`/idea-arena/${p.id}/workspace`}
                          className="text-sm font-semibold text-[#15803d] hover:underline"
                        >
                          Open workspace
                        </Link>
                      </p>
                      {p.required_job_categories?.length ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {p.required_job_categories.map((c) => (
                            <li
                              key={c}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {c}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 inline-block">
                          Add team skills so professionals can join this project.
                        </p>
                      )}
                      <EditProjectForm
                        key={`${p.id}-${p.representative_image_path ?? ""}-${p.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("·")}-${p.title}`}
                        project={p}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        <Link href="/" className="text-[#22c55e] font-medium hover:underline">
          Back to home
        </Link>
      </main>
    </div>
  );
}
