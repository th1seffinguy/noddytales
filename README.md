# NoddyTales

A bedtime-and-anytime story generator for kids ages 2–13. Kids pick a name, age, sidekicks, and a setting, then tap through binary word-choice cards. A personalized silly story assembles locally from the picks, gets read aloud in a warm British narrator voice with word-by-word highlighting, and ends with either bedtime imagery or a "what happens next" hook depending on the chosen story mode.

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

| Ages   | Tier    | Rounds | Notes                                  |
|--------|---------|--------|----------------------------------------|
| 2–3    | tot     | 5      | Emoji + single-syllable words          |
| 4–5    | little  | 6      | Sight words, emoji support             |
| 6–7    | kid     | 8      | 1 free-text round, v3 engine eligible  |
| 8–10   | big     | 9      | 2 free-text rounds, v3 engine eligible |
| 11–13  | tween   | 9      | Older-skewing vocab + beats, v3 eligible |

## Story engines

- **v3 (default, since v3.0.0)** — role-based engine with 8 blueprints covering every age tier:
  - ages 6-13 (kid/big/tween): `lost_snack_v3`, `goal_spine_v3`, `show_wrong_v3`, `rule_loophole_v3` — 4-stage / 6-paragraph arcs with declarative role maps, token-direct authoring, stage progression.
  - ages 2-5 (tot/little, since v2.10.0): `tot_wonder_v3`, `tot_sky_v3`, `little_quest_v3`, `little_food_v3` — simplified 3-role contract (protagonist / ally / wonder_object) / 4-paragraph arcs.
- **v2 (silent fallback)** — the authored comedy engine that was the production default v2.0.0 → v2.10.2. Retained in code as a runtime fallback for v3.0.0; will be deleted in v3.0.3+ once production traffic confirms v3 stability across all releases.
- **v1 (deprecated)** — template-substitution engine. Reachable only if both v3 and v2 return null. Emits a console deprecation warning when it fires. Scheduled for removal with v2 in v3.0.3+.

## Stack

- Vanilla HTML/JS single-page app (no framework, no build step for the core app)
- ElevenLabs TTS via Vercel serverless proxy (`api/tts.js`) — uses the `/with-timestamps` endpoint to deliver per-character timing for karaoke highlighting
- IndexedDB audio + alignment cache (DB `noddytales-tts`, store `audio-v2`) — replayed stories don't re-fetch from ElevenLabs
- localStorage profile (`nt_name`, `nt_age`, `nt_sidekicks`, `nt_setting`, `nt_potty_mode`, `nt_story_mode`)
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
- `ELEVENLABS_VOICE_ID` — voice ID (defaults to George — British narrator)

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
