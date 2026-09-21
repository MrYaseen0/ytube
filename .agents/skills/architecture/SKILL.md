# Skill: architecture (Architecture documentation)

## What it does
Keeps `docs/ARCHITECTURE.md` aligned with the actual implementation — components, data flow, trust boundaries, storage, and deployment. Every statement must match a current file or configuration; no aspirational text.

## When to use it
Whenever a change alters structure or data flow: new route, new server action, new table/policy, new storage bucket, changed auth boundary, or a new client/server split.

## Reusable instruction
```
Update docs/ARCHITECTURE.md with components, data flow, trust boundaries,
storage, external services and deployment. Every statement must match a
current file or configuration.
```

## YTUBE architecture notes (verified 2026-09-21)
- Next.js 14 App Router, TypeScript, Tailwind CSS (`tailwind.config.ts` tokens
  `yt.bg/surface/red/pink/...`, `shadow-neon*` utilities).
- Data: Supabase Postgres + Storage. Server components read via
  `lib/supabase-server.ts`; client components via `lib/supabase.ts`.
- Demo mode: when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  are absent, `isSupabaseConfigured()` is false, `createServerSupabase()` returns
  null, pages fall back to `lib/demo-data.ts` and render `SetupBanner`
  (`components/SetupBanner.tsx`); auth pages block submit with a
  "connect Supabase" message (`components/AuthForms.tsx`).
- Admin content: `site_settings` (keys `header`, `footer`, `home`), `categories`,
  `admin_audit` tables; editable at `/admin/*` via `lib/admin-actions.ts`.
- Trust boundary: `requireAdmin()` (`lib/admin.ts`) at the top of every admin
  page and server action; Supabase RLS as the database-level backstop
  (`supabase/schema.sql`); `middleware.ts` is convenience routing only.
- Uploads: admin-only. `components/UploadForm.tsx` XHRs to Storage (videos ~500
  MB, thumbnails ~5 MB), `createVideoRecord()` validates URLs against the
  project's own buckets.

## Checklist
- [ ] ARCHITECTURE.md statement traced to a real file
- [ ] Data flow described source -> server/client -> sink
- [ ] Trust boundary named (requireAdmin / RLS / middleware)
- [ ] Demo-mode fallback described where the feature behaves differently
- [ ] No paragraph added that isn't true of the current tree
