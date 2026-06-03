import type { ArenaTeamMemberDisplay } from "@/lib/arena-team-display";

import { ArenaUserAvatar } from "./arena-user-avatar";

type SkillTeamRosterProps = {
  teamLead: ArenaTeamMemberDisplay | null;
  otherMembers: ArenaTeamMemberDisplay[];
  variant?: "compact" | "detail";
  complete?: boolean;
};

export function SkillTeamRoster({
  teamLead,
  otherMembers,
  variant = "detail",
  complete = false,
}: SkillTeamRosterProps) {
  if (!teamLead) return null;

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Team lead
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ArenaUserAvatar
            displayName={teamLead.displayName}
            imageUrl={teamLead.imageUrl}
            size={20}
          />
          <span className="text-xs text-slate-700">{teamLead.displayName}</span>
        </span>
        {otherMembers.length > 0 ? (
          <>
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="flex flex-row items-center">
                {otherMembers.map((m, i) => (
                  <span key={m.clerkUserId} className={i > 0 ? "-ml-1.5" : ""}>
                    <ArenaUserAvatar
                      displayName={m.displayName}
                      imageUrl={m.imageUrl}
                      size={18}
                    />
                  </span>
                ))}
              </span>
              <span className="text-xs text-slate-500">
                +{otherMembers.length}{" "}
                {otherMembers.length === 1 ? "member" : "members"}
              </span>
            </span>
          </>
        ) : null}
      </div>
    );
  }

  const leadPrefix = complete ? "Previously led by" : "Team lead:";
  const membersPrefix = complete ? "Previously also on team:" : "Team members:";

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[11px] text-slate-600 leading-snug">
          {leadPrefix}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ArenaUserAvatar
            displayName={teamLead.displayName}
            imageUrl={teamLead.imageUrl}
            size={22}
          />
          <span className="text-[11px] font-medium text-slate-800">
            {teamLead.displayName}
          </span>
        </span>
      </div>
      {otherMembers.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[11px] text-slate-600 leading-snug">
            {membersPrefix}
          </span>
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            {otherMembers.map((m, i) => (
              <span key={m.clerkUserId} className="inline-flex items-center gap-1">
                {i > 0 ? (
                  <span className="text-slate-400" aria-hidden>
                    ·
                  </span>
                ) : null}
                <ArenaUserAvatar
                  displayName={m.displayName}
                  imageUrl={m.imageUrl}
                  size={20}
                />
                <span className="text-[11px] text-slate-700">{m.displayName}</span>
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
