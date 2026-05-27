# NoddyTales v0.9.3 · b40 — Move-class routing + binoculars gate fix

**Date:** 2026-05-27
**Defects fixed:**
1. **High:** Selected action phrases compose nonsensically with movement-only beat frames (tween "gesture" moves like `dramatically sighed` / `existentially paused` / `stared into the middle distance` rendered into directional frames like "across the stage" / "without thinking").
2. **High:** b39 binoculars regression gate did not actually force `prop=binoculars` in V3 (set `setting.objectBias`, which V3 ignores).

## Reproduction (b39)

| Defect | Method | b39 hit rate |
|---|---|---|
| Tween gesture × directional frame | Force 13 tween gesture moves × ages 11/12/13, 10 samples each (390 total). Count composites like "Cole reluctantly arrived across the stage" / "Cole mysteriously vanished without thinking". | **225 / 390 = 57.7%** |
| Section 19 binoculars gate effectiveness | Force show_wrong_v3 generation with `setting.objectBias='binoculars'`. Count samples actually rendering "binoculars". | **0 / 200 = 0%** — the b39 gate could not catch any plural-prop regression because the prop was never forced. |

Example BEFORE renders:
- *"Cole dramatically sighed across the stage like that had been the plan all along."*
- *"Cole mysteriously vanished without thinking. It was a thing they did now."*
- *"Cole stared into the middle distance without thinking. It was a thing they did now."*
- *"Cole reluctantly arrived across the room and stopped exactly where they started."*
- *"Cole casually yeeted everything past the dragon with theatrical timing."*

## Fix architecture

### `MOVE_CLASS` table (`src/engine-v2.js`)

New module-scope constant declared right before `V3_BEATS`. Every picker `move` option is classified as one of two compatibility classes:

- **`motion`** — directional locomotion that composes naturally with frames like "across the stage", "over to the X", "past the Y", "toward", "sideways", "right past", "forward fast", "without thinking". This is the default for unknown moves.
- **`gesture`** — stillness / state / reaction / vanish / gaze. Filtered out of directional frames; routed only into class-agnostic beats and explicit gesture-friendly frames.

Coverage:

| Tier | motion | gesture |
|---|---|---|
| tot | hopped, spun, ran, marched, jumped, crawled, splashed, rolled, swayed, stomped, wiggled, danced, slid, tiptoed, bounced | clapped, peeked, hugged |
| little | (tot motion +) galloped, twirled, zoomed, skidded, flopped, skipped, tumbled, floated | (tot gesture +) waved |
| kid | (everything above +) leapt, glided, charged, crept, soared, skated, shimmied, wobbled, sprinted, cartwheeled, zigzagged, moonwalked, belly-flopped, shuffled | — |
| big | tiptoed cautiously · stumbled dramatically · waltzed accidentally · skipped solemnly · meandered thoughtfully · tripped magnificently · spun ceremoniously · reversed unexpectedly · shuffled importantly · scuttled with purpose · moonwalked carefully · lurched heroically · marched stubbornly · sprinted incorrectly · slid heroically | fell upward somehow · flailed politely · hovered suspiciously · posed dramatically · stared bravely |
| tween | speed-ran · chaotically bolted · gracefully bailed · rage-walked · speed-walked nowhere | dramatically sighed · casually yeeted everything · existentially paused · mysteriously vanished · aggressively scrolled · passive-aggressively waved · reluctantly arrived · took a long sip and stared · nodded knowingly · awkwardly hovered · blinked dramatically · panicked quietly · stared into the middle distance |

When `picks.move` is set, the engine attaches `class: (MOVE_CLASS[picks.move.w] || 'motion')` to the move slot. The default 'motion' is safe because (a) the kid pool is 100% motion verbs (so the kid path is unchanged), and (b) only beats explicitly tagged `requiresMoveClass:'motion'` are filtered — agnostic beats remain eligible.

### Beat routing (`pickStageBeat`)

```js
const moveClass = roles.signature_action ? (roles.signature_action.class || 'motion') : null;
// ...
if (b.requiresMoveClass && moveClass && b.requiresMoveClass !== moveClass) return false;
```

Beats tagged with `requiresMoveClass: 'motion'`:

| Beat ID | Frame |
|---|---|
| `v3_ls_attempt_move` | "over to the X" / "across the scene" |
| `v3_ls_attempt_tween_move` | "past the X with theatrical timing" |
| `v3_gs_attempt_move` | "right past everything" / "forward fast" |
| `v3_gs_attempt_tween_move` | "right through the scene" |
| `v3_sw_attempt_move` (split) | "across the stage like nobody had rehearsed it" |
| `v3_rl_attempt_tool_move` | "sideways while holding the tool" |

Plus a NEW gesture-friendly companion: `v3_ls_attempt_tween_gesture` — `"Cole [signature_action] at the [false_suspect]. The [false_suspect] did not love being [signature_action] at."` — fires when tween picks a gesture move on lost_snack.

`v3_sw_attempt_move` was split into:
- `v3_sw_attempt_move` (motion-only): "across the stage" line.
- `v3_sw_attempt_move_plan` (class-agnostic): "like it was the plan" line.

`v3_sw_attempt_tween_unhinged` (the Codex repro line) had "across the stage" dropped — the rewrite preserves the bit ("like that had been the plan all along") and works for both motion and gesture moves.

### Flavor callback routing (`pickFlavorVariant`)

`FLAVOR_CALLBACKS.signature_action` variants are now tagged `requiresMoveClass` where appropriate. `pickFlavorVariant` filters by both `tiers` and `requiresMoveClass` (only for the signature_action role; other roles ignore moveClass).

Class-agnostic variants (work for both):
- *"[name] [move] one more time, just to make a point."*
- *"Somewhere in there, [name] [move] for emphasis."*
- *"[name] [move] briefly, then pretended that had not happened."*
- *"For two full seconds, [name] [move] like the room owed them money. It did not."*
- *"[name] [move] once. The [ally] [move] back."* (tot/little)

Motion-only variants:
- *"[name] [move] without thinking. It was a thing they did now."* ← the b39 Codex repro
- *"[name] [move] past the [ally]. The [ally] [move] too."* (tot/little)
- *"[name] [move] sideways, on purpose this time."* (kid/big/tween)
- *"[name] [move] across the room and stopped exactly where they started."*
- *"[name] [move] toward the [ally] and then away again, faster."*

NEW gesture-friendly variants added for kid/big/tween:
- *"Without warning, [name] [move]. The room noticed. [name] did not explain."*
- *"[name] [move], deliberately, where the [ally] could see. The [ally] filed it away."*

### Test infrastructure — `picks.__forceProp`

V3 picks the object slot randomly from `V2_WORDS.objects`. The b39 gate set `setting.objectBias='binoculars'` which V3 does not consult — the gate was a no-op. b40 adds an opt-in test-only injection:

```js
let object;
if (picks && picks.__forceProp) {
  const forced = V2_WORDS.objects.find(o => o.id === picks.__forceProp || o.text === picks.__forceProp);
  object = forced || rawPick(V2_WORDS.objects);
} else {
  object = rawPick(V2_WORDS.objects);
}
```

The picker never sets `__forceProp`. The Section 19 gate now alternates `__forceProp` between `binoculars` (plural; isPlural:true) and `wobbly_telescope` (singular). New first-line sanity gate fails if the forced prop doesn't actually appear in the story, so any future routing change that breaks the override surfaces immediately.

## Verification

### Force-cycle proof

| Defect surface | b39 hits | b40 hits |
|---|---|---|
| Tween gesture × directional frame (390 forced samples, 13 gestures × 3 ages × 10) | **225 / 390 = 57.7%** | **0 / 390 = 0%** |
| show_wrong + `__forceProp:'binoculars'` actually renders binoculars | n/a (gate was ineffective) | **40 / 40 = 100%** |
| show_wrong + binoculars: plural-prop grammar leaks | n/a | **0 / 80** |
| show_wrong + wobbly_telescope: singular-prop grammar leaks | n/a | **0 / 80** |

### Required QA scripts

| Script | Result |
|---|---|
| `node scripts/qa-current.js` | ✓ all gates green (Section 19 now **14 sub-gates**: 10 from prior builds + 4 new in b40) |
| `node --check src/content.js` | clean |
| `node --check src/engine-v2.js` | clean |
| `node --check api/tts.js` | clean |
| `node scripts/content-grammar-lint.js --reps 1000` | 0 title bare 3rd-person · 0 plural+was · 0 singular+plural-only · 0 dup articles · 0 lowercase-start · 0 sky-class |
| `node scripts/content-random-50.js` | 0 nulls |
| `node scripts/content-comedy-mechanics.js` | total 11.14/21 · changes_scene 47.0% · quoted_only 15.7% |
| `node scripts/content-punchline-audit.js` | 300 HIGH_IMPACT usages, 47.0% changes_scene |
| `node scripts/content-repetition-report.js` | 14 phrases above 20%, 0 endings above threshold |
| `node scripts/content-blueprint-health.js` | 0 nulls across all 8 blueprints |

### Sentence-count medians vs b39 baseline

| Tier | b39 | b40 | Δ |
|---|---|---|---|
| tot | 16 | 16 | 0 |
| little | 17 | 17 | 0 |
| kid | 21 | 20 | −1 |
| big | 24 | 24 | 0 |
| tween | 25 | 26 | **+1** |

Tween +1 sentence comes from the new gesture-friendly flavor callbacks ("Without warning, Cole [move]. The room noticed. Cole did not explain.") replacing what previously failed silently into a directional-frame nonsense beat. The new beats are shorter than typical filler but appear more reliably for gesture moves. "Stories too long globally" defect remains In Progress; b40 did not target it.

### Tween move × frame exhaustive sweep (new Section 19 gate)

For every one of the 13 tween gesture moves, 50 generation cycles attempted. Composite regex `Cole <gesture> (across|over to|past the|toward|sideways|right past|right through|forward fast|without thinking)` checked.

**Result: 0 / 650 composite failures.**

For all 5 tween motion moves, sample 30 cycles each and confirm they STILL hit a directional frame at least once (so the routing didn't orphan motion moves).

**Result: 5 / 5 motion moves hit a directional frame.**

## Manual review — 5 stories per tier × 5 tiers (25 total)

Full transcript: `docs/b40-after/manual-review-samples.txt`. Picks deliberately exercised:
- Tot/little: 3 motion moves + 2 gesture moves (clapped, peeked, hugged, waved)
- Big: 1 motion + 4 gestures (posed dramatically, flailed politely, sprinted incorrectly, stared bravely)
- Tween: 1 motion (speed-walked nowhere) + 4 gestures (dramatically sighed, mysteriously vanished, reluctantly arrived, stared into the middle distance)

### Findings — every selected move composes naturally

**Tot (age 2):** mostly call-response renders (`"Cole hopped once. The duck hopped back."`). Hugged renders as `"Cole hugged once. The duck hugged back."` — class-agnostic call-response works for gesture too. ✓

**Little (age 4):** `"Cole waved one more time, just to make a point."` (class-agnostic). No directional composite involving `waved`. ✓

**Kid (age 6):** all-motion picker; both directional and agnostic frames hit normally. No regression. ✓

**Big (age 8):**
- `posed dramatically`: *"Somewhere in there, Cole posed dramatically for emphasis."* (class-agnostic) ✓
- `flailed politely`: *"Cole flailed politely one more time, just to make a point."* (class-agnostic) ✓
- `stared bravely`: *"For two full seconds, Cole stared bravely like the room owed them money. It did not."* (class-agnostic) ✓
- `sprinted incorrectly` (motion): *"Cole sprinted incorrectly sideways while holding the lunch tray."* (motion → directional frame still works) ✓
- `tiptoed cautiously` (motion): *"Cole tiptoed cautiously across the scene."* ✓

**Tween (age 12):**
- `dramatically sighed`: *"Without warning, Cole dramatically sighed. The room noticed. Cole did not explain."* ✓
- `mysteriously vanished`: *"Without warning, Cole mysteriously vanished. The room noticed. Cole did not explain."* ✓
- `reluctantly arrived`: *"Cole reluctantly arrived, deliberately, where the duck could see. The duck filed it away."* ✓
- `speed-walked nowhere` (motion): *"Cole speed-walked nowhere like a professional who had committed to a specific kind of unhinged."* ✓
- `stared into the middle distance`: *"Cole stared into the middle distance one more time, just to make a point."* ✓

**Zero stories show a gesture/state move glued to a directional frame.** Every selected move drives a visible event in a syntactically compatible frame.

## Sample before/after

| Tier · age · move | Before (b39) | After (b40) |
|---|---|---|
| tween 11, `dramatically sighed` | *"Cole dramatically sighed across the stage like that had been the plan all along."* | *"Without warning, Cole dramatically sighed. The room noticed. Cole did not explain."* |
| tween 12, `mysteriously vanished` | *"Cole mysteriously vanished without thinking. It was a thing they did now."* | *"Without warning, Cole mysteriously vanished. The room noticed. Cole did not explain."* |
| tween 13, `stared into the middle distance` | *"Cole stared into the middle distance without thinking. It was a thing they did now."* | *"Cole stared into the middle distance one more time, just to make a point."* |
| tween 11, `reluctantly arrived` | *"Cole reluctantly arrived across the stage like that had been the plan all along."* | *"Cole reluctantly arrived, deliberately, where the duck could see. The duck filed it away."* |
| (Section 19 binoculars gate) | b39 gate ran 80 samples; 0 actually rendered binoculars; gate was a no-op | b40 gate forces `__forceProp:'binoculars'`; 40/40 render binoculars; plural-prop check exercises actual surface |

## Remaining story-quality risks (deferred, not in b40 scope)

1. **Vowel-start mood architectural risk** (b39 carryover) — defensive `articleText` for the mood slot when the first vowel-start mood ships.
2. **"Stories too long globally"** — still `In Progress`. Tween median ticked +1 sentence in b40 because the new gesture-friendly callbacks are visible (replaced silent failures into directional-frame filler). Net narrative quality is up; raw sentence count edged up.
3. **Big pool gesture moves are tier-shared** — `posed dramatically`, `flailed politely`, etc. land into class-agnostic frames cleanly, but the big tier has no `requiresMoveClass:'gesture'` companion beats yet. The class-agnostic survivors carry the load. If a gesture-tagged variant feels missing for big tier, add explicit ones in b41+.
4. **Move-class on free-text input** — picker is the only path that consults `MOVE_CLASS`. If a future feature lets parents type custom move text, the unknown move defaults to 'motion' (safe for locomotion verbs; risky for typed gestures). Defensive plan: when free-text moves ship, run a tiny `looksLikeMotion()` heuristic at input time (verb ending in -ed and no adverb signal → motion; otherwise gesture).
5. **`v3_ls_attempt_tween_gesture` is single-variant** — fires every time a tween picks a gesture move on lost_snack. Could repeat across replays. Worth expanding to 2-3 variants in b41 if rendering frequency surfaces in repetition-report.

## Acceptance

- `scripts/qa-current.js` — all gates green (Section 19 now 14 sub-gates)
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- 1000-rep grammar lint: 0 hits across every check
- 390-sample tween force-cycle: 0 composite failures (was 225 = 57.7%)
- 40-sample `__forceProp` test: 100% binoculars render (was 0% with objectBias)
- 25-story manual review across 5 ages × 5 picks: every move composes naturally
- BUILD_NUMBER 39 → 40; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3
