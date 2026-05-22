# Content QA — Punchline effectiveness audit

Generated: 2026-05-22T14:33:47.764Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 167 (55.7%)
Usages where the picker word never appeared: 133

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 58 | 34.7% |
| causes_reaction | 116 | 69.5% |
| returns_as_callback | 63 | 37.7% |
| lands_in_final_third | 140 | 83.8% |
| quoted_only | 32 | 19.2% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 14 | 57.1% | 71.4% | 0.0% |
| little | 19 | 100.0% | 100.0% | 0.0% |
| kid | 38 | 26.3% | 78.9% | 5.3% |
| big | 54 | 29.6% | 50.0% | 35.2% |
| tween | 42 | 11.9% | 71.4% | 26.2% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **tween age 12** slot=freeword2 word="pickle crown" (1 hit). Title: _The Shiny Rock Broke But Cole Did Not_
- **tween age 13** slot=freeword2 word="ear cheese" (1 hit). Title: _The Apology Balloon Broke But Cole Did Not_
- **big age 9** slot=freeword word="tiny piano" (1 hit). Title: _Cole vs the Indignant Mushroom_
- **big age 9** slot=freeword2 word="bubble wand" (1 hit). Title: _Cole vs the Indignant Mushroom_
- **tween age 12** slot=freeword word="splat" (1 hit). Title: _Cole and the Expired Mascot's Rule_
- **big age 9** slot=freeword2 word="fwoosh" (1 hit). Title: _The Clipboard Broke But Cole Did Not_
- **tween age 11** slot=freeword word="noodle scarf" (1 hit). Title: _Cole and the Panda Take the Stage_
- **big age 8** slot=freeword2 word="soggy genius" (1 hit). Title: _Who Took the Ancient Snack Bar?_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
