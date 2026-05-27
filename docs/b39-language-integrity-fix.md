# NoddyTales v0.9.3 · b39 — Story-language integrity repair

**Date:** 2026-05-27
**Defects fixed:**
1. **High:** show_wrong_v3 plural prop grammar (*"Cole had a binoculars" / "held half a binoculars"*)
2. **High:** residual nonsensical flavor callbacks (signature_action filler + mood_throughline atmospheric noun-phrase nominalizations)

## Reproduction (b38)

Force-cycle with prop=binoculars and leaky move/mood picks (180+160 samples):

| Defect surface | b38 hits | Sample |
|---|---|---|
| `held half a binoculars` (show_wrong problem_tween) | 1/160 forced show_wrong (0.6%) | *"Cole held half a binoculars and made eye contact with the universe."* |
| `had a binoculars` (show_wrong setup_1 line 1) | confirmed in narrower Codex run; setup_1 fires on tier kid+big where line 1 = ~33% selection | *"Show day. Cole had a binoculars, a co-star (eagle), and a stage (mall)."* |
| `There was a small [move] moment...` | 13.3% (24/180) | *"There was a small splashed moment that nobody quite witnessed in full."* |
| `A short burst of [move] happened. Witnesses disagreed...` | (same pool, sub-rate) | *"A short burst of crawled happened. Witnesses disagreed about the details."* |
| `[mood] energy to it. Nobody could explain why.` | 10.6% (19/180) | *"The whole day had a heroically mediocre energy to it. Nobody could explain why."* |
| `[mood] quality to the air, if anyone noticed.` | (same pool) | *"There was a deeply snack-motivated quality to the air, if anyone noticed."* |
| `turned a particular shade of [mood]` | (rule_loophole problem_mood line 1) | *"Cole turned a particular shade of snack-motivated."* |

## Fix

### `src/engine-v2.js`

**Priority 1 — show_wrong_v3 plural prop**

| Beat | Before | After |
|---|---|---|
| `v3_sw_setup_1` line 1 | `had a [c:{prop.text}]` | `had [c:{prop.articleText}]` (uses V2Grammar.articleText → "some binoculars" / "a wobbly telescope") |
| `v3_sw_setup_1` line 2 | `rested on one [c:{prop.text}]` | `rested on the [c:{prop.text}]` (plural-neutral) |
| `v3_sw_setup_1` line 3 | already plural-safe (`gave the [c:{prop.text}]`) | unchanged |
| `v3_sw_problem_tween` | `held half a [c:{prop.text}]` | `held what was left of the [c:{prop.text}]` (plural-neutral) |

Audited every show_wrong_v3 beat. No remaining `a [prop]` / `one [prop]` / `half a [prop]` patterns.

**Priority 2 — signature_action filler**

`FLAVOR_CALLBACKS.signature_action` rewritten:

- **Removed:** `"There was a small [move] moment that nobody quite witnessed in full."`, `"A short burst of [move] happened. Witnesses disagreed about the details."`, `"For exactly two seconds, [name] [move] like it was a job."`, `"Halfway through, [name] [move] for absolutely no reason."` — every variant that nominalizes the move as `moment` / `burst`.
- **Kept** (already use move as active verb): 4 survivors from b27.
- **Added tier-aware concrete:**
  - tot/little (2 variants): `"[name] [move] once. The [ally] [move] back."` / `"[name] [move] past the [ally]. The [ally] [move] too."` — call-and-response.
  - kid/big/tween (4 variants): `"[name] [move] sideways, on purpose this time. Nobody else noticed. [name] noticed."` / `"[name] [move] across the room and stopped exactly where they started. The point landed."` / `"For two full seconds, [name] [move] like the room owed them money. It did not."` / `"[name] [move] toward the [ally] and then away again, faster."`

**Priority 2 — mood_throughline filler**

`FLAVOR_CALLBACKS.mood_throughline` rewritten:

- **Removed:** `"The whole day had a [mood] energy to it. Nobody could explain why."`, `"There was a [mood] quality to the air, if anyone noticed."`, `"You could call the mood [mood], and nobody would disagree."` — every atmospheric-noun nominalization.
- **Kept** (already use mood as predicate adjective): 3 survivors from b27.
- **Added tier-aware concrete:**
  - tot/little (2 variants): `"[name] looked [mood] for one second, then looked normal again."` / `"The [ally] watched [name] be [mood]. The [ally] approved."`
  - kid/big/tween (3 variants): `"[name] did the [mood] thing they always do when nobody is watching. Somebody was watching."` / `"[name] glanced at the [ally] in a way that was [mood], specifically. The [ally] caught it."` / `"For three whole seconds, [name] was visibly [mood]. Then back to baseline."`

Also rewrote `v3_rl_problem_mood` line 1 (rule_loophole problem) which used `"turned a particular shade of [mood]"` — now `"went very [mood], visibly. The [rule_imposer] noticed and backed up half a step."`

### `scripts/qa-current.js` — Section 19 extended with 3 new hard gates

```
✓ show_wrong_v3 with prop=binoculars never renders "a binoculars" / "half a binoculars" / "one binoculars" (kid/big/tween) — 0 leaks across forced show_wrong samples
✓ no story contains signature_action filler ("a small [move] moment" / "A short burst of [move] happened") — 0/100 leaks
✓ no story contains mood_throughline filler ("[mood] energy to it" / "[mood] quality to the air" / "turned a particular shade of [mood]") — 0/100 leaks
```

All three gates use the `stripHighlights()` helper added in b38 so the lint sees the same surface the reader (and TTS) does.

## Verification (b39)

Re-ran the same 340-sample force-cycle (160 + 180):

| Defect surface | b38 hits | b39 hits |
|---|---|---|
| `held half a binoculars` (forced show_wrong + prop=binoculars) | 1/160 | **0/160** |
| signature_action filler (`small [move] moment` / `short burst of [move] happened`) | 24/180 | **0/180** |
| mood_throughline filler (`energy to it` / `quality to the air` / `shade of [mood]`) | 19/180 | **0/180** |

### Required scripts

| Script | Result |
|---|---|
| `node scripts/qa-current.js` | ✓ all gates green (Section 19 now 10 sub-gates) |
| `node --check src/content.js` | clean |
| `node --check src/engine-v2.js` | clean |
| `node --check api/tts.js` | clean |
| `node scripts/content-grammar-lint.js --reps 1000` | 0 title bare 3rd-person · 0 plural+was · 0 singular+plural-only · 0 dup articles · 0 lowercase-start · 0 sky-class |
| `node scripts/content-random-50.js` | 0 nulls, samples saved |
| `node scripts/content-comedy-mechanics.js` | total 10.62/21 · causality 0.84 · callback 0.56 |
| `node scripts/content-punchline-audit.js` | changes_scene 51.8%, quoted_only 19.0% (300 HIGH_IMPACT) |
| `node scripts/content-repetition-report.js` | 11 phrases above 20%, 0 endings above threshold |

## Sample before/after

### P1 — plural prop

Show_wrong setup_1 line 1, kid age 6, prop=binoculars:
- **Before (b38):** *"Show day. Cole had a binoculars, a co-star (eagle), and a stage (mall)."*
- **After (b39):** *"Show day. Cole had some binoculars, a co-star (eagle), and a stage (mall)."*

Show_wrong problem_tween, tween age 12, prop=binoculars:
- **Before (b38):** *"The binoculars broke. Cole held half a binoculars and made eye contact with the universe."*
- **After (b39):** *"The binoculars broke. Cole held what was left of the binoculars and made eye contact with the universe."*

### P2 — signature_action filler

Age 2, move=splashed:
- **Before (b38):** *"There was a small splashed moment that nobody quite witnessed in full."*
- **After (b39):** *"Cole splashed once. The duck splashed back."*

Age 8, move=crawled:
- **Before (b38):** *"A short burst of crawled happened. Witnesses disagreed about the details."*
- **After (b39):** *"For two full seconds, Cole crawled like the room owed them money. It did not."*

### P2 — mood_throughline filler

Age 6, mood=snack-motivated (rule_loophole problem):
- **Before (b38):** *"Cole turned a particular shade of snack-motivated. The dragon had not seen that energy before."*
- **After (b39):** *"Cole went very snack-motivated, visibly. The dragon noticed and backed up half a step."*

Age 6, mood=heroically mediocre (FLAVOR_CALLBACKS):
- **Before (b38):** *"The whole day had a heroically mediocre energy to it. Nobody could explain why."*
- **After (b39):** *"For three whole seconds, Cole was visibly heroically mediocre. Then back to baseline."*

Age 7, mood=snack-motivated:
- **Before (b38):** *"There was a snack-motivated quality to the air, if anyone noticed."*
- **After (b39):** *"Cole glanced at the duck in a way that was snack-motivated, specifically. The duck caught it."*

## Manual review — 5 stories each at ages 2, 4, 6, 8, 12 (25 total)

Full transcript in `docs/b39-after/manual-review-samples.txt`. Picks varied across the leaky moves (splashed / swayed / crawled / zoomed / bounced) and leaky moods (sleepy / snack-motivated / heroically mediocre / minorly iconic / weirdly invested) so every fixed beat got exercised.

### Findings

- **Ages 2 & 4 (tot / little):** Every story has at least one `[name] [move] once. The [ally] [move] back.` or `[name] [move] past the [ally]. The [ally] [move] too.` event. Moves now drive a visible reciprocal action between Cole and the companion every time. No filler nominalizations.
- **Age 6 (kid):** Moods and moves both visibly affect another character. Examples landed in samples: *"For three whole seconds, Cole was visibly heroically mediocre. Then back to baseline."* (sample #3); *"Cole glanced at the duck in a way that was minorly iconic, specifically. The duck caught it."* (sample #4). Show_wrong plural-prop fix verified: *"The whole thing rested on the shopping cart."* (sample #1) — no `one [prop]` pattern remains.
- **Age 8 (big):** Concrete cause/payoff each story. Examples: *"Cole splashed sideways, on purpose this time. Nobody else noticed. Cole noticed."* (sample #1, new SA variant); *"For two full seconds, Cole bounced like the room owed them money. It did not."* (sample #5).
- **Age 12 (tween):** show_wrong problem_tween fix verified: *"The shopping list broke. Cole held what was left of the shopping list and made eye contact with the universe."* (sample #1) and *"The wobbly telescope fell over in front of everyone..."* (sample #5). All moves and moods drive concrete events.

### Selected moves and moods now cause concrete events

Across all 25 stories: **every** selected move shows up either as a reciprocal motion (tot/little), a deliberate action with a noted reaction (kid+), or as the protagonist's main verb in a stage description (show_wrong). **Every** selected mood shows up as something Cole visibly does (looks, glances, goes very, walks up "in full X mode") rather than as atmospheric filler. Zero stories show a move or mood used purely as a noun-phrase modifier without a corresponding event.

## Remaining story-quality risks (deferred, not in b39 scope)

1. **Vowel-start mood architectural risk:** the rewritten `v3_rl_problem_mood` line 1 now says `"went very [mood], visibly"` — this is plural- and vowel-safe. But the picker hasn't introduced any vowel-start mood like "amazed" / "amused" / "irritated" yet, so the `[name] kept feeling [mood] about the whole thing` survivors are untested. Architectural defense possible by adding `articleText` to mood slot (parallel to b38 color fix), deferred until a vowel-start mood ships.
2. **"Stories too long globally"** defect remains `In Progress` — kid median 20, big 24, tween 24 sentences vs. target caps 7-8 / 9-11 / 10-12. Not touched in b39 per scope.
3. **Long-tail story-opening repetition** — "Over by the X, Cole was doing the bare minimum"; "Things were technically fine. They would not stay fine." — known b28 patterns, acceptable for now.
4. **Comedy heuristic dipped 10.9 → 10.62 (4-tier mean over multiple runs):** Within run variance. The defect repair removed filler that was inflating "presence" of move/mood tokens. Concrete events replace filler, which is the correct trade-off — heuristic doesn't penalize lower density.
5. **One remaining survivor in mood_throughline:** `"You could call the mood [c:{mood_throughline.text}], and nobody would disagree."` is documented as removed in the comment block but the kept-3 survivors are the right register. Wait — verified: 3 survivors are `kept feeling X about the whole thing`, `stayed X. Steadily X.`, `running on pure X` — all use mood as a predicate adjective attached to a real subject. Clean.

## Acceptance

- `scripts/qa-current.js` — all gates green (Section 19 now 10 sub-gates)
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- 1000-rep grammar lint: 0 hits on every check
- 340-sample force-cycle: 0/0/0 across all three b39 defect surfaces
- 25-story manual review (ages 2/4/6/8/12): every selected move and mood causes a visible event
- BUILD_NUMBER 38 → 39; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3
