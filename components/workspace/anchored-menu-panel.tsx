"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;

type AnchoredMenuPanelProps = {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export function AnchoredMenuPanel({
  open,
  triggerRef,
  menuRef,
  className = "",
  children,
  onClick,
}: AnchoredMenuPanelProps) {
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const menuHeight = menuRect.height || menu.offsetHeight;
    const menuWidth = menuRect.width || menu.offsetWidth;

    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING;
    const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
    const openAbove =
      spaceBelow < menuHeight + MENU_GAP && spaceAbove >= menuHeight + MENU_GAP;

    let top = openAbove
      ? triggerRect.top - menuHeight - MENU_GAP
      : triggerRect.bottom + MENU_GAP;

    let left = triggerRect.right - menuWidth;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PADDING),
    );

    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PADDING),
    );

    menu.style.position = "fixed";
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.visibility = "visible";
  }, [triggerRef, menuRef]);

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, updatePosition, children]);

  useEffect(() => {
    if (!open) return;

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={`z-40 min-w-[10.5rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${className}`}
      style={{ position: "fixed", visibility: "hidden" }}
      onClick={onClick}
    >
      {children}
    </div>,
    document.body,
  );
}
