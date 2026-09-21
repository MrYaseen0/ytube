# Skill: supabase-auth (Supabase auth and RLS)

## What it does
Covers auth flows, session handling, and Row Level Security for the YTUBE Supabase project — separating authentication (who) from authorization (what they may do).

## When to use it
Auth pages, protected routes, admin features, schema/policy changes, or debugging "why can X do Y".

## Reusable instruction
```
List roles and protected actions. Enforce authorization server-side and in
database policies; UI hiding is not security. Test anonymous, normal-user and
admin cases, including direct API calls.
```

## YTUBE auth facts (verified 2026-09-21)
- Roles: anonymous, authenticated user, admin (`profiles.is_admin`).
- Sign-in/sign-up: `components/AuthForms.tsx`; profiles auto-created by the
  `handle_new_user()` trigger in `supabase/schema.sql`.
- Server gate: `requireAdmin()` (`lib/admin.ts`) — redirects to `/setup` when
  Supabase is unconfigured, to `/signin?next=/admin` when logged out, to `/`
  when not admin.
- RLS (`supabase/schema.sql`, idempotent): public read for published videos,
  profiles, comments, categories, site_settings; writes scoped to owner or
  admin; `videos` writes admin-only; `admin_audit` read/write admin-only;
  `reports` insertable by any authenticated user, resolvable by admins only.
- `public.is_admin()` is `SECURITY DEFINER` to avoid RLS recursion.
- Demo mode: no env keys → `createServerSupabase()` returns null → pages use
  `lib/demo-data.ts`; auth submits are blocked client-side with a
  "connect Supabase" message. Real auth is unavailable until the user creates
  a Supabase project, runs `supabase/schema.sql`, and sets `.env.local`
  (exact steps in `docs/SETUP.md`).

## Checklist
- [ ] Role matrix checked: anonymous / user / admin, including direct API calls
- [ ] New table has RLS enabled with explicit policies in `supabase/schema.sql`
- [ ] Server action gated by `requireAdmin()` where privileged
- [ ] `public.is_admin()` used inside policies instead of recursive profile reads
- [ ] Demo mode still renders and blocks auth correctly
