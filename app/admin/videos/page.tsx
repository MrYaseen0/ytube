import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import UploadForm from "@/components/UploadForm";
import { AdminVideoActions } from "@/components/AdminActions";
import { formatViews, timeAgo } from "@/lib/format";

function statusBadge(s: string) {
  return s === "published" ? "bg-green-800" : s === "pending" ? "bg-yellow-800" : "bg-red-800";
}

/** Admin-only video management: upload flow + full video table. */
export default async function AdminVideosPage() {
  const { user, supabase } = await requireAdmin();

  const [{ data: catRows }, { data: videoRows }] = await Promise.all([
    supabase.from("categories").select("name").order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase
      .from("videos")
      .select("id, title, status, views, category, created_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const categories = ((catRows ?? []) as { name: string }[]).map((c) => c.name);
  const videos = (videoRows ?? []) as unknown as {
    id: string;
    title: string;
    status: string;
    views: number;
    category: string;
    created_at: string;
    profiles: { username: string } | null;
  }[];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link href="/admin" className="text-sm text-yt-muted hover:text-white">
        ← Admin dashboard
      </Link>

      <div className="mt-4 rounded-xl bg-yt-surface p-5 md:p-6">
        <UploadForm userId={user.id} categories={categories} />
      </div>

      <h2 className="mb-3 mt-12 text-lg font-bold">All videos ({videos.length} latest)</h2>
      <div className="overflow-x-auto rounded-xl bg-yt-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-yt-border text-yt-muted">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-b border-yt-border last:border-0">
                <td className="max-w-xs truncate px-4 py-3">
                  <Link href={`/watch/${v.id}`} className="hover:underline">
                    {v.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-yt-muted">{v.profiles?.username ?? "-"}</td>
                <td className="px-4 py-3 text-yt-muted">{v.category}</td>
                <td className="px-4 py-3">{formatViews(v.views)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(v.status)}`}>
                    {v.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-yt-muted">{timeAgo(v.created_at)}</td>
                <td className="px-4 py-3">
                  <AdminVideoActions id={v.id} status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
