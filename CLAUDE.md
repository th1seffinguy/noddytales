# Claude Project Instructions — NoddyTales

## Start Here

Read this file at the start of every Claude Code session in this repo. Treat it as the project operating contract.

If the user asks for a build, fix, QA pass, UAT pass, audit, or release prep, follow the relevant workflow here without requiring the user to restate the process.

## Session Start Protocol (run before any work, every session)

The overnight routines commit to `dev` and open PRs into `main` on Anthropic's
cloud. That means this local Mac clone is frequently behind origin at the start
of a day. Before doing ANY work, sync local with remote safely. Do not assume
the working tree is clean.

### Step 1 — Check for uncommitted local changes
Run `git status --porcelain`.
- If output is EMPTY: working tree is clean, proceed to Step 2.
- If output is NOT empty: there are uncommitted local changes. Do NOT pull yet.
  - Show John the dirty files and ask: commit them, stash them, or discard them?
  - If John says stash: `git stash push -m "session-start auto-stash"`
  - If John says commit: commit to the current branch with a clear message
    before pulling.
  - If John says discard: confirm explicitly, then `git checkout -- .`
  - Never silently overwrite or discard local work.

### Step 2 — Fetch and sync both branches
- `git fetch origin`
- `git checkout dev && git pull origin dev`
- `git checkout main && git pull origin main`
- If a pull reports a merge conflict, STOP. Show John the conflicting files and
  ask how to resolve. Never auto-resolve conflicts.

### Step 3 — Restore stashed work if applicable
- If you stashed in Step 1: `git stash pop` and report any conflicts that
  surface. If conflicts occur, stop and ask John.

### Step 4 — Report the delta
In one short summary tell John what changed since the last local session:
- New commits on dev (and what they were)
- Any PRs opened or merged by the overnight routines
- Current branch and whether local now matches origin
- Anything that needs his attention (open PR awaiting his merge decision,
  failed routine, new defects logged to Notion)

### Rules
- Never start editing until local matches origin (or John has explicitly
  decided how to handle a conflict).
- Default working branch is `dev`. Leave `main` alone unless merging a
  reviewed PR.
- If `git fetch` fails (offline, auth issue), tell John and do not proceed as
  if the repo is current.

## Required Notion Logging

Every time you make a meaningful project update, you must also update Notion before calling the work complete.

Meaningful updates include:
- shipped features
- bug fixes or hotfixes
- QA audits or test harness changes
- story/content engine changes
- version bumps
- roadmap/status changes
- defects discovered, fixed, or deferred

Use these Notion sources:
- Project hub: `https://www.notion.so/36113aa1d4db81579d71e7ac702c405e`
- Build Ideas database: `https://www.notion.so/a315a3c9386540cca3347a56c3d41a9c`
- Defect Log database: `https://www.notion.so/d15e684d920147e09540e7bdba1db406`
- Story Test Log: `https://www.notion.so/36213aa1d4db81faae1febd9c6b419b2`

Logging rules:
- If a build idea was completed, update its Status to `Done` and add shipped version, commit, files changed, and QA results in the Note or page body.
- If a bug was found, create or update a Defect Log entry with Severity, Found In, Status, Description, and Fix Notes.
- If a bug was fixed, mark the defect `Fixed` and include the shipped version plus verification results.
- If the roadmap changes, update the project hub snapshot so it matches the repo's current version and next step.
- If story quality is assessed, update the Story Test Log or create/update the relevant Build Idea.
- If Notion tools are unavailable, explicitly say so in the final response and provide a paste-ready Notion update note. Do not imply Notion was updated if it was not.

Final response must include a short `Notion:` line:
- `Notion: updated <pages/databases>` when updates were made.
- `Notion: not updated because <reason>` when blocked.

## QA / UAT Trigger Workflow

When the user asks any short form of "QA", "QA current state", "audit current state", "run UAT", "release readiness", or "what next", do the full handoff workflow:

1. Check repo state:
   - `git status --short`
   - latest commit
   - current app/engine versions
   - latest changelog entry

2. Run QA:
   - current QA harness: `node scripts/qa-current.js`
   - inline `index.html` script syntax check
   - story audit/UAT scripts when story quality or release readiness is involved

3. Check Notion:
   - Project hub
   - Build Ideas
   - Defect Log
   - UAT Plan
   - Story Test Log when story quality is involved

4. Reconcile repo and Notion:
   - repo is source of truth for shipped code
   - Notion is source of truth for roadmap, UAT, product decisions, and defects
   - update stale Notion records before final response

5. Final response must include:
   - current state
   - QA/UAT result
   - files changed, if any
   - Notion updates made
   - next recommended action
   - `Notion:` line

## Recurring-Defect Guardrails

These bug classes have shipped + regressed multiple times. Read before changing
adjacent code.

### Apostrophe word boundary in Speak highlight (recurring; b41 architectural fix)
Symptom: the karaoke highlight falls one word behind when the story contains a
possessive or contraction (Cole's, dragon's, don't, it's, can't). Most visible
when the title contains an apostrophe — the highlight is off from the first
word.

Root cause: bracketed highlight tokens like `[name:Cole]` followed by `'s` in
source render as a `<span>Cole</span>'s` pair in the DOM. The wrapStoryWords
walker then produces TWO `.kw` spans (Cole, 's) while the TTS alignment from
ElevenLabs returns ONE word timing for `Cole's`. Every word after the title
runs one index ahead.

The b41 architectural fix lives in **two** mirrored places — both MUST stay in
sync or the bug returns:

1. **`parseStoryLine`** in `index.html` — its bracket regex is
   `/\[(name|c|y):([^\]]+)\]([’']s\b)?/g`. The optional `[’']s\b` group
   absorbs any trailing `'s` (straight or curly) into the highlight span.
2. **TTS `strip`** in `index.html` (`TTSManager.speak`) — keeps trailing `'s`
   in the outgoing TTS text exactly where the source put it, so the
   ElevenLabs alignment also sees `Cole's` as one word.

Never:
- Add a parallel tokenizer that splits story text on punctuation.
- Make `wrapStoryWords` tokenize differently from the `[name|c|y:X]'s` regex
  shape.
- Strip apostrophes from highlight-token inner text.

Test: `scripts/qa-current.js` Section 21 generates stories whose title contains
an apostrophe + body containing contractions, and asserts wrap word count ==
TTS alignment word count.

### Phantom sidekick names
The DEFAULT_SIDEKICKS pool was REMOVED in v1.19.1 (commit 80079d3). NEVER
re-introduce invented sidekick names. If `state.sidekicks` is empty, the
template uses the chip-styled `their pal` fallback.

### Sidekick visibility in V3 (b41 fix)
V3 blueprints have no `sidekick` slot. When `state.sidekicks` is non-empty,
the engine APPENDS a 1-sentence cameo to the landing paragraph wrapped in
`[name:X]` — see the b41 block in `generateStoryV3` (right after the smell
callback). If you add a new V3 stage, do not break the post-render cameo
injection — it walks the final paragraph only.

### Bedtime mode determinism (b41 fix)
The V3 engine appends a tier-appropriate bedtime closer sentence to the final
paragraph when `picks.storyMode === 'bedtime'` AND no bedtime lexicon is
already present. This makes bedtime mode produce bedtime endings regardless
of which landing beat fires. Don't bypass this post-pass when adding new
landing beats.

## Release Hygiene

For shipped code changes:
- Keep `APP_VERSION` in `src/content.js` and `ENGINE_V2_VERSION` in `src/engine-v2.js` in sync.
- Update `CHANGELOG.md`.
- Update in-app release notes in `index.html` when user-facing.
- Run the relevant QA harness before claiming success.
- For story engine changes, run `node scripts/qa-current.js` unless the change is purely documentation.
- For UI changes in `index.html`, also syntax-check the inline script so broken page-level JavaScript cannot ship.
