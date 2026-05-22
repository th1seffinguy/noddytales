# NoddyTales v0.9.3 · b28 — Blueprint Depth Pass diff report

**Date:** 2026-05-22
**Sample:** 50–100 stories per audit (BEFORE = b27 main; AFTER = b28 working tree)
**Run-to-run variance note:** Comedy mechanics scoring is heuristic and shows ±0.4 point variance across 50-story samples. Means below are taken from multiple runs where noted.

## Headline

| Metric | BEFORE (b27) | AFTER (b28) | Δ |
|---|---|---|---|
| Comedy total (heuristic) | 11.00 / 21 | **10.55 mean** (representative 10.56) | **−0.45** |
| Causality (axis) | 0.78 | **0.78** | 0.00 |
| Visual joke (axis) | 1.62 | 1.38 | −0.24 |
| Callback (axis) | 0.62 | **0.64** | +0.02 |
| Premise clarity (axis) | 1.94 | 1.92 | −0.02 |
| **Punchline `changes_scene`** | **43.7%** | **~48% mean (45-55% range)** | **+4–11pp** |
| Punchline `quoted_only` | 7.2% | ~12% | +4.8pp |
| Repetition >20% n-grams | 91 | **13** | **−78 (−86%)** |
| **show_wrong_v3 median sentences** | **27** | **22** | **−5 (−19%)** |
| Grammar lint hits | 0 | **0** | hold |
| Tot median sentences | 16 | 16 | 0 (held b27 gains) |
| Little median sentences | 15 | 15 | 0 (held b27 gains) |

The comedy heuristic dipped 0.45 because the show_wrong_v3 trim and "in a way that" rewrites removed descriptive density that the scoring rewards. The trim was the explicit task ("trim sentence count materially. Avoid adding more random decoration"). The wins are on the targeted metrics: repetition collapsed 86%, show_wrong shortened 19%, changes_scene cleared the >45% bar.

## What changed

### Priority 1 — show_wrong_v3 mini-arc rewrite + trim

show_wrong_v3 was the longest blueprint (b27 median 27 sentences). Codex called out the generic "prop broke / Cole improvised / audience reacted" repetition.

**Setup beats** (3 variants for kid+big, 2 for tween) rewritten as distinct mini-arc *openings* — declaration / location / plan-statement / aside — instead of all repeating "There was going to be a show. Cole had been planning it for days. The stage was the X. The co-star was the Y. The crucial prop was a Z." Each variant now lands in 3 sentences instead of 5.

**Problem beats** trimmed from 4-6 sentences to 2-3, with three distinct mini-arcs (prop snaps / refuses / launches) instead of one generic "broke" template.

**Attempt beats** got a third chant-bearing variant; the no-chant "in a way that nobody had rehearsed" line rewritten as concrete imagery.

**Escalation** got a third variant (obstacle tries to leave / ally blocks exit) to break out of heckler-only pattern.

**Payoff + landing** beats trimmed throughout — every multi-sentence run condensed by 1-2 sentences without losing the comedy beat.

Result: show_wrong_v3 median sentences 27 → 22.

### Priority 2 — Selected-word causality (kid/big/tween)

`pickStageBeat` got a stage-aware boost stack on top of the b27 2x weighting:

```js
// 1. Global 2x for jokeJob='absurd_consequence' (b27 carryover)
// 2. Landing-stage additional 2x for jokeJob='callback' (total 3x in landing)
// 3. Tot/little 2x for any beat containing [y:{chant.*}] when chant picked
```

Combined with the b27 widening of all 24 absurd_consequence beats to tween, this lifted per-tier punchline `changes_scene` substantially:

| Tier | BEFORE | AFTER (representative run) |
|---|---|---|
| kid | 44.0% | 50.0% |
| big | 25.0% | 37.5% |
| tween | 25.0% | 41.5% |

Total `changes_scene`: 43.7% → ~48% mean across 5 runs. Target was >45% — met.

### Priority 3 — Callback landing weighting

Inside `pickStageBeat`, when `chant` or `payoff_word` is picked AND `stage.name === 'landing'`, candidates tagged `jokeJob: 'callback'` get an additional 2x on top of the b27 global 2x — total 3x weight in landing stage.

Callback axis went 0.62 → 0.64 in the representative run. Variance across runs is ±0.1 so this is essentially flat. The mechanism is in place but callback beats also need wider tier coverage to lift further (queued for b29).

### Priority 4 — Repetition rewrites

The Codex post-b27 repetition report flagged 91 n-grams above 20%. b28 attacked five specific patterns by rewriting beat *structures*, not adding variants:

1. **"the <pet> applauded the <creature> because manners"** + **"heard it made a small noise and stepped aside"** + **"in a way that looked rehearsed"** — these three top-20% n-grams all lived in ONE beat (`v3_gs_payoff_chant_obstacle_caves`). Rewritten with two structurally distinct variants:
   - `"chant!" yelled Cole. The obstacle froze, blinked twice, and quietly slid out of the way. Cole goal'd. The ally gave a single dignified nod.`
   - `Cole said "chant" once, calmly. The obstacle suddenly remembered somewhere else it needed to be. Cole goal'd through the gap. The ally noted this for later.`

2. **"declared the <food> forbidden..."** cascade (one beat, 12 separate top-20% n-gram hits) — rewrote `v3_rl_problem_mood` with three structurally distinct mood-flavored variants. Also documented a coding rule in-place: never lead a sentence with `[c:{mcguffin...}]` (plural agreement bug) or `[c:{mood_throughline...}]` (lowercase-start lint).

3. **"in a way that"** — 6 separate beats rewritten to remove this template phrase (replaced with concrete imagery: "with theatrical timing", "like a professional who had committed to a specific kind of unhinged", "like nobody had practiced it", etc.).

4. **"at the <place> <name>"** — 5 beats reorderings putting other content first ("Over by the X, Cole..." / "Decision made. Today, at the X..." / etc.) so "At the X, name" no longer monopolizes setup openings.

5. **"<name> and the <pet> were at the <place>"** — lost_snack_v3 setup pool expanded from 2 variants to 4 with structurally varied openings.

Result: 91 → 13 n-grams above threshold (−78, −86%).

### Priority 5 — Tot/little chant-bearing beat bias

When tier is tot or little AND `chant` is in roles, beats whose `lines` contain a `[y:{chant.*}]` token get a 2x weight bonus. This biases beat selection toward authored call-and-response beats when the kid actually picked a chant/sound.

Implementation lives in the same `pickStageBeat` weighting block. Tot/little chant render rate is hard to measure without running blueprint-health 10+ times for stability, but the per-tier callback axis is at 1.0 (maxed) and `changes_scene` is 89-100% for tot/little (already at ceiling).

### Priority 6 — QA verification

- `node scripts/qa-current.js` — 25 acceptance gates green
- `node --check src/content.js` — clean
- `node --check src/engine-v2.js` — clean
- `node --check api/tts.js` — clean
- All 5 content audits ran cleanly

## 5 best improved samples

Pulled from the representative AFTER run at `docs/b28-after/content-comedy-mechanics-2026-05-22T15-25-14.md`. Top-5 list with stories is in that file.

## 5 weakest remaining (queued for b29+)

1. **Comedy heuristic vs. trim trade-off** — The show_wrong trim cost ~0.4 points on the heuristic. Either add 2-3 high-density payoff beats specifically for show_wrong that preserve the trim, or extend `content-comedy-mechanics.js` to discount sentence-count from the premise/visual axes.
2. **callback axis still flat (0.64)** — the 3x landing weighting is in place but tier-eligible callback beats are still concentrated in kid+big. Author 2-3 tween-specific callback beats for goal_spine and lost_snack.
3. **quoted_only crept up 7.2 → 12%** — within healthy range (<40%) but worth watching. Often means a chant rendered as `"chant!" said Cole.` with no follow-up scene change. Add more beats where chant *causes* something visible.
4. **show_wrong_v3 still 22 sentences median** — target was "20ish". One more pass on setup beats (currently 3 sentences each; can become 2-sentence openers with a follow-up problem beat) would close the gap.
5. **Repetition has 13 phrases above 20%** — was 91. Long-tail repeats now: "Cole and the X were", "the X said it back then" (tot/little call-response intentional repetition). Acceptable.

## Acceptance

- `scripts/qa-current.js` — **25 gates green**
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- All 5 content audits run cleanly
- BUILD_NUMBER 27 → 28; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3
