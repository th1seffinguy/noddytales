# AGENTS.md — NoddyTales Autonomous Agent Operating Contract

Read this file at the start of every automated run. It defines what every agent
(daily dev loop, UAT routine, or any unattended task) is allowed to do, how to
prioritise work, and what quality bar must be met before a commit ships.

---

## 1. Scope and Hard Limits

- Work on the **`dev` branch only**. Never commit to `main`. Open a PR for review.
- One work item per run. Never bundle two fixes or two features into one commit.
- One QA retry after a failure. If it still fails, revert changes and stop.
- Never auto-resolve merge conflicts. Stop and report if one is encountered.
- Only update Notion when a tool call succeeds. Never claim an update happened
  if the tool call did not complete.

---

## 2. Notion Sources

| Source | URL |
|---|---|
| Project hub | `https://www.notion.so/36113aa1d4db81579d71e7ac702c405e` |
| Build Ideas  | `https://www.notion.so/a315a3c9386540cca3347a56c3d41a9c` |
| Defect Log   | `https://www.notion.so/d15e684d920147e09540e7bdba1db406` |
| Story Test Log | `https://www.notion.so/36213aa1d4db81faae1febd9c6b419b2` |
| UAT Plan     | `https://www.notion.so/36713aa1d4db81aaa0afecf6b2ac8497` |

---

## 3. Work Queue Priority Order

When selecting the single item to work on, apply this order strictly:

1. **Critical defects** — Defect Log status = Open, Severity = Critical
2. **High defects** — Defect Log status = Open, Severity = High
3. **High Build Ideas** — Build Ideas status = Planned, Priority = High
4. **Medium defects** — Defect Log status = Open, Severity = Medium
5. **Medium Build Ideas** — Build Ideas status = Planned, Priority = Medium

If nothing qualifies, do not invent work. Report queue empty and stop.

---

## 4. Daily Dev Loop Protocol

### Step 1 — Read the queue
- Read the Defect Log and Build Ideas from Notion (URLs above).
- Build the prioritised list following Section 3.
- If Notion is unreachable, email John that the queue could not be read, and stop.

### Step 2 — Baseline check
- Run `node scripts/qa-current.js`.
- Exit code 0 = baseline is clean. Proceed.
- Non-zero exit = repo is already broken. **Do not attempt fixes.** Skip to
  Step 5 and report that the baseline was broken before any changes.

### Step 3 — Pick one item
- Take the single highest-priority open item (Section 3).
- If the queue is empty, skip to Step 5 and report accordingly.

### Step 4 — Implement and verify
- Make the fix or implement the feature on `dev`.
- Follow every Story Engine Quality Rule in Section 5.
- Follow the Release Hygiene checklist in Section 6.
- Run `node scripts/qa-current.js`.
  - If it passes: continue to Step 5.
  - If it fails: attempt ONE fix, then run again.
  - If it still fails after one retry: revert all changes (`git checkout -- .`),
    do NOT commit, skip to Step 5 and report the failure with QA output.

### Step 5 — Commit, PR, Notion, and email (always runs)

**On success:**
- Commit to `dev`: `fix: [item name] (automated daily loop)` or
  `feat: [item name] (automated daily loop)`
- Push to `dev`, open a pull request from `dev` → `main` titled:
  `[item name] — ready for UAT`
- Update Notion: mark the defect `Fixed` or the Build Idea `Done`. Include
  shipped version, commit SHA, files changed, and QA result in the page body.

**On failure or empty queue:**
- Do not commit and do not open a PR.
- Notion update is not required for empty-queue or broken-baseline runs.

**Always send an email** to `carmano.john@gmail.com` via Gmail:

Subject (choose one):
- `NoddyTales daily loop: completed [item name]`
- `NoddyTales daily loop: queue empty, nothing to do`
- `NoddyTales daily loop: FAILED — needs your attention`

Body (≤10 lines): what was picked, what was changed, QA result, whether a PR
was opened, and the next item in the queue. If this was a failure or
broken-baseline run, state clearly what is blocking and what John needs to do.

---

## 5. Story Engine Quality Rules

Every code change that touches `src/engine-v2.js`, `src/content.js`, or
`index.html` must satisfy all of the following. These rules are enforced by
`node scripts/qa-current.js` — a run that exits non-zero means at least one
rule is violated.

### 5.1 No nulls
Generated story objects must never have null or undefined `paragraphs`,
`title`, or `highlight` fields. Zero nulls across all QA matrix runs.

### 5.2 No unresolved tokens
No `{slot.prop}` placeholder may survive into final story text. The engine
uses `{…}` syntax internally — any leftover brace-token in the output is a bug.

### 5.3 Picked-word coverage
Every word the child picks must appear verbatim in the story body and be
present in the `highlight` array. Zero misses across the QA matrix.

### 5.4 V3 paragraph count
V3-engine stories must have exactly 6 paragraphs. Fewer means a stage was
dropped; more means a stage fired twice erroneously.

### 5.5 Grammar: article agreement
No story may contain the pattern `a <plural-noun>` (e.g. "a donuts", "a
cookies", "a waffles", "a pancakes"). The grammar lint gate runs 2,000 random
v2 stories and gates on zero violations.

### 5.6 Title article case
No generated title may contain ` A ` (capital A) mid-title. Titles use
title-case helpers — a mid-title uppercase A is a sign the article helper
misfired.

### 5.7 Bedtime vs anytime endings
Bedtime stories at age 2 and age 9 must use bedtime-appropriate endings.
Anytime stories at the same ages must use anytime endings. The QA harness
checks both combinations.

### 5.8 Tot/little kid-agency ratio
Across 100 sampled tot+little stories (ages 2–5), the fraction of
Cole-subject verb pairs that are *action* verbs (not reaction verbs) must be
≥ 0.65. Cole drives the story; he is not a passive observer.

### 5.9 Beat dedup (V3)
The same V3 beat may not fire twice within a single story. The `silly_repeat`
stage fires twice per story but must use two different beats. Enforce via the
in-story beat-dedup guard already present in the engine.

### 5.10 Inline script syntax
Every `<script>` block in `index.html` must parse cleanly via `new Function`.
This gate catches broken JS before it can produce a blank screen in production
(the v2.6.2 incident).

---

## 6. Release Hygiene Checklist

Before committing any code change:

- [ ] `APP_VERSION` in `src/content.js` and `ENGINE_V2_VERSION` in
      `src/engine-v2.js` are bumped to the same new version string.
- [ ] A new entry is added to `CHANGELOG.md` under the new version number,
      dated today, with a description of the change and the acceptance result.
- [ ] If the change is user-facing (UI, wording, new feature), update the
      in-app release notes in `index.html`.
- [ ] `node scripts/qa-current.js` exits 0.

---

## 7. QA Handoff Workflow (for interactive Codex / Claude sessions)

When John asks any of the following, run the full handoff workflow below
without requiring him to re-paste it:

- "QA", "QA current state", "audit current state", "review current state"
- "run UAT", "release readiness", "what next", "what should Claude do next?"

### Handoff steps

1. **Repo state**: `git status --short`, latest commits, `APP_VERSION`,
   `ENGINE_V2_VERSION`, latest `CHANGELOG.md` entry.
2. **Automated QA**: `node scripts/qa-current.js`, inline script syntax check,
   any story-audit script relevant to the latest build.
3. **Notion check**: Project hub, Build Ideas, Defect Log, UAT Plan, Story
   Test Log (when story quality is in scope).
4. **Reconcile**: repo is source of truth for shipped code; Notion is source of
   truth for roadmap, UAT, and product decisions. Call out any drift and update
   Notion where appropriate.
5. **Final response shape**:
   - Current state
   - QA / UAT result
   - Notion sync status
   - Findings ordered by severity
   - Recommended next build
   - Paste-ready Claude prompt (always include, even if not explicitly asked)
   - `Notion:` line: `updated <pages>` or `not updated because <reason>`

### Claude Prompt Rule
Every QA / audit / release-readiness response must include a paste-ready
Claude prompt that tells Claude to: read `CLAUDE.md`, follow required Notion
logging, run QA, update Notion, and include a `Notion:` line.

---

## 8. Do Not

- Do not rely on Notion alone without checking the repo, or vice versa.
- Do not claim Notion was updated unless a Notion tool call succeeded.
- Do not mark a build ready based only on automated QA when story quality or
  mobile UX is in scope.
- Do not start editing until the repo is confirmed clean (or John has decided
  how to handle uncommitted changes).
- Do not push to `main` directly.
- Do not skip the Release Hygiene Checklist.
- Do not bundle multiple work items in one commit.
