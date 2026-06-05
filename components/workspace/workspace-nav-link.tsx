"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { workspaceHrefFromStorage } from "@/lib/workspace-last-view";

export function WorkspaceNavLink() {
  const { userId, isLoaded } = useAuth();
  const [href, setHref] = useState("/workspace");

  useEffect(() => {
    if (!isLoaded || !userId) {
      setHref("/workspace");
      return;
    }
    setHref(workspaceHrefFromStorage(userId));
  }, [isLoaded, userId]);

  return (
    <Link
      href={href}
      className="text-sm font-medium text-slate-700 hover:text-[#22c55e] transition-colors"
    >
      Workspace
    </Link>
  );
}
