# NoddyTales Changelog

Semantic versioning: `MAJOR.MINOR.PATCH`. Every shipped version is tagged here so the in-app version badge stays meaningful.

---

## v1.11.0 — 2026-05-15
**Bigger word library + always-on silliness (no toggle required)**
- All 7 kid-tier word pools expanded 12 → 18 options. New picks include:
  - **pet:** octopus, hedgehog, axolotl, llama, sloth, koala
  - **color:** tomato red, lemon yellow, watermelon pink, mint green, sunset orange, midnight blue
  - **food:** spaghetti, popcorn, hot dogs, pancakes, cupcakes, french fries
  - **place:** treehouse, lighthouse, carnival, aquarium, planetarium, bakery
  - **creature:** vampire, fairy, dinosaur, detective, time traveler, royal jester
  - **move:** shimmied, wobbled, marched, stomped, danced, sprinted
  - **mood:** cozy, suspiciously polite, professionally confused, ridiculously cheerful, sleepy, jubilant
- New SILLY_THINGS auto-inject pool — every kid story now drops a random absurd object as a parenthetical aside ("a sock with strong opinions", "a slightly haunted spoon", "a tiny philosophical mushroom", etc.). Stories stay silly even when Extra Silly mode is OFF.
- SOUND_PG expanded 12 → 18 (added POOF, ZINK, PLOP, YIKES, BANG, WHEE) so the same SPLAT/BOING doesn't repeat as often.
- Fixed emoji duplicate in kid/food: grilled cheese 🧀 → 🥪 (was duplicating nachos 🧀).

---

## v1.10.0 — 2026-05-15
**Sidekicks: friends and siblings in the story**
- New welcome step after age: "Anyone you want in the story?"
- Add up to 3 names (chips with × to remove); persisted in `localStorage` so you don't re-type each session
- One random sidekick per story gets a cameo line — different sidekick each generation, so over multiple stories everyone shows up
- 8 cameo variants for variety ("Also there: Sam, obviously.", "showed up uninvited. Nobody minded.", etc.)

---

## v1.9.1 — 2026-05-15
**Emoji/word audit — 14 mismatches fixed**
- **Critical:** churros 🥐 (croissant) → burritos 🌯; bounce ⚡ → 🏀; flop 🌊 → 🐟; firefly 🌟 → bee 🐝; marshmallows 🍡 (dango) → candy 🍬; canyon ⛰️ (mountain) → 🏞️; skip 🌈 → march 🥁
- **Duplicates:** sandbox 🏖️ (duplicated beach) → 🪣
- **Consistency:** gold/silver across 3 tiers now use 🥇 🥈 instead of generic stars/sparkles

---

## v1.9.0 — 2026-05-15
**Potty toggle now visible in selection + content punch-up**
- Potty mode ON adds two new picker rounds: pick a body word (FART vs BUTT, etc.) and pick a chaotic sound (KAFOOM vs SCHPLAT, etc.). Toggle has real visible effect on the flow.
- 12 hot body × 12 hot sound options with emoji pairings, drawn from `BODY_HOT_OPTS` / `SOUND_HOT_OPTS`
- All 8 kid templates rewritten with punchier rhythm: shorter sentences, more dialogue, CAPS for emphasis, FW word used 2-3× as a real callback, sharper closers
- Killed the `""STABBY-STAB!"!"` double-quote bug structurally (templates own the punctuation, not the variable)
- Kid freetext pool expanded 10 → 16 prompts

---

## v1.8.0 — 2026-05-15
**Kid-tier content overhaul + potty mode toggle**
- All 8 kid templates rewritten with P1→P6 structure (setup → active child → escalation → body-humor beat → callback → big payoff)
- New BODY pool (12 PG: toot, burp, wedgie, hiccup, etc.) and SOUND pool (12: SPLAT, BOING, KERPLUNK, etc.) auto-injected into every story
- HOT pools (fart, poop, butt, PFFFFART, FAAAARP) when potty toggle is on
- Fixed kid MOV grammar (gerunds → past tense): "They tiptoeing" → "They tiptoed"
- Added `fixArticles()` — auto-corrects "a [c:otter]" → "an [c:otter]" across all 5 tiers
- Plural-food handling restructured ("a tacos" → "some tacos")

---

## v1.7.1 — 2026-05-14
**Narrator speaks "The End" + warmer voice settings**
- Appended "The End." to TTS text with paragraph-break pause — narrator now closes every story aloud
- Extended `wrapStoryWords()` so karaoke covers `.story-end` ("The" and "End" illuminate as spoken)
- Voice settings tuned: stability 0.72 → 0.80, similarity 0.85 → 0.90, style 0.40 → 0.20 (steadier, warmer)

---

## v1.7.0 — 2026-05-14
**Karaoke word highlighting synced to TTS playback**
- `wrapStoryWords()` walks the DOM after speak starts, wraps every word in `<span class="kw" data-wi="N">`
- Proportional timing weighted by character count across full audio duration
- `requestAnimationFrame` loop advances the highlighted word based on `audio.currentTime`
- Works with the existing ElevenLabs audio + IndexedDB cache — zero API changes

---

## v1.6.1 — 2026-05-14
**Silliness punch-up + longer little-tier stories**
- Tot tier: 4 → 5 paragraphs, more absurd humor
- Little tier: 5 → 7 paragraphs, bigger silly
- Replaced 4 atmospheric big/tween templates that read too earnest

---

## v1.6.0 — 2026-05-14
**Story templates 3 → 8 per tier (25 new templates) + content library expansion**
- WORD_BANK expanded 6 → 12 options per category
- FREE_TEXT_ROUNDS doubled for kid/big/tween
- Emoji bug fixes (axolotl, gecko/chameleon duplicate)
- 185 unique titles across 250 random generations verified

---

## v1.5.0 — 2026-05-13
**ElevenLabs TTS narrator with IndexedDB cache**
- Replaced Web Speech API with ElevenLabs `eleven_turbo_v2_5` via Vercel serverless proxy (`api/tts.js`)
- Voice: George (JBFqnCBsd6RMkjVDRZzb) — warm British male
- Audio cached in IndexedDB keyed by SHA-256 hash of full story text
- Silent fallback on API failure; Vercel Analytics added
