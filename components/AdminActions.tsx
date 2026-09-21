"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setVideoStatus, deleteVideo, setUserAdmin, resolveReport } from "@/lib/admin-actions";

async function runAction(
  setBusy: (b: boolean) => void,
  fn: () => Promise<void>,
  confirmText: string,
  onDone: () => void
) {
  if (confirmText && !confirm(confirmText)) return;
  setBusy(true);
  try {
    await fn();
    onDone();
  } catch (e) {
    alert(e instanceof Error ? e.message : "Action failed.");
  }
  setBusy(false);
}

export function AdminVideoActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="flex gap-2">
      {status !== "published" && (
        <button
          onClick={() => runAction(setBusy, () => setVideoStatus(id, "published"), "Approve this video?", refresh)}
          disabled={busy}
          className="rounded-full bg-green-700 px-3 py-1 text-xs font-semibold hover:bg-green-600 disabled:opacity-50"
        >
          Approve
        </button>
      )}
      {status !== "removed" && (
        <button
          onClick={() => runAction(setBusy, () => setVideoStatus(id, "removed"), "Remove this video?", refresh)}
          disabled={busy}
          className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
        >
          Remove
        </button>
      )}
      <button
        onClick={() => runAction(setBusy, () => deleteVideo(id), "Permanently delete this video and its files?", refresh)}
        disabled={busy}
        className="rounded-full bg-zinc-700 px-3 py-1 text-xs font-semibold hover:bg-zinc-600 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}

export function AdminUserActions({
  id,
  isAdmin,
  isSelf,
}: {
  id: string;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <button
      onClick={() =>
        runAction(
          setBusy,
          () => setUserAdmin(id, !isAdmin),
          `${isAdmin ? "Remove admin rights from" : "Make admin"} this user?`,
          () => router.refresh()
        )
      }
      disabled={busy || isSelf}
      title={isSelf ? "You cannot change your own admin status here" : undefined}
      className="rounded-full bg-yt-surface px-3 py-1 text-xs font-semibold hover:bg-yt-hover disabled:opacity-50"
    >
      {isAdmin ? "Remove admin" : "Make admin"}
    </button>
  );
}

export function AdminReportActions({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <button
      onClick={() => runAction(setBusy, () => resolveReport(id), "", () => router.refresh())}
      disabled={busy}
      className="rounded-full bg-green-700 px-3 py-1 text-xs font-semibold hover:bg-green-600 disabled:opacity-50"
    >
      Mark resolved
    </button>
  );
}
