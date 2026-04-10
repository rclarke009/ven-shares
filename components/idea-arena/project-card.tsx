import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  DollarSign,
  Globe,
  Lightbulb,
  Scale,
  Tv,
  Wrench,
} from "lucide-react";

import type { ArenaProject } from "@/lib/projects-arena";

import { arenaProjectImageUrl } from "./utils";

const TEAM_BADGES = [Tv, DollarSign, Lightbulb, Scale] as const;

function placeholderInitials(title: string): string {
  const words = title.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function avatarColor(seed: string): string {
  const hues = [200, 160, 40, 280, 340];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h += seed.charCodeAt(i);
  return `hsl(${hues[h % hues.length]} 55% 42%)`;
}

type ProjectCardProps = {
  project: ArenaProject;
  selected: boolean;
};

export function ProjectCard({ project, selected }: ProjectCardProps) {
  const src = arenaProjectImageUrl(project);

  return (
    <Link
      href={`/idea-arena/${project.id}`}
      className={`group flex rounded-2xl border bg-[#f0f0f0] shadow-md overflow-hidden w-[min(100%,280px)] shrink-0 snap-start transition-shadow hover:shadow-lg ${
        selected ? "ring-2 ring-sky-500 ring-offset-2" : "border-slate-200/80"
      }`}
    >
      <div className="flex-1 p-3 min-w-0 flex flex-col">
        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2 leading-snug">
          {project.title}
        </h3>
        <div className="aspect-square relative bg-slate-300 rounded-lg overflow-hidden mb-2">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="200px"
          />
        </div>
        <div className="flex gap-1.5 mt-auto">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300/90 text-slate-600">
            <Scale className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300/90 text-slate-600">
            <Globe className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300/90 text-slate-600">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300/90 text-slate-600">
            <Wrench className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
      <div className="w-[52px] bg-slate-700 flex flex-col items-center gap-2 py-3 px-1">
        {TEAM_BADGES.map((Icon, i) => (
          <div key={i} className="relative shrink-0">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white/30"
              style={{
                backgroundColor: avatarColor(`${project.id}-${i}`),
              }}
            >
              {placeholderInitials(project.title)}
            </div>
            <span className="absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full bg-sky-400 flex items-center justify-center border border-white">
              <Icon className="h-2.5 w-2.5 text-white" aria-hidden />
            </span>
          </div>
        ))}
        <ChevronDown className="h-4 w-4 text-slate-400 mt-1" aria-hidden />
      </div>
    </Link>
  );
}
