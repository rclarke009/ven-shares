import type { WorkspaceRosterEntryDTO } from "@/components/workspace/workspace-shell";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type WorkspaceTeamRosterProps = {
  roster: WorkspaceRosterEntryDTO[];
};

export function WorkspaceTeamRoster({ roster }: WorkspaceTeamRosterProps) {
  return (
    <div className="mt-auto p-3 border-t border-slate-600/80">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
        Team
      </p>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {roster.map((r) => (
          <li key={r.clerk_user_id} className="text-xs">
            <span className="font-medium text-white">{r.display_name}</span>
            <span className="text-slate-400">
              {" "}
              · {r.role === "owner" ? "Owner" : "Member"}
            </span>
            {r.status_text.trim() ? (
              <p className="text-slate-300 mt-0.5 leading-snug">
                {r.status_text}
              </p>
            ) : null}
            {r.updated_at ? (
              <p className="text-slate-500 mt-0.5">{formatTime(r.updated_at)}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
