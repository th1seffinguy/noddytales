# Claude Project Instructions — NoddyTales

## Start Here

Read this file at the start of every Claude Code session in this repo. Treat it as the project operating contract.

If the user asks for a build, fix, QA pass, UAT pass, audit, or release prep, follow the relevant workflow here without requiring the user to restate the process.

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

## Release Hygiene

For shipped code changes:
- Keep `APP_VERSION` in `src/content.js` and `ENGINE_V2_VERSION` in `src/engine-v2.js` in sync.
- Update `CHANGELOG.md`.
- Update in-app release notes in `index.html` when user-facing.
- Run the relevant QA harness before claiming success.
- For story engine changes, run `node scripts/qa-current.js` unless the change is purely documentation.
- For UI changes in `index.html`, also syntax-check the inline script so broken page-level JavaScript cannot ship.
