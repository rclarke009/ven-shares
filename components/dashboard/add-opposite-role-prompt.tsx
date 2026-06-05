import Link from "next/link";

import type { VenRole } from "@/lib/ven-role";

type AddOppositeRolePromptProps = {
  missingRole: VenRole;
};

const COPY: Record<
  VenRole,
  { body: string; cta: string; href: string }
> = {
  professional: {
    body: "Also want to join teams as a skilled professional? Add a professional profile to browse Idea Arena and join inventor projects.",
    cta: "Add professional profile",
    href: "/auth/add-role/professional",
  },
  inventor: {
    body: "Have an invention to share? You can add an inventor profile to create and manage projects.",
    cta: "Add inventor profile",
    href: "/auth/add-role/inventor",
  },
};

export function AddOppositeRolePrompt({ missingRole }: AddOppositeRolePromptProps) {
  const { body, cta, href } = COPY[missingRole];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 mb-10 shadow-sm">
      <p className="text-sm text-slate-700 mb-3">{body}</p>
      <Link
        href={href}
        className="inline-flex text-sm font-semibold text-slate-900 border-2 border-slate-900 hover:bg-slate-900 hover:text-white rounded-lg px-4 py-2 transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}
