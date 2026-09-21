# YTUBE — Features

## Viewing

- **Home feed** (`/`) — responsive video grid, newest first, admin-managed
  category chips, editable hero copy
- **Watch page** (`/watch/[id]`) — HTML5 player, title, channel header with
  subscribe button, like/dislike pill, live view counter, expandable-feel
  description box, up-next recommendations (same category, most-viewed first)
- **Search** (`/results?q=`) — matches video titles and descriptions
- **Channel pages** (`/channel/[id]`) — gradient banner, avatar, subscriber
  count, subscribe button, channel video grid

## Participation (requires sign-in + Supabase)

- **Sign up / sign in / sign out** — email + password via Supabase Auth;
  a profile row (channel) is auto-created on sign-up
- **Upload** (`/admin/videos`, admin-only) — title, description, category, video file + optional
  thumbnail; uploads go straight to Supabase Storage with a real progress bar;
  validated (video ≤ 500 MB, thumbnail ≤ 5 MB, admin-managed categories),
  duration read from the file automatically, and logged to the audit trail.
  The old public `/upload` route redirects: admins → `/admin/videos`,
  everyone else → `/`.
- **Like / dislike** — one vote per user per video, toggle on/off
- **Comments** — post and delete your own comments
- **Subscribe** — follow channels; counts update live
- **Report** — flag a video with a reason; goes to the admin queue
- **Watch history** (`/history`) — every video you watch is logged per-account
- **Subscriptions feed** (`/subscriptions`) — latest uploads from channels you follow

## Moderation (admin only, `profiles.is_admin`)

- **Stats cards** — total users, videos, views, open reports
- **Videos & uploads** (`/admin/videos`) — upload flow with progress bar;
  approve (`pending`/`removed` → `published`), remove (`→ removed`, hidden from
  public), or permanently delete (row + storage files)
- **Categories** (`/admin/categories`) — full CRUD: name, slug, icon, color,
  sort order; renames cascade to videos via FK; in-use categories can't be deleted
- **Site settings** (`/admin/settings`) — edit header (logo text, nav links),
  footer (link columns, bottom text) and homepage copy; live immediately
- **Audit log** (`/admin/audit`) — every privileged action with admin, action,
  target and timestamp
- **Users table** — grant/revoke admin (you can't change your own)
- **Reports queue** — open reports with video link, reason, reporter; mark resolved

## Platform

- **Demo mode** — without Supabase keys the whole UI runs on built-in demo
  videos with a setup banner; nothing crashes
- **Route protection** — middleware guards `/upload`, `/history`,
  `/subscriptions` (auth) and `/admin` (auth + admin)
- **Responsive** — mobile drawer sidebar, adaptive grids (1→4 columns)
- **Theme** — deep-red / hot-pink neon identity across the app; showcase
  split-layout auth pages

## Explicitly out of scope (v1)

Payments/memberships, playlists, notifications, live streaming, comment replies,
transcoding/HLS, full-text search, per-channel analytics, mobile apps.
See `docs/PLAN.md` for the v2 roadmap.
