# Layout Invariants

These rules protect the public shell from regressions introduced by visual passes.

## Sticky header

- `.site-header` must remain `position: sticky`.
- Homepage must explicitly keep `.home-shell > .site-header { position: sticky }`.
- Homepage sticky header z-index must stay >=20.
- `.site-shell`, `.home-shell`, and `.home-page` must not become vertical scroll containers through `overflow: hidden|auto|scroll|clip`.
- Decorative homepage layers must remain below the header.

## Homepage atmosphere

The homepage atmosphere is a sibling of the constrained `.site-shell` inside `.home-page`.

This is intentional:
- it allows full-bleed visual treatment
- it avoids `100vw` scrollbar-width overflow on desktop
- it avoids forcing root `overflow-x:hidden`
- it keeps sticky header mechanics independent from the decorative background

Contract:
- `.top-atmosphere { left: 0; width: 100%; z-index: 0 }`
- do not reintroduce `width: 100vw`
- do not move the atmosphere back inside the constrained shell without re-testing sticky + horizontal overflow

## Automated gate

Run:

```bash
bun run layout:check
```

The audit currently verifies:
- base sticky header
- homepage sticky override
- sticky z-index ordering
- no sticky-breaking vertical overflow on shell ancestors
- full-page atmosphere width/left contract
- atmosphere stays beneath the header
