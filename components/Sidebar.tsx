"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { HomeIcon, SubsIcon, HistoryIcon, CloseIcon } from "./icons";

export default function Sidebar({
  open,
  onClose,
  categories,
  logoText,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  logoText: string;
}) {
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile drawer; move focus into it when it opens.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const mainLinks = [
    { href: "/", label: "Home", icon: <HomeIcon /> },
    { href: "/subscriptions", label: "Subscriptions", icon: <SubsIcon /> },
    { href: "/history", label: "History", icon: <HistoryIcon /> },
  ];

  const activeCls = (href: string) =>
    pathname === href
      ? "bg-yt-red/20 font-semibold text-white shadow-neon-sm"
      : "text-yt-text/75 hover:bg-yt-hover hover:text-white";

  const fullList = (
    <>
      {mainLinks.map((l) => (
        <Link key={l.href} href={l.href} onClick={onClose} className={`flex items-center gap-5 rounded-lg px-3 py-2 text-sm ${activeCls(l.href)}`}>
          {l.icon}
          <span>{l.label}</span>
        </Link>
      ))}
      <hr className="my-3 border-yt-border" />
      <p className="px-3 pb-1 text-sm font-semibold">Explore</p>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/?cat=${encodeURIComponent(c.name)}`}
          onClick={onClose}
          className="block rounded-lg px-3 py-2 text-sm hover:bg-yt-hover"
        >
          {c.icon ? `${c.icon} ` : ""}{c.name}
        </Link>
      ))}
    </>
  );

  const miniList = (
    <>
      {mainLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex flex-col items-center gap-1 rounded-lg px-1 py-3 text-[10px] ${activeCls(l.href)}`}
        >
          {l.icon}
          <span>{l.label === "Subscriptions" ? "Subs" : l.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop: expanded / mini rail */}
      {open ? (
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto p-3 md:block">
          {fullList}
        </aside>
      ) : (
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[76px] shrink-0 overflow-y-auto p-2 md:block">
          {miniList}
        </aside>
      )}

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-yt-bg p-3"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-glow text-lg font-extrabold tracking-tight text-white">{logoText}</span>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-yt-hover"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            {fullList}
          </aside>
        </div>
      )}
    </>
  );
}
