# NoddyTales Versioning Policy

**Adopted:** 2026-05-21, starting with `v0.9.3 · b1` (formerly `v3.0.3`).

## The problem this policy solves

Between 2026-05-20 and 2026-05-21, NoddyTales shipped six releases that all bumped the user-facing semantic version:

```
v3.0.0  Router flip + v3 default for all ages
v3.0.1  Emoji-uniqueness fix (within-round)
v3.0.2  labyrinth→maze + 🌀 cross-round cleanup
v3.0.2-stability  Tween anytime QA gate (test-harness only)
v3.0.3  banshee→yeti + polite + cartoon chaotic sounds
```

These were a mix of one architectural milestone (v3.0.0) and four user-reported UX hotfixes (v3.0.1–v3.0.3). The user-facing version inflated from v3.0.0 to v3.0.3 in 36 hours even though the product is still pre-App-Store, still mid-QA, still mid-content-trimming, and not in a public-launch posture.

Treating every fix as a semver patch was wrong:

- It signaled "we're at v3" — implying maturity — when the product is in late beta.
- It made the "delete v2 codepath" Build Idea get renumbered **five times** (v3.0.1 → v3.0.2 → v3.0.3 → v3.0.4) because each hotfix preempted it.
- It made CHANGELOG entries collide with one-day-old version numbers.

This policy separates **product maturity** from **engine architecture** from **shipped releases**.

## Three independent version identifiers

### 1. Product version — `APP_VERSION`

- **What it means:** user-facing product maturity. Visible in the in-app badge and (eventually) App Store metadata.
- **Format:** semver (`vMAJOR.MINOR.PATCH`).
- **Current value:** `v0.9.3` (late beta).
- **Bumps when:**
  - PATCH (`v0.9.3` → `v0.9.4`): meaningful user-visible changes that aren't milestone-worthy on their own — content/UX fixes that change what kids see, new picker words, accessibility cleanups. **Rare. Most releases only bump BUILD_NUMBER.**
  - MINOR (`v0.9.3` → `v0.10.0`): product maturity milestones — App-Store-ready, real-kid playtest signed off, new feature surfaces (e.g., Apple Parental Gate UI, freemium IAP).
  - MAJOR (`v0.x` → `v1.0.0`): public App Store launch. v1.0.0 is reserved for that moment.

### 2. Engine version — `ENGINE_V2_VERSION` (→ `ENGINE_VERSION` after v2 deletion)

- **What it means:** internal engine architecture lineage. Used for technical traceability and CHANGELOG context. **Not shown in the badge.**
- **Format:** semver (`vMAJOR.MINOR.PATCH`).
- **Current value:** `v3.0.3` (matches the last v3.0.x release for continuity).
- **Bumps when:**
  - PATCH (`v3.0.3` → `v3.0.4`): minor engine-side fixes that don't change the story-generation contract (e.g., the v2.10.2 BEDTIME_RX scope fix, if it had been engine-side).
  - MINOR (`v3.0.3` → `v3.1.0`): engine architecture changes — v2 codepath deletion, new blueprint family, role-contract changes.
  - MAJOR (`v3.x` → `v4.0.0`): next major engine rewrite (no such rewrite is on the roadmap).

### 3. Build number — `BUILD_NUMBER`

- **What it means:** an integer that increments **every release shipped to main**, regardless of what kind of change. Visible in the badge alongside product version so every release is traceable.
- **Format:** plain integer.
- **Current value:** `1` (this is the first build under the new policy).
- **Bumps when:** every PR merged to `main` that ships to production. Even doc-only, QA-harness-only, or hotfix releases.

## Display

| Surface | What's shown | Format |
|---|---|---|
| In-app badge (bottom corner) | Product version + build number | `v0.9.3 · b1` |
| `index.html` `RELEASE_NOTES` entries | Product version (the `v:` key) | `v: 'v0.9.3'` |
| `CHANGELOG.md` headers | Product version, build number, engine version, date | `## v0.9.3 (build 1, engine v3.0.3) — 2026-05-21` |
| Story audit pack header | Product version | `# Story Quality Audit — v0.9.3` |
| DevTools console / `window.*` | Engine version (and APP_VERSION) | `window.ENGINE_V2_VERSION = 'v3.0.3'` |

## Why three identifiers instead of one

A single version number conflates three different concepts:

1. **How mature is the product?** — addressed by `APP_VERSION` (a marketing/trust signal)
2. **What does the story engine look like internally?** — addressed by `ENGINE_VERSION` (a technical traceability signal)
3. **Which specific build is this?** — addressed by `BUILD_NUMBER` (a debugging / support signal)

With one number, every hotfix has to choose between:
- bump patch and pretend the product is more mature (false marketing signal)
- skip the bump and lose traceability (no clear "which version shipped?")

With three numbers, each signal lives where it belongs.

## Examples

| Scenario | APP_VERSION | ENGINE_V2_VERSION | BUILD_NUMBER |
|---|---|---|---|
| (Today, after policy adoption) | v0.9.3 | v3.0.3 | 1 |
| Next picker UX hotfix (no engine change) | v0.9.3 | v3.0.3 | 2 |
| `v3.0.4`-era v2 deletion (engine architecture change) | v0.9.3 | **v3.1.0** | 3 |
| First real-kid playtest signoff + screenshots ready | **v0.9.4** | v3.1.0 | 4 |
| App Store metadata + Parental Gate UI ready | **v0.9.5** | v3.1.0 | 5 |
| App Store submission build | v0.9.5 | v3.1.0 | (build N at submission) |
| App Store approved + public launch | **v1.0.0** | v3.1.0 | (build N+) |
| First post-launch hotfix (no engine change) | **v1.0.1** | v3.1.0 | (build N+1) |

After v1.0.0, the product version starts behaving like normal semver — patch on hotfixes, minor on features, major on rewrites. The build number keeps incrementing forever.

## Migration

The v3.0.0–v3.0.3 CHANGELOG entries stay as-is. We do not rewrite history. From v0.9.3 forward, all entries use the new four-part header format (`v0.9.3 (build 1, engine v3.0.3) — DATE`).

The badge change from `v3.0.3` to `v0.9.3 · b1` is visible to anyone with the app open at the moment of deploy. That's a one-time confusion cost worth paying to set the right policy before more patches accumulate.

The queued v2-deletion Build Idea (previously named `v3.0.4 — Delete v2 codepath`) gets renamed to `v0.9.3 build N — Delete v2 codepath (engine v3.1.0)`. Build number lands at merge time.

## Open questions (none blocking)

- **Should `BUILD_NUMBER` auto-increment from git?** Currently manual. Could read `git rev-list --count HEAD` at build time. Manual is reliable; git-derived is automatic but adds a build step. **Decision: keep manual until App Store packaging adds a real build pipeline.**
- **Where does `ENGINE_VERSION` get displayed for support purposes?** Today: only in DevTools / source. If users start filing bug reports, a "show engine version" item in Parent Settings could surface it. **Decision: defer until support feedback shows it's needed.**
