"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SkillExpandOverrides = {
  manuallyOpened: string[];
  manuallyClosed: string[];
};

function storageKey(projectId: string, userId: string): string {
  return `ven-shares:workspace-skill-expand:${projectId}:${userId}`;
}

function readOverrides(key: string): SkillExpandOverrides {
  if (typeof window === "undefined") {
    return { manuallyOpened: [], manuallyClosed: [] };
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { manuallyOpened: [], manuallyClosed: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { manuallyOpened: [], manuallyClosed: [] };
    }
    const obj = parsed as Record<string, unknown>;
    const manuallyOpened = Array.isArray(obj.manuallyOpened)
      ? obj.manuallyOpened.filter((x): x is string => typeof x === "string")
      : [];
    const manuallyClosed = Array.isArray(obj.manuallyClosed)
      ? obj.manuallyClosed.filter((x): x is string => typeof x === "string")
      : [];
    return { manuallyOpened, manuallyClosed };
  } catch {
    return { manuallyOpened: [], manuallyClosed: [] };
  }
}

function writeOverrides(key: string, overrides: SkillExpandOverrides): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(overrides));
  } catch {
    // Quota or private browsing — ignore
  }
}

function computeExpandedSkills(
  userSkills: Set<string>,
  allCategories: string[],
  overrides: SkillExpandOverrides,
): Set<string> {
  const valid = new Set(allCategories);
  const manuallyOpened = new Set(
    overrides.manuallyOpened.filter((c) => valid.has(c)),
  );
  const manuallyClosed = new Set(
    overrides.manuallyClosed.filter((c) => valid.has(c)),
  );

  const expanded = new Set<string>();
  for (const category of allCategories) {
    const isUserSkill = userSkills.has(category);
    if (isUserSkill && !manuallyClosed.has(category)) {
      expanded.add(category);
    } else if (!isUserSkill && manuallyOpened.has(category)) {
      expanded.add(category);
    }
  }
  return expanded;
}

export function useWorkspaceSkillExpand({
  projectId,
  userId,
  userSkills,
  allCategories,
}: {
  projectId: string;
  userId: string;
  userSkills: string[];
  allCategories: string[];
}): { expandedSkills: Set<string>; toggleSkill: (category: string) => void } {
  const key = useMemo(
    () => storageKey(projectId, userId),
    [projectId, userId],
  );
  const userSkillSet = useMemo(() => new Set(userSkills), [userSkills]);

  const [overrides, setOverrides] = useState<SkillExpandOverrides>({
    manuallyOpened: [],
    manuallyClosed: [],
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOverrides(readOverrides(key));
    setHydrated(true);
  }, [key]);

  const expandedSkills = useMemo(() => {
    if (!hydrated) {
      return computeExpandedSkills(userSkillSet, allCategories, {
        manuallyOpened: [],
        manuallyClosed: [],
      });
    }
    return computeExpandedSkills(userSkillSet, allCategories, overrides);
  }, [hydrated, userSkillSet, allCategories, overrides]);

  const toggleSkill = useCallback(
    (category: string) => {
      if (!allCategories.includes(category)) return;

      setOverrides((prev) => {
        const isUserSkill = userSkillSet.has(category);
        const currentlyOpen = computeExpandedSkills(
          userSkillSet,
          allCategories,
          prev,
        ).has(category);

        const next: SkillExpandOverrides = {
          manuallyOpened: [...prev.manuallyOpened],
          manuallyClosed: [...prev.manuallyClosed],
        };

        if (isUserSkill) {
          if (currentlyOpen) {
            if (!next.manuallyClosed.includes(category)) {
              next.manuallyClosed.push(category);
            }
          } else {
            next.manuallyClosed = next.manuallyClosed.filter(
              (c) => c !== category,
            );
          }
        } else if (currentlyOpen) {
          next.manuallyOpened = next.manuallyOpened.filter(
            (c) => c !== category,
          );
        } else if (!next.manuallyOpened.includes(category)) {
          next.manuallyOpened.push(category);
        }

        writeOverrides(key, next);
        return next;
      });
    },
    [allCategories, key, userSkillSet],
  );

  return { expandedSkills, toggleSkill };
}
