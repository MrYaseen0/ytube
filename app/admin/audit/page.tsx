import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/format";
import type { AdminAuditItem } from "@/lib/types";

export default async function AdminAuditPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("admin_audit")
    .select("id, admin_id, action, target_type, target_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const items = ((rows ?? []) as AdminAuditItem[]);
  const adminIds = Array.from(new Set(items.map((i) => i.admin_id)));
  const { data: admins } = adminIds.length
    ? await supabase.from("profiles").select("id, username").in("id", adminIds)
    : { data: [] };
  const adminName = new Map(((admins ?? []) as { id: string; username: string }[]).map((a) => [a.id, a.username]));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link href="/admin" className="text-sm text-yt-muted hover:text-white">
        ← Admin dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Audit log</h1>
      <p className="mt-1 text-sm text-yt-muted">
        Every privileged action: settings changes, video publish/remove, category changes, report resolutions.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl bg-yt-surface">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-yt-border text-yt-muted">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Target ID</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-yt-muted">
                  No admin actions logged yet.
                </td>
              </tr>
            )}
            {items.map((i) => (
              <tr key={i.id} className="border-b border-yt-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-yt-muted">{timeAgo(i.created_at)}</td>
                <td className="px-4 py-3">{adminName.get(i.admin_id) ?? i.admin_id.slice(0, 8)}</td>
                <td className="px-4 py-3">
                  <code className="rounded bg-yt-bg px-2 py-0.5 text-xs text-yt-pink">{i.action}</code>
                </td>
                <td className="px-4 py-3 text-yt-muted">{i.target_type}</td>
                <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-yt-muted">{i.target_id ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
