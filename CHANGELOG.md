# NoddyTales Changelog

Semantic versioning: `MAJOR.MINOR.PATCH`. Every shipped version is tagged here so the in-app version badge stays meaningful.

---

## v1.23.0 — 2026-05-15
**v2 engine — Phase 4 (Segment D): tot + little — v2 covers all 5 tiers**

Fourth segment of the v2.0 rebuild. **v2 engine now generates stories for every age tier behind the `?engine=v2` flag.** Tot (2–3) and little (4–5) were intentionally built last — per the design spec, the youngest tiers need restraint (shorter sentences, more repetition, lower absurdity, no irony). The engine architecture supports this through tier-specific recipes and beat cards.

### Two new recipes (8 total)

| Recipe | Tier | Beat sequence | Voice |
|---|---|---|---|
| **tot_loop** | tot (2–3) | tot_intro → tot_silly_meet → tot_silly_repeat → tot_cozy_end | "Hi! Cole met a dragon." Heavy repetition. Very short sentences. Soft sounds. |
| **gentle_quest** | little (4–5) | little_intro → little_companion → little_silly_event → little_cozy_end | "The dragon had a tiny hat on. The hat was a little too big." Tiny jobs, confused animals, gentle. No irony. |

### Library totals

| Type | v1.22.0 | v1.23.0 | Δ |
|---|---:|---:|---:|
| Recipes | 6 | **8** | +2 |
| Seeds | 17 | **23** | +6 (3 tot + 3 little) |
| Beats | 74 | **91** | +17 (8 tot + 9 little) |

### Smoke test (50 generations per tier)

| Tier | Non-null | Grammar | Unresolved | Titles | Paragraphs |
|---|---:|---:|---:|---:|---:|
| tot (2–3) | 50/50 | 0 | 0 | 10 | 4 |
| little (4–5) | 50/50 | 0 | 0 | 15 | 4 |
| kid (6–7) | 50/50 | 0 | 0 | 22 | 5 |
| big (8–10) | 50/50 | 0 | 0 | 23 | 5 |
| tween (11–13) | 50/50 | 0 | 0 | 17 | 5 |

### Sample (tot age 3)

> **Cole and the Dragon**
> Hi! Cole met a dragon. The dragon said hi. Cole said hi back.
> The dragon said "BOING!" That is a funny noise. BOING! BOING! Hee hee.
> Then Cole said "BOING!" too. So did the dragon. "BOING!" "BOING!" Everybody laughed.
> Now Cole is sleepy. The dragon is sleepy too. Good night, dragon. Good night, Cole.

### Sample (little age 5)

> **Maya's Tacos Adventure**
> Maya found a tiny clipboard on the doorstep. What a surprise! What was it for?
> "BOING!" said the dragon. Maya giggled. "BOING!" said the dragon again. Maya giggled even more.
> The dragon found some tacos. They shared some tacos together. The dragon took the biggest bite. Maya did not mind.
> By the end of the day, Maya and the dragon were tired and happy. They hugged. Then they went to bed. Goodnight.

### Engine status

`buildStory()` in `index.html` now routes ALL ages to v2 when the flag is on (previously only kid/big/tween). v1 fallback remains for any v2 null/exception path.

Next: **v2.0.0** — flip v2 to default, remove the feature flag, retire v1 templates.

---

## v1.22.0 — 2026-05-15
**v2 engine — Phase 3 (Segment C): big + tween tiers**

Third segment of the v2.0 architecture rebuild. v2 engine now covers **3 of 5 tiers**: kid (6–7), big (8–10), tween (11–13). Tot and little still on v1 — Segment D adds them.

### Big tier (8–10)
Re-uses existing Quest / Mystery / Trial / Bureaucracy recipes. The dry mock-bureaucratic voice ("Approved. With conditions. The conditions involved hot dogs.") that the v1 templates established for big translates cleanly to v2 beats. Tier eligibility on existing kid beats was bulk-extended to `['kid','big']` (58 beats). 3 new big-tier-specific seeds added.

### Tween tier (11–13)
Distinct voice per spec: "social embarrassment, school pressure, group chats, internet voice, deadpan surrealism." Added a tween-tailored recipe:

**New recipe: social_embarrassment** — beat sequence: `ordinary_setup → public_mistake → witnesses → spiral → bedtime_landing`

Mirrors the spec's tween examples ("Nobody had asked", "It was, somehow, a vibe", "The group chat became a small, beloved religion").

### Library additions

| Category | Segment B | Segment C | Δ |
|---|---:|---:|---:|
| Companions | 20 | **25** | +5 (crow, hamster, chameleon, raccoon, red panda) |
| Visitors   | 20 | **27** | +7 (stressed barista, feral librarian, wifi ghost, cryptid, sentient vending machine, mysterious substitute teacher, group chat) |
| Places     | 20 | **30** | +10 (abandoned mall, skatepark, parking garage, arcade, bus stop, convenience store, empty school hallway, back of the bus, slightly wrong neighborhood, rooftop at night) |

### Seeds + Beats + Recipes

| Type | v1.21.0 | v1.22.0 |
|---|---:|---:|
| Recipes | 5 | **6** |
| Seeds | 10 | **17** |
| Beats | 49 | **74** |

### Smoke test (50 generations per supported tier)

| Tier | Non-null | Grammar errs | Unresolved | Unique titles |
|---|---:|---:|---:|---:|
| kid (6–7) | 50/50 | 0 | 0 | 18 |
| big (8–10) | 50/50 | 0 | 0 | 21 |
| tween (11–13) | 50/50 | 0 | 0 | 13 |
| tot (2–3) | n/a — null (v1 fallback) | — | — | — |
| little (4–5) | n/a — null (v1 fallback) | — | — | — |

### Sample (big age 9, Bureaucracy)

> **Cole's Official Disaster**
> The knight arrived with a suspicious envelope and a stack of paperwork. "Sign here. And here. And especially here," the knight said.
> "Rule seventeen-B," announced the knight. "never run with a clipboard." It was an old rule. Nobody remembered who made it. The rule did not care.
> Cole and the dragon found a loophole. They walked through it with concerning enthusiasm. The knight was furious. Or possibly impressed. Hard to tell.
> A stamp came down. THUNK. Cole was now officially the new chief sock investigator. The knight did not look pleased. The stamp had spoken.
> On the way home, Cole tucked a suspicious envelope into a pocket for safekeeping. The dragon approved.

### Sample (tween age 12, Social Embarrassment)

> **Ava vs the Knight**
> The whistle was sitting on a bench at the desert. Nobody had put it there. Nobody was claiming it. It had, somehow, vibes.
> The knight had a complicated look on their face. Ava could not parse it. The look kept happening anyway.
> Ava arrived at a confident conclusion. The dragon stared for unclear reasons. The conclusion was, in retrospect, very wrong.
> It was the knight. Of course it was. The knight had been holding a whistle the whole time. Ava sighed at the sky.
> Ava pulled the blanket over their head. The dragon settled on top. Tomorrow was tomorrow. Tonight was officially over.

Next segment (v1.23.0): tot + little — the spec recommends building these LAST because they need restraint (shorter sentences, more repetition, lower absurdity stack).

---

## v1.21.0 — 2026-05-15
**v2 engine — Phase 2 (Segment B): kid library expansion + 4 new recipes**

Second segment of the v2.0 architecture rebuild. The v2 engine remains opt-in via `?engine=v2`. Kid tier only. Other tiers still run v1 unchanged.

### Library growth (10 categories → 189 rich words)

| Category | v1.20.0 | v1.21.0 | Δ |
|---|---:|---:|---:|
| Companions | 10 | **20** | +10 |
| Visitors   | 10 | **20** | +10 |
| Places     | 10 | **20** | +10 |
| Foods      | 10 | **20** | +10 |
| Objects    | 10 | **25** | +15 |
| Sounds     | 12 | **24** | +12 |
| Adverbs    |  8 | **16** | +8  |
| Numbers    |  6 | **14** | +8  |
| Liquids    |  6 | **14** | +8  |
| Jobs       |  6 | **16** | +10 |
| Rules      |  6 | **14** | +8  |
| **Total**  | 94 | **203** | **+109** |

New companions include tiger, parrot, koala, falcon, lynx, otter, hedgehog, llama, bear cub, duckling. New visitors include robot, mermaid, phoenix, centaur, gnome, banshee, dinosaur, sphinx, gargoyle, jester.

### Story-shape variety: 1 recipe → 5 recipes

| Recipe | Beat sequence |
|---|---|
| Quest (existing) | arrival → helper → obstacle → discovery → bedtime_landing |
| **Mystery** (new) | strange_clue → suspect → false_solution → culprit → bedtime_landing |
| **Trial** (new) | rule_setup → judge_arrives → silly_evidence → verdict → bedtime_landing |
| **Performance** (new) | practice → disaster → improvisation → applause → bedtime_landing |
| **Bureaucracy** (new) | paperwork → impossible_rule → loophole → stamp → bedtime_landing |

5 new story seeds added (10 total) — at least one per recipe.

### Beat library: 15 → 49

- Quest beats: 15 (unchanged + 2 new bedtime_landing variants)
- Mystery beats: 8 (4 beat types × 2 each)
- Trial beats: 8
- Performance beats: 8
- Bureaucracy beats: 8
- Universal bedtime_landing variants: 5

### Title pool

Universal patterns: 8 (was 6). Recipe-specific patterns: 3 per recipe (15 total). When the engine picks a Mystery seed, titles like "The Curious Case of the Tiny Key" or "The Mystery of the Desert" are eligible alongside the universal patterns.

### Smoke test (100 generations, kid age 6, FW=FLOBBER)
- 100/100 stories generated successfully
- **0 grammar errors** (hostile combos: octopus + tacos + alien + axolotl all clean)
- **0 unresolved `{slot.prop}` tokens**
- 26/100 unique titles
- All 21 beat types in the 5 recipes have ≥1 beat card

### Sample (Mystery recipe)

> **The Mystery of the Desert**
> Cole found a clipboard where it absolutely should not be. The dragon sniffed it suspiciously.
> The knight was loitering nearby, eyeing the scene for unclear reasons. Cole narrowed their eyes.
> The dragon nodded for unclear reasons. "Wait. That cannot be right." Everyone paused. The dragon was, as usual, correct.
> Turns out it was the dragon all along. The dragon had hidden the tacos for emergency snack purposes. Cole sighed.
> By bedtime, everyone was fed. Cole ate some tacos. The dragon had three. Nobody asked questions.

### Sample (Performance recipe)

> **Cole's Tacos Adventure**
> Cole and the dragon practiced sideways. The act was almost ready. Almost.
> Then everything went wrong. The dramatic cape fell. The lights flickered. Cole froze. The audience leaned forward.
> Cole improvised sideways. The dragon followed along, mostly. It was beautiful. It was also wrong.
> Standing ovation. Cole bowed. The dragon bowed too, several times. Some bows were sincere. Some were just for show.
> On the way home, Cole tucked a dramatic cape into a pocket for safekeeping. The dragon approved.

Next segment (v1.22.0): add big + tween seeds, recipes (bureaucracy already exists — extend it for big, add internet-voice / social-embarrassment for tween).

---

## v1.20.0 — 2026-05-15
**v2 engine — Phase 1 prototype (Segment A of the v2.0 architecture rebuild)**

First shippable segment of the v2.0 rebuild plan captured in the NoddyTales v2.0 Full Design Spec (Notion). The full v2.0 transforms NoddyTales from a template-substitution app into an authored comedy engine that assembles stories from rich word objects, beat cards, and story-shape recipes. v2.0 is large — the spec recommends shipping it as a series of segments behind a feature flag, with the kid tier proving the model first.

### Segment plan toward v2.0
| Segment | Version | Scope |
|---|---|---|
| **A** | **v1.20.0 (this build)** | Thin kid-tier v2 prototype behind `?engine=v2` flag. v1 stays default. |
| B | v1.21.0 | Expand kid library (60–80 words), 4–5 recipes, 40+ beats, relationship variants, QA harness |
| C | v1.22.0 | Big + tween seed sets (bureaucracy, social embarrassment, internet voice) |
| D | v1.23.0 | Backfill tot + little with restraint (fewer beats, simpler sentences) |
| E | v2.0.0 | Flip v2 to default. Remove v1 fallback once five-tier coverage proves out. |

Each segment ships independently and is safe to interrupt at — the v2 engine is opt-in, the v1 engine remains the default and fully functional, and the v2 engine falls back to v1 on any failure.

### What ships in v1.20.0

**New file `src/engine-v2.js`** — the v2 engine, isolated from v1. Loaded after `src/content.js`. Exposes `generateStoryV2()` and `V2Grammar` on `window` (browser-global pattern matching the existing app convention).

**Grammar renderer** owns sentence construction so beat cards don't solve grammar inline:
- `articleText(word)` → `"an octopus"`, `"a dragon"`, `"some tacos"`
- `theText(word)` / `TheText(word)` → mid-sentence `"the dragon"` / sentence-start `"The dragon"`
- `titleCase(str)` → multi-word capitalization for titles
- `plural(word)` / `possessive(name)` / `capitalize(str)`
- `resolveSlot(slots, "companion.articleText")` walks dotted paths
- `render(line, slots)` substitutes all `{slot.prop}` placeholders
- Sentence-start safety: each rendered paragraph auto-capitalizes its first letter

**Rich word library** (Phase 1 kid-tier subset, ~10 per category):
- 10 companions (dragon, panda, penguin, octopus, unicorn, fennec fox, capybara, axolotl, wolf cub, sloth) with `traits`, `actions`, `sounds`, comedy metadata
- 10 visitors (goblin, knight, wizard, pirate, ninja, alien, witch, ghost, troll, fairy)
- 10 places, 10 foods (with `isPlural` flags), 10 objects, 12 sounds, 8 adverbs, 6 numbers, 6 liquids, 6 jobs, 6 rules

**1 recipe** (Quest): `arrival → helper → obstacle → discovery → bedtime_landing`

**5 story seeds**: snack_trial, lost_thing, secret_club, weird_smell, wrong_room

**15 beat cards** spanning the 5 beat types in the Quest recipe.

**Feature flag wiring** in `index.html`:
- `?engine=v2` URL param → persists to `localStorage.nt_engine_v2 = '1'`
- `?engine=v1` resets to v1
- `isEngineV2Enabled()` checks the flag
- `buildStory()` delegates to `generateStoryV2()` when flag is on AND tier is kid (age 6–7)
- Any v2 failure (null return, exception, missing function) falls back to v1 silently

### Smoke test (50 v2 generations, kid age 6)
- 50/50 non-null stories
- 50/50 within 4–6 paragraphs
- **0 grammar errors** — handled hostile picks (octopus + tacos + alien + axolotl) cleanly
- 0 unresolved `{slot.prop}` tokens
- 16/50 unique titles (Phase 1 has 6 title patterns — expanded in Segment B)
- All non-kid tiers (tot/little/big/tween) return `null`, triggering v1 fallback

### Sample v2 kid output (FW=FLOBBER)
> **The Curious Case of the Apology Balloon**
> There was an apology balloon on the kitchen table. Cole had not put it there. The dragon stared at it suspiciously.
> The dragon nodded with great confidence. "Trust me," it said. Cole did not, but also did not have a better plan.
> A knight appeared out of nowhere holding an apology balloon. "I have terms," the knight announced. Cole had not agreed to any terms.
> Inside an apology balloon: rainbow water. Cole did not ask why. Nobody answered anyway.
> The last thing Cole heard before falling asleep was a tiny, distant "FLOBBER." Cole smiled. Goodnight.

### Try it
1. Open noddytales.app
2. Append `?engine=v2` to the URL
3. Pick age 6 or 7
4. Pick any companion/visitor/place/food/freeword
5. Generate — the story is now assembled by the v2 engine

To revert: `?engine=v1` or clear localStorage `nt_engine_v2`.

---

## v1.19.3 — 2026-05-15
**"The End" warmth + mid-sentence "Their pal" fix**

### "The End" pronunciation redesign
**User feedback:** "'End' is being pronounced as if it's in the middle of a sentence, not the last word of a sentence." Asked for the most-widely-used form for warm story closings.

**Root cause:** v1.19.1's `Theeeeeee.. End.` had two issues:
1. **`..` is not a standard ellipsis.** ElevenLabs Turbo v2.5 parses `...` (three dots) as a clear sentence-pause cue. Two dots fall into ambiguity — sometimes parsed as a period followed by another period, sometimes as an unfinished thought, sometimes ignored.
2. **Capitalized "End"** after a pause tends to be parsed as a proper noun or heading. The model gives it title-like intonation (flat or slightly rising) rather than sentence-final falling.

**Survey of warm closing forms used in audiobook narration:**
- "The end." (lowercase, single period — standard children's audiobook close)
- "The eeennnd." (stretch on the closing word itself)
- "Theeeeee... the end." (long stretch + repeated article, very dramatic)
- "And that's the end." (storyteller wind-down)

**Selected: `Theeee... end.`**
- 4 e's on "Theeee" — moderate stretch, less melodramatic than v1.16.2's 14 e's but still recognizable as a story closer.
- Standard 3-dot ellipsis — proper sentence-pause signal.
- Lowercase "end" — TTS treats it as a common noun in a sentence and applies natural falling cadence.
- Period at end — sentence-final closing intonation.

Visible DOM `.story-end` paragraph (`✦ The End ✦`) is **unchanged**. Karaoke maps TTS word[0]→DOM "The" and TTS word[1]→DOM "End" by word-index, so the elongation still lights the DOM "The" span for its full duration and the highlight transitions cleanly to "End" on the closing word.

### Codex re-audit — one residual finding closed
Codex's second pass flagged one real residue from the v1.19.1 SK_OPEN/SK_MID split: a kid template had `[name:Cole] and ${SK_OPEN} chased the [c:knight]` which, when the user had no sidekick, rendered as "Cole and Their pal chased the knight" — capital "T" mid-sentence. Now uses `${SK_MID}` for the lowercase mid-sentence form ("Cole and their pal chased the knight").

Codex's other re-audit findings (XSS, little freeword, semantic routing, plural-food grammar) were already fixed in v1.19.2 — the audit was against an earlier checkout. Verified live: noddytales.app serves v1.19.2 with `esc()` in `parseStoryLine`, `FREE_TEXT_ROUNDS.little` in content.js, 3 tagged kid templates, and the "had vanished" / "Just FOOD everywhere" phrasing in little template #2.

---

## v1.19.2 — 2026-05-15
**Codex QA sweep — five findings closed**

External read-only QA pass surfaced five issues, all addressed in one build.

### Finding 1 (High) — Name input can inject raw HTML into story body
**Root cause:** `state.name = inp.value.slice(0, 14)` at the input handler had no strip, while sidekick input had `.replace(/[<>&"]/g, '')`. `parseStoryLine()` returned `<span class="pop pop--name">${text}</span>` with raw `text` — the renderer trusted callers to pre-escape, but the title path was the only place that actually did (`esc(state.name)`). Body paragraphs rendered the kid's name unescaped.

**Fix (belt and suspenders):**
- **Input strip:** added `.replace(/[<>&"]/g, '')` to the name input handler, matching the sidekick pattern.
- **Renderer escape (defense in depth):** `parseStoryLine()` now calls `esc()` on every token's captured text before interpolation. Renderer is safe regardless of source — input strip, future call sites, or legacy localStorage values can't smuggle HTML through.

### Finding 2 (High) — Little tier uses freeword but never asks for one
**Root cause:** v1.19.0 extended Goofy Shorts to the little tier and the new templates use `${fwTok}` as a repeated shoutable spell. But `buildRounds()` only added a freetext round for kid/big/tween — little tier never got one. `FW_SAFE = FW || rawPick([fallbacks])` was always hitting the fallback, so kids got `FLABBADOO`/`KAPOW`/etc. instead of their own word. Directly contradicted the v1.18.0 brief (*"every story must have at least one line kids can shout"*).

**Fix:**
- Added `FREE_TEXT_ROUNDS.little` to `src/content.js` — 12 age-4–5 prompts (mostly `shout` subtype, two `name` for variety): "What's a silly sound?", "Make up a magic word.", "What does a dragon say?", etc.
- Added `tier === 'little'` branch to `buildRounds()` that picks one prompt from the pool and inserts it after the first 3 binary rounds so it lands mid-flow.

### Finding 3 (Medium) — Semantic freetext routing effectively dead for kid
**Root cause:** `FW_SUBTYPE` is read and kid templates filter on `tpl.tags`, but the 8 current kid Goofy Shorts templates have no `tags` — so smell/name/dance prompts all route into the same shout/spell usage. The v1.15.0 semantic routing concept was a regression after the v1.18.0 rewrite.

**Fix:** Added 3 new specialized kid templates with single-subtype tags. The 8 universal templates stay untagged (always eligible), so all subtype pools remain healthy:
- **Template 9** `tags: ['smell']` — "The Smell That Followed [Name]" — FW used as a literal smell
- **Template 10** `tags: ['name']` — "The Legend of [FW]" — FW used as the name of a new creature
- **Template 11** `tags: ['dance']` — "[Name] Invents the [FW] Dance" — FW as a silly dance move

When user types a smell prompt, the eligible pool grows from 8 → 9 (8 universal + 1 smell-tagged). Same for name and dance. Specialized templates fire as rare bonuses, restoring the v1.15 concept.

### Finding 4 (Medium) — Plural food grammar in little template #2
**Root cause:** "The [c:${FOOD}] was gone" produces "The cookies was gone" for plural food picks. Same for "There was only [c:${FOOD}]". The `fixArticles` regex handles a/an/some agreement but not be-verb agreement.

**Fix:** Rewrote both phrases to use constructions that work for both singular and plural picks:
- "The [FOOD] was gone" → "The [FOOD] had vanished" (past-participle, no agreement issue)
- "There was only [FOOD]" → "Just [FOOD] everywhere" (no copula)

### Finding 5 (Low) — Untracked `.claude/worktrees/` directory
**Fix:** Added `.claude/worktrees/` to `.gitignore`.

### Smoke test (350 stories — 100 kid, 100 little, 100 with HTML in name, 50 with specific FW subtypes)
- 0 stories rendering raw HTML from a malicious name input
- 100/100 little stories include the user's freeword (no FLABBADOO fallback)
- 0 instances of "The [plural-food] was gone" across 100 little template-2 stories
- Smell/name/dance prompts route to the new specialized templates (verified via FW_SUBTYPE filter eligibility)
- Other tiers (tot/big/tween) unchanged

---

## v1.19.1 — 2026-05-15
**Defect log sweep — phantom name, end-marker duration, karaoke alignment**

Three Notion Defect Log entries closed in one build.

### Defect 1 (Critical) — Phantom character name injected into story
**Root cause:** The `DEFAULT_SIDEKICKS` pool added in v1.18.0 (`['Maya', 'Jake', 'Sam', 'Riley', 'Ben', 'Emma', 'Theo', 'Ava']`) was used as a fallback when the user hadn't entered any sidekicks. A parent who entered only their kid's name was getting back a story with a fabricated other-child's name (e.g. "Maya yelled, 'FLOBBER!'"). Per the defect note: *"Any name in a template must be a dynamic variable populated from user input only."*

**Fix:**
- Removed `DEFAULT_SIDEKICKS` from `src/content.js` entirely. No invented names anywhere.
- New `buildStory` logic computes two tokens based on whether user has sidekicks:
  - **With user sidekick:** `SK_OPEN` and `SK_MID` both = `[name:Riley]` (chip styling, auto-capitalized)
  - **Without:** `SK_OPEN = '[c:Their pal]'` (sentence-start), `SK_MID = '[c:their pal]'` (mid-sentence), `SK_TITLE = 'Their Pal'` (title position)
- All 16 kid + little Goofy Shorts templates updated:
  - Sentence-start positions → `${SK_OPEN}`
  - Dialogue attributions (`said/asked/yelled/whispered/agreed ${SK}`) → `${SK_MID}`
  - "So/Then/Finally ${SK} ..." mid-sentence patterns → `${SK_MID}`
  - Title patterns `${capitalize(SK)}'s ...` → `${SK_TITLE}`

### Defect 2 (Low) — 'The End' display duration too long
**Root cause:** The dramatic elongated TTS closer added in v1.16.2 used 14 e's in `Theeeeeeeeeeeee... End.`, producing ~3s of audio. Defect note: should target 2s.

**Fix:** Trimmed to 7 e's + shorter ellipsis: `Theeeeeee.. End.` Target now ~1.5–2s.

### Defect 3 (High) — Read-aloud out of sync with displayed text
**Defect note assumed Web Speech API; we use ElevenLabs `/with-timestamps`.** Real cause traced to the karaoke RAF loop:

1. When audio time fell into the gap between `word[i].end` and `word[i+1].start`, the previous highlight was being REMOVED with no replacement (`idx === -1` path unlit but didn't relight). The user perceived these blank-flashes as "audio is ahead of text."
2. Every animation frame ran a fresh `document.querySelector('.kw[data-wi="..."]')` — slow on long stories.

**Fix:**
- Pre-cache all `.kw[data-wi]` nodes once when karaoke starts; each frame is now O(1) DOM access.
- Inter-word continuity: when audio time lands in a gap, keep the **last word whose start ≤ t** lit (walks backwards through `wordTimings` for early exit) instead of blanking the highlight.

### Smoke test (300 stories — 100 kid age 6, 100 little age 5, 100 with empty sidekicks)
- 0 stories containing any name from the removed `DEFAULT_SIDEKICKS` pool
- 0 grammar issues
- 4 paragraphs per kid/little story
- ≥2 freeword shouts per Goofy Shorts story
- Other tiers (tot/big/tween) unchanged
- TTS text length reduced by 6 characters at the end-marker

---

## v1.19.0 — 2026-05-15
**Goofy Shorts: Little Edition — ages 4–5 content rewrite (Story Test Log Entry 001 fix)**

Story Test Log Entry 001 ("The Sunny Island Adventure", Cole, age 5) graded the little tier as **failing** on the app's core promise:

| Dimension | Score | Note |
|---|---|---|
| Humor | 2/5 | One genuinely funny moment (bee with suitcase); everything else flat |
| Substance | 1/5 | Nothing actually happens; events listed but never connect or escalate |
| Age-fit | 3/5 | Vocab fine; needs silliness, not ambient whimsy |
| Name integration | 2/5 | Name inserted, not woven in |
| Replayability | 1/5 | Nothing memorable enough to want again |

Same playtest in Entry 002 with a v1.18.0 kid Goofy Shorts template scored **5/4/5/5/5**. The diagnosis was clear: extend Goofy Shorts to the little tier.

**Implementation:**
- All 7 little tier templates replaced with **8 new Goofy Shorts: Little Edition templates** (Talking Thing Under Bed, Sneaky Snack, Magic Word, Loud Pet, Bouncy Disaster, Funny Sandwich, Talking Hat, Stuck Creature)
- Same structural rules as kid Goofy Shorts:
  - 4 paragraphs (little `PARAGRAPH_LIMIT` dropped 5→4)
  - Sidekick (user-defined or `DEFAULT_SIDEKICKS` fallback) **drives** the action — not a 60% grafted cameo
  - `SILLY_ADJ` + `SILLY_NOUN` combo as central absurd thing
  - Freeword appears 2–3× as shoutable spell / chant / closer
  - Punchline ending woven into the prose
- Simplified for 4–5 year olds: shorter sentences, heavier repetition, more onomatopoeia (BOING, BONK, CHOMP), bedtime-friendly endings
- `injectTierAside` + `injectSidekick` (the 60% cameo) now skipped for **both kid and little** tiers — the failing adult-ironic asides ("the wind agreed politely", "a small flower nodded along") that Entry 001 flagged are now disabled for ages 4–7
- Entry 001's exact failing prose ("Or maybe just a little brave. We'll see.", "a bee flew by carrying a tiny suitcase. Nobody knew why. Nobody asked.") is gone from the codebase

**Smoke test (200 little stories, age 5):**
- 4 paragraphs per story
- 0 grammar issues
- ≥2 freeword shouts per story
- Sidekick name present
- Zero matches for the Entry-001 failing phrases

---

## v1.18.3 — 2026-05-15
**Version badge nudged left to clear mobile corner cutoff**

Badge was getting clipped by rounded corners / notch safe area on mobile. Bumped `#version-badge` right offset 12px → 24px.

---

## v1.18.2 — 2026-05-15
**Fix: duplicate "The End" at story close (defect log entry)**

Bug filed in the Defect Log database: every story ended with "The End" twice — once inside the last paragraph (template-hardcoded "THE END." for kid tier, "The end! 🌟" for tot tier) and once again as the renderer's `<p class="story-end">✦ The End ✦</p>` marker. The narrator was reading both. Visually doubled too.

**Root cause:** "The End" had two sources of truth — string templates and the story screen display component.

**Fix:** Stripped the in-paragraph end markers from 8 kid Goofy Shorts templates + 5 tot templates (13 instances total via two `replace_all` passes). The renderer's `✦ The End ✦` is now the single source of truth, paired with the dramatic elongated TTS closer added in v1.16.2 (`Theeeeeeeeeeeee... End.`).

**Karaoke check:** Word-count alignment between DOM and TTS-spoken text stays in sync because both lose the same words (kid templates lost "THE" + "END" → 2 words; tot templates lost "The" + "end" → 2 words). The `.story-end` paragraph still gets karaoke-wrapped by `wrapStoryWords()` at line 2341.

**Verification:** `grep -n " The end[!.]\\| The End[!.]\\| THE END[!.]"` returns zero matches across the entire codebase.

---

## v1.18.1 — 2026-05-15
**Name persistence — skip the "What's your name?" prompt on repeat sessions**

Back-to-back bedtime stories were friction-laden because every "Start over" forced a re-type of the kid's name. v1.18.1 fixes the multi-story session flow.

**What changed:**
- `state.name` now persists to `localStorage` under key `nt_name` on every keystroke (mirrors how `nt_sidekicks` already works).
- `loadName()` runs on init and pre-populates `state.name`.
- `resetApp()` no longer clears `state.name` — it preserves the saved name and sets `welcomeStep` to `'age'` so the user skips the name prompt entirely.
- On the name step (reached via "← back" from the age screen), a saved name now renders as a sidekick-style chip with an × button. The heading changes from "What's your name?" to "Hi again, {name}!" and the helper copy tells the user how to change it. Tap × to clear and re-enter.

**Behavior summary:**
- First-time user: standard "What's your name?" prompt → age → sidekicks → story
- Returning user (same device, same name): "Start over" → straight to age → sidekicks (already populated too) → story
- Edit path: "← back" from age → chip × → empty input returns

Nothing about the kid Goofy Shorts content from v1.18.0 changes. This is pure UX speed-up for parents reading multiple stories in one session.

---

## v1.18.0 — 2026-05-15
**Goofy Shorts — kid tier rewrite (the playtest fix)**

Playtests with actual 6–7 year olds revealed the kid tier had been drifting toward adult-ironic humor over 19 versions. Stories weren't funny to the audience they were built for. v1.18.0 is a ground-up kid-tier rewrite to the voice kids actually laugh at.

**The four rules behind the rewrite:**
1. **Shorter.** Kid `PARAGRAPH_LIMIT` dropped 5 → 4. Bedtime-length, no padding.
2. **Sidekick drives the action.** Every kid story features a named sidekick (user-defined or default) who is in the prose driving the plot — not a 60%-chance grafted-on cameo.
3. **Silly adjective + silly noun is the joke.** New auto-pools `SILLY_ADJ` (24 entries: wobbly, stinky, boingy, squishy…) and `SILLY_NOUN` (24 entries: pickle, sock, pancake, underpants…) combine into the central absurd object of every story.
4. **Freeword becomes a shoutable spell.** The user's typed word appears 2–3× per story as a yelled spell, codeword, magic incantation, or repeated chant. Every story has at least one line kids can shout along with.

**Templates:** 18 old kid templates → **8 new Goofy Shorts templates** (The Talking Thing Under the Bed, The Snack Heist, The Magic Word, The Loud Pet, The Bouncy Disaster, The Wrong Sandwich, The Underpants Emergency, The Mysterious Burp).

**Tier-specific changes:**
- Adult-ironic asides and the 60% sidekick-cameo injection are now **skipped for kid tier only**. Both still fire for tot/little/big/tween where they land correctly.
- New `DEFAULT_SIDEKICKS` pool (Maya/Jake/Sam/Riley/Ben/Emma/Theo/Ava) so a sidekick name is always available even when the user hasn't added one.
- `FW_SAFE` guarantees a shoutable string (falls back to KAPOW/ZINGO/etc. when the user skipped freeword).

**Smoke test (200 random kid stories, age 6):**
- 100 unique titles (titles parameterize on SADJ + STHING)
- 0 paragraph-count violations (all 4 paragraphs)
- 0 grammar issues (article/plural/vowel/verb-form)
- 0 stories missing 2+ freeword shouts
- 0 stories missing a sidekick name

Other tiers (tot/little/big/tween) untouched and verified non-regressed.

---

## v1.17.0 — 2026-05-15
**5 new kid templates — story-shape variety**

The kid pool had 13 templates, which meant noticeable repetition for users who play multiple stories per session. Added 5 new templates with story shapes not previously covered:

- **#14 The Trade of the Century** — Cole negotiates with a creature; stakes escalate (47-free-hats deals, mystery chickens). New shape: barter/negotiation.
- **#15 The Case of the Missing [Object]** — Cole loses an object, uses the auto-injected OBJ as a callback motif across all 5 paragraphs. New shape: search-and-find.
- **#16 The Day Cole Won a Race (Accidentally)** — Wrong-place-wrong-time triumph. Pasta medals. New shape: accidental victory.
- **#17 The Visitor Who Wouldn't Leave** — A creature shows up uninvited for "the visit", eats everything for three days. New shape: visitor-who-overstays.
- **#18 Cole's Surprise Performance** — Pushed onto a stage with no preparation, improvises a hit. New shape: improv-under-pressure.

All 5 use the existing vocabulary (PET, CRE, OBJ, JOB, NUM, ADV, MOV, etc.) so they automatically benefit from sidekick injections, tier-aware asides, Mad Libs auto-injects, and karaoke highlighting.

**Title diversity in random sampling:**
- Before: 35 unique titles across 200 stories
- After: **47 unique titles across 200 stories (+34%)**

**Grammar verification:** 0 issues across 200 stories. New templates correctly handle plural/vowel article cases, gerund/base-verb tense, and Mad Libs token substitution.

---

## v1.16.2 — 2026-05-15
**Dramatic "The End" — elongated closer with finality**

The narrator was saying "The End" at normal speed (~0.6s total). Now it stretches dramatically:

- TTS text suffix changed from `"\n\nThe End."` to `"\n\nTheeeeeeeeeeeee... End."`
- Repeated `e`s tell ElevenLabs to elongate the vowel (~2-2.5s on "Thheeeeeeeee")
- Ellipsis adds a beat of silence (~0.5s)
- Period on `End.` gives natural sentence-end finality

Net duration: ~3 seconds of dramatic closure instead of 0.6s normal speech.

The rendered "✦ The End ✦" in the DOM is unchanged — still reads clean visually. The karaoke highlight on "The" stays lit for the full elongation (because the word indices map TTS-word-N → DOM-word-N regardless of spelling), then jumps to "End" for the final beat. Visually you see "**The**" hold for ~2.5 seconds, then "**End**" land.

Side effect: IndexedDB audio cache invalidated for all stories (SHA-256 of the TTS text changed). Users get one cache miss per story after deploy, then everything's fast again.

---

## v1.16.1 — 2026-05-15
**Logo composition fix + little tier emoji deduplication**

**Logo:** the book at the bottom of the app icon was sitting almost flush with the bottom border — only 4px of bottom margin out of 1024 in `icon.svg` / `icon-square.svg`, and 2px out of 64 in `favicon.svg`. Lifted the book group up and scaled it slightly so it floats with proper breathing room:

- `icon.svg` / `icon-square.svg` (1024×1024): book group transform changed from `translate(512 800) rotate(-3)` → `translate(512 728) scale(0.88) rotate(-3)`. Bottom margin now 120px (11.7%) instead of 4px.
- `favicon.svg` (64×64): book rects lifted from y=50 → y=46, spine from y=48 → y=44. Bottom margin now 8px (12.5%) instead of 2px.
- All 10 PNG variants (`icon-76/120/152/180/192/512/1024.png` and `favicon-16/32/48.png`) regenerated from the updated SVGs.

**Emoji cleanup (Codex #3 light):** the little tier had `turtle 🐢` and `bunny 🐰` in **both** the pet AND creature rounds. Same emoji could appear in two rounds back-to-back. Replaced creature `turtle` with `butterfly 🦋` and creature `rabbit` with `mouse 🐭` — both fit the little-tier friendly-animals vibe.

---

## v1.16.0 — 2026-05-15
**Callback motif tracking (Codex Option A, item #8)**

Codex's example: pick a story-specific motif (a phrase, an object, a rule) and reuse it 2-3 times in escalating contexts. "Setup: 'no soup after moonrise.' Escalation: 'You brought soup after moonrise?' Payoff: 'Nice soup.'"

That repetition is what makes generated stories feel authored, not assembled.

**What changed:**
- New `RULES` pool — 12 absurd rules ("no soup after moonrise", "always say hello to ladybugs", "whoever finds the spoon makes the rules", "three hops before any door", etc.)
- `RULE` picked once per story in `buildStory`, available to kid templates
- New kid template **#13 The Time [Name] Broke a Rule** structured as a classic callback:
  - **P1 (setup):** The rule is introduced — "Nobody ever questioned: 'whoever finds the spoon makes the rules.'"
  - **P3 (violation):** The protagonist breaks it — "'whoever finds the spoon makes the rules,' the knight whispered, horrified. 'You... you BROKE it?'"
  - **P5 (payoff):** The universe weighs in — "Honestly? Whoever finds the spoon makes the rules was a stupid rule. Don't tell anyone I said that."

**Sample fragment from a live generation:**
> *Cole tiptoed past the sign on a perfectly ordinary morning... Then Cole did it. Right there. In broad daylight. They broke the rule. A passing knight gasped. "whoever finds the spoon makes the rules," it whispered, horrified...*

**Carries into v2.0:** The motif-tracking concept (pick a story-specific element, reference it 2-3x) becomes a property of beat cards in the rich-objects architecture. Implementation rewrites; design pattern persists.

---

## v1.15.0 — 2026-05-15
**Semantically-routed freetext (Codex Option A, item #11)**

Codex's recommendation: instead of every freetext prompt landing as a generic "shouted catchphrase", typed prompts should produce typed values. "Name a smell that means trouble" should let the story use the input AS a smell, not just quote it.

**What changed:**
- All 16 kid freetext prompts tagged with a `subtype`: `shout` (default), `smell`, `name`, `dance`, `word`. The picker UI is unchanged; the subtype is metadata on the prompt.
- `submitFreeText` now propagates the subtype through `state.picks.freeword.subtype`.
- `buildStory` exposes `FW_SUBTYPE` so templates can route the freeword semantically.
- Two new kid templates added that ONLY fire when their subtype is matched:
  - **#11 The Smell That Followed [Name] Home** — fires when subtype is `smell`. Uses the freeword as a literal smell that follows the kid around. ("A faint whiff of burnt toast. Annoying. Mysterious. Persistent.")
  - **#12 The Legendary [Freeword]** — fires when subtype is `name`. Uses the freeword as the actual name of a creature the kid discovers. ("Cole declared the knight's name to be Sir Grumblebottom. The knight tried it on. It fit perfectly.")
- Template selection filter: `templates.filter(t => !t.tags || t.tags.includes(FW_SUBTYPE))`. Untagged templates (the existing 10) remain compatible with every subtype. Tagged templates only fire for their matching subtype.

**Routing verification (200 stories per subtype):**
- `shout` picks: 0 smell-template hits, 0 name-template hits (never leaks)
- `smell` picks: ~10% smell-template hits (1-in-11 odds with 11 eligible templates)
- `name` picks: ~9% name-template hits (same)

**Carries forward into v2.0:** The subtype taxonomy and prompt tags survive the rich-word-objects rebuild. Template routing changes (from filter-by-tags to beat-recipe selection) but the semantic distinction persists.

---

## v1.14.1 — 2026-05-15
**Grammar hardening pass — Codex re-review fixes**

Codex's re-verification of v1.13.0 caught three real bugs the prior pass introduced or missed. All three structurally fixed now.

**Verb tense contract (was: "loved to hopped", "started to clapped")**
v1.11.2 converted tot/little move pools to past tense, but three templates use those verbs in base-verb contexts ("loved to X", "started to X", "learned how to X"). Added a small `VERB_FORMS` lookup table covering all 55 move-pool entries (past → base + gerund) and new `MOV_BASE` / `MOV_GERUND` derived alongside `MOV` in buildStory. Templates needing the right form use `[c:${MOV_BASE}]` / `[c:${MOV_GERUND}]` instead of `[c:${MOV}]`.

**Gerund contract (was: "set off cartwheeled into the basement")**
One tween template uses "set off [MOV]" which requires gerund form. Now uses `MOV_GERUND` ("set off speed-running" instead of "set off speed-ran").

**Adjective + plural article (was: "an electric blue tacos")**
v1.13.0's `fixArticles` only inspected the FIRST token after the article, so `a [c:electric blue] [c:tacos]` saw "electric blue", checked vowel only, became "an electric blue tacos". Single regex pass now matches the entire noun phrase (article + one-or-more contiguous tokens), looks at the LAST token for plural detection and the FIRST token for vowel detection. Plural overrides vowel since "some" works regardless of following sound. Added `NOT_PLURAL_RE` to skip singular -s/-us/-ous false positives (octopus, mysterious, the back of the bus, bonkers).

Verified across 1000 randomly-picked stories per tier and explicit unit tests: 0 occurrences of any flagged pattern.

---

## v1.14.0 — 2026-05-15
**Karaoke that actually karaokes**

The word-by-word highlighting was technically built in v1.7.0 but two real problems hid it:

1. **Visual was too subtle.** A soft yellow tint on cream paper — easy to miss. Now the active word pops with a saturated orange background, bold white text, a drop shadow, and a quick bounce animation as the highlight moves between words.
2. **Timing was approximate.** v1.7.0 used proportional char-count estimation against `audio.duration`. Drift accumulated through 30-second stories.

**Switched to ElevenLabs' `/with-timestamps` endpoint** which returns real character-level start/end times alongside the audio. Word timings are now exact, not estimated:

- `api/tts.js` calls `/text-to-speech/{voice}/with-timestamps`, returns JSON `{audioBase64, alignment}`
- `TTSManager` parses JSON, decodes base64 to a Blob, and stores `{audio, alignment}` together in IndexedDB
- New `buildAlignmentTimings()` walks the TTS text and maps each word to its exact start/end seconds using the alignment data
- Falls back to proportional estimation if alignment is missing (legacy cache, API error)

**IndexedDB schema bumped v1 → v2.** New store `audio-v2` holds combined `{audio, alignment}` per story-hash. The old `audio-cache` store with bare blobs is left orphaned (no migration needed — users get one cache miss after deploy, then everything's fast).

Trade-off accepted: response payload is ~33% larger because base64 audio. Worth it for sync that doesn't drift.

---

## v1.13.0 — 2026-05-15
**Tier-aware engine touches — Codex review polish pass**

The aside injection system was kid-only and pulled from one bank. Every tier now has its own joke logic, per Codex recommendation #12:

- **Tot:** gentle repetition (`Boop!`, `Heehee.`, `Everybody blinked twice.`, `Even the sun smiled.`)
- **Little:** tiny-world whimsy (`Nobody knew why!`, `The wind agreed politely.`, `A small flower nodded along.`)
- **Kid:** Mad Libs token mix (object / number / liquid / job / adverb asides — keeps the v1.12.0 lift)
- **Big:** bureaucratic mock-serious (`A stamp appeared. Nobody had requested one.`, `The hallway filed a complaint.`, `There was a form for this, which made it worse.`)
- **Tween:** deadpan internet-voice (`Nobody had asked.`, `The vending machine had feedback. None of it constructive.`, `Iconic.`)

**Sidekick frequency 100% → 60%.** Codex flagged that always-on cameos felt grafted. Now ~60% of stories include a sibling/friend, so when they appear it feels earned.

**Smart plural-article handling.** `fixArticles` now runs a second pass: any `a [plural]` or `A [plural]` (detected by `-s` ending, excluding mass nouns like cheese/juice/broth) converts to `some [plural]` or `Some [plural]`. Kills "a tacos" / "a pretzels" / "a donuts" structurally.

**Kid creature pool cleanup.** Per Codex #3, `detective`, `time traveler`, `royal jester` are roles not creatures. Replaced with `phoenix`, `centaur`, `banshee`.

DEFERRED (still queued for v2.0): rich word objects, beat cards, callback motif tracking, plural/count metadata on every pool entry.

---

## v1.12.0 — 2026-05-15
**Mad Libs comedy categories — Codex peer-review recommendations (top 5)**

Per Codex's peer review, the highest-leverage Mad Libs categories added as auto-injected pools (no UI changes — story content gets richer automatically):

- **OBJECTS** — 12 absurd objects: clipboard, suspicious envelope, tiny key, noisy spoon, haunted lunchbox, emergency kazoo, apology balloon, dramatic cape, pocket-sized door, glittery helmet, sleepy megaphone, map covered in crumbs
- **ADVERBS** — 12 comedic modifiers: suspiciously, sideways, with great confidence, for unclear reasons, professionally, accidentally on purpose, extremely slowly, in a hurry, backwards, politely but firmly, with concerning enthusiasm, somehow
- **NUMBERS** — 12 oddly-specific numbers: seventeen, twenty-three, eleventy-eight, one and a half, exactly forty-two, nine plus three, too many, a small but specific number of, three (allegedly), eight thousand, a polite handful of, six (rude)
- **LIQUIDS** — 12 absurd liquids: pickle juice, moon milk, glitter lemonade, warm soup, rainbow water, questionable broth, extremely loud orange juice, emergency apple juice, haunted iced tea, formally polite hot chocolate, thunder soda, a single tear
- **JOBS** — 12 fake titles: official puddle inspector, assistant cloud dentist, sandwich lawyer, emergency hat consultant, junior moon accountant, certified dragon whisperer, substitute wizard, snack detective, hallway mayor, professional button counter, royal nap supervisor, chief sock investigator

**Two new kid templates** showcase the lift:
- **#9 The Wrong [Liquid] Delivery** — Cole has to deliver N jars of X to a fake-job-holder. Uses NUM, LIQ, JOB, OBJ, ADV tokens prominently.
- **#10 [Name] Becomes a [Job] by Accident** — Cole gets accidentally promoted into a job they don't have. Same token set.

**Existing templates** auto-inject the new pools via the enriched aside bank — 7 aside variants now draw from SILLY_THINGS, OBJECTS, NUMBERS, LIQUIDS, JOBS, and ADVERBS so every kid story surfaces the new vocabulary somewhere.

Sample from v1.12.0:
> *"Riley had ONE job: deliver three (allegedly) jars of questionable broth to a hallway mayor."*
> *"eight thousand uniforms appeared. So did a sleepy megaphone."*

---

## v1.11.2 — 2026-05-15
**Bug pass from Codex peer review**
- Fixed literal `[PET]` token in little tier "Pet That Forgot Everything" template — was rendering raw markup instead of substituting.
- Fixed `trimToLimit` regression from v1.11.1: was cutting load-bearing climax paragraphs. New formula keeps first 2 (setup) + last (limit−2) so payoff/resolution/closer all survive.
- Stripped pre-articles from tween creature pool: `the algorithm` → `algorithm`, `a very confident rat` → `very confident rat`. Killed the "The the algorithm" / "A a very confident rat" doubling.
- Past-tense fix for tot + little move pools (24 entries): "they hop home" → "they hopped home". Same fix that landed for kid in v1.8.0; was missed on the smaller-tier pools.
- Removed non-verb-phrases from big move pool: `stood dramatically still` → `spun ceremoniously`, `paused for effect` → `shuffled importantly`.
- Replaced broken tween moves: `immediately regretted` (transitive, needs object) → `gracefully bailed`. `said nothing and left` (full sentence) → `reluctantly arrived`.
- Removed body parts from BODY_PG: `armpit`, `belly button` (don't work as "did a loud X" events) → `yawn`, `sniffle`.
- Replaced `famously wrong recipe` in big food (not actually a food) → `extremely bold lasagna`.

---

## v1.11.1 — 2026-05-15
**Shorter stories across all tiers**
- v1.11.0 additions (silly thing + sidekick asides) had pushed average story length up. Bedtime target is 30–45 seconds of TTS — most tiers were running 60+ seconds.
- New per-tier paragraph cap (`PARAGRAPH_LIMIT`): tot 5 / little 5 / kid 5 / big 6 / tween 6. Long templates auto-trim to keep opening (setup) and final (closer), clipping middle paragraphs.
- All 8 kid templates rewritten with tighter prose — sentences shorter, redundant phrasing dropped.
- Silly-thing and sidekick asides shortened to one-clause form (e.g. `(Plus Sam.)`, `(Nearby: a sock with opinions.)` instead of two-sentence cameos).
- Result: little **−29%** (145 → 103 words), kid **−16%** (135 → 114), big **−31%** (180 → 124), tween **−24%** (160 → 121). Tot unchanged (already short).

---

## v1.11.0 — 2026-05-15
**Bigger word library + always-on silliness (no toggle required)**
- All 7 kid-tier word pools expanded 12 → 18 options. New picks include:
  - **pet:** octopus, hedgehog, axolotl, llama, sloth, koala
  - **color:** tomato red, lemon yellow, watermelon pink, mint green, sunset orange, midnight blue
  - **food:** spaghetti, popcorn, hot dogs, pancakes, cupcakes, french fries
  - **place:** treehouse, lighthouse, carnival, aquarium, planetarium, bakery
  - **creature:** vampire, fairy, dinosaur, detective, time traveler, royal jester
  - **move:** shimmied, wobbled, marched, stomped, danced, sprinted
  - **mood:** cozy, suspiciously polite, professionally confused, ridiculously cheerful, sleepy, jubilant
- New SILLY_THINGS auto-inject pool — every kid story now drops a random absurd object as a parenthetical aside ("a sock with strong opinions", "a slightly haunted spoon", "a tiny philosophical mushroom", etc.). Stories stay silly even when Extra Silly mode is OFF.
- SOUND_PG expanded 12 → 18 (added POOF, ZINK, PLOP, YIKES, BANG, WHEE) so the same SPLAT/BOING doesn't repeat as often.
- Fixed emoji duplicate in kid/food: grilled cheese 🧀 → 🥪 (was duplicating nachos 🧀).

---

## v1.10.0 — 2026-05-15
**Sidekicks: friends and siblings in the story**
- New welcome step after age: "Anyone you want in the story?"
- Add up to 3 names (chips with × to remove); persisted in `localStorage` so you don't re-type each session
- One random sidekick per story gets a cameo line — different sidekick each generation, so over multiple stories everyone shows up
- 8 cameo variants for variety ("Also there: Sam, obviously.", "showed up uninvited. Nobody minded.", etc.)

---

## v1.9.1 — 2026-05-15
**Emoji/word audit — 14 mismatches fixed**
- **Critical:** churros 🥐 (croissant) → burritos 🌯; bounce ⚡ → 🏀; flop 🌊 → 🐟; firefly 🌟 → bee 🐝; marshmallows 🍡 (dango) → candy 🍬; canyon ⛰️ (mountain) → 🏞️; skip 🌈 → march 🥁
- **Duplicates:** sandbox 🏖️ (duplicated beach) → 🪣
- **Consistency:** gold/silver across 3 tiers now use 🥇 🥈 instead of generic stars/sparkles

---

## v1.9.0 — 2026-05-15
**Potty toggle now visible in selection + content punch-up**
- Potty mode ON adds two new picker rounds: pick a body word (FART vs BUTT, etc.) and pick a chaotic sound (KAFOOM vs SCHPLAT, etc.). Toggle has real visible effect on the flow.
- 12 hot body × 12 hot sound options with emoji pairings, drawn from `BODY_HOT_OPTS` / `SOUND_HOT_OPTS`
- All 8 kid templates rewritten with punchier rhythm: shorter sentences, more dialogue, CAPS for emphasis, FW word used 2-3× as a real callback, sharper closers
- Killed the `""STABBY-STAB!"!"` double-quote bug structurally (templates own the punctuation, not the variable)
- Kid freetext pool expanded 10 → 16 prompts

---

## v1.8.0 — 2026-05-15
**Kid-tier content overhaul + potty mode toggle**
- All 8 kid templates rewritten with P1→P6 structure (setup → active child → escalation → body-humor beat → callback → big payoff)
- New BODY pool (12 PG: toot, burp, wedgie, hiccup, etc.) and SOUND pool (12: SPLAT, BOING, KERPLUNK, etc.) auto-injected into every story
- HOT pools (fart, poop, butt, PFFFFART, FAAAARP) when potty toggle is on
- Fixed kid MOV grammar (gerunds → past tense): "They tiptoeing" → "They tiptoed"
- Added `fixArticles()` — auto-corrects "a [c:otter]" → "an [c:otter]" across all 5 tiers
- Plural-food handling restructured ("a tacos" → "some tacos")

---

## v1.7.1 — 2026-05-14
**Narrator speaks "The End" + warmer voice settings**
- Appended "The End." to TTS text with paragraph-break pause — narrator now closes every story aloud
- Extended `wrapStoryWords()` so karaoke covers `.story-end` ("The" and "End" illuminate as spoken)
- Voice settings tuned: stability 0.72 → 0.80, similarity 0.85 → 0.90, style 0.40 → 0.20 (steadier, warmer)

---

## v1.7.0 — 2026-05-14
**Karaoke word highlighting synced to TTS playback**
- `wrapStoryWords()` walks the DOM after speak starts, wraps every word in `<span class="kw" data-wi="N">`
- Proportional timing weighted by character count across full audio duration
- `requestAnimationFrame` loop advances the highlighted word based on `audio.currentTime`
- Works with the existing ElevenLabs audio + IndexedDB cache — zero API changes

---

## v1.6.1 — 2026-05-14
**Silliness punch-up + longer little-tier stories**
- Tot tier: 4 → 5 paragraphs, more absurd humor
- Little tier: 5 → 7 paragraphs, bigger silly
- Replaced 4 atmospheric big/tween templates that read too earnest

---

## v1.6.0 — 2026-05-14
**Story templates 3 → 8 per tier (25 new templates) + content library expansion**
- WORD_BANK expanded 6 → 12 options per category
- FREE_TEXT_ROUNDS doubled for kid/big/tween
- Emoji bug fixes (axolotl, gecko/chameleon duplicate)
- 185 unique titles across 250 random generations verified

---

## v1.5.0 — 2026-05-13
**ElevenLabs TTS narrator with IndexedDB cache**
- Replaced Web Speech API with ElevenLabs `eleven_turbo_v2_5` via Vercel serverless proxy (`api/tts.js`)
- Voice: George (JBFqnCBsd6RMkjVDRZzb) — warm British male
- Audio cached in IndexedDB keyed by SHA-256 hash of full story text
- Silent fallback on API failure; Vercel Analytics added
