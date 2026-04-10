"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";

import {
  buildIdeaArenaSearchParams,
  parseArenaSkillFilterParams,
  type ArenaSkillFilterMode,
} from "@/lib/arena-skill-filter";
import {
  PROFESSIONAL_JOB_CATEGORY_OPTIONS,
  type ProfessionalJobCategory,
} from "@/lib/professional-onboarding";

type ArenaSkillFilterProps = {
  showMatchesMine: boolean;
};

function readFilterFromSearchParams(searchParams: URLSearchParams) {
  const needCat = searchParams.getAll("needCat");
  return parseArenaSkillFilterParams({
    skillFilter: searchParams.get("skillFilter") ?? undefined,
    needCat: needCat.length ? needCat : undefined,
  });
}

function pushArenaUrl(
  router: ReturnType<typeof useRouter>,
  startTransition: (fn: () => void) => void,
  opts: {
    selected: string | undefined;
    skillFilter: ArenaSkillFilterMode;
    needCategories: ProfessionalJobCategory[];
  },
) {
  const params = buildIdeaArenaSearchParams({
    selected: opts.selected,
    skillFilter: opts.skillFilter,
    needCategories:
      opts.skillFilter === "need" ? opts.needCategories : undefined,
  });
  const q = params.toString();
  startTransition(() => {
    router.push(q ? `/idea-arena?${q}` : "/idea-arena");
  });
}

export function ArenaSkillFilter({ showMatchesMine }: ArenaSkillFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selected = searchParams.get("selected") ?? undefined;
  const parsed = readFilterFromSearchParams(searchParams);
  const mode = parsed.mode;
  const needCategories = parsed.needCategories;

  useEffect(() => {
    if (!showMatchesMine && mode === "mine") {
      const params = buildIdeaArenaSearchParams({
        selected,
        skillFilter: "all",
        needCategories: [],
      });
      const q = params.toString();
      startTransition(() => {
        router.replace(q ? `/idea-arena?${q}` : "/idea-arena");
      });
    }
  }, [showMatchesMine, mode, selected, router, startTransition]);

  const setMode = (next: ArenaSkillFilterMode) => {
    if (next === "all") {
      const params = buildIdeaArenaSearchParams({
        selected,
        skillFilter: "all",
        needCategories: [],
      });
      const q = params.toString();
      startTransition(() => {
        router.push(q ? `/idea-arena?${q}` : "/idea-arena");
      });
      return;
    }
    if (next === "mine") {
      pushArenaUrl(router, startTransition, {
        selected,
        skillFilter: "mine",
        needCategories: [],
      });
      return;
    }
    pushArenaUrl(router, startTransition, {
      selected,
      skillFilter: "need",
      needCategories,
    });
  };

  const toggleNeedCategory = (cat: ProfessionalJobCategory) => {
    const next = needCategories.includes(cat)
      ? needCategories.filter((c) => c !== cat)
      : [...needCategories, cat];
    pushArenaUrl(router, startTransition, {
      selected,
      skillFilter: "need",
      needCategories: next,
    });
  };

  const segmentClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="mb-6 space-y-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        Show projects
      </p>
      <div
        className={`flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1 max-w-4xl ${
          isPending ? "opacity-70" : ""
        }`}
        role="group"
        aria-label="Filter projects by team skills"
      >
        <button
          type="button"
          className={segmentClass(mode === "all")}
          onClick={() => setMode("all")}
        >
          All jobs
        </button>
        {showMatchesMine ? (
          <button
            type="button"
            className={segmentClass(mode === "mine")}
            onClick={() => setMode("mine")}
          >
            Matches my skills
          </button>
        ) : null}
        <button
          type="button"
          className={segmentClass(mode === "need")}
          onClick={() => setMode("need")}
        >
          By team skill
        </button>
      </div>

      {mode === "need" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 max-w-4xl">
          <p className="text-xs text-slate-500 mb-3">
            Show jobs that need at least one of these team skills:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROFESSIONAL_JOB_CATEGORY_OPTIONS.map((cat) => (
              <li key={cat}>
                <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-800">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-slate-300 text-[#15803d] focus:ring-[#15803d]"
                    checked={needCategories.includes(cat)}
                    onChange={() => toggleNeedCategory(cat)}
                  />
                  <span>{cat}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
