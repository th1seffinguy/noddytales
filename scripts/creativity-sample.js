#!/usr/bin/env node
/* creativity-sample.js — b24 humor pass measurement helper.
 *
 * Generates N random V3 stories across random ages and reports:
 *   - count of glue-phrase repeats (Codex 50-story sample baseline)
 *   - count of grammar/polish issues (bare-verb titles, plural-mcguffin
 *     mismatches, "a binoculars"-class article errors)
 *   - top-5 + bottom-5 stories by heuristic humor score
 *   - HIGH_IMPACT punchline coverage (how often a [y:...] token actually
 *     lands a chant or payoff_word value)
 *
 * Usage:
 *   node scripts/creativity-sample.js 50          # 50 stories
 *   node scripts/creativity-sample.js 50 --json > out.json
 *
 * Output: human-readable report on stdout. Pass --json for machine output.
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
return { generateStoryV3, generateStoryV2, WORD_BANK, ABSURD_WORD_BANK, absurdWordsForTier };
`;
const ctx = (new Function(harness))();

const N        = parseInt(process.argv[2] || '50', 10);
const wantJson = process.argv.includes('--json');

/* Glue-phrase tracker — Codex flagged these as appearing too often in the
   pre-b24 50-story sample. b24 expands the variant pools that own each
   phrase. The audit here counts raw occurrences across the new sample. */
const GLUE_PHRASES = [
  { id:'glow',           rx: /A faint .{2,30}? glow/i },
  { id:'room_picked_up', rx: /Everything in the room had picked up/i },
  { id:'just_to_make',   rx: /one more time, just to make a point/i },
  { id:'possibly_memory',rx: /possibly a memory/i },
  { id:'act_normal',     rx: /noticed and tried to act normal\. It was not working/i },
  { id:'meant_business', rx: /in a way that meant business/i },
];

/* Grammar/polish tracker — Priority 1 in b24 task spec. */
const POLISH_REGEXES = [
  // Bare third-person-singular verb after "Cole" — should be "Cole Tells" or
  // restructured ("Tries to Tell"). Title-only check (lowercase title noise
  // would over-match in body prose).
  { id:'title_bare_verb', rx: /\bCole (Tell|Share|Find|Sing|Build|Make|Run|Eat|Catch|Save|Win|Open|Lose|Drop|Pick)\b(?!s)/, scope:'title' },
  // "pretzels was" / "taquitos was" — plural mcguffin + singular verb. Catches the
  // v3_ls_escalation_eyes "The {mcguffin.text} was unaccounted for" leak.
  { id:'plural_was',      rx: /\b(pretzels|taquitos|fries|donuts|cookies|waffles|pancakes|tacos|burritos|grapes|peas|noodles|dumplings|nachos) was\b/i, scope:'body' },
  // "a binoculars" / "a fries" / "a scissors" — singular article on plural-only noun
  { id:'a_plural',        rx: /\ba (binoculars|scissors|pants|shorts|jeans|glasses|tongs)\b/i, scope:'both' },
];

/* Wonder-physicality tracker — Priority 1 (d). The hat / put-on-head beat
   pattern doesn't make sense when wonder_object is sky-class (cloud / star /
   comet / moon). Detect by checking for "put the {cloud|star|moon|...} on
   [c:{ally.text}]'s head" or similar physical placement of sky objects. */
const SKY_NOUNS  = ['cloud','star','moon','sun','rainbow','comet','kite','plane','rocket','snowflake','firework','butterfly','helicopter','bubbles','rain','leaf','stars'];
const SKY_PHYSICALITY_RX = new RegExp('put the (' + SKY_NOUNS.join('|') + ') on top of', 'i');

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function strip(s) { return String(s||'').replace(/\[(name|c|y):([^\]]+)\]/g, '$2'); }

function tierForAge(age) {
  if (age <= 3)  return 'tot';
  if (age <= 5)  return 'little';
  if (age <= 7)  return 'kid';
  if (age <= 10) return 'big';
  return 'tween';
}

function randomPicksForTier(tier) {
  const bank = ctx.WORD_BANK[tier];
  const picks = {};
  for (const round of bank) {
    if (!round.cat || !round.options) continue;
    picks[round.cat] = pick(round.options);
  }
  // Inject freeword + freeword2 from the absurd bank when the tier supports them
  const absurd = ctx.absurdWordsForTier(tier, 4);
  if (absurd[0]) picks.freeword  = { w: absurd[0], subtype: 'shout' };
  if (absurd[1]) picks.freeword2 = { w: absurd[1] };
  return picks;
}

function jokeScore(story, picks) {
  let score = 0;
  const fullText = (story.title || '') + ' ' + (story.paragraphs || []).join(' ');
  // +3 if a [y:...] punchline token lands a freeword/freeword2 value
  const yMatches = fullText.matchAll(/\[y:([^\]]+)\]/g);
  for (const m of yMatches) {
    const val = m[1].toLowerCase();
    if (picks.freeword  && val.includes(String(picks.freeword.w).toLowerCase())) score += 3;
    if (picks.freeword2 && val.includes(String(picks.freeword2.w).toLowerCase())) score += 3;
  }
  // -2 for each glue phrase repeat (penalty)
  for (const g of GLUE_PHRASES) if (g.rx.test(fullText)) score -= 2;
  // -3 for each polish issue
  for (const p of POLISH_REGEXES) {
    const target = p.scope === 'title' ? (story.title || '')
                 : p.scope === 'body'  ? (story.paragraphs || []).join(' ')
                 : fullText;
    if (p.rx.test(target)) score -= 3;
  }
  // -2 for sky-physicality
  if (SKY_PHYSICALITY_RX.test(fullText)) score -= 2;
  // +1 for length variety (heuristic: 5-7 paragraphs read better than 6+ glue blocks)
  return score;
}

const sample = [];
const glueHits = Object.fromEntries(GLUE_PHRASES.map(g => [g.id, 0]));
const polishHits = Object.fromEntries(POLISH_REGEXES.map(p => [p.id, 0]));
let skyPhysHits = 0;
let highImpactPunchlineHits = 0;
let totalFreewordPicks = 0;

for (let i = 0; i < N; i++) {
  const age   = 2 + Math.floor(Math.random() * 12); // 2-13
  const tier  = tierForAge(age);
  const picks = randomPicksForTier(tier);
  const story = ctx.generateStoryV3('Cole', picks, age) || ctx.generateStoryV2('Cole', picks, age);
  if (!story) continue;
  const title = String(story.title || '');
  const body  = (story.paragraphs || []).join('\n');
  const full  = title + '\n' + body;

  // v0.9.3 · b24 — regexes test the STRIPPED text (no [c:...] / [y:...] /
  // [name:...] wrapping tokens) so patterns like "taquitos was" actually
  // match the prose a kid would read on screen.
  const strippedTitle = strip(title);
  const strippedBody  = strip(body);
  const strippedFull  = strippedTitle + '\n' + strippedBody;

  for (const g of GLUE_PHRASES) if (g.rx.test(strippedFull)) glueHits[g.id]++;
  for (const p of POLISH_REGEXES) {
    const target = p.scope === 'title' ? strippedTitle : p.scope === 'body' ? strippedBody : strippedFull;
    if (p.rx.test(target)) polishHits[p.id]++;
  }
  if (SKY_PHYSICALITY_RX.test(strippedFull)) skyPhysHits++;

  if (picks.freeword) totalFreewordPicks++;
  if (picks.freeword) {
    const yTokens = full.matchAll(/\[y:([^\]]+)\]/g);
    for (const m of yTokens) {
      if (m[1].toLowerCase().includes(String(picks.freeword.w).toLowerCase())) {
        highImpactPunchlineHits++;
        break;
      }
    }
  }

  sample.push({
    i, age, tier,
    picks: { freeword: picks.freeword?.w, freeword2: picks.freeword2?.w },
    title: strip(title),
    body:  strip(body),
    score: jokeScore(story, picks),
  });
}

const sorted = [...sample].sort((a, b) => b.score - a.score);
const best   = sorted.slice(0, 5);
const worst  = sorted.slice(-5).reverse();

if (wantJson) {
  console.log(JSON.stringify({ N, glueHits, polishHits, skyPhysHits, highImpactPunchlineHits, totalFreewordPicks, best, worst }, null, 2));
} else {
  console.log(`Sample size: ${sample.length} stories (random ages 2-13)`);
  console.log('\n--- Glue-phrase hits (Codex pre-b24 flagged these repeats) ---');
  for (const g of GLUE_PHRASES) console.log(`  ${g.id.padEnd(18)}: ${glueHits[g.id]} / ${sample.length}`);
  console.log('\n--- Grammar/polish hits ---');
  for (const p of POLISH_REGEXES) console.log(`  ${p.id.padEnd(18)} (${p.scope}): ${polishHits[p.id]} / ${sample.length}`);
  console.log(`  sky_physicality   (body) : ${skyPhysHits} / ${sample.length}`);
  console.log('\n--- HIGH_IMPACT punchline landing rate ---');
  console.log(`  stories with a freeword pick: ${totalFreewordPicks} / ${sample.length}`);
  console.log(`  of those, freeword token rendered as [y:...] punchline: ${highImpactPunchlineHits} / ${totalFreewordPicks}`);
  console.log('\n--- Top 5 by heuristic joke score ---');
  for (const s of best) {
    console.log(`\n[score=${s.score}] tier=${s.tier} age=${s.age} freeword="${s.picks.freeword}" freeword2="${s.picks.freeword2}"`);
    console.log(`TITLE: ${s.title}`);
    s.body.split('\n').forEach((p, i) => console.log(`P${i+1}: ${p}`));
  }
  console.log('\n--- Bottom 5 by heuristic joke score ---');
  for (const s of worst) {
    console.log(`\n[score=${s.score}] tier=${s.tier} age=${s.age} freeword="${s.picks.freeword}" freeword2="${s.picks.freeword2}"`);
    console.log(`TITLE: ${s.title}`);
    s.body.split('\n').forEach((p, i) => console.log(`P${i+1}: ${p}`));
  }
}
