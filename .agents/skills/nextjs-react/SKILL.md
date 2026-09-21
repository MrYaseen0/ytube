# Skill: nextjs-react (Next.js 14 / React specialist)

## What it does
Guides server/client boundaries, routing, data fetching, and rendering in this Next.js 14 App Router codebase.

## When to use it
New routes, new components, data-fetching changes, or when deciding where code belongs (server component vs client component vs server action).

## Reusable instruction
```
Prefer server rendering for data that does not need browser state. Isolate
client components, avoid request waterfalls, validate loading/error/empty
states and run the production build.
```

## YTUBE conventions (verified 2026-09-21)
- Pages under `app/` are server components by default; data comes from
  `createServerSupabase()` (`lib/supabase-server.ts`) or `lib/demo-data.ts`
  when unconfigured.
- `"use client"` components live in `components/` and must not fetch
  privileged data directly — they receive it as props or call server actions.
- Privileged mutations live ONLY in `lib/admin-actions.ts` (`"use server"`,
  every function gated by `requireAdmin()`). No other file may export a
  `"use server"` function without the same gate.
- `middleware.ts` handles redirect convenience for `/admin/*`, `/upload/*`,
  `/history/*`, `/subscriptions/*`; it is not the authorization layer.
- Hydration rule: never branch initial render state on `window` inside
  `useState`. Pattern used in `components/AppShell.tsx` — initialize to the
  SSR value, correct in `useEffect` after mount.
- Loading/error/empty states: the home feed has explicit empty state
  (`app/page.tsx`); demo mode has explicit `SetupBanner`.

## Checklist
- [ ] New component placed in the correct layer (server vs client vs server action)
- [ ] No `window`/`document` access during initial render
- [ ] Privileged write goes through `lib/admin-actions.ts` with `requireAdmin()`
- [ ] Loading, error, and empty states handled
- [ ] `npm run build` passes
