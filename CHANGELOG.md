# NoddyTales Changelog

Semantic versioning: `MAJOR.MINOR.PATCH`. Every shipped version is tagged here so the in-app version badge stays meaningful.

---

## v1.14.1 — 2026-05-15
**Grammar hardening pass — Codex re-review fixes**

Codex's re-verification of v1.13.0 caught three real bugs the prior pass introduced or missed. All three structurally fixed now.

**Verb tense contract (was: "loved to hopped", "started to clapped")**
v1.11.2 converted tot/little move pools to past tense, but three templates use those verbs in base-verb contexts ("loved to X", "started to X", "learned how to X"). Added a small `VERB_FORMS` lookup table covering all 55 move-pool entries (past → base + gerund) and new `MOV_BASE` / `MOV_GERUND` derived alongside `MOV` in buildStory. Templates needing the right form use `[c:${MOV_BASE}]` / `[c:${MOV_GERUND}]` instead of `[c:${MOV}]`.

**Gerund contract (was: "set off cartwheeled into the basement")**
One tween template uses "set off [MOV]" which requires gerund form. Now uses `MOV_GERUND` ("set off speed-running" instead of "set off speed-ran").

**Adjective + plural article (was: "an electric blue tacos")**
v1.13.0's `fixArticles` only inspected the FIRST token after the article, so `a [c:electric blue] [c:tacos]` saw "electric blue", checked vowel only, became "an electric blue tacos". Single regex pass now matches the entire noun phrase (article + one-or-more contiguous tokens), looks at the LAST token for plural detection and the FIRST token for vowel detection. Plural overrides vowel since "some" works regardless of following sound. Added `NOT_PLURAL_RE` to skip singular -s/-us/-ous false positives (octopus, mysterious, the back of the bus, bonkers).

Verified across 1000 randomly-picked stories per tier and explicit unit tests: 0 occurrences of any flagged pattern.

---

## v1.14.0 — 2026-05-15
**Karaoke that actually karaokes**

The word-by-word highlighting was technically built in v1.7.0 but two real problems hid it:

1. **Visual was too subtle.** A soft yellow tint on cream paper — easy to miss. Now the active word pops with a saturated orange background, bold white text, a drop shadow, and a quick bounce animation as the highlight moves between words.
2. **Timing was approximate.** v1.7.0 used proportional char-count estimation against `audio.duration`. Drift accumulated through 30-second stories.

**Switched to ElevenLabs' `/with-timestamps` endpoint** which returns real character-level start/end times alongside the audio. Word timings are now exact, not estimated:

- `api/tts.js` calls `/text-to-speech/{voice}/with-timestamps`, returns JSON `{audioBase64, alignment}`
- `TTSManager` parses JSON, decodes base64 to a Blob, and stores `{audio, alignment}` together in IndexedDB
- New `buildAlignmentTimings()` walks the TTS text and maps each word to its exact start/end seconds using the alignment data
- Falls back to proportional estimation if alignment is missing (legacy cache, API error)

**IndexedDB schema bumped v1 → v2.** New store `audio-v2` holds combined `{audio, alignment}` per story-hash. The old `audio-cache` store with bare blobs is left orphaned (no migration needed — users get one cache miss after deploy, then everything's fast).

Trade-off accepted: response payload is ~33% larger because base64 audio. Worth it for sync that doesn't drift.

---

## v1.13.0 — 2026-05-15
**Tier-aware engine touches — Codex review polish pass**

The aside injection system was kid-only and pulled from one bank. Every tier now has its own joke logic, per Codex recommendation #12:

- **Tot:** gentle repetition (`Boop!`, `Heehee.`, `Everybody blinked twice.`, `Even the sun smiled.`)
- **Little:** tiny-world whimsy (`Nobody knew why!`, `The wind agreed politely.`, `A small flower nodded along.`)
- **Kid:** Mad Libs token mix (object / number / liquid / job / adverb asides — keeps the v1.12.0 lift)
- **Big:** bureaucratic mock-serious (`A stamp appeared. Nobody had requested one.`, `The hallway filed a complaint.`, `There was a form for this, which made it worse.`)
- **Tween:** deadpan internet-voice (`Nobody had asked.`, `The vending machine had feedback. None of it constructive.`, `Iconic.`)

**Sidekick frequency 100% → 60%.** Codex flagged that always-on cameos felt grafted. Now ~60% of stories include a sibling/friend, so when they appear it feels earned.

**Smart plural-article handling.** `fixArticles` now runs a second pass: any `a [plural]` or `A [plural]` (detected by `-s` ending, excluding mass nouns like cheese/juice/broth) converts to `some [plural]` or `Some [plural]`. Kills "a tacos" / "a pretzels" / "a donuts" structurally.

**Kid creature pool cleanup.** Per Codex #3, `detective`, `time traveler`, `royal jester` are roles not creatures. Replaced with `phoenix`, `centaur`, `banshee`.

DEFERRED (still queued for v2.0): rich word objects, beat cards, callback motif tracking, plural/count metadata on every pool entry.

---

## v1.12.0 — 2026-05-15
**Mad Libs comedy categories — Codex peer-review recommendations (top 5)**

Per Codex's peer review, the highest-leverage Mad Libs categories added as auto-injected pools (no UI changes — story content gets richer automatically):

- **OBJECTS** — 12 absurd objects: clipboard, suspicious envelope, tiny key, noisy spoon, haunted lunchbox, emergency kazoo, apology balloon, dramatic cape, pocket-sized door, glittery helmet, sleepy megaphone, map covered in crumbs
- **ADVERBS** — 12 comedic modifiers: suspiciously, sideways, with great confidence, for unclear reasons, professionally, accidentally on purpose, extremely slowly, in a hurry, backwards, politely but firmly, with concerning enthusiasm, somehow
- **NUMBERS** — 12 oddly-specific numbers: seventeen, twenty-three, eleventy-eight, one and a half, exactly forty-two, nine plus three, too many, a small but specific number of, three (allegedly), eight thousand, a polite handful of, six (rude)
- **LIQUIDS** — 12 absurd liquids: pickle juice, moon milk, glitter lemonade, warm soup, rainbow water, questionable broth, extremely loud orange juice, emergency apple juice, haunted iced tea, formally polite hot chocolate, thunder soda, a single tear
- **JOBS** — 12 fake titles: official puddle inspector, assistant cloud dentist, sandwich lawyer, emergency hat consultant, junior moon accountant, certified dragon whisperer, substitute wizard, snack detective, hallway mayor, professional button counter, royal nap supervisor, chief sock investigator

**Two new kid templates** showcase the lift:
- **#9 The Wrong [Liquid] Delivery** — Cole has to deliver N jars of X to a fake-job-holder. Uses NUM, LIQ, JOB, OBJ, ADV tokens prominently.
- **#10 [Name] Becomes a [Job] by Accident** — Cole gets accidentally promoted into a job they don't have. Same token set.

**Existing templates** auto-inject the new pools via the enriched aside bank — 7 aside variants now draw from SILLY_THINGS, OBJECTS, NUMBERS, LIQUIDS, JOBS, and ADVERBS so every kid story surfaces the new vocabulary somewhere.

Sample from v1.12.0:
> *"Riley had ONE job: deliver three (allegedly) jars of questionable broth to a hallway mayor."*
> *"eight thousand uniforms appeared. So did a sleepy megaphone."*

---

## v1.11.2 — 2026-05-15
**Bug pass from Codex peer review**
- Fixed literal `[PET]` token in little tier "Pet That Forgot Everything" template — was rendering raw markup instead of substituting.
- Fixed `trimToLimit` regression from v1.11.1: was cutting load-bearing climax paragraphs. New formula keeps first 2 (setup) + last (limit−2) so payoff/resolution/closer all survive.
- Stripped pre-articles from tween creature pool: `the algorithm` → `algorithm`, `a very confident rat` → `very confident rat`. Killed the "The the algorithm" / "A a very confident rat" doubling.
- Past-tense fix for tot + little move pools (24 entries): "they hop home" → "they hopped home". Same fix that landed for kid in v1.8.0; was missed on the smaller-tier pools.
- Removed non-verb-phrases from big move pool: `stood dramatically still` → `spun ceremoniously`, `paused for effect` → `shuffled importantly`.
- Replaced broken tween moves: `immediately regretted` (transitive, needs object) → `gracefully bailed`. `said nothing and left` (full sentence) → `reluctantly arrived`.
- Removed body parts from BODY_PG: `armpit`, `belly button` (don't work as "did a loud X" events) → `yawn`, `sniffle`.
- Replaced `famously wrong recipe` in big food (not actually a food) → `extremely bold lasagna`.

---

## v1.11.1 — 2026-05-15
**Shorter stories across all tiers**
- v1.11.0 additions (silly thing + sidekick asides) had pushed average story length up. Bedtime target is 30–45 seconds of TTS — most tiers were running 60+ seconds.
- New per-tier paragraph cap (`PARAGRAPH_LIMIT`): tot 5 / little 5 / kid 5 / big 6 / tween 6. Long templates auto-trim to keep opening (setup) and final (closer), clipping middle paragraphs.
- All 8 kid templates rewritten with tighter prose — sentences shorter, redundant phrasing dropped.
- Silly-thing and sidekick asides shortened to one-clause form (e.g. `(Plus Sam.)`, `(Nearby: a sock with opinions.)` instead of two-sentence cameos).
- Result: little **−29%** (145 → 103 words), kid **−16%** (135 → 114), big **−31%** (180 → 124), tween **−24%** (160 → 121). Tot unchanged (already short).

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
