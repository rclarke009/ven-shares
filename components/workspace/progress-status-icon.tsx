import { CheckCircle2, Circle, CircleDot } from "lucide-react";

import type { ProgressItemStatus } from "@/lib/workspace-progress-checklist";

type ProgressStatusIconProps = {
  status: ProgressItemStatus;
};

export function ProgressStatusIcon({ status }: ProgressStatusIconProps) {
  switch (status) {
    case "completed":
      return (
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden
        />
      );
    case "in_progress":
      return (
        <CircleDot className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
      );
    default:
      return (
        <Circle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      );
  }
}
