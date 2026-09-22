# THAIDUY.DIGITAL — FULL HANDOFF — 2026-09-22

> Authoritative continuation handoff for the next session.
> Repository: /home/ubuntu/n8n2erpnext/thaiduy.digital
> Public site: https://thaiduy.digital
> GitHub: https://github.com/n8n2erpnext/thaiduy.digital
> Runtime host used in this session: VPS-ARM
> Timezone: Asia/Ho_Chi_Minh (+07)
> Current public/control implementation is the source of truth described below.

---

# 0. READ THIS FIRST

## 0.1 This file supersedes stale state warnings in older handoffs

Historical handoffs remain in the repo:

- HANDOFF_2026-09-18_FULL.md
- HANDOFF_2026-09-20_FULL.md

They are useful for design history, rejected experiments and old implementation details.

However, their Git/worktree/runtime warnings are no longer current.

As of this handoff:

- branch: main
- code baseline before this handoff-doc commit: fa870dec92f7597deb7ee53999a53faf70a6d15d
- origin/main matched that code baseline before the handoff document was committed
- code baseline subject: feat: add semantic brain profile controls
- after this file is committed, git log -1 will naturally show the newer documentation commit
- worktree: CLEAN
- current runtime: Next dev on port 3000
- public site smoke: healthy
- latest production build: 44/44 routes PASS

Do not treat the old 20/09 “dirty worktree / do not reset” warning as current state.

## 0.2 Current golden lineage

Important commits:

- adae83de — tag golden-2026-09-20-public-site — feat: golden public site checkpoint 2026-09-20
- 57e61843 — feat: expand living surface control and verifiable CV
- fa870dec — feat: add semantic brain profile controls

The current branch is two feature commits ahead of the 20/09 golden tag.

## 0.3 Secrets

Never print, paste into chat, commit, or expose secret material.

Especially protect:

- .env.local
- Better Auth secret
- Google OAuth secret
- Redis credentials
- R2 credentials
- GitHub token if configured
- Discord webhook URL
- Unsplash credential material
- root unsplash.txt and any other local secret note files

The contact form uses Discord server-side. The public UI must never receive the webhook URL.

## 0.4 Owner direction

Current focus is the website and control plane.

Android / Scrobble Hub work remains paused unless explicitly requested.

---

# 1. CURRENT REPO / GIT STATE

Repository:

/home/ubuntu/n8n2erpnext/thaiduy.digital

Branch:

main

Current HEAD:

fa870dec92f7597deb7ee53999a53faf70a6d15d

origin/main:

fa870dec92f7597deb7ee53999a53faf70a6d15d

Current worktree at handoff:

CLEAN

Current tag retained:

golden-2026-09-20-public-site -> adae83de

The owner explicitly prefers committing completed work instead of leaving large dirty diffs around.

Normal closeout pattern now:

1. run QA gates
2. run production build
3. inspect git diff / staged stat
4. secret-scan staged diff
5. commit
6. push origin main
7. leave worktree clean

Do not create a branch unless the owner asks for one or a risky experiment clearly warrants isolation.

---

# 2. CURRENT RUNTIME / SERVING CONTRACT

Current live process on VPS:

- Next.js development runtime
- bun dev
- port 3000
- process observed as next-server
- public domain thaiduy.digital forwards to this runtime

At handoff:

port 3000 is LISTENING.

Current smoke:

/                            200
/writing                     200
/projects                    200
/stack                       200
/music-sensor                200
/about                       200
/cv                          200
/verify                      200
/control                     307 expected unauthenticated redirect
/control/traffic             307 expected unauthenticated redirect
/control/traffic/cv          307 expected unauthenticated redirect
/control/audit               307 expected unauthenticated redirect
/control/brains              307 expected unauthenticated redirect
/control/assets              307 expected unauthenticated redirect
/control/login               200

A 307 on protected control routes while not logged in is correct behavior.

Important:

- current serving process is still development mode
- final containerized production deployment has not replaced this runtime
- restarting bun dev is acceptable when needed
- always smoke public routes after restart

---

# 3. CURRENT QA / ACCEPTANCE STATE

Latest accepted code QA before this handoff:

- TypeScript: PASS
- ESLint: PASS
- layout invariant audit: PASS
- theme contrast audit: PASS
- typography audit: PASS
- git diff --check: PASS
- production Next build: PASS
- generated route count: 44/44

Canonical checks:

bunx tsc --noEmit
bunx eslint <changed files>
bun run layout:check
bun run theme:check
bun run typography:check
git diff --check
bun run build

The repo has custom governance scripts. Do not skip them after layout/theme/type changes.

---

# 4. PUBLIC DESIGN LANGUAGE — DO NOT REGRESS

The site now has a coherent public visual language.

Core properties:

- calm systems-lab presentation
- generous whitespace
- thin structural rules
- restrained green/blue signals
- no decorative motion for its own sake
- live motion/data should correspond to real state
- typography hierarchy is governed by repo tokens
- bilingual EN / VI
- Normal and dark/control modes must remain readable
- public content should feel editorial and technical, not dashboard-heavy unless the section is explicitly live data

Owner preference learned repeatedly:

- visual hierarchy should feel deliberate, not crowded
- avoid thick cards and excessive shadows
- avoid arbitrary icon decoration
- do not center the logo inside navigation as a gimmick
- preserve a strong global nav rhythm
- large section numbers may be used as a visual anchor
- accepted section-number treatment: larger number with lower-half fade that visually merges toward the section title
- do not use the small content-row numbering style for section numbering

---

# 5. GLOBAL HEADER / NAV CONTRACT

The final nav direction returned to the golden-style brand layout.

Preserve:

- brand/logo at the start of nav
- Thái Duy brand text
- Systems Lab / localized equivalent
- Projects
- Writing
- Stack
- About
- search
- theme control
- locale control
- bootstrap/status indicator

Rejected experiments:

- logo centered between Writing and Stack
- logo-only centered composition
- icon-heavy global nav
- inconsistent nav between /stack and /writing or /projects

If modifying global nav, compare it against multiple public routes, not only home.

---

# 6. CANONICAL HOME PAGE

Canonical homepage is now /.

Old demo routes were removed during the golden consolidation.

Do not resurrect home-demo / hero-demo variants unless owner explicitly requests a new experiment.

The homepage source is:

src/app/page.tsx

Key components/services include:

- src/components/home/rack-server-visual/rack-server-visual.tsx
- src/components/home/top-atmosphere.tsx
- src/components/home/github-public-pulse.tsx
- src/server/github/public-pulse.ts
- src/server/public/api-wall.ts
- src/server/sentinel/telegram-wall.ts
- src/server/stack/organism.ts

The hero uses RackServerVisual and the current public systems-lab copy.

The background/atmosphere transition was tuned so the hero does not visually end in a hard cut.

Do not reintroduce the earlier harsh section boundary.

---

# 7. HOME — LIVE TRACE

The homepage Live Trace is real data, not mock data.

Two current streams:

1. THAIDUY.DIGITAL / API WALL
2. LUNA / TELEGRAM

## 7.1 API WALL

Source:

src/server/public/api-wall.ts

Public contract:

- show safe API wall entries
- method
- route/path
- status
- duration
- time
- no raw IP
- no headers
- no request body
- no secret/query payload exposure

UI explicitly marks the feed as wall-safe.

Do not turn this into raw server logs.

## 7.2 Luna Telegram

Source:

src/server/sentinel/telegram-wall.ts

Homepage uses recent actual Luna Telegram alert messages.

Contract:

- use delivered Telegram alert/outbox data
- exclude daily reports
- redact source IP
- show useful alert semantics
- current translation includes natural Vietnamese such as “Hành vi bất thường”
- show scan focus when present
- recent display may show multiple messages; do not collapse back to a single hardcoded fake message

This is an observability surface, not a chat transcript dump.

---

# 8. HOME — NOW / LIVE SYSTEMS / CURRENT WORK

The old static “Live Systems / Current Work” idea was replaced with actual state.

Current sources:

- public organism state for live systems
- GitHub public pulse for current public engineering work
- newest Writing item for field note signal

Do not hardcode “LightBI” as current work.

The current-work card is derived from public GitHub activity.

The live-systems card is derived from organism state.

---

# 9. HOME — PUBLIC GITHUB PULSE

This is now a real live public GitHub section for organization:

n8n2erpnext

Files:

- src/server/github/public-pulse.ts
- src/components/home/github-public-pulse.tsx

Contract:

- GitHub public API
- 15-minute Next cache
- organization public repositories
- .github repository is excluded
- archived repos are excluded from the visible active list
- visible repo signal currently capped to seven for latest commit collection
- repo UI shows top five rows
- commit signal shows up to seven latest repo commits
- stars
- forks
- issues
- latest push
- latest commit
- active repos in 30 days
- 53-week public commit activity heatmap
- public commit total indexed by GitHub
- source link to GitHub
- degraded state if GitHub API fails

Important implementation detail:

GitHub commit search is paged up to GitHub search limits.

The .github repo is excluded from activity counts after retrieval.

Do not fake contribution counts or synthesize unavailable activity.

---

# 10. SELECTED WORK / PROJECTS

Projects remain a catalogue + detail system.

Public:

- /projects
- /projects/[key]

Control:

- /control/content/projects
- /control/content/projects/new
- /control/content/projects/[id]

Project cards support project logos.

Do not reduce project list back to plain text-only rows.

Current homepage Selected Work displays a small curated slice.

Project detail remains the richer surface.

---

# 11. WRITING

Public:

- /writing
- /writing/[slug]
- /search

Control:

- /control/content/writing
- /control/content/writing/new
- /control/content/writing/[id]
- /control/content/writing/comments
- /control/content/tags

Writing system supports:

- bilingual posts
- rich editor
- slash menu
- code highlighting
- comments
- moderation
- pagination
- highlight state
- max two highlighted items on the public Writing surface
- governed tags
- tag colors
- search
- R2/Unsplash media
- likes/comments APIs

The public Vietnamese copy was reviewed to avoid literal/robotic translation.

Preserve natural Vietnamese phrasing.

---

# 12. STACK

Public:

/stack

Control:

/control/stack

Stack architecture remains:

House -> Room -> Object

Historical accepted topology baseline:

- 45 nodes
- 71 links
- 7 rooms

Important persistent rollback checkpoint:

docs/checkpoints/2026-09-20-systems-atlas-pre-icon-global-nav/

Contains:

- stack-spatial.tsx
- stack-page.tsx
- globals.css
- README.md

This checkpoint represents the accepted Systems Atlas PRE-ICON + GLOBAL NAV state.

Do not repeat the icon-heavy redesign that was explicitly rejected.

Stack wiring visual contract:

- direction should read clearly
- 90-degree bends are acceptable/preferred where used
- hover hit area was enlarged
- topology should feel spatial and architectural
- public state should be explainable
- live Docker/LXD status should correspond to real state
- GET STATUS has bounded freshness behavior

---

# 13. MUSIC SENSOR

Public:

/music-sensor

Control:

/control/music-sensor

The Music Sensor is intentionally a live/public instrument and learning surface.

It is not just decorative animation.

Current architecture includes semantic + acoustic + fusion concepts, backed by Sentinel music knowledge and runtime state.

Public UI should remain quiet when there is no real playback signal.

Do not fake waveform/music state for visual interest.

---

# 14. ABOUT

Public:

/about

Source:

src/app/about/page.tsx

The About page now includes managed About content plus a real contact surface.

Contact component:

src/components/about/contact-channel.tsx

Contact API:

/api/contact

Current contact UX:

- email route
- GitHub route
- CV route
- response expectation
- name
- email
- optional phone
- message
- arithmetic anti-spam challenge
- hidden honeypot
- rate limiting
- status messaging
- EN / VI

Current delivery contract:

- submission is stored first
- then server-side Discord notification is sent
- Discord webhook stays secret/server-only

Do not switch this back to Telegram.

The owner specifically corrected the notification target to Discord.

---

# 15. CONTACT ANTI-SPAM CONTRACT

Current anti-spam design includes multiple layers:

- arithmetic challenge
- signed/validated challenge flow
- challenge refresh
- honeypot field
- request validation
- rate limiting
- server-side webhook only

The UI copy should not sound like CAPTCHA boilerplate.

Keep it light and native to the site.

---

# 16. CV — CURRENT PRODUCT CONTRACT

Public:

/cv

Snapshot detail:

/cv/document/[id]

Verification:

/verify

Key files:

- src/app/cv/page.tsx
- src/components/cv/cv-document.tsx
- src/components/cv/cv-actions.tsx
- src/server/cv/snapshots.ts
- src/app/verify/page.tsx
- src/app/cv/document/[id]/page.tsx

The CV is not a static downloadable file.

Each visit to /cv issues a new immutable snapshot.

Current behavior:

- force-dynamic route
- new Document ID per issued snapshot
- snapshot content stored at issuance
- content hash / fingerprint
- print-ready document
- Save PDF intent
- Print
- Copy Document ID
- Verify
- QR code in document footer
- QR resolves to /verify with Document ID prefilled
- printed/PDF copy can be checked later against stored snapshot
- verification can show valid, invalid format, not found, or revoked
- verified snapshot can be reconstructed for comparison

Current Document ID format:

CV-YYYYMMDD-XXXXXXXXXX

Do not remove the verifiability contract.

---

# 17. CV VISUAL CONTRACT

The web CV page and print/PDF document were explicitly brought into alignment.

Do not let screen and print drift apart again.

Current design direction:

- restrained paper surface
- minimal shadow
- document itself remains primary
- utility controls live beside the document rather than as a heavy floating top bar
- page numbering belongs inside the document layout
- title/caption hierarchy should read as editorial, not as browser UI
- footer contains Document ID / fingerprint / issued time / verify information
- QR is small and functional
- verification text must not crowd the footer

The earlier heavy top utility bar and excessive document shadow were rejected.

---

# 18. CV ANALYTICS

CV events now use the same first-party analytics pipeline as site traffic.

Client helper:

src/lib/analytics-client.ts

CV action component:

src/components/cv/cv-actions.tsx

Tracked events:

- cv_print
- cv_pdf
- cv_verify
- cv_copy_id

Pageview of /cv comes from the normal TrafficBeacon.

Important semantic rule:

cv_pdf means PDF INTENT.

The browser/OS print dialog does not expose whether the user completed the final filesystem save.

Do not label cv_pdf as a guaranteed completed download.

Privacy rule:

Document ID is not placed into analytics properties.

---

# 19. ANALYTICS PIPELINE

Collector:

/api/analytics/collect

Beacon:

src/components/site/traffic-beacon.tsx

Client custom-event helper:

src/lib/analytics-client.ts

Queries:

src/control/queries.ts

Storage already supported:

- event type
- event name
- path
- properties
- session
- visit
- device
- browser
- OS
- country if edge metadata exists
- referrer
- UTM fields
- timestamp

No schema migration was needed for the expanded Traffic/CV analytics.

Privacy contract:

- raw IP is not stored
- control routes are excluded from public page analytics
- bot filtering remains on
- first-party session cookie
- visit window around 30 minutes

---

# 20. PAGEVIEW DEDUPE

A real double-count issue was found during QA.

React development behavior could fire duplicate pageviews for the same URL.

TrafficBeacon now performs a narrow same-URL dedupe window of about 1.5 seconds.

Intent:

- suppress StrictMode/HMR duplicate effects
- a real reload still counts
- navigating A -> B -> A still counts again

Do not remove this without replacing it with equivalent dedupe behavior.

---

# 21. LOCATION PRIVACY / TIMEZONE FALLBACK

Traffic dashboard should not pretend timezone equals country.

Current behavior:

- use edge-provided country when available
- if country is missing, use browser timezone from analytics properties
- display fallback as TZ · <timezone>
- do not infer a country from timezone
- old historical events collected before timezone support may still show unknown / — and that is acceptable

The collector/client sends browser timezone using Intl.DateTimeFormat().resolvedOptions().timeZone.

---

# 22. CONTROL PLANE — AUTH / GENERAL

Public login:

/control/login

Protected root:

/control

Protected layout:

src/app/control/(protected)/layout.tsx

Shell/navigation:

- src/components/control/control-shell.tsx
- src/components/control/control-nav.tsx

Auth direction:

- Google OAuth is primary
- owner password exists only as fallback
- owner identity comes from protected server configuration
- protected routes redirect unauthenticated users
- internal control APIs must enforce owner auth

Do not expose owner identifiers or credentials in public UI.

---

# 23. CONTROL SIDEBAR — CURRENT UX

Current sidebar top-level items include:

- Overview
- Content
- Media
- Runtime
- Stack
- Music Sensor
- Traffic
- Brains
- Settings
- Account
- Audit

Traffic is a parent menu.

Traffic behavior:

- default collapsed when outside Traffic
- click TRAFFIC to expand/collapse
- children:
  - Overview
  - CV
- automatically starts expanded when route is under /control/traffic
- parent uses +/- state
- child current route is highlighted

Do not permanently expose Overview/CV under Traffic when collapsed.

This exact behavior was corrected after owner review.

---

# 24. CONTROL / OVERVIEW

Route:

/control

The old Overview was too empty.

It now includes operating metrics and a 7-day traffic chart.

Current primary metrics:

- Registry
- Traffic / 24H
- Active / 5M
- CV issued / 24H
- Published Writing

Current 7-day chart:

- public pageviews
- explicit events
- visitors per day shown in labels
- local day basis Asia/Ho_Chi_Minh

Operating-state cards include:

- Ready Media
- Runtime Bindings
- Feature Flags
- Active Brains

The page should feel like an operator landing surface, not an empty five-number row.

---

# 25. CONTROL / TRAFFIC / OVERVIEW

Route:

/control/traffic

Current dashboard includes:

24H pulse:
- Active / 5M
- Visitors / 24H
- Visits / 24H
- Pageviews / 24H
- Events / 24H

Breakdowns:
- Top Pages
- Custom Events
- Referrers
- Country / Timezone
- Devices
- Browsers
- Operating Systems
- UTM Sources
- Campaigns

Recent Signals:

- default 10 rows
- selectable 10 / 20 / 30
- selector is horizontal
- changing 10/20/30 does not reload the page
- hot-updates only the Recent Signals panel
- Previous / Next also hot-update only the panel
- shows total records
- shows PAGE x / y
- owner-only data API

Component:

src/components/control/traffic-recent-panel.tsx

API:

/api/control/traffic/recent

The API must remain owner-only.

---

# 26. CONTROL / TRAFFIC / CV

Route:

/control/traffic/cv

This is intentionally separated from general Traffic.

Current CV metrics:

- CV Views
- Unique Viewers
- Print
- PDF Intent
- Verify
- Copy ID
- Action / View

Context:

- 24H primary
- 7-day comparison/context

The page also includes semantic explanation cards:

- View
- Print / PDF
- Verify / Copy ID

Recent CV activity:

- 7-day scope
- default 10
- 10 / 20 / 30 horizontal selector
- hot update
- pagination
- uses the shared TrafficRecentPanel

Do not merge CV back into the general traffic dashboard unless owner asks.

---

# 27. CONTROL / AUDIT

Route:

/control/audit

Meaning:

Audit is the durable operator/control-plane mutation log.

It is not visitor traffic.

Typical actions include:

- registry.update
- registry.disable
- post.create
- writing_tag.create
- brain.save.enabled / disabled
- other durable content/control mutations

Recorded fields include:

- timestamp
- action
- entity type
- entity ID
- actor

Audit UI was upgraded to match Traffic interaction:

- default 10 rows
- horizontal 10 / 20 / 30 selector
- hot update only the table/panel
- Previous / Next
- total records
- PAGE x / y
- no full page reload

Component:

src/components/control/audit-log-panel.tsx

Owner-only API:

/api/control/audit

Unauthenticated API call should return 401.

---

# 28. CONTROL / ASSETS

Route:

/control/assets

The page was previously functionally present but visually raw because JSX classes had no matching CSS.

It has been rebuilt into the control visual system.

Current structure:

- media header
- stats
- upload panel
- styled file input
- responsive asset grid
- 16:9 previews
- filename / size / state
- EN / VI alt text editing
- hide / trash / restore / purge actions
- trashed state visually reduced

No storage/R2/database behavior was intentionally changed during the UI rebuild.

Do not regress it back to raw HTML-looking rows.

---

# 29. CONTROL / CONTENT

Route:

/control/content

This remains the stronger visual baseline for control surfaces.

It provides entry points for:

- Projects
- Writing
- Writing Tags
- Media
- Site Structure
- Recent editorial changes

When a control page feels visually incomplete, compare it against Content before inventing a new design language.

---

# 30. CONTROL / RUNTIME

Route:

/control/runtime

Runtime still represents lower-level bindings/configuration.

The general design direction now established by Brains is:

- semantic/default UI first
- raw config as advanced escape hatch

If Runtime is redesigned later, follow that pattern instead of leaving large raw JSON as the primary surface.

Do not change runtime semantics merely for cosmetic reasons.

---

# 31. CONTROL / ACCOUNT / LOGIN / 404

These surfaces were visually normalized during the same control redesign wave.

Account:

/control/account

Login:

/control/login

Key intent:

- owner gate should feel like part of the same control plane
- not a default form dump
- Google primary
- password fallback clearly secondary

404 was also redesigned away from the stock Next.js missing-page appearance.

Preserve the site/control identity if touching these routes.

---

# 32. BRAINS — CURRENT SEMANTIC EDITOR

Route:

/control/brains

Current code commit:

fa870dec — feat: add semantic brain profile controls

The old Brain UI was raw JSON-first.

It showed:

- Left JSON textarea
- Right JSON textarea
- Cortex JSON textarea
- Memory policy JSON textarea
- raw memory state list

That was explicitly identified as inconsistent with the improved control UX.

The current default UI is now semantic/structured.

Primary component:

src/components/control/brain-profile-editor.tsx

Page:

src/app/control/(protected)/brains/page.tsx

Save action remains:

src/app/control/(protected)/brains/actions.ts

No brain schema migration was required.

Runtime data contract remains JSON objects.

---

# 33. BRAINS — CURRENT PROFILE SHAPE

Current observed profile at handoff:

brain key:

sentinel-music

enabled:

true

Left / Semantic:

- role: semantic-ear
- sources:
  - lastfm
  - musicbrainz
  - listenbrainz
- knowledgeVersion: music-k2.0

Right / Signal:

- role: acoustic-ear
- bands:
  - bass
  - lowMid
  - mid
  - presence
  - air
  - vocal
- sources:
  - local-dsp
- knowledgeVersion: music-k2.0

Cortex / Fusion:

- role: fusion
- crossfadeMs: 2200
- hysteresisMs: 4000
- knowledgeVersion: music-k2.0

Memory policy:

- leftMax: 4096
- rightMax: 4096
- cortexMax: 2048

These values are editable through structured fields now.

---

# 34. BRAINS — CURRENT UI STRUCTURE

The semantic Brain UI contains:

Header:
- profile key
- enabled toggle
- total memory entries
- latest learned time

Architecture section:
- Left / Semantic card
- Right / Signal card
- Cortex / Fusion card

Structured controls expose:

Left:
- role
- sources
- knowledge version

Right:
- role
- bands
- sources
- knowledge version

Cortex:
- role
- crossfade milliseconds
- hysteresis milliseconds
- knowledge version

Memory policy section:
- Left capacity
- Right capacity
- Cortex capacity
- observed entries
- utilization meter

Memory state:
- total persisted entries
- latest learned time
- grouped knowledge packs
- group counts
- last learned per group

At handoff the observed total persisted memory count was around 3,150 entries.

This number is live and may change.

---

# 35. BRAINS — RAW JSON ADVANCED MODE

Raw JSON was not removed.

It was intentionally moved into:

ADVANCED / RAW CONFIG

The advanced section contains:

- Left JSON
- Right JSON
- Cortex JSON
- Memory JSON

Important interaction contract:

Editing raw JSON does not immediately overwrite structured state.

The operator must click:

APPLY RAW JSON

Then:

- valid JSON object -> applies to structured state
- invalid JSON -> nothing applied; error state shown

Then Save Brain Profile persists the resulting profile.

Reason:

prevent half-typed invalid raw JSON from silently breaking form submission.

Do not make Raw JSON the default visible surface again.

---

# 36. BRAINS — SAVE / REVISION / AUDIT CONTRACT

saveBrainAction remains the authoritative save path.

It:

- requires control owner
- parses brainKey
- reads enabled state
- validates each config as a JSON object
- updates brainProfiles
- writes a revision with before/after
- writes an audit log
- revalidates /control/brains

Audit action currently distinguishes enabled/disabled save state.

Do not bypass this server action with direct client DB writes.

---

# 37. BRAINS — KNOWLEDGE MANAGER

Route:

/control/brains/knowledge

Detail:

/control/brains/knowledge/[id]

This remains a separate persistent knowledge management surface.

Current features include:

- list knowledge records
- hemisphere/key
- enabled/disabled state
- confidence
- short semantic summary
- edit
- turn on/off
- delete
- reseed default pack

Do not merge the entire knowledge manager into the profile editor.

Profile configuration and knowledge records are separate concerns.

---

# 38. I18N / VIETNAMESE COPY

Public site supports EN / VI.

Vietnamese copy was manually reviewed after literal translations looked unnatural.

Known owner preference:

- natural Vietnamese
- concise technical wording
- avoid word-order artifacts from English
- avoid overly formal machine-translated phrasing

Specific corrected example:

Wrong:
Bất thường hành vi

Accepted:
Hành vi bất thường

When adding new strings, check them in the rendered Vietnamese page.

Do not rely on literal word-by-word inversion.

---

# 39. THEME / TYPOGRAPHY GOVERNANCE

The repo includes automated theme and typography audits.

Do not add arbitrary raw font sizes if a token exists.

Do not introduce new bright text/dark-surface combinations without checking Normal mode.

Important commands:

bun run theme:check
bun run typography:check
bun run layout:check

Current latest audit state:

- theme contrast PASS
- typography PASS
- layout invariants PASS

---

# 40. NORMAL MODE / DARK CONTROL MODE

Public pages support the site theme contract.

Control is intentionally dark/operator-oriented.

Do not blindly apply public Normal-mode styles to control pages.

At the same time, control pages should share:

- spacing rhythm
- typography hierarchy
- border/radius vocabulary
- signal colors
- semantic grouping
- responsive behavior

The recent Content, Traffic, Audit, Assets and Brains pages are the best references.

---

# 41. PUBLIC / PRIVATE DATA BOUNDARY

Public surfaces may show:

- governed public project content
- published Writing
- safe Stack state
- public GitHub data
- safe API wall telemetry
- redacted Luna alert summaries
- Music Sensor public state
- issued CV snapshot verification data

Private/control only:

- owner account
- secret credentials
- raw webhook URLs
- raw IPs
- private headers/body logs
- unpublished content
- internal audit actor details
- configuration controls
- mutable brain profile controls
- raw knowledge management controls

Do not expose control queries directly to public components.

---

# 42. PUBLIC API WALL SAFETY

The homepage API wall intentionally excludes:

- IP address
- headers
- body

This is a public observability feature.

Do not “improve detail” by leaking operational request data.

If adding fields, confirm they are safe at the wall boundary.

---

# 43. CONTROL API AUTH SAFETY

Current hot-update APIs include:

- /api/control/traffic/recent
- /api/control/audit

They are designed for owner-only use.

They validate session/owner and reject unauthenticated access.

Do not move them under a public API contract or remove auth for convenience.

---

# 44. GOLDEN CHECKPOINTS

Persistent checkpoints currently visible include:

docs/checkpoints/2026-09-20-systems-atlas-pre-icon-global-nav/

docs/checkpoints/2026-09-20-golden-public-site/

docs/checkpoints/2026-09-20-cv-pre-utility-rail/

Important Git tag:

golden-2026-09-20-public-site

These are rollback references, not active alternative routes.

---

# 45. REJECTED / DO NOT REPEAT

The following directions were explicitly rejected or rolled back:

## Global nav

- centered logo between nav items
- logo-only centered nav composition
- excessive icons in global navigation
- nav mismatch between Stack and other public routes

## Stack

- icon-heavy redesign that replaced the accepted spatial PRE-ICON composition

## Hero

- hard visual cut between hero illustration/background and following page content

## CV

- heavy floating utility bar above document
- excessive document drop shadow
- print version diverging from screen document
- QR / verify block crowding footer

## Section numbering

- tiny section index visually indistinguishable from content row numbers
- overly large/thick number treatment

Accepted direction is a large but restrained number with a lower-half fade toward the section title.

## Traffic

- CV metrics mixed permanently into general Traffic
- 10/20/30 controls stacked vertically
- changing page size via full-page navigation/reload

## Brains

- raw JSON as the primary default editing experience

---

# 46. OWNER UX PREFERENCES LEARNED

Repeated owner preferences:

- real data over decorative simulation
- live means actually live
- admin/control should be understandable without reading JSON unless advanced access is needed
- simple surfaces should still feel intentional
- avoid giant empty regions unless the whitespace is doing visual work
- compact but not cramped
- controls should behave locally when possible
- list pagination should not reload an entire page if only one panel changes
- parent/child navigation should behave as actual hierarchy
- bilingual copy must sound natural in Vietnamese
- keep rollback/checkpoint discipline before risky visual experiments
- once a feature is accepted, commit it; do not let the worktree remain dirty for no reason

---

# 47. CURRENT FILE MAP — START HERE

Public homepage:

src/app/page.tsx

Global public header:

src/components/site/header.tsx

Home Rack visual:

src/components/home/rack-server-visual/rack-server-visual.tsx

Home GitHub:

src/components/home/github-public-pulse.tsx
src/server/github/public-pulse.ts

Home API wall:

src/server/public/api-wall.ts

Home Luna Telegram wall:

src/server/sentinel/telegram-wall.ts

Stack:

src/app/stack/page.tsx
src/components/stack/

Writing:

src/app/writing/
src/components/writing/
src/content/posts.ts

Projects:

src/app/projects/
src/content/repository.ts

About/contact:

src/app/about/page.tsx
src/components/about/contact-channel.tsx
src/app/api/contact/route.ts
src/server/contact/

CV:

src/app/cv/page.tsx
src/components/cv/cv-document.tsx
src/components/cv/cv-actions.tsx
src/server/cv/snapshots.ts
src/app/verify/page.tsx
src/app/cv/document/[id]/page.tsx

Analytics:

src/components/site/traffic-beacon.tsx
src/lib/analytics-client.ts
src/app/api/analytics/collect/route.ts
src/control/queries.ts

Control shell:

src/components/control/control-shell.tsx
src/components/control/control-nav.tsx

Control overview:

src/app/control/(protected)/page.tsx

Traffic:

src/app/control/(protected)/traffic/page.tsx
src/app/control/(protected)/traffic/cv/page.tsx
src/components/control/traffic-recent-panel.tsx
src/app/api/control/traffic/recent/route.ts

Audit:

src/app/control/(protected)/audit/page.tsx
src/components/control/audit-log-panel.tsx
src/app/api/control/audit/route.ts

Assets:

src/app/control/(protected)/assets/page.tsx
src/components/control/asset-upload.tsx

Brains:

src/app/control/(protected)/brains/page.tsx
src/components/control/brain-profile-editor.tsx
src/app/control/(protected)/brains/actions.ts
src/app/control/(protected)/brains/knowledge/
src/control/queries.ts

Global styles:

src/app/globals.css

---

# 48. CURRENT DATABASE / QUERY NOTES

Control query hub:

src/control/queries.ts

It now contains queries for:

- control overview
- feature flags
- runtime bindings
- brain profiles
- traffic overview
- dimensions
- recent traffic pagination
- CV traffic
- CV recent traffic pagination
- 7-day traffic series
- audit pagination
- real-time visitors
- site settings
- brain memory stats

No new schema migration was required for the Traffic/CV/Audit/Brain UI work described in this handoff.

---

# 49. CURRENT CONTROL HOT-UPDATE PATTERN

Traffic and Audit now establish a reusable pattern.

Pattern:

1. server-render initial 10 rows
2. client component owns local list state
3. 10/20/30 selection calls owner-only JSON API
4. only panel state changes
5. Previous/Next use same API
6. no whole-page reload
7. loading state reduces panel opacity
8. footer shows record count and page count

If another control list needs pagination, reuse this interaction pattern.

Do not create a third incompatible pagination style.

---

# 50. CURRENT BUILD ROUTE GRAPH — IMPORTANT ROUTES

Latest production build included dynamic routes for:

/
about
projects
projects/[key]
writing
writing/[slug]
search
stack
music-sensor
cv
cv/document/[id]
verify
privacy
terms

Control:
control
control/account
control/assets
control/audit
control/brains
control/brains/knowledge
control/brains/knowledge/[id]
control/content
control/content/[id]
control/content/new
control/content/posts
control/content/posts/[id]
control/content/posts/new
control/content/projects
control/content/projects/[id]
control/content/projects/new
control/content/structure
control/content/tags
control/content/writing
control/content/writing/[id]
control/content/writing/comments
control/content/writing/new
control/login
control/music-sensor
control/runtime
control/settings
control/stack
control/traffic
control/traffic/cv

Key APIs:
api/analytics/collect
api/auth/[...all]
api/contact
api/control/assets
api/control/audit
api/control/traffic/recent
api/control/unsplash
api/music/*
api/stack/*
api/writing/*

Latest static generation count:

44/44 PASS

---

# 51. SESSION START PROCEDURE FOR NEXT SESSION

Recommended exact order:

1. cd /home/ubuntu/n8n2erpnext/thaiduy.digital

2. read this file first:
   HANDOFF_2026-09-22_FULL.md

3. verify Git:
   git status --short
   git log -3 --oneline
   git rev-parse HEAD
   git rev-parse origin/main

Expected baseline:
- branch main
- clean worktree
- HEAD begins fa870dec unless this handoff commit is newer
- origin/main matches local

4. verify runtime:
   ss -ltnp | grep ':3000'

5. smoke:
   /
   /writing
   /projects
   /stack
   /music-sensor
   /about
   /cv
   /verify
   /control/login

6. protected route smoke while logged out:
   /control should redirect

7. only then begin new changes.

---

# 52. SAFE CLOSEOUT PROCEDURE

After meaningful changes:

1. bunx tsc --noEmit
2. ESLint changed TS/TSX
3. bun run layout:check
4. bun run theme:check
5. bun run typography:check
6. git diff --check
7. bun run build
8. smoke affected routes
9. git diff / git status
10. stage
11. scan staged diff for secrets
12. commit
13. push origin main
14. confirm clean status

Do not commit local secret files.

---

# 53. KNOWN NON-BLOCKING DEBT / FUTURE WORK

## 53.1 Production serving

The site is still served via bun dev / Next dev on port 3000.

A final production process/container deployment is still future work.

## 53.2 Runtime semantic UI

Runtime still exposes lower-level configuration more directly than Brains.

If revisited, use the new Brains pattern:

semantic fields first
raw JSON under Advanced

Do not change runtime semantics while doing UI cleanup.

## 53.3 Legacy Brain CSS

Older .brain-profile / .brain-hemisphere-grid / .brain-memory-row styles remain in globals.css from the previous raw editor.

The new semantic editor uses brain-console / brain-* semantic classes.

After visual acceptance, old unused Brain CSS may be pruned carefully.

Do not remove blindly before confirming no other route references it.

## 53.4 Historical traffic location

Events captured before browser timezone support may still have no country/timezone.

Do not backfill them by guessing geography.

## 53.5 GitHub API limits

The public GitHub section intentionally degrades safely if GitHub API/search is unavailable or capped.

Do not treat incomplete search results as exact complete history.

## 53.6 CV issuance volume

Every /cv visit issues a snapshot by design.

If snapshot retention/cleanup is later needed, define a governance policy first.

Do not silently reuse IDs because uniqueness/verification is the product contract.

---

# 54. HISTORICAL REFERENCE

For deeper historical context, rejected experiments and earlier architecture details:

HANDOFF_2026-09-20_FULL.md

Important historical sections near its end:

- 55: 2026-09-20 session handoff
- 57: Stack current product contract
- 58: Systems Atlas visual checkpoint
- 59: Global nav contract
- 61: Stack redesign timeline / what not to repeat
- 62: persistent checkpoints
- 68: owner visual / UX preferences
- 70+: golden checkpoint consolidation

The older file is historical context only.

This 22/09 file is authoritative for current Git/runtime/control state.

---

# 55. FINAL STATE AT HANDOFF

Repository:

/home/ubuntu/n8n2erpnext/thaiduy.digital

Branch:

main

Code baseline immediately before this handoff document was added:

fa870dec92f7597deb7ee53999a53faf70a6d15d

The final handoff documentation commit is expected to be the next commit on main.
Use git log -2 --oneline after opening the repo; the handoff commit should have fa870dec as its parent.

Remote:

origin/main matched the code baseline before adding this handoff document and will be pushed to the final docs commit during closeout.

Runtime:

port 3000 listening

Public smoke:

PASS

Protected redirects:

PASS

Latest code QA:

TypeScript PASS
ESLint PASS
Layout PASS
Theme PASS
Typography PASS
git diff --check PASS
Production build 44/44 PASS

Latest major completed feature:

semantic Brain profile editor

Current UI direction:

public site and control plane are now visually coherent enough that future work should extend the established system rather than inventing new local styles.

---

# 56. NEXT BEST CONTINUATION POINT

If the owner does not provide a new priority, the most sensible continuation is:

1. visually inspect /control/brains in the browser after the semantic editor change
2. verify structured edits preserve exact JSON shape
3. verify Advanced / Raw config Apply behavior
4. make only small visual refinements if needed
5. consider applying the same semantic-first / raw-advanced pattern to /control/runtime
6. keep work committed and pushed after acceptance

Do not proactively redesign another major public surface before owner review.

---

# 57. GUESTBOOK / COMMUNITY — 2026-09-22 CONTINUATION

A lightweight moderated Guestbook / mini-forum was added after the original handoff was written.

Public routes:

- /guestbook
- /guestbook/[id]

Public contract:

- anyone can read approved threads and replies
- posting requires an authenticated Google account through the existing Better Auth setup
- a new thread starts as pending
- a reply starts as pending
- pending/rejected/hidden content is never rendered on the public Guestbook
- thread content and replies are plain text; no user HTML is rendered
- thread submission rate limit: 60 seconds per user
- reply submission rate limit: 20 seconds per user
- blocked community members can still read but cannot post
- Google identity is used for display name/avatar; the Guestbook does not expose user email publicly

Public APIs:

- POST /api/guestbook/threads
- POST /api/guestbook/threads/[id]/replies

Unauthenticated posting returns 401.

Database migration:

- drizzle/0010_guestbook_community.sql

New tables:

- community_members
- community_threads
- community_replies

community_members is a policy layer beside Better Auth. Blocking a member does not delete or disable the underlying Google account and does not alter Writing comment identity.

Control routes:

- /control/community
- /control/community/users

/control/community provides one moderation queue for threads and replies with:

- approve
- reject
- hide
- trash

/control/community/users lists Google community members with thread/reply counts and supports:

- block
- unblock

All moderation/member policy actions use the existing owner-only control boundary and write durable audit log entries.

Control navigation now has a collapsible COMMUNITY parent with:

- Moderation
- Users

Public navigation/registry:

- Guestbook is seeded as a published nav item
- section.guestbook is seeded as a managed public section
- fallback nav also contains Guestbook
- global footer includes Guestbook
- EN/VI section copy is present

Latest acceptance after this continuation:

- TypeScript PASS
- ESLint: 0 errors; Google-avatar <img> warnings only, matching the existing external-avatar pattern
- layout audit PASS
- theme contrast audit PASS
- typography audit PASS
- git diff --check PASS
- production build PASS
- generated static page pass: 48/48
- /guestbook -> 200
- missing /guestbook/[id] -> 404
- logged-out /control/community -> 307
- logged-out /control/community/users -> 307
- unauthenticated Guestbook POST -> 401
- homepage renders Guestbook navigation

This section supersedes the earlier 44/44 route-count statement for the latest build state.

---

# 58. GUESTBOOK MINI-FORUM REFINEMENT — 2026-09-22

The Guestbook public UX was refined after visual owner review.

Reason:

- the original Google login treatment was too large
- the always-open new-thread form made the page feel like a contact form instead of a small forum
- Like was not yet implemented

Current public interaction model:

- anonymous visitors read approved topics/replies
- anonymous composer is compact; it does not render disabled title/body fields
- Google sign-in is a small inline CTA rather than a full-width primary surface
- authenticated users see a compact + NEW TOPIC / + TẠO CHỦ ĐỀ MỚI control
- the new-topic editor only expands after that control is activated
- thread detail keeps the reply composer available for signed-in users
- topics are ordered by latest approved activity
- topic list shows Like count, Reply count and latest activity date

Like support:

- topics can be liked/unliked
- individual replies can be liked/unliked
- Like requires Google-authenticated community access
- blocked community users cannot Like
- Like is immediate and does not enter moderation
- one Like maximum per user per topic/reply
- deleting a topic/reply cascades its Like records

New API:

- POST /api/guestbook/likes

New migration:

- drizzle/0011_guestbook_likes.sql

New tables:

- community_thread_likes
- community_reply_likes

Both tables have unique user/item constraints and cascade on content/user deletion.

Acceptance:

- TypeScript PASS
- ESLint 0 errors; only existing Google-avatar <img> warnings remain
- Layout PASS
- Theme PASS
- Typography PASS
- git diff --check PASS
- production build PASS
- generated static pass 49/49
- /guestbook -> 200
- anonymous new-topic editor is not rendered
- unauthenticated Like API -> 401
- temporary QA Google account verified topic Like 0→1→0
- temporary QA Google account verified reply Like 0→1→0
- QA account/content/member/likes removed by cascade; no example.invalid QA users remain

This section supersedes section 57's 48/48 latest-build count.

---

# 59. DISCUSS REPLY TARGETING + PUBLIC PAGINATION — 2026-09-22

The public Guestbook label has been refined to Discuss while the stable route remains /guestbook.

Public naming:

- header navigation label: Discuss
- footer label: Discuss
- managed section copy: Discuss / Community
- internal route remains /guestbook for compatibility
- internal table/component names remain community/guestbook where changing them would add migration risk without user value

Reply semantics:

- a reply with no parent_reply_id responds to the main topic
- a reply with parent_reply_id responds to one specific approved reply
- each public reply now has an explicit Reply control beside Like
- clicking Reply opens an inline composer directly below that reply
- targeted composer shows “Reply to @name” / “Trả lời @tên”
- targeted composer includes a short excerpt from the source reply
- rendered targeted replies show the same ↪ @name + excerpt reference
- the bottom composer is explicitly labeled Reply to topic / Phản hồi chủ đề
- public rendering stays a flat chronological timeline; reply relationships are explicit references rather than deeply nested trees

Schema/migration:

- drizzle/0012_discuss_reply_targets.sql
- community_replies.parent_reply_id is a self reference
- FK delete behavior is ON DELETE SET NULL so deleting a source reply does not destroy later conversation

Posting limits:

- topic title: 180 characters
- topic body: 5,000 characters
- reply body: 3,000 characters
- editors now show live character counters instead of silently clipping input

Public pagination:

- Discuss topic index: 10 approved topics per page
- thread replies: 20 approved replies per page
- Previous/Next controls appear automatically only when multiple pages exist
- topic index remains ordered by latest approved activity
- replies remain chronological inside a thread

Acceptance:

- TypeScript PASS
- ESLint 0 errors; only existing external Google-avatar <img> warnings remain
- Layout PASS
- Theme PASS
- Typography PASS
- git diff --check PASS
- production build PASS 49/49
- QA 12 topics -> 2 pages: 10 + 2
- QA 21 replies -> 2 pages: 20 + 1
- page-2 nested reply resolved correct parent author and quote
- temporary pagination/nesting QA user and all related rows removed by cascade
- live demo thread contains one approved nested reply for visual review
- demo thread route returned 200 and rendered nested reply successfully

Current live demo thread:

- /guestbook/1d70cee8-d4ff-4d44-b8ce-9b81914304b1
- source reply: af31e3a3-cbd3-4dd0-8e88-9ca7e7852404
- nested demo reply: b0f2f919-68ca-4975-a601-31fcb13782b4

The demo content may be deleted after owner visual review; reply/Like dependencies follow the existing FK/cascade policy.

---

# 60. DISCUSS RICH COMPOSER / EMOJI / MENTIONS / ADMIN BADGE — 2026-09-22

Discuss was extended toward a lightweight Discourse-like interaction model after owner review.

Reference direction:

- Discourse current rich composer uses a WYSIWYG rich-text mode while keeping Markdown compatibility.
- Current Discourse rich composer supports basic formatting, emoji, mentions, quotes, links, lists and other structured content.
- Discourse badges/flair are used to distinguish roles and recognize users.
- This site intentionally adopts only the lightweight subset useful to thaiduy.digital Discuss.

Public composer:

- reuses the same TipTap engine and core formatting model used by Writing
- public-safe subset only; it does not expose Control media library, Unsplash or administrative asset upload
- H2 / H3
- bold
- italic
- strike
- block quote
- bullet list
- numbered list
- link
- code block
- horizontal rule
- undo / redo
- selection bubble from the Writing editor
- rich text is sanitized server-side before storage/rendering

Emoji:

- compact toolbar emoji picker
- emoji are stored as Unicode inside sanitized rich content
- no separate emoji database is required

Mentions:

- @ button appears only where a topic already exists
- typing @ also opens the mention picker
- candidates are server-derived topic participants only
- topic author + authors of approved replies are eligible participants
- users outside the topic are not shown
- server independently validates all mention user IDs
- forged outsider mentions fail with mention_not_allowed
- server canonicalizes mention display names from the real user record
- a payload using a valid participant ID with a forged display label is rewritten to the canonical name
- stored mention IDs are retained in community_threads/community_replies.mentions for future notification/inbox work
- new topics cannot mention arbitrary users because there is no prior topic participant set

Admin badge:

- ADMIN is derived server-side from CONTROL_OWNER_EMAIL
- users cannot self-assign the badge
- badge renders beside the owner/admin name on topic list, topic detail, replies, composer identity and mention picker
- no admin email is exposed publicly

Rich-content persistence:

Migration:
- drizzle/0013_discuss_rich_composer.sql

New fields on community_threads:
- body_html text nullable
- mentions jsonb string[] default []

New fields on community_replies:
- body_html text nullable
- mentions jsonb string[] default []

Compatibility:
- existing plain-text posts remain valid when body_html is null
- body remains the canonical plain-text fallback/search/preview value
- moderation Control renders the same sanitized rich-text preview before approval
- plain body remains available as the fallback moderation/search value
- public detail renders body_html only after server sanitization

Server sanitizer allows only:
- p
- h2 / h3
- strong / em / s
- blockquote
- ul / ol / li
- a
- hr / br
- code / pre
- controlled mention span

Scripts/styles/event attributes and unapproved markup are removed.

Acceptance evidence:

- temporary participant QA topic had only Alpha + Beta in participant list
- rich HTML preserved strong formatting, emoji and valid mention
- script tag was removed
- outsider mention returned mention_not_allowed
- forged mention label FAKE ADMIN was canonicalized to the real participant name
- all temporary QA users/content were removed; example.invalid QA user count returned 0
- live demo thread HTTP 200
- live demo rendered discuss-admin-badge
- live demo rendered discuss-mention
- live demo rendered rich-text content
- live demo retained targeted Reply control

Live rich demo reply:

- thread: /guestbook/1d70cee8-d4ff-4d44-b8ce-9b81914304b1
- rich demo reply id: ddaef8be-2477-4b78-8296-d14bf7b77955
- demonstrates bold, emoji, @mention, quote/list rich formatting and ADMIN badge

The existing demo topic can be removed after owner visual review; reply/Like/mention rows follow existing FK/cascade behavior.

---

# 61. DISCUSS CANONICAL ROUTE + SCALABLE TOPIC ADMIN — 2026-09-22

Discuss is now the canonical public forum surface.

Canonical public routes:

- /discuss
- /discuss/[id]

Compatibility:

- /guestbook permanently redirects with HTTP 308 to /discuss
- /guestbook/[id] permanently redirects with HTTP 308 to /discuss/[id]
- page/search query values are preserved where relevant
- legacy API filesystem routes may remain for compatibility, but the current Discuss client uses /api/discuss/*
- no public navigation, footer, registry href, control link or source display string emits Guestbook/GUESTBOOK

Canonical public APIs:

- POST /api/discuss/threads
- POST /api/discuss/threads/[id]/replies
- POST /api/discuss/likes

Public Discuss additions:

- topic search by title/content
- search pagination preserves q
- pinned topics sort before ordinary topics
- locked topics remain readable and likeable
- locked topics do not show reply controls/composer
- server independently rejects reply submission to locked topics with thread_locked / HTTP 423
- public topic cards expose compact PINNED / LOCKED state

New topic governance:

Migration:
- drizzle/0014_discuss_topic_flags.sql

community_threads additions:
- pinned boolean default false not null
- locked boolean default false not null

Owner-only control actions:
- PIN / UNPIN
- LOCK / UNLOCK

Both actions write durable audit log entries.

Control navigation:

- parent label is DISCUSS
- child label is Topics
- Users remains a separate child

/control/community is now a scalable topic index rather than one mixed thread/reply stream.

Topic index features:

- 20 topics per page
- search by topic title, topic body, author name or author email
- status filters: ALL / ATTENTION / PENDING TOPIC / APPROVED / HIDDEN / REJECTED
- ATTENTION means topic pending OR topic contains one or more pending replies
- PENDING stat links to ATTENTION
- topics requiring moderation are ordered before ordinary topics even in ALL mode
- each row shows topic status, pinned/locked state, pending reply count, reply count, like count and latest activity
- each row drills into one topic management page
- public Discuss and Users links remain directly reachable from the page

/control/community/[id] is the topic management detail.

Topic detail features:

- topic author + email
- topic status and rich-content preview
- APPROVE / REJECT / HIDE / TRASH
- PIN / UNPIN
- LOCK / UNLOCK
- public topic link
- replies are isolated to that topic
- reply search by body/author/email
- reply status filter
- 20 replies per page
- reply rich-content preview
- targeted-reply parent author indicator
- reply like count
- per-reply APPROVE / REJECT / HIDE / TRASH

Public/navigation migration:

- fallback nav points to /discuss
- global footer points to /discuss
- site_registry Discuss nav href updated live to /discuss
- seed registry creates /discuss href for fresh installs

Component naming:

- public interaction components moved from components/guestbook to components/discuss
- exported component names now use Discuss*
- CSS/markup namespace migrated from guestbook-* to discuss-*
- user-visible Guestbook/GUESTBOOK tokens in src/scripts: zero
- rendered /discuss detail HTML contains no guestbook token
- rendered homepage HTML contains no guestbook token

Scale/behavior QA:

- ATTENTION query found an approved topic with a pending reply
- pending reply count returned 1
- topic-detail pending filter returned the exact pending reply
- pinned QA topic sorted first on public Discuss
- locked QA topic rejected new reply with thread_locked
- all temporary scale QA users/topics/replies removed by cascade; example.invalid QA count returned 0

Route smoke before final closeout:

- /discuss -> 200
- live /discuss/[demo-id] -> 200
- /guestbook -> 308 Location /discuss
- /guestbook/[demo-id] -> 308 Location /discuss/[demo-id]
- unauthenticated POST /api/discuss/threads -> 401
- homepage contains /discuss links
- homepage contains no /guestbook href
- logged-out /control/community -> 307
- logged-out /control/community/[id] -> 307
- /discuss?q=Mini -> 200 and returned the live demo topic
- /guestbook?q=Mini -> 308 Location /discuss?q=Mini
- rendered /discuss/[demo-id] HTML contains no guestbook token

Final governance/build:

- TypeScript PASS
- ESLint 0 errors; only external Google-avatar <img> warnings remain
- Layout PASS
- Theme PASS
- Typography PASS
- git diff --check PASS
- production build PASS 52/52

This section supersedes the earlier handoff statements that treated /guestbook as the canonical public route.

---

# 62. DISCUSS HOLD-TO-REACT — 2026-09-22

Discuss reactions replace the old binary Like behavior while preserving existing rows.

Interaction contract:

- short click/tap on the compact reaction control = 👍 Like
- hold/long-press for ~450 ms opens the reaction picker
- supported reactions: 👍 Like, ❤️ Love, 😂 Haha, 😮 Wow, 😢 Sad
- picker works through pointer events for both mouse and touch
- Escape/outside pointer closes the picker
- mobile picker hides labels and keeps the five emoji controls compact
- one user has at most one reaction per topic/reply
- selecting a different reaction replaces the existing reaction without increasing the total
- selecting the same active reaction again removes it
- blocked Discuss members still cannot react
- unauthenticated reaction selection follows the existing Google sign-in flow

Persistence:

Migration:
- drizzle/0015_discuss_reactions.sql

Existing tables are extended rather than replaced:
- community_thread_likes.reaction varchar(16) default 'like' not null
- community_reply_likes.reaction varchar(16) default 'like' not null

The migration default means all pre-existing Like rows become reaction='like' without losing counts.

Shared reaction definition:
- src/community/reactions.ts

Canonical reaction keys:
- like
- love
- haha
- wow
- sad

Read model:

- topic/reply detail exposes myReaction
- topic/reply detail exposes total reactionCount
- topic/reply detail exposes reactionSummary for all five reaction types
- compact control shows up to the three most-used reaction emoji plus total count
- admin/public count labels use REACTIONS / cảm xúc where total count semantics are no longer Like-only

Mutation semantics:

- setCommunityReaction(kind,id,userId,reaction)
- same reaction => delete row
- different reaction => update existing row
- no previous reaction => insert row
- unique user/item constraints remain unchanged

QA:

- thread Like => total 1, summary like=1
- thread Like -> Love => total remains 1, summary love=1 and like=0
- choosing Love again => total 0
- reply Wow -> Haha => total remains 1 and summary switches to haha
- temporary QA reaction user/topic/reply removed by cascade; QA user count returned 0

Component naming:
- discuss-like-button.tsx renamed to discuss-reaction-button.tsx
- exported component is DiscussReactionButton

Final verification:

- /discuss/[demo-id] -> 200
- rendered detail contains the reaction menu control
- unauthenticated POST /api/discuss/likes with reaction=wow -> 401 auth_required
- TypeScript PASS
- ESLint 0 errors; only existing external-avatar <img> warnings remain
- Layout PASS
- Theme PASS
- Typography PASS
- git diff --check PASS
- production build PASS 52/52

---

# 63. DISCUSS EDITOR STABILITY FIXES — 2026-09-22

Public Discuss rich-editor behavior was hardened after real browser testing exposed toolbar/link state bugs.

Root causes found:

- Discuss public editor was reusing CmsSelectionBubble from the control/Writing editor, creating two formatting surfaces over the same selection.
- toolbar active state could appear stale because the component was not forced to rerender on every editor transaction.
- empty editor content was initialized with an empty string rather than an explicit paragraph.
- TipTap Link 3.31.3 reports its mark as inclusive while autolink is enabled; this caused typing at the end of a link to remain inside the link mark.
- link action previously allowed setting a link at an empty caret, which made following text easy to capture unintentionally.

Fixes:

- removed CmsSelectionBubble from the public Discuss editor
- public editor keeps one toolbar only
- initial document is explicitly <p></p>
- shouldRerenderOnTransaction=true keeps toolbar state synchronized with the actual selection/block
- added explicit P / Paragraph toolbar control; Paragraph is the normal default state
- toolbar buttons preserve the editor selection with pointer-down preventDefault
- Discuss Link uses an inclusive=false Link extension
- Discuss autolink is disabled
- Link button is disabled unless text is selected or the caret is already inside an existing link
- adding/editing a link collapses the selection to the end afterwards
- stored marks are cleared after link insertion/removal so following typed text is plain text
- Cancel/invalid URL restores a normal collapsed caret
- H2/H3 remain available as explicit block choices and no longer serve as implicit initial state

Verification:

- TypeScript PASS
- ESLint 0 errors; only the existing external-avatar <img> warning remains
- git diff --check PASS
- production build PASS 52/52

---

# END — 2026-09-22 FULL HANDOFF
