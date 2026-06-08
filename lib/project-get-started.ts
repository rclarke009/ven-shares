import { hasAnyFoundationContent, type ProjectFoundation } from "@/lib/project-foundation";

export type GetStartedStepId =
  | "welcome"
  | "images"
  | "basics"
  | "foundation"
  | "skills"
  | "preview";

export const GET_STARTED_STEPS: {
  id: GetStartedStepId;
  label: string;
  editable: boolean;
}[] = [
  { id: "welcome", label: "Welcome", editable: false },
  { id: "images", label: "Look & feel", editable: true },
  { id: "basics", label: "Summary", editable: true },
  { id: "foundation", label: "Foundation", editable: true },
  { id: "skills", label: "Team needs", editable: true },
  { id: "preview", label: "Preview", editable: false },
];

type ProjectSetupSnapshot = {
  title: string;
  description: string | null;
  project_foundation: ProjectFoundation;
  required_job_categories: string[];
  representative_image_path: string | null;
};

export function getStartedStepCompletion(
  stepId: GetStartedStepId,
  project: ProjectSetupSnapshot,
): boolean {
  switch (stepId) {
    case "welcome":
      return true;
    case "images":
      return !!project.representative_image_path?.trim();
    case "basics":
      return !!project.description?.trim();
    case "foundation":
      return hasAnyFoundationContent(project.project_foundation);
    case "skills":
      return project.required_job_categories.length > 0;
    case "preview":
      return true;
    default:
      return false;
  }
}
