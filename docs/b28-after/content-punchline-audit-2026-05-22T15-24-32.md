# Content QA — Punchline effectiveness audit

Generated: 2026-05-22T15:24:32.435Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 163 (54.3%)
Usages where the picker word never appeared: 137

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 81 | 49.7% |
| causes_reaction | 108 | 66.3% |
| returns_as_callback | 75 | 46.0% |
| lands_in_final_third | 142 | 87.1% |
| quoted_only | 18 | 11.0% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 12 | 83.3% | 91.7% | 0.0% |
| little | 25 | 100.0% | 100.0% | 0.0% |
| kid | 42 | 35.7% | 52.4% | 16.7% |
| big | 26 | 50.0% | 50.0% | 15.4% |
| tween | 58 | 31.0% | 63.8% | 12.1% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **big age 9** slot=freeword word="sproing" (1 hit). Title: _How Cole Outsmarted the Overqualified Fish_
- **tween age 13** slot=freeword2 word="paper crown" (1 hit). Title: _How Cole Outsmarted the Sentient Vending Machine_
- **tween age 13** slot=freeword2 word="sprongulous" (1 hit). Title: _Cole and the Expired Mascot's Rule_
- **big age 10** slot=freeword word="sneezy-pants" (1 hit). Title: _Who Took the Suspicious Fruit Salad?_
- **big age 10** slot=freeword2 word="snorble-doo" (1 hit). Title: _Who Took the Suspicious Fruit Salad?_
- **tween age 11** slot=freeword2 word="wobble-flop" (1 hit). Title: _Who Took the Gas Station Sushi?_
- **big age 10** slot=freeword word="burp bubble" (1 hit). Title: _Cole and the Grumbling Gargoyle's Rule_
- **kid age 6** slot=freeword word="snorble-doo" (1 hit). Title: _The Day the Ramen Vanished_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
