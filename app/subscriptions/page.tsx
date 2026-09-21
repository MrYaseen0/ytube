import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Video } from "@/lib/types";
import VideoCard from "@/components/VideoCard";
import SetupBanner from "@/components/SetupBanner";

export default async function SubscriptionsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <SetupBanner />
      </div>
    );
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) redirect("/signin?next=/subscriptions");

  const { data: subs } = await supabase!
    .from("subscriptions")
    .select("channel_id")
    .eq("subscriber_id", user.id);
  const channelIds = ((subs ?? []) as { channel_id: string }[]).map((s) => s.channel_id);

  let videos: Video[] = [];
  if (channelIds.length > 0) {
    const { data } = await supabase!
      .from("videos")
      .select("*, profiles(id, username, avatar_url)")
      .eq("status", "published")
      .in("user_id", channelIds)
      .order("created_at", { ascending: false })
      .limit(48);
    videos = (data ?? []) as unknown as Video[];
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Latest from your subscriptions</h1>
      {videos.length === 0 ? (
        <div className="mt-8 text-center text-yt-muted">
          <p>Nothing here yet.</p>
          <p className="mt-1 text-sm">
            Subscribe to channels and their newest uploads will appear here.{" "}
            <Link href="/" className="text-blue-400 hover:underline">
              Find videos
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
