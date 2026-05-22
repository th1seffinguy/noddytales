# Content QA — Repetition report

Generated: 2026-05-22T01:32:26.957Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
N-gram window: 4-7 words
Threshold: 20% of sample (≥ 20 stories)

**Normalization:** picker words and protagonist name are substituted with placeholders (`<food>`, `<name>`, etc.) so structurally identical beats with different picks count as the same repeat.

## Repeated phrases above threshold

61 phrases flagged. Each row shows length-prefix, hit count, and percent of sample.

| Hits | % | N-gram |
|---|---|---|
| 44 | 44.0% | `[4] at the <place> <name>` |
| 43 | 43.0% | `[4] <freeword> said <name> the` |
| 35 | 35.0% | `[4] said <name> the <pet>` |
| 34 | 34.0% | `[4] <name> felt <mood> about` |
| 29 | 29.0% | `[4] <name> the <pet> said` |
| 29 | 29.0% | `[5] said <name> the <pet> said` |
| 29 | 29.0% | `[6] <freeword> said <name> the <pet> said` |
| 27 | 27.0% | `[4] said <name> <freeword> said` |
| 27 | 27.0% | `[4] <name> <freeword> said the` |
| 27 | 27.0% | `[4] <freeword> said the <pet>` |
| 27 | 27.0% | `[5] said <name> <freeword> said the` |
| 27 | 27.0% | `[6] <freeword> said <name> <freeword> said the` |
| 27 | 27.0% | `[6] said <name> <freeword> said the <pet>` |
| 25 | 25.0% | `[4] in a way that` |
| 25 | 25.0% | `[4] <name> and the <pet>` |
| 21 | 21.0% | `[4] the <pet> said <freeword>` |
| 21 | 21.0% | `[4] <pet> said <freeword> back` |
| 21 | 21.0% | `[4] said <freeword> back then` |
| 21 | 21.0% | `[4] <freeword> back then the` |
| 21 | 21.0% | `[4] sneezed the <pet> said` |
| 21 | 21.0% | `[4] the <pet> said bless` |
| 21 | 21.0% | `[4] <pet> said bless you` |
| 21 | 21.0% | `[4] said bless you to` |
| 21 | 21.0% | `[4] bless you to the` |
| 21 | 21.0% | `[4] said the <pet> then` |
| 21 | 21.0% | `[4] the <pet> then the` |
| 21 | 21.0% | `[4] wiggled just a little` |
| 21 | 21.0% | `[4] just a little everyone` |
| 21 | 21.0% | `[4] a little everyone saw` |
| 21 | 21.0% | `[4] little everyone saw it` |
| 21 | 21.0% | `[5] the <pet> said <freeword> back` |
| 21 | 21.0% | `[5] <pet> said <freeword> back then` |
| 21 | 21.0% | `[5] said <freeword> back then the` |
| 21 | 21.0% | `[5] sneezed the <pet> said bless` |
| 21 | 21.0% | `[5] the <pet> said bless you` |
| 21 | 21.0% | `[5] <pet> said bless you to` |
| 21 | 21.0% | `[5] said bless you to the` |
| 21 | 21.0% | `[5] <freeword> said the <pet> then` |
| 21 | 21.0% | `[5] said the <pet> then the` |
| 21 | 21.0% | `[5] wiggled just a little everyone` |
| 21 | 21.0% | `[5] just a little everyone saw` |
| 21 | 21.0% | `[5] a little everyone saw it` |
| 21 | 21.0% | `[6] said <name> the <pet> said <freeword>` |
| 21 | 21.0% | `[6] <name> the <pet> said <freeword> back` |
| 21 | 21.0% | `[6] the <pet> said <freeword> back then` |
| 21 | 21.0% | `[6] <pet> said <freeword> back then the` |
| 21 | 21.0% | `[6] sneezed the <pet> said bless you` |
| 21 | 21.0% | `[6] the <pet> said bless you to` |
| 21 | 21.0% | `[6] <pet> said bless you to the` |
| 21 | 21.0% | `[6] <name> <freeword> said the <pet> then` |

_(11 more below threshold listing cutoff of 50.)_

## Repeated story endings above threshold

0 endings flagged.

| Hits | % | Ending |
|---|---|---|

## How to use this report

- Phrases at the top of the list are candidate **variant-pool expansions** for the next content build. Add 2-3 alternates to the FLAVOR_CALLBACK / beat-line pool that owns the phrase so random selection no longer collapses to it.
- Endings at the top are candidate **cozy_end / landing beat** variant expansions.
- The repetition report is INTENTIONALLY noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.
