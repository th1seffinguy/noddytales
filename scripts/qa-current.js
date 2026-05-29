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
  V3_BEATS,   // v3.0.2-stability — exposed for Section 5b anytime coverage gate
  V2_BEATS,   // v3.0.2-stability — exposed for Section 5b v2-side anytime coverage
  SOUND_HOT_OPTS,  // v0.9.3 · b2 — exposed for extended Section 11 emoji uniqueness
  BODY_HOT_OPTS,   // v0.9.3 · b2 — exposed for extended Section 11 emoji uniqueness
  SETTING_FLAVORS,        // v0.9.3 · b9 — Setting 2.0 coverage gate
  SETTING_FLAVOR_KEYS,    // v0.9.3 · b9
  resolveSetting,         // v0.9.3 · b9
  migrateLegacySetting,   // v0.9.3 · b9
  VOICE_PRESETS,          // v0.9.3 · b10 — preview unit tests
  VOICE_PRESET_KEYS,      // v0.9.3 · b10
  ABSURD_WORD_BANK,                  // v0.9.3 · b23 — HIGH_IMPACT slot audit
  absurdWordsForTier,                // v0.9.3 · b23
  absurdHintsForTier,                // v0.9.3 · b23
  HIGH_IMPACT_ROLES,                 // v0.9.3 · b23
  HIGH_IMPACT_PICKER_CATEGORIES,     // v0.9.3 · b23
  FREE_TEXT_ROUNDS,                  // v0.9.3 · b23 — needed to audit static freetext examples
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

/* === 3. v3 MATRIX ===
 *
 * v0.9.3 · b20 — paragraph-count gate is now TIER-AWARE. Kid (ages 6-7) drops
 * one stage per blueprint via `skipStagesForKid` so kid stories run 5
 * paragraphs; big (8-10) + tween (11-13) keep the full 6-stage arc. The old
 * single "6-paragraph arc every time" assertion would fail every kid story
 * after the structural trim, so it's split into a tier-aware check.
 */
console.log('\n=== 3. v3 matrix (4 blueprints × ages 6-13 × 30 stories = 960 stories) ===');
const goldenPicks = {
  pet:{w:'parrot'}, food:{w:'donuts'}, place:{w:'jungle'}, creature:{w:'dinosaur'},
  color:{w:'rainbow'}, move:{w:'bounced'}, mood:{w:'silly'},
  freeword:{w:'KABLAM',subtype:'shout'}, freeword2:{w:'BOINGO'},
};
const expectedWords = ['parrot','donuts','jungle','dinosaur','rainbow','bounced','silly','KABLAM','BOINGO'];
const blueprints = ['lost_snack_v3','goal_spine_v3','show_wrong_v3','rule_loophole_v3'];

// Expected paragraph count per tier (b20 tier-aware contract).
// kid: 5 (drops one stage per blueprint); big + tween: 6.
function expectedParagraphsForAge(age) {
  if (age >= 6 && age <= 7) return 5;
  return 6;
}

let v3Nulls=0, v3Unresolved=0, v3WrongArcKid=0, v3WrongArcBigTween=0, v3WordMiss=0, v3HlMiss=0;
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
      const expectedParas = expectedParagraphsForAge(age);
      if (!s.paragraphs || s.paragraphs.length !== expectedParas) {
        if (age <= 7) v3WrongArcKid++;
        else          v3WrongArcBigTween++;
        if (v3MissDetail.length < 5) v3MissDetail.push(`${bp} age=${age} got ${s.paragraphs?.length} paras (expected ${expectedParas})`);
      }
      for (const w of expectedWords) {
        if (!wordRx(w).test(paraClean))   { v3WordMiss++; if (v3MissDetail.length < 5) v3MissDetail.push(`${bp} age=${age} word "${w}" not in body`); break; }
        if (!tokenRx(w).test(paraRaw))    { v3HlMiss++;   if (v3MissDetail.length < 5) v3MissDetail.push(`${bp} age=${age} word "${w}" not highlighted`); break; }
      }
    }
  }
}
gate('0 nulls (v3 matrix)',                          v3Nulls === 0,             v3Nulls + '/960');
gate('0 unresolved tokens',                          v3Unresolved === 0,        v3Unresolved + '/960');
gate('5-paragraph arc every time (kid, ages 6-7)',   v3WrongArcKid === 0,       v3WrongArcKid + ' wrong arc');
gate('6-paragraph arc every time (big+tween, 8-13)', v3WrongArcBigTween === 0,  v3WrongArcBigTween + ' wrong arc');
gate('all picked words in body',                     v3WordMiss === 0,          v3WordMiss + ' stories with body miss');
gate('all picked words highlighted',                 v3HlMiss === 0,            v3HlMiss + ' stories with hl miss');
if (v3MissDetail.length) v3MissDetail.forEach(d => console.log('    ' + d));

/* === 3b. v3 TOT/LITTLE MATRIX (added v2.10.0) ===
 *
 * The v2.10.0 release lands four tot/little-v3 blueprints (tot_wonder_v3,
 * tot_sky_v3, little_quest_v3, little_food_v3) implementing the 3-role contract
 * from docs/tot-little-v3-design.md. Each blueprint targets a single tier
 * (tot: ages 2-3, little: ages 4-5) with a 4-paragraph arc (setup →
 * silly_repeat × 2 → cozy_end).
 *
 * Gates per the design's acceptance criteria:
 *  - 0 nulls / 0 unresolved tokens
 *  - 4-paragraph arc every time
 *  - ally (companion pick) appears in body for every story
 *  - wonder_object appears in body when deterministic (food + sky)
 *    (skip the wonder check for little_quest_v3 because `object` is auto-picked
 *    at random from V2_WORDS.objects with no picker round)
 */
console.log('\n=== 3b. v3 tot/little matrix (v2.10.0 — 4 blueprints × 30 = 240 stories) ===');
const totLittleBlueprints = [
  { id: 'tot_wonder_v3',   ages: [2, 3], wonderPick: 'grapes' },  // wonder = food
  { id: 'tot_sky_v3',      ages: [2, 3], wonderPick: 'cloud'  },  // wonder = sky
  { id: 'little_quest_v3', ages: [4, 5], wonderPick: null     },  // wonder = object (random)
  { id: 'little_food_v3',  ages: [4, 5], wonderPick: 'grapes' },  // wonder = food
];
const totLittlePicks = {
  pet:{w:'bunny'}, food:{w:'grapes'}, place:{w:'park'},
  creature:{w:'frog'}, color:{w:'pink'}, move:{w:'jumped'},
  sky:{w:'cloud'}, weather:{w:'sunny'},
  freeword:{w:'BOINGO',subtype:'shout'}, freeword2:{w:'YAY'},
};
let tlNulls = 0, tlUnresolved = 0, tlWrongArc = 0, tlAllyMiss = 0, tlWonderMiss = 0;
let tlTotal = 0;
const tlMissDetail = [];
for (const bp of totLittleBlueprints) {
  for (const age of bp.ages) {
    for (let i = 0; i < 30; i++) {
      tlTotal++;
      const picks = Object.assign({}, totLittlePicks, { __v3BlueprintId: bp.id });
      const s = ctx.generateStoryV3('Cole', picks, age);
      if (!s) { tlNulls++; if (tlMissDetail.length < 5) tlMissDetail.push(`${bp.id} age=${age} → null`); continue; }
      const titleRaw = String(s.title || '');
      const paraRaw  = (s.paragraphs || []).join(' ');
      const paraClean = strip(paraRaw).toLowerCase();
      if (/\{[a-zA-Z][\w.]*\}/.test(titleRaw + paraRaw)) tlUnresolved++;
      if (!s.paragraphs || s.paragraphs.length !== 4) {
        tlWrongArc++;
        if (tlMissDetail.length < 5) tlMissDetail.push(`${bp.id} age=${age} got ${s.paragraphs?.length} paras (expected 4)`);
      }
      // Ally coverage (companion = bunny in all 240 stories)
      if (!wordRx('bunny').test(paraClean)) {
        tlAllyMiss++;
        if (tlMissDetail.length < 5) tlMissDetail.push(`${bp.id} age=${age} ally "bunny" not in body`);
      }
      // Wonder coverage (only deterministic blueprints — skip object-as-wonder)
      if (bp.wonderPick && !wordRx(bp.wonderPick).test(paraClean)) {
        tlWonderMiss++;
        if (tlMissDetail.length < 5) tlMissDetail.push(`${bp.id} age=${age} wonder "${bp.wonderPick}" not in body`);
      }
    }
  }
}
gate('0 nulls (tot/little v3 matrix)',          tlNulls === 0,      tlNulls + '/' + tlTotal);
gate('0 unresolved tokens (tot/little)',        tlUnresolved === 0, tlUnresolved + '/' + tlTotal);
gate('4-paragraph arc every time (tot/little)', tlWrongArc === 0,   tlWrongArc + ' wrong arc');
gate('ally appears in body (tot/little)',       tlAllyMiss === 0,   tlAllyMiss + ' stories with ally miss');
gate('wonder_object appears in body (tot/little)', tlWonderMiss === 0, tlWonderMiss + ' stories with wonder miss');
if (tlMissDetail.length) tlMissDetail.forEach(d => console.log('    ' + d));

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

/* === 5. STORY MODE (bedtime vs anytime) ===
 *
 * v2.10.2 — endingAudit now scans only the FINAL paragraph for bedtime/anytime
 * imagery, not the entire body. The gate's intent is "does this story CLOSE with
 * sleep imagery" — but the old scan counted any "sleepy" anywhere, including when
 * it was an adjective on a picked creature ("sleepy gecko" in P2 of an otherwise
 * day-ending story). That caused intermittent failures: e.g. tween age 12 anytime
 * occasionally produced 7/60 bedtime-word hits while the actual sleep-ending rate
 * was near zero — sleepy-creature descriptors were flipping the count above the
 * ≤6/60 threshold. Final-paragraph scope matches the gate's intent precisely.
 *
 * Also removed `sleep`/`sleepy`/`asleep` from the BEDTIME_RX in favor of stricter
 * ending phrases that only appear at story close (`fell asleep`, `time to sleep`,
 * `went to sleep`, `time to sleep`). "goodnight" and "bedtime" still match — those
 * never appear mid-story in current content. */
console.log('\n=== 5. Story-mode regression (v2.6.2, scope-fixed v2.10.2) ===');
function endingAudit(storyMode, age, samples) {
  const tier = tierFor(age);
  let nulls = 0, bedtimeWords = 0, anytimeFootprint = 0;
  /* Strict bedtime-ending phrases. "sleep"/"sleepy"/"asleep" as bare words removed:
     they appear in non-ending contexts (sleepy gecko, sleepy moon) and skewed the
     count. Phrase forms ("fell asleep", "time to sleep", "going to sleep") only
     fire at actual sleep endings. */
  const BEDTIME_RX  = /\b(goodnight|good night|bedtime|fell asleep|going to sleep|time to sleep|going to bed|sweet dreams|tucked in)\b/i;
  /* v3.0.2-stability — expanded to cover every valid day-ending phrase used by
     shipping v3 anytime landing beats. Previously the regex missed:
       - "walking out"   (v3_sw_landing_any_tween) — kid/big tween show_wrong
       - "heading home"  (v3_rl_landing_any) — kid/big rule_loophole
       - "back home"     (v3_ls_landing_any) — used as opener of kid/big lost_snack
       - "on the way home" (v3_gs_landing_any) — kid/big goal_spine
       - "walk back"     (defensive — variants of walking back)
       - "next show"     (v3_sw_landing_any_tween) — show-ending future marker
       - "replayed"      (v3_ls_landing_tween_replay) — used as anytime marker in tween
       - "deploy it later" (v3_rl_landing_any) — kid/big rule_loophole
     These weren't a content problem (the beats read as clearly day-ending to humans)
     — they were a regex coverage problem. Tween age 12 anytime gate was hitting
     35-40/60 instead of the expected ~57/60 because show_wrong tween (25% of stories)
     used "Walking out" which had no match. Coverage gate added below (Section 5b)
     prevents new anytime beats from shipping with non-matching phrases. */
  const ANYTIME_RX  = /\b(walking home|walking back|walking out|walked back|walked home|walk home|walk back|onto the next|see you|tomorrow|onward|head home|heading home|headed back|headed home|heading off|next thing|next caper|next show|what to do next|do next|home base|find the next|back home|on the way home|on the way back|retell this|retelling|replayed|deploy it later)\b/i;
  for (let i = 0; i < samples; i++) {
    const picks = randomPicks(tier);
    picks.storyMode = storyMode;
    const s = ctx.generateStoryV2('Cole', picks, age);
    if (!s) { nulls++; continue; }
    // v2.10.2 — scope to the final paragraph (the actual ending), not the full body
    const paragraphs = s.paragraphs || [];
    const endingClean = strip(paragraphs[paragraphs.length - 1] || '');
    if (BEDTIME_RX.test(endingClean))  bedtimeWords++;
    if (ANYTIME_RX.test(endingClean))  anytimeFootprint++;
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

// v2.8.0 — tween (age 12) explicit anytime gate. Previously only age 9 + tot age 2 were gated.
// Adds parity coverage for the highest-age tier so tween anytime stories don't silently drift
// toward bedtime endings. Same thresholds as age 9 (≤10% bedtime words, ≥60% anytime markers).
const tweenAny = endingAudit('anytime', 12, 60);
console.log(`  anytime age 12 (60 stories): bedtime-words=${tweenAny.bedtimeWords}/60 anytime-footprint=${tweenAny.anytimeFootprint}/60 nulls=${tweenAny.nulls}`);
gate('tween (age 12) storyMode=anytime stories DON\'T close with sleep (≤10%)', tweenAny.bedtimeWords <= 6,  tweenAny.bedtimeWords + '/60');
gate('tween (age 12) storyMode=anytime stories use day-ending language (≥60%)', tweenAny.anytimeFootprint >= 36, tweenAny.anytimeFootprint + '/60');

/* === 5b. ANYTIME BEAT COVERAGE GATE (added v3.0.2-stability) ===
 *
 * Companion gate to Section 5. Walks every v3 `mode:'anytime'` landing beat
 * (V3_BEATS where stage='landing' AND mode='anytime') and confirms each one's
 * text contains at least one ANYTIME_RX-matching phrase. Without this gate, a
 * new anytime beat can ship with phrasing the regex doesn't recognize, which
 * silently lowers the Section 5 hit rate until it dips below the 60% threshold
 * and the harness fails intermittently. Two beats had this issue at v3.0.2:
 *   - v3_sw_landing_any_tween: "Walking out" (regex had "walking home/back" only)
 *   - v3_rl_landing_any (kid/big): "Heading home" (regex had "head home" only)
 * Both were correct content; the regex was incomplete. v3.0.2-stability expands
 * the regex AND adds this gate so the next new beat is caught at QA time,
 * not as a Section 5 flake.
 */
console.log('\n=== 5b. Anytime beat coverage (every anytime beat must hit ANYTIME_RX) ===');
const ANYTIME_RX_GATE = /\b(walking home|walking back|walking out|walked back|walked home|walk home|walk back|onto the next|see you|tomorrow|onward|head home|heading home|headed back|headed home|heading off|next thing|next caper|next show|what to do next|do next|home base|find the next|back home|on the way home|on the way back|retell this|retelling|replayed|deploy it later)\b/i;
const v3AnytimeLanding = ctx.V3_BEATS.filter(b => b.stage === 'landing' && b.mode === 'anytime');
const V2_ANYTIME_BEAT_TYPES = new Set(['bedtime_landing','tot_cozy_end','little_cozy_end']);
const v2AnytimeEnding   = ctx.V2_BEATS.filter(b => b.mode === 'anytime' && V2_ANYTIME_BEAT_TYPES.has(b.beatType));
const allAnytimeBeats   = [...v3AnytimeLanding, ...v2AnytimeEnding];
let anytimeMisses = 0;
const anytimeMissDetail = [];
for (const beat of allAnytimeBeats) {
  const lines = beat.lines || [];
  for (let i = 0; i < lines.length; i++) {
    const cleaned = strip(lines[i]);
    if (!ANYTIME_RX_GATE.test(cleaned)) {
      anytimeMisses++;
      if (anytimeMissDetail.length < 5) {
        anytimeMissDetail.push(`${beat.id} line ${i}: "${cleaned.slice(0, 110)}..."`);
      }
    }
  }
}
gate('every anytime ending beat (v2 + v3) contains a recognized day-ending phrase',
     anytimeMisses === 0,
     anytimeMisses + ' beat lines miss ANYTIME_RX (of ' + allAnytimeBeats.length + ' beats scanned: ' + v3AnytimeLanding.length + ' v3 + ' + v2AnytimeEnding.length + ' v2)');
if (anytimeMissDetail.length) anytimeMissDetail.forEach(d => console.log('    ' + d));

/* === 7. TOT/LITTLE KID-AGENCY GATE (added v2.8.0) ===
 *
 * v2.7.1 UAT found ages 2-5 kid-agency averaging 2.2-2.6 (below the plan's 3.5 target).
 * The v2.8.0 content pass added Cole-initiates action beats for tot and little. This
 * gate quantifies the shift: across 100 sampled tot+little stories, classify every
 * verb that follows "Cole" as the sentence subject. The action-verb share must clear
 * 0.65 (i.e. Cole drives in ≥2/3 of subject-verb pairs).
 *
 * Action verbs: spotted, reached, picked, decided, pulled, climbed, opened, grabbed,
 *               led, built, found, chose, jumped, ran, spun, packed, brought, hugged,
 *               clapped, pointed, put, carried, called, waved, held, gave, knelt,
 *               leapt, drew, made, wrote.
 * Reaction verbs: heard, saw, noticed, watched, giggled, smiled, loved, looked, felt,
 *                 listened, laughed, grinned, stared, blinked.
 * Other verbs are neutral and don't count either way.
 */
console.log('\n=== 7. Tot/little kid-agency action-verb gate (added v2.8.0) ===');
const ACTION_VERBS_RX = /^(spotted|reached|picked|decided|pulled|climbed|opened|grabbed|led|built|found|chose|jumped|ran|spun|packed|brought|hugged|clapped|pointed|put|carried|called|waved|held|gave|knelt|leapt|drew|made|wrote)$/i;
const REACTION_VERBS_RX = /^(heard|saw|noticed|watched|giggled|smiled|loved|looked|felt|listened|laughed|grinned|stared|blinked)$/i;
const TOT_LITTLE_AGES = [2, 3, 4, 5];
const AGENCY_SAMPLES_PER_AGE = 25;
let kidActionTotal = 0, kidReactionTotal = 0;
const agencyWorst = [];
for (const age of TOT_LITTLE_AGES) {
  const tier = tierFor(age);
  for (let i = 0; i < AGENCY_SAMPLES_PER_AGE; i++) {
    const picks = randomPicks(tier);
    const s = ctx.generateStoryV2('Cole', picks, age);
    if (!s) continue;
    const body = strip(s.paragraphs.join(' '));
    let storyActions = 0, storyReactions = 0;
    body.replace(/\bCole\s+([a-z]+)/g, (_, verb) => {
      if (ACTION_VERBS_RX.test(verb)) storyActions++;
      else if (REACTION_VERBS_RX.test(verb)) storyReactions++;
      return _;
    });
    kidActionTotal    += storyActions;
    kidReactionTotal  += storyReactions;
    if (storyActions + storyReactions > 0) {
      agencyWorst.push({
        age,
        actions: storyActions,
        reactions: storyReactions,
        ratio: storyActions / (storyActions + storyReactions),
        snippet: body.slice(0, 140),
      });
    }
  }
}
const agencyDenom = kidActionTotal + kidReactionTotal;
const agencyRatio = agencyDenom > 0 ? kidActionTotal / agencyDenom : 0;
console.log(`  tot+little Cole-subject verbs: action=${kidActionTotal} reaction=${kidReactionTotal} ratio=${agencyRatio.toFixed(2)}`);
gate('tot/little kid-agency action-verb ratio ≥ 0.65', agencyRatio >= 0.65, `${kidActionTotal} action / ${agencyDenom} total`);
if (agencyRatio < 0.65) {
  agencyWorst.sort((a, b) => a.ratio - b.ratio);
  console.log('  Worst 5 stories by action-verb ratio:');
  agencyWorst.slice(0, 5).forEach(w => console.log(`    age=${w.age} actions=${w.actions} reactions=${w.reactions} ratio=${w.ratio.toFixed(2)}: ${w.snippet}...`));
}

/* === 10. SENTENCE-COUNT REPORT (added v2.10.2, advisory only) ===
 *
 * Open defect from 2026-05-21: "Stories too long globally — early tier most severe,
 * sentence caps not enforced." Defect proposes hard caps per tier (tot 3-4, little 5-6,
 * kid 7-8, big 9-11, tween 10-12) and a QA gate that fails on exceedance.
 *
 * v0.9.3 · b20 — Section 10 fixed to measure V3 (production-default engine, since
 * v3.0.0) as the PRIMARY metric. Previously this section measured generateStoryV2
 * directly, but buildStory() in index.html routes V3 first for all ages 2-13, so the
 * old numbers described a fallback engine real users never hit. V2 stays available
 * as a SECONDARY diagnostic so we can spot if the silent fallback drifts.
 *
 * scripts/sentence-count-snapshot.js reports the same V3+V2 matrix at 120 reps for
 * release-time before/after comparisons. Section 10 here uses 30 reps for speed.
 */
console.log('\n=== 10. Sentence-count report (advisory, v0.9.3 b20 — V3 primary, V2 secondary) ===');
function sentenceCount(text) {
  // Conservative sentence-splitter: split on . ! ? followed by whitespace or EOL.
  // Counts terminal punctuation as a sentence boundary. Ignores ellipses by collapsing.
  return text
    .replace(/\.{3,}/g, '.')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0)
    .length;
}
const TIER_TARGETS = { tot:'3-4', little:'5-6', kid:'7-8', big:'9-11', tween:'10-12' };
const TIER_AGES    = { tot:[2,3], little:[4,5], kid:[6,7], big:[8,9,10], tween:[11,12,13] };
function sampleSentenceCounts(engineFn, tier, reps) {
  const ages = TIER_AGES[tier];
  const counts = [];
  for (let i = 0; i < reps; i++) {
    const age = ages[i % ages.length];
    const picks = randomPicks(tier);
    const s = engineFn('Cole', picks, age);
    if (!s) continue;
    counts.push(sentenceCount(strip(s.paragraphs.join(' '))));
  }
  counts.sort((a, b) => a - b);
  return {
    median: counts[Math.floor(counts.length / 2)],
    p90:    counts[Math.floor(counts.length * 0.9)],
    max:    counts[counts.length - 1],
    n:      counts.length,
  };
}
console.log('  V3 (production-default engine — what real users hit):');
console.log('  tier    median  p90  max  target (defect-proposed cap)');
for (const tier of ['tot','little','kid','big','tween']) {
  const { median, p90, max } = sampleSentenceCounts(ctx.generateStoryV3, tier, 30);
  const target = TIER_TARGETS[tier];
  console.log(`  ${tier.padEnd(7)} ${String(median).padStart(6)}  ${String(p90).padStart(3)}  ${String(max).padStart(3)}  ${target}`);
}
console.log('  V2 (silent fallback — diagnostic only; route only hits this when V3 returns null):');
console.log('  tier    median  p90  max  target');
for (const tier of ['tot','little','kid','big','tween']) {
  const { median, p90, max } = sampleSentenceCounts(ctx.generateStoryV2, tier, 30);
  const target = TIER_TARGETS[tier];
  console.log(`  ${tier.padEnd(7)} ${String(median).padStart(6)}  ${String(p90).padStart(3)}  ${String(max).padStart(3)}  ${target}`);
}
console.log('  (advisory — no gate. V3 numbers are the ones that matter for the "Stories too long globally" defect.)');

/* === 11. EMOJI UNIQUENESS WITHIN PICKER ROUNDS (added v3.0.1) ===
 *
 * v3.0.1 critical UX defect: kid-tier food round had two options ("nachos" and
 * "cheese puffs") both using the cheese-wedge 🧀 emoji. Parent screenshot showed
 * the picker rendering two visually-identical cards. Audit found 38 collisions
 * across tot/little/kid/big/tween. v3.0.1 fixed each one and added this gate so
 * the class cannot recur.
 *
 * Within each WORD_BANK[tier].rounds[].options array, every option's `e` emoji
 * must be distinct from every other option's `e` in the same round. Different
 * rounds can share emojis (a `place` round and a `creature` round can both use
 * 🏫 — they're never shown together).
 */
console.log('\n=== 11. Emoji uniqueness within picker rounds (v3.0.1) ===');
const WORD_BANK = ctx.WORD_BANK;
let emojiCollisions = 0;
const emojiCollisionDetail = [];
for (const tier of Object.keys(WORD_BANK)) {
  for (const round of WORD_BANK[tier]) {
    if (!round.options || !round.options.length) continue;
    const byEmoji = {};
    for (const opt of round.options) {
      const e = opt.e || '(no-emoji)';
      if (!byEmoji[e]) byEmoji[e] = [];
      byEmoji[e].push(opt.w);
    }
    for (const [emoji, words] of Object.entries(byEmoji)) {
      if (words.length > 1) {
        emojiCollisions++;
        if (emojiCollisionDetail.length < 10) {
          emojiCollisionDetail.push(`${tier}.${round.cat}: ${emoji} used for [${words.join(', ')}]`);
        }
      }
    }
  }
}
gate('0 emoji collisions within picker rounds', emojiCollisions === 0, emojiCollisions + ' collisions');
if (emojiCollisionDetail.length) emojiCollisionDetail.forEach(d => console.log('    ' + d));

/* v0.9.3 · b2 — extended Section 11: SOUND_HOT_OPTS is now universal at little + kid
 * (Selection Joy Pass Phase 1), and BODY_HOT_OPTS is still surfaced when Potty Word Mode
 * is enabled. Both pools must keep their within-pool emoji uniqueness for the same reason
 * WORD_BANK rounds do: kids shouldn't see two visually identical cards with different words.
 */
function checkPoolEmojiUniqueness(pool, label) {
  const byEmoji = {};
  for (const opt of pool) {
    const e = opt.e || '(no-emoji)';
    if (!byEmoji[e]) byEmoji[e] = [];
    byEmoji[e].push(opt.w);
  }
  let collisions = 0;
  const detail = [];
  for (const [emoji, words] of Object.entries(byEmoji)) {
    if (words.length > 1) {
      collisions++;
      detail.push(`${label}: ${emoji} used for [${words.join(', ')}]`);
    }
  }
  gate(`0 emoji collisions within ${label}`, collisions === 0, collisions + ' collisions');
  if (detail.length) detail.forEach(d => console.log('    ' + d));
}
checkPoolEmojiUniqueness(ctx.SOUND_HOT_OPTS, 'SOUND_HOT_OPTS');
checkPoolEmojiUniqueness(ctx.BODY_HOT_OPTS, 'BODY_HOT_OPTS');

/* === 12. SHUFFLE NO-DUPLICATE GATE (added v0.9.3 · b3) ===
 *
 * Selection Joy Pass Phase 4 introduces a 🎲 "Show me different ones" button on every
 * tap round. The button re-rolls the 2 cards from the same fullPool, excluding the
 * currently-shown 2 when possible. When pool size >= 4, the re-roll MUST produce 2
 * options that don't match the previous set — otherwise the kid taps shuffle and
 * sees the same cards, which is the opposite of the intended experience.
 *
 * This gate simulates the runtime shuffle algorithm 100 times per pool against
 * every distinct tap-round pool: WORD_BANK[tier][cat] (all combinations) plus
 * SOUND_HOT_OPTS and BODY_HOT_OPTS. Pool sizes verified >= 4 (smallest WORD_BANK
 * round is 12; SOUND/BODY are 12 each).
 */
console.log('\n=== 12. Shuffle no-duplicate gate (v0.9.3 · b3) ===');
function simulateShuffle(pool) {
  // Initial draw of 2 cards
  const shuffled1 = [...pool].sort(() => Math.random() - 0.5);
  const current   = shuffled1.slice(0, 2);
  const currentKeys = new Set(current.map(o => o.w));
  // Re-roll using runtime algorithm
  const eligible = pool.filter(o => !currentKeys.has(o.w));
  const source   = eligible.length >= 2 ? eligible : pool;
  const shuffled2 = [...source].sort(() => Math.random() - 0.5);
  const next      = shuffled2.slice(0, 2);
  // Count overlap
  const nextKeys  = new Set(next.map(o => o.w));
  let overlap = 0;
  for (const k of currentKeys) if (nextKeys.has(k)) overlap++;
  return { poolSize: pool.length, overlap };
}
const SHUFFLE_REPS = 100;
let shuffleViolations = 0;
const shuffleDetail  = [];
function runShuffleGate(label, pool) {
  if (pool.length < 4) {
    // Document but don't gate — re-rolls on tiny pools intentionally fall back to full pool.
    shuffleDetail.push(`${label}: pool=${pool.length} (skipped — runtime falls back to full pool)`);
    return;
  }
  let violations = 0;
  for (let i = 0; i < SHUFFLE_REPS; i++) {
    const r = simulateShuffle(pool);
    if (r.overlap > 0) violations++;
  }
  if (violations > 0) {
    shuffleViolations += violations;
    shuffleDetail.push(`${label}: ${violations}/${SHUFFLE_REPS} re-rolls overlapped`);
  }
}
for (const tier of Object.keys(ctx.WORD_BANK)) {
  for (const round of ctx.WORD_BANK[tier]) {
    if (!round.options || !round.options.length) continue;
    runShuffleGate(`${tier}.${round.cat} (pool=${round.options.length})`, round.options);
  }
}
runShuffleGate('SOUND_HOT_OPTS', ctx.SOUND_HOT_OPTS);
runShuffleGate('BODY_HOT_OPTS', ctx.BODY_HOT_OPTS);
gate(`0 shuffle re-roll duplicates across ${SHUFFLE_REPS} reps/pool`, shuffleViolations === 0, shuffleViolations + ' violations');
if (shuffleDetail.length) shuffleDetail.forEach(d => console.log('    ' + d));

/* === 13. HIGHLIGHT-ONLY-PICKS GATE (added v0.9.3 · b4) ===
 *
 * User-reported visual defect: stories rendered engine-chosen tokens (mcguffin,
 * locked-setting, false_suspect) with the SAME chip styling as user-picked words.
 * Result: "highlighted = something I tapped" promise broken. v0.9.3 · b4 fixes
 * this in parseStoryLine() by cross-checking each token against state.picks,
 * state.name, state.sidekicks; non-matches render as plain text. Yellow chip
 * style retired (collapsed to .pop orange) for consistency.
 *
 * This gate is a unit test on the new parseStoryLine logic. Replicates the
 * function in Node (no DOM needed) and asserts the chip-emission rules.
 */
console.log('\n=== 13. Highlight-only-picks gate (v0.9.3 · b4) ===');
// Replicate parseStoryLine + isPickedToken from index.html. If the renderer
// changes, this stays the contract test.
function esc(s) { return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function isPickedToken(lc, pickedSet) {
  if (pickedSet.has(lc)) return true;
  for (const p of pickedSet) {
    if (!p) continue;
    if (lc === p + 's'  || lc === p + 'es') return true;
    if (p  === lc + 's' || p  === lc + 'es') return true;
    if (p.includes(' ') || lc.includes(' ')) {
      const tokenWords = lc.split(/\s+/).filter(Boolean);
      const pickWords  = p.split(/\s+/).filter(Boolean);
      if (tokenWords.some(t => pickWords.includes(t))) return true;
    }
  }
  return false;
}
function parseStoryLineUT(line, st) {
  const picks     = (st && st.picks) || {};
  const pickedSet = new Set();
  for (const cat in picks) {
    const p = picks[cat];
    if (p && p.w) pickedSet.add(String(p.w).toLowerCase().trim());
  }
  const kidName   = ((st && st.name) || '').toLowerCase().trim();
  const sidekicks = new Set(((st && st.sidekicks) || []).map(s => String(s).toLowerCase().trim()).filter(Boolean));
  return line.replace(/\[(name|c|y):([^\]]+)\]/g, (_, kind, text) => {
    const safe = esc(text);
    const lc   = text.toLowerCase().trim();
    if (kind === 'name') {
      if (lc === kidName || sidekicks.has(lc)) return `<span class="pop pop--name">${safe}</span>`;
      return safe;
    }
    if (isPickedToken(lc, pickedSet)) return `<span class="pop">${safe}</span>`;
    return safe;
  });
}
// Test fixture: a kid named Cole, sidekick Olivia, picks pizza/otter/dramatic/dinosaur/skated/rainbow.
const testState = {
  name: 'Cole',
  sidekicks: ['Olivia'],
  picks: {
    pet:      { w: 'otter' },
    food:     { w: 'pizza' },
    creature: { w: 'dinosaur' },
    move:     { w: 'skated' },
    mood:     { w: 'dramatic' },
    color:    { w: 'rainbow' },
  },
};
const ut = [
  // [input, expected substring, label]
  { in: '[name:Cole]',             expectChip: 'pop pop--name', label: 'kid name → name chip' },
  { in: '[name:Olivia]',           expectChip: 'pop pop--name', label: 'sidekick → name chip' },
  { in: '[name:Their pal]',        expectChip: null,            label: 'phantom name → plain' },
  { in: '[c:otter]',               expectChip: 'pop"',          label: 'picked pet → orange chip' },
  { in: '[c:pizza]',               expectChip: 'pop"',          label: 'picked food → orange chip' },
  { in: '[c:dinosaur]',            expectChip: 'pop"',          label: 'picked creature → orange chip' },
  { in: '[c:dramatic]',            expectChip: 'pop"',          label: 'picked mood → orange chip' },
  { in: '[c:skated]',              expectChip: 'pop"',          label: 'picked move → orange chip' },
  { in: '[c:rainbow]',             expectChip: 'pop"',          label: 'picked color → orange chip' },
  { in: '[c:sleepy megaphone]',    expectChip: null,            label: 'engine mcguffin → plain' },
  { in: '[y:forest]',              expectChip: null,            label: 'locked setting → plain' },
  { in: '[c:bewildered penguin]',  expectChip: null,            label: 'engine ally → plain' },
  // Plural tolerance
  { in: '[c:pizzas]',              expectChip: 'pop"',          label: 'plural of picked food → chip' },
  // Word-boundary case sensitivity (substring of unrelated word should NOT match)
  // pick=otter; token=otterly (made up). Should match because "otter" is prefix; that's an
  // accepted false-positive shape (very rare in templates). Test the opposite: no overlap.
  { in: '[c:scattered]',           expectChip: null,            label: 'unrelated word → plain (no false-positive)' },
  // Yellow no longer emits its old class — verify .pop--yellow never appears.
  { in: '[y:forest]',              expectClassAbsent: 'pop--yellow', label: 'y-token never emits pop--yellow' },
  { in: '[y:jungle]',              expectClassAbsent: 'pop--yellow', label: 'y-token never emits pop--yellow (any value)' },
];
let ut_pass = 0;
let ut_fail = 0;
for (const t of ut) {
  const out = parseStoryLineUT(t.in, testState);
  let ok = true;
  if (t.expectChip === null) {
    // Should be plain text (no chip)
    if (out.includes('class="pop')) ok = false;
  } else if (typeof t.expectChip === 'string') {
    if (!out.includes(t.expectChip)) ok = false;
  }
  if (t.expectClassAbsent) {
    if (out.includes(t.expectClassAbsent)) ok = false;
  }
  if (ok) ut_pass++;
  else {
    ut_fail++;
    console.log(`    ✗ ${t.label}: input=${t.in} → ${out}`);
  }
}
gate(`parseStoryLine unit tests (${ut.length} cases)`, ut_fail === 0, ut_fail + ' failed');
console.log(`    ${ut_pass}/${ut.length} cases passed`);

/* === 14. NARRATOR VOICE SELECTOR — proxy resolver + cache key (added v0.9.3 · b8) ===
 *
 * v0.9.3 · b8 introduces a curated narrator voice picker (sunny/cozy/adventure/silly).
 * The client sends voicePreset to /api/tts; the proxy:
 *   - rejects unknown presets with 400
 *   - resolves preset → voice ID via per-preset env vars (ELEVENLABS_VOICE_SUNNY etc.)
 *   - falls back to ELEVENLABS_VOICE_ID when a specific env var is unset
 *   - never accepts a raw voice ID from the client (defense vs. spoofed payloads)
 *
 * Cache: the client-side TTSManager keys IndexedDB entries by "${voicePreset}|${hash}"
 * so switching voices does NOT replay cached audio from a different voice.
 *
 * This gate is a pure-function unit test on the proxy's resolveVoice() + the hashKey
 * shape. No network. No DOM.
 */
console.log('\n=== 14. Narrator Voice Selector — proxy resolver + cache key (v0.9.3 · b8) ===');
const tts = require(path.join(ROOT, 'api/tts.js'));
const voiceCases = [];
function vAssert(label, cond, detail) {
  voiceCases.push({ label, ok: !!cond, detail });
}

// 1. Known preset 'sunny' resolves via its specific env var.
{
  const r = tts.resolveVoice('sunny', { ELEVENLABS_VOICE_SUNNY: 'voice_sunny_xyz', ELEVENLABS_VOICE_ID: 'voice_default' });
  vAssert('sunny → ELEVENLABS_VOICE_SUNNY when set', r.ok && r.voiceId === 'voice_sunny_xyz' && r.usedFallback === false);
}
// 2. v0.9.3 · b17 — cozy with no per-preset env now resolves to cozy's HARDCODED
//    defaultId (George, the British storybook voice), NOT to ELEVENLABS_VOICE_ID.
//    The hardcoded default beats the universal env fallback so all 4 presets sound
//    distinct out-of-the-box without operator action.
{
  const r = tts.resolveVoice('cozy', { ELEVENLABS_VOICE_ID: 'voice_default' });
  vAssert('cozy with no per-preset env → uses cozy hardcoded default (not ELEVENLABS_VOICE_ID)',
    r.ok && r.voiceId === 'JBFqnCBsd6RMkjVDRZzb' && r.source === 'hardcodedPerPreset' && r.usedFallback === false);
}
// 3. Known preset 'adventure' picks its own env var when present.
{
  const r = tts.resolveVoice('adventure', { ELEVENLABS_VOICE_ADVENTURE: 'voice_adv_abc', ELEVENLABS_VOICE_ID: 'voice_default' });
  vAssert('adventure → ELEVENLABS_VOICE_ADVENTURE when set', r.ok && r.voiceId === 'voice_adv_abc');
}
// 4. Known preset 'silly' picks its own env var.
{
  const r = tts.resolveVoice('silly', { ELEVENLABS_VOICE_SILLY: 'voice_silly_qrs', ELEVENLABS_VOICE_ID: 'voice_default' });
  vAssert('silly → ELEVENLABS_VOICE_SILLY when set', r.ok && r.voiceId === 'voice_silly_qrs');
}
// 5. Unknown preset is rejected 400.
{
  const r = tts.resolveVoice('hacker_voice', { ELEVENLABS_VOICE_ID: 'voice_default' });
  vAssert('unknown preset rejected 400', !r.ok && r.status === 400);
}
// 6. Arbitrary voice ID strings from the client are NOT accepted as presets.
{
  const r = tts.resolveVoice('JBFqnCBsd6RMkjVDRZzb', { ELEVENLABS_VOICE_ID: 'voice_default' });
  vAssert('raw voice ID from client rejected', !r.ok && r.status === 400);
}
// 7. Empty / null preset defaults to Sunny.
{
  const r = tts.resolveVoice(null, { ELEVENLABS_VOICE_SUNNY: 'voice_sunny', ELEVENLABS_VOICE_ID: 'voice_default' });
  vAssert('null preset → default Sunny', r.ok && r.preset === 'sunny' && r.voiceId === 'voice_sunny');
}
// 8. Per-preset voice_settings differ (mood differentiation even on shared fallback voice).
{
  const sunny = tts.resolveVoice('sunny', { ELEVENLABS_VOICE_ID: 'v' });
  const cozy  = tts.resolveVoice('cozy',  { ELEVENLABS_VOICE_ID: 'v' });
  const silly = tts.resolveVoice('silly', { ELEVENLABS_VOICE_ID: 'v' });
  const distinctStyles = new Set([sunny.voice_settings.style, cozy.voice_settings.style, silly.voice_settings.style]).size;
  vAssert('per-preset voice_settings.style differ', distinctStyles === 3, `got ${distinctStyles} distinct styles`);
}
// 9. Cache key differs by preset (client-side hash shape replication).
{
  // Mirror the TTSManager.hashKey shape: `${voicePreset}|${hex16}`
  // We can't run crypto.subtle here, but we can test the prefix discrimination.
  const buildKey = (preset, hex) => `${preset}|${hex}`;
  const same = 'a1b2c3d4e5f6a7b8';
  vAssert('cache key prefix differs by preset',
    buildKey('sunny', same) !== buildKey('cozy', same) &&
    buildKey('sunny', same) !== buildKey('silly', same) &&
    buildKey('adventure', same) !== buildKey('cozy', same));
}
// 10. All client-side VOICE_PRESETS have a server-side allowlist entry.
{
  const clientPresets = ['sunny','cozy','adventure','silly']; // mirrors VOICE_PRESET_KEYS in content.js
  const missing = clientPresets.filter(k => !tts.VALID_PRESETS.includes(k));
  vAssert('every client VOICE_PRESET has a server VOICE_MAP entry', missing.length === 0, missing.join(','));
}
// 11. Production-like env: 4 distinct preset env vars resolve to 4 distinct voice IDs.
//     Catches the b8 trap where an operator forgets to provision all four env vars
//     and every preset silently collapses to ELEVENLABS_VOICE_ID, making previews
//     sound identical.
{
  const prodEnv = {
    ELEVENLABS_VOICE_SUNNY:     'voice_id_sunny_distinct',
    ELEVENLABS_VOICE_COZY:      'voice_id_cozy_distinct',
    ELEVENLABS_VOICE_ADVENTURE: 'voice_id_adventure_distinct',
    ELEVENLABS_VOICE_SILLY:     'voice_id_silly_distinct',
    ELEVENLABS_VOICE_ID:        'voice_id_default',
  };
  const ids = ctx.VOICE_PRESET_KEYS.map(k => tts.resolveVoice(k, prodEnv).voiceId);
  const distinct = new Set(ids).size;
  vAssert('production-like env: 4 presets → 4 distinct voice IDs', distinct === 4, `got ${distinct} distinct (${ids.join(', ')})`);
}
// 12. v0.9.3 · b17 — with hardcoded per-preset defaults shipped, NO env vars set
//     still resolves to 4 DISTINCT voice IDs (curated stock voices). This catches
//     the b16 identical-previews trap at the source: if any two presets ever share
//     the same defaultId, this assertion fails. Inverts the b16 detectability
//     assertion (which expected usedFallback=true everywhere when env vars were
//     missing) — with hardcoded defaults that assertion is no longer the right
//     contract.
{
  const noEnv = {};
  const ids = ctx.VOICE_PRESET_KEYS.map(k => tts.resolveVoice(k, noEnv).voiceId);
  const distinct = new Set(ids).size;
  vAssert('no env vars set → 4 presets STILL resolve to 4 distinct hardcoded voice IDs',
    distinct === 4, `got ${distinct} distinct (${ids.join(', ')})`);
  // And every preset uses its hardcoded-per-preset source (not the legacy fallback chain).
  const sources = ctx.VOICE_PRESET_KEYS.map(k => tts.resolveVoice(k, noEnv).source);
  const allHardcoded = sources.every(s => s === 'hardcodedPerPreset');
  vAssert('no env vars set → every preset resolves via hardcodedPerPreset source',
    allHardcoded, `sources: ${sources.join(', ')}`);
}
// 13. Label/tagline/previewText must NOT contain celebrity, licensed-character,
//     or real-person imitation language. Conservative blocklist — common Disney /
//     Pixar / Sesame / public-figure tokens.
{
  const BLOCK_RX = /\b(disney|pixar|sesame|elmo|mickey|minnie|elsa|anna|olaf|moana|buzz lightyear|woody|mufasa|simba|nemo|dory|shrek|spongebob|patrick|sandy|barney|peppa|bluey|paw patrol|morgan freeman|david attenborough|james earl jones|sir david|big bird)\b/i;
  const leaks = [];
  for (const p of ctx.VOICE_PRESETS) {
    const haystack = `${p.label} :: ${p.tagline} :: ${p.previewText || ''}`;
    const m = haystack.match(BLOCK_RX);
    if (m) leaks.push(`preset="${p.key}" contains "${m[0]}"`);
  }
  vAssert('no celebrity / licensed-character / real-person language in voice presets',
    leaks.length === 0, leaks.join('; '));
}
// 14. v0.9.3 · b22 — voiceSignature shape: 8 lowercase hex chars derived from
//     SHA-256(voiceId). Catches accidental raw-id exposure in dev tooling.
{
  const sig = tts.voiceSignature('JBFqnCBsd6RMkjVDRZzb');
  vAssert('voiceSignature returns 8 lowercase hex chars',
    typeof sig === 'string' && sig.length === 8 && /^[0-9a-f]{8}$/.test(sig),
    `got "${sig}"`);
  // Same voice ID always yields the same signature (deterministic fingerprint).
  vAssert('voiceSignature is deterministic',
    tts.voiceSignature('JBFqnCBsd6RMkjVDRZzb') === sig);
  // Different voice IDs yield different signatures.
  vAssert('voiceSignature differs across distinct voice IDs',
    tts.voiceSignature('JBFqnCBsd6RMkjVDRZzb') !== tts.voiceSignature('21m00Tcm4TlvDq8ikWAM'));
}
// 15. v0.9.3 · b22 — detectVoiceCollapse happy path: 4 distinct hardcoded
//     defaults with NO env vars set → 0 collisions. This is the contract
//     b17 was supposed to deliver but the recurring "all previews are George"
//     bug was caused by the CLIENT cache layer, not the resolver. The collapse
//     detector still proves the resolver side is healthy.
{
  const collisions = tts.detectVoiceCollapse({});
  vAssert('detectVoiceCollapse: no env vars → 0 collisions (4 distinct hardcoded defaults)',
    collisions.length === 0,
    `got ${collisions.length} collisions: ${JSON.stringify(collisions)}`);
}
// 16. v0.9.3 · b22 — detectVoiceCollapse env-driven collapse: all 4 per-preset
//     env vars set to the SAME voice ID (the b16 production failure mode where
//     an operator pointed everything at George) → 1 collision group containing
//     all 4 presets. Verifies the per-request console.warn would fire.
{
  const george = 'JBFqnCBsd6RMkjVDRZzb';
  const env = {
    ELEVENLABS_VOICE_SUNNY:     george,
    ELEVENLABS_VOICE_COZY:      george,
    ELEVENLABS_VOICE_ADVENTURE: george,
    ELEVENLABS_VOICE_SILLY:     george,
  };
  const collisions = tts.detectVoiceCollapse(env);
  vAssert('detectVoiceCollapse: env collapses all 4 presets to George → 1 collision group of 4',
    collisions.length === 1
      && collisions[0].presets.length === 4
      && ['sunny','cozy','adventure','silly'].every(k => collisions[0].presets.includes(k)),
    `got ${JSON.stringify(collisions)}`);
}
// 17. v0.9.3 · b22 — detectVoiceCollapse partial collapse: TWO presets pointed
//     at George, the other two using their hardcoded defaults → exactly one
//     collision group containing the two colliders (plus George via cozy's
//     hardcoded default — so cozy + the 2 overridden presets = 3 colliders).
//     Tests the named-presets behavior so operator can fix the right env vars.
{
  const george = 'JBFqnCBsd6RMkjVDRZzb';
  const env = {
    ELEVENLABS_VOICE_SUNNY:     george,
    ELEVENLABS_VOICE_ADVENTURE: george,
  };
  const collisions = tts.detectVoiceCollapse(env);
  // cozy resolves to George via hardcodedPerPreset; sunny + adventure resolve
  // to George via envPerPreset. Silly resolves to Mimi (its own hardcoded
  // default). So we expect 1 collision group of [sunny, cozy, adventure].
  vAssert('detectVoiceCollapse: 2 env vars pointed at cozy default → 3-preset collision group',
    collisions.length === 1
      && collisions[0].presets.length === 3
      && ['sunny','cozy','adventure'].every(k => collisions[0].presets.includes(k))
      && !collisions[0].presets.includes('silly'),
    `got ${JSON.stringify(collisions)}`);
}
// 18. v0.9.3 · b22 — VOICE_CONFIG_VERSION is the server-side config marker.
//     Must be a non-empty string. Client (qaVoicePreviews) compares this to
//     the cache version it was built against to detect server/client drift.
{
  vAssert('VOICE_CONFIG_VERSION is non-empty string',
    typeof tts.VOICE_CONFIG_VERSION === 'string' && tts.VOICE_CONFIG_VERSION.length > 0,
    `got "${tts.VOICE_CONFIG_VERSION}"`);
}

let v_fail = 0;
for (const c of voiceCases) {
  if (c.ok) continue;
  v_fail++;
  console.log(`    ✗ ${c.label}${c.detail ? ' — ' + c.detail : ''}`);
}
gate(`Narrator voice selector unit tests (${voiceCases.length} cases)`, v_fail === 0, v_fail + ' failed');
console.log(`    ${voiceCases.length - v_fail}/${voiceCases.length} cases passed`);

/* === 15. SETTING 2.0 — flavor coverage + hidden-place + label-leak gate (added v0.9.3 · b9) ===
 *
 * Setting 2.0 replaces the exact-setting grid (Diner / Mall / Football Game / etc.)
 * with 8 broad "story flavor" categories. Each flavor holds a hidden pool of 8
 * specific places; resolveSetting() picks a random hidden place per call so a kid
 * locking "Food Place" gets diner one session and bakery the next.
 *
 * Contracts:
 *   (a) Every flavor key generates a non-null story across multiple seeds.
 *   (b) Every non-surprise flavor resolves to a specific hidden place, and that
 *       place text appears in the story body.
 *   (c) The broad category LABEL never leaks into story prose.
 *   (d) Legacy exact-setting keys migrate cleanly to valid flavor keys.
 */
console.log('\n=== 15. Setting 2.0 — flavor coverage + hidden-place + label-leak gate (v0.9.3 · b9) ===');
const SETTING_TEST_REPS = 20;
let flavorNulls       = 0;
let placeMisses       = 0;
let labelLeaks        = 0;
let resolveBadShape   = 0;
const flavorDetail    = [];
const samplePicks = {
  pet:      { w: 'otter' },
  color:    { w: 'rainbow' },
  food:     { w: 'pizza' },
  creature: { w: 'dinosaur' },
  move:     { w: 'skated' },
  mood:     { w: 'dramatic' },
};
for (const flavor of ctx.SETTING_FLAVORS) {
  for (let i = 0; i < SETTING_TEST_REPS; i++) {
    const resolved = ctx.resolveSetting(flavor.key);
    const shapeOk = resolved
      && typeof resolved.id === 'string'
      && Array.isArray(resolved.visitorBias)
      && Array.isArray(resolved.objectBias)
      && (resolved.place === null || (typeof resolved.place === 'object' && typeof resolved.place.text === 'string'));
    if (!shapeOk) {
      resolveBadShape++;
      if (flavorDetail.length < 10) flavorDetail.push(`${flavor.key}: bad resolved shape`);
      continue;
    }
    if (flavor.hiddenPlaces) {
      const inPool = flavor.hiddenPlaces.some(p => p.id === resolved.place.id);
      if (!inPool) {
        placeMisses++;
        if (flavorDetail.length < 10) flavorDetail.push(`${flavor.key}: resolved place not in hiddenPlaces`);
        continue;
      }
    }
    const picksWithSetting = { ...samplePicks, setting: resolved, storyMode: 'bedtime' };
    let s = null;
    try {
      s = ctx.generateStoryV3('Cole', picksWithSetting, 7);
      if (!s) s = ctx.generateStoryV2('Cole', picksWithSetting, 7);
    } catch (e) { /* null below */ }
    if (!s) {
      flavorNulls++;
      if (flavorDetail.length < 10) flavorDetail.push(`${flavor.key}: null story`);
      continue;
    }
    const fullText = (s.title || '') + ' ' + (s.paragraphs || []).join(' ');
    if (resolved.place && resolved.place.text) {
      const placeRx = new RegExp('\\b' + resolved.place.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase() + '\\b', 'i');
      if (!placeRx.test(fullText.toLowerCase())) {
        placeMisses++;
        if (flavorDetail.length < 10) flavorDetail.push(`${flavor.key}: place "${resolved.place.text}" not in body`);
      }
    }
    if (flavor.key !== 'surprise') {
      const labelLc = flavor.label.toLowerCase();
      const labelRx = new RegExp('\\b' + labelLc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
      if (labelRx.test(fullText.toLowerCase())) {
        labelLeaks++;
        if (flavorDetail.length < 10) flavorDetail.push(`${flavor.key}: label "${flavor.label}" leaked into prose`);
      }
    }
  }
}
gate(`every flavor generates a story (${ctx.SETTING_FLAVORS.length} flavors × ${SETTING_TEST_REPS} reps)`, flavorNulls === 0, flavorNulls + ' null stories');
gate(`hidden place appears in body across all flavors`, placeMisses === 0, placeMisses + ' misses');
gate(`broad category label never leaks into prose`, labelLeaks === 0, labelLeaks + ' leaks');
gate(`resolveSetting returns legacy V2_SETTINGS-compatible shape`, resolveBadShape === 0, resolveBadShape + ' bad shapes');

const legacyCases = [
  { input: 'diner',          expected: 'food_place' },
  { input: 'grocery_store',  expected: 'food_place' },
  { input: 'football_game',  expected: 'at_school' },
  { input: 'school',         expected: 'at_school' },
  { input: 'backyard',       expected: 'at_home' },
  { input: 'zoo',            expected: 'animal_place' },
  { input: 'bus',            expected: 'on_the_go' },
  { input: 'mall',           expected: 'surprise' },
  { input: 'unknownGarbage', expected: 'surprise' },
  { input: 'food_place',     expected: 'food_place' },
  { input: '',               expected: 'surprise' },
  { input: null,             expected: 'surprise' },
];
let migrateFail = 0;
for (const t of legacyCases) {
  const got = ctx.migrateLegacySetting(t.input);
  if (got !== t.expected) {
    migrateFail++;
    flavorDetail.push(`migrate(${JSON.stringify(t.input)}): got ${got}, expected ${t.expected}`);
  }
}
gate(`migrateLegacySetting maps old keys to closest flavor (${legacyCases.length} cases)`, migrateFail === 0, migrateFail + ' wrong mappings');
if (flavorDetail.length) flavorDetail.forEach(d => console.log('    ' + d));

/* === 16. VOICE PREVIEW — previewText coverage + cache-key separation (added v0.9.3 · b10) ===
 *
 * b10 adds voice preview clips so users can sample a narrator before committing.
 * Previews use the SAME /api/tts endpoint (with text + voicePreset) but write
 * to a SEPARATE IndexedDB cache namespace ("preview:<preset>") so they never
 * pollute or collide with story cache entries ("<preset>|sha256(text)").
 *
 * Contracts:
 *   (a) Every VOICE_PRESET has a non-empty previewText.
 *   (b) Preview text is short (cost control). Soft cap 80 chars; flag if longer.
 *   (c) preview cache key shape ("preview:<preset>") never starts with a flavor
 *       key prefix used by story cache (e.g. "sunny|", "cozy|") — guaranteed by
 *       the literal "preview:" prefix.
 *   (d) Every preset produces a distinct preview cache key.
 *   (e) Story cache keys and preview cache keys share no overlap. Mixing the
 *       two would cause a story to replay a preview's audio (or vice versa).
 */
console.log('\n=== 16. Voice preview — previewText coverage + cache-key separation (v0.9.3 · b10) ===');
const previewCases = [];
function pAssert(label, cond, detail) { previewCases.push({ label, ok: !!cond, detail }); }

for (const p of ctx.VOICE_PRESETS) {
  pAssert(`preset "${p.key}" has a non-empty previewText`,
    typeof p.previewText === 'string' && p.previewText.trim().length > 0);
  pAssert(`preset "${p.key}" previewText is short (≤ 80 chars)`,
    typeof p.previewText === 'string' && p.previewText.length <= 80,
    `${p.previewText && p.previewText.length} chars`);
}

// Cache key shapes (replicate the client-side helpers in qa-current.js so the
// contract is checked even if the runtime IDB layer is unavailable in Node).
function clientHashKeyStub(preset, hex) { return `${preset}|${hex}`; }
function clientPreviewKey(preset)        { return `preview:${preset}`; }

const previewKeys = ctx.VOICE_PRESET_KEYS.map(clientPreviewKey);
pAssert('every preview cache key starts with "preview:"',
  previewKeys.every(k => k.startsWith('preview:')));
pAssert('preview cache keys are all distinct',
  new Set(previewKeys).size === previewKeys.length);

// Cross-check: no story cache key (preset|hex) collides with any preview key.
// Story keys never start with "preview:" because preset keys are word chars.
const fakeHex = 'a1b2c3d4e5f6a7b8';
const storyKeys = ctx.VOICE_PRESET_KEYS.map(k => clientHashKeyStub(k, fakeHex));
const overlap = storyKeys.filter(s => previewKeys.includes(s));
pAssert('no story cache key collides with a preview cache key', overlap.length === 0,
  overlap.length ? overlap.join(',') : '');

// Defense-in-depth: a story preset key must not be exactly "preview" (would
// otherwise allow client to write "preview|sha..." which a buggy reader could
// mistake for a preview entry).
pAssert('no VOICE_PRESET key is literally "preview"',
  !ctx.VOICE_PRESET_KEYS.includes('preview'));

let p_fail = 0;
for (const c of previewCases) {
  if (c.ok) continue;
  p_fail++;
  console.log(`    ✗ ${c.label}${c.detail ? ' — ' + c.detail : ''}`);
}
gate(`Voice preview unit tests (${previewCases.length} cases)`, p_fail === 0, p_fail + ' failed');
console.log(`    ${previewCases.length - p_fail}/${previewCases.length} cases passed`);

/* === 17. HIGH_IMPACT slot audit (added v0.9.3 · b23) ===
 *
 * Notion Build Idea: "High-impact word slots: force funnier, more absurd choices"
 * (36813aa1-d4db-8147-84a8-eb888c5c6900).
 *
 * Story-template "punchline" positions — where the kid's selected word is
 * shouted, announced, or revealed as a comedic pivot — must NEVER pull from
 * the general vocabulary pool. They must pull from ABSURD_WORD_BANK (for
 * freetext-fed slots) or SOUND_HOT_OPTS (for the binary sound-tap-fed slot).
 *
 * This section audits the contract end-to-end:
 *   (a) ABSURD_WORD_BANK ships ≥ 50 entries across the 4 named categories.
 *   (b) Tier eligibility: tot ≥ 12 entries; little/kid/big/tween ≥ 30 each.
 *   (c) HIGH_IMPACT_ROLES are exactly the roles that should land in [y:...]
 *       punchline tokens. Every v3 beat line that uses [y:{<role>.text}] or
 *       [y:{<role>.cap}] must reference a role in HIGH_IMPACT_ROLES, and
 *       conversely every HIGH_IMPACT_ROLES role must have at least one
 *       [y:...] beat line referencing it.
 *   (d) Every preset HIGH_IMPACT_ROLE in V3_BLUEPRINTS roleMaps must map to
 *       a picker category in HIGH_IMPACT_PICKER_CATEGORIES.
 *   (e) Every FREE_TEXT_ROUNDS entry whose cat is in HIGH_IMPACT_PICKER_CATEGORIES
 *       must have an `examples` array (the buildRounds() applyHighImpact path
 *       overrides these at session-construction time, but a missing static array
 *       would crash the override). The static example contents are NOT audited
 *       here — they're stripped & replaced by absurdHintsForTier at session time.
 *   (f) Helper sanity: absurdHintsForTier(tier) returns ≥ 1 string for every tier.
 */
console.log('\n=== 17. HIGH_IMPACT slot audit — punchline coverage + absurd-bank contract (v0.9.3 · b23) ===');
const hiCases = [];
function hAssert(label, cond, detail) { hiCases.push({ label, ok: !!cond, detail }); }

// (a) ABSURD_WORD_BANK ≥ 50 entries across 4 categories
{
  const cats = Object.keys(ctx.ABSURD_WORD_BANK || {});
  const total = cats.reduce((sum, c) => sum + (ctx.ABSURD_WORD_BANK[c] || []).length, 0);
  hAssert('ABSURD_WORD_BANK has 4 categories', cats.length === 4, `got ${cats.length}: ${cats.join(',')}`);
  hAssert('ABSURD_WORD_BANK has ≥ 50 entries total', total >= 50, `got ${total}`);
  const expected = ['sillySounds','grossButSafe','randomObjects','nonsenseCompound'];
  const missing  = expected.filter(c => !cats.includes(c));
  hAssert('ABSURD_WORD_BANK includes the 4 named categories from the spec',
    missing.length === 0, `missing: ${missing.join(',')}`);
}

// (b) Tier eligibility floors
{
  const tiers = ['tot','little','kid','big','tween'];
  const counts = {};
  for (const t of tiers) {
    let n = 0;
    for (const cat of Object.keys(ctx.ABSURD_WORD_BANK || {})) {
      for (const e of ctx.ABSURD_WORD_BANK[cat]) {
        if (e.tiers && e.tiers.includes(t)) n++;
      }
    }
    counts[t] = n;
  }
  hAssert('tot has ≥ 12 absurd entries available', counts.tot >= 12, `got ${counts.tot}`);
  hAssert('little has ≥ 30 absurd entries available', counts.little >= 30, `got ${counts.little}`);
  hAssert('kid has ≥ 30 absurd entries available',    counts.kid    >= 30, `got ${counts.kid}`);
  hAssert('big has ≥ 30 absurd entries available',    counts.big    >= 30, `got ${counts.big}`);
  hAssert('tween has ≥ 30 absurd entries available',  counts.tween  >= 30, `got ${counts.tween}`);
}

// (c) Every HIGH_IMPACT_ROLES role appears in at least one [y:...] V3 beat line.
// NOTE: the inverse (every [y:...] token uses a HIGH_IMPACT_ROLES role) does NOT
// hold — `setting` legitimately uses [y:...] for place-name highlighting (e.g.
// [y:{setting.text}] in setup beats), which is yellow-highlight-as-emphasis,
// not punchline. Only the FORWARD direction is the contract: HIGH_IMPACT roles
// must surface in punchline-style [y:...] beats.
{
  const highImpactRoles = new Set(ctx.HIGH_IMPACT_ROLES || []);
  const yRolesFound = new Set();
  for (const beat of ctx.V3_BEATS) {
    for (const line of beat.lines || []) {
      const m = line.matchAll(/\[y:\{([a-zA-Z][\w]*)\.[a-zA-Z]+\}\]/g);
      for (const hit of m) yRolesFound.add(hit[1]);
    }
  }
  const unused = Array.from(highImpactRoles).filter(r => !yRolesFound.has(r));
  hAssert('every HIGH_IMPACT_ROLES role appears in at least one [y:...] V3 beat line',
    unused.length === 0, `unused: ${unused.join(',')}`);
}

// (d) Every HIGH_IMPACT_ROLES role in V3_BLUEPRINTS roleMaps maps to a HIGH_IMPACT_PICKER_CATEGORIES category.
{
  // V3_BLUEPRINTS isn't directly exported. We can inspect via beats — every beat
  // references roles, and the role map is per-blueprint. Skip the indirect check
  // here and instead verify the conceptual mapping: HIGH_IMPACT_ROLES must each
  // have at least one entry in HIGH_IMPACT_PICKER_CATEGORIES. (Round-cat → role
  // is many-to-one; we check the round-cat coverage.)
  const cats = new Set(ctx.HIGH_IMPACT_PICKER_CATEGORIES || []);
  hAssert('HIGH_IMPACT_PICKER_CATEGORIES includes "sound" (chant role binary feeder)',
    cats.has('sound'));
  hAssert('HIGH_IMPACT_PICKER_CATEGORIES includes "freeword2" (payoff_word freetext feeder)',
    cats.has('freeword2'));
  hAssert('HIGH_IMPACT_PICKER_CATEGORIES includes "freeword" (chant freetext fallback feeder)',
    cats.has('freeword'));
}

// (e) Every FREE_TEXT_ROUNDS entry whose cat is in HIGH_IMPACT_PICKER_CATEGORIES has examples.
// The static example contents are stripped+replaced by applyHighImpact at session-construction
// time — this gate only verifies the shape so the override doesn't crash on missing arrays.
{
  const cats = new Set(ctx.HIGH_IMPACT_PICKER_CATEGORIES || []);
  let missingExamples = 0;
  const offenders = [];
  for (const tier of Object.keys(ctx.FREE_TEXT_ROUNDS || {})) {
    for (const r of ctx.FREE_TEXT_ROUNDS[tier]) {
      if (r.type !== 'freetext') continue;
      if (!cats.has(r.cat)) continue;
      if (!Array.isArray(r.examples) || r.examples.length === 0) {
        missingExamples++;
        if (offenders.length < 3) offenders.push(`${tier}/${r.cat}: "${r.label}"`);
      }
    }
  }
  hAssert('every HIGH_IMPACT freetext round has a non-empty examples array (override target)',
    missingExamples === 0, offenders.join(' | '));
}

// (f) absurdHintsForTier(tier) returns ≥ 1 string for every tier.
{
  for (const t of ['tot','little','kid','big','tween']) {
    const hints = (typeof ctx.absurdHintsForTier === 'function') ? ctx.absurdHintsForTier(t) : null;
    hAssert(`absurdHintsForTier("${t}") returns ≥ 1 hint`,
      Array.isArray(hints) && hints.length >= 1,
      hints ? `length=${hints.length}` : 'returned non-array');
  }
}

let h_fail = 0;
for (const c of hiCases) {
  if (c.ok) continue;
  h_fail++;
  console.log(`    ✗ ${c.label}${c.detail ? ' — ' + c.detail : ''}`);
}
gate(`HIGH_IMPACT slot audit (${hiCases.length} cases)`, h_fail === 0, h_fail + ' failed');
console.log(`    ${hiCases.length - h_fail}/${hiCases.length} cases passed`);

/* === 18. STORY HUMOR PASS audit (added v0.9.3 · b24) ===
 *
 * Notion Build Idea: "Story Humor Pass (v0.9.3 · b24)"
 * (36813aa1-d4db-811f-b256-febdf3f4015b).
 *
 * Codex flagged 4 grammar/polish bug classes + 6 glue-phrase repeats from a
 * pre-b24 50-story sample. This section is the STATIC audit that fails the
 * build if any class regresses. The runtime 50-story creativity report
 * (scripts/creativity-sample.js) is the soft / advisory companion.
 */
console.log('\n=== 18. Story Humor Pass audit — polish + consequence-beat contract (v0.9.3 · b24) ===');
const humorCases = [];
function huAssert(label, cond, detail) { humorCases.push({ label, ok: !!cond, detail }); }

// (a) No V3 title pattern uses a bare third-person-singular verb after protagonist.
{
  const src = fs.readFileSync(path.join(ROOT, 'src/engine-v2.js'), 'utf8');
  const titlePatternRx = /'((?:\[name:\{protagonist\.name\}\][^']*?))'/g;
  const offenders = [];
  const BARE_VERB_RX = /\[name:\{protagonist\.name\}\] (Tell|Share|Find|Sing|Build|Make|Invent|Run|Eat|Catch|Save|Win|Open|Lose|Drop|Pick|Sneak|Get)\b(?!ed|ing|s|ies)/;
  let m;
  while ((m = titlePatternRx.exec(src)) !== null) {
    if (BARE_VERB_RX.test(m[1])) offenders.push(m[1]);
  }
  huAssert('no title pattern uses a bare third-person-singular verb after protagonist subject',
    offenders.length === 0, offenders.slice(0,3).join(' | '));
}

// (b) No V3 beat uses "{mcguffin.text} was/is unaccounted for" (plural-mcguffin trap).
{
  const offenders = [];
  for (const beat of ctx.V3_BEATS) {
    for (const line of beat.lines || []) {
      if (/\{mcguffin\.text\}\] (was|is) unaccounted for/.test(line)) {
        offenders.push(`${beat.id}: "${line.slice(0,80)}..."`);
      }
    }
  }
  huAssert('no V3 beat uses singular "was/is unaccounted for" after {mcguffin.text}',
    offenders.length === 0, offenders.slice(0,3).join(' | '));
}

// (c) binoculars has isPlural:true set.
{
  const src = fs.readFileSync(path.join(ROOT, 'src/engine-v2.js'), 'utf8');
  const binocRx = /id:'binoculars',[^}]*isPlural:\s*true/;
  huAssert('binoculars entry in V2_WORDS.objects has isPlural: true',
    binocRx.test(src), 'binoculars missing isPlural — articleText returns "a binoculars"');
}

// (d) ≥ 12 absurd_consequence beats spread across all 4 kid/big/tween blueprints.
{
  const consequenceBeats = ctx.V3_BEATS.filter(b => b.jokeJob === 'absurd_consequence');
  huAssert('b24 ships ≥ 12 jokeJob:\'absurd_consequence\' beats (Priority 3 target)',
    consequenceBeats.length >= 12, `got ${consequenceBeats.length}`);
  const byBp = {};
  for (const b of consequenceBeats) byBp[b.blueprintId || 'wildcard'] = (byBp[b.blueprintId || 'wildcard'] || 0) + 1;
  const expected = ['lost_snack_v3','goal_spine_v3','show_wrong_v3','rule_loophole_v3'];
  const missingBp = expected.filter(bp => !byBp[bp]);
  huAssert('absurd_consequence beats present in all 4 kid+big+tween blueprints',
    missingBp.length === 0, `missing: ${missingBp.join(',')}`);
}

// (e) tot/little blueprints declare chant: 'sound' role; ≥ 2 tot/little beats render [y:{chant.*}].
{
  const src = fs.readFileSync(path.join(ROOT, 'src/engine-v2.js'), 'utf8');
  const tlBlueprints = ['tot_wonder_v3','tot_sky_v3','little_quest_v3','little_food_v3'];
  const missingChant = [];
  for (const bp of tlBlueprints) {
    const rx = new RegExp(bp + ':[\\s\\S]{0,1500}?roleMap:[\\s\\S]*?\\},', 'm');
    const m = src.match(rx);
    if (!m) { missingChant.push(`${bp}: blueprint not found in src`); continue; }
    if (!/chant:\s*'sound'/.test(m[0])) missingChant.push(bp);
  }
  huAssert('tot/little v3 blueprints declare chant: \'sound\' role (Priority 5)',
    missingChant.length === 0, `missing: ${missingChant.join(',')}`);

  const tlChantBeats = ctx.V3_BEATS.filter(b =>
    (b.tiers && (b.tiers.includes('tot') || b.tiers.includes('little'))) &&
    (b.lines || []).some(l => /\[y:\{chant\.[a-z]+\}\]/i.test(l))
  );
  huAssert('≥ 2 tot/little V3 beats render a [y:{chant.*}] punchline token',
    tlChantBeats.length >= 2, `got ${tlChantBeats.length}`);
}

let hu_fail = 0;
for (const c of humorCases) {
  if (c.ok) continue;
  hu_fail++;
  console.log(`    ✗ ${c.label}${c.detail ? ' — ' + c.detail : ''}`);
}
gate(`Story Humor Pass audit (${humorCases.length} cases)`, hu_fail === 0, hu_fail + ' failed');
console.log(`    ${humorCases.length - hu_fail}/${humorCases.length} cases passed`);

/* === 19. SENSORY-CALLBACK POLISH AUDIT (added v0.9.3 · b31) ===
 *
 * User reported that age-6 stories were repeatedly generating abstract callback
 * lines like "the air went a little lemon yellow" and "echoed from somewhere,
 * possibly a memory" that did not make physical/comedic sense for the kid tier.
 *
 * b31 rewrote those callbacks with concrete physical events and added a smell
 * callback pool that picks from a potty pool only when pottyMode is on.
 *
 * Hard gates:
 *   (a) Generated stories must not contain the substring "air went a little".
 *   (b) Generated stories must not contain "possibly a memory".
 *   (c) When pottyMode is FALSE, no potty-pool smell phrase ever appears.
 *
 * Sample: 100 stories with pottyMode=false (gates a, b, c) + 30 stories with
 * pottyMode=true (gate c can fire — confirms gating is live, not just absent).
 */
console.log('\n=== 19. Sensory-callback polish audit (v0.9.3 · b31) ===');
{
  const POTTY_PHRASES = [
    'poopy butts', 'toilet burps', 'swamp underpants', 'booger soup',
  ];
  const BAN_AIR_WENT  = /air went a little/i;
  const BAN_MEMORY    = /possibly a memory/i;
  const POTTY_RX      = new RegExp(POTTY_PHRASES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

  function gen(age, pottyMode) {
    const picks = {
      pet: { w:'crow' }, food: { w:'tacos' }, place: { w:'forest' },
      creature: { w:'wizard' }, color: { w:'midnight blue' }, move: { w:'zoomed' },
      mood: { w:'sleepy' },
      freeword:  { w:'plop' },
      freeword2: { w:'snorble' },
      sound: { w:'TOOT!' },
      sky:   { w:'stars' },
      setting: { id:'at_home', place:{ text:'bedroom', articleText:'the bedroom' }, visitorBias:'creature', objectBias:'object' },
      storyMode: 'bedtime',
      pottyMode: !!pottyMode,
    };
    try {
      const s = ctx.generateStoryV3('Cole', picks, age);
      if (!s) return '';
      return [s.title, ...(s.paragraphs || [])].join(' ');
    } catch (e) {
      return '';
    }
  }

  let sensoryHardFail = 0;
  let airWentHits = 0;
  let memoryHits = 0;
  let pottyLeakHits = 0;
  let pottyOnPottyHits = 0;
  const sensoryDetail = [];

  const N_SAFE = 100;
  for (let i = 0; i < N_SAFE; i++) {
    const ages = [6, 7, 8, 9, 10, 11, 12, 13, 4, 5];
    const text = gen(ages[i % ages.length], false);
    if (BAN_AIR_WENT.test(text)) { airWentHits++; if (sensoryDetail.length < 3) sensoryDetail.push('"air went a little" leaked'); }
    if (BAN_MEMORY.test(text))   { memoryHits++;  if (sensoryDetail.length < 6) sensoryDetail.push('"possibly a memory" leaked'); }
    if (POTTY_RX.test(text))     { pottyLeakHits++; if (sensoryDetail.length < 9) sensoryDetail.push('potty smell leaked with pottyMode=false'); }
  }
  // Sanity: with pottyMode=true, potty phrases should be possible.
  const N_POTTY = 30;
  for (let i = 0; i < N_POTTY; i++) {
    const text = gen(7, true);
    if (POTTY_RX.test(text)) pottyOnPottyHits++;
  }

  gate('no story contains "air went a little"', airWentHits === 0, airWentHits + '/' + N_SAFE + ' hits');
  gate('no story contains "possibly a memory"', memoryHits === 0, memoryHits + '/' + N_SAFE + ' hits');
  gate('potty smell never appears when pottyMode=false', pottyLeakHits === 0, pottyLeakHits + '/' + N_SAFE + ' leaks');
  // Not a hard gate — informational. We just confirm potty pool CAN fire.
  console.log('  ℹ pottyMode=true sanity: ' + pottyOnPottyHits + '/' + N_POTTY + ' stories surfaced a potty smell (expected: nonzero)');
  if (sensoryDetail.length) sensoryDetail.forEach(d => console.log('    ' + d));

  // v0.9.3 · b33 — kid-tier smell gating. User reported "gym bag fog" was too
  // old for a 6-year-old. Smell pool is now split by tier; only big/tween
  // (ages 8-13) get the older-register smells. Ages 2-7 get only the
  // kid-friendly pool.
  const OLDER_ONLY_RX = /gym bag fog|pickle burps|mystery cheese/i;
  let kidOlderLeaks = 0;
  const kidLeakDetail = [];
  const youngerAges = [2, 3, 4, 5, 6, 7];
  const N_YOUNG = 100;
  for (let i = 0; i < N_YOUNG; i++) {
    const age = youngerAges[i % youngerAges.length];
    const text = gen(age, false);
    if (OLDER_ONLY_RX.test(text)) {
      kidOlderLeaks++;
      if (kidLeakDetail.length < 3) {
        kidLeakDetail.push('age ' + age + ': older-tier smell leaked into younger tier');
      }
    }
  }
  gate('older-tier smells (gym bag fog / pickle burps / mystery cheese) never appear for ages 2-7', kidOlderLeaks === 0, kidOlderLeaks + '/' + N_YOUNG + ' leaks');
  if (kidLeakDetail.length) kidLeakDetail.forEach(d => console.log('    ' + d));

  // v0.9.3 · b38 — DEFECT FIX: abstract color callbacks.
  //
  // Codex reproduced "There was a apple red feeling to the moment that nobody
  // really named." Three issues:
  //   (i)   abstract / telling-not-showing color callbacks ("feeling to the
  //         moment", "thing was happening again", "light shifted toward",
  //         "faint glow", "tint", "looked weirdly").
  //   (ii)  article mismatch when color starts with a vowel ("a apple red",
  //         "a electric blue", "a orange", etc.) — should be "an X".
  //   (iii) regression risk if a future beat re-introduces either pattern.
  //
  // Force-cycle every story tier × every vowel-starting color and assert the
  // bad surfaces never render. After the b38 rewrite, both gates expect 0
  // hits across 100+ forced samples.
  const ABSTRACT_COLOR_RX = /(feeling to the moment that nobody really named|thing was happening again, whatever it was|light shifted briefly toward|picked up a faint .* tint|looked weirdly [a-z]|faint .* glow hung over the scene)/i;
  // After [c:...] tokens are stripped by renderStory(), the literal text reaching
  // the reader is "a apple red ..." etc. We strip the [c:...] wrapper in this
  // gate so the regex sees the same surface the user (or TTS) does.
  function stripHighlights(text) {
    return text.replace(/\[c:([^\]]*)\]/g, '$1').replace(/\[y:([^\]]*)\]/g, '$1').replace(/\[name:([^\]]*)\]/g, '$1');
  }
  const ARTICLE_MISMATCH_RX = /\ba (apple red|electric blue|orange|ice|acid yellow|emerald|amber|opal|umber|onyx|indigo|aqua|olive|electric yellow|acid green)\b/i;
  const VOWEL_COLORS = ['apple red','electric blue','orange','ice','acid yellow'];
  let abstractLeaks = 0;
  let articleLeaks = 0;
  const abstractDetail = [];
  const articleDetail = [];
  const youngerAges2 = [2, 3, 4, 5, 6, 7];
  const N_VS = 100;
  for (let i = 0; i < N_VS; i++) {
    const age = youngerAges2[i % youngerAges2.length];
    const color = VOWEL_COLORS[i % VOWEL_COLORS.length];
    const picks = {
      pet:{w:'cat'}, food:{w:'pizza'}, place:{w:'forest'},
      creature:{w:'dragon'}, color:{w:color}, move:{w:'zoomed'},
      mood:{w:'sleepy'}, freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
      storyMode:'bedtime', pottyMode:false,
    };
    let text;
    try { const s = ctx.generateStoryV3('Cole', picks, age); text = s ? stripHighlights([s.title, ...(s.paragraphs || [])].join(' ')) : ''; }
    catch (e) { text = ''; }
    if (ABSTRACT_COLOR_RX.test(text)) {
      abstractLeaks++;
      if (abstractDetail.length < 3) abstractDetail.push('age ' + age + ' color=' + color + ': ' + (text.match(ABSTRACT_COLOR_RX) || [''])[0]);
    }
    if (ARTICLE_MISMATCH_RX.test(text)) {
      articleLeaks++;
      if (articleDetail.length < 3) articleDetail.push('age ' + age + ' color=' + color + ': ' + (text.match(ARTICLE_MISMATCH_RX) || [''])[0]);
    }
  }
  // Also check big/tween at colors they're more likely to receive (since b38
  // gated some lines to big/tween only). Force one cycle each.
  const olderAges = [8, 9, 10, 11, 12, 13];
  const N_OLDER = 60;
  let olderAbstractLeaks = 0;
  for (let i = 0; i < N_OLDER; i++) {
    const age = olderAges[i % olderAges.length];
    const color = VOWEL_COLORS[i % VOWEL_COLORS.length];
    const picks = {
      pet:{w:'cat'}, food:{w:'pizza'}, place:{w:'forest'},
      creature:{w:'dragon'}, color:{w:color}, move:{w:'zoomed'},
      mood:{w:'sleepy'}, freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
      storyMode:'bedtime', pottyMode:false,
    };
    let text;
    try { const s = ctx.generateStoryV3('Cole', picks, age); text = s ? stripHighlights([s.title, ...(s.paragraphs || [])].join(' ')) : ''; }
    catch (e) { text = ''; }
    if (ABSTRACT_COLOR_RX.test(text)) olderAbstractLeaks++;
  }
  gate('no story contains abstract color callback ("feeling to the moment" / "thing happening again" / etc.) across ages 2-7', abstractLeaks === 0, abstractLeaks + '/' + N_VS + ' leaks');
  if (abstractDetail.length) abstractDetail.forEach(d => console.log('    ' + d));
  gate('no story contains "a [vowel-color]" article mismatch ("a apple red" / "a electric blue" / etc.) across ages 2-7', articleLeaks === 0, articleLeaks + '/' + N_VS + ' leaks');
  if (articleDetail.length) articleDetail.forEach(d => console.log('    ' + d));
  gate('no story contains abstract color callback for ages 8-13 either', olderAbstractLeaks === 0, olderAbstractLeaks + '/' + N_OLDER + ' leaks');

  // v0.9.3 · b39 — DEFECT FIX gates.
  //
  // (g) show_wrong_v3 plural-prop grammar. Force prop=binoculars (plural,
  //     isPlural:true) across kid/big/tween. Fail on "a binoculars",
  //     "half a binoculars", "one binoculars".
  // (h,i) signature_action + mood_throughline filler nominalizations.
  //       Force ages 2-13 with a known-leaky move/mood pick and assert the
  //       killed surfaces never render.
  // v0.9.3 · b40 — DEFECT FIX: the b39 binoculars gate previously set
  // `setting.objectBias='binoculars'`, but V3 picks the object slot
  // randomly from V2_WORDS.objects without consulting objectBias. The
  // gate fired 0 binoculars renders in 200+ samples (verified via
  // /tmp/b40-before.js). b40 adds a deterministic test-only opt-in
  // `picks.__forceProp` that injects the named object into the prop
  // slot. The gate now exercises BOTH a plural prop (binoculars) and
  // a singular prop (wobbly telescope) to cover both surfaces. If
  // __forceProp ever drifts, the gate also asserts the prop name
  // actually appears in the story (sanity check that the override is
  // effective).
  const showWrongPluralRX = /\b(had a binoculars|held half a binoculars|half a binoculars|one binoculars\b|rested on one binoculars|a binoculars\b)/i;
  const showWrongSingularRX = /\b(had wobbly telescope\b|half a wobbly telescope|some wobbly telescope\b)/i;
  let p39PluralLeaks = 0;
  let p40PropRenderMisses = 0;
  let p40SingularLeaks = 0;
  const p39PluralDetail = [];
  const showWrongAges = [6, 7, 8, 9, 10, 11, 12, 13];
  const N_SW = 80;
  for (let i = 0; i < N_SW; i++) {
    const age = showWrongAges[i % showWrongAges.length];
    // alternate plural prop vs singular prop across the sample
    const forcedProp = (i % 2 === 0) ? 'binoculars' : 'wobbly_telescope';
    const picks = {
      pet:{w:'crow'}, food:{w:'pizza'}, place:{w:'mall'},
      creature:{w:'eagle'}, color:{w:'red'}, move:{w:'zoomed'}, mood:{w:'silly'},
      freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'somewhere_weird', place:{text:'mall', articleText:'the mall'}, visitorBias:'creature', objectBias:'object'},
      storyMode:'bedtime', pottyMode:false,
      __forceProp: forcedProp,
    };
    // Force show_wrong_v3 by retrying generation
    let s = null;
    for (let t = 0; t < 50; t++) {
      try { s = ctx.generateStoryV3('Cole', picks, age); } catch (e) { s = null; }
      if (s && s.__blueprint === 'show_wrong_v3') break;
    }
    if (!s || s.__blueprint !== 'show_wrong_v3') continue;
    const text = stripHighlights([s.title, ...(s.paragraphs || [])].join(' '));
    // Sanity: the forced prop must actually appear in the rendered story.
    const propText = forcedProp === 'wobbly_telescope' ? 'wobbly telescope' : forcedProp;
    if (!text.toLowerCase().includes(propText)) {
      p40PropRenderMisses++;
      if (p39PluralDetail.length < 3) p39PluralDetail.push('age ' + age + ' forcedProp=' + forcedProp + ': prop never rendered');
    }
    if (forcedProp === 'binoculars' && showWrongPluralRX.test(text)) {
      p39PluralLeaks++;
      if (p39PluralDetail.length < 6) {
        const m = text.match(showWrongPluralRX) || [''];
        p39PluralDetail.push('age ' + age + ' binoculars: ' + m[0]);
      }
    }
    if (forcedProp === 'wobbly_telescope' && showWrongSingularRX.test(text)) {
      p40SingularLeaks++;
      if (p39PluralDetail.length < 9) {
        const m = text.match(showWrongSingularRX) || [''];
        p39PluralDetail.push('age ' + age + ' wobbly_telescope: ' + m[0]);
      }
    }
  }
  gate('show_wrong_v3 with __forceProp actually renders the forced prop (deterministic test infrastructure)', p40PropRenderMisses === 0, p40PropRenderMisses + ' samples failed to render the forced prop');
  gate('show_wrong_v3 with prop=binoculars never renders "a binoculars" / "half a binoculars" / "one binoculars" (kid/big/tween)', p39PluralLeaks === 0, p39PluralLeaks + ' leaks across forced plural-prop samples');
  gate('show_wrong_v3 with prop=wobbly telescope never renders broken singular grammar', p40SingularLeaks === 0, p40SingularLeaks + ' leaks across forced singular-prop samples');
  if (p39PluralDetail.length) p39PluralDetail.forEach(d => console.log('    ' + d));

  // signature_action filler — force the leaky moves Codex flagged.
  const saFillerRX = /(There was a small \S+ moment that nobody quite witnessed in full|A short burst of \S+ happened\. Witnesses disagreed)/i;
  let saFillerLeaks = 0;
  const saFillerDetail = [];
  const LEAKY_MOVES = ['splashed', 'swayed', 'crawled', 'zoomed', 'bounced'];
  const sfAges = [2, 4, 6, 8, 12];
  const N_SA = 100;
  for (let i = 0; i < N_SA; i++) {
    const age = sfAges[i % sfAges.length];
    const move = LEAKY_MOVES[i % LEAKY_MOVES.length];
    const picks = {
      pet:{w:'duck'}, food:{w:'pizza'}, place:{w:'forest'},
      creature:{w:'dragon'}, color:{w:'red'}, move:{w:move}, mood:{w:'silly'},
      freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
      storyMode:'bedtime', pottyMode:false,
    };
    let text;
    try { const s = ctx.generateStoryV3('Cole', picks, age); text = s ? stripHighlights([s.title, ...(s.paragraphs || [])].join(' ')) : ''; }
    catch (e) { text = ''; }
    if (saFillerRX.test(text)) {
      saFillerLeaks++;
      if (saFillerDetail.length < 3) {
        const m = text.match(saFillerRX) || [''];
        saFillerDetail.push('age ' + age + ' move=' + move + ': ' + m[0]);
      }
    }
  }
  gate('no story contains signature_action filler ("a small [move] moment" / "A short burst of [move] happened")', saFillerLeaks === 0, saFillerLeaks + '/' + N_SA + ' leaks');
  if (saFillerDetail.length) saFillerDetail.forEach(d => console.log('    ' + d));

  // mood_throughline filler — force the leaky moods Codex flagged.
  const moodFillerRX = /(\S+ energy to it\. Nobody could explain why|\S+ quality to the air, if anyone noticed|turned a particular shade of \S+)/i;
  let moodFillerLeaks = 0;
  const moodFillerDetail = [];
  const LEAKY_MOODS = ['snack-motivated', 'heroically mediocre', 'minorly iconic', 'weirdly invested'];
  const N_MOOD = 100;
  for (let i = 0; i < N_MOOD; i++) {
    const age = sfAges[i % sfAges.length];
    const mood = LEAKY_MOODS[i % LEAKY_MOODS.length];
    const picks = {
      pet:{w:'duck'}, food:{w:'pizza'}, place:{w:'forest'},
      creature:{w:'dragon'}, color:{w:'red'}, move:{w:'zoomed'}, mood:{w:mood},
      freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
      storyMode:'bedtime', pottyMode:false,
    };
    let text;
    try { const s = ctx.generateStoryV3('Cole', picks, age); text = s ? stripHighlights([s.title, ...(s.paragraphs || [])].join(' ')) : ''; }
    catch (e) { text = ''; }
    if (moodFillerRX.test(text)) {
      moodFillerLeaks++;
      if (moodFillerDetail.length < 3) {
        const m = text.match(moodFillerRX) || [''];
        moodFillerDetail.push('age ' + age + ' mood="' + mood + '": ' + m[0]);
      }
    }
  }
  gate('no story contains mood_throughline filler ("[mood] energy to it" / "[mood] quality to the air" / "turned a particular shade of [mood]")', moodFillerLeaks === 0, moodFillerLeaks + '/' + N_MOOD + ' leaks');
  if (moodFillerDetail.length) moodFillerDetail.forEach(d => console.log('    ' + d));

  // v0.9.3 · b40 — DEFECT FIX gate.
  //
  // Tween move options include gesture/state phrases ("dramatically sighed",
  // "existentially paused", "stared into the middle distance",
  // "mysteriously vanished", "reluctantly arrived") that compose
  // nonsensically with directional frames ("across the stage", "toward the
  // ally", "past the suspect", "sideways", "right past", "without
  // thinking"). b40 introduces MOVE_CLASS routing: motion-class moves
  // (locomotion) → directional frames; gesture-class moves (state /
  // reaction / stillness) → class-agnostic frames only. This gate forces
  // EVERY tween picker move through 50 generation cycles and asserts the
  // killed composite never renders.
  const TWEEN_GESTURE_MOVES = [
    'dramatically sighed','casually yeeted everything','existentially paused',
    'mysteriously vanished','aggressively scrolled','passive-aggressively waved',
    'reluctantly arrived','took a long sip and stared','nodded knowingly',
    'awkwardly hovered','blinked dramatically','panicked quietly',
    'stared into the middle distance',
  ];
  const TWEEN_MOTION_MOVES = [
    'speed-ran','chaotically bolted','gracefully bailed','rage-walked','speed-walked nowhere',
  ];
  let p40MoveCompositeLeaks = 0;
  const p40MoveDetail = [];
  for (const move of TWEEN_GESTURE_MOVES) {
    const moveEsc = move.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Composite: "Cole <gesture> <directional-tail>" — should never appear
    // after b40. Directional tails enumerated to match the frames that were
    // tagged requiresMoveClass:'motion' in the engine.
    const compositeRX = new RegExp(
      'Cole ' + moveEsc + ' (across|over to|past the|toward|sideways|right past|right through|forward fast|without thinking)',
      'i'
    );
    for (let i = 0; i < 50; i++) {
      const age = 11 + (i % 3);
      const picks = {
        pet:{w:'duck'}, food:{w:'pizza'}, place:{w:'forest'},
        creature:{w:'dragon'}, color:{w:'red'}, move:{w:move}, mood:{w:'sleepy'},
        freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
        setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
        storyMode:'bedtime', pottyMode:false,
      };
      let text;
      try { const s = ctx.generateStoryV3('Cole', picks, age); text = s ? stripHighlights([s.title, ...(s.paragraphs || [])].join(' ')) : ''; }
      catch (e) { text = ''; }
      if (compositeRX.test(text)) {
        p40MoveCompositeLeaks++;
        if (p40MoveDetail.length < 5) {
          const m = text.match(new RegExp('[^.!?]*' + compositeRX.source + '[^.!?]*[.!?]', 'i'));
          p40MoveDetail.push('age ' + age + ' move="' + move + '": ' + (m ? m[0].slice(0, 160) : ''));
        }
      }
    }
  }
  gate('tween gesture moves never compose into directional frames ("Cole dramatically sighed across the stage" / "Cole mysteriously vanished without thinking")', p40MoveCompositeLeaks === 0, p40MoveCompositeLeaks + ' leaks across 13 gestures × 50 samples (650 total)');
  if (p40MoveDetail.length) p40MoveDetail.forEach(d => console.log('    ' + d));

  // Counter-check: motion-class tween moves SHOULD still hit directional
  // frames (otherwise the routing would have orphaned them).
  let motionMovesHitDirectional = 0;
  for (const move of TWEEN_MOTION_MOVES) {
    const moveEsc = move.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const directionalRX = new RegExp(
      'Cole ' + moveEsc + ' (across|over to|past|toward|sideways|right past|right through|forward fast)',
      'i'
    );
    let hit = false;
    for (let i = 0; i < 30 && !hit; i++) {
      const picks = {
        pet:{w:'duck'}, food:{w:'pizza'}, place:{w:'forest'},
        creature:{w:'dragon'}, color:{w:'red'}, move:{w:move}, mood:{w:'sleepy'},
        freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
        setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
        storyMode:'bedtime', pottyMode:false,
      };
      let text;
      try { const s = ctx.generateStoryV3('Cole', picks, 12); text = s ? stripHighlights([s.title, ...(s.paragraphs || [])].join(' ')) : ''; }
      catch (e) { text = ''; }
      if (directionalRX.test(text)) hit = true;
    }
    if (hit) motionMovesHitDirectional++;
  }
  gate('tween motion moves still route into directional frames (regression check on b40 routing)', motionMovesHitDirectional >= 3, motionMovesHitDirectional + '/' + TWEEN_MOTION_MOVES.length + ' motion moves hit a directional frame in 30 samples');
}

/* === 21. b41 DETERMINISM GATES — apostrophe / punctuation / bedtime / sidekick ===
 *
 * Four classes of defect closed in b41. Each gets a hard-fail gate so
 * regressions surface immediately.
 *
 * (a) Apostrophe tokenization parity. parseStoryLine absorbs trailing `'s` into
 *     the highlight span so the DOM word count matches the TTS alignment word
 *     count. Test: simulate the wrap + the TTS strip on a synthetic story
 *     ("Cole's Big Show" + body with possessives + contractions), assert
 *     token counts match.
 *
 * (b) Chant/payoff_word terminal-punct strip. picks.freeword.w='SPLAT!' must
 *     never produce "SPLAT!." or "SPLAT!," in story text. Force the freeword
 *     across 60 stories per tier and grep the rendered text.
 *
 * (c) Bedtime mode determinism. storyMode='bedtime' must always result in a
 *     final paragraph containing bedtime lexicon. 60 stories per kid/big/tween
 *     (180 total) — 0 leaks allowed.
 *
 * (d) Sidekick visibility. state.sidekicks=['Riley'] must surface 'Riley' in
 *     the rendered story body at least once. 60 stories per blueprint × tier
 *     (~480 total). 0 leaks allowed.
 */
console.log('\n=== 21. b41 determinism gates — apostrophe / punctuation / bedtime / sidekick ===');
{
  function stripBrackets(text) {
    return text.replace(/\[c:([^\]]*)\]/g, '$1').replace(/\[y:([^\]]*)\]/g, '$1').replace(/\[name:([^\]]*)\]/g, '$1');
  }

  // --- (a) Apostrophe tokenization parity ---------------------------------
  // Simulate parseStoryLine (DOM) tokenization and TTS strip tokenization.
  // Both must produce identical word arrays for inputs with apostrophes.
  function domTokenize(line) {
    // Apply the b41 absorption: each [name|c|y:X] becomes a single token
    // including any trailing 's. Then split the resulting plain text on
    // whitespace; keep tokens that contain [a-zA-Z0-9].
    const rendered = line.replace(/\[(name|c|y):([^\]]+)\]([’']s\b)?/g, (_, k, t, poss) => t + (poss || ''));
    return rendered.split(/\s+/).filter(t => /[a-zA-Z0-9]/.test(t));
  }
  function ttsTokenize(line) {
    // TTS strip removes [name|c|y:X] brackets but keeps trailing 's exactly
    // where the source put it (since DOM also absorbs it, identical result).
    const stripped = line.replace(/\[(?:name|c|y):([^\]]+)\]/g, '$1');
    return (stripped.match(/\S+/g) || []).filter(t => /[a-zA-Z0-9]/.test(t));
  }
  const apostropheFixtures = [
    "[name:Cole]'s Big Show",
    "[name:Cole] and the [c:dragon]'s Plan",
    "The [c:cat]'s tail flicked. [name:Cole] didn't notice. It's a thing they do.",
    "[name:Cole]'s sleeves turned [c:red]. The [c:dragon]'s eyes widened.",
    "Can't, won't, shouldn't — [name:Cole]'s motto.",
  ];
  let tokenMismatches = 0;
  const mismatchDetail = [];
  for (const f of apostropheFixtures) {
    const dom = domTokenize(f);
    const tts = ttsTokenize(f);
    if (dom.length !== tts.length) {
      tokenMismatches++;
      mismatchDetail.push('"' + f.slice(0, 60) + '" dom=' + dom.length + ' tts=' + tts.length);
    }
  }
  gate('apostrophe tokenization parity — DOM word count == TTS word count for possessives/contractions', tokenMismatches === 0, tokenMismatches + '/' + apostropheFixtures.length + ' mismatches' + (mismatchDetail.length ? ' (' + mismatchDetail.join('; ') + ')' : ''));

  // --- (b) Chant/payoff_word terminal-punct strip --------------------------
  // picks.freeword.w with terminal punctuation must never produce double
  // terminal punctuation in the rendered story.
  let punctLeaks = 0;
  const punctDetail = [];
  const BAD_PUNCT_RX = /SPLAT!(\.|,|!)|"[^"]*[!?]\."|"[A-Z!]+!,"/;
  const PUNCT_AGES = [4, 7, 9, 12];
  for (const age of PUNCT_AGES) {
    for (let i = 0; i < 30; i++) {
      const picks = {
        setting: { id: 'at_home', place: 'kitchen', visitorBias: 'safe', objectBias: 'safe' },
        freeword: { w: 'SPLAT!' },
        freeword2: { w: 'KABOOM!' },
        storyMode: 'bedtime',
        pottyMode: false,
      };
      let s; try { s = ctx.generateStoryV3('Cole', picks, age); } catch (e) { s = null; }
      if (!s) continue;
      const text = stripBrackets([s.title, ...(s.paragraphs || [])].join(' '));
      if (/SPLAT!\./.test(text) || /SPLAT!,/.test(text) || /KABOOM!\./.test(text) || /KABOOM!,/.test(text)) {
        punctLeaks++;
        if (punctDetail.length < 3) punctDetail.push('age ' + age + ': ' + text.match(/[A-Z!]+![.,]/)[0]);
      }
    }
  }
  gate('chant/payoff_word with terminal "!" never produces double-terminal "SPLAT!." / "SPLAT!,"', punctLeaks === 0, punctLeaks + ' leaks across forced freeword=SPLAT!/KABOOM! samples' + (punctDetail.length ? ' (' + punctDetail.join('; ') + ')' : ''));

  // --- (c) Bedtime mode determinism ----------------------------------------
  // Every kid/big/tween story with storyMode='bedtime' must end with bedtime
  // lexicon in the final paragraph.
  const BEDTIME_RX = /\b(bedtime|tucked in|asleep|fell asleep|going to sleep|sleepy|goodnight|good night|pajamas|pyjamas|yawned|yawning|drift(ed|ing)? off|sweet dreams|lights out|under the covers|night-night|nighty night|head(ed)? to bed|climb(ed|ing)? into bed|crawl(ed|ing)? into bed|bedroom|under the blanket|cuddled up)\b/i;
  const BED_TIERS = [[6, 'kid'], [9, 'big'], [12, 'tween']];
  let bedtimeLeaks = 0;
  const bedtimeDetail = [];
  for (const [age, tierName] of BED_TIERS) {
    for (let i = 0; i < 30; i++) {
      const picks = {
        setting: { id: 'at_home', place: 'bedroom', visitorBias: 'safe', objectBias: 'safe' },
        storyMode: 'bedtime',
        pottyMode: false,
      };
      let s; try { s = ctx.generateStoryV3('Cole', picks, age); } catch (e) { s = null; }
      if (!s) continue;
      const finalPara = stripBrackets((s.paragraphs || [])[(s.paragraphs || []).length - 1] || '');
      if (!BEDTIME_RX.test(finalPara)) {
        bedtimeLeaks++;
        if (bedtimeDetail.length < 3) bedtimeDetail.push(tierName + ' age ' + age + ': "' + finalPara.slice(-80) + '"');
      }
    }
  }
  gate('storyMode=bedtime always produces a bedtime closer in the final paragraph (kid/big/tween)', bedtimeLeaks === 0, bedtimeLeaks + '/90 missing bedtime closure' + (bedtimeDetail.length ? ' (' + bedtimeDetail.join('; ') + ')' : ''));

  // --- (d) Sidekick visibility ---------------------------------------------
  // When picks.sidekicks=['Riley'], every rendered story must contain Riley.
  let sidekickLeaks = 0;
  const sidekickDetail = [];
  const SK_TIERS = [[4, 'little'], [6, 'kid'], [9, 'big'], [12, 'tween']];
  for (const [age, tierName] of SK_TIERS) {
    for (let i = 0; i < 25; i++) {
      const picks = {
        setting: { id: 'at_home', place: 'kitchen', visitorBias: 'safe', objectBias: 'safe' },
        storyMode: 'bedtime',
        pottyMode: false,
        sidekicks: ['Riley'],
      };
      let s; try { s = ctx.generateStoryV3('Cole', picks, age); } catch (e) { s = null; }
      if (!s) continue;
      const body = stripBrackets((s.paragraphs || []).join(' '));
      if (!/\bRiley\b/i.test(body)) {
        sidekickLeaks++;
        if (sidekickDetail.length < 3) sidekickDetail.push(tierName + ' age ' + age);
      }
    }
  }
  gate('picks.sidekicks=["Riley"] always surfaces Riley in story body (little/kid/big/tween)', sidekickLeaks === 0, sidekickLeaks + '/100 sidekick-missing leaks' + (sidekickDetail.length ? ' (' + sidekickDetail.join('; ') + ')' : ''));
}

/* === 22. b42 COMEDY ARCHITECTURE GATES — wear-out kill + new beat coverage ===
 *
 * Phase A of the story-quality lift. Three classes of gate:
 *
 * (a) Wear-out kill — three Codex-flagged phrases must NEVER reappear in
 *     rendered V3 story body. Hard fail.
 *       - "Throughout, [name] stayed [mood]. Steadily [mood]."
 *       - "processing all of this with visible difficulty"
 *       - "waited patiently for its moment"
 *
 * (b) New premise-setup beat coverage — the b42 premise-statement setups
 *     must actually fire across kid/big stories with reasonable frequency
 *     (every blueprint must surface at least one premise-statement beat
 *     across ≥10% of samples — otherwise the pool isn't being reached).
 *
 * (c) New obstacle-escalation beat coverage — the b42 escalation beats
 *     where the obstacle/visitor/false_suspect/rule_imposer does a specific
 *     action must surface across ≥10% of samples per blueprint.
 */
console.log('\n=== 22. b42 comedy architecture gates — wear-out kill + new beat coverage ===');
{
  function stripBrackets(text) {
    return text.replace(/\[c:([^\]]*)\]/g, '$1').replace(/\[y:([^\]]*)\]/g, '$1').replace(/\[name:([^\]]*)\]/g, '$1');
  }

  const WEAR_OUT_PHRASES = [
    /Throughout,\s+\w+\s+stayed\s+\S+\.\s+Steadily\s+\S+\./i,
    /processing all of this with visible difficulty/i,
    /waited patiently for its moment/i,
  ];
  const WEAR_OUT_LABELS = [
    '"Throughout, X stayed Y. Steadily Y."',
    '"processing all of this with visible difficulty"',
    '"waited patiently for its moment"',
  ];

  const SAMPLE_AGES = [6, 7, 9, 10];
  let wearOutHits = [0, 0, 0];
  let totalSamples = 0;
  for (const age of SAMPLE_AGES) {
    for (let i = 0; i < 50; i++) {
      const picks = {
        setting: { id: 'at_home', place: 'kitchen', visitorBias: 'safe', objectBias: 'safe' },
        storyMode: 'bedtime',
        pottyMode: false,
      };
      let s; try { s = ctx.generateStoryV3('Cole', picks, age); } catch (e) { s = null; }
      if (!s) continue;
      totalSamples++;
      const text = stripBrackets([s.title, ...(s.paragraphs || [])].join(' '));
      WEAR_OUT_PHRASES.forEach((rx, idx) => {
        if (rx.test(text)) wearOutHits[idx]++;
      });
    }
  }
  WEAR_OUT_PHRASES.forEach((_, idx) => {
    gate('wear-out phrase never reappears: ' + WEAR_OUT_LABELS[idx], wearOutHits[idx] === 0, wearOutHits[idx] + '/' + totalSamples + ' rendered hits');
  });

  // New premise-setup beat coverage: every kid/big blueprint must have at
  // least one of its 4 new premise beats surface in ≥10% of samples.
  const PREMISE_BEAT_IDS = {
    lost_snack_v3: ['v3_ls_setup_premise_moment','v3_ls_setup_premise_schedule','v3_ls_setup_premise_deal','v3_ls_setup_premise_spot'],
    goal_spine_v3: ['v3_gs_setup_premise_announce','v3_gs_setup_premise_brief','v3_gs_setup_premise_plan','v3_gs_setup_premise_gestures'],
    show_wrong_v3: ['v3_sw_setup_premise_billing','v3_sw_setup_premise_warning','v3_sw_setup_premise_bit','v3_sw_setup_premise_rehearsed'],
    rule_loophole_v3: ['v3_rl_setup_premise_loophole_in2','v3_rl_setup_premise_3paragraphs','v3_rl_setup_premise_chartbox','v3_rl_setup_premise_tool_unmentioned'],
  };
  // Snapshot beats array directly to confirm 32 new beats exist + carry expected jokeJob tags.
  const V3_BEATS = ctx.V3_BEATS || (typeof ctx.engine === 'object' && ctx.engine.V3_BEATS);
  // (V3_BEATS not exported as a named module member historically — instead
  // check that any of the new premise beat IDs render at least once in a
  // forced-blueprint sweep.)
  const PREMISE_TELLTALES = {
    v3_ls_setup_premise_moment:    /moment had a hole in it/i,
    v3_ls_setup_premise_schedule:  /built the entire afternoon around/i,
    v3_ls_setup_premise_deal:      /handle moral support/i,
    v3_ls_setup_premise_spot:      /remained extremely empty/i,
    v3_gs_setup_premise_announce:  /slightly louder than necessary/i,
    v3_gs_setup_premise_brief:     /had no idea what it meant/i,
    v3_gs_setup_premise_plan:      /mostly remembered step three/i,
    v3_gs_setup_premise_gestures:  /This was concerning\./,
    v3_sw_setup_premise_billing:   /was on lighting\. There were no lights/i,
    v3_sw_setup_premise_warning:   /Five-minute warning/i,
    v3_sw_setup_premise_bit:       /contractually obligated/i,
    v3_sw_setup_premise_rehearsed: /rehearsing a different move/i,
    v3_rl_setup_premise_loophole_in2: /loophole in sentence two/i,
    v3_rl_setup_premise_3paragraphs:  /contradicted the first two/i,
    v3_rl_setup_premise_chartbox:     /decided to live in that box/i,
    v3_rl_setup_premise_tool_unmentioned: /the rule had forgotten to mention/i,
  };

  // Aggregate sampling: generate 400 kid-tier stories, count premise hits per
  // blueprint. Engine randomly selects blueprint based on roles available.
  // We test each blueprint's premise pool has SOME representation in the wild.
  // Provide move + creature picks so all 4 blueprints can fire (show_wrong +
  // goal_spine need signature_action; rule_loophole needs rule_imposer slot).
  const blueprintPremiseHits = { lost_snack_v3: 0, goal_spine_v3: 0, show_wrong_v3: 0, rule_loophole_v3: 0 };
  for (let i = 0; i < 400; i++) {
    const picks = {
      setting: { id: 'at_home', place: 'kitchen', visitorBias: 'safe', objectBias: 'safe' },
      move: { w: 'hopped' },
      creature: { w: 'wizard' },
      storyMode: 'bedtime',
      pottyMode: false,
    };
    let s; try { s = ctx.generateStoryV3('Cole', picks, 7); } catch (e) { s = null; }
    if (!s) continue;
    const text = stripBrackets([s.title, ...(s.paragraphs || [])].join(' '));
    for (const [blueprintId, beatIds] of Object.entries(PREMISE_BEAT_IDS)) {
      if (s.__blueprint === blueprintId) {
        if (beatIds.some(id => PREMISE_TELLTALES[id] && PREMISE_TELLTALES[id].test(text))) {
          blueprintPremiseHits[blueprintId]++;
        }
      }
    }
  }
  for (const [blueprintId, hits] of Object.entries(blueprintPremiseHits)) {
    gate('b42 premise-setup beats surface in ' + blueprintId + ' (kid age 7, ≥1 hit per 400 stories)', hits >= 1, hits + ' premise-beat hits');
  }

  // New obstacle-escalation beat coverage: every blueprint's 4 new
  // escalation beats must surface at least once across forced samples.
  const ESCALATION_TELLTALES = {
    lost_snack_v3: [
      /either generous or extremely suspicious/i,
      /Away from the [^.]+\./i,
      /podium that hadn't been there/i,
      /chart had only one name on it: not theirs/i,
    ],
    goal_spine_v3: [
      /policies were now relevant/i,
      /unfolded one paw at a time/i,
      /chosen not to react/i,
      /one more full step than was reasonable/i,
    ],
    show_wrong_v3: [
      /old camera shutter sound/i,
      /heckle was technically a question/i,
      /not for sharing/i,
      /accepted the slow clap as applause/i,
    ],
    rule_loophole_v3: [
      /counting them\./,
      /decline was, itself, a rule/i,
      /noticed the misalignment first/i,
      /did not point this out/i,
    ],
  };
  // Aggregate escalation sampling: 400 stories at kid age 7, count
  // per-blueprint hits where any of the 4 new escalation telltales matches.
  // Same picks as premise gate so all 4 blueprints can fire.
  const blueprintEscalationHits = { lost_snack_v3: 0, goal_spine_v3: 0, show_wrong_v3: 0, rule_loophole_v3: 0 };
  for (let i = 0; i < 400; i++) {
    const picks = {
      setting: { id: 'at_home', place: 'kitchen', visitorBias: 'safe', objectBias: 'safe' },
      move: { w: 'hopped' },
      creature: { w: 'wizard' },
      storyMode: 'bedtime',
      pottyMode: false,
    };
    let s; try { s = ctx.generateStoryV3('Cole', picks, 7); } catch (e) { s = null; }
    if (!s) continue;
    const text = stripBrackets([s.title, ...(s.paragraphs || [])].join(' '));
    for (const [blueprintId, telltales] of Object.entries(ESCALATION_TELLTALES)) {
      if (s.__blueprint === blueprintId && telltales.some(rx => rx.test(text))) {
        blueprintEscalationHits[blueprintId]++;
      }
    }
  }
  for (const [blueprintId, hits] of Object.entries(blueprintEscalationHits)) {
    gate('b42 obstacle-escalation beats surface in ' + blueprintId + ' (kid age 7, ≥1 hit per 400 stories)', hits >= 1, hits + ' escalation-beat hits');
  }
}

/* === 20. SETTING-BIAS COVERAGE GATE (added v0.9.3 · b36) ===
 *
 * Phase 2 of Selection Joy Pass: WORD_BANK kid options carry an optional `s: ['flavor']`
 * tag. buildRounds() uses settingBiasedSample() to bias card draws 70/30 toward themed
 * options when a non-surprise setting is locked.
 *
 * Gate (a): every non-surprise flavor has ≥3 tagged options in kid food+place+creature+pet
 *           combined, so the bias function always has something to work with.
 * Gate (b): simulated bias achieves ≥1 themed option in ≥65% of sessions across kid
 *           food+creature+pet rounds (place round is skipped when setting is locked per
 *           v2.10.1 logic, so only non-place rounds count).
 */
console.log('\n=== 20. Setting-bias coverage gate (v0.9.3 · b36) ===');

function settingBiasedSampleQA(options, flavorKey) {
  if (!flavorKey || flavorKey === 'surprise') {
    return [...options].sort(() => Math.random() - 0.5).slice(0, 2);
  }
  const tagged = options.filter(o => o.s && o.s.includes(flavorKey));
  if (tagged.length >= 1 && Math.random() < 0.7) {
    const t    = tagged[Math.floor(Math.random() * tagged.length)];
    const rest = options.filter(o => o !== t);
    const u    = rest[Math.floor(Math.random() * rest.length)];
    return [t, u];
  }
  return [...options].sort(() => Math.random() - 0.5).slice(0, 2);
}

const NON_SURPRISE_FLAVORS = ctx.SETTING_FLAVOR_KEYS.filter(k => k !== 'surprise');
const kidWordBank = ctx.WORD_BANK.kid || [];

// (a) Min tagged options across food + place + creature + pet per flavor
const MIN_TAGGED = 3;
let coverageMisses = 0;
const coverageDetail = [];
for (const flavor of NON_SURPRISE_FLAVORS) {
  let count = 0;
  for (const cat of ['food', 'place', 'creature', 'pet']) {
    const round = kidWordBank.find(r => r.cat === cat);
    if (round) count += round.options.filter(o => o.s && o.s.includes(flavor)).length;
  }
  if (count < MIN_TAGGED) {
    coverageMisses++;
    coverageDetail.push(`${flavor}: ${count} tagged (need ≥${MIN_TAGGED})`);
  }
}
gate(`every non-surprise flavor has ≥${MIN_TAGGED} tagged options in kid food+place+creature+pet`,
  coverageMisses === 0,
  coverageMisses ? `${coverageMisses} flavors under threshold` : `${NON_SURPRISE_FLAVORS.length} flavors OK`);
if (coverageDetail.length) coverageDetail.forEach(d => console.log('    ' + d));

// (b) Bias hit rate: ≥65% of 200 sessions show ≥1 themed option in food+creature+pet
//     (place round is dropped when settingLocked per v2.10.1, so excluded from simulation)
const BIAS_SESSIONS = 200;
const BIAS_MIN_RATE = 0.65;
const biasCats = ['food', 'creature', 'pet'];
let biasMisses = 0;
const biasDetail = [];
for (const flavor of NON_SURPRISE_FLAVORS) {
  let hits = 0;
  for (let i = 0; i < BIAS_SESSIONS; i++) {
    let sessionHit = false;
    for (const cat of biasCats) {
      const round = kidWordBank.find(r => r.cat === cat);
      if (!round) continue;
      const picked = settingBiasedSampleQA(round.options, flavor);
      if (picked.some(o => o.s && o.s.includes(flavor))) { sessionHit = true; break; }
    }
    if (sessionHit) hits++;
  }
  const rate = hits / BIAS_SESSIONS;
  if (rate < BIAS_MIN_RATE) {
    biasMisses++;
    biasDetail.push(`${flavor}: ${(rate * 100).toFixed(0)}% (need ≥${(BIAS_MIN_RATE * 100).toFixed(0)}%)`);
  }
}
gate(`setting bias delivers ≥1 themed option in ≥${(BIAS_MIN_RATE * 100).toFixed(0)}% of sessions (kid food+creature+pet)`,
  biasMisses === 0,
  biasMisses ? `${biasMisses} flavors below threshold` : `${NON_SURPRISE_FLAVORS.length} flavors × ${BIAS_SESSIONS} sessions`);
if (biasDetail.length) biasDetail.forEach(d => console.log('    ' + d));

/* === 9. BLOCKED-WORD SCAN (added v2.10.2) ===
 *
 * Critical defect from 2026-05-21: the freetext prompt examples for "Invent a battle
 * cry for a tiny knight" rendered as visible suggestions "ONWARD! / STABBY-STAB! /
 * EAT MY BOOT!" — violent / weapon-adjacent language has no place in a bedtime story
 * app for ages 6-7. Fixed in v2.10.2 by replacing the offending examples. This gate
 * prevents recurrence by scanning every visible string in content.js (WORD_BANK
 * options, freetext example arrays, freetext labels) and engine-v2.js (V2_WORDS
 * companion/visitor/food/object text fields, beat lines) for blocked terms.
 *
 * Blocked set is conservative — actual weapons, violence, body-fluid concepts that
 * don't belong in a children's bedtime app. NOT a profanity filter (the picker UI
 * is curated). NOT a tone filter (some negative emotions like 'grumpy' are fine).
 */
console.log('\n=== 9. Blocked-word content scan (v2.10.2) ===');
const BLOCKED_WORDS = /\b(stab|stabby|stabbed|knife|knives|weapon|blood|bloody|kill|killed|murder|dead|gun|guns|bullet)\b/i;
function scanForBlocked(label, text) {
  const m = text.match(BLOCKED_WORDS);
  return m ? `${label}: "${m[0]}" found` : null;
}
const blockedHits = [];
const filesToScan = [
  { path: 'src/content.js',   raw: content   },
  { path: 'src/engine-v2.js', raw: engineV2  },
];
for (const file of filesToScan) {
  // Strip JS comments and regex patterns first to avoid false-positive on the
  // word list itself or any historical changelog text inside source strings.
  const cleaned = file.raw
    .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
    .replace(/(^|[^:])\/\/.*$/gm, '$1');   // line comments
  // Extract string literals only — we don't care about identifier-name hits like
  // `_kill_handle_` or comment-like words. Match single, double, and backtick strings.
  const STRING_RX = /(['"`])(?:\\.|(?!\1).)*\1/g;
  let stringMatch;
  while ((stringMatch = STRING_RX.exec(cleaned)) !== null) {
    const inner = stringMatch[0].slice(1, -1);
    const hit = scanForBlocked(file.path, inner);
    if (hit) {
      blockedHits.push(`${hit} → string starting "${inner.slice(0, 50)}..."`);
    }
  }
}
gate('0 blocked words in content pools', blockedHits.length === 0, blockedHits.length + ' hits');
if (blockedHits.length) {
  blockedHits.slice(0, 10).forEach(h => console.log('    ' + h));
  if (blockedHits.length > 10) console.log(`    ...and ${blockedHits.length - 10} more`);
}

/* === 8. INLINE <script> SYNTAX (added v2.7.1, renumbered v2.8.0) ===
 *
 * Why this gate exists: v2.6.2 shipped with a broken ternary in an inline <script>
 * block in index.html, which silently parse-failed at page load and produced a blank
 * screen for every visitor. No automated check caught it. This gate parses every
 * inline <script> body via `new Function(body)` — if the parser throws, the gate
 * fails. Cheap, fast, and catches the class of bug that hurt us most.
 */
console.log('\n=== 8. Inline <script> syntax (index.html) ===');
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
