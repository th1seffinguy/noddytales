# NoddyTales

A children's interactive story app. Kids tap word-pair choices across 5–7 rounds and get a personalized silly story built from their picks.

## How it works

1. Enter a name and pick an age (2–10)
2. Tap through binary word-choice cards — age-appropriate vocabulary per round
3. Ages 6+: one or two open-ended free-text rounds mixed in
4. A personalized story assembles locally from the selected words
5. Hit **Speak** to have the browser read it aloud (Web Speech API)

## Age tiers

| Ages  | Tier       | Rounds | Notes                          |
|-------|------------|--------|--------------------------------|
| 2–3   | tot        | 5      | Emoji + single-syllable words  |
| 4–5   | little     | 6      | Sight words, emoji support     |
| 6–7   | kid        | 8      | 1 free-text round included     |
| 8–10  | big        | 9      | 2 free-text rounds included    |

## Stack

Vanilla HTML/JS — no build step, no backend, no external APIs. Works offline after first load (fonts cached by browser).

## Local dev

Open `index.html` directly in any modern browser. No server required.

## Folder structure

```
noddytales/
├── index.html        # Single-file app entry point
├── src/              # Future: extracted JS/CSS modules
├── public/           # Static assets (fonts, icons, images)
├── docs/             # Design notes, GDD, color palette reference
├── README.md
└── .gitignore
```

## Planned hosting

- GitHub: github.com/th1seffinguy/noddytales
- Vercel auto-deploy on push to main → noddytales.vercel.app
- Custom domain: noddytales.app (pending purchase)

## Color palette

| Name        | Hex       | Role                        |
|-------------|-----------|-----------------------------|
| Sage Green  | #A8D5A2   | Primary background          |
| Soft Orange | #F4A261   | Cards, buttons, CTAs        |
| Cream       | #FFF8EE   | Story screen background     |
| Warm Yellow | #FFD166   | Highlights, tap states      |

## Test audience

Cole and Olivia.
