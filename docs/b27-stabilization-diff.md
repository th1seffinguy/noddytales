# NoddyTales v0.9.3 · b27 — Story Quality Stabilization diff report

**Date:** 2026-05-22
**Sample:** 100 stories per side (BEFORE = b26 main; AFTER = b27 working tree)

## Headline

| Metric | BEFORE (b26) | AFTER (b27) | Δ |
|---|---|---|---|
| Comedy total | 10.65 / 21 | **11.25** | **+0.60** |
| Causality | 0.84 / 3 | **0.99** | **+0.15** |
| Visual joke | 1.41 | **1.69** | **+0.28** |
| Punchline `quoted_only` | 19.2% | **13.5%** | **−5.7pp** |
| Punchline `changes_scene` | 34.7% | **38.0%** | **+3.3pp** |
| Grammar lint hits | 18 (2 dup-article + 16 lowercase) | **0** | **−18** |
| Repetition >20% n-grams | 15 | 14 | −1 |
| Tot sentence median | 19 | **15** | **−21%** |
| Little sentence median | 15 | 15 | 0 |
| **Tween total** | **8.80** | **10.45** | **+1.65** |

The biggest win is **tween**: total +1.65, causality 0.65 → 0.85, callback 0.15 → 0.25 — the Codex finding that "tween changes_scene 22.6% lagging" is directly addressed.

## What changed

### Priority 1 — Audit diagnostic accuracy
`generateStoryV3` now returns `__blueprint`, `__tier`, `__stages` non-rendered fields. Audit scripts (`content-comedy-mechanics.js`, `content-blueprint-health.js`) report the real blueprint instead of `(v2 fallback)` when V3 generated the story. `renderStory()` in index.html is unaffected (only reads `{title, paragraphs}`).

### Priority 2 — `the the` duplicate article
Root cause: tween picker had `{w:'the back of the bus'}` literally. Beats render `'At the [y:{setting.text}]'` + `setting.text = 'the back of the bus'` → `'At the the back of the bus'`. **Fix:** renamed picker entry to `'back of the bus'`. Only offender; grep across all picker pools confirmed unique.

### Priority 3 — Lowercase sentence-start (real cases)
Two real bugs found (16 hits in BEFORE):
1. **`FLAVOR_CALLBACKS.mcguffin` line starting with `[c:{mcguffin.articleText}]`** → renders `some donuts sat off...` lowercase 's'. When appended mid-paragraph, lands after a period+space. **Fix:** reworded to `Off to the side, [c:{mcguffin.articleText}] sat there,...` so capital leads the sentence. Added a 3rd variant for variety.
2. **`The [prop] just... gave up.`** ellipsis pattern triggered lint false-positive as sentence-start. **Fix:** removed the ellipsis (`just gave up`).

AFTER lint: **0/100 lowercase hits**.

### Priority 4 — Repeated structural phrases
Expanded two FLAVOR_CALLBACKS pools targeting the b26 repetition-report's top offenders:
- `mood_throughline` 2 → 6 variants (was 36% repeat on "Cole felt <mood> about")
- `signature_action` 5 → 8 variants (was 22% repeat on "one more time, just to make a point" and "There was a small <move> moment")

### Priority 5 — Beat-selection weighting + tween causality
- `pickStageBeat` in engine now 2x-weights candidates tagged `jokeJob: 'absurd_consequence'` or `jokeJob: 'callback'` **when HIGH_IMPACT roles (chant / payoff_word) are present**. Boosts the rate at which the kid's chosen silly word causes a real event instead of decoration.
- Widened all 24 `absurd_consequence` beats from `tiers:['kid','big']` to `tiers:['kid','big','tween']`. The content reads in tween's ironic register without rewrites. **Tween causality 0.65 → 0.85** as a direct result.

### Priority 6 — Tot/little length trim
6 b24/b26 tot/little chant call-response beats had trailing flourishes ("Everyone sang.", "Cole laughed.", "Then giggled.", etc.). Trimmed one sentence from each (token-free closers only; no protagonist/ally/wonder_object tokens dropped). **Tot median 19 → 15.**

## 5 best improved samples

(See `docs/b27-after/content-comedy-mechanics-*.md` for full top-5 list with stories. Highlights:)

1. **tween age 11 — show_wrong_v3, chant="bonkledink"** — absurd_consequence beat now fires for tween (was kid+big only): `"bonkledink!" yelled Cole, pointing at the broken haunted lunchbox. The haunted lunchbox twitched.`
2. **big age 9 — lost_snack_v3** — mcguffin returns on chant: `"...one word: 'pickle wizard.' The dinosaur confessed immediately. To a different crime.`
3. **kid age 7 — rule_loophole_v3** — chant inverts rule: `"snorble-doo," said Cole. The rule, which had said "no taquitos," now apparently said "yes taquitos."`
4. **big age 10 — goal_spine_v3** — obstacle physically collapses: `"...The dragon tried to argue, tipped slightly, and folded in on itself like cheap furniture."`
5. **tot age 3 — tot_wonder_v3** — trimmed call-response is tighter and lands cleaner without losing the cozy pattern.

## 5 weakest remaining (for b28+)

1. show_wrong_v3 still has the longest median sentence count among blueprints (b25 baseline showed 29; needs a content trim pass)
2. Repetition report still flags 14 n-grams above 20% — mostly story-opening patterns (`<name> and the <pet>`, `at the <place>`) that are structurally hard to vary without restructuring beats
3. `tot/little` chant role still only renders ~50% of stories — Codex deferred queues this as "bias beat selection toward chant-bearing beats when chant is picked"
4. Callback axis was essentially flat in b27 (-0.01); the 2x weighting boosts consequence + callback equally and consequence dominated; b28 could weight callback >2x specifically in landing stage
5. Some `lost_snack` stories still don't surface the false_suspect in escalation — known coverage hole from earlier audits

## Acceptance

- `scripts/qa-current.js` — **25 gates green**
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- All 4 content audits run cleanly
- BUILD_NUMBER 26 → 27; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3
