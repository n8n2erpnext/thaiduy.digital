# Repository Audit — 2026-09-23

Branch: `chore/repo-audit-cleanup-2026-09-23`  
Baseline: `a6eb52079701f62100aef9cac44c796499d105d3`

## Scope

Repository-wide review covering:

- TypeScript, ESLint, production build and existing custom audits.
- Runtime import reachability and orphan source files.
- Legacy compatibility routes and duplicated API implementations.
- Dead CSS / stale selectors and stale i18n branches.
- Seed scripts, checkpoint sources and package dependency references.
- Large-file hotspots where a future split may be justified.

## Findings

The runtime graph contained three confirmed orphan modules:

- `src/components/living/living-canvas.tsx`
- `src/hooks/use-organism-state.ts`
- `src/server/sentinel/public-dialogue.ts`

None had a consumer outside their own dead chain.
The old `scripts/seed-public-registry.ts` script also had no package-script,
README or source reference. The active public seed entry is
`scripts/seed-public-sections.ts`.

The three `/api/guestbook/*` mutation endpoints duplicated the active
`/api/discuss/*` implementations. Public `/guestbook` page redirects are
still useful for backward compatibility, so the routes remain while their API
handlers now delegate to Discuss.

A large legacy CSS layer contained declarations for retired home, living-field,
old Stack, old CMS-home and old theme-switch surfaces. Cleanup was verified
against current TS/TSX class references: no class that was styled in the
baseline lost its final active CSS definition.

Stale i18n branches tied only to removed living-field / old home surfaces were
removed.

Archived checkpoint TS/TSX files under `docs/checkpoints/**` are now excluded
from the application TypeScript project. They remain as historical source
snapshots but no longer participate in production type-checking.

## Changes

- Removed the three confirmed orphan runtime modules.
- Removed the unused legacy public-registry seed script.
- Collapsed legacy Guestbook mutation APIs into thin Discuss re-exports.
- Removed legacy/duplicate CSS declarations and stale i18n copy.
- Updated the layout invariant audit to target the current home selectors.
- Fixed the two remaining Stack typography raw-size violations with canonical
  typography tokens.
- Added `display=optional` to the Material Symbols stylesheet and documented
  the intentional global-font ESLint exception.
- Added `bun run audit:repo` for repeatable repository validation.
## Validation

Final import graph:

- 212 TS/TSX source files.
- 82 App Router roots.
- 211 runtime-reachable files.
- 0 orphan candidates.
- Remaining non-runtime source is script-reachable seed support.

Validation completed successfully:

- `bunx tsc --noEmit`
- `bun run layout:check`
- `bun run theme:check`
- `bun run typography:check` — PASS, 0 violations
- `bun run music:expression-check`
- `git diff --check`
- `bun run build` — full Next.js 16 production build, 55 static pages generated

Route smoke tests:

- `/`, `/projects`, `/writing`, `/stack`, `/music-sensor`,
  `/about`, `/discuss`, `/privacy`, `/terms`, `/search`,
  `/control/login` => 200.
- `/guestbook` => 308 permanent compatibility redirect, expected.

ESLint has 0 errors. It retains 22 `@next/next/no-img-element` warnings for
dynamic avatars/media. These were intentionally not mass-converted in this
cleanup because a correct `next/image` migration needs an explicit
remote-image/loader policy.
## Large-file hotspots intentionally deferred

These files are large enough to justify future focused refactors, but splitting
them inside a dead-code cleanup PR would increase regression risk:

1. `src/app/globals.css` — ~10.3k lines.
   Candidate split: base/theme, home, stack, control/CMS, writing/community.
2. `src/components/stack/stack-spatial.tsx` — ~1.3k lines.
   Candidate split: geometry/model, SVG layers, interaction/inspector.
3. `src/community/data.ts` — ~1.2k lines.
   Candidate split: queries, mutations, moderation, reactions/account ownership.
4. `src/components/control/cms-post-editor.tsx` — ~637 lines.
   Candidate split: editor shell, media flow, metadata/SEO controls.
5. `src/app/api/music/state/route.ts` — ~528 lines.
   Candidate split: state assembly service from HTTP route adapter.

Recommendation: handle these as separate behavior-preserving PRs with focused
visual/API acceptance rather than combining them with this cleanup.

## Result

This cleanup removes dead/orphan code and duplicated legacy implementations
without removing backward-compatible public routes or changing intended user
behavior. Production build and custom invariants remain green.
