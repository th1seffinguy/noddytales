# Codex Project Instructions — NoddyTales

## Default QA Workflow

When the user asks any short form of:
- "QA"
- "QA current state"
- "audit current state"
- "review current state"
- "provide next prompt"
- "what should Claude do next?"

run the NoddyTales QA handoff workflow automatically. The user should not need to paste the long workflow prompt.

## QA Handoff Workflow

1. Read current repo state:
   - `git status --short`
   - latest commits
   - current `APP_VERSION` in `src/content.js`
   - current `ENGINE_V2_VERSION` in `src/engine-v2.js`
   - latest `CHANGELOG.md` entry

2. Run automated QA:
   - current QA harness: `node scripts/qa-current.js`
   - inline `index.html` script syntax check
   - any specific story audit script relevant to the latest build

3. Inspect Notion:
   - Project hub
   - Build Ideas database
   - Defect Log database
   - Story Test Log when story quality is involved
   - UAT Plan when release/readiness is involved

4. Reconcile repo vs Notion:
   - repo is source of truth for shipped code
   - Notion is source of truth for product status, roadmap, UAT, and decisions
   - if they disagree, call out the drift and update Notion when appropriate

5. Produce final answer in this shape:
   - Current state
   - QA results
   - Notion sync status
   - Findings ordered by severity
   - Recommended next build
   - Paste-ready Claude prompt, even if the user did not explicitly ask for one
   - `Notion:` line saying what was updated or why not

## Notion Sources

- Project hub: `https://www.notion.so/36113aa1d4db81579d71e7ac702c405e`
- Build Ideas database: `https://www.notion.so/a315a3c9386540cca3347a56c3d41a9c`
- Defect Log database: `https://www.notion.so/d15e684d920147e09540e7bdba1db406`
- Story Test Log: `https://www.notion.so/36213aa1d4db81faae1febd9c6b419b2`
- UAT Plan: `https://www.notion.so/36713aa1d4db81aaa0afecf6b2ac8497`

## Claude Prompt Rule

When the user asks for QA, audit, review, UAT, current state, release readiness, or next steps, always include a paste-ready Claude prompt in the final response.

Do this even if the user does not explicitly ask for a prompt. The standing workflow is:

Codex QA -> Codex findings -> Codex supplies next Claude prompt -> user pastes prompt to Claude.

The prompt should tell Claude to:
- read `CLAUDE.md`
- follow required Notion logging
- run QA
- update Notion before final response
- include `Notion: updated ...` or `Notion: not updated because ...`

## Do Not

- Do not rely only on Notion without checking the repo.
- Do not rely only on the repo without checking Notion for roadmap/UAT/product status.
- Do not claim Notion was updated unless a Notion tool call succeeded.
- Do not mark a build ready based only on automated QA when story quality or mobile UX is in scope.
