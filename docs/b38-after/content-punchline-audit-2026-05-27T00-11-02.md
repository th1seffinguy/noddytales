# Content QA — Punchline effectiveness audit

Generated: 2026-05-27T00:11:02.693Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 174 (58.0%)
Usages where the picker word never appeared: 126

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 87 | 50.0% |
| causes_reaction | 115 | 66.1% |
| returns_as_callback | 83 | 47.7% |
| lands_in_final_third | 145 | 83.3% |
| quoted_only | 23 | 13.2% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 10 | 80.0% | 100.0% | 0.0% |
| little | 16 | 100.0% | 100.0% | 0.0% |
| kid | 42 | 47.6% | 54.8% | 14.3% |
| big | 42 | 50.0% | 66.7% | 14.3% |
| tween | 64 | 34.4% | 59.4% | 17.2% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **tween age 11** slot=freeword2 word="slime puddle" (1 hit). Title: _Cole vs the Cafeteria Oracle_
- **tween age 11** slot=freeword word="cheese hat" (1 hit). Title: _Cole and the Cafeteria Fries Mystery_
- **tween age 11** slot=freeword2 word="pickle juice" (1 hit). Title: _Cole and the Cafeteria Fries Mystery_
- **tween age 13** slot=freeword2 word="soggy sock" (1 hit). Title: _Cole vs the Unreasonably Tall Goose_
- **big age 10** slot=freeword word="moon spoon" (1 hit). Title: _Cole and the Enchanted Pickles Mystery_
- **big age 10** slot=freeword2 word="squonk" (1 hit). Title: _Cole and the Enchanted Pickles Mystery_
- **big age 8** slot=freeword2 word="honk" (1 hit). Title: _The Dramatic Cape Broke But Cole Did Not_
- **big age 9** slot=freeword word="squonk" (1 hit). Title: _How Cole Outsmarted the Confused Dragon_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
