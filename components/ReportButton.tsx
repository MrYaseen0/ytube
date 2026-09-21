"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { FlagIcon } from "./icons";

export default function ReportButton({ videoId, enabled }: { videoId: string; enabled: boolean }) {
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (!enabled || done) return null;

  async function report() {
    const reason = prompt("Why are you reporting this video?");
    if (!reason || !reason.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/signin?next=/watch/${videoId}`);
      return;
    }
    const { error } = await supabase
      .from("reports")
      .insert({ video_id: videoId, reporter_id: user.id, reason: reason.trim() });
    if (!error) {
      setDone(true);
      alert("Report submitted. Thanks - our moderators will review it.");
    } else {
      alert("Could not submit the report. Please try again.");
    }
  }

  return (
    <button
      onClick={report}
      className="flex items-center gap-1.5 rounded-full bg-yt-surface px-3 py-1.5 text-sm font-medium hover:bg-yt-hover"
    >
      <FlagIcon />
      Report
    </button>
  );
}
