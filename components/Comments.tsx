"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import type { CommentItem } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import Avatar from "./Avatar";

export default function Comments({
  videoId,
  initialComments,
  enabled,
}: {
  videoId: string;
  initialComments: CommentItem[];
  enabled: boolean;
}) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("you");
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();
        if (p) setUsername((p as { username: string }).username);
      }
    });
  }, [enabled]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    if (!user) {
      router.push(`/signin?next=/watch/${videoId}`);
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .insert({ video_id: videoId, user_id: user.id, body: text })
        .select("*")
        .single();
      if (!error && data) {
        const row = data as CommentItem;
        setComments((c) => [
          { ...row, profiles: { id: user.id, username, avatar_url: null, is_admin: false, created_at: "" } },
          ...c,
        ]);
        setBody("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", id);
    setComments((c) => c.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-6">
      <h2 className="text-base font-semibold">{comments.length} Comments</h2>

      {enabled ? (
        <form onSubmit={submit} className="mt-4 flex gap-3">
          <Avatar name={username} size={36} />
          <div className="flex-1">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment..."
              maxLength={1000}
              className="w-full border-b border-yt-border bg-transparent pb-1 text-sm outline-none transition-colors placeholder:text-yt-muted focus:border-yt-pink"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBody("")}
                className="flex min-h-[44px] items-center rounded-full px-4 py-1.5 text-sm font-medium hover:bg-yt-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!body.trim() || busy}
                className="flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-yt-red to-yt-pink px-4 py-1.5 text-sm font-semibold text-white shadow-neon-sm disabled:opacity-40 disabled:shadow-none"
              >
                Comment
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-sm text-yt-muted">Connect Supabase and sign in to join the discussion.</p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.profiles?.username ?? "?"} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-yt-muted">
                <span className="font-semibold text-yt-text">@{c.profiles?.username ?? "unknown"}</span>
                {"  "}
                {timeAgo(c.created_at)}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
              {user && c.user_id === user.id && (
                <button
                  onClick={() => remove(c.id)}
                  className="mt-1 text-xs text-yt-muted hover:text-white"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-yt-muted">No comments yet. Be the first!</p>}
      </div>
    </section>
  );
}
