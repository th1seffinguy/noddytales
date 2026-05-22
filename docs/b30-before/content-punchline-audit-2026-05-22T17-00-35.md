# Content QA — Punchline effectiveness audit

Generated: 2026-05-22T17:00:35.349Z
Sample: 100 V3 stories (random ages 2-13; 0 nulls)
Total HIGH_IMPACT pickedWord usages tracked: 300
Usages where the picked word actually rendered in the story: 163 (54.3%)
Usages where the picker word never appeared: 137

## Classification breakdown (per rendered usage)

_A single usage can carry multiple tags. e.g. `changes_scene` + `lands_in_final_third`._

| Tag | Count | % of rendered usages |
|---|---|---|
| changes_scene | 77 | 47.2% |
| causes_reaction | 105 | 64.4% |
| returns_as_callback | 74 | 45.4% |
| lands_in_final_third | 138 | 84.7% |
| quoted_only | 25 | 15.3% |

## What "good" looks like

- **`changes_scene` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.
- **`quoted_only` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.
- **`returns_as_callback` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.
- **`lands_in_final_third` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.

## Per-tier breakdown

| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |
|---|---|---|---|---|
| tot | 18 | 88.9% | 94.4% | 0.0% |
| little | 19 | 100.0% | 100.0% | 0.0% |
| kid | 26 | 38.5% | 50.0% | 11.5% |
| big | 48 | 31.3% | 58.3% | 22.9% |
| tween | 52 | 32.7% | 53.8% | 21.2% |

## Sample quoted_only stories (candidates for next-build content review)

_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._

- **tween age 12** slot=freeword2 word="crusty pretzel" (1 hit). Title: _Cole vs the Cryptid_
- **big age 10** slot=freeword word="kabloom" (1 hit). Title: _Cole vs the Bewildered Sphinx_
- **big age 10** slot=freeword2 word="bubble wand" (1 hit). Title: _Cole vs the Bewildered Sphinx_
- **tween age 13** slot=freeword word="splat" (1 hit). Title: _Cole and the Capybara Take the Stage_
- **big age 9** slot=freeword2 word="bonk" (1 hit). Title: _Cole vs the Concerned Librarian_
- **tween age 13** slot=freeword2 word="snorble-doo" (1 hit). Title: _Cole and the Cold Pizza Mystery_
- **kid age 7** slot=freeword2 word="flumpy" (1 hit). Title: _Cole and the Llama Take the Stage_
- **tween age 11** slot=freeword2 word="spoon hat" (1 hit). Title: _Cole's Big Show_

## Notes

- Classification is HEURISTIC. Some `changes_scene` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.
- The `SCENE_VERBS` regex is tunable in this file — add verbs as the comedy-role contract evolves.
