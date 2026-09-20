# Writing Style Contract

This file defines the default editorial voice for public Writing on thaiduy.digital.

## Core voice

Writing should sound like a normal person who actually built the thing being discussed.

For Vietnamese:

- Prefer natural spoken-written Vietnamese over translated technical prose.
- Write the way a thoughtful engineer would explain something to another person over coffee.
- Use "tôi", "mình", "người dùng" naturally when it helps the story.
- Keep sentences short to medium. Long sentences are fine only when they genuinely need the rhythm.
- Technical terms may remain in English when that is the language people in the field normally use: runtime, grain, PTY, query, source, policy, session, target, lineage, etc.
- Explain a technical term through an example before trying to define it formally.
- Use concrete situations, bugs, trade-offs and decisions. Avoid abstract product-speak.
- It is okay to admit uncertainty, a wrong turn, or a design decision that changed.

## Avoid

Do not default to documentation language such as:

- "Hệ thống cho phép người dùng..."
- "Giải pháp này cung cấp khả năng..."
- "Kiến trúc được thiết kế nhằm..."
- "Trong bối cảnh..."
- "Có thể thấy rằng..."
- "Nhằm tối ưu hóa..."
- "Tận dụng sức mạnh của..."
- "một cách liền mạch"
- "đột phá", "toàn diện", "mạnh mẽ", "tiên tiến" unless the sentence proves the claim.

Do not turn every paragraph into a specification.
Do not use headings for every small thought.
Do not overload a post with acronyms just because the codebase contains them.
Do not translate English technical phrases word-for-word when the Vietnamese result sounds unnatural.

## Preferred post rhythm

A good technical blog post usually follows this rhythm:

1. Start from a real problem, observation or mistake.
2. Explain why the obvious solution was not enough.
3. Show the design decision that followed.
4. Use one or two concrete examples from real code/runtime behavior.
5. Explain the trade-off in plain language.
6. Close with what changed in the way the author thinks about the problem.

This is a guideline, not a mandatory template.

## Headings

Headings should read like natural thoughts, not document sections.

Good:
- "Biểu đồ là phần dễ nhất"
- "Rồi shell không còn đủ"
- "Cùng tên không có nghĩa là cùng một thực thể"
- "Quyền từ chối cuối cùng vẫn ở máy"

Avoid:
- "Tổng quan kiến trúc"
- "Mô tả giải pháp"
- "Các chức năng chính"
- "Kết luận và định hướng tương lai"

unless the article is intentionally a formal technical note.

## Evidence and technical accuracy

Public blog tone can be casual; factual claims still need to match the real product.

Before writing about LightBI, Light Remote, Sentinel or infrastructure:

- read the current docs and relevant code first;
- prefer current runtime/code truth over old handoffs;
- do not turn an experiment or planned capability into a shipped feature;
- distinguish a product rule from a temporary implementation;
- never publish secrets, reviewer credentials, internal tokens, private keys or sensitive host details.

## Images

Prefer real product imagery.

Default order:
1. Playwright screenshot from the actual public/demo UI.
2. Real exported chart/report/diagram from the product.
3. Purpose-built diagram based on current architecture.
4. Stock/generated imagery only when the article is conceptual and real product imagery would not help.

For UI screenshots:
- use high-resolution capture, normally 2560×1440 or higher;
- avoid exposing credentials, private account data or internal-only identifiers;
- use a view that supports the article, not a random homepage screenshot.

## English version

The English version should be rewritten naturally, not mechanically translated sentence by sentence.

It may be shorter than the Vietnamese version if that reads better.
Keep the same facts and intent, but use normal technical-blog English.

## Editorial rule of thumb

If a paragraph sounds like it belongs in an architecture handoff, rewrite it once for a human reader.

If a paragraph sounds like marketing copy, remove the adjective and show the evidence instead.
