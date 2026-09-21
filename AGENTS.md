# Agent operating rules — YTUBE

Next.js 14 + TypeScript + Tailwind CSS + Supabase video platform.
Public repo: `MrYaseen0/ytube`. Work dir: `~/workspace/ytube`.

## Objective
Make the smallest correct change, preserve existing behavior, and prove the result.

## Start every task
1. Read this file and the relevant skill(s) in `.agents/skills/`:
   - repo structure / file map -> `repo-map`
   - structure or data flow changes -> `architecture`
   - lasting technical choice -> `decisions`
   - terse request -> `prompt-enhancer`
   - Next.js/React work -> `nextjs-react`
   - layout / mobile / touch -> `responsive-ui`
   - motion -> `ui-animations`
   - auth / data / policies -> `supabase-auth`, `security-review`
   - uploads -> `upload-validation`
   - bug or regression -> `testing`
   - release / push -> `release-check`
2. Inspect the repository tree and `package.json` scripts.
3. Reproduce the issue or establish a baseline.
4. Name the files and boundaries likely to change.

## Implementation
- Read before editing; do not invent APIs, files, or results.
- Follow the existing architecture in `docs/ARCHITECTURE.md` and design tokens
  in `tailwind.config.ts`. No one-off colors; no branding changes.
- Deep red + pink theme (`yt-red #c1121f`, `yt-pink #ff4d6d`); neon touches
  stay subtle (`shadow-neon*`, `text-glow*` utilities).
- **Admin-only uploads**: videos are uploaded only from `/admin/videos` via
  `components/UploadForm.tsx`. `/upload` redirects non-admins. Never add a
  public upload path.
- Enforce authorization server-side via `requireAdmin()` (`lib/admin.ts`) and
  in Supabase RLS (`supabase/schema.sql`) — UI hiding is not security.
- Validate all external input at the boundary (server actions, storage RLS).
- **Demo mode**: when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  are absent, the app renders demo content (`lib/demo-data.ts` + `SetupBanner`)
  and blocks auth submits with a "connect Supabase" message. Every change must
  keep demo mode working.
- Never expose secrets; never commit `.env.local` or credentials.
- Ask before destructive operations (deletes, schema drops, force pushes).

## Documentation
- Update `docs/ARCHITECTURE.md` when structure or data flow changes.
- Add a dated entry to `docs/DECISIONS.md` for a lasting technical choice
  (format: `Date | Decision | Context | Alternatives | Reason | Consequences | Revisit trigger`).
- Keep README setup commands synchronized with the code.

## Verification
- **Release gate is `npm run build`.** This repo has no lint script — never
  claim lint ran or passed.
- Run the smallest relevant check first (`npx tsc --noEmit` for type-only
  changes), then the full `npm run build`.
- For UI: test 360px, 390px, 768px and desktop; tap every changed control;
  exercise failure states (invalid input, demo mode, non-admin).
- **Never claim success without tool output.** A build passes only when the
  command exits 0 and lists all 16 routes.

## Final response
State root cause, changed files, checks with actual results, and any remaining
limitation. If a push was requested, return the commit hash and branch.
