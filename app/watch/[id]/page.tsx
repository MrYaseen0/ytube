import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { DEMO_VIDEOS } from "@/lib/demo-data";
import type { CommentItem, Video } from "@/lib/types";
import { formatViews, timeAgo } from "@/lib/format";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCard from "@/components/VideoCard";
import Avatar from "@/components/Avatar";
import LikeButtons from "@/components/LikeButtons";
import SubscribeButton from "@/components/SubscribeButton";
import Comments from "@/components/Comments";
import WatchTracker from "@/components/WatchTracker";
import ReportButton from "@/components/ReportButton";
import SetupBanner from "@/components/SetupBanner";

function ChannelHeader({
  video,
  subCount,
  subscribed,
  enabled,
}: {
  video: Video;
  subCount: number;
  subscribed: boolean;
  enabled: boolean;
}) {
  const channel = video.profiles;
  if (!channel) return null;
  return (
    <div className="flex items-center gap-3">
      <Link href={`/channel/${channel.id}`}>
        <Avatar name={channel.username} size={40} />
      </Link>
      <div className="min-w-0">
        <Link href={`/channel/${channel.id}`} className="block truncate font-semibold hover:underline">
          {channel.username}
        </Link>
        <p className="text-xs text-yt-muted">
          {formatViews(subCount)} subscriber{subCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="ml-2">
        <SubscribeButton channelId={channel.id} subscribed={subscribed} enabled={enabled} />
      </div>
    </div>
  );
}

export default async function WatchPage({ params }: { params: { id: string } }) {
  const configured = isSupabaseConfigured();

  // ---- Demo mode: render from built-in data, interactions disabled ----
  if (!configured) {
    const video = DEMO_VIDEOS.find((v) => v.id === params.id);
    if (!video) notFound();
    const upNext = DEMO_VIDEOS.filter((v) => v.id !== video.id);
    return (
      <div>
        <SetupBanner />
        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="min-w-0 flex-1">
            <VideoPlayer src={video.video_url} poster={video.thumbnail_url} title={video.title} />
            <h1 className="mt-3 text-lg font-semibold md:text-xl">{video.title}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <ChannelHeader video={video} subCount={0} subscribed={false} enabled={false} />
              <LikeButtons videoId={video.id} likes={0} dislikes={0} myVote={0} enabled={false} />
            </div>
            <div className="mt-3 rounded-xl bg-yt-surface p-3 text-sm">
              <p className="font-semibold">
                {formatViews(video.views)} views • {timeAgo(video.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-yt-text/90">{video.description}</p>
            </div>
            <Comments videoId={video.id} initialComments={[]} enabled={false} />
          </div>
          <aside className="w-full shrink-0 xl:w-[360px]">
            <div className="flex flex-col gap-3">
              {upNext.map((v) => (
                <VideoCard key={v.id} video={v} layout="row" />
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ---- Supabase mode ----
  const supabase = createServerSupabase();
  if (!supabase) notFound();

  const { data: videoData } = await supabase
    .from("videos")
    .select("*, profiles(id, username, avatar_url)")
    .eq("id", params.id)
    .single();
  if (!videoData) notFound();
  const video = videoData as unknown as Video;

  // Count the view (RLS already hides non-published videos from strangers)
  await supabase.from("videos").update({ views: (video.views ?? 0) + 1 }).eq("id", video.id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: likeRows } = await supabase
    .from("likes")
    .select("user_id, value")
    .eq("video_id", video.id);
  const likes = (likeRows ?? []).filter((l) => (l as { value: number }).value === 1).length;
  const dislikes = (likeRows ?? []).filter((l) => (l as { value: number }).value === -1).length;
  const myVote = user
    ? (((likeRows ?? []).find((l) => (l as { user_id: string }).user_id === user.id) as { value: number } | undefined)?.value ?? 0)
    : 0;

  const { data: commentRows } = await supabase
    .from("comments")
    .select("*, profiles(id, username, avatar_url)")
    .eq("video_id", video.id)
    .order("created_at", { ascending: false });
  const comments = (commentRows ?? []) as unknown as CommentItem[];

  const { count: subCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("channel_id", video.user_id);

  let subscribed = false;
  if (user) {
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("channel_id")
      .eq("subscriber_id", user.id)
      .eq("channel_id", video.user_id)
      .maybeSingle();
    subscribed = !!subRow;
  }

  const { data: relatedRows } = await supabase
    .from("videos")
    .select("*, profiles(id, username, avatar_url)")
    .eq("status", "published")
    .eq("category", video.category)
    .neq("id", video.id)
    .order("views", { ascending: false })
    .limit(12);
  const related = (relatedRows ?? []) as unknown as Video[];

  return (
    <div>
      <WatchTracker videoId={video.id} />
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <VideoPlayer src={video.video_url} poster={video.thumbnail_url} title={video.title} />
          <h1 className="mt-3 text-lg font-semibold md:text-xl">{video.title}</h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <ChannelHeader
              video={video}
              subCount={subCount ?? 0}
              subscribed={subscribed}
              enabled={true}
            />
            <div className="flex items-center gap-2">
              <LikeButtons
                videoId={video.id}
                likes={likes}
                dislikes={dislikes}
                myVote={myVote as 1 | -1 | 0}
                enabled={true}
              />
              <ReportButton videoId={video.id} enabled={true} />
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-yt-surface p-3 text-sm">
            <p className="font-semibold">
              {formatViews((video.views ?? 0) + 1)} views • {timeAgo(video.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-yt-text/90">{video.description}</p>
          </div>
          <Comments videoId={video.id} initialComments={comments} enabled={true} />
        </div>
        <aside className="w-full shrink-0 xl:w-[360px]">
          <div className="flex flex-col gap-3">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} layout="row" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
