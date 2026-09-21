import Link from "next/link";
import type { Video } from "@/lib/types";
import { formatViews, timeAgo, formatDuration } from "@/lib/format";
import Avatar from "./Avatar";

export default function VideoCard({ video, layout = "grid" }: { video: Video; layout?: "grid" | "row" }) {
  const channel = video.profiles;

  if (layout === "row") {
    return (
      <div className="flex gap-3">
        <Link href={`/watch/${video.id}`} className="relative w-40 shrink-0 sm:w-56">
          <div className="aspect-video overflow-hidden rounded-lg bg-yt-surface ring-1 ring-white/5 transition-all duration-200 hover:shadow-neon hover:ring-yt-pink/50">
            {video.thumbnail_url && (
              <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
            )}
          </div>
          {video.duration ? (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[11px] font-medium">
              {formatDuration(video.duration)}
            </span>
          ) : null}
        </Link>
        <div className="min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{video.title}</h3>
          </Link>
          {channel && (
            <Link href={`/channel/${channel.id}`} className="mt-1 block truncate text-xs text-yt-muted hover:text-white">
              {channel.username}
            </Link>
          )}
          <p className="text-xs text-yt-muted">
            {formatViews(video.views)} views • {timeAgo(video.created_at)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/watch/${video.id}`}>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-yt-surface ring-1 ring-white/5 transition-all duration-200 hover:shadow-neon hover:ring-yt-pink/50">
          {video.thumbnail_url && (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          )}
          {video.duration ? (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium">
              {formatDuration(video.duration)}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="mt-3 flex gap-3">
        {channel && (
          <Link href={`/channel/${channel.id}`} className="shrink-0">
            <Avatar name={channel.username} size={36} />
          </Link>
        )}
        <div className="min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{video.title}</h3>
          </Link>
          {channel && (
            <Link href={`/channel/${channel.id}`} className="mt-1 block truncate text-sm text-yt-muted hover:text-white">
              {channel.username}
            </Link>
          )}
          <p className="text-sm text-yt-muted">
            {formatViews(video.views)} views • {timeAgo(video.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
