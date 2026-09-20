# Golden Public Site Checkpoint — 2026-09-20

This directory documents the canonical public-site checkpoint created after the full pre-golden audit.

## Canonical state

- Repository: `/home/ubuntu/n8n2erpnext/thaiduy.digital`
- Branch: `main`
- Golden tag: `golden-2026-09-20-public-site`
- Baseline before consolidation: `origin/main` at `a2352940f7e063d3c8b53a07512b4854f1ae69fd`
- Home `/` is the former approved public-systems-notebook layout, now fully canonical.
- `TopAtmosphere` is the canonical Home background and blends through the Hero boundary.
- `/stack` remains Systems Atlas PRE-ICON + GLOBAL NAV.
- Stack persistent visual rollback remains in `docs/checkpoints/2026-09-20-systems-atlas-pre-icon-global-nav/`.

## Demo cleanup

The following routes were removed completely:
- `/home-demo`
- `/hero-demo`
- `/hero-demo-2`
- `/stack-demo`

The production rack visual moved from `src/components/demo/` to `src/components/home/rack-server-visual/` and is now named `RackServerVisual`.

## Audit fixes included

- Removed unused `@aws-sdk/s3-request-presigner` dependency.
- Added explicit `server-only` dependency for direct imports.
- Removed obsolete `ActivityRail` and `EntityConsole` components.
- Removed their verified dead CSS namespaces while preserving shared primitives still in use.
- Removed stale generated `runtime/` data and added `/runtime/` to `.gitignore`.
- Removed orphan SVG filter reference `url(#rackv2-soft)`.
- Fixed the rack visual CSS-module import after moving it into the Home namespace.
- Normalized whitespace/line endings caught by `git diff --check`.

## Acceptance at checkpoint creation

- ESLint: 0 errors; 13 known `@next/next/no-img-element` warnings.
- TypeScript `tsc --noEmit`: PASS.
- Theme audit: PASS; 460 Normal-mode selectors; 0 uncovered contrast/paint issues.
- Layout audit: PASS.
- Typography audit: PASS; 1047 canonical selectors across 154 source files.
- `git diff --check origin/main`: PASS.
- Next.js production build: PASS, 40/40 static generation steps.
- Build route manifest contains no `*-demo` routes.

Use the Git tag above as the rollback point for the full repository state rather than copying individual files from this checkpoint directory.
