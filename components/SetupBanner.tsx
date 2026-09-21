import Link from "next/link";

export default function SetupBanner() {
  return (
    <div className="mb-4 rounded-xl border border-yt-red/50 bg-[#23060c]/80 p-4 text-sm shadow-neon-sm">
      <p className="font-semibold text-yt-rose">Supabase is not connected - running in demo mode</p>
      <p className="mt-1 text-yt-rose/70">
        You are seeing built-in demo videos. Connect a Supabase project to unlock sign-in,
        uploads, comments, likes, subscriptions and the admin dashboard.
      </p>
      <Link
        href="/setup"
        className="mt-3 inline-block rounded-full bg-gradient-to-r from-yt-red to-yt-pink px-4 py-1.5 font-semibold text-white shadow-neon hover:shadow-neon-lg"
      >
        How to connect Supabase
      </Link>
    </div>
  );
}
