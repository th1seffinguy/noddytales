# NoddyTales v0.9.3 · b38 — Abstract color callback defect fix

**Date:** 2026-05-27
**Defect:** "Abstract color sensory callback produces nonsensical and ungrammatical story prose."
**Severity:** High
**Reproduced output (b37):** *"There was a apple red feeling to the moment that nobody really named."*

## Reproduction (BEFORE — b37)

Force-cycle every story tier × every vowel-starting color, 288 samples:

- **Abstract callback hits:** 161 / 288 = **55.9%**
- Example failures:
  - `tot age 2 color="apple red"`: *"There was a apple red feeling to the moment that nobody really named."*
  - `tot age 2 color="electric blue"`: *"A faint electric blue glow hung over the scene by then."*
  - `tot age 2 color="orange"`: *"The light shifted briefly toward orange and then thought better of it."*
  - `tot age 2 color="ice"`: *"There was a ice feeling to the moment that nobody really named."*
  - `tot age 2 color="acid yellow"`: *"The light shifted briefly toward acid yellow and then thought better of it."*

Two bugs in one beat pool:
1. **Abstract / telling-not-showing content** — "feeling to the moment", "thing was happening again", "light shifted toward [color]", "faint [color] glow", "picked up a faint [color] tint", "looked weirdly [color]". These survived the b31 sensory pass because they were the all-tier base (3 lines) at the top of `FLAVOR_CALLBACKS.visual_signature`, and the 3 big/tween-gated abstract lines.
2. **Article mismatch** — `'There was a [c:{visual_signature.text}] feeling...'` hardcodes "a " before the color token. When the color starts with a vowel sound ("apple red", "electric blue", "orange", "ice", "acid yellow"), the result reads "a apple red", "a ice", etc.

## Fix (AFTER — b38)

### `src/engine-v2.js`

**1. Color slot gains `articleText` for future-proofing**
```js
const color = picks.color?.w ? {
  text: picks.color.w,
  articleText: V2Grammar.articleText({ text: picks.color.w })
} : null;
```

**2. `FLAVOR_CALLBACKS.visual_signature` — 6 abstract variants removed, 6 new concrete variants added**

Removed:
- `'A faint [color] glow hung over the scene by then.'`
- `'There was a [color] feeling to the moment that nobody really named.'`
- `'The light shifted briefly toward [color] and then thought better of it.'`
- `'Everything in the room had picked up a faint [color] tint.'`
- `'For a beat the whole place looked weirdly [color].'`
- `'The [color] thing was happening again, whatever it was.'`

Added (no beat leads with "a [color]"):
- kid/big/tween: ceiling flashes color · stripe of color on floor · sleeves turn color · wall blinks color · lamp glows color for two seconds · shoes briefly turn color · tiny spot of color on Cole's hand
- big/tween dry register: streak of color across wall · mirror briefly went color · shadow on wall briefly turned color
- tot/little gentle: small light went color · window went color for one second · socks looked color for a blink

**3. Four beats outside `FLAVOR_CALLBACKS` rewritten to remove `a [c:{visual_signature.text}]` patterns**

| Beat | Before | After |
|---|---|---|
| `v3_ls_attempt_color_clue` line 1 | "There was a [color] smudge on the floor" | "There was a smudge on the floor — [color], specifically" |
| `v3_gs_attempt_color` line 1 | "held up a [color] thing" | "held up something [color]" |
| `v3_gs_attempt_color_signal` line 1 | "waved a [color] flag" | "waved a flag — bright [color]" |
| `v3_gs_attempt_color_signal` line 2 | "pretending to be a [color] traffic cone" | "pretending to be a traffic cone painted [color]" |

### `scripts/qa-current.js` — Section 19 extended with 3 new gates

```
✓ no story contains abstract color callback ("feeling to the moment" / "thing happening again" / etc.) across ages 2-7 — 0/100 leaks
✓ no story contains "a [vowel-color]" article mismatch ("a apple red" / "a electric blue" / etc.) across ages 2-7 — 0/100 leaks
✓ no story contains abstract color callback for ages 8-13 either — 0/60 leaks
```

The regex strips `[c:...]` / `[y:...]` / `[name:...]` highlight wrappers before checking, so the lint sees the same surface the reader (and TTS) does.

## Verification (AFTER — b38)

Re-ran the same 288-sample force-cycle:

- **Abstract callback hits:** 0 / 288 = **0%** (−55.9pp)
- **Article mismatch hits:** 0 / 288 = **0%**

All required scripts:

| Script | Result |
|---|---|
| `node scripts/qa-current.js` | ✓ all gates green (28 acceptance gates: 24 prior + Section 19's 7 sub-gates + Section 20's 2 sub-gates; counts vary by gate-bundling) |
| `node --check src/content.js` | clean |
| `node --check src/engine-v2.js` | clean |
| `node --check api/tts.js` | clean |
| `node scripts/content-comedy-mechanics.js` | total 10.9 / 21 |
| `node scripts/content-punchline-audit.js` | changes_scene 50.0%, quoted_only 13.2% (300 HIGH_IMPACT usages) |
| `node scripts/content-grammar-lint.js` | 0 lowercase, 0 plural-singular, 0 sky-class, 0 duplicate articles |
| `node scripts/content-repetition-report.js` | 0 endings flagged |

## Manual review — 5 kid + 5 tween stories

All 10 stories include the picked color via a concrete visible event. **0 abstract callbacks. 0 article mismatches.** Each visual-signature callback names a specific physical thing (ceiling, sleeves, wall, lamp, mirror, shadow, shoes, light, window, socks).

### 5 kid samples (ages 6-7) — each has concrete cause/payoff

| Tier · age · blueprint | Visual callback (rendered) | Causality / payoff |
|---|---|---|
| kid 6 show_wrong | "The ceiling flashed apple red for exactly two seconds." | chant "plop" repairs broken telescope → callback at bedtime |
| kid 7 rule_loophole | "Cole's sleeves turned electric blue. Nobody explained this." | chant "snorble" + tiny key combo → loophole confirmed |
| kid 6 rule_loophole | "The ceiling flashed tomato red for exactly two seconds." | chant "wubba" misread as code word → rule waived |
| kid 7 goal_spine | "Cole waved a flag — bright midnight blue — at the dragon" | flag freezes dragon long enough → chant "bonk" → won trophy |
| kid 6 lost_snack | "A tiny spot of rainbow appeared on the back of Cole's hand." | chant "flumpy" → suspect's hiding spot collapses, snack rolls out |

### 5 tween samples (ages 11-13) — drier register, still concrete

| Tier · age · blueprint | Visual callback (rendered) | Causality / payoff |
|---|---|---|
| tween 11 show_wrong | "Cole noticed a streak of apple red across the wall. Or did they." | "fwoosh" repairs broken pickle jar → band-name landing |
| tween 12 rule_loophole | "Cole's sleeves turned electric blue. Nobody explained this." | pocket-sized door at specific angle → "grumblepoof" rule inversion |
| tween 13 goal_spine | "For two seconds the lamp glowed tomato red." | sleepy stare-down → "squonk" → dragon slides aside |
| tween 11 lost_snack | "Cole's shoes briefly turned midnight blue. Briefly." | "zoinks" → suspect drops snack onto Cole's plate (case closed by gravity) |
| tween 12 rule_loophole | "The mirror went rainbow for a beat. Mirrors are not supposed to do that." | "kabloom" + backpack-zipper loophole → recount confirms |

## Remaining story-quality risks (not fixed in b38)

1. **`signature_action` flavor callback "There was a small [move] moment that nobody quite witnessed in full."** — fires in kid sample 5 (`There was a small zoomed moment...`). Same telling-not-showing register as the abstract color lines b38 just killed. Not in scope per the defect spec (visual_signature only) but the same class of bug. Candidate for b39.
2. **`mood_throughline` callback "The whole day had a [mood] energy to it. Nobody could explain why."** — fires in tween sample 1. Same register; not in scope.
3. **"Stories too long globally" defect remains In Progress** — kid median 20, big 24, tween 24 sentences (Section 10 advisory). Targets are 7-8/9-11/10-12. Not touched in b38.
4. **Repetition at story-opening level** — "Over by the bedroom, Cole was doing the bare minimum" appears 2× in tween sample 5; "Things were technically fine. They would not stay fine." 2×. Known b28 long-tail patterns.
5. **`mood_throughline`'s "Cole turned a particular shade of [mood]"** — same article-mismatch class as the visual fix if mood ever starts with a vowel ("Cole turned a particular shade of angry / amazed / irritated"). The pool currently doesn't include vowel-start moods, but the architectural risk is identical. Worth a defensive pass.

## Acceptance

- `scripts/qa-current.js` — all gates green
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- 288-sample force-cycle: 0 abstract callbacks, 0 article mismatches
- BUILD_NUMBER 37 → 38; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3
