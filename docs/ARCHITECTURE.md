# YTUBE — Architecture

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS 3 on the frontend;
Supabase provides Postgres, Auth and Storage. No custom backend server —
the Next.js app talks to Supabase directly (server components via
`@supabase/ssr` cookie client, browser via the browser client).

## Folder structure

```
ytube/
├── app/                    # Routes (App Router)
│   ├── layout.tsx          # <html> shell → <AppShell>
│   ├── globals.css         # Tailwind + theme utilities (.text-glow, neon shadows)
│   ├── page.tsx            # Home feed (?cat= filter)
│   ├── watch/[id]/page.tsx
│   ├── results/page.tsx    # ?q= search
│   ├── channel/[id]/page.tsx
│   ├── upload/page.tsx     # auth-guarded (middleware + page check)
│   ├── signin/  signup/    # render AuthForms
│   ├── history/            # auth-guarded
│   ├── subscriptions/      # auth-guarded
│   ├── admin/
│   │   ├── page.tsx        # dashboard: stats, tiles, reports, users
│   │   ├── videos/         # admin-only upload flow + video table
│   │   ├── categories/     # category CRUD
│   │   ├── settings/       # site content editors (header/footer/home)
│   │   └── audit/          # admin action log
│   └── setup/page.tsx      # in-app setup guide
├── components/
│   ├── AppShell.tsx        # client shell: Navbar + Sidebar + Footer + <main>
│   ├── Navbar.tsx          # logo (from site_settings), search, admin upload btn, avatar menu (client)
│   ├── Footer.tsx          # link columns + bottom text (from site_settings)
│   ├── Sidebar.tsx         # collapsible rail / mobile drawer, Explore from categories (client)
│   ├── VideoCard.tsx       # grid + row layouts
│   ├── VideoPlayer.tsx     # <video> wrapper
│   ├── LikeButtons.tsx     # vote pill (client)
│   ├── SubscribeButton.tsx # toggle (client)
│   ├── Comments.tsx        # list + form (client)
│   ├── UploadForm.tsx      # XHR upload w/ progress, validation (client, admin-only)
│   ├── SettingsEditor.tsx  # header/footer/homepage editors (client, admin-only)
│   ├── CategoryManager.tsx # category CRUD UI (client, admin-only)
│   ├── AuthForms.tsx       # showcase split-layout sign in/up (client)
│   ├── AdminActions.tsx    # approve/remove/delete, admin toggle, resolve (client → server actions)
│   ├── WatchTracker.tsx    # logs watch_history (client, invisible)
│   ├── ReportButton.tsx    # (client)
│   ├── SetupBanner.tsx     # demo-mode banner
│   ├── Avatar.tsx          # initial-letter avatar
│   └── icons.tsx           # inline SVGs
├── lib/
│   ├── supabase.ts         # isSupabaseConfigured(), createClient() (browser)
│   ├── supabase-server.ts  # createServerSupabase() (null when unconfigured)
│   ├── admin.ts            # requireAdmin() — server-side admin gate
│   ├── admin-actions.ts    # privileged server actions w/ audit logging ("use server")
│   ├── site-settings.ts    # getSiteSettings(), getCategories() (cached, w/ defaults)
│   ├── types.ts            # Profile, Video, CommentItem, ReportItem, Category, AdminAuditItem
│   ├── format.ts           # formatViews, timeAgo, formatDuration, avatarColor
│   ├── constants.ts        # CATEGORIES (fallback only; DB is source of truth)
│   └── demo-data.ts        # fallback content for demo mode
├── middleware.ts           # auth/admin route guards
├── supabase/
│   ├── schema.sql          # tables, trigger, RLS, storage buckets+policies
│   └── seed.sql            # 6 channels + 10 videos (idempotent)
├── docs/                   # PLAN, SETUP, FEATURES, ARCHITECTURE
└── tailwind.config.ts      # `yt` palette + neon box-shadows
```

## Data model

```
profiles        id (uuid, pk) · username · avatar_url · is_admin · created_at
videos          id · user_id → profiles · title · description · video_url ·
                thumbnail_url · duration · views · category → categories(name)
                · status (published|pending|removed) · created_at
categories      id (uuid, pk) · name (unique) · slug (unique) · icon · color ·
                sort_order · created_at
site_settings   key (text, pk) · value (jsonb) · updated_at
                keys: "header" {logoText, navLinks[]}, "footer" {columns[], bottomText},
                      "home" {heroTitle, heroSubtitle, emptyTitle, emptySubtitle}
admin_audit     id · admin_id → profiles · action · target_type · target_id · created_at
comments        id · video_id → videos · user_id → profiles · body · created_at
likes           (user_id, video_id) pk · value (1|-1)
subscriptions   (subscriber_id, channel_id) pk → profiles
reports         id · video_id → videos · reporter_id → profiles ·
                reason · status (open|resolved) · created_at
watch_history   (user_id, video_id) pk → profiles/videos · watched_at
```

Notes:

- `profiles.id` is a plain UUID PK (no FK to `auth.users`) so the seed script can
  create demo channels. Real sign-ups get a profile via the `handle_new_user()`
  trigger on `auth.users`.
- `videos.category` is a TEXT FK into `categories(name)` with `ON UPDATE CASCADE`,
  so renaming a category updates every video in it automatically.
- Storage: `videos/` and `thumbnails/` buckets, public read. Uploads land at
  `{user_id}/{timestamp}-{filename}`.

## Auth flow

1. Sign-up (`supabase.auth.signUp`, username in `user_metadata`) → trigger inserts
   `profiles` row → session cookie set via `@supabase/ssr`.
2. Server components read the session with `createServerSupabase()` (cookies from
   `next/headers`); RLS enforces row access per request.
3. Browser mutations (likes, comments, subs, reports) use `createClient()`; RLS
   policies enforce ownership. Admin mutations go through server actions in
   `lib/admin-actions.ts`, each starting with `requireAdmin()`.
4. `middleware.ts` redirects anonymous users away from `/upload`, `/history`,
   `/subscriptions` → `/signin?next=...`, and non-admins away from `/admin`.
   `/upload` itself redirects: admins → `/admin/videos`, everyone else → `/`.
   When env keys are missing it no-ops and pages render demo mode instead.

## Admin check

`public.is_admin()` is a `SECURITY DEFINER` SQL function returning true when the
calling user has `profiles.is_admin`. RLS policies reference it, avoiding
self-referential recursion on the `profiles` table.

On the app side, `requireAdmin()` (`lib/admin.ts`) re-verifies admin status
server-side on every `/admin` page and every privileged server action
(session → `profiles.is_admin`). It is the only gate that matters: middleware
and client-side `isAdmin` flags are convenience/UX only and never authorize
anything by themselves.

## Security model

Privileged operations are protected in three independent layers, so a failure
in any one layer is still caught by the others:

1. **Server-side gate.** `requireAdmin()` runs at the top of every `/admin`
   page and every server action in `lib/admin-actions.ts`. It reads the session
   from HTTP-only cookies server-side and checks `profiles.is_admin`. Client
   components never decide authorization; the browser UI only hides buttons.
   The Edge `middleware.ts` also blocks non-admins from `/admin/*` before the
   page even renders.

2. **Row Level Security.** Even a leaked or forged client call cannot write
   privileged rows:
   - `site_settings`, `categories`: public `SELECT`; `INSERT/UPDATE/DELETE`
     require `public.is_admin()`.
   - `admin_audit`: `SELECT`/`INSERT` require `public.is_admin()` (append-only
     by design — no update/delete policy exists).
   - `videos`: public read of published rows; `INSERT/UPDATE/DELETE` require
     `public.is_admin()` (and inserts must set `user_id = auth.uid()`).
   - `reports`: anyone signed in can file (`reporter_id = auth.uid()`); only
     admins can resolve.
   - Storage: only admins can `INSERT` into the `videos`/`thumbnails` buckets,
     and RLS enforces an extension allowlist
     (`mp4, webm, mov, m4v, ogv, avi, mkv` for video;
     `jpg, jpeg, png, gif, webp, avif, svg` for thumbnails).

3. **Server-side validation + audit.** Uploads are admin-only (`/admin/videos`):
   the browser validates MIME type and size before upload (video ≤ 500 MB,
   thumbnail ≤ 5 MB), and the `createVideoRecord` server action re-validates
   title length, that the category exists (FK target), and that the file URLs
   point at the app's own storage buckets before inserting. Every privileged
   action — settings updates, video publish/status/delete, category
   create/update/delete, report resolutions, admin promote/demote — writes a
   row to `admin_audit`, viewable at `/admin/audit`.

There is no service-role key in the app; all server code uses the anon key and
relies on RLS, so the database remains the final authority.

## Demo mode

`isSupabaseConfigured()` checks `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. When false, pages render `lib/demo-data.ts`
content and interactive components receive `enabled={false}` (buttons disabled
with tooltips, forms replaced by a setup note). No Supabase client is ever
constructed, so nothing throws.

## Theming

`tailwind.config.ts` extends a `yt` palette (maroon blacks, crimson `#c1121f`,
hot pink `#ff4d6d`) plus `shadow-neon*` tokens; `globals.css` adds
`.text-glow` / `.text-glow-sm` utilities and a pink `:focus-visible` ring.
Neon is used sparingly: logo, primary CTAs, active nav, focus states.
