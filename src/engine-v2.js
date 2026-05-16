/* ================================================================
   NoddyTales v2 Engine — Phase 1: Thin Kid-Tier Prototype
   ================================================================
   Goal: authored comedy engine using rich word objects + beat cards
   + recipes, replacing the v1 template-substitution model.

   This file ships disabled by default. Activate with:
     - URL param: ?engine=v2 (persists to localStorage)
     - localStorage: nt_engine_v2 = "1"

   When inactive, buildStory() in index.html runs the v1 engine.
   When active for kid tier, buildStory() delegates to generateStoryV2();
   any failure falls back to v1 silently so the user never sees an
   empty story.

   This is Segment A of the v2.0 build:
     - Grammar helpers (article, plural, render, slot resolution)
     - ~10 of each rich word type (companions, visitors, places,
       foods, objects, sounds, adverbs, numbers, liquids, jobs)
     - 1 recipe (Quest, 5-beat)
     - 5 story seeds
     - 15 beat cards
     - generateStoryV2() — kid tier only

   Subsequent segments expand the library, add recipes, add tiers,
   add a QA harness, and eventually flip v2 to default in v2.0.0.
   ================================================================ */

const ENGINE_V2_VERSION = 'v1.20.0-segment-A';

/* ================================================================
   GRAMMAR HELPERS
   These let beat-card lines reference {companion.articleText} etc.
   and get the right surface form automatically. The renderer owns
   grammar so content authors don't solve it line-by-line.
   ================================================================ */
const V2Grammar = (() => {
  const VOWEL_START = /^[aeiouAEIOU]/;

  function articleText(word) {
    if (!word) return '';
    if (word.isPlural) return `some ${word.text}`;
    const article = word.article || (VOWEL_START.test(word.text) ? 'an' : 'a');
    return `${article} ${word.text}`;
  }

  // For subject positions in prose: "said the dragon", "the knight blocked".
  // Lowercase variant — fits mid-sentence.
  function theText(word) {
    if (!word) return '';
    if (word.isPlural) return `the ${word.text}`;
    return `the ${word.text}`;
  }
  // Sentence-start variant: "The dragon nodded."
  function TheText(word) {
    if (!word) return '';
    return `The ${word.text}`;
  }

  // Capitalize every word in a phrase — used for multi-word things in titles.
  // "sleepy megaphone" → "Sleepy Megaphone"
  function titleCase(str) {
    if (!str) return '';
    return String(str).split(/(\s+)/).map(part => {
      if (/^\s+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join('');
  }

  function plural(word) {
    if (!word) return '';
    return word.plural || (word.text.endsWith('s') ? word.text : word.text + 's');
  }

  function possessive(name) {
    if (!name) return '';
    return name.endsWith('s') ? `${name}'` : `${name}'s`;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Pick one item from an array (or return the value if it's a single item).
  function pickOne(arrOrVal) {
    if (Array.isArray(arrOrVal)) return arrOrVal[Math.floor(Math.random() * arrOrVal.length)];
    return arrOrVal;
  }

  // Resolve "slot.property" against a slots object. Property accessors:
  //   .text          → raw word.text
  //   .articleText   → "an octopus" / "some tacos"
  //   .plural        → "octopuses"
  //   .trait         → random word.traits[i]
  //   .action        → random word.actions[i]
  //   .sound         → random word.sounds[i] (companion-attached) OR the slot's own text
  //   .emoji         → word.emoji
  //   (no prop)      → word.text
  // For non-word slots (kid.name, sidekick.name, sidekick.lc), uses the raw string.
  function resolveSlot(slots, path) {
    const parts = path.split('.');
    const slotName = parts[0];
    const prop     = parts[1];
    const slot     = slots[slotName];
    if (slot == null) return `{${path}}`; // surface broken refs visibly during dev

    // Plain-string slots (kid.name, sidekick.lc, freeword, etc.)
    if (typeof slot === 'string') return slot;

    // Rich word object
    if (!prop || prop === 'text')     return slot.text;
    if (prop === 'articleText')        return articleText(slot);
    if (prop === 'theText')            return theText(slot);     // mid-sentence: "the dragon"
    if (prop === 'TheText')            return TheText(slot);     // sentence-start: "The dragon"
    if (prop === 'titleText')          return titleCase(slot.text); // "sleepy megaphone" → "Sleepy Megaphone"
    if (prop === 'plural')             return plural(slot);
    if (prop === 'emoji')              return slot.emoji || '';
    if (prop === 'trait')              return pickOne(slot.traits || []) || '';
    if (prop === 'action')             return pickOne(slot.actions || []) || '';
    if (prop === 'sound')              return pickOne(slot.sounds || []) || '';
    if (prop === 'funnyUse')           return pickOne(slot.funnyUses || []) || '';
    if (prop === 'cap')                return capitalize(slot.text);
    return slot[prop] != null ? String(slot[prop]) : `{${path}}`;
  }

  // Render a template line with {slot.prop} placeholders.
  function render(line, slots) {
    return line.replace(/\{([a-zA-Z][\w.]*)\}/g, (_, path) => resolveSlot(slots, path));
  }

  return { articleText, theText, TheText, plural, possessive, capitalize, titleCase, pickOne, resolveSlot, render };
})();

/* ================================================================
   RICH WORD OBJECTS — Phase 1 kid-tier subset
   Each object carries:
     - text, emoji, article (manual override), plural form
     - actions, sounds, traits (used by beat-card line variants)
     - comedy metadata (used in later phases for tone balancing)
   ================================================================ */
const V2_WORDS = {
  /* Companions — the kid's friendly partner. Drives action with the kid. */
  companions: [
    { id:'dragon', text:'dragon', emoji:'🐲', article:'a',
      traits:['fire-breathing','sleepy','overconfident'],
      actions:['flapped its wings dramatically','toasted a marshmallow without asking','curled up on a pillow'],
      sounds:['ROAAAAR','snortle','fwoom'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:7, bedtimeSoftness:6 } },
    { id:'panda', text:'panda', emoji:'🐼', article:'a',
      traits:['hungry','round','wobbly'],
      actions:['rolled over twice on purpose','demanded snacks','climbed the curtains'],
      sounds:['hrrmph','nyom','bamboo crunch'],
      comedy:{ energy:'bouncy', dignity:'medium', absurdity:5, bedtimeSoftness:8 } },
    { id:'penguin', text:'penguin', emoji:'🐧', article:'a',
      traits:['formal','tiny','slightly offended'],
      actions:['waddled away in a huff','slid across the floor','arranged things in a tidy line'],
      sounds:['honk','squawk','tiny ahem'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:4, bedtimeSoftness:8 } },
    { id:'octopus', text:'octopus', emoji:'🐙', article:'an', plural:'octopuses',
      traits:['squishy','many-armed','dramatic'],
      actions:['waved all eight arms','inked politely','hugged too many things at once'],
      sounds:['splorp','glub','blorp'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:8, bedtimeSoftness:6 } },
    { id:'unicorn', text:'unicorn', emoji:'🦄', article:'a',
      traits:['glittery','proud','very into rules'],
      actions:['galloped in a circle','sparkled on purpose','offered unsolicited advice'],
      sounds:['neighhh','tinkle','prance prance'],
      comedy:{ energy:'bouncy', dignity:'high', absurdity:6, bedtimeSoftness:8 } },
    { id:'fennec_fox', text:'fennec fox', emoji:'🦊', article:'a',
      traits:['big-eared','sneaky','tiny'],
      actions:['peeked from behind a rock','listened intently','dashed off without explanation'],
      sounds:['yip yip','sniff','tiny gasp'],
      comedy:{ energy:'bouncy', dignity:'medium', absurdity:5, bedtimeSoftness:7 } },
    { id:'capybara', text:'capybara', emoji:'🦫', article:'a',
      traits:['chill','damp','unbothered'],
      actions:['sat in a puddle','let a bird land on its head','blinked very slowly'],
      sounds:['hmm','blub','soft squeak'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:4, bedtimeSoftness:9 } },
    { id:'axolotl', text:'axolotl', emoji:'🐠', article:'an', plural:'axolotls',
      traits:['smiley','soft','always damp'],
      actions:['floated gently','wiggled its frills','grinned at nothing'],
      sounds:['blub','glorp','wiggle'],
      comedy:{ energy:'calm', dignity:'medium', absurdity:5, bedtimeSoftness:9 } },
    { id:'wolf_cub', text:'wolf cub', emoji:'🐺', article:'a',
      traits:['fluffy','overly serious','tiny'],
      actions:['howled at a leaf','tripped over its own tail','pretended to be in charge'],
      sounds:['awoooo','yip','sniff'],
      comedy:{ energy:'bouncy', dignity:'medium', absurdity:5, bedtimeSoftness:7 } },
    { id:'sloth', text:'sloth', emoji:'🦥', article:'a',
      traits:['slow','smiley','upside-down'],
      actions:['took twelve full seconds to wave','smiled at a cloud','hugged a branch with great commitment'],
      sounds:['mmmmm','blink','tiny yawn'],
      comedy:{ energy:'calm', dignity:'medium', absurdity:6, bedtimeSoftness:10 } },
  ],

  /* Visitors — strangers, problem-makers, characters who arrive. */
  visitors: [
    { id:'goblin', text:'goblin', emoji:'👺', article:'a',
      traits:['mischievous','small','smelly'],
      actions:['picked the lock','stole a single grape','left mysterious footprints'],
      sounds:['heh heh','snort','goblin giggle'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:7 } },
    { id:'knight', text:'knight', emoji:'⚔️', article:'a',
      traits:['noisy','sincere','too tall'],
      actions:['announced their arrival via trumpet','bowed too low','dropped their helmet'],
      sounds:['CLANG','huzzah','tiny apologetic cough'],
      comedy:{ energy:'bouncy', dignity:'high', absurdity:6 } },
    { id:'wizard', text:'wizard', emoji:'🧙', article:'a',
      traits:['confused','bearded','overconfident'],
      actions:['waved a wand at the wrong thing','muttered something pointed','dropped a spellbook'],
      sounds:['ahem','bzzzzt','muttering'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:7 } },
    { id:'pirate', text:'pirate', emoji:'🏴‍☠️', article:'a',
      traits:['loud','greedy','enthusiastic'],
      actions:['demanded the treasure','waved a tiny sword','sang sea shanties at full volume'],
      sounds:['YARR','squawk','peg-leg thump'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:6 } },
    { id:'ninja', text:'ninja', emoji:'🥷', article:'a',
      traits:['quiet','smug','dramatic'],
      actions:['appeared without warning','rolled across the floor','bowed and vanished'],
      sounds:['shhhh','poof','tiny whistle'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:5 } },
    { id:'alien', text:'alien', emoji:'👽', article:'an',
      traits:['polite','blinky','very confused'],
      actions:['waved a tentacle','bowed to a houseplant','offered everyone a smooth pebble'],
      sounds:['bleep','wobble','tiny beep'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:8 } },
    { id:'witch', text:'witch', emoji:'🧙‍♀️', article:'a',
      traits:['cackly','very prepared','suspicious'],
      actions:['stirred a pot of soup','muttered an incantation','peered at everything'],
      sounds:['heheheh','bubble','tiny cackle'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:7 } },
    { id:'ghost', text:'ghost', emoji:'👻', article:'a',
      traits:['shy','very translucent','polite'],
      actions:['floated through a wall','apologized for floating','rearranged things gently'],
      sounds:['ooooo','sigh','tiny boo'],
      comedy:{ energy:'calm', dignity:'medium', absurdity:6 } },
    { id:'troll', text:'troll', emoji:'🧌', article:'a',
      traits:['large','grumpy','hungry'],
      actions:['blocked the bridge','demanded a snack','sat down hard'],
      sounds:['grrrr','grumble','stomp'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:6 } },
    { id:'fairy', text:'fairy', emoji:'🧚', article:'a',
      traits:['sparkly','tiny','sassy'],
      actions:['hovered judgmentally','sprinkled glitter without permission','offered confusing advice'],
      sounds:['tinkle','hmph','tiny snap'],
      comedy:{ energy:'bouncy', dignity:'high', absurdity:6 } },
  ],

  /* Places — story setting. */
  places: [
    { id:'jungle',     text:'jungle',     emoji:'🌴', article:'a' },
    { id:'castle',     text:'castle',     emoji:'🏰', article:'a' },
    { id:'forest',     text:'forest',     emoji:'🌲', article:'a' },
    { id:'cavern',     text:'cavern',     emoji:'🕳️', article:'a' },
    { id:'volcano',    text:'volcano',    emoji:'🌋', article:'a' },
    { id:'desert',     text:'desert',     emoji:'🏜️', article:'a' },
    { id:'treehouse',  text:'treehouse',  emoji:'🌳', article:'a' },
    { id:'lighthouse', text:'lighthouse', emoji:'🗼', article:'a' },
    { id:'aquarium',   text:'aquarium',   emoji:'🐠', article:'an' },
    { id:'bakery',     text:'bakery',     emoji:'🥐', article:'a' },
  ],

  /* Foods — edible plot devices. */
  foods: [
    { id:'tacos',         text:'tacos',         emoji:'🌮', isPlural:true,  plural:'tacos' },
    { id:'donuts',        text:'donuts',        emoji:'🍩', isPlural:true,  plural:'donuts' },
    { id:'pancakes',      text:'pancakes',      emoji:'🥞', isPlural:true,  plural:'pancakes' },
    { id:'pizza',         text:'pizza',         emoji:'🍕', isPlural:false, article:'a' },
    { id:'noodles',       text:'noodles',       emoji:'🍜', isPlural:true,  plural:'noodles' },
    { id:'ice_cream',     text:'ice cream',     emoji:'🍦', isPlural:false, article:'an' },
    { id:'cupcakes',      text:'cupcakes',      emoji:'🧁', isPlural:true,  plural:'cupcakes' },
    { id:'pretzels',      text:'pretzels',      emoji:'🥨', isPlural:true,  plural:'pretzels' },
    { id:'sushi',         text:'sushi',         emoji:'🍣', isPlural:false, article:'a piece of' },
    { id:'grilled_cheese',text:'grilled cheese',emoji:'🥪', isPlural:false, article:'a' },
  ],

  /* Objects — holdable, discoverable plot items. */
  objects: [
    { id:'clipboard',         text:'clipboard',         emoji:'📋', article:'a' },
    { id:'kazoo',             text:'kazoo',             emoji:'🎷', article:'a' },
    { id:'tiny_key',          text:'tiny key',          emoji:'🔑', article:'a' },
    { id:'glittery_helmet',   text:'glittery helmet',   emoji:'🎩', article:'a' },
    { id:'haunted_lunchbox',  text:'haunted lunchbox',  emoji:'🍱', article:'a' },
    { id:'apology_balloon',   text:'apology balloon',   emoji:'🎈', article:'an' },
    { id:'pocket_door',       text:'pocket-sized door', emoji:'🚪', article:'a' },
    { id:'dramatic_cape',     text:'dramatic cape',     emoji:'🦸', article:'a' },
    { id:'crumb_map',         text:'map covered in crumbs', emoji:'🗺️', article:'a' },
    { id:'sleepy_megaphone',  text:'sleepy megaphone',  emoji:'📣', article:'a' },
  ],

  /* Sounds — onomatopoeia + exclamations. Used as standalone slots and also pulled from companion.sounds. */
  sounds: [
    { id:'splat',   text:'SPLAT' },
    { id:'boing',   text:'BOING' },
    { id:'kerplunk',text:'KERPLUNK' },
    { id:'wump',    text:'WUMP' },
    { id:'fwoosh',  text:'FWOOSH' },
    { id:'honk',    text:'HONK' },
    { id:'plop',    text:'PLOP' },
    { id:'yikes',   text:'YIKES' },
    { id:'whee',    text:'WHEE' },
    { id:'bwah',    text:'BWAH' },
    { id:'zink',    text:'ZINK' },
    { id:'poof',    text:'POOF' },
  ],

  /* Adverbs — used in {adverb} slots for action flavor. */
  adverbs: [
    { id:'suspiciously',          text:'suspiciously' },
    { id:'sideways',              text:'sideways' },
    { id:'with_confidence',       text:'with great confidence' },
    { id:'professionally',        text:'professionally' },
    { id:'politely',              text:'politely but firmly' },
    { id:'somehow',               text:'somehow' },
    { id:'backwards',             text:'backwards' },
    { id:'extra_slowly',          text:'extremely slowly' },
  ],

  /* Numbers — concrete absurd quantities. */
  numbers: [
    { id:'seventeen',     text:'seventeen' },
    { id:'twenty_three',  text:'twenty-three' },
    { id:'one_and_half',  text:'one and a half' },
    { id:'too_many',      text:'too many' },
    { id:'forty_two',     text:'exactly forty-two' },
    { id:'a_polite_few',  text:'a polite handful of' },
  ],

  /* Liquids — pickle juice, moon milk. */
  liquids: [
    { id:'pickle_juice',    text:'pickle juice' },
    { id:'moon_milk',       text:'moon milk' },
    { id:'glitter_lemonade',text:'glitter lemonade' },
    { id:'warm_soup',       text:'warm soup' },
    { id:'thunder_soda',    text:'thunder soda' },
    { id:'rainbow_water',   text:'rainbow water' },
  ],

  /* Jobs — fake titles for absurd authority. */
  jobs: [
    { id:'puddle_inspector',   text:'official puddle inspector' },
    { id:'sandwich_lawyer',    text:'sandwich lawyer' },
    { id:'cloud_dentist',      text:'assistant cloud dentist' },
    { id:'hat_consultant',     text:'emergency hat consultant' },
    { id:'snack_detective',    text:'snack detective' },
    { id:'hallway_mayor',      text:'hallway mayor' },
  ],

  /* Rules — used as motif anchors (setup → violation → payoff). */
  rules: [
    { id:'no_soup',         text:'no soup after moonrise' },
    { id:'never_sandwich',  text:'never trust a sandwich after sunset' },
    { id:'three_hops',      text:'three hops before any door' },
    { id:'pets_vote',       text:'pets vote on Tuesdays' },
    { id:'check_hat',       text:'check the hat before sitting' },
    { id:'no_apology_stairs', text:'no apologizing on stairs' },
  ],
};

/* ================================================================
   STORY SEEDS — premise anchors
   Each seed defines required slots and which recipe(s) it works with.
   Phase 1 ships 5 seeds, all Quest-compatible.
   ================================================================ */
const V2_SEEDS = [
  { id:'snack_trial',   tiers:['kid'], recipe:'quest', requiredSlots:['companion','visitor','food','object'] },
  { id:'lost_thing',    tiers:['kid'], recipe:'quest', requiredSlots:['companion','place','object'] },
  { id:'secret_club',   tiers:['kid'], recipe:'quest', requiredSlots:['companion','visitor','place'] },
  { id:'weird_smell',   tiers:['kid'], recipe:'quest', requiredSlots:['companion','place','food'] },
  { id:'wrong_room',    tiers:['kid'], recipe:'quest', requiredSlots:['companion','visitor','object'] },
];

/* ================================================================
   RECIPE — beat sequence
   Phase 1 ships one recipe (Quest, 5 beats).
   Subsequent segments add Mystery, Trial, Performance, Bureaucracy, etc.
   ================================================================ */
const V2_RECIPES = {
  quest: {
    id: 'quest',
    beats: ['arrival', 'helper', 'obstacle', 'discovery', 'bedtime_landing'],
  },
};

/* ================================================================
   BEAT CARDS — authored story moments
   Each card binds a beatType + tier + required slots to a small bank
   of line variants. The renderer picks one line per beat per story.
   Phase 1 ships 15 cards spanning all 5 beat types in the Quest recipe.
   ================================================================ */
const V2_BEATS = [
  /* ARRIVAL — sets up the premise, introduces companion.
     Style note: companions are introduced with the article ("a dragon") and afterward
     referenced with "the" form ("the dragon nodded") — matches storybook convention. */
  { id:'a1', beatType:'arrival', tiers:['kid'], requiredSlots:['kid','companion','place'],
    lines: [
      '{kid.name} and {companion.articleText} headed straight to the {place.text}. Something felt off about today. {companion.TheText} kept sniffing the air {adverb.text}.',
    ] },
  { id:'a2', beatType:'arrival', tiers:['kid'], requiredSlots:['kid','companion','sound'],
    lines: [
      '{kid.name} woke up to a {sound.text}. Just one. Then {companion.articleText} popped its head in and said, "Yeah. I heard it too."',
    ] },
  { id:'a3', beatType:'arrival', tiers:['kid'], requiredSlots:['kid','companion','object'],
    lines: [
      'There was {object.articleText} on the kitchen table. {kid.name} had not put it there. {companion.TheText} stared at it suspiciously.',
    ] },

  /* HELPER — companion or sidekick contributes a plan / theory */
  { id:'h1', beatType:'helper', tiers:['kid'], requiredSlots:['companion','number'],
    lines: [
      '"I have a plan," said {companion.theText}. The plan involved {number.text} steps. {kid.name} only understood three of them.',
    ] },
  { id:'h2', beatType:'helper', tiers:['kid'], requiredSlots:['companion','adverb'],
    lines: [
      '{companion.TheText} nodded {adverb.text}. "Trust me," it said. {kid.name} did not, but also did not have a better plan.',
    ] },
  { id:'h3', beatType:'helper', tiers:['kid'], requiredSlots:['sidekick','companion'],
    lines: [
      '{sidekick.cap} arrived with a notebook. "Step one," they announced. "Find {companion.articleText}." {companion.TheText} was already there. "Oh," said {sidekick.lc}. "Step one: done."',
    ] },

  /* OBSTACLE — a visitor / a problem complicates things */
  { id:'o1', beatType:'obstacle', tiers:['kid'], requiredSlots:['kid','visitor','object'],
    lines: [
      '{visitor.articleText} appeared out of nowhere holding {object.articleText}. "I have terms," {visitor.theText} announced. {kid.name} had not agreed to any terms.',
    ] },
  { id:'o2', beatType:'obstacle', tiers:['kid'], requiredSlots:['kid','visitor','rule'],
    lines: [
      '{visitor.TheText} blocked the way. "You know the rule," it said. "{rule.text}." {kid.name} did not know that rule. {kid.name} had broken it on purpose anyway.',
    ] },
  { id:'o3', beatType:'obstacle', tiers:['kid'], requiredSlots:['kid','visitor','sound','adverb'],
    lines: [
      '"{sound.text}!" said {visitor.theText} {adverb.text}. {kid.name} stopped. That was the loudest "{sound.text}" {kid.name} had ever heard.',
    ] },

  /* DISCOVERY — the twist / weird prize */
  { id:'d1', beatType:'discovery', tiers:['kid'], requiredSlots:['kid','object','liquid'],
    lines: [
      'Inside {object.articleText}: {liquid.text}. {kid.name} did not ask why. Nobody answered anyway.',
    ] },
  { id:'d2', beatType:'discovery', tiers:['kid'], requiredSlots:['companion','number','food'],
    lines: [
      'It turned out there were {number.text} {food.plural} hidden under the rug the whole time. {companion.TheText} looked guilty.',
    ] },
  { id:'d3', beatType:'discovery', tiers:['kid'], requiredSlots:['kid','job'],
    lines: [
      'A small certificate appeared. It announced {kid.name} as the new {job.text}. {kid.name} had not applied for this. The certificate was very official anyway.',
    ] },

  /* BEDTIME LANDING — cozy resolution */
  { id:'b1', beatType:'bedtime_landing', tiers:['kid'], requiredSlots:['kid','companion','food'],
    lines: [
      'By bedtime, everyone was fed. {kid.name} ate {food.articleText}. {companion.TheText} had three. Nobody asked questions.',
    ] },
  { id:'b2', beatType:'bedtime_landing', tiers:['kid'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} climbed into bed. {companion.TheText} curled up at the foot. Tomorrow, probably, more nonsense. Tonight, just sleep.',
    ] },
  { id:'b3', beatType:'bedtime_landing', tiers:['kid'], requiredSlots:['kid','sound'],
    lines: [
      'The last thing {kid.name} heard before falling asleep was a tiny, distant "{sound.text}." {kid.name} smiled. Goodnight.',
    ] },
];

/* ================================================================
   ENGINE — generateStoryV2
   ================================================================ */
function generateStoryV2(name, picks, age) {
  // Phase 1: kid tier only (age 6-7). Other tiers return null to trigger v1 fallback.
  if (age < 6 || age > 7) return null;

  const rawPick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Build the slots map for this story.
  // Map user picks (v1 format: {w: 'dragon'}) to rich v2 word objects when possible.
  function mapPickToWord(pickValue, lib) {
    if (!pickValue) return rawPick(lib);
    const hit = lib.find(w => w.text === pickValue || w.id === pickValue);
    return hit || rawPick(lib);
  }

  const companion = mapPickToWord(picks.pet?.w,      V2_WORDS.companions);
  const visitor   = mapPickToWord(picks.creature?.w, V2_WORDS.visitors);
  const place     = mapPickToWord(picks.place?.w,    V2_WORDS.places);
  const food      = mapPickToWord(picks.food?.w,     V2_WORDS.foods);
  const object    = rawPick(V2_WORDS.objects);
  const sound     = picks.freeword?.w ? { text: picks.freeword.w } : rawPick(V2_WORDS.sounds);
  const adverb    = rawPick(V2_WORDS.adverbs);
  const number    = rawPick(V2_WORDS.numbers);
  const liquid    = rawPick(V2_WORDS.liquids);
  const job       = rawPick(V2_WORDS.jobs);
  const rule      = rawPick(V2_WORDS.rules);

  // Sidekick is optional. Pull from state.sidekicks if available; otherwise null.
  // (Beat cards that require sidekick will be filtered out when null.)
  const sidekickName = (typeof state !== 'undefined' && Array.isArray(state.sidekicks) && state.sidekicks.length)
    ? state.sidekicks[Math.floor(Math.random() * state.sidekicks.length)]
    : null;

  const slots = {
    kid: { name: name || 'Friend', cap: V2Grammar.capitalize(name || 'Friend'), lc: (name || 'friend').toLowerCase() },
    sidekick: sidekickName ? { name: sidekickName, cap: V2Grammar.capitalize(sidekickName), lc: sidekickName.toLowerCase() } : null,
    companion, visitor, place, food, object, sound, adverb, number, liquid, job, rule,
  };

  // Pick a story seed compatible with kid tier.
  const seed   = rawPick(V2_SEEDS.filter(s => s.tiers.includes('kid')));
  const recipe = V2_RECIPES[seed.recipe];
  if (!recipe) return null;

  // For each beat in the recipe, find an eligible beat card.
  // Eligibility: tier matches AND all required slots are present in `slots`.
  function eligibleFor(beatType) {
    return V2_BEATS.filter(b => {
      if (b.beatType !== beatType) return false;
      if (!b.tiers.includes('kid')) return false;
      return b.requiredSlots.every(slotName => slots[slotName] != null);
    });
  }

  // Ensure first letter of each rendered paragraph is capitalized — handles the case where
  // a beat-card line opens with a {slot.articleText} that resolves to lowercase ("a knight…").
  function ensureSentenceStart(s) {
    if (!s) return s;
    return s.replace(/^([a-z])/, (m) => m.toUpperCase());
  }

  const paragraphs = [];
  for (const beatType of recipe.beats) {
    const candidates = eligibleFor(beatType);
    if (candidates.length === 0) return null; // fallback to v1 if any beat type unfillable
    const card = rawPick(candidates);
    const line = rawPick(card.lines);
    paragraphs.push(ensureSentenceStart(V2Grammar.render(line, slots)));
  }

  // Title — bind kid name + companion/visitor/object/food for a recognizable shape.
  // titleCase capitalizes every word so multi-word things ("sleepy megaphone") render as
  // proper titles ("Sleepy Megaphone").
  const tc = V2Grammar.titleCase;
  const kidCap = V2Grammar.capitalize(slots.kid.name);
  const titlePatterns = [
    `${kidCap} and the ${tc(companion.text)}`,
    `The Day ${kidCap} Met ${tc(visitor.text)}`,
    `${kidCap} and the ${tc(object.text)} Problem`,
    `${kidCap}'s ${tc(food.text)} Adventure`,
    `The Curious Case of the ${tc(object.text)}`,
    `${kidCap} and the ${tc(place.text)} Mystery`,
  ];
  const title = rawPick(titlePatterns);

  return { title, paragraphs };
}

/* Expose globals for use from index.html. Browser-global pattern so we don't
   need a module loader — matches the existing src/content.js convention. */
if (typeof window !== 'undefined') {
  window.generateStoryV2 = generateStoryV2;
  window.ENGINE_V2_VERSION = ENGINE_V2_VERSION;
  window.V2_WORDS = V2_WORDS;
  window.V2_SEEDS = V2_SEEDS;
  window.V2_RECIPES = V2_RECIPES;
  window.V2_BEATS = V2_BEATS;
  window.V2Grammar = V2Grammar;
}
