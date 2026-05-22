# NoddyTales v0.9.3 · b24 — Story Humor Pass diff report

**Date:** 2026-05-22
**Sample size:** 50 random V3 stories (random ages 2-13) per side
**Tool:** `scripts/creativity-sample.js 50 --json` (stripped-text regex; tokens removed before matching so on-screen prose is what's scored)
**Baseline:** b23 (commit `7141729`)
**After:** b24 working tree

## Humor floor

| Metric | BEFORE (b23) | AFTER (b24) | Δ |
|---|---|---|---|
| HIGH_IMPACT punchline lands (kid's freeword renders as `[y:...]` token) | **60%** | **100%** | **+40pp** |
| Sky-physicality leak (cloud-on-head etc.) | 1/50 | **0/50** | −1 |

The HIGH_IMPACT jump from 60% → 100% is the biggest single win: every story that includes a freeword pick now lands that word in a punchline-style yellow-highlight token. The fix was adding `chant: 'sound'` to the four tot/little blueprints + authoring 5 new call-and-response beats for ages 2-5. Previously ages 2-5 collected absurd hints from the picker but had no engine slot to render them.

## Glue-phrase repeats (Codex flagged 6 in pre-b24 sample)

| Phrase | BEFORE | AFTER | Δ |
|---|---|---|---|
| "A faint X glow" | 52% (26/50) | **8%** (4/50) | −44pp |
| "Everything in the room had picked up" | 44% (22/50) | **24%** (12/50) | −20pp |
| "one more time, just to make a point" | 36% (18/50) | **16%** (8/50) | −20pp |
| "possibly a memory" | 14% (7/50) | **6%** (3/50) | −8pp |
| "noticed and tried to act normal" | 16% (8/50) | **8%** (4/50) | −8pp |
| "in a way that meant business" | 16% (8/50) | **12%** (6/50) | −4pp |

Each glue line is still in its variant pool, just no longer the only voice. Variants per pool went from 1-2 → 4-5. Random selection now reads varied instead of repetitive.

## Grammar / polish issues

| Issue | BEFORE | AFTER |
|---|---|---|
| Title bare-verb (`Cole Tell/Share/Find/Sing/...`) | 1/50 | **0/50** |
| Plural-mcguffin singular-verb (`taquitos was`, `pretzels was`) | 4/50 | **0/50** |
| `a binoculars` / `a fries`-class article error | 0/50 | 0/50 (defensive isPlural fix applied for binoculars; no random sample triggered the leak in BEFORE either, but the picker-clone code path can produce it) |

All three polish gates now hold at zero across the random sample.

## Changes by Priority

**Priority 1 — Polish fixes:** binoculars marked `isPlural: true`; `goal_spine_v3` title patterns rewrapped with "Tried to" / "Try to" so bare verb after subject becomes infinitive after preposition; 3 `lost_snack_v3` beats rewrote singular-verb-on-plural-mcguffin patterns; `v3_tl_tot_repeat_hat` got a second safe-physicality line so sky-class wonders don't get placed on a sidekick's head.

**Priority 2 — Comedy-role contract:** new `jokeJob` taxonomy comment block above V3_BEATS (setup / escalation / reversal / physical_gag / callback / punchline / cozy_landing / absurd_consequence). NEW b24 beats tagged. Retroactive tagging of ~150 pre-b24 beats deferred to b25.

**Priority 3 — HIGH_IMPACT consequence variants:** 12 new beats tagged `jokeJob: 'absurd_consequence'` — 3 per blueprint (lost_snack, goal_spine, show_wrong, rule_loophole). The kid's chosen chant/payoff_word now CAUSES a scene event: object reappears, prop revives, rule develops a crack, sidekick adopts the chant, audience picks it up as the show's new name, rule_imposer treats it as a code word.

**Priority 4 — Glue-phrase variant pools:** `FLAVOR_CALLBACKS.signature_action` / `visual_signature` / `chant` / `payoff_word` each expanded from 2 → 5 variants. `v3_ls_problem_mood` expanded from 1 → 4 variants.

**Priority 5 — Tot/little HIGH_IMPACT:** `chant: 'sound'` added to all 4 tot/little blueprint roleMaps. 5 new tl_silly_repeat beats authored with call-and-response `"[y:{chant.text}]?" / "[y:{chant.text}]!"` patterns + gentle physical gags (wonder wiggles, sneezes, hums, flips). Beats require `chant` role so they fire only when the kid picked a sound — existing pick sets without sound stay on the old wonder-only repeat beats.

## QA

- `scripts/qa-current.js` — **25 gates green** (Section 18 added with 7 cases, all pass)
- Section 14 voice resolver — 21/21
- Section 17 HIGH_IMPACT audit — 18/18
- Section 18 Story Humor Pass audit — 7/7 (NEW)
- `node --check` on `src/content.js` + `src/engine-v2.js` + `api/tts.js` + `scripts/qa-current.js` — clean
- Inline `<script>` syntax — clean

## Reproduce

```
node scripts/creativity-sample.js 50 --json > docs/b24-creativity-after.json
# diff against docs/b24-creativity-before.json (committed at b23 baseline)
```
