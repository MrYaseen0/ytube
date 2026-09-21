import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { getCategories, getSiteSettings } from "@/lib/site-settings";
import { DEMO_VIDEOS } from "@/lib/demo-data";
import type { Video, Category } from "@/lib/types";
import VideoCard from "@/components/VideoCard";
import SetupBanner from "@/components/SetupBanner";

export default async function Home({ searchParams }: { searchParams: { cat?: string } }) {
  const configured = isSupabaseConfigured();
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()]);

  const names = categories.map((c) => c.name);
  const rawCat = searchParams.cat ?? "All";
  const cat = rawCat === "All" || names.includes(rawCat) ? rawCat : "All";

  let videos: Video[] = [];
  if (configured) {
    const supabase = createServerSupabase();
    if (supabase) {
      let query = supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(48);
      if (cat !== "All") query = query.eq("category", cat);
      const { data } = await query;
      videos = ((data ?? []) as unknown as Video[]);
    }
  } else {
    videos = DEMO_VIDEOS.filter((v) => cat === "All" || v.category === cat);
  }

  const chips: ({ id: string; name: string; color: string | null } | { id: string; name: "All"; color: null })[] = [
    { id: "all", name: "All", color: null },
    ...categories.map((c: Category) => ({ id: c.id, name: c.name, color: c.color })),
  ];

  return (
    <div>
      {!configured && <SetupBanner />}

      {settings.home.heroTitle && (
        <div className="mb-2">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{settings.home.heroTitle}</h1>
          {settings.home.heroSubtitle && <p className="mt-1 text-sm text-yt-muted">{settings.home.heroSubtitle}</p>}
        </div>
      )}

      <div className="sticky top-14 z-10 -mx-4 mb-4 bg-yt-bg/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {chips.map((c) => (
            <Link
              key={c.id}
              href={c.name === "All" ? "/" : `/?cat=${encodeURIComponent(c.name)}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                cat === c.name
                  ? "bg-gradient-to-r from-yt-red to-yt-pink text-white shadow-neon-sm"
                  : "bg-yt-surface text-yt-text hover:bg-yt-hover"
              }`}
            >
              {c.color && c.name !== "All" && (
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} aria-hidden />
              )}
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="mt-16 text-center text-yt-muted">
          <p className="text-lg font-semibold text-yt-text">{settings.home.emptyTitle}</p>
          <p className="mt-1 text-sm">{settings.home.emptySubtitle}</p>
        </div>
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
