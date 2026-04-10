"use server";

import { revalidatePath } from "next/cache";

import { joinProjectAsProfessional } from "@/lib/project-members";

export type JoinProjectState = {
  ok: boolean;
  error: string;
};

export async function joinProjectTeam(
  _prevState: JoinProjectState,
  formData: FormData,
): Promise<JoinProjectState> {
  const projectId = (formData.get("projectId") as string)?.trim() ?? "";
  const result = await joinProjectAsProfessional(projectId);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  revalidatePath("/idea-arena");
  revalidatePath(`/idea-arena/${projectId}`);
  return { ok: true, error: "" };
}
