# NoddyTales v0.9.3 · b30 — Human-Golden Story Quality Pass review

**Date:** 2026-05-22
**Sample:** 50–100 stories per audit (BEFORE = b29 main; AFTER = b30 working tree). Comedy/punchline means below taken from 4 runs to factor out variance.

## Headline

| Metric | BEFORE (b29) | AFTER (b30) | Δ |
|---|---|---|---|
| Comedy total | 10.22 / 21 | **11.26 mean** (range 11.06–11.38) | **+1.04** |
| Causality (axis) | 0.66 | **1.06** | **+0.40** |
| Callback (axis) | 0.66 | 0.70 | +0.04 |
| Coherence (axis) | 1.20 | 1.26 | +0.06 |
| Visual joke (axis) | 1.34 | 1.40 | +0.06 |
| **Punchline `changes_scene`** | **47.2%** | **53.3% mean** (range 49.7–57.5%) | **+6.1pp** |
| Punchline `quoted_only` | 15.3% | 11.5% mean | −3.8pp |
| Repetition >20% n-grams | 18 | **11** | **−7** |
| Grammar lint hits | 0 | **0** | hold |
| show_wrong_v3 median sentences | 22 | 22 | hold (b28 gains preserved) |

The causality axis moved the most (+0.40 / 3) — direct result of replacing vague consequence beats with concrete physical events. Comedy total cleared 11.0 with no broad trim pass.

## Human-Golden review — patterns found in the 10 weakest kid+tween stories

Read the BEFORE `random-50` sample by hand. Five recurring patterns made stories feel "told, not shown":

1. **"The rule developed a small visible crack. Nobody could see it, but everyone agreed it was there."** — Pure metaphor. Nothing happens. Picked word is decoration after.
2. **"The X confessed immediately. To a different crime."** — Funny once. Read identically across many lost_snack stories regardless of suspect.
3. **"The X suddenly remembered somewhere else it needed to be."** — Same outcome every time. Reads as the same beat regardless of obstacle.
4. **"Cole located the loophole. It involved [tool] and a very specific reading of the rule. Cole did not point this out."** — Talks about the loophole instead of showing what it does.
5. **"The X tried something with the Y. Cole mentally screenshotted it. Could be evidence later. Probably wouldn't be."** — Meta-comment. No visible event.
6. **"The audience leaned in. Sometimes nonsense lands."** — Authorial commentary. The kid doesn't see "nonsense landing".

Plus a meta-narration leak: **"Plot twist nobody saw coming except maybe the parrot: it was the parrot. The parrot had been the grilled cheese thief the whole time."** — narrator addresses the reader instead of dramatising the reveal.

## What changed

### P1 — Concrete authored consequence beats (kid + tween)

Six payoff/escalation beats rewritten to show specific physical events instead of vague telling:

1. `v3_rl_payoff_chant_rule_cracks` — was "rule developed a small visible crack". Now: clipboard slips, "no" smudges into "yes", mcguffin floats into Cole's hand. Second variant: sign folds itself in half and falls.
2. `v3_rl_payoff_payword_tool_activates` — was "did something briefly impressive that nobody could later describe". Now: tool vibrates and points itself at the mcguffin which rolls 3 feet on its own. Second variant: tool beeps for the first time, paperwork rearranges into a permission slip.
3. `v3_gs_payoff_chant_obstacle_caves` — gained a third variant. Obstacle sneezes hard enough to lose its balance and pivot ninety degrees (specific visible physics).
4. `v3_gs_escalation_tween_screenshot` — gained two variants. Obstacle picks up mcguffin, examines it like an artifact, puts it back UPSIDE DOWN. Or: obstacle tries to do something authoritative and fumbles the mcguffin in slow motion.
5. `v3_ls_payoff_chant_suspect_caves` — gained two variants. Chant causes suspect to freeze mid-bite and drop the snack onto Cole's plate. Or: suspect's hiding spot collapses in three pieces, snack rolls out.
6. `v3_ls_escalation_1` (line 2) — replaced "Plot twist nobody saw coming" meta-narration with: ally burps, intact crumb falls on Cole's shoe, ally tries to look casual.
7. `v3_rl_attempt_tween_tool` — gained a variant. Tool held at a specific angle; the rule says nothing about that angle; the angle is "load-bearing now".
8. `v3_rl_attempt_tween_filed` — rewrote the "located the loophole within seconds" line to actually show what the tool does (held like a permit, the angle is the loophole).
9. `v3_sw_attempt_move_chant` (line 2) — replaced "The audience leaned in. Sometimes nonsense lands." with concrete physical reaction: pillows lean forward, one actually falls over from leaning.

### P2 — Recontextualizing callback beats

Existing callbacks mostly REPEATED the silly word at bedtime. b30 adds four new jokeJob:'callback' landing beats where the word picks up a NEW meaning:

1. `v3_ls_landing_chant_recontext_kid` — Next morning, the chant has become a noun in the household ("'X crackers' said Cole, totally normal. Mom nodded.").
2. `v3_ls_landing_payword_recontext_tween` — Word appears in the group chat with no context. Three people react, two weren't even there. The word has spread beyond Cole.
3. `v3_gs_landing_chant_recontext_kid` — Dad asks how the day went. "It was a [chant] kind of day." The chant is now a unit of measure.
4. `v3_gs_landing_chant_recontext_tween` — Days later, the ally is using the chant as a verb. The word is load-bearing now.

### P3 — Preserved b28 repetition gains

Repetition >20% n-grams: 18 → 11 (improved). The recontextualizing callbacks are short and structurally varied, so they don't re-introduce the patterns b28 attacked.

## Acceptance

- `scripts/qa-current.js` — **25 gates green**
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean
- All 7 content audits run cleanly
- BUILD_NUMBER 29 → 30; APP_VERSION stays v0.9.3; ENGINE_V2_VERSION stays v3.0.3

## Deferred (b31+)

1. callback axis still only +0.04 — the recontextualizing beats fire only when chant or payword is picked AND landing stage. They'll show stronger lift with more authoring (4-6 more recontextualizing variants).
2. Coherence axis still 1.26 — the heuristic rewards story-internal vocabulary consistency. Could be improved by sampling chant/payword in the title.
3. show_wrong_v3 callback variants for big and tween — currently kid+big share landing pool; tween has its own.
4. Tween rule_loophole still has "Bureaucracy is just words. Cole had the right ones." in its core escalation — could be made more visible.
