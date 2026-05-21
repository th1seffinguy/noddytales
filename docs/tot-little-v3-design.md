# tot/little-v3 Role-Based Blueprint Contract — Design Document

**Status:** Design only (drafted v2.9.0, 2026-05-21). No code lands until v3.0.0.
**Predecessor:** `docs/v3-role-blueprints.md` — kid/big/tween v3 role-based engine. The 4 v3 blueprints (`lost_snack_v3`, `goal_spine_v3`, `show_wrong_v3`, `rule_loophole_v3`) ship for ages 6-13 and become the default in v2.9.0.
**Goal:** define a simplified v3 contract for ages 2-5 so v3.0.0 can ship a unified role-based engine across all 12 ages.

---

## Why tot/little needs its own v3 contract

The kid/big/tween v3 engine uses:

- 11 roles (protagonist / ally / obstacle / mcguffin / setting / visual_signature / mood_throughline / signature_action / pressure / chant / payoff_word)
- 4 stages × 6 paragraphs (setup → problem → attempt → escalation → payoff → landing)
- 86 beats across 4 blueprints
- Picker rounds: pet / food / place / creature / color / move / mood / freeword / freeword2

This is too much structure for ages 2-5. Real tot/little stories want:

- Short sentences (3-7 words)
- Heavy repetition with restraint
- One memorable joke per story
- 4 paragraphs total, not 6
- Cole as the obvious driver (the v2.8.0 kid-agency pass enforced this at 0.95 ratio)
- No irony, no plot twists, no "tween voice"
- Picker rounds vary by tier:
  - **tot** (2-3): pet / food / place / color / move / sky → no creature / no mood / no freeword2
  - **little** (4-5): pet / food / place / creature / color / move / weather → no mood / freeword2 optional

Forcing the kid/big/tween role contract onto tot/little stories would either over-engineer the output (6-paragraph tot stories with mood_throughline beats are wrong for a 2-year-old) or fail validation (tot has no creature, no mood, no freeword2 — most kid/big roles can't be assigned).

The answer: **a smaller role contract designed specifically for tot/little.**

---

## The 3-role contract

Every tot/little-v3 blueprint has exactly three roles. No exceptions.

| Role | What it does | Source picker slot |
|---|---|---|
| `protagonist` | Subject of every action verb. Drives all 4 paragraphs. | Always = kid |
| `ally` | Co-presence; usually called by name, joins Cole's action, takes the cozy_end hug | tot/little: companion (pet) |
| `wonder_object` | The thing the kid notices / picks up / shares / chases. The story's playful focus. | tot: sky OR food (random per blueprint) <br> little: food OR object (random per blueprint) |

That's it. No obstacle (tot stories don't have antagonists — even visiting creatures are friendly). No mcguffin separate from wonder_object. No mood_throughline. No chant. No payoff_word.

### Optional flavor roles (additive, never structural)

These can appear in a beat line via the v3 flavor-callback layer, but no stage requires them:

- `visual_signature` — color pick if chosen, else fallback ("a little sparkly")
- `signature_action` — move pick if chosen, else fallback ("hopped over")
- `wonder_sky` — sky pick if chosen (tot-specific; replaces visual_signature when sky is the chosen wonder)
- `pressure` — weather pick if chosen (little-specific)

The flavor-callback rules from v2.6.x kid/big/tween v3 carry over: if a picked word isn't surfaced by the chosen stage beats, append a one-sentence flavor callback in the middle paragraph.

---

## The 3-stage arc (4 paragraphs)

| Stage | Paragraphs | Required roles | Content guidance |
|---|---|---|---|
| `setup` | P1 | protagonist + ally | Cole introduces the day. Cole spots / runs to / grabs the ally. Sets the location (place pick or setting lock). |
| `silly_repeat` | P2-P3 (two beats) | protagonist + ally + wonder_object | Cole and ally encounter the wonder_object. Repetition with variation — "Cole said 'Boingo!' The bunny said 'Boingo!' back. They both giggled." One memorable image per paragraph. |
| `cozy_end` | P4 | protagonist + ally | Bedtime mode: hugs, sleep imagery. Anytime mode: wave goodbye, walk home, "tomorrow?". |

Note: 4 paragraphs vs. kid/big/tween's 6. This matches the existing v2 tot_loop and gentle_quest recipes structurally — only the underlying contract changes from "implicit slot-based" to "explicit role-based."

---

## Example blueprint declarations

### `tot_wonder_v3` (replaces v2's `tot_loop`)

```js
{
  id: 'tot_wonder_v3',
  tiers: ['tot'],
  paragraphCount: 4,
  roleMap: {
    protagonist:    'kid',
    ally:           'companion',  // pet
    wonder_object:  'food',       // randomized at runtime between food/sky
    visual_signature: 'color',
    signature_action: 'move',
  },
  stages: [
    { name: 'setup',         requiredRoles: ['protagonist', 'ally'],                       paragraphs: 1 },
    { name: 'silly_repeat',  requiredRoles: ['protagonist', 'ally', 'wonder_object'],     paragraphs: 2 },
    { name: 'cozy_end',      requiredRoles: ['protagonist', 'ally'],                       paragraphs: 1 },
  ],
  titlePatterns: [
    'Hi, [c:{ally.titleText}]!',
    '[name:{protagonist.name}] and the [c:{ally.titleText}]',
    '[name:{protagonist.name}] Says Hi to [c:{wonder_object.titleText}]',
  ],
}
```

### `tot_sky_v3` (variant — sky pick is the wonder_object)

```js
{
  id: 'tot_sky_v3',
  tiers: ['tot'],
  paragraphCount: 4,
  roleMap: {
    protagonist:    'kid',
    ally:           'companion',
    wonder_object:  'sky',         // sky pick drives the playful focus
    visual_signature: 'color',
    signature_action: 'move',
  },
  stages: [/* same shape as above */],
  titlePatterns: [
    '[name:{protagonist.name}] Sees the [c:{wonder_object.titleText}]',
    'The [c:{wonder_object.titleText}] and the [c:{ally.titleText}]',
  ],
}
```

### `little_quest_v3` (replaces v2's `gentle_quest`)

```js
{
  id: 'little_quest_v3',
  tiers: ['little'],
  paragraphCount: 4,
  roleMap: {
    protagonist:    'kid',
    ally:           'companion',
    wonder_object:  'object',      // OR food — pick at runtime
    visual_signature: 'color',
    signature_action: 'move',
    pressure:       'weather',      // little-specific
  },
  stages: [/* setup → silly_repeat (×2) → cozy_end, 4 paragraphs */],
  titlePatterns: [
    '[name:{protagonist.name}] and the [c:{wonder_object.titleText}]',
    'How [name:{protagonist.name}] Found the [c:{wonder_object.titleText}]',
  ],
}
```

### Optional: `little_food_v3` (food-focused variant)

Same shape with `wonder_object: 'food'` instead of `'object'`. Useful when the kid picks a food they're excited about (waffles, donuts, ice cream).

---

## Beat library sizing

The kid/big/tween v3 engine ships 86 beats across 4 blueprints. tot/little-v3 doesn't need that scale:

| Tier | Stages | Variants per stage | Total beats |
|---|---|---|---|
| tot | 3 (setup / silly_repeat / cozy_end) | 5-7 | ~15-20 |
| little | 3 | 5-7 | ~15-20 |
| **tot/little-v3 total** | — | — | **30-40 beats** |

This is a manageable authoring lift for v3.0.0 (one focused content sprint). Beats reuse the action-driven voice established by the v2.8.0 kid-agency pass — Cole spots, picks up, grabs, builds, leads.

---

## Migration path: v2 tot/little → v3 tot/little

v2.8.0 ships content-pass action beats for tot and little (kid-agency 0.95 ratio confirmed). v2.9.0 keeps these v2 beats as the active path for ages 2-5. v3.0.0:

1. Author the ~30-40 tot/little-v3 beats following this design.
2. Remove the early-exit `if (age <= 5) return null` from `generateStoryV3()`.
3. Add the tot/little-v3 blueprints to `V3_BLUEPRINTS`.
4. Add the tot/little-v3 beats to `V3_BEATS`.
5. Delete the v2 tot/little beats (`to_*`, `li_*`, `ag_tot_*`, `ag_li_*`, `sa_tot*`, `sa_little*`) — they live in `V2_BEATS` which is being deleted wholesale in v3.0.0.
6. Verify no regression on the 30-story audit pack at ages 2 and 4: every story still has Cole as the driver, every picked word lands in the body, every story is 4 paragraphs.

---

## Acceptance for v3.0.0 (when this design ships)

- New v3 matrix gate: 4 blueprints (2 tot + 2 little) × 4 ages (2-5) × 30 stories = 480 stories. 0 nulls, 0 unresolved tokens, 4-paragraph arc every time, 100% picked-word body coverage + highlight.
- Kid-agency action-verb ratio stays ≥ 0.65 across 100 tot+little stories (v2.8.0 measured 0.95 against the v2 beats; v3 beats must match or exceed).
- 30-story audit pack at ages 2 and 4: every story scores ≥ 3.5 on every quality dimension (humor / substance / kid agency / choice integration / rereadability / age fit).
- Real-kid playtest with at least 2 kids each at ages 2-3 and 4-5 (part of the broader v3.0.0 real-kid UAT).

---

## Open questions

1. **Should the `wonder_object` slot be runtime-randomized between food/sky/object, or fixed per-blueprint?** Fixed is simpler to debug; randomized makes the same story re-roll into different shapes. Probable answer: fixed per blueprint, with multiple blueprint variants to provide variety.
2. **Does the visitor/creature pool play any role in tot stories?** Today tot's v2 has no creature round. little does have a creature round. The 3-role contract doesn't include obstacle/visitor — should creatures be ignored in tot/little-v3, or surfaced as a flavor role like "a passing creature came to see"? Probable answer: little-v3 surfaces creature as a flavor mention in P3; tot-v3 doesn't.
3. **Does `wonder_object` always need a separate role from `ally`, or can the ally double as the wonder?** "Cole met a bunny. The bunny had a tiny hat." — here the ally IS the wonder. The 3-role contract may want a 2-role variant for very small stories. Defer to authoring.
4. **Sound/freeword integration.** tot has freeword (one sound). little has freeword. Neither has freeword2. Should the chant role show up in tot/little-v3 or stay as flavor? Probable answer: optional flavor role `chant`, fires twice in silly_repeat stage when freeword is picked.
5. **Sidekick names from the profile.** v3 currently treats sidekicks as additive cast. Should tot/little-v3 incorporate sidekick names by name (the way v2 little_intro does)? Probable answer: yes, sidekicks appear by name in setup and cozy_end if present.

These are content-authoring questions, not architecture questions. They get resolved during the v3.0.0 authoring sprint, not now.

---

## What this design does NOT change

- **The picker UX.** Same picker, same rounds, same age tiers. Kids don't see anything different.
- **Story Mode.** Bedtime vs. Anytime cozy_end variants continue to work the same way — mode-tagged beats filter on `picks.storyMode`.
- **Setting Modes.** The `setting` lock continues to override `place` in tot/little stories (until the separate `place`-vs-`setting` defect is resolved).
- **Sidekicks.** Profile sidekicks continue to be additive cast surfaced in the body.
- **TTS, karaoke, IndexedDB cache.** Unchanged.
- **Tot/little quality bar.** v3.0.0 must match or exceed the v2.8.0 baseline. No regression allowed.

The architectural promise of v3.0 — **one role-based engine, all ages** — lands when this design ships in v3.0.0.
