# NoddyTales

A bedtime-and-anytime story generator for kids ages 2–13. Kids pick a name, age, sidekicks, and a setting, then tap through binary word-choice cards. A personalized silly story assembles locally from the picks, gets read aloud in the kid's chosen narrator voice (Sunny / Storybook / Adventure / Silly) with word-by-word karaoke highlighting, and ends with either bedtime imagery or a "what happens next" hook depending on the chosen story mode.

**Live:** [noddytales.app](https://noddytales.app)
**Test audience:** Cole and Olivia.

## How it works

1. Enter a name and pick an age (2–13)
2. Pick sidekicks (pets / friends / family that show up in the story)
3. Pick a setting (Surprise Me, Home, Forest, Beach, Diner, Mall, etc.)
4. Pick a story mode (**Bedtime** — ends with sleep imagery, or **Anytime** — ends with a "what happens next" hook)
5. Tap through binary word-choice cards (5–9 rounds depending on age tier)
6. A personalized story assembles locally from the picks, with chosen words highlighted inline
7. Tap **Read it to me** — ElevenLabs narrates the story with word-by-word karaoke highlighting

## Age tiers

| Ages   | Tier    | Rounds | Notes                                                                  |
|--------|---------|--------|------------------------------------------------------------------------|
| 2–3    | tot     | 6      | Emoji + single-syllable words; all tap, no free-text                   |
| 4–5    | little  | 7      | Sight words + silly-sound tap round (no free-text typing)              |
| 6–7    | kid     | 8      | Silly-sound tap round + "or type your own ✏️" escape hatch; v3 default |
| 8–10   | big     | 9      | 2 free-text rounds; v3 default                                         |
| 11–13  | tween   | 9      | Older-skewing vocab + beats; 2 free-text rounds; v3 default            |

## Story engines

- **v3 (default for every age 2–13, since v3.0.0)** — role-based engine with 8 blueprints covering every age tier:
  - ages 6-13 (kid/big/tween): `lost_snack_v3`, `goal_spine_v3`, `show_wrong_v3`, `rule_loophole_v3` — 4-stage / 6-paragraph arcs with declarative role maps, token-direct authoring, stage progression.
  - ages 2-5 (tot/little, since v2.10.0): `tot_wonder_v3`, `tot_sky_v3`, `little_quest_v3`, `little_food_v3` — simplified 3-role contract (protagonist / ally / wonder_object) / 4-paragraph arcs.
- **v2 (silent fallback)** — the authored comedy engine that was the production default v2.0.0 → v2.10.2. Retained in code as a runtime fallback. Scheduled for deletion in engine `v3.1.0` (the formerly-queued "delete v2 codepath" Build Idea, see versioning section).
- **v1 (deprecated)** — template-substitution engine. Reachable only if both v3 and v2 return null. Emits a console deprecation warning when it fires. Scheduled for removal alongside v2.

## Versioning

NoddyTales tracks **three independent versions** (adopted 2026-05-21, see [`docs/versioning.md`](docs/versioning.md)):

1. **`APP_VERSION`** (`v0.9.3`) — user-facing **product maturity**. `v0.9.x` = late beta, pre-App-Store. `v1.0.0` is reserved for public App Store launch. Shown in the in-app badge.
2. **`ENGINE_V2_VERSION`** (`v3.0.3`) — internal **engine architecture** lineage. Bumps on engine-arch changes (e.g., v2 deletion → `v3.1.0`). Visible in DevTools / CHANGELOG context only; **not** in the badge.
3. **`BUILD_NUMBER`** (`22`) — increments every release shipped to `main`. Shown in the badge alongside the product version as `v0.9.3 · b22`. (Sequence so far: `b1` versioning policy → `b2` Phase 1 sound tap round → `b3` Phase 4 shuffle 🎲 button → `b4` highlight defect fix → `b5` brand icon refresh → `b6` in-app mark contrast → `b7` QA cleanup → `b8` Narrator Voice Selector MVP → `b9` Setting 2.0 → `b10` narrator-on-story + voice previews → `b11` Setting 2.0 mobile compact → `b12` Setting 2.0 polish + rainbow fix → `b13` animal-emoji audit → `b14` QA hardening → `b15` picker library polish → `b16` narrator lineup refresh → `b17` hardcoded per-preset voice defaults → `b18` Silly Cartoon swap + first story-length pass → `b19` favicon stale-cache hardening → `b20` narrator label rename + structural kid 6→5 → `b21` rainbow deco reposition → `b22` voice cache versioning + signature observability.)

CHANGELOG entries from v0.9.3 forward use the four-part header `## vX.Y.Z (build N, engine vA.B.C) — DATE`. Historical v3.0.0–v3.0.3 entries stay as-is for traceability — we don't rewrite history.

## Stack

- Vanilla HTML/JS single-page app (no framework, no build step for the core app)
- ElevenLabs TTS via Vercel serverless proxy (`api/tts.js`) — uses the `/with-timestamps` endpoint to deliver per-character timing for karaoke highlighting
- IndexedDB audio + alignment cache (DB `noddytales-tts`, store `audio-v2`) — replayed stories don't re-fetch from ElevenLabs
- localStorage profile (`nt_name`, `nt_age`, `nt_sidekicks`, `nt_setting`, `nt_potty_mode`, `nt_story_mode`, `nt_voice_preset`)
- Deployed to Vercel from the `main` branch

## Local dev

The static app runs straight from the file system, but TTS requires the Vercel proxy:

```bash
# Static-only (TTS will fail silently — picker + story render still work):
open index.html

# Full local dev including TTS proxy (recommended):
vercel dev
```

Required environment variables for TTS (set in Vercel dashboard or `.env.local` for `vercel dev`):

- `ELEVENLABS_API_KEY` — your ElevenLabs API key
- `ELEVENLABS_VOICE_ID` — legacy universal default. Optional in b17+ because every preset has a hardcoded `defaultId` in `api/tts.js`; kept as a final safety net if a future code change ever removes a per-preset default

### Narrator voice lineup

NoddyTales offers **4 narrator presets** (since v0.9.3 · b8; labels simplified in `b20`). Pick in Parent Settings or via the story-screen `Change` button. UI labels describe the **performance style** — accent / origin of the underlying ElevenLabs voice is an implementation detail, not user-facing.

| Preset key | Label | Vibe | Env var (optional override) |
|---|---|---|---|
| `sunny` (default) | **Sunny** | Warm, clear, everyday reader | `ELEVENLABS_VOICE_SUNNY` |
| `cozy` | **Storybook** | Classic bedtime narrator | `ELEVENLABS_VOICE_COZY` |
| `adventure` | **Adventure** | Bold, energetic, exciting | `ELEVENLABS_VOICE_ADVENTURE` |
| `silly` | **Cheerful** | Bright, warm, lifts the mood | `ELEVENLABS_VOICE_SILLY` |

> **Note on the `silly` preset key:** the user-facing label was renamed `Silly` → `Cheerful` in b23 (the previous "high-pitched cartoon" brief never landed; Mimi's actual voice quality reads as bright + warm and lands cleanly as "Cheerful"). The preset **key** stays `silly` so saved `nt_voice_preset` values, the `ELEVENLABS_VOICE_SILLY` env-var name, and the IndexedDB cache (`preview:v2:silly`, `v2:silly|<sha>`) all survive the rename.

### Setup checklist (Vercel)

Only one env var is **required** for TTS to work at all (since b17):

1. ☑ `ELEVENLABS_API_KEY` — your ElevenLabs API key
2. ⬜ `ELEVENLABS_VOICE_ID` — legacy universal default (optional in b17+; safety-net only)

Since `v0.9.3 · b17`, all four presets ship with **ElevenLabs stock voice IDs hardcoded** as `defaultId` in `api/tts.js`'s `VOICE_MAP`. A fresh deploy with **no preset env vars set** produces **4 distinct preview voices** automatically.

- sunny → **Rachel** (`21m00Tcm4TlvDq8ikWAM`) — calm narration
- cozy → **George** (`JBFqnCBsd6RMkjVDRZzb`) — warm mature narrative
- adventure → **Antoni** (`ErXwobaYiN019PkySvjV`) — well-rounded, expressive
- silly → **Mimi** (`zrHiDhphv9ZnVXBqCLjz`) — bright, warm, lightly accented (the intended **Cheerful** voice since the b23 rebrand; previously documented as a backstop while the preset chased a "high-pitched cartoon" brief that never landed)

### Optional: override any preset

If you want to swap any preset to a different ElevenLabs voice, set the matching env var. The per-preset env var **beats** the hardcoded default:

- `ELEVENLABS_VOICE_SUNNY` — overrides Rachel
- `ELEVENLABS_VOICE_COZY` — overrides George
- `ELEVENLABS_VOICE_ADVENTURE` — overrides Antoni
- `ELEVENLABS_VOICE_SILLY` — overrides Mimi (env-var name kept for backward compatibility with the preset's historical `silly` key, even though the user-facing label is now "Cheerful")

Voice IDs are **server-side only** — the browser never sees them. Per-preset `voice_settings` (stability / similarity / style) layer per-preset moods on top of the voice ID.

### Priority chain (api/tts.js `resolveVoice`)

```
1. env[ELEVENLABS_VOICE_<PRESET>]   ← operator per-preset override
2. cfg.defaultId                     ← per-preset hardcoded curated voice
3. env.ELEVENLABS_VOICE_ID           ← legacy universal fallback
4. 'JBFqnCBsd6RMkjVDRZzb' (George)   ← final backstop
```

Levels 3–4 are effectively unreachable for the 4 known presets (every preset has a `defaultId` since b17).

### Troubleshooting: all previews sound the same

If parents report that **all 4 voice preview buttons play the same narrator**, work through these in order:

#### 1. Stale IndexedDB preview cache (most common since b8–b21)

The browser caches each preview clip the first time it's played. Until b22 the cache key was unversioned (`preview:sunny`, `preview:cozy`, ...) so any audio cached during a misconfigured deploy (typically one where production env vars collapsed all 4 presets to George) replays from cache forever — even after the resolver chain is fixed.

**Diagnostic:** open `https://noddytales.app/` in Chrome → DevTools → Application → IndexedDB → `noddytales-tts` → `audio-v2`. If you see entries keyed `preview:sunny` / `preview:cozy` / etc. **without** a version prefix, those are stale pre-b22 blobs.

**Fix (since b22):** ship a bumped `VOICE_CACHE_VERSION` in `src/content.js`. New cache keys (`preview:v2:sunny`, `v2:sunny|<sha>`, ...) miss the stale blobs and force `/api/tts` re-fetches. **No manual user action required.** Stale orphans get GC'd by the browser's IndexedDB quota policy.

#### 2. Vercel env var collapse

If two or more of `ELEVENLABS_VOICE_SUNNY` / `_COZY` / `_ADVENTURE` / `_SILLY` / `_ID` point to the same ElevenLabs voice ID, the resolver will dutifully return that voice for every colliding preset — and listeners can't tell them apart.

**Diagnostic:** Vercel logs → look for the `[TTS] VOICE COLLAPSE: presets [...] all resolve to the same voiceSignature=...` warning. Added in b22; fires on every request when the env produces collisions.

**Fix:** in Vercel → Project Settings → Environment Variables, set each `ELEVENLABS_VOICE_*` to a distinct voice ID OR unset them entirely (each preset will fall back to its hardcoded curated default from b17+).

#### 3. Verify routing in the browser (since b22)

Open the app, open DevTools console, run:

```js
await qaVoicePreviews()
```

You'll see a table with one row per preset showing `voiceSignature` (an 8-char fingerprint of the resolved voice ID). All 4 signatures should be distinct. If any two share a signature, `qaVoicePreviews` prints a console.warn naming the colliding presets — same info as the server-side warn in step 2.

Raw ElevenLabs voice IDs are never exposed to the browser; only the irreversible 8-char SHA-256 fingerprint.

## QA harness

```bash
# Full acceptance harness — must pass before any release:
node scripts/qa-current.js
```

The harness runs 5 sections:

1. **v2 age matrix** — 50 random stories × 12 ages (600 total). Gates: 0 nulls, 0 unresolved tokens, 0 missing required-slot mentions.
2. **v2 targeted regressions** — sky=moon@age2 and weather=stormy@age4 (60 each), 100% body + highlight.
3. **v3 matrix** — 4 blueprints × 8 ages × 30 stories (960 total). Gates: 0 nulls, 0 unresolved, 6-paragraph arc, all picks in body + highlighted.
4. **Grammar lint** — 2,000 v2 stories. Gates: 0 "a donuts/cookies/..." plural-article errors, 0 awkward " A " mid-title.
5. **Story-mode regression** — bedtime vs anytime endings at age 9 and age 2.
6. **Inline `<script>` syntax check** — parses every inline script block in `index.html`. Gates: 0 parse errors. Prevents recurrence of the v2.6.2 blank-screen incident.

For story-quality eyeball audits:

```bash
node scripts/audit-stories.js > docs/story-quality-audit-<version>.md
```

## Folder structure

```
noddytales/
├── index.html                 # Single-file app entry point (UI + glue)
├── src/
│   ├── content.js             # Picker word bank, age tiers, story templates
│   └── engine-v2.js           # v2 + v3 engines, blueprints, beats
├── api/
│   └── tts.js                 # Vercel serverless proxy → ElevenLabs
├── scripts/
│   ├── qa-current.js          # Repeatable acceptance harness
│   └── audit-stories.js       # 30-story eyeball audit generator
├── docs/                      # Design notes, GDD, audit packs
├── public/                    # Static assets (fonts, icons, images)
├── CHANGELOG.md
├── CLAUDE.md                  # Claude project instructions (Notion logging, release hygiene)
└── README.md
```

## Color palette

| Name        | Hex       | Role                        |
|-------------|-----------|-----------------------------|
| Sage Green  | #A8D5A2   | Primary background          |
| Soft Orange | #F4A261   | Cards, buttons, CTAs        |
| Cream       | #FFF8EE   | Story screen background     |
| Warm Yellow | #FFD166   | Highlights, tap states      |

## Hosting

- GitHub: [github.com/th1seffinguy/noddytales](https://github.com/th1seffinguy/noddytales)
- Vercel auto-deploy on push to `main` → noddytales.app
