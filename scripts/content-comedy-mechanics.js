#!/usr/bin/env node
/* content-comedy-mechanics.js — b26 Story Comedy Mechanics Pass.
 *
 * Generates 50 random V3 stories and HEURISTICALLY scores each on 7 axes
 * tied to children's-comedy principles. Outputs a markdown report with
 * per-tier aggregates, top 5 strongest scoring stories, and bottom 5
 * weakest, plus a JSON dump for diff comparison.
 *
 * Heuristic scoring is intentionally rough — it is a CHANGE DETECTOR, not a
 * humor judge. Use it to see if a content fix moved a specific axis between
 * builds. Human review of the weakest 5 is still required for ground truth.
 *
 * Axes (0-3 each, sum 0-21):
 *   1. premise_clarity        — story has named protagonist + named conflict
 *                                (mcguffin / goal / obstacle / prop)
 *   2. selected_word_causality — picked freeword / freeword2 / sound appears
 *                                AND is followed within 220 chars by a
 *                                transformation verb (reacted, twitched,
 *                                cracked, opened, hummed, etc.)
 *   3. escalation             — at least 2 transformation verbs across the
 *                                story; bonus if they appear in later half
 *   4. visual_physical_joke   — body / object / motion words present
 *                                (burped, hiccuped, sneezed, danced,
 *                                tumbled, bowed, twitched, etc.)
 *   5. callback_payoff        — kid's freeword OR freeword2 appears in
 *                                2+ separate paragraphs (echo / reprise)
 *   6. age_fit                — vocab complexity matches tier (tot/little
 *                                avoid > 7-letter abstract words;
 *                                tween allowed irony / longer phrases)
 *   7. coherence              — story has narrative arc markers (setup
 *                                phrase + payoff phrase present)
 *
 * Usage:
 *   node scripts/content-comedy-mechanics.js                 # 50 stories
 *   node scripts/content-comedy-mechanics.js --reps 100
 *   node scripts/content-comedy-mechanics.js --out docs/b26-before
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
return { generateStoryV3, generateStoryV2, WORD_BANK, SETTING_FLAVOR_KEYS, resolveSetting, absurdWordsForTier };
`;
  return (new Function(harness))();
}

const args = process.argv.slice(2);
function arg(name, fb) { const i = args.indexOf(name); return (i >= 0 && args[i + 1]) ? args[i + 1] : fb; }
const REPS    = parseInt(arg('--reps', '50'), 10);
const OUT_DIR = arg('--out', path.join(ROOT, 'docs', 'content-qa-runs'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const ctx = loadEngineContext();
const STRIP = t => String(t || '').replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
const TIERS = [['tot',[2,3]],['little',[4,5]],['kid',[6,7]],['big',[8,9,10]],['tween',[11,12,13]]];
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function tierForAge(a){if(a<=3)return'tot';if(a<=5)return'little';if(a<=7)return'kid';if(a<=10)return'big';return'tween';}

function randomPicks(tier) {
  const bank = ctx.WORD_BANK[tier], p = {};
  for (const r of bank) if (r.cat && r.options) p[r.cat] = pick(r.options);
  const a = ctx.absurdWordsForTier(tier, 4);
  if (a[0]) p.freeword  = { w: a[0], subtype: 'shout' };
  if (a[1]) p.freeword2 = { w: a[1] };
  if (a[2]) p.sound     = { w: a[2] };
  const flavor = pick(ctx.SETTING_FLAVOR_KEYS);
  p.setting    = ctx.resolveSetting(flavor);
  p._flavor    = flavor;
  p.storyMode  = Math.random() < 0.5 ? 'bedtime' : 'anytime';
  return p;
}

const TRANSFORM_VERBS = /\b(reacted|reappeared|vanished|opened|cracked|vibrated|twitched|hummed|flipped|wiggled|sneezed|danced|hiccuped|squawked|burped|chanted|echoed|repeated|nodded|bowed|froze|spun|popped|burst|cheered|adopted|listened|obeyed|backed|stepped|caved|collapsed|laughed|gasped|chased|tumbled|tipped)\b/i;
const VISUAL_PHYSICAL_VERBS = /\b(burped|hiccuped|sneezed|danced|tumbled|bowed|twitched|wiggled|popped|spun|tipped|flipped|jumped|hopped|skidded|bounced|chased|skipped|stomped|slid|tiptoed|clapped|nodded|waved|peeked|hugged|crawled|splashed)\b/i;
const SETUP_PHRASES   = /\b(was|were) at the |had been (saving|planning|practicing)|woke up with a plan|set the .{2,30}? down|had committed to|had one objective/i;
const PAYOFF_PHRASES  = /\b(yelled|shouted) "[^"]+"|did it\.|won\.|case closed|loophole held|share the next|new catchphrase|investigation closed/i;

function scoreStory(story, picks, age) {
  const tier = tierForAge(age);
  const title = STRIP(story.title || '');
  const paras = (story.paragraphs || []).map(STRIP);
  const body  = paras.join('\n');
  const full  = title + '\n' + body;
  const lower = full.toLowerCase();

  // 1. premise_clarity (0-3): has protagonist + named conflict element
  let premise = 0;
  if (/\b(cole)\b/i.test(full)) premise++;
  if (picks.food && lower.includes(String(picks.food.w).toLowerCase())) premise++;
  if (picks.place && lower.includes(String(picks.place.w).toLowerCase())) premise++;

  // 2. selected_word_causality (0-3): each HIGH_IMPACT pick followed within 220 chars by transform verb
  let causality = 0;
  for (const slot of ['freeword','freeword2','sound']) {
    const w = picks[slot]?.w;
    if (!w) continue;
    const wRx = new RegExp(String(w).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let m, found = false;
    while ((m = wRx.exec(lower)) !== null) {
      const tail = lower.slice(m.index + String(w).length, m.index + String(w).length + 220);
      if (TRANSFORM_VERBS.test(tail)) { found = true; break; }
    }
    if (found) causality++;
  }

  // 3. escalation (0-3): count transform verbs across body; bonus for late-half occurrence
  const transformMatches = (body.match(new RegExp(TRANSFORM_VERBS.source, 'gi')) || []);
  let escalation = 0;
  if (transformMatches.length >= 1) escalation++;
  if (transformMatches.length >= 3) escalation++;
  const halfIdx = Math.floor(body.length / 2);
  if (TRANSFORM_VERBS.test(body.slice(halfIdx))) escalation++;

  // 4. visual_physical_joke (0-3): count physical-comedy verbs
  const visualMatches = (body.match(new RegExp(VISUAL_PHYSICAL_VERBS.source, 'gi')) || []);
  const visual = Math.min(3, visualMatches.length);

  // 5. callback_payoff (0-3): how many HIGH_IMPACT words appear in ≥2 separate paragraphs
  let callback = 0;
  for (const slot of ['freeword','freeword2','sound']) {
    const w = picks[slot]?.w;
    if (!w) continue;
    const parasWithHit = paras.filter(p => p.toLowerCase().includes(String(w).toLowerCase())).length;
    if (parasWithHit >= 2) callback++;
  }

  // 6. age_fit (0-3): tot/little penalize words > 7 letters in non-pick prose; tween rewards irony markers
  let ageFit = 3;
  if (tier === 'tot' || tier === 'little') {
    // Check body for 8+ letter abstract words that aren't picks
    const pickWords = new Set();
    for (const v of Object.values(picks)) {
      if (v && typeof v === 'object' && v.w) {
        for (const w of String(v.w).toLowerCase().split(/\s+/)) pickWords.add(w);
      }
    }
    const heavyWords = (body.match(/\b[a-z]{8,}\b/gi) || []).filter(w => !pickWords.has(w.toLowerCase()));
    if (heavyWords.length > 6) ageFit -= 1;
    if (heavyWords.length > 12) ageFit -= 1;
  }
  if (tier === 'tween') {
    // Reward irony markers: "technically", "actually", "in a way", "kind of"
    if (/\b(technically|actually|in a way|kind of|sort of)\b/i.test(body)) ageFit = 3;
  }

  // 7. coherence (0-3): has setup phrase + payoff phrase
  let coherence = 0;
  if (SETUP_PHRASES.test(body))   coherence++;
  if (PAYOFF_PHRASES.test(body))  coherence++;
  // Bonus: story has > 2 paragraphs (multi-beat arc)
  if (paras.length >= 3) coherence++;

  const total = premise + causality + escalation + visual + callback + ageFit + coherence;
  return { premise, causality, escalation, visual, callback, ageFit, coherence, total };
}

const rows = [];
let nulls = 0;
const perTier = {};
for (const [tier, _ages] of TIERS) perTier[tier] = [];

// Balance: ~10 per tier.
const perTierCount = Math.ceil(REPS / TIERS.length);
for (const [tierName, ages] of TIERS) {
  for (let i = 0; i < perTierCount; i++) {
    const age   = pick(ages);
    const picks = randomPicks(tierName);
    const s = ctx.generateStoryV3('Cole', picks, age) || ctx.generateStoryV2('Cole', picks, age);
    if (!s) { nulls++; continue; }
    const scores = scoreStory(s, picks, age);
    const row = {
      tier: tierName, age,
      blueprint: s.__blueprint || '(v2 fallback)',
      flavor: picks._flavor,
      storyMode: picks.storyMode,
      picks: {
        freeword:  picks.freeword?.w,
        freeword2: picks.freeword2?.w,
        sound:     picks.sound?.w,
        food:      picks.food?.w,
        place:     picks.place?.w,
      },
      title:      STRIP(s.title || ''),
      paragraphs: (s.paragraphs || []).map(STRIP),
      scores,
    };
    rows.push(row);
    perTier[tierName].push(row);
  }
}

// Aggregate per axis + per tier
const axes = ['premise','causality','escalation','visual','callback','ageFit','coherence'];
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function summary(rows) {
  const out = {};
  for (const ax of axes) out[ax] = +avg(rows.map(r => r.scores[ax])).toFixed(2);
  out.total = +avg(rows.map(r => r.scores.total)).toFixed(2);
  return out;
}

const overall = summary(rows);
const tierSummaries = {};
for (const t of Object.keys(perTier)) tierSummaries[t] = summary(perTier[t]);

const sortedByScore = [...rows].sort((a, b) => b.scores.total - a.scores.total);
const top5    = sortedByScore.slice(0, 5);
const bottom5 = sortedByScore.slice(-5).reverse();

const datetag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mdPath   = path.join(OUT_DIR, `content-comedy-mechanics-${datetag}.md`);
const jsonPath = path.join(OUT_DIR, `content-comedy-mechanics-${datetag}.json`);

let md = `# Content QA — Comedy Mechanics audit\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Sample: ${rows.length} V3 stories (~${perTierCount}/tier; ${nulls} nulls)\n`;
md += `Heuristic scoring; CHANGE DETECTOR — not a humor judge. Use to diff between builds.\n\n`;
md += `## Overall averages (0-3 per axis, 0-21 total)\n\n`;
md += `| Axis | Avg | Max possible |\n|---|---|---|\n`;
md += `| premise_clarity        | ${overall.premise}     | 3 |\n`;
md += `| selected_word_causality| ${overall.causality}   | 3 |\n`;
md += `| escalation             | ${overall.escalation} | 3 |\n`;
md += `| visual_physical_joke   | ${overall.visual}     | 3 |\n`;
md += `| callback_payoff        | ${overall.callback}   | 3 |\n`;
md += `| age_fit                | ${overall.ageFit}     | 3 |\n`;
md += `| coherence              | ${overall.coherence}  | 3 |\n`;
md += `| **TOTAL**              | **${overall.total}**  | **21** |\n\n`;

md += `## Per-tier averages\n\n`;
md += `| Tier | n | premise | causality | escalation | visual | callback | age fit | coherence | total |\n`;
md += `|---|---|---|---|---|---|---|---|---|---|\n`;
for (const t of ['tot','little','kid','big','tween']) {
  const s = tierSummaries[t];
  md += `| ${t} | ${perTier[t].length} | ${s.premise} | ${s.causality} | ${s.escalation} | ${s.visual} | ${s.callback} | ${s.ageFit} | ${s.coherence} | ${s.total} |\n`;
}

md += `\n## Top 5 strongest (highest total)\n\n`;
for (const r of top5) {
  md += `### tier=${r.tier} age=${r.age} blueprint=${r.blueprint}  ·  total=${r.scores.total}/21\n\n`;
  md += `_freeword=${r.picks.freeword}  freeword2=${r.picks.freeword2}  sound=${r.picks.sound}_\n\n`;
  md += `Scores: premise=${r.scores.premise} causality=${r.scores.causality} escalation=${r.scores.escalation} visual=${r.scores.visual} callback=${r.scores.callback} ageFit=${r.scores.ageFit} coherence=${r.scores.coherence}\n\n`;
  md += `**${r.title}**\n\n`;
  for (const p of r.paragraphs) md += `> ${p}\n>\n`;
  md += `\n`;
}

md += `\n## Bottom 5 weakest (lowest total)\n\n`;
for (const r of bottom5) {
  md += `### tier=${r.tier} age=${r.age} blueprint=${r.blueprint}  ·  total=${r.scores.total}/21\n\n`;
  md += `_freeword=${r.picks.freeword}  freeword2=${r.picks.freeword2}  sound=${r.picks.sound}_\n\n`;
  md += `Scores: premise=${r.scores.premise} causality=${r.scores.causality} escalation=${r.scores.escalation} visual=${r.scores.visual} callback=${r.scores.callback} ageFit=${r.scores.ageFit} coherence=${r.scores.coherence}\n\n`;
  md += `**${r.title}**\n\n`;
  for (const p of r.paragraphs) md += `> ${p}\n>\n`;
  md += `\n`;
}

md += `\n## Notes\n\n`;
md += `- Causality measures whether each HIGH_IMPACT picked word is followed within ~220 characters by a transformation verb. Score 1 per slot that lands.\n`;
md += `- Callback measures whether a HIGH_IMPACT picked word appears in 2+ separate paragraphs (echo / reprise).\n`;
md += `- Age fit is a heuristic: tot/little stories with > 6 abstract 8+letter non-pick words drop a point.\n`;
md += `- Coherence rewards a setup phrase + payoff phrase + multi-paragraph arc.\n`;
md += `- Use BEFORE / AFTER diffs of this audit to detect whether a content change moved a specific axis.\n`;

fs.writeFileSync(mdPath,   md);
fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), reps: rows.length, nulls, overall, tierSummaries, rows }, null, 2));

console.log(`Sample: ${rows.length} stories (${nulls} nulls).`);
console.log(`Overall: total=${overall.total}/21 (causality=${overall.causality}, callback=${overall.callback}, coherence=${overall.coherence})`);
console.log(`Wrote:`);
console.log(`  ${mdPath}`);
console.log(`  ${jsonPath}`);
