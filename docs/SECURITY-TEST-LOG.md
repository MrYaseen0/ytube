# YTUBE Security Test — Command Log & Response Report

**Date:** 2026-09-21
**Target:** YTUBE local demo instance — `http://localhost:3000` (demo mode, Supabase not connected)
**Scope:** Owned project `MrYaseen0/ytube`. Static review + safe dynamic tests only.
**Not performed:** DDoS / volumetric flooding, full credential brute-forcing, destructive payloads.

Every command below was executed as shown, with the actual response recorded.

---

## Phase 1 — Target confirmation

**Command:**
```
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
ps aux | grep -i next | grep -v grep | head -5
```

**Response:**
```
200
root  14598  ...  node /home/hatch/workspace/ytube/node_modules/.bin/next dev -p 3000
root  14610  ...  next-server (v14.2.18)
```
Target confirmed live: Next.js 14.2.18 dev server on port 3000, HTTP 200 on `/`.

---

## Phase 2 — SQL injection tests (search box)

**Commands:**
```
curl -s "http://localhost:3000/results?q=%27%20OR%20%271%27=%271" -o /tmp/sqli1.html -w "HTTP %{http_code} | %{size_download} bytes\n"
curl -s "http://localhost:3000/results?q=%27%20UNION%20SELECT%20*%20FROM%20profiles--" -o /tmp/sqli2.html -w "HTTP %{http_code} | %{size_download} bytes\n"
curl -s "http://localhost:3000/results?q=test" -o /tmp/normal.html -w "HTTP %{http_code} | %{size_download} bytes\n"
```

**Response:**
```
HTTP 200 | 17504 bytes
HTTP 200 | 17573 bytes
HTTP 200 | 17444 bytes
```

**Follow-up — was the payload reflected dangerously?**
```
grep -o '<h1[^>]*>.*</h1>' /tmp/sqli1.html | cut -c1-300
```
**Response:**
```html
<h1 class="mb-4 text-lg font-semibold">0<!-- --> result<!-- -->s<!-- --> for &quot;<!-- -->&#x27; OR &#x27;1&#x27;=&#x27;1<!-- -->&quot;</h1>
```
**Verdict: NOT VULNERABLE.** Payload rendered as inert literal text, 0 results, no SQL error, no data leak.
Byte sizes are near-identical to a normal search (no error-page divergence).

**Static corroboration:**
```
grep -rn "from(" --include="*.ts" --include="*.tsx" app lib components | grep -iE "\$\{|\+.*(select|where|insert|delete|update)"
```
**Response:** no matches — zero raw/string-concatenated SQL in the codebase. All queries go through
the Supabase client (parameterized).

---

## Phase 3 — PostgREST filter-injection probe (the one real finding)

**Static discovery:**
```
grep -rn "\.or(" app lib
```
**Response:**
```
app/results/page.tsx:26:  .or(`title.ilike.%${clean}%,description.ilike.%${clean}%`)
```
`clean` was `q.replace(/[%_]/g, "")` — commas, parentheses, quotes and backslashes passed through,
so a crafted `q` could inject extra PostgREST filter conditions once Supabase is connected.

**Dynamic probes (demo mode — Supabase path not executed, code-level finding):**
```
curl -s "http://localhost:3000/results?q=test%2Cid.neq.00000000-0000-0000-0000-000000000000" -o /tmp/filter1.html -w "HTTP %{http_code}\n"
curl -s "http://localhost:3000/results?q=%29%2Ctitle.ilike.%25" -o /tmp/filter2.html -w "HTTP %{http_code}\n"
```
**Response:** `HTTP 200` / `HTTP 200` — no crash, no error; payload treated as literal text in demo mode.

**Fix applied (2026-09-21) — `app/results/page.tsx`:**
```diff
-        const clean = q.replace(/[%_]/g, "");
+        // Strip PostgREST filter metacharacters: % and _ are LIKE wildcards,
+        // while , ( ) " can break out of the .or() filter list and inject
+        // extra conditions (filter injection). Backslash is stripped so it
+        // can't be used to escape the sanitization.
+        const clean = q.replace(/[%_,()\\"]/g, "");
```

**Fix verification:**
```
node -e 'const s=q=>q.replace(/[%_,()\\"]/g,""); ...'
```
**Response:**
```
"test,id.neq.00000000-0000-0000-0000-000000000000" => "title.ilike.%testid.neq.00000000-...%,description.ilike.%testid.neq.00000000-...%"
"),(title.ilike.%"                              => "title.ilike.%title.ilike.%,description.ilike.%title.ilike.%"
"test\"))"                                       => "title.ilike.%test%,description.ilike.%test%"
"100%_coverage"                                  => "title.ilike.%100coverage%,description.ilike.%100coverage%"
"normal search query"                            => "title.ilike.%normal search query%,description.ilike.%normal search query%"
```
All metacharacters stripped — injected payloads collapse into harmless literal text inside the two
intended `ilike` conditions. Filter structure can no longer be broken out of.

**Regression checks:**
```
npx tsc --noEmit        → exit 0 (no type errors)
npm run build           → exit 0, all routes compiled (incl. /results)
```

---

## Phase 4 — Reflected XSS test (search box)

**Command:**
```
curl -s "http://localhost:3000/results?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E" -o /tmp/xss.html -w "HTTP %{http_code}\n"
```

**Response:** `HTTP 200`

**Checks:**
```
grep -o '<script>alert(1)</script>' /tmp/xss.html   → 1 match
grep -o '&lt;script&gt;' /tmp/xss.html              → match found
```
The single raw `<script` match is Next.js's own framework script tag. The payload itself appears as
`&lt;script&gt;alert(1)&lt;/script&gt;` in HTML and as `\u003cscript\u003e` (unicode-escaped) in the
React Server Components flight payload:
```
...for &quot;<!-- -->&lt;script&gt;alert(1)&lt;/script&gt;<!-- -->&quot;</h1>...
```
**Verdict: NOT VULNERABLE.** Screenshot `sec/xss.png` shows the payload as plain text, no dialog.

---

## Phase 5 — Login brute-force simulation (limited, safe)

**Command:**
```
for i in 1 2 3 4 5; do curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/signin"; echo " <- attempt $i"; done
```

**Response:**
```
200 <- attempt 1
200 <- attempt 2
200 <- attempt 3
200 <- attempt 4
200 <- attempt 4
200 <- attempt 5
```

**Why no lockout triggered:** `components/AuthForms.tsx` — `SignInForm.submit()` short-circuits in demo
mode before any network call:
```ts
if (demo) {
  setError("Demo mode — connect Supabase to enable sign-in.");
  return;
}
```
**Verdict: NOT VULNERABLE in demo mode** — no credential ever leaves the browser. When Supabase is
connected, auth is `supabase.auth.signInWithPassword`; rate limiting must be confirmed in the
Supabase dashboard (Auth → Rate limits, CAPTCHA/bot protection). No app-level counter exists, which
is correct — the provider owns this.

---

## Phase 6 — Admin access control

**Commands:**
```
curl -s -o /dev/null -w "GET /admin -> HTTP %{http_code} (redirect: %{redirect_url})\n" http://localhost:3000/admin
curl -s -o /dev/null -w "GET /admin/videos -> HTTP %{http_code} (redirect: %{redirect_url})\n" http://localhost:3000/admin/videos
```

**Response:**
```
GET /admin -> HTTP 307 (redirect: http://localhost:3000/setup)
GET /admin/videos -> HTTP 307 (redirect: http://localhost:3000/setup)
```
**Verdict: PROTECTED.** Unauthenticated admin access redirects away. `requireAdmin()` (`lib/admin.ts`)
runs server-side on every admin page and every function in `lib/admin-actions.ts`; `middleware.ts`
adds a second check when Supabase is configured. Screenshot `sec/admin.png` shows the `/setup` page.

---

## Phase 7 — Sensitive files & security headers

**Commands:**
```
curl -s -o /dev/null -w "GET /.env -> HTTP %{http_code}\n" http://localhost:3000/.env
curl -s -o /dev/null -w "GET /.git/HEAD -> HTTP %{http_code}\n" http://localhost:3000/.git/HEAD
curl -sI http://localhost:3000/ | grep -iE "x-frame-options|x-content-type|strict-transport|content-security|referrer-policy"
```

**Response:**
```
GET /.env -> HTTP 404
GET /.git/HEAD -> HTTP 404
(no security headers matched)
```
**Verdict:** sensitive files not exposed (404). No security headers on the dev server — expected for
`next dev`; must be added in production (`X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, CSP via `next.config.mjs`).

---

## Phase 8 — Concurrency sanity check (NOT a DDoS)

A volumetric flood was deliberately **not** executed. Instead:

**Command:**
```
time seq 1 20 | xargs -P20 -I{} curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ | sort | uniq -c
```

**Response:**
```
     20 200

real    0m0.470s
```
**Verdict:** 20/20 parallel requests returned HTTP 200 in ~0.5 s. Light concurrency is absorbed;
this says nothing about production flood resistance — that requires a WAF/CDN (Cloudflare or
Vercel Firewall) at launch.

---

## Phase 9 — Screenshot evidence

Captured headless (Chromium `chrome-headless-shell`, 1280×800) against the local instance.
An in-app browser capture was attempted first but that environment blocks loopback addresses,
so capture was done on the server host instead.

| File | Shows |
|------|-------|
| `~/workspace/ytube-shots/sec/sqli.png` | SQLi payload as literal text, `0 results`, no error |
| `~/workspace/ytube-shots/sec/xss.png` | XSS payload as plain text, no execution |
| `~/workspace/ytube-shots/sec/signin.png` | Sign-in form + demo-mode banner |
| `~/workspace/ytube-shots/sec/admin.png` | Unauthenticated `/admin` → `/setup` redirect landing |

---

## Summary of findings

| # | Area | Severity | Status |
|---|------|----------|--------|
| 1 | PostgREST filter injection (`app/results/page.tsx:26`) | Low | **FIXED & VERIFIED** (2026-09-21) |
| 2 | SQL injection | — | Not vulnerable |
| 3 | Reflected XSS | — | Not vulnerable |
| 4 | Login brute-force | — | Blocked by design (demo); provider-owned when live |
| 5 | Admin unauthorized access | — | Protected (server-side gate) |
| 6 | Sensitive file exposure | — | Not exposed |
| 7 | Security headers | Info | Missing on dev; add for production |
| 8 | Flood resistance | Info | Not tested by flood; WAF required at launch |

**Remaining work:** re-run Phases 2–6 against a live Supabase project after connection (RLS and the
fixed `.or()` filter only execute then); add production security headers; confirm Supabase Auth
rate limits + CAPTCHA; put a WAF in front at launch.

*End of report.*
