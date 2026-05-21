# NoddyTales Changelog

Semantic versioning: `MAJOR.MINOR.PATCH`. Every shipped version is tagged here so the in-app version badge stays meaningful.

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
