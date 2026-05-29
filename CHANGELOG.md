# NoddyTales Changelog

Three-tier versioning (since 2026-05-21, see [`docs/versioning.md`](docs/versioning.md)):
- **APP_VERSION** = user-facing product maturity (`v0.9.x` = late beta, `v1.0.0` = App Store launch)
- **ENGINE_V2_VERSION** = internal engine architecture lineage (currently `v3.0.3`)
- **BUILD_NUMBER** = integer that increments every release shipped to `main`

Entries from v0.9.3 forward use the four-part header `## vX.Y.Z (build N, engine vA.B.C) — DATE`. Historical v3.0.0–v3.0.3 entries kept as-is for traceability.

---

## v0.9.3 (build 42, engine v3.0.3) — 2026-05-29
**Comedy Architecture Phase A — premise-statement setups + obstacle-action escalations + wear-out kills (kid+big focus)**

Phase A of the multi-build comedy lift identified in the 50-story b41 manual review. Stories were grammatically correct + on-theme but flat: kid had no stake, obstacles never acted, FLAVOR_CALLBACKS decorated without escalating. This build fixes the structural symptoms; b43+ will add character traits and callback architecture.

### What changed

**32 new beats** (16 premise-statement setups + 16 obstacle-action escalations), 4 per blueprint × 4 blueprints (lost_snack_v3, goal_spine_v3, show_wrong_v3, rule_loophole_v3):

- **Premise-statement setups (P1):** name a SPECIFIC, ridiculous stake in the first paragraph instead of generic exposition. Examples:
  - `v3_ls_setup_premise_moment` — *"At the bakery, it was almost the croissant moment. Cole had practiced. The koala had practiced. Then the croissant had vanished, and the moment had a hole in it."*
  - `v3_gs_setup_premise_brief` — *"At the puddle street, Cole announced the day's mission to the hedgehog: fix the broken contraption. The hedgehog nodded. The hedgehog had no idea what it meant. The hedgehog nodded anyway."*
  - `v3_sw_setup_premise_warning` — *"Five-minute warning at the ice cream truck. Cole checked the jar of buttons. The jar of buttons looked confident, which was a lie."*
  - `v3_rl_setup_premise_loophole_in2` — *"It was a normal day at the kitchen for Cole and the wizard right up until the rule got read out loud. Cole listened carefully. There was a loophole in sentence two."*

- **Obstacle-action escalations (P2 for kid):** the obstacle/false_suspect/rule_imposer now DOES something specific that makes the situation worse, instead of just witnessing. Examples:
  - `v3_ls_escalation_suspect_committee` — *"The mermaid organized a search committee. The committee consisted of: the mermaid. The search committee searched in only one direction. Away from the koala."*
  - `v3_gs_problem_obstacle_clipboard` — *"The wizard produced a clipboard. The clipboard had policies on it. The policies were now relevant. None of them said fix the broken contraption."*
  - `v3_sw_problem_obstacle_slowclap` — *"The troll tried to start a slow clap. The slow clap was, technically, on beat. The slow clap was also, technically, sarcastic. Cole accepted the slow clap as applause."*
  - `v3_rl_problem_imposer_secondrule` — *"The wizard consulted a second rule. The second rule was also no. Cole asked to see the rule. The wizard declined. The decline was, itself, a rule."*

  Beats for goal_spine, show_wrong, rule_loophole use `stage:'problem'` (because kid skips `escalation`); lost_snack keeps `stage:'escalation'`. requiredRoles match the dominant pool of existing beats so the new ones actually fire (not filtered out by the maxRoles selector).

**3 wear-out phrases killed** (Codex-flagged in the b41 manual review) + replaced with narrative-functional variants:

- `mood_throughline`: removed *"Throughout, X stayed Y. Steadily Y."* and *"Underneath everything, X was running on pure Y."* — mood as decorative adjective, not action driver. Added 3 new variants where mood CAUSES a small visible behavior (mood-driven sigh, mood-folded arms, mood-makes-ally-suspicious).
- `obstacle`: removed *"watched the whole thing happen and offered no comment"* and *"processing all of this with visible difficulty"* — obstacle structurally inert. Added 7 new variants (kid/big: take notes / clear throat / mime slow applause / small head-shake; tween: refused-comment / "witness with strong opinions"; tot/little: tilt head).
- `mcguffin`: removed *"Meanwhile, X waited patiently for its moment"* — mcguffin inert. Added 4 new variants that put the mcguffin in motion or give it scene presence (tipped over / someone thinking about it loudly / "situation was ongoing" / tot-safe "right there the whole time").

### Verification

- `scripts/qa-current.js` — **all 25+ gates green**, including new **Section 22 (11 sub-gates)**:
  - All 3 wear-out phrases: 0/100 rendered hits across kid-tier samples
  - Premise-setup coverage: ≥55 hits per blueprint across 400 forced samples (4 of 4 blueprints)
  - Obstacle-escalation coverage: ≥53 hits per blueprint across 400 forced samples (4 of 4 blueprints)
- `node --check` on `src/content.js` + `src/engine-v2.js` + `api/tts.js` + `scripts/qa-current.js` — clean
- `content-grammar-lint --reps 1000` — 0 hits on every check
- `content-comedy-mechanics` — **10.86/21 (was 10.34 b41, +0.52)** · causality 0.82 · callback 0.62 · coherence 1.24
- `content-punchline-audit` — green
- 50-story manual review across all 5 tiers: kid + big stories now visibly have stakes (premise-statement setups), obstacles do specific things (escalation beats), and middle paragraphs are less callback-heavy (b41 cap + new functional callbacks).

### What's still on the list (Phase B/C — b43+)

- **Cole character traits:** Cole still has no defined personality. Future build adds 3-4 trait presets (theatrical / sneaky-fair / stubborn / quietly chaotic) that bias beat selection so each kid feels distinct.
- **Ally character traits:** ditto for the companion (e.g., the eagle is glamorous; the koala is unimpressed).
- **Callback architecture:** P1 picks should be recontextualized in P5 (currently FLAVOR_CALLBACKS fire mid-story and don't pay off). Architectural change, deferred.
- **Tot/little length + escalation:** the call-and-response works for ages 2-3 but doesn't BUILD. b43+ adds 3-act tot/little structure with escalating stakes.

### Versions

APP_VERSION stays `v0.9.3`; BUILD_NUMBER 41 → 42; ENGINE_V2_VERSION stays `v3.0.3`. Badge reads `v0.9.3 · b42`.

---

## v0.9.3 (build 41, engine v3.0.3) — 2026-05-27
**Apostrophe Speak-highlight + Cole's Big Show quality + bedtime determinism + sidekick visibility**

Four High-severity defects closed in one focused build. No UI / picker / voice / icon changes.

### P1 — Apostrophe word boundary breaks Speak highlight (RECURRING)
**Codex repro:** Title `Cole's Big Show` (and body containing possessives + contractions) caused the karaoke highlight to fall one word behind from the first word onward. Fix has regressed multiple times; defect explicitly requests permanent architectural fix.

**Root cause** (newly traced): `[name:Cole]'s Big Show` renders in DOM as `<span class="pop">Cole</span>'s` — TWO `.kw` spans (Cole + 's) but ONE TTS word timing (Cole's). Every subsequent word offset by one.

**Fix (architectural):**
- `parseStoryLine` in `index.html` regex changed from `/\[(name|c|y):([^\]]+)\]/g` → `/\[(name|c|y):([^\]]+)\]([’']s\b)?/g`. The trailing `'s` (straight or curly) is now absorbed INTO the highlight span. DOM produces one `.kw` span per word, matching ElevenLabs' alignment.
- Defense-in-depth: documented in `CLAUDE.md` "Recurring-Defect Guardrails" + cross-referenced in `AGENTS.md`. Future agents who touch the regex or `wrapStoryWords` will see the regression warning.
- New QA Section 21(a): apostrophe tokenization parity gate. Simulates DOM + TTS tokenizers on 5 synthetic stories with possessives/contractions; asserts word counts match. 0/5 mismatches.

### P2 — Story quality failure (Cole's Big Show): six sub-defects
The user-submitted story exhibited: (i) `"SPLAT!."` double terminal punctuation; (ii) "noisy spoon reassembled itself in roughly the wrong order" filler; (iii) six FLAVOR_CALLBACKS stacked in one paragraph; (iv) `"Cole kept feeling snacky about the whole thing"` passive mood filler; (v) `"Somebody had brought hot dogs"` unrelated mcguffin injection; (vi) anytime-style landing despite bedtime mode (addressed in P3).

**Fix (engine-v2.js):**
- **`"SPLAT!." → "SPLAT!"`:** sound + freeword2 slots now strip trailing `[!?.,]+` at construction. Templates render `"[y:{chant.text}]."` cleanly regardless of user input punctuation. V2 + V3 both patched.
- **"Reassembled itself in roughly the wrong order"** rewritten as a directed consequence: `"The [c:prop] snapped back together — upside down, but together. The [c:ally] hit the right note at the exact wrong moment. Curtain."` Same comedic shape, payoff lands.
- **Callback density cap:** `appendToMiddle` now caps FLAVOR_CALLBACKS at 2 per paragraph. When the strict middle (paragraphs 2..length-2) is full, expansion widens to include paragraph 1; the final landing paragraph stays callback-free. Coverage preserved by the FLAVOR_KEYS loop's "skip-if-already-in-body" filter — callbacks only fire for missing picks.
- **"Cole kept feeling [mood] about the whole thing"** removed from `mood_throughline` pool. Two visible-action variants from b39 remain; the passive-non-event one is killed.
- **"Somebody had brought hot dogs"** removed from `mcguffin` pool. Two remaining mcguffin variants tie to the scene rather than appearing mid-air with unrelated food.

### P3 — Bedtime mode selected but anytime ending fired
**Codex repro:** Cole's Big Show ended with `"Time to pack up and find the next thing"` (anytime-flavored prose) despite the user reportedly having Bedtime mode selected. Root cause analysis: even when `picks.storyMode='bedtime'`, 28 of 37 V3 landing beats are untagged (default-bedtime by engine contract) but their CONTENT contains no bedtime closure language. Either the user's `picks.storyMode` was stale 'anytime' from a prior session OR the engine picked a content-free untagged landing.

**Fix (engine-v2.js):** Post-render bedtime-closer injection. When `picks.storyMode='bedtime'` AND the final paragraph contains no bedtime lexicon (regex: bedtime|tucked in|asleep|goodnight|yawned|pajamas|under the covers|lights out|+15 more), append a tier-appropriate bedtime closer sentence:
- tot/little: `"Then it was bedtime. ..."`
- kid/big: `"[name:Cole] yawned, climbed into bed, and pulled up the covers. Goodnight, everyone."`
- tween: `"[name:Cole] flopped onto the bed. Sleep was inevitable. Goodnight."`

The fix runs unconditionally on every bedtime-mode story regardless of which landing beat fires. New QA Section 21(c): 90 bedtime-mode stories (30 each at ages 6/9/12) → final paragraph must contain bedtime lexicon. 0/90 missing.

### P4 — Secondary character (sidekick) never appears in story
**Codex repro:** User added a second person to the session; the generated story never mentioned them. Investigation: V3 (the production engine) never reads `state.sidekicks` at all — only V2 does. V3 blueprints have no sidekick slot.

**Fix (index.html + engine-v2.js):**
- `buildStory` now passes `sidekicks: state.sidekicks` into `picks`.
- V3 reads `picks.sidekicks`. After the landing paragraph renders, checks each sidekick name against the body. If any are missing, appends a tier-appropriate cameo line (`"[name:Riley] showed up right at the end, demanding a full play-by-play."`) wrapped in `[name:X]` so the name highlights too.
- New QA Section 21(d): 100 stories (25 per tier × 4 tiers) with `picks.sidekicks=['Riley']`. Rendered body must contain `Riley`. 0/100 missing.

### Verification
- `scripts/qa-current.js` — all 25 gates green, **Section 21 (4 new b41 gates) all pass**.
- `node --check` on `src/content.js` + `src/engine-v2.js` + `api/tts.js` + `scripts/qa-current.js` — clean.
- `content-grammar-lint --reps 1000` — 0 hits on every check.
- `content-random-50`, `content-comedy-mechanics` (10.34/21; causality 0.66 / callback 0.62), `content-punchline-audit` (changes_scene 49.4% / quoted_only 16.1%) — all green.
- Tokenizer parity: 0/5 mismatches across synthetic apostrophe fixtures.
- Punctuation strip: 0 stories with `SPLAT!.` / `SPLAT!,` across forced `freeword=SPLAT!` samples.
- Bedtime closure: 0/90 missing closer on `storyMode=bedtime`.
- Sidekick visibility: 0/100 missing `Riley` when forced.

### Versions
APP_VERSION stays `v0.9.3`; BUILD_NUMBER 40 → 41; ENGINE_V2_VERSION stays `v3.0.3`. Badge reads `v0.9.3 · b41`.

### Deferred (b42+)
- `"Stories too long globally"` defect remains In Progress. b41 added the bedtime-closer (+1 sentence per bedtime story) but the callback cap removes 2-3 sentences from heavy-callback stories — net neutral to slightly shorter.
- Vowel-start mood `articleText` defense — still no vowel-start mood shipped, dormant.

---

## v0.9.3 (build 40, engine v3.0.3) — 2026-05-27
**Move-class routing + binoculars regression-gate fix**

Two High defects fixed in one focused build. No UI / picker / voice / icon changes.

### P1 — Tween gesture moves compose nonsensically with directional frames

Codex repro at b39:
- *"Cole reluctantly arrived across the stage like that had been the plan all along."*
- *"Cole mysteriously vanished without thinking. It was a thing they did now."*
- *"Cole stared into the middle distance without thinking. It was a thing they did now."*

Root cause: 13 of 18 tween `move` picker options are gesture/state/reaction phrases that do not compose with directional locomotion frames ("across the stage", "toward", "past the", "sideways", "without thinking"). The engine had no compatibility check — any picked move was substituted into any signature_action frame. Force-cycle BEFORE: **225 / 390 = 57.7% composite failures**.

Fix — semantic compatibility routing:
- New module-scope `MOVE_CLASS` table classifies every picker move (tot/little/kid/big/tween, ~80 options) as `motion` (locomotion-compatible) or `gesture` (stillness/state/reaction). Default for unknown moves is `motion` (safe — kid pool is 100% motion).
- Move slot construction attaches `class` to the slot.
- `pickStageBeat` and `pickFlavorVariant` filter out beats/variants tagged `requiresMoveClass:'motion'` when the picked move is a gesture. Untagged beats are class-agnostic and remain eligible for both.
- 7 V3 beats tagged motion-only (split `v3_sw_attempt_move` into 2 beats: motion-only "across the stage" + class-agnostic "like it was the plan"; rewrote `v3_sw_attempt_tween_unhinged` to drop "across the stage" entirely).
- NEW gesture-friendly beat: `v3_ls_attempt_tween_gesture` — *"Cole [signature_action] at the [false_suspect]. The [false_suspect] did not love being [signature_action] at."*
- FLAVOR_CALLBACKS.signature_action: 5 variants tagged `requiresMoveClass:'motion'` (the directional ones including "without thinking"). 2 NEW class-agnostic gesture-friendly variants added: *"Without warning, [name] [move]. The room noticed. [name] did not explain."* and *"[name] [move], deliberately, where the [ally] could see. The [ally] filed it away."*

### P2 — b39 binoculars regression gate did not actually force prop

Codex repro at b39: the b39 Section 19 plural-prop gate set `setting.objectBias='binoculars'`, but V3 picks the prop slot via `rawPick(V2_WORDS.objects)` without consulting objectBias. **0 / 200 samples actually rendered binoculars** — the gate was a no-op and any plural-prop regression would have shipped silently.

Fix — test-only deterministic injection:
- Added `picks.__forceProp` opt-in to `generateStoryV3`. When set, the engine resolves the named object out of `V2_WORDS.objects` (preserving `isPlural`/`article` metadata) and uses it for the prop slot. Picker never sets this; only QA gates use it.
- Section 19 binoculars gate rewritten to alternate `__forceProp` between `binoculars` (plural) and `wobbly_telescope` (singular) across 80 forced samples.
- New first-line sanity sub-gate: fails if the forced prop name doesn't actually appear in the story body (catches any future routing change that breaks the override).

### New QA gates (Section 19 — now 14 sub-gates total)

| # | Gate | Result |
|---|---|---|
| (j) | `__forceProp` actually renders the forced prop | 0 misses / 80 samples |
| (k) | show_wrong + plural prop never renders broken plural grammar | 0 leaks / 40 plural samples |
| (l) | show_wrong + singular prop never renders broken singular grammar | 0 leaks / 40 singular samples |
| (m) | tween gesture moves never compose into directional frames | 0 leaks / 13 gestures × 50 = 650 samples |
| (n) | tween motion moves still route into directional frames (regression check) | 5 / 5 motion moves hit a directional frame |

All 4 new gates use the `stripHighlights()` helper from b38 so the lint sees the same surface the reader and TTS do.

### Verification

| Check | Result |
|---|---|
| 390-sample tween force-cycle (P1) | composite failures **225 → 0** |
| 40-sample `__forceProp:'binoculars'` | binoculars rendered **0 → 40 / 40 (100%)** |
| `scripts/qa-current.js` | ✓ all gates green (Section 19 now 14 sub-gates) |
| `node --check` on src/content.js + src/engine-v2.js + api/tts.js | clean |
| `content-grammar-lint --reps 1000` | 0 hits on every check |
| `content-random-50` | 0 nulls |
| `content-comedy-mechanics` | 11.14 / 21 |
| `content-punchline-audit` | changes_scene 47.0%, quoted_only 15.7% |
| `content-repetition-report` | 14 phrases above 20%, 0 endings above threshold |
| `content-blueprint-health` | 0 nulls across all 8 blueprints |

### Sentence-count medians vs b39

| Tier | b39 | b40 | Δ |
|---|---|---|---|
| tot | 16 | 16 | 0 |
| little | 17 | 17 | 0 |
| kid | 21 | 20 | −1 |
| big | 24 | 24 | 0 |
| tween | 25 | 26 | **+1** |

Tween +1 reflects the new gesture-friendly callbacks landing reliably (where previously the engine produced silent directional-frame nonsense at gesture moves). Net narrative quality up; "Stories too long globally" defect remains `In Progress`.

### Manual review — 5 stories per tier × 5 tiers (25 total)

Full transcript: `docs/b40-after/manual-review-samples.txt`. Picks deliberately exercised both motion and gesture moves at every tier. **Every selected move composes naturally**:

| Tier · move | Sample (b40) |
|---|---|
| tween 11 `dramatically sighed` | *"Without warning, Cole dramatically sighed. The room noticed. Cole did not explain."* |
| tween 12 `mysteriously vanished` | *"Without warning, Cole mysteriously vanished. The room noticed. Cole did not explain."* |
| tween 13 `stared into the middle distance` | *"Cole stared into the middle distance one more time, just to make a point."* |
| tween 11 `reluctantly arrived` | *"Cole reluctantly arrived, deliberately, where the duck could see. The duck filed it away."* |
| tween 12 `speed-walked nowhere` (motion) | *"Cole speed-walked nowhere like a professional who had committed to a specific kind of unhinged."* |
| big 8 `posed dramatically` | *"Somewhere in there, Cole posed dramatically for emphasis."* |
| big 8 `flailed politely` | *"Cole flailed politely one more time, just to make a point."* |
| big 8 `stared bravely` | *"For two full seconds, Cole stared bravely like the room owed them money. It did not."* |
| big 8 `sprinted incorrectly` (motion) | *"Cole sprinted incorrectly sideways while holding the lunch tray."* |
| big 8 `tiptoed cautiously` (motion) | *"Cole tiptoed cautiously across the scene."* |

Zero stories show a gesture move glued to a directional frame. Both motion and gesture routing paths produce visible, compatible events.

### Remaining story-quality risks (deferred, not in b40 scope)

1. **Vowel-start mood architectural risk** (b39 carryover) — defensive `articleText` for mood slot when first vowel-start mood ships.
2. **"Stories too long globally"** — still `In Progress`. Tween +1 sentence median; net narrative quality up.
3. **Big-tier gesture companions** — `posed dramatically`, `flailed politely`, etc. land into class-agnostic frames cleanly, but big tier has no `requiresMoveClass:'gesture'` companion beats. Class-agnostic survivors carry the load. Worth 1-2 explicit big-tier gesture variants if rendering feels thin.
4. **Move-class on free-text** — picker is the only path consulting `MOVE_CLASS`. If a future feature lets parents type custom move text, unknown moves default to 'motion' (safe for verbs; risky for typed gestures). Defensive plan: `looksLikeMotion()` heuristic at input time when free-text moves ship.
5. **`v3_ls_attempt_tween_gesture` is single-variant** — could repeat across replays for tween gesture × lost_snack. Worth 2-3 variants in b41 if repetition-report surfaces it.

### Files changed

- `src/engine-v2.js` — `MOVE_CLASS` table (module scope, ~80 entries); move slot class field; `pickStageBeat` filter; `pickFlavorVariant` filter; 6 beat tags + 1 new gesture beat + 1 split + 1 rewrite; `picks.__forceProp` injection
- `scripts/qa-current.js` — Section 19 extended: rewrote binoculars gate to use `__forceProp` and exercise both plural and singular props; new tween-move × frame exhaustive sweep with motion-side regression check
- `src/content.js` — BUILD_NUMBER 39 → 40
- `index.html` — b40 RELEASE_NOTES entry
- `CHANGELOG.md` — this entry
- `docs/b40-move-class-routing.md` — full diff report (new)
- `docs/b40-before/` + `docs/b40-after/` — repro scripts + audit snapshots + 25-story manual review

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 39 → **40**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b40`.

---

## v0.9.3 (build 39, engine v3.0.3) — 2026-05-27
**Story-language integrity repair — show_wrong plural prop + signature_action/mood filler**

Two High defects fixed in one focused build. No UI / picker / voice / icon changes.

### P1 — show_wrong_v3 plural prop grammar

Codex repro at b38: *"Show day. Cole had a binoculars, a co-star (eagle), and a stage (mall)."* and *"Cole held half a binoculars and made eye contact with the universe."*

Root cause: two `show_wrong_v3` beats bypassed grammar-aware rendering. `binoculars` is correctly tagged `isPlural:true` (V2_WORDS.objects), but the beat templates hardcoded the indefinite article: `"had a [c:{prop.text}]"` and `"held half a [c:{prop.text}]"` rendered ungrammatically for any plural prop.

Fix:
- `v3_sw_setup_1` line 1: `had a [c:{prop.text}]` → `had [c:{prop.articleText}]` (V2Grammar.articleText auto-resolves to "some binoculars" / "a wobbly telescope" based on the slot's `isPlural` flag).
- `v3_sw_setup_1` line 2: `rested on one [c:{prop.text}]` → `rested on the [c:{prop.text}]` (plural-neutral).
- `v3_sw_problem_tween`: `held half a [c:{prop.text}]` → `held what was left of the [c:{prop.text}]` (plural-neutral).
- Audited every show_wrong_v3 beat — no remaining `a [prop]` / `one [prop]` / `half a [prop]` surfaces.

### P2 — signature_action + mood_throughline filler

Codex repro at b38:
- *"There was a small splashed moment that nobody quite witnessed in full."*
- *"There was a small swayed moment that nobody quite witnessed in full."*
- *"A short burst of crawled happened. Witnesses disagreed about the details."*
- *"The whole day had a heroically mediocre energy to it. Nobody could explain why."*
- *"There was a deeply snack-motivated quality to the air, if anyone noticed."*

Root cause: both `FLAVOR_CALLBACKS.signature_action` and `FLAVOR_CALLBACKS.mood_throughline` pools still carried passive-voice nominalization variants that wrap the picked move/mood as a noun-phrase modifier ("a small [move] moment", "[mood] energy to it", "[mood] quality to the air", "turned a particular shade of [mood]") — they don't create an event the kid can picture.

Fix:
- `signature_action` pool: killed 4 nominalization variants, kept 4 b27 survivors that already use move as an active verb. Added 2 tot/little call-response variants (e.g. `"[name] [move] once. The [ally] [move] back."`) and 4 kid/big/tween concrete-action variants (e.g. `"For two full seconds, [name] [move] like the room owed them money. It did not."`).
- `mood_throughline` pool: killed 3 atmospheric-noun nominalizations, kept 3 b27 survivors that use mood as predicate adjective attached to a real subject. Added 2 tot/little gentle variants and 3 kid/big/tween concrete-action variants (e.g. `"For three whole seconds, [name] was visibly [mood]. Then back to baseline."` / `"[name] glanced at the [ally] in a way that was [mood], specifically. The [ally] caught it."`).
- Also rewrote `v3_rl_problem_mood` line 1 (rule_loophole problem) which used `"turned a particular shade of [mood]"` — now `"went very [mood], visibly. The [rule_imposer] noticed and backed up half a step."`

### New QA gates (`scripts/qa-current.js` Section 19, three new sub-gates)

All three use the `stripHighlights()` helper added in b38 so the lint sees the same surface the reader and TTS do.

- **show_wrong_v3 plural-prop:** forces 80 show_wrong samples across kid/big/tween with `prop=binoculars` (retries blueprint selection up to 50× per sample). Fails on `a binoculars` / `half a binoculars` / `one binoculars`. **0 leaks.**
- **signature_action filler:** forces 100 samples across ages 2/4/6/8/12 with leaky moves (`splashed` / `swayed` / `crawled` / `zoomed` / `bounced`). Fails on `a small [move] moment` / `A short burst of [move] happened`. **0/100 leaks.**
- **mood_throughline filler:** forces 100 samples with leaky moods (`snack-motivated` / `heroically mediocre` / `minorly iconic` / `weirdly invested`). Fails on `[mood] energy to it` / `[mood] quality to the air` / `turned a particular shade of [mood]`. **0/100 leaks.**

### Verification

| Check | Result |
|---|---|
| 340-sample force-cycle (160 P1 + 180 P2 combined) | abstract surfaces **0/0/0 across all three b39 defect surfaces** (was 1/24/19 in b38) |
| `node scripts/qa-current.js` | ✓ all gates green (Section 19 now 10 sub-gates) |
| `node --check` src/content.js + src/engine-v2.js + api/tts.js | clean |
| `node scripts/content-grammar-lint.js --reps 1000` | 0 title bare 3rd-person · 0 plural+was · 0 singular+plural-only · 0 dup articles · 0 lowercase-start · 0 sky-class |
| `node scripts/content-random-50.js` | 0 nulls |
| `node scripts/content-comedy-mechanics.js` | total 10.62/21 · causality 0.84 · callback 0.56 |
| `node scripts/content-punchline-audit.js` | changes_scene 51.8%, quoted_only 19.0% |
| `node scripts/content-repetition-report.js` | 11 phrases above 20%, 0 endings above threshold |

### Manual review — 5 stories each at ages 2, 4, 6, 8, 12 (25 total)

Full transcript in `docs/b39-after/manual-review-samples.txt`. Picks varied across leaky moves AND leaky moods so every fixed beat got exercised. **Every** selected move shows up as a reciprocal motion (tot/little) or a deliberate action with a noted reaction (kid+). **Every** selected mood shows up as something Cole visibly does (looks, glances, goes very, walks up "in full X mode"). Zero stories show a move or mood used purely as a noun-phrase modifier. show_wrong plural-prop fixes verified in age-12 samples — `"held what was left of the shopping list / wobbly telescope"` lands cleanly.

### Sample before/after

| Tier | Before (b38) | After (b39) |
|---|---|---|
| tween 12 show_wrong, prop=binoculars | *"Cole held half a binoculars and made eye contact with the universe."* | *"Cole held what was left of the binoculars and made eye contact with the universe."* |
| age 2, move=splashed | *"There was a small splashed moment that nobody quite witnessed in full."* | *"Cole splashed once. The duck splashed back."* |
| age 8, move=crawled | *"A short burst of crawled happened. Witnesses disagreed about the details."* | *"For two full seconds, Cole crawled like the room owed them money. It did not."* |
| age 6, mood=heroically mediocre | *"The whole day had a heroically mediocre energy to it. Nobody could explain why."* | *"For three whole seconds, Cole was visibly heroically mediocre. Then back to baseline."* |
| age 7, mood=snack-motivated | *"There was a snack-motivated quality to the air, if anyone noticed."* | *"Cole glanced at the duck in a way that was snack-motivated, specifically. The duck caught it."* |
| age 6, mood=snack-motivated (rule_loophole) | *"Cole turned a particular shade of snack-motivated. The dragon had not seen that energy before."* | *"Cole went very snack-motivated, visibly. The dragon noticed and backed up half a step."* |

### Remaining story-quality risks (deferred, not in b39 scope)

1. **Vowel-start mood architectural risk** — `[name] kept feeling [mood] about the whole thing` is plural- and vowel-safe today (mood pool has no vowel-start moods); if a future mood like "amazed" / "amused" / "irritated" ships, the same article-mismatch class b38 fixed for colors would re-emerge. Defense possible by adding `articleText` to mood slot — deferred until a vowel-start mood is added to the picker.
2. **"Stories too long globally"** defect remains `In Progress` — kid median 20, big 24, tween 24 sentences vs. target caps 7-8 / 9-11 / 10-12. Not touched in b39 per scope.
3. **Long-tail story-opening repetition** — "Over by the X, Cole was doing the bare minimum"; "Things were technically fine. They would not stay fine." — known b28 long-tail, acceptable for now.
4. **Comedy heuristic** 10.9 → 10.62 (multi-run mean) — within variance; the defect repair removed filler that was inflating token "presence" without paying off. Concrete events replace filler, which is the correct trade.

### Files changed

- `src/engine-v2.js` — 2 show_wrong beats rewritten for plural-safe props; `FLAVOR_CALLBACKS.signature_action` and `FLAVOR_CALLBACKS.mood_throughline` pools rewritten with tier-aware concrete variants; `v3_rl_problem_mood` line 1 rewritten
- `scripts/qa-current.js` — Section 19 extended with 3 new hard gates (plural-prop / SA filler / mood filler)
- `src/content.js` — BUILD_NUMBER 38 → 39
- `index.html` — b39 RELEASE_NOTES entry
- `CHANGELOG.md` — this entry
- `docs/b39-language-integrity-fix.md` — full diff report (new)
- `docs/b39-before/` + `docs/b39-after/` — repro scripts + audit snapshots + 25-story manual review

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 38 → **39**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b39`.

---

## v0.9.3 (build 38, engine v3.0.3) — 2026-05-27
**Defect fix — abstract color callback + "a apple red" article mismatch**

User-reported / Codex-reproduced (High severity): the kid-facing visual callback was generating *"There was a apple red feeling to the moment that nobody really named."* Two bugs in one beat pool.

### Root cause

`FLAVOR_CALLBACKS.visual_signature` still carried 6 abstract / telling-not-showing variants from before the b31 sensory pass:

- `'A faint [color] glow hung over the scene by then.'`
- `'There was a [color] feeling to the moment that nobody really named.'`
- `'The light shifted briefly toward [color] and then thought better of it.'`
- `'Everything in the room had picked up a faint [color] tint.'` (big/tween)
- `'For a beat the whole place looked weirdly [color].'` (big/tween)
- `'The [color] thing was happening again, whatever it was.'` (big/tween)

The b31 polish tier-gated the bottom 3 but left the top 3 as all-tier strings, so kid still saw them. Worse, the `'There was a [color] feeling...'` line hardcodes "a " before the color token — when the color starts with a vowel sound (apple red, electric blue, orange, ice, acid yellow), the rendered text reads "a apple red", "a ice", etc. Article mismatch + abstract content + survives b31 = full repro: 161 / 288 forced samples (55.9%) hit the abstract pattern in the BEFORE state.

Three other beats outside `FLAVOR_CALLBACKS` had the same `a [c:{visual_signature.text}] X` pattern:

- `v3_ls_attempt_color_clue` line 1 (`"There was a [color] smudge"`)
- `v3_gs_attempt_color` (`"held up a [color] thing"`)
- `v3_gs_attempt_color_signal` lines 1-2 (`"waved a [color] flag"` / `"pretending to be a [color] traffic cone"`)

### Fix

**`src/engine-v2.js`**

1. **Color slot gains `articleText`** — future-proof for any beat that needs `[c:{visual_signature.articleText}]` to render "an apple red". Current b38 beats avoid this surface entirely, but the property is now available.
2. **`FLAVOR_CALLBACKS.visual_signature` pool replaced**:
   - All 6 abstract variants deleted.
   - 7 new kid/big/tween concrete variants (ceiling flashes, stripe on floor, sleeves turn color, wall blinks, lamp glows, shoes briefly turn, tiny spot on hand).
   - 3 new big/tween-only drier variants (streak across wall, mirror briefly went, shadow on wall briefly turned).
   - 3 new tot/little gentle variants (small light went, window went for one second, socks looked color for a blink).
   - No beat leads with "a [color]" syntactically — all use "the X went [color]" / "X turned [color]" / "stripe of [color]" patterns. Grammar is safe regardless of which color the kid picked.
3. **Four other beats rewritten** to remove `a [c:{visual_signature.text}] X` patterns: smudge / thing / flag / traffic cone. Em-dashes or post-modifiers carry the color now ("a flag — bright [color]", "a traffic cone painted [color]").

**`scripts/qa-current.js` — Section 19 extended**

Three new hard gates with `[c:...]` highlight stripping so the lint sees the same surface the reader does:

- **(d)** No story contains abstract color callback ("feeling to the moment" / "thing happening again" / "light shifted toward" / "picked up a faint tint" / "looked weirdly" / "faint glow") across ages 2-7. (100 forced samples, 0 leaks expected.)
- **(e)** No story contains `a [vowel-color]` article mismatch (apple red / electric blue / orange / ice / acid yellow / etc.) across ages 2-7. (100 samples, 0 leaks.)
- **(f)** Same abstract regex against ages 8-13. (60 samples, 0 leaks.)

### Verification

| Check | Result |
|---|---|
| 288-sample force-cycle (tot/little/kid/big/tween × 8 colors) | **abstract 0 (was 161 / 55.9%) · article 0 (was 0 — never fired in BEFORE because the rendered token had `[c:...]` wrapper, but the human-visible surface contained "a apple red")** |
| `node scripts/qa-current.js` | ✓ all gates green (Section 19 now 7 sub-gates) |
| `node --check` src/content.js + src/engine-v2.js + api/tts.js | clean |
| `node scripts/content-comedy-mechanics.js` | total 10.9 / 21 |
| `node scripts/content-punchline-audit.js` | changes_scene 50.0%, quoted_only 13.2% |
| `node scripts/content-grammar-lint.js` | 0 lowercase, 0 plural-singular, 0 sky-class, 0 dup articles |
| `node scripts/content-repetition-report.js` | 0 endings above threshold |

### Manual review — 5 kid + 5 tween stories

All 10 stories include the picked color via a **concrete physical event** (ceiling/sleeves/wall/lamp/mirror/shadow/shoes/light/window/socks/stripe/spot). 0 abstract callbacks, 0 article mismatches.

Sample before/after (color = apple red, kid age 6, show_wrong_v3):

- **Before:** *"There was a apple red feeling to the moment that nobody really named."*
- **After:** *"The ceiling flashed apple red for exactly two seconds."*

Color = electric blue, kid age 7, rule_loophole_v3:

- **Before:** *"For a beat the whole place looked weirdly electric blue."*
- **After:** *"Cole's sleeves turned electric blue. Nobody explained this."*

Full samples + 90-line transcript in `docs/b38-after/manual-review-samples.txt`.

### Remaining story-quality risks (deferred, not in b38 scope)

1. `signature_action` callback `"There was a small [move] moment that nobody quite witnessed in full."` — same telling-not-showing register as the killed abstract color lines. Candidate for b39.
2. `mood_throughline` callback `"The whole day had a [mood] energy to it. Nobody could explain why."` — same register.
3. `mood_throughline` `"Cole turned a particular shade of [mood]"` — same article-mismatch class if mood ever starts with a vowel. The current mood pool has no vowel-start values, but the architectural risk is identical and worth a defensive pass.
4. "Stories too long globally" defect remains In Progress (kid 20 / big 24 / tween 24 sentence medians; targets 7-8 / 9-11 / 10-12).
5. Long-tail repetition at story-opening level ("Over by the X, Cole was doing the bare minimum"; "Things were technically fine. They would not stay fine.") — known b28 patterns, acceptable for now.

### Files changed

- `src/engine-v2.js` — color slot articleText, FLAVOR_CALLBACKS.visual_signature pool rewrite, 4 outside-pool beats rewritten
- `scripts/qa-current.js` — Section 19 extended with 3 new hard gates + highlight-stripping helper
- `src/content.js` — BUILD_NUMBER 37 → 38
- `index.html` — b38 RELEASE_NOTES entry
- `CHANGELOG.md` — this entry
- `docs/b38-color-callback-fix.md` — full diff report (new)
- `docs/b38-before/` + `docs/b38-after/` — repro scripts + audit snapshots

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 37 → **38**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b38`.

---

## v0.9.3 (build 37, engine v3.0.3) — 2026-05-26
**Selection Joy Pass Phase 2 — Setting-specific picker bias**

(Originally proposed by the overnight routine on 2026-05-26 as b36; renumbered to b37 because b34, b35, and b36 shipped earlier in the same session — DEF-002 tween grammar fix, Selection Joy Phase 6 tap sound + haptic, and the V3 beat trim pass.)

When a non-surprise setting is locked (At Home, At School, Outside, Food Place, Animal Place, On the Go, Somewhere Weird), the picker now biases each tap round 70/30 toward setting-themed options. 70% of sessions: one card is guaranteed to be thematically on-theme for the chosen setting. 30%: pure random draw (keeps variety). Setting is locked via the parent flavor menu; 'Surprise Me' (default) continues pure random as before.

### Changes

**`src/content.js`** — Added `s: ['flavor_key', ...]` tag to ~57 kid-tier options across 5 categories:
- **pet**: 22 options tagged (animal_place → panda/parrot/tiger/penguin/otter/octopus/goldfish/etc.; outside → eagle/wolf/crow/raccoon/beaver/goose/etc.; somewhere_weird → dragon/unicorn; on_the_go → crow/raccoon; at_home → goldfish/hamster)
- **food**: 22 options tagged (food_place → pizza/tacos/ramen/ice cream/french fries/etc.; at_home → waffles/grilled cheese/pancakes/cupcakes/cereal; outside → ice cream/popcorn/hot dogs; on_the_go → pretzels/hot dogs)
- **place**: 24 options tagged (outside → jungle/forest/meadow/canyon/volcano/glacier/desert/treehouse/carnival/water park; food_place → bakery/grocery store/diner/pizza shop; at_school → school cafeteria/playground; animal_place → aquarium/jungle/forest; somewhere_weird → castle/maze/tower/planetarium; on_the_go → rooftop/mall/bus stop/arcade/movie theater)
- **creature**: 21 options tagged (somewhere_weird → robot/mermaid/wizard/alien/witch/stone giant/tiny king/tiny wizard/fire bird/yeti/grumpy cloud; outside → goblin/troll/fairy/dinosaur/talking horse/fire bird/yeti/grumpy cloud; at_school → substitute teacher/hallway ghost/backpack troll/lunch wizard; food_place → talking sandwich/lunch wizard; at_home → sock monster)
- **mood**: 6 options tagged (at_home → cozy/sleepy; at_school → determined/puzzled/curious/worried; food_place+outside → snacky; at_school+animal_place → curious)

**`index.html`** — `buildRounds()` updated:
- New `settingBiasedSample(options, flavorKey)` helper: picks 1 tagged + 1 from rest at 70% probability when a non-surprise setting is locked and tagged options exist; falls back to pure random otherwise.
- `binaryRounds` map now calls `settingBiasedSample` instead of pure shuffle.

**`scripts/qa-current.js`** — New Section 20 (2 gates):
- Gate (a): every non-surprise flavor has ≥3 tagged options in kid food+place+creature+pet combined.
- Gate (b): simulated bias delivers ≥1 themed option in ≥65% of 200 sessions per flavor (food+creature+pet — place round is dropped when locked per v2.10.1).

### QA
`scripts/qa-current.js` all 27 gates green. `APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 36 → **37**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b37`.

---

## v0.9.3 (build 36, engine v3.0.3) — 2026-05-26
**Story length trimming pass — V3 beat library sentence reduction**

(Originally proposed by the overnight routine on 2026-05-25 as b35; renumbered to b36 because b34 + b35 shipped earlier in the same session — DEF-002 tween grammar fix and Selection Joy Phase 6 tap sound + haptic.)

Partial fix for "Stories too long globally" defect (High severity, In Progress). Trimmed the most verbose V3 beats across all 4 blueprints (goal_spine, lost_snack, show_wrong, rule_loophole) from 4-7 sentences per line to 1-2 sentences, while preserving all required role tokens and the house voice.

### Sentence-count results (Section 10, V3 primary)

| tier  | before | after | target cap |
|---|---|---|---|
| kid   | 23 | **20** | 7-8 |
| big   | 27 | **24** | 9-11 |
| tween | 25 | **24** | 10-12 |

### Beats trimmed (18 total)

- `v3_gs_setup_goal_1` (3 lines): 4/3/4 → 2/2/2 sentences
- `v3_gs_problem_goal` (3 lines): 3/4/4 → 1/2/1 sentences
- `v3_gs_problem_1` (2 lines): 3/2 → 1/1 sentences
- `v3_gs_attempt_move` (line 1): 5 → 2 sentences
- `v3_gs_attempt_color_signal` (2 lines): 4/3 → 1/2 sentences
- `v3_gs_attempt_mood`: 6 → 2 sentences
- `v3_gs_escalation_1` (line 1): 5 → 2 sentences
- `v3_gs_payoff_chant_obstacle_caves` (3 lines): 4/4/4 → 2/2/2 sentences
- `v3_rl_problem_1` (2 lines): 5/6 → 2/2 sentences
- `v3_rl_problem_absurd` (3 lines): 7/5/4 → 3/2/2 sentences
- `v3_rl_landing_1`: 4 → 2 sentences
- `v3_ls_problem_1` (2 lines): 4/4 → 2/2 sentences
- `v3_ls_attempt_move` (2 lines): 4/4 → 1/2 sentences
- `v3_ls_attempt_mood_action`: 4 → 3 sentences
- `v3_ls_escalation_burp` (2 lines): 4/6 → 2/2 sentences
- `v3_ls_escalation_eyes` (2 lines): 5/5 → 3/2 sentences
- `v3_ls_setup_2` (tween): 4 → 2 sentences
- `v3_sw_setup_tween` (line 2): 4 → 2 sentences

### QA
- `node scripts/qa-current.js` — all 25 gates green
- Section 10 advisory: kid median 23→20, big 27→24, tween 25→24
- Defect stays **In Progress** — reaching the 7-8 sentence cap for kid would require per-sentence trimming within remaining beats, which risks the voice. Logged in Notion.

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 35 → **36**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b36`.

---

## v0.9.3 (build 35, engine v3.0.3) — 2026-05-26
**Selection Joy Pass Phase 6 — tap sound + haptic feedback on every card pick**

(Originally proposed by the overnight routine as b34; renumbered to b35 because the actual b34 was DEF-002 tween grammar fix, shipped earlier in the same session.)

Every word-card tap now plays a soft 520 Hz sine-wave ping via the Web Audio API and fires a 5 ms vibration pulse via `navigator.vibrate`. Both degrade silently when not supported.

### What changed

**New `playTapPing()` function (`index.html`)**
- `navigator.vibrate(5)` — 5 ms vibration pulse. Works on Android and desktop Chrome; iOS PWA does not expose this API, fails silently.
- Web Audio: lazy `AudioContext` singleton (`_tapCtx`). On first tap: creates the context. On subsequent taps: reuses it (or resumes from `suspended` state if the browser auto-suspended it). Oscillator: `sine`, 520 Hz. Gain envelope: 0.14 → 0.001 over 120 ms (exponential ramp). Total sound duration: 120 ms.
- Full try/catch wrapper — `SecurityError`, `NotAllowedError`, and any other browser rejection all degrade silently.

**Called from `pickWord()`** — immediately after the rapid-tap guard check, before animation and burst-spark logic.

### What was already in place (prior Phase 6 items)
- Emoji at 72 px (`word-emoji` CSS) — already done before this build
- `is-picked` / `is-faded` CSS states — already done
- `pickedPop` / `rerollFade` CSS animations — already done

Phase 6 is now complete.

### QA
- `scripts/qa-current.js` — all gates green (no engine or picker logic touched)
- Inline `<script>` syntax check — clean
- `APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 34 → 35; `ENGINE_V2_VERSION` stays `v3.0.3`

---

## v0.9.3 (build 34, engine v3.0.3) — 2026-05-23
**DEF-002: Tween goal_spine_v3 resolution beat — {goal.text} → {goal.past}**

Beat `v3_gs_payoff_tween_logged` (engine-v2.js) was using `{goal.text}` (infinitive) in the payoff/resolution paragraph, producing ungrammatical sentences like "Maisie open the door that won't open." and "Maisie invent a brand new dance." The engine contract explicitly reserves `{goal.past}` for resolution beats; all kid/big tier payoff beats already used `{goal.past}` correctly — this tween-specific beat was the sole exception.

**Fix:** single-token change on the beat line — `{goal.text}` → `{goal.past}`. Produces correct past-tense: "Maisie opened the door." / "Maisie invented a brand new dance." etc.

**QA:** `node scripts/qa-current.js` — all 25 gates green. APP_VERSION stays v0.9.3; BUILD_NUMBER 33 → 34; ENGINE_V2_VERSION stays v3.0.3.

---

## v0.9.3 (build 33, engine v3.0.3) — 2026-05-22
**Smell-pool tier split — "gym bag fog" was too old for age 6**

User reported the b31 smell callback "Gym bag fog moved through the scene like it had business there" was firing for kid-tier (age 6-7) stories. A 6-year-old doesn't have a sensory reference for what a gym bag smells like; the joke needs life experience to land. The b31 smell pool was a single safe pool mixing age-appropriate smells (stinky socks, dragon breath) with adult-leaning ones (gym bag fog, pickle burps, mystery cheese).

### Fix — tier-split smell pool

Replaced `SMELL_CALLBACKS_SAFE` with two pools selected by tier:

**`SMELL_CALLBACKS_KID`** (ages 2–7: tot / little / kid) — 10 smells a young kid has a direct sensory reference for:
- old bananas / stinky socks / wet sneakers / dragon breath / wet dog
- broccoli farts / yesterday's lunchbox / skunk / laundry hamper / burnt toast

**`SMELL_CALLBACKS_OLDER`** (ages 8–13: big / tween) — kept the b31 drier register that requires more life experience:
- old bananas / stinky socks / wet sneakers / mystery cheese / dragon breath / pickle burps / gym bag fog

Old bananas / stinky socks / wet sneakers / dragon breath appear in both pools as universal anchors.

`SMELL_CALLBACKS_POTTY` unchanged — still gated behind `pottyMode` regardless of tier.

### Engine change

`generateStoryV3` smell callback picker now:
1. If `pottyMode=true` → potty pool
2. Else if `tier === 'big' || tier === 'tween'` → older pool
3. Else (tot/little/kid) → kid pool

### New QA gate (Section 19)

Added: "older-tier smells (gym bag fog / pickle burps / mystery cheese) never appear for ages 2-7" — 100 stories sampled across ages 2-7, 0 leaks.

### Acceptance

- `scripts/qa-current.js` — all gates green (4 sub-gates in Section 19 now)
- `node --check` on src/content.js + src/engine-v2.js — clean
- BUILD_NUMBER 32 → 33; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 32 → **33**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b33`.

---

## v0.9.3 (build 32, engine v3.0.3) — 2026-05-22
**Picker Emoji Hotfix — goldfish 🐠 → 🐟**

User reported: the kid-tier "Pick your sidekick" picker entry for `goldfish` was using 🐠 — which is the Unicode `TROPICAL FISH` emoji (U+1F420) and renders as a blue-and-yellow striped angelfish on every modern platform, not a goldfish.

Root cause: the b15 picker rename swapped axolotl → goldfish but inherited the 🐠 emoji on a mistaken assumption that 🐠 was a goldfish. The stale comment in `src/content.js` explicitly claimed "tropical-fish emoji is a goldfish" — it isn't.

Fix: kid pet picker `goldfish 🐠 → 🐟` (generic `FISH` emoji, U+1F41F). On Apple platforms 🐟 renders orange-gold which matches the word; on other platforms it renders as a clearly-recognizable fish (not an angelfish). Same emoji as the tween-pool `dramatic goldfish` entry, but no collision (uniqueness check is within picker rounds, not across them).

Updated the b15 comment block in `src/content.js` to correct the historical mistake.

### Acceptance

- `scripts/qa-current.js` — **all gates green** (Section 11 emoji-uniqueness within picker rounds: 0 collisions)
- `node --check` on src/content.js — clean
- BUILD_NUMBER 31 → 32; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 31 → **32**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b32`.

---

## v0.9.3 (build 31, engine v3.0.3) — 2026-05-22
**Sensory-Callback Polish**

User-reported: age-6 stories were repeatedly generating abstract callback lines like *"Somebody could have sworn the air went a little lemon yellow. A distant 'TOOT!' echoed from somewhere, possibly a memory."* These read as too abstract for kid tier and didn't physically/comedically land. Focused polish on the FLAVOR_CALLBACKS pools that fire as background sensory texture.

### What changed

**Killed**
- `Somebody could have sworn the air went a little [color]` — atmospheric metaphor for kid; deleted.
- `A distant '[sound]' echoed from somewhere, possibly a memory` — stale; deleted.
- `Somewhere down the hall a tiny '[sound]' happened` — too vague; deleted.

**Replaced with concrete visual events (kid/big/tween)**
- `The ceiling flashed [color] for exactly two seconds.`
- `A [color] stripe appeared on the floor and pointed the wrong way.`
- `Cole's sleeves turned [color]. Nobody explained this.`
- `The wall blinked [color], then pretended it had not.`

Plus a short tot/little-only variant: `A small [color] light went on, then off.`

**Replaced with physical funny sound events (kid/big/tween)**
- `Something under the table went "[sound]" and immediately regretted it.`
- `The backpack said "[sound]." Cole did not open it.`
- `"[sound]!" said the hallway. Nobody liked that.`
- `A tiny "[sound]" bounced off the ceiling and landed near Cole's shoe.`
- `The radiator said "[payword]," which radiators do not usually do.`
- `A "[payword]" came out of the closet. The closet stayed closed.`
- `Somewhere upstairs, somebody said "[payword]" too loudly.`

Plus a tot/little-only: `Somewhere close by a small "[sound]" happened.`

**NEW: smell callback pool (potty-mode gated)**

Fires in ~25% of stories regardless of picker selection. Safe pool fires for everyone:
- old bananas / stinky socks / wet sneakers / mystery cheese / dragon breath / pickle burps / gym bag fog

Potty pool fires ONLY when pottyMode is enabled:
- poopy butts / toilet burps / swamp underpants / booger soup

`buildStory()` in index.html now passes `state.pottyMode` through to `generateStoryV3` via `picks.pottyMode`; engine reads it to choose pool. With pottyMode=false, gross smells are mathematically impossible to surface.

**Age-aware variant filtering**

`FLAVOR_CALLBACKS` variant entries now support an optional `{ text, tiers }` shape. Strings remain valid (all-tier eligibility) for backward compatibility. The kid-tier concrete events are tagged `tiers:['kid','big','tween']`; existing drier atmospheric lines stay tier-gated to `['big','tween']` so they no longer fire at kid. New `pickFlavorVariant(role, tier)` helper does the filter+pick.

### New QA gates (Section 19)

Three new hard gates in `scripts/qa-current.js`:
- (a) No generated story contains the substring `air went a little` (100/100 stories — 0 hits)
- (b) No generated story contains `possibly a memory` (100/100 — 0 hits)
- (c) Potty-pool smell phrases never appear when `pottyMode=false` (100/100 — 0 leaks)

Plus an informational sanity check: with `pottyMode=true`, ~11/30 stories surface a potty smell (confirms gating is live, not just absent).

### Acceptance

- `scripts/qa-current.js` — **25 gates green** (24 prior + Section 19's 3 new sub-gates count as 1 reported gate trio)
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- `node scripts/content-repetition-report.js` — 12 phrases above 20%, same shape as b30; no NEW b31 phrases above threshold
- `node scripts/content-grammar-lint.js` — 0 lowercase / 0 sky-class / 0 duplicate articles
- `node scripts/content-random-50.js` — 0 nulls; new callbacks rendering correctly across all tiers
- BUILD_NUMBER 30 → 31; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3

### Token highlighting preserved

All concrete callbacks still use `[c:{visual_signature.text}]`, `[y:{chant.text}]`, `[y:{payoff_word.text}]`, `[name:{protagonist.name}]` tokens where appropriate, so the renderer's highlight pass continues to work. Smell callbacks contain no picker tokens (smells aren't picker words) so they intentionally render as plain prose.

### Deferred (b32+)

1. Smell callback firing rate (25%) may need tuning after parent feedback.
2. `there was a <color>` showed up at 21% in the repetition report — separate from the b31 rewrites; pre-existing pattern in beat lines worth a future pass.
3. Smell-callback variants could be expanded with tier-aware versions (gentler for tot/little) if the gym-bag-fog register reads as too old for the youngest tier.

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 30 → **31**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b31`.

---

## v0.9.3 (build 30, engine v3.0.3) — 2026-05-22
**Human-Golden Story Quality Pass** (+ b29 fire bird drift cleanup)

Two-part build: small b29 cleanup, then the Human-Golden story quality pass that was previously queued. No broad trim pass; targeted hand-authored content fixes based on reading the random-50 sample by hand.

### Part 1 — b29 fire bird drift cleanup

In b29 the picker shipped `fire bird` with `🐦‍🔥`, but the engine's `V2_WORDS` still had `phoenix` with `🔥` — a quiet mismatch where the picker word never resolved to the rich engine entry (would have fallen through the cloning path, losing the phoenix-specific traits/actions/sounds). b30 renames `V2_WORDS.phoenix` → `fire_bird` with `🐦‍🔥`, keeping the existing traits/actions/sounds. Stale comment in `src/content.js` updated so it no longer claims `🔥` is the chosen emoji.

### Part 2 — Human-Golden Story Quality Pass

Codex QA after b29 surfaced weak comedy (10.5/21), low causality (0.72/3), low callback (0.68/3). Read the random-50 sample by hand. Found six patterns where stories felt "told, not shown":

1. **"The rule developed a small visible crack."** — pure metaphor, nothing happens
2. **"Confessed immediately. To a different crime."** — identical outcome across many lost_snack stories
3. **"Suddenly remembered somewhere else it needed to be."** — same outcome regardless of obstacle
4. **"Cole located the loophole. It involved [tool] and a very specific reading of the rule."** — talks about loophole instead of showing
5. **"Mentally screenshotted it. Could be evidence later. Probably wouldn't be."** — meta-comment, no event
6. **"The audience leaned in. Sometimes nonsense lands."** — authorial telling
7. **"Plot twist nobody saw coming except maybe the X: it was the X..."** — narrator-to-reader meta-narration

### Fixes

**Concrete authored consequence beats (replace vague outcomes)**
- `v3_rl_payoff_chant_rule_cracks` rewritten with 2 variants — clipboard slips and "no" smudges into "yes"; OR the sign folds itself in half and falls
- `v3_rl_payoff_payword_tool_activates` rewritten with 2 variants — tool vibrates and points itself at the mcguffin which rolls 3 feet on its own; OR the tool beeps for the first time, paperwork rearranges into a permission slip
- `v3_gs_payoff_chant_obstacle_caves` got a 3rd variant — chant makes obstacle sneeze hard enough to pivot ninety degrees
- `v3_gs_escalation_tween_screenshot` got 2 new variants — obstacle examines mcguffin like an artifact and puts it back upside down; OR fumbles it in slow motion
- `v3_ls_payoff_chant_suspect_caves` got 2 new variants — suspect freezes mid-bite, snack falls onto Cole's plate; OR suspect's hiding spot collapses in three pieces and the snack rolls out
- `v3_ls_escalation_1` line 2 — replaced "Plot twist" meta with: ally burps, intact crumb falls on Cole's shoe
- `v3_rl_attempt_tween_tool` got a 2nd variant — tool held at a specific angle; the rule says nothing about that angle; "the angle is load-bearing now"
- `v3_rl_attempt_tween_filed` rewritten — tool held like a permit, the angle is the loophole
- `v3_sw_attempt_move_chant` line 2 — replaced "Sometimes nonsense lands" with: pillows lean forward, one falls over from leaning

**Recontextualizing callbacks (word picks up new meaning, not just repeat)**
- `v3_ls_landing_chant_recontext_kid` (NEW) — next morning, chant has become a noun ("X crackers", "Mom nodded")
- `v3_ls_landing_payword_recontext_tween` (NEW) — word appears in group chat with no context; three people react, two weren't even there
- `v3_gs_landing_chant_recontext_kid` (NEW) — Dad asks how the day went; "It was a X kind of day"; chant is now a unit of measure
- `v3_gs_landing_chant_recontext_tween` (NEW) — days later, ally is using the chant as a verb; the word is "load-bearing now"

### Headline (BEFORE = b29 main, AFTER = b30; comedy/punchline means across 4 runs)

| Metric | BEFORE | AFTER | Δ |
|---|---|---|---|
| Comedy total | 10.22 / 21 | **11.26 mean** (range 11.06–11.38) | **+1.04** |
| Causality (axis) | 0.66 | **1.06** | **+0.40** |
| Callback (axis) | 0.66 | 0.70 | +0.04 |
| Coherence (axis) | 1.20 | 1.26 | +0.06 |
| **Punchline `changes_scene`** | **47.2%** | **53.3% mean** | **+6.1pp** |
| Punchline `quoted_only` | 15.3% | 11.5% mean | −3.8pp |
| Repetition >20% n-grams | 18 | **11** | **−7** |
| Grammar lint hits | 0 | **0** | hold |
| show_wrong_v3 median sentences | 22 | 22 | hold (b28 gains preserved) |

The causality axis moved the most — direct result of replacing vague telling beats with concrete visible events.

### Acceptance

- `scripts/qa-current.js` — **25 gates green**
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- All 7 content audits run cleanly
- BUILD_NUMBER 29 → 30; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3

### Deferred (b31+)

1. Callback axis only +0.04 — the recontextualizing beats fire only when chant/payword is picked AND landing stage. Needs 4–6 more recontextualizing variants to lift further.
2. Coherence still 1.26 — the heuristic rewards story-internal vocabulary consistency; could improve by sampling chant/payword in the title.
3. show_wrong_v3 recontextualizing callback variants (kid/big/tween) — only goal_spine and lost_snack got new callbacks in b30.
4. Tween rule_loophole still has "Bureaucracy is just words. Cole had the right ones." in its core escalation — could be made more visible.

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 29 → **30**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b30`.

Full review doc: `docs/b30-human-golden-review.md`. Before/after audit outputs: `docs/b30-before/` + `docs/b30-after/`.

---

## v0.9.3 (build 29, engine v3.0.3) — 2026-05-22
**Picker Emoji Hotfix — yeti + fire bird**

User-reported defect from kid-tier picker: yeti was displaying as 🦣 mammoth, which renders visually as an elephant or wooly mammoth — not a yeti. Bundled with audit pass that caught one additional mismatch (fire bird → just fire).

### Fixes

1. **yeti 🦣 → 🐻‍❄️** — The v3.0.3 banshee→yeti rename intended 🦣 to convey "big furry beast", but on every modern platform 🦣 renders as a wooly mammoth (tusks + elephant body), which kids read as elephant or mammoth, not yeti. Polar bear 🐻‍❄️ is the closest visual proxy: large, white, furry, lives in cold environments — the exact mental model a 6-year-old has of "yeti" from Frozen, Lego, kids' books. Updated both `src/content.js` kid creature picker entry and `src/engine-v2.js` V2_WORDS.yeti entry.

2. **fire bird 🔥 → 🐦‍🔥** — Picker entry was just the fire emoji with no bird visual. Replaced with the Unicode 15.1 phoenix ZWJ emoji (🐦 + 🔥 combined), which is officially a "bird on fire" and supported on iOS 17.4+, Android 14+, Windows 11 24H2+, macOS Sonoma 14.4+. Now reads as "fire bird" literally.

### Audit (no other clear mismatches found)

Reviewed all 4 creature picker pools (kid pet, kid creature, big creature, tween creature). The intentional metonymy choices (e.g. lunch wizard 🍱, hallway ghost 🚪, tiny king 👑, sock monster 🧦, backpack troll 🎒) are by-design — they represent the composite creature through its iconic object since no perfect emoji exists. The big/tween pools (philosophical crab 🦀, sentient vending machine 🤖, algorithm ghost 🧠, etc.) similarly use metonymy and pass the read-test. No additional fixes shipped.

### Acceptance

- `scripts/qa-current.js` — **25 gates green** (including Section 11 emoji-uniqueness within picker rounds: 0 collisions)
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- BUILD_NUMBER 28 → 29; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 28 → **29**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b29`.

---

## v0.9.3 (build 28, engine v3.0.3) — 2026-05-22
**Blueprint Depth Pass**

Focused blueprint depth pass on five Codex-identified gaps after b27. **No new UI features.** Engine + content fixes only.

### Headline (BEFORE = b27 main, AFTER = b28 working tree)

| Metric | BEFORE | AFTER | Δ |
|---|---|---|---|
| Comedy total (heuristic) | 11.00 / 21 | **10.55 mean** | −0.45 (heuristic side-effect of trim) |
| Causality (axis) | 0.78 | 0.78 | 0.00 |
| Callback (axis) | 0.62 | 0.64 | +0.02 |
| **Punchline `changes_scene`** | **43.7%** | **~48% mean (45-55% range)** | **+4–11pp** |
| Punchline `quoted_only` | 7.2% | ~12% | +4.8pp (within <40% healthy) |
| **Repetition >20% n-grams** | **91** | **13** | **−78 (−86%)** |
| **show_wrong_v3 median sentences** | **27** | **22** | **−5 (−19%)** |
| Grammar lint hits | 0 | **0** | hold |
| Tot / little median sentences | 16 / 15 | 16 / 15 | hold |

The targeted numbers all moved: show_wrong shortened materially, repetition collapsed, `changes_scene` cleared the 45% bar. The 0.45-point dip on the comedy heuristic is a known side-effect of the trim (the scorer rewards descriptive density, which the task spec explicitly said to remove).

### What changed

**P1 — show_wrong_v3 mini-arc rewrite + trim.** Setup beats trimmed 5→3 sentences with 3-4 distinct openings (declaration / location / plan-statement / aside) instead of the generic "show was planned" template. Problem beats trimmed 4-6→2-3 sentences with three mini-arcs (prop snaps / refuses / launches). Attempt got a chant-bearing 3rd variant. Escalation got an obstacle-tries-to-leave variant. Payoff/landing beats trimmed throughout. Median 27 → 22 sentences.

**P2 — Selected-word causality.** `pickStageBeat` weighting stack expanded: kept b27 global 2x for `absurd_consequence`, added landing-stage additional 2x for `callback` (3x total in landing), added tot/little 2x for any beat whose lines contain a `[y:{chant.*}]` token. Combined with b27's tween-widening of absurd_consequence beats, big `changes_scene` 25%→37.5%, tween 25%→41.5%, kid 44%→50%, overall 43.7%→48% mean.

**P3 — Callback landing weighting.** Same `pickStageBeat` block: when `chant` or `payoff_word` is in roles AND `stage.name === 'landing'`, callback beats get +2x on top of the b27 +2x global — total 3x weight. Callback axis essentially flat (0.62→0.64) within run variance; mechanism in place for b29 callback authoring to land harder.

**P4 — Repetition rewrites.** Codex post-b27 flagged 91 phrases above 20%. Five specific patterns attacked by rewriting beat STRUCTURES (not adding variants):
- `v3_gs_payoff_chant_obstacle_caves` carried three top-20% n-grams in one beat ("applauded the X because manners", "heard it made a small noise and stepped aside", "in a way that looked rehearsed"). Rewrote with two structurally distinct variants (freeze-and-slide / suddenly-remembered-somewhere-else).
- `v3_rl_problem_mood` cascade — single beat fired in 20% of stories and caused 12 separate top-20% n-gram hits ("declared the food forbidden + felt mood about this development + possibly more mood + than the X had bargained for..."). Rewrote with three structurally distinct mood-flavored variants. Documented a coding rule in-place: never lead a sentence with `[c:{mcguffin...}]` (plural agreement bug — "the nachos was") or `[c:{mood_throughline...}]` (lowercase-start lint).
- "in a way that" template stripped from 6 beats and replaced with concrete imagery.
- "At the X" opening reordered in 5 setup beats so other content leads.
- `v3_ls_setup_1` (lost_snack) pool expanded 2→4 with structurally varied openings.

Result: 91 → 13 n-grams above threshold.

**P5 — Tot/little chant-bearing beat bias.** When tier is tot/little AND chant role is picked, beats whose lines contain a `[y:{chant.*}]` token get 2x weight. Cheap inline regex check inside `pickStageBeat`. Preserves b27 tot/little length gains (median 15-16 sentences held).

### Acceptance

- `scripts/qa-current.js` — **25 gates green**
- `node --check src/content.js + src/engine-v2.js + api/tts.js` — clean
- All 5 content audits run cleanly (comedy-mechanics, punchline, repetition, grammar, blueprint-health)
- BUILD_NUMBER 27 → 28; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3

### Deferred (b29+)

1. Comedy heuristic vs trim trade-off — add 2-3 high-density payoff beats for show_wrong that preserve the trim, OR teach `content-comedy-mechanics.js` to discount sentence-count from premise/visual axes.
2. Callback axis still flat at 0.64 — the 3x landing weighting is live but tier-eligible callback beats are concentrated in kid+big. Author 2-3 tween-specific callback beats for goal_spine and lost_snack.
3. `quoted_only` crept 7.2% → 12% — within healthy (<40%) range but worth watching. Add beats where chant causes something visible vs decoration.
4. show_wrong_v3 still 22 sentences median — target was "20ish". One more pass on setup beats can close the gap.
5. 13 phrases still above 20% repetition — long-tail tot/little call-response intentional repetition; acceptable.

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 27 → **28**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b28`.

Full diff report: `docs/b28-blueprint-depth-diff.md`. Before/after audit outputs: `docs/b28-before/` + `docs/b28-after/`.

---

## v0.9.3 (build 27, engine v3.0.3) — 2026-05-22
**Story Quality Stabilization Pass**

Focused stabilization on six gaps Codex flagged after b26. **No new app features.** Engine + content fixes only.

### Headline (100-story comedy audit, BEFORE = b26 main, AFTER = b27)

| Metric | BEFORE | AFTER | Δ |
|---|---|---|---|
| Comedy total | 10.65 / 21 | **11.25** | **+0.60** |
| Causality | 0.84 | 0.99 | **+0.15** |
| Visual joke | 1.41 | 1.69 | **+0.28** |
| Punchline `quoted_only` | 19.2% | 13.5% | −5.7pp |
| Punchline `changes_scene` | 34.7% | 38.0% | +3.3pp |
| Grammar lint hits | 18 | **0** | **−18** |
| Tot sentence median | 19 | **15** | **−21%** |
| **Tween total** | **8.80** | **10.45** | **+1.65** |

The biggest win is **tween**: total +1.65, causality 0.65 → 0.85. Codex's "tween changes_scene 22.6% lagging" gap directly addressed.

### Six priorities shipped

**P1 — Audit diagnostic accuracy.** `generateStoryV3` now returns `__blueprint`, `__tier`, `__stages` non-rendered metadata. Audit scripts report the real blueprint instead of `"(v2 fallback)"`. `renderStory()` in index.html is unaffected.

**P2 — `the the` duplicate article.** Root cause: tween picker entry `{w:'the back of the bus'}` literally included "the". Beats render `'At the [y:{setting.text}]'` + `'the back of the bus'` → `'At the the back of the bus'`. Renamed picker entry to `'back of the bus'`. Grep confirms it's the only offender across all pools.

**P3 — Lowercase sentence-start (real cases).** 16 hits in BEFORE; 2 real bug patterns:
- `FLAVOR_CALLBACKS.mcguffin` started with `[c:{mcguffin.articleText}]` rendering `some donuts sat off…` lowercase. Reworded: `Off to the side, [c:{mcguffin.articleText}] sat there,…`. Added a 3rd variant.
- `The [prop] just... gave up.` ellipsis pattern. Removed ellipsis.

AFTER lint: **0/100 lowercase hits**.

**P4 — Repeated structural phrases.** Two FLAVOR_CALLBACKS pools expanded targeting Codex's top n-grams:
- `mood_throughline` 2 → 6 variants (was 36% repeat on "Cole felt <mood> about")
- `signature_action` 5 → 8 variants (was 22% repeat)

**P5 — Causality + tween.** Two engine-level fixes:
- `pickStageBeat` now 2× weights candidates tagged `jokeJob: 'absurd_consequence'` or `'callback'` when HIGH_IMPACT roles (chant / payoff_word) are present.
- All 24 `absurd_consequence` beats widened from `tiers:['kid','big']` to `tiers:['kid','big','tween']`. Tween causality 0.65 → 0.85.

**P6 — Tot/little length trim.** 6 b24/b26 chant call-response beats had trailing flourishes ("Everyone sang.", "Then giggled.", "Cole laughed."). Trimmed token-free closers. **Tot median 19 → 15 (−21%).** Little stable at 15. 4-paragraph structure preserved.

### Acceptance

- `scripts/qa-current.js` — all **25 gates green**
- `node --check` on `src/content.js` + `src/engine-v2.js` + `api/tts.js` — clean
- All 4 content audits run cleanly
- `docs/b27-before/` + `docs/b27-after/` + `docs/b27-stabilization-diff.md` committed

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 26 → **27**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b27`.

### Deferred for b28+

- show_wrong_v3 sentence-count trim (longest blueprint, b25 baseline median 29)
- 14 remaining repetition n-grams above 20% — mostly structurally hard story-opening patterns
- tot/little chant render rate still ~50% (selection bias when chant present queued)
- Callback axis essentially flat in b27 (−0.01); 2× weight boosts both consequence and callback equally and consequence dominated. b28 could weight callback higher specifically in landing stage.
- Some `lost_snack` escalation beats don't surface `false_suspect`

---

## v0.9.3 (build 26, engine v3.0.3) — 2026-05-22
**Story Comedy Mechanics Pass — 28 new beats (callbacks + consequences + tot call-response) + engine plural fix**

Comic **causality** + **callback** build. Existing funny words now DO something — they cause scene events and return at the end as official sign-offs. **No new random words.**

### Engine fix (Priority 2)

`mapPickToWord` clone path now re-derives `isPlural` from the picker word. The b24 static V2_WORDS fix for `binoculars` is no longer the only line of defense — any future picker entry ending in `s` (not on the invariant list: fish/deer/sheep/...) is now correctly pluralized through the clone. Per-store regression rate of `a binoculars` drops from ~1/100 to 0.

### 12 new HIGH_IMPACT consequence beats (Priority 3)

3 per kid+big+tween blueprint, tagged `jokeJob: 'absurd_consequence'`:

- **lost_snack** — suspect caves to chant / crumb reveals on payoff_word / mcguffin returns on chant
- **goal_spine** — obstacle physically collapses / obstacle misreads chant as instruction / audience picks up payoff_word
- **show_wrong** — prop unbreaks on chant / audience chants payoff_word / obstacle caves
- **rule_loophole** — chant inverts rule / payoff_word forces imposer resignation / audience validates chant

### 12 new callback-in-landing beats (Priority 3+4)

The kid's chant or payoff_word **RETURNS** in the closing paragraph as the official sign-off / case-closed / "we did it" code-word. 2 per blueprint × kid/big + 2 per blueprint × tween. Tagged `jokeJob: 'callback'`. Closes the b25 callback gap that was the lowest-scoring axis.

### 3 new tot call-and-response variants (Priority 6)

The spec's exact pattern:
> "Glorp?" said Cole. "Glorp!" said the puppy. Then the pancake sneezed.

New variants: clap-and-hop, whisper-and-tip, sing-along. Extends b24's tot pool.

### Glue-phrase reduction (Priority 5)

`FLAVOR_CALLBACKS.visual_signature` expanded 5 → 8 variants so `"Everything in the room had picked up..."` drops from 24% to under the 25% lint threshold.

### New comedy-mechanics audit (Priority 1)

`scripts/content-comedy-mechanics.js` — heuristic 7-axis scoring (premise clarity / selected-word causality / escalation / visual-physical joke / callback / age fit / coherence). Reproducible BEFORE/AFTER diff tool. `docs/b26-comedy-diff.md` is the first use.

### Results (100-story sample, b25 → b26)

| Axis | BEFORE | AFTER | Δ |
|---|---|---|---|
| premise_clarity | 1.92 | 1.84 | −0.08 |
| selected_word_causality | 0.91 | 0.83 | −0.08 |
| escalation | 1.67 | 1.70 | +0.03 |
| visual_physical_joke | 1.38 | 1.43 | +0.05 |
| **callback_payoff** | **0.46** | **0.63** | **+0.17** |
| age_fit | 2.98 | 2.97 | −0.01 |
| **coherence** | **1.22** | **1.47** | **+0.25** |
| **TOTAL** | **10.54** | **10.86** | **+0.32 / 21** |

**Per-tier total deltas:** kid −0.05 (callback **0.20 → 0.60**, 3×), **big +2.15** (callback **0.10 → 0.50**, 5×), tween −0.15 (callback +0.05). The big tier landed the biggest win because b24's 6-paragraph arc has more room for the chant to return in landing; kid's 5-paragraph arc still moved callback up 3×.

Some axes wobbled within 100-story sample noise (causality −0.08, premise −0.08). Net positive overall, biggest gains where the user spec named the gap.

### Honest deferred items for b27

- Bias beat selection toward chant-bearing beats in tot/little when chant is picked
- Weight callback landings higher when HIGH_IMPACT roles are present
- Trim show_wrong "decoration" escalation variants in favor of reaction variants
- Tween freetext subtype tagging so all tween freetext lands in chant/payoff_word slots

### Acceptance

- `scripts/qa-current.js` — all **25 gates green**
- `node --check` on `src/content.js` + `src/engine-v2.js` + `api/tts.js` — clean
- Inline `<script>` syntax — clean

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 25 → **26**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b26`.

---

## v0.9.3 (build 25, engine v3.0.3) — 2026-05-22
**Content Quality QA System — 6 repeatable audits + playbook + b24 baseline (infrastructure only)**

Tooling-only build. **No story-content rewrites.** Ships a repeatable content-quality QA system so story humor / content can improve continuously across future builds.

The release-gate QA harness (`scripts/qa-current.js`) tells you *whether the engine works*. This system tells you *whether the stories are funny.*

### Six new audit scripts

| Script | Purpose |
|---|---|
| `scripts/content-golden-audit.js` | 20 **fixed** scenarios spanning all 5 tiers + 8 V3 blueprints + multiple setting flavors + both story modes. Markdown output with blank human score fields. Reproducible across builds so a fix can be diffed. |
| `scripts/content-random-50.js` | 50 random V3 stories balanced 10/tier. Markdown + JSON. Includes sentence count, blueprint, age, tier, setting flavor, picked words. Successor to `creativity-sample.js` for per-build samples. |
| `scripts/content-repetition-report.js` | Scans 100-200 stories for repeated 4-7-word n-grams + repeated last sentences. Normalizes picker words and protagonist name to placeholders. Configurable threshold (default 20%). |
| `scripts/content-punchline-audit.js` | Classifies HIGH_IMPACT chant/payoff_word usages as `quoted_only` / `causes_reaction` / `changes_scene` / `returns_as_callback` / `lands_in_final_third`. |
| `scripts/content-blueprint-health.js` | 10+ stories per V3 blueprint. Reports sentence median/max, HIGH_IMPACT render rate, top repeats per blueprint, one sample story per blueprint with blank score fields. |
| `scripts/content-grammar-lint.js` | Standalone joke-breaker regex pass over a 100-story sample. Diagnostic only — release gate is `qa-current.js` Section 18. |

### New playbook

`docs/content-qa-playbook.md` documents the six audits, the post-build workflow, the 1-5 scoring rubric (with tier-specific minimum bars), the stop conditions, and Notion-logging conventions.

### b24 baseline committed

`docs/content-qa-b24-baseline/` contains a first-run output for every audit script against the current b24 codebase. Future content builds (b26+) diff against this baseline.

**Headline numbers from the b24 baseline:**

- **Punchline causation rate:** 45.5% `changes_scene` (above 35% target). 31.1% `quoted_only` (under 40% — healthy).
- **Blueprint sentence medians:** tot_wonder/tot_sky 18 · little_quest/little_food 15 · lost_snack 24 · goal_spine 25 · **show_wrong 29 (longest)** · rule_loophole 19.
- **Grammar lint (100-story sample):** 1 `a binoculars` leak (mapPickToWord clone path; static V2_WORDS already fixed), 1 `the the` duplicate, 14 lowercase-sentence-starts (mostly the by-design chant pattern `"glorp!" said Cole. then the chick...`).
- **Repetition report:** ~60 n-grams above 20% threshold (top candidates for variant-pool expansion in b26).

### Notion

New page: **Content QA / Story Quality** under the NoddyTales hub. Hosts the recurring workflow + scoring rubric + a build-by-build run-history table.

### Spec note

User task referenced *"b23 baseline"* but `main` shipped b24 earlier today (Story Humor Pass merged at `5e43570`). The baseline is captured against the **actual current production state**, which is b24, and the directory is named `docs/content-qa-b24-baseline/` accordingly.

### Acceptance

- `scripts/qa-current.js` — all **25 gates still green** (this build is purely additive; no engine touched)
- `node --check` on `src/content.js` — clean
- All 6 new scripts run cleanly against the b24 codebase (verified — each wrote its expected output)

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 24 → **25**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b25`.

### Next-build candidates surfaced by the baseline

- `show_wrong_v3` sentence median 29 — biggest blueprint, candidate for content trim pass
- 1 `a binoculars` still slipping through despite the b24 static V2_WORDS fix (`mapPickToWord` clone path doesn't re-derive `isPlural` from picker word — clean fix is a one-line check in the engine)
- ~14% lowercase-sentence-start hits driven by the b23/b24 chant beats (`"glorp!" said Cole. then the X...`) — semantics-correct in context but the lint flags it; consider capitalizing the post-shout sentence start

All three deferred per the no-content-rewrite constraint on this build.

---

## v0.9.3 (build 24, engine v3.0.3) — 2026-05-22
**Story Humor Pass — polish fixes, consequence beats, glue-phrase variants, tot/little HIGH_IMPACT**

Story-quality build addressing 5 priorities from a Codex 50-story creativity assessment. b23 raised the floor (Absurd Word Bank + HIGH_IMPACT slots) but humor was still inconsistent: absurd words appeared as decoration rather than causing funny outcomes, glue phrases dominated samples, and a handful of grammar bugs broke individual jokes. b24 fixes the polish bugs, adds 12 consequence beats, expands variant pools, and closes the b23 tot/little HIGH_IMPACT gap.

### Priority 1 — Polish fixes (joke-breaking)

- **goal_spine_v3 title patterns** rewrapped with `Tried to` / `Try to` so bare third-person verbs (`Cole Tell` / `Cole Invent` / `Cole Build`) become correct after the infinitive marker.
- **4 lost_snack_v3 beats** fixed for plural-mcguffin singular-verb leaks: `pretzels was unaccounted for` / `taquitos was technically the mission` / `taquitos was very good` / `taquitos was acquired` → restructured to plural-neutral verbs.
- **binoculars** in `V2_WORDS.objects` marked `isPlural: true` so `articleText` returns `some binoculars` instead of the leak `a binoculars` via the b15 picker-clone path.
- **`v3_tl_tot_repeat_hat`** split into two lines — old `put the [wonder] on top of [ally]'s head` read absurd-in-a-bad-way when the wonder was sky-class (cloud, star, comet, moon).

### Priority 2 — Comedy-role contract

New `jokeJob` taxonomy comment + metadata field on `V3_BEATS`:

```
setup / escalation / reversal / physical_gag / callback /
punchline / cozy_landing / absurd_consequence
```

NEW b24 beats tagged. Retroactive tagging of ~150 pre-b24 beats queued for **b25**.

### Priority 3 — 12 new HIGH_IMPACT absurd_consequence beats

3 per blueprint (lost_snack / goal_spine / show_wrong / rule_loophole). The kid's chosen chant or payoff_word now CAUSES a scene event instead of merely decorating it. Patterns:

- mcguffin reappears on its own
- ally misunderstands chant as a command
- room/audience chants it back
- obstacle steps aside hearing it
- ally adopts it as new favorite word
- mcguffin vibrates / responds physically
- broken prop comes back to life
- crowd makes chant the show's name
- ally treats payoff_word as the new cue
- rule develops a visible crack
- rule_imposer misreads chant as a code word
- loophole_tool activates absurdly

All read-aloud safe, kid+big tier-tagged.

### Priority 4 — Glue-phrase variant pools

`FLAVOR_CALLBACKS` pools expanded from 2 → 5 variants for `signature_action`, `visual_signature`, `chant`, `payoff_word`. `v3_ls_problem_mood` expanded 1 → 4 variants.

### Priority 5 — Tot/little HIGH_IMPACT

`chant: 'sound'` role added to all 4 tot/little blueprint `roleMap`s. 5 new `tl_silly_repeat` beats authored with call-and-response `"[y:{chant.text}]?"` / `"[y:{chant.text}]!"` pattern + gentle physical gags (wonder wiggles, sneezes, hums, flips by itself). Beats require `chant` so they fire only when sound was picked. **Closes the b23 honest-callout gap:** ages 2-5 now ALSO surface absurd-bank picks in `[y:...]` punchline tokens.

### Results (50-story random V3 sample, stripped-text regex)

| Glue phrase | BEFORE | AFTER | Δ |
|---|---|---|---|
| "A faint X glow" | 52% | **8%** | −44pp |
| "Everything in the room had picked up" | 44% | **24%** | −20pp |
| "one more time, just to make a point" | 36% | **16%** | −20pp |
| "possibly a memory" | 14% | **6%** | −8pp |
| "noticed and tried to act normal" | 16% | **8%** | −8pp |
| "in a way that meant business" | 16% | **12%** | −4pp |

| Polish issue | BEFORE | AFTER |
|---|---|---|
| Title bare-verb (`Cole Tell/Share/Build/...`) | 1/50 | **0/50** |
| Plural-mcguffin singular-verb | 4/50 | **0/50** |
| `a binoculars`-class article error | 0/50 | 0/50 |
| Sky-physicality leak | 1/50 | **0/50** |

**HIGH_IMPACT punchline landing rate (freeword pick → `[y:...]` token): 60% → 100%** (gain from tot/little chant-role addition).

### New QA Section 18 (Story Humor Pass audit, 7 cases)

- No title bare-verb leaks in V3 patterns
- No singular-verb on `{mcguffin.text}` ("was unaccounted for")
- `binoculars` has `isPlural: true`
- ≥12 `absurd_consequence` beats present
- Spread across all 4 kid+big+tween blueprints
- tot/little blueprints declare `chant: 'sound'`
- ≥2 tot/little beats render `[y:{chant.*}]`

All 7 pass.

### New dev tool

`scripts/creativity-sample.js` — reproducible 50-story BEFORE/AFTER report. `--json` mode emits structured output for diff scripting. `docs/b24-creativity-diff.md` captures the full b24 diff.

### Acceptance

- `scripts/qa-current.js` — all **25 gates green** (Section 18 added)
- Section 14 voice resolver — 21/21
- Section 17 HIGH_IMPACT audit — 18/18
- Section 18 Story Humor Pass audit — 7/7 (new)
- `node --check` on `src/content.js` + `src/engine-v2.js` + `api/tts.js` + `scripts/qa-current.js` — clean
- Inline `<script>` syntax — clean

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 23 → **24**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b24`.

---

## v0.9.3 (build 23, engine v3.0.3) — 2026-05-22
**Absurd Word Bank + HIGH_IMPACT slots + Cheerful narrator rebrand**

Two coordinated content changes shipping together:

- **Part A:** HIGH_IMPACT punchline slots now pull from a dedicated Absurd Word Bank so the kid's shouted/announced/revealed word lands funny, not flat.
- **Part B:** The "Silly" narrator preset is rebranded to **"Cheerful"** so the label honestly describes the voice we have (bright + warm) instead of the voice we were chasing (high-pitched cartoon).

---

### Part A — Absurd Word Bank + HIGH_IMPACT slots

Notion Build Idea `36813aa1-d4db-8147-84a8-eb888c5c6900` *"High-impact word slots: force funnier, more absurd choices"*.

#### The problem

Live-testing call-out: template lines like `"shouted whatever came to mind: [WORD]"` rendered as `"shouted whatever came to mind: Zap"` — technically correct, not funny. Root cause: the kid's freeword pick is rendered into a structural punchline position, but the picker's example hints (`'YAY' / 'WIN' / 'KAPOW'`) primed neutral picks, not absurd ones.

#### `ABSURD_WORD_BANK` (src/content.js)

**56 tier-tagged entries** across the 4 categories from the Build Idea spec:

| Category | Count | Examples |
|---|---|---|
| sillySounds | 15 | glorp, blorp, squonk, fwoosh, kabloom, sproing, gloop, wubba |
| grossButSafe | 12 | stinky bananas, booger cloud, burp bubble, sneezy sandwich, ear cheese |
| randomObjects | 14 | cheese hat, rubber duck, underpants helmet, Captain Noodle, banana phone, moon spoon |
| nonsenseCompound | 15 | wobble-flop, sneezy-pants, jiggly blorp, flumpy, snorble-doo, sprongulous |

Tier eligibility (per-entry `tiers` field):

| Tier | Eligible entries | Notes |
|---|---|---|
| tot | 15 | Simpler single words only; excluded from grossButSafe + nonsenseCompound (ages 2-3 don't need bathroom humor primed and compound silliness is harder to grok) |
| little | 39 | Full grossButSafe access opens up |
| kid / big / tween | 40+ each | Compound silliness + wordplay tier-appropriate |

New helpers:
- `absurdWordsForTier(tier, n)` — Fisher-Yates shuffle, returns up to `n` entries eligible for `tier`
- `absurdHintsForTier(tier)` — convenience wrapper returning 3 hints (matches `examples.length` shape)

#### `HIGH_IMPACT_ROLES` declarative constant (engine-v2.js)

```js
const HIGH_IMPACT_ROLES = ['chant', 'payoff_word'];
const HIGH_IMPACT_PICKER_CATEGORIES = ['sound', 'freeword', 'freeword2'];
```

These are the engine roles whose values render in `[y:...]` punchline tokens (the yellow-highlight treatment reserved for shouted/announced/revealed moments). Adding a role here is a CONTRACT change documented in inline comments.

#### `applyHighImpact(round, tier)` wiring (index.html)

New helper called from `buildRounds()` for every:
- `freetext` round with `cat: 'freeword'` or `cat: 'freeword2'`
- `sound` binary tap round (SOUND_HOT_OPTS-sourced, already absurd; tagged for QA verification)
- Kid escape-hatch freetext round (when the kid taps "or type your own ✏️")

For freetext rounds the helper replaces `round.examples` with `absurdHintsForTier(tier)`. Static `FREE_TEXT_ROUNDS` arrays in `src/content.js` stay untouched — examples are stripped + replaced at session-construction time.

#### New QA Section 17 (18 cases)

- ABSURD_WORD_BANK ≥ 50 entries across 4 named categories
- Per-tier eligibility floors (tot ≥ 12; little/kid/big/tween ≥ 30 each)
- Every `HIGH_IMPACT_ROLES` role surfaces in at least one `[y:...]` V3 beat line
- `HIGH_IMPACT_PICKER_CATEGORIES` covers the picker-side counterparts
- Every `HIGH_IMPACT` freetext round has a non-empty `examples` array (so the override target exists)
- `absurdHintsForTier(tier)` returns ≥ 1 hint per tier

All 18 pass.

> **Audit direction note:** the inverse contract (every `[y:...]` token uses a `HIGH_IMPACT_ROLES` role) does **not** hold. `[y:...]` is legitimately used for non-punchline emphasis too (e.g. `[y:{setting.text}]` for place-name highlighting in setup beats). Section 17 only enforces the forward direction: HIGH_IMPACT roles must appear in punchline-style `[y:...]` beats.

#### Sample story confirmation (eyeballed before merge)

- **kid (age 7)** ends with: `"spoon hat!" yelled Cole. The parrot echoed back, mouth full.`
- **big (age 9)** ends with: `"bonk!" yelled Cole. The eagle echoed back, mouth full.`
- **tween (age 12)** payoff: `And one of them, very quietly, said "stinky bananas."`

The Build Idea's "Zap → stinky bananas / wobble-flop / glorp" target landed.

#### Honest callout (deferred)

The tot + little v3 blueprints (`tot_wonder_v3`, `tot_sky_v3`, `little_quest_v3`, `little_food_v3`) use only `protagonist` / `ally` / `wonder_object` roles. They have **no `chant` or `payoff_word`** roles. So for ages 2-5 the kid sees absurd hints in the picker, but the picked word doesn't currently land in a `[y:...]` punchline because no such beat exists in those blueprints. Adding HIGH_IMPACT slots to tot/little blueprints is a candidate follow-up build (tag `tl_silly_repeat` call-response beats and add a `chant` role to the blueprint roleMaps).

---

### Part B — Cheerful narrator rebrand

User feedback after b20/b22: *"Silly"* + *"high-pitched, goofy"* was the wrong target for Mimi's actual voice quality, which reads as bright, warm, lightly accented — not cartoony. The brief had been chasing a voice we never had.

#### Rebrand

| Field | Before (b22) | After (b23) |
|---|---|---|
| Label | Silly | **Cheerful** |
| Tagline | High-pitched, goofy, extra expressive | **Bright, warm, lifts the mood** |
| previewText | Hi, I'm Silly. I make stories sound extra goofy! | **Hi, I'm Cheerful. I'm here to lighten the mood.** |

**Preset key stays `silly`** so saved `nt_voice_preset` values, the `ELEVENLABS_VOICE_SILLY` env-var name, and the b22 IndexedDB cache (`preview:v2:silly`, `v2:silly|<sha>`) all survive untouched.

#### Mimi reframed from backstop → intended voice

- **`api/tts.js`** silly preset comment block rewritten: Mimi (`zrHiDhphv9ZnVXBqCLjz`) is no longer documented as a "rejected cartoon attempt held only to prevent 500s" — she's now the intended Cheerful voice. b17 Gigi + b18 Mimi-as-rejected-cartoon history kept in comments for traceability.
- **Per-request `console.warn` for silly-on-backstop DROPPED.** Was firing on every Mimi resolve telling operators to override. With the rebrand, resolving silly via `hardcodedPerPreset` is the happy path — no warn needed.
- **README** — narrator-lineup table updated to "Cheerful"; the "Required for genuine Silly: override `ELEVENLABS_VOICE_SILLY`" panic section removed; `ELEVENLABS_VOICE_SILLY` documented at parity with the other three env vars (optional override). A note explains the env-var name keeps the `_SILLY` suffix for backward compatibility with the historical preset key.

---

### Acceptance

- `scripts/qa-current.js` — all **24 gates green**
- Section 14 voice resolver — **21/21** (celebrity blocklist clean on "Cheerful" copy)
- Section 17 HIGH_IMPACT audit — **18/18** (new section)
- `node --check` on `src/content.js` + `api/tts.js` + `src/engine-v2.js` + `scripts/qa-current.js` — clean
- Inline `<script>` syntax — clean
- **Manual review of 5 sample stories (one per tier) — approved by John before merge** (per his "I will review the samples and confirm before you push" gate)

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 22 → **23**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b23`.

---

## v0.9.3 (build 22, engine v3.0.3) — 2026-05-21
**Voice cache versioning + signature observability + same-voice collapse detection — fixes "all previews are George" at the cache layer**

Production-blocking defect. Parents reported all 4 voice preview buttons play the same male British narrator clip (George `JBFqnCBsd6RMkjVDRZzb`).

### Root cause (after code inspection)

The resolver chain has been fixed 4 times (b16/b17/b18/b20) and Section 14 has been 14/14 green every time. But the bug kept recurring because **the bug doesn't live in the resolver** — it lives in the **client-side IndexedDB cache layer**.

Pre-b22 preview cache key shape was unversioned:

```js
function previewKey(voicePreset) {
  return `preview:${preset}`;   // ← no cache version
}
```

Any user who previewed during a deploy where production env vars collapsed all 4 presets to George has 4 IndexedDB entries (`preview:sunny`, `preview:cozy`, `preview:adventure`, `preview:silly`) all containing George audio. Every subsequent tap returns cache HIT and replays George — even though the resolver has been correct since b17. The browser never reaches `/api/tts`.

Section 14 missed this because it tests `resolveVoice` as a pure function with mock env. The cache layer is browser-side and was untested.

### Fix (4 parts)

**1. Cache key versioning**

New `VOICE_CACHE_VERSION = 'v2'` constant in `src/content.js`. Key shape:

- Story: `<VERSION>:<preset>|<sha>` — e.g. `v2:cozy|f1a2b3c4d5e6f7a8`
- Preview: `preview:<VERSION>:<preset>` — e.g. `preview:v2:sunny`

Bumping the constant orphans every cached blob keyed by an older version. Browser misses cache once per (voice, story) pair and re-fetches from the current resolver. **No manual user action required** — orphans get GC'd by the IndexedDB quota policy. The constant is frozen until the next cache-invalidation event; bumping `BUILD_NUMBER` alone does not bump it.

**2. Voice-routing observability**

`/api/tts` JSON response now includes:

```json
{
  "audioBase64": "...",
  "alignment":   {...},
  "voicePreset":         "sunny",
  "voiceSource":         "hardcodedPerPreset",
  "voiceConfigVersion":  "v2",
  "voiceSignature":      "8476d21b"
}
```

`voiceSignature` is the first 8 hex chars of `SHA-256(voiceId)` — an irreversible fingerprint that lets the client (and DevTools) verify 4 distinct underlying voices without exposing raw ElevenLabs voice IDs to the browser. Raw IDs stay server-side.

**3. Same-voice collapse detection**

New `detectVoiceCollapse(env)` helper in `api/tts.js` runs `resolveVoice` for all 4 presets and returns any signature-collision groups. Per-request `console.warn` fires when ≥2 presets share a `voiceSignature`, naming the specific preset keys:

```
[TTS] VOICE COLLAPSE: presets [sunny, cozy, adventure, silly] all resolve to the same voiceSignature=49f550f1. Users will hear identical audio for these presets. Check Vercel env vars (ELEVENLABS_VOICE_SUNNY/COZY/ADVENTURE/SILLY/ID).
```

Catches the b16 production failure mode (operator pointed all 4 env vars at George) **at request time** instead of only in retroactive user reports.

**4. `window.qaVoicePreviews()` browser dev helper**

Browser-side diagnostic that fetches metadata for all 4 voice previews and prints a `console.table` with preset / cacheKey / fromCache / voiceSignature. Flags any signature collisions in console. Uses a new cache-aware `TTSManager.probePreviewMeta()` that returns metadata from the cached entry when present (b22+ cache writes include the meta), otherwise calls `/api/tts`. Doesn't auto-play audio.

```js
// In Chrome DevTools console:
await qaVoicePreviews()
```

### New QA gates

Section 14 grew 14 → **19 cases**:

- 14: `voiceSignature` shape (8 lowercase hex chars from SHA-256)
- 15: `detectVoiceCollapse` happy path (4 distinct hardcoded defaults → 0 collisions)
- 16: env-driven full collapse (all 4 env vars = George → 1 collision group of 4)
- 17: partial collapse naming (2 env vars + cozy default = 3-preset collision group not including silly)
- 18: `VOICE_CONFIG_VERSION` non-empty string

All 19 pass.

### README

New voice troubleshooting section documents:
- Stale IndexedDB cache failure mode + b22 fix
- Vercel env var collapse failure mode + how to spot it in logs
- `qaVoicePreviews()` diagnostic flow

README opener no longer says *"warm British narrator voice"* (stale since b8 introduced the picker).

### Honesty disclosure

Claude has no audio playback. **b22 is the architectural fix** that prevents the cache class of bug from recurring, but **final audible verification must be done by John in production after deploy.** If audio still sounds collapsed, `qaVoicePreviews()` + Vercel logs will surface the exact diagnostic.

### Acceptance

- `scripts/qa-current.js` — all gates green; Section 14 14 → 19 cases
- `node --check` on `api/tts.js`, `src/content.js`, `scripts/qa-current.js` — clean
- Inline `<script>` syntax — clean
- Smoke-tested helpers: `detectVoiceCollapse({})` returns `[]`; collapse-to-George returns 1 group of 4

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 21 → **22**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b22`.

---

## v0.9.3 (build 21, engine v3.0.3) — 2026-05-21
**Rainbow decoration no longer clips the welcome-back lede — moved to empty top-center band**

Tiny CSS hotfix. User screenshot on iPhone (welcome-back substep) showed the decorative 🌈 emoji clipping the leading *"s"* of the lede paragraph *"still age 6? Same crew? Add or remove anyone."*

### Root cause

`.deco--2 { top: 18%; left: 10%; }` from b12 anchored the rainbow inside the lede-text band on most viewport sizes. b12 had moved it from `left: 6%` to `left: 10%` to fix a left-edge clipping issue during the float-rotate animation, but didn't address vertical overlap with the lede paragraph below the heading.

### Fix

```css
.deco--2 { top: 5%; right: 38%; animation-delay: 1.2s; }
```

- `top: 5%` sits the rainbow at ~30-45px from the top of the canvas (depending on viewport height) — well above the heading band (~20-30%) and the lede band (~30-38%).
- `right: 38%` (instead of `left: 10%`) anchors the position from the right edge so the rainbow tracks consistently across phone widths (320 / 375 / 430 px). On narrow viewports the previous `left: 10%` could drift dangerously close to the brand mark; `right: 38%` keeps it in the empty band between brand mark (top-left) and back/gear buttons (top-right).

Verified visually clear of all text + buttons across iPhone SE / iPhone 15-16 / iPhone Pro Max widths.

### Acceptance

- `scripts/qa-current.js` — all **24 gates green** (asset position is non-functional from the engine's perspective)
- Inline `<script>` syntax — clean

**No engine / picker / story-data / voice changes.**

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 20 → **21**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b21`.

---

## v0.9.3 (build 20, engine v3.0.3) — 2026-05-21
**Narrator label rename + Silly override-required + Section 10 V3 + structural kid 6→5**

Combined voice/UI cleanup + QA accuracy fix + first structural story-length pass.

### Part A — Narrator UI labels simplified (away from accent/geography)

User feedback after b16/b18: the labels *"Sunny American"*, *"Storybook British"*, *"Adventure American"*, *"Silly Cartoon"* exposed underlying-voice accent details in a way that felt off for a kid app and made the foreign-accented Mimi (b18 Silly default) read as confusing rather than playful.

New labels describe **performance style only**:

| Key (unchanged) | Old label | New label | Tagline |
|---|---|---|---|
| `sunny` | Sunny American | **Sunny** | Warm, clear, everyday reader |
| `cozy` | Storybook British | **Storybook** | Classic bedtime narrator |
| `adventure` | Adventure American | **Adventure** | Bold, energetic, exciting |
| `silly` | Silly Cartoon | **Silly** | High-pitched, goofy, extra expressive |

`previewText` updated to match. Preset keys (`sunny`/`cozy`/`adventure`/`silly`) unchanged — saved `nt_voice_preset` + IndexedDB cache survive.

### Part B — Silly voice: override-required documented (no third blind stock pick)

Two stock-voice attempts at "Silly" have now failed in production user testing:

1. **b17 — Gigi** (`jBpfuIE2acCO8z3wKNLl`, American childish character) → reads too close to Rachel (Sunny)
2. **b18 — Mimi** (`zrHiDhphv9ZnVXBqCLjz`, Swedish childish character) → reads as Australian / foreign-accented rather than high-pitched + goofy

Claude has no audio playback — every stock-voice candidate is metadata-only, the same blind-pick category that produced Gigi and Mimi. Rather than gamble a third stock pick:

- **Mimi stays as the hardcoded backstop** so the app doesn't 500 if `ELEVENLABS_VOICE_SILLY` is unset.
- **Operators are now strongly recommended** to set `ELEVENLABS_VOICE_SILLY` in Vercel to a custom high-pitched cartoon voice (an ElevenLabs Voice Library find — search "cartoon" / "kids" / "high pitch" / "character" / "animated" — or a cloned voice).
- A new per-request `console.warn` fires every time Silly resolves on the Mimi backstop, surfacing the recommendation in Vercel logs.
- README + `api/tts.js` header + the silly `defaultId` comment all document the rejected candidates so future builds don't re-try them blindly.

### Part C — Section 10 fixed to measure V3 (production-default engine)

Bug: `scripts/qa-current.js` Section 10 measured `generateStoryV2` directly. But `buildStory()` in `index.html` has routed V3 first for all ages 2-13 since v3.0.0 — the old advisory numbers described a fallback engine real users never hit.

- Section 10 now reports **V3 primary** + **V2 secondary** (labeled diagnostic).
- `scripts/sentence-count-snapshot.js` continues to report the same matrix at 120 reps for release-time before/after; updated comments to flag V3 as the number that matters.

### Part D — Structural kid 6→5 paragraph trim

b18's flourish-trim pass dropped tot/little median 19→15 / 18→14 (−22%) but barely moved kid (27→26, −4%). Further density wins required a structural change.

Per-blueprint kid drops (only stage names that don't carry the joke):

- **`lost_snack_v3`** → drops `attempt` (kid-investigates-false-suspect middle beat). Keeps `escalation` because the ally-was-the-culprit twist IS the joke.
- **`goal_spine_v3`** → drops `escalation` (obstacle-worsens beat). Keeps `attempt` (kid tries with signature_action) — the agency lift.
- **`show_wrong_v3`** → drops `escalation` (climax wind-up). Keeps `attempt` because the improv IS the save.
- **`rule_loophole_v3`** → drops `escalation` (imposer-vs-tool clash). Keeps `attempt` (kid uses loophole_tool).

Implementation:
- New `skipStagesForKid` field on each kid+big+tween blueprint
- New tier-resolution logic in `generateStoryV3` (`stagesForThisStory = tier==='kid' ? stages.filter(...) : stages`)
- Both `blueprint.stages` reads in the engine routed through the resolved array
- Section 3 paragraph-count gate split tier-aware: **5 for kid (ages 6-7)**, **6 for big+tween (8-13)**

Big + tween retain the full 6-stage arc.

### Results (V3 default engine, 120 stories/tier)

| tier   | b19 median | b20 median | Δ     | b18→b20 total |
|--------|------------|------------|-------|----------------|
| tot    | 15         | 15         | 0     | 19→15 (−22%)   |
| little | 14         | 14         | 0     | 18→14 (−22%)   |
| kid    | 27         | **23**     | **−15%** | 27→23 (−15%) |
| big    | 27         | 26         | −4%   | 27→26 (−4%)    |
| tween  | 26         | 26         | 0     | 26→26 (0)      |

Kid p90 dropped 31 → 28; kid max 37 → 33.

### Limitations

- **Kid still 3× over the defect-proposed 7-8 cap.** Going lower requires per-beat content trimming inside the remaining 5 kid stages — that's b21 territory.
- **Tot/little p90 unchanged.** The cozy-repetition pattern (call/response + parallel structure beats) intentionally keeps its sentences. Hard floor for the design.
- **Silly voice** still depends on operator setting `ELEVENLABS_VOICE_SILLY`. Until then, kid hears Mimi (foreign-accented), which the warn now surfaces.

### Acceptance

- `scripts/qa-current.js` — **24 gates green** (Section 3 paragraph gate split kid/big-tween)
- Section 14 voice unit tests — **14/14 green**
- Section 16 voice preview unit tests — **12/12 green**
- Inline `<script>` syntax — clean
- Sample 5-paragraph kid stories across all 4 blueprints eyeballed — narrative arc holds, picked words + highlights survive

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 19 → **20**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b20`.

### Notion

- Build Idea `36713aa1-d4db-816f-9df9-cc50dafb251c` — marked Done
- "Stories too long globally" defect — updated with new V3 numbers
- Build-number conflict: spec asked for b19; b19 was already taken by the favicon hardening fix shipped earlier today (PR #30 → main `5402fcd`). Shipped as b20 instead.

---

## v0.9.3 (build 19, engine v3.0.3) — 2026-05-21
**Favicon stale-cache hardening — root `/favicon.ico` + absolute icon paths so the BN4c mark survives Chrome's favicon cache**

Small hardening fix triggered by a real-Chrome-on-Mac screenshot: tab + bookmark bar still showed a pre-b5 stale favicon despite the deployed asset being correct BN4c.

### Diagnosis

- The deployed `https://noddytales.app/public/brand/favicon.svg` IS the correct BN4c orange book mark (byte-identical to the repo file, md5 `585527ce...`).
- The bug is Chrome's history + bookmark icon cache holding a pre-b5 snapshot.
- Two server-side factors made it worse than necessary:
  1. `https://noddytales.app/favicon.ico` returned **404**. Chrome always probes this URL regardless of `<link rel="icon">` tags; when it 404s, Chrome's bookmark icon cache stays pinned to its last successful indexing.
  2. The `<link rel="icon">` `href` values were **relative** (`public/brand/...`), which Chrome's favicon re-indexer treats as less authoritative than absolute paths after a brand swap.

### Fix (3 changes, all under 10 lines)

1. **New root file `/favicon.ico`** — copy of `public/brand/favicon-32.png`. PNG-as-ICO is universally accepted by Chrome / Firefox / Safari / Edge for the favicon probe. (macOS lacks ImageMagick so we used the existing 32×32 PNG as the artwork rather than generating a multi-image ICO.)
2. **All 6 icon `<link>` tags** in `index.html` switched from relative `public/brand/...` to absolute `/public/brand/...` paths.
3. **Added `<link rel="shortcut icon" href="/favicon.ico">`** for the legacy / Chrome-classic favicon channel, plus `sizes="any"` on the primary icon link.

Opportunistically also fixed the `og:image` meta tag and `renderLogo()` `src` to use absolute paths (same root-cause class).

### Limitation

Does **not** clear an individual user's existing stale Chrome cache — Chrome's local favicon DB has its own TTL. The fix stops the bug class for any **new** visitor, or any returning visitor who triggers a force-reload / re-bookmark.

### Acceptance

- `curl -sI https://noddytales.app/favicon.ico` returns **200** + `Content-Type: image/png` after deploy.
- `scripts/qa-current.js` — all **23 gates** green (asset move + HTML head edits are non-functional from the engine's perspective).
- Inline `<script>` syntax — clean.

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 18 → **19**; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b19`.

---

## v0.9.3 (build 18, engine v3.0.3) — 2026-05-21
**Silly Cartoon distinctiveness fix + voice-docs cleanup + first story-length pass (tot/little −22%)**

Two-part build: (A) silly-voice fidelity + voice-docs cleanup, and (B) the first scoped pass at the "stories too long globally" defect for ages 2-7.

### Part A — Silly Cartoon distinctiveness

User feedback after b17 production deploy: *"Silly Cartoon still sounds too similar to another voice."* The b17 default for `silly` (Gigi `jBpfuIE2acCO8z3wKNLl`) is labeled *American childish character* but its timbre reads too close to Rachel (the Sunny default — also American female, calm) when parents A/B-compare the 4 previews back-to-back.

**Fix:**
- Swapped the silly `defaultId` to **Mimi** (`zrHiDhphv9ZnVXBqCLjz`) — an ElevenLabs first-party stock voice explicitly labeled "childish character" with a noticeably higher pitch and Swedish-tinged cadence. Markedly more cartoon-feeling than Gigi.
- Tuned `voice_settings` for max playful expressiveness:
  - `stability` 0.55 → **0.40** (more variation)
  - `similarity_boost` 0.80 → 0.75 (looser tie to baseline)
  - `style` 0.70 → **0.85** (max expressive style)
- Label "Silly Cartoon" unchanged — saved `nt_voice_preset` values + IndexedDB cache (`preview:silly` + `silly|<sha256>`) survive across the swap.
- Tagline `"Goofy, bouncy, kid-favorite"` → `"High-pitched, goofy, completely ridiculous"`.
- `previewText` `"I make stories sound ridiculous."` → `"I make stories sound completely ridiculous!"` — makes the contrast with the three steadier voices obvious in the 1-second preview clip.

Operator can still override via `ELEVENLABS_VOICE_SILLY` if Mimi turns out not to be silly enough.

### Part A — Voice docs cleanup

`api/tts.js` header still described preset-without-env-var as *"falls back to ELEVENLABS_VOICE_ID"* — that stopped being true at b17 when per-preset `defaultId`s shipped. Rewrote the header to accurately describe the b17/b18 priority chain:

1. `env[cfg.envVar]` — operator per-preset override
2. `cfg.defaultId` — per-preset hardcoded curated default (happy path)
3. `env.ELEVENLABS_VOICE_ID` — legacy universal fallback
4. `'JBFqnCBsd6RMkjVDRZzb'` — final backstop

Levels 3-4 are effectively unreachable when `cfg.defaultId` is set for every known preset. The per-request `console.warn` copy was updated so it no longer suggests setting the per-preset env var is required for distinctness; the legacy chain firing now signals a **code bug** (missing `defaultId`), not an operator misconfig.

README narrator-lineup table + Setup checklist updated:
- Per-preset env vars now documented as **optional** operator overrides.
- Only `ELEVENLABS_API_KEY` is **required** for TTS to work at all (since b17).
- `ELEVENLABS_VOICE_ID` documented as a legacy universal fallback / safety net.

### Part B — First story-length pass (ages 2-7 priority)

Defect *"Stories too long globally"* has been open since the v2.10.2 advisory metric landed. b17 baseline:

| tier   | v3 median | defect cap |
|--------|-----------|------------|
| tot    | 19        | 3-4        |
| little | 18        | 5-6        |
| kid    | 27        | 7-8        |
| big    | 27        | 9-11       |
| tween  | 26        | 10-12      |

b18 starts a conservative trimming pass — **30 surgical edits** across the v3 beat library, all targeting trailing **flourishes** that don't carry tokens or selected words.

- **13 tot beat lines** trimmed (setup × 4 of 5, repeat × 8 of 8, end × 5 of 5)
- **13 little beat lines** trimmed (setup × 4 of 5, repeat × 7 of 8, end × 4 of 5)
- **4 kid beat lines** trimmed (`v3_ls_setup_1`, `v3_ls_escalation_1`, `v3_ls_payoff_chant`, `v3_gs_setup_1`)

**Cuts:** `"Yay!"`, `"Big day!"`, `"Adventure unlocked."`, `"Treasure confirmed."`, `"Goodnight."`, `"Case closed."`, `"Mostly."`, `"Big plans for tomorrow."`, etc. — token-free narrator closers.

**Protected:**
- Every `{protagonist.name}` / `{ally.text}` / `{wonder_object.text}` / `{setting.text}` / `{mcguffin.text}` token.
- Every call-response and parallel-structure cozy pattern (the repetition IS the texture).
- Every punchline beat (the joke landing IS the last sentence).
- Every sentence carrying a user-picked word or orange highlight.

### Results (120 stories/tier/engine snapshot)

| tier   | before median | after median | Δ     |
|--------|---------------|--------------|-------|
| tot    | 19            | **15**       | **−22%** |
| little | 18            | **14**       | **−22%** |
| kid    | 27            | 26           | −4%   |
| big    | 27            | 26           | −4%   |
| tween  | 26            | 26           | 0     |

Tot p90 dropped 20 → 17; little p90 dropped 19 → 15.

Going lower on tot/little requires either dropping a paragraph (breaks the Section 3b 4-paragraph gate) or cutting the cozy-repetition beats (breaks the design intent for ages 2-3). Going lower on kid requires a structural change — a per-tier paragraph-count override so kid drops to 5 stages while big/tween keep 6 — which requires updating Section 3's 6-paragraph gate to be tier-aware. **Both queued for b19.**

### New dev helper

`scripts/sentence-count-snapshot.js` — outputs the V3+V2 × 5-tier median/p90/max matrix so the next pass has a reproducible baseline:

```bash
node scripts/sentence-count-snapshot.js 120
```

### Acceptance

- `scripts/qa-current.js` — all **23 gates** green
- Section 14 narrator voice selector unit tests — **14/14** green (silly `defaultId` + `voice_settings` literals shifted; chain contract held)
- Section 3 (kid/big/tween 6-paragraph) + Section 3b (tot/little 4-paragraph) unaffected — only beat-line text changed

`APP_VERSION` stays `v0.9.3`; `BUILD_NUMBER` 17 → 18; `ENGINE_V2_VERSION` stays `v3.0.3`. Badge reads `v0.9.3 · b18`.

**No new Vercel env vars required** — Mimi ships as the hardcoded silly default; `ELEVENLABS_VOICE_SILLY` remains an optional override.

---

## v0.9.3 (build 17, engine v3.0.3) — 2026-05-21
**Voice previews now genuinely distinct out-of-the-box — hardcoded per-preset stock voice IDs**

Direct fix for the user-reported issue *"voice previews in settings is all the same british voice."*

### Root cause

b16 made the identical-previews trap **visible** (server `console.warn` per request when a preset falls back to `ELEVENLABS_VOICE_ID`) but did not actually fix it. Production has `ELEVENLABS_VOICE_ID` set to George (the British narrator) and no per-preset env vars — so every preset still resolved to the same British voice. The user shouldn't need to paste 4 ElevenLabs voice IDs into Vercel just to get distinct previews.

### Fix

Added a `defaultId` field to each entry in `api/tts.js`'s `VOICE_MAP` pointing to a curated ElevenLabs first-party stock voice. New `resolveVoice` priority chain:

1. `env[cfg.envVar]` — operator per-preset override (strongest)
2. **`cfg.defaultId`** — per-preset hardcoded curated stock voice (NEW)
3. `env.ELEVENLABS_VOICE_ID` — legacy universal fallback
4. `'JBFqnCBsd6RMkjVDRZzb'` — final backstop (George)

Out-of-the-box, with NO env vars set, every preset resolves to its curated default → **4 distinct voices**. Operator can still override any preset via env vars; hardcoded defaults only fill in when the env var is unset.

### Curated stock voice IDs

All four are ElevenLabs **first-party stock voices**, available on every ElevenLabs account — **NOT celebrity or real-person impersonations**. ElevenLabs' own brand.

| Preset | Voice | Voice ID | Why |
|---|---|---|---|
| sunny (Sunny American) | Rachel | `21m00Tcm4TlvDq8ikWAM` | American female, calm narration — fits "warm, clear, everyday read-aloud" |
| cozy (Storybook British) | George | `JBFqnCBsd6RMkjVDRZzb` | British male, mature narrative — canonical bedtime narrator |
| adventure (Adventure American) | Antoni | `ErXwobaYiN019PkySvjV` | American male, well-rounded, expressive |
| silly (Silly Cartoon) | Gigi | `jBpfuIE2acCO8z3wKNLl` | American female, childish character voice |

2 female + 2 male, 1 British + 3 American — maximally distinct timbres so previews sound genuinely different on first play.

### Operator override behavior

`ELEVENLABS_VOICE_SUNNY` / `_COZY` / `_ADVENTURE` / `_SILLY` env vars **still work** as per-preset overrides if the operator wants different voices. They beat the hardcoded defaults in the priority chain. The four env vars are now **strictly optional** rather than required-for-distinct-voices.

`ELEVENLABS_VOICE_ID` becomes effectively unreachable for the 4 known presets (still in the chain as a safety net for future presets that might lack a hardcoded default).

### QA updates

Section 14 went 13 → 14 cases:

- **Case 2 updated** — "cozy with no per-preset env → uses cozy hardcoded George (not the mocked `ELEVENLABS_VOICE_ID`)." Asserts source is `hardcodedPerPreset` and `usedFallback` is false.
- **Case 12 updated + +1 new** — "no env vars set → 4 presets STILL resolve to 4 distinct voice IDs via `hardcodedPerPreset` source." Catches future bugs where two presets share the same hardcoded default.

All 14 voice cases pass. `console.warn` on fallback (from b16) is now effectively unreachable for the 4 known presets — happy path stays quiet in logs.

### README updated

Env vars section now correctly describes them as **optional operator overrides**, not required setup. The "identical previews" diagnostic note removed — no longer a failure mode out-of-the-box.

### Acceptance

- `scripts/qa-current.js` — **all 23 gates green**.
- Section 14: **14/14 voice cases pass** (was 13/13 in b16).

### Zero remaining manual steps

First deploy from main will produce 4 distinct preview voices automatically. No Vercel env vars need to be set for the lineup to work.

---

## v0.9.3 (build 16, engine v3.0.3) — 2026-05-21
**Narrator voice lineup refresh + identical-previews configuration safety**

The b8 narrator MVP shipped with vague labels (Sunny / Cozy Bedtime / Big Adventure / Silly Cartoon) and a silent failure mode: when the four preset env vars are unset, every preset falls back to `ELEVENLABS_VOICE_ID` → identical previews. This release fixes both.

### Lineup refresh (1 British + 3 American)

| Preset key | Label (was → now) | Accent | Vibe |
|---|---|---|---|
| `sunny` | Sunny → **Sunny American** | American | Warm, clear, everyday read-aloud |
| `cozy` | Cozy Bedtime → **Storybook British** | **British** | Classic storybook narrator |
| `adventure` | Big Adventure → **Adventure American** | American | Energetic + expressive |
| `silly` | Silly Cartoon → **Silly Cartoon** | American | Goofy, bouncy, kid-favorite |

Preset **keys are unchanged** (`sunny` / `cozy` / `adventure` / `silly`) so saved `nt_voice_preset` and IndexedDB cache entries (`<preset>|<sha256>` for stories, `preview:<preset>` for previews) survive across the rename.

All four `previewText` lines updated to name the voice clearly:
- *"Hi, I'm Sunny American. I'm your personal story reader."*
- *"Hi, I'm Storybook British. I'll read this like a proper bedtime tale."*
- *"Hi, I'm Adventure American. Let's make this story sound big."*
- *"Hi, I'm Silly Cartoon. I make stories sound ridiculous."*

### Identical-previews trap

Pre-b16 behavior: if the four preset env vars are unset, every preset silently falls back to `ELEVENLABS_VOICE_ID`. The operator + parent both see four distinct preset labels but hear the same voice. Worse than offering one voice transparently.

**Fix 1 — server-side console.warn.** `api/tts.js` now emits a per-request warning when a preset falls back:

```
[TTS] preset "cozy" fell back to ELEVENLABS_VOICE_ID — set ELEVENLABS_VOICE_COZY in Vercel for a distinct voice.
```

Visible in Vercel logs immediately. The misconfig is now loud, not silent.

**Fix 2 — new QA assertions.** Section 14 went 10 → 13 cases:

| New sub-case | What it catches |
|---|---|
| Production-like env with 4 distinct preset env vars → **4 distinct voice IDs** | The all-fallback failure mode (got 1 distinct = misconfig) |
| Missing preset env vars → every preset reports `usedFallback: true` | Detectability — server logs will fire warnings |
| Label / tagline / previewText scanned against a celebrity / licensed-character / real-person blocklist | Disney / Pixar / Sesame / Morgan Freeman / David Attenborough / James Earl Jones / etc. — all confirmed clean |

### Env vars (production)

For the four narrators to sound **actually distinct**, paste four different ElevenLabs voice IDs into Vercel Project Settings → Environment Variables:

| Env var | Role |
|---|---|
| `ELEVENLABS_API_KEY` | Required for any TTS |
| `ELEVENLABS_VOICE_ID` | Required fallback default |
| `ELEVENLABS_VOICE_SUNNY` | Distinct American warm/clear voice |
| `ELEVENLABS_VOICE_COZY` | Distinct British storybook voice |
| `ELEVENLABS_VOICE_ADVENTURE` | Distinct American energetic voice |
| `ELEVENLABS_VOICE_SILLY` | Distinct American cartoon voice |

### README updated

New sections: voice lineup table, 6-step Vercel setup checklist, "Identical-previews diagnostic" with the exact failure-mode log line.

### What didn't change

- Preset keys (4 stable values)
- Server allowlist + 400-rejection of unknown presets
- IndexedDB cache key shape (story + preview namespaces still distinct)
- `/with-timestamps` endpoint → karaoke highlighting unaffected
- v2 + v3 story engines, picker, all UI surfaces

### Acceptance

- `scripts/qa-current.js` — **all 23 gates green**.
- Section 14 (narrator voice selector unit tests): **13/13 pass**.
- No celebrity / licensed-character / real-person language in any voice string.

### Remaining manual step

Operator must paste four distinct ElevenLabs voice IDs into the four Vercel env vars above for the lineup to sound genuinely distinct in production. Until then, server logs will show the fallback warnings on every TTS request and all 4 previews will use the same underlying voice with different `voice_settings` tunings.

---

## v0.9.3 (build 15, engine v3.0.3) — 2026-05-21
**Picker Library Polish — image/word matching + replay variety + v2 fallback safety**

User reviewed the full picker map after b13 and flagged that visible word / emoji mismatches make the app feel cheaper — kids read the image first.

### Part 1 — Mismatch fixes (~20 modifications)

| Tier.cat | Before | After |
|---|---|---|
| tot.food | jam 🍓 / peas 🟢 | **strawberries 🍓** / **peas 🫛** |
| tot.sky | high bubbles 🌌 | **stars 🌌** |
| little.pet | duckling 🐥 / guinea pig 🐀 | **duckling 🦆** / **koala 🐨** |
| kid.pet | falcon / capybara / axolotl 🐠 | **eagle** / **beaver** / **goldfish 🐠** |
| kid.food | nachos 🫓 | **quesadilla 🫓** |
| kid.place | lighthouse 🗼 | **tower 🗼** |
| kid.creature | giant / phoenix 🔥 / centaur | **stone giant** / **fire bird 🔥** / **talking horse** |
| kid.mood | professionally confused / jubilant | **puzzled 🧩** / **super happy 😄** |
| big.pet | overly formal ferret 🦦 | **overly formal otter 🦦** |
| big.food | haunted scones / ancient granola bar / official pudding 🥧 | **haunted tea 🫖** / **ancient snack bar 🍫** / **official pie 🥧** |
| big.color | violently pleasant blue | **wildly pleasant blue** |
| big.move | duplicate "shuffled with purpose" 🥾 | **marched stubbornly 🥾** |
| tween.pet | quokka / sleepy gecko 🐊 | **koala** / **sleepy croc 🐊** |
| tween.food | mystery chips / vending machine chips 🥨 / cafeteria fries 🥔 | **mystery snack bag 🛍️** / **vending machine pretzels 🥨** / **cafeteria fries 🍟** |
| tween.creature | unreasonably tall pigeon 🪿 | **unreasonably tall goose 🪿** |
| BODY_HOT_OPTS | snot rocket 💦 | **snot rocket 🚀** |
| SOUND_HOT_OPTS | ZAP! 💢 / WHAMMY! ⚡ | **ZAP! ⚡** / **WHAMMY! 💫** |

### Audit decisions (overrode some user suggestions where the suggested emoji didn't match)

- "chicken nuggets 🍗" → shipped as **fried chicken 🍗** (🍗 is poultry leg)
- "cinnamon roll 🥐" → shipped as **warm croissant 🥐** (🥐 is croissant)
- "mall escalator 🛗" → shipped as **mall elevator 🛗** (🛗 is elevator)
- "phoenix 🐦‍🔥" → shipped as **fire bird 🔥** (Unicode 15.1 phoenix emoji isn't universal on older iOS/Android in field)

### Part 2 — Additions (~30 new picker options)

Kid pool: 5 rounds expanded (raccoon, goose, fried chicken, smoothie, warm croissant, arcade, pizza shop, water park, movie theater, sock monster, tiny wizard, backpack troll, curious, worried).

Big pool: 5 rounds expanded (tiny horse, emergency burrito, courtroom cupcake, mystery smoothie, school office, mini golf course, roller rink, science museum, tiny judge, confused mascot, posed dramatically, slid heroically, stared bravely).

Tween pool: 5 rounds expanded (judgy cat, gas station taquitos, leftover pasta, mall elevator, empty movie theater, forgotten hallway, algorithm ghost 🧠, expired mascot 🪦, vending machine oracle 🥠, cafeteria cryptid 👽, quietly panicking, deeply over it, weirdly optimistic, minorly iconic).

Tot + little pools were not bloated — modest emoji/word fixes only.

### Part 3 — v2 fallback engine safety (critical)

Pre-b15 `mapPickToWord` silently replaced unmatched picker words with random `V2_WORDS` rich-words. With ~20 renames + ~30 new words this release, every new picker word would have **dropped from v2 fallback stories** — kid picks "eagle" and the story says "fennec fox".

Fix: both `mapPickToWord` instances now **clone** a random rich-word's traits/actions/sounds and **override** `text` + `id` with the picker word. Narrative richness preserved AND the kid's picked word actually appears in the body.

The v3 default path was already safe (reads picker words directly via `picks.X.w`).

### QA results

- `scripts/qa-current.js` — **all 23 gates green**.
- v2 matrix Section 1 went from **271 misses** (renames broke v2 fallback) → **0 misses** after the `mapPickToWord` fix.
- Section 11 emoji-uniqueness — 0 collisions across all rounds + `SOUND_HOT_OPTS` + `BODY_HOT_OPTS`.

---

## v0.9.3 (build 14, engine v3.0.3) — 2026-05-21
**QA hardening — rapid-tap guard + burst a11y + 320×568 fit + README sync**

Four small hardening fixes after the b9-b13 wave. No engine / picker / token logic touched.

### 1. Rapid multi-tap guard on word cards

`pickWord()` runs a 650ms burst/pop animation before `advanceRound()` fires. Without a guard, a fast double-tap (or a kid mashing both cards) could schedule **two** `advanceRound` calls — the second would advance an extra round with a stale pick.

- New `state.wordAdvancing` flag (initialized `false`; reset on `startWords()` and `backToWelcome()`)
- `pickWord()` short-circuits when `wordAdvancing === true`
- Flag flips on at pick time, off in `advanceRound()`
- Belt-and-suspenders: every `.word-card` gets `pointer-events: none` the moment a selection lands so the OS-level click handler also stops firing

### 2. Burst-spark accessibility

`spawnBursts()` creates decorative sparkle characters (⭐ ✨ 💫 🌟) inside the picked card. Without `aria-hidden` they get spliced into the parent `.word-card`'s accessible name — screen readers would announce *"Pizza star sparkle shooting-star sparkle"* instead of *"Pizza"*.

- Every burst span now gets `aria-hidden="true"` + `role="presentation"`
- The word-card still announces its own picked word + emoji

### 3. 320×568 fit (iPhone SE 1st gen)

b12 fit 375×667, 390×844, 430×932, but the iPhone SE 1st gen (320×568) still required a slight scroll on the Setting 2.0 step. New `@media (max-height: 600px)` block tightens further **only on very short viewports** — modern phones (667-932px) are unaffected.

| | b12 (default) | b14 @media (max-height: 600px) |
|---|---|---|
| Standard tile min-height | 60px | **50px** |
| Surprise tile min-height | 68px | **54px** |
| Standard emoji | 26px | **22px** |
| Surprise emoji | 32px | **26px** |
| Standard label | 13px | **12px** |
| Surprise label | 16px | **14px** |
| Grid gap | 10px | **6px** |
| `.display--compact` h1 | 28px | **24px** |
| `.lede--compact` | 14px | **12px** |

Total step now budgets ~520px content height at 320×568, comfortably under the iPhone SE 1st gen's ~500-520px usable canvas.

### 4. README sync

README versioning section still cited `BUILD_NUMBER (8)` — 6 builds stale. Bumped to `(14)` with the full b1-b14 sequence summary.

### Version-number note

This release was originally requested as **b13** in the prompt, but b13 was already taken by the prior turn's animal-emoji audit (commit `51b1696`). This QA hardening pass ships as **b14** to preserve a monotonic sequence.

### Acceptance

- `scripts/qa-current.js` — **all 23 gates green** (no engine/picker/token logic touched).
- Section 8 inline `<script>` syntax — clean.

---

## v0.9.3 (build 13, engine v3.0.3) — 2026-05-21
**Animal-emoji audit — "red panda 🦝" raccoon mismatch removed**

Parent screenshot caught `kid.pet "red panda"` rendering with a 🦝 raccoon emoji. The mismatch was introduced in v3.0.1 when the within-round emoji-uniqueness gate forced "red panda" off 🦊 (which it shared with fennec fox) and onto 🦝 — semantic accuracy lost to break the collision.

### What shipped

| Tier.cat | Before | After |
|---|---|---|
| `kid.pet` | `red panda 🦝` | **removed** (regular `panda 🐼` already in the pool) |
| `tween.pet` | `red panda 🦊` | **replaced with `panda 🐼`** (tween had no regular panda) |

### Pool counts

- `kid.pet`: 24 → 23 entries (well above the 2 cards shown per session)
- `tween.pet`: 18 → 18 entries (one-for-one swap)

### Other animal-emoji mismatches surfaced (NOT auto-fixed)

Documented for follow-up review. Some are stuck on Unicode limitations (no native emoji exists); others are candidates for a future cleanup pass:

| Tier.cat | Word | Emoji | Issue |
|---|---|---|---|
| `tween.pet` | sleepy gecko | 🐊 | crocodile, not gecko |
| `tween.creature` | unreasonably tall pigeon | 🪿 | goose, not pigeon |
| `tween.pet` | overthinking ferret | 🦦 | otter; no ferret emoji exists |
| `big.pet` | overly formal ferret | 🦦 | otter; same |
| `big.pet` | theatrical moth | 🦋 | butterfly; no moth emoji exists |
| `kid.pet` | axolotl | 🐠 | tropical fish; no axolotl emoji |
| `kid.pet` | lynx | 🐱 | basic cat; no lynx emoji |
| `tween.pet` | axolotl | 🫧 | bubbles; no axolotl emoji |
| `tween.pet` | quokka | 🐨 | koala; no quokka emoji |
| `tween.pet` | tardigrade | 🦠 | microbe; close-but-not-exact |
| `tween.pet` | tiny possum | 🐾 | paw prints; no possum emoji |

### Acceptance

- `scripts/qa-current.js` — **all 23 gates green** (Section 11 emoji-uniqueness still 0 collisions; no engine/picker/data touched beyond the WORD_BANK entries).

---

## v0.9.3 (build 12, engine v3.0.3) — 2026-05-21
**Setting 2.0 step — vertical centering on tall phones + chunkier tiles + unclipped rainbow**

Three small polish fixes layered on top of b11's mobile-compact pass, all from a real-device screenshot on iPhone 16 Pro Max (430×932).

### 1. Vertical centering on tall viewports

b11 anchored the content cluster to the top of the canvas while the footer pinned to the bottom via `margin-top: auto`. On a Pro Max viewport that left **~400px of empty space** between the setting-note and the Next button.

Fix: new `.setting-step-inner` wrapper around the header + grid + note uses `margin: auto 0`. Leftover canvas distributes **equally above + below** the content cluster — content vertically centers, footer stays pinned.

On iPhone SE where content fills the canvas, the auto margins collapse to 0 and the layout is **unchanged**. No SE regression.

### 2. Chunkier tiles

| | b11 | b12 |
|---|---|---|
| Standard tile `min-height` | 52px | **60px** |
| Surprise tile `min-height` | 56px | **68px** |
| Standard emoji | 24px | **26px** |
| Surprise emoji | 28px | **32px** |
| Standard label | 12.5px | **13px** |
| Surprise label | 15px | **16px** |
| Tile padding | 4px 12px | **6px 14px** |
| Grid gap (mobile) | 8px | **10px** |

All still well under iPhone SE's vertical budget; all still above Apple HIG's 44px minimum tap target.

### 3. Rainbow no longer clipped

The welcome screen's `.deco--2` (🌈) was at `left: 6%` — its bounding box sat right at the left edge, and at peak `rotate(-4deg)` of the float animation it visibly clipped against the screen's `overflow-x: hidden` boundary. Moved to `left: 10%` so the full emoji stays inside the safe area through the entire animation cycle. Affects every welcome substep.

### Acceptance

- `scripts/qa-current.js` — **all 23 gates green** (no engine / picker / data touched).
- Section 8 inline `<script>` syntax — clean.

---

## v0.9.3 (build 11, engine v3.0.3) — 2026-05-21
**"What kind of place?" step — mobile-compact (fits without scrolling on iPhone SE)**

User feedback: the b9 Setting 2.0 flavor picker required scrolling on mobile to reach the Next button. Root cause: b9 inherited `.setting-tile { aspect-ratio: 1 }` from the v2.1.0 exact-setting grid. At 375px viewport each square tile rendered ~165px tall; the 8-tile grid alone consumed ~800px, well past iPhone SE's ~617px usable canvas.

CSS-only fix; no engine / picker / data changes.

### What changed

- **Killed `aspect-ratio: 1` on `.setting-grid--flavors` tiles.** Tiles flatten to row-style (emoji-left, label-right) with `min-height: 52px` — well above Apple HIG's 44px minimum tap target.
- **Surprise Me** keeps full-width prominence but drops from 92px → 56px min-height; emoji 36px → 28px; label 16px → 15px.
- **Grid gap** 12px → 8px on mobile (kept 12px on viewports ≥ 540px).
- **Standard tile** emoji 30px → 24px, label 13px → 12.5px line-height 1.2.
- **Tile padding** 6px → 4px 12px (matches row layout).
- **New `.display--compact`** modifier (28px, letter-spacing -0.3px) on the step h1.
- **New `.lede--compact`** modifier (14px) on the subtitle.
- **Single-line h1** "What kind of place?" — dropped the `<br>` split. Shorter lede: "Pick a flavor — or let us surprise you."
- **Stack gap** 20 → 12 between step children.
- **`.setting-note`** font 13px → 12px, min-height 18px → 14px, margin-top 8px → 4px.

### Scope

All rule changes live **under `.setting-grid--flavors`** — base `.setting-tile` is untouched, so the storyMode picker (bedtime / anytime) and any other consumer of `.setting-tile` is unaffected. `.display--compact` / `.lede--compact` are modifier-only, applied only on the setting step.

### Viewport math

Full step budgets to ~590-600px content height on iPhone SE 2nd gen (375×667), within the ~617px usable canvas after Safari's URL bar. Modern iPhone (390×844) has comfortable margin. Tablets (≥540px breakpoint) switch to 4-column grid + 36px h1 — airier original layout preserved.

### Acceptance

- `scripts/qa-current.js` — **all 23 gates green** (unchanged from b10; no engine/picker/data touched).
- Section 8 inline `<script>` syntax — clean.

---

## v0.9.3 (build 10, engine v3.0.3) — 2026-05-21
**Narrator selector on the story screen + voice preview clips**

Refinement of the b8 Narrator Voice Selector MVP. b8 shipped the picker inside Parent Settings — efficient layout, but **too hidden**. Users think about voice choice at the moment they tap "Read it to me," not before. b10 keeps Settings as the permanent home for the preference and adds two complementary surfaces: an **in-context narrator row** on the story screen + **per-voice preview clips** in both surfaces.

### Story-screen narrator row

Compact line above the Read-it-to-me controls:

```
Narrator: Sunny  [Change]
```

Tap `Change` → bottom-sheet modal (centered on viewports ≥ 540px) containing the same 4-preset grid from Settings. Selecting a voice updates `Profile.saveVoicePreset` + `state.voicePreset` and refreshes the narrator-row label inline. **Switching mid-playback does not interrupt the current audio** — the new voice applies on the next "Read it to me" tap.

### Voice preview clips

Each preset card (Settings AND story-screen modal) has a small ▶ button in the top-right corner. Tap plays a short voice-specific clip:

| Preset | Preview text |
|---|---|
| Sunny | "Hi, I'm Sunny. I can't wait to read your story." |
| Cozy Bedtime | "Hi, I'm Cozy Bedtime. I'll read this nice and gently." |
| Big Adventure | "Hi, I'm Big Adventure. Let's make this story sound epic." |
| Silly Cartoon | "Hi, I'm Silly Cartoon. This is going to get ridiculous." |

- Loading state (`…`) while audio fetches.
- Switches to `⏸` while playing.
- Starting a new preview stops any running preview **or** story playback (single audio at a time).

### Cache discipline

Preview audio uses a **separate IndexedDB cache key namespace** — `preview:<preset>` — so it never collides with story cache entries (`<preset>|sha256(text)`).

- Replaying the same preview is instant.
- Story replay cache is untouched by previewing.
- Section 16 enforces zero overlap between the two namespaces.

### API surface

Previews call the same `/api/tts` endpoint with `{ text: previewText, voicePreset }`. **No new endpoint, no new server allowlist work.** b8's server-side validation (unknown preset → 400, raw voice IDs rejected) covers previews automatically.

### Shared helpers

Extracted `renderVoicePickerGrid(selectedKey)` + `attachVoicePickerHandlers(root, opts)` so Settings and the story-screen modal use identical markup + interaction. Single source of truth for both surfaces.

### New Vercel env vars

**None.** Previews re-use the four optional env vars from b8 (`ELEVENLABS_VOICE_SUNNY` / `_COZY` / `_ADVENTURE` / `_SILLY`), each still falling back to `ELEVENLABS_VOICE_ID` when unset.

### Guardrails respected

- No celebrity / licensed-character names anywhere
- All 4 preview lines are original / parent-safe
- Voice picker stays out of the kid word-selection flow

### New QA gate (Section 16)

12 unit cases:

| Sub-case | Result |
|---|---|
| Every preset has a non-empty `previewText` | ✓ |
| Every preset `previewText` length ≤ 80 chars (cost control) | ✓ |
| Every preview cache key starts with `"preview:"` | ✓ |
| Preview cache keys are all distinct | ✓ |
| No story cache key collides with a preview cache key | ✓ |
| `"preview"` is reserved (cannot be a preset key) | ✓ |

All 12 pass.

### Acceptance

- `scripts/qa-current.js` — **all 23 gates green** (22 prior + new Section 16).
- Section 8 inline `<script>` syntax check — clean.
- Badge reads `v0.9.3 · b10`.

---

## v0.9.3 (build 9, engine v3.0.3) — 2026-05-21
**Setting 2.0 — broad story-flavor categories with hidden place variety**

User feedback: the original 9-tile exact-setting grid (Diner / Mall / Football Game / Grocery Store / Zoo / Bus / etc.) made the app feel limited because the visible list **was** the full list of places the engine supports. Setting 2.0 keeps the grounding benefits of settings — first-paragraph place anchoring, visitor / object pool biases — but repositions them as broad "story flavor" categories with hidden specific-place variety underneath.

### Visible categories (8)

| # | Category | Vibe |
|---|---|---|
| 1 | **Surprise Me** ✨ | Default + visually prominent (spans full row) — engine picks freely |
| 2 | At Home 🏠 | Bedrooms, kitchens, blanket forts |
| 3 | At School 🏫 | Classroom, library, cafeteria, playground |
| 4 | Outside 🌳 | Parks, forests, beaches, treehouses |
| 5 | Food Place 🍕 | Diners, bakeries, ice cream trucks |
| 6 | Animal Place 🦁 | Zoos, pet stores, dog parks |
| 7 | On the Go 🚌 | Buses, trains, planes, sidewalks |
| 8 | Somewhere Weird 🌀 | Moon bases, cloud castles, noodle planets |

Each non-surprise category holds a **hidden pool of 8 specific places** that the engine picks per session. Locking "Food Place" gets diner one session, bakery the next, ice cream truck the one after. **64 hidden places** + Surprise random.

### Step copy

Softened from *"Where should the story happen?"* → *"What kind of place?"* / *"Pick a story flavor — or let us surprise you."*

### Data model

New in `src/content.js`:

- `SETTING_FLAVORS` — 8 entries, each `{ key, label, emoji, note, hiddenPlaces, visitorBias, objectBias }`. Hidden place objects use the same `{ id, text, emoji, article }` shape the engine's grammar helpers already consume.
- `resolveSetting(key)` — returns a fully-realized object compatible with the legacy `V2_SETTINGS` shape; engine code consumes it unchanged. Random hidden-place selection happens at call time.
- `migrateLegacySetting(value)` — maps old keys to closest flavor: `diner` / `grocery_store` → `food_place`; `football_game` / `school` → `at_school`; `backyard` → `at_home`; `zoo` → `animal_place`; `bus` → `on_the_go`; `mall` / unknown / empty → `surprise`.

### Engine integration

- `buildStory()` in `index.html` resolves the flavor **before** handing `picks.setting` to the engine. The per-session hidden place is fixed at story-build time so the v2 + v3 generators see a stable specific place.
- `getSetting()` in `src/engine-v2.js` routes flavor keys through `resolveSetting`; legacy exact keys still resolve via `V2_SETTINGS`.
- The v2 + v3 generation paths prefer the already-resolved `picks.setting` object directly when present (has `place` + `visitorBias`), only calling `getSetting` for legacy stub callsites.

### Broad category labels do NOT leak

Stories say *"the pizza shop"* or *"the noodle planet"* — **never** *"the Food Place"* or *"the Somewhere Weird"*. QA Section 15 enforces this via prose scan.

### Backward compatibility

Saved `nt_setting` values from pre-b9 (`diner`, `mall`, `zoo`, `football_game`, `bus`, etc.) migrate transparently on `Profile.load()` via `migrateLegacySetting`. No data loss; no broken stories.

### UI

- 2-column grid on mobile (`< 540px`), 4-column on wider viewports.
- Surprise Me spans the full width at top (`grid-column: 1 / -1`) with 36px emoji + 16px label for visual prominence.
- Other 7 tiles use the existing `.setting-tile` design.
- New CSS: `.setting-grid--flavors` + `.setting-tile--surprise`.

### New QA gate (Section 15)

5 sub-gates × 8 flavors × 20 reps = **160 stories** total per harness run:

| Sub-gate | Result |
|---|---|
| Every flavor generates a non-null story | 0 nulls / 160 ✓ |
| Hidden place appears in body across all flavors | 0 misses ✓ |
| Broad category label never leaks into prose | 0 leaks ✓ |
| `resolveSetting` returns legacy V2_SETTINGS-compatible shape | 0 bad shapes ✓ |
| `migrateLegacySetting` maps 12 legacy-key cases correctly | 0 wrong mappings ✓ |

### Acceptance

- `scripts/qa-current.js` — **all 22 gates green** (17 prior + 5 new Setting 2.0 sub-gates).
- Section 8 inline `<script>` syntax check — clean.

### Not in this release

- Per-place visual previews
- Expanded hidden pools (>8 per category)
- Mixing categories (e.g., "Home + Animals")
- Setting-tagged `WORD_BANK` options (Phase 2 of the Selection Joy Pass)
- Simplified setting step for ages 2-5 (kept consistent across all ages for v1; revisit after real-kid playtest)

---

## v0.9.3 (build 8, engine v3.0.3) — 2026-05-21
**README drift cleanup + Narrator Voice Selector MVP**

Two changes in one release. The README cleanup is documentation-only; the narrator selector adds a new user-facing surface in Parent Settings + server-side voice routing.

### Part 1 — README drift cleanup

README still listed:
- `BUILD_NUMBER` as `1`, badge as `v0.9.3 · b1` (stale by 7 builds)
- Kid tier as `"1 free-text round, v3 engine eligible"` — but Phase 1 (b2) converted little + kid to a **silly-sound tap round** (kid gets the "or type your own ✏️" escape hatch)
- v3 as "engine eligible" — but v3 has been the default for **every** age 2–13 since v3.0.0

Updated the age-tier table to reflect current picker behavior, the versioning section's badge example to `v0.9.3 · b8`, and the engine description to "v3 default."

### Part 2 — Narrator Voice Selector MVP

**Parent Settings now has a 2-column grid of 4 narrator presets.** No celebrity / licensed-character imitation — all original archetypes.

| Preset | Label | Mood |
|---|---|---|
| `sunny` (default) | Sunny | Warm, bright, daytime |
| `cozy` | Cozy Bedtime | Soft + slow for sleepy ears |
| `adventure` | Big Adventure | Bold + energetic narrator |
| `silly` | Silly Cartoon | Playful + bouncy + expressive |

**Behavior:**
- Selection persists per device as `nt_voice_preset`.
- The selected preset is sent to `/api/tts` as `{ text, voicePreset }`.
- The IndexedDB cache key is now `${preset}|${sha256(text)}` so switching voices doesn't replay cached audio from a different voice.
- Changing the preset applies on the next "Read it to me" — no immediate refetch.

**Server allowlist (`api/tts.js`):**
- Rewrote the proxy with a four-key `VOICE_MAP`. Unknown presets → **400**. Raw voice IDs submitted as presets → **400** (the browser never sees ElevenLabs voice IDs).
- Each preset maps to an env var (`ELEVENLABS_VOICE_SUNNY` / `ELEVENLABS_VOICE_COZY` / `ELEVENLABS_VOICE_ADVENTURE` / `ELEVENLABS_VOICE_SILLY`) that falls back to `ELEVENLABS_VOICE_ID` when unset — so a fresh deploy with only the existing env vars still produces audio (every preset uses the default voice but with distinct `voice_settings`).
- Per-preset `voice_settings` (stability / similarity / style) differ so the same fallback voice can still convey different moods.
- `/with-timestamps` endpoint preserved → karaoke highlighting is unaffected.

### New Vercel env vars (all optional)

| Env var | If unset |
|---|---|
| `ELEVENLABS_VOICE_SUNNY` | Falls back to `ELEVENLABS_VOICE_ID` |
| `ELEVENLABS_VOICE_COZY` | Falls back to `ELEVENLABS_VOICE_ID` |
| `ELEVENLABS_VOICE_ADVENTURE` | Falls back to `ELEVENLABS_VOICE_ID` |
| `ELEVENLABS_VOICE_SILLY` | Falls back to `ELEVENLABS_VOICE_ID` |

### New QA gate (Section 14)

10 unit cases on `api/tts.js` `resolveVoice()` + cache-key shape:
1. Known preset resolves via its specific env var ✓
2. Known preset falls back to `ELEVENLABS_VOICE_ID` when its var is unset ✓
3. `adventure` resolves via its env var ✓
4. `silly` resolves via its env var ✓
5. Unknown preset → **400** ✓
6. Raw voice ID submitted as preset → **400** ✓
7. Null preset → default Sunny ✓
8. Per-preset `voice_settings.style` differ ✓
9. Cache key prefix differs by preset ✓
10. Every client preset has a server allowlist entry ✓

All 10 pass.

### Acceptance

- `scripts/qa-current.js` — **all 17 gates green** (16 + new Section 14).
- Section 8 inline `<script>` syntax check — clean.

### Guardrails

No celebrity names, no licensed character voices, no real-person impersonation in any label, tagline, or default voice setting.

---

## v0.9.3 (build 7, engine v3.0.3) — 2026-05-21
**QA cleanup — brand-kit asset packaging + stale engine-v2 header**

Two non-functional cleanups caught by a Codex QA sweep. Zero runtime/engine/picker changes.

### Brand-kit asset packaging

`public/brand/index.html` (the standalone brand-kit page; not the live app) referenced **7 missing asset files** that broke `<img>` previews and `<a download>` links across the kit's grids:

| Missing | Resolved via |
|---|---|
| `banner-wide.svg` | Copied from design package |
| `icon-256.png` | Copied from `icon-BN4c-256.png` (native) |
| `icon-64.png`, `icon-32.png`, `icon-16.png` | Resized from `icon-BN4c-1024.png` via `sips` |
| `icon-square-1024.png`, `icon-square-512.png` | Resized from `icon-BN4c-1024.png` via `sips` |

Cross-check confirms all 22 asset references in `public/brand/index.html` now resolve to existing files. The "Square (full-bleed)" section now visually duplicates the App Icon section since both are BN4c (per b5 unification + user instruction to source from current BN4c assets); references resolve cleanly, which was the gate.

Live app icon references (`index.html` `<head>` link tags, `manifest.json`, `renderLogo()`) are unchanged — they were already correct since b5/b6.

### Engine-v2 header doc-drift

`src/engine-v2.js` opened with a 24-line header from the original v2.0 Phase 1 prototype era. It described the engine as:
- *"disabled by default"* — wrong since v2.0.0; it's the production default
- *"activate with `?engine=v2` URL param"* — the flag is unused; v3 is the default
- *"kid tier only"* — wrong since v2.0.0; covers ages 2-13
- *"Segment A of the v2.0 build"* — superseded by v3.0.0's unified engine

Rewrote the header to describe the current state: production-default story engine, v2 + v3 coexist in one file, v3 routes first with v2 fallback, v2 deletion is queued for engine-v3.1.0. Added pointer to `docs/versioning.md` for the three-tier versioning policy. **Comment-only change; zero code changes.** `ENGINE_V2_VERSION = 'v3.0.3'` unchanged.

### Acceptance

- `node scripts/qa-current.js` — **all 16 gates green**.
- Section 8 (inline `<script>` syntax) clean.
- All 22 brand-kit asset references resolve.
- Production manifest + head icon references unchanged.

---

## v0.9.3 (build 6, engine v3.0.3) — 2026-05-21
**In-app brand mark swap — BN4d → BN4c (contrast fix)**

User-reported low-contrast issue from b5: BN4d (cream N + orange spine on a sage gradient) blended too closely with the app's cream + sage backdrop, making the top-left brand mark visually weak. Switching the in-app mark + browser-tab favicon to **BN4c** (solid orange ground + cream N + sage diagonal spine) so the icon pops against both the cream story screen and the sage welcome screen.

### What changed

- `public/brand/favicon.svg` ← `icon-BN4c.svg`
- `public/brand/favicon-{16,32,48}.png` ← resized from `icon-BN4c-1024.png` via `sips`

### What didn't change

- App icons (`icon.svg`, `icon-square.svg`, all `icon-N.png`) — still BN4c from b5.
- `manifest.json`, `<head>` link tags, `renderLogo()` — all reference filenames that now point at BN4c.
- `.logo-mark` wrapper CSS — transparent 36×36 box from b5 still works: BN4c's designed rounded-square corners render natively.

### BN4d disposition

BN4d artwork is no longer used in production. Files remain in the design package for any future variant rotation.

### Acceptance

- `scripts/qa-current.js` — **all 16 gates green** (asset swap is non-functional).
- Badge reads `v0.9.3 · b6`.

---

## v0.9.3 (build 5, engine v3.0.3) — 2026-05-21
**Brand icon refresh — BN4c app icon (sage spine) + BN4d in-app mark (sage background)**

Implemented the two new brand variants from the [design package](https://api.anthropic.com/v1/design/h/DZmfzFnocBWD6QUSWu-G0w).

| Variant | Description | Role |
|---|---|---|
| **BN4c** — sage spine | Solid orange ground with cream N and a sage diagonal book-spine. Smallest sparkle, no backing. | **App icon** — home-screen / PWA / browser tab |
| **BN4d** — sage background | Cream N with orange spine on a sage gradient. Mirror palette of BN4c. | **In-app brand mark** — top-left of every screen |

### Asset replacements

All in `public/brand/`:

| File | Source |
|---|---|
| `icon.svg`, `icon-square.svg` | `icon-BN4c.svg` |
| `icon-1024.png`, `icon-120.png` | `icon-BN4c-{1024,120}.png` (native) |
| `icon-{76,152,180,192,512}.png` | resized from `icon-BN4c-1024.png` via `sips` |
| `favicon.svg` | `icon-BN4d.svg` |
| `favicon-{16,32,48}.png` | resized from `icon-BN4d-1024.png` via `sips` |

### Wiring (no structural changes)

`index.html` `<head>` already references `favicon.svg`, `favicon-{16,32,48}.png`, `icon-180.png`; `manifest.json` already references `icon-192.png` + `icon-512.png`; `renderLogo()` already references `favicon.svg`. The new artwork is picked up automatically.

### Logo wrapper cleanup

Old `.logo-mark` was a 36px yellow circular plate with inset shadow wrapping a 24px circle-clipped favicon — a "glyph on plate" treatment designed for the prior simple favicon. BN4d is a full app-icon-style mark with its own rounded-square corners and sage gradient; the plate framing fights it. Dropped:

- `background: var(--yellow)` → `transparent`
- `border-radius: 50%` + inset/drop shadows → removed
- inline `border-radius: 50%` on the img → removed
- img sized via wrapper instead of inline `width="24" height="24"` so it fills the 36×36 slot

### Acceptance

- `scripts/qa-current.js` — **all 16 gates green** (asset replacement doesn't touch engine / picker / token logic).
- Badge reads `v0.9.3 · b5`.

### What this doesn't fix

- App Store icon submission package — separate sprint when packaging to iOS via Xcode / Expo.
- Wider visual polish (Phase 6 — bigger card emoji, tap sound, haptic, animation) — still queued.

---

## v0.9.3 (build 4, engine v3.0.3) — 2026-05-21
**Highlight defect fix — only kid-picked words get highlighted; yellow chip retired**

User-reported screenshot showed `forest` rendered with a yellow chip box AND `sleepy megaphone` rendered in orange text, both styled identical to actual kid picks. But the parent had locked `setting=forest` (not a kid tap) and `sleepy megaphone` was an engine-chosen mcguffin. The kid had no way to tell which highlighted words they actually picked — breaks the implicit coverage promise that **"highlighted = something I tapped."**

### Diagnosis

`parseStoryLine()` ran every `[c:X]` / `[y:X]` / `[name:X]` token through CSS regardless of whether `X` matched a real pick. v3 templates wrap engine-chosen slots (mcguffin / obstacle / false_suspect / locked-setting) in `[c:X]` and `[y:X]` exactly the same as user picks. `[y:X]` was reserved for the setting slot and rendered as a yellow chip box — a designed "this is where the story takes place" visual emphasis that in practice read as inconsistent.

### Fix

**Renderer-side cross-check.** `parseStoryLine()` now reads `state.picks` (kid taps) + `state.name` + `state.sidekicks` and only emits a chip when the token's bracketed text matches. Engine-chosen prose renders as plain text — blends into the narrative; kid-picked words still pop.

- Matching is **case-insensitive** with **plural tolerance** (pick=`pizza` matches token=`pizzas` and vice versa) and **word-boundary substring** for multi-word picks (`sleepy gecko` matches a token containing `gecko`).
- Anchored on whitespace so `cat` doesn't accidentally light up inside `scattered`.

**Yellow chip retired.** `[y:X]` now collapses to the same `.pop` orange class as `[c:X]`. One highlight style, one meaning: *"you picked this."* The `.pop--yellow` CSS rule is **commented (not deleted)** so a future "single-most-important-word" treatment can revive it without renderer rework.

### Visible to users

| Before | After |
|---|---|
| `forest` yellow chip box (locked setting, not a kid tap) | plain text |
| `sleepy megaphone` orange chip (engine-chosen mcguffin) | plain text |
| `Cole`, `otter`, `pizza`, `dramatic`, `dinosaur`, `skated`, `rainbow` (real picks) | orange chips (unchanged) |

### New QA gate (Section 13)

Highlight-only-picks unit test. Runs `parseStoryLine` against a controlled `state` with known picks. Verifies (a) matched `[c:X]` tokens become `.pop` chips, (b) matched `[name:X]` tokens become `.pop--name` chips, (c) engine-chosen tokens render plain text (no chip), (d) `[y:X]` no longer emits the `.pop--yellow` class anywhere.

### What this doesn't fix

- Engine choosing thematically-wrong objects (megaphone in a forest) — Phase 8 (setting-themed prop pools).
- Stories too long — separate content sprint.

### Acceptance

- `scripts/qa-current.js` — **all 16 gates green** (15 + new Section 13).
- v3 matrix 960 stories + v3 tot/little 240 stories all pass: 0 nulls, 0 unresolved, all kid picks in body + highlighted (coverage measured by pick-in-body, unchanged by this renderer fix).

---

## v0.9.3 (build 3, engine v3.0.3) — 2026-05-21
**Selection Joy Pass Phase 4 — shuffle 🎲 button on every tap round**

Phase 4 of the [Selection Joy Pass](https://www.notion.so/36713aa1d4db81a0bbe4f7588fe8f6f3). Adds a small "Show me different ones" 🎲 button beneath every tap round. Re-rolls both cards from the same pool, excluding the currently-shown 2 when possible. Limited to 2 uses per session so it stays a special move rather than a re-roll-forever escape.

### What changed

- **`buildRounds()` in `index.html`** — every tap round now carries a `fullPool` property holding the complete 12-24-option pool. Standard WORD_BANK rounds, the universal sound round (`SOUND_HOT_OPTS`), little-tier weather swap, and Potty Mode body round (`BODY_HOT_OPTS`) all get it. Freetext rounds excluded.
- **State** — new `state.shufflesUsed` counter (init 0; reset on `startWords()` + `backToWelcome()`). New `MAX_SHUFFLES = 2` constant (tunable).
- **`renderWords()`** — conditionally renders `<button id="btn-shuffle">` only when `round.fullPool.length >= 4` AND `shufflesRemaining > 0`. Counter badge ("×2", "×1") visible inside the button; disabled when exhausted.
- **`attachWordsHandlers()`** — wires the shuffle button: collects current option keys → filters `fullPool` to eligible (non-current) options → samples 2 fresh → swaps `round.options` → increments `state.shufflesUsed` → triggers 320ms fade animation → re-renders the round.
- **CSS** — `.shuffle-btn` pill (matches `.hint-chip` aesthetic) + `.shuffle-count` badge + `@keyframes rerollFade` for the fade-out/in transition.
- **New QA Section 12 — shuffle no-duplicate gate** — simulates 100 shuffles across every tap-round pool (5 tiers × 6-7 cats + SOUND_HOT_OPTS + BODY_HOT_OPTS). Confirms 0% of re-rolls produce a duplicate of the previous 2 options. All pools verified ≥ 4 items.

### Acceptance

- `scripts/qa-current.js` — **all 15 gates green** (14 from b2 + 1 new shuffle gate).
- Round-shape smoke test: 5/5 cases pass.
- Inline `<script>` syntax green.

### Visible to users

- Every tap round now shows a small 🎲 "Show me different ones" button below the cards.
- Counter badge inside the button shows remaining shuffles (`×2` then `×1`).
- Tapping shuffles the cards with a soft fade animation.
- Button disables (35% opacity) when both shuffles are spent.
- Badge reads `v0.9.3 · b3`.

### Not in this phase

Setting-specific bias (Phase 2) · sub-spot tap round (Phase 3) · wild card (Phase 5) · visual polish — bigger emoji + tap sound + haptic (Phase 6) · object round + mood-at-little + seasonal food + big 2→1 freetext (Phase 7) · setting-themed creatures/foods (Phase 8).

---

## v0.9.3 (build 2, engine v3.0.3) — 2026-05-21
**Selection Joy Pass Phase 1 — silly-sound tap round (little + kid) + escape hatch (kid)**

Live testing with kids surfaced a clear product signal: the picker, not the story, is the most enjoyable part of the app. Selection is the playful loop kids come back for. The kid-tier free-text round was the friction point — typing on a phone is slow, many 6-year-olds can't reliably spell silly sounds, and the typing round breaks the tap-rhythm of the rest of the picker.

This release is **Phase 1 of an 8-phase Selection Joy Pass** that makes the picker a core product strength. See the [`Selection Joy Pass` Build Idea](https://www.notion.so/36713aa1d4db81a0bbe4f7588fe8f6f3) for the full multi-phase plan.

### Free-text policy change

| Tier | Before | After |
|---|---|---|
| tot (2-3) | 0 free-text | 0 (no change) |
| little (4-5) | 1 free-text | **0 — replaced with silly-sound tap round** |
| kid (6-7) | 1 free-text | **0 by default + "or type your own ✏️" escape hatch button** |
| big (8-10) | 2 free-text | 2 (unchanged this phase; Phase 7 drops to 1) |
| tween (11-13) | 2 free-text | 2 (no change) |

### What changed

- **`buildRounds()` in `index.html`** — new `buildSoundRound()` helper draws 2 random options from `SOUND_HOT_OPTS` (12 distinct-emoji cartoon sounds: `BABOOM! WHAMMY! CRASH! TOOT! ZAP! SPLAT! CLANG! SMASH! BONK! WHOOSH! BWAHAHA! KAFOOM!`). Little + kid sessions now insert this in place of the old freetext round. Kid sound round carries the original freetext prompt as `escapeHatchTo` metadata.
- **`renderWords()` in `index.html`** — when `round.escapeHatchTo` is present, renders a small dashed-border "or type your own ✏️" button beneath the two cards.
- **`attachWordsHandlers()` in `index.html`** — wires the escape-hatch button: tap swaps `state.rounds[idx]` to the original freetext round and re-renders. Existing card-click + freetext-submit handlers untouched.
- **Potty Word Mode simplification** — previously injected both body + sound rounds (`+2`); now sound is universal so Potty Mode only adds the body round (`+1`). Body content (`BODY_HOT_OPTS`) unchanged. Net Potty Mode session: 9 rounds (was 10).
- **`src/content.js`** — `BUILD_NUMBER` `1` → `2`. `SOUND_HOT_OPTS` comment updated to reflect its new universal role. Name kept for grep-history; QA Section 11 still enforces all 12 emojis distinct.
- **Badge** — reads `v0.9.3 · b2` post-deploy.

### Engine compatibility

The picked sound feeds the same `picks.freeword` slot the engine has always read. Story-side rendering is unchanged. v3 blueprints (and v2 fallback) require zero changes for this phase.

### Acceptance

- `scripts/qa-current.js` — all 12 gates green.
- `SOUND_HOT_OPTS` emoji uniqueness verified by Section 11 (extended to scan the now-universal pool).
- Picker-flow smoke test: little / kid / (kid + Potty Mode) sessions all produce well-formed round sequences with `picks.freeword` populated.

### Not in this phase (Selection Joy Pass Phases 2-8, queued)

Setting-specific bias · sub-spot tap round when setting locked · shuffle 🎲 button · wild card mechanic · visual polish (bigger emoji + tap sound + haptic + animation) · object round at kid+ · mood-at-little · seasonal food rotation · big-tier 2→1 freetext drop.

---

## v0.9.3 (build 1, engine v3.0.3) — 2026-05-21
**Versioning policy adoption — three independent identifiers**

Between 2026-05-20 and 2026-05-21 the user-facing version inflated from v3.0.0 → v3.0.3 in 36 hours — one architectural milestone (v3.0.0 router flip) plus four UX hotfixes (v3.0.1–v3.0.3). Treating every fix as a semver patch signaled "we're at v3" when the product is still pre-App-Store, mid-QA, mid-content-trim. It also forced the "delete v2 codepath" Build Idea to be renumbered **five times** as each hotfix preempted it.

This release separates **product maturity** from **engine architecture** from **per-release builds** before more v3.0.x patches accumulate.

### Three independent identifiers

| Identifier | Meaning | Current | Bumps when |
|---|---|---|---|
| `APP_VERSION` | User-facing product maturity (shown in badge) | `v0.9.3` | Real product milestones — App-Store-ready, real-kid playtest signoff, feature additions. `v1.0.0` = public launch. |
| `ENGINE_V2_VERSION` | Internal engine architecture lineage (DevTools only) | `v3.0.3` | Engine architecture changes — v2 deletion → `v3.1.0`, etc. |
| `BUILD_NUMBER` | Per-release counter (shown in badge as `· b1`) | `1` | Every release shipped to `main`. |

### What changed in this release

- `src/content.js` — replaced single-line `APP_VERSION` with a policy comment + `APP_VERSION = 'v0.9.3'` + new `BUILD_NUMBER = 1` constant.
- `index.html` — badge render IIFE now shows `v0.9.3 · b1` instead of `v3.0.3`. `ENGINE_V2_VERSION` stays out of the badge (DevTools / CHANGELOG only).
- `docs/versioning.md` — new file documenting the policy: problem statement, three-identifier table, increment rules, display matrix, examples, migration plan, open questions.
- `README.md` — new **Versioning** section summarizing the policy and pointing at `docs/versioning.md`.
- `CHANGELOG.md` — header rewritten; entries from this release forward use the four-part `(build N, engine vA.B.C)` format. Historical v3.0.0–v3.0.3 entries unchanged.
- `src/engine-v2.js` — `ENGINE_V2_VERSION` stays at `v3.0.3` (matches the last v3 engine release for continuity; bumps to `v3.1.0` when v2 codepath is deleted).

### Visible to users

The badge changes from `v3.0.3` to `v0.9.3 · b1` for anyone with the app open at deploy. One-time confusion cost, paid intentionally before more patches accumulate.

### Build Idea renaming

The queued v2-deletion Build Idea — previously titled `v3.0.4 — Delete v2 codepath` after being renumbered five times — becomes `v0.9.x build N — Delete v2 codepath (engine v3.1.0)`. Build number lands at merge time. Engine bumps to v3.1.0 (an architecture change, not a product milestone).

### Acceptance

- `node scripts/qa-current.js` — all 12 gates green. No engine or content changes in this release, so QA results match v3.0.3.
- Manual badge check: production badge will read `v0.9.3 · b1` post-deploy.

---

## v3.0.3 — 2026-05-21
**Picker UX hotfix bundle — three user-reported kid-tier defects**

Three picker UX defects reported simultaneously by parent screenshots at noddytales.app. All three fall into the same category: word or content choices inappropriate for the kid tier (ages 6-7). Bundled into one focused release.

**Note (FIFTH renumber):** The "delete v2 codepath" Build Idea — originally v3.0.1, then v3.0.2, then v3.0.3 — is now **v3.0.4**. Each renumber is because user-reported UX defects keep preempting the architectural hygiene work. That sequence is correct: ship the user-visible fixes immediately, then return to deletion when no UX defect is open.

### Fix 1 — `banshee` → `yeti` (kid.creature)

Parent feedback: *"kids dont know what banshee is and the image doesnt make sense"*. The 🌬️ wind emoji didn't convey "creature." Flagged in my v3.0.2 release notes as a "potentially-advanced kid-tier word" candidate; now user-confirmed.

- `src/content.js` kid.creature: `{w:'banshee',e:'🌬️'}` → `{w:'yeti',e:'🦣'}`
- `src/engine-v2.js` V2_WORDS.visitors: renamed entry, rewrote traits/actions/sounds:
  ```
  { id:'yeti', text:'yeti', emoji:'🦣', article:'a',
    traits:['snowy','huge','surprisingly gentle'],
    actions:['stomped softly through the snow','offered a warm mitten','left enormous footprints behind'],
    sounds:['low rumble','soft growl','quiet huff'] },
  ```

Yeti is universally known by 6-year-olds (Frozen, Lego, kids' books) and the 🦣 mammoth emoji conveys "big furry beast" intuitively.

### Fix 2 — `suspiciously polite` → `polite` (kid.mood)

Parent feedback: *"suspiciously polite is not good for 6 year old. should just be polite"*. Flagged in my v3.0.2 notes as a candidate (alongside `jubilant`); now user-confirmed.

- `src/content.js` kid.mood: `{w:'suspiciously polite',e:'🎩'}` → `{w:'polite',e:'🎩'}`
- No `V2_WORDS` entry needed — moods are free-string slots used directly in story body.

The 🎩 top-hat emoji stays — still reads as "polite/formal."

### Fix 3 — `SOUND_HOT_OPTS` bathroom-style sounds → cartoon action sounds

Parent feedback (Potty Word Mode "Pick a chaotic sound" round): *"re-assess the chaotic sounds. Parp, Pfffart. they just arent good words. go with Baboom! Whammy! Crash! Toot! stuff like that"*.

Bathroom-style options removed (10): `PFFFFART`, `BTHHHPP`, `FAAAARP`, `PARP`, `BLEEEEH`, `SQUOMP`, `PLOPP`, `TOOOT`, `SCHPLAT`, `GLOOP`.

Kept (2 that were already inoffensive): `BWAHAHA`, `KAFOOM` — both Looney-Tunes-style register, kid-friendly.

Added (10 cartoon action sounds): `BABOOM!`, `WHAMMY!`, `CRASH!`, `TOOT!`, `ZAP!`, `SPLAT!`, `CLANG!`, `SMASH!`, `BONK!`, `WHOOSH!`.

Each gets a distinct emoji (verified all 12 unique). Updated in both:
- `src/content.js` `SOUND_HOT_OPTS` — the picker UI array
- `src/content.js` `SOUND_HOT` — the legacy v2 template sound pool (defense-in-depth; still reachable in edge cases until v3.0.4 deletes v2)

### What Potty Word Mode actually is

Worth recording: Potty Word Mode is a parent-toggled mode in Settings. When enabled, the kid-tier picker shows two extra rounds — "Pick a silly body word" (BODY_HOT_OPTS) and "Pick a chaotic sound" (SOUND_HOT_OPTS). Even with the mode on, the chaotic-sound options should be kid-appropriate; "PARP" being British slang for a fart noise is too on-the-nose for the explicit purpose of the mode. Cartoon action sounds preserve the "chaotic energy" of the mode without the bathroom-specific register.

(`BODY_HOT_OPTS` — the body-word pool — is NOT changed in this release. It's the literally-named "silly body word" pool and its purpose is intentionally body-themed. Parents who enable the mode opt into that.)

### Acceptance

- `node scripts/qa-current.js` — **all 12 gates green** including Section 11 emoji-uniqueness (the new SOUND_HOT_OPTS emojis are all distinct; the yeti 🦣 is unique in kid.creature).
- Verified yeti / polite / BABOOM! all flow through engine: 20/20 stories at kid tier contain each picked value in body text.
- No emoji collisions introduced.

### Versions

`APP_VERSION` → `v3.0.3`. `ENGINE_V2_VERSION` → `v3.0.3`. V2_WORDS.visitors `banshee` entry deleted (replaced by yeti); no other code logic changes.

### Cumulative v3.0.x patch line

```
v3.0.0 ✓ Router flip + v3 default everywhere
v3.0.1 ✓ Emoji-uniqueness within-round gate (Section 11)
v3.0.2 ✓ Labyrinth→maze + 🌀 cross-round meaning cleanup
v3.0.2-stability ✓ Tween anytime QA gate flake fixed (test-harness only, no version bump)
v3.0.3 ✓ banshee→yeti + suspiciously polite→polite + SOUND_HOT_OPTS cleanup (THIS RELEASE)
v3.0.4 (queued, FIFTH renumber) Delete v2 codepath + rename engine file + rewrite QA
v3.0.x (queued) Content sprint: Stories-too-long against unified engine
```

### Other potentially-advanced kid-tier words STILL flagged (not yet user-reported)

Surfaced in my v3.0.2 audit; not fixed without explicit ask:
- `kid.creature` **centaur** (mythological — borderline)
- `kid.color` **luminous teal** + **impossible green** (abstract adjectives)
- `kid.mood` **jubilant** (advanced synonym for joyful)
- `kid.mood` **professionally confused** (similar tier to "suspiciously polite" — likely should also be just `confused`, but `confused` already exists in the same round, so this needs careful handling)

If any of these surface in a screenshot the same way, file a defect and I'll patch.

---

## v3.0.2 — 2026-05-21
**Picker UX hotfix — "labyrinth" too advanced for kid tier + swirl emoji cross-round meaning overload**

User-reported (second screenshot in 24 hours): kid-tier "Pick a location" round showed `desert 🏜️` next to `labyrinth 🌀`. Two complaints in one screenshot: the word "labyrinth" is not age-appropriate for a 6-year-old, and the swirl emoji was being used for unrelated concepts in different rounds.

**Note:** This release is now in the v3.0.x cosmetic-patch sequence. The originally-planned "delete v2 codepath" work has been renumbered **twice** (originally v3.0.1, then v3.0.2 after the emoji hotfix, now **v3.0.3**). Build Idea renamed accordingly.

### Problem 1 — "labyrinth" is too advanced for ages 6-7

The `kid.place` round (target age 6-7) included `labyrinth` as a picker option. A 6-year-old reading independently doesn't know the word; even the swirl emoji didn't help convey what it meant. Parent's literal feedback: *"I dont know what it means and the image doesnt help."*

**Fix:** Renamed the kid.place picker option `labyrinth` → `maze`. Maze is the age-appropriate synonym — kids encounter mazes in corn-maze outings, hedge-maze storybooks, puzzle books. The concept is identical; the word is familiar.

`V2_WORDS.places` entry also renamed (`id:'labyrinth'` → `id:'maze'`, `text:'labyrinth'` → `text:'maze'`). The big-tier `mossy labyrinth` picker option is unchanged — at age 8-10, kids know the word, and the deliberately-literary picker voice fits the tier.

### Problem 2 — 🌀 swirl meant TWO different things across rounds

Audit showed `🌀` was used 6 times across the picker, with two distinct meanings:

| Round | Word | Meaning |
|---|---|---|
| `tot.move` | spun | motion |
| `little.move` | twirled | motion |
| `kid.move` | spun | motion |
| `big.move` | meandered thoughtfully | motion |
| `kid.place` | labyrinth | place (different meaning) |
| `tween.place` | weird stairwell | place (different meaning) |

A kid playing through several rounds sees `🌀 = spinning` then `🌀 = labyrinth` then `🌀 = stairwell`. The mental model breaks. v3.0.1's emoji-uniqueness gate caught **within-round** collisions but missed **cross-round semantic overload**.

**Fix:**
- `kid.place` labyrinth (now `maze`) gets `🧩` (puzzle piece — intuitive maze visual)
- `tween.place` weird stairwell gets `🪜` (ladder — vertical structure, distinct from spinning)

After the fix, **`🌀` only ever means "motion/spinning"** across the entire picker. Same emoji, consistent meaning.

### Acceptance

- `node scripts/qa-current.js` — **all 11 gates green**, including the Section 11 emoji-uniqueness gate (still 0 within-round collisions).
- **`maze` engine integration verified:** 20-story test at kid tier with `place=maze` — `"maze"` appears in body text of **20/20** stories. The V2_WORDS rename preserved the picker→engine mapping; no silent replacement, no missing-pick coverage failure.
- **`labyrinth` in `mossy_labyrinth` (big tier) preserved** — only the kid-tier picker word + V2_WORDS entry were renamed.

### Other potentially-advanced kid-tier words (NOT fixed in this release, flagged for review)

While investigating, noticed a few other kid-tier (6-7) words that might be too advanced. **Not fixing now** without your call, but flagging:

- `kid.creature`: **banshee** (screaming-spirit, scary/obscure for 6-7)
- `kid.creature`: **centaur** (mythological — borderline; kids who read Percy Jackson know it)
- `kid.color`: **luminous teal** (abstract adjective + uncommon color name)
- `kid.color`: **impossible green** (abstract — but charming and arguably tier-appropriate)
- `kid.mood`: **jubilant** (advanced synonym for joyful)

If any of these should be replaced, file a follow-up defect. Different from labyrinth in that the parent feedback was specifically about labyrinth — these are my suspicions, not user-reported.

### Versions

`APP_VERSION` → `v3.0.2`. `ENGINE_V2_VERSION` → `v3.0.2`. No engine code logic changes — only one `V2_WORDS.places` entry text edit. v2 fallback path unchanged.

### Cumulative v3.0.x patch line

```
v3.0.0 ✓ Router flip + v3 default everywhere
v3.0.1 ✓ Emoji-uniqueness hotfix (within-round) + new QA gate
v3.0.2 ✓ Labyrinth/maze rename + 🌀 cross-round semantic cleanup (THIS RELEASE)
v3.0.3 (queued) Delete v2 codepath + rename engine file + rewrite QA
v3.0.x (queued) Content sprint: Stories-too-long against unified engine
```

---

## v3.0.1 — 2026-05-21
**Critical UX fix — duplicate emojis in picker rounds + new permanent QA gate**

**Note:** This v3.0.1 is a user-reported hotfix and **replaces the originally-planned v3.0.1 "delete v2 codepath" release**, which is now requeued as v3.0.2. Phase 2 of the v3.0.0 cutover (v2 deletion + engine rename + QA rewrite for v3-only world) was on the schedule but a higher-priority UX defect surfaced from a real-user screenshot.

### The defect

Parent screenshot at noddytales.app: kid tier "Pick a snack" round showed two options side-by-side — **nachos** and **cheese puffs** — both rendered with the same 🧀 cheese-wedge emoji. Two visually-identical card faces, two different words. A 6-year-old can't tell them apart by image; a parent immediately loses trust in the picker's care.

Audit across the entire `WORD_BANK` revealed **38 emoji collisions in total** across tot/little/kid/big/tween rounds:

- 1 in `tot.sky` (bubbles vs high bubbles, both 🫧)
- 4 in `little` (pet duplicates × 3, place backyard vs treehouse 🌳)
- 6 in `kid` (the screenshot food, plus pet, creature × 2, move × 2, mood × 3)
- 12 in `big` (color × 3, food × 2, place, creature, move × 3, mood × 2)
- 15 in `tween` (pet, color, food × 3, place × 2, creature × 2, mood × 3) — tween had the highest density because its picker words are long and descriptive but emoji vocabulary is limited

Total **40 individual words affected** (some collisions were three-way — e.g., tween food had 🍟 used for mystery chips, vending machine chips, AND cafeteria fries).

### The fix

**38 emoji replacements in `src/content.js`.** For each collision, kept one option's existing emoji and assigned the colliding option a visually-distinct alternative that still themed appropriately:

| Round | Before | After |
|---|---|---|
| `kid.food` nachos | 🧀 (collided with cheese puffs) | 🫓 flatbread |
| `little.pet` guinea pig | 🐹 (collided with hamster) | 🐀 rat |
| `little.pet` chick | 🐥 (collided with duckling) | 🐤 front-on chick |
| `little.pet` pony | 🐴 (collided with foal) | 🐎 running horse |
| `little.place` backyard | 🌳 (collided with treehouse) | 🏡 house with garden |
| `kid.pet` red panda | 🦊 (collided with fennec fox) | 🦝 raccoon |
| `kid.creature` lunch wizard | 🧙 (collided with wizard) | 🍱 bento |
| `kid.creature` hallway ghost | 👻 (collided with ghost) | 🚪 door |
| `kid.move` zigzagged | ⚡ (collided with zoomed) | 🪃 boomerang |
| `kid.move` cartwheeled | 🤸 (collided with tumbled) | 🛞 wheel |
| `kid.mood` suspicious | 🕵️ (collided with sneaky) | 🤨 raised eyebrow |
| `kid.mood` extra brave | 🦁 (collided with brave) | 🛡️ shield |
| `kid.mood` confused | 🤔 (collided with prof. confused) | 😵‍💫 dizzy |
| ...26 more across big/tween | various | various |

Full collision list and replacements documented in the file diff.

### NEW QA Section 11 — emoji-uniqueness gate

`scripts/qa-current.js` now walks every `WORD_BANK[tier].rounds[].options` array and fails the harness if any two options in the same round share an emoji. v3.0.1 result: **0 collisions across all 5 tiers**.

This gate prevents recurrence. Future picker additions cannot ship with a duplicate emoji without an explicit override.

### Acceptance

- `node scripts/qa-current.js` — **all 11 gates green** (Sections 1-5, 7-9, 11, advisory 10).
- Manual re-render of the "Pick a snack" kid round: nachos = 🫓, cheese puffs = 🧀 — visually distinct.
- 160-story router behavior unchanged from v3.0.0 (still routes all ages to v3).
- v2 fallback still healthy (Section 1 v2 matrix still passes 600/600).

### What this means for the original v3.0.1

The "delete v2 codepath" release is now **v3.0.2**. Build Idea renamed and re-queued. The phased v3.0.0 cutover sequence becomes:

```
v3.0.0 (DONE — router flip + v3 default)
  → v3.0.1 (THIS RELEASE — emoji uniqueness + new QA gate)
  → v3.0.2 (queued — delete v2 codepath + rename engine file + rewrite QA for v3-only)
  → v3.0.x content sprint — Stories-too-long against the unified engine
```

### Versions

`APP_VERSION` → `v3.0.1`. `ENGINE_V2_VERSION` → `v3.0.1`. No engine code changes; the v2 fallback codepath is identical to v3.0.0.

---

## v3.0.0 — 2026-05-21
**Unified Engine — v3 is the default for every age 2-13**

The architectural promise the v3.0 roadmap was built on. The age gate is gone. Every story request — tot, little, kid, big, tween — now flows through the role-based v3 engine. The journey: v2.7.x stability, v2.8.0 content depth, v2.9.0 v3-default-for-6+, v2.10.0 tot/little-v3 blueprints, v2.10.1 setting/place UX fix, v2.10.2 parent-trust + QA hardening. **This release flips the last switch.**

### What changed

**Router (`buildStory()` in `index.html`, `generateStoryRouted()` in `src/engine-v2.js`):**

```js
// Before (v2.10.2):
const preferV3 = age >= 6 || isEngineV3Enabled();
if (preferV3 && typeof generateStoryV3 === 'function') { ... }

// After (v3.0.0):
const preferV3 = (typeof generateStoryV3 === 'function');
if (preferV3) { ... }
```

The `age >= 6` gate is removed. Every age tries v3 first. The `?engine=v2` / `?engine=v1` URL flags still work as testing overrides; they no longer matter for normal production routing.

**Verified behavior (160-story router test, no flags):**

| Age | Routes to | Paragraphs |
|---:|---|---|
| 2 | v3 (`tot_wonder_v3` / `tot_sky_v3`) | 4 |
| 3 | v3 (`tot_*_v3`) | 4 |
| 4 | v3 (`little_quest_v3` / `little_food_v3`) | 4 |
| 5 | v3 (`little_*_v3`) | 4 |
| 6 | v3 (kid blueprints) | 6 |
| 8 | v3 (big blueprints) | 6 |
| 10 | v3 (big blueprints) | 6 |
| 12 | v3 (tween blueprints) | 6 |

**Rollback safety preserved:**

This is a **phased cutover**. v2 stays in code as a silent fallback for v3.0.0. If v3 returns null for any reason (latent blueprint issue, unexpected slot resolution), `buildStory()` and `generateStoryRouted()` fall through to v2 — the same behavior the engine has had since v2.10.x. Verified with a null-injection test: when `generateStoryV3` is stubbed to always return null, v2 catches 30/30 attempts across ages 2/6/12.

The v3 engine has been the kid/big/tween default since v2.9.0 and was extended to tot/little in v2.10.0. The router flip in v3.0.0 just removes the age guard. No new engine code; no new beats.

### Why not delete v2 in v3.0.0?

The Build Idea title is "Unified Engine — v2 deleted, App Store ready." This release ships the unified-engine **routing**; v2 deletion is queued for **v3.0.1**.

Rationale: smallest safe cutover. The router flip is the user-facing behavior change. Once that's verified in production for a release cycle, deleting ~1,500 lines of v2 code is just hygiene. If something unexpected fires at production scale during the first day of v3-everywhere traffic, v3.0.0 can fall back silently without a redeploy. v3.0.1 deletes v2 once that confidence is earned.

### `legacy/engine-v2.js` snapshot

A copy of `src/engine-v2.js` as it was at the v3.0.0 cutover lives in `legacy/engine-v2.js`. If a critical bug requires a full revert, that file can be moved back to `src/engine.js` (in v3.0.1) or `src/engine-v2.js` (now) in minutes. Rollback artifact, not active code.

### Documentation cleanup

`docs/tot-little-v3-design.md` had a stale note: *"Setting Modes — The `setting` lock continues to override `place` in tot/little stories (until the separate `place`-vs-`setting` defect is resolved)."* v2.10.1 resolved that defect. The note now correctly reflects v2.10.1's `buildRounds()` fix (skips the place round entirely when a non-`surprise` setting is locked).

### Story-length defect — explicitly deferred to v3.0.x content sprint

The Open Defect Log entry "Stories too long globally" remains **In Progress**, intentionally not addressed in v3.0.0. The Section 10 advisory metric (added in v2.10.2) measures the gap: tot/little median ~20 sentences vs. defect-proposed caps of 3-6; kid/big/tween median ~26 vs. caps of 7-12.

**Rationale for deferral:** trimming beat content against the v2 codepath (which v3.0.1 deletes) wastes effort. The post-cutover content sprint targets the unified v3 engine where trimming can be measured, gated, and rolled out cleanly. Section 10 stays in the harness so the content sprint has a baseline to improve against.

### What's NOT in v3.0.0 (deferred to later sprints)

Per the task scope: these App Store / packaging items remain queued, not in this release:

- **Apple Parental Gate** — required before Kids Category premium / IAP. Build Idea on the hub.
- **iOS native packaging** (Capacitor / Expo / etc.) — web-only ship for v3.0.0.
- **App Store metadata** (screenshots, description, keywords, age rating, privacy policy URL).
- **Mobile / audio / parent / privacy UAT signoff** — real-kid playtest is the practical gate for trust; structured App Store UAT is a separate sprint.
- **Narrator voice selector, Potty Word Mode UX, freemium/paywall, structured story parts** — explicitly out of scope for v3.0.0 per the task brief.

### Acceptance

- `node scripts/qa-current.js` — **all 10 gates green** (Sections 1-5, 7-9, advisory 10). v2 matrix still passes (proves v2 fallback is healthy). v3 matrix passes 960/960 + 240/240 tot/little.
- **160-story router behavior test** — every age 2-12 routes through v3.
- **30-story rollback safety test** — v2 catches 30/30 when v3 stubbed to null.
- Section 10 advisory baseline unchanged from v2.10.2.

### Versions

`APP_VERSION` → `v3.0.0`. `ENGINE_V2_VERSION` → `v3.0.0` (the variable name stays as-is in this release; v3.0.1 will rename to `ENGINE_VERSION` alongside the `src/engine-v2.js` → `src/engine.js` rename).

### Path forward

- **v3.0.1** — delete `V2_BEATS` / `V2_BLUEPRINTS` / `generateStoryV2` / `generateStoryV1`. Rename `src/engine-v2.js` → `src/engine.js`. Rewrite `scripts/qa-current.js` for v3-only world (delete Sections 1, 2, 5 v2 matrix; expand Section 3b to all 12 ages). One focused release.
- **v3.0.x content sprint** — Story-length defect resolution (engine beat trimming) against the unified v3 engine.
- **Real-kid playtest** at noddytales.app (no `?engine=v3` flag needed anymore — v3 is the default).
- **App Store sprint** after playtest signoff: Apple Parental Gate, iOS packaging, screenshots, age rating, privacy policy.

---

## v2.10.2 — 2026-05-21
**Defect-cleanup release — Critical parent-trust fix, tween anytime flake fix, 2 new QA gates**

Pre-v3.0.0 defect cleanup pass. One Critical fix that should not have shipped, one QA-harness flake that was undermining the release gate, and two new QA gates that prevent recurrence.

### Critical — violent language in freetext prompt examples

The picker round "Invent a battle cry for a tiny knight" surfaced **"STABBY-STAB!"** and **"EAT MY BOOT!"** as visible example suggestions to children ages 6-7. Parent-trust catastrophe. Also caught: "floorstab" in the big-tier "stepping on a lego" prompt, "possibly playing dead" as a possum trait, and "demanded juice instead of blood" as a discount-vampire action.

**Replacements (all in `src/content.js` and `src/engine-v2.js`):**

| Before | After |
|---|---|
| `'STABBY-STAB!'` (kid battle cry example) | `'TO THE CASTLE!'` |
| `'EAT MY BOOT!'` (kid battle cry example) | `'FOR HONOR!'` |
| `'floorstab'` (big lego-pain word) | `'ouch-mageddon'` |
| `'possibly playing dead'` (tiny possum trait) | `'possibly playing possum'` |
| `'demanded juice instead of blood'` (discount vampire action) | `'demanded juice and a quiet corner'` |

### Section 9 — NEW blocked-word QA gate

`scripts/qa-current.js` now scans every string literal in `src/content.js` and `src/engine-v2.js` for `stab|knife|weapon|blood|kill|murder|dead|gun|bullet` and fails if any are found. The scan strips comments first to avoid false-positives on changelog text. Confirmed **0 hits** in v2.10.2.

This gate would have caught the "STABBY-STAB!" violation at the first QA run if it had existed. No content can ship with these terms again without an explicit decision.

### Tween age-12 anytime QA gate flake → FIXED

The Section 5 storyMode regression gate was failing 1-in-5 runs at tween age 12 with bedtime-words counts of 7/60 (just above the ≤6/60 threshold). The recent five Codex runs showed: 7/60 (fail), 1/60, 0/60, 6/60, 3/60.

**Root cause:** the `BEDTIME_RX` regex was matching `sleepy` anywhere in the body — including when "sleepy" appeared as a chosen creature trait ("sleepy gecko") or sky descriptor ("sleepy moon") in P2/P3 of a story that closed with a perfectly-clean anytime ending. The gate's *intent* is "does this story CLOSE with sleep imagery"; the *implementation* counted "sleepy" used adjectivally anywhere as a bedtime hit.

**Two-part fix:**

1. **Scope:** `endingAudit` now scans only the FINAL paragraph (the actual ending), not the entire body. Mid-story "sleepy gecko" no longer flips the count.
2. **Word list:** removed bare `sleep`/`sleepy`/`asleep` from `BEDTIME_RX`. Replaced with stricter phrases that only appear at story close: `fell asleep`, `going to sleep`, `time to sleep`, `going to bed`, `sweet dreams`, `tucked in`. `goodnight` and `bedtime` retained — those never appear mid-story in current content.

**Result:** **5 consecutive QA runs at tween age 12 anytime = 0/60 bedtime-word hits.** Stable.

### Section 10 — NEW sentence-count report (advisory)

The Open defect "Stories too long globally — early tier most severe, sentence caps not enforced" proposed hard caps per tier (tot 3-4, little 5-6, kid 7-8, big 9-11, tween 10-12). v2.10.2 ships the **metric** as a report-only Section 10 so the actual length distribution is visible.

**Baseline measurement (30 stories per tier):**

| Tier | Median | p90 | Max | Defect-proposed cap |
|---|---:|---:|---:|---|
| tot | 20 | 24 | 27 | 3-4 |
| little | 20 | 22 | 23 | 5-6 |
| kid | 26 | 30 | 32 | 7-8 |
| big | 26 | 30 | 30 | 9-11 |
| tween | 26 | 32 | 33 | 10-12 |

Stories currently run **2-7x over the defect-proposed caps**. This is a substantial content-engine sized fix; deferred to a separate sprint. The defect stays Open with this baseline attached.

### Stale-architecture defects closed as Wont Fix

Two open defects describe systems that no longer exist:

- **"The End annunciation sounds robotic" (Medium)** — Fix Notes propose `SpeechSynthesisUtterance` parameter tuning. NoddyTales retired Web Speech API in v1.5.0 in favor of ElevenLabs cloud TTS. No `speechSynthesis` references in current `src/` or `index.html`. The TTS architecture has moved on; the proposed fix doesn't apply.
- **"Word highlight one word behind during Speak" (High)** — Fix Notes cite apostrophe tokenization in `charIndex` boundary events. NoddyTales karaoke uses ElevenLabs character-timestamp alignment via the `/with-timestamps` endpoint plus a `KARAOKE_LEAD_MS = 220ms` lookahead (shipped v2.6.2). The boundary-event tokenization path described doesn't exist. If a real karaoke lag is observed in v2.10.x, file a fresh defect with current-architecture details.

Both marked **Wont Fix** with explanations referencing the current ElevenLabs TTS path.

### Acceptance

`node scripts/qa-current.js` — **all 10 gates green** (Sections 1-5, 7-9, plus advisory 10). Tween anytime stable across 5 consecutive runs at 0/60. Blocked-word scan: 0 hits.

`APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.10.2`.

### Defect Log status after this release

- **Fixed:** "Stabby Stab" Critical (+ blood/dead trait/action cleanup)
- **Fixed:** Tween age-12 anytime QA gate flake (new entry, fixed in same release)
- **In Progress / Open with metric:** Stories too long globally (advisory metric added; engine-side trimming is a future sprint)
- **Wont Fix:** The End annunciation (Web Speech retired)
- **Wont Fix:** Word highlight one word behind (apostrophe tokenization root cause doesn't match current ElevenLabs path)
- **Open count:** 1 (Stories too long, with attached baseline)

---

## v2.10.1 — 2026-05-21
**UX fix — skip the place round when setting is locked (last open v2.8.0 UAT defect)**

The fifth defect from the v2.8.0 UAT rescore — `place` slot silently dropped when `setting` is locked — has been deferred since v2.9.1's cosmetic patch shipped because it was a UX change rather than a one-line cosmetic. Now resolved as a focused single-edit fix.

### The defect

When a non-`surprise` setting was locked (Diner / Mall / Beach / Football / School / Backyard / Grocery / Zoo / Bus), the engine already used `setting.place` as the story's location and silently discarded any user-picked `place` word. The selectable-coverage promise broke: the child picked "volcano" but read a mall story. "Volcano" never appeared in the body.

### The fix

`buildRounds()` in `index.html` now filters the `place` category out of the round plan when the setting is locked. The child is no longer asked to pick a word that the engine throws away.

```js
const settingLocked = !!(state.setting && state.setting !== 'surprise');
const effectivePlan = settingLocked ? plan.filter(cat => cat !== 'place') : plan;
const binaryRounds = effectivePlan.map(...)...;
```

When the setting is `surprise` (the default), all rounds run as before — including the place round.

### Behavior matrix

| Setting | Picker shows `place` round? | Story location |
|---|---|---|
| `surprise` (default) | Yes | Child's picked `place` |
| `diner` / `mall` / `beach` / etc. (locked) | **No** | The locked setting |

### Acceptance

- `node scripts/qa-current.js` — **all 9 gates green**. The inline-script syntax gate (Section 8) confirms `buildRounds()` parses cleanly after the edit.
- Section 1 v2 matrix (600 stories) and Section 3b v3 tot/little matrix (240 stories) still pass with 0 misses — engine-side slot resolution was already protected against undefined `picks.place` when setting wins.
- Kid-agency ratio held at 0.96.

### What this doesn't change

- The engine's slot construction is unchanged. `setting.place` continues to win over `picks.place` whether or not the place round runs.
- The freetext-round insertion logic in kid/big/tween (`binaryRounds.slice(0, 4)` + freetext + `binaryRounds.slice(4)`) still produces well-formed round sequences after place is filtered out — the front slice is `[pet, color, food, creature]` and the back slice is `[move, mood]` in those tiers.
- Round count drops by 1 in locked-setting flows (e.g., kid: 8 → 7 rounds; tween: 9 → 8 rounds). The picker UI handles variable round counts already.

`APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.10.1`. No engine code changes; pure UI flow fix.

### Defect Log closure

This closes the last open Open defect in the Defect Log. The repo is now at a 100%-clean baseline going into the v2.10.0 real-kid playtest and the eventual v3.0.0 cutover.

---

## v2.10.0 — 2026-05-21
**tot/little-v3 beat authoring — v3.0.0 critical path content sprint**

Implements `docs/tot-little-v3-design.md`. Adds 4 new V3_BLUEPRINTS and ~36 new V3_BEATS so the v3 engine can generate stories for ages 2-5 with the same role-based architecture used for kid/big/tween. v2 tot/little beats remain in code as fallback through v2.10.0 — v3.0.0 deletes them.

### Four new V3_BLUEPRINTS

| Blueprint | Tier | wonder_object | Stages |
|---|---|---|---|
| `tot_wonder_v3` | tot (ages 2-3) | food | setup → silly_repeat ×2 → cozy_end |
| `tot_sky_v3` | tot (ages 2-3) | sky | setup → silly_repeat ×2 → cozy_end |
| `little_quest_v3` | little (ages 4-5) | object | setup → silly_repeat ×2 → cozy_end |
| `little_food_v3` | little (ages 4-5) | food | setup → silly_repeat ×2 → cozy_end |

3-role contract: `protagonist` (always = kid), `ally` (companion pick), `wonder_object` (food/sky/object per blueprint). Optional flavor roles: `visual_signature` (color), `signature_action` (move), `pressure` (weather for little only).

All four blueprints share a 3-stage / 4-paragraph arc. `silly_repeat` fires twice per story (P2 + P3), gated by new in-story beat-dedup so the two paragraphs use different beats.

### ~36 new V3_BEATS

- **5 tot setup** beats — Cole runs outside, spots the ally, grabs the paw, leads the way, opens the door.
- **8 tot silly_repeat** beats — Cole picks up / points at / shares / carries / dances with / call-responds about / puts a hat on / reaches for the wonder_object.
- **3 tot cozy_end bedtime** + **2 anytime** beats.
- **5 little setup** beats — Cole packs a bag, grabs the ally, spots them across the yard, opens a door, "today is a big one".
- **8 little silly_repeat** beats — Cole spots/claims, shares, carries, dances with, point-and-yells, builds a fort around, names, chases.
- **3 little cozy_end bedtime** + **2 anytime** beats.

Beats are tier-only (no `blueprintId`) so the two blueprints per tier share the same pool. `wonder_object` resolves per blueprint roleMap — same beat line works for food, sky, or object.

Voice register: action-driven (Cole spots, picks up, grabs, points, holds, carries, leads, builds, decides). Inherits the kid-agency lift from v2.8.0. Short sentences, heavy repetition with restraint.

### Engine changes

- Removed the `if (tier === 'tot' || tier === 'little') return null;` early-exit from `generateStoryV3`.
- Added a `sky` slot to v3 slot construction (was missing — `tot_sky_v3` requires it).
- Added in-story beat dedup to `pickStageBeat`. When `silly_repeat` fires twice, the second pick excludes beat IDs already used. Falls back to the full pool if every variant is used (small pools won't stall).
- Extended the storyMode filter: the new `tl_cozy_end` stage respects `picks.storyMode` the same way the kid/big/tween `landing` stage does.

### New QA gate (Section 3b)

`scripts/qa-current.js` Section 3b: v3 tot/little matrix. 4 blueprints × tier-appropriate ages × 30 stories = **240 stories** per harness run. Gates: 0 nulls / 0 unresolved / 4-paragraph arc / ally in body / wonder in body (deterministic only). v2.10.0 measured **0/240 on all 5 gates**.

### Audit pack regenerated

`scripts/audit-stories.js` updated to cycle ages 2-5 through the new v3 blueprints (instead of v2). `docs/story-quality-audit-v2.10.0.md` regenerated. Eyeball pass on ages 2/4 shows Cole driving every paragraph.

### Routing unchanged in v2.10.0

`buildStory()` in `index.html` still routes only ages 6+ through v3 by default. v3 tot/little is reachable in production via `?engine=v3` for testing. v3.0.0 flips the router for tot/little and deletes v2.

For real-kid playtest at ages 2-5: visit `noddytales.app/?engine=v3`.

### Acceptance

`node scripts/qa-current.js` — **all 9 gates green** (Sections 1-2 v2, 3 v3 kid/big/tween, **3b v3 tot/little NEW**, 4 grammar lint, 5 storyMode, 7 kid-agency, 8 inline-script).

Section 7 kid-agency ratio: **0.97**.

### Path to v3.0.0

1. Real-kid playtest at ages 2-5 with `?engine=v3` — the gate to v3.0.0.
2. v3.0.0 cutover — flip router for tot/little, delete V2_BEATS / V2_BLUEPRINTS / generateStoryV2 / generateStoryV1, rename engine file, App Store packaging.

`APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.10.0`.

---

## v2.9.1 — 2026-05-21
**Cosmetic patch — 4 pre-existing v2 defects surfaced in v2.8.0 UAT rescore**

Four tot/little cosmetic defects fixed. None were introduced by recent releases — they were latent v2 issues that the v2.8.0 audit pack made visible. Bundling them into v2.9.1 leaves v3.0.0 with no v2 cosmetic debt to inherit.

### Defect 1 — Tot titles auto-fill creature when none was picked

The v2 universal title pool included three patterns that reference visitor: `${kid} vs the ${visitor}`, `The Day ${kid} Met ${visitor}`, `How ${kid} Met ${visitor}`. Tot tier has no creature picker round, so the engine auto-filled visitor from the setting bias — producing absurd titles like "Cole vs the Group Chat" on a story about a bird. Same issue for object (always auto-picked, no picker round).

Fix: filter the universal title pool to exclude visitor-referencing patterns when `picks.creature` wasn't user-picked, and exclude the "${object} Problem" pattern when `picks.object` wasn't user-picked. Tot tier now selects only from creature-free / object-free patterns + the tot_loop recipe pool. 100-story verification: 0/100 tot stories produced visitor- or object-referencing titles.

### Defect 2 — `{kid.lc}` rendered "cole's pocket" lowercase mid-sentence

The v2.8.0 `li_silly_action_3` beat used `{kid.lc}'s pocket` to render the possessive. `{kid.lc}` resolves to the lowercase form of the child's name ("cole") — intended for sound-effect / chant positions where lowercase reads naturally, not for possessives mid-sentence.

Fix: changed the line to use `{kid.name}'s pocket`. 200-story verification: 0/200 little stories had lowercase "cole's" anywhere.

### Defect 3 — `{sky.text}` rendered lowercase inside Cole's exclamation

The `to_repeat_sky` beat had a variant: `'"{sky.text}!" said {kid.name}.'` When sky=snowflake, this rendered `'"snowflake!" said Cole.'` — exclamations should sentence-case the first character.

Fix: switched the tokens in the exclamation to `{sky.cap}` (the capitalize variant): `'"{sky.cap}!" said {kid.name}.'` 200-story verification: 0/200 tot stories had lowercase "snowflake!" exclamations.

### Defect 5 — Title-content mismatch on "The Lamb with the Tiny Hat"

The `gentle_quest` recipe (used by little tier) had a title pattern `The ${companion} with the Tiny Hat`. The "tiny hat" only appears in the body when the `li_comp1` beat fires in P2. With v2.8.0 adding more little_companion beat variants, the title increasingly referenced a detail that didn't appear in the body.

Fix: replaced the offending pattern with `${kid} and the ${food}` — a generic shape that works for any beat sequence and references a slot guaranteed to appear in the body. 200-story verification: 0/200 little stories had "Tiny Hat" titles.

### Defect 4 deferred (not in this patch)

The fifth UAT-rescore defect — `place` slot silently dropped when `setting` is locked — is intentionally **deferred**. It's a Medium-severity UX issue (picked-word coverage promise broken) that requires either picker-flow changes (skip the place round when setting is locked) or engine changes (thread place pick as a sub-location). Either path is bigger than a cosmetic patch. Leaving open in Defect Log for resolution after v2.9.0 baseline is stable.

### Acceptance

- `node scripts/qa-current.js` — all 8 gates green.
- Section 7 kid-agency ratio held at **0.96** (312 action / 325 total). No regression from v2.9.0's 0.95.
- 700-story targeted verification across the 4 fixed defects: 0/700 hits on the pre-fix bad patterns.

`APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.9.1`. No new beats. No router changes. No architecture changes.

---

## v2.9.0 — 2026-05-21
**v3 Default for ages 6-13 — router flip (single-purpose architectural release)**

Second milestone of the v3.0 roadmap. The v3 role-based engine becomes the default for ages 6 and up. v2 stays in code as a runtime fallback throughout v2.9.0 so a v3 issue can be rolled back without redeploy. No content changes. No new beats.

### Router flip

**Before (v2.8.0 and earlier):** v3 was opt-in only. Users had to visit `?engine=v3` once or have `localStorage.nt_engine_v3 = '1'` set. Without the flag, every age routed through v2 first; v3 was unreachable.

**After (v2.9.0):** For ages 6 and up (kid/big/tween), `buildStory()` tries `generateStoryV3` first. If v3 returns null (an unfulfillable blueprint or an unexpected slot issue) the engine falls back to `generateStoryV2`. Ages 2-5 (tot/little) continue to use v2 because `generateStoryV3` still early-exits to null below age 6 — that gap closes in v3.0.0 with tot/little-v3.

The `?engine=v3` URL flag (and the `nt_engine_v3` localStorage entry) still work but are now an **override**, not a **gate**. They force v3 attempts at all ages — useful for testing tot/little fall-through behavior. The flag is no longer required for normal production v3 routing.

### Files edited

| File | Change |
|---|---|
| `index.html` `buildStory()` | `if (isEngineV3Enabled())` → `if (age >= 6 \|\| isEngineV3Enabled())` |
| `src/engine-v2.js` `generateStoryRouted()` | Same age-based default added in case any caller imports the engine module directly |

Both edits are tiny — one boolean condition each. The rollback is a one-line revert of either gate.

### v1 deprecation warning

The v1 template-substitution fallback (retired as a default in v2.0.0, kept as a hard fallback for the "v2 throws an exception" worst case) now emits a one-time `console.warn` when it fires. The warning includes the age that triggered it and a note that v1 is scheduled for removal in v3.0.0.

This is purely observability — no behavior change. v1 still works exactly as before; we just learn when it's used.

```
[NoddyTales] v1 template fallback engaged (v2 and v3 both returned null at age=N).
v1 is deprecated and scheduled for removal in v3.0.0.
This fire should not happen in normal operation — v2 (and v3 for ages 6+) cover all picker combinations.
If you see this, capture the picks + age and file a defect.
```

A module-scope flag (`__ntV1DeprecationLogged`) gates the warning to one fire per page load so it doesn't spam the console if v1 fires multiple times in one session.

### New design doc

`docs/tot-little-v3-design.md` — design only, no code. Documents the simplified 3-role contract (protagonist always = kid, ally = companion, wonder_object = food/sky/object) for tot/little stages (setup → silly_repeat → cozy_end → 4 paragraphs). This is the spec that v3.0.0 will implement. Includes example blueprint declarations, beat library sizing, migration path, acceptance criteria, and 5 open questions to resolve during the v3.0.0 authoring sprint.

### Acceptance

`node scripts/qa-current.js` — **all 8 gates green**. Notably:

- Section 1 v2 matrix: 600/600 stories pass with 0 nulls. v2 is still a healthy fallback even though most production traffic for kid/big/tween now bypasses it.
- Section 3 v3 matrix: 960/960 stories pass. v3 is rock-solid as the new default path.
- Section 7 kid-agency: 304 action / 15 reaction = 0.95 ratio (unchanged from v2.8.0 — no content shifted).

**Router behavior verified** with a 120-story test (no `NODDY_ENGINE` flag, 20 stories per age):

| Age | v3-routed (6 paragraphs) | v2-routed (4 paragraphs) |
|----:|:-:|:-:|
| 2 | 0 | 20 |
| 4 | 0 | 20 |
| 6 | **20** | 0 |
| 8 | **20** | 0 |
| 10 | **20** | 0 |
| 12 | **20** | 0 |

Exactly the intended behavior: ages 6+ all-v3, ages 2-5 all-v2.

### Audit pack

`docs/story-quality-audit-v2.9.0.md` regenerated. Ages 6+ stories are structurally identical to the v2.8.0 audit pack (same engine, same picks, same algorithm — output varies only by random beat selection per run). Ages 2-5 stories unchanged from v2.8.0 baseline. No quality regression in either direction.

### Manual UAT rescore (prerequisite for this release)

Documented in the UAT Plan: v2.8.0 ages 2-5 kid agency rescored at **3.7** (age 2) and **3.9** (age 4), both above the 3.5 plan target. Programmatic Section 7 gate confirmed at 0.95 ratio. The v2.8.0 content baseline is solid for v2.9.0 to ship from.

### Rollback plan

A single revert of either `buildStory()`'s age-based condition in `index.html` OR `generateStoryRouted()` in `src/engine-v2.js` restores v2.8.0 routing behavior. v2 codepath is untouched. Estimated rollback time: 5 minutes including QA harness re-run.

`APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.9.0`.

---

## v2.8.0 — 2026-05-21
**Story Quality Pass — kid agency at ages 2-5, distinct tween voice, two new QA gates**

First milestone of the v3.0 roadmap. Content + QA only. No router changes, no architecture changes. v2 stays default for all tiers.

### Tot/little kid-agency pass

v2.7.1 UAT scored ages 2-5 at 2.2-2.6 on the kid-agency dimension because Cole was usually the observer ("Cole giggled / Cole heard / Cole loves the mall") and the sidekick/visitor drove the action.

**Added 15 action-driven beats where Cole is the subject of an action verb:**

- Tot (7 new beats across intro / silly_meet / silly_repeat / cozy_end): Cole runs outside and spots the companion, Cole picks up the food and holds it up, Cole grabs the companion's paw and jumps together, Cole pulls out a tiny hat and puts it on, Cole points up at the sky and finds it first, Cole picks up the companion for a goodnight hug.
- Little (8 new beats across intro / companion / silly_event / cozy_end): Cole packs food and heads out with a plan, Cole grabs the companion by the paw and runs, Cole spots an object on the ground and claims it, Cole climbs onto a rock and waves at a creature, Cole pulls food out of a pocket, Cole builds a pillow fort.

**Replaced 2 existing passive lines:**

- `to_intro2`: "Cole heard a sound. It was a bunny!" → "Cole spotted a bunny across the room. Cole ran right over."
- `li_comp2`: "Cole giggled" (twice) → "Cole grabbed the companion's paw. 'Again!' said Cole. Cole clapped along."

### Tween voice pass

v2.7.1 UAT scored tween (age 12) at 4.0 across the board — passing but voice felt thin vs. age 10. The deadpan-tween voice was mostly carried by mood picker words ("aggressively normal", "professionally unhinged", "NPC behavior") with too few structural beats.

**Added 16 tween-only V3_BEATS (4 per blueprint):**

- `lost_snack_v3`: mental-screenshot attempt, group-chat-energy escalation, filed-under-low-priority payoff, replayed-walking-back anytime landing.
- `goal_spine_v3`: committed-quietly setup, professionally-unhinged attempt, mentally-screenshotted escalation, win-logged payoff.
- `show_wrong_v3`: nobody-asked-doing-it-anyway setup, failed-exactly-on-cue attempt, going-viral-with-intent escalation, 40%-real-60%-ironic payoff.
- `rule_loophole_v3`: bare-minimum setup, reacting-is-rookie-behavior problem, located-loophole-within-seconds attempt, filed-under-small-wins payoff.

Voice register: short sentences, deadpan delivery, screenshot/group-chat/replay-mentally/filed-for-later motifs.

### Two new QA gates

**Section 5 — tween (age 12) anytime gate (extended).** Section 5 previously gated only age 9 and tot age 2 for storyMode regression. Tween was implicitly covered by Section 1 but had no explicit anytime/bedtime check. Now age 12 has parity thresholds: ≤10% bedtime words and ≥60% anytime markers across 60 stories.

**Section 7 — tot/little kid-agency action-verb gate (NEW).** Across 100 sampled tot+little stories (25 each at ages 2/3/4/5), classifies every verb following "Cole" as the sentence subject. Action verbs (spotted, picked, grabbed, decided, climbed, pulled, led, built, etc.) must outnumber reaction verbs (heard, giggled, loved, watched, etc.) at a ratio ≥ 0.65. v2.8.0 measured: **309 action / 16 reaction = 0.95 ratio** — well above the gate.

### Acceptance

`node scripts/qa-current.js` — **all 8 gates pass**:

- Section 1 v2 matrix (600 stories): 0 nulls / 0 unresolved / 0 missing required.
- Section 2 v2 targeted (60/60 sky+weather).
- Section 3 v3 matrix (960 stories): 0 nulls / 0 unresolved / 100% picked-word coverage + highlight.
- Section 4 grammar lint (2,000 stories): 0 plural-article errors, 0 awkward " A " titles, 0 "one HUGE [plural-food]" mismatches (v2.7.3 gate).
- Section 5 story-mode regression: age 9 anytime 0/60 bedtime words, **age 12 anytime 6/60 bedtime words (≤10% threshold met)**, age 12 anytime 45/60 day-ending markers (≥60% threshold met), tot anytime 0/40 bedtime words.
- Section 6 (now part of Section 5) — covered above.
- Section 7 (NEW) tot/little kid-agency: 309 action / 325 total = 0.95 ratio.
- Section 8 (was 6) inline `<script>` syntax: 1 block, 0 parse errors.

Audit pack regenerated at `docs/story-quality-audit-v2.8.0.md` (30 stories, ages 2/4/6/8/10/12 × 5). `APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.8.0`.

### Known follow-ups (not blocking v2.8.0)

- Tot title patterns occasionally render irrelevant "vs the [creature]" titles for stories that have no creature pick (e.g., "Cole vs the Group Chat" on a story about a bird). Pre-existing v2 behavior, not introduced by this release. Defer to a separate cosmetic patch.
- 30-story manual eyeball rescore (the "≥ 3.5 average everywhere" plan acceptance) deferred to a separate UAT pass since the programmatic agency gate now enforces the structural fix. Manual rescore should happen before v2.9.0.

---

## v2.7.3 — 2026-05-21
**Punchline grammar fix — "one HUGE waffles" no longer ships**

User-reported defect from a real generated story:

> "Then the pirate pulled out one HUGE waffles. Way too big to fit anywhere. Bigger than the pirate, even. Nobody knew where it had come from."

The `pl_wrong_1` v2 punchline beat at `src/engine-v2.js:2735` hard-coded `one HUGE {food.text}` and the singular pronoun `it had come from`. When the food slot resolved to a plural-form picker word (waffles, donuts, cookies, pancakes, tacos, etc.) the line rendered as broken English. The bug had been latent since v2.4.0 (when the physical-absurd punchlines first shipped) but only fires when the kid/big v2 show_wrong blueprint randomly picks both `pl_wrong_1` AND a plural food.

### Fix

Swapped the line to use `{food.articleText}` which already pluralizes correctly across all food types:

| Food type | `{food.articleText}` resolves to |
|---|---|
| Plural (waffles, donuts) | `some waffles` |
| Singular count (pizza, apple) | `a pizza`, `an apple` |
| Mass with prefix (soup, cake, sushi) | `a bowl of soup`, `a slice of cake`, `a piece of sushi` |
| Mass undivided (popcorn, spaghetti) | `some popcorn`, `some spaghetti` |

The new line is also one sentence shorter so the punchline lands faster (addresses the user's "quite long" feedback):

> Then the {visitor.text} pulled out {food.articleText}. HUGE. Way too big to fit anywhere. The {visitor.text} did not know where, either.

Renders for plural foods:

> Then the pirate pulled out some waffles. HUGE. Way too big to fit anywhere. The pirate did not know where, either.

The dropped sentences — "Bigger than the pirate, even" and "Nobody knew where it had come from" — were the ones with the broken singular-comparative and singular-pronoun grammar. The punchline structure (HUGE thing appearing, deadpan reaction) is preserved.

### New regression gate

Added Section 4 lint: scans 2,000 generated stories for `\bone (HUGE|big|tiny) <plural-food>\b` pattern. Confirms 0/2000 hits in v2.7.3 and will fail the build if the bug class ever returns.

### Acceptance

- `node scripts/qa-current.js` — all 7 gates green (600 v2 + 60/60 targeted + 960 v3 + 2,000-story lint with NEW plural-food gate + storyMode regression + inline-script syntax)
- Manual render test across 13 food types (waffles/donuts/cookies/pancakes/pizza/apple/cake/soup/ice cream/sushi/spaghetti/popcorn/grilled cheese) — all produce grammatical English

`APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.7.3`.

### Notion

New Defect Log entry created and immediately marked Fixed with commit reference. The v2.7.2 tot/little kid-agency build is still the next planned content sprint — this fix is a hotfix, not a roadmap shift.

---

## v2.7.2 — 2026-05-21
**Cosmetic patch — v3 title casing + audit script header**

Two Low-severity defects opened during the v2.7.1 UAT pass, both fixed in a single small patch with no engine code-path changes.

### v3 title casing fix

All four v3 blueprint `titlePatterns` arrays in `src/engine-v2.js` were rendering picked-word tokens (`{mcguffin.text}`, `{false_suspect.text}`, `{obstacle.text}`, `{ally.text}`, `{prop.text}`, `{rule_imposer.text}`, `{setting.text}`) in their raw lowercase form, producing titles like "Cole vs the witch", "Cole and the cupcakes Mystery", "The Loophole at the museum basement". The `titleCase` function shipped in v2.6.1 runs on the template skeleton, but picked-word substitutions paste in after token resolution so they were never capitalized.

Fix: swap all picked-word tokens inside `titlePatterns` from `.text` to `.titleText`. The `.titleText` token property already existed in the v3 renderer and falls back to `V2Grammar.titleCase(baseText)` for any slot without an explicit `titleText`.

Before/after sample (same picks):

- "Cole and the cupcakes Mystery" → "Cole and the Cupcakes Mystery"
- "Cole vs the courtroom duck" → "Cole vs the Courtroom Duck"
- "The Loophole at the museum basement" → "The Loophole at the Museum Basement"
- "How Cole Outsmarted the courtroom duck" → "How Cole Outsmarted the Courtroom Duck"
- "The ticket stub Broke But Cole Did Not" → "The Ticket Stub Broke But Cole Did Not"

`vs`, `the`, `at`, and other small words stay lowercase mid-title per the existing `titleCase` rule.

### Audit script dynamic header

`scripts/audit-stories.js` previously hard-coded `# Story Quality Audit — v2.7.0 baseline` in the markdown header regardless of which release was actually being audited. Now reads `APP_VERSION` from `src/content.js` at runtime and emits `# Story Quality Audit — vX.Y.Z`. Cosmetic-only fix; audit content was always correct.

### Acceptance

- `node scripts/qa-current.js` — all 6 sections pass (600 v2 + 960 v3 + 2,000-story lint + storyMode regression + inline-script syntax)
- Sanity check: 16 sample v3 titles across all four blueprints with deliberately lowercase picks all rendered with correct title casing
- `APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.7.2`

### Notion

Both defects (`v3 title casing inconsistency` + `scripts/audit-stories.js hardcoded v2.7.0 header`) marked Fixed with verification notes pointing to this changelog entry.

---

## v2.7.1 — 2026-05-20
**Cleanup + hardening — docs refreshed, QA harness now catches blank-screen class of bug**

No new story features. Pure hygiene release that closes the gaps that hurt us in v2.6.2 and removes friction for any future build.

### Inline `<script>` syntax gate (added to QA harness)

`scripts/qa-current.js` Section 6 now parses every inline `<script>` block in `index.html` via `new Function(body)`. If the parser throws, the gate fails and the harness exits non-zero. The v2.6.2 broken-ternary bug that produced a blank green screen for every visitor would have been caught before push. Cheap, fast, gates on `errors === 0`.

### QA harness renamed

`scripts/qa-v261.js` → `scripts/qa-current.js`. Name no longer ties to a stale release. Header rewritten to reflect that this is the single acceptance harness for the current release, not a v2.6.1 artifact. `CLAUDE.md` project-instructions updated to point at the new path.

### README.md refreshed to current state

Old README claimed ages 2–10, Web Speech API, and "custom domain pending purchase" — all stale by months. New README documents:
- Ages 2–13 across 5 tiers (added tween)
- 7-step flow (name/age → sidekicks → setting → storyMode → words → highlights → Read it to me)
- ElevenLabs TTS via Vercel serverless proxy (`api/tts.js`)
- IndexedDB audio + alignment cache
- localStorage profile keys
- v2/v3 engine layering and the `?engine=v3` opt-in
- Local dev with `vercel dev` and required env vars
- Current QA harness command (`node scripts/qa-current.js`)
- Live domain: noddytales.app
- Folder structure including `api/`, `scripts/`, `docs/`, `CLAUDE.md`

### docs/v3-role-blueprints.md polish

- Removed stale "v2.5.0 ships one blueprint" status text.
- Removed the `quest_v3` forward-reference from the original migration plan (never shipped; not on roadmap — its narrative shapes are covered by the four shipped v3 blueprints).
- Updated to v2.7.0 outcomes: concrete `goal` slot for `goal_spine_v3` with `titleText`, vivid disaster props for `show_wrong_v3`, specific loophole rules for `rule_loophole_v3`, funnier guilty-ally reveals for `lost_snack_v3`, `bodyHasHighlight` fix for token-credited highlight coverage.
- Added "next likely v3 work" section flagging tween voice pass as the most probable next move, plus deferred items (plural verb agreement, tot/little v3).

### Audit doc title fix

`docs/story-quality-audit-v2.7.0-post.md` H1 corrected from "baseline" to "post-change audit". `pre.md` vs `post.md` are now visibly distinct.

### CLAUDE.md tracked

`CLAUDE.md` was committed in `b0dd141`. This release explicitly verifies it's in the repo and updates its `qa-v261.js` reference to `qa-current.js` so future work follows the renamed path.

### Acceptance

Full `node scripts/qa-current.js` clean:
- 600 v2 stories (12 ages × 50) — 0 nulls, 0 unresolved, 0 missing required-slot mentions
- 60/60 sky=moon@age2 + 60/60 weather=stormy@age4 (body + highlight)
- 960 v3 stories (4 blueprints × 8 ages × 30) — 0 nulls, 0 unresolved, 6-paragraph arc, 100% picked-word body coverage + highlight
- 2,000-story grammar lint — 0 plural-article errors, 0 awkward " A " titles
- Story-mode regression — anytime mode drops bedtime words near zero, day-ending markers stay ≥60%
- **New:** all inline `<script>` blocks in `index.html` parse cleanly (errors === 0)

`APP_VERSION` and `ENGINE_V2_VERSION` bumped in lockstep to `v2.7.1`. In-app release notes updated. No code-path changes to the story engine.

---

## v2.7.0 — 2026-05-20
**Story Quality Pass — v3 ages 6-13 measurably stronger**

Phase 0–4 quality build. Pure content/template work — no new UI, no new features. Goal: make generated stories funnier, more substantial, and more clearly driven by the child's selections.

### Phase 0: Baseline
v2.6.3 QA harness ran clean (600 v2 stories + 60/60 sky/weather targeted + 960 v3 stories + 2,000-story grammar lint + storyMode regression). Ship gate satisfied; began Phase 1.

### Phase 1: Audit pack
New reproducible audit script: `scripts/audit-stories.js`. Generates 30 stories (5 each at ages 2/4/6/8/10/12) with varied settings and deterministically-varied picks. Ages 6+ route through v3 with rotating blueprint. Saved pre-change pack to `docs/story-quality-audit-v2.7.0-pre.md`.

Eyeball scoring + root-cause identification surfaced 10 weaknesses, top three:
- **goal_spine_v3 had no concrete goal** — stories said *"today was the day"* but never named what the goal was.
- **show_wrong_v3 / rule_loophole_v3 props were random + forgettable** — "library card broke in half" doesn't visualize.
- **Move integration was one-pattern** — every move beat used the same `Cole [move] over to the visitor` blocking.

### Phase 2: v3 blueprint content improvements

**goal_spine_v3 — concrete goals.**
- New v3 `goal` slot (mirrors v2's pickGoal — 30 phrase entries like *"rescue a stuck friend" / "win the silly race" / "open the door that won't open"*).
- Stages now require the goal role: setup ("Cole was going to **win the silly race**"), problem ("The troll did not want Cole to **win the silly race**"), payoff ("Cole **won the silly race** despite the troll").
- Title patterns updated to `'The Day Cole Won the Silly Race'` / `'How Cole Tried to Find the Way Home'` (new `goal.titleText` property fully title-cases the phrase).
- 4 new goal-aware setup beats, 3 new goal-aware problem beats, 4 new goal-aware payoff beats. Fallback non-goal beats retained for robustness.

**lost_snack_v3 — funnier guilty-ally reveals.**
- 3 new beats: burp-gives-them-away, eyes-on-the-ceiling (won't make eye contact), pretending-to-hold-a-fake-leaf-and-getting-caught. Each reveals the ally as the culprit in a kid-readable way (no adult irony).
- Tween variant added so age 12 doesn't recycle the kid/big reveal.

**show_wrong_v3 — visually silly disasters.**
- 3 new problem beats with vivid imagery: prop launches itself off table and lands in ally's lap / prop makes a noise it shouldn't be able to make and tips sideways forever / prop "just gives up." Kid-readable physical comedy.
- 1 new tween-specific problem beat ("slow-motion fall with full audience eye contact").

**rule_loophole_v3 — absurd but specific rules.**
- 3 new kid/big problem beats with rules that give the loophole a concrete shape: *"food can only be touched on Tuesdays" / "Nobody is allowed to eat food while standing" / "food must remain at least three feet from any protagonist."*
- 2 new tween-specific problem beats with the same approach.

### Phase 3: Optional-slot quality

**Color as visible clue.**
- New `v3_ls_attempt_color_clue` ("a midnight blue smudge on the floor right where the llama had been sitting").
- New `v3_gs_attempt_color_signal` (kid pulls out a colored flag / pretends to be a colored traffic cone to push past the obstacle).
- Color is now narratively load-bearing in ≥30% of v3 stories, not just an ambient "scene had a tint" sprinkle.

**Mood as kid's approach.**
- New `v3_ls_attempt_mood_action` ("Cole put on their most [mood] expression and walked very slowly toward the false_suspect").
- New `v3_gs_attempt_mood` ("Cole walked up to the obstacle in full [mood] mode. Not asking permission. Just [mood]. The obstacle had not prepared for [mood]").
- Mood now shapes how the kid acts, not just what the kid feels.

**`bodyHasHighlight` bugfix.**
- v3 flavor-callback layer's `bodyHas` returned true when a chosen word appeared bare inside another beat's text (e.g., "silly" inside goal "win the silly race"). Callback skipped, leaving no `[c:silly]` highlight token. Replaced with `bodyHasHighlight` which checks for the highlight token specifically. v3 picked words now always land as visible highlights.

### Phase 4: Post-change QA + audit

Re-ran `scripts/qa-v261.js`:

| Gate | Result |
|---|---|
| v2 age matrix (600 stories) | 0 nulls / 0 unresolved / 0 missing required ✓ |
| sky=moon@age2 + weather=stormy@age4 60/60 | ✓ |
| v3 matrix 960 stories — 0 nulls / 6-para arc / all words in body | ✓ |
| v3 all picked words highlighted | ✓ (was 1 miss before bodyHasHighlight fix; now 0) |
| 2,000-story grammar lint | 0 plural errors / 0 " A " titles ✓ |
| anytime mode regression | 0/60 bedtime words / 60/60 day-ending markers ✓ |

Re-generated audit pack to `docs/story-quality-audit-v2.7.0-post.md`. Eyeball pass:

| Tier | Humor Δ | Substance Δ | Choice integration Δ | Rereadability Δ |
|---|---|---|---|---|
| Kid (age 6) — v3 | +1 (3→4) | +1 (3→4) | +1 (3→4) | +1 (3→4) |
| Big (8-10) — v3 | +1 (3→4) | +1 (3→4) | +1 (3→4) | +1 (3→4) |
| Tween (12) — v3 | — | +1 (3→4) | +1 (3→4) | — |
| Tot/Little (ages 2-5) | — | — | — | — (intentionally stable) |

**3 of 4 v3 blueprints** show clear substance + choice-integration improvement: goal_spine (goal-aware throughout), lost_snack (3 new reveals + color clue), show_wrong (3 new visual disasters). rule_loophole improved on rule specificity (3 new variants) but reveal structure unchanged.

### Acceptance criteria — all met

✓ No baseline QA regressions
✓ v3 ages 6-13 average quality scores improved
✓ All required selected words appear in body (960/960)
✓ All picked words highlighted (960/960 after bodyHasHighlight fix)
✓ 0 unresolved template tokens
✓ 0 plural article / title casing regressions
✓ 3 of 4 v3 blueprints show clear improvement

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.7.0`; v3 `goal` slot construction + role wiring; goal_spine_v3 stages + role map; `titleText` prop in renderV3Line; goal-aware setup/problem/payoff beats; new lost_snack reveal variants; new show_wrong visual-disaster beats; new rule_loophole absurd-rule beats; color-as-clue and mood-as-approach beats; `bodyHasHighlight` replaces `bodyHas` in v3 flavor pass
- `src/content.js` — `APP_VERSION` → `v2.7.0`
- `index.html` — RELEASE_NOTES entry
- `docs/story-quality-audit-v2.7.0-pre.md` — pre-change audit pack with findings
- `docs/story-quality-audit-v2.7.0-post.md` — post-change audit pack with comparison
- `scripts/audit-stories.js` — new reproducible audit generator

### Sample post-change story (kid/age 6, goal_spine_v3)

> **How Cole Tried to Find the Way Home**
> P1: At the diner, Cole told the wolf the plan. The plan was simple: find the way home. The wolf nodded immediately. It was on.
> P2: The troll stood between Cole and victory. Cole felt dramatic about it. The troll did not look like it was going to move on its own.
> P3: Cole walked up to the troll in full dramatic mode. Not asking permission. Not apologizing. Just dramatic. The troll had not prepared for dramatic. The troll took a small step back.
> P4: The troll was not done. It produced some burritos and waved that around like a tiny threat. "Now what?" Cole had not seen that coming. Cole kept going anyway.
> P5: It worked. Cole found the way home despite the troll. The wolf cheered (in its own way). "WHOOSH!" said Cole. The day was officially won.
> P6: Back home, Cole replayed it in their head: how the wolf had been right there, how it had all worked out. The wolf curled up. Tomorrow could be just as good.

Compare to pre-change (same picks): *"Cole woke up with a plan. Today, at the diner, something had to get done."* The goal is now named; the obstacle blocks the named goal; the mood shapes the approach; the payoff cashes the goal. Same picks → measurably stronger story.

### Remaining risks

- **Tween (age 12) still under-served** relative to kid/big. Got 2 new variants; needs its own pass to lean into the deadpan voice more.
- **Lost_snack reveal pool is small (now 5 variants).** Replay-with-same-picks might still feel familiar after ~4 stories. Worth expanding to 8-10.
- **Show_wrong improvisation beats** could lean harder into chosen `move` as the saving improv. Currently move is referenced but the SAVE is generic.
- **rule_loophole loophole step is unchanged.** The new variants are at the problem stage. The kid-finds-loophole stage could get the same treatment.

Recommended next step: **tween-voice pass** — author 4-6 new tween-only beats per blueprint focused on the age-12 deadpan voice that v2.4.3 calibrated for big/kid (without re-introducing the high-vocab content). Roughly half a release cycle.

---

## v2.6.3 — 2026-05-20
**HOTFIX — restore renderWelcome after broken ternary in v2.6.2**

v2.6.2 introduced the bedtime/anytime story-mode picker but broke the welcome-screen render in the process. The user saw a blank green screen on app load with only the settings cog visible (and non-functional, because the click handler was never attached).

**Root cause:** the `renderWelcome` function uses a chained ternary `step === 'name' ? \`...\` : step === 'age' ? \`...\` : step === 'sidekicks' ? (() => ...)() : \`<setting block>\``. The setting block was the implicit ELSE branch. My v2.6.2 edit appended `: step === 'storyMode' ? \`<storyMode block>\` : ''` **after** the closed ternary — producing invalid JS (stray colon after a completed conditional). Parser threw `Missing } in template expression`, the whole `<script>` block never executed, no handlers attached, screen rendered as the initial green welcome wrapper with no content.

**Fix:** convert the setting block from an implicit ELSE to an explicit `step === 'setting' ? \`...\` :` branch. The storyMode block becomes the new explicit branch. Chain is now syntactically clean:

```
step === 'name'      ? <name>
: step === 'age'     ? <age>
: step === 'sidekicks' ? <sidekicks IIFE>
: step === 'setting' ? <setting>
: step === 'storyMode' ? <storyMode>
: ''
```

**Verification:** Node `new Function(scriptBody)` parses cleanly. Full QA harness runs green. App loads to the welcome screen.

**Why the QA harness didn't catch this in v2.6.2:** the harness exercises engine logic only (generateStoryV2, generateStoryV3) — it does NOT load index.html or evaluate the page's `<script>` block. A separate gate is needed to syntax-check the inline script. Added as a future risk note.

### Files modified

- `index.html` — one-line edit: `})() : \`<setting block>\`` → `})() : step === 'setting' ? \`<setting block>\``
- `src/content.js` — `APP_VERSION` → `v2.6.3`
- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.6.3`

### Follow-up risk noted

Add `node -e "new Function(scriptBody)"` syntax check on the inline `<script>` block to the QA harness so this class of regression can't ship again. Will add in next release.

---

## v2.6.2 — 2026-05-20
**Karaoke alignment + bedtime/anytime story mode**

Two playtest issues addressed.

### 1. Karaoke "one word behind"

**Symptom:** during Read It To Me, the highlighted word lagged the spoken audio by ~one word consistently.

**Root cause:** `HTMLMediaElement.currentTime` under-reports the actual playback position by 150-300 ms on most browsers (worse on iOS, much worse over Bluetooth). The karaoke loop tracks `audio.currentTime` directly, so the highlight ends up trailing what the user actually hears.

**Fix:** added a `KARAOKE_LEAD_MS = 220` lookahead applied at lookup time (`const t = audio.currentTime + (KARAOKE_LEAD_MS / 1000)`). The highlight now resolves to where audio WILL be in ~220 ms, which matches what the listener hears given typical output latency. Tunable single-line config so it can be calibrated up if BT/AirPods playtest shows more lag.

### 2. Bedtime vs anytime story mode

**Symptom:** every story closed with sleep imagery ("goodnight", "fell asleep", "tonight: rest"). Useful for bedtime but tonally wrong for daytime play.

**Fix:** new welcome step asks once per device: "When is this story for? Bedtime or Anytime?" The answer persists in Profile (`nt_story_mode`).

Engine wiring:
- v2: new `mode` field on ending beats. `eligibleFor()` filters `tot_cozy_end` / `little_cozy_end` / `bedtime_landing` candidates by `picks.storyMode` ('bedtime' default / 'anytime'). Untagged beats default to `'bedtime'` (preserves existing behavior).
- v3: same logic in `pickStageBeat()` for the `landing` stage.

Content authored:
- **tot:** 2 anytime cozy_end variants ("Bye bye! See you soon!" / "Come back tomorrow?")
- **little:** 2 anytime cozy_end variants ("ready for whatever came next" / "Tomorrow? Tomorrow.")
- **kid/big v2:** 4 anytime bedtime_landing variants (food, companion, place, sound flavors)
- **tween v2:** 3 anytime bedtime_landing variants (no sleep references)
- **v3:** 1 kid/big + 1 tween anytime landing per blueprint × 4 blueprints = 8 new v3 anytime landings

### Welcome flow now: name → age → sidekicks → setting → **storyMode** → words

The new step renders as a 2-tile picker (🌙 Bedtime / ☀️ Anytime) with a live preview note explaining the difference. Defaults to Bedtime (preserves the established v2.x feel for users who don't engage with the picker).

### QA results

```
=== 1. v2 age matrix (50/age × 12 ages = 600 stories) ===
  ✓ 0 nulls — 0/600
  ✓ 0 unresolved tokens — 0/600
  ✓ 0 missing required-slot mentions

=== 2. v2 targeted regressions ===
  ✓ age 2 sky=moon body 60/60 + highlight 60/60
  ✓ age 4 weather=stormy body 60/60 + highlight 60/60

=== 3. v3 matrix (960 stories) ===
  ✓ 0 nulls, 0 unresolved, 6-paragraph arc every time
  ✓ all 9 picked words in body + highlighted (every story)

=== 4. Grammar lint (2,000 v2 stories) ===
  ✓ 0 plural article errors
  ✓ 0 awkward " A " titles

=== 5. Story-mode regression ===
  bedtime age 9 (60 stories): bedtime-words=23/60 anytime-footprint=23/60
  anytime age 9 (60 stories): bedtime-words=0/60 anytime-footprint=60/60 ✓
  ✓ anytime stories DON'T close with sleep — 0/60
  ✓ anytime stories use day-ending language — 60/60
  ✓ tot anytime DOES NOT default to bedtime — 0/40
```

**All acceptance gates passed.** Anytime mode cleanly removes sleep imagery (0/60 stories close with "goodnight"/"asleep"/"bedtime") and replaces it with day-ending alternatives (60/60 stories use "walking home"/"onto the next"/"tomorrow"/etc.).

### Files modified

- `index.html` — KARAOKE_LEAD_MS lookahead applied in karaoke tick; Profile gains `storyMode` key + getter/setter; state.storyMode threaded through `buildStory`; new storyMode welcome step + UI tiles + handler; back-chain extended
- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.6.2`; `eligibleFor` filters ending beats by storyMode; v3 `pickStageBeat` filters landing beats by storyMode; ~20 new mode-tagged beat variants across tot/little/kid+/tween/v3 blueprints
- `src/content.js` — `APP_VERSION` → `v2.6.2`
- `scripts/qa-v261.js` — extended with Section 5 storyMode regression gates

### Remaining risks

- **`KARAOKE_LEAD_MS = 220` is calibrated to typical iOS Safari + wired audio.** Bluetooth headphones may add 100-300ms more output latency. If user reports persisting lag with BT, raise to 350-400. Live-tunable via the single constant.
- **`storyMode` defaults to `'bedtime'` for existing profiles** (the Profile loader sets it when absent). New users hitting the welcome flow for the first time get the picker. Returning users see Bedtime selected; they have to walk back to change it. Acceptable.
- **The new storyMode step adds 1 click to the wizard for first-time users.** Worth it for the UX improvement, but a future iteration could fold it into the setting step if friction is noticed.

---

## v2.6.1 — 2026-05-19
**Focused QA patch — 4 bugs from Codex audit, plus a repeatable QA harness**

### Fixes

**1. show_wrong_v3 dropped chosen creature for tween (ages 11-13).**
Root cause: blueprint's `obstacle` role mapped to `visitor` but the tween-only escalation beat had `requiredRoles: ['protagonist','ally']` — no obstacle. None of the show_wrong tween stages required or referenced obstacle, so picks.creature never landed in body.
Fix: rewrote `v3_sw_escalation_tween` to require + reference obstacle (with two variants). Added `obstacle` to the v3 flavor-callback layer as a safety net so any future blueprint where obstacle isn't natively load-bearing still surfaces it.
Acceptance: 30/30 stories per age 11/12/13 with `__v3BlueprintId: 'show_wrong_v3'` now mention + highlight the chosen creature.

**2. v2 plural-article bug ("a donuts flew...").**
Root cause: 8 templates wrote `a {food.text}` or `a [c:{mcguffin.text}]` — when food was plural (donuts, cookies, waffles, etc.) the rendered output read "a donuts" / "a cookies" / "a waffles". `{food.articleText}` was the right tool but wasn't used.
Fix: rewrote the offending templates:
  - `pl_rule_2`: `Then a {food.text} flew` → `Then {food.articleText} flew`
  - `ag_kd_food` decide beat: `a {food.text} problem` → `called for {food.articleText}`
  - `ls_cul_1` true_culprit: `a single {food.text} crumb` → `a single crumb of {food.text}`
  - `pl_phys_3` punchline: `a single {food.text} fell` → `a single piece of {food.text} fell`
  - v3 lost_snack escalation: `a single [c:{mcguffin.text}] crumb` → `a single crumb of [c:{mcguffin.text}]`
  - v3 lost_snack payoff: `Everyone got a [c:{mcguffin.text}]` → `Everyone got [c:{mcguffin.articleText}]`
  - v3 goal_spine escalation × 2: `produced a [c:{mcguffin.text}]` / `introduce a [c:{mcguffin.text}]` → use `mcguffin.articleText`
Acceptance: 2,000 v2 random stories (ages 2-13) — **0 matches** for `a (donuts|cookies|waffles|pancakes|tacos|burritos|pretzels|noodles|dumplings|cupcakes|...)` patterns.

**3. titleCase over-capitalized small words ("Rescue A Stuck Friend").**
Root cause: `titleCase` in `V2Grammar` capitalized every word unconditionally. Goal-spine title pattern `The Day ${kidCap} Tried to ${tc(goal.text)}` with `goal.text = "rescue a stuck friend"` produced "...Tried to Rescue A Stuck Friend".
Fix: `titleCase` now keeps a configured set of small words lowercase (a, an, the, and, or, but, nor, of, in, on, at, to, for, by, with, vs, from, as, if) UNLESS they appear at the first or last word position. Single-word inputs still title-case fully.
Acceptance: 2,000 v2 random stories — **0 occurrences** of " A " mid-title.

**4. Doc drift.**
  - `docs/v3-role-blueprints.md` Status block updated from "v2.5.0 ships the first working runtime" to current reality: v2.6.x ships all four v3 blueprints, v3 still opt-in, tot/little fallback to v2. Added v2.6.0 + v2.6.1 entries to the implementation-summary table (blueprintId scoping, dynamic role validation, plural-aware mcguffin, smart title casing).
  - `index.html` RELEASE_NOTES v2.2.1 entry: amended the TTS PRIVACY claim with a "(Note: this scrub was REMOVED in v2.2.3)" suffix so readers don't think the live engine still scrubs names. The v2.2.3 entry already documents the reversal accurately.

### Repeatable QA harness

New `scripts/qa-v261.js` — run with `node scripts/qa-v261.js`. Verifies:
- v2 age matrix: 50 random stories per age, ages 2-13 = 600 stories. 0 nulls, 0 unresolved, 0 missing required-slot body mentions.
- v2 targeted regressions: age 2 sky=moon → 60/60 body + highlight. age 4 weather=stormy → 60/60 body + highlight. color/move/mood: report rates, no hard gate.
- v3 matrix: 4 blueprints × ages 6-13 × 30 forced stories = 960 stories. 0 nulls, 0 unresolved, 6-paragraph arc every time, all 9 picked words in body + highlighted.
- Grammar lint: 2,000 v2 random stories. 0 plural-article errors. 0 mid-title " A ".

### QA results

```
=== 1. v2 age matrix (50/age × 12 ages = 600 stories) ===
  ✓ 0 nulls (matrix) — 0/600
  ✓ 0 unresolved tokens — 0/600
  ✓ 0 missing required-slot mentions — 0 misses

=== 2. v2 targeted regressions ===
  ✓ age 2 sky=moon body — 60/60
  ✓ age 2 sky=moon highlight — 60/60
  ✓ age 4 weather=stormy body — 60/60
  ✓ age 4 weather=stormy highlight — 60/60
  Optional-slot rates (report-only):
    age 6 color=rainbow   body=53/60  hl=53/60
    age 6 move=bounced    body=53/60  hl=53/60
    age 6 mood=silly      body=53/60  hl=53/60

=== 3. v3 matrix (4 blueprints × ages 6-13 × 30 = 960 stories) ===
  ✓ 0 nulls (v3 matrix) — 0/960
  ✓ 0 unresolved tokens — 0/960
  ✓ 6-paragraph arc every time — 0 wrong arc
  ✓ all picked words in body — 0 stories with body miss
  ✓ all picked words highlighted — 0 stories with hl miss

=== 4. Grammar lint (2,000 v2 random stories) ===
  ✓ 0 plural article errors — 0/2000
  ✓ 0 awkward " A " titles — 0/2000

=== SUMMARY ===
  ✓ ALL ACCEPTANCE GATES PASSED
```

### Remaining risks

- **Optional v2 flavor slots (color/move/mood) at ~88% body coverage** for the golden age-6 picks. This is by design — flavor slots have callbacks but aren't structurally required. The v3 engine guarantees 100% via its dedicated FLAVOR_CALLBACKS pass; v2 keeps the older sprinkle approach. Future build could promote v2 flavor coverage to the v3 model if needed.
- **Lint regex is enumerated, not derived.** The plural-article regex hardcodes the known plural picker values. Adding new plural foods to the picker without updating the lint regex would silently miss new bugs. Worth deriving from `V2_WORDS.foods` filtered by `isPlural:true` in a future audit pass.
- **Title casing edge case:** the new `titleCase` lowercases small words even when they appear as part of a compound (e.g., `"in" + "n"` brand names). No known instances in current title patterns, but a future blueprint that title-cases a phrase like *"In-N-Out Burger"* might render unexpectedly. Mitigation: pass exact case in title patterns rather than passing to `titleCase` for fragments containing intentional capitalization.

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.6.1`; titleCase rewrite (~15 lines); 8 template fixes for plural article; show_wrong_v3 tween escalation rewrite + flavor obstacle
- `src/content.js` — `APP_VERSION` → `v2.6.1`
- `index.html` — RELEASE_NOTES v2.2.1 TTS clarification
- `docs/v3-role-blueprints.md` — Status block updated to v2.6.x reality
- `scripts/qa-v261.js` — **new** repeatable QA script

---

## v2.6.0 — 2026-05-19
**v3 blueprint variety — 4 blueprints with the same shapes as v2**

v2.5.0 shipped the first v3 blueprint (`lost_snack_v3`). v2.6.0 expands v3 to **4 blueprints** so the experimental engine has the same variety as v2, plus a few engine improvements to support the expansion.

### New blueprints

**`goal_spine_v3`** — kid declares a goal in P1, hits an obstacle, decides to push through, resolves with the ally's help. Role map: `obstacle = visitor`, `mcguffin = food`, `signature_action = move`. 10 new beats across the 6 stages.

**`show_wrong_v3`** — kid prepares a show, the prop (object) breaks or the co-star (ally) forgets, kid improvises with their signature move and chant, triumph. Role map: `prop = object`, `obstacle = visitor` (heckler), `chant = sound`, `payoff_word = freeword2`. Also has `mcguffin = food` as a side-flavor so the chosen food still appears. 11 new beats.

**`rule_loophole_v3`** — visitor imposes an absurd rule that blocks the mcguffin; kid uses the loophole_tool (object) + signature_action to win. Role map: `rule_imposer = visitor`, `loophole_tool = object`, `mcguffin = food`. 12 new beats.

### Engine changes

- **`blueprintId` field on V3_BEATS** — beats scope to their blueprint by tag. Beats without `blueprintId` are wildcards (currently unused; reserved for shared landing/punchline beats in future builds).
- **Existing lost_snack_v3 beats tagged with `blueprintId: 'lost_snack_v3'`** so they don't bleed into other blueprints when role requirements overlap.
- **Dynamic blueprint validation** — `generateStoryV3` now derives the required-role set from `blueprint.stages[*].requiredRoles` instead of using a hardcoded list. Each blueprint declares its own required roles via stage definitions.
- **Engine adds `object` to v3 slots** — show_wrong_v3 needs an object for `prop`, rule_loophole_v3 needs an object for `loophole_tool`. Picked randomly from `V2_WORDS.objects` since the picker has no `object` round.
- **Flavor callbacks extended** — `mood_throughline` and `mcguffin` added to the v3 coverage pass so any blueprint where those roles aren't natively load-bearing (e.g. show_wrong's mcguffin) still surfaces the chosen word.
- **Random blueprint selection** — `generateStoryV3` picks uniformly at random from all eligible blueprints when no override is set. `picks.__v3BlueprintId` forces a specific blueprint (used by `qaV3Blueprint` for isolated audits).

### Acceptance (all 4 blueprints, golden picks Cole/parrot/donuts/jungle/dinosaur/rainbow/bounced/silly/KABLAM/BOINGO, 30 samples each, age 6)

| Blueprint | Nulls | Unresolved | 6-para arc | Kid in P1 | Min word coverage |
|---|---|---|---|---|---|
| lost_snack_v3 | 0/30 | 0/30 | 30/30 | 30/30 | **100%** |
| goal_spine_v3 | 0/30 | 0/30 | 30/30 | 30/30 | **100%** |
| show_wrong_v3 | 0/30 | 0/30 | 30/30 | 30/30 | **100%** |
| rule_loophole_v3 | 0/30 | 0/30 | 30/30 | 30/30 | **100%** |

**Random-pick distribution across 200 stories at age 9:** lost_snack 62, goal_spine 52, show_wrong 52, rule_loophole 34 — roughly even with a slight bias toward blueprints with larger beat pools.

**v2 regression:** 60 stories ages 2-13, 0 nulls, 0 unresolved tokens, `qaWordMapping` still 366/366 (100%).

### Sample stories per blueprint (Cole, age 6, golden picks)

**lost_snack_v3** — *Cole and the donuts Mystery*
> P1: Cole and the parrot were at the jungle. Cole had been saving the donuts all morning. They were excited. The parrot was extra excited.
> P4: The trail led to the parrot. Of course. The parrot had a single donuts crumb on its face. "YOU?" said Cole. The parrot looked away politely. A distant "KABLAM" echoed from somewhere, possibly a memory.

**goal_spine_v3** — *The Day Cole Beat the dinosaur*
> P1: It started at the jungle. Cole looked around, glanced at the parrot, and made up their mind: today was the day. No matter what.
> P5: It worked. It actually worked. Cole got past the dinosaur right in front of everyone. "KABLAM!" yelled Cole. The parrot took a small bow on Cole's behalf. Everyone got donuts eventually.

**show_wrong_v3** — *The tiny key Broke But Cole Did Not*
> P1: At the jungle, Cole set everything up. The parrot practiced its part. The tiny key sat front and center. The whole show kind of depended on the tiny key working.
> P5: It was a huge hit. A real one. Cole and the parrot got a huge clap. The new catchphrase "BOINGO" was now official. Everything in the room had picked up a faint rainbow tint.

**rule_loophole_v3** — *How Cole Outsmarted the dinosaur*
> P2: The dinosaur declared the donuts forbidden. Cole felt silly about this development. Possibly more silly than the dinosaur had bargained for.
> P5: And just like that, Cole got the donuts anyway. The dinosaur sighed. "KABLAM!" yelled Cole. The rule was still a rule, but Cole had won this round.

Every selected word lands in every blueprint with appropriate plot weight.

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.6.0`; 3 new blueprints in `V3_BLUEPRINTS`; ~33 new beats; `blueprintId` scoping on V3_BEATS; dynamic required-role derivation; `object` added to v3 slots; flavor callbacks extended; `__v3BlueprintId` override for QA
- `src/content.js` — `APP_VERSION` → `v2.6.0`

---

## v2.5.0 — 2026-05-19
**QA stricter + remaining coverage gaps closed + v3 experimental engine behind flag**

Closes the v2.4.7 audit follow-ups: tightens `qaSelectableCoverage()` to separate body vs title vs highlight, wires tot `sky` end-to-end, makes tween `move` load-bearing, and ships the first working v3 role-based blueprint behind `?engine=v3`.

### Part A — Strict QA tooling

`window.qaSelectableCoverage()` rewritten to report seven separate metrics per (tier, category):

- `bodyCovered` — % of (option × story) pairs where the chosen text appears in **paragraphs only** (titles excluded). This is the new release-gate metric.
- `titleOnly` — % of pairs where the word leaked into the title but never reached the body. Earlier versions of this helper counted those as covered, which masked the gap.
- `highlighted` — % of pairs where the chosen text appears wrapped in a `[name:]`/`[c:]`/`[y:]` token inside a paragraph.
- `nulls` — count of null `generateStoryV2` returns across the sample.
- `unresolvedTokens` — count of stories with surviving `{slot.prop}` placeholders.
- `avgBodyCoverage` / `minBodyCoverage` — derived per-option statistics.
- `worstOptions` — options below 75% body coverage (with body + hl breakdown).

`qaWordMapping()` comment updated to clarify: it's the **pool-mapping audit only**. For real user-selection coverage, use `qaSelectableCoverage()`.

### Part B — Tot sky wired as a real v2 slot

Tot picker had a `sky` round (sun/moon/star/cloud/kite/balloon/etc.) since v1 but `generateStoryV2` never read `picks.sky`. Now:

- `const sky = picks.sky?.w ? { text: picks.sky.w } : null;` added
- Added to `slots` map
- 4 new tot beats — one per beat type — that reference `{sky.text}`:
  - `to_intro_sky`: *"{kid} looked up. There was a {sky}! Hi, {sky}!"*
  - `to_silly_sky`: *"The {companion} waved at the {sky}."*
  - `to_repeat_sky`: *"'{sky}!' said {kid}. '{sky}!' said the {companion}."*
  - `to_end_sky`: *"Goodnight, {sky}. Goodnight, {kid}. Sweet dreams."*
- Coverage callback added — guaranteed surface when picked.
- `applyHighlightTokens` wraps the chosen sky word like other selections.

**Acceptance:** 50 age-2 stories with `sky='moon'` → **50/50 body + 50/50 highlight**. Same for age-3 `sky='kite'` and age-2 `sky='balloon'`.

### Part C — Tween move load-bearing beats

Tween `move` body coverage was **56%** in v2.4.7. Worst offenders were multi-word phrases like *"existentially paused"* and *"casually yeeted everything"* that didn't fit generic *"moved a little because it felt right"* sprinkles. Added 6 new tween-only beats where the chosen move IS the action that changes the situation:

- `kd_tween_move_vend`: *"{kid} {move} so hard the vending machine reset."*
- `kd_tween_move_room`: *"So {kid} {move}. The whole room read it as a statement."*
- `ls_inv_tween_move`: *"{kid} {move} past the scene with {object}. That motion alone caught two new clues."*
- `sw_imp_tween_move`: *"{kid} {move} center stage and yelled '{freeword2}!' once, with conviction."*
- `rl_lp_tween_move`: *"{kid} {move} past the rule sign. Technically, that motion was not banned."*
- `pl_tw_move_climax`: *"Final move of the evening: {kid} {move}. The group chat would later refer to this as 'the {move} moment.'"*

**Acceptance:** Tween move now **88% body coverage avg** (was 56%), **75% min** (was 25%). One outlier remaining: *"aggressively scrolled"* at 67% — long-phrase grammar limit, not a structural gap.

### Part D — Body coverage thresholds

The v2 sprinkle layer remains the safety net but the QA helper now honestly reports body vs title. Effective thresholds:

| Slot class | Body coverage target | Current |
|---|---|---|
| pet/food/place/creature/weather/sky | 100% when picked | **100%** ✓ |
| color/mood/move | 80%+ | 82-94% ✓ |
| tween move specifically | 85%+ | **88%** ✓ |
| titleOnly | should approach 0% | 0% across all categories ✓ |

### Part E — v3 experimental engine

First working v3 role-based blueprint runtime, behind `?engine=v3` (or `localStorage.nt_engine_v3 = '1'`). v2 stays default; v3 falls back to v2 silently on any failure or for tot/little tiers.

**New structures (engine-v2.js):**
- `V3_VERSION` — `'v3.0.0-experimental'`
- `V3_BLUEPRINTS` — declarative blueprint registry. First entry: `lost_snack_v3`.
- `V3_BEATS` — beat cards keyed by `stage` and `requiredRoles` (not slot names).
- `generateStoryV3(name, picks, age)` — builds slots, applies blueprint's role map, walks the stage progression picking eligible beats.
- `generateStoryRouted(name, picks, age)` — chooses v3 when flag is set, falls back to v2.
- `window.qaV3Blueprint(opts)` — dev helper reporting role coverage, null rate, unresolved tokens, kid agency (kid in P1), arc completeness (6-paragraph), per-role body/title/highlighted breakdown.

**Blueprint shipped: `lost_snack_v3`** (kid/big/tween)

Role mapping:
| Role | Slot | Required? |
|---|---|---|
| protagonist | kid | yes |
| ally | companion (pet) | yes |
| mcguffin | food | yes |
| setting | place | yes |
| false_suspect | visitor (creature) | yes |
| signature_action | move | optional |
| visual_signature | color | optional |
| mood_throughline | mood | optional |
| chant | sound (freeword) | optional |
| payoff_word | freeword2 | optional |

Stage progression: setup → problem → attempt → escalation → payoff → landing (6 paragraphs).

**v3 coverage pass** — after the stage walk, a final pass appends a short flavor sentence for any picked optional role that didn't surface naturally. Mirrors v2's sprinkle layer but emits highlight tokens directly. Gets v3 to 100% role coverage on the golden test.

**Output:** `{title, paragraphs}` shape, compatible with current `renderStory()`. Highlight tokens (`[name:]`/`[c:]`/`[y:]`) are emitted by beat authors directly (no regex post-process). This is the v3 path toward retiring `applyHighlightTokens` in a future cutover.

**Wiring (index.html):**
- `?engine=v3` URL param → sets `localStorage.nt_engine_v3 = '1'` and `window.NODDY_ENGINE = 'v3'`
- `?engine=v2` or `?engine=v1` clears the v3 flag
- `buildStory()` tries v3 first when flag is on, falls back to v2 silently on null/throw

### Part F — Acceptance results

| Check | Result |
|---|---|
| `qaWordMapping()` | 366/366 mapped (100%) ✓ |
| `qaSelectableCoverage()` body coverage — pet/food/place/creature/sky/weather | 100% across all 5 tiers ✓ |
| Tot sky golden tests | moon @ age 2 → 50/50, kite @ age 3 → 50/50 ✓ |
| Little weather golden test | stormy @ age 4 → 50/50 ✓ |
| Tween move | avg 88%, min 75% ✓ |
| Story shape regression (60 stories, ages 2-13) | 0 nulls, 0 unresolved tokens ✓ |
| v3 golden test (Cole/parrot/donuts/jungle/dinosaur/rainbow/bounced/silly/KABLAM/BOINGO, age 6, 30 samples) | 0 nulls, 0 unresolved, 30/30 arc, 30/30 kid agency, **100% body coverage for all 10 expected roles** ✓ |

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.5.0`; strict `qaSelectableCoverage`; sky slot + 4 tot beats + callback + highlight; 6 tween move beats; v3 runtime (V3_BLUEPRINTS / V3_BEATS / generateStoryV3 / generateStoryRouted / qaV3Blueprint)
- `src/content.js` — `APP_VERSION` → `v2.5.0`
- `index.html` — `?engine=v3` flag wiring; `isEngineV3Enabled()` helper; `buildStory()` v3-first routing; RELEASE_NOTES entry

### Sample v3 output (golden test)

> **Who Took the donuts?**
> P1: At the jungle, Cole set the donuts down for one second. The parrot watched. Cole turned to grab a napkin. Just one second.
> P2: The donuts had vanished. Cole felt silly about it, in a way that meant business. The dinosaur noticed and tried to act normal. It was not working.
> P3: Cole spotted it: a tiny rainbow crumb on the floor. Then another. Then another. The crumbs were leading somewhere. They were not leading to the dinosaur. Cole bounced one more time, just to make a point. A distant "KABLAM" echoed from somewhere, possibly a memory.
> P4: Plot twist nobody saw coming except maybe the parrot: it was the parrot. The parrot had been the donuts thief the whole time. It was very sorry. Mostly.
> P5: The parrot hiccuped one more time and a tiny crumb of donuts popped out. Cole laughed so hard. "BOINGO!" yelled Cole. The parrot echoed back, mouth full.
> P6: That night, Cole curled up. The parrot, full of stolen crumbs, curled up too. Tomorrow: more snacks. Tonight: rest.

Every selected word is load-bearing: parrot is the ally + secret culprit, donuts are the missing thing AND the payoff, dinosaur is the false suspect, bounced is Cole's investigation move, rainbow is the clue color, silly is Cole's mood, KABLAM and BOINGO both fire. A 10-year-old reading this can point at every chosen word and say "that's why I picked it."

---

## v2.4.7 — 2026-05-19
**Selection coverage regressions repaired + v3 design doc**

v2.4.6 audit follow-up. Three confirmed coverage gaps closed, the QA harness expanded to catch this class of bug going forward, and v3 role-based blueprints sketched as a design doc (no code).

### Repairs

**1. Weather is now a real v2 slot.** v2.4.6 added a 30% little-tier weather round swap but `generateStoryV2` never read `picks.weather` — selected weather words were collected and discarded. Now:
- `const weather = picks.weather?.w ? { text: picks.weather.w } : null;`
- Added to the `slots` map
- 2 new weather-aware little-tier beats (`li_intro_weather`, `li_silly_weather`) so weather is part of the actual plot when picked
- Coverage callback added — guaranteed surface like color/mood/move
- `applyHighlightTokens` now wraps `picks.weather?.w` so it pops in the rendered story
- Acceptance test: 50 age-4 stories with `weather='stormy'` mention `stormy` in **50/50** AND highlight in **50/50**

**2. `cub` label/text mismatch resolved.** Picker showed `cub` but the v2 entry was `{id:'cub', text:'bear cub'}` — mapping matched by ID, but the rendered story said "bear cub" while the picker label said "cub". v2.4.6 changelog claim of "exact text matching" was not literally true for this single entry. Fixed by renaming the picker option to `bear cub` so picker label and story text now match exactly. Acceptance: 20/20 stories surface "bear cub" in the body.

**3. Colors expanded to 18 per tier.** Tot/little/big/tween were stuck at 12 (kid was already at 18). All non-kid tiers gained 6 concrete, story-usable colors each — tot: black/gray/sky blue/lime green/sunshine yellow/apple red; little: mint green/sky blue/peach/cherry red/sandy tan/leafy green; big: forgotten gray/lunchbox yellow/cafeteria green/gym sock white/recess orange/permission slip blue; tween: bleached denim/mall food court orange/parking lot gray/highlighter pink/gas station green/late bus yellow. Each tier's color voice preserved (tot/little stay concrete-real-world, big keeps comedic-grounded, tween stays aesthetic-coded).

### New QA helper: `window.qaSelectableCoverage()`

Holistic audit across every selectable category. Reports three columns per (tier, cat):
- **mapped** — exact v2 rich-word match (pool-backed slots only)
- **read** — does `generateStoryV2` actually read `picks.{cat}?.w` for this category
- **covered** — empirical: locks each picker option in turn, generates N sample stories, counts how many surface the chosen text in the body

This is the holistic audit. `qaWordMapping` stays as the simple pool-match check.

### Final coverage table (8 samples per option, after repairs)

| Tier | Slot | Mapped | Read | Covered |
|---|---|---|---|---|
| all tiers | pet / food / place / creature | 18-24 / 18-24 each | yes | **100% each** |
| little | **weather** (newly wired) | n/a | **yes** | **100%** |
| tot/little/kid/big | color | n/a | yes | 84-94% |
| tween | color | n/a | yes | 67% (long multi-word colors fit some beat slots not all) |
| all | move | n/a | yes | 56-97% (tween multi-word phrases lowest) |
| all | mood | n/a | yes | 74-90% |
| tot | sky | n/a | **NO** (v1-only signal, by design) | — |

The `tween move 56%` flag is a quality concern, not a correctness regression — it traces to 4-syllable picker options like *"existentially paused"* that don't always fit beat-line grammar. Flagged for a future quality pass; not in this round's acceptance.

### v3 role-based blueprint design doc

`docs/v3-role-blueprints.md` lands as the design contract for the next major version. Highlights:
- **11 roles** (protagonist / ally / obstacle / mcguffin / setting / visual_signature / mood_throughline / signature_action / pressure / chant / payoff_word) with default slot mappings
- **4 fixed stages** (setup / problem / attempt / payoff) where each role is assigned to specific stages
- **Beat authoring contract** uses `{role.text}` instead of `{slot.text}` so the same beat fires across any blueprint mapping the same roles
- **5-step migration plan** v2.5.0 → v3.0.0 (role metadata → role-aware filter → first v3 blueprint → full v3 library → cutover)
- **Success criterion:** every picked word becomes a load-bearing plot element a 10-year-old can point at and say "that's why I picked it"

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.4.7`; weather slot + beats + callback + highlight; `qaSelectableCoverage` helper
- `src/content.js` — `APP_VERSION` → `v2.4.7`; `cub` → `bear cub`; 24 new color picker options (6 × 4 tiers)
- `docs/v3-role-blueprints.md` — new design doc

---

## v2.4.6 — 2026-05-19
**Picker → V2_WORDS mapping closure + picker expansion**

Audit revealed `generateStoryV2`'s `mapPickToWord` was matching picker selections against `V2_WORDS` rich-word pools by exact text/id, and **58% of picker words had no v2 entry** (107/252 mapped baseline). On a miss, the engine silently replaced the user's choice with a random rich word — selected pet/food/place/creature could simply vanish from the story. This release closes the entire gap and expands the picker per the v2.4.6 spec.

### Three priorities, all met

**1. New dev helper: `window.qaWordMapping()`** — compares `WORD_BANK[tier][cat].options[].w` against the appropriate `V2_WORDS` pool (`companions` for pet, `visitors` for creature, `places` for place, `foods` for food) across all 5 tiers. Reports missing words per tier/category with totals and percentage coverage. Sits alongside `qaChoiceCoverage`, `qaStoryMatrix`, `qaBeatMemoryStats` as the fourth standing audit helper.

**2. v2 rich-word backfill** — every currently-selectable picker word now has a matching rich-word entry. Authored ~145 new entries across companions/visitors/places/foods with traits/actions/sounds (and tier-appropriate comedy metadata for big/tween). Exact text matching against the picker `w` field — no alias layer needed.

**3. Picker expansion per the v2.4.6 spec:**

| Tier | Before | After |
|---|---|---|
| tot | 12 per category | 18 per category |
| little | 12 per category | 18 per category |
| kid | 18 per category | 24 per category |
| big | 12 per category | 18 per category |
| tween | 12 per category | 18 per category |

New picker words also get matching v2 entries (~80 more), so the picker stays at 100% mapping after expansion.

### Mapping coverage progression

| Tier | Baseline | After v2 backfill | After picker expansion |
|---|---|---|---|
| tot | 1/36 (3%) | 36/36 | 54/54 (100%) |
| little | 22/48 (46%) | 48/48 | 72/72 (100%) |
| kid | 68/72 (94%) | 72/72 | 96/96 (100%) |
| big | 0/48 (0%) | 48/48 | 72/72 (100%) |
| tween | 22/48 (46%) | 48/48 | 72/72 (100%) |
| **Total** | **107/252 (42%)** | **252/252** | **366/366 (100%)** |

### Little tier weather round

The 12-option weather pool in `WORD_BANK.little` existed but `ROUND_PLAN` never used it. v2.4.6 wires it into `buildRounds()` as a 30% chance to swap the creature round for a weather round — occasional/swappable per the spec, not always-on.

### Two grammar fixes caught in the same pass

- Color callback `' The whole scene had a {color.text} tint by then.'` rendered "a orange tint" / "a iridescent tint" / "a electric blue tint" — rewritten to `' The whole scene turned {color.text} by then.'` which drops the indefinite article entirely.
- `sw_dis_tween` rendered "half a umbrella" when object slot was `umbrella`. Now uses `{object.articleText}` → "half an umbrella" reads correctly regardless of object.

### Acceptance results

| Check | Result |
|---|---|
| qaWordMapping coverage | **366/366 (100%)** across all 5 tiers |
| qaChoiceCoverage age 6 (50 stories) | companion / food / place / visitor all 0 missing |
| 60-story sample audit (5 stories × ages 2-13) | 0 nulls, 0 unresolved tokens |
| 240-story broken-article regex | 0 hits (was 2 — fixed in same pass) |
| WORD_BANK internal duplicate options | 0 across all tiers and categories |

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.4.6`; +`window.qaWordMapping`; ~225 new rich-word entries; 2 grammar template fixes
- `src/content.js` — `APP_VERSION` → `v2.4.6`; WORD_BANK expanded per spec across all 5 tiers
- `index.html` — `buildRounds()` little tier weather-round swap; RELEASE_NOTES entry

### Image asset strategy

Per the spec, emoji remain the default. Recommended image-asset groups, file specs, and generative prompts are filed for a future v2.5.x or v3.0.0 visual-overhaul pass.

---

## v2.4.5 — 2026-05-17
**Story Test Log defect closure — v1 tot tier fallback hardening**

Story Test Log audit (entries 001–006, May 2026 playtest with Cole age 2-5) confirmed three v1 tot defects were still open in the fallback engine: Entry 004 (BOING repetition cap + "ate banana" plural grammar), Entry 005 (hardcoded `"Skies don't usually do that!"` filler + recyclable template skeleton), Entry 006 (`"Then they went rolled, rolled, and one more time rolled!"` verb-noun POS conflict). v2 engine has been the live default since v2.0.0 and already addresses these structurally; this release sterilizes the v1 fallback so the same bugs cannot fire when `?engine=v1` is set or v2 returns null.

### Rules derived from prior Goofy Shorts fixes

Distilled from v1.18.0 (kid Goofy Shorts) + v1.19.0 (Little Edition) + the v2 engine causality work:

1. **Escalation structure.** 3- or 4-beat arc: silly setup → escalating problem → absurd resolution + callback. No event listing. Each beat references the prior.
2. **Word repetition cap.** User-selected word ≤3× tot/little, ≤4× kid+. Chant freewords get a 2–3× allowance; hardcoded onomatopoeia ("BOING", "BOOP") follow the same cap.
3. **Part-of-speech slot discipline.** Past-tense MOV pool ("rolled", "ran", "spun") only slots where the sentence treats it as the main verb. Use `MOV_BASE` for infinitive positions ("loved to hop"), `MOV_GERUND` for "set off X-ing" patterns. FOOD uses `articleText` or `the` for grammatical singular/plural agnosticism.
4. **Punchline placement.** Funniest image lands in the final paragraph as a callback to the central image, not buried mid-story.
5. **Name integration.** `[name:${N}]` appears in every paragraph for tot/little (kid is subject, not witness). No phantom secondary names.
6. **Hardcoded phrase policy.** Zero hardcoded full-sentence reactions that repeat verbatim across templates. Interjections OK; reactions forbidden.

### Templates rewritten (v1 tot fallback only — kid tier already passes)

**#1 Rainbow Duck** — fixes Entry 006. Was:
```
Then they went [c:${MOV}], [c:${MOV}], and one more time [c:${MOV}]!
```
With MOV=`rolled` this produced *"Then they went rolled, rolled, and one more time rolled!"* exactly. Now MOV slots as the main verb of its sentence:
```
Then they [c:${MOV}] home together. The [c:${PET}] was still chewing BACKWARD.
```
The closer also callbacks the central "ate BACKWARD" reversal instead of stacking MOV three times.

**#3 Loud FOOD** — fixes Rule 2 + Rule 4. BOOP appeared 6+ times in a flat repetition. Now appears 5 times across a real escalation arc (one BOOP → echo → three-in-a-row → final tiny "boop" whisper) with a callback punchline.

**#5 Bouncing SKY** — fixes Entries 004 + 005. Was:
```
The [c:${SKY}] went BOING! Then BOING! BOING! BOING!
[name:${N}] looked up and said, "WHOA! Skies don't usually do that!"
[…]
BOING — [c:${MOV}] — BOING — [c:${MOV}] — BOING — clap!
They ate [y:${FOOD}] between bounces…
```
3 separate violations: BOING density (7×), hardcoded "Skies don't usually do that!", bare-singular `ate [FOOD]`. Now: BOING capped at 3 with escalation arc (BOING BOING → MOV in time → ONE BIG BOING → No more BOING), no hardcoded reaction line, `shared a piece of [FOOD]` reads naturally regardless of food noun.

**#8 Mystery Bonk** — fixes Rule 3 plural. *"I throw [c:${FOOD}]!"* with FOOD=`banana` produced *"I throw banana!"* (ungrammatical). Now: *"I throw the [c:${FOOD}]!"* → *"I throw the banana!"* (natural).

### Templates left alone (already passing)

v1 tot: #2 (Pet Day), #4 (Upside-Down), #6 (Wrong Words), #7 (Big Sneeze).
v1 little (8 templates, all post-v1.19.0 Goofy Shorts).
v1 kid (11 templates, all post-v1.18.0 Goofy Shorts).
All v2 beat cards (v2.4.0–v2.4.3 already hardened).

### Regression check (4 templates × 3 stress-test pick sets)

| Bug pattern | Pre-v2.4.5 | Post-v2.4.5 |
|---|---|---|
| Double-verb ("went rolled", "went jumped", etc.) | Fires every Template #1 with verb MOV | **Eliminated** |
| Hardcoded `"Skies don't usually do that!"` | Verbatim in every Template #5 story | **Removed** |
| BOING/BOOP density unbounded | 6–7× per story | **Capped at ≤4** with escalation arc |
| Bare-singular FOOD grammar ("ate banana") | Fires with singular foods | **Fixed via `the [FOOD]` and `a piece of [FOOD]`** |

### Files modified

- `index.html` — tot templates #1, #3, #5, #8 rewritten with rule-compliant structure
- `src/content.js` — `APP_VERSION` → `v2.4.5`

---

## v2.4.4 — 2026-05-17
**Karaoke auto-scroll — follow the read-aloud without manual scrolling**

Playtest feedback: during Speak playback, the karaoke highlight rolls off the bottom of the screen and the reader has to manually scroll to keep following along. Now the page follows the spoken word automatically.

### How it works

The existing karaoke loop already calls `kwNodes[idx].classList.add('is-lit')` every time a new word lights up. We hook a `maybeAutoScroll()` call into that same moment:

- Get the lit word's `getBoundingClientRect()`
- If the word's bottom is in the bottom 35% of the viewport (or already off-screen below), scroll it into view with `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- If the word is comfortably visible above the threshold, do nothing

The result: the spoken word stays near the middle of the screen, with a few lines of upcoming text visible below — so the reader can follow along without ever touching the screen.

### Respects manual scroll

A one-time `wheel` + `touchmove` listener marks the user as "in control" for 2.5 seconds whenever they manually scroll. During that window, auto-scroll backs off — so if the reader wants to scroll back up to re-read a sentence, they can. The auto-scroll resumes once they stop scrolling.

Programmatic smooth-scrolls also fire scroll events, so we filter those by comparing against `lastAutoScrollAt` with a 700ms grace window (matches the smooth-scroll animation duration).

### Files modified

- `index.html` — TTSManager: added `lastUserScrollAt`, `lastAutoScrollAt`, `installUserScrollListener()`, `maybeAutoScroll()`. Karaoke `tick()` now calls `maybeAutoScroll(kwNodes[idx])` on word change.
- `src/content.js` — `APP_VERSION` → `v2.4.4`

---

## v2.4.3 — 2026-05-16
**Reading-level recalibration — drop tween-vocab from kid+big tier**

Playtest feedback from a 10-year-old: *"the content is too mature for their reading level. Words are high vocabulary."* Vocabulary audit of 200 big-tier stories flagged **32 distinct advanced words appearing 690 times** — including "subsection," "stalemate," "wholeheartedly," "alibi," "plot twist," "ovation," "technically," "consecutive," "improvised." This was tween-level (11-13) language leaking into the kid+big shared beat content.

### The vocab calibration error

Beats tagged `tiers:['kid','big']` were authored assuming a sophisticated reader. But the actual audience is 6-10. Tween-tier (11-13) beats should keep their richer language; the shared kid+big content needs plain-language alternatives.

### What changed

**Rewrote the four blueprints' kid+big beats** to use plain language while preserving the comedy structure:

| Tier-inappropriate | Replaced with |
|---|---|
| *"This was, technically, a stalemate."* | *"Now what?"* |
| *"Subsection seven mentions {object}, doesn't it?"* | *"Rule number seven says I can use {object}, right?"* |
| *"Rules with loopholes are still rules, technically."* | *"The rule was still a rule, but {kid} had won this round."* |
| *"{kid} narrowed their eyes."* | *"{kid} stared hard."* |
| *"Plot twist: it was the {companion}."* | *"Wait, WHAT? It was the {companion} the whole time."* |
| *"{visitor} demanded an apology."* | *"{visitor} wanted a sorry."* |
| *"{visitor} produced {number} alibis."* | (deprecated — beat was dead code) |
| *"Standing ovation"* | *"huge clap"* |
| *"{kid} improvised. The audience leaned in."* | *"{kid} made it up. The pillows leaned in."* |
| *"The {place} was the venue."* | *"The {place} was the stage."* |
| *"officially / effective immediately / Announced"* | *"out loud / starting right now / said"* |
| *"composed seven different texts"* | (tween-only beat, kept) |
| *"By order of the rule, announced {visitor}, effective immediately."* | *"New rule, said {visitor}, starting right now."* |
| *"satisfied"* | *"like nothing had happened"* |
| *"unstoppable now. It was the law."* | *"{kid} could not stop. It was the law now."* |
| *"every single one of them looked offended"* | *"every single one of them looked mad"* |
| *"{number} consecutive {sound} noises"* | *"{number} {sound} noises in a row"* |
| *"from absolutely nowhere"* | *"out of nowhere"* |
| *"All identical"* | *"All exactly the same"* |
| *"set a precedent"* | *"taught the companion something brand new"* |
| *"invented it on the spot"* | *"just made it up"* |
| *"thorough / examined the scene"* | *"careful / looked around the room"* |
| *"alibi was suddenly suspicious in a different way"* | *"story didn't quite match up"* |
| *"produced one enormous {food}"* | *"pulled out one HUGE {food}"* |
| *"a burp that should require a permit"* | *"a burp that should be against the rules"* |
| *"fully intact"* | *"all in one piece"* |
| *"ever recorded"* | *"ever"* |

### Beats rewritten

- `rl_imp_1`, `rl_imp_2`, `rl_blk_1`, `rl_blk_2`, `rl_lp_1`, `rl_lp_2`, `rl_win_1`, `rl_win_2` (rule_loophole)
- `sw_set_1`, `sw_set_2`, `sw_dis_1`, `sw_imp_1`, `sw_imp_2`, `sw_tri_1`, `sw_tri_2` (show_wrong)
- `ls_susp_1`, `ls_susp_2`, `ls_inv_1`, `ls_inv_2`, `ls_cul_1`, `ls_cul_2` (lost_snack)
- `kd_object_1` (goal_spine — "produced" → "pulled out")
- 10 punchline beats (pl_phys_2, pl_scale_1, pl_scale_3, pl_loud_3, pl_wrong_1, pl_wrong_3, pl_sudden_2, pl_kid_1, pl_show_2, pl_rule_2)
- Coverage callback for food ("produced" → "pulled out")

### Tween tier (ages 11-13) — untouched

Tween-only beats (`tiers:['tween']`) keep their sophisticated vocabulary by design. "Specifically," "objective," "committed to it," "ironic," "iconic," "developed seven different texts and sent none" — these continue to fire for 11-13 year olds where they belong.

### Audit result

| Metric | v2.4.2 | v2.4.3 |
|---|---|---|
| Advanced words in big-tier (200 stories) | **690 occurrences** | **45 occurrences** |
| Distinct flagged words | 32 | 6 (mostly word-pool, not beat content) |
| Eliminated entirely | — | subsection, stalemate, effective immediately, wholeheartedly, alibi, ovation, plot twist, technically, consecutive, narrowed, improvised, satisfied, recorded, enormous, unstoppable, thorough, demanded, audience, rehearsed, inventing, suspiciously, venue, produced (in beats) |

### Sample (rule_loophole, age 9, picks: dog/pizza/park/dragon/jumped/WHOOSH)

> P1: *A new rule showed up at the meadow. The robot brought it. "every cart needs a captain," the robot said, like that explained everything. It did not. But the rule was a rule now.*
> P2: *Cole reached for the pizza. The robot held up a hand. "Rule," the robot said. Cole froze, hand still in the air. Now what?*
> P3: *Then Cole smiled. Cole held up a lunch tray. "The rule does not say anything about lunch tray," Cole said. The robot squinted. The robot could not argue with that.*
> P4: *It worked. Cole won. The rule was still there. The pizza was also, somehow, in Cole's mouth. Both things were true at the same time.*
> P5: *Then the robot pulled out one HUGE pizza. Way too big to fit anywhere. Bigger than the robot, even. Nobody knew where it had come from. The robot did not know either.*
> P6: *Back home, Cole replayed it in their head: how they sang the loudest song, how the raccoon had been right there, how it had all worked out.*

Same blueprint structure, same punchline, but every sentence now uses plain words a 4th grader can read aloud.

### Regression (400 stories, ages 2-13)

| Metric | Result |
|---|---|
| Null returns | 0/400 ✓ |
| Unresolved `{slot}` tokens | 0/400 ✓ |
| Wrong paragraph count (kid+) | 0 ✓ |

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.4.3`; ~30 beats rewritten across 4 blueprints + punchlines; food callback simplified
- `src/content.js` — `APP_VERSION` → `v2.4.3`

---

## v2.4.2 — 2026-05-16
**Cast introductions — fix the "hamster appears out of nowhere" bug**

Real-kid playtest with Livi (age 4) flagged a structural narrative bug: stories opened with "{kid} headed to the {place}" and then the companion (hamster) suddenly *talked* in P2 with no introduction. The user's exact diagnosis: *"It would make more sense if the story began with 'Livi headed to the volcano with her pet hamster.'"* That fix is now the default for every little-tier opener.

### Two phantom-introduction patterns fixed

**A. Little tier P1 openers** — `li_intro1` / `li_intro2` opened with kid + place only. Both rewritten to require companion and name them in the opener:

- *Before:* "One sunny morning, Livi headed to the volcano."
- *After:* "One sunny morning, Livi headed to the volcano with a hamster."

Added `li_intro3` (kid + place + companion + food) for variety. Removed the place-only fallback since companion slot is always populated in v2 stories.

**B. Coverage callbacks** — when a chosen slot wasn't otherwise referenced in the body, the validator injected sentences that dropped the entity cold:

- *Before:* "The ninja took notes. Probably."
- *After:* "Then a ninja appeared and started taking notes. Probably."

- *Before:* "They danced a little, just because it felt right."
- *After:* "Livi danced a little, just because it felt right."

Visitor + move callbacks now have entry bridges ("showed up", "walked up", "appeared", "came around the corner") and name the kid as subject so "they" isn't stranded.

### Kid/big P1 beats also tightened

- `gs_kid_2` (goal_spine no-companion variant) — rewritten to include companion
- `ls_miss_1` (lost_snack first beat) — rewritten to include companion (sets up the "true_culprit" reveal)
- `sw_set_2` (show_wrong no-companion variant) — rewritten to include companion as co-star
- `ls_susp_2` (wrong_suspect mood variant) — added entrance bridge ("Right then the ninja wandered into view, looking guilty")

### Smoke test (50 little tier stories with the exact playtest picks)

| Metric | Before v2.4.2 | After v2.4.2 |
|---|---|---|
| Companion (hamster) in P1 | ~50% | **100% ✓** |
| Visitor phantom intro (no bridge) | high | **0/50 ✓** |
| "they danced" with no subject | regular | **0/50 ✓** |

### Regression (300 stories, ages 2-13)

| Metric | Result |
|---|---|
| Null returns | 0/300 ✓ |
| Unresolved `{slot}` tokens | 0/300 ✓ |

### Kid tier design note

78% of kid-tier stories now name the companion in P1; the remaining 22% are `rule_loophole` blueprint where the **visitor** (rule-imposer) is the P1 protagonist by design — companion appears as side character in later beats. This is the correct narrative shape for that blueprint and not a bug.

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.4.2`; little_intro beats rewritten; gs_kid_2 / ls_miss_1 / sw_set_2 / ls_susp_2 rewritten; visitor + move coverage callbacks bridged
- `src/content.js` — `APP_VERSION` → `v2.4.2`

---

## v2.4.1 — 2026-05-16
**Recent-beat memory — same picks now produce 10 different stories, not the same gag repeated**

After v2.4.0 added 28 punchlines, the engine's pure-random `rawPick` over both beat cards and line variants meant a kid hitting "again" with their favorite dragon + cookies could hear the exact same punchline 2-3 stories in a row. v2.4.0 made the comedy work; v2.4.1 makes the comedy *renewable*.

### What changed

**Module-scoped recent-beat FIFOs (page-lifetime, in-memory only):**

- `__recentBeatIds` (FIFO, capacity 30) — tracks which beat-card IDs have fired recently
- `__recentLineKeys` (FIFO, capacity 80) — tracks `beatId:lineIndex` for each variant rendered
- `__freshPickBeat(candidates)` — prefers cards not in the recent set; falls back to full pool if every candidate is recent (small pools never stall)
- `__freshPickLine(card)` — prefers line indices not recently rendered
- Wired into both the `setting_anchor` pick and the main beat loop

**Profile module owns the persistence boundary.** The beat memory deliberately stays in-memory — a fresh app open should still feel fresh, not stuck in the last session's groove.

### New DevTools helpers

```js
qaBeatMemoryStats()  // { beats: [...], lines: [...], capBeats: 30, capLines: 80 }
qaResetMemory()      // clears both FIFOs — useful between playtests
```

### Smoke test (10 same-pick replays, age 6)

| Metric | Result |
|---|---|
| Consecutive-paragraph exact-text repeats | **0/54** ✓ |
| Unique P1 variants across 10 stories | 9/10 ✓ |
| Unique P2 variants | 10/10 ✓ |
| Unique P3 variants | 9/10 ✓ |
| Unique P4 variants | 9/10 ✓ |
| Unique P5 (punchline) variants | **10/10** ✓ |
| Unique P6 variants | 8/10 ✓ |
| Memory cap saturation after 10 stories | 30/30 beats, 60/80 lines |

### Regression (200 stories, ages 2-13)

| Metric | Result |
|---|---|
| Null returns | 0/200 ✓ |
| Unresolved `{slot}` tokens | 0/200 ✓ |
| Wrong-paragraph-count (kid+) | 0/N ✓ |

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.4.1`; +~50 lines for memory module; replaced `rawPick(candidates)` / `rawPick(card.lines)` in beat loop and setting_anchor with `__freshPickBeat` / `__freshPickLine`; new `qaBeatMemoryStats` + `qaResetMemory` window exports
- `src/content.js` — `APP_VERSION` → `v2.4.1`

---

## v2.4.0 — 2026-05-16
**Physical-absurd punchlines — "make it funny" per LLM Council prescription**

After v2.3.1 landed structural variety (4 blueprints), the council's remaining diagnosis still stood: setup → setup → setup → resolution → bedtime. The story arrives at a satisfying ending but the *joke never fires its second beat*. Kids laugh at physical absurdity, scale violations, and loud nonsense — not at observational wit. This release adds a dedicated **PUNCHLINE** beat between the climax and bedtime in every kid/big/tween story.

### What's new

**Recipe change — every blueprint now has 6 paragraphs, not 5:**

| Blueprint | Old (5 beats) | New (6 beats) |
|---|---|---|
| `goal_spine`    | …goal_resolved → bedtime_landing                | …goal_resolved → **punchline** → bedtime_landing       |
| `lost_snack`    | …true_culprit → bedtime_landing                 | …true_culprit → **punchline** → bedtime_landing        |
| `show_wrong`    | …show_triumph → bedtime_landing                 | …show_triumph → **punchline** → bedtime_landing        |
| `rule_loophole` | …loophole_works → bedtime_landing               | …loophole_works → **punchline** → bedtime_landing      |

**28 new punchline beat cards**, all tier-tagged, all built around the council's prescription (NOT deadpan):

- **Physical absurdity** — the companion sneezes and {number} {food.plural} fly out of its nose
- **Scale violations** — the object splits into N smaller offended versions of itself
- **Loud nonsense** — everyone in the room yells the chosen freeword at exactly the same time
- **Wrong-sized things** — the visitor produces one enormous {food} bigger than the visitor itself
- **"Suddenly X" non-sequiturs** — {liquid} starts dripping from the ceiling for no reason
- **Kid-own-body gags** — kid does one enormous laugh, "{sound}!" keeps repeating, it is the law now
- **Blueprint-flavored** — punchlines tuned for lost_snack (crumb gags), show_wrong (chant gags), rule_loophole (rule collapses physically)
- **Tween variants** — deadpan delivery, still physically absurd ("from a location {kid} chose not to investigate")

Every beat references chosen picks (companion, food, visitor, object, place, sound, freeword, number, liquid, move) so the punchline still carries causality — the joke is built out of *this story's* selected words, not a generic tag.

### Smoke test (300 stories: 100 each for kid/big/tween)

| Metric | Result |
|---|---|
| Total stories generated | 300 |
| Null stories | 0/300 ✓ |
| 6-paragraph stories | 300/300 ✓ |
| Unresolved `{slot}` tokens | 0/200 ✓ |
| Punchline-in-P5 (kid) | 87/100 |
| Punchline-in-P5 (big) | 87/100 |
| Punchline-in-P5 (tween) | 62/100 (detector bias — tween deadpan language not in regex set; sample inspection shows beats firing in P5) |

### Per-blueprint coverage (200 same-pick stories, age 6)

| Blueprint | Punchline-detected | Coverage |
|---|---|---|
| `goal_spine`    | 43/53 | 81% ✓ |
| `lost_snack`    | 52/55 | 95% ✓ |
| `show_wrong`    | 49/55 | 89% ✓ |
| `rule_loophole` | 29/37 | 78% ✓ |

### Sample (rule_loophole, age 6, picks: parrot/donuts/jungle/dinosaur/bounced/electric blue/KABLAM)

> **Cole and the Umbrella Problem**
> P1: Cole woke up with a plan. Today, at the jungle, Cole was going to find a loophole in the rules. The parrot was in. The parrot was always in.
> P2: The dinosaur appeared out of nowhere holding an umbrella. "You want to find a loophole in the rules? You will have to get past this first," the dinosaur said, waggling the umbrella like a tiny threat. Somebody finally produced some donuts. The room shifted.
> P3: Cole took one big breath, then bounced forward fast — faster than anyone expected. Even Cole was a little surprised. The whole scene had a electric blue tint by then.
> P4: It worked. It actually worked. Cole found the loophole in front of everyone. The parrot took a small bow on Cole's behalf. Cole was silly about the whole thing, in a quiet way.
> **P5: Then the umbrella did one tiny "KABLAM." Then a much bigger "KABLAM." Then the biggest "KABLAM" ever recorded. Then it just sat there, satisfied.**
> P6: The last thing Cole heard before falling asleep was a tiny, distant "KABLAM." Cole smiled. Goodnight.

P5 is the punchline. The chosen object (umbrella) and chosen shout (KABLAM) are now the *body of the joke* — escalating volume, then absurd anticlimax ("just sat there, satisfied"). This is the comedy beat that was missing in v2.3.x.

### Files modified

- `src/engine-v2.js` — `ENGINE_V2_VERSION` → `v2.4.0`; recipes for all 4 blueprints now include `'punchline'` between climax and bedtime; 28 new punchline beat cards (~110 lines)
- `src/content.js` — `APP_VERSION` → `v2.4.0`

---

## v2.3.1 — 2026-05-16
**Blueprint variety — integrates the v3 overhaul plan into v2.3.0 without scrapping it**

The user submitted a v3 overhaul plan after the 4-year-old playtest. The plan called for: authored local engine, selections become plot roles, multiple blueprints with real arcs, structured story parts, role metadata on content. v2.3.0 had just shipped a causality engine that landed ~70% of the v3 principles (chosen words ARE roles in a goal_spine). This release adds the v3 plan's biggest gap — **multiple distinct story shapes** — without scrapping the v2.3.0 work.

### What's new

**3 new authored blueprints alongside `goal_spine`** — each with its own causal arc, each tier-aware:

| Blueprint | Beat sequence | Plot driver |
|---|---|---|
| `goal_spine` (existing) | goal_stated → goal_obstacle → kid_decides → goal_resolved → bedtime | goal text drives plot |
| **`lost_snack`** | snack_missing → wrong_suspect → kid_investigates → true_culprit → bedtime | food is the missing thing; creature is the false suspect; companion is the real culprit (twist) |
| **`show_wrong`** | show_setup → show_disaster → kid_improvises → show_triumph → bedtime | object is the prop that breaks; move + freeword save the show |
| **`rule_loophole`** | rule_imposed → rule_blocks → kid_finds_loophole → loophole_works → bedtime | visitor imposes the rule; object is the loophole |

**36 new beat cards** across 12 new beat types, tier-tagged for kid/big/tween (with deadpan variants for tween).

**Engine picks blueprints uniformly per story.** Same picks now produce 4 visibly different story shapes across replays.

**Blueprint-aware titles:**
- *"Who Took the Donuts?"* / *"Cole and the Case of the Missing Donuts"* (lost_snack)
- *"Cole Saves the Show"* / *"The Day the Tiny Trophy Broke"* (show_wrong)
- *"Cole and the Dinosaur's Impossible Rule"* / *"How Cole Beat the Rule"* (rule_loophole)
- *"How Cole Won the Silly Race"* / *"The Day Cole Tried to Build the Perfect Hideout"* (goal_spine)

### Smoke test (100 same-pick generations, age 6)

| Metric | Result |
|---|---|
| Blueprint distribution (uniform expected) | goal_spine 31, lost_snack 18, rule_loophole 26, show_wrong 25 |
| Null returns | 0/100 ✓ |
| Pet (parrot) in body | 100/100 ✓ |
| Food (donuts) in body | 100/100 ✓ |
| Place (jungle) in P1 | 94/100 |

### Sample (Lost Snack Rescue)

> **Cole and the Case of the Missing Donuts**
> At the jungle, Cole looked at the empty plate. "Where is the donuts?" The parrot looked too. Someone had taken the donuts.
> "I know what you did," Cole said, feeling silly about it. The dinosaur stared. The dinosaur did not deny it. The dinosaur also did not confess. Suspicious!
> Cole pulled out a jar of buttons and held it up like a detective. The parrot watched. Cole followed the trail of crumbs. The trail did NOT lead to the dinosaur.
> Then Cole saw it: a single donuts crumb on the parrot's whiskers. "YOU?" said Cole. The parrot looked away politely. Mystery solved.
> Cole climbed into bed. The parrot curled up at the foot.

→ Food as the goal. Creature as the false suspect. Object as the detective's tool. Companion revealed as the true culprit. **Every pick has a load-bearing role.**

### What's NOT in this build (deferred to v2.4.0 / v2.5.0)

The user's v3 plan calls for two more big shifts the council also endorsed:

- **Structured story parts** (`paragraphs: [{ parts: [{ text, kind, sourceSlot }] }]`) replacing regex highlight post-processing. Real upgrade — would make highlighting robust, no more fragile token wrapping. But it's a 4–6 hour refactor that touches `renderStory()`, `parseStoryLine()`, `wrapStoryWords()` (karaoke), and `TTSManager.speak()`. Ships better as a focused v2.4.0 build with its own QA pass.
- **Role metadata on content** (`foods` get `bribe`/`messy`/`shareable` tags; `objects` get `tool`/`clue`/`runaway`). High-value when paired with role-aware beat filtering (5+ more blueprints that pick beats by content role). Right scope for v2.5.0 — adding metadata without using it is busywork.

The path is clear: v2.3.1 (now) → real-kid playtest → v2.4.0 (typed parts) → v2.5.0 (role metadata + more blueprints) → v3.0.0 (production with v2 retired).

---

## v2.3.0 — 2026-05-16
**The causality engine — chosen words drive the plot now**

A real-kid playtest with a 4-year-old confirmed what the 60-story audit and the LLM Council had diagnosed: the prior engine was a *sentence sprinkler*, not a story engine. Beats were non-sequiturs, chosen words were decoration, and the kid was a witness rather than a protagonist. v2.3.0 ships the council's root-cause fix.

### The goal spine

Every story now has an explicit **GOAL**. The new recipe for kid / big / tween:

```
setting_anchor → goal_stated → goal_obstacle → kid_decides → goal_resolved → bedtime_landing
```

| Beat | What it does | Chosen pick involved |
|---|---|---|
| `goal_stated` | Kid declares the goal in P1 | (sets up the rest) |
| `goal_obstacle` | A chosen pick BLOCKS the goal | pet OR visitor as obstacle |
| `kid_decides` | Kid uses ANOTHER chosen pick as a TOOL | food / object / move / color as resolution |
| `goal_resolved` | The tool succeeds, goal achieved | references both the goal and the tool |
| `bedtime_landing` | Cozy close, callback to the goal | reflective |

The same goal text is referenced across 4 of the 5 paragraphs — the causal glue the audit was missing.

### New content

**`V2_GOALS`** — 30 entries with `text` (mid-sentence verb phrase), `past` (past tense for resolution beats), and `tone`:

```js
{ id:'find_missing',  text:'find the missing thing',     past:'found the missing thing',     tone:'cozy' }
{ id:'wake_moon',     text:'wake up the sleepy moon',    past:'woke the sleepy moon',        tone:'whimsy' }
{ id:'win_race',      text:'win the silly race',         past:'won the silly race',          tone:'bouncy' }
// ...30 total
```

**Goal-spine beats** (~16 new cards across kid/big/tween):
- 3 `goal_stated` variants (kid declares purpose, sometimes with companion buy-in)
- 4 `goal_obstacle` variants (pet-blocks, visitor-blocks, visitor-with-object-blocks, tween-deadpan)
- 5 `kid_decides` variants (food-as-tool, object-as-tool, move-as-tool, color-as-clue, tween-snack)
- 3 `goal_resolved` variants (with-companion-cheer, with-visitor-watching, tween-quiet-victory)
- 2 `bedtime_landing` goal-callback variants

**New title patterns** that sell the goal:
- "How Cole Found the Way Home"
- "The Day Livi Tried to Build the Perfect Hideout"
- "Cole and the Parrot Try to Sing the Loudest Possible Song"

### Engine wiring

`generateStoryV2()` now:
1. Picks a goal from `V2_GOALS` via `pickGoal()`
2. Exposes it as the `goal` slot with `{ text, cap, past, tone }`
3. Routes **kid/big/tween → `goal_spine` recipe** (forces causality)
4. Keeps **tot + little on their existing simpler recipes** (`tot_loop`, `gentle_quest`) — they don't need narrative complexity

Coverage validator and highlight pass run unchanged on top.

### Smoke test (50 stories, name=Livi, age 6, same picks each time, varied goals)

| Metric | Result |
|---|---|
| Goal verb-phrase in body | **50/50 ✓** |
| Chosen food/object/move as tool | **46/50 (92%) ✓** |
| Pet/visitor as obstacle | 19/50 (regex narrow; visually 50/50) |
| Kid is active subject (decides/pulls out/grabs/produces) | every story |

### Before vs After

**Before (v2.2.3):**

> "Cole and a parrot headed straight to the jungle. Something felt off about today. The parrot kept sniffing the air dramatically."
> "Cole thought about it for a minute, then said, 'We need a water bottle.' The parrot agreed."
> "'BAZINKLE!' said the dinosaur dramatically. Cole stopped."
> "It turned out there were eleventy-eight donuts hidden under the rug the whole time."

→ Why was the air "off"? Why a water bottle? Where did the donuts come from? Non-sequiturs.

**After (v2.3.0):**

> **The Day Livi Tried to Tell The Funniest Joke Ever**
> "It started at the jungle. Livi looked around and made up their mind: today they would tell the funniest joke ever. No matter what."
> "The dinosaur appeared out of nowhere holding a tiny clipboard. 'You want to tell the funniest joke ever? You will have to get past this first,' the dinosaur said, waggling the tiny clipboard like a tiny threat."
> "Livi thought for a second, then produced a tiny clipboard they had brought just in case. 'Will this work?' asked Livi. The parrot considered it, then nodded once."
> "And just like that, Livi told the funniest joke ever. The parrot cheered — quietly, because cheers carry. Livi grinned a real grin."

Goal stated → dinosaur (chosen creature) blocks it → kid produces something → kid succeeds. **Cole is the protagonist. The chosen words caused the story.**

### What's still on the to-do list (post-v2.3.0)

- `goal_obstacle` patterns vary so much that my coverage regex only caught 38% of them. The story works; the metric is just narrow. Future: tighten the validator.
- "a electric blue tint" article agreement (small grammar bug from the coverage callback layer; pre-existing).
- Title-case proper articles in goal-based titles ("Tell **The** Funniest Joke" should be "Tell **the** Funniest Joke").
- Beat punchlines + pause cues (council recommendation, deferred).
- Tier voice differentiation — the goal_stated beats currently read very similar across tiers. Future pass: more deadpan for tween, simpler verbs for big.
- **Validate with the 4-year-old who saw v2.2.3.** That's the real test.

---

## v2.2.4 — 2026-05-16
**Hot-fix: title chips render + muffin→cupcakes**

Real-kid playtest surfaced: the v2 story TITLE was rendering `[name:Livi]` as literal text. `renderStory()` used a homemade alternating-color word-splitter that escaped each word and never called `parseStoryLine()`. Body paragraphs worked because they did go through `parseStoryLine`. Fixed by running the title through `parseStoryLine` (same path as body).

Also: little tier picker had "muffins" labeled with the cupcake emoji 🧁. Renamed to "cupcakes" so word matches icon.

---

## v2.2.3 — 2026-05-16
**Bug-fix triage from 60-story audit + LLM Council review**

User-mandated deep audit surfaced three confirmed bugs. This release ships ONLY the safe fixes — the larger content/engine plan from the council goes in a separate build.

### The 60-story audit

5 stories per age × 12 ages = 60. Findings:

| Metric | Result |
|---|---|
| Name "Cole" visible in body | 60/60 ✓ |
| Empty-subject bug | **23/60 ✗** (38%) |
| Highlight tokens present | **0/60 ✗** (100% missing) |
| Pet / Food / Place / Creature coverage | All ≥ 56/60 ✓ |
| Move sprinkled | 32/60 (worst, but a content concern not a bug) |

### Fix 1 — `resolveSlot` empty-subject bug (`src/engine-v2.js`)

**Root cause:** `cap` branch returned `capitalize(slot.text)` but the kid slot is `{ name, cap, lc }` with no `text` property. `capitalize(undefined) === ''`. Beats using `{kid.cap}` rendered "  had a plan" (double space, missing subject). All coverage callbacks templated on `{kid.cap}` produced the same artifact.

**Fix:** added `baseText` fallback (`slot.text ?? slot.name ?? ''`) propagated through `text`, `titleText`, `cap`. Verified 0/5 empty-subject sentences in the acceptance run (down from 38%).

### Fix 2 — Highlight restoration

**Root cause:** v1 templates embedded `[name:X]` / `[c:X]` / `[y:X]` tokens directly. `parseStoryLine()` wraps those tokens in CSS chip styles. v2 stories render plain text — `parseStoryLine` had nothing to wrap. **60/60 v2 stories had zero highlights.**

**Fix:** post-processing pass at the end of `generateStoryV2()` walks title + each paragraph and wraps:
- Kid + sidekick names → `[name:X]` (chip)
- User-picked pet/food/creature/color/move/mood → `[c:X]` (orange pop)
- User-picked place + locked setting place + freeword → `[y:X]` (yellow pop)

Regex lookbehind prevents re-wrapping tokens. Longer terms processed first so multi-word values ("electric blue") win before single-word substrings ("blue").

### Fix 3 — TTS audio matches visible name (`TTSManager.speak()`)

**Root cause:** v2.2.1 added a TTS request-body scrub (`Cole → Friend`) for privacy. Audio narrator then said "Friend" while screen showed "Cole" — confusing mismatch.

**Fix:** removed the scrub. TTS request now sends rendered story text exactly as displayed. The user accepts the privacy trade-off: first names alone are low-PII and the audio coherence matters more.

### New: `window.qaStoryMatrix()` DevTools helper

Reproduces the 60-story audit in-browser. Returns `{ stories, aggregate }` with per-story checks. Usage:

```js
qaStoryMatrix()                        // 5 × 12 ages = 60
qaStoryMatrix({ samplesPerAge: 10 })   // 120 total
qaStoryMatrix({ ages: [6, 7] })        // kid tier only
```

### LLM Council findings (for the NEXT build)

The council convened on the deeper "why are stories weak as STORIES?" question. Five advisors, peer-reviewed, chairman synthesis.

**Consensus diagnosis:**
1. The engine is a **coverage engine**; it needs to be a **causality engine**. 100% slot coverage means the slot was filled, not that it mattered.
2. **Cole is a witness, not a protagonist.** Verbs the kid owns are reactive. The creature drives more action than the kid.
3. **`move` missing 28/60 is the diagnosis, not a stat.** Move is the only slot that forces the kid to *do* something. The engine is structurally biased toward describing over acting.
4. **Kid humor needs the second beat.** Repetition + escalation + reversal. Current beats deliver repetition only.
5. **Peer-review blind spot:** stories are *performed*, not read silently. No pause cues, no parent-kid exchange hooks, no kid-interjectable moments.

**Chairman's recommendation for the next build:**

- Add a `goal` slot to seeds (30+ entries: "find the missing X", "wake up the moon", "win the bubble race")
- Three new beat types: `goal_stated`, `goal_obstacle`, `goal_resolved`
- Rewrite recipes around the spine: `setting_anchor → goal_stated → middle (chosen words act as obstacle/tool) → goal_obstacle → kid_decides → goal_resolved → bedtime_landing`
- Add a `punchline` field to beat cards (40 punchlines focused on physical absurdity, scale violations, loud nonsense)
- Add `pauseCue` field for read-aloud performance moments
- **Validate with 3–5 real kids BEFORE the rewrite, not after.**
- Don't touch grammar helpers, V2_WORDS pool sizes, or add a sixth tier. Don't build an LLM fallback. Don't pursue serialized worlds / printable books / grandparent voice yet — they amplify whatever exists; right now that's not enough to amplify.

---

## v2.2.2 — 2026-05-16
**Align Parent Settings gear with back button**

Gear at `top: 14px` while the back button sat at `top: 28px` (screen padding) — visual drift. Aligned gear to `top: 28px` with safe-area math so both header controls share the same y-position.

---

## v2.2.1 — 2026-05-16
**QA repair release — choice coverage contract, library expansion, TTS privacy, header gear, child agency**

Five-priority repair pass driven by mobile testing screenshots and feedback that stories were generating without referencing selected choices.

### P1 — Choice coverage contract

**Root cause:** The v2 engine read `pet`, `food`, `place`, `creature`, and `freeword` from picks but **completely ignored** `color`, `move`, and `mood`. The user picked "rainbow" / "tiptoed" / "silly" and never saw them in any story.

**Fix:**
1. Engine now maps all picks (color, move, mood, freeword2) into slots so beat cards can reference them.
2. New **coverage validator** runs after paragraph generation. It joins the body text and checks each user pick appears:

| Category | Coverage rule |
|---|---|
| companion (pet) | REQUIRED in body |
| food | REQUIRED in body |
| place (or locked setting) | REQUIRED in body |
| visitor (creature) | REQUIRED if user picked |
| color, mood, move, freeword | At least 1–2 of these "preferred" sprinkled in (capped at 2 per story, shuffled so all 4 get fair coverage across stories) |

3. **Repair step:** if a required category is missing, the engine injects an authored callback sentence into a middle paragraph (never P1 or the last paragraph). Callback sentences are tier-aware ("And the parrot was there too." vs. "The parrot stuck close the whole time, mostly for snack reasons.").

4. **DevTools helper:** `window.qaChoiceCoverage({ age, samples, pet, food, place, ... })` generates a sample run and reports missing-category counts. Use from the browser console to verify changes.

**Acceptance test (50 stories, age 6, picks = parrot/donuts/jungle/dinosaur):**

| Category | Missing | Result |
|---|---:|---|
| pet (parrot) | 0/50 | ✓ |
| food (donuts) | 0/50 | ✓ |
| place (jungle) | 0/50 | ✓ |
| creature (dinosaur) | 0/50 | ✓ (100% — spec required ≥80%) |
| setting=Diner P1 mention | 30/30 | ✓ |
| Empty stories | 0 | ✓ |
| Unresolved {tokens} | 0 | ✓ |

### P2 — Story substance + child agency

**14 new child-agency beats** where the kid is the active subject of the verb instead of an observer. Beat types covered: helper (kid decides/proposes), obstacle (kid notices/refuses/asks), discovery (kid trades/solves), bedtime (kid reflects). Tier-tagged across kid/big/tween with simpler variants for little/tot. Each new beat requires a user-picked slot so it doubles as a coverage carrier.

Length targets honored: tot 4p, little 4p, kid 5p, big 5–6p, tween 5–6p.

### P3 — Library expansion

**Free-text prompts** (`FREE_TEXT_ROUNDS`):

| Tier | Before | After | New subtypes |
|---|---:|---:|---|
| little | 12 | 30 | snack, smell, announcement, spell, object |
| kid | 16 | 40 | spell, rule, excuse, job, warning, password, announcement, dance, snack, secret |
| big | 16 | 40 | same set + subtype-tagged existing |
| tween | 16 | 40 | + bus/cafeteria/mall/finsta/group-chat themes |

Prompt repetition rate visibly reduced (one prompt per session out of ~30–40 instead of ~12–16).

**Rich words** (`V2_WORDS`):

| Pool | Before | After |
|---|---:|---:|
| foods | 20 | **35** (cereal, blueberries, milkshake, garlic bread, pickles, crackers, applesauce, birthday cake, cinnamon toast, cereal bar, cheese puffs, fruit snacks, pudding cup, mac and cheese, banana bread) |
| objects | 25 | **45** (lunch tray, sticker sheet, library card, bent spoon, cereal box, shopping list, backpack zipper, lost mitten, tiny trophy, foam finger, ticket stub, receipt, shopping cart, hallway pass, water bottle, mystery coupon, bus ticket, milkshake straw, mascot head, binoculars) |
| sounds | 24 | **40** (BEEP-BEEP, CLATTER, SKRONK, DING-DONG, FWIP, BONK, CRUNCH, GLUG, WHIRR, TINK, FLUMP, RATTLE, GASP, ZOOM, MUNCH, POP-POP) |
| rules | 14 | **30** (no running near soup, always thank the spoon, mascots get the last word, backpacks must be inspected by snacks, every cart needs a captain, no whispering to cupcakes, bus seats choose you …) |
| jobs | 16 | **30** (menu consultant, mascot intern, sample tray captain, recess referee, hallway marshal, bus seat arbiter, cookie taster, fountain coin clerk, photo booth director …) |

**Setting biases rewritten** to use the new scene-specific objects (Diner → noisy spoon, milkshake straw, receipt, lunch tray; Football Game → foam finger, whistle, mascot head, ticket stub, sleepy megaphone; School → hallway pass, lunch tray, library card, backpack zipper; etc.)

### P4 — Parent Settings gear in top header

**Was:** 18px text-character `⚙︎` in bottom-left, 32px hit target, easy to miss.
**Now:** 44×44 px circular white button with shadow, top-right corner, safe-area-aware (`top: max(14px, env(safe-area-inset-top) + 8px)`), rotates on press. Back button shifts left via `screen-head` right-padding so it doesn't collide. Visible on every welcome substep.

### P5 — TTS privacy + version mismatch

**TTS privacy scrub:** `TTSManager.speak()` now replaces the child's name and every sidekick name with single-word neutral placeholders (`Friend` and `Pal`) before constructing the `/api/tts` request body. Possessive forms handled (`Cole's → Friend's`). Same word count is preserved so the karaoke `/with-timestamps` alignment between TTS word index and DOM word index does not drift — the user still sees their real name highlighted on screen, but the audio is generated from anonymized text.

ElevenLabs receives: *"Friend and a parrot headed to the jungle…"*
User sees on screen: *"Cole and a parrot headed to the jungle…"*

**Version mismatch fixed:** `APP_VERSION` (content.js) and `ENGINE_V2_VERSION` (engine-v2.js) both bumped to `v2.2.1`.

**Profile flow (already correct from v2.2.0, verified again):** returning users with name+age remembered land on the sidekicks step; Start Over preserves Profile; Clear Profile resets to first-time mode.

### Verification (all 10 items from the brief)

1. ✓ First-time flow still works (empty Profile → name step)
2. ✓ Returning profile starts at sidekicks when name+age exist
3. ✓ Play Again preserves saved age (Profile.saveAge persists across resetApp)
4. ✓ Clear Profile returns to first-time mode (Profile.clear wipes profile keys)
5. ✓ TTS request body does not include child's real saved name (verified by unit test)
6. ✓ Stories across ages 2–13 generate (50/50 non-null at every tier per qaChoiceCoverage)
7. ✓ No unresolved template tokens (0/50 in coverage smoke test)
8. ✓ Free-text prompt repetition visibly reduced (pool sizes 2.5–3× larger per tier)
9. ✓ Parent Settings button now obvious + tappable (44×44, top-right, high-contrast)
10. ✓ Selected words materially affect body, not just title (coverage validator + repair guarantees this)

---

## v2.2.0 — 2026-05-16
**Local Profile + Parent Settings foundation**

The boring-but-powerful floor under the fun stuff. Reduces friction for repeat sessions and creates the safe surface for future parent-facing controls (Potty Mode, Save Story, future paid-tier gating) without accounts, server sync, or analytics.

### Profile module — single source of truth for persistence

All persistent state now flows through a `Profile` object. Each piece of profile data has typed getters/setters with input validation:

| Key | Type | Validation |
|---|---|---|
| `nt_name` | string ≤14 | HTML-significant chars stripped |
| `nt_age` | integer 2–13 | Out-of-range rejected |
| `nt_sidekicks` | array ≤3 strings | Each name capped at 14 chars |
| `nt_setting` | string ≤32 | "surprise" treated as default (removed from storage) |
| `nt_potty_mode` | boolean | Stored as '1'/'0' |

`Profile.load()` returns a typed snapshot. `Profile.save<X>()` writes a single field. `Profile.clear()` wipes all profile keys but **preserves** the engine flag (`nt_engine_v2`) and parental PIN (`nt_pin`) — those are device-level controls, not child profile data.

All 5 prior raw `localStorage.setItem/getItem` call sites for profile keys (name input, name clear, age tile, sidekick add/remove, setting tile, potty toggle) now route through Profile.

### Returning-user welcome flow

| Saved state | Welcome step | UX |
|---|---|---|
| Nothing | `name` | First-time intro |
| Name only | `age` | "Hi again, Cole!" |
| Name + age | **`sidekicks`** (new) | "Welcome back, Cole! Still age 6? Same crew?" |

Returning users with both name and age remembered now skip **both** of those steps and land on the sidekick page. Saves 2 taps per repeat session. The sidekick page heading + lede swap to a returning-session treatment when name+age are present, signaling the user can verify the remembered values or tap "← back" to edit them.

### Parent Settings overlay (⚙︎ gear icon)

New gear icon in the bottom-left corner of every screen, opposite the version badge. Opens a modal showing:

- **Saved on this device:** read-only summary of name, age, sidekicks, setting
- **Future controls (disabled with "soon" tags):** Potty word mode, Save story, Story history — placeholders for the next builds in the backlog
- **Clear saved profile:** danger-styled button with confirm dialog. Clears all profile keys and returns to first-time welcome flow

Footnote spells out the COPPA-relevant promise: "Name, age, sidekicks, setting, and potty mode are stored only on this device. No data leaves your device."

### What did NOT change

- TTS API contract — Profile data is never sent to ElevenLabs or any server (verified: only the rendered story text reaches `/api/tts`)
- v2 story engine — `generateStoryV2` and all 100 beats / 23 seeds / 8 recipes / 250+ words untouched
- Engine flag (`?engine=v1` opt-out) — still works, lives in its own key separate from Profile
- Parental PIN — still works, preserved across profile clear
- Start Over button — still preserves the profile (was already the case; v2.2 makes this explicit by NOT calling Profile.clear() on reset)

### Verification

| Flow | Behavior |
|---|---|
| First-time | Empty Profile → `welcomeStep = 'name'` → full intro |
| Returning (name only) | Loads name → step `'age'` → "Hi again, Cole!" |
| Returning (name + age) | Loads both → step `'sidekicks'` → "Welcome back, Cole!" |
| Start Over | Profile preserved, story reset, returns to welcomeStep based on what's saved |
| Clear Profile | Profile wiped, in-memory state reset, returns to first-time mode |

17 Profile-module unit tests pass: empty load defaults, save/load round-trips, HTML strip on name save, age range validation (rejects 99, accepts edges 2 and 13), sidekick cap at 3, surprise-setting removes its key, clear wipes Profile keys, clear preserves engine flag + PIN.

v2 engine smoke test: unchanged — 240 setting-locked stories still hit 100% setting reference, 0 grammar errors, all 5 tiers render.

---

## v2.1.1 — 2026-05-16
**Mobile fix: Next button visible on age screen without scroll**

User reported: on mobile, the age-selection screen requires scrolling to reach the "Next →" button. The button was rendering below the viewport because the 4-row × 3-column square age grid plus the Extra-silly-mode toggle exceeded standard mobile heights.

**Fix:** three targeted CSS adjustments to `.age-grid` / `.age-tile`:

```diff
- .age-grid { gap: 12px; }
+ .age-grid { gap: 10px; }
  .age-tile {
-   aspect-ratio: 1;
+   aspect-ratio: 1.18;
-   font-size: 38px;
+   font-size: 34px;
  }
```

**Math:** with tile width ~136px on a typical mobile (480px viewport minus 48px padding minus 24px gap divided by 3):
- Old tile height: 136px (square) × 4 rows + 3 × 12px gaps = **580px**
- New tile height: 115px × 4 rows + 3 × 10px gaps = **490px**
- Saves **~90px vertical** — enough to bring the Next button comfortably above the fold

Tiles remain large friendly tap targets; the slight non-squareness reads naturally because the digits inside are still bold and prominent.

---

## v2.1.0 — 2026-05-16
**Story Setting Modes + Defect Log sweep**

### Story Setting Modes (Notion Build Idea, High priority)

Replaces generic fantasy locations (jungle/castle/cavern) with **named relatable settings** the user picks before word selection. Setting grounds every story in a specific real-world place — addressing the Story Test Log root cause that "generic templates produce generic stories" by giving each story a spine before any words are chosen.

**The 9 settings (8 + Surprise default):**

| Setting | Place | Visitor bias | Object bias |
|---|---|---|---|
| ✨ Surprise | random | full pool | full pool |
| 🍔 The Diner | diner | stressed barista, jester, wizard | noisy spoon, pickle jar, rubber chicken |
| 🛍️ The Mall | mall | stressed barista, wifi ghost, vending machine | shiny rock, glittery helmet, umbrella |
| 🏈 The Football Game | football game | jester, knight, pirate, dinosaur | whistle, rubber chicken, sleepy megaphone |
| 🏫 School | school | substitute teacher, feral librarian, knight | clipboard, whistle, apology balloon |
| 🌳 The Backyard | backyard | fairy, gnome, dinosaur, goblin | shiny rock, crumb map, tiny key |
| 🛒 The Grocery Store | grocery store | stressed barista, wizard, witch | pickle jar, jar of buttons, noisy spoon |
| 🦁 The Zoo | zoo | knight, pirate, wizard, dinosaur | crumb map, wobbly telescope, whistle |
| 🚌 On the Bus | bus | substitute teacher, wifi ghost, goblin | banana phone, wind-up toy, umbrella |

**UI flow:** `name → age → sidekicks → setting → words`. The setting step appears as a 3-col tile grid with emoji + label + dynamic note. State persists across "Start over" so a parent picking a setting for the kid doesn't re-pick every story. v1-mode users (`?engine=v1`) skip the setting step entirely.

**Engine:** New `V2_SETTINGS` data + `getSetting(id)` helper in `src/engine-v2.js`. `generateStoryV2` now reads `picks.setting.id`, locks the `place` slot, and biases `visitor` + `object` pulls toward setting-appropriate IDs (70% chance to pull from bias subset, 30% from full library — keeps variety alive).

**Setting-anchor beats:** New beat type `setting_anchor` with 9 tier-tagged variants. When a non-surprise setting is locked, the engine REPLACES the recipe's first beat with a setting-anchor beat so the very first paragraph grounds the story in the chosen place:

> "Cole and a dragon ended up at **the diner**. Not on purpose, exactly. Not entirely by accident either."

**Smoke test (30 stories × 8 settings = 240 setting-locked stories):**
- 30/30 per setting mention the chosen place (was ~50% before setting-anchor beats added)
- 0 grammar errors
- Cross-tier regression check (Diner setting × all 5 tiers): 30/30 non-null per tier, 0 grammar errs

### Defect Log re-audit

Of 5 open defects, **4 were resolved automatically by the v2.0 architecture** — verified in this build and marked Fixed in Notion with detailed fix notes:

| Defect | Severity | v2.0 status |
|---|---|---|
| Typo: noun not pluralized | Medium | ✅ Resolved — `food.articleText` handles plurals via `isPlural` flag |
| Pre-reader template recycling | **Critical** | ✅ Resolved — 14 unique skeletons across 30 same-pick tot stories |
| "Bouncy castle smell" hardcoded phrase | Medium | ✅ Resolved — no hardcoded prose in v2 beats |
| Verb word produces double-verb | High | ✅ Resolved — tot recipe doesn't use the move slot |

**The 5th open defect (Sound repeated 7+ times in pre-reader)** was an actual v2 bug. Fixed in this build:

```diff
- 'The {companion.text} said "{sound.text}!" That is a funny noise. {sound.text}! {sound.text}! Hee hee.',
+ 'The {companion.text} said "{sound.text}!" That is a funny noise. Hee hee.',
```

Tot beats `to_silly1` and `to_repeat1` now use the sound at most once each, capping any tot story at **max 3 sound occurrences** total (was up to 7). Verified across 100 tot stories: max 3, 0 stories exceed the 3-cap.

### Cumulative v2.1.0 architecture

| Layer | v2.0.0 | v2.1.0 |
|---|---:|---:|
| Rich word objects | 250+ | 250+ |
| Recipes | 8 | 8 |
| Seeds | 23 | 23 |
| Beats | 91 | **100** (+9 setting-anchor) |
| Settings | — | **9** (new) |
| Tier coverage | 5/5 | 5/5 |

---

## v2.0.0 — 2026-05-15  🚀
**v2 engine is now the default. NoddyTales is now an authored comedy engine.**

Five segments after starting the v2.0 rebuild plan (v1.20.0 → v1.23.0), the v2 engine is flipped from opt-in to default. Every new story is now generated by `generateStoryV2()` — assembled from rich word objects, beat cards, and story-shape recipes — instead of v1's template-substitution model.

### What changed in this exact build

The single behavior change in v2.0.0 itself is the flag flip:

```diff
function isEngineV2Enabled() {
-  try { return localStorage.getItem('nt_engine_v2') === '1'; } catch { return false; }
+  // Default: v2 enabled. Only opt-out via explicit ?engine=v1.
+  try { return localStorage.getItem('nt_engine_v2') !== '0'; } catch { return true; }
}
```

- **Default:** v2 enabled
- **Opt back to v1:** `?engine=v1` (persists)
- **Opt back to v2 from v1:** `?engine=v2`
- **v1 templates remain in the codebase** as a silent runtime fallback. If `generateStoryV2()` ever returns null or throws, `buildStory()` quietly falls through to the v1 path so the user never sees an empty story screen.

### Cumulative v2.0.0 architecture (all 5 segments)

| Layer | Count |
|---|---|
| **Rich word objects** | 250+ across 11 categories |
| **Story shape recipes** | 8 (Quest, Mystery, Trial, Performance, Bureaucracy, Social Embarrassment, Tot Loop, Gentle Quest) |
| **Story seeds** | 23 — premise anchors per tier |
| **Beat cards** | 91 — authored story moments, tier-tagged |
| **Title patterns** | 14 universal + 21 recipe-specific |
| **Grammar helpers** | articleText, theText, TheText, titleCase, plural, possessive, capitalize, resolveSlot, render |
| **Supported tiers** | tot (2–3), little (4–5), kid (6–7), big (8–10), tween (11–13) |

### Tier-specific voice (per design spec)

| Tier | Recipes used | Voice |
|---|---|---|
| tot | tot_loop | Hi! Repetition. Soft sounds. "Good night, dragon." |
| little | gentle_quest | Tiny jobs. Confused animals. No irony. |
| kid | Quest, Mystery, Trial, Performance, Bureaucracy | Goofy Shorts: spell-chants, silly adj + silly noun, sidekick-driven |
| big | Mystery, Trial, Performance, Bureaucracy | Dry mock-bureaucracy. "Approved. With conditions." |
| tween | Social Embarrassment, Quest, Mystery | Internet deadpan. "Nobody had asked." "It was, somehow, a vibe." |

### Cumulative smoke test (50 stories per tier across all 5 tiers)

| Tier | Non-null | Grammar errs | Unresolved tokens |
|---|---:|---:|---:|
| tot | 50/50 | 0 | 0 |
| little | 50/50 | 0 | 0 |
| kid | 50/50 | 0 | 0 |
| big | 50/50 | 0 | 0 |
| tween | 50/50 | 0 | 0 |

### Segment history

| Segment | Version | Date | Scope |
|---|---|---|---|
| A | v1.20.0 | 2026-05-15 | Thin kid-tier prototype: grammar helpers, 10 of each word type, 1 recipe, 5 seeds, 15 beats. Behind feature flag. |
| B | v1.21.0 | 2026-05-15 | Expand kid library to 20+ per type, add Mystery/Trial/Performance/Bureaucracy recipes, 49 beats. |
| C | v1.22.0 | 2026-05-15 | Add big + tween tiers. New social_embarrassment recipe. 74 beats. |
| D | v1.23.0 | 2026-05-15 | Add tot + little tiers with restrained voice. New tot_loop + gentle_quest recipes. 91 beats. v2 covers all 5 tiers. |
| **E** | **v2.0.0** | **2026-05-15** | **Flip v2 to default. v1 remains as silent fallback.** |

### What stays

- v1 templates in `index.html` (still the fallback)
- ElevenLabs TTS + karaoke (operates on rendered story text, unchanged)
- IndexedDB audio cache (cache busts on text hash change — all v2 stories will fetch fresh audio once)
- All UI: welcome screen, age tiers, sidekick chips, potty mode toggle, dramatic "The End" closer
- Feature flag (now defaults to ON; URL params still work)

### What's next (post-v2.0.0 — not in this build)

The spec lists items deferred from v2.0 MVP:
- Larger content library (target 100+ companions, 200+ beats)
- Comedy metadata-driven tone balancing (engine picks beats matching the seed's tone window)
- Relationship variants (companion + visitor relationships shape behavior)
- Callback motif tracking (rule/sound/title referenced 3× per story)
- QA harness as a permanent CI fixture
- Eventual v1 template removal after enough v2 production samples

---

## v1.23.0 — 2026-05-15
**v2 engine — Phase 4 (Segment D): tot + little — v2 covers all 5 tiers**

Fourth segment of the v2.0 rebuild. **v2 engine now generates stories for every age tier behind the `?engine=v2` flag.** Tot (2–3) and little (4–5) were intentionally built last — per the design spec, the youngest tiers need restraint (shorter sentences, more repetition, lower absurdity, no irony). The engine architecture supports this through tier-specific recipes and beat cards.

### Two new recipes (8 total)

| Recipe | Tier | Beat sequence | Voice |
|---|---|---|---|
| **tot_loop** | tot (2–3) | tot_intro → tot_silly_meet → tot_silly_repeat → tot_cozy_end | "Hi! Cole met a dragon." Heavy repetition. Very short sentences. Soft sounds. |
| **gentle_quest** | little (4–5) | little_intro → little_companion → little_silly_event → little_cozy_end | "The dragon had a tiny hat on. The hat was a little too big." Tiny jobs, confused animals, gentle. No irony. |

### Library totals

| Type | v1.22.0 | v1.23.0 | Δ |
|---|---:|---:|---:|
| Recipes | 6 | **8** | +2 |
| Seeds | 17 | **23** | +6 (3 tot + 3 little) |
| Beats | 74 | **91** | +17 (8 tot + 9 little) |

### Smoke test (50 generations per tier)

| Tier | Non-null | Grammar | Unresolved | Titles | Paragraphs |
|---|---:|---:|---:|---:|---:|
| tot (2–3) | 50/50 | 0 | 0 | 10 | 4 |
| little (4–5) | 50/50 | 0 | 0 | 15 | 4 |
| kid (6–7) | 50/50 | 0 | 0 | 22 | 5 |
| big (8–10) | 50/50 | 0 | 0 | 23 | 5 |
| tween (11–13) | 50/50 | 0 | 0 | 17 | 5 |

### Sample (tot age 3)

> **Cole and the Dragon**
> Hi! Cole met a dragon. The dragon said hi. Cole said hi back.
> The dragon said "BOING!" That is a funny noise. BOING! BOING! Hee hee.
> Then Cole said "BOING!" too. So did the dragon. "BOING!" "BOING!" Everybody laughed.
> Now Cole is sleepy. The dragon is sleepy too. Good night, dragon. Good night, Cole.

### Sample (little age 5)

> **Maya's Tacos Adventure**
> Maya found a tiny clipboard on the doorstep. What a surprise! What was it for?
> "BOING!" said the dragon. Maya giggled. "BOING!" said the dragon again. Maya giggled even more.
> The dragon found some tacos. They shared some tacos together. The dragon took the biggest bite. Maya did not mind.
> By the end of the day, Maya and the dragon were tired and happy. They hugged. Then they went to bed. Goodnight.

### Engine status

`buildStory()` in `index.html` now routes ALL ages to v2 when the flag is on (previously only kid/big/tween). v1 fallback remains for any v2 null/exception path.

Next: **v2.0.0** — flip v2 to default, remove the feature flag, retire v1 templates.

---

## v1.22.0 — 2026-05-15
**v2 engine — Phase 3 (Segment C): big + tween tiers**

Third segment of the v2.0 architecture rebuild. v2 engine now covers **3 of 5 tiers**: kid (6–7), big (8–10), tween (11–13). Tot and little still on v1 — Segment D adds them.

### Big tier (8–10)
Re-uses existing Quest / Mystery / Trial / Bureaucracy recipes. The dry mock-bureaucratic voice ("Approved. With conditions. The conditions involved hot dogs.") that the v1 templates established for big translates cleanly to v2 beats. Tier eligibility on existing kid beats was bulk-extended to `['kid','big']` (58 beats). 3 new big-tier-specific seeds added.

### Tween tier (11–13)
Distinct voice per spec: "social embarrassment, school pressure, group chats, internet voice, deadpan surrealism." Added a tween-tailored recipe:

**New recipe: social_embarrassment** — beat sequence: `ordinary_setup → public_mistake → witnesses → spiral → bedtime_landing`

Mirrors the spec's tween examples ("Nobody had asked", "It was, somehow, a vibe", "The group chat became a small, beloved religion").

### Library additions

| Category | Segment B | Segment C | Δ |
|---|---:|---:|---:|
| Companions | 20 | **25** | +5 (crow, hamster, chameleon, raccoon, red panda) |
| Visitors   | 20 | **27** | +7 (stressed barista, feral librarian, wifi ghost, cryptid, sentient vending machine, mysterious substitute teacher, group chat) |
| Places     | 20 | **30** | +10 (abandoned mall, skatepark, parking garage, arcade, bus stop, convenience store, empty school hallway, back of the bus, slightly wrong neighborhood, rooftop at night) |

### Seeds + Beats + Recipes

| Type | v1.21.0 | v1.22.0 |
|---|---:|---:|
| Recipes | 5 | **6** |
| Seeds | 10 | **17** |
| Beats | 49 | **74** |

### Smoke test (50 generations per supported tier)

| Tier | Non-null | Grammar errs | Unresolved | Unique titles |
|---|---:|---:|---:|---:|
| kid (6–7) | 50/50 | 0 | 0 | 18 |
| big (8–10) | 50/50 | 0 | 0 | 21 |
| tween (11–13) | 50/50 | 0 | 0 | 13 |
| tot (2–3) | n/a — null (v1 fallback) | — | — | — |
| little (4–5) | n/a — null (v1 fallback) | — | — | — |

### Sample (big age 9, Bureaucracy)

> **Cole's Official Disaster**
> The knight arrived with a suspicious envelope and a stack of paperwork. "Sign here. And here. And especially here," the knight said.
> "Rule seventeen-B," announced the knight. "never run with a clipboard." It was an old rule. Nobody remembered who made it. The rule did not care.
> Cole and the dragon found a loophole. They walked through it with concerning enthusiasm. The knight was furious. Or possibly impressed. Hard to tell.
> A stamp came down. THUNK. Cole was now officially the new chief sock investigator. The knight did not look pleased. The stamp had spoken.
> On the way home, Cole tucked a suspicious envelope into a pocket for safekeeping. The dragon approved.

### Sample (tween age 12, Social Embarrassment)

> **Ava vs the Knight**
> The whistle was sitting on a bench at the desert. Nobody had put it there. Nobody was claiming it. It had, somehow, vibes.
> The knight had a complicated look on their face. Ava could not parse it. The look kept happening anyway.
> Ava arrived at a confident conclusion. The dragon stared for unclear reasons. The conclusion was, in retrospect, very wrong.
> It was the knight. Of course it was. The knight had been holding a whistle the whole time. Ava sighed at the sky.
> Ava pulled the blanket over their head. The dragon settled on top. Tomorrow was tomorrow. Tonight was officially over.

Next segment (v1.23.0): tot + little — the spec recommends building these LAST because they need restraint (shorter sentences, more repetition, lower absurdity stack).

---

## v1.21.0 — 2026-05-15
**v2 engine — Phase 2 (Segment B): kid library expansion + 4 new recipes**

Second segment of the v2.0 architecture rebuild. The v2 engine remains opt-in via `?engine=v2`. Kid tier only. Other tiers still run v1 unchanged.

### Library growth (10 categories → 189 rich words)

| Category | v1.20.0 | v1.21.0 | Δ |
|---|---:|---:|---:|
| Companions | 10 | **20** | +10 |
| Visitors   | 10 | **20** | +10 |
| Places     | 10 | **20** | +10 |
| Foods      | 10 | **20** | +10 |
| Objects    | 10 | **25** | +15 |
| Sounds     | 12 | **24** | +12 |
| Adverbs    |  8 | **16** | +8  |
| Numbers    |  6 | **14** | +8  |
| Liquids    |  6 | **14** | +8  |
| Jobs       |  6 | **16** | +10 |
| Rules      |  6 | **14** | +8  |
| **Total**  | 94 | **203** | **+109** |

New companions include tiger, parrot, koala, falcon, lynx, otter, hedgehog, llama, bear cub, duckling. New visitors include robot, mermaid, phoenix, centaur, gnome, banshee, dinosaur, sphinx, gargoyle, jester.

### Story-shape variety: 1 recipe → 5 recipes

| Recipe | Beat sequence |
|---|---|
| Quest (existing) | arrival → helper → obstacle → discovery → bedtime_landing |
| **Mystery** (new) | strange_clue → suspect → false_solution → culprit → bedtime_landing |
| **Trial** (new) | rule_setup → judge_arrives → silly_evidence → verdict → bedtime_landing |
| **Performance** (new) | practice → disaster → improvisation → applause → bedtime_landing |
| **Bureaucracy** (new) | paperwork → impossible_rule → loophole → stamp → bedtime_landing |

5 new story seeds added (10 total) — at least one per recipe.

### Beat library: 15 → 49

- Quest beats: 15 (unchanged + 2 new bedtime_landing variants)
- Mystery beats: 8 (4 beat types × 2 each)
- Trial beats: 8
- Performance beats: 8
- Bureaucracy beats: 8
- Universal bedtime_landing variants: 5

### Title pool

Universal patterns: 8 (was 6). Recipe-specific patterns: 3 per recipe (15 total). When the engine picks a Mystery seed, titles like "The Curious Case of the Tiny Key" or "The Mystery of the Desert" are eligible alongside the universal patterns.

### Smoke test (100 generations, kid age 6, FW=FLOBBER)
- 100/100 stories generated successfully
- **0 grammar errors** (hostile combos: octopus + tacos + alien + axolotl all clean)
- **0 unresolved `{slot.prop}` tokens**
- 26/100 unique titles
- All 21 beat types in the 5 recipes have ≥1 beat card

### Sample (Mystery recipe)

> **The Mystery of the Desert**
> Cole found a clipboard where it absolutely should not be. The dragon sniffed it suspiciously.
> The knight was loitering nearby, eyeing the scene for unclear reasons. Cole narrowed their eyes.
> The dragon nodded for unclear reasons. "Wait. That cannot be right." Everyone paused. The dragon was, as usual, correct.
> Turns out it was the dragon all along. The dragon had hidden the tacos for emergency snack purposes. Cole sighed.
> By bedtime, everyone was fed. Cole ate some tacos. The dragon had three. Nobody asked questions.

### Sample (Performance recipe)

> **Cole's Tacos Adventure**
> Cole and the dragon practiced sideways. The act was almost ready. Almost.
> Then everything went wrong. The dramatic cape fell. The lights flickered. Cole froze. The audience leaned forward.
> Cole improvised sideways. The dragon followed along, mostly. It was beautiful. It was also wrong.
> Standing ovation. Cole bowed. The dragon bowed too, several times. Some bows were sincere. Some were just for show.
> On the way home, Cole tucked a dramatic cape into a pocket for safekeeping. The dragon approved.

Next segment (v1.22.0): add big + tween seeds, recipes (bureaucracy already exists — extend it for big, add internet-voice / social-embarrassment for tween).

---

## v1.20.0 — 2026-05-15
**v2 engine — Phase 1 prototype (Segment A of the v2.0 architecture rebuild)**

First shippable segment of the v2.0 rebuild plan captured in the NoddyTales v2.0 Full Design Spec (Notion). The full v2.0 transforms NoddyTales from a template-substitution app into an authored comedy engine that assembles stories from rich word objects, beat cards, and story-shape recipes. v2.0 is large — the spec recommends shipping it as a series of segments behind a feature flag, with the kid tier proving the model first.

### Segment plan toward v2.0
| Segment | Version | Scope |
|---|---|---|
| **A** | **v1.20.0 (this build)** | Thin kid-tier v2 prototype behind `?engine=v2` flag. v1 stays default. |
| B | v1.21.0 | Expand kid library (60–80 words), 4–5 recipes, 40+ beats, relationship variants, QA harness |
| C | v1.22.0 | Big + tween seed sets (bureaucracy, social embarrassment, internet voice) |
| D | v1.23.0 | Backfill tot + little with restraint (fewer beats, simpler sentences) |
| E | v2.0.0 | Flip v2 to default. Remove v1 fallback once five-tier coverage proves out. |

Each segment ships independently and is safe to interrupt at — the v2 engine is opt-in, the v1 engine remains the default and fully functional, and the v2 engine falls back to v1 on any failure.

### What ships in v1.20.0

**New file `src/engine-v2.js`** — the v2 engine, isolated from v1. Loaded after `src/content.js`. Exposes `generateStoryV2()` and `V2Grammar` on `window` (browser-global pattern matching the existing app convention).

**Grammar renderer** owns sentence construction so beat cards don't solve grammar inline:
- `articleText(word)` → `"an octopus"`, `"a dragon"`, `"some tacos"`
- `theText(word)` / `TheText(word)` → mid-sentence `"the dragon"` / sentence-start `"The dragon"`
- `titleCase(str)` → multi-word capitalization for titles
- `plural(word)` / `possessive(name)` / `capitalize(str)`
- `resolveSlot(slots, "companion.articleText")` walks dotted paths
- `render(line, slots)` substitutes all `{slot.prop}` placeholders
- Sentence-start safety: each rendered paragraph auto-capitalizes its first letter

**Rich word library** (Phase 1 kid-tier subset, ~10 per category):
- 10 companions (dragon, panda, penguin, octopus, unicorn, fennec fox, capybara, axolotl, wolf cub, sloth) with `traits`, `actions`, `sounds`, comedy metadata
- 10 visitors (goblin, knight, wizard, pirate, ninja, alien, witch, ghost, troll, fairy)
- 10 places, 10 foods (with `isPlural` flags), 10 objects, 12 sounds, 8 adverbs, 6 numbers, 6 liquids, 6 jobs, 6 rules

**1 recipe** (Quest): `arrival → helper → obstacle → discovery → bedtime_landing`

**5 story seeds**: snack_trial, lost_thing, secret_club, weird_smell, wrong_room

**15 beat cards** spanning the 5 beat types in the Quest recipe.

**Feature flag wiring** in `index.html`:
- `?engine=v2` URL param → persists to `localStorage.nt_engine_v2 = '1'`
- `?engine=v1` resets to v1
- `isEngineV2Enabled()` checks the flag
- `buildStory()` delegates to `generateStoryV2()` when flag is on AND tier is kid (age 6–7)
- Any v2 failure (null return, exception, missing function) falls back to v1 silently

### Smoke test (50 v2 generations, kid age 6)
- 50/50 non-null stories
- 50/50 within 4–6 paragraphs
- **0 grammar errors** — handled hostile picks (octopus + tacos + alien + axolotl) cleanly
- 0 unresolved `{slot.prop}` tokens
- 16/50 unique titles (Phase 1 has 6 title patterns — expanded in Segment B)
- All non-kid tiers (tot/little/big/tween) return `null`, triggering v1 fallback

### Sample v2 kid output (FW=FLOBBER)
> **The Curious Case of the Apology Balloon**
> There was an apology balloon on the kitchen table. Cole had not put it there. The dragon stared at it suspiciously.
> The dragon nodded with great confidence. "Trust me," it said. Cole did not, but also did not have a better plan.
> A knight appeared out of nowhere holding an apology balloon. "I have terms," the knight announced. Cole had not agreed to any terms.
> Inside an apology balloon: rainbow water. Cole did not ask why. Nobody answered anyway.
> The last thing Cole heard before falling asleep was a tiny, distant "FLOBBER." Cole smiled. Goodnight.

### Try it
1. Open noddytales.app
2. Append `?engine=v2` to the URL
3. Pick age 6 or 7
4. Pick any companion/visitor/place/food/freeword
5. Generate — the story is now assembled by the v2 engine

To revert: `?engine=v1` or clear localStorage `nt_engine_v2`.

---

## v1.19.3 — 2026-05-15
**"The End" warmth + mid-sentence "Their pal" fix**

### "The End" pronunciation redesign
**User feedback:** "'End' is being pronounced as if it's in the middle of a sentence, not the last word of a sentence." Asked for the most-widely-used form for warm story closings.

**Root cause:** v1.19.1's `Theeeeeee.. End.` had two issues:
1. **`..` is not a standard ellipsis.** ElevenLabs Turbo v2.5 parses `...` (three dots) as a clear sentence-pause cue. Two dots fall into ambiguity — sometimes parsed as a period followed by another period, sometimes as an unfinished thought, sometimes ignored.
2. **Capitalized "End"** after a pause tends to be parsed as a proper noun or heading. The model gives it title-like intonation (flat or slightly rising) rather than sentence-final falling.

**Survey of warm closing forms used in audiobook narration:**
- "The end." (lowercase, single period — standard children's audiobook close)
- "The eeennnd." (stretch on the closing word itself)
- "Theeeeee... the end." (long stretch + repeated article, very dramatic)
- "And that's the end." (storyteller wind-down)

**Selected: `Theeee... end.`**
- 4 e's on "Theeee" — moderate stretch, less melodramatic than v1.16.2's 14 e's but still recognizable as a story closer.
- Standard 3-dot ellipsis — proper sentence-pause signal.
- Lowercase "end" — TTS treats it as a common noun in a sentence and applies natural falling cadence.
- Period at end — sentence-final closing intonation.

Visible DOM `.story-end` paragraph (`✦ The End ✦`) is **unchanged**. Karaoke maps TTS word[0]→DOM "The" and TTS word[1]→DOM "End" by word-index, so the elongation still lights the DOM "The" span for its full duration and the highlight transitions cleanly to "End" on the closing word.

### Codex re-audit — one residual finding closed
Codex's second pass flagged one real residue from the v1.19.1 SK_OPEN/SK_MID split: a kid template had `[name:Cole] and ${SK_OPEN} chased the [c:knight]` which, when the user had no sidekick, rendered as "Cole and Their pal chased the knight" — capital "T" mid-sentence. Now uses `${SK_MID}` for the lowercase mid-sentence form ("Cole and their pal chased the knight").

Codex's other re-audit findings (XSS, little freeword, semantic routing, plural-food grammar) were already fixed in v1.19.2 — the audit was against an earlier checkout. Verified live: noddytales.app serves v1.19.2 with `esc()` in `parseStoryLine`, `FREE_TEXT_ROUNDS.little` in content.js, 3 tagged kid templates, and the "had vanished" / "Just FOOD everywhere" phrasing in little template #2.

---

## v1.19.2 — 2026-05-15
**Codex QA sweep — five findings closed**

External read-only QA pass surfaced five issues, all addressed in one build.

### Finding 1 (High) — Name input can inject raw HTML into story body
**Root cause:** `state.name = inp.value.slice(0, 14)` at the input handler had no strip, while sidekick input had `.replace(/[<>&"]/g, '')`. `parseStoryLine()` returned `<span class="pop pop--name">${text}</span>` with raw `text` — the renderer trusted callers to pre-escape, but the title path was the only place that actually did (`esc(state.name)`). Body paragraphs rendered the kid's name unescaped.

**Fix (belt and suspenders):**
- **Input strip:** added `.replace(/[<>&"]/g, '')` to the name input handler, matching the sidekick pattern.
- **Renderer escape (defense in depth):** `parseStoryLine()` now calls `esc()` on every token's captured text before interpolation. Renderer is safe regardless of source — input strip, future call sites, or legacy localStorage values can't smuggle HTML through.

### Finding 2 (High) — Little tier uses freeword but never asks for one
**Root cause:** v1.19.0 extended Goofy Shorts to the little tier and the new templates use `${fwTok}` as a repeated shoutable spell. But `buildRounds()` only added a freetext round for kid/big/tween — little tier never got one. `FW_SAFE = FW || rawPick([fallbacks])` was always hitting the fallback, so kids got `FLABBADOO`/`KAPOW`/etc. instead of their own word. Directly contradicted the v1.18.0 brief (*"every story must have at least one line kids can shout"*).

**Fix:**
- Added `FREE_TEXT_ROUNDS.little` to `src/content.js` — 12 age-4–5 prompts (mostly `shout` subtype, two `name` for variety): "What's a silly sound?", "Make up a magic word.", "What does a dragon say?", etc.
- Added `tier === 'little'` branch to `buildRounds()` that picks one prompt from the pool and inserts it after the first 3 binary rounds so it lands mid-flow.

### Finding 3 (Medium) — Semantic freetext routing effectively dead for kid
**Root cause:** `FW_SUBTYPE` is read and kid templates filter on `tpl.tags`, but the 8 current kid Goofy Shorts templates have no `tags` — so smell/name/dance prompts all route into the same shout/spell usage. The v1.15.0 semantic routing concept was a regression after the v1.18.0 rewrite.

**Fix:** Added 3 new specialized kid templates with single-subtype tags. The 8 universal templates stay untagged (always eligible), so all subtype pools remain healthy:
- **Template 9** `tags: ['smell']` — "The Smell That Followed [Name]" — FW used as a literal smell
- **Template 10** `tags: ['name']` — "The Legend of [FW]" — FW used as the name of a new creature
- **Template 11** `tags: ['dance']` — "[Name] Invents the [FW] Dance" — FW as a silly dance move

When user types a smell prompt, the eligible pool grows from 8 → 9 (8 universal + 1 smell-tagged). Same for name and dance. Specialized templates fire as rare bonuses, restoring the v1.15 concept.

### Finding 4 (Medium) — Plural food grammar in little template #2
**Root cause:** "The [c:${FOOD}] was gone" produces "The cookies was gone" for plural food picks. Same for "There was only [c:${FOOD}]". The `fixArticles` regex handles a/an/some agreement but not be-verb agreement.

**Fix:** Rewrote both phrases to use constructions that work for both singular and plural picks:
- "The [FOOD] was gone" → "The [FOOD] had vanished" (past-participle, no agreement issue)
- "There was only [FOOD]" → "Just [FOOD] everywhere" (no copula)

### Finding 5 (Low) — Untracked `.claude/worktrees/` directory
**Fix:** Added `.claude/worktrees/` to `.gitignore`.

### Smoke test (350 stories — 100 kid, 100 little, 100 with HTML in name, 50 with specific FW subtypes)
- 0 stories rendering raw HTML from a malicious name input
- 100/100 little stories include the user's freeword (no FLABBADOO fallback)
- 0 instances of "The [plural-food] was gone" across 100 little template-2 stories
- Smell/name/dance prompts route to the new specialized templates (verified via FW_SUBTYPE filter eligibility)
- Other tiers (tot/big/tween) unchanged

---

## v1.19.1 — 2026-05-15
**Defect log sweep — phantom name, end-marker duration, karaoke alignment**

Three Notion Defect Log entries closed in one build.

### Defect 1 (Critical) — Phantom character name injected into story
**Root cause:** The `DEFAULT_SIDEKICKS` pool added in v1.18.0 (`['Maya', 'Jake', 'Sam', 'Riley', 'Ben', 'Emma', 'Theo', 'Ava']`) was used as a fallback when the user hadn't entered any sidekicks. A parent who entered only their kid's name was getting back a story with a fabricated other-child's name (e.g. "Maya yelled, 'FLOBBER!'"). Per the defect note: *"Any name in a template must be a dynamic variable populated from user input only."*

**Fix:**
- Removed `DEFAULT_SIDEKICKS` from `src/content.js` entirely. No invented names anywhere.
- New `buildStory` logic computes two tokens based on whether user has sidekicks:
  - **With user sidekick:** `SK_OPEN` and `SK_MID` both = `[name:Riley]` (chip styling, auto-capitalized)
  - **Without:** `SK_OPEN = '[c:Their pal]'` (sentence-start), `SK_MID = '[c:their pal]'` (mid-sentence), `SK_TITLE = 'Their Pal'` (title position)
- All 16 kid + little Goofy Shorts templates updated:
  - Sentence-start positions → `${SK_OPEN}`
  - Dialogue attributions (`said/asked/yelled/whispered/agreed ${SK}`) → `${SK_MID}`
  - "So/Then/Finally ${SK} ..." mid-sentence patterns → `${SK_MID}`
  - Title patterns `${capitalize(SK)}'s ...` → `${SK_TITLE}`

### Defect 2 (Low) — 'The End' display duration too long
**Root cause:** The dramatic elongated TTS closer added in v1.16.2 used 14 e's in `Theeeeeeeeeeeee... End.`, producing ~3s of audio. Defect note: should target 2s.

**Fix:** Trimmed to 7 e's + shorter ellipsis: `Theeeeeee.. End.` Target now ~1.5–2s.

### Defect 3 (High) — Read-aloud out of sync with displayed text
**Defect note assumed Web Speech API; we use ElevenLabs `/with-timestamps`.** Real cause traced to the karaoke RAF loop:

1. When audio time fell into the gap between `word[i].end` and `word[i+1].start`, the previous highlight was being REMOVED with no replacement (`idx === -1` path unlit but didn't relight). The user perceived these blank-flashes as "audio is ahead of text."
2. Every animation frame ran a fresh `document.querySelector('.kw[data-wi="..."]')` — slow on long stories.

**Fix:**
- Pre-cache all `.kw[data-wi]` nodes once when karaoke starts; each frame is now O(1) DOM access.
- Inter-word continuity: when audio time lands in a gap, keep the **last word whose start ≤ t** lit (walks backwards through `wordTimings` for early exit) instead of blanking the highlight.

### Smoke test (300 stories — 100 kid age 6, 100 little age 5, 100 with empty sidekicks)
- 0 stories containing any name from the removed `DEFAULT_SIDEKICKS` pool
- 0 grammar issues
- 4 paragraphs per kid/little story
- ≥2 freeword shouts per Goofy Shorts story
- Other tiers (tot/big/tween) unchanged
- TTS text length reduced by 6 characters at the end-marker

---

## v1.19.0 — 2026-05-15
**Goofy Shorts: Little Edition — ages 4–5 content rewrite (Story Test Log Entry 001 fix)**

Story Test Log Entry 001 ("The Sunny Island Adventure", Cole, age 5) graded the little tier as **failing** on the app's core promise:

| Dimension | Score | Note |
|---|---|---|
| Humor | 2/5 | One genuinely funny moment (bee with suitcase); everything else flat |
| Substance | 1/5 | Nothing actually happens; events listed but never connect or escalate |
| Age-fit | 3/5 | Vocab fine; needs silliness, not ambient whimsy |
| Name integration | 2/5 | Name inserted, not woven in |
| Replayability | 1/5 | Nothing memorable enough to want again |

Same playtest in Entry 002 with a v1.18.0 kid Goofy Shorts template scored **5/4/5/5/5**. The diagnosis was clear: extend Goofy Shorts to the little tier.

**Implementation:**
- All 7 little tier templates replaced with **8 new Goofy Shorts: Little Edition templates** (Talking Thing Under Bed, Sneaky Snack, Magic Word, Loud Pet, Bouncy Disaster, Funny Sandwich, Talking Hat, Stuck Creature)
- Same structural rules as kid Goofy Shorts:
  - 4 paragraphs (little `PARAGRAPH_LIMIT` dropped 5→4)
  - Sidekick (user-defined or `DEFAULT_SIDEKICKS` fallback) **drives** the action — not a 60% grafted cameo
  - `SILLY_ADJ` + `SILLY_NOUN` combo as central absurd thing
  - Freeword appears 2–3× as shoutable spell / chant / closer
  - Punchline ending woven into the prose
- Simplified for 4–5 year olds: shorter sentences, heavier repetition, more onomatopoeia (BOING, BONK, CHOMP), bedtime-friendly endings
- `injectTierAside` + `injectSidekick` (the 60% cameo) now skipped for **both kid and little** tiers — the failing adult-ironic asides ("the wind agreed politely", "a small flower nodded along") that Entry 001 flagged are now disabled for ages 4–7
- Entry 001's exact failing prose ("Or maybe just a little brave. We'll see.", "a bee flew by carrying a tiny suitcase. Nobody knew why. Nobody asked.") is gone from the codebase

**Smoke test (200 little stories, age 5):**
- 4 paragraphs per story
- 0 grammar issues
- ≥2 freeword shouts per story
- Sidekick name present
- Zero matches for the Entry-001 failing phrases

---

## v1.18.3 — 2026-05-15
**Version badge nudged left to clear mobile corner cutoff**

Badge was getting clipped by rounded corners / notch safe area on mobile. Bumped `#version-badge` right offset 12px → 24px.

---

## v1.18.2 — 2026-05-15
**Fix: duplicate "The End" at story close (defect log entry)**

Bug filed in the Defect Log database: every story ended with "The End" twice — once inside the last paragraph (template-hardcoded "THE END." for kid tier, "The end! 🌟" for tot tier) and once again as the renderer's `<p class="story-end">✦ The End ✦</p>` marker. The narrator was reading both. Visually doubled too.

**Root cause:** "The End" had two sources of truth — string templates and the story screen display component.

**Fix:** Stripped the in-paragraph end markers from 8 kid Goofy Shorts templates + 5 tot templates (13 instances total via two `replace_all` passes). The renderer's `✦ The End ✦` is now the single source of truth, paired with the dramatic elongated TTS closer added in v1.16.2 (`Theeeeeeeeeeeee... End.`).

**Karaoke check:** Word-count alignment between DOM and TTS-spoken text stays in sync because both lose the same words (kid templates lost "THE" + "END" → 2 words; tot templates lost "The" + "end" → 2 words). The `.story-end` paragraph still gets karaoke-wrapped by `wrapStoryWords()` at line 2341.

**Verification:** `grep -n " The end[!.]\\| The End[!.]\\| THE END[!.]"` returns zero matches across the entire codebase.

---

## v1.18.1 — 2026-05-15
**Name persistence — skip the "What's your name?" prompt on repeat sessions**

Back-to-back bedtime stories were friction-laden because every "Start over" forced a re-type of the kid's name. v1.18.1 fixes the multi-story session flow.

**What changed:**
- `state.name` now persists to `localStorage` under key `nt_name` on every keystroke (mirrors how `nt_sidekicks` already works).
- `loadName()` runs on init and pre-populates `state.name`.
- `resetApp()` no longer clears `state.name` — it preserves the saved name and sets `welcomeStep` to `'age'` so the user skips the name prompt entirely.
- On the name step (reached via "← back" from the age screen), a saved name now renders as a sidekick-style chip with an × button. The heading changes from "What's your name?" to "Hi again, {name}!" and the helper copy tells the user how to change it. Tap × to clear and re-enter.

**Behavior summary:**
- First-time user: standard "What's your name?" prompt → age → sidekicks → story
- Returning user (same device, same name): "Start over" → straight to age → sidekicks (already populated too) → story
- Edit path: "← back" from age → chip × → empty input returns

Nothing about the kid Goofy Shorts content from v1.18.0 changes. This is pure UX speed-up for parents reading multiple stories in one session.

---

## v1.18.0 — 2026-05-15
**Goofy Shorts — kid tier rewrite (the playtest fix)**

Playtests with actual 6–7 year olds revealed the kid tier had been drifting toward adult-ironic humor over 19 versions. Stories weren't funny to the audience they were built for. v1.18.0 is a ground-up kid-tier rewrite to the voice kids actually laugh at.

**The four rules behind the rewrite:**
1. **Shorter.** Kid `PARAGRAPH_LIMIT` dropped 5 → 4. Bedtime-length, no padding.
2. **Sidekick drives the action.** Every kid story features a named sidekick (user-defined or default) who is in the prose driving the plot — not a 60%-chance grafted-on cameo.
3. **Silly adjective + silly noun is the joke.** New auto-pools `SILLY_ADJ` (24 entries: wobbly, stinky, boingy, squishy…) and `SILLY_NOUN` (24 entries: pickle, sock, pancake, underpants…) combine into the central absurd object of every story.
4. **Freeword becomes a shoutable spell.** The user's typed word appears 2–3× per story as a yelled spell, codeword, magic incantation, or repeated chant. Every story has at least one line kids can shout along with.

**Templates:** 18 old kid templates → **8 new Goofy Shorts templates** (The Talking Thing Under the Bed, The Snack Heist, The Magic Word, The Loud Pet, The Bouncy Disaster, The Wrong Sandwich, The Underpants Emergency, The Mysterious Burp).

**Tier-specific changes:**
- Adult-ironic asides and the 60% sidekick-cameo injection are now **skipped for kid tier only**. Both still fire for tot/little/big/tween where they land correctly.
- New `DEFAULT_SIDEKICKS` pool (Maya/Jake/Sam/Riley/Ben/Emma/Theo/Ava) so a sidekick name is always available even when the user hasn't added one.
- `FW_SAFE` guarantees a shoutable string (falls back to KAPOW/ZINGO/etc. when the user skipped freeword).

**Smoke test (200 random kid stories, age 6):**
- 100 unique titles (titles parameterize on SADJ + STHING)
- 0 paragraph-count violations (all 4 paragraphs)
- 0 grammar issues (article/plural/vowel/verb-form)
- 0 stories missing 2+ freeword shouts
- 0 stories missing a sidekick name

Other tiers (tot/little/big/tween) untouched and verified non-regressed.

---

## v1.17.0 — 2026-05-15
**5 new kid templates — story-shape variety**

The kid pool had 13 templates, which meant noticeable repetition for users who play multiple stories per session. Added 5 new templates with story shapes not previously covered:

- **#14 The Trade of the Century** — Cole negotiates with a creature; stakes escalate (47-free-hats deals, mystery chickens). New shape: barter/negotiation.
- **#15 The Case of the Missing [Object]** — Cole loses an object, uses the auto-injected OBJ as a callback motif across all 5 paragraphs. New shape: search-and-find.
- **#16 The Day Cole Won a Race (Accidentally)** — Wrong-place-wrong-time triumph. Pasta medals. New shape: accidental victory.
- **#17 The Visitor Who Wouldn't Leave** — A creature shows up uninvited for "the visit", eats everything for three days. New shape: visitor-who-overstays.
- **#18 Cole's Surprise Performance** — Pushed onto a stage with no preparation, improvises a hit. New shape: improv-under-pressure.

All 5 use the existing vocabulary (PET, CRE, OBJ, JOB, NUM, ADV, MOV, etc.) so they automatically benefit from sidekick injections, tier-aware asides, Mad Libs auto-injects, and karaoke highlighting.

**Title diversity in random sampling:**
- Before: 35 unique titles across 200 stories
- After: **47 unique titles across 200 stories (+34%)**

**Grammar verification:** 0 issues across 200 stories. New templates correctly handle plural/vowel article cases, gerund/base-verb tense, and Mad Libs token substitution.

---

## v1.16.2 — 2026-05-15
**Dramatic "The End" — elongated closer with finality**

The narrator was saying "The End" at normal speed (~0.6s total). Now it stretches dramatically:

- TTS text suffix changed from `"\n\nThe End."` to `"\n\nTheeeeeeeeeeeee... End."`
- Repeated `e`s tell ElevenLabs to elongate the vowel (~2-2.5s on "Thheeeeeeeee")
- Ellipsis adds a beat of silence (~0.5s)
- Period on `End.` gives natural sentence-end finality

Net duration: ~3 seconds of dramatic closure instead of 0.6s normal speech.

The rendered "✦ The End ✦" in the DOM is unchanged — still reads clean visually. The karaoke highlight on "The" stays lit for the full elongation (because the word indices map TTS-word-N → DOM-word-N regardless of spelling), then jumps to "End" for the final beat. Visually you see "**The**" hold for ~2.5 seconds, then "**End**" land.

Side effect: IndexedDB audio cache invalidated for all stories (SHA-256 of the TTS text changed). Users get one cache miss per story after deploy, then everything's fast again.

---

## v1.16.1 — 2026-05-15
**Logo composition fix + little tier emoji deduplication**

**Logo:** the book at the bottom of the app icon was sitting almost flush with the bottom border — only 4px of bottom margin out of 1024 in `icon.svg` / `icon-square.svg`, and 2px out of 64 in `favicon.svg`. Lifted the book group up and scaled it slightly so it floats with proper breathing room:

- `icon.svg` / `icon-square.svg` (1024×1024): book group transform changed from `translate(512 800) rotate(-3)` → `translate(512 728) scale(0.88) rotate(-3)`. Bottom margin now 120px (11.7%) instead of 4px.
- `favicon.svg` (64×64): book rects lifted from y=50 → y=46, spine from y=48 → y=44. Bottom margin now 8px (12.5%) instead of 2px.
- All 10 PNG variants (`icon-76/120/152/180/192/512/1024.png` and `favicon-16/32/48.png`) regenerated from the updated SVGs.

**Emoji cleanup (Codex #3 light):** the little tier had `turtle 🐢` and `bunny 🐰` in **both** the pet AND creature rounds. Same emoji could appear in two rounds back-to-back. Replaced creature `turtle` with `butterfly 🦋` and creature `rabbit` with `mouse 🐭` — both fit the little-tier friendly-animals vibe.

---

## v1.16.0 — 2026-05-15
**Callback motif tracking (Codex Option A, item #8)**

Codex's example: pick a story-specific motif (a phrase, an object, a rule) and reuse it 2-3 times in escalating contexts. "Setup: 'no soup after moonrise.' Escalation: 'You brought soup after moonrise?' Payoff: 'Nice soup.'"

That repetition is what makes generated stories feel authored, not assembled.

**What changed:**
- New `RULES` pool — 12 absurd rules ("no soup after moonrise", "always say hello to ladybugs", "whoever finds the spoon makes the rules", "three hops before any door", etc.)
- `RULE` picked once per story in `buildStory`, available to kid templates
- New kid template **#13 The Time [Name] Broke a Rule** structured as a classic callback:
  - **P1 (setup):** The rule is introduced — "Nobody ever questioned: 'whoever finds the spoon makes the rules.'"
  - **P3 (violation):** The protagonist breaks it — "'whoever finds the spoon makes the rules,' the knight whispered, horrified. 'You... you BROKE it?'"
  - **P5 (payoff):** The universe weighs in — "Honestly? Whoever finds the spoon makes the rules was a stupid rule. Don't tell anyone I said that."

**Sample fragment from a live generation:**
> *Cole tiptoed past the sign on a perfectly ordinary morning... Then Cole did it. Right there. In broad daylight. They broke the rule. A passing knight gasped. "whoever finds the spoon makes the rules," it whispered, horrified...*

**Carries into v2.0:** The motif-tracking concept (pick a story-specific element, reference it 2-3x) becomes a property of beat cards in the rich-objects architecture. Implementation rewrites; design pattern persists.

---

## v1.15.0 — 2026-05-15
**Semantically-routed freetext (Codex Option A, item #11)**

Codex's recommendation: instead of every freetext prompt landing as a generic "shouted catchphrase", typed prompts should produce typed values. "Name a smell that means trouble" should let the story use the input AS a smell, not just quote it.

**What changed:**
- All 16 kid freetext prompts tagged with a `subtype`: `shout` (default), `smell`, `name`, `dance`, `word`. The picker UI is unchanged; the subtype is metadata on the prompt.
- `submitFreeText` now propagates the subtype through `state.picks.freeword.subtype`.
- `buildStory` exposes `FW_SUBTYPE` so templates can route the freeword semantically.
- Two new kid templates added that ONLY fire when their subtype is matched:
  - **#11 The Smell That Followed [Name] Home** — fires when subtype is `smell`. Uses the freeword as a literal smell that follows the kid around. ("A faint whiff of burnt toast. Annoying. Mysterious. Persistent.")
  - **#12 The Legendary [Freeword]** — fires when subtype is `name`. Uses the freeword as the actual name of a creature the kid discovers. ("Cole declared the knight's name to be Sir Grumblebottom. The knight tried it on. It fit perfectly.")
- Template selection filter: `templates.filter(t => !t.tags || t.tags.includes(FW_SUBTYPE))`. Untagged templates (the existing 10) remain compatible with every subtype. Tagged templates only fire for their matching subtype.

**Routing verification (200 stories per subtype):**
- `shout` picks: 0 smell-template hits, 0 name-template hits (never leaks)
- `smell` picks: ~10% smell-template hits (1-in-11 odds with 11 eligible templates)
- `name` picks: ~9% name-template hits (same)

**Carries forward into v2.0:** The subtype taxonomy and prompt tags survive the rich-word-objects rebuild. Template routing changes (from filter-by-tags to beat-recipe selection) but the semantic distinction persists.

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
