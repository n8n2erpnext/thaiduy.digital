# thaiduy.digital

Living Systems Lab: a Next.js control surface for public content, runtime state, music semantics,
traffic, assets, and infrastructure topology.

## Runtime architecture

- Next.js 16 App Router.
- PostgreSQL stores durable control-plane state.
- Redis stores live signals, Stack discovery snapshots, and short-lived runtime state.
- R2/S3-compatible storage serves managed assets.
- Better Auth protects the owner control surface.
- Public runtime data is always projected/sanitized before it leaves the control plane.

The public Stack uses one canonical renderer: **House → Room → Object**.
## Stack discovery boundary

The web process never needs Docker or LXD privileges.

Host-side flow:

```text
Docker / LXD on host
        |
scripts/stack-refresh.ts
        |
private + sanitized Redis snapshots
        |
web runtime
        |
runtime diff/history -> /stack
```

`/control/stack` exposes **GET STATUS**. The button only writes a refresh request to Redis.
A host user-timer checks that request once per minute and runs discovery only when requested.
A second timer performs a safety refresh every two hours.
Install or refresh the host timers with:

```bash
bun run stack:units:install
```

A failed Docker/LXD command never replaces the last good snapshot with an empty graph.
A successful `docker compose down` or new container changes the next snapshot, producing real
`node.removed` / `node.added` runtime events.

## Development

```bash
bun install --frozen-lockfile
bun dev
```

The development server may run directly on the host. Stack pages still consume the Redis snapshot
by default; use `STACK_DISCOVERY_MODE=direct` only for deliberate local debugging.
## Bootstrap data

Seed commands are idempotent upserts:

```bash
bun run seed:public
bun run seed:organism
bun run seed:runtime
```

They update existing managed rows instead of silently leaving stale bootstrap content behind.

## Music

The web Music Cortex remains active through semantic/Last.fm state and Redis live signals.
The Android Hub input source is intentionally **paused**. Android work is not a blocker for the
web/runtime closeout and should not be resumed implicitly.
## Primary routes

- `/` — living public surface.
- `/stack` — canonical live Stack House → Room → Object.
- `/control` — owner control plane.
- `/control/stack` — private Stack status and host refresh request.
- `/api/stack/live` — sanitized current/historical Stack graph.
- `/api/music/state` and `/api/music/stream` — governed music state.

## Verification before release

```bash
bunx tsc --noEmit
bun run lint
git diff --check
bun run build
```

Do not commit `.env.local`, backend data, generated build output, or Android build artifacts.
