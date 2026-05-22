# Content QA — Punchline effectiveness audit

Generated: 2026-05-22T17:06:31.291Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 159 (53.0%)
Usages where the picker word never appeared: 141

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 84 | 52.8% |
| causes_reaction | 115 | 72.3% |
| returns_as_callback | 75 | 47.2% |
| lands_in_final_third | 142 | 89.3% |
| quoted_only | 17 | 10.7% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 24 | 75.0% | 100.0% | 0.0% |
| little | 17 | 100.0% | 100.0% | 0.0% |
| kid | 24 | 62.5% | 45.8% | 16.7% |
| big | 46 | 50.0% | 67.4% | 10.9% |
| tween | 48 | 22.9% | 66.7% | 16.7% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **kid age 7** slot=freeword2 word="stinky bananas" (1 hit). Title: _Cole vs the Tiny Wizard_
- **tween age 13** slot=freeword word="squonk" (1 hit). Title: _The Day Cole Saved the Show_
- **tween age 13** slot=freeword2 word="bonkledink" (1 hit). Title: _Cole's Big Show_
- **big age 9** slot=freeword word="zoinks" (1 hit). Title: _Who Took the Haunted Tea?_
- **big age 9** slot=freeword2 word="sneezy sandwich" (1 hit). Title: _Who Took the Haunted Tea?_
- **tween age 13** slot=freeword word="cheese hat" (1 hit). Title: _The Day the Third Coffee Vanished_
- **tween age 13** slot=freeword2 word="crusty pretzel" (1 hit). Title: _The Day the Third Coffee Vanished_
- **big age 8** slot=freeword word="slime puddle" (1 hit). Title: _The Day the Ancient Snack Bar Vanished_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
