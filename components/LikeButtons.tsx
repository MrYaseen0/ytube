"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { formatViews } from "@/lib/format";
import { ThumbUpIcon, ThumbDownIcon } from "./icons";

export default function LikeButtons({
  videoId,
  likes,
  dislikes,
  myVote,
  enabled,
}: {
  videoId: string;
  likes: number;
  dislikes: number;
  myVote: 1 | -1 | 0;
  enabled: boolean;
}) {
  const [state, setState] = useState({ likes, dislikes, vote: myVote });
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function vote(value: 1 | -1) {
    if (!enabled || busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?next=/watch/${videoId}`);
        return;
      }
      const newValue = state.vote === value ? 0 : value;
      if (newValue === 0) {
        await supabase.from("likes").delete().eq("video_id", videoId).eq("user_id", user.id);
      } else {
        await supabase.from("likes").upsert({ video_id: videoId, user_id: user.id, value: newValue });
      }
      setState((c) => ({
        likes: c.likes + (newValue === 1 ? 1 : 0) - (c.vote === 1 ? 1 : 0),
        dislikes: c.dislikes + (newValue === -1 ? 1 : 0) - (c.vote === -1 ? 1 : 0),
        vote: newValue,
      }));
    } finally {
      setBusy(false);
    }
  }

  const base = "flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors";
  return (
    <div
      className="flex items-center overflow-hidden rounded-full bg-yt-surface"
      title={enabled ? undefined : "Connect Supabase to enable likes"}
    >
      <button
        onClick={() => vote(1)}
        disabled={!enabled || busy}
        className={`${base} hover:bg-yt-hover disabled:cursor-not-allowed disabled:opacity-60 ${
          state.vote === 1 ? "text-glow-sm text-yt-pink" : "text-yt-text"
        }`}
        aria-label="Like"
      >
        <ThumbUpIcon />
        <span>{formatViews(state.likes)}</span>
      </button>
      <div className="h-6 w-px bg-yt-border" />
      <button
        onClick={() => vote(-1)}
        disabled={!enabled || busy}
        className={`${base} hover:bg-yt-hover disabled:cursor-not-allowed disabled:opacity-60 ${
          state.vote === -1 ? "text-glow-sm text-yt-pink" : "text-yt-text"
        }`}
        aria-label="Dislike"
      >
        <ThumbDownIcon />
        <span>{formatViews(state.dislikes)}</span>
      </button>
    </div>
  );
}
