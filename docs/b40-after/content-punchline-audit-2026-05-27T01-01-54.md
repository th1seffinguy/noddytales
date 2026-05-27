# Content QA — Punchline effectiveness audit

Generated: 2026-05-27T01:01:54.295Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 166 (55.3%)
Usages where the picker word never appeared: 134

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 78 | 47.0% |
| causes_reaction | 118 | 71.1% |
| returns_as_callback | 77 | 46.4% |
| lands_in_final_third | 145 | 87.3% |
| quoted_only | 26 | 15.7% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 20 | 95.0% | 100.0% | 0.0% |
| little | 14 | 100.0% | 100.0% | 0.0% |
| kid | 30 | 36.7% | 56.7% | 23.3% |
| big | 56 | 46.4% | 69.6% | 10.7% |
| tween | 46 | 17.4% | 60.9% | 28.3% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **tween age 12** slot=freeword2 word="soggy sock" (1 hit). Title: _The Day the Gas Station Nachos Vanished_
- **big age 8** slot=freeword2 word="bonk" (1 hit). Title: _The Day the Haunted Tea Vanished_
- **kid age 7** slot=freeword2 word="pickle wizard" (1 hit). Title: _The Day Cole Tried to Cross the Wobbly Bridge_
- **kid age 7** slot=freeword2 word="booger cloud" (1 hit). Title: _The Apology Balloon Broke But Cole Did Not_
- **kid age 7** slot=freeword word="tiny piano" (1 hit). Title: _Cole and the Hot Dogs Mystery_
- **kid age 7** slot=freeword2 word="crusty pretzel" (1 hit). Title: _Cole and the Hot Dogs Mystery_
- **tween age 11** slot=freeword word="honk" (1 hit). Title: _The Day the Emergency Ramen Vanished_
- **tween age 11** slot=freeword2 word="wibble-whap" (1 hit). Title: _The Day the Emergency Ramen Vanished_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
