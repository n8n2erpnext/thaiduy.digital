# Systems Atlas pre-icon + global-nav checkpoint

Canonical date: 2026-09-20.

This directory snapshots the owner-approved current /stack presentation after:
- Systems Atlas reconstruction
- rollback to the pre full-icon experiment
- removal of DISCOVERY/FRESH telemetry
- restoration of the shared global SiteHeader contract

Files:
- stack-spatial.tsx -> src/components/stack/stack-spatial.tsx
- stack-page.tsx -> src/app/stack/page.tsx
- globals.css -> src/app/globals.css

Use only for surgical recovery.
Do not restore these files blindly if later work intentionally changed unrelated global CSS.

Current visual contract:
- House -> Room -> Object logic unchanged
- Dark and Normal share one structure
- no RoomGlyph / service pictogram pass
- global nav must match /writing and /projects
- Stack-specific nav geometry overrides are forbidden

See repository root HANDOFF_2026-09-20_FULL.md, sections 55 onward.
