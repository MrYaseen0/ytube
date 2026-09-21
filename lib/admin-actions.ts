"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin";

type AdminCtx = Awaited<ReturnType<typeof requireAdmin>>;

async function logAudit(ctx: AdminCtx, action: string, targetType: string, targetId?: string | null) {
  await ctx.supabase.from("admin_audit").insert({
    admin_id: ctx.user.id,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// ------------------------------------------------------------
// Site settings
// ------------------------------------------------------------

export async function saveSiteSetting(key: "header" | "footer" | "home", value: unknown) {
  const ctx = await requireAdmin();
  if (!isRecord(value)) throw new Error("Invalid setting value.");

  if (key === "header") {
    if (typeof value.logoText !== "string" || !value.logoText.trim()) throw new Error("Logo text is required.");
    if (
      !Array.isArray(value.navLinks) ||
      value.navLinks.some((l) => !isRecord(l) || typeof l.label !== "string" || typeof l.href !== "string")
    )
      throw new Error("Invalid nav links.");
  }
  if (key === "footer") {
    if (!Array.isArray(value.columns) || typeof value.bottomText !== "string") throw new Error("Invalid footer settings.");
    for (const c of value.columns) {
      if (!isRecord(c) || typeof c.title !== "string" || !Array.isArray(c.links)) throw new Error("Invalid footer column.");
    }
  }
  if (key === "home") {
    for (const f of ["heroTitle", "heroSubtitle", "emptyTitle", "emptySubtitle"]) {
      if (typeof value[f] !== "string") throw new Error("Invalid homepage copy.");
    }
  }

  const { error } = await ctx.supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  await logAudit(ctx, "settings.update", "site_settings", key);
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------
// Categories
// ------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}) {
  const ctx = await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required.");
  const slug = slugify(input.slug?.trim() || name);
  if (!slug) throw new Error("Could not derive a slug from the name.");

  const { data, error } = await ctx.supabase
    .from("categories")
    .insert({
      name,
      slug,
      icon: input.icon?.trim() || null,
      color: input.color?.trim() || null,
      sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(ctx, "category.create", "categories", (data as { id: string }).id);
  revalidatePath("/", "layout");
}

export async function updateCategory(
  id: string,
  input: { name: string; slug?: string; icon?: string; color?: string; sort_order?: number }
) {
  const ctx = await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required.");
  const slug = slugify(input.slug?.trim() || name);
  if (!slug) throw new Error("Could not derive a slug from the name.");

  const { error } = await ctx.supabase
    .from("categories")
    .update({
      name,
      slug,
      icon: input.icon?.trim() || null,
      color: input.color?.trim() || null,
      sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(ctx, "category.update", "categories", id);
  revalidatePath("/", "layout");
}

export async function deleteCategory(id: string) {
  const ctx = await requireAdmin();
  const { data: cat } = await ctx.supabase.from("categories").select("name").eq("id", id).single();
  const name = (cat as { name: string } | null)?.name;
  if (!name) throw new Error("Category not found.");

  const { count } = await ctx.supabase.from("videos").select("*", { count: "exact", head: true }).eq("category", name);
  if ((count ?? 0) > 0) throw new Error(`Cannot delete: ${count} video(s) still use this category.`);

  const { error } = await ctx.supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(ctx, "category.delete", "categories", id);
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------
// Videos (admin-only)
// ------------------------------------------------------------

const VIDEO_STATUSES = ["published", "pending", "removed"] as const;

export async function setVideoStatus(id: string, status: (typeof VIDEO_STATUSES)[number]) {
  const ctx = await requireAdmin();
  if (!VIDEO_STATUSES.includes(status)) throw new Error("Invalid status.");
  const { error } = await ctx.supabase.from("videos").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(ctx, "video.status", "videos", id);
  revalidatePath("/", "layout");
}

export async function deleteVideo(id: string) {
  const ctx = await requireAdmin();
  const { data: row } = await ctx.supabase.from("videos").select("video_url, thumbnail_url").eq("id", id).single();
  const v = row as { video_url: string; thumbnail_url: string | null } | null;

  const { error } = await ctx.supabase.from("videos").delete().eq("id", id);
  if (error) throw new Error(error.message);

  // Best-effort cleanup of the storage objects (ignore failures).
  try {
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
    const paths: { bucket: string; path: string }[] = [];
    if (v?.video_url.startsWith(base + "videos/")) paths.push({ bucket: "videos", path: v.video_url.slice((base + "videos/").length) });
    if (v?.thumbnail_url?.startsWith(base + "thumbnails/"))
      paths.push({ bucket: "thumbnails", path: v.thumbnail_url.slice((base + "thumbnails/").length) });
    for (const p of paths) await ctx.supabase.storage.from(p.bucket).remove([p.path]);
  } catch {
    // ignore
  }

  await logAudit(ctx, "video.delete", "videos", id);
  revalidatePath("/", "layout");
}

/** Server-side validation + insert for an admin-uploaded video. */
export async function createVideoRecord(input: {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string | null;
  duration: number;
  category: string;
}) {
  const ctx = await requireAdmin();

  const title = input.title.trim();
  if (title.length < 1 || title.length > 120) throw new Error("Title must be 1–120 characters.");
  if (input.description && input.description.length > 5000) throw new Error("Description is too long.");

  // Category must exist (videos.category is an FK into categories.name).
  const { data: cat } = await ctx.supabase.from("categories").select("name").eq("name", input.category).single();
  if (!cat) throw new Error("Unknown category — pick one from the list.");

  // URLs must point at our own storage buckets (admin-uploaded files only).
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
  if (!input.video_url.startsWith(base + "videos/")) throw new Error("Invalid video file URL.");
  if (input.thumbnail_url && !input.thumbnail_url.startsWith(base + "thumbnails/"))
    throw new Error("Invalid thumbnail file URL.");

  const duration = Math.max(0, Math.round(Number(input.duration) || 0));

  const { data, error } = await ctx.supabase
    .from("videos")
    .insert({
      user_id: ctx.user.id,
      title,
      description: input.description?.trim() || null,
      video_url: input.video_url,
      thumbnail_url: input.thumbnail_url ?? null,
      duration,
      category: input.category,
      status: "published",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit(ctx, "video.publish", "videos", (data as { id: string }).id);
  revalidatePath("/", "layout");
  return (data as { id: string }).id;
}

// ------------------------------------------------------------
// Users & reports
// ------------------------------------------------------------

export async function setUserAdmin(id: string, makeAdmin: boolean) {
  const ctx = await requireAdmin();
  if (id === ctx.user.id) throw new Error("You cannot change your own admin status here.");
  const { error } = await ctx.supabase.from("profiles").update({ is_admin: makeAdmin }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(ctx, makeAdmin ? "user.promote" : "user.demote", "profiles", id);
  revalidatePath("/", "layout");
}

export async function resolveReport(id: string) {
  const ctx = await requireAdmin();
  const { error } = await ctx.supabase.from("reports").update({ status: "resolved" }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(ctx, "report.resolve", "reports", id);
  revalidatePath("/", "layout");
}
