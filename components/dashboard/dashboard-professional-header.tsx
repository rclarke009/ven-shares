import { OpenSkillsAvailabilityLink } from "@/components/profile/open-skills-availability-link";

export function DashboardProfessionalHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-slate-900">Your teams</h1>
      <p className="text-slate-600 text-base mt-1">
        Track checklist progress on teams you&apos;ve joined.
      </p>
      <p className="text-slate-600 text-sm mt-2">
        Update job categories and availability from your account menu (top
        right) — <OpenSkillsAvailabilityLink />.
      </p>
    </div>
  );
}
