# YTUBE Security Test Report

**Date:** 2026-09-21
**Target:** YTUBE local demo instance (`http://localhost:3000`, demo mode — Supabase not connected)
**Scope:** Owned project (`MrYaseen0/ytube`). Static code review + safe dynamic tests only.
**Out of scope (deliberately NOT performed):** DDoS / high-volume flooding, full credential brute-forcing,
destructive payloads, testing against any production Supabase project.

> A real DDoS was not run — flooding even your own local server proves nothing about security
> and risks destabilizing shared environments. Instead a light concurrency check (20 parallel
> requests) was run, plus a review of where rate limiting must live.

---

## 1. Executive summary

| # | Test | Result |
|---|------|--------|
| 1 | SQL injection (search box) | **Not vulnerable** — Supabase parameterized queries; `%`/`_` stripped; demo mode filters in memory |
| 2 | PostgREST filter injection (`.or()` interpolation) | **Low-risk finding** — user input interpolated into `.or()` filter string (`app/results/page.tsx:26`); only `%`/`_` stripped, commas/parens pass through. Read-only impact on public data, but should be hardened |
| 3 | Reflected XSS (search box) | **Not vulnerable** — React escapes output (`&lt;script&gt;`); RSC payload unicode-escapes (`\u003c`) |
| 4 | Login brute-force (5 rapid attempts) | **Blocked by design in demo mode** — submits short-circuit with "connect Supabase" message; no credential is ever sent. When Supabase is connected, rate limiting is delegated to Supabase Auth (verify its settings) |
| 5 | Admin route access (unauthenticated) | **Protected** — `/admin` and `/admin/*` redirect to `/setup` in demo mode; `requireAdmin()` gates every admin page server-side; middleware re-checks when Supabase is configured |
| 6 | Sensitive files (`/.env`, `/.git/HEAD`) | **Not exposed** — both return 404 |
| 7 | Security headers | **Missing** — no `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or CSP on dev server (expected for `next dev`; add in production) |
| 8 | Light concurrency (20 parallel GET /) | **Passed** — 20/20 HTTP 200 in ~0.5s |
| 9 | Upload validation | Code-level: extension allowlist enforced, SVG removed from thumbnails (stored-XSS), size caps client-side + RLS server-side |

---

## 2. How an attacker would try to hit YTUBE (and what happens)

### 2.1 SQL injection via search — `GET /results?q=<payload>`

**Attacker's idea:** break out of the query with `' OR '1'='1` or `UNION SELECT` to dump other tables.

**What actually happens:**
- `app/results/page.tsx` strips `%` and `_`, then calls Supabase `.from("videos").select(...).or(...)`.
- Supabase JS never concatenates SQL — values travel as parameters to PostgREST. There is no raw SQL
  string anywhere in `app/`, `lib/`, or `components/` (verified by grep).
- In demo mode the query never reaches a database at all — filtering is `Array.filter` in memory.

**Proof:** `curl "http://localhost:3000/results?q=' OR '1'='1"` → HTTP 200, page renders
`0 results for "' OR '1'='1"` — payload treated as a literal string, no error, no data leak.
(Screenshot S1)

### 2.2 PostgREST filter injection — the one real finding

**Attacker's idea:** the `.or()` filter is built with template interpolation:

```ts
// app/results/page.tsx:26
.or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
```

`clean` only strips `%` and `_`. PostgREST parses commas as condition separators and
parentheses as grouping, so a crafted `q` containing `,` / `(` / `)` can inject extra
filter conditions when Supabase is connected (not demonstrable in demo mode).

**Impact:** LOW — read-only, and only against the already-public `videos` table
(published rows). No stacked queries, no writes, no auth bypass via this vector.
Still, it lets an attacker reshape search results arbitrarily.

**Fix (recommended):**

```ts
const clean = q.replace(/[%_,()\\"]/g, "");
```

or avoid `.or()` string building entirely:

```ts
const { data } = await supabase.from("videos").select("*, profiles(id, username, avatar_url)")
  .eq("status", "published")
  .ilike("title", `%${clean}%`)
  .order("views", { ascending: false })
  .limit(30);
```

### 2.3 Reflected XSS via search — `GET /results?q=<script>alert(1)</script>`

**Attacker's idea:** get the payload reflected into HTML unescaped.

**What actually happens:** React escapes all interpolated strings. The response contains
`&lt;script&gt;alert(1)&lt;/script&gt;` in HTML and `\u003cscript\u003e` in the RSC flight
payload. No script executes.

**Proof:** curl + browser check — payload visible as plain text in the heading, no alert dialog.
(Screenshot S2)

### 2.4 Login brute-force — `POST` via `/signin` form

**Attacker's idea:** hammer the sign-in endpoint with password guesses.

**What actually happens (demo mode):** `SignInForm.submit()` short-circuits before any network
call: `setError("Demo mode — connect Supabase to enable sign-in.")`. Five rapid submissions
all return the same message; nothing leaves the browser. (Screenshot S3)

**When Supabase is connected:** authentication is `supabase.auth.signInWithPassword` —
rate limiting, CAPTCHA, and account lockout are Supabase Auth's job. **Action for you:**
in the Supabase dashboard, confirm Auth → Rate limits and enable CAPTCHA/bot protection
before going live. There is no app-level attempt counter, which is correct — don't build
your own, rely on the provider.

### 2.5 Admin takeover — `GET /admin`, `GET /admin/videos`

**Attacker's idea:** open admin pages directly without logging in.

**What actually happens:** `requireAdmin()` (`lib/admin.ts`) runs server-side on every admin
page and every function in `lib/admin-actions.ts`; in demo mode it redirects to `/setup`.
`middleware.ts` adds a second check when Supabase is configured. UI hiding is never the gate.

**Proof:** unauthenticated `GET /admin` → HTTP 307 → `/setup`. (Screenshot S4)

### 2.6 "DDoS" — deliberately not performed

A volumetric flood was **not** executed. What was done instead:
- **Concurrency sanity check:** 20 parallel `GET /` → 20/20 HTTP 200 in ~0.5 s. The dev
  server absorbs light concurrency fine; this says nothing about production.
- **Review:** there is no app-level rate limiting on search, comments, or reports. For
  production you want: Supabase Auth rate limits (login), a WAF / Vercel Firewall or
  Cloudflare in front (L3/L4/L7), and Postgres statement timeouts. Note these in your
  launch checklist — `next dev` has none of this.

---

## 3. Proof artifacts

Screenshots captured headless (Chromium) against the local demo instance on 2026-09-21:

- **S1 — SQL injection:** `~/workspace/ytube-shots/sec/sqli.png` — payload `' OR '1'='1`
  rendered as literal text in the heading (`0 results for "' OR '1'='1"`), no error, no data leak.
- **S2 — XSS:** `~/workspace/ytube-shots/sec/xss.png` — payload `<script>alert(1)</script>`
  rendered as plain text in the heading, no alert dialog, no execution.
- **S3 — Login:** `~/workspace/ytube-shots/sec/signin.png` — sign-in form renders; in demo mode
  any submit short-circuits client-side with "Demo mode — connect Supabase to enable sign-in."
  (verified in `components/AuthForms.tsx`); nothing is sent to any server.
- **S4 — Admin protection:** `~/workspace/ytube-shots/sec/admin.png` — unauthenticated
  `GET /admin` → HTTP 307 → `/setup` page (demo mode); `requireAdmin()` is the server-side gate.

Raw HTTP evidence: `/tmp/sqli1.html`, `/tmp/sqli2.html`, `/tmp/xss.html`, `/tmp/normal.html`.

---

## 4. Recommendations (priority order)

1. **Sanitize `.or()` filter input** — strip `,()\"` in `app/results/page.tsx` or replace with
   chained `.ilike()` calls. (The one code finding.)
2. **Add security headers in production** — `X-Frame-Options: DENY` (or `frame-ancestors`),
   `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a CSP. Easiest via `next.config.mjs`
   `headers()` when deploying.
3. **Confirm Supabase Auth protections** before connecting: rate limits, email confirmation,
   and bot/CAPTCHA protection.
4. **Put a WAF/CDN (Cloudflare or Vercel Firewall) in front** at launch for L7 flood absorption;
   do not rely on the app server.
5. **Keep `npm run build` green** — the release gate; re-run this test set after Supabase is
   connected, since the live database paths (RLS, `.or()` filter) only execute then.

---

*End of report.*
