#!/usr/bin/env node
/* content-blueprint-health.js — b25 Content QA System.
 *
 * Generates a per-blueprint health report across all 8 V3 blueprints:
 *   - lost_snack_v3, goal_spine_v3, show_wrong_v3, rule_loophole_v3  (kid+big+tween)
 *   - tot_wonder_v3, tot_sky_v3                                       (tot)
 *   - little_quest_v3, little_food_v3                                 (little)
 *
 * For each blueprint generates N stories (default 10) using the blueprint's
 * native tier(s) and absurd-bank-injected freeword/freeword2/sound picks.
 * Reports:
 *   - sentence count median / max
 *   - HIGH_IMPACT word rendering rate (chant/payoff_word actually appearing)
 *   - top 3 repeated phrases within the blueprint's sample
 *   - one sample story per blueprint with blank human score fields for
 *     followup human review
 *
 * Surfaces which blueprint is currently the weakest — useful when deciding
 * which blueprint to target in the next content build.
 *
 * Usage:
 *   node scripts/content-blueprint-health.js                # 10 per blueprint
 *   node scripts/content-blueprint-health.js --reps 20      # 20 per blueprint
 *   node scripts/content-blueprint-health.js --out docs/content-qa-b24-baseline
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
return { generateStoryV3, generateStoryV2, WORD_BANK, absurdWordsForTier };
`;
  return (new Function(harness))();
}

const args = process.argv.slice(2);
function arg(name, fb) { const i = args.indexOf(name); return (i >= 0 && args[i + 1]) ? args[i + 1] : fb; }
const REPS    = parseInt(arg('--reps', '10'), 10);
const OUT_DIR = arg('--out', path.join(ROOT, 'docs', 'content-qa-runs'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const ctx = loadEngineContext();
const STRIP = t => String(t || '').replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function sentenceCount(t){return STRIP(t).replace(/\.{3,}/g,'.').split(/(?<=[.!?])\s+/).filter(s=>s.trim().length>0).length;}
function median(arr){const s=[...arr].sort((a,b)=>a-b);return s[Math.floor(s.length/2)];}

const BLUEPRINTS = [
  { id:'tot_wonder_v3',    tier:'tot',    ages:[2,3]  },
  { id:'tot_sky_v3',       tier:'tot',    ages:[2,3]  },
  { id:'little_quest_v3',  tier:'little', ages:[4,5]  },
  { id:'little_food_v3',   tier:'little', ages:[4,5]  },
  { id:'lost_snack_v3',    tier:'kid',    ages:[6,7]  },
  { id:'goal_spine_v3',    tier:'kid',    ages:[6,7]  },
  { id:'show_wrong_v3',    tier:'kid',    ages:[6,7]  },
  { id:'rule_loophole_v3', tier:'kid',    ages:[6,7]  },
];

function randomPicksForTier(tier) {
  const bank = ctx.WORD_BANK[tier], p = {};
  for (const r of bank) if (r.cat && r.options) p[r.cat] = pick(r.options);
  const a = ctx.absurdWordsForTier(tier, 4);
  if (a[0]) p.freeword  = { w: a[0], subtype: 'shout' };
  if (a[1]) p.freeword2 = { w: a[1] };
  if (a[2]) p.sound     = { w: a[2] };
  return p;
}

const datetag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mdPath  = path.join(OUT_DIR, `content-blueprint-health-${datetag}.md`);

let md = `# Content QA — Blueprint health\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Reps per blueprint: ${REPS}\n\n`;
md += `## Per-blueprint summary\n\n`;
md += `| Blueprint | Tier | Stories | sentence median | sentence max | HIGH_IMPACT rendered | nulls |\n|---|---|---|---|---|---|---|\n`;

const bpDetails = {};

for (const bp of BLUEPRINTS) {
  const counts = []; let highImpactRendered = 0; let highImpactPicked = 0; let nulls = 0;
  const ngramHits = {};
  let sampleStory = null;
  for (let i = 0; i < REPS; i++) {
    const age   = pick(bp.ages);
    const picks = { ...randomPicksForTier(bp.tier), __v3BlueprintId: bp.id };
    const s = ctx.generateStoryV3('Cole', picks, age);
    if (!s) { nulls++; continue; }
    counts.push(sentenceCount(s.paragraphs.join(' ')));
    if (!sampleStory) sampleStory = { age, picks, story: s };
    // HIGH_IMPACT render check
    const full = STRIP((s.paragraphs || []).join('\n')).toLowerCase();
    for (const slot of ['freeword','freeword2','sound']) {
      const w = picks[slot]?.w;
      if (!w) continue;
      highImpactPicked++;
      if (full.includes(String(w).toLowerCase())) highImpactRendered++;
    }
    // Simple n-gram repeats (4-word phrases) within this blueprint sample
    const words = full.replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').split(' ').filter(Boolean);
    const seen = new Set();
    for (let i = 0; i + 4 <= words.length; i++) {
      const g = words.slice(i, i + 4).join(' ');
      if (g.includes('cole')) continue; // skip name-anchored
      if (seen.has(g)) continue;
      seen.add(g);
      ngramHits[g] = (ngramHits[g] || 0) + 1;
    }
  }
  const topRepeats = Object.entries(ngramHits).filter(([_, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3);
  bpDetails[bp.id] = {
    tier: bp.tier, counts, nulls, highImpactPicked, highImpactRendered,
    topRepeats, sampleStory,
  };
  const renderRate = highImpactPicked ? ((highImpactRendered/highImpactPicked)*100).toFixed(0) + '%' : '—';
  md += `| ${bp.id} | ${bp.tier} | ${counts.length} | ${median(counts)} | ${Math.max(...counts) || 0} | ${highImpactRendered}/${highImpactPicked} (${renderRate}) | ${nulls} |\n`;
}

md += `\n## Per-blueprint top repeats (≥3 hits in sample)\n\n`;
for (const bp of BLUEPRINTS) {
  const d = bpDetails[bp.id];
  md += `### ${bp.id}\n\n`;
  if (!d.topRepeats.length) {
    md += `_No 4-grams hit ≥3 times in ${d.counts.length}-story sample (acceptably diverse)._\n\n`;
  } else {
    md += `| Hits | 4-gram |\n|---|---|\n`;
    for (const [g, n] of d.topRepeats) md += `| ${n} | \`${g}\` |\n`;
    md += `\n`;
  }
}

md += `\n## Sample story per blueprint (for human scoring)\n\n`;
md += `_Read these. Score each on humor / substance / choice integration / age fit / rereadability (1-5)._\n\n`;
for (const bp of BLUEPRINTS) {
  const d = bpDetails[bp.id];
  if (!d.sampleStory) continue;
  const { age, picks, story } = d.sampleStory;
  md += `### ${bp.id} — age ${age}\n\n`;
  md += `Picks: ` + Object.entries(picks).filter(([k, v]) => v && !k.startsWith('__') && typeof v === 'object').map(([k, v]) => `${k}=${v.w || v.text || JSON.stringify(v).slice(0,30)}`).join(', ') + `\n\n`;
  md += `**Title:** ${STRIP(story.title || '')}\n\n`;
  for (const p of (story.paragraphs || [])) md += `> ${STRIP(p)}\n>\n`;
  md += `\n**Scores** (rate 1-5; leave blank if you skip)\n\n`;
  md += `- humor:               \n`;
  md += `- substance:           \n`;
  md += `- choice integration:  \n`;
  md += `- age fit:             \n`;
  md += `- rereadability:       \n`;
  md += `- notes:               \n\n`;
}

fs.writeFileSync(mdPath, md);
console.log(`Wrote: ${mdPath}`);
for (const bp of BLUEPRINTS) {
  const d = bpDetails[bp.id];
  console.log(`  ${bp.id.padEnd(20)} sentences median=${median(d.counts) || '?'}  HIGH_IMPACT=${d.highImpactRendered}/${d.highImpactPicked}`);
}
