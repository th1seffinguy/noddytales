# Content QA — Punchline effectiveness audit

Generated: 2026-05-22T01:33:35.527Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 167 (55.7%)
Usages where the picker word never appeared: 133

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 76 | 45.5% |
| causes_reaction | 87 | 52.1% |
| returns_as_callback | 41 | 24.6% |
| lands_in_final_third | 108 | 64.7% |
| quoted_only | 52 | 31.1% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 19 | 100.0% | 100.0% | 0.0% |
| little | 14 | 100.0% | 100.0% | 0.0% |
| kid | 32 | 43.8% | 40.6% | 25.0% |
| big | 48 | 35.4% | 66.7% | 18.8% |
| tween | 54 | 22.2% | 16.7% | 64.8% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **big age 10** slot=freeword2 word="zoinks" (1 hit). Title: _Cole and the Glittering Octopus Try to Sing the Loudest Possible Song_
- **tween age 13** slot=freeword word="wibble-whap" (1 hit). Title: _Who Took the Suspicious Smoothie?_
- **tween age 13** slot=freeword2 word="soggy genius" (1 hit). Title: _Who Took the Suspicious Smoothie?_
- **tween age 13** slot=freeword2 word="stinky bananas" (1 hit). Title: _How Cole Outsmarted the Algorithm Ghost_
- **tween age 13** slot=freeword word="underpants helmet" (1 hit). Title: _The Lost Mitten Broke But Cole Did Not_
- **tween age 13** slot=freeword2 word="ear cheese" (1 hit). Title: _The Lost Mitten Broke But Cole Did Not_
- **big age 10** slot=freeword2 word="moon spoon" (1 hit). Title: _The Day Cole Tried to Share a Real Good Secret_
- **big age 8** slot=freeword2 word="zoinks" (1 hit). Title: _Cole and the Ancient Tortoise Try to Make a Brand New Friend_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
