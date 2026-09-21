# Skill: repo-map (Repository mapper)

## What it does
Builds a grounded file map of the YTUBE codebase — entry points, routes, components, data flow, auth boundaries, and the verification gate — before any code is edited. Every claim cites an exact file path.

## When to use it
At the start of every coding task on this repo. If you cannot name the files a change touches, run this skill first.

## Reusable instruction
```
Map the repository before changing code. Identify runtime entry points, package
scripts, routes, data flow, persistence, auth boundaries and tests. Cite exact
file paths. Do not edit until the map and likely fault path are clear.
```

## YTUBE map (verified 2026-09-21)
- Entry: `app/layout.tsx` -> `components/AppShell.tsx` (Navbar + Sidebar + Footer).
- Routes: `app/page.tsx` (home feed + `?cat=` filter), `app/watch/[id]/page.tsx`,
  `app/results/page.tsx` (search), `app/channel/[id]/page.tsx`,
  `app/subscriptions/page.tsx`, `app/history/page.tsx`,
  `app/signin/page.tsx`, `app/signup/page.tsx`, `app/setup/page.tsx`,
  `app/upload/page.tsx` (redirects non-admins; uploads live in admin),
  `app/admin/{page,categories,settings,videos,audit}/page.tsx`.
- Client components: `components/` (Navbar, Sidebar, VideoCard, Comments,
  LikeButtons, UploadForm, AuthForms, AdminActions, CategoryManager,
  SettingsEditor, ReportButton, SubscribeButton, WatchTracker, SetupBanner).
- Server logic: `lib/admin.ts` (`requireAdmin()`), `lib/admin-actions.ts`
  (all privileged mutations), `lib/site-settings.ts` (header/footer/home copy
  + categories), `lib/demo-data.ts` (demo-mode fallback),
  `lib/supabase.ts` / `lib/supabase-server.ts` (clients; null when unconfigured).
- Auth boundary: `middleware.ts` matcher covers
  `/upload/*`, `/history/*`, `/subscriptions/*`, `/admin/*` — but it is a UX
  gate only; real enforcement is `requireAdmin()` + Supabase RLS.
- Database: `supabase/schema.sql` (idempotent, tables + RLS + storage policies),
  `supabase/seed.sql`.
- Verification gate: `npm run build` (Next.js 14 production build). There is no
  lint script — never claim lint ran.

## Checklist
- [ ] Named the route/page and components the change touches
- [ ] Named the lib helper(s) the change flows through
- [ ] Identified the auth boundary the change crosses (if any)
- [ ] Named the verification command (`npm run build`)
- [ ] No edit made before the map was written down
