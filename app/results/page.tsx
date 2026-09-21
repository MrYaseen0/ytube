import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { DEMO_VIDEOS } from "@/lib/demo-data";
import type { Video } from "@/lib/types";
import VideoCard from "@/components/VideoCard";
import SetupBanner from "@/components/SetupBanner";

export default async function ResultsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const configured = isSupabaseConfigured();

  let videos: Video[] = [];
  let searched = false;

  if (q) {
    searched = true;
    if (configured) {
      const supabase = createServerSupabase();
      if (supabase) {
        const clean = q.replace(/[%_]/g, "");
        const { data } = await supabase
          .from("videos")
          .select("*, profiles(id, username, avatar_url)")
          .eq("status", "published")
          .or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
          .order("views", { ascending: false })
          .limit(30);
        videos = (data ?? []) as unknown as Video[];
      }
    } else {
      const lower = q.toLowerCase();
      videos = DEMO_VIDEOS.filter(
        (v) =>
          v.title.toLowerCase().includes(lower) ||
          (v.description ?? "").toLowerCase().includes(lower) ||
          v.category.toLowerCase().includes(lower)
      );
    }
  }

  return (
    <div>
      {!configured && <SetupBanner />}

      {!searched ? (
        <div className="mt-16 text-center text-yt-muted">
          <p className="text-lg font-semibold text-yt-text">Search YTUBE</p>
          <p className="mt-1 text-sm">Type something in the search bar above to find videos.</p>
        </div>
      ) : (
        <>
          <h1 className="mb-4 text-lg font-semibold">
            {videos.length} result{videos.length === 1 ? "" : "s"} for "{q}"
          </h1>
          {videos.length === 0 ? (
            <div className="mt-8 text-center text-yt-muted">
              <p>No videos matched your search.</p>
              <p className="mt-1 text-sm">
                Try different keywords or <Link href="/" className="text-blue-400 hover:underline">browse the home feed</Link>.
              </p>
            </div>
          ) : (
            <div className="flex max-w-4xl flex-col gap-4">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} layout="row" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
