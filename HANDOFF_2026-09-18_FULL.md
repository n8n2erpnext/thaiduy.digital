# THAIDUY.DIGITAL — FULL HANDOFF — 2026-09-18

> Purpose: authoritative continuation handoff for the next session.
> Repository: `/home/ubuntu/n8n2erpnext/thaiduy.digital`
> Public site: `https://thaiduy.digital`
> Device used during this session: VPS-ARM
> Timezone: Asia/Ho_Chi_Minh (+07)
> Owner direction at handoff: Android work is PAUSED. Continue web/CMS/Stack work only when explicitly requested.

---

# 0. READ THIS FIRST — P0 SAFETY

## 0.1 DO NOT RESET THIS WORKTREE

Current Git state at handoff:

- branch: `main`
- HEAD: `a2352940f7e063d3c8b53a07512b4854f1ae69fd`
- origin/main: same commit
- HEAD subject: `fix: serialize traffic query timestamps`
- IMPORTANT: the large body of work described in this handoff is currently in the DIRTY WORKTREE and is NOT committed yet.

Therefore the next session MUST NOT do any of the following before understanding/reviewing the changes:

```bash
git reset --hard
git clean -fd
git checkout .
git restore .
git pull --rebase
git merge origin/main
```

Do not assume files shown as untracked are disposable. Many are production feature files created during this work.

At handoff, `git status --short` includes many modified/untracked files and a couple intentional deletions. This dirty state predates some of the latest work and contains the actual current implementation. Preserve it.

## 0.2 Secrets

Never print, commit, paste, or expose:

- `.env.local`
- Redis password / Redis URL credentials
- Better Auth secret
- Google OAuth client secret
- R2 credentials
- Unsplash credential material
- root-level `unsplash.txt`

The root `unsplash.txt` was used as the source for the Unsplash integration and is intentionally excluded from build-copy commands. Treat it as secret material.

## 0.3 Android is paused

The Android/Scrobble Hub work is intentionally PAUSED.

Reason/context from the owner:
- Play Protect blocked the APK/install flow aggressively.
- Notification permission also needed manual handling.
- The owner temporarily disabled Play Protect to test and then re-enabled it.
- Decision: stop spending time on Android for now and continue the website/system.
- Do not resume Android work unless the owner explicitly asks.

---

# 1. CURRENT RUNTIME / DEPLOYMENT STATE

## 1.1 Current web runtime

Current live development runtime on VPS:

```text
bun dev
node .../node_modules/.bin/next dev
127.0.0.1:3000
```

This is currently Next.js development mode, not the final containerized production deployment.

Observed public smoke at handoff:

```text
/                               200
/projects                       200
/projects/lightbi               200
/writing                        200
/search?q=architecture          200
/stack                          200
/control/content/writing        307  (expected unauth redirect)
```

## 1.2 Latest production build verification

Latest isolated production build after Writing pagination/tags/highlight/search work:

- Next.js 16.3.5 / Turbopack
- production compile: PASS
- TypeScript: PASS
- static generation: **38/38 PASS**
- final route graph includes:
  - `/projects/[key]`
  - `/search`
  - `/writing`
  - `/writing/[slug]`
  - `/api/writing/[slug]/like`
  - `/api/writing/[slug]/comments`
  - `/control/content/writing/comments`
  - `/stack`
  - `/api/stack/live`
  - all existing control/public routes

Isolated build pattern used successfully:

```bash
SRC=/home/ubuntu/n8n2erpnext/thaiduy.digital
DST=/tmp/<temporary-build-dir>
rm -rf "$DST"
mkdir -p "$DST"
cd "$SRC"
tar   --exclude='./.next'   --exclude='./node_modules'   --exclude='./backend/postgres/data'   --exclude='./backend/redis'   --exclude='./.git'   --exclude='./unsplash.txt'   -cf - . | tar -xf - -C "$DST"
cp -al "$SRC/node_modules" "$DST/node_modules"
cd "$DST"
bun run build
rm -rf "$DST"
```

Reason: verify production without touching the live development `.next`.

---

# 2. PRODUCT DIRECTION LOCKED DURING THIS SESSION

The website is no longer being treated as a collection of disconnected pages.

The current architecture is intentionally split into three responsibilities:

1. **CMS / durable content**
   - human-authored project information
   - Writing articles
   - presentation identity
   - media and Unsplash
   - tags/highlight/SEO

2. **Stack / runtime truth**
   - Docker/LXD discovery
   - real node status
   - real topology / edges
   - sanitized public projection
   - host-owned discovery

3. **Public surfaces**
   - combine durable authored content with sanitized runtime state
   - never allow authored CMS fields to overwrite runtime truth

Key owner principle:

> CMS controls presentation/content. Stack controls runtime truth. Public pages compose the two.

Do not collapse these responsibilities again.

---

# 3. STACK — CANONICAL DESIGN AND ARCHITECTURE

## 3.1 Canonical visual model

The accepted Stack mental model is:

```text
HOUSE → ROOM → OBJECT
```

Meaning:

- whole stack = a house
- technical domains = rooms
- runtime nodes = objects inside rooms
- clicking room feels like entering a room
- clicking node feels like touching/inspecting an object
- Back behavior:
  - Object → Room
  - Room → House

The user strongly approved this model.

## 3.2 Canonical renderer

Canonical public Stack renderer is now the spatial/technical-drawing implementation under:

```text
src/components/stack/
src/app/stack/page.tsx
```

`/stack-demo` still exists as the former visual lab/prototype route, but the accepted demo was promoted into real `/stack`.

Do NOT resurrect the older force/topology renderer as the primary public view.

Intentional dirty deletion currently visible:

```text
D src/components/surfaces/stack-topology.tsx
D src/lib/entity-state.ts
```

Do not restore these blindly.

## 3.3 Accepted House visual language

The House level went through several iterations and the owner explicitly approved the final clean version.

Key visual decisions:

- technical drawing / systems atlas feel
- rooms as technical district cards
- no giant decorative “LIVE SYSTEM HOUSE” info card
- no giant translucent backbone strip
- wiring is clean and orthogonal
- cable routes bend at 90 degrees
- arrowheads point correctly and terminate at room/card boundaries
- wires near cards are offset enough to read as real technical routing
- wire semantics differentiated lightly:
  - color
  - stroke width / density
  - solid / dash / dash-dot patterns according to protocol
- wiring legend remains small and technical
- wire hover hit target is wider than visible stroke
- hover tooltip/pill follows the visual language of the Music Wave song-name pill
- actual visual wire remains thin; hit area is invisible and wider

Do not make the House “organic blob/hull” style again. That direction was rejected.

## 3.4 Room/Object visual language

Room view:
- same visual language as House, not a separate dashboard style
- selected room expands
- other rooms remain faint spatial memory
- nodes are objects
- object arrangement is room-specific, not one generic grid
- external connections use grouped technical buses/ports rather than spaghetti
- internal connections use orthogonal card-edge routing

Object view:
- clicking a node keeps the room scene
- related nodes/edges highlight
- right-side floating inspector opens
- click outside inspector/object closes it
- ESC closes it
- clicking selected node toggles it closed

## 3.5 Runtime snapshot observed during visual work

A representative public snapshot during the session was approximately:

```text
45 nodes
71 links
rooms/groups around:
- network
- security
- automation
- apps/products
- observability
- data
- compute
```

These counts are runtime-derived and may change. Never hardcode them.

---

# 4. STACK — LIVE DISCOVERY / DOCKER-LXD CONTRACT

## 4.1 Critical owner requirement

The owner explicitly requires Stack to be real:

- `docker compose down` → the object must disappear/offline in Stack after discovery refresh
- bring up a new Docker service → it must appear in Stack and land in the correct room
- LXD state must also be real
- no fake/static runtime counts

## 4.2 Important containerization constraint

The website is currently developed outside a container and can access host tooling.

But final web deployment is expected to become containerized.

The owner correctly warned:

> once the web is inside Docker, it must NOT depend on running docker ps / lxc directly from inside the web container.

Final architecture therefore separates host discovery from web serving.

## 4.3 Current discovery architecture

Host-owned discovery:

```text
Docker / LXD host state
        ↓
scripts/stack-refresh.ts
        ↓
private + sanitized public snapshots
        ↓
Redis snapshot bridge
        ↓
Next web runtime reads snapshot
        ↓
public /stack + private /control/stack
```

Relevant files:

```text
scripts/stack-refresh.ts
scripts/install-stack-refresh-user-units.sh
deploy/systemd/thaiduy-stack-refresh.service
deploy/systemd/thaiduy-stack-refresh.timer
deploy/systemd/thaiduy-stack-refresh-request.service
deploy/systemd/thaiduy-stack-refresh-request.timer
src/server/stack/discovery*
src/server/stack/snapshot*
src/server/stack/public.ts
src/server/stack/runtime*
src/app/api/stack/*
```

`src/server/stack/public.ts` supports:
- direct mode for development
- snapshot mode for container-safe operation

Do not introduce Docker-in-Docker or mount `docker.sock` into the final public web container merely for Stack rendering.

## 4.4 Refresh schedule

The owner specifically requested Docker/LXD discovery NOT be executed continuously.

Current installed user timers:

### Full host discovery
```text
thaiduy-stack-refresh.timer
OnBootSec=10min
OnUnitActiveSec=2h
AccuracySec=1min
```

### Manual request worker
```text
thaiduy-stack-refresh-request.timer
OnBootSec=1min
OnUnitActiveSec=1min
AccuracySec=5s
```

Both timers were verified at handoff as:
- enabled
- active

Representative timer status at handoff showed the full refresh about every 2 hours.

## 4.5 GET STATUS behavior

`/control/stack` contains the GET STATUS button.

Important:
- GET STATUS does NOT directly run Docker/LXD commands inside the web request.
- It writes/requests a host refresh.
- the host request worker sees it (up to ~1 minute cadence)
- host worker performs real discovery
- snapshot is updated
- UI sees the new snapshot

Relevant files:

```text
src/app/control/(protected)/stack/page.tsx
src/components/control/stack-status-bar.tsx
src/app/control/(protected)/stack/actions.ts
```

The control status bar may poll `/api/stack/live` every ~20 seconds (or faster while a request is pending).

That poll reads the snapshot/runtime API. It is NOT equivalent to executing `docker ps` every 20 seconds.

Do not “optimize” this by moving Docker discovery back into the poll.

## 4.6 Failure behavior

`scripts/stack-refresh.ts` runs discovery with `strict:true`.

If refresh fails:
- it logs an error
- exits nonzero
- preserves the previous snapshot

This is intentional fail-safe behavior.

---

# 5. CONTROL / CMS — CURRENT PRODUCT DIRECTION

The generic Content Registry became too noisy for routine content work.

Owner direction:
- focus content management strongly on **Projects** and **Writing**
- make them effectively 1:1 with their public surfaces
- runtime/system metadata remains separate

Dedicated control surfaces now exist:

```text
/control/content/projects
/control/content/projects/[id]
/control/content/projects/new

/control/content/writing
/control/content/writing/[id]
/control/content/writing/new
/control/content/writing/comments
```

Generic registry/structure routes still exist for system/navigation/advanced management.

Do not force normal editorial work back through the generic registry form.

# 6. MEDIA / UNSPLASH

## 6.1 Media library

Media is real, not mock.

Relevant routes/components include:

```text
/control/assets
/api/control/assets
src/app/control/(protected)/assets/*
src/app/api/control/assets/route.ts
```

Uploads use the configured object storage/R2 path.

Asset provenance schema is included in migration:

```text
drizzle/0004_asset_provenance.sql
```

## 6.2 Unsplash integration

The owner wanted Ghost-like Unsplash selection.

Implemented:

- search Unsplash from Writing editor media modal
- select photo
- persist chosen image into the existing media/asset path
- preserve attribution:
  - photographer
  - photographer URL
  - source URL
- feature image shows required attribution
- inserted content images can carry attribution text

Relevant route:

```text
src/app/api/control/unsplash/
```

Credential source was root `unsplash.txt`.
Do not expose or commit it.

---

# 7. WRITING CMS — EDITOR

## 7.1 Editor status

Writing is now a real CMS editor rather than a registry textarea.

Main component:

```text
src/components/control/cms-post-editor.tsx
src/components/control/cms-editor-menus.tsx
```

Editor stack:
- Tiptap
- StarterKit
- Link extension
- Image extension
- Placeholder
- Lowlight-backed code blocks

## 7.2 Ghost-inspired interaction

Owner explicitly referenced Ghost editor behavior.

Implemented:
- title
- excerpt
- EN / VI tabs
- rich text
- selection bubble toolbar
- slash menu from an empty line
- image/media insertion
- Unsplash insertion
- feature image
- URL/slug
- SEO/meta
- draft/published/archived

Slash insert menu includes:
- Button
- Bookmark
- Heading
- Quote
- Bulleted list
- Numbered list
- Code
- YouTube
- media/Unsplash actions and other supported cards from current implementation

## 7.3 Slash-menu bug fixed

Owner found a real UX bug:
- type `/`
- if no block selected, palette would remain stuck
- click outside did not close
- ESC did not close
- deleting slash did not close

Fixed in `CmsSlashMenu`.

Current dismissal contract:
- ESC → close
- Backspace → close
- Delete → close
- click/pointer outside → close
- Enter / Tab without selection → close
- typing another normal character → close
- window blur/resize → close
- selecting an item → execute then close

Document-level capture is used so ESC/delete cannot be swallowed by Tiptap.

Do not regress this behavior.

---

# 8. WRITING — SYNTAX HIGHLIGHTING

## 8.1 Editor

Code card is language-aware.

When inserting a Code block, editor asks for language.

Supported aliases/basic languages at handoff:

```text
html / xml
css
shell / sh / bash
python / py
script / js / javascript
ts / typescript
json
sql
```

Editor uses:
- `@tiptap/extension-code-block-lowlight`
- `lowlight`

## 8.2 Public renderer

Public article renderer highlights server-side using Shiki.

Relevant file:

```text
src/content/article-presentation.ts
```

Behavior:
- code with `class="language-..."` is highlighted
- code without a language keeps normal code styling
- code block gets a small label:
  - HTML
  - CSS
  - SHELL
  - PYTHON
  - JS
  - TS
  - JSON
  - SQL

No large client-side syntax highlighter bundle is required.

Tested language matrix:
- html PASS
- css PASS
- bash PASS
- python PASS
- javascript PASS
- typescript PASS
- json PASS
- sql PASS

---

# 9. WRITING — PUBLIC ARTICLE PRESENTATION

## 9.1 Accepted presentation

Owner provided a reference blog and explicitly wanted the *article presentation*, not a clone of the reference site's UI.

Current `/writing/[slug]` layout:

- thin fixed reading-progress line at top
- article hero
- title
- excerpt
- author
- published date
- updated date
- reading time
- tags
- large feature image
- Unsplash attribution when applicable
- readable long-form typography
- h2/h3/h4
- quotes
- ordered/unordered lists
- code blocks
- images
- hr
- sticky “On this page” TOC on desktop
- active heading follows scroll
- smooth-scroll TOC
- article footer
- Like + comments section

Relevant files:

```text
src/app/writing/[slug]/page.tsx
src/components/writing/article-reader.tsx
src/components/writing/article-engagement.tsx
src/content/article-presentation.ts
```

## 9.2 TOC / reading progress architecture

Article HTML stored in DB is NOT mutated simply to add TOC behavior.

At render time:
- h2/h3 receive deterministic IDs
- TOC is generated
- reading time is computed
- Shiki highlighting is applied

This keeps stored CMS content independent of public presentation enhancements.

## 9.3 Sample article

A real published sample exists:

```text
/writing/a-stack-that-can-explain-itself
```

English title:
`A Stack That Can Explain Itself`

Vietnamese title:
`Một Stack Có Thể Tự Giải Thích Chính Mình`

It exercises:
- headings
- quote
- lists
- code
- links
- feature image
- Unsplash attribution
- TOC
- reading progress
- engagement

Current sample taxonomy:
- highlight = true
- tags:
  - architecture
  - stack
  - systems

This is a real DB post and is editable/deletable from the CMS like any other post.

---

# 10. WRITING — COMMENTS / LIKES / GOOGLE AUTH

## 10.1 Owner requirement

Owner asked for:
- Like
- comments
- commenters log in with Google
- comments must be moderated before public display

Implemented.

## 10.2 Database

Migration:

```text
drizzle/0005_writing_engagement.sql
```

Tables:
- `article_likes`
- `article_comments`

Like uniqueness:
- one like per `(post,user)`
- clicking again toggles unlike

Comments:
- plain text
- max 3000 chars
- no HTML accepted
- simple rate limit: same user/post cannot submit repeatedly under ~30s
- initial status = `pending`
- pending comments are never returned in public approved list

## 10.3 Public APIs

```text
POST /api/writing/[slug]/like
POST /api/writing/[slug]/comments
```

Both require:
- valid Better Auth session
- linked/created Google account

Unauthenticated smoke:
- Like → 401 `auth_required`
- Comment → 401 `auth_required`

## 10.4 Better Auth rule

Before this feature, user creation was effectively owner-only.

The auth hook was changed carefully:

- Google OAuth callback may create a public user
- normal foreign email/password signup remains blocked
- owner bootstrap/login behavior remains
- `/control` is still independently protected by owner-email gate

Do NOT weaken the control owner gate merely because public Google users now exist.

Important separation:

```text
Google public user
    can like/comment
    CANNOT enter /control

Owner
    can enter /control
    can moderate comments
```

Email/password signup test for a non-owner returned:
`400 FAILED_TO_CREATE_USER`

## 10.5 Moderation

Admin route:

```text
/control/content/writing/comments
```

Shows:
- pending
- approved
- rejected
- commenter name
- commenter Google avatar
- commenter email (admin-only)
- target article
- content
- timestamp

Actions:
- APPROVE
- REJECT
- TRASH

Pending is sorted to the top.

Moderation actions write audit records:
- `comment.approved`
- `comment.rejected`
- `comment.trash`

Public comment display shows:
- display name
- avatar
- date
- comment body

Public does NOT expose email.

## 10.6 Engagement acceptance test already performed

A temporary Google-like fixture user was created only for acceptance, then removed.

Verified sequence:

```text
Google identity recognized
→ Like
→ count +1
→ submit comment
→ status pending
→ pending NOT visible publicly
→ approve
→ comment visible publicly
→ unlike
→ count returns
→ cleanup
```

Result:
`WRITING_ENGAGEMENT_ACCEPTANCE=PASS`

Fixture residue was checked:
- temporary user rows: 0
- temporary comment rows: 0

---

# 11. WRITING — PAGINATION / HIGHLIGHT / TAGS

## 11.1 Database migration

Latest migration:

```text
drizzle/0006_writing_tags_highlight.sql
```

Adds to `posts`:

```text
highlight boolean default false not null
tags jsonb default [] not null
```

Verified live schema contains both columns.

## 11.2 Page-size contract

Owner asked whether Writing should limit visible cards and split pages.

Current rule:

```text
6 total cards maximum per page
```

Page 1 quota includes highlighted posts.

Example:
- 2 Highlight → 4 regular = total 6
- 1 Highlight → 5 regular = total 6
- 0 Highlight → 6 regular

Pages 2+:
- 6 regular posts per page
- Highlight block does not repeat

Pagination URL:

```text
/writing
/writing?page=2
/writing?page=3
...
```

Invalid page beyond total returns not-found when published posts exist.

## 11.3 Highlight rule

Maximum public highlight display:

```text
2 posts
```

Important:
- DB/CMS may contain more than 2 posts marked `highlight=true`
- only the first 2 in current published ordering are promoted into Highlight area
- extra highlighted posts are NOT hidden
- they fall back into normal regular pagination

This avoids data loss if owner temporarily marks 3+ posts.

CMS:
- editor has HIGHLIGHT checkbox
- Writing list has HIGHLIGHT / UNHIGHLIGHT quick action
- Writing list summary displays count of highlighted posts
- row displays HIGHLIGHT badge

## 11.4 Tags

CMS input:
- comma-separated
- removes leading `#`
- de-duplicates case-insensitively
- max 8 tags
- max 32 chars/tag

Tags display:
- Writing card
- article detail
- CMS row

Clicking article-detail tag goes to:

```text
/search?q=<tag>
```

## 11.5 Pagination acceptance

Helper:

```text
src/content/writing-index.ts
```

Constants:
- `WRITING_PAGE_SIZE = 6`
- `WRITING_MAX_HIGHLIGHTS = 2`

Synthetic acceptance run:
- 13 posts
- first 3 marked highlight

Expected/observed:

```text
page 1:
  highlight: p1,p2
  regular:   p3,p4,p5,p6
  total:     6

page 2:
  p7..p12
  total: 6

page 3:
  p13
  total: 1

total pages: 3
unique posts across pages: 13
```

Result:
`WRITING_PAGINATION_ACCEPTANCE=PASS`

---

# 12. GLOBAL PUBLIC SEARCH

## 12.1 Header search

A search button now exists in the public header.

Component:

```text
src/components/site/site-search.tsx
```

Interaction:
- click magnifying glass → open compact popover
- ESC → close
- click outside → close
- click trigger again → close
- input auto-focus
- shortcut:
  - Ctrl+K
  - Cmd+K

Search button is placed in header actions before the Music Wave indicator.

## 12.2 Search route

```text
/search?q=...
```

Implementation:

```text
src/app/search/page.tsx
```

Currently indexes public:
- published Writing
  - title
  - excerpt
  - tags
- published/enabled Projects
  - label
  - positioning/title
  - summary
  - plane
  - mode
- public navigation registry
  - label/title/summary

It intentionally does NOT search:
- raw private Stack data
- /control data
- secrets
- internal registry details without public URLs

Search matching is currently simple and deterministic:
- Unicode/diacritic normalization
- exact/start/includes scoring
- token contains scoring
- max 40 results

Current scale is small enough that server-side in-memory matching is acceptable.

If content becomes large later, migrate to PostgreSQL FTS/trigram rather than adding a client search index blindly.

## 12.3 Search acceptance

Verified:

```text
/search?q=architecture -> 200
```

Result includes:
- `A Stack That Can Explain Itself`
- its Writing URL
- architecture tag

---

# 13. PROJECTS — PUBLIC CATALOGUE

## 13.1 Owner-approved direction

Owner liked the existing clean `/projects` grid and did NOT want it overloaded.

Accepted model:

```text
/projects
  = clean catalogue/index

/projects/[key]
  = full project story + live runtime
```

The whole project card is clickable.

Examples:

```text
/projects/lightbi
/projects/light-remote
/projects/sentinel
/projects/n8n2erpnext
```

## 13.2 Project logos on catalogue

Owner explicitly requested project logos on the outside catalogue cards.

Implementation:
- project record `meta.logoUrl`
- catalogue card renders logo as an identity mark
- fallback monogram when no official logo exists

Real logo assets found in owner repos and copied into this site:

```text
public/project-logos/lightbi.svg
public/project-logos/light-remote.svg
```

Sources:
- LightBI official repo branding asset
- Light Remote / gpt-vps-bridge official branding asset

Sentinel and n8n2erpnext:
- no clearly official project logo file was found during this pass
- currently use clean monogram fallback
- do NOT invent a new brand mark without owner direction
- CMS can set a real logo URL later

Static logo smoke:
- both current SVG assets return HTTP 200

## 13.3 Catalogue behavior

Component:

```text
src/components/surfaces/project-grid.tsx
```

Card still shows the existing minimal information:
- logo/mark
- project name
- role/positioning
- summary
- runtime status
- signal strip
- plane
- mode
- live node count

New:
- whole card is a Link
- subtle hover
- `VIEW PROJECT →`

Do not turn the catalogue into a heavy marketing-card wall.

---

# 14. PROJECTS — DETAIL PAGE

## 14.1 Route

```text
src/app/projects/[key]/page.tsx
/projects/[key]
```

All four current project routes were smoke-tested HTTP 200.

## 14.2 Detail structure

Current detail page can show:

- project logo / monogram
- plane
- mode
- project title
- role / positioning
- summary
- runtime state
- live node count
- live relation count
- runtime generated timestamp
- Overview
- Highlights
- Live System
- bound runtime nodes
- Architecture note
- project links
- Stack link
- back to Projects

## 14.3 Runtime is real

Project detail combines CMS content with real Stack projection.

Runtime is NOT editable in Project CMS.

Live System section uses the project's bound Stack node IDs.

For each node it can show:
- state
- group
- label
- role
- runtime
- kind

A LightBI detail smoke during this pass showed:
- 8 online
- 0 degraded
- real bound runtime nodes

Counts are runtime-derived. Never hardcode “8”.

## 14.4 Project CMS fields

Main editor:

```text
src/components/control/cms-project-editor.tsx
```

Presentation fields include:

- Name EN / VI
- Role/positioning EN / VI
- Summary EN / VI
- Plane
- Mode
- Order
- Logo URL
- Overview EN / VI
- Highlights EN / VI
  - one capability per line
- Architecture note EN / VI
- Website URL
- Demo URL
- GitHub URL
- Docs URL

Right panel makes clear:
- public route is `/projects/[key]`
- runtime/system identity is preserved automatically

Do not add editable runtime node count/status fields.

---

# 15. PROJECT / WRITING 1:1 CMS PRINCIPLE

Current intended editorial mapping:

```text
Project CMS
    ↓
/projects card
    ↓
/projects/[key] detail
    +
live Stack runtime projection

Writing CMS
    ↓
/writing catalogue
    ↓
/writing/[slug] long-form article
    +
likes/comments
```

This is the core cleanup that replaced the confusing “one giant generic content manager” approach.

Generic Content/Structure tools remain for system structure, navigation, sections, and exceptional registry work.

---

# 16. DATABASE MIGRATIONS

Current migration files:

```text
0000_greenfield_control_plane.sql
0001_music_sensor_devices.sql
0002_hub_devices.sql
0003_cms_posts.sql
0004_asset_provenance.sql
0005_writing_engagement.sql
0006_writing_tags_highlight.sql
```

Latest migrations were applied successfully to the live DB.

Meaning:

### 0003
Writing posts / CMS foundation.

### 0004
Asset provenance / media source metadata.

### 0005
Writing engagement:
- article likes
- article comments

### 0006
Writing taxonomy/presentation:
- post highlight
- post tags

Do not regenerate or squash these migrations casually on this dirty branch.

---

# 17. KEY FILE MAP FOR NEXT SESSION

## Public pages

```text
src/app/page.tsx
src/app/projects/page.tsx
src/app/projects/[key]/page.tsx
src/app/writing/page.tsx
src/app/writing/[slug]/page.tsx
src/app/search/page.tsx
src/app/stack/page.tsx
src/app/stack-demo/page.tsx
```

## Header / global UX

```text
src/components/site/header.tsx
src/components/site/site-search.tsx
src/components/site/language-switch.tsx
src/components/living/music-wave-indicator.tsx
```

## Writing

```text
src/content/posts.ts
src/content/article-presentation.ts
src/content/engagement.ts
src/content/writing-index.ts
src/components/control/cms-post-editor.tsx
src/components/control/cms-editor-menus.tsx
src/components/writing/article-reader.tsx
src/components/writing/article-engagement.tsx
src/app/api/writing/[slug]/like/route.ts
src/app/api/writing/[slug]/comments/route.ts
src/app/control/(protected)/content/writing/*
```

## Projects

```text
src/components/surfaces/project-grid.tsx
src/components/control/cms-project-editor.tsx
src/app/control/(protected)/content/projects/*
src/app/projects/[key]/page.tsx
public/project-logos/*
```

## Stack

```text
src/components/stack/*
src/server/stack/*
src/lib/stack-graph.ts
src/app/api/stack/*
src/app/control/(protected)/stack/*
src/components/control/stack-status-bar.tsx
scripts/stack-refresh.ts
scripts/install-stack-refresh-user-units.sh
deploy/systemd/*
```

## DB / auth

```text
src/db/schema.ts
src/db/auth-schema.ts
src/lib/auth.ts
src/lib/control-auth.ts
drizzle/*
```

## Main global styling

```text
src/app/globals.css
```

This file is large and contains legacy + current styles. Do not mass-reformat it casually.

---

# 18. PACKAGE CHANGES

Packages added for syntax highlighting/editor support during this work include:

```text
shiki
@tiptap/extension-code-block-lowlight
lowlight
```

`package.json` and `bun.lock` are modified accordingly.

---

# 19. QA / ACCEPTANCE STATUS

## 19.1 Latest full source checks

At handoff:

```text
bunx tsc --noEmit       PASS
git diff --check        PASS
bun run lint            0 errors
```

Current ESLint has warnings only, mainly `@next/next/no-img-element` for dynamic:
- R2 images
- Unsplash media
- Google avatars
- project logo URLs

Latest full lint observed:
- 0 errors
- 12 warnings

These warnings do not block build.

## 19.2 Latest production build

```text
next build              PASS
TypeScript              PASS
Static generation        38/38 PASS
```

## 19.3 Public smoke

Latest known:

```text
/                                   200
/projects                           200
/projects/lightbi                   200
/writing                            200
/writing/a-stack-that-can-explain-itself 200
/search?q=architecture              200
/stack                              200
```

Unauth control route:
```text
/control/content/writing            307 → login
```

## 19.4 Known dev warm-up behavior

New Next dev routes can take several seconds on first request because Turbopack compiles them on demand.

Observed while adding engagement:
- first cold API hit could take ~8–12 seconds
- warm calls dropped to ~0.1–0.2 seconds

This was verified as dev compilation, not an API deadlock.

Production build precompiles the route graph.

---

# 20. CURRENT KNOWN NON-BLOCKING DEBT / FOLLOW-UPS

These are NOT reasons to undo current work. They are explicit next-step candidates.

## 20.1 Dirty worktree / checkpoint

Biggest operational risk:
- current implementation is not committed
- HEAD remains `a2352940`

Before making another large architectural pass, strongly consider:
1. inspect full diff
2. separate unrelated old dirty changes from this session if possible
3. create a checkpoint commit/branch only with owner approval and without losing prior work

Never auto-reset.

## 20.2 Final container deployment is not complete

The web currently runs via `bun dev`.

A final production container/deployment should be done only when the owner says the feature set is ready.

When containerizing:
- keep host Stack discovery outside container
- use snapshot mode
- do NOT require `docker.sock`
- do NOT install Docker CLI/LXD into web container just for status
- preserve Redis snapshot bridge
- verify R2/DB/Auth env separately

## 20.3 Project logos

Still missing official project logo files for:
- Sentinel
- n8n2erpnext

Fallback monograms are intentional.

## 20.4 Related Writing on Project detail

The original project-detail proposal included “Related Writing”.

This is NOT yet implemented as a true project↔post relationship.

Possible future design:
- add project keys to post taxonomy / relation table
- derive related articles
- avoid matching solely by free-form tags if governance matters

Do not fake related posts until relation semantics are chosen.

## 20.5 Search scalability

Current search is simple in-memory server matching over public content.

Fine for current site size.

Future if corpus grows:
- PostgreSQL full text search
- pg_trgm
- ranked DB query
- maybe tag filters

Do not add Elasticsearch/vector infra prematurely.

## 20.6 Search scope

Current Writing search indexes:
- title
- excerpt
- tags

It does NOT index full article body.

This is intentional for now to avoid noisy results. Change only if owner asks.

## 20.7 Tags

Tags are currently free-form controlled labels, not a separate tag table.

This is appropriate for current scale.

If later adding:
- tag landing pages
- controlled vocab
- tag descriptions
- tag analytics

then migrate to a first-class taxonomy model.

## 20.8 Comments

Current comments are flat, moderated comments.

Not implemented:
- threaded replies
- user comment editing
- public report button
- commenter profile pages
- email notifications

Do not add unless requested.

## 20.9 i18n cleanup

New public features support EN/VI behavior and labels, but some newer strings are local conditional objects inside route/components rather than all being externalized into the central messages file.

If the owner asks for another i18n quality pass, consolidate these strings carefully.

Do not machine-translate existing Vietnamese blindly.

## 20.10 `/stack-demo`

`/stack-demo` remains available as a visual lab.

`/stack` is canonical.

Possible later cleanup:
- retain as lab
- hide from normal UX
- remove only after owner confirms no longer needed

## 20.11 Legacy `/log`

Build still contains `/log` and current public nav may still expose Log.

Owner direction during CMS discussion was to focus heavily on Projects/Writing and de-emphasize/remove Log.

Do not assume `/log` was fully deleted. If cleaning this up next session:
- inspect nav registry first
- confirm whether owner wants route removed, nav hidden, or just no CMS management
- avoid deleting historical data blindly

---

# 21. DO NOT REGRESS THESE OWNER-APPROVED UX DETAILS

## Stack
- House → Room → Object
- clean technical drawing
- no big House info card
- orthogonal wiring
- correct arrow direction
- arrows terminate at room/card edges
- wide invisible hover target on wires
- small technical hover pill
- same spatial language across levels

## Writing
- Ghost-like low-friction editor
- slash insert menu
- outside/ESC/delete closes slash palette
- Unsplash integration
- real feature image
- long-form article layout
- top reading progress
- sticky active TOC
- syntax-highlighted code
- Like
- Google-only comment identity
- moderation before public
- 6 posts/page
- max 2 public highlights
- tags

## Projects
- catalogue stays clean
- logo visible on catalogue
- entire card clickable
- detail page tells the project story
- runtime facts remain real/read-only

## Search
- header magnifying glass
- small unobtrusive popover
- Ctrl/Cmd+K
- search only public surfaces

---

# 22. QUICK START FOR NEXT SESSION

The next session should begin in this order:

1. Read this file completely.
2. Run:
   ```bash
   cd /home/ubuntu/n8n2erpnext/thaiduy.digital
   git status --short
   git rev-parse HEAD
   ```
3. Confirm the dirty worktree still exists.
4. Do NOT reset anything.
5. Verify live dev:
   ```bash
   curl -I http://127.0.0.1:3000/
   ```
6. Smoke whichever surface is being worked on.
7. Only then edit.

Recommended broad smoke:

```bash
for p in   /   /projects   /projects/lightbi   /writing   '/search?q=architecture'   /writing/a-stack-that-can-explain-itself   /stack
do
  curl -sS -o /dev/null -w "$p %{http_code}\n" \
    -H 'cf-ipcountry: US' "http://127.0.0.1:3000$p"
done
```

For control, unauthenticated redirect is expected.

---

# 23. RECOMMENDED QA COMMANDS AFTER CHANGES

## Basic source

```bash
cd /home/ubuntu/n8n2erpnext/thaiduy.digital
bunx tsc --noEmit
git diff --check
bun run lint
```

## Production build

Use isolated build described in section 1.2.

## Writing smoke

```bash
curl -fsS -H 'cf-ipcountry: US' \
  http://127.0.0.1:3000/writing

curl -fsS -H 'cf-ipcountry: US' \
  http://127.0.0.1:3000/writing/a-stack-that-can-explain-itself

curl -fsS -H 'cf-ipcountry: US' \
  'http://127.0.0.1:3000/search?q=architecture'
```

## Project smoke

```bash
for p in   /projects/lightbi   /projects/light-remote   /projects/sentinel   /projects/n8n2erpnext
do
  curl -sS -o /dev/null -w "$p %{http_code}\n" \
    -H 'cf-ipcountry: US' "http://127.0.0.1:3000$p"
done
```

## Stack timers

```bash
export XDG_RUNTIME_DIR=/run/user/$(id -u)
export DBUS_SESSION_BUS_ADDRESS=unix:path=$XDG_RUNTIME_DIR/bus
systemctl --user list-timers --all --no-pager | grep thaiduy-stack-refresh
```

---

# 24. STACK REFRESH OPERATIONS

Manual direct host refresh for troubleshooting:

```bash
cd /home/ubuntu/n8n2erpnext/thaiduy.digital
bun scripts/stack-refresh.ts
```

Request-only worker:

```bash
bun scripts/stack-refresh.ts --if-requested
```

Normal operation should use systemd user timers, not a loop inside Next.

If timers need reinstall:

```bash
./scripts/install-stack-refresh-user-units.sh
```

Do not increase discovery frequency casually. Owner explicitly asked for low-frequency real Docker/LXD discovery (~1–2 hours), with manual GET STATUS available.

---

# 25. CONTENT DATA THAT EXISTS NOW

## Published Writing sample

Slug:
```text
a-stack-that-can-explain-itself
```

Current:
- published
- highlight=true
- tags=[architecture, stack, systems]
- real Unsplash feature image provenance
- syntax-highlighted shell architecture block

## Current project catalogue

Known project keys:

```text
lightbi
light-remote
sentinel
n8n2erpnext
```

LightBI:
- official logo copied
- runtime binding alive

Light Remote:
- official logo copied

Sentinel:
- monogram fallback until official logo supplied

n8n2erpnext:
- monogram fallback until official logo supplied

---

# 26. PUBLIC/PRIVATE DATA BOUNDARY

This is important and should remain explicit.

## Public can receive
- sanitized Stack topology
- safe node labels/groups/state
- published project content
- published Writing
- approved comments
- aggregate likes
- public asset URLs
- public navigation/settings

## Private/control only
- private Stack discovery details
- control workflows
- commenter email
- moderation state for pending/rejected comments
- owner account controls
- raw secret env/config
- private infrastructure metadata excluded by sanitizer

Do not expose private Stack graph simply because Project detail wants richer technical content.

---

# 27. AUTH BOUNDARY SUMMARY

Public anonymous:
- read public pages
- read published Writing
- read approved comments
- see like count
- search public site

Google-authenticated public user:
- all above
- like/unlike
- submit comment (pending)

Owner:
- all control access
- edit projects/writing
- media
- moderate comments
- Stack private control view

This separation is intentional.

---

# 28. VISUAL DESIGN LANGUAGE

The site has converged on a consistent language:

- very dark background
- subtle green/mint signal color
- terminal/technical micro-labels
- Google Sans-style large editorial headings
- thin borders
- restrained glow
- no generic SaaS gradient-card look
- information density controlled
- visual hierarchy through spacing, scale and linework
- live status shown as signals, not dashboard clutter

When adding UI, prefer fitting this system over importing generic component-library visuals.

Projects and Writing intentionally have different content structures while sharing the same site identity.

---

# 29. WHAT WAS DELIBERATELY NOT DONE

- No fake view counts/comments.
- No fake runtime counts.
- No Docker socket dependency for future web container.
- No fabricated Sentinel/n8n2erpnext logos.
- No public email/password signup for commenters.
- No auto-publish comments.
- No giant new CMS framework dependency.
- No replacement of current Stack with the rejected old force graph.
- No resumption of Android after owner paused it.
- No mass reset of old dirty worktree.

---

# 30. FINAL HANDOFF STATUS

As of this handoff, the major web pass is coherent:

```text
STACK
  live host discovery
  snapshot architecture
  House → Room → Object
  control GET STATUS
  2h host refresh

CMS
  Media / R2
  Unsplash
  Project CMS
  Writing CMS

WRITING
  rich editor
  slash cards
  syntax highlighting
  feature image
  long-form public reader
  reading progress
  TOC
  likes
  Google comments
  moderation
  tags
  max 2 highlights
  6/page pagination

PROJECTS
  clickable catalogue
  logos
  detail pages
  authored overview/highlights/architecture/links
  real live Stack nodes

SEARCH
  header search
  Ctrl/Cmd+K
  /search
  public Writing + Projects + nav
```

Latest broad QA:
- TypeScript PASS
- diff-check PASS
- ESLint 0 errors
- public smoke PASS
- production build 38/38 PASS
- pagination acceptance PASS
- engagement acceptance PASS
- syntax language matrix PASS

Main operational caveat:
**all this work is still sitting on a dirty main worktree above HEAD a2352940. Preserve it.**

---

# 31. SUGGESTED NEXT DECISION POINT

Do not automatically start another large feature.

At the beginning of the next session, after verifying this handoff and worktree, ask/confirm which direction the owner wants next.

Most logical candidates, only if requested:

- visual QA/polish of new Writing Highlight/Tags/Search on real browser
- populate Project detail content for LightBI / Light Remote
- add official Sentinel/n8n2erpnext logos when supplied
- add real Project ↔ Writing relation
- clean/de-emphasize legacy Log surface
- checkpoint/commit the current large web pass
- prepare final production container deployment using snapshot Stack architecture

Android remains paused.

---

END OF HANDOFF


---

# 32. POST-HANDOFF ADDENDUM — SENTINEL MUSIC KNOWLEDGE TUNE

After takeover, Sentinel Music Sensor semantic knowledge was tuned and seeded to production DB.

Current knowledge version: `music-k1.1`.

Changes:
- semantic ontology expanded from 119 to 155 music nodes
- added missing pop/rock/metal/hip-hop/R&B/classical/Vietnamese styles
- added context handling for country/language/era/boy-band tags so they do not become genres
- lowered artist-level prior weight; track-level evidence remains authoritative
- resolved the real `guitar instrumental` alias collision
- acoustic feature knowledge expanded from 10 to 16 concepts
- cortex music rules expanded from 10 to 15
- knowledge DB after seed: left 156, right 24, cortex 26
- total `sentinel-music` memory rows after seed: 237, about 77,648 bytes row payload

QA:
- TypeScript PASS
- git diff --check PASS
- alias collision check: 0
- baseline semantic set improved from 7/14 to 16/16
- production DB runtime checks PASS for shoegaze, city-pop, Vietnamese quê hương
- instrumental-only case correctly remains genre=null and is not misclassified as Classical

Do not reset learned hemispheres. Existing learned rows were intentionally preserved; new playback cycles will relearn against `music-k1.1`.


---

# 33. POST-HANDOFF ADDENDUM — SENTINEL MUSIC K2 GENERAL KNOWLEDGE

This supersedes the earlier K1.1 tune note for the current music knowledge version.

Current production knowledge version: `music-k2.0`.

K2 architecture:
- semantic ear remains governed genre/style/mood/texture/arrangement classification
- general music graph is separate structured context knowledge
- general concepts are recognized as context and never automatically promoted to genre evidence
- hand-curated semantic aliases win over K2 expansion aliases

Current authored graph:
- 2,587 general music concepts
- 3,104 parent/related relations
- 415 K2 semantic genre/style concepts; runtime semantic node set = 454 after curated merge
- domains: theory, rhythm, form, instruments/orchestration, vocal, production/MIDI, audio/psychoacoustics, history, recording identity, world/regional music, genre/style
- practical chord and scale vocabulary includes concrete symbols such as Cmaj7/F#m7/Bb7#9 and mode/key instances
- intervals/chords/scales carry semitone formulas for future harmonic inference
- Vietnamese coverage includes traditional, regional, popular and instrument concepts

Production brain DB after final seed:
- total sentinel-music rows: 3,123
- value payload ~1,216,377 bytes; row payload ~1,569,104 bytes
- learned memory intentionally preserved: left 12 / right 7 / cortex 12
- brain profile knowledgeVersion = music-k2.0

QA:
- TypeScript PASS
- git diff-check PASS
- `scripts/test-music-k2.ts` PASS
- kernel smoke: shoegaze => rock/shoegaze while Cmaj7 + sidechain compression are recognized context, unknown=[]

Reproducible pack builder: `scripts/build-music-k2-knowledge.py`
Generated pack: `src/brains/music-sensor/data/music-k2-general.json`
Do not bulk-import the MusicBrainz genre list into product data; it was used only for coverage auditing because MusicBrainz genre/tag data has separate supplementary-data licensing considerations.


---

# 34. POST-HANDOFF ADDENDUM — SENTINEL SELF-COMPOSING HUMMING

Implemented the self-composing humming pass on top of `music-k2.0`.

Behavior contract:
- speaker icon exists only while Sentinel is in `humming` mode with a generated composition
- clicking the speaker plays the current generated score in-browser via Web Audio and opens a compact staff/score panel
- no MP3/WAV is stored; no heard melody is reproduced or persisted
- score metadata exposes key/mode/BPM/meter/bars/voice/chord progression and states `generated · no stored melody`

Composer:
- new `src/brains/music-sensor/composer.ts`
- generates 2–4 bar question/answer phrases with motif → variation → tonic resolution
- semantic intent selects mode/key from mood + recent abstract afterglow
- acoustic contour selects meter/BPM/swing/voice; night hours in VN bias slower/quieter voices
- recent playback contributes only abstract genre/style/mood/energy/meter/swing/texture/dominant-layer/mode-family; never melody
- afterglow decays over ~4 hours toward calm personality defaults
- voices: hum / whistle / soft-synth / breath
- personality persists in cortex key `humming:personality-v1` and learns mode/voice/interval/cadence/swing habits with decay
- learned interval/cadence tendencies feed back into later motif and cadence generation

UI:
- new `src/components/living/humming-player.tsx`
- header waveform is phrase-aware: note pitch/velocity/question-vs-answer alter motion while humming
- tooltip becomes e.g. `HUMMING · D DORIAN · 74 BPM · WARM` with generated/no-stored-melody detail
- score panel renders generated notes and question/answer coloration

Runtime/API:
- `/api/music/state` now returns `composition` only for generated humming; listening/resting return null
- existing in-flight humming cycles are backfilled with a composition
- generated composition lives in Redis humming-cycle state only; abstract personality lives in brain memory

QA:
- TypeScript PASS
- targeted ESLint PASS
- git diff --check PASS
- Next.js production build PASS
- `/` HTTP 200; `/api/music/state` HTTP 200
- composer smoke produced governed key/mode/meter/BPM/chords/notes and cortex personality memory is updating

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 35. POST-HANDOFF ADDENDUM — PUBLIC MUSIC SENSOR EXPLORER

Implemented a dedicated public Music Sensor explainer surface and refactored the homepage Acoustic Organ card.

Homepage card:
- `MusicOrgan` is now split into two functional halves instead of one oversized waveform surface
- upper half keeps Acoustic Organ waveform, live state, layer legend and current track
- lower half shows current interpretation (genre/style/mood/texture), confidence, miniature listening-loop flow and CTA
- CTA links to `/music-sensor`
- waveform area was reduced so the card no longer feels visually empty when stretched to match EntityConsole height

New `/music-sensor` page:
- live current track + interpretation
- six-band layer meter
- four-stage public listening loop: Semantic Ear → Acoustic Organ → Music Cortex → Afterglow
- knowledge stats sourced from current K2 graph at render time
- self-composition section surfaces current generated composition and reuses the humming player when active
- explicit originality/memory boundary explains that heard melodies are not stored or replayed
- bilingual EN/VI copy added to `src/i18n/messages.ts`

New component:
- `src/components/living/music-sensor-explorer.tsx`
- route: `src/app/music-sensor/page.tsx`

QA:
- TypeScript PASS
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS
- `/` HTTP 200
- `/music-sensor` HTTP 200

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 36. POST-HANDOFF ADDENDUM — PUBLIC LOG REMOVAL + GLOBAL FOOTER MENU

Public Log cleanup:
- removed Log/Nhật ký from main navigation fallback and live registry
- deleted public `/log` route (`src/app/log/page.tsx`)
- removed `section.log`, `home.log`, and all `log.*` public section seed rows
- removed `/log` from control content revalidation paths
- replaced homepage Build Log surface with Writing (`home.writing` → `/writing`)
- physically purged the 6 public Log registry rows plus the obsolete `home.footer` registry row from `site_registry`
- internal `audit_logs`, revisions and `/control/audit` were intentionally preserved; they are operational audit history, not the removed public Log surface
- live registry now has main nav: Projects / Writing / Stack / About
- live home surfaces now: Projects / Writing / Stack
- `/log` returns HTTP 404 and no public Log registry rows remain

Global footer menu:
- new `src/components/site/footer.tsx`
- mounted globally from root layout for public pages; automatically hidden for `/control`
- three groups: Navigate / Elsewhere / Legal
- Navigate: Home, Projects, Writing, Stack, About, Music Sensor
- Elsewhere: GitHub → https://github.com/n8n2erpnext
- Legal EN: Terms of Service / Privacy Policy
- Legal VI: Điều khoản dịch vụ / Chính sách quyền riêng tư
- Terms href: https://nelsonlai.dev/terms
- Privacy href: https://nelsonlai.dev/privacy
- replaced the obsolete homepage-only two-line footer registry/content path with the global footer menu

QA:
- stale `.next` cache was removed after route deletion; no source/worktree reset was performed
- Next production build PASS; route table no longer contains `/log`
- targeted ESLint PASS
- git diff --check PASS
- `/` HTTP 200
- `/writing` HTTP 200
- `/log` HTTP 404
- EN footer labels and all three external hrefs verified in rendered HTML
- VI footer labels verified in rendered HTML
- `/control/login` verified with global public footer hidden

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 37. POST-HANDOFF ADDENDUM — NATIVE LEGAL PAGES + NAV/FOOTER TYPOGRAPHY REBALANCE

This supersedes the external Terms/Privacy hrefs recorded in section 36.

Native legal pages:
- footer Terms now links internally to `/terms`
- footer Privacy now links internally to `/privacy`
- removed all `nelsonlai.dev` Terms/Privacy links
- new `src/content/legal.ts` contains original EN/VI legal copy written specifically for thaiduy.digital behavior
- new reusable `src/components/site/legal-page.tsx`
- new routes: `src/app/terms/page.tsx` and `src/app/privacy/page.tsx`
- both routes have locale-aware page metadata

Terms coverage:
- ordinary website use and prohibited abuse/probing
- sanitized runtime/machine-state disclaimer
- writing/comments/community input
- intellectual property and third-party material
- external links
- availability/experimental surface behavior
- change notice

Privacy coverage aligned with current site implementation:
- page/visit analytics, referrer/campaign data
- coarse country/region signal, not precise street location
- browser/OS/device/language and web-performance metrics
- operational/security logs
- optional account-backed reactions/comments
- functional locale/auth cookies where needed
- no sale of data to advertisers
- sanitized public runtime/machine-sense projection
- Sentinel Music heard-melody boundary and abstract musical afterglow
- provider/external-link handling, retention/security and user choices

Typography rebalance after visual review:
- main navigation links increased from 12px to 13.5px
- footer links reduced from responsive 15–20px to 13px fixed
- footer vertical link gap reduced 12px → 8px
- footer margin/padding and column gaps reduced so it stays subordinate to page content
- footer legal links are now normal internal navigation; GitHub remains the only external footer destination

QA:
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS
- route table includes `/terms` and `/privacy`
- `/terms` HTTP 200
- `/privacy` HTTP 200
- EN legal copy verified in rendered HTML
- VI legal copy verified in rendered HTML
- footer rendered hrefs verified as `/terms` and `/privacy`
- no `nelsonlai.dev` legal href remains in rendered footer

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 38. POST-HANDOFF ADDENDUM — MONTHLY SENTINEL HUMMING SKETCHBOOK

Replaced the unbounded visible `Idle sketch NNN` counter with a calendar-month sketchbook.

Behavior:
- sketch numbering is monthly, not lifetime
- timezone boundary: `Asia/Ho_Chi_Minh`
- first sketch of each new month starts again at `Idle sketch 001`
- every autonomous composition is persisted as JSON before personality memory is updated
- same composition ID is idempotent: repeated API polling cannot create duplicate sketches or increment the counter
- musical personality remains separate and is intentionally preserved across month rollover; only generated sketch files reset

Persistent runtime location (outside repo/build tree):
`/home/ubuntu/.local/share/thaiduy.digital/music-sensor/sketchbook/`

Layout:
- `current-month` — current `YYYY-MM` marker
- `<YYYY-MM>/index.json` — small monthly counter/index (`count`, `nextNumber`)
- `<YYYY-MM>/<composition-id>.json` — one complete generated composition per JSON file

Why per-sketch JSON instead of one giant month JSON:
- idle humming policy can wake every ~45s–4min, so a month may naturally reach many MB / thousands of sketches
- per-sketch files avoid rewriting an ever-growing multi-MB JSON file on every composition
- each normal write stays around a few KB
- monthly folder is directly backup-ready: future flow can archive/tar the previous `<YYYY-MM>` directory before purge

Rollover:
- on first sketch in a new month, read `current-month`
- previous month directory is removed recursively
- new month directory/index starts at 001
- no directory-wide scan is used
- this also avoids Turbopack tracing runtime data inside the source repository

Runtime migration/current state:
- legacy temporary monolithic month JSON was removed after migration to the final per-sketch layout
- first real final-format September sketch exists as `Idle sketch 001`
- current index after QA: `count=1`, `nextNumber=2`
- current real sketch observed during QA: F Dorian, 68 BPM, 2 bars, hum voice

Code:
- new `src/brains/music-sensor/sketchbook.ts`
- `HummingComposition` now optionally exposes `sketchNumber` and `sketchbookMonth`
- `composeHumming()` persists through the sketchbook and returns the stored monthly title
- `/api/music/state` migrates an in-flight pre-sketchbook composition if one is encountered

QA:
- monthly rollover logic validated: 001 → 002 in one month, next month → 001
- duplicate composition ID validated as idempotent
- repeated public API polling does not increment the sketch counter
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS

Future backup hook:
- insert archive/copy step in `rollMonth()` immediately before deleting the previous month directory
- intended future model: archive previous month → verify backup → purge local month → start 001

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 39. POST-HANDOFF ADDENDUM — INLINE SELF-COMPOSITION SCORE

Refined `/music-sensor` self-composition card after visual review.

Changes:
- exported the existing generated score renderer as reusable `HummingScore`
- self-composition card is now a two-column layout on desktop
- left: sketch title, key/mode, BPM, meter, bars, voice and chord progression
- right: always-visible CURRENT SKETCH staff notation with generated notes
- right header keeps the speaker control
- public page speaker plays audio without opening a duplicate score popup
- header speaker behavior is unchanged and still opens its compact score popup
- score metadata shows question → answer structure, note count and chord progression
- responsive layout stacks score below composition metadata at <=1040px

QA:
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS
- live runtime check during QA observed `Idle sketch 005`, B major-pentatonic, 84 BPM, 4/4, 3 bars, breath, 12 notes

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 40. POST-HANDOFF ADDENDUM — SELF-COMPOSITION IDLE ALIGNMENT

Adjusted `/music-sensor` self-composition empty state after visual review.

Changes:
- idle message now spans the full two-column composer card instead of falling into the left grid cell
- added dedicated `music-composer-idle` state with centered vertical alignment and proper horizontal padding
- added small `COMPOSER RESTING` / `COMPOSER ĐANG NGHỈ` label above the explanatory text
- active composition layout is unchanged

QA:
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 41. POST-HANDOFF ADDENDUM — HUMMING SCORE OUTSIDE-CLICK CLOSE

Adjusted the header humming score popup interaction.

Behavior:
- the existing × close button remains
- while the score panel is open, a document-level `pointerdown` listener closes it when the pointer target is outside the owning `.humming-player`
- clicks inside the score panel or on the speaker remain inside the owner and do not dismiss the popup
- the listener is attached only while the popup is open and is removed on close/unmount
- `/music-sensor` inline score mode (`showPanel=false`) is unaffected

QA:
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 42. POST-HANDOFF ADDENDUM — DARK/NORMAL THEME + HOMEPAGE TOP ATMOSPHERE

Revisited `/home/ubuntu/thaiduy.old` before implementation and evolved two original ideas instead of copying them directly:
- old theme switch: sun/moon rail + sliding thumb + localStorage
- old infra background wash: seeded multi-orb light/dark color wash

New theme system:
- new `src/components/site/theme-switch.tsx`
- mounted in the public SiteHeader next to search/music controls
- modes: `dark` and `normal` (normal maps to light color-scheme)
- theme persists in localStorage key `thaiduy-theme`
- root layout now runs a tiny pre-paint bootstrap script so saved theme applies before React hydration
- SSR default remains dark
- toggle visual is an evolved orbital switch: sun/moon endpoints, animated thumb/core, glow and press motion
- CSS reads `html[data-theme]` directly so a saved Normal mode does not flash the thumb in the Dark position before hydration
- when supported, browser View Transitions perform a ~620ms circular reveal originating at the theme button position
- reduced-motion users fall back to an immediate accessible mode change

Normal mode palette:
- warm off-white background rather than pure white
- dark green/graphite text
- re-tuned line/panel/signal/amber variables
- adjusted homepage/public panel backgrounds, grid/borders, tooltip/popup surfaces and waveform contrast so the light mode does not look like an inverted dark theme

Homepage atmosphere:
- new `src/components/home/top-atmosphere.tsx`
- mounted only on the homepage (`home-shell`)
- layered technical grid + conic beam + five blurred color fields + pointer-follow glow + bottom/edge falloff
- no canvas/WebGL and no external images
- pointer position is smoothed with requestAnimationFrame and only drives subtle parallax
- independent slow drift animations keep the field alive even without pointer input
- Dark palette: teal / sky / indigo / amber / restrained magenta
- Normal palette: mint / sky / violet / warm yellow / rose, inspired by the old wash but less static
- reduced-motion disables drift/parallax
- atmosphere fades into `--bg` before the lower homepage sections, so it remains a top-only treatment

QA:
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS
- homepage SSR verified to contain `theme-switch`, `top-atmosphere`, and pre-paint `thaiduy-theme` bootstrap
- VPS has no Chromium/Playwright installed, so final visual tuning should be judged from the real browser after refresh; code/build/runtime checks are clean

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 43. POST-HANDOFF ADDENDUM — THEME SWITCH SIMPLIFICATION + NORMAL HERO CONTRAST

Visual QA follow-up after reviewing real browser screenshots.

Theme switch:
- removed the large circular View Transition reveal entirely
- simplified the switch back toward the original thaiduy.old spirit
- removed the animated thumb/core/glow treatment from the active markup
- new visual is only a compact pill, one horizon line, sun and moon
- Normal mode: sun rises above the horizon while moon sinks below it
- Dark mode: moon rises while sun sinks
- theme persistence/localStorage and pre-paint bootstrap remain unchanged
- page-level color transition remains calm and ordinary rather than theatrical

Header music wave:
- removed hover/focus popup behavior completely
- removed pointer hover/focus border/background treatment
- header wave is now a passive visual indicator only
- humming speaker remains interactive and still opens/plays generated score as before

Normal-mode Living Field / hero card:
- increased border contrast so the card separates from the bright atmospheric background
- changed the field surface to a more opaque warm white/green panel
- reduced the heavy drop shadow to a small restrained shadow
- field topbar/footer are more opaque and legible
- LivingCanvas now observes `data-theme` directly and switches drawing colors live
- Normal mode canvas uses darker grid, links, node labels and role labels for substantially better contrast
- active link strength is increased in Normal mode without affecting Dark mode
- header shadow in Normal mode also reduced

QA:
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 44. POST-HANDOFF ADDENDUM — SINGLE-ICON IPHONE-LIKE THEME CONTROL

Refined the public theme control again after direct owner clarification.

Final interaction contract:
- only ONE icon is visible at rest; it represents the CURRENT theme
- Normal mode shows only the sun
- Dark mode shows only the moon
- no visible switch rail, horizon, thumb or border
- clicking always uses the same vertical carousel direction:
  - current icon rises upward and fades out
  - next mode icon rises from below into the exact same position
- both Dark→Normal and Normal→Dark use this same upward flow rather than reversing direction
- animation duration: ~420ms with a restrained iOS-like easing
- click/tap target remains 30×30 even though the visible icon is ~15px
- reduced-motion collapses animation to immediate switching
- localStorage persistence and the pre-hydration theme bootstrap remain unchanged

Implementation:
- `src/components/site/theme-switch.tsx` now renders only current/in-flight outgoing icons inside a clipped single-icon stage
- the previous two-icon horizon/rail markup is no longer used
- no page-level reveal transition is involved

QA:
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 45. POST-HANDOFF ADDENDUM — WRITING TAG REGISTRY + COLOR GOVERNANCE

Implemented a governed Writing Tag Registry so posts can only choose pre-created tags and public tag color is controlled centrally.

Data model:
- new `writing_tags` table via migration `drizzle/0007_writing_tag_registry.sql`
- fields: id, stable slug, display name, color, auto-calculated text color, enabled, timestamps
- post storage remains lightweight: `posts.tags` stores stable tag slugs only
- tag slug is generated at creation and intentionally remains immutable after creation so renaming/recoloring never breaks post references
- tag display name/color/enabled state can be changed centrally
- text color is automatically selected for readable contrast against the chosen tag color

Migration/live data:
- Drizzle migration applied successfully to production PostgreSQL
- legacy free-text post tags were migrated into the tag registry and normalized to slugs
- existing post preserved all three tags
- current migrated tags:
  - architecture → bg `#D6F0E0`, text `#24553A`
  - stack → bg `#D9E8FA`, text `#254D75`
  - systems → bg `#E9DDF7`, text `#563C73`

Control UI:
- new route: `/control/content/tags`
- accessible from Content utility cards, Writing header (`TAGS`), and editor `MANAGE TAGS`
- create tag with name + native color picker + editable hex value + live preview
- registry list shows public preview, stable slug, usage count, editable display name/color, ACTIVE toggle and SAVE
- disabling a tag removes it from selectable/public active tag surfaces
- Writing editor no longer accepts comma-separated arbitrary text tags
- Writing editor now shows reusable colored checkbox pills from the Tag Registry
- up to 8 tags can be selected per post
- server save path validates that every selected tag exists and is active
- post tag assignments revalidate Tag Registry usage counts

Public rendering:
- new reusable `WritingTagChip`
- `/writing` cards render exact registry background/text colors using inline styles
- `/writing/[slug]` renders the same governed colors; tag links still search by tag display name
- `/search` Writing results also render the same colored chips
- tag identity is therefore theme-independent: Dark and Normal modes preserve the exact tag colors configured in Control
- removed reliance on the old hard-coded black tag background; CSS now provides only structural fallback while registry inline color is authoritative

Admin rendering:
- Writing list shows the same configured tag colors
- Content overview now has a Writing Tags management utility card

QA:
- migration 0007 applied successfully
- production DB verified with 3 migrated registry tags and unchanged post assignments
- tag resolver verified on published post (`tagRecords` includes slug/name/color/textColor/enabled)
- `/writing` rendered exact expected inline color styles for architecture/stack/systems
- `/search?q=architecture` rendered the same colored Writing tag chips
- `/writing/a-stack-that-can-explain-itself` HTTP 200
- `/control/content/tags` is present in the production route table and correctly redirects unauthenticated requests to login
- targeted ESLint: 0 errors; only 6 pre-existing `no-img-element` warnings
- git diff --check PASS
- Next production build PASS

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 46. POST-HANDOFF ADDENDUM — SITE-WIDE TYPOGRAPHY SYSTEM V1

Owner visual QA identified a systemic typography problem: display headings were oversized while terminal/meta labels were often 5–9px and difficult to read. A full stylesheet audit confirmed 99 `8px` shorthand font declarations, 62 `7px` declarations, plus multiple 5/6px labels, while major page titles reached 88–108px.

Research/reference:
- reviewed current Apple Human Interface Guidelines typography guidance before tuning
- Apple default Large Dynamic Type roles center around: Large Title 34pt, Title 1 28pt, Title 2 22pt, Title 3 20pt, Body/Headline 17pt, Callout 16pt, Subhead 15pt, Footnote 13pt, Caption 12/11pt
- Apple guidance emphasizes semantic text roles, legibility at every size, accessibility scaling, and avoiding rigid hard-coded typography
- implementation is Apple-inspired rather than an Apple visual clone; desktop editorial display sizes remain larger, but extremes were capped and metadata raised to a readable floor

New semantic tokens appended in `src/app/globals.css`:
- `--type-display-lg`: clamp(48px, 5.4vw, 72px)
- `--type-display`: clamp(44px, 4.8vw, 64px)
- `--type-display-sm`: clamp(38px, 4vw, 52px)
- `--type-title-1`: clamp(30px, 2.8vw, 40px)
- `--type-title-2`: clamp(24px, 2vw, 32px)
- `--type-title-3`: clamp(20px, 1.5vw, 24px)
- body large/body/body small: 19/17/15px
- UI/label/meta: 13/12/11px
- diagram annotation: 10px, with a tightly controlled 9px floor only for dense SVG/diagram labels
- unified display/heading/body leading and tracking tokens

Public surfaces normalized:
- header brand/nav/state/language controls
- homepage hero, lede, principles, topology console, surface cards and manifesto
- Living Field top/footer, Activity rail and Music Organ
- generated humming score metadata
- generic managed section pages including Writing/Projects/About shells
- project catalogue cards
- public Stack page and spatial renderer annotations
- Writing index, highlight cards, pagination and governed colored tag chips
- Writing article hero/body/headings/facts/TOC/code/comments/engagement
- Project detail hero/facts/overview/runtime/architecture/links/footer
- Search hero/results/input/metadata
- Music Sensor lab hero/pipeline/knowledge/composer
- Terms/Privacy legal pages
- global footer

Key visual corrections:
- homepage hero title capped at 72px desktop instead of scaling toward ~106px
- generic section/page titles capped at 64–72px instead of 88–128px
- homepage manifesto statement capped around 58px instead of ~74px+
- Writing/Project/Search/Music major page titles now share the same semantic display family instead of independent 88–108px clamps
- public body copy standardizes around 15–17px; lead copy around 19px
- normal public metadata/terminal labels raised to 11–12px from 6–9px
- activity rows raised to 13px and 46px min row height for legibility
- tags/pagination/footers/search metadata now use the same 11px meta role
- article body remains comfortable at 17px with 1.78 leading

Control plane:
- intentionally remains denser than public pages, but its common 6–9px controls/labels were normalized to an 11px UI-meta floor
- main control page headings were capped to the smaller display token
- editor body remains 17px; CMS headings follow shared title tokens
- tables/cards/forms/tag registry/media/project CMS labels are governed by the same dense role instead of arbitrary 6/7/8px values

Responsive behavior:
- <=760px lowers display token caps to ~44–54px depending semantic role
- major page/hero titles use the mobile display token rather than old viewport clamps
- manifesto uses a 34–46px mobile range
- body/UI/meta roles remain readable instead of shrinking with viewport

Exceptions:
- dense Stack SVG annotations are allowed 9–10px because they are diagram labels rather than primary UI text
- humming staff note labels remain 9px for score geometry

QA:
- full font-size inventory/audit completed before implementation
- follow-up coverage audit completed after typography layer; remaining public tiny selectors were explicitly covered (photo credit, project enter, project architecture/link labels, old tooltip text, comment status message)
- `git diff --check -- src/app/globals.css` PASS
- Next production build PASS, all 41 routes generated/collected successfully
- no functional component/data changes in this pass; typography is governed via final CSS cascade layer

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 47. POST-HANDOFF ADDENDUM — TYPOGRAPHY GOVERNANCE + AUTOMATED AUDIT

Follow-up typography pass after the site-wide scale normalization.

Goal:
- turn typography from visual convention into an explicit repo contract
- prevent future pages/components from reintroducing 5–8px metadata or 80–120px display headings
- separate Public, Control and Diagram/SVG density rules

Canonical documentation:
- added `docs/TYPOGRAPHY.md`
- documents font families, semantic roles, hard floors/ceilings, responsive behavior, line height, tracking, weight, per-surface mappings and implementation rules

Canonical scale:
- Display Large: 48–72px
- Display: 44–64px
- Display Small: 38–52px
- Title 1: 30–40px
- Title 2: 24–32px
- Title 3: 20–24px
- Body Large / Body / Body Small: 19 / 17 / 15px
- UI / Label / Meta: 13 / 12 / 11px
- Diagram / Diagram Min: 10 / 9px
- Brand: 14px
- Code: 13px
- Statement: 38–58px
- Pullquote: 19–26px

Hard rules:
- public readable copy >=15px
- normal interactive UI >=13px unless semantically metadata
- public/control metadata >=11px
- Control UI common dense floor = 11px
- diagram SVG labels default 10px, absolute floor 9px
- display ceiling = 72px desktop
- no arbitrary TSX `fontSize` or Tailwind `text-[Npx]`
- Vietnamese/English must share the same semantic size role

CSS cleanup:
- converted remaining raw canonical values to named tokens:
  - `--type-diagram-min`
  - `--type-brand`
  - `--type-code`
  - `--type-statement`
  - `--type-pullquote`
- mobile statement scale is now a token override rather than a one-off component clamp

Automated governance:
- added `scripts/audit-typography.ts`
- added package script: `bun run typography:check`
- scans `globals.css` canonical typography layer
- scans 155 source files for inline `fontSize` and arbitrary Tailwind text sizes
- verifies legacy tiny/oversized declarations are governed by the canonical typography layer
- future uncovered typography outliers cause non-zero exit

The new audit immediately found 8 remaining uncovered outliers and they were normalized:
- Music Wave tooltip title: 10px -> Label role
- Stack top/bottom port labels: 7px -> Diagram Min role
- CMS slash-menu icon label: 10px -> Label role
- CMS primary content action: 8px -> Meta role
- CMS Writing head action: 8px -> Meta role
- Project mark text: 10px -> Label role
- CMS tag input: 10px -> Label role

Final QA:
- `bun run typography:check` PASS
- audit reports 424 canonical selectors / 155 source files / 0 violations
- ESLint for the audit script PASS
- git diff --check PASS
- Next production build PASS
- all 41 routes generated/collected successfully

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 48. POST-HANDOFF ADDENDUM — MUSIC WAVE TOOLTIP RESTORED WITHOUT HOVER CHROME

Restored the information tooltip for the header Music Wave after the previous visual simplification removed it too aggressively.

Behavior now:
- hovering the waveform reveals the status tooltip again
- keyboard focus on the waveform also reveals the tooltip
- tooltip content still reports current track/title + listening/humming/resting detail + generated composition metadata when applicable
- the waveform itself remains visually passive: no hover background, no hover border, no button-like chrome
- speaker behavior remains unchanged

Implementation:
- tooltip markup restored inside `MusicWaveIndicator`
- no React hover state required; visibility is governed by `.header-wave-wrap:hover` / `:focus-within`
- waveform keeps accessible `aria-label` and is focusable for keyboard users

QA:
- targeted ESLint PASS
- `bun run typography:check` PASS (424 canonical selectors / 155 source files / 0 violations)
- git diff --check PASS
- Next production build PASS; all 41 static generation steps completed

`bun dev` remains running on PID 3640441 unless explicitly stopped later.


---

# 49. POST-HANDOFF ADDENDUM — NORMAL MODE CONTRAST CONTRACT + MUSIC WAVE TAPER

Owner visual QA found two Normal-mode regressions: public article text inherited pale dark-mode hardcodes and became low-contrast on the warm light background; the header Music Wave mid layer became visually black/heavy and its ends did not feel naturally tapered.

Normal-mode contrast contract:
- extended Normal theme semantic variables:
  - `--text-strong: #172019`
  - `--text-body: #46534b`
  - `--text-secondary: #5c6961`
  - `--text-meta: #667269`
  - `--text-faint: #768179` (decorative/nonessential only)
  - `--link: #1b6c4d`
- tightened generic Normal `--muted` / `--muted-2` to darker readable values
- mapped hard-coded dark-mode public text colors into semantic light-mode roles across:
  - header / wave tooltip / humming panel
  - homepage / generic managed surfaces
  - Living Field + Activity
  - Project catalogue + Project detail/runtime
  - Writing index + article + TOC + engagement/comments
  - Search + search popover
  - Stack public/spatial UI
  - Music Sensor
  - Legal pages
  - global footer
- fenced code blocks intentionally remain dark in both themes; inline code gets a light-mode green-tinted surface
- governed tag chips retain registry-owned inline foreground/background colors

Contrast audit:
- added an ad-hoc luminance coverage pass against the stylesheet to find bright public hard-coded text selectors that were not explicitly remapped for Normal mode
- first pass found 18 leftovers (activity live, project hover, pagination active, search trigger, music badge, etc.)
- all 18 were normalized
- final result: `Potential bright-on-light public selectors not explicitly remapped: 0`

Music Wave:
- removed the Normal-mode near-black mid-layer treatment
- Normal palette now keeps all six signal layers colored and muted:
  - bass teal
  - low-mid green-teal
  - mid sage
  - vocal amber
  - presence blue
  - air violet
- JS wave geometry envelope changed from `sin(pi*r)` to `sin(pi*r)^1.65`, causing amplitude to shrink more decisively toward both ends
- SVG now has a symmetric alpha mask: transparent at edges, progressively visible inward, fully visible through the center band
- baseline and all layered curves share the same optical fade
- hover tooltip behavior remains intact and the waveform itself remains visually passive

QA:
- public luminance coverage audit: 0 uncovered bright-on-light selectors
- targeted ESLint PASS
- `bun run typography:check` PASS (650 canonical selectors / 155 source files / 0 violations)
- git diff --check PASS
- Next production build PASS; all 41 routes generated/collected successfully

`bun dev` remains intentionally running unless explicitly stopped.


---

# 50. POST-HANDOFF ADDENDUM — NORMAL SURFACE GOVERNANCE + COMMENT FORM FIX

Owner visual QA found that although Normal-mode text colors had been corrected, some Dark-mode surface/background rules still leaked into the light theme. The most visible example was the Writing comment textarea rendering as a near-black box on a light article page, with low-contrast text/placeholder treatment.

Normal surface contract:
- added semantic light-surface variables:
  - `--surface-1: #fafbf8`
  - `--surface-2: #f2f5f0`
  - `--surface-3: #e9eee8`
  - `--surface-input: #ffffff`
  - `--surface-hover: #eef3ee`
- Normal mode now explicitly maps hard-coded Dark surfaces for public UI instead of relying only on foreground recoloring

Writing engagement fixes:
- comment form panel uses Normal surface
- textarea is white/light with readable dark body text
- placeholder gets explicit readable Normal color and opacity=1
- focus state gets green border + restrained focus ring
- avatar fallback circles switch to light secondary surface
- Like button is no longer a black pill in Normal mode
- Google login and Submit Comment controls use restrained green-tinted light surfaces

Other public surface fixes:
- Search popover, search inputs and keyboard hint now have explicit light surfaces
- Project mark/detail mark and Project runtime panel are light in Normal mode
- Stack node/spatial canvas/toolbar/stage/plaque/touch hint/object inspector/wire tooltip now have light Normal surfaces
- Writing image/card fallbacks and article cover fallback use light surfaces
- Music composer score canvas uses a light surface
- generic entity-node Normal surface remains explicitly light
- inline code uses a light green-tinted surface; fenced code intentionally remains dark
- photo-credit overlays intentionally remain dark because they sit on images

Control-plane spillover:
- global theme also affected some Control inputs, so Normal overrides were added for `control-editor`, `control-setting-editor` and `brain-profile` inputs/textareas to prevent the same black-box problem there

Theme audit governance:
- added `scripts/audit-theme-contrast.ts`
- added package script: `bun run theme:check`
- audit reads all Normal-mode selectors in `globals.css`
- checks for bright Dark-mode text leaking onto Normal backgrounds
- checks for near-black Dark-mode public surfaces leaking into Normal mode
- documented intentional exceptions: fenced code and photo-credit overlays
- added `docs/THEME_CONTRAST.md` as the canonical theme contrast/surface contract

Audit progression:
- first surface scan exposed multiple Dark-mode backgrounds (comment textarea, like button, Search popover/input, Project runtime, Stack spatial panels, etc.)
- first permanent audit pass then found four final issues: Music interpret strong text, generic article code text, photo-credit link exception, and brain-profile textarea
- all genuine issues fixed; photo-credit link correctly documented as intentional dark-overlay content

Final QA:
- `bun run theme:check` PASS
  - Normal-mode selectors: 313
  - uncovered bright text: 0
  - uncovered dark surfaces: 0
- `bun run typography:check` PASS
  - canonical selectors: 687
  - source files scanned: 155
  - 0 violations
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS; all 41 routes generated/collected successfully
- live dev `/writing/a-stack-that-can-explain-itself` HTTP 200

`bun dev` remains intentionally running unless explicitly stopped.


---

# 51. POST-HANDOFF ADDENDUM — DEEP NORMAL-MODE + LAYOUT REGRESSION AUDIT

Owner reported two classes of regressions after the recent visual/theme passes:
1. homepage sticky navigation stopped following scroll
2. Normal mode still exposed multiple low-contrast / dark-theme structural leaks

## Sticky header root cause and fix

Root cause was found in the homepage atmosphere pass:

`.site-header` was correctly defined as `position: sticky`, but a later rule:

`.home-shell > .site-header, .home-shell > main { position: relative; z-index: 2; }`

overrode the header to `position: relative` only on the homepage.

Fix:
- homepage header now explicitly remains `position: sticky`
- homepage header z-index raised/locked at 30
- main content remains relative at z-index 2
- atmosphere remains below at z-index 0

## Homepage full-bleed atmosphere / horizontal overflow

A second layout risk was identified from screenshots: horizontal scrollbar / overflow on desktop.

The atmosphere used `width: 100vw` inside the constrained `.site-shell`. Desktop viewport units can include scrollbar width and create small horizontal overflow.

Architecture changed:
- new outer `.home-page` wrapper owns the full-bleed atmosphere
- constrained `.site-shell.home-shell` now sits inside it
- `TopAtmosphere` is a sibling of the site shell rather than a child
- atmosphere now uses `left:0; width:100%`
- no root `overflow-x:hidden` workaround was introduced, avoiding sticky side effects

## Normal-mode structure contract

Earlier theme audit already governed text + surfaces. Deep audit was expanded to structural paint:
- borders / separators
- SVG stroke/fill
- grid lines
- card outlines
- hover/focus outlines
- humming score notation

Additional Normal fixes included:
- Language switch border/surface
- Project card borders/backgrounds/hover
- Writing post card + highlight structure
- Music insight/badge/live/pipeline separators and surfaces
- Legal section dividers
- humming score border/staff/bar/note/clef colors
- Stack legacy renderer grid/links
- Stack canonical SVG district/room/object shells, headers, labels, grid, node dots, port labels
- Stack inspector internal separators

Deep audit initially caught:
- 1 remaining Stack inspector light separator
- 4 remaining humming score paints (staff/bar/note/clef)

All were fixed.

## Control plane decision

A separate deep scan of Control under public Normal theme found:
- 46 bright Dark-mode text selectors
- 44 dark hard-coded surfaces

Rather than partially light-theme ~90 operational selectors, Control is now intentionally theme-isolated:
- public site supports Dark / Normal
- `/control` remains a dark operational console regardless of public theme
- under `html[data-theme='normal']`, `.control-root` and `.control-login` restore dark semantic variables + `color-scheme: dark`
- previous accidental light overrides for Control editor / brain / registry surfaces are neutralized inside Control

This avoids mixed half-light/half-dark admin UI and creates an explicit architecture boundary.

## Theme audit upgraded

`scripts/audit-theme-contrast.ts` now checks:
- bright hex or rgba text leaking into Normal
- dark surfaces leaking into Normal
- light Dark-mode borders disappearing on Normal
- light SVG stroke/fill disappearing on Normal
- semantic Normal text contrast ratios
- Control dark-isolation contract presence

Current semantic Normal contrast ratios:
- strong/bg: 15.36:1
- body/bg: 7.43:1
- secondary/bg: 5.29:1
- meta/bg: 4.62:1
- link/bg: 5.85:1
- body/input: 8.08:1
- meta/surface: 4.84:1

Final theme audit:
- Normal-mode selectors: 383
- uncovered bright text: 0
- uncovered dark surfaces: 0
- uncovered light borders: 0
- uncovered light SVG paint: 0
- semantic/control contract issues: 0
- THEME CONTRAST PASS

## Layout governance

Added:
- `scripts/audit-layout-invariants.ts`
- package command: `bun run layout:check`
- `docs/LAYOUT_INVARIANTS.md`

Layout gate enforces:
- base `.site-header` remains sticky
- homepage header remains sticky
- homepage header z-index >=20
- atmosphere remains below sticky header
- site/home wrappers do not become vertical scroll containers
- atmosphere width stays 100% rather than 100vw
- atmosphere left stays 0

Final layout audit:
- base header position: sticky
- home header position: sticky
- home header z-index: 30
- atmosphere z-index: 0
- atmosphere width: 100%
- atmosphere left: 0
- LAYOUT PASS

## Documentation

Updated:
- `docs/THEME_CONTRAST.md` with structure contract + Control isolation + expanded audit rules
- added `docs/LAYOUT_INVARIANTS.md`

## Final QA

- `bun run theme:check` PASS
- `bun run layout:check` PASS
- `bun run typography:check` PASS
  - 765 canonical selectors
  - 155 source files
  - 0 violations
- targeted ESLint PASS
- git diff --check PASS
- Next production build PASS
- all 41 static-generation steps completed
- public smoke test HTTP 200:
  - /
  - /writing
  - /writing/a-stack-that-can-explain-itself
  - /projects
  - /stack
  - /music-sensor
  - /about
  - /terms
  - /privacy
  - /search?q=architecture
- `bun dev` still running as PID 3640441

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 52. POST-HANDOFF ADDENDUM — STACK NORMAL-MODE WIRING READABILITY

Owner visual QA found that Stack rooms/cards were readable in Normal mode but topology wiring, especially connection endpoints, was too pale to read quickly.

## Renderer improvements

House-level wiring:
- house wires now render explicit endpoint circles at both room-boundary connection points
- current live graph produced 22 rendered endpoint markers on /stack
- endpoint geometry is computed from the same roomConnectorToward(...) function used to build the wire path, so endpoint dots align exactly with room boundaries
- endpoint style follows protocol and load

Room hover:
- HouseScene now tracks hovered/focused room
- when a room is hovered/focused, wires connected to that room become dominant and unrelated wires/endpoints dim
- keyboard focus receives the same topology emphasis as pointer hover

Object hover:
- RoomScene now tracks hovered/focused object
- hover uses the same connectivity focus model as explicit object selection
- related internal/external wiring remains visible
- unrelated objects/wires dim
- active click selection still takes precedence over transient hover

Node/port geometry:
- house node dots increased from 5px radius to 5.5px
- room object status dots increased from 4px to 4.5px
- external port connector hubs increased from 4px to 5px

## Normal-mode wiring palette

Normal-mode wiring now uses stronger readable transport colors against the pale Stack background:
- private: green
- database: ochre
- http/app: blue
- control: violet
- storage: teal-green

House wire load hierarchy:
- light: about 1.05px
- medium: about 1.45px
- heavy: about 1.95px

Room/internal wiring:
- normal internal links raised to about 1.35px
- external branch lines raised to about 1.15px
- external bus raised to about 1.45px
- muted unrelated links stay intentionally faint

Endpoint hubs:
- light fill with protocol-colored outline in Normal mode
- stronger outline on related/hovered topology
- restrained halo for separation from room fills
- unrelated endpoints dim together with their wire

External ports:
- connector line strengthened
- port circle now acts as an explicit hub with about 2.2px outline
- label paint-order remains stroked so text survives on room/grid backgrounds

Grid:
- Normal Stack grid reduced slightly so it remains positioning context rather than competing with topology lines

Node states:
- online/degraded dots have stronger state color separation
- ring uses graphite-green rather than bright white so it remains valid under the Normal structure contract

Legend:
- protocol legend colors were updated to match actual Normal-mode wiring colors and dash semantics

## QA

- targeted ESLint on stack-spatial.tsx PASS
- bun run theme:check PASS
  - 421 Normal-mode selectors
  - 0 bright text leaks
  - 0 dark surface leaks
  - 0 light border leaks
  - 0 light SVG paint leaks
  - 0 semantic/control contract issues
- bun run layout:check PASS
- bun run typography:check PASS
  - 822 canonical selectors
  - 155 source files
  - 0 violations
- git diff --check PASS
- Next production build PASS
- /stack live dev smoke HTTP 200
- SSR/live markup verified 22 stack-spatial-house-wire-endpoint markers
- bun dev remains running on PID 3640441

Worktree remains intentionally dirty. Do not reset/clean/checkout over this pass before preserving it.


---

# 53. POST-HANDOFF ADDENDUM — LIGHTBI / LIGHT REMOTE WRITING SEED + EDITORIAL VOICE

Owner requested real Writing content for Home/UI testing, but explicitly required that the articles remain useful as permanent public posts rather than throwaway seed text.

## Source reading before writing

LightBI sources reviewed on VPS:
- LightBI Project Book / Project Truth 1.0
- LightBI Code Map
- 2026-09-15 Domain Enterprise Report + PDF handoff
- Micro Semantic Brain architecture
- current LightBI source around grain/readiness/lineage/Deep BA/runtime boundaries
- current public NEXT surface at https://next.lightbi.app

Core product truths retained in the posts:
- LightBI is closer to a Business Understanding Engine than a chart generator
- semantic recognition is not execution permission
- grain is a safety boundary
- sample/context scope must not silently become final analytical authority
- Micro Semantic Brain broadens recall but does not own governed execution truth
- local-first, source identity, lineage and fail-closed behavior remain central
- Deep BA should keep conclusions attached to evidence and limitations

Light Remote sources reviewed on VPS:
- reviewer/OpenAI product README
- Submission Readiness 2026-09-17
- OpenAI Submission handoff
- Reviewer Runbook
- plugin tool definitions and server instructions
- operator adapter / device-local policy code

Core product truths retained in the posts:
- Local Wall owns local-first onboarding
- MCP cannot mint its own A code or bypass local approval
- sessions use explicit device targets with no silent fallback
- Main/Fleet authority is explicit
- PTY/ConPTY lifecycle is real and target-bound
- device-local policy is the final deny boundary
- Recent Activity is sanitized
- reviewer environment uses production code paths with isolated fixture accounts/devices, not a fake mock
- destructive lifecycle operations remain explicit tools

## Four published Writing posts

1. /writing/lightbi-understand-before-chart
   - VI: Tôi không muốn LightBI bắt đầu bằng biểu đồ
   - EN: I Didn’t Want LightBI to Start With Charts
   - tags: lightbi, data-trust, systems
   - highlight: true

2. /writing/light-remote-from-bridge-to-product
   - VI: Light Remote ra đời vì tôi sắp mất chiếc remote quen thuộc
   - EN: Light Remote Started Because I Was About to Lose My Usual Remote
   - tags: light-remote, systems, architecture
   - highlight: false

3. /writing/lightbi-understand-without-guessing
   - VI: Dạy máy hiểu dữ liệu mà không cho nó quyền đoán
   - EN: Teaching a Machine to Understand Data Without Letting It Guess
   - tags: lightbi, local-first, architecture
   - highlight: false

4. /writing/light-remote-device-policy-final-no
   - VI: Cho AI điều khiển máy tính, nhưng quyền từ chối vẫn phải nằm ở máy
   - EN: Let AI Operate a Computer, but Keep the Final No on the Device
   - tags: light-remote, security, local-first
   - highlight: false

All posts were created through the real savePost() pipeline, so post revisions and audit records exist. No direct DB shortcut was used for article creation.

Existing highlight plus the new LightBI highlight keeps the highlighted set at exactly 2 posts.

## New governed tags

Created through the Writing Tag Registry:
- lightbi
- light-remote
- local-first
- data-trust
- security

Colors are registry-owned and can be changed later from /control/content/tags without editing articles.

## Real Playwright covers

Playwright Chromium was installed on the VPS cache and used to capture real product UI at 2560x1440.

Persistent media:
- public/media/writing/lightbi-home-2560x1440.png
- public/media/writing/lightbi-deep-ba-2560x1440.png
- public/media/writing/light-remote-home-2560x1440.png
- public/media/writing/light-remote-fleet-policy-2560x1440.png

The fourth image was intentionally recaptured from the Light Remote account/auth surface because the original second Light Remote capture was byte-identical to the first due the short landing page.

Asset records use source=screenshot and public thaiduy.digital media URLs. No reviewer credentials or private runtime data are visible.

## Editorial voice contract

Added docs/WRITING_STYLE.md.

Key rule: public Writing should sound like a normal technical blog written by a person who actually built the system, not an architecture handoff or machine-translated product document.

Vietnamese defaults:
- natural spoken-written Vietnamese
- first-person is allowed and encouraged when it fits
- short/medium sentences
- technical English terms may remain English when that is normal usage
- explain with real examples before definitions
- avoid rigid documentation phrases and marketing adjectives
- headings should sound like real thoughts, not specification sections

English is rewritten naturally rather than translated line-by-line.

Before future product posts, read current docs/code first and never publish planned capability as shipped truth.

## Verification

DB:
- 4 new published posts
- 4 post create revisions
- 4 post create audit records
- all 4 cover assets resolve
- 5 new tags resolve
- highlight count remains 2 total

Route smoke:
- all four new article routes: HTTP 200
- /writing: HTTP 200
- /home-demo: HTTP 200

High-resolution cover media: HTTP 200.

Temporary seed script/JSON were removed after successful creation. Persistent outputs are only the published DB content, tag/asset records, cover PNGs, and Writing style documentation.


---

# 54. POST-HANDOFF ADDENDUM — MB / SENTINEL / MUSIC SENSOR WRITING SERIES

Owner requested additional permanent Writing content covering:
- LightBI Micro Brain (MB)
- the two Sentinel security agents Luna and Selene
- Sentinel Music Sensor
- origin stories, architecture, technical behavior, reasons for existence, and intended applications

All articles follow docs/WRITING_STYLE.md: natural Vietnamese technical-blog voice, current source truth first, no handoff/spec tone, and no marketing filler.

## Source truth reviewed

Micro Brain:
- canonical Micro Semantic Brain architecture + ADR-124
- current V1 module README and source manifest
- current compiled foundation index metadata
- current measured index footprint
Current MB facts used:
- 248 knowledge cards
- 225 canonical bridges
- 23 open concepts
- 25 guarded formulas
- 159 relations
- 56 confusion pairs
- 1,118 retrieval units
- 2,048 sparse features
- compiled JSON 5,630,717 bytes; gzip 1,726,777 bytes
- BM25 sparse retrieval + deterministic TF-IDF/LSA dense retrieval + RRF
- retrieval rank remains provenance, never semantic/execution authority

Sentinel Luna/Selene:
- prior project curriculum and architecture decisions were reconciled with current site brain/kernel direction
- Luna and Selene are symmetric agents with independent state/evidence/attention/learning
- both receive the same curriculum; learning is never withheld as reward
- 09:30 self-report is a learning checkpoint, not an achievement score
- candidate learned associations require provenance/decay and cannot promote themselves into curated truth
- OBSERVE_ONLY remains a hard boundary
Sentinel curriculum points retained:
- interface + RX/TX
- port/socket/listener/connection
- process/container
- topology
- NAT/hairpin/proxy
- source identity
- temporal baseline
- request sequence
- outbound behavior
- cross-layer correlation
- later gates include failure domains, identity through boundaries, sequence intelligence, reconnaissance grammar, authentication abuse, distributed coordination and availability/DDoS reasoning
- Fail2ban/CrowdSec are evidence sources, not ground truth

Music Sensor:
- current music brain kernel/service/composer/seed code
- production profile and memory state
- music-k2.0 knowledge
- self-composition + personality memory + monthly sketchbook behavior
## Six new published articles

1. /writing/micro-brain-why-lightbi-needed-one
   VI: Micro Brain ra đời vì một registry không thể biết hết thế giới
   EN: Micro Brain Exists Because a Registry Cannot Know the Whole World
   tags: micro-brain, lightbi, data-trust

2. /writing/micro-brain-inside-5mb-index
   VI: Bên trong một bộ não 5,6 MB của LightBI
   EN: Inside LightBI’s 5.6 MB Micro Brain
   tags: micro-brain, lightbi, architecture

3. /writing/sentinel-why-two-agents-luna-selene
   VI: Tại sao tôi nuôi hai Sentinel thay vì một con
   EN: Why I Built Two Sentinels Instead of One
   tags: sentinel, security, learning-system
4. /writing/sentinel-learning-network-from-interface-to-topology
   VI: Dạy Sentinel nhìn một kết nối: từ card mạng tới topology
   EN: Teaching Sentinel to Read a Connection From Interface to Topology
   tags: sentinel, security, stack

5. /writing/sentinel-music-why-security-sensor-listens
   VI: Vì sao một Sentinel canh hạ tầng lại bắt đầu nghe nhạc?
   EN: Why Did a Security Sentinel Start Listening to Music?
   tags: sentinel, music-sensor, learning-system

6. /writing/sentinel-music-self-composition-personality
   VI: Rảnh quá thì tự nghêu ngao: bên trong composer của Sentinel
   EN: When Sentinel Gets Bored, It Hums: Inside the Composer
   tags: sentinel, music-sensor, systems

All six were created through savePost(); no direct post-table shortcut was used.
All new posts are non-highlighted so the owner-approved public highlight cap remains exactly 2.
## New governed tags

Created through Writing Tag Registry:
- micro-brain
- sentinel
- music-sensor
- learning-system

Registry-owned colors remain editable centrally in /control/content/tags.

## Playwright cover imagery

Real product/demo UI was captured at 2560x1440:
- public/media/writing/mb-understand-first-2560x1440.png
- public/media/writing/mb-retrieval-governance-2560x1440.png
- public/media/writing/sentinel-project-2560x1440.png
- public/media/writing/sentinel-stack-2560x1440.png
- public/media/writing/sentinel-music-loop-2560x1440.png
- public/media/writing/sentinel-music-composer-2560x1440.png

All six covers are byte-distinct and publicly return HTTP 200.
## Music Sensor facts used in the series

- two evidence paths: Semantic Ear + Acoustic Organ
- Music Cortex fuses the two without collapsing their evidence identity
- current K2 authored graph: 2,587 concepts / 3,104 relations
- heard melody is not stored or replayed by public humming
- afterglow carries only abstract musical features and decays toward calm defaults
- composer creates 2–4 bar question/answer phrases with motif → variation → tonic resolution
- voices: hum / whistle / soft-synth / breath
- personality memory learns decaying preferences for modes, voices, intervals, cadence and swing
- generated score is real structured note data and is playable via browser Web Audio
- monthly per-sketch JSON sketchbook remains separate from persistent personality memory

## Verification

- 6 new published posts
- 6 create revisions
- 6 create audit records
- 6 cover assets resolve
- 4 new governed tags resolve
- total highlighted posts remains exactly 2
- all six article routes HTTP 200
- /writing HTTP 200
- /home-demo HTTP 200
- cover media HTTP 200
