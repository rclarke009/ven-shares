import Image from "next/image";

import { workspaceHeroImageUrl } from "@/components/idea-arena/utils";

type WorkspaceProjectHeroProps = {
  projectId: string;
  projectTitle: string;
  heroImagePath: string | null;
  representativeImagePath: string | null;
};

export function WorkspaceProjectHero({
  projectId,
  projectTitle,
  heroImagePath,
  representativeImagePath,
}: WorkspaceProjectHeroProps) {
  const src = workspaceHeroImageUrl({
    id: projectId,
    hero_image_path: heroImagePath,
    representative_image_path: representativeImagePath,
  });

  return (
    <div className="relative h-36 md:h-44 w-full shrink-0 overflow-hidden border-b border-slate-200/80">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div
        className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 px-6 py-4">
        <h1 className="text-lg md:text-xl font-bold text-white truncate drop-shadow-sm">
          {projectTitle}
        </h1>
      </div>
    </div>
  );
}
