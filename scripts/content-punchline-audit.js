#!/usr/bin/env node
/* content-punchline-audit.js — b25 Content QA System.
 *
 * Classifies how each HIGH_IMPACT chant / payoff_word usage actually FUNCTIONS
 * in its rendered story. Heuristic text analysis. For each story that picked
 * a freeword and/or freeword2, walks the rendered prose and tags every
 * occurrence of the picked word with one of:
 *
 *   - quoted_only         : appears in quotes / shout marks but the next 1-2
 *                           sentences show no reaction word (no other character,
 *                           prop, or sidekick named in close proximity)
 *   - causes_reaction     : appears in quotes AND the next sentence mentions
 *                           a different character / object reacting (sidekick
 *                           name, "the X", possessive)
 *   - changes_scene       : appears AND the next 2 sentences contain a
 *                           transformation verb (reappeared, vanished, opened,
 *                           cracked, vibrated, twitched, hummed, flipped,
 *                           wiggled, sneezed, danced, hiccuped, etc.)
 *   - returns_as_callback : appears in 2+ separate paragraphs (echo or
 *                           reprise pattern, regardless of context)
 *   - lands_in_final_third: any occurrence falls in the last third of the
 *                           paragraph count (positional flag, not exclusive
 *                           — a usage can be both changes_scene AND
 *                           lands_in_final_third).
 *
 * Goal: distinguish stories where the kid's absurd word is DECORATION from
 * stories where it actually drives a moment. The b24 Story Humor Pass added
 * 12 absurd_consequence beats specifically to lift the changes_scene rate.
 *
 * Usage:
 *   node scripts/content-punchline-audit.js                # 100 stories
 *   node scripts/content-punchline-audit.js --reps 200
 *   node scripts/content-punchline-audit.js --out docs/content-qa-b24-baseline
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

// Heuristic transformation verbs that suggest scene-change consequence.
const SCENE_VERBS = /\b(reappeared|vanished|opened|cracked|vibrated|twitched|hummed|flipped|wiggled|sneezed|danced|hiccuped|squawked|burped|chants|chanted|echoed|repeat|repeated|nodded|bowed|froze|spun|popped|burst|cheered|adopted|listened|obeyed)\b/i;

function classifyHighImpact(story, pickedWord) {
  if (!pickedWord) return null;
  const word = String(pickedWord).toLowerCase();
  const paras = (story.paragraphs || []).map(p => STRIP(p));
  const fullText = paras.join('\n').toLowerCase();
  const occurrencesPerPara = paras.map(p => (p.toLowerCase().match(new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')) || []).length);
  const totalHits = occurrencesPerPara.reduce((a, b) => a + b, 0);
  if (totalHits === 0) return { pickedWord, totalHits: 0, tags: [], paragraphCount: paras.length, position: null };

  const tags = [];
  // returns_as_callback: appears in 2+ distinct paragraphs.
  const parasWithHit = occurrencesPerPara.filter(n => n > 0).length;
  if (parasWithHit >= 2) tags.push('returns_as_callback');

  // lands_in_final_third: any hit in the last third of paragraphs.
  const finalThirdStart = Math.floor(paras.length * 2 / 3);
  const finalPosition = occurrencesPerPara.slice(finalThirdStart).some(n => n > 0);
  if (finalPosition) tags.push('lands_in_final_third');

  // causes_reaction / changes_scene / quoted_only: walk each occurrence and
  // look at the 200 chars AFTER it for reaction / scene-verb signals.
  let causesReaction = false, changesScene = false;
  const wordRx = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let m;
  while ((m = wordRx.exec(fullText)) !== null) {
    const tail = fullText.slice(m.index + word.length, m.index + word.length + 220);
    if (SCENE_VERBS.test(tail)) changesScene = true;
    // Reaction: another character/object reference in tail (the X, X said, X looked, etc.)
    if (/\bthe [a-z]/.test(tail) && /\b(said|looked|nodded|laughed|listened|repeated|bowed|adopted)\b/i.test(tail)) {
      causesReaction = true;
    }
  }
  if (changesScene)    tags.push('changes_scene');
  if (causesReaction)  tags.push('causes_reaction');
  if (tags.length === 0 || (tags.length === 1 && tags[0] === 'lands_in_final_third')) {
    // No reaction, no scene change, no callback — just quoted decoration.
    tags.push('quoted_only');
  }
  return { pickedWord, totalHits, tags, paragraphCount: paras.length, parasWithHit };
}

const summaries = []; // per (story, word) classification
let nulls = 0, totalStories = 0;
for (let i = 0; i < REPS; i++) {
  const age   = 2 + Math.floor(Math.random() * 12);
  const tier  = tierForAge(age);
  const picks = randomPicks(tier);
  const s = ctx.generateStoryV3('Cole', picks, age) || ctx.generateStoryV2('Cole', picks, age);
  if (!s) { nulls++; continue; }
  totalStories++;
  for (const slot of ['freeword', 'freeword2', 'sound']) {
    const word = picks[slot]?.w;
    if (!word) continue;
    const c = classifyHighImpact(s, word);
    if (c) summaries.push({ tier, age, slot, ...c, title: STRIP(s.title || '') });
  }
}

// Aggregate by tag.
const tagCounts = { quoted_only: 0, causes_reaction: 0, changes_scene: 0, returns_as_callback: 0, lands_in_final_third: 0 };
let totalUsages = 0, totalWithHit = 0;
for (const c of summaries) {
  if (c.totalHits === 0) continue;
  totalWithHit++;
  for (const t of c.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
}
totalUsages = summaries.length;
const missedUsages = summaries.filter(s => s.totalHits === 0).length;

const datetag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mdPath  = path.join(OUT_DIR, `content-punchline-audit-${datetag}.md`);

let md = `# Content QA — Punchline effectiveness audit\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Sample: ${totalStories} V3 stories (random ages 2-13; ${nulls} nulls)\n`;
md += `Total HIGH_IMPACT pickedWord usages tracked: ${totalUsages}\n`;
md += `Usages where the picked word actually rendered in the story: ${totalWithHit} (${totalUsages ? (totalWithHit/totalUsages*100).toFixed(1) : '0'}%)\n`;
md += `Usages where the picker word never appeared: ${missedUsages}\n\n`;
md += `## Classification breakdown (per rendered usage)\n\n`;
md += `_A single usage can carry multiple tags. e.g. \`changes_scene\` + \`lands_in_final_third\`._\n\n`;
md += `| Tag | Count | % of rendered usages |\n|---|---|---|\n`;
const order = ['changes_scene','causes_reaction','returns_as_callback','lands_in_final_third','quoted_only'];
for (const tag of order) {
  const pct = totalWithHit ? (tagCounts[tag] / totalWithHit * 100).toFixed(1) : '—';
  md += `| ${tag} | ${tagCounts[tag] || 0} | ${pct}% |\n`;
}
md += `\n## What "good" looks like\n\n`;
md += `- **\`changes_scene\` ≥ 35%** is the b24 target — Priority 3 of the Story Humor Pass added 12 absurd_consequence beats specifically to lift this number.\n`;
md += `- **\`quoted_only\` ≤ 40%** is healthy. Above 50% means the absurd word is decoration, not consequence — escalate to a content build.\n`;
md += `- **\`returns_as_callback\` ≥ 20%** is bonus humor. Stories that repeat the kid's word in 2+ paragraphs read funnier on replay.\n`;
md += `- **\`lands_in_final_third\` ≥ 50%** ensures the kid's word is the PAYOFF, not the setup. If under 50%, look for beat lines that place chant/payoff_word too early.\n\n`;
md += `## Per-tier breakdown\n\n`;
md += `| Tier | rendered usages | changes_scene% | causes_reaction% | quoted_only% |\n|---|---|---|---|---|\n`;
for (const tier of ['tot','little','kid','big','tween']) {
  const tierRows = summaries.filter(s => s.tier === tier && s.totalHits > 0);
  const n = tierRows.length;
  const sceneCount = tierRows.filter(s => s.tags.includes('changes_scene')).length;
  const reactCount = tierRows.filter(s => s.tags.includes('causes_reaction')).length;
  const quotedCount = tierRows.filter(s => s.tags.includes('quoted_only')).length;
  md += `| ${tier} | ${n} | ${n ? (sceneCount/n*100).toFixed(1) : '—'}% | ${n ? (reactCount/n*100).toFixed(1) : '—'}% | ${n ? (quotedCount/n*100).toFixed(1) : '—'}% |\n`;
}
md += `\n## Sample quoted_only stories (candidates for next-build content review)\n\n`;
md += `_These are HIGH_IMPACT usages where the picker word lands as decoration only — no scene change, no callback. b25+ candidate for converting to absurd_consequence beats._\n\n`;
const quotedOnly = summaries.filter(s => s.totalHits > 0 && s.tags.includes('quoted_only')).slice(0, 8);
for (const q of quotedOnly) {
  md += `- **${q.tier} age ${q.age}** slot=${q.slot} word="${q.pickedWord}" (${q.totalHits} hit${q.totalHits === 1 ? '' : 's'}). Title: _${q.title}_\n`;
}
md += `\n## Notes\n\n- Classification is HEURISTIC. Some \`changes_scene\` calls are over-confident (a "nodded" in tail might be the ally agreeing, not a consequence of the chant). Cross-check the actual rendered story in random-50 output.\n- The \`SCENE_VERBS\` regex is tunable in this file — add verbs as the comedy-role contract evolves.\n`;

fs.writeFileSync(mdPath, md);
console.log(`Sample: ${totalStories} stories (${nulls} nulls).`);
console.log(`HIGH_IMPACT rendered usages: ${totalWithHit}/${totalUsages}`);
console.log(`  changes_scene: ${tagCounts.changes_scene} (${totalWithHit ? (tagCounts.changes_scene/totalWithHit*100).toFixed(1) : '0'}%)`);
console.log(`  quoted_only:   ${tagCounts.quoted_only} (${totalWithHit ? (tagCounts.quoted_only/totalWithHit*100).toFixed(1) : '0'}%)`);
console.log(`Wrote: ${mdPath}`);
