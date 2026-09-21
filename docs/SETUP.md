# YTUBE — Setup Guide

Follow these steps once (~5 minutes). The same guide is available in-app at `/setup`.

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up / sign in.
2. **New project** → name it `ytube`, pick a region close to you, set a database password.
3. Wait until the project status is green / active.

## 2. Run the database schema

> Already ran an earlier version of `schema.sql`? **Run it again** — the script is
> idempotent and the re-run adds the `site_settings`, `categories` and
> `admin_audit` tables, the `videos.category` foreign key, and the hardened
> admin/storage RLS policies.

1. In the Supabase dashboard open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this repo, copy the entire file.
3. Paste it into the query editor and press **Run**.

This creates:

- Tables: `profiles`, `videos`, `comments`, `likes`, `subscriptions`, `reports`, `watch_history`
- Admin tables: `site_settings` (editable header/footer/homepage copy), `categories` (video categories), `admin_audit` (admin action log)
- The `handle_new_user()` trigger (auto-creates a profile on sign-up)
- The `is_admin()` helper used by RLS policies
- Row Level Security on every table (admin-only writes on site content, categories, videos)
- Storage buckets `videos` and `thumbnails` (public read) + admin-only upload policies

## 3. Seed demo content (optional but recommended)

1. **SQL Editor → New query** again.
2. Paste the entire contents of `supabase/seed.sql` and press **Run**.
3. You now have 6 demo channels and 10 demo videos using public sample MP4s.

The script is idempotent — safe to re-run.

## 4. Get your API keys

1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.

## 5. Configure the app

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

## 6. Disable email confirmation (recommended for local dev)

**Authentication → Providers → Email** → turn OFF **"Confirm email"**.
Otherwise new sign-ups must click a confirmation link before they can sign in.

## 7. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 8. Make yourself an admin

1. Sign up in the app (creates your profile row automatically).
2. Run this in the SQL Editor with your sign-up email:

```sql
UPDATE public.profiles SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
```

3. Refresh — the **Admin dashboard** link appears in your avatar menu (`/admin`).

## Troubleshooting

| Symptom                              | Fix                                                              |
| ------------------------------------ | ---------------------------------------------------------------- |
| Demo-mode banner still shows         | `.env.local` missing/wrong — restart `npm run dev` after editing |
| Upload fails with 403                | Re-run `schema.sql` (storage policies missing)                   |
| Uploaded video not visible           | `videos.status` must be `published`                              |
| "Email not confirmed" on sign-in     | Do step 6 above                                                  |
| `/admin` redirects to home           | Your profile needs `is_admin = true` (step 8)                    |
| `npm run build` fails on types       | Run `npx tsc --noEmit` to see the error; fix and rebuild         |
