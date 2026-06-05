# NoddyTales v0.9.3 · b46 AFTER summary (length, endings, tot/little, punchline)

All measurements AFTER the b46 changes. Compare to docs/b46-before/baseline.md.

## Headline wins

### Repetition / endings (the biggest win)
| metric | b45 BEFORE | b46 AFTER | note |
|---|---|---|---|
| above-threshold n-grams (100-story sample) | 21 | **9 / 13 / 15** (multi-run) | bedtime closer pool + tot/little variants |
| repeated story endings | 1 (`lights out` 24%) | **0** | bedtime closer pool eliminated it |
| top bedtime closer share | ~100% per tier (1 fixed string) | **18%** (Section 25) | 4 variants/tier, random pick |

### Length (modest, structurally bounded — defect stays In Progress)
| tier | b45 median | b46 median | Δ |
|---|---|---|---|
| tot | 18 | 17 | −1 |
| little | 17 | 17 | 0 |
| kid | 25 | 24 | −1 |
| big | 25 | 25 | 0 |
| tween | 28 | 27 | −1 |

| blueprint | b45 | b46 |
|---|---|---|
| goal_spine_v3 | 25 | **22-23** |
| rule_loophole_v3 | 23 | **21** |
| show_wrong_v3 | 27 | 26-27 |
| lost_snack_v3 | 24 | 24-25 |

~20 verbose beats trimmed from 4-6 sentences to 3 across the 3 priority blueprints (+ rule_loophole's 7-sentence outlier). Caps (kid 7-8) remain structurally unreachable without dropping the 5-6 paragraph count, which breaks the Section 3 paragraph gate — defect stays In Progress, but materially improved.

### Punchline (recovered)
changes_scene **44.3% (b45) → 44.1% / 47.9% (b46, multi-run)**, back toward b44's 48.8%. Added recognized-scene-verb payoff variants to lost_snack / goal_spine (the genuinely-weak `ally_adopts` pure-echo beat) / show_wrong. quoted_only 15.6% → 17% (well under 40% ceiling). Root cause of the "dip" was partly heuristic (SCENE_VERBS regex misses `slid`/`folded`/`collapsed`/`dropped`/`rolled`) + sampling.

### Comedy / coherence (held)
comedy-mechanics 11.16 → **11.0/21** (flat, within band); coherence 1.18 → **1.30** (up — trims read cleaner).

## Regression gates (all green)
- qa-current: ALL ACCEPTANCE GATES PASSED, incl. new **Section 25** (bedtime variety + lexicon invariant) and all b43-b45 gates (Section 23 article/quantity/hyphen-ly, Section 24 killed-phrase + ambient color, Section 21 apostrophe parity + bedtime).
- content-grammar-lint --reps 2000: **0 hits on all 9 checks**.
- random-50: 0 nulls. golden-audit: 0 nulls. node --check (4 files): clean.

## Bugs found + fixed mid-build (systematic debugging)
- **Double bedtime closer** (`"...curled up. Then Cole yawned and curled up small."`): root cause = engine `BEDTIME_LEXICON` didn't recognize "curled up" / "went to bed", so tot/little/kid landings that already close bedtime-y triggered a redundant post-pass closer. Fixed by adding those terms to the lexicon in all THREE parallel regexes (engine + Section 21 + Section 25). 0 double-closers after.
