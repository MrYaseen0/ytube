"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function SubscribeButton({
  channelId,
  subscribed,
  enabled,
}: {
  channelId: string;
  subscribed: boolean;
  enabled: boolean;
}) {
  const [isSubbed, setIsSubbed] = useState(subscribed);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!enabled || busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin?next=/");
        return;
      }
      if (isSubbed) {
        await supabase
          .from("subscriptions")
          .delete()
          .eq("subscriber_id", user.id)
          .eq("channel_id", channelId);
        setIsSubbed(false);
      } else {
        await supabase
          .from("subscriptions")
          .insert({ subscriber_id: user.id, channel_id: channelId });
        setIsSubbed(true);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!enabled || busy}
      title={enabled ? undefined : "Connect Supabase to subscribe"}
      className={`flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        isSubbed
          ? "bg-yt-surface text-yt-text hover:bg-yt-hover"
          : "bg-gradient-to-r from-yt-red to-yt-pink text-white shadow-neon hover:shadow-neon-lg"
      }`}
    >
      {isSubbed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
