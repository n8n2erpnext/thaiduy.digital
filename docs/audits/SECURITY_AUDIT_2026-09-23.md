# Security Audit — 2026-09-23

Branch: `chore/repo-audit-cleanup-2026-09-23`

## Scope

Security-focused pass after the repository cleanup. Reviewed:

- tracked/untracked secret handling and client-bundle leakage
- authentication and signup paths
- browser-session mutation CSRF/origin protection
- security response headers and framework fingerprinting
- public API data projection
- HTML sanitization / XSS sinks
- outbound fetch / SSRF surfaces
- command execution primitives
- pairing and public-write abuse controls
- dependency audit

## Changes applied

### HTTP hardening

Global response headers now include:

- `Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Strict-Transport-Security: max-age=31536000`

Next.js `X-Powered-By` is disabled.

Production-build verification on a temporary `next start` instance confirmed the
headers and 200 responses for `/`, `/discuss`, `/stack`, and
`/control/login`.

### Authentication

Public email/password signup is now disabled. Email/password login remains
available for the existing owner fallback account, and the owner can set/change
that password only from the authenticated Control account page.

Google social account creation remains enabled for Discuss users.

### CSRF / browser mutation origin checks

A shared `requestOriginAllowed()` guard now rejects cross-site browser requests
before session processing for authenticated mutation surfaces:

- account profile edit
- own Discuss edit/delete
- Discuss topic/reply/reaction writes
- Writing comments/likes
- Control asset and Unsplash routes

The guard rejects `Sec-Fetch-Site: cross-site` and mismatched `Origin` while
still allowing non-browser clients that legitimately omit those headers.

Behavior verification:

- cross-site mutation => 403
- same-origin mutation without a session => 401

### Pairing brute-force protection

`/api/hub/pair` now uses a Redis-backed rate limit of 30 attempts per IP per
300 seconds, matching the pairing-code TTL. Client IPs are SHA-256 hashed before
being used in Redis keys.

Verified behavior:

- attempts 1–30 with an invalid code => 401
- attempt 31 => 429

The pairing code remains one-time via Redis `GETDEL`; issued device tokens remain
256-bit random values stored only as hashes.

### Public write / abuse limits

Analytics collection now has a best-effort Redis rate limit of 180 events per
minute per IP, with fail-open behavior if Redis is unavailable so analytics
cannot break the site.

Contact form rate limiting was upgraded from process-local memory only to
Redis-backed 5 requests/hour/IP with memory fallback. Redis keys contain hashed
IP identifiers, not raw IP addresses. 429 responses provide `Retry-After`.

Both rate-limit paths were verified with temporary Redis fixtures and the
fixtures were deleted after testing.

### Secret/config hygiene

- tracked-file secret-pattern scan: clean
- configured secret values in `.next/static`: clean
- configured secret values in home HTML: clean
- no `NEXT_PUBLIC_*` secret/config exposure found
- no `process.env` use in client components found
- `.env.local` remains untracked and mode 600
- legacy `unsplash.txt` secret file was migrated into `.env.local` and removed
- Unsplash code is now environment-only for its access key
- a dedicated `CONTACT_FORM_SECRET` was generated locally so contact challenge
  HMAC no longer needs to share the Better Auth secret

No secret values are stored in this document or committed to Git.

### SSRF / external fetch review

Outbound fetches were reviewed. User-controlled URLs are not fetched.

The Unsplash download-event URL returned by the upstream API is now explicitly
restricted to HTTPS on `api.unsplash.com` before server-side fetch.

Other outbound destinations are fixed or server-configuration values (GitHub,
Last.fm, Discord webhook).

### XSS / command execution review

Writing HTML is sanitized before persistence/rendering. Discuss rich text is
sanitized and mention spans are canonicalized before persistence.

Reviewed `dangerouslySetInnerHTML` sinks are backed by sanitized content or
generated/static markup.

Server command execution uses `execFile` with a fixed Python binary and
argument arrays; no shell interpolation of request input was found.

### Public runtime projection

Public API payloads for:

- `/api/music/state`
- `/api/stack/live`
- `/api/stack/organism`

were scanned and contained no RFC1918/loopback addresses, private home paths,
or credential-shaped tokens.

No wildcard CORS headers, request-driven filesystem paths, or user-controlled
open redirects were found.

## Dependency audit

`drizzle-kit` was updated from 0.31.10 to 0.31.11.

`bun audit` still reports one moderate advisory through the dev-only chain:

`drizzle-kit -> @esbuild-kit/esm-loader -> esbuild 0.18.20`

The latest compatible `drizzle-kit` still carries that legacy dependency.
It is development tooling and is not part of the website runtime. Do not expose
Drizzle Kit's development server/studio to untrusted networks. No forced
transitive override was applied because that could break the migration CLI.

## Final validation

- `bun run audit:repo` — PASS
- TypeScript — PASS
- ESLint — 0 errors; 22 existing `no-img-element` warnings only
- layout/theme/typography/music-expression audits — PASS
- typography — 0 violations
- `bun run build` — PASS, 55 static pages generated
- `git diff --check` — PASS
- production `next start` security-header check — PASS
- tracked secret scan — PASS
- client static secret-value scan — PASS

## Result

No critical or high-severity application finding was identified in this pass.
The actionable application/configuration findings above were hardened. The
remaining dependency advisory is limited to development tooling and documented
for future upstream removal.
