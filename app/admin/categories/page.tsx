import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import CategoryManager from "@/components/CategoryManager";
import type { Category } from "@/lib/types";

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const categories = ((data ?? []) as Category[]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link href="/admin" className="text-sm text-yt-muted hover:text-white">
        ← Admin dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-yt-muted">
        These power the homepage filter chips, the sidebar Explore list and the upload form.
      </p>
      <div className="mt-6">
        <CategoryManager initial={categories} />
      </div>
    </div>
  );
}
