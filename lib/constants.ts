/**
 * Fallback category list.
 *
 * Runtime source of truth is the `public.categories` table (read via
 * getCategories() in lib/site-settings.ts). This list is only used in demo
 * mode (no Supabase keys) or when the categories table is unreachable.
 */
export const CATEGORIES = [
  "All",
  "Music",
  "Gaming",
  "Tech",
  "News",
  "Sports",
  "Education",
] as const;
