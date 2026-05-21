#!/usr/bin/env node
/* qa-current.js — repeatable Node QA acceptance harness for the current NoddyTales release.
 *
 * Renamed from qa-v261.js in v2.7.1. This is the single source of truth for "did we break
 * the app?" — every release must pass it before shipping.
 *
 * Verifies:
 *  - v2 age matrix:   50 random app-shaped stories per age, ages 2-13.
 *                     0 nulls, 0 unresolved tokens, 0 missing required-slot mentions.
 *  - v2 targeted:     age 2 sky=moon → 60/60 body + highlight.
 *                     age 4 weather=stormy → 60/60 body + highlight.
 *                     color/move/mood: report rates, no hard gate.
 *  - v3 matrix:       4 blueprints × ages 6-13 × 30 forced stories per blueprint per age.
 *                     0 nulls, 0 unresolved, 6 paragraphs, all picked words in body + highlighted.
 *  - grammar lint:    2,000 v2 random stories. 0 "a donuts/cookies/waffles/pancakes/..." patterns.
 *                     0 generated titles containing " A " (uppercase a) mid-title.
 *  - story mode:      bedtime vs anytime endings at age 9 and age 2.
 *  - inline syntax:   parses every <script> block in index.html via `new Function`.
 *                     Catches the kind of broken inline JS that caused the v2.6.2 blank-screen
 *                     incident before it ever reaches production.
 *
 * Exits non-zero if any hard acceptance criterion fails.
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
return {
  generateStoryV2,
  generateStoryV3,
  WORD_BANK,
};
`;
const ctx = (new Function(harness))();

const strip = t => String(t).replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
const wordRx = (w) => new RegExp('\\b' + String(w).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
const tokenRx = (w) => new RegExp('\\[(?:name|c|y):[^\\]]*\\b' + String(w).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b[^\\]]*\\]', 'i');

let failures = 0;
function gate(label, ok, detail) {
  if (ok) {
    console.log('  ✓ ' + label + (detail ? ' — ' + detail : ''));
  } else {
    console.log('  ✗ ' + label + (detail ? ' — ' + detail : ''));
    failures++;
  }
}

function tierFor(age) {
  if (age <= 3) return 'tot';
  if (age <= 5) return 'little';
  if (age <= 7) return 'kid';
  if (age <= 10) return 'big';
  return 'tween';
}
function pickFromBank(tier, cat) {
  const round = (ctx.WORD_BANK[tier] || []).find(r => r.cat === cat);
  if (!round || !round.options || !round.options.length) return null;
  const o = round.options[Math.floor(Math.random() * round.options.length)];
  return { w: o.w };
}
function randomPicks(tier) {
  const out = {};
  const cats = ['pet','color','food','place','creature','move','mood','sky','weather'];
  for (const c of cats) {
    const p = pickFromBank(tier, c);
    if (p) out[c] = p;
  }
  out.freeword  = { w: 'KAPOW', subtype: 'shout' };
  out.freeword2 = { w: 'BOINGO' };
  return out;
}

/* === 1. v2 AGE MATRIX === */
console.log('\n=== 1. v2 age matrix (50/age × 12 ages = 600 stories) ===');
let matrixNulls = 0, matrixUnresolved = 0, matrixMissingRequired = 0;
const matrixMissingDetail = [];
const REQUIRED_CATS = ['pet','food','place','creature'];
for (let age = 2; age <= 13; age++) {
  const tier = tierFor(age);
  for (let i = 0; i < 50; i++) {
    const picks = randomPicks(tier);
    const s = ctx.generateStoryV2('Cole', picks, age);
    if (!s) { matrixNulls++; continue; }
    const body  = strip(s.paragraphs.join(' '));
    const whole = strip([s.title, ...s.paragraphs].join(' '));
    if (/\{[a-zA-Z][\w.]*\}/.test(whole)) matrixUnresolved++;
    for (const c of REQUIRED_CATS) {
      if (!picks[c]) continue;
      // tot has no creature round, skip if pick is null
      if (!wordRx(picks[c].w).test(body)) {
        matrixMissingRequired++;
        if (matrixMissingDetail.length < 5) {
          matrixMissingDetail.push(`age=${age} ${c}=${picks[c].w} not in body`);
        }
      }
    }
  }
}
gate('0 nulls (matrix)',         matrixNulls === 0,         matrixNulls + '/600');
gate('0 unresolved tokens',      matrixUnresolved === 0,    matrixUnresolved + '/600');
gate('0 missing required-slot mentions', matrixMissingRequired === 0, matrixMissingRequired + ' misses');
if (matrixMissingDetail.length) matrixMissingDetail.forEach(d => console.log('    ' + d));

/* === 2. v2 TARGETED === */
console.log('\n=== 2. v2 targeted regressions ===');
function targetedTest(label, picks, age, needleW, expectedRequired) {
  const SAMPLES = 60;
  let body=0, hl=0, nulls=0;
  for (let i = 0; i < SAMPLES; i++) {
    const s = ctx.generateStoryV2('Cole', picks, age);
    if (!s) { nulls++; continue; }
    const paraRaw = s.paragraphs.join(' ');
    const paraClean = strip(paraRaw);
    if (wordRx(needleW).test(paraClean)) body++;
    if (tokenRx(needleW).test(paraRaw))   hl++;
  }
  gate(label + ' body',  expectedRequired ? body === SAMPLES : body >= 0, body + '/' + SAMPLES);
  gate(label + ' highlight', expectedRequired ? hl === SAMPLES : hl >= 0,   hl + '/' + SAMPLES);
  if (nulls) gate(label + ' nulls', false, nulls + ' null returns');
}
// age 2 sky=moon
targetedTest('age 2 sky=moon',
  { pet:{w:'puppy'}, color:{w:'pink'}, food:{w:'cake'}, place:{w:'park'}, sky:{w:'moon'}, move:{w:'hopped'}, freeword:{w:'BEEP',subtype:'shout'}, freeword2:{w:'BOINGO'} },
  2, 'moon', true);
// age 4 weather=stormy
targetedTest('age 4 weather=stormy',
  { pet:{w:'seal'}, color:{w:'pink'}, food:{w:'cookies'}, place:{w:'kitchen'}, creature:{w:'unicorn'}, move:{w:'floated'}, weather:{w:'stormy'}, freeword:{w:'KAPOW',subtype:'shout'}, freeword2:{w:'BOINGO'} },
  4, 'stormy', true);

// Optional slots — report only
console.log('\n  Optional-slot body rates (report-only, no hard gate):');
function softReport(label, picks, age, needleW) {
  const SAMPLES = 60;
  let body=0, hl=0;
  for (let i=0;i<SAMPLES;i++) {
    const s = ctx.generateStoryV2('Cole', picks, age);
    if (!s) continue;
    const paraRaw = s.paragraphs.join(' ');
    if (wordRx(needleW).test(strip(paraRaw))) body++;
    if (tokenRx(needleW).test(paraRaw)) hl++;
  }
  console.log('    ' + label.padEnd(35) + ` body=${body}/${SAMPLES} hl=${hl}/${SAMPLES}`);
}
softReport('age 6 color=rainbow', { pet:{w:'parrot'}, color:{w:'rainbow'}, food:{w:'donuts'}, place:{w:'jungle'}, creature:{w:'dinosaur'}, move:{w:'bounced'}, mood:{w:'silly'}, freeword:{w:'KABLAM',subtype:'shout'}, freeword2:{w:'BOINGO'} }, 6, 'rainbow');
softReport('age 6 move=bounced',  { pet:{w:'parrot'}, color:{w:'rainbow'}, food:{w:'donuts'}, place:{w:'jungle'}, creature:{w:'dinosaur'}, move:{w:'bounced'}, mood:{w:'silly'}, freeword:{w:'KABLAM',subtype:'shout'}, freeword2:{w:'BOINGO'} }, 6, 'bounced');
softReport('age 6 mood=silly',    { pet:{w:'parrot'}, color:{w:'rainbow'}, food:{w:'donuts'}, place:{w:'jungle'}, creature:{w:'dinosaur'}, move:{w:'bounced'}, mood:{w:'silly'}, freeword:{w:'KABLAM',subtype:'shout'}, freeword2:{w:'BOINGO'} }, 6, 'silly');

/* === 3. v3 MATRIX === */
console.log('\n=== 3. v3 matrix (4 blueprints × ages 6-13 × 30 stories = 960 stories) ===');
const goldenPicks = {
  pet:{w:'parrot'}, food:{w:'donuts'}, place:{w:'jungle'}, creature:{w:'dinosaur'},
  color:{w:'rainbow'}, move:{w:'bounced'}, mood:{w:'silly'},
  freeword:{w:'KABLAM',subtype:'shout'}, freeword2:{w:'BOINGO'},
};
const expectedWords = ['parrot','donuts','jungle','dinosaur','rainbow','bounced','silly','KABLAM','BOINGO'];
const blueprints = ['lost_snack_v3','goal_spine_v3','show_wrong_v3','rule_loophole_v3'];

let v3Nulls=0, v3Unresolved=0, v3WrongArc=0, v3WordMiss=0, v3HlMiss=0;
const v3MissDetail = [];
for (const bp of blueprints) {
  for (let age = 6; age <= 13; age++) {
    for (let i = 0; i < 30; i++) {
      const picks = Object.assign({}, goldenPicks, { __v3BlueprintId: bp });
      const s = ctx.generateStoryV3('Cole', picks, age);
      if (!s) { v3Nulls++; if (v3MissDetail.length < 5) v3MissDetail.push(`${bp} age=${age} → null`); continue; }
      const titleRaw = String(s.title || '');
      const paraRaw  = (s.paragraphs || []).join(' ');
      const paraClean = strip(paraRaw).toLowerCase();
      if (/\{[a-zA-Z][\w.]*\}/.test(titleRaw + paraRaw)) v3Unresolved++;
      if (!s.paragraphs || s.paragraphs.length !== 6) v3WrongArc++;
      for (const w of expectedWords) {
        if (!wordRx(w).test(paraClean))   { v3WordMiss++; if (v3MissDetail.length < 5) v3MissDetail.push(`${bp} age=${age} word "${w}" not in body`); break; }
        if (!tokenRx(w).test(paraRaw))    { v3HlMiss++;   if (v3MissDetail.length < 5) v3MissDetail.push(`${bp} age=${age} word "${w}" not highlighted`); break; }
      }
    }
  }
}
gate('0 nulls (v3 matrix)',          v3Nulls === 0,        v3Nulls + '/960');
gate('0 unresolved tokens',          v3Unresolved === 0,   v3Unresolved + '/960');
gate('6-paragraph arc every time',   v3WrongArc === 0,     v3WrongArc + ' wrong arc');
gate('all picked words in body',     v3WordMiss === 0,     v3WordMiss + ' stories with body miss');
gate('all picked words highlighted', v3HlMiss === 0,       v3HlMiss + ' stories with hl miss');
if (v3MissDetail.length) v3MissDetail.forEach(d => console.log('    ' + d));

/* === 4. GRAMMAR LINT (2,000 v2 stories) === */
console.log('\n=== 4. Grammar lint (2,000 v2 random stories) ===');
/* v2.6.1 lint regex — only TRUE plural-form picker values where "a X" is
   morphologically wrong. Excludes invariant nouns (fish, deer, sheep) which
   take "a" naturally as singular. */
const PLURAL_FOODS_RX = /\ba (donuts|cookies|waffles|pancakes|tacos|burritos|pretzels|noodles|dumplings|cupcakes|jellybeans|grapes|hot dogs|french fries|cheese puffs|fruit snacks|blueberries|strawberries|peas|apple slices|nachos|pickles|enchanted pickles|thunder pancakes|suspicious sandwiches|bewildering cookies|haunted scones|mysterious leftovers|forbidden waffles|emergency noodles|ceremonial nachos|vending machine chips|cafeteria fries|mystery chips|gas station nachos)\b/i;
const A_TITLE_RX     = / A /;  // " A " mid-title
/* v2.7.3 — catch the v2.7.x bug pattern where a punchline beat says "one HUGE waffles"
   for plural foods. Any "one HUGE/big/tiny <plural-food>" is broken. The fix in pl_wrong_1
   uses {food.articleText} which produces "some waffles" / "a pizza" instead. */
const ONE_HUGE_PLURAL_RX = /\bone (HUGE|huge|BIG|big|TINY|tiny) (donuts|cookies|waffles|pancakes|tacos|burritos|pretzels|noodles|dumplings|cupcakes|jellybeans|grapes|hot dogs|french fries|cheese puffs|fruit snacks|blueberries|strawberries|peas|apple slices|nachos|pickles|enchanted pickles|thunder pancakes|suspicious sandwiches|bewildering cookies|haunted scones|mysterious leftovers|forbidden waffles|emergency noodles|ceremonial nachos|vending machine chips|cafeteria fries|mystery chips|gas station nachos)\b/;
let pluralHits = 0, titleHits = 0, oneHugePluralHits = 0, lintNulls = 0;
const pluralSamples = [], titleSamples = [], oneHugePluralSamples = [];
for (let i = 0; i < 2000; i++) {
  const age = 2 + (i % 12);
  const tier = tierFor(age);
  const picks = randomPicks(tier);
  const s = ctx.generateStoryV2('Cole', picks, age);
  if (!s) { lintNulls++; continue; }
  const titleClean = strip(s.title);
  const bodyClean  = strip(s.paragraphs.join(' '));
  if (PLURAL_FOODS_RX.test(bodyClean) || PLURAL_FOODS_RX.test(titleClean)) {
    pluralHits++;
    if (pluralSamples.length < 3) {
      const m = (bodyClean + ' ' + titleClean).match(PLURAL_FOODS_RX);
      pluralSamples.push(`age=${age} "${m && m[0]}" — title: ${titleClean.slice(0,80)}`);
    }
  }
  // Title check: " A " mid-title (excluding cases where it's a proper noun like "A" name — unlikely)
  if (A_TITLE_RX.test(titleClean)) {
    titleHits++;
    if (titleSamples.length < 3) titleSamples.push(`age=${age}: "${titleClean}"`);
  }
  // v2.7.3 lint: catch "one HUGE waffles" / "one HUGE donuts" plural-mismatch patterns
  if (ONE_HUGE_PLURAL_RX.test(bodyClean)) {
    oneHugePluralHits++;
    if (oneHugePluralSamples.length < 3) {
      const m = bodyClean.match(ONE_HUGE_PLURAL_RX);
      oneHugePluralSamples.push(`age=${age} "${m && m[0]}"`);
    }
  }
}
gate('0 plural article errors (a donuts/cookies/...)',          pluralHits === 0,          pluralHits + '/2000');
gate('0 awkward " A " titles',                                  titleHits === 0,           titleHits + '/2000');
gate('0 "one HUGE [plural-food]" mismatches (v2.7.3 regression)', oneHugePluralHits === 0, oneHugePluralHits + '/2000');
if (lintNulls) gate('lint pass: 0 nulls', lintNulls === 0, lintNulls + ' nulls');
if (pluralSamples.length) pluralSamples.forEach(s => console.log('    ' + s));
if (oneHugePluralSamples.length) oneHugePluralSamples.forEach(s => console.log('    ' + s));
if (titleSamples.length)  titleSamples.forEach(s => console.log('    ' + s));

/* === 5. STORY MODE (bedtime vs anytime) === */
console.log('\n=== 5. Story-mode regression (v2.6.2) ===');
function endingAudit(storyMode, age, samples) {
  const tier = tierFor(age);
  let nulls = 0, bedtimeWords = 0, anytimeFootprint = 0;
  const BEDTIME_RX  = /\b(goodnight|good night|asleep|sleep|bedtime|sleepy|fell asleep|time to sleep|tonight)\b/i;
  const ANYTIME_RX  = /\b(walking home|walking back|walked back|walk home|onto the next|see you|tomorrow|onward|head home|headed back|heading off|next thing|next caper|what to do next|do next|home base|find the next|retell this|retelling)\b/i;
  for (let i = 0; i < samples; i++) {
    const picks = randomPicks(tier);
    picks.storyMode = storyMode;
    const s = ctx.generateStoryV2('Cole', picks, age);
    if (!s) { nulls++; continue; }
    const body = strip(s.paragraphs.join(' '));
    if (BEDTIME_RX.test(body))  bedtimeWords++;
    if (ANYTIME_RX.test(body))  anytimeFootprint++;
  }
  return { nulls, bedtimeWords, anytimeFootprint };
}

// Default (bedtime) baseline — most stories should have bedtime imagery.
const bedAt9 = endingAudit('bedtime', 9, 60);
console.log(`  bedtime age 9 (60 stories): bedtime-words=${bedAt9.bedtimeWords}/60 anytime-footprint=${bedAt9.anytimeFootprint}/60 nulls=${bedAt9.nulls}`);

// Anytime — bedtime words should drop dramatically, anytime footprint should rise.
const anyAt9 = endingAudit('anytime', 9, 60);
console.log(`  anytime age 9 (60 stories): bedtime-words=${anyAt9.bedtimeWords}/60 anytime-footprint=${anyAt9.anytimeFootprint}/60 nulls=${anyAt9.nulls}`);

gate('storyMode=anytime stories DON\'T close with sleep (≤10%)', anyAt9.bedtimeWords <= 6, anyAt9.bedtimeWords + '/60');
gate('storyMode=anytime stories use day-ending language (≥60%)', anyAt9.anytimeFootprint >= 36, anyAt9.anytimeFootprint + '/60');

// Tot tier check
const totBed = endingAudit('bedtime', 2, 40);
const totAny = endingAudit('anytime', 2, 40);
console.log(`  tot bedtime: bedtime-words=${totBed.bedtimeWords}/40   tot anytime: bedtime-words=${totAny.bedtimeWords}/40`);
gate('tot storyMode=anytime DOES NOT default to bedtime (≤25%)', totAny.bedtimeWords <= 10, totAny.bedtimeWords + '/40');

/* === 6. INLINE <script> SYNTAX (added v2.7.1) ===
 *
 * Why this gate exists: v2.6.2 shipped with a broken ternary in an inline <script>
 * block in index.html, which silently parse-failed at page load and produced a blank
 * screen for every visitor. No automated check caught it. This gate parses every
 * inline <script> body via `new Function(body)` — if the parser throws, the gate
 * fails. Cheap, fast, and catches the class of bug that hurt us most.
 */
console.log('\n=== 6. Inline <script> syntax (index.html) ===');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptBlockRx = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let blockCount = 0;
let syntaxErrors = 0;
const syntaxErrorDetail = [];
let scriptMatch;
while ((scriptMatch = scriptBlockRx.exec(html)) !== null) {
  const tag = scriptMatch[0].slice(0, scriptMatch[0].indexOf('>') + 1);
  // Skip non-JS blocks (e.g. application/ld+json) and external src= references
  if (/\stype\s*=\s*["'](?!text\/javascript|application\/javascript|module)[^"']+["']/i.test(tag)) continue;
  if (/\ssrc\s*=/i.test(tag)) continue;
  const body = scriptMatch[1];
  if (!body.trim()) continue;
  blockCount++;
  try {
    new Function(body);
  } catch (e) {
    syntaxErrors++;
    if (syntaxErrorDetail.length < 5) {
      syntaxErrorDetail.push(`block #${blockCount}: ${e.message}`);
    }
  }
}
gate('all inline <script> blocks parse cleanly', syntaxErrors === 0, blockCount + ' blocks scanned, ' + syntaxErrors + ' errors');
if (syntaxErrorDetail.length) syntaxErrorDetail.forEach(d => console.log('    ' + d));

/* === SUMMARY === */
console.log('\n=== SUMMARY ===');
if (failures === 0) {
  console.log('  ✓ ALL ACCEPTANCE GATES PASSED');
  process.exit(0);
} else {
  console.log(`  ✗ ${failures} acceptance gate(s) failed`);
  process.exit(1);
}
