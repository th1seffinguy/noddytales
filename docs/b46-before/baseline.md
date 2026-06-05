# NoddyTales v0.9.3 · b46 BEFORE baseline (measured at b45, commit 9fb3a17)

Codex QA 2026-06-04: acceptance gates green, b45 de-glue holding, story quality still not clean.
b46 targets: length, endings, tot/little call-response, punchline scene-change dip.

## 1. Length (sentence-count-snapshot 120, V3 — the engine users hit)
| tier | median | p90 | max | proposed cap | over |
|---|---|---|---|---|---|
| tot | 18 | 20 | 23 | 3-4 | ~4-5× |
| little | 17 | 21 | 23 | 5-6 | ~3× |
| kid | 25 | 30 | 32 | 7-8 | ~3× |
| big | 25 | 29 | 33 | 9-11 | ~2.5× |
| tween | 28 | 32 | 37 | 10-12 | ~2.5× |

## 2. Blueprint health (median sentences + HIGH_IMPACT coverage)
| blueprint | median | HIGH_IMPACT | priority |
|---|---|---|---|
| show_wrong_v3 | **27** | 20/30 | P1 length (longest) |
| goal_spine_v3 | **25** | 20/30 | P1 length |
| lost_snack_v3 | **24** | 20/30 | P1 length |
| rule_loophole_v3 | 23 | 20/30 | (not prioritized) |
| tot_wonder_v3 | 18 | 10/30 | tot trim |
| tot_sky_v3 | 18 | 10/30 | tot trim |
| little_food_v3 | 18 | 10/30 | little trim |
| little_quest_v3 | 16 | 10/30 | little trim |

→ The 3 user-prioritized blueprints (show_wrong 27, goal_spine 25, lost_snack 24) ARE the longest. Prioritization confirmed.

## 3. Repetition report (100 random stories) — 21 above-threshold n-grams, 1 repeated ending
Two dominant families:

**(A) Bedtime ending — one closing beat firing for ~every bedtime story:**
- `<name> yawned climbed into bed and pulled` — 24%
- repeated ending `lights out` — 24%

**(B) Tot/little call-response:**
- `said <name> <freeword> said the <pet>` — 25% (top phrase)
- `said the <pet> the` — 24%
- `<name> and the <pet>` — 24%
- `at the <place> <name>` — 24%
- `said <name> the <pet>` — 21%

## 4. Punchline audit — changes_scene 44.3% (THE DIP), quoted_only 15.6%
History: b41 53.5% → b44 48.8% → b44-addendum 49.7% → **b45 44.3%**. b45 de-glue plausibly weakened payoff-adjacent content. Recover toward ~50%.

## 5. Comedy mechanics — total 11.16/21 (causality 0.9, callback 0.7, coherence 1.18)

## Regression gates that MUST stay green (b43-b45)
- article/quantity (one_plural_food, a_plural_noun, a_vowel_mood, a_vowel_creature)
- hyphen_ly_artifact
- apostrophe Speak-highlight parity (Section 21)
- Section 24 killed-phrase gates (color/move/mood de-glue) + ambient color <55%
