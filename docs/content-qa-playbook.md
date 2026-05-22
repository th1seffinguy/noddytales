# NoddyTales Content QA Playbook

This is the **repeatable workflow** for keeping NoddyTales story humor, polish, and variety improving across builds. Introduced in `v0.9.3 · b25`.

The release-gate QA harness (`scripts/qa-current.js`) tells you *whether the engine works*. This playbook tells you *whether the stories are funny.*

---

## The six audits

All scripts live in `scripts/` and write outputs to `docs/content-qa-runs/<datetag>/` by default. Pass `--out <dir>` to redirect (e.g. for build-tagged baselines).

| Script | What it does | Cadence |
|---|---|---|
| `content-golden-audit.js` | Generates 20 **fixed** scenarios spanning all tiers / blueprints / settings / story modes. Output is a markdown file with **blank human score fields** (humor / substance / choice integration / age fit / rereadability / notes). Reproducible across builds — re-running between content builds shows whether a fix moved the needle on a specific story shape. | After every content build |
| `content-random-50.js` | 50 random V3 stories balanced 10/tier. Markdown + JSON output. Includes sentence count / blueprint / flavor / picks per story. | After every content build |
| `content-repetition-report.js` | Scans 100-200 stories for repeated 4-7-word n-grams + repeated last sentences. Flags phrases above a configurable threshold (default 20%). Identifies candidates for variant-pool expansion. | After every content build |
| `content-punchline-audit.js` | For HIGH_IMPACT chant/payoff_word usages, heuristically classifies each as `quoted_only` / `causes_reaction` / `changes_scene` / `returns_as_callback` / `lands_in_final_third`. Surfaces whether the kid's absurd word is decoration or consequence. | After every content build |
| `content-blueprint-health.js` | 10+ stories per V3 blueprint. Reports sentence count median/max, HIGH_IMPACT render rate, top repeats per blueprint, plus one sample story per blueprint with blank score fields. Identifies the weakest blueprint to target in the next build. | After every content build |
| `content-grammar-lint.js` | Standalone regex pass for joke-breakers across a 100-story sample (bare-verb titles, plural-was, "a binoculars", "the the", lowercase sentence starts, sky-on-head physicality, overused glue phrases). Diagnostic only — release gate is `qa-current.js` Section 18. | After every content build |

---

## Running all six (post-build workflow)

```bash
# 1. Release-gate QA must still pass (25 gates as of b25)
node scripts/qa-current.js

# 2. Then the 6 content audits — each writes a date-stamped file to docs/content-qa-runs/
node scripts/content-golden-audit.js
node scripts/content-random-50.js
node scripts/content-repetition-report.js
node scripts/content-punchline-audit.js
node scripts/content-blueprint-health.js
node scripts/content-grammar-lint.js
```

For a **build-tagged baseline** (e.g. you want a permanent snapshot of the b24 state):

```bash
mkdir -p docs/content-qa-b24-baseline
for s in golden-audit random-50 repetition-report punchline-audit blueprint-health grammar-lint; do
  node scripts/content-$s.js --out docs/content-qa-b24-baseline
done
```

The b24 baseline is committed under `docs/content-qa-b24-baseline/` so future content builds can diff against it.

---

## Scoring rubric (for golden + weakest-10 human passes)

Score 1-5 on each axis. **3 = ships acceptably. 4-5 = good. 1-2 = drag.**

- **Humor** — did at least one moment make a 6-year-old laugh out loud (or a parent smirk)?
- **Substance** — does the story have a real beginning / middle / end? Or is it 4 paragraphs of nothing?
- **Choice integration** — do the kid's picks materially affect the story, or are they decoration?
- **Age fit** — is the vocab / sentence length / joke complexity right for the target age?
- **Rereadability** — if a kid replayed this exact pick set 3 times, would they still smile, or feel stale?

Tier-specific minimum bars:

- **tot (ages 2-3)** — humor + age-fit must be 4+; substance can be lighter
- **little (4-5)** — humor + choice integration must be 4+
- **kid (6-7)** — all 5 axes 3+
- **big (8-10)** — humor + rereadability must be 4+
- **tween (11-13)** — humor + rereadability + choice integration must be 4+

---

## Stop conditions

Don't ship a content-build if any of these are true after the audits run:

- Repetition report flags **any** n-gram above the threshold (default 20%) → expand variant pools first
- Punchline causation rate (`changes_scene + causes_reaction`) **< 50%** of rendered HIGH_IMPACT usages → author more absurd_consequence beats
- Any blueprint's golden-set avg human score **< 3** on any axis → fix the blueprint
- Any tier's random-50 humor median **< 3** → tier-specific content pass

---

## What to log in Notion after each content build

Add a row to the **Content QA / Story Quality** tracking page (parent: NoddyTales hub) with:

- Build (e.g. `v0.9.3 · b24`)
- Date
- Golden audit avg score (if human-rated)
- Random-50 humor score median
- Top 3 repeated phrases (count / 100 stories)
- Punchline causation rate (% of HIGH_IMPACT usages that change the scene)
- Top 3 fixes queued for next build

Keep the row concise — detailed outputs live in the repo under `docs/content-qa-<build>-baseline/`.

---

## The recurring loop (target cadence: every 2-3 builds)

```
1. Automated QA gates           (qa-current.js — must stay green)
2. Run all 6 content audits     (the scripts above)
3. Human review of weakest 10   (5 worst from random-50 + 5 lowest from golden)
4. Pick TOP 3 FIXES ONLY        (resist fixing everything)
5. Ship next content build      (b26, b27, ...)
6. Re-run audits, diff vs prior (the baseline files in docs/ make this trivial)
```

The audits are intentionally **diagnostic**, not bureaucratic. They surface the weakest 10 stories — read them. Pick 3 fixes. Ship. Run again. Stories get better over time without ever landing a sweeping rewrite.

---

## File locations summary

```
scripts/
├── content-golden-audit.js         (20 fixed scenarios)
├── content-random-50.js            (50 random V3, balanced 10/tier)
├── content-repetition-report.js    (n-gram + ending dedup audit)
├── content-punchline-audit.js      (HIGH_IMPACT classification)
├── content-blueprint-health.js     (per-blueprint stats)
└── content-grammar-lint.js         (joke-breaker regex pass)

docs/
├── content-qa-playbook.md          (this file)
├── content-qa-runs/                (default output dir; new-content-build runs)
└── content-qa-b24-baseline/        (permanent b24 snapshot for diff comparison)
```

---

## Honest caveats

- The punchline-audit `changes_scene` classifier is **heuristic** — it looks for transformation verbs in the 220 chars after the picked word. Some hits over-claim (a "nodded" might be ally agreement, not consequence). Cross-check against the random-50 output before concluding.
- The grammar-lint `lowercase_sentence_start` check has a **known false-positive** pattern: stylized lowercase chant/payoff_word values (`"glorp!" said Cole. then the chick...`). Review hits manually.
- The repetition-report is intentionally noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.
- Claude has no audio playback, so narrator-quality reviews still require human listening. The audits only cover **text** quality.
