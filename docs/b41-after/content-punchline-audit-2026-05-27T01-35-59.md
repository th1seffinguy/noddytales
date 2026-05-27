# Content QA — Punchline effectiveness audit

Generated: 2026-05-27T01:35:59.859Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 168 (56.0%)
Usages where the picker word never appeared: 132

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 83 | 49.4% |
| causes_reaction | 116 | 69.0% |
| returns_as_callback | 81 | 48.2% |
| lands_in_final_third | 142 | 84.5% |
| quoted_only | 27 | 16.1% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 15 | 73.3% | 100.0% | 0.0% |
| little | 17 | 100.0% | 100.0% | 0.0% |
| kid | 48 | 37.5% | 70.8% | 16.7% |
| big | 50 | 56.0% | 54.0% | 16.0% |
| tween | 38 | 23.7% | 60.5% | 28.9% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **tween age 11** slot=freeword2 word="kabloom" (1 hit). Title: _How Cole Tried to Plan a Surprise Party_
- **big age 10** slot=freeword2 word="splat" (1 hit). Title: _Who Took the Emergency Burrito?_
- **tween age 13** slot=freeword2 word="flumpy" (1 hit). Title: _Cole's Big Show_
- **kid age 6** slot=freeword word="sproing" (1 hit). Title: _Cole vs the Ninja_
- **big age 8** slot=freeword word="cheese hat" (1 hit). Title: _The Day Cole Tried to Win the Official Tiny Trophy_
- **tween age 13** slot=freeword2 word="rubber duck" (1 hit). Title: _Who Took the Gas Station Nachos?_
- **tween age 12** slot=freeword2 word="magnet shoe" (1 hit). Title: _The Loophole at the Late Bus_
- **big age 8** slot=freeword word="splat" (1 hit). Title: _The Day Cole Tried to Tame the Noisy Creature_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
