import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { DEMO_CHANNELS, DEMO_VIDEOS } from "@/lib/demo-data";
import type { Profile, Video } from "@/lib/types";
import { formatViews } from "@/lib/format";
import Avatar from "@/components/Avatar";
import VideoCard from "@/components/VideoCard";
import SubscribeButton from "@/components/SubscribeButton";
import SetupBanner from "@/components/SetupBanner";

export default async function ChannelPage({ params }: { params: { id: string } }) {
  const configured = isSupabaseConfigured();

  let profile: Profile | null = null;
  let videos: Video[] = [];
  let subCount = 0;
  let subscribed = false;

  if (!configured) {
    profile = DEMO_CHANNELS.find((c) => c.id === params.id) ?? null;
    if (!profile) notFound();
    videos = DEMO_VIDEOS.filter((v) => v.user_id === profile!.id);
  } else {
    const supabase = createServerSupabase();
    if (!supabase) notFound();

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .single();
    if (!profileData) notFound();
    profile = profileData as Profile;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let videoQuery = supabase
      .from("videos")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (!user || user.id !== profile.id) {
      videoQuery = videoQuery.eq("status", "published");
    }
    const { data: videoRows } = await videoQuery;
    videos = ((videoRows ?? []) as unknown as Video[]).map((v) => ({ ...v, profiles: profile }));

    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", profile.id);
    subCount = count ?? 0;

    if (user && user.id !== profile.id) {
      const { data: subRow } = await supabase
        .from("subscriptions")
        .select("channel_id")
        .eq("subscriber_id", user.id)
        .eq("channel_id", profile.id)
        .maybeSingle();
      subscribed = !!subRow;
    }
  }

  return (
    <div>
      {!configured && <SetupBanner />}

      <div className="h-32 w-full rounded-xl bg-gradient-to-r from-[#1c0409] via-[#7a1020] to-[#ff4d6d] shadow-neon-sm md:h-44" />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar name={profile.username} size={80} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold md:text-2xl">{profile.username}</h1>
          <p className="text-sm text-yt-muted">
            {formatViews(subCount)} subscriber{subCount === 1 ? "" : "s"} • {videos.length} video{videos.length === 1 ? "" : "s"}
          </p>
        </div>
        <SubscribeButton channelId={profile.id} subscribed={subscribed} enabled={configured} />
      </div>

      <hr className="my-4 border-yt-border" />

      <h2 className="mb-4 text-base font-semibold">Videos</h2>
      {videos.length === 0 ? (
        <p className="text-sm text-yt-muted">This channel hasn't uploaded any videos yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
