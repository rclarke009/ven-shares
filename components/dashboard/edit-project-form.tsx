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
import {
  arenaProjectImageUrl,
  workspaceHeroImageUrl,
} from "@/components/idea-arena/utils";
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
    | "hero_image_path"
    | "project_required_skills"
  >;
  variant?: "dashboard" | "workspace";
};

const fileFieldButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

const workspaceFileFieldButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

function fileButtonLabel(
  savedPath: string | null | undefined,
  selectedFile: File | null,
): string {
  const hasCustomImage = !!(savedPath?.trim() || selectedFile);
  return hasCustomImage ? "Change file" : "Add a file";
}

type ProjectImageUploadFieldProps = {
  fieldName: string;
  inputId: string;
  label: string;
  helperBelowPreview?: string;
  helperBelowInput: string;
  isWorkspace: boolean;
  labelClass: string;
  helperTextClass: string;
  savedPath: string | null;
  previewUrl: string;
  previewUnoptimized: boolean;
  previewClassName: string;
  fallbackNote?: string;
  selectedFile: File | null;
  fileName: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | undefined) => void;
};

function ProjectImageUploadField({
  fieldName,
  inputId,
  label,
  helperBelowPreview,
  helperBelowInput,
  isWorkspace,
  labelClass,
  helperTextClass,
  savedPath,
  previewUrl,
  previewUnoptimized,
  previewClassName,
  fallbackNote,
  selectedFile,
  fileName,
  inputRef,
  onFileChange,
}: ProjectImageUploadFieldProps) {
  return (
    <div>
      <span className={`${labelClass} mb-1`}>
        {label}{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </span>
      <div className={previewClassName}>
        <Image
          src={previewUrl}
          alt=""
          fill
          className="object-cover"
          sizes={
            isWorkspace
              ? "(max-width: 896px) 36rem, 50vw"
              : "96px"
          }
          unoptimized={previewUnoptimized}
        />
      </div>
      {helperBelowPreview ? (
        <p className={`${helperTextClass} mt-0 mb-1 text-center`}>
          {helperBelowPreview}
        </p>
      ) : null}
      {fallbackNote ? (
        <p className={`${helperTextClass} mt-0 mb-3 text-center italic`}>
          {fallbackNote}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#22c55e] has-[input:focus-visible]:ring-offset-2">
          <input
            ref={inputRef}
            id={inputId}
            name={fieldName}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
          <label
            htmlFor={inputId}
            className={
              isWorkspace
                ? workspaceFileFieldButtonClass
                : fileFieldButtonClass
            }
          >
            {fileButtonLabel(savedPath, selectedFile)}
          </label>
        </div>
        {fileName ? (
          <span
            className={`text-slate-600 truncate max-w-[min(100%,14rem)] ${
              isWorkspace ? "text-sm" : "text-xs"
            }`}
          >
            {fileName}
          </span>
        ) : null}
      </div>
      <p className={`${helperTextClass} mt-1 mb-0`}>{helperBelowInput}</p>
    </div>
  );
}

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
  const [heroFileName, setHeroFileName] = useState<string | null>(null);
  const [selectedHeroFile, setSelectedHeroFile] = useState<File | null>(null);
  const [heroPreviewBlobUrl, setHeroPreviewBlobUrl] = useState<string | null>(
    null,
  );
  const imageInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const initialState = useMemo<UpdateProjectMediaState>(
    () => ({ ok: false, error: "" }),
    [],
  );
  const [state, formAction, pending] = useActionState(
    updateProjectWithMediaAndSkills,
    initialState,
  );

  const savedArenaPreviewUrl = publicProjectImageUrl(
    project.representative_image_path,
  );
  const savedHeroPreviewUrl = publicProjectImageUrl(project.hero_image_path);
  const arenaCardPreviewUrl = arenaProjectImageUrl(project);
  const heroFallbackPreviewUrl = workspaceHeroImageUrl(project);

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
    if (!selectedHeroFile) {
      setHeroPreviewBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedHeroFile);
    setHeroPreviewBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedHeroFile]);

  useEffect(() => {
    if (!state.ok) return;
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (heroInputRef.current) heroInputRef.current.value = "";
    startTransition(() => {
      setImageFileName(null);
      setSelectedImageFile(null);
      setHeroFileName(null);
      setSelectedHeroFile(null);
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

  function handleHeroChange(file: File | undefined) {
    setHeroFileName(file?.name ?? null);
    setSelectedHeroFile(file ?? null);
  }

  const workspaceArenaDisplayPreviewUrl =
    imagePreviewBlobUrl ?? arenaCardPreviewUrl;
  const dashboardDisplayPreviewUrl =
    imagePreviewBlobUrl ?? savedArenaPreviewUrl;

  const heroUsesArenaFallback =
    isWorkspace &&
    !heroPreviewBlobUrl &&
    !savedHeroPreviewUrl &&
    !!savedArenaPreviewUrl;

  const workspaceHeroDisplayPreviewUrl =
    heroPreviewBlobUrl ??
    savedHeroPreviewUrl ??
    (savedArenaPreviewUrl ? savedArenaPreviewUrl : heroFallbackPreviewUrl);

  const heroImageField = isWorkspace ? (
    <ProjectImageUploadField
      fieldName="hero_image"
      inputId={`hero_image_${project.id}`}
      label="Hero image"
      helperBelowPreview="This is how your project banner appears at the top of the workspace."
      helperBelowInput="JPEG, PNG, or WebP, up to 5MB. Uploading replaces the current hero image."
      isWorkspace={isWorkspace}
      labelClass={labelClass}
      helperTextClass={helperTextClass}
      savedPath={project.hero_image_path}
      previewUrl={workspaceHeroDisplayPreviewUrl}
      previewUnoptimized={!!heroPreviewBlobUrl}
      previewClassName="relative w-full aspect-5/1 max-h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-300 mb-2"
      fallbackNote={
        heroUsesArenaFallback
          ? "Using arena card image until you upload a hero."
          : undefined
      }
      selectedFile={selectedHeroFile}
      fileName={heroFileName}
      inputRef={heroInputRef}
      onFileChange={handleHeroChange}
    />
  ) : null;

  const arenaImageField = (
    <ProjectImageUploadField
      fieldName="representative_image"
      inputId={`representative_image_${project.id}`}
      label={isWorkspace ? "Arena card image" : "Representative image"}
      helperBelowPreview={
        isWorkspace
          ? "This is how your cover appears on Idea Arena cards (4:3 crop)."
          : undefined
      }
      helperBelowInput={
        isWorkspace
          ? "JPEG, PNG, or WebP, up to 5MB. Uploading replaces the current image."
          : "JPEG, PNG, or WebP, up to 5MB."
      }
      isWorkspace={isWorkspace}
      labelClass={labelClass}
      helperTextClass={helperTextClass}
      savedPath={project.representative_image_path}
      previewUrl={
        isWorkspace
          ? workspaceArenaDisplayPreviewUrl
          : (dashboardDisplayPreviewUrl ?? arenaCardPreviewUrl)
      }
      previewUnoptimized={!!imagePreviewBlobUrl}
      previewClassName={
        isWorkspace
          ? "relative w-full max-w-xl mx-auto aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-300 mb-2"
          : dashboardDisplayPreviewUrl || imagePreviewBlobUrl
            ? "relative h-24 w-24 rounded-lg overflow-hidden border border-slate-200 mb-2"
            : "hidden"
      }
      selectedFile={selectedImageFile}
      fileName={imageFileName}
      inputRef={imageInputRef}
      onFileChange={handleImageChange}
    />
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
            {arenaImageField}
            {heroImageField}
            {titleAndDescriptionFields}
          </>
        ) : (
          <>
            {titleAndDescriptionFields}
            {arenaImageField}
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
