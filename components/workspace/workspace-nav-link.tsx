"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { workspaceHrefFromStorage } from "@/lib/workspace-last-view";

const linkClass =
  "text-sm font-medium text-slate-700 hover:text-[#22c55e] transition-colors";

export function WorkspaceNavLink() {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();
  const [workspaceHref, setWorkspaceHref] = useState("/workspace");

  useEffect(() => {
    if (!isLoaded || !userId) {
      setWorkspaceHref("/workspace");
      return;
    }
    setWorkspaceHref(workspaceHrefFromStorage(userId));
  }, [isLoaded, userId]);

  if (pathname.startsWith("/workspace")) {
    return (
      <Link href="/idea-arena" className={linkClass}>
        Idea Arena
      </Link>
    );
  }

  return (
    <Link href={workspaceHref} className={linkClass}>
      Workspace
    </Link>
  );
}
