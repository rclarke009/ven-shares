"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProfessionalJobCategory } from "@/lib/professional-onboarding";
import { buildSkillRecommendInvite } from "@/lib/skill-recommend-invite";

type SkillRecommendMenuProps = {
  projectId: string;
  projectTitle: string;
  skillCategory: ProfessionalJobCategory;
};

export function SkillRecommendMenu({
  projectId,
  projectTitle,
  skillCategory,
}: SkillRecommendMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const buildInvite = useCallback(
    () =>
      buildSkillRecommendInvite({
        origin: window.location.origin,
        projectId,
        projectTitle,
        skillCategory,
      }),
    [projectId, projectTitle, skillCategory],
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleEmailInvite = useCallback(() => {
    window.location.href = buildInvite().mailtoHref;
    close();
  }, [buildInvite, close]);

  const handleCopyLink = useCallback(async () => {
    const url = buildInvite().inviteUrl;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      close();
    } catch {
      window.prompt("Copy this invite link:", url);
      close();
    }
  }, [buildInvite, close]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="text-xs font-semibold rounded-md px-2.5 py-1 border border-[#15803d]/40 bg-white text-[#15803d] hover:bg-emerald-50/80 transition-colors"
      >
        {copied ? "Copied!" : "Recommend"}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              handleEmailInvite();
            }}
            className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            Email invite
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              void handleCopyLink();
            }}
            className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            Copy invite link
          </button>
        </div>
      ) : null}
    </div>
  );
}
