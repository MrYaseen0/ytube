# Skill: upload-validation (Upload validation)

## What it does
Enforces the full validation chain for admin video uploads: client checks for fast feedback, storage RLS as the hard gate, and server-action validation before the DB record is created.

## When to use it
Any change to `components/UploadForm.tsx`, `lib/admin-actions.ts` `createVideoRecord()`, storage buckets, or `supabase/schema.sql` storage policies.

## Reusable instruction
```
Document input, output and failure shapes before implementation. Validate at
the boundary, return actionable errors and add one success plus one failure
test for every operation.
```

## YTUBE upload chain (verified 2026-09-21)
1. **Client** (`components/UploadForm.tsx`): file must be `video/*` and
   <= ~500 MB; thumbnail must be `image/*` (and in the extension allowlist)
   and <= ~5 MB; category required. Violations show an inline error, no
   network call.
2. **Storage RLS** (`supabase/schema.sql`): `videos` / `thumbnails` buckets are
   public-read, admin-write. INSERT requires `public.is_admin()` AND an
   extension allowlist — videos: mp4, webm, mov, m4v, ogv, avi, mkv;
   thumbnails: jpg, jpeg, png, gif, webp, avif. **Never allow svg** (stored XSS
   via the raw public file URL).
3. **Server action** (`createVideoRecord` in `lib/admin-actions.ts`):
   `requireAdmin()` first; title 1–120 chars; description <= 5000; category
   must exist in `categories` (FK `videos_category_fkey`); `video_url` must
   start with the project's own `videos/` storage prefix; `thumbnail_url` with
   the `thumbnails/` prefix. Writes `video.publish` to `admin_audit`.
4. **Error handling**: XHR failures surface `Upload failed (status)` text;
   server-action errors surface as inline form errors; busy state disables
   the submit button to prevent double-submits.

## Checklist
- [ ] Client validation gives instant, specific feedback
- [ ] Storage RLS still enforces admin + extension allowlist after any schema edit
- [ ] `createVideoRecord` re-validates URLs against own buckets + existing category
- [ ] Size limits enforced at >= 2 layers (client + server/storage)
- [ ] Failure states tested: oversize file, wrong type, bad URL, non-admin call
- [ ] Successful upload writes `video.publish` to `admin_audit`
