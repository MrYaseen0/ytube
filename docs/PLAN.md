# YTUBE — Project Plan

## Vision

YTUBE is a full-stack, self-hosted YouTube clone: watch, upload and share videos with
accounts, channels, subscriptions, likes, comments and moderation — running on
Next.js 14 + Supabase with a signature deep-red / hot-pink neon identity.

## Tech stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| Framework  | Next.js 14 (App Router), TypeScript      |
| Styling    | Tailwind CSS 3, custom `yt` theme tokens |
| Backend    | Supabase (Postgres, Auth, Storage)       |
| Data fetch | Server Components + `@supabase/ssr`     |
| Hosting    | Any Node host (Vercel recommended)       |

## v1 scope (shipped)

- [x] Supabase schema + RLS + storage buckets (`supabase/schema.sql`)
- [x] Demo seed data (`supabase/seed.sql`)
- [x] Demo mode (full UI viewable with zero config)
- [x] Auth: sign up / sign in / sign out, auto profile creation
- [x] Home feed + category chips
- [x] Watch page: player, views, like/dislike, subscribe, comments, report, up-next
- [x] Search (`/results`)
- [x] Channel pages
- [x] Upload with progress bar + thumbnails (Supabase Storage)
- [x] Subscriptions feed
- [x] Watch history
- [x] Admin dashboard: stats, videos (approve/remove), users (admin toggle), reports queue
- [x] Route protection via middleware (`/upload`, `/history`, `/subscriptions`, `/admin`)
- [x] Deep-red + pink neon theme, showcase auth pages
- [x] Docs: PLAN / SETUP / FEATURES / ARCHITECTURE

## v2 roadmap

- [ ] Memberships / paid subscriptions (Stripe) — channel memberships, pay-per-view
- [ ] Video transcoding pipeline (720p/1080p renditions, HLS)
- [ ] Playlists (create, save, share)
- [ ] Notifications (new uploads from subscribed channels)
- [ ] Live streaming (RTMP ingest)
- [ ] Comments: replies, comment likes
- [ ] Full-text search (Postgres `tsvector`) + trending page
- [ ] View-count dedup / analytics dashboard per channel
- [ ] Mobile apps (React Native) sharing the Supabase backend
- [ ] Multi-language UI (English/Urdu)

## Milestones

1. **Foundation** — repo scaffold, theme, schema, seed ✅
2. **Core viewing** — home, watch, search, channel ✅
3. **Participation** — auth, upload, likes, comments, subs, history ✅
4. **Moderation** — reports, admin dashboard, RLS hardening ✅
5. **Polish** — neon theme pass, showcase auth, docs ✅
6. **Deploy** — GitHub repo, Vercel deploy, custom domain (owner's step)

## Non-goals (v1)

- Pixel-perfect YouTube parity (recommendation ML, Shorts, premieres)
- Payments/billing
- Native mobile apps
