# Content QA — Repetition report

Generated: 2026-05-22T17:06:31.383Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
N-gram window: 4-7 words
Threshold: 20% of sample (≥ 20 stories)

**Normalization:** picker words and protagonist name are substituted with placeholders (`<food>`, `<name>`, etc.) so structurally identical beats with different picks count as the same repeat.

## Repeated phrases above threshold

11 phrases flagged. Each row shows length-prefix, hit count, and percent of sample.

| Hits | % | N-gram |
|---|---|---|
| 29 | 29.0% | `[4] said <name> <freeword> said` |
| 29 | 29.0% | `[4] <name> <freeword> said the` |
| 29 | 29.0% | `[4] <freeword> said the <pet>` |
| 29 | 29.0% | `[5] said <name> <freeword> said the` |
| 29 | 29.0% | `[6] <freeword> said <name> <freeword> said the` |
| 29 | 29.0% | `[6] said <name> <freeword> said the <pet>` |
| 27 | 27.0% | `[4] said <name> the <pet>` |
| 23 | 23.0% | `[4] the <creature> had not` |
| 23 | 23.0% | `[4] <name> and the <pet>` |
| 22 | 22.0% | `[4] said the <pet> the` |
| 20 | 20.0% | `[4] at the <place> <name>` |

## Repeated story endings above threshold

0 endings flagged.

| Hits | % | Ending |
|---|---|---|

## How to use this report

- Phrases at the top of the list are candidate **variant-pool expansions** for the next content build. Add 2-3 alternates to the FLAVOR_CALLBACK / beat-line pool that owns the phrase so random selection no longer collapses to it.
- Endings at the top are candidate **cozy_end / landing beat** variant expansions.
- The repetition report is INTENTIONALLY noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.
