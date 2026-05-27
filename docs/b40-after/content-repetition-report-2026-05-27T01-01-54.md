# Content QA — Repetition report

Generated: 2026-05-27T01:01:54.377Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
N-gram window: 4-7 words
Threshold: 20% of sample (≥ 20 stories)

**Normalization:** picker words and protagonist name are substituted with placeholders (`<food>`, `<name>`, etc.) so structurally identical beats with different picks count as the same repeat.

## Repeated phrases above threshold

14 phrases flagged. Each row shows length-prefix, hit count, and percent of sample.

| Hits | % | N-gram |
|---|---|---|
| 34 | 34.0% | `[4] said <name> <freeword> said` |
| 33 | 33.0% | `[4] said <name> the <pet>` |
| 33 | 33.0% | `[4] <name> <freeword> said the` |
| 33 | 33.0% | `[4] <freeword> said the <pet>` |
| 33 | 33.0% | `[5] said <name> <freeword> said the` |
| 33 | 33.0% | `[6] <freeword> said <name> <freeword> said the` |
| 33 | 33.0% | `[6] said <name> <freeword> said the <pet>` |
| 27 | 27.0% | `[4] <name> and the <pet>` |
| 27 | 27.0% | `[4] said the <pet> the` |
| 25 | 25.0% | `[4] the <pet> was already` |
| 20 | 20.0% | `[4] the <pet> the <food>` |
| 20 | 20.0% | `[5] <freeword> said the <pet> the` |
| 20 | 20.0% | `[6] <name> <freeword> said the <pet> the` |
| 20 | 20.0% | `[7] said <name> <freeword> said the <pet> the` |

## Repeated story endings above threshold

0 endings flagged.

| Hits | % | Ending |
|---|---|---|

## How to use this report

- Phrases at the top of the list are candidate **variant-pool expansions** for the next content build. Add 2-3 alternates to the FLAVOR_CALLBACK / beat-line pool that owns the phrase so random selection no longer collapses to it.
- Endings at the top are candidate **cozy_end / landing beat** variant expansions.
- The repetition report is INTENTIONALLY noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.
