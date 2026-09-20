# Theme Contrast Standard

This document defines the light/Normal mode contrast contract for thaiduy.digital.

## Semantic text roles

Normal mode must use these roles rather than carrying Dark-mode hex colors across themes:

- `--text-strong: #172019`
- `--text-body: #46534b`
- `--text-secondary: #5c6961`
- `--text-meta: #667269`
- `--text-faint: #768179` — decorative/nonessential only
- `--link: #1b6c4d`

## Semantic surface roles

- `--surface-1: #fafbf8` — main card/panel
- `--surface-2: #f2f5f0` — secondary card/compact control
- `--surface-3: #e9eee8` — compact fallback/avatar surface
- `--surface-input: #ffffff` — form/input surface
- `--surface-hover: #eef3ee` — soft hover/focus surface

## Rules

1. A public Normal-mode surface must not inherit a Dark-mode near-black background.
2. A public Normal-mode text selector must not inherit a pale Dark-mode foreground.
3. Inputs, textareas, popovers, runtime cards, tooltips, inspectors and compact controls require explicit Normal-mode surfaces when their Dark-mode rule is hard-coded.
4. Placeholder text must remain readable and must not rely on browser opacity defaults.
5. Inline tag chips keep their registry-owned colors.
6. Fenced code blocks intentionally remain dark in both themes.
7. Photo-credit overlays intentionally remain dark because they sit directly on images.
8. Theme changes must not alter typography scale.
9. Hover/focus/active states require their own readable Normal-mode foreground/background pair.
10. Decorative faint text must never carry primary reading content.

## Header Music Wave

Normal mode waveform must remain a multi-color signal, never collapse into a black line.

Current Normal palette:
- bass: teal
- low-mid: green-teal
- mid: sage
- vocal: amber
- presence: blue
- air: violet

The waveform geometry and mask must taper/fade symmetrically toward both ends.

## QA

Run:

```bash
bun run theme:check
bun run typography:check
```

`theme:check` fails when public Dark-mode bright text or dark surfaces leak into Normal mode without an explicit override or documented exception.


## Structure contract

Normal mode must also provide explicit light-theme treatment for structural paint inherited from Dark mode:

- borders and separators
- SVG `stroke` / `fill`
- grid lines
- card outlines
- hover/focus outlines
- score/staff notation

A component is not considered theme-safe merely because its foreground and background are readable.

## Control theme isolation

The public site supports Dark and Normal themes.

`/control` is intentionally a dark operational console and is isolated from the public Normal palette. Under `html[data-theme='normal']`, `.control-root` and `.control-login` restore the dark semantic variables and `color-scheme: dark`.

Do not partially light-theme Control unless a dedicated Control light-theme project is explicitly started.

## Automated gate

`bun run theme:check` now verifies:

- bright Dark-mode text does not leak into public Normal mode
- near-black Dark-mode surfaces do not leak into public Normal mode
- light Dark-mode borders do not disappear on Normal surfaces
- light SVG stroke/fill does not disappear on Normal surfaces
- semantic Normal text roles meet their minimum contrast ratios
- Control dark-isolation remains present
