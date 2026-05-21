# NoddyTales v0.9.3 · b18 — Sentence-count diff report

**Date:** 2026-05-21
**Engine:** v3 default (v2 silent fallback)
**Sample size:** 120 stories per tier per engine
**Defect:** "Stories too long globally — early tier most severe, sentence caps not enforced."

## Scope of this pass

b18 is the **first scoped pass** at story-length / content-density control.

- **Strategy:** beat-line trimming of trailing flourishes. **No engine
  rewrite, no QA gate changes, no per-tier paragraph-count overrides.**
- **Lines modified:** 13 tot v3 beats + 13 little v3 beats + 4 kid v3 beats =
  30 line edits total.
- **What was protected:**
  - All `{protagonist.name}` / `{ally.text}` / `{wonder_object.text}` /
    `{setting.text}` / `{mcguffin.text}` etc. tokens stayed intact.
  - All call-response and parallel-structure beats (the cozy patterns) kept
    their full repetition.
  - Punchline beats (the joke landings) kept their final-sentence flourishes.
  - Sentences carrying user-picked words / orange highlights were never cut.
- **What was trimmed:** token-free narrator flourishes like "Big day!",
  "Yay!", "Treasure confirmed.", "Goodnight.", "Case closed." — short
  closers that didn't carry plot, picks, or character voice.

## Before / after (V3 — the default engine for all ages)

| tier   | before median | after median | Δ median | before p90 | after p90 | Δ p90 | defect cap |
|--------|---------------|--------------|----------|------------|-----------|-------|------------|
| tot    | 19            | **15**       | **−4**   | 20         | 17        | −3    | 3-4        |
| little | 18            | **14**       | **−4**   | 19         | 15        | −4    | 5-6        |
| kid    | 27            | **26**       | −1       | 31         | 32        | +1    | 7-8        |
| big    | 27            | **26**       | −1       | 32         | 31        | −1    | 9-11       |
| tween  | 26            | 26           | 0        | 31         | 32        | +1    | 10-12      |

(Tot p90 17 includes the `tot_repeat_call_response` + `tot_end_bed_3` beats
which intentionally keep their full repetition — those reads come out closer
to 5 sentences/paragraph. Median 15 is the typical case.)

## Before / after (V2 — the silent fallback engine)

| tier   | before median | after median | Δ median |
|--------|---------------|--------------|----------|
| tot    | 22            | 22           | 0        |
| little | 21            | 21           | 0        |
| kid    | 29            | 28           | −1       |
| big    | 29            | 29           | 0        |
| tween  | 29            | 29           | 0        |

V2 is unchanged because b18 only edited v3 beat lines. V2 fallback paths
weren't touched (and v3 is the default for every age, so v2 length doesn't
affect real users).

## Per-tier acceptance (v3, ages 2-7 priority)

- **tot (ages 2-3)** — Median 19 → **15**. Still 4x over the 3-4 defect cap,
  but the shape now matches "much shorter and repeatable" from the b18
  brief. Going lower requires either dropping a paragraph (would break
  Section 3b 4-paragraph gate) or trimming the repetition-as-pattern beats,
  which is exactly the cozy texture we want to preserve at this age.
- **little (ages 4-5)** — Median 18 → **14**. ~2.5x over the 5-6 cap. Same
  trade-off as tot: structure preserved (4 paragraphs / mini-arc) while the
  per-paragraph density dropped meaningfully.
- **kid (ages 6-7)** — Median 27 → **26**. Modest improvement. Kid blueprints
  ship with 6 stages (setup → problem → attempt → escalation → payoff →
  landing) and each beat line is token-dense, so safe trim candidates were
  rare. The clear win here would be a structural change (kid drops the
  `attempt` stage to 5 paragraphs while big/tween keep 6), which requires
  a QA gate update — **queued for b19**.

## Queued for b19+

- Structural kid trim: per-tier paragraph-count override so kid uses 5
  stages while big/tween keep 6. Requires updating Section 3's
  6-paragraph-arc gate to be tier-aware.
- Big + tween line-density pass once the kid structural pattern is proven.
- Optional: hard sentence cap as a QA gate (defect proposal) once tiers are
  inside their respective targets.

## Reproduce

```
node scripts/sentence-count-snapshot.js 120
```

Outputs the V3 + V2 × 5-tier matrix shown above.
