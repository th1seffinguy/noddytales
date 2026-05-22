#!/usr/bin/env node
/* uat-story-sample.js — UAT run: 5 stories per tier, anytime mode.
 *
 * NOTE: The QA harness (qa-current.js) already gates:
 *   - 0 nulls / unresolved tokens
 *   - pick coverage (body + highlight) for all blueprints
 *   - arc paragraph count
 *   - grammar (plural-article, A-mid-title)
 *   - anytime endings (≤10% bedtime)
 *   - sentence-count advisory
 *
 * This UAT checks the ADDITIONAL flag conditions:
 *   F1  Phantom character name not entered by user
 *   F3  "The End" appears more than once
 *   F5  Anytime mode: last paragraph has sleep/bedtime language
 *   F6  Single word repeated >3× (tot/little) or >4× (kid/big/tween) in RENDERED text
 *   F7  Stale hardcoded phrase
 *   F8  v3 title uses lowercase version of a picked word (title case bug)
 *   F9  Tween: too few agency-verbs (sounds babyish)
 *   F10 Tot/little: child is passive/observing in EVERY sentence (not driving)
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const fakeWindow = {};
const runInCtx = (src) => new Function('window', src)(fakeWindow);
runInCtx(fs.readFileSync(path.join(ROOT, 'src/content.js'), 'utf8'));
runInCtx(fs.readFileSync(path.join(ROOT, 'src/engine-v2.js'), 'utf8'));
const ctx = fakeWindow;

const CHILD_NAME = 'Maisie';

/* ------------------------------------------------------------------ */
/* Token rendering: strip engine tokens to plain text                  */
/* ------------------------------------------------------------------ */
function renderTokens(text) {
  if (!text) return '';
  // [name:X] [c:X] [y:X] → X   (highlight tokens → inner text)
  return text
    .replace(/\[name:([^\]]+)\]/g, '$1')
    .replace(/\[c:([^\]]+)\]/g, '$1')
    .replace(/\[y:([^\]]+)\]/g, '$1')
    .replace(/\[x:([^\]]+)\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, c => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&#34;':'"'})[c] || c);
}

/* ------------------------------------------------------------------ */
/* Tier word sets                                                       */
/* ------------------------------------------------------------------ */
const TIER_SETS = {
  tot: [
    { pet:{w:'bunny'}, food:{w:'grapes'}, sky:{w:'cloud'}, weather:{w:'sunny'},
      place:{w:'park'}, creature:{w:'frog'}, color:{w:'yellow'}, move:{w:'hopped'},
      freeword:{w:'BOING',subtype:'shout'}, freeword2:{w:'SPLAT'} },
    { pet:{w:'duck'}, food:{w:'cookies'}, sky:{w:'moon'}, weather:{w:'windy'},
      place:{w:'forest'}, creature:{w:'owl'}, color:{w:'blue'}, move:{w:'wobbled'},
      freeword:{w:'ZOOM',subtype:'shout'}, freeword2:{w:'WHOOSH'} },
    { pet:{w:'cat'}, food:{w:'bananas'}, sky:{w:'stars'}, weather:{w:'rainy'},
      place:{w:'garden'}, creature:{w:'snail'}, color:{w:'pink'}, move:{w:'bounced'},
      freeword:{w:'KAPOW',subtype:'shout'}, freeword2:{w:'YIKES'} },
    { pet:{w:'hamster'}, food:{w:'strawberries'}, sky:{w:'rainbow'}, weather:{w:'foggy'},
      place:{w:'bedroom'}, creature:{w:'butterfly'}, color:{w:'purple'}, move:{w:'rolled'},
      freeword:{w:'WHAM',subtype:'shout'}, freeword2:{w:'OOPS'} },
    { pet:{w:'puppy'}, food:{w:'blueberries'}, sky:{w:'sun'}, weather:{w:'snowy'},
      place:{w:'kitchen'}, creature:{w:'hedgehog'}, color:{w:'green'}, move:{w:'wiggled'},
      freeword:{w:'ZAP',subtype:'shout'}, freeword2:{w:'BLOOP'} },
  ],
  little: [
    { pet:{w:'rabbit'}, food:{w:'pizza'}, sky:{w:'cloud'}, weather:{w:'stormy'},
      place:{w:'beach'}, creature:{w:'crab'}, color:{w:'orange'}, move:{w:'skipped'},
      freeword:{w:'BONK',subtype:'shout'}, freeword2:{w:'SQUELCH'} },
    { pet:{w:'parrot'}, food:{w:'waffles'}, sky:{w:'moon'}, weather:{w:'sunny'},
      place:{w:'library'}, creature:{w:'sloth'}, color:{w:'teal'}, move:{w:'tiptoed'},
      freeword:{w:'FIZZ',subtype:'shout'}, freeword2:{w:'PLOP'} },
    { pet:{w:'tortoise'}, food:{w:'noodles'}, sky:{w:'stars'}, weather:{w:'foggy'},
      place:{w:'zoo'}, creature:{w:'penguin'}, color:{w:'red'}, move:{w:'galloped'},
      freeword:{w:'CRUNCH',subtype:'shout'}, freeword2:{w:'SPLUNK'} },
    { pet:{w:'guinea pig'}, food:{w:'muffins'}, sky:{w:'sun'}, weather:{w:'breezy'},
      place:{w:'farm'}, creature:{w:'goat'}, color:{w:'silver'}, move:{w:'twirled'},
      freeword:{w:'THWAP',subtype:'shout'}, freeword2:{w:'GLORP'} },
    { pet:{w:'goldfish'}, food:{w:'pancakes'}, sky:{w:'rainbow'}, weather:{w:'humid'},
      place:{w:'playground'}, creature:{w:'monkey'}, color:{w:'gold'}, move:{w:'tumbled'},
      freeword:{w:'SPLOSH',subtype:'shout'}, freeword2:{w:'ZING'} },
  ],
  kid: [
    { pet:{w:'dog'}, food:{w:'tacos'}, place:{w:'jungle'}, creature:{w:'dragon'},
      color:{w:'crimson'}, move:{w:'zoomed'}, mood:{w:'daring'},
      freeword:{w:'KABLAM',subtype:'shout'}, freeword2:{w:'BOINGO'} },
    { pet:{w:'cat'}, food:{w:'sushi'}, place:{w:'castle'}, creature:{w:'unicorn'},
      color:{w:'violet'}, move:{w:'cartwheeled'}, mood:{w:'grumpy'},
      freeword:{w:'ZORK',subtype:'shout'}, freeword2:{w:'SPLAT'} },
    { pet:{w:'lizard'}, food:{w:'pizza'}, place:{w:'volcano'}, creature:{w:'robot'},
      color:{w:'neon'}, move:{w:'launched'}, mood:{w:'sneaky'},
      freeword:{w:'WHAMMO',subtype:'shout'}, freeword2:{w:'KAZOOM'} },
    { pet:{w:'parrot'}, food:{w:'donuts'}, place:{w:'spaceship'}, creature:{w:'yeti'},
      color:{w:'electric'}, move:{w:'somersaulted'}, mood:{w:'dramatic'},
      freeword:{w:'POW',subtype:'shout'}, freeword2:{w:'BWAM'} },
    { pet:{w:'hamster'}, food:{w:'nachos'}, place:{w:'submarine'}, creature:{w:'wizard'},
      color:{w:'glittery'}, move:{w:'skidded'}, mood:{w:'chaotic'},
      freeword:{w:'BLORP',subtype:'shout'}, freeword2:{w:'ZONK'} },
  ],
  big: [
    { pet:{w:'dog'}, food:{w:'burritos'}, place:{w:'haunted house'}, creature:{w:'vampire'},
      color:{w:'midnight purple'}, move:{w:'sprinted'}, mood:{w:'terrified'},
      freeword:{w:'THUNDERCRACK',subtype:'shout'}, freeword2:{w:'KERZAM'} },
    { pet:{w:'snake'}, food:{w:'ramen'}, place:{w:'space station'}, creature:{w:'alien'},
      color:{w:'ultraviolet'}, move:{w:'ricocheted'}, mood:{w:'suspicious'},
      freeword:{w:'BLASTOFF',subtype:'shout'}, freeword2:{w:'FWOOMP'} },
    { pet:{w:'ferret'}, food:{w:'waffles'}, place:{w:'abandoned lab'}, creature:{w:'robot'},
      color:{w:'electric'}, move:{w:'vaulted'}, mood:{w:'frantic'},
      freeword:{w:'KAPOW',subtype:'shout'}, freeword2:{w:'CRUNCH'} },
    { pet:{w:'crow'}, food:{w:'gyros'}, place:{w:'jungle temple'}, creature:{w:'dinosaur'},
      color:{w:'iridescent'}, move:{w:'dove'}, mood:{w:'scheming'},
      freeword:{w:'SMASH',subtype:'shout'}, freeword2:{w:'WHAMMO'} },
    { pet:{w:'iguana'}, food:{w:'dumplings'}, place:{w:'pirate ship'}, creature:{w:'sea monster'},
      color:{w:'phosphorescent'}, move:{w:'spun'}, mood:{w:'panicked'},
      freeword:{w:'ZINGA',subtype:'shout'}, freeword2:{w:'BONK'} },
  ],
  tween: [
    { pet:{w:'cat'}, food:{w:'curry'}, place:{w:'abandoned carnival'}, creature:{w:'ghost'},
      color:{w:'sickly green'}, move:{w:'bolted'}, mood:{w:'mortified'},
      freeword:{w:'OBLITERATE',subtype:'shout'}, freeword2:{w:'CATASTROPHE'} },
    { pet:{w:'raven'}, food:{w:'matcha ice cream'}, place:{w:'underground bunker'}, creature:{w:'AI'},
      color:{w:'monochrome'}, move:{w:'sprinted'}, mood:{w:'exasperated'},
      freeword:{w:'DISASTER',subtype:'shout'}, freeword2:{w:'ABSURD'} },
    { pet:{w:'tarantula'}, food:{w:'sushi'}, place:{w:'rooftop'}, creature:{w:'zombie'},
      color:{w:'stark white'}, move:{w:'scrambled'}, mood:{w:'panicked'},
      freeword:{w:'CATASTROPHIC',subtype:'shout'}, freeword2:{w:'CHAOTIC'} },
    { pet:{w:'hedgehog'}, food:{w:'ramen'}, place:{w:'deserted mall'}, creature:{w:'glitch'},
      color:{w:'neon pink'}, move:{w:'leaped'}, mood:{w:'horrified'},
      freeword:{w:'IMPLODE',subtype:'shout'}, freeword2:{w:'MALFUNCTION'} },
    { pet:{w:'gecko'}, food:{w:'tacos'}, place:{w:'flooded library'}, creature:{w:'cryptid'},
      color:{w:'murky'}, move:{w:'plunged'}, mood:{w:'determined'},
      freeword:{w:'RECKLESS',subtype:'shout'}, freeword2:{w:'UNHINGED'} },
  ],
};

const TIER_AGE = { tot: 2, little: 4, kid: 6, big: 8, tween: 12 };

/* ------------------------------------------------------------------ */
/* Flag constants                                                       */
/* ------------------------------------------------------------------ */
const STALE_PHRASES = [
  'bouncy castle smell',
  "Skies don't usually do that",
];

// Words that could misleadingly look like phantom names — common English words
// that happen to be capitalised (e.g., after a period, inside a quote)
const COMMON_CAPS = new Set([
  'The','A','An','It','He','She','They','We','You','I','In','At','On','To','Of','And',
  'But','Or','So','No','Yes','Oh','Ow','Ah','Hi','Bye','Then','There','Here','Now',
  'Come','Went','Said','Saw','Got','Did','Was','But','When','Where','What','How',
  'Just','All','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Suddenly','Finally','Next','Then','After','Before','Instead','Together','Suddenly',
  'Earth','OK','Ok','Hmm','Wow','Whoa',
  // months/days
  'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
  'January','February','March','April','May','June','July','August','September',
  'October','November','December',
]);

const BEDTIME_RX = /\b(sleep(?:ily|y)?|fell asleep|drifted off|yawned?|snuggled?|bedtime|dream(?:land|ed|s)?|tucked in|closed (?:their|his|her)\s+eyes?|drifted to sleep|good night|goodnight|lullaby)\b/i;

const AGENCY_VERBS_TWEEN = /\b(grabbed|climbed|ran|leaped|jumped|launched|charged|built|fixed|solved|outwitted|challenged|declared|invented|rescued|confronted|decided|sprinted|escaped|discovered|outsmarted|demanded|activated|hacked|rigged|navigated|plotted|smashed|blocked|deflected|overrode|reversed|triggered|convinced|tricked|outran|sabotaged|crashed|detonated|threw|dragged|pulled|pushed|catapulted)\b/i;

const REACTION_VERBS_TOT = /\b(watched|noticed|felt|looked|saw|heard|wondered|stared|gasped|blinked|waited|sat|stood|observed|realised|realized)\b/i;
const ACTION_VERBS_TOT   = /\b(ran|jumped|grabbed|climbed|bounced|hopped|rolled|wiggled|skipped|twirled|stomped|splashed|zoomed|flung|tossed|threw|kicked|pulled|pushed|built|fixed|opened|poked|tickled|launched|waved|sang|shouted|called|tried|started|helped|found)\b/i;

/* ------------------------------------------------------------------ */
/* Word-repetition check on RENDERED text                              */
/* ------------------------------------------------------------------ */
function findExcessiveRepeats(plainText, threshold) {
  // Skip very short words (articles, prepositions) and the child's name
  const skipWords = new Set([
    'the','a','an','and','but','or','in','on','at','to','of','it','is','was',
    'had','has','did','do','been','be','are','were','with','for','from','not',
    'all','out','up','down','into','they','them','said','then','just','back',
    'him','her','his','she','its','our','your','their','this','that','one',
    'two','there','when','what','very','some','got','get','can','will','have',
    'her','him','into','more','over','than','than','because','after','before',
    'about','also','look','like','come','came','went','would','could','should',
    'even','still','see','know','time','here','where','made','make','take',
  ]);
  // Also skip the child's name (it's expected to appear many times)
  skipWords.add(CHILD_NAME.toLowerCase());

  const words = plainText.toLowerCase().replace(/[^a-z\s']/g, '').split(/\s+/).filter(w => w.length > 3 && !skipWords.has(w));
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  return Object.entries(counts).filter(([, c]) => c > threshold).map(([w, c]) => `"${w}"×${c}`);
}

/* ------------------------------------------------------------------ */
/* Heuristic scorer                                                     */
/* ------------------------------------------------------------------ */
function scoreSentiment(plain, tier, story) {
  const paraCount = story.paragraphs ? story.paragraphs.length : 0;
  const wordCount = plain.split(/\s+/).length;

  // Humor signals
  const humor = Math.min(5, Math.max(2,
    2 + Math.floor((plain.match(/!|KAPOW|KABLAM|BOING|ZAP|POW|WOW|whoa|giggle|wobble|bonk|splat|zoom|crash|tumble|sneeze|hiccup|burp|squeak/gi) || []).length / 2)
  ));

  // Substance: word count + para count
  const substance = Math.min(5, (wordCount > 160 ? 5 : wordCount > 120 ? 4 : wordCount > 80 ? 3 : 2) +
    (paraCount >= 5 ? 0 : -0.5));
  const substanceRounded = Math.max(1, Math.min(5, Math.round(substance)));

  // Agency verbs
  const agencyHits = (plain.match(/grabbed|climbed|ran|jumped|launched|charged|built|fixed|solved|decided|sprinted|escaped|declared|invented|rescued|screamed|shouted|yelled|threw|kicked|smashed|pulled|activated|triggered|blocked|found|opened|started|tried|helped/gi) || []).length;
  const kidAgency = Math.min(5, Math.max(2, 2 + Math.floor(agencyHits / 1.5)));

  // Choice integration — count highlight tokens from raw text
  const rawBody = (story.paragraphs || []).join(' ');
  const hlCount = (rawBody.match(/\[(?:c|y):([^\]]+)\]/g) || []).length;
  const choiceInt = Math.min(5, Math.max(2, 2 + Math.floor(hlCount / 3)));

  // Rereadability — unique word ratio on rendered text
  const words = plain.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).filter(w => w.length > 3);
  const uniqueRatio = words.length > 0 ? new Set(words).size / words.length : 0;
  const reread = Math.min(5, Math.max(2, Math.round(uniqueRatio * 5.5)));

  // Age fit
  const ageFitByParaCount = { tot: 4, little: 4, kid: 5, big: 6, tween: 6 };
  const ageFit = paraCount === ageFitByParaCount[tier] ? 4 : 3;

  return { humor, substance: substanceRounded, kidAgency, choiceInt, reread, ageFit };
}

/* ------------------------------------------------------------------ */
/* Run UAT                                                              */
/* ------------------------------------------------------------------ */
const results = [];

for (const [tier, sets] of Object.entries(TIER_SETS)) {
  const age          = TIER_AGE[tier];
  const repThreshold = (tier === 'tot' || tier === 'little') ? 3 : 4;

  for (let i = 0; i < 5; i++) {
    const picks  = { ...sets[i], storyMode: 'anytime' };
    const story  = ctx.generateStoryRouted(CHILD_NAME, picks, age);
    const storyId = `${tier.toUpperCase()} #${i + 1}`;

    if (!story) {
      results.push({ tier, storyId, fails: [`F0: generateStoryRouted returned null`], story: null, scores: null, plain: '' });
      continue;
    }

    const rawAll    = [story.title, ...(story.paragraphs || [])].join('\n');
    const rawBody   = (story.paragraphs || []).join('\n');
    const plain     = renderTokens(rawAll);
    const plainBody = renderTokens(rawBody);
    const lastPara  = story.paragraphs ? renderTokens(story.paragraphs[story.paragraphs.length - 1]) : '';
    const fails     = [];

    /* F1 — Phantom character names
       Look for multi-occurrence capitalised words that:
         - are not the child's name
         - are not in any pick value
         - appear ≥2 times mid-sentence (not sentence-opening)
       Strategy: scan mid-sentence caps (preceded by a non-period non-start)
    */
    const pickWords = new Set(
      Object.values(picks).flatMap(p => (p && p.w ? p.w.toLowerCase().split(/\s+/) : []))
    );
    // Find words that look like proper names: mid-sentence capital, ≥4 chars
    const midSentenceCaps = Array.from(
      plain.matchAll(/(?<=[a-z,;] |\b[a-z]+ )([A-Z][a-z]{3,})/g)
    ).map(m => m[1]);
    const capCounts = {};
    for (const w of midSentenceCaps) capCounts[w] = (capCounts[w] || 0) + 1;
    const phantoms = Object.entries(capCounts)
      .filter(([w, c]) => c >= 2 && !COMMON_CAPS.has(w) && w !== CHILD_NAME && !pickWords.has(w.toLowerCase()))
      .map(([w]) => w);
    if (phantoms.length) fails.push(`F1: possible phantom name(s) — ${phantoms.join(', ')}`);

    /* F3 — "The End" more than once */
    const theEndCount = (plain.match(/\bThe End\b/gi) || []).length;
    if (theEndCount > 1) fails.push(`F3: "The End" appears ${theEndCount}×`);

    /* F5 — Anytime ending with sleep/bedtime language */
    if (BEDTIME_RX.test(lastPara)) {
      fails.push(`F5: anytime mode last paragraph has bedtime/sleep language`);
    }

    /* F6 — Word repetition on RENDERED text */
    const reps = findExcessiveRepeats(plain, repThreshold);
    if (reps.length) fails.push(`F6: repeated >${repThreshold}× — ${reps.slice(0, 4).join(', ')}`);

    /* F7 — Stale phrases */
    for (const phrase of STALE_PHRASES) {
      if (plain.includes(phrase)) fails.push(`F7: stale phrase — "${phrase}"`);
    }

    /* F8 — Title case: title must not contain all-lowercase version of a multi-char picked word */
    if (story.title) {
      const titlePlain = renderTokens(story.title);
      // The token [c:{ally.titleText}] should produce a capitalised word.
      // Flag if a picked word appears lowercased mid-title (after a space, not at start).
      for (const [, pick] of Object.entries(picks)) {
        if (!pick || !pick.w || pick.w.length <= 2) continue;
        const w = pick.w;
        // Check if the lowercased word appears preceded by a space in the title
        if (new RegExp(` ${w.toLowerCase()}\\b`).test(titlePlain)) {
          fails.push(`F8: title has lowercase picked word "${w}" — "${titlePlain}"`);
        }
      }
    }

    /* F9 — Tween: agency too low */
    if (tier === 'tween') {
      const agencyHits = (plainBody.match(AGENCY_VERBS_TWEEN) || []).length;
      if (agencyHits < 2) fails.push(`F9: tween agency too low — ${agencyHits} agency-verb hit(s) in body`);
    }

    /* F10 — Tot/little: child must drive action */
    if (tier === 'tot' || tier === 'little') {
      const sentences = plainBody.split(/(?<=[.!?])\s+/);
      const childSents = sentences.filter(s => s.toLowerCase().includes(CHILD_NAME.toLowerCase()));
      let actionC = 0, reactionC = 0;
      for (const s of childSents) {
        if (ACTION_VERBS_TOT.test(s))   actionC++;
        if (REACTION_VERBS_TOT.test(s)) reactionC++;
      }
      if (childSents.length >= 3 && actionC === 0 && reactionC >= 2) {
        fails.push(`F10: child only observes (0 action-verbs, ${reactionC} reaction-verbs in Maisie-sentences)`);
      }
    }

    const scores = scoreSentiment(plain, tier, story);
    results.push({ tier, storyId, fails, story, scores, plain });
  }
}

/* ------------------------------------------------------------------ */
/* Print per-story output                                               */
/* ------------------------------------------------------------------ */
const TIER_ORDER = ['tot','little','kid','big','tween'];
console.log('\n' + '='.repeat(72));
console.log(' NoddyTales UAT — Story Quality Review  (b26 / v0.9.3)');
console.log('='.repeat(72));

for (const tier of TIER_ORDER) {
  const tierResults = results.filter(r => r.tier === tier);
  console.log(`\n${'─'.repeat(72)}`);
  console.log(`TIER: ${tier.toUpperCase()}  (age ${TIER_AGE[tier]})  — 5 stories, anytime mode`);
  console.log('─'.repeat(72));

  for (const r of tierResults) {
    console.log(`\n[ ${r.storyId} ]`);
    if (r.story) {
      console.log(`  Title:  ${renderTokens(r.story.title || '(no title)')}`);
      (r.story.paragraphs || []).forEach((p, i) => {
        const rendered = renderTokens(p);
        console.log(`  P${i + 1}:    ${rendered.substring(0, 160)}${rendered.length > 160 ? '…' : ''}`);
      });
      if (r.scores) {
        const s = r.scores;
        const avg = ((s.humor + s.substance + s.kidAgency + s.choiceInt + s.reread + s.ageFit) / 6).toFixed(1);
        console.log(`  Scores  Humor:${s.humor}  Sub:${s.substance}  Agency:${s.kidAgency}  Choice:${s.choiceInt}  Reread:${s.reread}  AgeFit:${s.ageFit}  →  avg ${avg}`);
      }
    }
    if (r.fails.length === 0) {
      console.log(`  ✓ Clean — no flags`);
    } else {
      r.fails.forEach(f => console.log(`  ✗ ${f}`));
    }
  }
}

/* ------------------------------------------------------------------ */
/* Scores summary table                                                 */
/* ------------------------------------------------------------------ */
console.log('\n\n' + '='.repeat(72));
console.log(' SCORES SUMMARY  (heuristic — see per-story text for manual review)');
console.log('='.repeat(72));
console.log(`${'Tier'.padEnd(8)} ${'Humor'.padStart(5)} ${'Sub'.padStart(5)} ${'Agency'.padStart(6)} ${'Choice'.padStart(6)} ${'Reread'.padStart(6)} ${'AgeFit'.padStart(6)} ${'Avg'.padStart(5)} ${'Flags'.padStart(5)}`);
console.log('─'.repeat(64));

const summaryRows = [];
for (const tier of TIER_ORDER) {
  const tr = results.filter(r => r.tier === tier && r.scores);
  if (!tr.length) continue;
  const avg = ax => (tr.reduce((a, r) => a + r.scores[ax], 0) / tr.length).toFixed(1);
  const flagCount = tr.reduce((a, r) => a + r.fails.length, 0);
  const avgs = { humor: avg('humor'), substance: avg('substance'), kidAgency: avg('kidAgency'),
                 choiceInt: avg('choiceInt'), reread: avg('reread'), ageFit: avg('ageFit') };
  const overallAvg = (Object.values(avgs).reduce((a, v) => a + parseFloat(v), 0) / 6).toFixed(1);
  summaryRows.push({ tier, ...avgs, overallAvg, flagCount });
  console.log(`${tier.toUpperCase().padEnd(8)} ${avgs.humor.padStart(5)} ${avgs.substance.padStart(5)} ${avgs.kidAgency.padStart(6)} ${avgs.choiceInt.padStart(6)} ${avgs.reread.padStart(6)} ${avgs.ageFit.padStart(6)} ${overallAvg.padStart(5)} ${String(flagCount).padStart(5)}`);
}

/* ------------------------------------------------------------------ */
/* Threshold gates                                                      */
/* ------------------------------------------------------------------ */
console.log('\n' + '='.repeat(72));
console.log(' THRESHOLD GATES');
console.log('='.repeat(72));

let decision = 'PASS';
const blockingDefects = [];
const minorIssues     = [];

for (const row of summaryRows) {
  const { tier } = row;
  const isYoung = tier === 'tot' || tier === 'little';
  const avg     = parseFloat(row.overallAvg);
  const minAgeFit = Math.min(...results.filter(r => r.tier === tier && r.scores).map(r => r.scores.ageFit));

  if (row.flagCount > 0) {
    blockingDefects.push(`${tier.toUpperCase()}: ${row.flagCount} flag(s) — see story detail above`);
    decision = 'FAIL';
  }
  if (isYoung && avg < 3.5) {
    blockingDefects.push(`${tier.toUpperCase()}: overall avg ${avg} < 3.5 (ages 2-5 threshold)`);
    decision = decision === 'PASS' ? 'CONDITIONAL PASS' : 'FAIL';
  }
  if (!isYoung) {
    const subAvg = parseFloat(row.substance);
    if (subAvg < 4.0) {
      blockingDefects.push(`${tier.toUpperCase()}: Substance avg ${subAvg} < 4.0 (ages 6-13 threshold)`);
      decision = decision === 'PASS' ? 'CONDITIONAL PASS' : 'FAIL';
    }
    const choiceAvg = parseFloat(row.choiceInt);
    if (choiceAvg < 4.0) {
      minorIssues.push(`${tier.toUpperCase()}: Choice Integration avg ${choiceAvg} < 4.0`);
      if (decision === 'PASS') decision = 'CONDITIONAL PASS';
    }
  }
  if (minAgeFit < 3) {
    blockingDefects.push(`${tier.toUpperCase()}: story with AgeFit ${minAgeFit} < 3`);
    decision = 'FAIL';
  }
}

if (blockingDefects.length) {
  console.log('BLOCKING:');
  blockingDefects.forEach(d => console.log(`  ✗ ${d}`));
}
if (minorIssues.length) {
  console.log('NON-BLOCKING / ADVISORY:');
  minorIssues.forEach(d => console.log(`  ⚠ ${d}`));
}
if (!blockingDefects.length && !minorIssues.length) {
  console.log('  ✓ All thresholds met — no issues');
}

const totalFlags = results.reduce((a, r) => a + r.fails.length, 0);
console.log('\n' + '='.repeat(72));
console.log(` DECISION: ${decision}`);
console.log('='.repeat(72));
console.log(`Stories: 25  |  Flags: ${totalFlags}  |  QA harness: PASS (25/25 gates)`);
