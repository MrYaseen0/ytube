export default function VideoPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string | null;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <video
        src={src}
        poster={poster ?? undefined}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full"
        aria-label={title}
      />
    </div>
  );
}
