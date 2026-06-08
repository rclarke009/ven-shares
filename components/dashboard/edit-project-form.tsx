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
  type FormEvent,
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
import { getCroppedImageBlob } from "@/lib/crop-image.client";
import { publicProjectImageUrl } from "@/lib/project-image-url";
import {
  DEFAULT_PROJECT_IMAGE_CROP,
  serializeProjectImageCrop,
  type ProjectImageCropMeta,
  ARENA_CROP_ASPECT,
  ARENA_IMAGE_SIZE_HINT,
  HERO_CROP_ASPECT,
  HERO_IMAGE_SIZE_HINT,
} from "@/lib/project-image-crop";
import { PROFESSIONAL_JOB_CATEGORY_OPTIONS } from "@/lib/professional-onboarding";
import { PROJECT_FOUNDATION_FIELD_DEFS } from "@/lib/project-foundation";

import {
  ProjectImageCropField,
  type ProjectImageCropFieldState,
} from "./project-image-crop-field";
import { ProjectDescriptionField } from "./project-description-field";
import { ProjectFoundationFields } from "./project-foundation-fields";
import { ProjectRequiredSkillRows } from "./project-required-skill-rows";

type EditProjectFormSection =
  | "all"
  | "images"
  | "basics"
  | "foundation"
  | "skills";

type EditProjectFormProps = {
  project: Pick<
    ProjectRow,
    | "id"
    | "title"
    | "description"
    | "project_foundation"
    | "required_job_categories"
    | "representative_image_path"
    | "representative_image_original_path"
    | "representative_image_crop"
    | "hero_image_path"
    | "hero_image_original_path"
    | "hero_image_crop"
    | "project_required_skills"
  >;
  variant?: "dashboard" | "workspace";
  section?: EditProjectFormSection;
  onSaved?: () => void;
  submitLabel?: string;
  hideOuterChrome?: boolean;
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

async function fetchImageAsFile(
  url: string,
  filename: string,
): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, {
      type: blob.type || "image/webp",
    });
  } catch {
    return null;
  }
}

type ProjectImageUploadFieldProps = {
  fieldName: string;
  inputId: string;
  label: string;
  sizeHint?: string;
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
  enableCrop?: boolean;
  cropImageSrc?: string | null;
  cropAspect?: number;
  initialCrop?: ProjectImageCropMeta | null;
  cropResetKey?: string;
  cropInitialAdjusting?: boolean;
  onCropStateChange?: (state: ProjectImageCropFieldState) => void;
};

function ProjectImageUploadField({
  fieldName,
  inputId,
  label,
  sizeHint,
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
  enableCrop = false,
  cropImageSrc,
  cropAspect,
  initialCrop,
  cropResetKey,
  cropInitialAdjusting = false,
  onCropStateChange,
}: ProjectImageUploadFieldProps) {
  const hasCustomImage = !!(savedPath?.trim() || selectedFile);
  const showCropper =
    enableCrop && hasCustomImage && cropImageSrc && onCropStateChange;

  return (
    <div>
      <span className={`${labelClass} mb-1`}>
        {label}{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </span>
      {sizeHint ? (
        <p className={`${helperTextClass} mt-0 mb-2`}>{sizeHint}</p>
      ) : null}
      {showCropper ? (
        <ProjectImageCropField
          key={cropResetKey}
          imageSrc={cropImageSrc}
          aspect={cropAspect ?? ARENA_CROP_ASPECT}
          initialCrop={initialCrop}
          initialAdjusting={cropInitialAdjusting}
          containerClassName={previewClassName.replace(/\s*mb-2\s*/, " mb-0 ")}
          onCropStateChange={onCropStateChange}
        />
      ) : (
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
      )}
      {helperBelowPreview ? (
        <p className={`${helperTextClass} mt-2 mb-1 text-center`}>
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
  section = "all",
  onSaved,
  submitLabel,
  hideOuterChrome = false,
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
  const [arenaCropState, setArenaCropState] =
    useState<ProjectImageCropFieldState>({
      meta: project.representative_image_crop ?? DEFAULT_PROJECT_IMAGE_CROP,
      croppedAreaPixels: null,
      dirty: false,
    });
  const [heroCropState, setHeroCropState] = useState<ProjectImageCropFieldState>(
    {
      meta: project.hero_image_crop ?? DEFAULT_PROJECT_IMAGE_CROP,
      croppedAreaPixels: null,
      dirty: false,
    },
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
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
  const savedArenaOriginalUrl = publicProjectImageUrl(
    project.representative_image_original_path,
  );
  const savedHeroPreviewUrl = publicProjectImageUrl(project.hero_image_path);
  const savedHeroOriginalUrl = publicProjectImageUrl(
    project.hero_image_original_path,
  );
  const arenaCardPreviewUrl = arenaProjectImageUrl(project);
  const heroFallbackPreviewUrl = workspaceHeroImageUrl(project);

  const arenaCropImageSrc =
    imagePreviewBlobUrl ??
    savedArenaOriginalUrl ??
    savedArenaPreviewUrl ??
    null;

  const heroUsesArenaFallback =
    isWorkspace &&
    !heroPreviewBlobUrl &&
    !savedHeroPreviewUrl &&
    !!savedArenaPreviewUrl;

  const heroCropImageSrc =
    heroPreviewBlobUrl ??
    savedHeroOriginalUrl ??
    savedHeroPreviewUrl ??
    savedArenaOriginalUrl ??
    savedArenaPreviewUrl ??
    null;

  const hasHeroCropSource =
    !!selectedHeroFile ||
    !!savedHeroPreviewUrl ||
    (heroUsesArenaFallback && !!savedArenaPreviewUrl);

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
      setArenaCropState({
        meta: project.representative_image_crop ?? DEFAULT_PROJECT_IMAGE_CROP,
        croppedAreaPixels: null,
        dirty: false,
      });
      setHeroCropState({
        meta: project.hero_image_crop ?? DEFAULT_PROJECT_IMAGE_CROP,
        croppedAreaPixels: null,
        dirty: false,
      });
      setSubmitError(null);
    });
    router.refresh();
    if (onSaved) {
      onSaved();
    }
  }, [state.ok, router, project.representative_image_crop, project.hero_image_crop, onSaved]);

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
    setArenaCropState({
      meta: DEFAULT_PROJECT_IMAGE_CROP,
      croppedAreaPixels: null,
      dirty: false,
    });
  }

  function handleHeroChange(file: File | undefined) {
    setHeroFileName(file?.name ?? null);
    setSelectedHeroFile(file ?? null);
    setHeroCropState({
      meta: DEFAULT_PROJECT_IMAGE_CROP,
      croppedAreaPixels: null,
      dirty: false,
    });
  }

  const workspaceArenaDisplayPreviewUrl =
    imagePreviewBlobUrl ?? arenaCardPreviewUrl;
  const dashboardDisplayPreviewUrl =
    imagePreviewBlobUrl ?? savedArenaPreviewUrl;

  const workspaceHeroDisplayPreviewUrl =
    heroPreviewBlobUrl ??
    savedHeroPreviewUrl ??
    (savedArenaPreviewUrl ? savedArenaPreviewUrl : heroFallbackPreviewUrl);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!isWorkspace) return;

    e.preventDefault();
    setSubmitError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    fd.delete("representative_image");
    fd.delete("hero_image");
    fd.delete("representative_image_original");
    fd.delete("hero_image_original");

    try {
      const arenaHasCustomImage =
        !!project.representative_image_path?.trim() || selectedImageFile !== null;
      const arenaNeedsExport =
        arenaHasCustomImage &&
        arenaCropImageSrc &&
        (selectedImageFile !== null || arenaCropState.dirty);

      if (arenaNeedsExport) {
        if (!arenaCropState.croppedAreaPixels) {
          setSubmitError(
            "Wait for the arena card image preview to finish loading, then try again.",
          );
          return;
        }
        const blob = await getCroppedImageBlob(
          arenaCropImageSrc,
          arenaCropState.croppedAreaPixels,
        );
        fd.set(
          "representative_image",
          new File([blob], "cover.webp", { type: "image/webp" }),
        );
        fd.set(
          "representative_image_crop",
          serializeProjectImageCrop(arenaCropState.meta),
        );
        if (selectedImageFile) {
          fd.set("representative_image_original", selectedImageFile);
        } else if (
          !project.representative_image_original_path?.trim() &&
          arenaCropImageSrc
        ) {
          const originalFile = await fetchImageAsFile(
            arenaCropImageSrc,
            "cover-original.webp",
          );
          if (originalFile) {
            fd.set("representative_image_original", originalFile);
          }
        }
      }

      const heroNeedsExport =
        hasHeroCropSource &&
        heroCropImageSrc &&
        (selectedHeroFile !== null || heroCropState.dirty);

      if (heroNeedsExport) {
        if (!heroCropState.croppedAreaPixels) {
          setSubmitError(
            "Wait for the hero image preview to finish loading, then try again.",
          );
          return;
        }
        const blob = await getCroppedImageBlob(
          heroCropImageSrc,
          heroCropState.croppedAreaPixels,
        );
        fd.set(
          "hero_image",
          new File([blob], "hero.webp", { type: "image/webp" }),
        );
        fd.set(
          "hero_image_crop",
          serializeProjectImageCrop(heroCropState.meta),
        );
        if (selectedHeroFile) {
          fd.set("hero_image_original", selectedHeroFile);
        } else if (
          !project.hero_image_original_path?.trim() &&
          heroCropImageSrc
        ) {
          const originalFile = await fetchImageAsFile(
            heroCropImageSrc,
            "hero-original.webp",
          );
          if (originalFile) {
            fd.set("hero_image_original", originalFile);
          }
        }
      }

      startTransition(() => formAction(fd));
    } catch {
      setSubmitError("Could not prepare images. Try again.");
    }
  }

  const heroImageField = isWorkspace ? (
    <ProjectImageUploadField
      fieldName="hero_image"
      inputId={`hero_image_${project.id}`}
      label="Hero image"
      sizeHint={HERO_IMAGE_SIZE_HINT}
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
      enableCrop={hasHeroCropSource}
      cropImageSrc={heroCropImageSrc}
      cropAspect={HERO_CROP_ASPECT}
      initialCrop={project.hero_image_crop}
      cropResetKey={`hero-${project.id}-${selectedHeroFile?.name ?? project.hero_image_path ?? "fallback"}-${heroCropImageSrc ?? "none"}`}
      cropInitialAdjusting={!!selectedHeroFile}
      onCropStateChange={setHeroCropState}
    />
  ) : null;

  const arenaImageField = (
    <ProjectImageUploadField
      fieldName="representative_image"
      inputId={`representative_image_${project.id}`}
      label={isWorkspace ? "Arena card image" : "Representative image"}
      sizeHint={ARENA_IMAGE_SIZE_HINT}
      helperBelowPreview={
        isWorkspace
          ? "This is how your cover appears on Idea Arena cards."
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
      enableCrop={isWorkspace}
      cropImageSrc={isWorkspace ? arenaCropImageSrc : null}
      cropAspect={ARENA_CROP_ASPECT}
      initialCrop={project.representative_image_crop}
      cropResetKey={`arena-${project.id}-${selectedImageFile?.name ?? project.representative_image_path ?? "none"}-${arenaCropImageSrc ?? "none"}`}
      cropInitialAdjusting={!!selectedImageFile}
      onCropStateChange={setArenaCropState}
    />
  );

  const basicsFields = (
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

  const showImages = section === "all" || section === "images";
  const showBasics = section === "all" || section === "basics";
  const showFoundation = section === "all" || section === "foundation";
  const showSkills = section === "all" || section === "skills";
  const isPartialSection = section !== "all";
  const preserveBasics = isPartialSection && !showBasics;
  const preserveFoundation = isPartialSection && !showFoundation;
  const preserveSkills = isPartialSection && !showSkills;
  const preserveCategories = isPartialSection && !showSkills;

  const displayError = submitError ?? state.error;
  const defaultSubmitLabel =
    section === "all" ? "Save project" : "Save & continue";

  return (
    <form
      action={isWorkspace ? undefined : formAction}
      onSubmit={isWorkspace ? handleSubmit : undefined}
      className={
        isWorkspace ? undefined : "mt-4 pt-4 border-t border-slate-100"
      }
    >
      <input type="hidden" name="projectId" value={project.id} />
      {preserveBasics ? (
        <>
          <input type="hidden" name="title" value={project.title} />
          <input
            type="hidden"
            name="description"
            value={project.description ?? ""}
          />
        </>
      ) : null}
      {preserveCategories
        ? project.required_job_categories.map((cat) => (
            <input key={cat} type="hidden" name="categories" value={cat} />
          ))
        : null}
      {preserveFoundation
        ? PROJECT_FOUNDATION_FIELD_DEFS.map((def) => (
            <input
              key={def.key}
              type="hidden"
              name={def.formName}
              value={project.project_foundation[def.key] ?? ""}
            />
          ))
        : null}
      {preserveSkills
        ? project.project_required_skills.flatMap((skill, i) => [
            <input
              key={`name-${i}`}
              type="hidden"
              name="skill_name"
              value={skill.skill_name}
            />,
            <input
              key={`desc-${i}`}
              type="hidden"
              name="skill_description"
              value={skill.skill_description}
            />,
          ])
        : null}
      {!isWorkspace && !hideOuterChrome ? (
        <p className="text-sm font-medium text-slate-800 mb-3">Edit project</p>
      ) : null}
      {displayError ? (
        <p
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3"
          role="alert"
        >
          {displayError}
        </p>
      ) : null}
      {state.ok && !onSaved ? (
        <p className="text-sm text-[#15803d] mb-3">Project updated.</p>
      ) : null}

      <div className="space-y-3 mb-4">
        {isWorkspace ? (
          <>
            {showImages ? (
              <>
                {arenaImageField}
                {heroImageField}
              </>
            ) : null}
            {showBasics ? basicsFields : null}
            {showFoundation ? (
              <ProjectFoundationFields
                defaultValues={project.project_foundation}
                variant={variant}
              />
            ) : null}
          </>
        ) : (
          <>
            {showBasics ? basicsFields : null}
            {showFoundation ? (
              <ProjectFoundationFields
                defaultValues={project.project_foundation}
                variant={variant}
              />
            ) : null}
            {showImages ? arenaImageField : null}
          </>
        )}
      </div>

      {showSkills ? (
        <>
          <p className={sectionTitleClass}>
            Minimum team skills{" "}
            <span className="font-normal text-slate-500">(required)</span>
          </p>
          <p className={helperTextClass}>
            Select every category your team needs at minimum. Professionals can
            join if they match at least one — they do not need every box
            checked.
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
        </>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={submitButtonClass}
      >
        {pending ? "Saving…" : (submitLabel ?? defaultSubmitLabel)}
      </button>
    </form>
  );
}
