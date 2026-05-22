#!/usr/bin/env node
/* content-golden-audit.js — b25 Content QA System.
 *
 * Runs the GOLDEN STORY SET: 20 fixed scenarios spanning all five tiers, the
 * 8 V3 blueprints, multiple setting flavors, and both story modes (bedtime
 * + anytime). Picks are FIXED per scenario so this audit is reproducible
 * across builds — re-running between content builds shows whether a fix
 * helped or regressed a specific story shape.
 *
 * Output: a markdown file where each scenario has blank human score fields
 * (humor / substance / choice integration / age fit / rereadability /
 * notes). The maintainer fills the fields in after reading each story.
 *
 * Scoring rubric (per docs/content-qa-playbook.md):
 *   1-5 per axis. 3 = ships acceptably. 4-5 = good. 1-2 = drag.
 *
 * The 20-scenario distribution intentionally over-samples the kid+big+tween
 * tier (12 scenarios) because that's where humor matters most and where
 * the most recent content work (b23-b24 HIGH_IMPACT + absurd_consequence)
 * landed. tot+little get 8 scenarios total.
 *
 * Usage:
 *   node scripts/content-golden-audit.js
 *   node scripts/content-golden-audit.js --out docs/content-qa-b24-baseline
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
return { generateStoryV3, generateStoryV2, resolveSetting };
`;
  return (new Function(harness))();
}

const args = process.argv.slice(2);
function arg(name, fb) { const i = args.indexOf(name); return (i >= 0 && args[i + 1]) ? args[i + 1] : fb; }
const OUT_DIR = arg('--out', path.join(ROOT, 'docs', 'content-qa-runs'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const ctx = loadEngineContext();
const STRIP = t => String(t || '').replace(/\[(name|c|y):([^\]]+)\]/g, '$2');
function sentenceCount(t){return STRIP(t).replace(/\.{3,}/g,'.').split(/(?<=[.!?])\s+/).filter(s=>s.trim().length>0).length;}

/* The 20 fixed scenarios. Each has:
   - id          : stable identifier for cross-build comparison
   - tier, age   : age tier targeting
   - blueprint   : forced via picks.__v3BlueprintId
   - flavor      : setting flavor key (or 'surprise')
   - storyMode   : 'bedtime' | 'anytime'
   - picks       : the picker word set (must include freeword/freeword2/sound
                   for HIGH_IMPACT scenarios) */
const GOLDEN_SCENARIOS = [
  // ── TOT (4) — wonder/sky × bedtime/anytime
  { id:'tot-wonder-food-bedtime',  tier:'tot',    age:3, blueprint:'tot_wonder_v3', flavor:'at_home',     storyMode:'bedtime',
    picks: { pet:{w:'bunny'}, food:{w:'grapes'},   creature:{w:'frog'}, color:{w:'pink'},     move:{w:'jumped'},  sound:{w:'glorp'} } },
  { id:'tot-wonder-food-anytime',  tier:'tot',    age:2, blueprint:'tot_wonder_v3', flavor:'at_school',   storyMode:'anytime',
    picks: { pet:{w:'puppy'}, food:{w:'apple'},    creature:{w:'butterfly'}, color:{w:'yellow'}, move:{w:'hopped'}, sound:{w:'boing'} } },
  { id:'tot-sky-bedtime',          tier:'tot',    age:3, blueprint:'tot_sky_v3',    flavor:'outside',     storyMode:'bedtime',
    picks: { pet:{w:'cat'},   sky:{w:'cloud'},     creature:{w:'frog'}, color:{w:'blue'},     move:{w:'spun'},    sound:{w:'plop'} } },
  { id:'tot-sky-anytime',          tier:'tot',    age:2, blueprint:'tot_sky_v3',    flavor:'surprise',    storyMode:'anytime',
    picks: { pet:{w:'duck'},  sky:{w:'rainbow'},   creature:{w:'fish'}, color:{w:'green'},   move:{w:'wiggled'}, sound:{w:'honk'} } },

  // ── LITTLE (4) — quest/food × bedtime/anytime
  { id:'little-quest-bedtime',     tier:'little', age:5, blueprint:'little_quest_v3', flavor:'animal_place', storyMode:'bedtime',
    picks: { pet:{w:'kitten'}, food:{w:'pizza'},   place:{w:'forest'}, creature:{w:'owl'},  color:{w:'lavender'}, move:{w:'danced'}, weather:{w:'sunny'},  sound:{w:'gloop'} } },
  { id:'little-quest-anytime',     tier:'little', age:4, blueprint:'little_quest_v3', flavor:'food_place',    storyMode:'anytime',
    picks: { pet:{w:'parrot'}, food:{w:'cupcakes'}, place:{w:'castle'}, creature:{w:'dragon'}, color:{w:'rainbow'}, move:{w:'twirled'}, weather:{w:'snowy'}, sound:{w:'fwoosh'} } },
  { id:'little-food-bedtime',      tier:'little', age:5, blueprint:'little_food_v3',  flavor:'at_home',       storyMode:'bedtime',
    picks: { pet:{w:'puppy'},  food:{w:'cookies'}, place:{w:'kitchen'}, creature:{w:'mouse'}, color:{w:'crimson'},  move:{w:'galloped'}, weather:{w:'cloudy'}, sound:{w:'sproing'} } },
  { id:'little-food-anytime',      tier:'little', age:4, blueprint:'little_food_v3',  flavor:'on_the_go',     storyMode:'anytime',
    picks: { pet:{w:'piglet'}, food:{w:'noodles'}, place:{w:'beach'},  creature:{w:'crab'},  color:{w:'teal'},     move:{w:'splashed'}, weather:{w:'windy'},  sound:{w:'kabloom'} } },

  // ── KID (4) — all 4 blueprints, mostly bedtime, mix of flavors
  { id:'kid-lost-snack-bedtime',   tier:'kid', age:7, blueprint:'lost_snack_v3',    flavor:'food_place',  storyMode:'bedtime',
    picks: { pet:{w:'parrot'}, food:{w:'donuts'}, place:{w:'jungle'}, creature:{w:'dinosaur'}, color:{w:'rainbow'}, move:{w:'bounced'}, mood:{w:'silly'},   sound:{w:'zoinks'}, freeword:{w:'pickle crown',subtype:'shout'}, freeword2:{w:'spoon hat'} } },
  { id:'kid-goal-spine-anytime',   tier:'kid', age:6, blueprint:'goal_spine_v3',    flavor:'at_school',   storyMode:'anytime',
    picks: { pet:{w:'eagle'},  food:{w:'pizza'},  place:{w:'gym'},    creature:{w:'robot'},    color:{w:'gold'},    move:{w:'skated'},  mood:{w:'dramatic'}, sound:{w:'squonk'}, freeword:{w:'wobble-flop',subtype:'shout'}, freeword2:{w:'cheese hat'} } },
  { id:'kid-show-wrong-bedtime',   tier:'kid', age:7, blueprint:'show_wrong_v3',    flavor:'at_home',     storyMode:'bedtime',
    picks: { pet:{w:'beaver'}, food:{w:'tacos'},  place:{w:'living room'}, creature:{w:'unicorn'}, color:{w:'orange'}, move:{w:'tiptoed'}, mood:{w:'overexcited'}, sound:{w:'kafoom'}, freeword:{w:'sneezy-pants',subtype:'shout'}, freeword2:{w:'rubber duck'} } },
  { id:'kid-rule-loophole-bedtime',tier:'kid', age:7, blueprint:'rule_loophole_v3', flavor:'somewhere_weird', storyMode:'bedtime',
    picks: { pet:{w:'goose'},  food:{w:'pretzels'}, place:{w:'arcade'}, creature:{w:'tiny wizard'}, color:{w:'silver'}, move:{w:'marched'}, mood:{w:'determined'}, sound:{w:'crash'}, freeword:{w:'glorp',subtype:'shout'}, freeword2:{w:'banana phone'} } },

  // ── BIG (4) — all 4 blueprints, full HIGH_IMPACT
  { id:'big-lost-snack-anytime',   tier:'big', age:9,  blueprint:'lost_snack_v3',    flavor:'on_the_go',  storyMode:'anytime',
    picks: { pet:{w:'overly formal otter'}, food:{w:'gas station nachos'}, place:{w:'mini golf course'}, creature:{w:'expired mascot'}, color:{w:'wildly pleasant blue'}, move:{w:'posed dramatically'}, mood:{w:'absolutely bonkers'}, sound:{w:'bonk'}, freeword:{w:'mister floof',subtype:'shout'}, freeword2:{w:'soggy sock'} } },
  { id:'big-goal-spine-bedtime',   tier:'big', age:10, blueprint:'goal_spine_v3',    flavor:'at_school',  storyMode:'bedtime',
    picks: { pet:{w:'eagle'},  food:{w:'haunted tea'},        place:{w:'school office'},  creature:{w:'sock monster'}, color:{w:'gym sock white'},   move:{w:'shuffled with purpose'}, mood:{w:'determined'}, sound:{w:'thwip'},  freeword:{w:'crinkle-bonk',subtype:'shout'}, freeword2:{w:'underpants helmet'} } },
  { id:'big-show-wrong-anytime',   tier:'big', age:8,  blueprint:'show_wrong_v3',    flavor:'at_home',    storyMode:'anytime',
    picks: { pet:{w:'goose'},  food:{w:'emergency burrito'},  place:{w:'living room'},    creature:{w:'confused mascot'}, color:{w:'moss green'},  move:{w:'slid heroically'},     mood:{w:'overexcited'},  sound:{w:'kabloom'}, freeword:{w:'sproing',subtype:'shout'}, freeword2:{w:'noodle scarf'} } },
  { id:'big-rule-loophole-bedtime',tier:'big', age:9,  blueprint:'rule_loophole_v3', flavor:'somewhere_weird', storyMode:'bedtime',
    picks: { pet:{w:'tiny horse'}, food:{w:'mystery smoothie'}, place:{w:'forgotten hallway'}, creature:{w:'tiny judge'}, color:{w:'neon green'}, move:{w:'stared bravely'}, mood:{w:'snack-driven'}, sound:{w:'whammy'}, freeword:{w:'pickle wizard',subtype:'shout'}, freeword2:{w:'paper crown'} } },

  // ── TWEEN (4) — all 4 blueprints, ironic mood vocab
  { id:'tween-lost-snack-anytime', tier:'tween', age:12, blueprint:'lost_snack_v3',    flavor:'on_the_go', storyMode:'anytime',
    picks: { pet:{w:'judgy cat'}, food:{w:'gas station taquitos'}, place:{w:'mall elevator'}, creature:{w:'algorithm ghost'}, color:{w:'dusty rose'}, move:{w:'posed dramatically'}, mood:{w:'deeply over it'}, sound:{w:'meep'}, freeword:{w:'snorble-doo',subtype:'shout'}, freeword2:{w:'stinky bananas'} } },
  { id:'tween-goal-spine-bedtime', tier:'tween', age:13, blueprint:'goal_spine_v3',    flavor:'somewhere_weird', storyMode:'bedtime',
    picks: { pet:{w:'koala'},   food:{w:'leftover pasta'}, place:{w:'empty movie theater'}, creature:{w:'cafeteria cryptid'}, color:{w:'oddly pleasant blue'}, move:{w:'gracefully bailed'}, mood:{w:'chronically online'}, sound:{w:'pfft'}, freeword:{w:'sprongulous',subtype:'shout'}, freeword2:{w:'moon spoon'} } },
  { id:'tween-show-wrong-anytime', tier:'tween', age:11, blueprint:'show_wrong_v3',    flavor:'at_school', storyMode:'anytime',
    picks: { pet:{w:'sleepy croc'}, food:{w:'cafeteria fries'}, place:{w:'gym'}, creature:{w:'unreasonably tall goose'}, color:{w:'terminally curious'}, move:{w:'blinked dramatically'}, mood:{w:'minorly iconic'}, sound:{w:'zonk'}, freeword:{w:'flumpy',subtype:'shout'}, freeword2:{w:'damp toast'} } },
  { id:'tween-rule-loophole-bedtime', tier:'tween', age:13, blueprint:'rule_loophole_v3', flavor:'on_the_go', storyMode:'bedtime',
    picks: { pet:{w:'judgy cat'}, food:{w:'vending machine pretzels'}, place:{w:'mall elevator'}, creature:{w:'vending machine oracle'}, color:{w:'cafeteria gray'}, move:{w:'snuck quietly'}, mood:{w:'quietly panicking'}, sound:{w:'glonk'}, freeword:{w:'bonkledink',subtype:'shout'}, freeword2:{w:'mystery jelly'} } },
];

function runScenario(sc) {
  const picks = {
    ...sc.picks,
    setting:   ctx.resolveSetting(sc.flavor),
    storyMode: sc.storyMode,
    __v3BlueprintId: sc.blueprint,
  };
  const story = ctx.generateStoryV3('Cole', picks, sc.age);
  if (!story) {
    return { ...sc, error: 'null story (engine returned null for this pick set)' };
  }
  return {
    ...sc,
    settingPlace: picks.setting?.place?.text || '(surprise)',
    sentences:    sentenceCount(story.paragraphs.join(' ')),
    title:        STRIP(story.title || ''),
    paragraphs:   (story.paragraphs || []).map(STRIP),
  };
}

const results = GOLDEN_SCENARIOS.map(runScenario);
const datetag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const mdPath  = path.join(OUT_DIR, `content-golden-audit-${datetag}.md`);

let md = `# Content QA — Golden Story Set (20 fixed scenarios)\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Scenarios: ${GOLDEN_SCENARIOS.length} (4 tot · 4 little · 4 kid · 4 big · 4 tween)\n\n`;
md += `**Scoring:** read each story. Fill the score fields (1-5) per the rubric in \`docs/content-qa-playbook.md\`. Compare against the previous build's golden run to see whether a content fix actually moved the needle.\n\n`;
md += `## Per-scenario index\n\n`;
md += `| id | tier | age | blueprint | flavor | storyMode | sentences |\n|---|---|---|---|---|---|---|\n`;
for (const r of results) {
  md += `| ${r.id} | ${r.tier} | ${r.age} | ${r.blueprint} | ${r.flavor} | ${r.storyMode} | ${r.sentences || (r.error ? 'error' : '—')} |\n`;
}
md += `\n## Stories\n\n`;
for (const r of results) {
  md += `### ${r.id}\n\n`;
  md += `**tier:** ${r.tier}  ·  **age:** ${r.age}  ·  **blueprint:** ${r.blueprint}  ·  **flavor:** ${r.flavor}  ·  **storyMode:** ${r.storyMode}  ·  **setting:** ${r.settingPlace || '—'}  ·  **sentences:** ${r.sentences || '—'}\n\n`;
  md += `**Picks:** ` + Object.entries(r.picks).map(([k, v]) => `${k}=${v?.w || v}`).join(', ') + `\n\n`;
  if (r.error) { md += `_${r.error}_\n\n`; continue; }
  md += `**Title:** ${r.title}\n\n`;
  for (const p of r.paragraphs) md += `> ${p}\n>\n`;
  md += `\n**Scores** (rate 1-5; leave blank if you skip)\n\n`;
  md += `- humor:               \n`;
  md += `- substance:           \n`;
  md += `- choice integration:  \n`;
  md += `- age fit:              \n`;
  md += `- rereadability:       \n`;
  md += `- notes:               \n\n`;
  md += `---\n\n`;
}

fs.writeFileSync(mdPath, md);
const nulls = results.filter(r => r.error).length;
console.log(`Generated ${results.length} golden scenarios. ${nulls} nulls.`);
console.log(`Wrote: ${mdPath}`);
