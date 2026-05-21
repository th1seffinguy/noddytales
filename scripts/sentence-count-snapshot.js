#!/usr/bin/env node
/* sentence-count-snapshot.js — b18 audit helper.
 *
 * Reports v3 + v2 sentence counts per tier so we can capture a BEFORE / AFTER
 * comparison around the first story-length trimming pass. Mirrors Section 10
 * of qa-current.js, but also measures v3 (which is the default engine for all
 * ages — Section 10's existing metric only measures v2).
 *
 * Usage:
 *   node scripts/sentence-count-snapshot.js          # 60 reps per tier per engine
 *   node scripts/sentence-count-snapshot.js 120      # custom rep count
 *
 * Output rows: engine | tier | median | p90 | max | n
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const content  = fs.readFileSync(path.join(ROOT, 'src/content.js'), 'utf8');
const engineV2 = fs.readFileSync(path.join(ROOT, 'src/engine-v2.js'), 'utf8');
const harness = `
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
${content}
const state = { sidekicks: [], pottyMode: false, teenUnlocked: false, name: 'Cole', setting: 'surprise' };
${engineV2}
return { generateStoryV2, generateStoryV3 };
`;
const ctx = (new Function(harness))();

const strip = t => String(t).replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
function sentenceCount(text){
  return strip(text)
    .replace(/\.{3,}/g,'.')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0).length;
}

const REPS = parseInt(process.argv[2] || '60', 10);
const TIERS = [
  ['tot',    [2,3]],
  ['little', [4,5]],
  ['kid',    [6,7]],
  ['big',    [8,9,10]],
  ['tween',  [11,12,13]],
];
const picks = {
  pet:{w:'bunny'}, food:{w:'grapes'}, place:{w:'park'},
  creature:{w:'frog'}, color:{w:'pink'}, move:{w:'jumped'},
  sky:{w:'cloud'}, weather:{w:'sunny'}, mood:{w:'dramatic'},
  freeword:{w:'BOINGO',subtype:'shout'}, freeword2:{w:'YAY'},
};

const rows = [];
function percentile(arr, p){ return arr[Math.floor(arr.length * p)]; }
for (const engine of ['V3', 'V2']) {
  for (const [tier, ages] of TIERS) {
    const counts = [];
    for (let i = 0; i < REPS; i++) {
      const age = ages[i % ages.length];
      const s = engine === 'V3'
        ? ctx.generateStoryV3('Cole', picks, age)
        : ctx.generateStoryV2('Cole', picks, age);
      if (!s) continue;
      counts.push(sentenceCount(s.paragraphs.join(' ')));
    }
    counts.sort((a,b) => a - b);
    rows.push({
      engine, tier,
      median: percentile(counts, 0.5),
      p90:    percentile(counts, 0.9),
      max:    counts[counts.length - 1],
      n:      counts.length,
    });
  }
}

console.log(`reps=${REPS} per tier per engine`);
console.log('engine  tier    median  p90  max  n');
for (const r of rows) {
  console.log(`${r.engine.padEnd(6)}  ${r.tier.padEnd(7)} ${String(r.median).padStart(6)}  ${String(r.p90).padStart(3)}  ${String(r.max).padStart(3)}  ${r.n}`);
}
