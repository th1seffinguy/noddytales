# Content QA — Repetition report

Generated: 2026-05-22T15:14:29.038Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
N-gram window: 4-7 words
Threshold: 20% of sample (≥ 20 stories)

**Normalization:** picker words and protagonist name are substituted with placeholders (`<food>`, `<name>`, etc.) so structurally identical beats with different picks count as the same repeat.

## Repeated phrases above threshold

91 phrases flagged. Each row shows length-prefix, hit count, and percent of sample.

| Hits | % | N-gram |
|---|---|---|
| 47 | 47.0% | `[4] at the <place> <name>` |
| 39 | 39.0% | `[4] <freeword> said <name> the` |
| 35 | 35.0% | `[4] <name> felt <mood> about` |
| 27 | 27.0% | `[4] <name> and the <pet>` |
| 26 | 26.0% | `[4] said <name> <freeword> said` |
| 26 | 26.0% | `[4] said the <pet> the` |
| 26 | 26.0% | `[4] in a way that` |
| 26 | 26.0% | `[4] said <name> the <pet>` |
| 25 | 25.0% | `[4] <name> <freeword> said the` |
| 25 | 25.0% | `[4] <freeword> said the <pet>` |
| 25 | 25.0% | `[5] said <name> <freeword> said the` |
| 25 | 25.0% | `[6] <freeword> said <name> <freeword> said the` |
| 25 | 25.0% | `[6] said <name> <freeword> said the <pet>` |
| 25 | 25.0% | `[4] the <pet> applauded the` |
| 22 | 22.0% | `[4] <name> the <creature> heard` |
| 21 | 21.0% | `[4] the <pet> said it` |
| 21 | 21.0% | `[4] <pet> said it back` |
| 21 | 21.0% | `[5] the <pet> said it back` |
| 20 | 20.0% | `[4] like it was a` |
| 20 | 20.0% | `[5] <freeword> said the <pet> the` |
| 20 | 20.0% | `[6] <name> <freeword> said the <pet> the` |
| 20 | 20.0% | `[7] said <name> <freeword> said the <pet> the` |
| 20 | 20.0% | `[4] the <creature> declared the` |
| 20 | 20.0% | `[4] <creature> declared the <food>` |
| 20 | 20.0% | `[4] declared the <food> forbidden` |
| 20 | 20.0% | `[4] the <food> forbidden <name>` |
| 20 | 20.0% | `[4] <food> forbidden <name> felt` |
| 20 | 20.0% | `[4] forbidden <name> felt <mood>` |
| 20 | 20.0% | `[4] felt <mood> about this` |
| 20 | 20.0% | `[4] <mood> about this development` |
| 20 | 20.0% | `[4] about this development possibly` |
| 20 | 20.0% | `[4] this development possibly more` |
| 20 | 20.0% | `[4] development possibly more <mood>` |
| 20 | 20.0% | `[4] possibly more <mood> than` |
| 20 | 20.0% | `[4] more <mood> than the` |
| 20 | 20.0% | `[4] <mood> than the <creature>` |
| 20 | 20.0% | `[4] than the <creature> had` |
| 20 | 20.0% | `[4] the <creature> had bargained` |
| 20 | 20.0% | `[4] <creature> had bargained for` |
| 20 | 20.0% | `[4] had bargained for <name>` |
| 20 | 20.0% | `[5] the <creature> declared the <food>` |
| 20 | 20.0% | `[5] <creature> declared the <food> forbidden` |
| 20 | 20.0% | `[5] declared the <food> forbidden <name>` |
| 20 | 20.0% | `[5] the <food> forbidden <name> felt` |
| 20 | 20.0% | `[5] forbidden <name> felt <mood> about` |
| 20 | 20.0% | `[5] <name> felt <mood> about this` |
| 20 | 20.0% | `[5] felt <mood> about this development` |
| 20 | 20.0% | `[5] <mood> about this development possibly` |
| 20 | 20.0% | `[5] about this development possibly more` |
| 20 | 20.0% | `[5] this development possibly more <mood>` |

_(41 more below threshold listing cutoff of 50.)_

## Repeated story endings above threshold

0 endings flagged.

| Hits | % | Ending |
|---|---|---|

## How to use this report

- Phrases at the top of the list are candidate **variant-pool expansions** for the next content build. Add 2-3 alternates to the FLAVOR_CALLBACK / beat-line pool that owns the phrase so random selection no longer collapses to it.
- Endings at the top are candidate **cozy_end / landing beat** variant expansions.
- The repetition report is INTENTIONALLY noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.
