"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  joinProjectTeam,
  type JoinProjectState,
} from "@/app/idea-arena/actions";

const initialState: JoinProjectState = { ok: false, error: "" };

type JoinTeamFormProps = {
  projectId: string;
};

export function JoinTeamForm({ projectId }: JoinTeamFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    joinProjectTeam,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      {state.error ? (
        <p className="text-sm text-red-600 text-right max-w-xs" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="ven-cta text-base px-10 py-3 shrink-0 disabled:opacity-60"
      >
        {isPending ? "Joining…" : "Join Team"}
      </button>
    </form>
  );
}
