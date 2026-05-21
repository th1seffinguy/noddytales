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
