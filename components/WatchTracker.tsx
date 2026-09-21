"use client";

import { useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

/** Records the current video in the signed-in user's watch history. Renders nothing. */
export default function WatchTracker({ videoId }: { videoId: string }) {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      await supabase.from("watch_history").upsert(
        { user_id: user.id, video_id: videoId, watched_at: new Date().toISOString() },
        { onConflict: "user_id,video_id" }
      );
    });
  }, [videoId]);

  return null;
}
