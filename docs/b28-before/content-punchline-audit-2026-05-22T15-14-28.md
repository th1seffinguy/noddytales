# Content QA — Punchline effectiveness audit

Generated: 2026-05-22T15:14:28.941Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 167 (55.7%)
Usages where the picker word never appeared: 133

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 73 | 43.7% |
| causes_reaction | 133 | 79.6% |
| returns_as_callback | 73 | 43.7% |
| lands_in_final_third | 144 | 86.2% |
| quoted_only | 12 | 7.2% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 15 | 80.0% | 93.3% | 0.0% |
| little | 18 | 100.0% | 100.0% | 0.0% |
| kid | 50 | 44.0% | 64.0% | 8.0% |
| big | 36 | 25.0% | 80.6% | 13.9% |
| tween | 48 | 25.0% | 83.3% | 6.3% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **kid age 7** slot=freeword word="flumpy" (1 hit). Title: _Who Took the Birthday Cake?_
- **kid age 7** slot=freeword2 word="pickle wizard" (1 hit). Title: _Who Took the Birthday Cake?_
- **kid age 7** slot=freeword word="wobble-flop" (1 hit). Title: _The Day the Smoothie Vanished_
- **kid age 7** slot=freeword2 word="mystery jelly" (1 hit). Title: _The Day the Smoothie Vanished_
- **tween age 11** slot=freeword2 word="splat" (1 hit). Title: _Cole and the Energy Drink Mystery_
- **big age 8** slot=freeword2 word="spoon hat" (1 hit). Title: _The Tiny Trophy Broke But Cole Did Not_
- **tween age 13** slot=freeword2 word="crinkle-bonk" (1 hit). Title: _Cole vs the Substitute Coach_
- **tween age 12** slot=freeword2 word="mystery jelly" (1 hit). Title: _Cole and the Suspicious Smoothie Mystery_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
