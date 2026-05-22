#!/usr/bin/env node
/* content-random-50.js — b25 Content QA System.
 *
 * Generates a balanced 50-story random V3 audit (10 stories per tier × 5 tiers)
 * and writes BOTH markdown (human-readable) and JSON (machine-readable) outputs.
 *
 * For each story records: tier / age / blueprint / setting flavor / picked
 * words (selected by the random picker) / sentence count / title / body.
 *
 * This is the SUCCESSOR to scripts/creativity-sample.js for content-quality
 * runs. The older creativity-sample.js stays in the repo as the b24 humor-
 * pass before/after diff tool (different purpose: glue-phrase tracking +
 * heuristic best/worst scoring against a fixed phrase list). This script
 * is the per-build sample for human review.
 *
 * Usage:
 *   node scripts/content-random-50.js                            # writes to docs/content-qa-runs/random-50-<datetag>.{md,json}
 *   node scripts/content-random-50.js --out docs/content-qa-b24-baseline
 *   node scripts/content-random-50.js --reps 100                 # 20 per tier
 *
 * Output filenames are date-stamped so successive runs don't overwrite.
 * Passing --out <dir> changes the destination directory.
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function loadEngineContext() {
  const content  = fs.readFileSync(path.join(ROOT, 'src/content.js'),  'utf8');
  const engineV2 = fs.readFileSync(path.join(ROOT, 'src/engine-v2.js'), 'utf8');
  const harness = `
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
${content}
const state = { sidekicks: [], pottyMode: false, teenUnlocked: false, name: 'Cole', setting: 'surprise' };
${engineV2}
return {
  generateStoryV3, generateStoryV2,
  WORD_BANK, V3_BEATS,
  SETTING_FLAVORS, SETTING_FLAVOR_KEYS, resolveSetting,
  ABSURD_WORD_BANK, absurdWordsForTier,
};
`;
  return (new Function(harness))();
}

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return (i >= 0 && args[i + 1]) ? args[i + 1] : fallback;
}
const REPS_TOTAL = parseInt(arg('--reps', '50'), 10);
const PER_TIER   = Math.max(1, Math.floor(REPS_TOTAL / 5));
const OUT_DIR    = arg('--out', path.join(ROOT, 'docs', 'content-qa-runs'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const ctx = loadEngineContext();
const TIERS = [
  { name: 'tot',    ages: [2, 3] },
  { name: 'little', ages: [4, 5] },
  { name: 'kid',    ages: [6, 7] },
  { name: 'big',    ages: [8, 9, 10] },
  { name: 'tween',  ages: [11, 12, 13] },
];
const STRIP = t => String(t || '').replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
function sentenceCount(text) {
  return STRIP(text)
    .replace(/\.{3,}/g, '.')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0)
    .length;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomPicksForTier(tier) {
  const bank = ctx.WORD_BANK[tier];
  const picks = {};
  for (const round of bank) {
    if (!round.cat || !round.options) continue;
    picks[round.cat] = pick(round.options);
  }
  // Inject absurd freeword + freeword2 picks tier-appropriate.
  const absurd = ctx.absurdWordsForTier(tier, 4);
  if (absurd[0]) picks.freeword  = { w: absurd[0], subtype: 'shout' };
  if (absurd[1]) picks.freeword2 = { w: absurd[1] };
  // Inject a sound pick (chant role feeder for tot/little since b24).
  if (ctx.absurdWordsForTier) {
    const sounds = ctx.absurdWordsForTier(tier, 4);
    if (sounds[2]) picks.sound = { w: sounds[2] };
  }
  // Random setting flavor.
  const flavor = pick(ctx.SETTING_FLAVOR_KEYS);
  picks.setting   = ctx.resolveSetting(flavor);
  picks._flavor   = flavor;
  picks.storyMode = Math.random() < 0.5 ? 'bedtime' : 'anytime';
  return picks;
}

const rows = [];
for (const tier of TIERS) {
  for (let i = 0; i < PER_TIER; i++) {
    const age   = pick(tier.ages);
    const picks = randomPicksForTier(tier.name);
    const story = ctx.generateStoryV3('Cole', picks, age) || ctx.generateStoryV2('Cole', picks, age);
    if (!story) { rows.push({ tier: tier.name, age, error: 'null story' }); continue; }
    rows.push({
      tier:        tier.name,
      age,
      blueprint:   story.__blueprint || story.blueprint || '(v2 fallback or unknown)',
      flavor:      picks._flavor,
      setting:     picks.setting?.place?.text || null,
      storyMode:   picks.storyMode,
      picks: {
        pet:       picks.pet?.w,
        food:      picks.food?.w,
        place:     picks.place?.w,
        creature:  picks.creature?.w,
        color:     picks.color?.w,
        move:      picks.move?.w,
        mood:      picks.mood?.w,
        sky:       picks.sky?.w,
        weather:   picks.weather?.w,
        freeword:  picks.freeword?.w,
        freeword2: picks.freeword2?.w,
        sound:     picks.sound?.w,
      },
      sentences:   sentenceCount(story.paragraphs.join(' ')),
      title:       STRIP(story.title || ''),
      paragraphs:  (story.paragraphs || []).map(STRIP),
    });
  }
}

// Group rows by tier for the markdown.
const byTier = {};
for (const r of rows) (byTier[r.tier] = byTier[r.tier] || []).push(r);

const datetag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mdPath  = path.join(OUT_DIR, `content-random-50-${datetag}.md`);
const jsonPath= path.join(OUT_DIR, `content-random-50-${datetag}.json`);

function median(arr) { const s = [...arr].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; }
function avg(arr)    { return arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0; }

let md = `# Content QA — Random ${rows.length} V3 audit\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Reps: ${rows.length} total (${PER_TIER}/tier × ${TIERS.length} tiers)\n\n`;
md += `## Per-tier summary\n\n`;
md += `| Tier | n | sentence median | sentence avg | null stories |\n|---|---|---|---|---|\n`;
for (const tier of TIERS) {
  const tierRows = byTier[tier.name] || [];
  const nulls    = tierRows.filter(r => r.error).length;
  const okRows   = tierRows.filter(r => !r.error);
  md += `| ${tier.name} | ${tierRows.length} | ${median(okRows.map(r => r.sentences))} | ${avg(okRows.map(r => r.sentences)).toFixed(1)} | ${nulls} |\n`;
}
md += `\n## Stories\n\n`;
for (const tier of TIERS) {
  md += `### Tier: ${tier.name}\n\n`;
  for (const r of (byTier[tier.name] || [])) {
    if (r.error) { md += `- **age ${r.age}** — _error: ${r.error}_\n\n`; continue; }
    md += `#### age ${r.age}  ·  blueprint ${r.blueprint}  ·  flavor ${r.flavor}  ·  ${r.storyMode}\n\n`;
    md += `Picks: ` + Object.entries(r.picks).filter(([_, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ') + `\n\n`;
    md += `Setting: ${r.setting || '(surprise)'}  ·  sentences: ${r.sentences}\n\n`;
    md += `**Title:** ${r.title}\n\n`;
    for (const p of r.paragraphs) md += `> ${p}\n>\n`;
    md += `\n`;
  }
}

fs.writeFileSync(mdPath,   md);
fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));

console.log(`Wrote ${rows.length} stories.`);
console.log(`  Markdown: ${mdPath}`);
console.log(`  JSON:     ${jsonPath}`);
