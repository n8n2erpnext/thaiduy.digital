# CV checkpoint — pre utility rail

Created: 2026-09-20
Branch: main
HEAD at checkpoint: adae83de

This checkpoint preserves the /cv UI state immediately before replacing the
horizontal sticky Ready-to-print toolbar with a right-side document utility rail.

## Frozen visual state

- Horizontal sticky toolbar above the A4 document.
- Toolbar contains Ready to print, Document ID, Copy ID, Verify, Print, Save PDF.
- A4 sheets use the heavier floating shadow.
- Snapshot issuance, verification, print/PDF, Document ID and SHA-256 logic are unchanged.
- Worktree was already intentionally dirty. DO NOT use git reset, git clean,
  or blanket checkout to restore this checkpoint.

## Files

- cv-actions.tsx -> src/components/cv/cv-actions.tsx
- cv-document.tsx -> src/components/cv/cv-document.tsx
- cv-page.tsx -> src/app/cv/page.tsx
- cv-document-id-page.tsx -> src/app/cv/document/[id]/page.tsx
- globals.css -> src/app/globals.css

## Targeted rollback

Copy only the files above back to their destinations. This restores the exact
CV presentation checkpoint without touching unrelated dirty worktree changes.

Commands:
cp docs/checkpoints/2026-09-20-cv-pre-utility-rail/cv-actions.tsx src/components/cv/cv-actions.tsx
cp docs/checkpoints/2026-09-20-cv-pre-utility-rail/cv-document.tsx src/components/cv/cv-document.tsx
cp docs/checkpoints/2026-09-20-cv-pre-utility-rail/cv-page.tsx src/app/cv/page.tsx
cp docs/checkpoints/2026-09-20-cv-pre-utility-rail/cv-document-id-page.tsx src/app/cv/document/[id]/page.tsx
cp docs/checkpoints/2026-09-20-cv-pre-utility-rail/globals.css src/app/globals.css

## Dependency rollback note

After this checkpoint the redesign added qrcode and @types/qrcode so the verification QR can be generated locally/server-side without an external QR service. The pre-change package.json and bun.lock from this checkpoint are also preserved here. Restore them together with the CV files for a full rollback.
