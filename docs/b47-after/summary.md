# NoddyTales v0.9.3 · b47 AFTER summary — coverage-callback cleanup + cross-story variety

Implements the b46 human-quality assessment plan (Story Test Log Entry 016). Built with a
scout workflow (4 parallel code-mappers), inline implementation, and an adversarial
verification workflow (3 per-tier prose critics + grammar hunter + diff reviewer) whose
findings drove a second fix round before ship.

## Headline wins (BEFORE → AFTER, 300 kid/big/tween stories per run)

| metric | b46 BEFORE | b47 AFTER |
|---|---|---|
| decorative inserts/story (avg) | **1.13** | **0.49** |
| stories with 2+ inserts | 30% | **4%** (3+: 0%) |
| fw2 "somebody, somewhere" throwaways | 38% | **9%** (survivors = kept radiator/closet gags) |
| mood state-announcements | 31% | **0%** |
| smell callback | ~25% rate | **12% rate** (pottyMode keeps 25%) |
| "A different move!" (share of all stories) | 15% | 5% (24% of rule_loophole re-rolls, was ~60%) |
| "Case closed by gravity" | 9% | 5% |
| "confessed… to a different crime" | 8% | 4-6% |
| "Bedtime: earned" | 9% | 3-7% |
| "He filed it anyway" | 7% | 2% |
| tot/little "which was funny" / "hummed along" | 35% / 35% | **0% / 0%** |
| plural "tipped/flipped over by itself" | 6% | **0%** (+ new lint check #10) |
| **little weather pick renders** | **0%** | **100%** |
| "Time for a hug" tot ending | 20% | ~12% (pool 3→5 bedtime, 2→4 anytime) |

## Suite results (post-fix-round)
- `qa-current.js` — **ALL ACCEPTANCE GATES PASSED** incl. new **Section 26** (min-sample guard,
  19 killed-phrase gates 0/497, smell <18% at 12%, 7 signature ceilings 6-24% vs 40%,
  little-weather 0/300 missing) and all b43-b46 gates.
- `content-grammar-lint --reps 2000` — **0 hits on all 10 checks** (new: plural_by_itself).
- punchline changes_scene **44-48%** (3 runs; dipped to 32% mid-build when the first
  payoff_word rewrite removed physical reactions — fixed by giving the word consequences).
- comedy 10.8-11.2/21 (normal band; coherence 1.2-1.3). repetition **9 n-grams / 0 endings**
  (b46: 10-12; b45: 21). golden + random-50 0 nulls.
- Length: tot 18 / little 19 / kid 22-24 / big 24-25 / tween 26. Little +2 vs b46 is the
  substance trade (weather opener + tiny-problem stakes target little's weakest axis,
  substance 2.0, per the b46 assessment).

## What changed (src/engine-v2.js)
1. **payoff_word pool rewritten** — killed 6 "somebody, somewhere" throwaways; new variants tie
   the word to protagonist/ally with a physical reaction (mouthed-back + bow, confirm + spin,
   try-under-breath + hiccup, inside-joke + cheer, filed-away that PAYS OFF in-line, adopt + chant).
2. **mood de-announced** — killed "For three whole seconds", "thing they always do when nobody is
   watching", "Whatever X did next, it was going to be", and the rule_loophole "became, very
   visibly," / "radiated X energy" lines; replaced with visible behavior (knuckles-the-mood-way,
   goes-about-it-the-mood-way, best-mood-voice, least-okay-most-mood "okay").
3. **mcguffin throwaway killed** — "Someone, somewhere, was thinking about X very loudly" →
   "Somewhere nearby, the X waited. Cole had plans."
4. **smell rate 0.25 → 0.12** (pottyMode exempt).
5. **Signature pools widened** — lost_snack color-clue 2→4, suspect-caves payoff 3→5 (one lead
   de-presumed: "aimed one word at the room"), rule_loophole attempt 1→4, rule_loophole landings
   1→3 each, goal_spine parent coda 1→3, tween codas +1 each, show_wrong backstage +1.
6. **Tot/little** — 4 tiny-problem chant beats (roll-away, gone-missing, gust, slip) give the
   middle stakes the kid resolves; filler killed; plural-"by itself" fixed; endings tot 5+4,
   little 5+4.
7. **Weather wired (defect fix)** — slot gains `cap`; 4 weather-aware little setups on role
   `pressure`; maxRoles guarantees the pick always pays off and never fires unpicked.
8. **Verification-round fixes** — "No hands. No wind." → "No strings." (collided with windy
   weather + gust beat); "the whole sky had gone windy" → "gone completely [weather] out";
   bubbles-safe "slow spin"/"tiny jump"; "next morning" landing tagged `mode:'anytime'`
   (was getting a bedtime closer appended after breakfast); "into the dark"/"that night" added
   to all 3 bedtime lexicons (killed a double-closer); "broken broken compass" → "what was left
   of the [prop]"; "A stripe of iridescent" → "One [color] stripe"; "[food] crumbs" → "trail of
   [food] evidence"; ANYTIME_RX + ANYTIME_RX_GATE synced (+next time, +next morning).

## Known issues logged (not fixed here — structural)
- **lost_snack culprit contradiction** (pre-existing, systemic): evidence beats can pin
  character A while the payoff beat has character B produce the snack. Needs story-state
  awareness (evidence↔payoff compatibility). New Defect Log entry.
- **Setting-agnostic inserts** (pre-existing): closet/radiator/window/room lines can fire in
  outdoor settings. Class issue; rate now low (~12% smell, 1-per-story inserts). Logged.
- Tween "Some sign-offs are just for you" coda + "audience was, technically, into it" are the
  next dominance candidates (flagged by critics; below ceilings today, watch via Section 26).
