#!/usr/bin/env node
/* content-repetition-report.js — b25 Content QA System.
 *
 * Scans a 100-200 story V3 sample for repeated phrases (n-grams of length 4-7)
 * and repeated story endings (last full sentence of body). Flags phrases that
 * appear in more than `--threshold` % of stories.
 *
 * "Repeated" means the n-gram appears identically (after normalization:
 * lowercase, collapsed whitespace, punctuation stripped) in N or more distinct
 * stories.
 *
 * Output: markdown report. The top repeated phrases per length bucket are
 * candidate variant-pool expansions in the next content build.
 *
 * Usage:
 *   node scripts/content-repetition-report.js                # 100 stories, 20% threshold
 *   node scripts/content-repetition-report.js --reps 200 --threshold 0.15
 *   node scripts/content-repetition-report.js --out docs/content-qa-b24-baseline
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
const REPS      = parseInt(arg('--reps', '100'), 10);
const THRESHOLD = parseFloat(arg('--threshold', '0.20')); // 20% of stories
const NGRAM_MIN = parseInt(arg('--ngram-min', '4'), 10);
const NGRAM_MAX = parseInt(arg('--ngram-max', '7'), 10);
const OUT_DIR   = arg('--out', path.join(ROOT, 'docs', 'content-qa-runs'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const ctx = loadEngineContext();
const STRIP = t => String(t || '').replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
function tierForAge(a){if(a<=3)return'tot';if(a<=5)return'little';if(a<=7)return'kid';if(a<=10)return'big';return'tween';}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function randomPicks(tier){
  const bank = ctx.WORD_BANK[tier], p = {};
  for (const r of bank) if (r.cat && r.options) p[r.cat] = pick(r.options);
  const a = ctx.absurdWordsForTier(tier, 4);
  if (a[0]) p.freeword  = { w: a[0], subtype: 'shout' };
  if (a[1]) p.freeword2 = { w: a[1] };
  if (a[2]) p.sound     = { w: a[2] };
  return p;
}

/* Normalize for n-gram comparison. Lowercases, strips punctuation that
   varies (commas, parens, quotes) but KEEPS hyphens and apostrophes since
   those are meaningful in "wobble-flop" / "Cole's". Substitutes the
   protagonist name and known picker categories with placeholders so we
   catch the TEMPLATE repeat, not the picked-word repeat. */
function normalizeForNgram(text, picks) {
  let t = text.toLowerCase();
  // Replace dynamic content with placeholders so structurally-identical
  // beats with different picks count as the same repeat.
  if (picks) {
    for (const cat of ['pet','food','place','creature','color','move','mood','sky','weather','freeword','freeword2','sound']) {
      const v = picks[cat]?.w;
      if (v) t = t.split(String(v).toLowerCase()).join(`<${cat}>`);
    }
    if (picks.setting?.place?.text) t = t.split(picks.setting.place.text.toLowerCase()).join('<setting>');
  }
  t = t.replace(/\bcole\b/g, '<name>');
  // Strip punctuation but keep word internals
  t = t.replace(/[^\w<>\s'-]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function ngrams(words, n) {
  const out = [];
  for (let i = 0; i + n <= words.length; i++) out.push(words.slice(i, i + n).join(' '));
  return out;
}

const ngramHits = {};     // n-gram → Set of story-indexes containing it
const endingHits = {};    // last-sentence normalized → count
let totalStories = 0, totalNulls = 0;

for (let i = 0; i < REPS; i++) {
  const age   = 2 + Math.floor(Math.random() * 12);
  const tier  = tierForAge(age);
  const picks = randomPicks(tier);
  const s = ctx.generateStoryV3('Cole', picks, age) || ctx.generateStoryV2('Cole', picks, age);
  if (!s) { totalNulls++; continue; }
  totalStories++;
  const body = STRIP((s.paragraphs || []).join(' '));
  const norm = normalizeForNgram(body, picks);
  const words = norm.split(' ').filter(Boolean);
  // Per-story unique n-gram set so 1 story = 1 hit per n-gram (no double-counting).
  const seen = new Set();
  for (let n = NGRAM_MIN; n <= NGRAM_MAX; n++) {
    for (const g of ngrams(words, n)) {
      // Skip n-grams that are mostly placeholders (would over-flag the slot frame).
      const placeholderCount = (g.match(/<\w+>/g) || []).length;
      if (placeholderCount > n / 2) continue;
      const key = `[${n}] ${g}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!ngramHits[key]) ngramHits[key] = 0;
      ngramHits[key]++;
    }
  }
  // Story ending: last sentence of last paragraph (normalized).
  const lastPara = STRIP((s.paragraphs || []).slice(-1)[0] || '');
  const sentences = lastPara.split(/(?<=[.!?])\s+/).filter(Boolean);
  const lastSent  = sentences.slice(-1)[0] || '';
  const normEnd   = normalizeForNgram(lastSent, picks);
  if (normEnd.length > 3) endingHits[normEnd] = (endingHits[normEnd] || 0) + 1;
}

const minCount = Math.max(2, Math.ceil(THRESHOLD * totalStories));
const flagged  = Object.entries(ngramHits)
  .filter(([_, n]) => n >= minCount)
  .sort((a, b) => b[1] - a[1]);
const flaggedEndings = Object.entries(endingHits)
  .filter(([_, n]) => n >= minCount)
  .sort((a, b) => b[1] - a[1]);

const datetag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mdPath  = path.join(OUT_DIR, `content-repetition-report-${datetag}.md`);

let md = `# Content QA — Repetition report\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Sample: ${totalStories} V3 stories (random ages 2-13; ${totalNulls} nulls)\n`;
md += `N-gram window: ${NGRAM_MIN}-${NGRAM_MAX} words\n`;
md += `Threshold: ${(THRESHOLD * 100).toFixed(0)}% of sample (≥ ${minCount} stories)\n\n`;
md += `**Normalization:** picker words and protagonist name are substituted with placeholders (\`<food>\`, \`<name>\`, etc.) so structurally identical beats with different picks count as the same repeat.\n\n`;
md += `## Repeated phrases above threshold\n\n`;
md += `${flagged.length} phrases flagged. Each row shows length-prefix, hit count, and percent of sample.\n\n`;
md += `| Hits | % | N-gram |\n|---|---|---|\n`;
for (const [g, n] of flagged.slice(0, 50)) {
  md += `| ${n} | ${(n / totalStories * 100).toFixed(1)}% | \`${g}\` |\n`;
}
if (flagged.length > 50) md += `\n_(${flagged.length - 50} more below threshold listing cutoff of 50.)_\n`;
md += `\n## Repeated story endings above threshold\n\n`;
md += `${flaggedEndings.length} endings flagged.\n\n`;
md += `| Hits | % | Ending |\n|---|---|---|\n`;
for (const [g, n] of flaggedEndings.slice(0, 30)) {
  md += `| ${n} | ${(n / totalStories * 100).toFixed(1)}% | \`${g}\` |\n`;
}
md += `\n## How to use this report\n\n`;
md += `- Phrases at the top of the list are candidate **variant-pool expansions** for the next content build. Add 2-3 alternates to the FLAVOR_CALLBACK / beat-line pool that owns the phrase so random selection no longer collapses to it.\n`;
md += `- Endings at the top are candidate **cozy_end / landing beat** variant expansions.\n`;
md += `- The repetition report is INTENTIONALLY noisy at the top — perfect variety is impossible with finite beat pools. Use the threshold as a triage signal, not a hard gate.\n`;

fs.writeFileSync(mdPath, md);
console.log(`Sample: ${totalStories} stories (${totalNulls} nulls).`);
console.log(`N-gram phrases above ${(THRESHOLD*100).toFixed(0)}% threshold: ${flagged.length}`);
console.log(`Repeated endings above threshold:                ${flaggedEndings.length}`);
console.log(`Wrote: ${mdPath}`);
