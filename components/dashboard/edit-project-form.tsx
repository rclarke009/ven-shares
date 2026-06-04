"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  updateProjectWithMediaAndSkills,
  type ProjectRow,
  type UpdateProjectMediaState,
} from "@/app/dashboard/projects/actions";
import { arenaProjectImageUrl } from "@/components/idea-arena/utils";
import { publicProjectImageUrl } from "@/lib/project-image-url";
import { PROFESSIONAL_JOB_CATEGORY_OPTIONS } from "@/lib/professional-onboarding";

import { ProjectDescriptionField } from "./project-description-field";
import { ProjectRequiredSkillRows } from "./project-required-skill-rows";

type EditProjectFormProps = {
  project: Pick<
    ProjectRow,
    | "id"
    | "title"
    | "description"
    | "required_job_categories"
    | "representative_image_path"
    | "project_required_skills"
  >;
  variant?: "dashboard" | "workspace";
};

const fileFieldButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

const workspaceFileFieldButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

export function EditProjectForm({
  project,
  variant = "dashboard",
}: EditProjectFormProps) {
  const router = useRouter();
  const isWorkspace = variant === "workspace";
  const labelClass = isWorkspace
    ? "block text-sm font-medium text-slate-700"
    : "block text-xs font-medium text-slate-700";
  const sectionTitleClass = isWorkspace
    ? "text-sm font-medium text-slate-800 mb-2"
    : "text-xs font-medium text-slate-800 mb-2";
  const helperTextClass = isWorkspace
    ? "text-sm text-slate-500 mb-2"
    : "text-xs text-slate-500 mb-2";
  const categoryLabelClass = isWorkspace
    ? "flex items-start gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-sm"
    : "flex items-start gap-2 rounded-lg border px-2.5 py-2 cursor-pointer text-xs";
  const submitButtonClass = isWorkspace
    ? "mt-4 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
    : "mt-4 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60";
  const [selected, setSelected] = useState<string[]>(() => [
    ...project.required_job_categories,
  ]);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewBlobUrl, setImagePreviewBlobUrl] = useState<string | null>(
    null,
  );
  const imageInputRef = useRef<HTMLInputElement>(null);
  const initialState = useMemo<UpdateProjectMediaState>(
    () => ({ ok: false, error: "" }),
    [],
  );
  const [state, formAction, pending] = useActionState(
    updateProjectWithMediaAndSkills,
    initialState,
  );

  const savedPreviewUrl = publicProjectImageUrl(project.representative_image_path);
  const arenaCardPreviewUrl = arenaProjectImageUrl(project);

  useEffect(() => {
    if (!selectedImageFile) {
      setImagePreviewBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedImageFile);
    setImagePreviewBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImageFile]);

  useEffect(() => {
    if (!state.ok) return;
    if (imageInputRef.current) imageInputRef.current.value = "";
    startTransition(() => {
      setImageFileName(null);
      setSelectedImageFile(null);
    });
    router.refresh();
  }, [state.ok, router]);

  function toggleCategory(value: string) {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : [...prev, value],
    );
  }

  function handleImageChange(file: File | undefined) {
    setImageFileName(file?.name ?? null);
    setSelectedImageFile(file ?? null);
  }

  const workspaceDisplayPreviewUrl =
    imagePreviewBlobUrl ?? arenaCardPreviewUrl;

  const imageField = (
    <div>
      <span className={`${labelClass} mb-1`}>
        {isWorkspace ? "Arena card image" : "Representative image"}{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </span>
      {isWorkspace ? (
        <>
          <div className="relative w-full max-w-xl mx-auto aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-300 mb-2">
            <Image
              src={workspaceDisplayPreviewUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 896px) 36rem, 50vw"
              unoptimized={!!imagePreviewBlobUrl}
            />
          </div>
          <p className={`${helperTextClass} mt-0 mb-3 text-center`}>
            This is how your cover appears on Idea Arena cards (4:3 crop).
          </p>
        </>
      ) : savedPreviewUrl ? (
        <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-slate-200 mb-2">
          <Image
            src={savedPreviewUrl}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#22c55e] has-[input:focus-visible]:ring-offset-2">
          <input
            ref={imageInputRef}
            id={`representative_image_${project.id}`}
            name="representative_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => handleImageChange(e.target.files?.[0])}
          />
          <label
            htmlFor={`representative_image_${project.id}`}
            className={
              isWorkspace
                ? workspaceFileFieldButtonClass
                : fileFieldButtonClass
            }
          >
            Add a file
          </label>
        </div>
        {imageFileName ? (
          <span
            className={`text-slate-600 truncate max-w-[min(100%,14rem)] ${
              isWorkspace ? "text-sm" : "text-xs"
            }`}
          >
            {imageFileName}
          </span>
        ) : null}
      </div>
      <p className={`${helperTextClass} mt-1 mb-0`}>
        JPEG, PNG, or WebP, up to 5MB. Uploading replaces the current image.
      </p>
    </div>
  );

  const titleAndDescriptionFields = (
    <>
      <label className={labelClass}>
        Title
        <input
          name="title"
          type="text"
          required
          maxLength={500}
          defaultValue={project.title}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </label>
      <ProjectDescriptionField
        defaultValue={project.description ?? ""}
        variant={variant}
      />
    </>
  );

  return (
    <form
      action={formAction}
      className={
        isWorkspace ? undefined : "mt-4 pt-4 border-t border-slate-100"
      }
    >
      <input type="hidden" name="projectId" value={project.id} />
      {!isWorkspace ? (
        <p className="text-sm font-medium text-slate-800 mb-3">Edit project</p>
      ) : null}
      {state.error ? (
        <p
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-[#15803d] mb-3">Project updated.</p>
      ) : null}

      <div className="space-y-3 mb-4">
        {isWorkspace ? (
          <>
            {imageField}
            {titleAndDescriptionFields}
          </>
        ) : (
          <>
            {titleAndDescriptionFields}
            {imageField}
          </>
        )}
      </div>

      <p className={sectionTitleClass}>
        Minimum team skills{" "}
        <span className="font-normal text-slate-500">(required)</span>
      </p>
      <p className={helperTextClass}>
        Select every category your team needs at minimum. Professionals can join
        if they match at least one — they do not need every box checked.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 mb-3">
        {PROFESSIONAL_JOB_CATEGORY_OPTIONS.map((cat) => {
          const isChecked = selected.includes(cat);
          return (
            <li key={cat}>
              <label
                className={`${categoryLabelClass} ${
                  isChecked
                    ? "border-[#22c55e] bg-green-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={cat}
                  checked={isChecked}
                  onChange={() => toggleCategory(cat)}
                  className="mt-0.5 size-3.5 rounded border-slate-300 text-[#22c55e] focus:ring-[#22c55e]"
                />
                <span className="text-slate-800 leading-snug">{cat}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <ProjectRequiredSkillRows
        key={`${project.id}-${project.project_required_skills.map((s) => `${s.skill_name}:${s.skill_description}`).join("|")}`}
        initialRows={project.project_required_skills}
      />

      <button
        type="submit"
        disabled={pending}
        className={submitButtonClass}
      >
        {pending ? "Saving…" : "Save project"}
      </button>
    </form>
  );
}
