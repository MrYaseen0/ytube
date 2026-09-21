# Skill: security-review (Security audit)

## What it does
Reviews trust boundaries and privileged actions: server-side authorization, input validation, secret exposure, upload type/size, and audit logging. Never weakens a safeguard to make a test pass.

## When to use it
Any change touching `app/admin/*`, `lib/admin-actions.ts`, `lib/admin.ts`, `middleware.ts`, `supabase/schema.sql`, uploads, auth forms, or user input that reaches the database or storage.

## Reusable instruction
```
Threat-model trust boundaries and privileged actions. Check server-side
authorization, input validation, secret exposure, upload type/size, and audit
logs. Do not weaken safeguards to make a test pass.
```

## YTUBE trust boundaries (verified 2026-09-21)
1. **Admin gate**: `requireAdmin()` in `lib/admin.ts` — session + `profiles.is_admin`
   checked server-side. Called at the top of every `/admin/*` page and every
   function in `lib/admin-actions.ts`. `middleware.ts` redirects non-admins but
   is a convenience layer only.
2. **Database**: RLS in `supabase/schema.sql`. `site_settings`, `categories`,
   `admin_audit` are public-read / admin-write. `videos` writes are
   admin-only (`public.is_admin()` SECURITY DEFINER helper avoids recursion).
3. **Storage**: `videos` and `thumbnails` buckets are public-read, admin-write.
   INSERT policies enforce extension allowlists (video: mp4/webm/mov/m4v/ogv/
   avi/mkv; thumbnails: jpg/jpeg/png/gif/webp/avif — **never add svg**; SVG
   served from a public bucket is a stored-XSS vector via the raw file URL).
4. **Uploads**: `components/UploadForm.tsx` validates MIME + size client-side
   (~500 MB video, ~5 MB thumbnail); `createVideoRecord()` re-validates URLs
   against the project's own storage buckets and an existing category.
5. **Audit**: every privileged mutation in `lib/admin-actions.ts` writes to
   `admin_audit` via `logAudit()`.

## Checklist
- [ ] New privileged action calls `requireAdmin()` first
- [ ] RLS policy updated in `supabase/schema.sql` alongside any schema/table change
- [ ] Upload path: extension + size enforced server-side or by RLS, not only client
- [ ] No secrets, keys, or credentials in code, logs, or committed files
- [ ] Mutation written to `admin_audit`
- [ ] Demo-mode fallback does not leak admin UI or actions
