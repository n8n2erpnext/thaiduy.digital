# Typography Standard

This document is the canonical typography contract for thaiduy.digital.

The system is Apple-inspired in its use of semantic text roles, restrained hierarchy, readable small text, and responsive scaling. It is not an Apple visual clone.

## 1. Font families

Public/editorial UI:
- `var(--font-google-sans)`
- Use for display headings, body copy, navigation, cards, form copy, and article content.

System/telemetry/meta UI:
- `var(--font-terminal)`
- Use for runtime state, labels, timestamps, small metadata, tags, technical annotations, and code-adjacent UI.
- Do not use a monospace face as a reason to make text tiny.

## 2. Canonical scale

| Semantic role | Token | Desktop | Typical use |
| --- | --- | ---: | --- |
| Display Large | `--type-display-lg` | 48–72px | Homepage hero, generic section hero |
| Display | `--type-display` | 44–64px | Article/project/search/music page title |
| Display Small | `--type-display-sm` | 38–52px | Legal/control hero, secondary display |
| Title 1 | `--type-title-1` | 30–40px | Major section heading |
| Title 2 | `--type-title-2` | 24–32px | Card/article subsection heading |
| Title 3 | `--type-title-3` | 20–24px | Small section/card heading |
| Body Large | `--type-body-lg` | 19px | Lead paragraph, article deck |
| Body | `--type-body` | 17px | Main reading copy |
| Body Small | `--type-body-sm` | 15px | Card summaries, secondary copy |
| UI | `--type-ui` | 13px | Navigation, rows, buttons, compact UI |
| Label | `--type-label` | 12px | Strong metadata, values, secondary controls |
| Meta | `--type-meta` | 11px | Kicker, timestamp, terminal/status metadata |
| Diagram | `--type-diagram` | 10px | Dense SVG/graph labels only |
| Diagram Min | `--type-diagram-min` | 9px | Exceptional score/diagram geometry only |
| Brand | `--type-brand` | 14px | Header brand name |
| Code | `--type-code` | 13px | Article code blocks |

Special semantic roles:
- `--type-statement`: 38–58px; manifesto / oversized statement only.
- `--type-pullquote`: 19–26px; project overview / pullquote-like copy.

## 3. Hard floors and ceilings

Public UI:
- Primary readable copy: never below 15px.
- Interactive UI: never below 13px unless it is metadata.
- Metadata/terminal labels: never below 11px.
- Major display text: never above 72px desktop.
- Do not introduce a new 80–120px page title.

Control UI:
- Dense metadata/control floor: 11px.
- Input/table normal copy: 12–13px.
- Long-form editor body: 17px.
- Control may be denser than public, but never use 6–8px UI labels.

Diagram / SVG:
- Default: 10px.
- Hard floor: 9px.
- 9px is allowed only where geometry makes 10px impractical.
- Never use 9px for buttons, navigation, form labels, cards, tables, or prose.

## 4. Responsive rules

At <=760px:
- Display Large: about 42–54px.
- Display: about 40–50px.
- Display Small: about 34–44px.
- Title 1: about 28–34px.
- Title 2: about 23–28px.
- Body/UI/meta sizes do not shrink below their normal semantic role.

Rule: reduce display scale before reducing body legibility.

## 5. Line height

Use:
- Display: `--leading-display` (~0.98)
- Heading: `--leading-heading` (~1.12)
- Body: `--leading-body` (~1.65)
- Article body: 1.75–1.8 is acceptable.
- Meta/UI: 1.3–1.5 depending density.

Do not pair large display text with body-like 1.5+ line-height.
Do not pair body text with compressed 1.0–1.2 line-height.

## 6. Tracking

Use:
- Display: `--tracking-display` (~-0.045em)
- Labels/meta: `--tracking-label` (~0.055em)

Avoid:
- extreme negative tracking below -0.06em
- all-caps metadata with tracking above 0.10em
- positive tracking on large display headings

## 7. Weight

Preferred weights:
- 400: body / normal UI
- 500: headings / emphasized values
- 600: brand / strong compact labels

Avoid using 700+ to create hierarchy. Prefer size, spacing, contrast, and placement.

## 8. Semantic mapping

Homepage:
- Hero H1 -> Display Large
- Hero lede -> Body Large
- Eyebrow -> Label
- Runtime/meta -> Meta
- Activity row -> UI
- Manifesto -> Statement

Writing:
- Article H1 -> Display
- Deck -> Body Large
- Article body -> Body
- H2 -> Title 1
- H3 -> Title 2
- H4 -> Title 3
- Tags/meta/timestamps -> Meta
- Code -> Code

Projects:
- Project page title -> Display
- Overview emphasis -> Pullquote
- Summary -> Body / Body Small
- Facts/runtime labels -> Meta

Music Sensor:
- Page title -> Display
- Pipeline section heading -> Title 1/2
- Knowledge/stat labels -> Meta
- Composer metadata -> Meta
- Score annotations -> Diagram Min only where required

Control:
- Page title -> Display Small
- Editor title -> Title 1
- Editor prose -> Body
- Table/form text -> UI/Label
- Dense status/meta -> Meta

## 9. Implementation rules

1. New components must use an existing `--type-*` token.
2. Do not add arbitrary `font-size: 7px`, `83px`, etc.
3. Do not add inline `style={{ fontSize: ... }}` in TSX.
4. Do not add Tailwind arbitrary font-size utilities such as `text-[11px]`.
5. If a genuinely new semantic role is needed, add one token here and in `globals.css`; do not invent one-off component sizes.
6. Component-specific CSS may change weight, family, color, line-height and tracking, but size must map to the semantic scale.
7. Theme changes must not alter font sizes.
8. Vietnamese and English use the same semantic size role. Do not shrink Vietnamese copy to make it fit.

## 10. QA gate

Run:

```bash
bun run typography:check
```

The audit checks:
- inline/arbitrary font sizes outside the typography system
- legacy tiny/oversized selectors that are no longer covered by the canonical typography layer
- raw font-size declarations added after the typography contract marker

Any exception must be documented in this file and encoded in the audit script.
