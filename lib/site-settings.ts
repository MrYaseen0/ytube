import { cache } from "react";
import { createServerSupabase } from "./supabase-server";
import { CATEGORIES } from "./constants";
import type { Category } from "./types";

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: NavLinkItem[];
}

export interface SiteSettings {
  header: { logoText: string; navLinks: NavLinkItem[] };
  footer: { columns: FooterColumn[]; bottomText: string };
  home: { heroTitle: string; heroSubtitle: string; emptyTitle: string; emptySubtitle: string };
}

/** Sensible defaults used in demo mode and when a setting row is missing. */
export const DEFAULT_SETTINGS: SiteSettings = {
  header: { logoText: "YTUBE", navLinks: [] },
  footer: {
    columns: [
      {
        title: "Company",
        links: [
          { label: "About", href: "/" },
          { label: "Press", href: "/" },
          { label: "Careers", href: "/" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Help", href: "/" },
          { label: "Terms", href: "/" },
          { label: "Privacy", href: "/" },
        ],
      },
      {
        title: "Follow",
        links: [
          { label: "Blog", href: "/" },
          { label: "Community", href: "/" },
        ],
      },
    ],
    bottomText: "© 2026 YTUBE. All rights reserved.",
  },
  home: {
    heroTitle: "Welcome to YTUBE",
    heroSubtitle: "Fresh uploads across every category — picked and published by our team.",
    emptyTitle: "No videos here yet",
    emptySubtitle: "Try another category, or check back soon for new uploads.",
  },
};

const SETTING_KEYS = ["header", "footer", "home"] as const;

function normalizeNavLinks(v: unknown): NavLinkItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((l): l is NavLinkItem => !!l && typeof l === "object" && typeof (l as NavLinkItem).label === "string" && typeof (l as NavLinkItem).href === "string")
    .map((l) => ({ label: l.label, href: l.href }));
}

function normalizeColumns(v: unknown): FooterColumn[] {
  if (!Array.isArray(v)) return DEFAULT_SETTINGS.footer.columns;
  return v.map((c) => ({
    title: typeof (c as FooterColumn)?.title === "string" ? (c as FooterColumn).title : "Links",
    links: normalizeNavLinks((c as FooterColumn)?.links),
  }));
}

/**
 * Server-side read of site_settings, merged over DEFAULT_SETTINGS.
 * Public read is allowed by RLS; falls back to defaults on any failure.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = createServerSupabase();
  if (!supabase) return DEFAULT_SETTINGS;
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [...SETTING_KEYS]);
    if (error || !data) return DEFAULT_SETTINGS;
    const byKey = new Map((data as { key: string; value: unknown }[]).map((r) => [r.key, r.value]));
    const headerRaw = byKey.get("header");
    const footerRaw = byKey.get("footer");
    const homeRaw = byKey.get("home");
    const header = headerRaw && typeof headerRaw === "object" ? (headerRaw as Record<string, unknown>) : {};
    const footer = footerRaw && typeof footerRaw === "object" ? (footerRaw as Record<string, unknown>) : {};
    const home = homeRaw && typeof homeRaw === "object" ? (homeRaw as Record<string, unknown>) : {};
    return {
      header: {
        logoText: typeof header.logoText === "string" && header.logoText.trim() ? header.logoText : DEFAULT_SETTINGS.header.logoText,
        navLinks: normalizeNavLinks(header.navLinks),
      },
      footer: {
        columns: normalizeColumns(footer.columns),
        bottomText: typeof footer.bottomText === "string" ? footer.bottomText : DEFAULT_SETTINGS.footer.bottomText,
      },
      home: {
        heroTitle: typeof home.heroTitle === "string" ? home.heroTitle : DEFAULT_SETTINGS.home.heroTitle,
        heroSubtitle: typeof home.heroSubtitle === "string" ? home.heroSubtitle : DEFAULT_SETTINGS.home.heroSubtitle,
        emptyTitle: typeof home.emptyTitle === "string" ? home.emptyTitle : DEFAULT_SETTINGS.home.emptyTitle,
        emptySubtitle: typeof home.emptySubtitle === "string" ? home.emptySubtitle : DEFAULT_SETTINGS.home.emptySubtitle,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

function fallbackCategories(): Category[] {
  return (CATEGORIES as readonly string[])
    .filter((c) => c !== "All")
    .map((name, i) => ({
      id: `fallback-${i}`,
      name,
      slug: name.toLowerCase(),
      icon: null,
      color: null,
      sort_order: i,
      created_at: "",
    }));
}

/**
 * Server-side read of categories, ordered for display.
 * Falls back to the built-in list in demo mode or when the table is missing.
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createServerSupabase();
  if (!supabase) return fallbackCategories();
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data || data.length === 0) return fallbackCategories();
    return data as Category[];
  } catch {
    return fallbackCategories();
  }
});
