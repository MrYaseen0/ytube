import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Video } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import VideoCard from "@/components/VideoCard";
import SetupBanner from "@/components/SetupBanner";

export default async function HistoryPage() {
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
  if (!user) redirect("/signin?next=/history");

  const { data } = await supabase!
    .from("watch_history")
    .select("watched_at, videos(*, profiles(id, username, avatar_url))")
    .eq("user_id", user.id)
    .order("watched_at", { ascending: false })
    .limit(60);

  const rows = (data ?? []) as unknown as { watched_at: string; videos: Video | null }[];
  const items = rows.filter((r) => r.videos);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-xl font-bold">Watch history</h1>
      {items.length === 0 ? (
        <div className="mt-8 text-center text-yt-muted">
          <p>Nothing watched yet.</p>
          <p className="mt-1 text-sm">
            Videos you watch will show up here.{" "}
            <Link href="/" className="text-blue-400 hover:underline">
              Browse videos
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {items.map((r) => (
            <div key={r.videos!.id}>
              <VideoCard video={r.videos!} layout="row" />
              <p className="mt-1 pl-[172px] text-xs text-yt-muted sm:pl-[236px]">
                Watched {timeAgo(r.watched_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
