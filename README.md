<div align="center">

# 🔺 YTUBE

**Watch. Upload. Broadcast yourself.**

A full-stack YouTube clone with a deep-red / hot-pink neon identity —
accounts, channels, uploads, likes, comments, subscriptions and a full admin dashboard.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%7C%20Auth%20%7C%20Storage-3ecf8e?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-c1121f)

</div>

---

## ✨ Feature highlights

| Area | What you get |
| ---- | ------------ |
| 🏠 **Home feed** | Responsive video grid with category chips (admin-managed categories) + editable hero copy |
| ▶️ **Watch page** | HTML5 player, live view counter, like/dislike, subscribe, comments, report, up-next recommendations |
| 🔍 **Search** | Title + description search at `/results?q=…` |
| 📺 **Channels** | Gradient banner, avatar, subscriber count, subscribe button, video grid |
| ⬆️ **Admin-only upload** | Video + thumbnail upload in `/admin/videos` with a **real progress bar**, file validation (video ≤ 500 MB, image ≤ 5 MB), auto duration detection |
| 🔔 **Subscriptions feed** | Latest uploads from channels you follow |
| 🕘 **Watch history** | Every video you watch, logged per account |
| 🛡️ **Admin dashboard** | Stats, video approve/remove/delete, user admin toggle, reports queue, **category CRUD**, **site settings editor** (header/footer/homepage), **audit log** |
| 🎨 **Neon theme** | Deep maroon + crimson + hot-pink glow identity; showcase split-layout auth pages |
| 🧪 **Demo mode** | No Supabase keys? The whole UI still runs on built-in demo videos |

Full list: [`docs/FEATURES.md`](docs/FEATURES.md) · Roadmap: [`docs/PLAN.md`](docs/PLAN.md) · Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## 🧰 Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS 3 with a custom `yt` theme (neon shadows, glow utilities)
- **Backend:** Supabase — Postgres (RLS), Auth, Storage
- **Data layer:** React Server Components + `@supabase/ssr` cookie client; browser mutations via the browser client
- **Video:** native HTML5 playback; public sample MP4s for seed content

## 🚀 Quick start

```bash
# 1. Install
npm install

# 2. Configure (see "Environment" below)
cp .env.example .env.local

# 3. Run
npm run dev
```

Open **http://localhost:3000**. Without Supabase keys you'll land in **demo mode**
(demo videos + a setup banner) — everything is clickable and viewable instantly.

## 🔑 Environment

| Variable | Where to find it |
| -------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` public key |

Copy `.env.example` → `.env.local` and paste both values. Restart the dev server
after editing.

## 🗄️ Supabase setup (one time, ~5 min)

1. **Create a project** at [supabase.com](https://supabase.com) (free tier works).
2. **SQL Editor → New query** → paste the full contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Creates all 7 tables, the sign-up trigger, the `is_admin()` helper, every RLS
   policy, and the `videos` / `thumbnails` storage buckets with policies.
3. **SQL Editor → New query** → paste [`supabase/seed.sql`](supabase/seed.sql) → **Run**.
   Adds 6 demo channels + 10 demo videos (idempotent — safe to re-run).
4. **Authentication → Providers → Email** → turn **OFF** "Confirm email"
   (recommended for local dev; otherwise sign-ups must click a confirmation link).
5. **Make yourself admin** — sign up in the app once, then run:
   ```sql
   UPDATE public.profiles SET is_admin = true
   WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
   ```
   The **Admin dashboard** link appears in your avatar menu.

Detailed guide (also in-app at `/setup`): [`docs/SETUP.md`](docs/SETUP.md)

## 🗂️ Project structure

```
ytube/
├── app/                    # Routes: home, watch/[id], results, channel/[id],
│                           # signin, signup, history, subscriptions,
│                           # admin (dashboard, videos, categories, settings, audit), setup
├── components/             # Navbar, Sidebar, Footer, VideoCard, VideoPlayer, Comments,
│                           # LikeButtons, SubscribeButton, UploadForm, AuthForms,
│                           # AdminActions, SettingsEditor, CategoryManager…
├── lib/                    # Supabase clients, requireAdmin(), server actions, site settings,
│                           # types, formatters, demo data
├── middleware.ts           # guards /upload, /history, /subscriptions, /admin
├── supabase/
│   ├── schema.sql          # Postgres schema + RLS + storage
│   └── seed.sql            # demo channels + videos
├── docs/                   # PLAN, SETUP, FEATURES, ARCHITECTURE
└── tailwind.config.ts      # yt palette + neon shadows
```

## 🗺️ Roadmap (v2)

Memberships & Stripe billing · playlists · notifications · live streaming ·
comment replies · video transcoding/HLS · full-text search + trending ·
per-channel analytics · mobile apps · Urdu localization.

## 🔒 Security notes

- Admin checks are enforced server-side only via `requireAdmin()` (`lib/admin.ts`),
  used on every `/admin` page and every privileged server action. Client-side
  flags and middleware are UX conveniences, not the gate.
- Row Level Security is on for every table; admins are checked via the
  `SECURITY DEFINER` `is_admin()` function (no policy recursion).
  `site_settings`, `categories` and `videos` are admin-write-only; `admin_audit`
  is admin-only and append-only.
- Storage uploads are admin-only with an RLS extension allowlist; the server
  action re-validates MIME/size limits (video ≤ 500 MB, thumbnail ≤ 5 MB),
  category existence and storage URL origin.
- Every privileged action is written to `admin_audit` (viewable at `/admin/audit`).
- Never commit `.env.local` — only the `NEXT_PUBLIC_*` anon key is used; there
  is no service-role key in the app, so the database (RLS) is the final authority.

## 📄 License

MIT — free to use, modify and distribute. See [LICENSE](LICENSE) (or treat this
notice as the license grant if the file is absent).
