# Content QA — Punchline effectiveness audit

Generated: 2026-05-22T14:40:57.940Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 163 (54.3%)
Usages where the picker word never appeared: 137

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 62 | 38.0% |
| causes_reaction | 119 | 73.0% |
| returns_as_callback | 68 | 41.7% |
| lands_in_final_third | 143 | 87.7% |
| quoted_only | 22 | 13.5% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 18 | 77.8% | 94.4% | 0.0% |
| little | 19 | 100.0% | 100.0% | 0.0% |
| kid | 36 | 27.8% | 61.1% | 13.9% |
| big | 48 | 25.0% | 54.2% | 27.1% |
| tween | 42 | 16.7% | 83.3% | 9.5% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **big age 9** slot=freeword2 word="stinky bananas" (1 hit). Title: _Cole's Big Show_
- **big age 10** slot=freeword2 word="soggy genius" (1 hit). Title: _Cole and the Exasperated Flamingo Take the Stage_
- **kid age 7** slot=freeword2 word="magnet shoe" (1 hit). Title: _The Loophole at the School Cafeteria_
- **kid age 7** slot=freeword2 word="spoon hat" (1 hit). Title: _Cole and the Backpack Troll's Rule_
- **tween age 11** slot=freeword2 word="underpants helmet" (1 hit). Title: _The Backpack Zipper Broke But Cole Did Not_
- **big age 10** slot=freeword word="pickle juice" (1 hit). Title: _Who Took the Forbidden Waffles?_
- **big age 10** slot=freeword2 word="wobble-flop" (1 hit). Title: _Who Took the Forbidden Waffles?_
- **kid age 7** slot=freeword word="wibble-whap" (1 hit). Title: _Cole and the Pretzels Mystery_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
