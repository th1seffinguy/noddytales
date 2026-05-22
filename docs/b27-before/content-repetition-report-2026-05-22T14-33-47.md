# Content QA — Repetition report

Generated: 2026-05-22T14:33:47.862Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
N-gram window: 4-7 words
Threshold: 20% of sample (≥ 20 stories)

**Normalization:** picker words and protagonist name are substituted with placeholders (`<food>`, `<name>`, etc.) so structurally identical beats with different picks count as the same repeat.

## Repeated phrases above threshold

15 phrases flagged. Each row shows length-prefix, hit count, and percent of sample.

| Hits | % | N-gram |
|---|---|---|
| 43 | 43.0% | `[4] at the <place> <name>` |
| 36 | 36.0% | `[4] <name> felt <mood> about` |
| 30 | 30.0% | `[4] said <name> the <pet>` |
| 28 | 28.0% | `[4] <name> and the <pet>` |
| 25 | 25.0% | `[4] in a way that` |
| 23 | 23.0% | `[4] <freeword> said <name> the` |
| 22 | 22.0% | `[4] <freeword> said the <pet>` |
| 22 | 22.0% | `[4] the <pet> said it` |
| 22 | 22.0% | `[4] <pet> said it back` |
| 22 | 22.0% | `[5] the <pet> said it back` |
| 22 | 22.0% | `[4] one more time just` |
| 22 | 22.0% | `[4] more time just to` |
| 22 | 22.0% | `[5] one more time just to` |
| 21 | 21.0% | `[4] the <pet> was already` |
| 21 | 21.0% | `[4] said the <pet> the` |

## Repeated story endings above threshold

0 endings flagged.

| Hits | % | Ending |
|---|---|---|

## How to use this report

- Phrases at the top of the list are candidate **variant-pool expansions** for the next content build. Add 2-3 alternates to the FLAVOR_CALLBACK / beat-line pool that owns the phrase so random selection no longer collapses to it.
- Endings at the top are candidate **cozy_end / landing beat** variant expansions.
- The repetition report is INTENTIONALLY noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.
