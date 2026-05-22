# Content QA — Repetition report

Generated: 2026-05-22T17:00:35.440Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
N-gram window: 4-7 words
Threshold: 20% of sample (≥ 20 stories)

**Normalization:** picker words and protagonist name are substituted with placeholders (`<food>`, `<name>`, etc.) so structurally identical beats with different picks count as the same repeat.

## Repeated phrases above threshold

93 phrases flagged. Each row shows length-prefix, hit count, and percent of sample.

| Hits | % | N-gram |
|---|---|---|
| 35 | 35.0% | `[4] the <pet> was already` |
| 31 | 31.0% | `[4] said <name> the <pet>` |
| 25 | 25.0% | `[4] <name> looked straight at` |
| 25 | 25.0% | `[4] looked straight at the` |
| 25 | 25.0% | `[4] straight at the <creature>` |
| 25 | 25.0% | `[4] at the <creature> and` |
| 25 | 25.0% | `[4] the <creature> and said` |
| 25 | 25.0% | `[4] <creature> and said one` |
| 25 | 25.0% | `[4] and said one word` |
| 25 | 25.0% | `[4] said one word <freeword>` |
| 25 | 25.0% | `[4] one word <freeword> the` |
| 25 | 25.0% | `[4] word <freeword> the <creature>` |
| 25 | 25.0% | `[4] <freeword> the <creature> confessed` |
| 25 | 25.0% | `[4] the <creature> confessed immediately` |
| 25 | 25.0% | `[4] <creature> confessed immediately to` |
| 25 | 25.0% | `[4] confessed immediately to a` |
| 25 | 25.0% | `[4] immediately to a different` |
| 25 | 25.0% | `[4] to a different crime` |
| 25 | 25.0% | `[4] a different crime <name>` |
| 25 | 25.0% | `[4] different crime <name> noted` |
| 25 | 25.0% | `[4] crime <name> noted it` |
| 25 | 25.0% | `[4] <name> noted it for` |
| 25 | 25.0% | `[4] noted it for later` |
| 25 | 25.0% | `[5] <name> looked straight at the` |
| 25 | 25.0% | `[5] looked straight at the <creature>` |
| 25 | 25.0% | `[5] straight at the <creature> and` |
| 25 | 25.0% | `[5] at the <creature> and said` |
| 25 | 25.0% | `[5] the <creature> and said one` |
| 25 | 25.0% | `[5] <creature> and said one word` |
| 25 | 25.0% | `[5] and said one word <freeword>` |
| 25 | 25.0% | `[5] said one word <freeword> the` |
| 25 | 25.0% | `[5] one word <freeword> the <creature>` |
| 25 | 25.0% | `[5] word <freeword> the <creature> confessed` |
| 25 | 25.0% | `[5] <freeword> the <creature> confessed immediately` |
| 25 | 25.0% | `[5] the <creature> confessed immediately to` |
| 25 | 25.0% | `[5] <creature> confessed immediately to a` |
| 25 | 25.0% | `[5] confessed immediately to a different` |
| 25 | 25.0% | `[5] immediately to a different crime` |
| 25 | 25.0% | `[5] to a different crime <name>` |
| 25 | 25.0% | `[5] a different crime <name> noted` |
| 25 | 25.0% | `[5] different crime <name> noted it` |
| 25 | 25.0% | `[5] crime <name> noted it for` |
| 25 | 25.0% | `[5] <name> noted it for later` |
| 25 | 25.0% | `[6] <name> looked straight at the <creature>` |
| 25 | 25.0% | `[6] looked straight at the <creature> and` |
| 25 | 25.0% | `[6] straight at the <creature> and said` |
| 25 | 25.0% | `[6] at the <creature> and said one` |
| 25 | 25.0% | `[6] the <creature> and said one word` |
| 25 | 25.0% | `[6] <creature> and said one word <freeword>` |
| 25 | 25.0% | `[6] and said one word <freeword> the` |

_(43 more below threshold listing cutoff of 50.)_

## Repeated story endings above threshold

0 endings flagged.

| Hits | % | Ending |
|---|---|---|

## How to use this report

- Phrases at the top of the list are candidate **variant-pool expansions** for the next content build. Add 2-3 alternates to the FLAVOR_CALLBACK / beat-line pool that owns the phrase so random selection no longer collapses to it.
- Endings at the top are candidate **cozy_end / landing beat** variant expansions.
- The repetition report is INTENTIONALLY noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.
