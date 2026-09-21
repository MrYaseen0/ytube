import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatViews, timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import { AdminUserActions, AdminReportActions } from "@/components/AdminActions";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-yt-surface p-5">
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-yt-muted">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function AdminTile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl bg-yt-surface p-5 transition-all hover:bg-yt-hover hover:shadow-neon-sm"
    >
      <p className="font-bold group-hover:text-yt-pink">{title} →</p>
      <p className="mt-1 text-sm text-yt-muted">{desc}</p>
    </Link>
  );
}

export default async function AdminPage() {
  const { user, supabase } = await requireAdmin();

  const [{ count: userCount }, { count: videoCount }, { count: openReports }, { data: viewRows }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("videos").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("videos").select("views"),
    ]);
  const totalViews = ((viewRows ?? []) as { views: number }[]).reduce((s, v) => s + (v.views ?? 0), 0);

  const { data: userRows } = await supabase
    .from("profiles")
    .select("id, username, is_admin, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: reportRows } = await supabase
    .from("reports")
    .select("id, reason, status, created_at, video_id, reporter_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  // Resolve titles/reporters for the open reports
  const reportVideoIds = Array.from(new Set(((reportRows ?? []) as { video_id: string }[]).map((r) => r.video_id)));
  const reportUserIds = Array.from(new Set(((reportRows ?? []) as { reporter_id: string }[]).map((r) => r.reporter_id)));
  const { data: reportVideos } = reportVideoIds.length
    ? await supabase.from("videos").select("id, title").in("id", reportVideoIds)
    : { data: [] };
  const { data: reportUsers } = reportUserIds.length
    ? await supabase.from("profiles").select("id, username").in("id", reportUserIds)
    : { data: [] };
  const videoTitle = new Map(((reportVideos ?? []) as { id: string; title: string }[]).map((v) => [v.id, v.title]));
  const userName = new Map(((reportUsers ?? []) as { id: string; username: string }[]).map((u) => [u.id, u.username]));

  const users = (userRows ?? []) as { id: string; username: string; is_admin: boolean; created_at: string }[];
  const reports = (reportRows ?? []) as unknown as {
    id: string; reason: string; created_at: string; video_id: string; reporter_id: string;
  }[];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total users" value={formatViews(userCount ?? 0)} />
        <StatCard label="Total videos" value={formatViews(videoCount ?? 0)} />
        <StatCard label="Total views" value={formatViews(totalViews)} />
        <StatCard label="Open reports" value={formatViews(openReports ?? 0)} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminTile href="/admin/videos" title="Videos & uploads" desc="Publish new videos, approve or remove existing ones." />
        <AdminTile href="/admin/categories" title="Categories" desc="Create, rename, reorder and delete video categories." />
        <AdminTile href="/admin/settings" title="Site settings" desc="Edit the header, footer and homepage copy." />
        <AdminTile href="/admin/audit" title="Audit log" desc="Every admin action, who did it and when." />
      </div>

      <Section title={`Reports queue (${reports.length} open)`}>
        {reports.length === 0 ? (
          <p className="text-sm text-yt-muted">No open reports. All clear.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-yt-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-yt-border text-yt-muted">
                  <th className="px-4 py-3 font-medium">Video</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Reporter</th>
                  <th className="px-4 py-3 font-medium">Filed</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-yt-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/watch/${r.video_id}`} className="text-blue-400 hover:underline">
                        {videoTitle.get(r.video_id) ?? "Unknown video"}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">{r.reason}</td>
                    <td className="px-4 py-3">{userName.get(r.reporter_id) ?? "unknown"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-yt-muted">{timeAgo(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <AdminReportActions id={r.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title={`Users (${users.length} latest)`}>
        <div className="overflow-x-auto rounded-xl bg-yt-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-yt-border text-yt-muted">
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-yt-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.username} size={28} />
                      <Link href={`/channel/${u.id}`} className="hover:underline">
                        {u.username}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="rounded-full bg-purple-800 px-2.5 py-0.5 text-xs font-semibold">admin</span>
                    ) : (
                      <span className="text-yt-muted">user</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-yt-muted">{timeAgo(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <AdminUserActions id={u.id} isAdmin={u.is_admin} isSelf={u.id === user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
