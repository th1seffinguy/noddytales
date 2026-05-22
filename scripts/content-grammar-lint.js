#!/usr/bin/env node
/* content-grammar-lint.js — b25 Content QA System.
 *
 * Standalone grammar/comedy lint pass over a random V3 story sample. Mirrors
 * the static checks in qa-current.js Section 18 but runs against RENDERED
 * prose so it can catch leaks that only surface at story-build time (e.g.
 * mapPickToWord clone path producing "a binoculars" for a picker word the
 * static V2_WORDS entry already handles correctly).
 *
 * Checks (all soft-report; failures don't exit non-zero — this is a
 * diagnostic, not a release gate. Section 18 is the release gate):
 *   - Title bare-verb leaks (Cole Tell/Share/Find/Sing/Build/...)
 *   - Plural-noun + singular-was (pretzels was, taquitos was, fries was, ...)
 *   - Singular-article + plural-only-noun (a binoculars, a fries, a scissors)
 *   - Duplicate "the the" / "a a" / "an an"
 *   - Lowercase sentence starts after period (caused by injected callbacks)
 *   - Sky-class wonder placed physically on someone's head
 *   - Overused glue phrases (warn above threshold)
 *
 * Usage:
 *   node scripts/content-grammar-lint.js              # 100 stories
 *   node scripts/content-grammar-lint.js --reps 200
 *   node scripts/content-grammar-lint.js --out docs/content-qa-b24-baseline
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
const REPS    = parseInt(arg('--reps', '100'), 10);
const OUT_DIR = arg('--out', path.join(ROOT, 'docs', 'content-qa-runs'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const ctx = loadEngineContext();
const TIERS = [['tot',[2,3]],['little',[4,5]],['kid',[6,7]],['big',[8,9,10]],['tween',[11,12,13]]];
const STRIP = t => String(t || '').replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPicks(tier) {
  const bank = ctx.WORD_BANK[tier], p = {};
  for (const r of bank) if (r.cat && r.options) p[r.cat] = pick(r.options);
  const a = ctx.absurdWordsForTier(tier, 4);
  if (a[0]) p.freeword  = { w: a[0], subtype: 'shout' };
  if (a[1]) p.freeword2 = { w: a[1] };
  if (a[2]) p.sound     = { w: a[2] };
  return p;
}
function tierForAge(age) {
  if (age <= 3)  return 'tot';
  if (age <= 5)  return 'little';
  if (age <= 7)  return 'kid';
  if (age <= 10) return 'big';
  return 'tween';
}

const CHECKS = [
  // Title bare-verb: "Cole Tell/Find/Share/Sing/..." not "Cole Tells/Tried to Tell"
  { id:'title_bare_verb', label:'Title bare third-person-singular verb after Cole',
    scope:'title',
    rx: /\bCole (Tell|Share|Find|Sing|Build|Make|Invent|Run|Eat|Catch|Save|Win|Open|Lose|Drop|Pick|Sneak|Get)\b(?!ed|ing|s|ies)/ },
  // Plural foods (NOT invariant ones like fish/deer/sheep) followed by "was"
  { id:'plural_noun_was', label:'Plural noun followed by singular "was"',
    scope:'body',
    rx: /\b(pretzels|taquitos|fries|donuts|cookies|waffles|pancakes|tacos|burritos|grapes|peas|noodles|dumplings|nachos|cupcakes|jellybeans|hot dogs|cheese puffs|fruit snacks|blueberries|strawberries|apple slices|pickles|enchanted pickles|thunder pancakes|suspicious sandwiches|bewildering cookies|haunted scones|mysterious leftovers|forbidden waffles|emergency noodles|ceremonial nachos|vending machine chips|cafeteria fries|mystery chips|gas station nachos|gas station taquitos) was\b/i },
  // Singular article + plural-only noun (a binoculars / a scissors / etc.)
  { id:'a_plural_noun', label:'Singular article + plural-only noun (a binoculars-class)',
    scope:'both',
    rx: /\ba (binoculars|scissors|pants|shorts|jeans|glasses|tongs|tweezers|pliers|sunglasses)\b/i },
  // Duplicate articles
  { id:'duplicate_article', label:'Duplicate article ("the the", "a a", "an an")',
    scope:'both',
    rx: /\b(the the|a a|an an)\b/i },
  // Lowercase sentence start after terminal punctuation
  { id:'lowercase_sentence_start', label:'Lowercase letter starts a sentence after period/!/?',
    scope:'body',
    rx: /(?<=[.!?]\s)[a-z]/ },
  // Sky/wonder physicality — putting a sky thing on someone's head
  { id:'sky_on_head', label:'Sky-class noun placed on someone\'s head physically',
    scope:'body',
    rx: /\bput the (cloud|star|moon|sun|rainbow|comet|kite|plane|rocket|snowflake|firework|butterfly|helicopter|bubbles|rain|leaf|stars) on top of/i },
];

// Glue phrases tracked (warn if appears in >25% of stories — soft signal).
const GLUE_PHRASES = [
  { id:'glow',            rx: /A faint .{2,30}? glow/i },
  { id:'room_picked_up',  rx: /Everything in the room had picked up/i },
  { id:'just_to_make',    rx: /one more time, just to make a point/i },
  { id:'possibly_memory', rx: /possibly a memory/i },
  { id:'act_normal',      rx: /noticed and tried to act normal\. It was not working/i },
  { id:'meant_business',  rx: /in a way that meant business/i },
];
const GLUE_THRESHOLD = 0.25; // 25% of sample

const checkHits  = Object.fromEntries(CHECKS.map(c => [c.id, []]));
const glueHits   = Object.fromEntries(GLUE_PHRASES.map(g => [g.id, 0]));
let totalStories = 0, totalNulls = 0;

for (let i = 0; i < REPS; i++) {
  const age   = 2 + Math.floor(Math.random() * 12);
  const tier  = tierForAge(age);
  const picks = randomPicks(tier);
  const s = ctx.generateStoryV3('Cole', picks, age) || ctx.generateStoryV2('Cole', picks, age);
  if (!s) { totalNulls++; continue; }
  totalStories++;
  const title = STRIP(s.title || '');
  const body  = STRIP((s.paragraphs || []).join('\n'));
  const full  = title + '\n' + body;
  for (const c of CHECKS) {
    const target = c.scope === 'title' ? title : c.scope === 'body' ? body : full;
    const m = target.match(c.rx);
    if (m) checkHits[c.id].push({ age, tier, blueprint: s.__blueprint, snippet: target.slice(Math.max(0, target.indexOf(m[0]) - 20), target.indexOf(m[0]) + 80) });
  }
  for (const g of GLUE_PHRASES) if (g.rx.test(full)) glueHits[g.id]++;
}

const datetag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mdPath  = path.join(OUT_DIR, `content-grammar-lint-${datetag}.md`);

let md = `# Content QA — Grammar / Comedy lint\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Sample: ${totalStories} V3 stories (random ages 2-13; ${totalNulls} nulls)\n\n`;
md += `## Hard checks (joke-breakers)\n\n`;
md += `| Check | Hits | % of sample |\n|---|---|---|\n`;
for (const c of CHECKS) {
  const n = checkHits[c.id].length;
  const pct = totalStories ? (n / totalStories * 100).toFixed(1) : '—';
  md += `| ${c.label} | ${n} | ${pct}% |\n`;
}
md += `\n## Glue-phrase frequencies (warn if > ${(GLUE_THRESHOLD * 100).toFixed(0)}%)\n\n`;
md += `| Phrase | Hits | % of sample | Warn? |\n|---|---|---|---|\n`;
for (const g of GLUE_PHRASES) {
  const pct = totalStories ? glueHits[g.id] / totalStories : 0;
  const warn = pct > GLUE_THRESHOLD ? '⚠️' : '';
  md += `| ${g.id} | ${glueHits[g.id]} | ${(pct * 100).toFixed(1)}% | ${warn} |\n`;
}
md += `\n## Sample hits (first 3 per check)\n\n`;
for (const c of CHECKS) {
  if (!checkHits[c.id].length) continue;
  md += `### ${c.label}\n\n`;
  for (const h of checkHits[c.id].slice(0, 3)) {
    md += `- _(age ${h.age} ${h.tier})_ \`...${h.snippet.trim()}...\`\n`;
  }
  md += `\n`;
}
md += `\n## Notes\n\n- This script is DIAGNOSTIC, not a release gate. The release gate is qa-current.js Section 18.\n- Glue-phrase threshold is configurable in this file (GLUE_THRESHOLD = ${GLUE_THRESHOLD}).\n- The "lowercase_sentence_start" check sometimes false-positives on stylized lowercase shouts (e.g. \`"glorp!" said Cole. then the chick...\`) — review hits manually.\n`;

fs.writeFileSync(mdPath, md);
console.log(`Sample: ${totalStories} stories (${totalNulls} nulls).`);
for (const c of CHECKS) console.log(`  ${c.label}: ${checkHits[c.id].length}`);
console.log(`Wrote: ${mdPath}`);
