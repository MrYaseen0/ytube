import Link from "next/link";

const steps = [
  {
    title: "1. Create a Supabase project",
    body: "Go to supabase.com, sign up, and create a new project. Wait until the project finishes provisioning (green \"active\" status).",
  },
  {
    title: "2. Run the database schema",
    body: "In the Supabase dashboard open SQL Editor -> New query, paste the full contents of supabase/schema.sql from this repo, and press Run. This creates all tables (profiles, videos, comments, likes, subscriptions, reports, watch_history), the storage buckets (videos, thumbnails), and all row-level security policies.",
  },
  {
    title: "3. Seed demo content (optional)",
    body: "In the SQL Editor run a second query with the contents of supabase/seed.sql. This adds 6 demo channels and 10 demo videos so the site looks alive immediately.",
  },
  {
    title: "4. Copy your API keys",
    body: "Go to Project Settings -> API. Copy the Project URL and the anon public key into a new file called .env.local in the project root (copy .env.example first):",
    code: "NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here",
  },
  {
    title: "5. Disable email confirmation (recommended for local dev)",
    body: "Go to Authentication -> Providers -> Email and turn OFF \"Confirm email\". Otherwise new sign-ups must click a confirmation link before they can sign in.",
  },
  {
    title: "6. Make yourself an admin",
    body: "Sign up once in the app, then run this in the SQL Editor (replace with your sign-up email):",
    code: "UPDATE public.profiles SET is_admin = true\nWHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');",
  },
  {
    title: "7. Run the app",
    body: "Install dependencies and start the dev server:",
    code: "npm install\nnpm run dev",
  },
];

export default function SetupPage() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <h1 className="text-2xl font-bold">
        Connect <span className="text-glow-sm text-yt-pink">Supabase</span> to YTUBE
      </h1>
      <p className="mt-2 text-sm text-yt-muted">
        YTUBE stores everything in Supabase: Postgres for data, Auth for sign-in, and Storage for
        video/thumbnail files. Follow these steps once - it takes about 5 minutes.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {steps.map((s) => (
          <div key={s.title} className="rounded-xl bg-yt-surface p-5">
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-yt-text/90">{s.body}</p>
            {s.code && (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-3 text-xs leading-relaxed text-green-300">
                {s.code}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-yt-border p-5 text-sm">
        <p className="font-semibold">Troubleshooting</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-yt-muted">
          <li>Uploads failing with 403? Make sure the storage policies from schema.sql ran successfully.</li>
          <li>Videos not visible after upload? Check the video's status column is "published".</li>
          <li>Sign-up works but sign-in says "Email not confirmed"? Disable "Confirm email" (step 5).</li>
        </ul>
      </div>

      <Link href="/" className="mt-6 inline-block rounded-full bg-gradient-to-r from-yt-red to-yt-pink px-5 py-2 text-sm font-semibold text-white shadow-neon hover:shadow-neon-lg">
        Back to home
      </Link>
    </div>
  );
}
