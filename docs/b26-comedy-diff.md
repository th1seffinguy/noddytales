# NoddyTales v0.9.3 · b26 — Story Comedy Mechanics diff report

**Date:** 2026-05-22
**Sample:** 100 stories per side (BEFORE = b25 codebase; AFTER = b26 working tree)
**Tool:** `scripts/content-comedy-mechanics.js --reps 100`

## Headline

**Overall total:** 10.54 → **10.86 / 21** (+0.32). Biggest gains where the user spec named the gap: **callback** + **coherence**.

| Axis (0-3) | BEFORE | AFTER | Δ |
|---|---|---|---|
| premise_clarity | 1.92 | 1.84 | −0.08 |
| selected_word_causality | 0.91 | 0.83 | −0.08 |
| escalation | 1.67 | 1.70 | +0.03 |
| visual_physical_joke | 1.38 | 1.43 | +0.05 |
| **callback_payoff** | **0.46** | **0.63** | **+0.17** |
| age_fit | 2.98 | 2.97 | −0.01 |
| **coherence** | **1.22** | **1.47** | **+0.25** |
| **TOTAL** | **10.54** | **10.86** | **+0.32** |

## Per-tier

| Tier | Total BEFORE | Total AFTER | callback Δ | causality Δ |
|---|---|---|---|---|
| tot | 12.85 | 12.80 | 1.00 → 1.00 | 1.00 → 1.00 |
| little | 11.25 | 10.90 | 1.00 → 1.00 | 1.00 → 1.00 |
| kid | 10.70 | 10.65 | **0.20 → 0.60** (3×) | 1.20 → 0.60 |
| **big** | 9.50 | **11.65 (+2.15)** | **0.10 → 0.50** (5×) | 0.75 → 1.05 |
| tween | 8.40 | 8.25 | 0.00 → 0.05 | 0.60 → 0.50 |

## 5 best improved samples

1. **big age 9 (show_wrong, chant="bonk")** — `"bonk!" yelled Cole, pointing at the broken haunted lunchbox. The haunted lunchbox twitched. Then it did exactly what it had refused to do five minutes ago. Pillows lost it.` → consequence beat fires; prop visibly reacts.
2. **kid age 7 (lost_snack, chant="pickle crown")** — chant appears 3× across the story with the new callback-in-landing beat. Payoff + callback structure.
3. **tween age 12 (lost_snack, chant="grumblepoof")** — tween-specific callback lands in correct ironic register: `"grumblepoof," whispered Cole, for the record. Nobody overruled them.`
4. **big age 10 (rule_loophole, chant="snorble-doo")** — chant literally inverts the rule: `The rule, which had said "no taquitos," now apparently said "yes taquitos." The dinosaur checked the paperwork. The paperwork agreed.`
5. **kid age 6 (show_wrong, chant="zoinks")** — audience picks up chant → callback names the show after it: `That was the show's name now, apparently. Forever.`

## 5 weakest remaining

1. Tween stories without HIGH_IMPACT picks still read flat (tween freetext subtype tagging — b27 candidate)
2. tot/little chant role only renders ~50% (selection bias toward chant-bearing beats — b27)
3. Big stories where consequence beat fires but landing isn't callback variant (weight callback landings higher — b27)
4. Tween blueprints set up goal less concretely than kid/big (extend tween setup beats — b27)
5. show_wrong escalation picks "decoration" variants ~50% of the time (trim decoration variants — b27)

## Acceptance

- `scripts/qa-current.js` — **25 gates green**
- `node --check` on src/content.js + src/engine-v2.js + api/tts.js — clean

## Reproduce

```bash
node scripts/content-comedy-mechanics.js --reps 100 --out docs/content-qa-runs
```
