# Content QA — Punchline effectiveness audit

Generated: 2026-05-27T00:33:12.319Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 168 (56.0%)
Usages where the picker word never appeared: 132

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 87 | 51.8% |
| causes_reaction | 107 | 63.7% |
| returns_as_callback | 82 | 48.8% |
| lands_in_final_third | 142 | 84.5% |
| quoted_only | 32 | 19.0% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 14 | 71.4% | 92.9% | 0.0% |
| little | 18 | 100.0% | 100.0% | 0.0% |
| kid | 42 | 40.5% | 45.2% | 26.2% |
| big | 48 | 50.0% | 64.6% | 25.0% |
| tween | 46 | 39.1% | 56.5% | 19.6% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **kid age 7** slot=freeword2 word="gloop" (1 hit). Title: _Cole and the Panda Take the Stage_
- **big age 10** slot=freeword2 word="sproing" (1 hit). Title: _How Cole Outsmarted the Overqualified Fish_
- **tween age 11** slot=freeword word="damp toast" (1 hit). Title: _How Cole Outsmarted the Gremlin_
- **kid age 7** slot=freeword2 word="underpants helmet" (1 hit). Title: _Cole vs the Rule_
- **kid age 6** slot=freeword2 word="damp toast" (1 hit). Title: _Cole and the Parrot Try to Share a Real Good Secret_
- **big age 9** slot=freeword2 word="glorp" (1 hit). Title: _Who Took the Forbidden Waffles?_
- **kid age 6** slot=freeword2 word="soggy sock" (1 hit). Title: _Cole vs the Wizard_
- **kid age 7** slot=freeword word="paper crown" (1 hit). Title: _The Loophole at the Planetarium_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
