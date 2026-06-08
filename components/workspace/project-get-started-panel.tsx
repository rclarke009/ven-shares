"use client";

import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { EditProjectForm, type EditProjectFormActivity } from "@/components/dashboard/edit-project-form";
import { ProjectDetailView } from "@/components/idea-arena/project-detail-view";
import type { ArenaCategoryCoverage, ArenaTeamMemberDisplay } from "@/lib/arena-team-display";
import {
  GET_STARTED_STEPS,
  getStartedStepCompletion,
  type GetStartedStepId,
} from "@/lib/project-get-started";
import type { ArenaProject } from "@/lib/projects-arena";

import type { WorkspaceEditableProject } from "./workspace-shell";

type ProjectGetStartedPanelProps = {
  projectId: string;
  editableProject: WorkspaceEditableProject;
  arenaProject: ArenaProject;
  teamMembers: ArenaTeamMemberDisplay[];
  categoryCoverage: ArenaCategoryCoverage[];
};

const STEP_INTROS: Record<GetStartedStepId, { title: string; body: string }> = {
  welcome: {
    title: "Welcome",
    body: "Your Idea Arena Card is how skilled professionals discover and evaluate your venture. This walkthrough helps you set up everything they see — images, summary, foundation details, and team needs. Tell them as much detail as you can so they will want to come on board and work on your project.",
  },
  images: {
    title: "Look & feel",
    body: "Upload your arena card cover and workspace banner. These images appear on Idea Arena cards and at the top of your workspace.",
  },
  basics: {
    title: "Summary",
    body: "Write a short title and summary. Professionals read this first when deciding whether to learn more.",
  },
  foundation: {
    title: "Project foundation",
    body: "Optional structured details — problem, vision, goals, target customer, prior knowledge, and pitch deck outline — help professionals decide if they are a fit.",
  },
  skills: {
    title: "Team needs",
    body: "List the minimum skills your team needs. Professionals can join when they match at least one category.",
  },
  preview: {
    title: "Preview your card",
    body: "This is how your project appears in the Idea Arena. You can update details anytime from Arena Card Details in the sidebar.",
  },
};

function parseStepId(value: string | null): GetStartedStepId {
  const found = GET_STARTED_STEPS.find((s) => s.id === value);
  return found?.id ?? "welcome";
}

function editFormKey(project: WorkspaceEditableProject): string {
  return `${project.id}-${project.hero_image_path ?? ""}-${project.hero_image_original_path ?? ""}-${project.representative_image_path ?? ""}-${project.representative_image_original_path ?? ""}-${JSON.stringify(project.representative_image_crop)}-${JSON.stringify(project.hero_image_crop)}-${project.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("|")}-${project.title}-${JSON.stringify(project.project_foundation)}-${project.description ?? ""}-${project.required_job_categories.join(",")}`;
}

const INITIAL_FORM_ACTIVITY: EditProjectFormActivity = {
  dirty: false,
  pending: false,
};

const PRIMARY_NEXT_BUTTON_CLASS =
  "inline-flex items-center gap-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60 disabled:pointer-events-none";

export function ProjectGetStartedPanel({
  projectId,
  editableProject,
  arenaProject,
  teamMembers,
  categoryCoverage,
}: ProjectGetStartedPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [step, setStepState] = useState<GetStartedStepId>(() =>
    parseStepId(searchParams.get("step")),
  );
  const [formActivity, setFormActivity] = useState<EditProjectFormActivity>(
    INITIAL_FORM_ACTIVITY,
  );

  const formKey = editFormKey(editableProject);

  useEffect(() => {
    setStepState(parseStepId(searchParams.get("step")));
  }, [searchParams]);

  useEffect(() => {
    setFormActivity(INITIAL_FORM_ACTIVITY);
  }, [step]);

  const handleFormActivityChange = useCallback(
    (state: EditProjectFormActivity) => {
      setFormActivity(state);
    },
    [],
  );

  const stepIndex = GET_STARTED_STEPS.findIndex((s) => s.id === step);
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= GET_STARTED_STEPS.length - 1;

  const completion = useMemo(
    () =>
      Object.fromEntries(
        GET_STARTED_STEPS.map((s) => [
          s.id,
          getStartedStepCompletion(s.id, editableProject),
        ]),
      ) as Record<GetStartedStepId, boolean>,
    [editableProject],
  );

  const setStep = useCallback(
    (next: GetStartedStepId) => {
      setStepState(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "get-started");
      params.set("step", next);
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  function goNext() {
    if (isLast) return;
    setStep(GET_STARTED_STEPS[stepIndex + 1]!.id);
  }

  function goBack() {
    if (isFirst) return;
    setStep(GET_STARTED_STEPS[stepIndex - 1]!.id);
  }

  const intro = STEP_INTROS[step];
  const currentStepMeta = GET_STARTED_STEPS[stepIndex]!;
  const activeFormId = currentStepMeta.editable
    ? `get-started-${projectId}-${step}`
    : undefined;

  const getStartedFormProps = {
    hideOuterChrome: true as const,
    hideSubmitButton: true as const,
    onSaved: goNext,
    onFormActivityChange: handleFormActivityChange,
  };

  return (
    <div className="max-w-5xl">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Get Started</h2>
          <p className="text-base text-slate-600 mt-0.5">
            Set up your Idea Arena card step by step.
          </p>
          <ol
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Setup steps"
          >
            {GET_STARTED_STEPS.map(({ id, label }, index) => {
              const isActive = id === step;
              const isComplete = completion[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setStep(id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                        isActive
                          ? "bg-white/20 text-white"
                          : isComplete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isComplete && !isActive ? (
                        <Check className="h-3 w-3" aria-hidden />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">{intro.title}</h3>
          <p className="text-base text-slate-600 mt-1 mb-6 leading-relaxed">
            {intro.body}
          </p>

          {step === "welcome" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 leading-relaxed">
              <p className="font-medium text-slate-900 mb-2">What you will cover</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Arena card image and workspace banner</li>
                <li>Title and summary</li>
                <li>Foundation details including pitch deck outline</li>
                <li>Team skills professionals need to join</li>
                <li>A live preview of your Idea Arena card</li>
              </ul>
            </div>
          ) : null}

          {step === "images" ? (
            <EditProjectForm
              key={`${formKey}-images`}
              project={editableProject}
              variant="workspace"
              section="images"
              formId={activeFormId}
              {...getStartedFormProps}
            />
          ) : null}

          {step === "basics" ? (
            <EditProjectForm
              key={`${formKey}-basics`}
              project={editableProject}
              variant="workspace"
              section="basics"
              formId={activeFormId}
              {...getStartedFormProps}
            />
          ) : null}

          {step === "foundation" ? (
            <EditProjectForm
              key={`${formKey}-foundation`}
              project={editableProject}
              variant="workspace"
              section="foundation"
              formId={activeFormId}
              {...getStartedFormProps}
            />
          ) : null}

          {step === "skills" ? (
            <EditProjectForm
              key={`${formKey}-skills`}
              project={editableProject}
              variant="workspace"
              section="skills"
              formId={activeFormId}
              {...getStartedFormProps}
            />
          ) : null}

          {step === "preview" ? (
            <div className="space-y-4">
              <ProjectDetailView
                project={arenaProject}
                isProfessional={false}
                canOpenWorkspace={false}
                isProjectOwner
                teamMembers={teamMembers}
                categoryCoverage={categoryCoverage}
                returnToArenaQuery={`selected=${projectId}`}
                variant="preview"
              />
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/idea-arena/${projectId}`}
                  className="inline-flex items-center rounded-lg bg-[#15803d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166534] transition-colors"
                >
                  View in Idea Arena
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirst}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {step === "foundation" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Skip for now
                </button>
              ) : null}

              {currentStepMeta.editable && step !== "preview" ? (
                formActivity.dirty ? (
                  <button
                    type="submit"
                    form={activeFormId}
                    disabled={formActivity.pending}
                    className={PRIMARY_NEXT_BUTTON_CLASS}
                  >
                    {formActivity.pending ? "Saving…" : "Save & continue"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    className={PRIMARY_NEXT_BUTTON_CLASS}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                )
              ) : step === "welcome" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className={PRIMARY_NEXT_BUTTON_CLASS}
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ) : step === "preview" ? (
                <span className="text-sm text-slate-500">You are all set.</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
