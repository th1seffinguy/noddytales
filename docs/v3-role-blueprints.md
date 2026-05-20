# v3 Role-Based Story Blueprints — Design + Implementation Notes

**Status:** v2.6.x ships **all four v3 blueprints** behind `?engine=v3`. v2 remains default; v3 is opt-in. v3 returns null for tot (ages 2-3) and little (ages 4-5); router falls back to v2.
**Authors:** v2.4.7 planning pass, v2.5.0 first runtime, v2.6.0 blueprint expansion, v2.6.1 QA patch.
**Predecessor:** v2.3.x blueprints (`goal_spine`, `lost_snack`, `show_wrong`, `rule_loophole`) which proved that *causality* (chosen words drive plot) beats *coverage* (chosen words sprinkled in).

## Current implementation summary (v2.6.1)

| Design element | Status | Notes |
|---|---|---|
| `V3_BLUEPRINTS` declarative registry | ✓ shipped | **Four entries:** `lost_snack_v3`, `goal_spine_v3`, `show_wrong_v3`, `rule_loophole_v3`. Each declares its own role map and stage progression. |
| `V3_BEATS` keyed by stage + requiredRoles + blueprintId | ✓ shipped | ~50 beats across the 4 blueprints. `blueprintId` field added in v2.6.0 to scope beats and prevent cross-bleed when blueprints share role names. |
| Role → slot map per blueprint | ✓ shipped | Slot construction reuses v2's `mapPickToWord` so the rich-word pool stays in v2. `object` is added to v3 slots (random pick, since picker has no `object` round) to support show_wrong's `prop` and rule_loophole's `loophole_tool`. |
| `{role.prop}` template syntax | ✓ shipped | Resolves through the blueprint's role map at render time. Supports `text`, `cap`, `articleText`, `theText`, `TheText`, `plural`, plus the kid `name`. |
| Highlight tokens emitted directly | ✓ shipped | Beats author `[name:{protagonist.name}]` / `[c:{ally.text}]` / `[y:{setting.text}]` inline. No `applyHighlightTokens` post-pass needed for v3 output. |
| Feature flag (`?engine=v3`) | ✓ shipped | URL param sets `localStorage.nt_engine_v3` and `window.NODDY_ENGINE`. v2 fallback on any v3 failure. |
| Coverage callback layer | **kept as v3 safety net** | v3 runtime uses a callback pass for flavor roles (`signature_action`, `visual_signature`, `chant`, `payoff_word`, `mood_throughline`, `mcguffin`, `obstacle`). Each emits highlight tokens directly so the callback layer is fully token-aware. Required roles (protagonist, ally, setting, etc.) are guaranteed by stage-level beat requirements. |
| Random blueprint selection | ✓ shipped | `generateStoryV3` picks uniformly at random from all eligible blueprints. `picks.__v3BlueprintId` forces a specific blueprint (used by `qaV3Blueprint` for isolated audits). |
| Tot/little support | not yet | v3 returns null for ages 2-5; router falls back to v2. tot/little keep v2's simpler structure. |
| `qaV3Blueprint` helper | ✓ shipped | Reports nulls, unresolved tokens, arc completeness, kid agency, per-role body/title/highlighted. |
| Dynamic blueprint validation | ✓ shipped (v2.6.0) | Required-role set derived from `blueprint.stages[*].requiredRoles` union, not hardcoded. |
| Plural-aware mcguffin rendering | ✓ shipped (v2.6.1) | Beats that previously rendered "a donuts" now use `[c:{mcguffin.articleText}]` which returns "donuts" for plural foods and "a pizza" / "an apple" for singulars. |
| Smart title casing | ✓ shipped (v2.6.1) | `titleCase` keeps small words (a, an, the, of, in, on, at, to, for, by, with, and, or, but, vs, from, as, if, nor) lowercase unless they're the first or last word. Fixes "Rescue A Stuck Friend" → "Rescue a Stuck Friend". |

## Lessons from the first runtime

- **Role-based beat reuse works as designed.** The same beat (e.g. `v3_setup_1`) renders correctly under any blueprint that maps `protagonist/ally/setting/mcguffin` to slots — the line authors don't know or care which slot is which.
- **The "every selected word becomes load-bearing" promise still depends on enough beat variants per stage.** With 2-3 variants per stage, randomly selected, only ~50% of stories surface the optional flavor roles without help. A v3 safety net is still needed until each stage has 6-8 variants — at which point random pick will naturally hit all flavor roles.
- **Token-direct authoring is a real improvement.** Authoring `[c:{ally.text}]` directly inside a beat line is easier to read than relying on a regex pass to wrap chosen words. The downside: beat authors have to remember to use `[c:]` for things like color/move/mood and `[y:]` for place/freeword. A linter could enforce this if it becomes a problem.
- **Plural agreement is still a v2 wart.** v3 inherited the "the donuts had vanished" workaround (use `had vanished` instead of `was/were gone` to avoid plural-aware verb agreement). Better fix is to thread `isPlural` through role resolution so `{mcguffin.was}` resolves correctly — deferred to a future build.

## What still matches the original design

---

## The problem v3 solves

In v2.x the engine picks a blueprint (`goal_spine`, etc.), fills four required slots (kid/companion/food/object/visitor depending on blueprint), and selects beat cards from a pool keyed only by tier and required-slot presence. Selected words *can* land naturally, and v2.4.x post-process callbacks guarantee at least surface-level coverage. But:

- **Plot roles are implicit, not declared.** `lost_snack` decides at runtime that the companion is the culprit, the visitor is the false suspect, and the food is the missing thing — but those role assignments live inside individual beat lines, not in a structured contract. Two beats from different cards can disagree (e.g., one treats the visitor as a helper, the next treats it as a suspect) when both are technically eligible.
- **Slot-to-role coupling is hard-coded per blueprint.** The same picked visitor (`pirate`) plays a completely different narrative function in `lost_snack` (false suspect) vs. `rule_loophole` (rule-imposer). The blueprint name encodes the role mapping, not the role itself.
- **Move, mood, color, weather have no plot role at all.** They're decorations injected as sprinkles. A 10-year-old who picks `moonwalked` should see the kid *use* moonwalking as the move that solves the problem, not have "Cole moonwalked a little, just because it felt right" tacked into paragraph 3.
- **No load-bearing freeword pattern.** Freeword is a sound or chant, but its narrative function is whatever the beat card decides locally. It could be a spell, a name, a dance, a smell — each blueprint guesses.

## The v3 contract

Every story starts by **assigning a plot role to each selected word**, then routes those role assignments to a structured 4-stage arc (setup / problem / attempt / payoff). Each stage queries beats by *role*, not by raw slot name. This means:

- A given beat card declares which roles it consumes (e.g., "I need a `protagonist` and an `obstacle`"), not which slots.
- The blueprint declares the role mapping (e.g., "for `lost_snack`: companion = `culprit`, visitor = `false_suspect`, food = `mcguffin`, kid = `detective`").
- The engine type-checks the role assignment before generation. If a blueprint demands an `ally` role but the user didn't pick a pet, the blueprint is skipped or downgraded.

### The roles

| Role | What it does | Default mappings |
|---|---|---|
| `protagonist` | Subject of every paragraph's main verb | Always = `kid` |
| `ally` | Helps protagonist; appears in P1, helps in P3, present at payoff | Usually = `pet` (companion) |
| `obstacle` | Blocks the goal; introduced in P2 | Usually = `creature` (visitor) |
| `mcguffin` | The thing the plot is about (lost, won, broken, stolen, bribed-with) | Usually = `food` or `object` |
| `setting` | Where the story happens; constrains tone | Always = `place` (or locked setting) |
| `visual_signature` | One sensory anchor that returns at payoff | = `color` if picked, else `weather`, else fallback to sound |
| `mood_throughline` | Protagonist's emotional state across all 4 stages | = `mood` if picked, else inferred from goal |
| `signature_action` | Kid's chosen move; appears in P3 attempt as the move that works | = `move` if picked, else fallback to "tried something" |
| `pressure` | Environmental complication; raises stakes in P2 | = `weather` if picked, else inferred from setting |
| `chant` | Recurring phrase, fires in P2/P3/P4 as a spell/name/cry/code | = `freeword` always |
| `payoff_word` | The second freeword, fires once at the climax | = `freeword2` always |

Roles a user *didn't* pick get sensible fallbacks. Roles a user *did* pick are guaranteed to land in their assigned stage.

### The 4 stages

Every v3 blueprint generates a story in 4 ordered stages. The number of paragraphs can still flex per tier (tot: 4, little: 4, kid/big/tween: 6 including a punchline), but the *stage progression* is fixed:

1. **Setup** — `setting` + `protagonist` + `ally` introduced together. `visual_signature` planted as a noticeable detail. P1 always.
2. **Problem** — `obstacle` arrives. `pressure` raises stakes. The `mcguffin` is identified as wanted/lost/threatened. `mood_throughline` colored. P2.
3. **Attempt** — `protagonist` deploys `signature_action`. `ally` assists. `chant` fires. The attempt either works (success arc) or fails forward (twist arc). P3-P4.
4. **Payoff** — `mcguffin` resolved. `visual_signature` returns as callback. `payoff_word` fires once with maximum volume. `mood_throughline` updates to "earned." P5-P6 (kid+) or P4 (tot/little).

### How blueprints differ in v3

A blueprint is a small declaration of (a) the role mapping for that story shape, (b) which stages get a *twist* vs. play straight, and (c) the title pattern.

```yaml
# Example (pseudocode, not final shape)
blueprint: lost_snack_v3
  role_map:
    mcguffin: food            # the missing snack
    obstacle: creature        # accuses, gets blamed, turns out to be a false lead
    false_suspect: creature   # alias — same word, two roles
    true_culprit: companion   # the ally is secretly the thief
    detective: kid
  stage_twists:
    problem: false_accusation
    attempt: misdirected_search
    payoff: companion_reveal
  title_patterns:
    - "Who Took the {mcguffin.text}?"
    - "{detective.cap} and the {mcguffin.text} Mystery"
```

Compare to `lost_snack` v2.3.1 which is just a beat sequence (`snack_missing → wrong_suspect → kid_investigates → true_culprit → punchline → bedtime_landing`). The v2 version *describes* what happens; the v3 version *declares* who plays what.

## Beat authoring contract

In v2.x, beats look like:

```js
{ id:'ls_cul_2', beatType:'true_culprit', tiers:['kid','big'],
  requiredSlots:['kid','companion','food','visitor'],
  lines: [ "Wait, WHAT? It was the {companion.text}…" ] }
```

In v3, beats look like:

```js
{ id:'ls_cul_2_v3', stage:'payoff', twist:'companion_reveal', tiers:['kid','big'],
  requiredRoles:['protagonist','ally','mcguffin','false_suspect'],
  lines: [ "Wait, WHAT? It was the {ally.text}…" ] }
```

The template body uses `{role.text}` instead of `{slot.text}`. The renderer resolves role → assigned slot at render time. Same line works for any blueprint that maps `ally:companion` AND any blueprint that maps `ally:sidekick` (a future variant).

## What changes vs. v2.x

| Concern | v2.x | v3 |
|---|---|---|
| Pool of beats per blueprint | Beat type matches blueprint stage 1:1 (e.g. `snack_missing` only fires in `lost_snack`) | Beats declare required ROLES; the same beat can fire for any blueprint that declares those roles |
| Twin-role reuse | Visitor as obstacle in one blueprint, helper in another → different beat pools entirely | Single beat pool keyed by role; blueprint just changes role-to-slot mapping |
| Unused selections | `move`/`mood`/`color`/`weather` are sprinkles, post-process only | All selections are role-mapped before generation; the engine *plans the story* knowing every selected word has a job |
| Coverage validation | Post-process callback injects sentences when a slot is missing from body | Pre-validated: if a role can't be fulfilled, the blueprint is rejected before beats fire (no patches needed) |
| Authoring per beat | Need to author across all blueprints separately | Author beats by *role function*; blueprints inherit the entire pool |
| Failure mode | Coverage fixes patch the symptom (a sentence appended) | Story is structurally invalid (caller falls back gracefully) |

## Migration plan (v2.4.x → v3.0)

1. **v2.5.0 — role metadata on V2_WORDS.** Tag every rich-word entry with role hints: foods get `bribe`/`messy`/`shareable`, objects get `tool`/`clue`/`runaway`, companions get `loyal`/`sneaky`/`tiny`/`absurd`, visitors get `authority`/`chaotic`/`mysterious`. This is the schema groundwork. Picker UX unchanged.
2. **v2.6.0 — role-aware beat filter (additive).** A new beat field `preferRoles: { mcguffin: 'bribe' }` lets v2 beats softly prefer role-tagged entries during slot resolution. Backwards compatible with existing v2 beats.
3. **v2.7.0 — first v3 blueprint shipped alongside v2 blueprints.** New `quest_v3` blueprint with full role declaration. Engine routes ~10% of kid/big/tween stories through it; rest still v2. Direct comparison data gathered.
4. **v2.8.0 — full v3 beat library for the 4 existing blueprints.** Rewrite `goal_spine`, `lost_snack`, `show_wrong`, `rule_loophole` as v3 role-based. Coverage callback layer can shrink because pre-validation handles most cases.
5. **v3.0.0 — cutover.** Retire v2 blueprint code path. Retire v1 fallback. Single role-based engine. Picker UX unchanged.

Each step is independently shippable and gated on real-kid playtest data, not a big-bang refactor.

## Open questions

- **Tot tier:** does it need role-based blueprints at all? Tot stories are 4 short paragraphs with `tot_intro → tot_silly_meet → tot_silly_repeat → tot_cozy_end`. Roles add overhead for very little narrative gain at ages 2–3. Probable answer: tot keeps a simplified 3-role contract (`protagonist`, `ally`, `wonder_object` — the food/object that's the playful focus).
- **Setting Modes interaction:** when a setting locks `place` to "Diner" or "Mall", does the setting also constrain role mappings (e.g., `obstacle` biased to setting-appropriate visitors)? Likely yes; this is a small extension of the existing `visitorBias`/`objectBias` config.
- **Free-text freeword subtypes:** the v1.19.2 freeword subtypes (`shout`/`smell`/`name`/`dance`) currently route to specialized templates. In v3, do these become role variants (`chant_loud`/`chant_smell`/`chant_name`)? Probable answer: yes — the chant role gets a subtype that selects the beat flavor without changing the structural plan.
- **Failure recovery:** when a blueprint can't be fulfilled (e.g., user didn't pick a creature and no `obstacle` fallback exists), do we (a) silently fall back to v2 blueprints, (b) reject the story and fall back to v1, or (c) downgrade to a 3-role blueprint? Probable answer: downgrade — keep v3 in flow whenever possible.

## What this is not

- **Not** a content rewrite. The 200+ beat cards in v2.x are mostly fine and translate cleanly to role syntax (s/`{slot.text}`/`{role.text}`/).
- **Not** a picker change. The selection UX, picker emoji, freeword input — none of it changes. Kids still pick the same things.
- **Not** a v2 deprecation today. v2.x can keep shipping; v3 lands behind a feature flag first.

## Success criteria

After v3 cutover, the following should be true:

1. **100% role coverage** — every picked word has an assigned role that's referenced at least once in the body. No more "selected mood never appears" silent failures.
2. **No sprinkle callbacks needed for picked-but-unread slots** — the coverage validator's job shrinks to verifying role fulfillment, not patching missing text.
3. **Same picks produce 4+ structurally different stories** across replays (v2.4.1 memory still in play, plus blueprint variety) AND each story has every picked word in a *load-bearing* position, not decoration.
4. **A 10-year-old reading their own story** should be able to point at every chosen word and say *"that's the X, that's why I picked it"* — protagonist, ally, obstacle, mcguffin, chant, signature action. The chosen words *are* the plot.
