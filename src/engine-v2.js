/* ================================================================
   NoddyTales Story Engine (v2 + v3 combined module)
   ================================================================
   This file is the authored comedy engine that drives every NoddyTales
   story. It is the production default for ALL ages 2-13 and runs on
   every story request — no URL flag, no localStorage gate.

   Two engines coexist in this module (named v2 and v3 for historical
   reasons; both ship together and route by blueprint):

   - v3 (default, since v3.0.0): role-based engine with 8 blueprints
     covering every age tier.
       * ages 6-13 (kid/big/tween): lost_snack_v3, goal_spine_v3,
         show_wrong_v3, rule_loophole_v3 — 4-stage / 6-paragraph arcs.
       * ages 2-5 (tot/little, since v2.10.0): tot_wonder_v3, tot_sky_v3,
         little_quest_v3, little_food_v3 — 3-role contract / 4-paragraph
         arcs.

   - v2 (silent fallback): the prior authored engine. Retained as a
     runtime fallback for any v3 blueprint that returns null. Scheduled
     for deletion in the engine-v3.1.0 release (the formerly-queued
     "delete v2 codepath" Build Idea) once production v3 stability is
     confirmed.

   buildStory() in index.html (and generateStoryRouted() here) attempt
   v3 first for every age, fall through to v2 on null, and v1 is the
   final fallback (template-substitution from index.html; deprecated,
   emits a console.warn on fire).

   Versioning policy (since v0.9.3): APP_VERSION is the user-facing
   product version (currently v0.9.x late beta). ENGINE_V2_VERSION
   below is the internal engine architecture lineage, shown in
   CHANGELOG / DevTools but NOT in the badge. Bumps on engine-arch
   changes (v2 deletion → v3.1.0). See docs/versioning.md.
   ================================================================ */

const ENGINE_V2_VERSION = 'v3.0.3';

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
  /* v2.6.1 — small words stay lowercase unless they're the first or last token of
     the input fragment. Fixes "Rescue A Stuck Friend" → "Rescue a Stuck Friend".
     Single-word inputs always title-case fully. */
  const TITLE_SMALL_WORDS = /^(a|an|the|and|or|but|nor|of|in|on|at|to|for|by|with|vs|from|as|if)$/i;
  function titleCase(str) {
    if (!str) return '';
    const parts = String(str).split(/(\s+)/);
    // Find indices of the first and last word parts (non-whitespace)
    let firstIdx = -1, lastIdx = -1;
    for (let i = 0; i < parts.length; i++) {
      if (!/^\s+$/.test(parts[i])) {
        if (firstIdx === -1) firstIdx = i;
        lastIdx = i;
      }
    }
    return parts.map((part, i) => {
      if (/^\s+$/.test(part)) return part;
      const isEdge = i === firstIdx || i === lastIdx;
      if (!isEdge && TITLE_SMALL_WORDS.test(part)) return part.toLowerCase();
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

    // Rich word object.
    // v2.2.3 — resolveSlot used to assume rich slots always have a `.text` property. The kid
    // slot is { name, cap, lc } with NO text — so `{kid.text}` returned undefined and
    // `{kid.cap}` returned capitalize(undefined) = "". 23 of 60 audit stories had an empty
    // subject ("...agreed.  had a plan."). Fall back to `.name` when `.text` is absent.
    const baseText = slot.text != null ? slot.text : (slot.name != null ? slot.name : '');
    if (!prop || prop === 'text')     return baseText;
    if (prop === 'articleText')        return articleText(slot);
    if (prop === 'theText')            return theText(slot);     // mid-sentence: "the dragon"
    if (prop === 'TheText')            return TheText(slot);     // sentence-start: "The dragon"
    if (prop === 'titleText')          return titleCase(baseText); // "sleepy megaphone" → "Sleepy Megaphone"
    if (prop === 'plural')             return plural(slot);
    if (prop === 'emoji')              return slot.emoji || '';
    if (prop === 'trait')              return pickOne(slot.traits || []) || '';
    if (prop === 'action')             return pickOne(slot.actions || []) || '';
    if (prop === 'sound')              return pickOne(slot.sounds || []) || '';
    if (prop === 'funnyUse')           return pickOne(slot.funnyUses || []) || '';
    if (prop === 'cap')                return capitalize(baseText);
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
    /* Segment B additions — 10 more companions to 20 total */
    { id:'tiger', text:'tiger', emoji:'🐯', article:'a',
      traits:['stripey','proud','dramatic'],
      actions:['stalked through the grass','batted at a butterfly','sharpened a claw against the wall'],
      sounds:['rrrrrr','tiny mew','growl'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:5, bedtimeSoftness:6 } },
    { id:'parrot', text:'parrot', emoji:'🦜', article:'a',
      traits:['loud','colorful','overshares'],
      actions:['repeated every secret it heard','squawked at the wrong moment','preened endlessly'],
      sounds:['SQUAWK','hello hello','tiny whistle'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:6, bedtimeSoftness:7 } },
    { id:'koala', text:'koala', emoji:'🐨', article:'a',
      traits:['sleepy','small','clingy'],
      actions:['fell asleep mid-sentence','hugged a backpack','blinked slowly twice'],
      sounds:['snurfle','tiny snore','yawn'],
      comedy:{ energy:'calm', dignity:'medium', absurdity:4, bedtimeSoftness:10 } },
    { id:'falcon', text:'falcon', emoji:'🦅', article:'a',
      traits:['fast','serious','dramatic'],
      actions:['swooped down for no reason','perched on a high thing','stared into the middle distance'],
      sounds:['SCREE','whoosh','tiny click'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:5, bedtimeSoftness:5 } },
    { id:'lynx', text:'lynx', emoji:'🐱', article:'a',
      traits:['tufted','watchful','elegant'],
      actions:['pounced on a leaf','padded silently','flicked its ear'],
      sounds:['mrrrp','soft chirp','tiny growl'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:5, bedtimeSoftness:7 } },
    { id:'otter', text:'otter', emoji:'🦦', article:'an',
      traits:['floppy','playful','damp'],
      actions:['rolled in the grass','clapped its paws','stuffed a snack in its pocket'],
      sounds:['squeak','splash','happy chirp'],
      comedy:{ energy:'bouncy', dignity:'low', absurdity:5, bedtimeSoftness:8 } },
    { id:'hedgehog', text:'hedgehog', emoji:'🦔', article:'a',
      traits:['prickly','tiny','anxious'],
      actions:['curled into a tight ball','sniffed everything','rolled forward an inch'],
      sounds:['squeak','tiny huff','sniff sniff'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:5, bedtimeSoftness:9 } },
    { id:'llama', text:'llama', emoji:'🦙', article:'a',
      traits:['judgmental','long-necked','smug'],
      actions:['spat in mild protest','stared down a stranger','strutted into the room'],
      sounds:['hmmm','snort','tiny hum'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6, bedtimeSoftness:7 } },
    { id:'cub', text:'bear cub', emoji:'🐻', article:'a',
      traits:['fluffy','clumsy','curious'],
      actions:['tripped over a root','sniffed a pinecone','climbed the wrong tree'],
      sounds:['snuffle','tiny growl','huff'],
      comedy:{ energy:'bouncy', dignity:'medium', absurdity:5, bedtimeSoftness:8 } },
    { id:'duckling', text:'duckling', emoji:'🐥', article:'a',
      traits:['fluffy','tiny','determined'],
      actions:['waddled in a straight line','peeped persistently','followed the kid everywhere'],
      sounds:['peep peep','tiny quack','soft beep'],
      comedy:{ energy:'bouncy', dignity:'medium', absurdity:4, bedtimeSoftness:9 } },
    /* Segment C additions — tween-flavored companions */
    { id:'crow', text:'crow', emoji:'🐦‍⬛', article:'a',
      traits:['judgmental','smart','collects shiny things'],
      actions:['side-eyed the situation','dropped a paperclip pointedly','filed a complaint with its beak'],
      sounds:['caw','tiny cluck','dismissive hop'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:5, bedtimeSoftness:6 } },
    { id:'hamster', text:'hamster', emoji:'🐹', article:'a',
      traits:['hoarder','tiny','dramatic'],
      actions:['stuffed its cheeks with everything','sprinted on a wheel for no reason','hid a snack in its bedding'],
      sounds:['squeak','wheel-squeak','tiny chirp'],
      comedy:{ energy:'bouncy', dignity:'low', absurdity:5, bedtimeSoftness:8 } },
    { id:'chameleon', text:'chameleon', emoji:'🦎', article:'a',
      traits:['changeable','sneaky','overly committed'],
      actions:['turned the wrong color on purpose','rolled its eyes independently','blended into a houseplant'],
      sounds:['blink','tiny tongue flick','soft chirp'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:6, bedtimeSoftness:6 } },
    { id:'raccoon', text:'raccoon', emoji:'🦝', article:'a',
      traits:['nocturnal','thieving','smug'],
      actions:['rifled through a trash can','escaped with a single noodle','waved a tiny hand'],
      sounds:['chitter','rummage','tiny clatter'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:6, bedtimeSoftness:5 } },
    { id:'red_panda', text:'red panda', emoji:'🦊', article:'a',
      traits:['fluffy','watchful','overly polite'],
      actions:['cupped its paws together','tilted its head politely','climbed a tree slowly'],
      sounds:['huff','tiny squeak','soft chirp'],
      comedy:{ energy:'calm', dignity:'high', absurdity:4, bedtimeSoftness:9 } },
    /* ============================================================
       v2.4.6 — picker → V2_WORDS coverage backfill (companions).
       Every WORD_BANK pet picker word that previously had no v2 match
       now has a rich-word entry here, so generateStoryV2's mapPickToWord
       stops silently replacing user choices with random rich words. */

    /* ----- tot pet pool (12 entries) ----- */
    { id:'dog',     text:'dog',     emoji:'🐕', article:'a',
      traits:['friendly','wiggly','loyal'],
      actions:['wagged its tail','rolled over for belly rubs','chased its own tail'],
      sounds:['woof','bork','happy panting'] },
    { id:'cat',     text:'cat',     emoji:'🐈', article:'a',
      traits:['sleepy','dignified','suddenly chaotic'],
      actions:['knocked something off the table','stretched dramatically','curled into a perfect circle'],
      sounds:['meow','purr','tiny chirp'] },
    { id:'fish',    text:'fish',    emoji:'🐟', article:'a', plural:'fish',
      traits:['bubbly','silvery','curious'],
      actions:['blew a stream of bubbles','wiggled in a tiny circle','peeked from behind a rock'],
      sounds:['bloop','tiny splash','glub'] },
    { id:'bird',    text:'bird',    emoji:'🐦', article:'a',
      traits:['cheerful','tilty-headed','tiny'],
      actions:['hopped along a branch','fluffed up its feathers','tilted its head twice'],
      sounds:['tweet','chirp','tiny whistle'] },
    { id:'frog',    text:'frog',    emoji:'🐸', article:'a',
      traits:['bouncy','green','wide-eyed'],
      actions:['hopped onto a lily pad','blinked very slowly','caught a fly mid-air'],
      sounds:['ribbit','plop','tiny burp'] },
    { id:'duck',    text:'duck',    emoji:'🦆', article:'a',
      traits:['waddly','splashy','very serious about bread'],
      actions:['waddled in a tiny line','splashed dramatically','demanded a snack'],
      sounds:['quack','splash','honk'] },
    { id:'bunny',   text:'bunny',   emoji:'🐰', article:'a',
      traits:['hoppy','fluffy','twitchy-nosed'],
      actions:['hopped twice on purpose','wiggled its nose','flopped onto its side'],
      sounds:['thump thump','tiny snuffle','soft squeak'] },
    { id:'bear',    text:'bear',    emoji:'🐻', article:'a',
      traits:['cozy','snacky','very into naps'],
      actions:['rolled onto its back','found another snack','yawned enormously'],
      sounds:['grrumph','soft snore','happy chuff'] },
    { id:'lamb',    text:'lamb',    emoji:'🐑', article:'a',
      traits:['wobbly','soft','brand-new at walking'],
      actions:['hopped on shaky legs','nuzzled into something soft','let out a tiny baa'],
      sounds:['baa','soft bleat','wobble wobble'] },
    { id:'mouse',   text:'mouse',   emoji:'🐭', article:'a', plural:'mice',
      traits:['tiny','sneaky','always hungry'],
      actions:['scurried under the table','nibbled on a crumb','peeked out very carefully'],
      sounds:['squeak','tiny nibble','rustle'] },
    { id:'pig',     text:'pig',     emoji:'🐷', article:'a',
      traits:['pink','muddy','enthusiastic'],
      actions:['rolled in the mud','wiggled its curly tail','snuffled at something interesting'],
      sounds:['oink','snort','happy grunt'] },
    { id:'cow',     text:'cow',     emoji:'🐄', article:'a',
      traits:['big','spotted','very patient'],
      actions:['chewed thoughtfully','swished its tail','wandered toward the grass'],
      sounds:['moo','soft huff','tail swish'] },

    /* ----- little pet pool (7 missing) ----- */
    { id:'puppy',     text:'puppy',     emoji:'🐶', article:'a',
      traits:['bouncy','clumsy','very excited'],
      actions:['tripped over its own paws','wagged its whole body','tried to fetch everything'],
      sounds:['yip','playful bark','tiny growl'] },
    { id:'kitten',    text:'kitten',    emoji:'🐱', article:'a',
      traits:['tiny','pouncy','easily distracted'],
      actions:['pounced on a leaf','chased a sunbeam','curled up in a teacup'],
      sounds:['meow','tiny purr','squeak'] },
    { id:'turtle',    text:'turtle',    emoji:'🐢', article:'a',
      traits:['slow','wise-looking','very prepared'],
      actions:['took one careful step','retreated into its shell','blinked very thoughtfully'],
      sounds:['scrape','soft thump','contemplative sigh'] },
    { id:'piglet',    text:'piglet',    emoji:'🐷', article:'a',
      traits:['pink','round','very excited about lunch'],
      actions:['rolled in a tiny puddle','squealed with delight','wiggled its tiny tail'],
      sounds:['snort','happy oink','squeal'] },
    { id:'foal',      text:'foal',      emoji:'🐴', article:'a',
      traits:['leggy','soft-eyed','still figuring out walking'],
      actions:['took one wobbly step','nuzzled the fence','tried to gallop and tripped'],
      sounds:['soft neigh','snuffle','tiny hoof tap'] },
    /* bunny + lamb already added above with tot pool — share the same rich word */

    /* ----- kid pet missing (wolf) ----- */
    { id:'wolf',      text:'wolf',      emoji:'🐺', article:'a',
      traits:['dramatic','howly','secretly polite'],
      actions:['howled at the moon','padded silently across the room','tilted its head at a question'],
      sounds:['ahwooo','low growl','tiny whuff'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:5, bedtimeSoftness:6 } },

    /* ----- big pet pool (12 entries, comedic adjective+noun voice) ----- */
    { id:'mischievous_fox',     text:'mischievous fox',     emoji:'🦊', article:'a',
      traits:['sneaky','sly','always plotting'],
      actions:['stole a single sock','watched from a suspicious distance','smirked like it knew something'],
      sounds:['snicker','tiny yip','rustle'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:6 } },
    { id:'glittering_octopus',  text:'glittering octopus',  emoji:'🐙', article:'a',
      traits:['shimmery','many-armed','dramatic'],
      actions:['waved all eight arms at once','arranged shells in a tidy line','sparkled deliberately'],
      sounds:['blorp','glitter shimmer','tiny ahem'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:7 } },
    { id:'ancient_tortoise',    text:'ancient tortoise',    emoji:'🐢', article:'an',
      traits:['wise','wrinkly','two centuries old'],
      actions:['offered a slow nod','recited a memory from 1832','retracted into its shell on principle'],
      sounds:['deep sigh','slow scrape','contemplative hum'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:5 } },
    { id:'bewildered_penguin',  text:'bewildered penguin',  emoji:'🐧', article:'a',
      traits:['confused','formal','easily startled'],
      actions:['waddled in a confused circle','adjusted its invisible tie','stared into the middle distance'],
      sounds:['honk','tiny ahem','soft squawk'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'melodramatic_cat',    text:'melodramatic cat',    emoji:'🐱', article:'a',
      traits:['theatrical','offended','very loud'],
      actions:['fainted onto the rug','demanded an apology','draped itself across a chair'],
      sounds:['MROOOW','dramatic sigh','indignant chirp'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:7 } },
    { id:'philosophical_owl',   text:'philosophical owl',   emoji:'🦉', article:'a',
      traits:['wise','overthinking','slightly judgmental'],
      actions:['posed a rhetorical question','blinked slowly twice','quoted itself from earlier'],
      sounds:['hoot','contemplative who','soft feather rustle'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:5 } },
    { id:'imperious_corgi',     text:'imperious corgi',     emoji:'👑', article:'an',
      traits:['short','regal','convinced of its own importance'],
      actions:['issued a tiny royal decree','demanded a throne','accepted compliments graciously'],
      sounds:['regal bark','royal sniff','tiny harrumph'],
      comedy:{ energy:'bouncy', dignity:'high', absurdity:7 } },
    { id:'overconfident_raccoon', text:'overconfident raccoon', emoji:'🦝', article:'an',
      traits:['cocky','striped','always plotting a heist'],
      actions:['climbed into a trash can on purpose','winked at no one in particular','presented stolen goods'],
      sounds:['chitter','tiny cackle','rummage'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:7 } },
    { id:'anxious_hedgehog',    text:'anxious hedgehog',    emoji:'🦔', article:'an',
      traits:['prickly','worried','easily startled'],
      actions:['curled into a tiny anxious ball','double-checked the exits','fidgeted with a leaf'],
      sounds:['tiny snuffle','worried huff','soft sigh'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:5 } },
    { id:'exasperated_flamingo',text:'exasperated flamingo',emoji:'🦩', article:'an',
      traits:['leggy','pink','at the end of its patience'],
      actions:['rolled all four of its eyes','crossed its absurdly long legs','sighed at the entire situation'],
      sounds:['honk','exasperated squawk','tiny groan'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'suspicious_seagull',  text:'suspicious seagull',  emoji:'🐦', article:'a',
      traits:['shifty','beach-coded','always watching'],
      actions:['stared at the snack','sidled closer','let out an accusatory shriek'],
      sounds:['shriek','squawk','suspicious caw'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:6 } },
    { id:'theatrical_moth',     text:'theatrical moth',     emoji:'🦋', article:'a',
      traits:['dramatic','fluttery','obsessed with lamps'],
      actions:['flung itself at a lamp on principle','performed a tiny monologue','fainted into a teacup'],
      sounds:['flutter','tiny gasp','dramatic flap'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:8 } },

    /* ----- tween pet pool (5 missing) ----- */
    { id:'mantis_shrimp',  text:'mantis shrimp',  emoji:'🦐', article:'a',
      traits:['punchy','vibrant','technically terrifying'],
      actions:['threw an extremely fast punch','flexed all its colors','glared from a tide pool'],
      sounds:['ka-pow','tiny snap','underwater shink'],
      comedy:{ energy:'chaotic', dignity:'medium', absurdity:8 } },
    { id:'rat',            text:'rat',            emoji:'🐀', article:'a',
      traits:['scrappy','smart','street-coded'],
      actions:['darted into a tiny alley','sized up the situation','offered an unsolicited opinion'],
      sounds:['squeak','tiny scurry','chk chk'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:5 } },
    { id:'pigeon',         text:'pigeon',         emoji:'🕊️', article:'a',
      traits:['bobbing','unbothered','possibly running a small business'],
      actions:['bobbed its head exactly twice','strutted past important things','accepted a single crumb'],
      sounds:['coo','flutter','tiny bok'],
      comedy:{ energy:'deadpan', dignity:'low', absurdity:5 } },
    { id:'quokka',         text:'quokka',         emoji:'🦘', article:'a',
      traits:['smiley','cheerful','very online'],
      actions:['posed for an imaginary photo','hopped over for a hello','flashed an unreasonable smile'],
      sounds:['tiny chirp','soft hop','happy snuffle'],
      comedy:{ energy:'bouncy', dignity:'medium', absurdity:5 } },
    { id:'tardigrade',     text:'tardigrade',     emoji:'🦠', article:'a',
      traits:['indestructible','microscopic','technically immortal'],
      actions:['survived something it should not have','blinked at a beam of radiation','accepted a hug at the molecular level'],
      sounds:['tiny tiny squelch','imperceptible hum','silent yes'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:9 } },

    /* ============================================================
       v2.4.6 — picker expansion: companions for new tot/little/big/tween pet words. */
    { id:'chick',     text:'chick',     emoji:'🐥', article:'a',
      traits:['fluffy','tiny','newly hatched'],
      actions:['peeped at everything','followed a leaf','hopped twice for no reason'],
      sounds:['peep','tiny chirp','soft tweet'] },
    { id:'squirrel',  text:'squirrel',  emoji:'🐿️', article:'a',
      traits:['scurry','bushy-tailed','always carrying something'],
      actions:['stashed a nut on principle','zoomed up a tree','flicked its tail dramatically'],
      sounds:['chitter','tiny scrabble','soft squeak'] },
    { id:'pony',      text:'pony',      emoji:'🐴', article:'a',
      traits:['small','soft-nosed','very into apples'],
      actions:['trotted in a tiny circle','accepted a carrot graciously','swished its tail'],
      sounds:['soft neigh','snort','tiny hoof tap'] },
    { id:'monkey',    text:'monkey',    emoji:'🐵', article:'a',
      traits:['curious','grabby','expressive-faced'],
      actions:['swung from a branch','stole something shiny','made a face on purpose'],
      sounds:['ooh ooh','tiny screech','soft chitter'] },
    { id:'guinea_pig',text:'guinea pig',emoji:'🐹', article:'a',
      traits:['fluffy','round','very into salad'],
      actions:['squeaked excitedly','wheeked for a treat','popcorn-jumped in place'],
      sounds:['wheek','tiny chatter','soft squeak'] },
    { id:'seal',      text:'seal',      emoji:'🦭', article:'a',
      traits:['slippery','round','very pleased with itself'],
      actions:['flopped onto a rock','clapped its flippers','balanced something on its nose'],
      sounds:['ar ar','clap clap','soft splash'] },
    { id:'baby_goat', text:'baby goat', emoji:'🐐', article:'a',
      traits:['bouncy','headbutty','very into climbing'],
      actions:['jumped sideways for fun','climbed onto something that should not be climbed','head-butted a leaf'],
      sounds:['baa','tiny bleat','soft thump'] },

    /* ----- big tier pet additions (6) ----- */
    { id:'formal_ferret',     text:'overly formal ferret', emoji:'🦦', article:'an',
      traits:['polite','overdressed','technically wearing a tiny tie'],
      actions:['offered a tiny bow','adjusted an invisible cuff','presented a calling card'],
      sounds:['tiny dook','formal cough','soft chitter'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'dramatic_lizard',   text:'dramatic lizard',      emoji:'🦎', article:'a',
      traits:['theatrical','scaly','prone to fainting'],
      actions:['draped itself across a rock','fainted on cue','glared dramatically'],
      sounds:['tiny hiss','dramatic sigh','soft tongue flick'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:7 } },
    { id:'suspicious_duck',   text:'suspicious duck',      emoji:'🦆', article:'a',
      traits:['shifty','damp','possibly planning a heist'],
      actions:['stared without blinking','waddled away too casually','pocketed a fry'],
      sounds:['quack','suspicious quack','tiny splash'],
      comedy:{ energy:'deadpan', dignity:'low', absurdity:6 } },
    { id:'tiny_alpaca',       text:'tiny alpaca',          emoji:'🦙', article:'a',
      traits:['fluffy','smug','tinier than expected'],
      actions:['hummed gently','accepted compliments','spit at an invisible enemy'],
      sounds:['soft hum','tiny snort','gentle chew'],
      comedy:{ energy:'bouncy', dignity:'high', absurdity:5 } },
    { id:'retired_dragon',    text:'retired dragon',       emoji:'🐲', article:'a',
      traits:['scaly','grumpy','technically on a pension'],
      actions:['complained about modern adventurers','toasted a single marshmallow','rolled its eyes audibly'],
      sounds:['low growl','tired huff','tiny puff of smoke'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'nervous_goose',     text:'nervous goose',        emoji:'🪿', article:'a',
      traits:['honky','jittery','one bad day from chaos'],
      actions:['glanced over its wing twice','hissed at a tree','flapped without warning'],
      sounds:['honk','panicked honk','soft hiss'],
      comedy:{ energy:'chaotic', dignity:'medium', absurdity:6 } },

    /* ----- tween tier pet additions (6) ----- */
    { id:'judgmental_duck',   text:'judgmental duck',      emoji:'🦆', article:'a',
      traits:['judgy','aquatic','holds a clipboard somehow'],
      actions:['glared at someone’s outfit','rated the pond a 6/10','muttered something specific'],
      sounds:['quack','judgmental quack','soft tsk'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'sleepy_gecko',      text:'sleepy gecko',         emoji:'🦎', article:'a',
      traits:['low-energy','sticky-footed','just barely awake'],
      actions:['yawned mid-step','slow-blinked at everything','crawled half a foot before napping'],
      sounds:['tiny chirp','sleepy breath','soft cluck'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:5 } },
    { id:'tiny_possum',       text:'tiny possum',          emoji:'🐾', article:'a',
      /* v2.10.2 — "possibly playing dead" → "possibly playing possum". The real
         possum idiom, no blocked-word trigger, more recognizable to kids. */
      traits:['nocturnal','clutchy','possibly playing possum'],
      actions:['hung from a low branch','toppled over politely','accepted a single grape'],
      sounds:['tiny hiss','soft chitter','scrabble'],
      comedy:{ energy:'deadpan', dignity:'low', absurdity:6 } },
    { id:'overthink_ferret',  text:'overthinking ferret',  emoji:'🦦', article:'an',
      traits:['anxious','wiggly','three steps ahead in its own head'],
      actions:['paced in a tiny circle','rehearsed an unspoken speech','glanced at every exit twice'],
      sounds:['tiny dook','worried huff','soft pad'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:6 } },
    { id:'dramatic_goldfish', text:'dramatic goldfish',    emoji:'🐟', article:'a',
      traits:['glittery','offended','one memory long'],
      actions:['gasped at its own reflection','flounced behind a plant','blew an offended bubble'],
      sounds:['bloop','tiny gasp','splash'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:7 } },
    { id:'chaotic_goose',     text:'chaotic goose',        emoji:'🪿', article:'a',
      traits:['unhinged','honky','reportedly involved in two incidents'],
      actions:['chased nothing in particular','knocked over exactly one cone','honked at the sky'],
      sounds:['HONK','wild honk','soft hiss'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:7 } },
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
    /* Segment B additions — 10 more visitors to 20 total */
    { id:'robot', text:'robot', emoji:'🤖', article:'a',
      traits:['polite','slightly broken','overconfident'],
      actions:['ran a diagnostic on a houseplant','beeped reassuringly','rebooted at a bad moment'],
      sounds:['beep','whirr','tiny chime'] },
    { id:'mermaid', text:'mermaid', emoji:'🧜', article:'a',
      traits:['glittery','dramatic','sandy'],
      actions:['flopped onto the porch','sang an unprompted ballad','demanded fresh towels'],
      sounds:['la la la','splash','tiny sigh'] },
    { id:'phoenix', text:'phoenix', emoji:'🔥', article:'a',
      traits:['fiery','vain','dramatic'],
      actions:['caught fire on purpose','adjusted its feathers','posed for an imaginary photo'],
      sounds:['whoosh','crackle','tiny caw'] },
    { id:'centaur', text:'centaur', emoji:'🐎', article:'a',
      traits:['tall','formal','well-read'],
      actions:['quoted a poem nobody asked for','galloped politely','adjusted a tiny bowtie'],
      sounds:['neigh','tiny ahem','hoof tap'] },
    { id:'gnome', text:'gnome', emoji:'🧙', article:'a',
      traits:['bearded','suspicious','tiny'],
      actions:['guarded a mushroom','muttered at the weather','offered an unsolicited rule'],
      sounds:['harumph','tiny shuffle','grumble'] },
    /* v3.0.3 — "banshee" was reported by parent as too advanced for kid tier (6-7) +
       the 🌬️ wind emoji didn't read as creature. Renamed to "yeti" — universally
       known by 6-year-olds (Frozen, Lego, kids' books) with intuitive 🦣 mammoth
       emoji conveying "big furry beast." */
    { id:'yeti', text:'yeti', emoji:'🦣', article:'a',
      traits:['snowy','huge','surprisingly gentle'],
      actions:['stomped softly through the snow','offered a warm mitten','left enormous footprints behind'],
      sounds:['low rumble','soft growl','quiet huff'] },
    { id:'dinosaur', text:'dinosaur', emoji:'🦖', article:'a',
      traits:['huge','clumsy','sincere'],
      actions:['stepped on a daisy','tried to whisper','offered a tiny snack with a giant claw'],
      sounds:['ROAR','rumble','tiny chuff'] },
    { id:'sphinx', text:'sphinx', emoji:'🏛️', article:'a',
      traits:['cryptic','dignified','bored'],
      actions:['asked a riddle','accepted any answer','pretended to nap'],
      sounds:['hmmm','tiny purr','dramatic exhale'] },
    { id:'gargoyle', text:'gargoyle', emoji:'🗿', article:'a',
      traits:['stoney','grumpy','watchful'],
      actions:['glared from a rooftop','flexed a tiny wing','complained about the weather'],
      sounds:['grrr','grumble','tiny stone tap'] },
    { id:'jester', text:'jester', emoji:'🃏', article:'a',
      traits:['loud','bells everywhere','overcommitted'],
      actions:['juggled three apologies','tripped on purpose','spun in a circle'],
      sounds:['jingle','BOING','tiny tah-dah'] },
    /* Segment C — tween-flavored visitors */
    { id:'stressed_barista', text:'stressed barista', emoji:'☕', article:'a',
      traits:['caffeinated','sighing','tired of this'],
      actions:['sighed loudly','rewrote the order three times','muttered about closing soon'],
      sounds:['sigh','tiny espresso hiss','heavy yawn'] },
    { id:'feral_librarian', text:'feral librarian', emoji:'📚', article:'a',
      traits:['shushy','tired','encyclopedic'],
      actions:['shushed a houseplant','reorganized a shelf at speed','glared over their glasses'],
      sounds:['SHHH','tiny pencil tap','disapproving cough'] },
    { id:'wifi_ghost', text:'wifi ghost', emoji:'📶', article:'a',
      traits:['flickery','annoying','specific'],
      actions:['dropped the signal at the worst time','reappeared during important moments','offered three bars then zero'],
      sounds:['blip','tiny buffer','ghostly disconnect'] },
    { id:'cryptid', text:'cryptid', emoji:'👁️', article:'a',
      traits:['legendary','blurry','camera-shy'],
      actions:['appeared in the background of a photo','left mysterious footprints','denied existing'],
      sounds:['rustle','tiny growl','distant thump'] },
    { id:'vending_machine', text:'sentient vending machine', emoji:'🤖', article:'a',
      traits:['judgmental','snack-pushing','glowy'],
      actions:['offered unsolicited snack advice','rejected a dollar twice','dispensed the wrong item on purpose'],
      sounds:['BZZT','clunk','tiny ding'] },
    { id:'sub_teacher', text:'mysterious substitute teacher', emoji:'🎓', article:'a',
      traits:['unfamiliar','overly cheerful','underprepared'],
      actions:['announced a pop quiz with great joy','wrote the wrong name on the board','passed out a worksheet from 2003'],
      sounds:['ahem','tiny chalk squeak','cheerful gasp'] },
    { id:'group_chat', text:'group chat', emoji:'💬', article:'the',
      traits:['chaotic','always pinging','occasionally prophetic'],
      actions:['blew up overnight','renamed itself again','dropped a single ominous emoji'],
      sounds:['ping','tiny notification','vibrate'] },
    /* ============================================================
       v2.4.6 — picker → V2_WORDS coverage backfill (visitors).
       Every WORD_BANK creature picker word that previously had no v2
       match now has a rich-word entry here. Companion entries with the
       same text live in companions[]; mapPickToWord checks the visitors
       pool when the slot is `creature`, so duplicate-text entries with
       a creature-flavored voice are intentional. */

    /* ----- little creature pool (12 entries) ----- */
    { id:'v_frog',      text:'frog',      emoji:'🐸', article:'a',
      traits:['hoppy','wide-eyed','very into ponds'],
      actions:['hopped onto a rock','stuck out a long sticky tongue','blinked very slowly'],
      sounds:['ribbit','plop','tiny burp'] },
    { id:'v_fish',      text:'fish',      emoji:'🐠', article:'a', plural:'fish',
      traits:['glimmery','bubbly','very curious'],
      actions:['blew a tiny ring of bubbles','swam in a tidy loop','peeked from behind a stone'],
      sounds:['bloop','glub','tiny splash'] },
    { id:'beetle',      text:'beetle',    emoji:'🐞', article:'a',
      traits:['shiny','tiny','very polite'],
      actions:['scurried under a leaf','spread its wings briefly','offered a single nod'],
      sounds:['tick','clatter','soft buzz'] },
    { id:'butterfly',   text:'butterfly', emoji:'🦋', article:'a',
      traits:['fluttery','colorful','daydreamy'],
      actions:['landed on a flower','flapped twice for effect','zigzagged across the breeze'],
      sounds:['flutter','tiny sigh','soft flap'] },
    { id:'v_mouse',     text:'mouse',     emoji:'🐭', article:'a', plural:'mice',
      traits:['tiny','sneaky','always nibbling'],
      actions:['ducked behind a crumb','nibbled in a hurry','peeked from a hole'],
      sounds:['squeak','tiny scurry','soft rustle'] },
    { id:'snail',       text:'snail',     emoji:'🐌', article:'a',
      traits:['slow','steady','very polite about it'],
      actions:['inched one millimeter','retracted into its shell','left a tiny shiny trail'],
      sounds:['slurp','tiny scrape','contemplative pause'] },
    { id:'owl',         text:'owl',       emoji:'🦉', article:'an',
      traits:['wise','watchful','only awake at night'],
      actions:['rotated its head a full turn','blinked very deliberately','hooted at no one in particular'],
      sounds:['hoot','who','soft wing flap'] },
    { id:'fox',         text:'fox',       emoji:'🦊', article:'a',
      traits:['sly','reddish','always plotting'],
      actions:['darted into the underbrush','flicked its tail twice','grinned without explanation'],
      sounds:['yip','tiny growl','soft pad'] },
    { id:'deer',        text:'deer',      emoji:'🦌', article:'a', plural:'deer',
      traits:['gentle','watchful','very leggy'],
      actions:['froze mid-step','flicked its tail','gazed steadily'],
      sounds:['soft huff','quiet snort','tiny hoof tap'] },
    { id:'v_penguin',   text:'penguin',   emoji:'🐧', article:'a',
      traits:['waddly','formal','tiny but proud'],
      actions:['slid on its belly','waddled in a tight line','adjusted an imaginary collar'],
      sounds:['honk','tiny squawk','soft thump'] },
    { id:'crab',        text:'crab',      emoji:'🦀', article:'a',
      traits:['sideways','clicky','convinced of its own claws'],
      actions:['sidestepped the question','snapped a claw for emphasis','retreated into wet sand'],
      sounds:['click','tiny snip','scrape'] },
    { id:'bee',         text:'bee',       emoji:'🐝', article:'a',
      traits:['busy','striped','possibly carrying a tiny suitcase'],
      actions:['hovered very seriously','landed on a flower for two whole seconds','zipped off on an important errand'],
      sounds:['buzz','tiny bzzt','soft hum'] },

    /* ----- kid creature missing (2 entries) ----- */
    { id:'giant',       text:'giant',     emoji:'🗿', article:'a',
      traits:['enormous','slow-talking','strangely polite'],
      actions:['blocked the sun for a moment','sat down very carefully','offered a single very big hello'],
      sounds:['BOOM','low rumble','distant thud'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:7 } },
    { id:'vampire',     text:'vampire',   emoji:'🧛', article:'a',
      traits:['theatrical','centuries old','very particular about garlic'],
      actions:['swept a cape dramatically','asked if anyone had a snack (specifically)','vanished in a small puff'],
      sounds:['vlah','dramatic gasp','swoosh'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:7 } },

    /* ----- big creature pool (12 entries, comedic adjective+noun voice) ----- */
    { id:'grumbling_gargoyle',     text:'grumbling gargoyle',     emoji:'🗿', article:'a',
      traits:['stony','disapproving','technically furniture'],
      actions:['glared from a high ledge','complained about the weather','shifted by exactly one inch'],
      sounds:['grumble','stone scrape','disgruntled huff'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'sparkly_squid',          text:'sparkly squid',          emoji:'🦑', article:'a',
      traits:['glittery','many-armed','dramatic'],
      actions:['flashed all eight arms in unison','sparkled deliberately','squirted glitter (against guidelines)'],
      sounds:['shimmer','splort','tiny inkblot'],
      comedy:{ energy:'chaotic', dignity:'medium', absurdity:8 } },
    { id:'bewildered_sphinx',      text:'bewildered sphinx',      emoji:'🦁', article:'a',
      traits:['ancient','confused','poses riddles incorrectly'],
      actions:['asked a riddle with no answer','rotated its head ponderously','demanded the wrong password'],
      sounds:['low grumble','contemplative purr','soft growl'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'philosophical_crab',     text:'philosophical crab',     emoji:'🦀', article:'a',
      traits:['sideways','thoughtful','very into ethics'],
      actions:['posed an existential question','sidestepped the issue (literally)','tapped one claw for emphasis'],
      sounds:['click','contemplative tap','soft scrape'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'melodramatic_ghost',     text:'melodramatic ghost',     emoji:'👻', article:'a',
      traits:['floaty','theatrical','easily heartbroken'],
      actions:['draped itself over a chandelier','wailed about its tragic backstory','vanished mid-sentence'],
      sounds:['ooooh','dramatic wail','tiny sob'],
      comedy:{ energy:'chaotic', dignity:'high', absurdity:7 } },
    { id:'indignant_mushroom',     text:'indignant mushroom',     emoji:'🍄', article:'an',
      traits:['squat','offended','technically alive'],
      actions:['refused to be foraged','stamped a tiny cap','muttered something fungal'],
      sounds:['tiny pop','indignant squeak','spore puff'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:7 } },
    { id:'suspicious_accountant',  text:'suspicious accountant',  emoji:'🧾', article:'a',
      traits:['mild-mannered','overly precise','probably hiding something'],
      actions:['double-checked the spreadsheet','requested a receipt for the receipt','tapped a pencil ominously'],
      sounds:['paper rustle','calculator click','tiny throat clear'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'committed_scarecrow',    text:'deeply committed scarecrow', emoji:'🧑‍🌾', article:'a',
      traits:['stuffed','unblinking','very dedicated to the role'],
      actions:['stayed exactly still for hours','intimidated one crow','squeaked when the wind blew'],
      sounds:['straw rustle','wood creak','quiet flap'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:6 } },
    { id:'partial_wizard',         text:'partially trained wizard', emoji:'🧙', article:'a',
      traits:['confident','underqualified','holding a slightly wrong spellbook'],
      actions:['cast a spell that produced one balloon','muttered the wrong incantation','dropped a tiny smoke pellet'],
      sounds:['fizzle','bzzt','tiny pop'],
      comedy:{ energy:'chaotic', dignity:'medium', absurdity:7 } },
    { id:'overqualified_fish',     text:'overqualified fish',     emoji:'🐟', article:'an', plural:'overqualified fish',
      traits:['intelligent','damp','knows three languages'],
      actions:['solved the puzzle silently','sighed at the obvious','translated a poem'],
      sounds:['bubble','tiny tsk','soft glub'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:7 } },
    { id:'concerned_librarian',    text:'concerned librarian',    emoji:'📚', article:'a',
      traits:['quiet','disapproving','holding the right book'],
      actions:['shushed the entire room','presented the perfect reference','adjusted a stack ominously'],
      sounds:['shhh','soft pat','tiny page flip'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:5 } },
    { id:'accidental_prophet',     text:'accidental prophet',     emoji:'🔮', article:'an',
      traits:['confused','strangely accurate','still figuring it out'],
      actions:['blurted out tomorrow’s weather','muttered an inadvertent prediction','apologized for being right'],
      sounds:['tiny gasp','soft mutter','ominous hum'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:7 } },

    /* ----- tween creature pool (6 missing) ----- */
    { id:'gremlin',                text:'gremlin',                emoji:'👹', article:'a',
      traits:['mischievous','tiny','breaks things on principle'],
      actions:['pulled exactly one wire','snickered from inside the vending machine','left a tiny gremlin signature'],
      sounds:['cackle','metallic clank','tiny giggle'],
      comedy:{ energy:'chaotic', dignity:'low', absurdity:7 } },
    { id:'discount_vampire',       text:'discount vampire',       emoji:'🦇', article:'a',
      /* v2.10.2 — "demanded juice instead of blood" → "demanded juice and a quiet corner".
         Vampire-comedy still lands, no blocked-word trigger. */
      traits:['theatrical','off-brand','garlic-tolerant'],
      actions:['used a plastic cape','demanded juice and a quiet corner','asked for the wifi password'],
      sounds:['vlah-lite','dramatic sigh','tiny hiss'],
      comedy:{ energy:'chaotic', dignity:'medium', absurdity:7 } },
    { id:'shadow_entity',          text:'shadow entity',          emoji:'👤', article:'a',
      traits:['ominous','blob-shaped','possibly someone’s ex'],
      actions:['lingered ominously','said something cryptic','reformed exactly where you didn’t want it'],
      sounds:['whoosh','low whisper','imperceptible hum'],
      comedy:{ energy:'deadpan', dignity:'high', absurdity:7 } },
    { id:'normal_pigeon',          text:'aggressively normal pigeon', emoji:'🕊️', article:'an',
      traits:['bobbing','unremarkable','technically observing'],
      actions:['stared without breaking eye contact','bobbed in suspicious rhythm','accepted a single fry'],
      sounds:['coo','tiny bok','flutter'],
      comedy:{ energy:'deadpan', dignity:'low', absurdity:6 } },
    { id:'tall_pigeon',            text:'unreasonably tall pigeon',  emoji:'🕊️', article:'an',
      traits:['lanky','still a pigeon','looms slightly'],
      actions:['craned its absurd neck','blinked from above','strutted with unjustified grace'],
      sounds:['low coo','elongated flutter','soft thump'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:8 } },
    { id:'confident_rat',          text:'very confident rat',     emoji:'🐀', article:'a',
      traits:['scrappy','assured','unfazed by anything'],
      actions:['strutted across a beam','offered unsolicited advice','tipped an imaginary hat'],
      sounds:['squeak','tiny smug chuckle','chk chk'],
      comedy:{ energy:'deadpan', dignity:'medium', absurdity:6 } },

    /* ============================================================
       v2.4.6 — picker expansion: visitors for new creature picker words. */

    /* ----- little creature additions (5) ----- */
    { id:'v_dragon',          text:'dragon',          emoji:'🐲', article:'a',
      traits:['scaly','fire-breathing','suddenly polite'],
      actions:['toasted a marshmallow','flapped enormous wings','offered a single tiny bow'],
      sounds:['ROAR','snortle','fwoom'] },
    { id:'v_unicorn',         text:'unicorn',         emoji:'🦄', article:'a',
      traits:['glittery','proud','very into rules'],
      actions:['stamped a hoof','sparkled deliberately','offered unsolicited wisdom'],
      sounds:['tinkle','neighhh','prance prance'] },
    { id:'tiny_monster',      text:'tiny monster',    emoji:'👾', article:'a',
      traits:['small','friendly-ish','one-eyed by design'],
      actions:['rolled into the room','went BLEEP','offered a tiny high-five'],
      sounds:['BLEEP','tiny growl','soft squelch'] },
    { id:'cloud_friend',      text:'cloud friend',    emoji:'☁️', article:'a',
      traits:['floaty','soft','always changing shape'],
      actions:['drifted lower for a hug','formed into a smile','rained one tiny drop'],
      sounds:['soft poof','tiny pitter','breeze hum'] },
    { id:'talking_tree',      text:'talking tree',    emoji:'🌳', article:'a',
      traits:['leafy','ancient','slightly judgmental'],
      actions:['cleared its throat (woodily)','dropped a single leaf','offered an old riddle'],
      sounds:['rustle','low creak','soft sigh'] },

    /* ----- kid creature additions (6) ----- */
    { id:'talking_sandwich',  text:'talking sandwich',emoji:'🥪', article:'a',
      traits:['layered','grumpy','technically lunch'],
      actions:['demanded better filling','complained about the wrapping','offered itself reluctantly'],
      sounds:['squelch','tiny grumble','crinkle'] },
    { id:'sub_teacher_kid',   text:'substitute teacher', emoji:'🧑‍🏫', article:'a',
      traits:['unfamiliar','overly cheerful','holding the wrong lesson plan'],
      actions:['mispronounced everyone’s name','announced a pop quiz with great joy','wrote on the wrong board'],
      sounds:['ahem','chalk squeak','cheerful gasp'] },
    { id:'lunch_wizard',      text:'lunch wizard',    emoji:'🧙', article:'a',
      traits:['wise','crumb-flecked','specializes in sandwich magic'],
      actions:['summoned an extra pickle','enchanted the pudding cup','waved a celery wand'],
      sounds:['fizzle','tiny zap','magical crunch'] },
    { id:'hallway_ghost',     text:'hallway ghost',   emoji:'👻', article:'a',
      traits:['translucent','hall-bound','always running late'],
      actions:['floated past the lockers','dropped a phantom hall pass','vanished mid-laugh'],
      sounds:['oooh','tiny giggle','soft whoosh'] },
    { id:'tiny_king',         text:'tiny king',       emoji:'👑', article:'a',
      traits:['short','regal','convinced of his realm'],
      actions:['issued a tiny decree','demanded a snack tribute','adjusted a crown that was too big'],
      sounds:['royal harrumph','tiny trumpet','soft clink'] },
    { id:'grumpy_cloud',      text:'grumpy cloud',    emoji:'☁️', article:'a',
      traits:['fluffy','disgruntled','one bad mood away from drizzle'],
      actions:['rumbled disapprovingly','dropped exactly three raindrops','sulked above one person'],
      sounds:['low rumble','grumble','soft thunder'] },

    /* ----- big creature additions (6) ----- */
    { id:'sub_principal',     text:'substitute principal', emoji:'🧑‍🏫', article:'a',
      traits:['stern','underprepared','holding the wrong PA mic'],
      actions:['announced a non-emergency','double-checked the schedule','threatened the wrong detention'],
      sounds:['mic feedback','stern cough','tap tap'] },
    { id:'retired_wizard',    text:'retired wizard',  emoji:'🧙', article:'a',
      traits:['grizzled','out of practice','still owns the hat'],
      actions:['cast a spell that produced one balloon','muttered a half-remembered chant','sighed at modern magic'],
      sounds:['fizzle','old man hum','tiny pop'] },
    { id:'tiny_mayor',        text:'tiny mayor',      emoji:'👑', article:'a',
      traits:['short','self-important','holding a tiny ribbon-cutting scissors'],
      actions:['cut a ribbon nobody asked for','delivered a speech to two pigeons','named a street after itself'],
      sounds:['tiny gavel','soft applause','ahem'] },
    { id:'snack_inspector',   text:'snack inspector', emoji:'🕵️', article:'a',
      traits:['watchful','crumb-tolerant','holding a clipboard'],
      actions:['tasted a single chip','marked something off the list','peered into the snack drawer'],
      sounds:['tiny clipboard tap','contemplative chew','soft hmm'] },
    { id:'confused_dragon',   text:'confused dragon', emoji:'🐲', article:'a',
      traits:['scaly','lost','holding a map upside down'],
      actions:['asked for directions','sat on a small castle by accident','rotated the map twice'],
      sounds:['confused growl','tiny roar','wing flap'] },
    { id:'courtroom_duck',    text:'courtroom duck',  emoji:'🦆', article:'a',
      traits:['robed','solemn','technically in charge'],
      actions:['banged a tiny gavel','overruled a sandwich','called the next witness'],
      sounds:['quack','tiny gavel bang','solemn quack'] },

    /* ----- tween creature additions (6) ----- */
    { id:'hallway_monitor',   text:'hallway monitor', emoji:'🪪', article:'a',
      traits:['lanyarded','overly empowered','specializes in passes'],
      actions:['asked for ID','wrote down exactly one infraction','adjusted the lanyard'],
      sounds:['tiny click','officious cough','soft pen scratch'] },
    { id:'overconfident_mascot', text:'overconfident mascot', emoji:'🐻', article:'an',
      traits:['costumed','padded','possibly a friend in there'],
      actions:['hyped up an empty hallway','high-fived a wall','tripped over its own paws'],
      sounds:['muffled whoop','soft squeak','tiny thump'] },
    { id:'group_chat_ghost',  text:'group chat ghost',emoji:'📱', article:'a',
      traits:['typing','spectral','always one message behind'],
      actions:['left "..." for an hour','reacted with a single emoji','vanished mid-thread'],
      sounds:['notification ping','tiny whoosh','soft chime'] },
    { id:'cafeteria_oracle',  text:'cafeteria oracle',emoji:'🔮', article:'a',
      traits:['cryptic','tray-bearing','speaks in lunch metaphors'],
      actions:['predicted the soup','foretold a pop quiz','muttered something about pudding'],
      sounds:['low hum','tiny clink','ominous slurp'] },
    { id:'sub_coach',         text:'substitute coach',emoji:'🏈', article:'a',
      traits:['whistled','underprepared','holding the wrong playbook'],
      actions:['blew the whistle at nothing','drew an illegible diagram','jogged in place for emphasis'],
      sounds:['WHEEEE','tiny clipboard tap','sneaker squeak'] },
    { id:'vending_goblin',    text:'vending machine goblin', emoji:'🤖', article:'a',
      traits:['mechanical','mischievous','lives inside row B'],
      actions:['ate the dollar','jammed the spiral','dropped two snacks instead of one'],
      sounds:['clunk','tiny cackle','mechanical whirr'] },
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
    /* Segment B additions — 10 more places to 20 total */
    { id:'meadow',       text:'meadow',         emoji:'🌾', article:'a' },
    { id:'beach',        text:'beach',          emoji:'🏖️', article:'a' },
    { id:'shipwreck',    text:'shipwreck',      emoji:'⚓', article:'a' },
    { id:'glacier',      text:'glacier',        emoji:'🧊', article:'a' },
    { id:'rooftop',      text:'rooftop',        emoji:'🏙️', article:'a' },
    { id:'carnival',     text:'carnival',       emoji:'🎡', article:'a' },
    { id:'planetarium',  text:'planetarium',    emoji:'🪐', article:'a' },
    { id:'library',      text:'library',        emoji:'📚', article:'a' },
    { id:'museum',       text:'museum',         emoji:'🏛️', article:'a' },
    { id:'pillow_fort',  text:'pillow fort',    emoji:'🛏️', article:'a' },
    /* Segment C — tween-flavored places */
    { id:'abandoned_mall',  text:'abandoned mall',   emoji:'🏚️', article:'an' },
    { id:'skatepark',       text:'skatepark',        emoji:'🛹', article:'a' },
    { id:'parking_garage',  text:'parking garage',   emoji:'🚗', article:'a' },
    { id:'arcade',          text:'arcade',           emoji:'🕹️', article:'an' },
    { id:'bus_stop',        text:'bus stop',         emoji:'🚌', article:'a' },
    { id:'convenience_store', text:'convenience store', emoji:'🏪', article:'a' },
    { id:'empty_hallway',   text:'empty school hallway', emoji:'🏫', article:'an' },
    { id:'back_of_bus',     text:'back of the bus',  emoji:'🚌', article:'the' },
    { id:'wrong_neighborhood', text:'slightly wrong neighborhood', emoji:'🗺️', article:'a' },
    { id:'rooftop_night',   text:'rooftop at night', emoji:'🌃', article:'a' },
    /* ============================================================
       v2.4.6 — picker → V2_WORDS coverage backfill (places). */

    /* ----- tot place pool (11 missing) ----- */
    { id:'park',     text:'park',     emoji:'🌳', article:'a' },
    { id:'pond',     text:'pond',     emoji:'🦆', article:'a' },
    { id:'farm',     text:'farm',     emoji:'🐄', article:'a' },
    { id:'yard',     text:'yard',     emoji:'🌻', article:'a' },
    { id:'hill',     text:'hill',     emoji:'⛰️', article:'a' },
    { id:'woods',    text:'woods',    emoji:'🌲', article:'the' },
    { id:'house',    text:'house',    emoji:'🏠', article:'a' },
    { id:'shop',     text:'shop',     emoji:'🏪', article:'a' },
    { id:'bridge',   text:'bridge',   emoji:'🌉', article:'a' },
    { id:'field',    text:'field',    emoji:'🌾', article:'a' },
    { id:'sandbox',  text:'sandbox',  emoji:'🪣', article:'a' },

    /* ----- little place pool (6 missing) ----- */
    { id:'garden',   text:'garden',   emoji:'🌷', article:'a' },
    { id:'village',  text:'village',  emoji:'🏘️', article:'a' },
    { id:'cave',     text:'cave',     emoji:'🕳️', article:'a' },
    { id:'island',   text:'island',   emoji:'🏝️', article:'an' },
    { id:'mountain', text:'mountain', emoji:'🏔️', article:'a' },
    { id:'river',    text:'river',    emoji:'🏞️', article:'a' },

    /* ----- kid place missing (2 entries) ----- */
    { id:'canyon',     text:'canyon',     emoji:'🏞️', article:'a' },
    /* v3.0.2 — `labyrinth` renamed to `maze` (age-appropriate for kid tier 6-7).
       Picker emoji also changed from 🌀 (swirl, also used for spinning motion
       elsewhere) to 🧩 (puzzle piece — intuitive maze visual). */
    { id:'maze',       text:'maze',       emoji:'🧩', article:'a' },

    /* ----- big place pool (12 entries — comedic adjective+noun voice) ----- */
    { id:'mossy_labyrinth',       text:'mossy labyrinth',         emoji:'🌿', article:'a' },
    { id:'cloud_observatory',     text:'cloud observatory',       emoji:'☁️', article:'a' },
    { id:'sunken_ballroom',       text:'sunken ballroom',         emoji:'🏊', article:'a' },
    { id:'forgotten_attic',       text:'forgotten attic',         emoji:'🕯️', article:'a' },
    { id:'luminous_swamp',        text:'luminous swamp',          emoji:'🌙', article:'a' },
    { id:'ancient_library',       text:'ancient library',         emoji:'📚', article:'an' },
    { id:'collapsing_lighthouse', text:'collapsing lighthouse',   emoji:'🏚️', article:'a' },
    { id:'underground_ballroom',  text:'underground ballroom',    emoji:'🎭', article:'an' },
    { id:'flooded_tower',         text:'partially flooded tower', emoji:'🌊', article:'a' },
    { id:'long_corridor',         text:'extremely long corridor', emoji:'🚶', article:'an' },
    { id:'theoretical_basement',  text:'theoretical basement',    emoji:'🏠', article:'a' },
    { id:'average_hallway',       text:'spectacularly average hallway', emoji:'🚪', article:'a' },

    /* ----- tween place pool (3 missing) ----- */
    { id:'library_closing',       text:'library at closing time', emoji:'📚', article:'the' },
    { id:'back_of_the_bus',       text:'the back of the bus',     emoji:'🚌', article:'' },
    { id:'else_backyard',         text:'someone else\'s backyard', emoji:'🌳', article:'' },

    /* ============================================================
       v2.4.6 — picker expansion: places for new picker words across tiers. */

    /* ----- shared everyday places (tot/little/kid) ----- */
    { id:'playground',     text:'playground',     emoji:'🛝', article:'a' },
    { id:'bedroom',        text:'bedroom',        emoji:'🛏️', article:'a' },
    { id:'kitchen',        text:'kitchen',        emoji:'🍽️', article:'a' },
    { id:'bus',            text:'bus',            emoji:'🚌', article:'a' },
    { id:'classroom',      text:'classroom',      emoji:'🏫', article:'a' },
    { id:'backyard',       text:'backyard',       emoji:'🌳', article:'a' },
    { id:'grocery_store',  text:'grocery store',  emoji:'🛒', article:'a' },
    { id:'school_cafeteria', text:'school cafeteria', emoji:'🏫', article:'a' },
    { id:'diner',          text:'diner',          emoji:'🍔', article:'a' },
    { id:'mall',           text:'mall',           emoji:'🛍️', article:'a' },

    /* ----- big tier place additions (6) ----- */
    { id:'cafeteria_mysteries',  text:'cafeteria of mysteries',  emoji:'🏫', article:'the' },
    { id:'quiet_mall',           text:'suspiciously quiet mall', emoji:'🛍️', article:'a' },
    { id:'museum_basement',      text:'museum basement',         emoji:'🏛️', article:'a' },
    { id:'indoor_water_park',    text:'indoor water park',       emoji:'🌊', article:'an' },
    { id:'bus_depot',            text:'bus depot',               emoji:'🚌', article:'a' },
    { id:'grocery_aisle_seven',  text:'grocery aisle seven',     emoji:'🛒', article:'' },

    /* ----- tween tier place additions (6) ----- */
    { id:'mall_food_court',      text:'mall food court',         emoji:'🛍️', article:'the' },
    { id:'drama_hallway',        text:'drama hallway',           emoji:'🎭', article:'the' },
    { id:'late_bus',             text:'late bus',                emoji:'🚌', article:'the' },
    { id:'weird_stairwell',      text:'weird stairwell',         emoji:'🌀', article:'a' },
    { id:'gym_bleachers',        text:'gym bleachers',           emoji:'🏀', article:'the' },
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
    /* Segment B additions — 10 more foods to 20 total */
    { id:'waffles',       text:'waffles',       emoji:'🧇', isPlural:true,  plural:'waffles' },
    { id:'spaghetti',     text:'spaghetti',     emoji:'🍝', isPlural:false, article:'some' },
    { id:'popcorn',       text:'popcorn',       emoji:'🍿', isPlural:false, article:'some' },
    { id:'hot_dogs',      text:'hot dogs',      emoji:'🌭', isPlural:true,  plural:'hot dogs' },
    { id:'cookies',       text:'cookies',       emoji:'🍪', isPlural:true,  plural:'cookies' },
    { id:'french_fries',  text:'french fries',  emoji:'🍟', isPlural:true,  plural:'french fries' },
    { id:'ramen',         text:'ramen',         emoji:'🍜', isPlural:false, article:'a bowl of' },
    { id:'burritos',      text:'burritos',      emoji:'🌯', isPlural:true,  plural:'burritos' },
    { id:'dumplings',     text:'dumplings',     emoji:'🥟', isPlural:true,  plural:'dumplings' },
    { id:'jellybeans',    text:'jellybeans',    emoji:'🍬', isPlural:true,  plural:'jellybeans' },
    /* v2.2.1 — foods expansion to 35 (relatable diner/mall/school flavors) */
    { id:'cereal',           text:'cereal',           emoji:'🥣', isPlural:false, article:'some' },
    { id:'blueberries',      text:'blueberries',      emoji:'🫐', isPlural:true,  plural:'blueberries' },
    { id:'milkshake',        text:'milkshake',        emoji:'🥤', isPlural:false, article:'a' },
    { id:'garlic_bread',     text:'garlic bread',     emoji:'🍞', isPlural:false, article:'some' },
    { id:'pickles',          text:'pickles',          emoji:'🥒', isPlural:true,  plural:'pickles' },
    { id:'crackers',         text:'crackers',         emoji:'🍘', isPlural:true,  plural:'crackers' },
    { id:'applesauce',       text:'applesauce',       emoji:'🍎', isPlural:false, article:'some' },
    { id:'birthday_cake',    text:'birthday cake',    emoji:'🎂', isPlural:false, article:'a slice of' },
    { id:'cinnamon_toast',   text:'cinnamon toast',   emoji:'🍞', isPlural:false, article:'a piece of' },
    { id:'cereal_bar',       text:'cereal bar',       emoji:'🍫', isPlural:false, article:'a' },
    { id:'cheese_puffs',     text:'cheese puffs',     emoji:'🧀', isPlural:true,  plural:'cheese puffs' },
    { id:'fruit_snacks',     text:'fruit snacks',     emoji:'🍇', isPlural:true,  plural:'fruit snacks' },
    { id:'pudding_cup',      text:'pudding cup',      emoji:'🍮', isPlural:false, article:'a' },
    { id:'mac_and_cheese',   text:'mac and cheese',   emoji:'🧀', isPlural:false, article:'some' },
    { id:'banana_bread',     text:'banana bread',     emoji:'🍌', isPlural:false, article:'a slice of' },
    /* ============================================================
       v2.4.6 — picker → V2_WORDS coverage backfill (foods). */

    /* ----- tot food pool (12 entries) ----- */
    { id:'cake',     text:'cake',     emoji:'🍰', isPlural:false, article:'a slice of' },
    { id:'jam',      text:'jam',      emoji:'🍓', isPlural:false, article:'some' },
    { id:'milk',     text:'milk',     emoji:'🥛', isPlural:false, article:'some' },
    { id:'bread',    text:'bread',    emoji:'🍞', isPlural:false, article:'a piece of' },
    { id:'grapes',   text:'grapes',   emoji:'🍇', isPlural:true,  plural:'grapes' },
    { id:'corn',     text:'corn',     emoji:'🌽', isPlural:false, article:'some' },
    { id:'apple',    text:'apple',    emoji:'🍎', isPlural:false, article:'an' },
    { id:'banana',   text:'banana',   emoji:'🍌', isPlural:false, article:'a' },
    { id:'cheese',   text:'cheese',   emoji:'🧀', isPlural:false, article:'some' },
    { id:'carrot',   text:'carrot',   emoji:'🥕', isPlural:false, article:'a' },
    { id:'honey',    text:'honey',    emoji:'🍯', isPlural:false, article:'some' },
    { id:'cookie',   text:'cookie',   emoji:'🍪', isPlural:false, article:'a' },

    /* ----- little food missing (5 entries) ----- */
    { id:'sandwich',     text:'sandwich',     emoji:'🥪', isPlural:false, article:'a' },
    { id:'strawberries', text:'strawberries', emoji:'🍓', isPlural:true,  plural:'strawberries' },
    { id:'soup',         text:'soup',         emoji:'🍲', isPlural:false, article:'a bowl of' },
    { id:'candy',        text:'candy',        emoji:'🍬', isPlural:false, article:'some' },
    /* grapes already added above for tot pool */

    /* ----- kid food missing (1 entry) ----- */
    { id:'nachos',   text:'nachos',   emoji:'🧀', isPlural:true, plural:'nachos' },

    /* ----- big food pool (12 entries — comedic adjective+noun voice) ----- */
    { id:'enchanted_pickles',   text:'enchanted pickles',   emoji:'🥒', isPlural:true,  plural:'enchanted pickles' },
    { id:'thunder_pancakes',    text:'thunder pancakes',    emoji:'🥞', isPlural:true,  plural:'thunder pancakes' },
    { id:'suspicious_sandwiches', text:'suspicious sandwiches', emoji:'🥪', isPlural:true, plural:'suspicious sandwiches' },
    { id:'bewildering_cookies', text:'bewildering cookies', emoji:'🍪', isPlural:true,  plural:'bewildering cookies' },
    { id:'haunted_scones',      text:'haunted scones',      emoji:'🫖', isPlural:true,  plural:'haunted scones' },
    { id:'legendary_soup',      text:'legendary soup',      emoji:'🍲', isPlural:false, article:'a bowl of' },
    { id:'suspicious_casserole',text:'suspicious casserole',emoji:'🍱', isPlural:false, article:'a tray of' },
    { id:'haunted_macaroni',    text:'haunted macaroni',    emoji:'🍝', isPlural:false, article:'some' },
    { id:'ancient_granola_bar', text:'ancient granola bar', emoji:'🥣', isPlural:false, article:'an' },
    { id:'overconfident_pudding', text:'overconfident pudding', emoji:'🍮', isPlural:false, article:'some' },
    { id:'mysterious_leftovers',text:'mysterious leftovers',emoji:'🥡', isPlural:true,  plural:'mysterious leftovers' },
    { id:'bold_lasagna',        text:'extremely bold lasagna', emoji:'🍝', isPlural:false, article:'a slab of' },

    /* ----- tween food pool (12 entries — late-night-coded voice) ----- */
    { id:'instant_noodles',     text:'instant noodles',     emoji:'🍜', isPlural:true,  plural:'instant noodles' },
    { id:'cold_pizza',          text:'cold pizza',          emoji:'🍕', isPlural:false, article:'a slice of' },
    { id:'sour_candy',          text:'sour candy',          emoji:'🍬', isPlural:false, article:'some' },
    { id:'boba_tea',            text:'boba tea',            emoji:'🧋', isPlural:false, article:'a' },
    { id:'hot_sauce',           text:'hot sauce',           emoji:'🌶️', isPlural:false, article:'some' },
    { id:'energy_drink',        text:'energy drink',        emoji:'🥤', isPlural:false, article:'an' },
    { id:'gas_station_sushi',   text:'gas station sushi',   emoji:'🍣', isPlural:false, article:'some' },
    { id:'midnight_cereal',     text:'cereal at midnight',  emoji:'🥣', isPlural:false, article:'some' },
    { id:'mystery_chips',       text:'mystery chips',       emoji:'🍟', isPlural:true,  plural:'mystery chips' },
    { id:'sad_granola_bar',     text:'sad granola bar',     emoji:'🥣', isPlural:false, article:'a' },
    { id:'third_coffee',        text:'third coffee',        emoji:'☕', isPlural:false, article:'a' },
    { id:'everything_bagel',    text:'everything bagel',    emoji:'🥯', isPlural:false, article:'an' },

    /* ============================================================
       v2.4.6 — picker expansion: foods for new picker words. */

    /* ----- tot food additions (4) ----- */
    { id:'muffin',     text:'muffin',     emoji:'🧁', isPlural:false, article:'a' },
    { id:'yogurt',     text:'yogurt',     emoji:'🥄', isPlural:false, article:'some' },
    { id:'pasta',      text:'pasta',      emoji:'🍝', isPlural:false, article:'some' },
    { id:'peas',       text:'peas',       emoji:'🟢', isPlural:true,  plural:'peas' },

    /* ----- little food additions (2) ----- */
    { id:'toast',         text:'toast',         emoji:'🍞', isPlural:false, article:'a piece of' },
    { id:'apple_slices',  text:'apple slices',  emoji:'🍎', isPlural:true,  plural:'apple slices' },

    /* ----- big tier food additions (6) ----- */
    { id:'ceremonial_nachos',     text:'ceremonial nachos',     emoji:'🧀', isPlural:true,  plural:'ceremonial nachos' },
    { id:'forbidden_waffles',     text:'forbidden waffles',     emoji:'🧇', isPlural:true,  plural:'forbidden waffles' },
    { id:'emergency_noodles_big', text:'emergency noodles',     emoji:'🍜', isPlural:true,  plural:'emergency noodles' },
    { id:'normal_toast',          text:'aggressively normal toast', emoji:'🍞', isPlural:false, article:'a slice of' },
    { id:'suspicious_fruit_salad',text:'suspicious fruit salad',emoji:'🍓', isPlural:false, article:'a bowl of' },
    { id:'official_pudding',      text:'official pudding',      emoji:'🍮', isPlural:false, article:'some' },

    /* ----- tween tier food additions (6) ----- */
    { id:'vending_chips',         text:'vending machine chips', emoji:'🍟', isPlural:true,  plural:'vending machine chips' },
    { id:'cafeteria_fries',       text:'cafeteria fries',       emoji:'🍟', isPlural:true,  plural:'cafeteria fries' },
    { id:'emergency_ramen',       text:'emergency ramen',       emoji:'🍜', isPlural:false, article:'a cup of' },
    { id:'suspicious_smoothie',   text:'suspicious smoothie',   emoji:'🥤', isPlural:false, article:'a' },
    { id:'leftover_birthday_cake',text:'leftover birthday cake',emoji:'🎂', isPlural:false, article:'a slice of' },
    { id:'gas_station_nachos',    text:'gas station nachos',    emoji:'🧀', isPlural:true,  plural:'gas station nachos' },
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
    /* Segment B additions — 15 more objects to 25 total */
    { id:'suspicious_envelope', text:'suspicious envelope', emoji:'✉️', article:'a' },
    { id:'noisy_spoon',         text:'noisy spoon',         emoji:'🥄', article:'a' },
    { id:'tiny_clipboard',      text:'tiny clipboard',      emoji:'📋', article:'a' },
    { id:'magic_8_ball',        text:'magic eight ball',    emoji:'🎱', article:'a' },
    { id:'whistle',             text:'whistle',             emoji:'🎺', article:'a' },
    { id:'rubber_chicken',      text:'rubber chicken',      emoji:'🐔', article:'a' },
    { id:'jar_of_buttons',      text:'jar of buttons',      emoji:'🫙', article:'a' },
    { id:'umbrella',            text:'umbrella',            emoji:'☂️', article:'an' },
    { id:'shiny_rock',          text:'shiny rock',          emoji:'💎', article:'a' },
    { id:'wind_up_toy',         text:'wind-up toy',         emoji:'🧸', article:'a' },
    { id:'banana_phone',        text:'banana phone',        emoji:'📞', article:'a' },
    { id:'pickle_jar',          text:'pickle jar',          emoji:'🥒', article:'a' },
    { id:'broken_compass',      text:'broken compass',      emoji:'🧭', article:'a' },
    { id:'invisible_box',       text:'invisible box',       emoji:'📦', article:'an' },
    { id:'wobbly_telescope',    text:'wobbly telescope',    emoji:'🔭', article:'a' },
    /* v2.2.1 — objects expansion to 45 (relatable diner/mall/school/football items) */
    { id:'lunch_tray',          text:'lunch tray',          emoji:'🥡', article:'a' },
    { id:'sticker_sheet',       text:'sticker sheet',       emoji:'🏷️', article:'a' },
    { id:'library_card',        text:'library card',        emoji:'💳', article:'a' },
    { id:'bent_spoon',          text:'bent spoon',          emoji:'🥄', article:'a' },
    { id:'cereal_box',          text:'cereal box',          emoji:'📦', article:'a' },
    { id:'shopping_list',       text:'shopping list',       emoji:'📝', article:'a' },
    { id:'backpack_zipper',     text:'backpack zipper',     emoji:'🎒', article:'a' },
    { id:'lost_mitten',         text:'lost mitten',         emoji:'🧤', article:'a' },
    { id:'tiny_trophy',         text:'tiny trophy',         emoji:'🏆', article:'a' },
    { id:'foam_finger',         text:'foam finger',         emoji:'👉', article:'a' },
    { id:'ticket_stub',         text:'ticket stub',         emoji:'🎟️', article:'a' },
    { id:'receipt',             text:'receipt',             emoji:'🧾', article:'a' },
    { id:'shopping_cart',       text:'shopping cart',       emoji:'🛒', article:'a' },
    { id:'hallway_pass',        text:'hallway pass',        emoji:'📋', article:'a' },
    { id:'water_bottle',        text:'water bottle',        emoji:'🍶', article:'a' },
    { id:'mystery_coupon',      text:'mystery coupon',      emoji:'🎫', article:'a' },
    { id:'bus_ticket',          text:'bus ticket',          emoji:'🎫', article:'a' },
    { id:'milkshake_straw',     text:'milkshake straw',     emoji:'🥤', article:'a' },
    { id:'mascot_head',         text:'mascot head',         emoji:'🎭', article:'a' },
    // v0.9.3 · b24 — `isPlural: true` so articleText returns "some binoculars" and
    // theText returns "the binoculars" even when the mapPickToWord clone path
    // copies isPlural=false from a singular base entry. Without this, the
    // b15 picker-clone produces "a binoculars" on a small fraction of stories.
    { id:'binoculars',          text:'binoculars',          emoji:'🔭', article:'some', isPlural: true },
  ],

  /* Sounds — onomatopoeia + exclamations. Used as standalone slots and also pulled from companion.sounds. */
  sounds: [
    { id:'splat',   text:'SPLAT' },     { id:'boing',   text:'BOING' },
    { id:'kerplunk',text:'KERPLUNK' },  { id:'wump',    text:'WUMP' },
    { id:'fwoosh',  text:'FWOOSH' },    { id:'honk',    text:'HONK' },
    { id:'plop',    text:'PLOP' },      { id:'yikes',   text:'YIKES' },
    { id:'whee',    text:'WHEE' },      { id:'bwah',    text:'BWAH' },
    { id:'zink',    text:'ZINK' },      { id:'poof',    text:'POOF' },
    /* Segment B — 12 more sounds to 24 total */
    { id:'kazam',   text:'KAZAM' },     { id:'blip',    text:'BLIP' },
    { id:'sproing', text:'SPROING' },   { id:'whoosh',  text:'WHOOSH' },
    { id:'flurp',   text:'FLURP' },     { id:'glonk',   text:'GLONK' },
    { id:'zonk',    text:'ZONK' },      { id:'pfft',    text:'PFFT' },
    { id:'thud',    text:'THUD' },      { id:'thwip',   text:'THWIP' },
    { id:'squelch', text:'SQUELCH' },   { id:'meep',    text:'MEEP' },
    /* v2.2.1 — sounds expansion to 40 (everyday/scene-relevant beats) */
    { id:'beep_beep', text:'BEEP-BEEP' }, { id:'clatter', text:'CLATTER' },
    { id:'skronk',  text:'SKRONK' },     { id:'ding_dong', text:'DING-DONG' },
    { id:'fwip',    text:'FWIP' },       { id:'bonk',     text:'BONK' },
    { id:'crunch',  text:'CRUNCH' },     { id:'glug',     text:'GLUG' },
    { id:'whirr',   text:'WHIRR' },      { id:'tink',     text:'TINK' },
    { id:'flump',   text:'FLUMP' },      { id:'rattle',   text:'RATTLE' },
    { id:'gasp',    text:'GASP' },       { id:'zoom',     text:'ZOOM' },
    { id:'munch',   text:'MUNCH' },      { id:'pop_pop',  text:'POP-POP' },
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
    /* Segment B — 8 more adverbs to 16 total */
    { id:'accidentally_on_purpose', text:'accidentally on purpose' },
    { id:'with_concerning_enthusiasm', text:'with concerning enthusiasm' },
    { id:'in_a_hurry',            text:'in a hurry' },
    { id:'for_unclear_reasons',   text:'for unclear reasons' },
    { id:'thoughtfully',          text:'thoughtfully' },
    { id:'cautiously',            text:'cautiously' },
    { id:'dramatically',          text:'dramatically' },
    { id:'cheerfully',            text:'cheerfully' },
  ],

  /* Numbers — concrete absurd quantities. */
  numbers: [
    { id:'seventeen',     text:'seventeen' },
    { id:'twenty_three',  text:'twenty-three' },
    { id:'one_and_half',  text:'one and a half' },
    { id:'too_many',      text:'too many' },
    { id:'forty_two',     text:'exactly forty-two' },
    { id:'a_polite_few',  text:'a polite handful of' },
    /* Segment B — 8 more numbers to 14 total */
    { id:'eleventy_eight',text:'eleventy-eight' },
    { id:'three_alleged', text:'three (allegedly)' },
    { id:'six_rude',      text:'six (rude)' },
    { id:'nine_plus_three', text:'nine plus three' },
    { id:'eight_thousand',text:'eight thousand' },
    { id:'a_small_specific', text:'a small but specific number of' },
    { id:'almost_zero',   text:'almost zero' },
    { id:'far_too_few',   text:'far too few' },
  ],

  /* Liquids — pickle juice, moon milk. */
  liquids: [
    { id:'pickle_juice',    text:'pickle juice' },
    { id:'moon_milk',       text:'moon milk' },
    { id:'glitter_lemonade',text:'glitter lemonade' },
    { id:'warm_soup',       text:'warm soup' },
    { id:'thunder_soda',    text:'thunder soda' },
    { id:'rainbow_water',   text:'rainbow water' },
    /* Segment B — 8 more liquids to 14 total */
    { id:'questionable_broth', text:'questionable broth' },
    { id:'loud_orange_juice',  text:'extremely loud orange juice' },
    { id:'emergency_apple_juice', text:'emergency apple juice' },
    { id:'haunted_iced_tea',   text:'haunted iced tea' },
    { id:'formal_hot_chocolate', text:'formally polite hot chocolate' },
    { id:'single_tear',        text:'a single tear' },
    { id:'invisible_water',    text:'invisible water' },
    { id:'sleepy_milk',        text:'sleepy milk' },
  ],

  /* Jobs — fake titles for absurd authority. */
  jobs: [
    { id:'puddle_inspector',   text:'official puddle inspector' },
    { id:'sandwich_lawyer',    text:'sandwich lawyer' },
    { id:'cloud_dentist',      text:'assistant cloud dentist' },
    { id:'hat_consultant',     text:'emergency hat consultant' },
    { id:'snack_detective',    text:'snack detective' },
    { id:'hallway_mayor',      text:'hallway mayor' },
    /* Segment B — 10 more jobs to 16 total */
    { id:'moon_accountant',    text:'junior moon accountant' },
    { id:'dragon_whisperer',   text:'certified dragon whisperer' },
    { id:'substitute_wizard',  text:'substitute wizard' },
    { id:'button_counter',     text:'professional button counter' },
    { id:'nap_supervisor',     text:'royal nap supervisor' },
    { id:'sock_investigator',  text:'chief sock investigator' },
    { id:'apology_writer',     text:'official apology writer' },
    { id:'pillow_engineer',    text:'pillow engineer' },
    { id:'bubble_judge',       text:'bubble judge' },
    { id:'lost_thing_returner',text:'lost thing returner' },
    /* v2.2.1 — jobs expansion to 30 (relatable diner/mall/school flavors) */
    { id:'menu_consultant',    text:'menu consultant' },
    { id:'mascot_intern',      text:'mascot intern' },
    { id:'sample_tray_captain',text:'sample tray captain' },
    { id:'recess_referee',     text:'recess referee' },
    { id:'hallway_marshal',    text:'hallway marshal' },
    { id:'bus_seat_arbiter',   text:'bus seat arbiter' },
    { id:'cookie_taster',      text:'cookie taster' },
    { id:'fountain_coin_clerk',text:'fountain coin clerk' },
    { id:'photo_booth_director',text:'photo booth director' },
    { id:'fridge_inspector',   text:'fridge inspector' },
    { id:'sticker_archivist',  text:'sticker archivist' },
    { id:'snack_alarm_specialist',text:'snack alarm specialist' },
    { id:'cart_wheel_engineer',text:'cart wheel engineer' },
    { id:'foam_finger_handler',text:'foam finger handler' },
  ],

  /* Rules — used as motif anchors (setup → violation → payoff). */
  rules: [
    { id:'no_soup',         text:'no soup after moonrise' },
    { id:'never_sandwich',  text:'never trust a sandwich after sunset' },
    { id:'three_hops',      text:'three hops before any door' },
    { id:'pets_vote',       text:'pets vote on Tuesdays' },
    { id:'check_hat',       text:'check the hat before sitting' },
    { id:'no_apology_stairs', text:'no apologizing on stairs' },
    /* Segment B — 8 more rules to 14 total */
    { id:'left_socks',      text:'all left socks must be paired' },
    { id:'spoon_finder',    text:'whoever finds the spoon makes the rules' },
    { id:'no_whispering',   text:'no whispering at lunch' },
    { id:'every_cloud',     text:'every cloud counts' },
    { id:'always_ladybug',  text:'always say hello to ladybugs' },
    { id:'no_clipboard_running', text:'never run with a clipboard' },
    { id:'two_snacks_min',  text:'always carry two snacks minimum' },
    { id:'tuesday_pancakes',text:'pancakes are mandatory on Tuesday' },
    /* v2.2.1 — rules expansion to 30 (everyday/scene-relevant rules) */
    { id:'no_running_near_soup',    text:'no running near soup' },
    { id:'thank_the_spoon',         text:'always thank the spoon' },
    { id:'never_open_cereal_twice', text:'never open a cereal box twice' },
    { id:'mascots_last_word',       text:'mascots get the last word' },
    { id:'backpack_snack_inspection',text:'backpacks must be inspected by snacks' },
    { id:'cart_captain',            text:'every cart needs a captain' },
    { id:'no_whisper_cupcake',      text:'no whispering to cupcakes' },
    { id:'bus_seats_choose',        text:'bus seats choose you' },
    { id:'foam_finger_first',       text:'foam finger goes on first' },
    { id:'sample_tray_silent',      text:'approach the sample tray quietly' },
    { id:'cookie_offered',          text:'a cookie offered must be accepted' },
    { id:'fountain_one_coin',       text:'one coin per fountain wish' },
    { id:'no_skip_aisle_seven',     text:'never skip aisle seven' },
    { id:'hallway_pass_held_high',  text:'hallway passes must be held high' },
    { id:'menu_must_be_read',       text:'the menu must be read out loud, at least once' },
    { id:'last_donut_voted',        text:'the last donut is decided by vote' },
  ],
};

/* ================================================================
   v2.1.0 — STORY SETTING MODES (Notion Build Idea "Story Setting Modes")
   ================================================================
   Each setting grounds a story in a relatable real-world location with
   appropriate vocabulary. The user picks the setting on a dedicated UI
   screen before word selection. The setting:
     - Locks the `place` slot (e.g. "diner", "mall", "football game")
     - Biases the visitor pool toward setting-appropriate characters
       (diner → waiter; mall → store clerk; football game → coach)
     - Adds setting-specific objects (diner → menu; mall → escalator)
     - Optionally seeds a setting-flavored opening beat

   "surprise" is the default — current v2 behavior, picks from anything.

   Settings carry their own articles so "the diner" / "the mall" /
   "the football game" render correctly. Each has a UI label, emoji,
   and copy for the selector screen.
   ================================================================ */
const V2_SETTINGS = [
  { id: 'surprise',
    label: 'Surprise me',
    emoji: '✨',
    note: 'Anywhere the story takes us',
    place: null,                               // null → pick from V2_WORDS.places
    visitorBias: [],                           // empty → no bias, use full pool
    objectBias: [] },
  { id: 'diner',
    label: 'The Diner',
    emoji: '🍔',
    note: 'Pancakes, milkshakes, a jukebox',
    place: { id:'diner', text:'diner', emoji:'🍔', article:'the' },
    visitorBias: ['stressed_barista','jester','wizard','knight'],
    /* v2.2.1 — expanded with scene-relevant objects per Diner brief */
    objectBias: ['noisy_spoon','bent_spoon','milkshake_straw','receipt','lunch_tray','sticker_sheet','cereal_box','pickle_jar'] },
  { id: 'mall',
    label: 'The Mall',
    emoji: '🛍️',
    note: 'Escalators, food court, fountains',
    place: { id:'mall', text:'mall', emoji:'🛍️', article:'the' },
    visitorBias: ['stressed_barista','wifi_ghost','vending_machine','sub_teacher','group_chat'],
    objectBias: ['shiny_rock','glittery_helmet','dramatic_cape','mystery_coupon','receipt','ticket_stub','umbrella'] },
  { id: 'football_game',
    label: 'The Football Game',
    emoji: '🏈',
    note: 'Bleachers, mascots, halftime',
    place: { id:'football_game', text:'football game', emoji:'🏈', article:'the' },
    visitorBias: ['jester','knight','pirate','dinosaur'],
    objectBias: ['foam_finger','whistle','mascot_head','ticket_stub','sleepy_megaphone','dramatic_cape'] },
  { id: 'school',
    label: 'School',
    emoji: '🏫',
    note: 'Cafeteria, recess, the long hallway',
    place: { id:'school', text:'school', emoji:'🏫', article:'the' },
    visitorBias: ['sub_teacher','feral_librarian','knight','goblin','jester'],
    objectBias: ['hallway_pass','lunch_tray','library_card','backpack_zipper','sticker_sheet','tiny_clipboard'] },
  { id: 'backyard',
    label: 'The Backyard',
    emoji: '🌳',
    note: 'Grass, sprinklers, a tiny adventure',
    place: { id:'backyard', text:'backyard', emoji:'🌳', article:'the' },
    visitorBias: ['fairy','gnome','dinosaur','goblin','ghost'],
    objectBias: ['shiny_rock','umbrella','crumb_map','tiny_key','lost_mitten','water_bottle'] },
  { id: 'grocery_store',
    label: 'The Grocery Store',
    emoji: '🛒',
    note: 'Cart wheels, free samples, the cereal aisle',
    place: { id:'grocery_store', text:'grocery store', emoji:'🛒', article:'the' },
    visitorBias: ['stressed_barista','wizard','witch','goblin'],
    objectBias: ['shopping_list','cereal_box','shopping_cart','mystery_coupon','pickle_jar','receipt'] },
  { id: 'zoo',
    label: 'The Zoo',
    emoji: '🦁',
    note: 'Animals, snacks, a long walk',
    place: { id:'zoo', text:'zoo', emoji:'🦁', article:'the' },
    visitorBias: ['knight','pirate','wizard','jester','dinosaur'],
    objectBias: ['crumb_map','wobbly_telescope','binoculars','ticket_stub','water_bottle','tiny_key'] },
  { id: 'bus',
    label: 'On the Bus',
    emoji: '🚌',
    note: 'Bumpy ride, weird strangers, snacks',
    place: { id:'bus', text:'bus', emoji:'🚌', article:'the' },
    visitorBias: ['sub_teacher','wifi_ghost','goblin','stressed_barista','gnome'],
    objectBias: ['bus_ticket','backpack_zipper','lost_mitten','lunch_tray','sticker_sheet','water_bottle'] },
];

/* Helper: look up a setting by id, with safe fallback to "surprise".
   v0.9.3 · b9 — when the id is a Setting 2.0 flavor key (e.g. 'food_place'),
   route through resolveSetting (defined in content.js) which picks a random
   hidden specific-place per call. Legacy exact keys still resolve via the
   V2_SETTINGS table for backward compatibility. */
function getSetting(id) {
  if (typeof resolveSetting === 'function'
      && typeof SETTING_FLAVOR_KEYS !== 'undefined'
      && SETTING_FLAVOR_KEYS.includes(id)) {
    return resolveSetting(id);
  }
  return V2_SETTINGS.find(s => s.id === id) || V2_SETTINGS[0];
}

/* ================================================================
   v2.3.0 — V2_GOALS — the causality spine
   ================================================================
   Per LLM Council: stories need a load-bearing goal. The kid declares
   it in P1, a chosen pick BLOCKS it, the kid uses ANOTHER chosen pick
   to resolve it. Goals are now first-class slots, exposed to beats as
   {goal.text} (mid-sentence), {goal.cap} (start-of-sentence), and
   {goal.past} (past-tense for resolution beats).
   ================================================================ */
const V2_GOALS = [
  // text       — mid-sentence verb phrase: "find the missing key"
  // past       — past-tense form: "found the missing key"
  // tone       — coarse vibe so we can balance per tier later
  { id:'find_missing',    text:'find the missing thing',         past:'found the missing thing',     tone:'cozy' },
  { id:'win_race',        text:'win the silly race',             past:'won the silly race',          tone:'bouncy' },
  { id:'rescue_friend',   text:'rescue a stuck friend',          past:'rescued a stuck friend',      tone:'brave' },
  { id:'cheer_up',        text:'cheer somebody up',              past:'cheered somebody up',         tone:'warm' },
  { id:'solve_riddle',    text:'solve a tricky riddle',          past:'solved the tricky riddle',    tone:'curious' },
  { id:'find_hideout',    text:'build the perfect hideout',      past:'built the perfect hideout',   tone:'creative' },
  { id:'wake_moon',       text:'wake up the sleepy moon',        past:'woke the sleepy moon',        tone:'whimsy' },
  { id:'best_snack',      text:'find the best possible snack',   past:'found the best possible snack', tone:'hungry' },
  { id:'open_door',       text:'open the door that won\'t open', past:'opened the door',             tone:'puzzle' },
  { id:'catch_thing',     text:'catch the runaway thing',        past:'caught the runaway thing',    tone:'chase' },
  { id:'deliver_secret',  text:'deliver a secret message',       past:'delivered the secret message', tone:'sneaky' },
  { id:'fix_broken',      text:'fix the broken contraption',     past:'fixed the broken contraption', tone:'tinker' },
  { id:'find_treasure',   text:'find the hidden treasure',       past:'found the hidden treasure',   tone:'adventure' },
  { id:'tame_creature',   text:'tame the noisy creature',        past:'tamed the noisy creature',    tone:'kindness' },
  { id:'cross_bridge',    text:'cross the wobbly bridge',        past:'crossed the wobbly bridge',   tone:'brave' },
  { id:'plan_party',      text:'plan a surprise party',          past:'planned the surprise party',  tone:'cheerful' },
  { id:'find_quietest',   text:'find the quietest spot ever',    past:'found the quietest spot',     tone:'cozy' },
  { id:'sing_loudest',    text:'sing the loudest possible song', past:'sang the loudest song',       tone:'bouncy' },
  { id:'hide_so_well',    text:'hide so well that nobody finds them', past:'hid so well that nobody could find them', tone:'sneaky' },
  { id:'collect_seven',   text:'collect seven shiny things',     past:'collected the seven shiny things', tone:'curious' },
  { id:'invent_dance',    text:'invent a brand new dance',       past:'invented a brand new dance',  tone:'bouncy' },
  { id:'make_giggle',     text:'make the grumpiest thing giggle', past:'made the grumpiest thing giggle', tone:'silly' },
  { id:'tell_joke',       text:'tell the funniest joke ever',    past:'told the funniest joke ever', tone:'silly' },
  { id:'find_way_home',   text:'find the way home',              past:'found the way home',          tone:'cozy' },
  { id:'win_award',       text:'win the official tiny trophy',   past:'won the tiny trophy',         tone:'proud' },
  { id:'sneak_past',      text:'sneak past the watchful one',    past:'snuck past the watchful one', tone:'sneaky' },
  { id:'share_secret',    text:'share a real good secret',       past:'shared the real good secret', tone:'cozy' },
  { id:'beat_rule',       text:'find a loophole in the rules',   past:'found the loophole',          tone:'clever' },
  { id:'make_friend',     text:'make a brand new friend',        past:'made a brand new friend',     tone:'warm' },
  { id:'finish_meal',     text:'finish the giant snack stack',   past:'finished the giant snack stack', tone:'hungry' },
];

/* Helper: pick a goal compatible with tier (used by generateStoryV2). */
function pickGoal() {
  return V2_GOALS[Math.floor(Math.random() * V2_GOALS.length)];
}

/* ================================================================
   STORY SEEDS — premise anchors
   Each seed defines required slots and which recipe(s) it works with.
   Phase 1 ships 5 seeds, all Quest-compatible.
   ================================================================ */
const V2_SEEDS = [
  /* Quest-recipe seeds */
  { id:'snack_trial',     tiers:['kid','big'], recipe:'quest',       requiredSlots:['companion','visitor','food','object'] },
  { id:'lost_thing',      tiers:['kid','big'], recipe:'quest',       requiredSlots:['companion','place','object'] },
  { id:'secret_club',     tiers:['kid','big'], recipe:'quest',       requiredSlots:['companion','visitor','place'] },
  { id:'weird_smell',     tiers:['kid','big'], recipe:'quest',       requiredSlots:['companion','place','food'] },
  { id:'wrong_room',      tiers:['kid','big'], recipe:'quest',       requiredSlots:['companion','visitor','object'] },
  /* Segment B — Mystery-recipe seeds */
  { id:'mystery_thief',   tiers:['kid','big'], recipe:'mystery',     requiredSlots:['companion','visitor','food','object'] },
  { id:'missing_kazoo',   tiers:['kid','big'], recipe:'mystery',     requiredSlots:['companion','object'] },
  /* Trial-recipe seeds */
  { id:'broken_rule',     tiers:['kid','big'], recipe:'trial',       requiredSlots:['companion','visitor','rule'] },
  /* Performance-recipe seeds */
  { id:'surprise_show',   tiers:['kid','big'], recipe:'performance', requiredSlots:['companion','visitor','sound'] },
  /* Bureaucracy-recipe seeds — kid AND big */
  { id:'lost_paperwork',  tiers:['kid','big'], recipe:'bureaucracy', requiredSlots:['companion','visitor','object','job'] },
  /* Segment C — Big-tier seeds (reuse Mystery + Trial + Bureaucracy with dry voice) */
  { id:'official_inquiry',tiers:['big'], recipe:'bureaucracy', requiredSlots:['companion','visitor','object','job'] },
  { id:'noble_dispute',   tiers:['big'], recipe:'trial',       requiredSlots:['companion','visitor','rule'] },
  { id:'cryptic_case',    tiers:['big'], recipe:'mystery',     requiredSlots:['companion','visitor','object'] },
  /* Tween-tier seeds (social embarrassment + mystery with internet voice) */
  { id:'group_chat_chaos',tiers:['tween'], recipe:'social_embarrassment', requiredSlots:['companion','visitor','place'] },
  { id:'wrong_post',      tiers:['tween'], recipe:'social_embarrassment', requiredSlots:['companion','visitor','object'] },
  { id:'mall_quest',      tiers:['tween'], recipe:'quest',     requiredSlots:['companion','visitor','place','food'] },
  { id:'school_mystery',  tiers:['tween'], recipe:'mystery',   requiredSlots:['companion','visitor','place'] },
  /* Segment D — Tot seeds (gentle loops with strong repetition) */
  { id:'tot_meet_friend', tiers:['tot'], recipe:'tot_loop', requiredSlots:['companion','sound'] },
  { id:'tot_silly_snack', tiers:['tot'], recipe:'tot_loop', requiredSlots:['companion','food'] },
  { id:'tot_at_park',     tiers:['tot'], recipe:'tot_loop', requiredSlots:['companion','place'] },
  /* Segment D — Little seeds (gentle quest with no irony) */
  { id:'little_visit',    tiers:['little'], recipe:'gentle_quest', requiredSlots:['companion','place','food'] },
  { id:'little_silly_pet',tiers:['little'], recipe:'gentle_quest', requiredSlots:['companion','sound'] },
  { id:'little_lost_thing',tiers:['little'], recipe:'gentle_quest', requiredSlots:['companion','object','place'] },
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
  /* Segment B — 4 more recipes (5 total). Each is a distinct story shape with different beat
     sequence, giving real shape variety beyond the Quest pattern. */
  mystery: {
    // strange clue → suspect → false solution → real culprit → cozy resolution
    id: 'mystery',
    beats: ['strange_clue', 'suspect', 'false_solution', 'culprit', 'bedtime_landing'],
  },
  trial: {
    // rule broken → judge appears → silly evidence → verdict → snack
    id: 'trial',
    beats: ['rule_setup', 'judge_arrives', 'silly_evidence', 'verdict', 'bedtime_landing'],
  },
  performance: {
    // practice → disaster → improvisation → applause → sleepy closer
    id: 'performance',
    beats: ['practice', 'disaster', 'improvisation', 'applause', 'bedtime_landing'],
  },
  bureaucracy: {
    // form/clipboard → impossible rule → loophole → stamp → absurd compliance
    id: 'bureaucracy',
    beats: ['paperwork', 'impossible_rule', 'loophole', 'stamp', 'bedtime_landing'],
  },
  /* Segment C — tween-targeted recipe */
  social_embarrassment: {
    // setup → mistake → witnesses → spiral → tiny redemption
    id: 'social_embarrassment',
    beats: ['ordinary_setup', 'public_mistake', 'witnesses', 'spiral', 'bedtime_landing'],
  },
  /* Segment D — tot recipe. Very short loop with strong repetition. */
  tot_loop: {
    // hello → silly thing → silly repeat → cozy goodbye
    id: 'tot_loop',
    beats: ['tot_intro', 'tot_silly_meet', 'tot_silly_repeat', 'tot_cozy_end'],
  },
  /* Segment D — little recipe. Gentle quest with no irony. */
  gentle_quest: {
    // start → companion arrives → tiny silly problem → cozy end
    id: 'gentle_quest',
    beats: ['little_intro', 'little_companion', 'little_silly_event', 'little_cozy_end'],
  },
  /* v2.3.0 — THE CAUSALITY SPINE (per LLM Council root-cause fix).
     Every beat references the goal AND a user-picked slot. Chosen words are
     load-bearing: pet/visitor creates the OBSTACLE, food/object/move RESOLVES it.
     Used for kid/big/tween where the kid is old enough to track a goal.
     tot + little keep their existing simpler recipes. */
  /* v2.4.0 — every blueprint now has a PUNCHLINE beat between climax and bedtime.
     Council prescription for "make it funny": physical-absurd / loud / scale-violation
     punchlines, NOT deadpan. The joke's second beat fires here. Kid/big/tween stories
     are now 6 paragraphs (council target). Tot + little keep their 4-paragraph shapes. */
  goal_spine: {
    id: 'goal_spine',
    beats: ['goal_stated', 'goal_obstacle', 'kid_decides', 'goal_resolved', 'punchline', 'bedtime_landing'],
  },
  lost_snack: {
    id: 'lost_snack',
    beats: ['snack_missing', 'wrong_suspect', 'kid_investigates', 'true_culprit', 'punchline', 'bedtime_landing'],
  },
  show_wrong: {
    id: 'show_wrong',
    beats: ['show_setup', 'show_disaster', 'kid_improvises', 'show_triumph', 'punchline', 'bedtime_landing'],
  },
  rule_loophole: {
    id: 'rule_loophole',
    beats: ['rule_imposed', 'rule_blocks', 'kid_finds_loophole', 'loophole_works', 'punchline', 'bedtime_landing'],
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
  { id:'a1', beatType:'arrival', tiers:['kid','big'], requiredSlots:['kid','companion','place'],
    lines: [
      '{kid.name} and {companion.articleText} headed straight to the {place.text}. Something felt off about today. {companion.TheText} kept sniffing the air {adverb.text}.',
    ] },
  { id:'a2', beatType:'arrival', tiers:['kid','big'], requiredSlots:['kid','companion','sound'],
    lines: [
      '{kid.name} woke up to a {sound.text}. Just one. Then {companion.articleText} popped its head in and said, "Yeah. I heard it too."',
    ] },
  { id:'a3', beatType:'arrival', tiers:['kid','big'], requiredSlots:['kid','companion','object'],
    lines: [
      'There was {object.articleText} on the kitchen table. {kid.name} had not put it there. {companion.TheText} stared at it suspiciously.',
    ] },

  /* HELPER — companion or sidekick contributes a plan / theory */
  { id:'h1', beatType:'helper', tiers:['kid','big'], requiredSlots:['companion','number'],
    lines: [
      '"I have a plan," said {companion.theText}. The plan involved {number.text} steps. {kid.name} only understood three of them.',
    ] },
  { id:'h2', beatType:'helper', tiers:['kid','big'], requiredSlots:['companion','adverb'],
    lines: [
      '{companion.TheText} nodded {adverb.text}. "Trust me," it said. {kid.name} did not, but also did not have a better plan.',
    ] },
  { id:'h3', beatType:'helper', tiers:['kid','big'], requiredSlots:['sidekick','companion'],
    lines: [
      '{sidekick.cap} arrived with a notebook. "Step one," they announced. "Find {companion.articleText}." {companion.TheText} was already there. "Oh," said {sidekick.lc}. "Step one: done."',
    ] },

  /* OBSTACLE — a visitor / a problem complicates things */
  { id:'o1', beatType:'obstacle', tiers:['kid','big'], requiredSlots:['kid','visitor','object'],
    lines: [
      '{visitor.articleText} appeared out of nowhere holding {object.articleText}. "I have terms," {visitor.theText} announced. {kid.name} had not agreed to any terms.',
    ] },
  { id:'o2', beatType:'obstacle', tiers:['kid','big'], requiredSlots:['kid','visitor','rule'],
    lines: [
      '{visitor.TheText} blocked the way. "You know the rule," it said. "{rule.text}." {kid.name} did not know that rule. {kid.name} had broken it on purpose anyway.',
    ] },
  { id:'o3', beatType:'obstacle', tiers:['kid','big'], requiredSlots:['kid','visitor','sound','adverb'],
    lines: [
      '"{sound.text}!" said {visitor.theText} {adverb.text}. {kid.name} stopped. That was the loudest "{sound.text}" {kid.name} had ever heard.',
    ] },

  /* DISCOVERY — the twist / weird prize */
  { id:'d1', beatType:'discovery', tiers:['kid','big'], requiredSlots:['kid','object','liquid'],
    lines: [
      'Inside {object.articleText}: {liquid.text}. {kid.name} did not ask why. Nobody answered anyway.',
    ] },
  { id:'d2', beatType:'discovery', tiers:['kid','big'], requiredSlots:['companion','number','food'],
    lines: [
      'It turned out there were {number.text} {food.plural} hidden under the rug the whole time. {companion.TheText} looked guilty.',
    ] },
  { id:'d3', beatType:'discovery', tiers:['kid','big'], requiredSlots:['kid','job'],
    lines: [
      'A small certificate appeared. It announced {kid.name} as the new {job.text}. {kid.name} had not applied for this. The certificate was very official anyway.',
    ] },

  /* BEDTIME LANDING — cozy resolution (universal across all recipes) */
  { id:'b1', beatType:'bedtime_landing', tiers:['kid','big'], requiredSlots:['kid','companion','food'],
    lines: [
      'By bedtime, everyone was fed. {kid.name} ate {food.articleText}. {companion.TheText} had three. Nobody asked questions.',
    ] },
  { id:'b2', beatType:'bedtime_landing', tiers:['kid','big'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} climbed into bed. {companion.TheText} curled up at the foot. Tomorrow, probably, more nonsense. Tonight, just sleep.',
    ] },
  { id:'b3', beatType:'bedtime_landing', tiers:['kid','big'], requiredSlots:['kid','sound'],
    lines: [
      'The last thing {kid.name} heard before falling asleep was a tiny, distant "{sound.text}." {kid.name} smiled. Goodnight.',
    ] },
  { id:'b4', beatType:'bedtime_landing', tiers:['kid','big'], requiredSlots:['kid','companion','place'],
    lines: [
      '{kid.name} and {companion.theText} walked back from the {place.text} in comfortable silence. Today had been a lot. Tomorrow could wait.',
    ] },
  { id:'b5', beatType:'bedtime_landing', tiers:['kid','big'], requiredSlots:['kid','companion','object'],
    lines: [
      'On the way home, {kid.name} tucked {object.articleText} into a pocket for safekeeping. {companion.TheText} approved.',
    ] },
  /* v2.6.2 — anytime variants for kid/big bedtime_landing. Mode-tagged so they only
     fire when picks.storyMode === 'anytime'. No sleep imagery; close on a walking-home
     or what's-next note instead. */
  { id:'b_any1', beatType:'bedtime_landing', tiers:['kid','big'], mode:'anytime', requiredSlots:['kid','companion','food'],
    lines: [
      'Back at home base, {kid.name} ate {food.articleText} and rated the day a solid win. {companion.TheText} agreed without saying anything. Onto the next thing.',
    ] },
  { id:'b_any2', beatType:'bedtime_landing', tiers:['kid','big'], mode:'anytime', requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} stretched, grinned at {companion.theText}, and started thinking about what to do next. The {companion.text} was already three moves ahead.',
    ] },
  { id:'b_any3', beatType:'bedtime_landing', tiers:['kid','big'], mode:'anytime', requiredSlots:['kid','companion','place'],
    lines: [
      '{kid.name} and {companion.theText} headed back from the {place.text} replaying the best bits. Tomorrow would have to be impressive to top this. {companion.cap} thought it could.',
    ] },
  { id:'b_any4', beatType:'bedtime_landing', tiers:['kid','big'], mode:'anytime', requiredSlots:['kid','companion','sound'],
    lines: [
      'Walking back, {kid.name} kept hearing a tiny "{sound.text}" in their head. {companion.cap} heard it too. They grinned. Best day so far.',
    ] },

  /* ============================================================
     Segment B — Mystery recipe beats
     ============================================================ */
  { id:'m_clue1', beatType:'strange_clue', tiers:['kid','big'], requiredSlots:['kid','object','companion'],
    lines: [
      '{kid.name} found {object.articleText} where it absolutely should not be. {companion.TheText} sniffed it suspiciously.',
    ] },
  { id:'m_clue2', beatType:'strange_clue', tiers:['kid','big'], requiredSlots:['kid','place','sound'],
    lines: [
      'Something strange was happening at the {place.text}. A faint "{sound.text}" kept coming from the corner. Nobody could find the source.',
    ] },
  { id:'m_suspect1', beatType:'suspect', tiers:['kid','big'], requiredSlots:['kid','visitor','adverb'],
    lines: [
      '{visitor.TheText} was loitering nearby, eyeing the scene {adverb.text}. {kid.name} narrowed their eyes.',
    ] },
  { id:'m_suspect2', beatType:'suspect', tiers:['kid','big'], requiredSlots:['companion','visitor'],
    lines: [
      '"It was {visitor.theText}," whispered {companion.theText}. "I have a feeling. A strong feeling."',
    ] },
  { id:'m_false1', beatType:'false_solution', tiers:['kid','big'], requiredSlots:['kid','visitor','number'],
    lines: [
      '{kid.name} accused {visitor.theText} loudly. {visitor.TheText} produced {number.text} alibis. All of them were extremely fake. But somehow they worked.',
    ] },
  { id:'m_false2', beatType:'false_solution', tiers:['kid','big'], requiredSlots:['companion','adverb'],
    lines: [
      '{companion.TheText} nodded {adverb.text}. "Wait. That cannot be right." Everyone paused. {companion.TheText} was, as usual, correct.',
    ] },
  { id:'m_culprit1', beatType:'culprit', tiers:['kid','big'], requiredSlots:['kid','companion','food'],
    lines: [
      'Turns out it was {companion.theText} all along. {companion.TheText} had hidden the {food.text} for emergency snack purposes. {kid.name} sighed.',
    ] },
  { id:'m_culprit2', beatType:'culprit', tiers:['kid','big'], requiredSlots:['kid','object','liquid'],
    lines: [
      'The real culprit: {object.articleText} full of {liquid.text}. Nobody had put it there. Nobody had asked for it. It was just there.',
    ] },

  /* ============================================================
     Segment B — Trial recipe beats
     ============================================================ */
  { id:'t_rule1', beatType:'rule_setup', tiers:['kid','big'], requiredSlots:['kid','rule'],
    lines: [
      'Everyone knew the rule: "{rule.text}." {kid.name} knew it. The neighbors knew it. The neighbors\' pets knew it. It was a famous rule.',
    ] },
  { id:'t_rule2', beatType:'rule_setup', tiers:['kid','big'], requiredSlots:['kid','rule','companion'],
    lines: [
      'Today, {kid.name} broke the rule. "{rule.text}" — broken. On purpose. {companion.TheText} stared. This was new territory.',
    ] },
  { id:'t_judge1', beatType:'judge_arrives', tiers:['kid','big'], requiredSlots:['visitor','object'],
    lines: [
      '{visitor.TheText} appeared holding {object.articleText}. "I am here to judge," {visitor.theText} announced. Nobody had requested a judge.',
    ] },
  { id:'t_judge2', beatType:'judge_arrives', tiers:['kid','big'], requiredSlots:['visitor','adverb'],
    lines: [
      'A gavel banged {adverb.text}. {visitor.TheText} entered the room as if everyone had been waiting. "Court is in session," {visitor.theText} said.',
    ] },
  { id:'t_evidence1', beatType:'silly_evidence', tiers:['kid','big'], requiredSlots:['kid','number','food'],
    lines: [
      'Exhibit A: {number.text} {food.plural}. Exhibit B: a feather. Exhibit C: another feather. The case was, technically, ridiculous.',
    ] },
  { id:'t_evidence2', beatType:'silly_evidence', tiers:['kid','big'], requiredSlots:['companion','object'],
    lines: [
      '{companion.TheText} produced {object.articleText} as evidence. Nobody knew what it proved. {companion.TheText} did not elaborate.',
    ] },
  { id:'t_verdict1', beatType:'verdict', tiers:['kid','big'], requiredSlots:['kid','visitor','job'],
    lines: [
      '{visitor.TheText} declared {kid.name} the new {job.text}. This was the most surprising verdict possible. {kid.name} accepted it anyway.',
    ] },
  { id:'t_verdict2', beatType:'verdict', tiers:['kid','big'], requiredSlots:['kid','food'],
    lines: [
      'The court ruled in favor of snacks. {kid.name} was sentenced to eat {food.articleText}. Justice was served. So were the {food.plural}.',
    ] },

  /* ============================================================
     Segment B — Performance recipe beats
     ============================================================ */
  { id:'p_practice1', beatType:'practice', tiers:['kid','big'], requiredSlots:['kid','companion','adverb'],
    lines: [
      '{kid.name} and {companion.theText} practiced {adverb.text}. The act was almost ready. Almost.',
    ] },
  { id:'p_practice2', beatType:'practice', tiers:['kid','big'], requiredSlots:['kid','sound','companion'],
    lines: [
      'Step one: yell "{sound.text}". Step two: spin. Step three: bow. {kid.name} rehearsed all three. {companion.TheText} offered notes.',
    ] },
  { id:'p_disaster1', beatType:'disaster', tiers:['kid','big'], requiredSlots:['kid','object'],
    lines: [
      'Then everything went wrong. {object.TheText} fell. The lights flickered. {kid.name} froze. The audience leaned forward.',
    ] },
  { id:'p_disaster2', beatType:'disaster', tiers:['kid','big'], requiredSlots:['companion','sound'],
    lines: [
      'Three seconds in, {companion.theText} let out a confused "{sound.text}." This was not in the script. There was no script.',
    ] },
  { id:'p_improv1', beatType:'improvisation', tiers:['kid','big'], requiredSlots:['kid','adverb','companion'],
    lines: [
      '{kid.name} improvised {adverb.text}. {companion.TheText} followed along, mostly. It was beautiful. It was also wrong.',
    ] },
  { id:'p_improv2', beatType:'improvisation', tiers:['kid','big'], requiredSlots:['kid','sound'],
    lines: [
      '{kid.name} yelled "{sound.text}!" four more times for good measure. The audience interpreted this as art.',
    ] },
  { id:'p_applause1', beatType:'applause', tiers:['kid','big'], requiredSlots:['kid','visitor','number'],
    lines: [
      'The applause was thunderous. {visitor.TheText} demanded {number.text} encores. {kid.name} did one. The visitor pretended it counted as all of them.',
    ] },
  { id:'p_applause2', beatType:'applause', tiers:['kid','big'], requiredSlots:['kid','companion'],
    lines: [
      'Standing ovation. {kid.name} bowed. {companion.TheText} bowed too, several times. Some bows were sincere. Some were just for show.',
    ] },

  /* ============================================================
     Segment B — Bureaucracy recipe beats
     ============================================================ */
  { id:'bu_paper1', beatType:'paperwork', tiers:['kid','big'], requiredSlots:['kid','visitor','object'],
    lines: [
      '{visitor.TheText} arrived with {object.articleText} and a stack of paperwork. "Sign here. And here. And especially here," {visitor.theText} said.',
    ] },
  { id:'bu_paper2', beatType:'paperwork', tiers:['kid','big'], requiredSlots:['kid','number','object'],
    lines: [
      'The form was {number.text} pages long. It demanded {object.articleText}. {kid.name} did not have one. The form did not care.',
    ] },
  { id:'bu_rule1', beatType:'impossible_rule', tiers:['kid','big'], requiredSlots:['visitor','rule'],
    lines: [
      '"Rule seventeen-B," announced {visitor.theText}. "{rule.text}." It was an old rule. Nobody remembered who made it. The rule did not care.',
    ] },
  { id:'bu_rule2', beatType:'impossible_rule', tiers:['kid','big'], requiredSlots:['kid','rule','companion'],
    lines: [
      'The official rule was: "{rule.text}." {kid.name} did not understand. Neither did {companion.theText}. Neither did anyone, probably.',
    ] },
  { id:'bu_loop1', beatType:'loophole', tiers:['kid','big'], requiredSlots:['kid','companion','adverb'],
    lines: [
      '{kid.name} and {companion.theText} found a loophole. They walked through it {adverb.text}. {visitor.TheText} was furious. Or possibly impressed. Hard to tell.',
    ] },
  { id:'bu_loop2', beatType:'loophole', tiers:['kid','big'], requiredSlots:['kid','object'],
    lines: [
      'Subsection 4 of paragraph 12 mentioned {object.articleText}. {kid.name} produced one. The room fell silent. This had not been anticipated.',
    ] },
  { id:'bu_stamp1', beatType:'stamp', tiers:['kid','big'], requiredSlots:['kid','visitor','job'],
    lines: [
      'A stamp came down. THUNK. {kid.name} was now officially the new {job.text}. {visitor.TheText} did not look pleased. The stamp had spoken.',
    ] },
  { id:'bu_stamp2', beatType:'stamp', tiers:['kid','big'], requiredSlots:['kid','food'],
    lines: [
      'Approved. With conditions. The conditions involved {food.text}. {kid.name} agreed to all of them. The paperwork was filed in triplicate.',
    ] },

  /* ============================================================
     Segment C — Tween (ages 11-13) beat library
     Voice: deadpan, internet-flavored, social embarrassment, school
     pressure, group chats, "nobody asked," "it was a vibe."
     ============================================================ */

  /* ORDINARY SETUP — innocuous opening for social_embarrassment */
  { id:'tw_setup1', beatType:'ordinary_setup', tiers:['tween'], requiredSlots:['kid','place'],
    lines: [
      'It was a normal Tuesday. {kid.name} was at the {place.text}. Nothing was supposed to happen. Nothing ever does, usually. Today: different.',
    ] },
  { id:'tw_setup2', beatType:'ordinary_setup', tiers:['tween'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} was, by all reasonable definitions, minding their own business. {companion.TheText} was nearby, doing whatever {companion.text}s do. Then it began.',
    ] },
  { id:'tw_setup3', beatType:'ordinary_setup', tiers:['tween'], requiredSlots:['kid','object'],
    lines: [
      '{kid.name} was holding {object.articleText}. This was, retrospectively, a mistake. At the time, it seemed fine.',
    ] },

  /* PUBLIC MISTAKE — the embarrassing thing */
  { id:'tw_mistake1', beatType:'public_mistake', tiers:['tween'], requiredSlots:['kid','sound'],
    lines: [
      '{kid.name} yelled "{sound.text}" at full volume. In a quiet place. In front of everyone. It echoed. It kept echoing.',
    ] },
  { id:'tw_mistake2', beatType:'public_mistake', tiers:['tween'], requiredSlots:['kid','visitor'],
    lines: [
      '{kid.name} tripped. Not a regular trip. The kind of trip that becomes a story. {visitor.TheText} watched the whole thing.',
    ] },
  { id:'tw_mistake3', beatType:'public_mistake', tiers:['tween'], requiredSlots:['kid','object'],
    lines: [
      'And then {object.theText} went flying. In slow motion. Multiple witnesses confirmed this later. There was, regrettably, a clear arc.',
    ] },

  /* WITNESSES — the audience reacts */
  { id:'tw_witness1', beatType:'witnesses', tiers:['tween'], requiredSlots:['kid','number'],
    lines: [
      'Approximately {number.text} people were there. All of them saw. None of them looked away. {kid.name} considered moving to a new town.',
    ] },
  { id:'tw_witness2', beatType:'witnesses', tiers:['tween'], requiredSlots:['visitor','adverb'],
    lines: [
      '{visitor.TheText} took out their phone {adverb.text}. This was now documentation. There would, inevitably, be a group chat.',
    ] },
  { id:'tw_witness3', beatType:'witnesses', tiers:['tween'], requiredSlots:['kid'],
    lines: [
      'The silence afterward had weight. It was that specific kind of quiet that exists only after a public mistake. {kid.name} could hear their own heartbeat.',
    ] },

  /* SPIRAL — overthinking, escalation */
  { id:'tw_spiral1', beatType:'spiral', tiers:['tween'], requiredSlots:['kid','number'],
    lines: [
      'For approximately {number.text} hours, {kid.name} thought about it. Then thought about it some more. Then composed seven different texts and sent none.',
    ] },
  { id:'tw_spiral2', beatType:'spiral', tiers:['tween'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} explained the whole thing to {companion.theText} in detail. {companion.TheText} blinked. {companion.TheText} did not, in any meaningful sense, care. This was somehow worse.',
    ] },
  { id:'tw_spiral3', beatType:'spiral', tiers:['tween'], requiredSlots:['kid','visitor'],
    lines: [
      'By bedtime, {kid.name} had constructed an entire imaginary conversation with {visitor.theText}. None of it had happened. All of it was now canon.',
    ] },

  /* BEDTIME LANDING — tween-flavored, more deadpan */
  { id:'tw_bed1', beatType:'bedtime_landing', tiers:['tween'], requiredSlots:['kid'],
    lines: [
      'In the morning, nobody mentioned it. Nobody. Not once. This was, somehow, more suspicious. {kid.name} chose to accept the silence.',
    ] },
  { id:'tw_bed2', beatType:'bedtime_landing', tiers:['tween'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} pulled the blanket over their head. {companion.TheText} settled on top. Tomorrow was tomorrow. Tonight was officially over.',
    ] },
  { id:'tw_bed3', beatType:'bedtime_landing', tiers:['tween'], requiredSlots:['kid','sound'],
    lines: [
      'One last group chat ping: "{sound.text}." Cryptic. Unprompted. Iconic. {kid.name} did not respond. {kid.name} fell asleep instead.',
    ] },
  /* v2.6.2 — anytime variants for tween. No sleep references; deadpan day-ending vibe. */
  { id:'tw_bed_any1', beatType:'bedtime_landing', tiers:['tween'], mode:'anytime', requiredSlots:['kid'],
    lines: [
      'On the walk home {kid.name} mentally drafted three different ways to retell this. None of them would be quite accurate. All of them would be funnier than the original.',
    ] },
  { id:'tw_bed_any2', beatType:'bedtime_landing', tiers:['tween'], mode:'anytime', requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} and {companion.theText} walked back debriefing the entire incident. The retelling was already 40% embellished. By next week it would be canon.',
    ] },
  { id:'tw_bed_any3', beatType:'bedtime_landing', tiers:['tween'], mode:'anytime', requiredSlots:['kid','sound'],
    lines: [
      'On the way back, the group chat pinged: "{sound.text}." Cryptic. Unprompted. Iconic. {kid.name} did not respond. {kid.name} screenshotted it for later.',
    ] },

  /* Extra tween-flavored beats for OTHER recipes (mystery + quest), tagged tween-only */
  { id:'tw_clue1', beatType:'strange_clue', tiers:['tween'], requiredSlots:['kid','object','place'],
    lines: [
      '{object.TheText} was sitting on a bench at the {place.text}. Nobody had put it there. Nobody was claiming it. It had, somehow, vibes.',
    ] },
  { id:'tw_obstacle1', beatType:'obstacle', tiers:['tween'], requiredSlots:['kid','visitor','adverb'],
    lines: [
      '{visitor.TheText} appeared {adverb.text} and asked a question {kid.name} had absolutely no answer to. There was no easy way out of this conversation.',
    ] },
  { id:'tw_helper1', beatType:'helper', tiers:['tween'], requiredSlots:['kid','companion'],
    lines: [
      '{companion.TheText} offered advice in the form of a single, ambiguous shrug. {kid.name} interpreted it as encouragement. It probably was not.',
    ] },

  /* Tween Quest beats — completes the recipe so mall_quest seed generates reliably */
  { id:'tw_arrival1', beatType:'arrival', tiers:['tween'], requiredSlots:['kid','companion','place'],
    lines: [
      '{kid.name} and {companion.theText} ended up at the {place.text}. Not on purpose. Not really an accident either. The boundary was, like, blurry.',
    ] },
  { id:'tw_arrival2', beatType:'arrival', tiers:['tween'], requiredSlots:['kid','sound','companion'],
    lines: [
      'Three blocks from home, {kid.name} heard a distinct "{sound.text}." {companion.TheText} heard it too. The day was now, technically, an adventure.',
    ] },
  { id:'tw_discovery1', beatType:'discovery', tiers:['tween'], requiredSlots:['kid','object','liquid'],
    lines: [
      '{object.TheText} contained {liquid.text}. Nobody explained. {kid.name} accepted this on principle.',
    ] },
  { id:'tw_discovery2', beatType:'discovery', tiers:['tween'], requiredSlots:['kid','number','food'],
    lines: [
      'Behind the dumpster were {number.text} {food.plural}. Just sitting there. {kid.name} did not eat them. {kid.name} did not not eat them either.',
    ] },

  /* Tween Mystery beats — completes the recipe for school_mystery seed */
  { id:'tw_suspect1', beatType:'suspect', tiers:['tween'], requiredSlots:['kid','visitor'],
    lines: [
      '{visitor.TheText} had a complicated look on their face. {kid.name} could not parse it. The look kept happening anyway.',
    ] },
  { id:'tw_false1', beatType:'false_solution', tiers:['tween'], requiredSlots:['kid','companion','adverb'],
    lines: [
      '{kid.name} arrived at a confident conclusion. {companion.TheText} stared {adverb.text}. The conclusion was, in retrospect, very wrong.',
    ] },
  { id:'tw_culprit1', beatType:'culprit', tiers:['tween'], requiredSlots:['kid','visitor','object'],
    lines: [
      'It was {visitor.theText}. Of course it was. {visitor.TheText} had been holding {object.articleText} the whole time. {kid.name} sighed at the sky.',
    ] },

  /* ============================================================
     Segment D — Tot (ages 2-3) beat library
     Voice: very short sentences, repetition, gentle reversal,
     soft sounds. No irony, no long words.
     ============================================================ */

  /* TOT INTRO — meet the character */
  { id:'to_intro1', beatType:'tot_intro', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      'Hi! {kid.name} met {companion.articleText}. The {companion.text} said hi. {kid.name} said hi back.',
    ] },
  /* v2.8.0 — rewrote from passive ("Cole heard a sound") to action-first
     ("Cole spotted... ran right over") to lift tot kid-agency. */
  { id:'to_intro2', beatType:'tot_intro', tiers:['tot'], requiredSlots:['kid','companion','sound'],
    lines: [
      '{kid.name} spotted {companion.articleText} across the room. {kid.cap} ran right over. "{sound.text}!" said {kid.name}. The {companion.text} said "{sound.text}!" back.',
    ] },

  /* TOT SILLY MEET — silly little event
     v2.1.0: sound usage capped at 1 per beat (defect 9 fix — total per story ≤3) */
  { id:'to_silly1', beatType:'tot_silly_meet', tiers:['tot'], requiredSlots:['companion','sound'],
    lines: [
      'The {companion.text} said "{sound.text}!" That is a funny noise. Hee hee.',
    ] },
  { id:'to_silly2', beatType:'tot_silly_meet', tiers:['tot'], requiredSlots:['companion','food'],
    lines: [
      'The {companion.text} had {food.articleText}. The {companion.text} ate {food.articleText}. The {companion.text} ate all of it. Oh no!',
    ] },

  /* TOT SILLY REPEAT — call-and-response (sound used at most twice in this beat) */
  { id:'to_repeat1', beatType:'tot_silly_repeat', tiers:['tot'], requiredSlots:['kid','companion','sound'],
    lines: [
      'Then {kid.name} said "{sound.text}!" too. So did the {companion.text}. Everybody laughed.',
    ] },
  { id:'to_repeat2', beatType:'tot_silly_repeat', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} did a little dance. The {companion.text} did a little dance too. So did a tiny bug. Everyone danced. Hee hee.',
    ] },

  /* TOT COZY END */
  { id:'to_end1', beatType:'tot_cozy_end', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      'Now {kid.name} is sleepy. The {companion.text} is sleepy too. Good night, {companion.text}. Good night, {kid.name}.',
    ] },
  { id:'to_end2', beatType:'tot_cozy_end', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      'Time for a hug. A big hug. Then a little nap. Goodnight!',
    ] },
  /* v2.6.2 — tot anytime cozy_end variants. Mode-tagged so the bedtime defaults
     above still fire when storyMode is 'bedtime' (the default). Anytime variants
     swap sleep imagery for walking home / waving / coming back later. */
  { id:'to_end_any1', beatType:'tot_cozy_end', tiers:['tot'], mode:'anytime', requiredSlots:['kid','companion'],
    lines: [
      'Then {kid.name} waved bye. The {companion.text} waved too. Bye bye! See you soon!',
    ] },
  { id:'to_end_any2', beatType:'tot_cozy_end', tiers:['tot'], mode:'anytime', requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} hugged the {companion.text} one more time. "Come back tomorrow?" said {kid.name}. The {companion.text} nodded. Yay!',
    ] },

  /* v2.5.0 — tot sky-aware variants. One per beat type so picking a sky word
     (moon/kite/balloon/star/etc.) means the chosen thing actually shows up in the
     little story. Language stays very simple — short sentences, repetition, no irony. */
  { id:'to_intro_sky', beatType:'tot_intro', tiers:['tot'], requiredSlots:['kid','sky'],
    lines: [
      '{kid.name} looked up. There was a {sky.text}! Hi, {sky.text}!',
      '{kid.name} saw the {sky.text}. The {sky.text} was right there. "Hi {sky.text}!" said {kid.name}.',
    ] },
  { id:'to_silly_sky', beatType:'tot_silly_meet', tiers:['tot'], requiredSlots:['companion','sky'],
    lines: [
      'The {companion.text} waved at the {sky.text}. Hello {sky.text}! Hello!',
      'The {companion.text} pointed at the {sky.text}. The {sky.text} was up high. Way up.',
    ] },
  /* v2.9.1 — second variant previously rendered '"snowflake!" said Cole' (lowercase).
     Switched the exclamation tokens to {sky.cap} so the sky word is sentence-cased
     when it's the only word inside the quote. */
  { id:'to_repeat_sky', beatType:'tot_silly_repeat', tiers:['tot'], requiredSlots:['kid','companion','sky'],
    lines: [
      '{kid.name} waved at the {sky.text}. The {companion.text} waved too. The {sky.text} just smiled.',
      '"{sky.cap}!" said {kid.name}. "{sky.cap}!" said the {companion.text}. The {sky.text} stayed put. So pretty.',
    ] },
  { id:'to_end_sky', beatType:'tot_cozy_end', tiers:['tot'], requiredSlots:['kid','sky'],
    lines: [
      'Goodnight, {sky.text}. Goodnight, {kid.name}. Sweet dreams.',
      'The {sky.text} watched {kid.name} fall asleep. The {sky.text} stayed up all night. Just to keep watch.',
    ] },

  /* v2.8.0 — KID-AGENCY action beats for tot tier. Cole is the subject of an
     action verb (spotted, picked up, grabbed, decided, led, pointed, built).
     v2.7.1 UAT flagged tot agency at 2.2/5 because Cole was usually the
     observer ("Cole giggled / Cole heard / Cole loves"). These beats shift
     the random pool so the action-verb ratio across 100 stories clears 0.65. */
  { id:'to_intro_action_1', beatType:'tot_intro', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} ran outside. {kid.cap} spotted {companion.articleText} right away. "Come on!" said {kid.name}. {kid.cap} led the way.',
    ] },
  { id:'to_intro_action_sky', beatType:'tot_intro', tiers:['tot'], requiredSlots:['kid','sky','companion'],
    lines: [
      '{kid.name} pointed up. "Look! A {sky.text}!" The {companion.text} looked too. {kid.cap} found it first.',
    ] },
  { id:'to_silly_action_1', beatType:'tot_silly_meet', tiers:['tot'], requiredSlots:['kid','companion','food'],
    lines: [
      '{kid.name} picked up {food.articleText}. {kid.cap} held it up high. "For you!" said {kid.name}. The {companion.text} took a tiny bite.',
    ] },
  { id:'to_silly_action_2', beatType:'tot_silly_meet', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} grabbed the {companion.text}\'s paw. They jumped together. One. Two. Three. Hee hee!',
    ] },
  { id:'to_repeat_action_1', beatType:'tot_silly_repeat', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} pulled out a tiny hat. {kid.cap} put it on the {companion.text}. The {companion.text} kept it on. Yay!',
    ] },
  { id:'to_repeat_action_sound', beatType:'tot_silly_repeat', tiers:['tot'], requiredSlots:['kid','companion','sound'],
    lines: [
      '{kid.name} clapped and said "{sound.text}!" {kid.cap} clapped harder. "{sound.text}!" The {companion.text} joined in.',
    ] },
  { id:'to_end_action_1', beatType:'tot_cozy_end', tiers:['tot'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} picked up the {companion.text} for a hug. "Night, {companion.text}," said {kid.name}. Then {kid.name} curled up. Goodnight.',
    ] },

  /* ============================================================
     Segment D — Little (ages 4-5) beat library
     Voice: tiny jobs, confused animals, weather nonsense, gentle.
     Slightly more structure than tot, but no irony.
     ============================================================ */

  /* v2.4.2 — cast introductions: P1 names the companion alongside the kid so it
     doesn't pop in cold in P2. Old kid+place-only intros are kept as fallback for
     companion-less stories, gated to NOT require companion. */
  { id:'li_intro1', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','place','companion'],
    lines: [
      'One sunny morning, {kid.name} headed to the {place.text} with {companion.articleText}. It was a perfect day for an adventure.',
      'One sunny morning, {kid.name} and {companion.articleText} headed to the {place.text}. It was a perfect day for an adventure.',
    ] },
  { id:'li_intro2', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','object','companion'],
    lines: [
      '{kid.name} and {companion.articleText} found {object.articleText} on the doorstep. What a surprise! What was it for?',
    ] },
  { id:'li_intro3', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','place','companion','food'],
    lines: [
      '{kid.name} packed {food.articleText} and brought {companion.articleText} along to the {place.text}. The day was just getting started.',
    ] },
  /* v2.4.7 — weather-aware intro. When the user picks a weather from the little
     weather round, the chosen weather word becomes part of the opening setup. */
  { id:'li_intro_weather', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','place','companion','weather'],
    lines: [
      'It was a {weather.text} morning. {kid.name} and {companion.articleText} headed to the {place.text} anyway. The {weather.text} weather just made things more interesting.',
      'The day at the {place.text} started off {weather.text}. {kid.name} did not mind. The {companion.text} did not mind. The {weather.text} day belonged to them.',
    ] },
  /* v2.4.2 — no place-only fallback. Companion slot is always populated in v2
     (pet pick is required by the wizard), so every little_intro must introduce
     the companion to avoid the phantom P2 entrance bug. If the eligibleFor
     filter returns empty due to a future schema change, generateStoryV2 returns
     null and the caller falls back to v1. */

  { id:'li_comp1', beatType:'little_companion', tiers:['little'], requiredSlots:['kid','companion'],
    lines: [
      'A friendly {companion.text} came to say hello. The {companion.text} had a tiny hat on. The hat was a little too big.',
    ] },
  /* v2.8.0 — rewrote from passive ("Cole giggled") to action-first
     ("Cole grabbed... clapped along") for little kid-agency. */
  { id:'li_comp2', beatType:'little_companion', tiers:['little'], requiredSlots:['kid','companion','sound'],
    lines: [
      '"{sound.text}!" said the {companion.text}. {kid.name} grabbed the {companion.text}\'s paw. "Again!" said {kid.name}. The {companion.text} said "{sound.text}!" louder. {kid.cap} clapped along.',
    ] },

  { id:'li_silly1', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','companion','food'],
    lines: [
      'The {companion.text} found {food.articleText}. They shared {food.articleText} together. The {companion.text} took the biggest bite. {kid.name} did not mind.',
    ] },
  { id:'li_silly2', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','companion','sound'],
    lines: [
      'Then the wind blew "{sound.text}!" right past their ears. The {companion.text} jumped. {kid.name} jumped higher. They both laughed.',
    ] },
  { id:'li_silly3', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','companion','object'],
    lines: [
      'The {companion.text} carried {object.articleText} very carefully. Then it dropped it. Oops! They picked it up together.',
    ] },
  /* v2.4.7 — weather-aware silly event. Picked when weather is in slots. */
  { id:'li_silly_weather', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','companion','weather'],
    lines: [
      'Then the {weather.text} weather got REALLY {weather.text}. {kid.name} laughed. The {companion.text} laughed too. They danced right in the middle of it.',
      'Suddenly it got even more {weather.text}. The {companion.text} did not know what to do. {kid.name} held the {companion.text}\'s paw. They were {weather.text} together.',
    ] },

  { id:'li_end1', beatType:'little_cozy_end', tiers:['little'], requiredSlots:['kid','companion'],
    lines: [
      'By the end of the day, {kid.name} and the {companion.text} were tired and happy. They hugged. Then they went to bed. Goodnight.',
    ] },
  { id:'li_end2', beatType:'little_cozy_end', tiers:['little'], requiredSlots:['kid','companion','food'],
    lines: [
      'They ate one last bite of {food.text}. The {companion.text} yawned. {kid.name} yawned too. Time to sleep.',
    ] },
  /* v2.6.2 — little anytime cozy_end variants. Fire when picks.storyMode === 'anytime'. */
  { id:'li_end_any1', beatType:'little_cozy_end', tiers:['little'], mode:'anytime', requiredSlots:['kid','companion'],
    lines: [
      'By the end of the day, {kid.name} and the {companion.text} were happy and ready for whatever came next. They high-fived and headed home. Good day!',
    ] },
  { id:'li_end_any2', beatType:'little_cozy_end', tiers:['little'], mode:'anytime', requiredSlots:['kid','companion','food'],
    lines: [
      'They each had one more bite of {food.text}. The {companion.text} grinned. {kid.name} grinned back. "Tomorrow?" "Tomorrow."',
    ] },

  /* v2.8.0 — KID-AGENCY action beats for little tier. Cole is the subject of
     an action verb (packed, grabbed, spotted, climbed, pulled, built). Targets
     the same agency gap surfaced at ages 2-5 in v2.7.1 UAT. New action beats
     coexist with the existing pool — random selection shifts toward action. */
  { id:'li_intro_action_1', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','companion','place','food'],
    lines: [
      '{kid.name} packed {food.articleText} into a tiny bag, called the {companion.text}, and headed for the {place.text}. {kid.cap} had a plan.',
    ] },
  { id:'li_intro_action_2', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','companion','place'],
    lines: [
      '{kid.name} grabbed {companion.articleText} by the paw and ran toward the {place.text}. The {companion.text} kept up. Barely.',
    ] },
  { id:'li_comp_action_1', beatType:'little_companion', tiers:['little'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} ran over to the {companion.text}. "Want to come?" said {kid.name}. The {companion.text} nodded. They were a team now.',
    ] },
  { id:'li_silly_action_1', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','companion','object'],
    lines: [
      '{kid.name} spotted {object.articleText} on the ground. {kid.cap} picked it up and held it like a treasure. "It\'s mine now," said {kid.name}. The {companion.text} bowed dramatically.',
    ] },
  { id:'li_silly_action_2', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','companion','creature'],
    lines: [
      '{kid.name} climbed onto a rock and pointed at the {creature.text}. "Hi!" said {kid.name}. The {creature.text} blinked. {kid.cap} climbed down and waved. Friendship achieved.',
    ] },
  /* v2.9.1 — `{kid.lc}'s pocket` rendered "cole's pocket" mid-sentence. Switched to
     `{kid.name}'s pocket` so the possessive uses the sentence-cased name. */
  { id:'li_silly_action_3', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','companion','food'],
    lines: [
      '{kid.name} pulled {food.articleText} out of {kid.name}\'s pocket. "Snack time," said {kid.name}. The {companion.text} agreed. So did a passing bug.',
    ] },
  { id:'li_end_action_1', beatType:'little_cozy_end', tiers:['little'], requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} built a tiny pillow fort and pulled the {companion.text} inside. "We made it," said {kid.name}. The {companion.text} yawned. Time to sleep.',
    ] },
  { id:'li_end_action_any_1', beatType:'little_cozy_end', tiers:['little'], mode:'anytime', requiredSlots:['kid','companion'],
    lines: [
      '{kid.name} grabbed the {companion.text}\'s paw. "Onto the next thing," said {kid.name}. They walked home together. Big plans for tomorrow.',
    ] },

  /* ============================================================
     v2.1.0 — SETTING ANCHOR BEATS (Story Setting Modes)
     When a non-"surprise" setting is locked, the engine REPLACES the
     normal first beat with one of these so the very first paragraph
     grounds the story in the chosen place. Tier-specific voice.
     ============================================================ */
  { id:'sa_tot1', beatType:'setting_anchor', tiers:['tot'], requiredSlots:['kid','place','companion'],
    lines: [
      'Today, {kid.name} went to the {place.text}! Hi, {place.text}! A {companion.text} was there too.',
    ] },
  { id:'sa_tot2', beatType:'setting_anchor', tiers:['tot'], requiredSlots:['kid','place'],
    lines: [
      '{kid.name} loves the {place.text}. Yay, {place.text}! Off we go!',
    ] },
  { id:'sa_little1', beatType:'setting_anchor', tiers:['little'], requiredSlots:['kid','place','companion'],
    lines: [
      'One sunny morning, {kid.name} and a {companion.text} headed to the {place.text}. It was going to be a great day. They could feel it.',
    ] },
  { id:'sa_little2', beatType:'setting_anchor', tiers:['little'], requiredSlots:['kid','place'],
    lines: [
      '{kid.name} got to the {place.text} early. Nobody else was there yet. The {place.text} felt extra big when it was empty.',
    ] },
  { id:'sa_kid1', beatType:'setting_anchor', tiers:['kid','big'], requiredSlots:['kid','place','companion'],
    lines: [
      '{kid.name} and a {companion.text} ended up at the {place.text}. Not on purpose, exactly. Not entirely by accident either.',
    ] },
  { id:'sa_kid2', beatType:'setting_anchor', tiers:['kid','big'], requiredSlots:['kid','place','sound'],
    lines: [
      'The {place.text} was supposed to be normal. Then "{sound.text}" came from somewhere near the back. {kid.name} froze.',
    ] },
  { id:'sa_kid3', beatType:'setting_anchor', tiers:['kid','big'], requiredSlots:['kid','place','object'],
    lines: [
      '{kid.name} walked into the {place.text} holding {object.articleText}. The {place.text} reacted. Not visibly. Spiritually.',
    ] },
  { id:'sa_tween1', beatType:'setting_anchor', tiers:['tween'], requiredSlots:['kid','place'],
    lines: [
      '{kid.name} ended up at the {place.text}, somehow. The vibes were, like, weirdly specific. {kid.name} chose to lean into it.',
    ] },
  { id:'sa_tween2', beatType:'setting_anchor', tiers:['tween'], requiredSlots:['kid','place','companion'],
    lines: [
      'The {place.text} hits different when you go with {companion.articleText}. {kid.name} did not have a reason for being there. The {companion.text} did not ask.',
    ] },

  /* ============================================================
     v2.2.1 — CHILD-AGENCY BEATS
     The prior beat pool sometimes left the kid as a passive observer
     while events happened around them. These beats put the kid in
     the verb seat: they decide, refuse, trade, notice, ask, try.
     Tier-tagged for kid + big + tween (active narrators); tot/little
     get simpler agency variants in their dedicated beat sequences.
     Each beat REQUIRES one or more user-picked slots (food, object,
     visitor, companion, color, mood) so they double as coverage carriers.
     ============================================================ */

  /* HELPER beats: kid actively decides / proposes */
  { id:'ag_h1', beatType:'helper', tiers:['kid','big'], requiredSlots:['kid','food'],
    lines: [
      '{kid.name} decided this called for {food.articleText}. {kid.name} reached into a pocket for {food.articleText} they had been saving.',
    ] },
  { id:'ag_h2', beatType:'helper', tiers:['kid','big'], requiredSlots:['kid','companion','object'],
    lines: [
      '{kid.name} thought about it for a minute, then said, "We need {object.articleText}." The {companion.text} agreed. {kid.cap} had a plan.',
    ] },
  { id:'ag_h3', beatType:'helper', tiers:['kid','big','tween'], requiredSlots:['kid','mood'],
    lines: [
      '{kid.name} was {mood.text} now, and {mood.text} {kid.name} solves problems faster.',
    ] },

  /* OBSTACLE beats: kid actively refuses / notices / asks */
  { id:'ag_o1', beatType:'obstacle', tiers:['kid','big'], requiredSlots:['kid','visitor'],
    lines: [
      '{kid.name} stopped and noticed {visitor.articleText} watching the whole thing. "Hi?" said {kid.name}. The {visitor.text} did not say hi back, exactly.',
    ] },
  { id:'ag_o2', beatType:'obstacle', tiers:['kid','big','tween'], requiredSlots:['kid','object'],
    lines: [
      '"Nope," said {kid.name} firmly. "Not without {object.articleText}." Everybody looked at {kid.name}. {kid.cap} did not budge.',
    ] },
  { id:'ag_o3', beatType:'obstacle', tiers:['kid','big'], requiredSlots:['kid','color','food'],
    lines: [
      '{kid.name} spotted something {color.text} on the {food.text}. That was the clue. {kid.cap} had been right.',
    ] },

  /* DISCOVERY beats: kid actively trades / solves */
  { id:'ag_d1', beatType:'discovery', tiers:['kid','big'], requiredSlots:['kid','companion','food'],
    lines: [
      '{kid.name} traded the {food.text} for the answer. The {companion.text} watched the deal go down. It was a fair trade. Mostly.',
    ] },
  { id:'ag_d2', beatType:'discovery', tiers:['kid','big','tween'], requiredSlots:['kid','object','move'],
    lines: [
      '{kid.name} held {object.articleText} up to the light. Then {kid.name} {move.text} forward and figured the whole thing out.',
    ] },

  /* BEDTIME beats: kid actively reflects (gives the kid a closing line) */
  { id:'ag_b1', beatType:'bedtime_landing', tiers:['kid','big'], requiredSlots:['kid','companion','food'],
    lines: [
      'Back home, {kid.name} ate {food.articleText} and thought about everything that had happened. The {companion.text} did the same, but with more {food.text}.',
    ] },
  { id:'ag_b2', beatType:'bedtime_landing', tiers:['kid','big','tween'], requiredSlots:['kid','mood'],
    lines: [
      '{kid.name} settled in, feeling {mood.text} about how the day had turned out. Some days are like that. This was one of them.',
    ] },

  /* LITTLE-tier agency: simple decisions, no irony */
  { id:'ag_li_silly', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','food','companion'],
    lines: [
      '{kid.name} pulled out {food.articleText} and said, "I have an idea." The {companion.text} listened carefully. {kid.cap} had a really good idea.',
    ] },
  { id:'ag_li_silly2', beatType:'little_silly_event', tiers:['little'], requiredSlots:['kid','object','companion'],
    lines: [
      '{kid.name} held {object.articleText} up high. "We need this," {kid.name} said. The {companion.text} nodded. They headed off together.',
    ] },

  /* TOT-tier agency: tiny declarations */
  { id:'ag_tot_silly', beatType:'tot_silly_meet', tiers:['tot'], requiredSlots:['kid','companion','food'],
    lines: [
      '{kid.name} said, "Look! {food.cap}!" The {companion.text} looked. The {companion.text} liked the {food.text}. Hee hee.',
    ] },

  /* ============================================================
     v2.3.0 — GOAL-SPINE BEATS (the causality engine)
     ============================================================
     Each beat in the spine references the goal AND a user-picked
     slot. Chosen words become CAUSES: the pet creates the problem,
     the food/object/move resolves it. Beats are tier-aware: kid/big
     get the same skeleton with different voice; tween gets a
     deadpan variant.

     Slots used by these beats:
       {goal.text}    — mid-sentence: "find the missing key"
       {goal.cap}     — start-of-sentence: "Find the missing key…"
       {goal.past}    — past tense for resolution: "found the missing key"
       {kid.name}     — child's name
       {pet}/{visitor}/{food}/{object}/{move}/{color}/{mood} — picks
     ============================================================ */

  /* GOAL STATED — kid declares the goal in P1 */
  { id:'gs_kid_1', beatType:'goal_stated', tiers:['kid','big'], requiredSlots:['kid','goal','companion','place'],
    lines: [
      '{kid.name} woke up with a plan. Today, at the {place.text}, {kid.name} was going to {goal.text}. The {companion.text} was in. The {companion.text} was always in.',
      'Today was the day. {kid.name} had decided yesterday at the {place.text} and slept on it and decided again this morning: today, {kid.name} was going to {goal.text}. The {companion.text} agreed before {kid.name} even finished saying it.',
    ] },
  /* v2.4.2 — introduce companion in P1 to avoid mid-story phantom entrances. */
  { id:'gs_kid_2', beatType:'goal_stated', tiers:['kid','big'], requiredSlots:['kid','goal','place','companion'],
    lines: [
      'It started at the {place.text}. {kid.name} looked around, glanced at the {companion.text}, and made up their mind: today they would {goal.text}. No matter what.',
      '{kid.name} and the {companion.text} were already at the {place.text} when it hit: today was the day to {goal.text}. The {companion.text} did not argue.',
    ] },
  { id:'gs_tween_1', beatType:'goal_stated', tiers:['tween'], requiredSlots:['kid','goal','place'],
    lines: [
      'At the {place.text}, {kid.name} woke up with a goal. Specifically: {goal.text}. {kid.name} did not love announcing goals out loud, but this one felt different.',
      'There was one objective today at the {place.text}, and {kid.name} had committed to it: {goal.text}. {kid.cap} would deal with the consequences after.',
    ] },

  /* GOAL OBSTACLE — a chosen pick BLOCKS the goal */
  { id:'go_pet_1', beatType:'goal_obstacle', tiers:['kid','big'], requiredSlots:['kid','goal','companion'],
    lines: [
      'But the {companion.text} was in the way. The {companion.text} did not want {kid.name} to {goal.text}. The {companion.text} had its own ideas, and the ideas involved snacks.',
      'Problem: the {companion.text} blocked the door. To {goal.text}, {kid.name} would have to get past the {companion.text} first. The {companion.text} did not look easy to get past.',
    ] },
  { id:'go_visitor_1', beatType:'goal_obstacle', tiers:['kid','big'], requiredSlots:['kid','goal','visitor'],
    lines: [
      'Then {visitor.articleText} appeared, holding the very thing {kid.name} needed to {goal.text}. {visitor.TheText} did not look like {visitor.theText} was going to give it up easily.',
      '"You cannot {goal.text}," announced {visitor.theText} firmly. "Not while I am here." That was, regrettably, a problem.',
    ] },
  { id:'go_visitor_2', beatType:'goal_obstacle', tiers:['kid','big'], requiredSlots:['kid','goal','visitor','object'],
    lines: [
      '{visitor.TheText} appeared out of nowhere holding {object.articleText}. "You want to {goal.text}? You will have to get past this first," {visitor.theText} said, waggling {object.theText} like a tiny threat.',
    ] },
  { id:'go_tween_1', beatType:'goal_obstacle', tiers:['tween'], requiredSlots:['kid','goal','visitor'],
    lines: [
      'Then {visitor.theText} showed up. Of course. {visitor.TheText} did not directly stop {kid.name} from trying to {goal.text}, but {visitor.theText} also did not, like, help.',
    ] },

  /* KID DECIDES — kid uses a chosen pick as the tool */
  { id:'kd_food_1', beatType:'kid_decides', tiers:['kid','big'], requiredSlots:['kid','food','companion'],
    lines: [
      '{kid.name} reached into a pocket. Inside: {food.articleText}. {kid.name} had been saving these for an emergency. This counted. {kid.cap} held {food.articleText} out, slowly.',
      '"Wait," said {kid.name}. "I have an idea." {kid.name} pulled out {food.articleText}. The {companion.text} understood immediately. Sometimes a snack solves a problem nothing else can.',
    ] },
  { id:'kd_object_1', beatType:'kid_decides', tiers:['kid','big'], requiredSlots:['kid','object','companion'],
    lines: [
      '{kid.name} thought for a second, then pulled out {object.articleText} they had brought just in case. "Will this work?" asked {kid.name}. The {companion.text} looked at it, then nodded once.',
    ] },
  { id:'kd_move_1', beatType:'kid_decides', tiers:['kid','big'], requiredSlots:['kid','move'],
    lines: [
      '{kid.name} took one big breath, then {move.text} forward fast — faster than anyone expected. Even {kid.name} was a little surprised.',
    ] },
  { id:'kd_color_1', beatType:'kid_decides', tiers:['kid','big'], requiredSlots:['kid','color','object'],
    lines: [
      '{kid.name} noticed a flash of {color.text} on {object.theText}. THAT was the clue. {kid.cap} grabbed it before anyone could stop them.',
    ] },
  { id:'kd_tween_1', beatType:'kid_decides', tiers:['tween'], requiredSlots:['kid','food'],
    lines: [
      '{kid.name} pulled out {food.articleText} and gave a look. The kind of look that says "this is the move." Sometimes the move is just snacks. {kid.cap} accepted it.',
    ] },
  /* v2.5.0 — tween move load-bearing beats. The kid's chosen move IS the action
     that changes the situation. Replaces generic "moved a little because it felt
     right" sprinkles. Designed so phrases like "dramatically sighed", "rage-walked",
     "existentially paused", "casually yeeted everything", "nodded knowingly" all
     read naturally as the verb that turns the scene. */
  { id:'kd_tween_move_vend', beatType:'kid_decides', tiers:['tween'], requiredSlots:['kid','move'],
    lines: [
      '{kid.name} {move.text} so hard the vending machine reset. Nobody understood what just happened. {kid.cap} kept walking like that had been the plan.',
      '{kid.cap} {move.text}. The vending machine made a sound it should not have been able to make. The lights flickered once. Then everything was fine. Sort of.',
    ] },
  { id:'kd_tween_move_room', beatType:'kid_decides', tiers:['tween'], requiredSlots:['kid','move'],
    lines: [
      'So {kid.name} {move.text}. The whole room read it as a statement. {kid.cap} had not meant it that way. Too late. The statement was made.',
    ] },
  { id:'ls_inv_tween_move', beatType:'kid_investigates', tiers:['tween'], requiredSlots:['kid','move','object'],
    lines: [
      '{kid.name} {move.text} past the scene with {object.articleText}. That motion alone caught two new clues nobody else had noticed. {kid.cap} did not mention this out loud.',
      '{kid.cap} {move.text} around the room exactly once. That was enough. {kid.name} now knew three things they had not known thirty seconds ago.',
    ] },
  { id:'sw_imp_tween_move', beatType:'kid_improvises', tiers:['tween'], requiredSlots:['kid','move','freeword2'],
    lines: [
      '{kid.name} {move.text} center stage and yelled "{freeword2.text}!" once, with conviction. The crowd interpreted it as performance art. {kid.cap} did not correct anyone.',
      'Then {kid.cap} {move.text} across the stage in a way nobody had rehearsed. "{freeword2.text}!" {kid.name} added, for effect. Somehow the whole thing landed.',
    ] },
  { id:'rl_lp_tween_move', beatType:'kid_finds_loophole', tiers:['tween'], requiredSlots:['kid','move','visitor'],
    lines: [
      '{kid.name} {move.text} past the rule sign. Technically, that motion was not banned. The {visitor.text} squinted but could not technically object. The loophole held.',
      '{kid.cap} {move.text}. The {visitor.text} interpreted this as compliance. It was not compliance. It was the loophole, executed with style.',
    ] },
  /* v2.5.0 — tween move escalation: also fires as a punchline variant so the
     selected move can land in the climax rather than only the attempt stage. */
  { id:'pl_tw_move_climax', beatType:'punchline', tiers:['tween'], requiredSlots:['kid','move'],
    lines: [
      'Then {kid.name} {move.text} one more time. Just to settle it. Nobody knew what had been settled, including {kid.name}. The story now belonged to history.',
      'Final move of the evening: {kid.name} {move.text}. The group chat would later refer to this as "the {move.text} moment." It would not be explained.',
    ] },

  /* GOAL RESOLVED — the chosen pick succeeds; kid wins */
  { id:'gr_kid_1', beatType:'goal_resolved', tiers:['kid','big'], requiredSlots:['kid','goal','companion'],
    lines: [
      'And just like that, {kid.name} {goal.past}. The {companion.text} cheered — quietly, because cheers carry. {kid.name} grinned a real grin.',
      'It worked. It actually worked. {kid.name} {goal.past} in front of everyone. The {companion.text} took a small bow on {kid.name}\'s behalf.',
    ] },
  { id:'gr_kid_2', beatType:'goal_resolved', tiers:['kid','big'], requiredSlots:['kid','goal','visitor'],
    lines: [
      '{visitor.TheText} watched, surprised, as {kid.name} {goal.past} right in front of them. "Huh," said {visitor.theText}. "I did not see that coming." Nobody had.',
    ] },
  { id:'gr_tween_1', beatType:'goal_resolved', tiers:['tween'], requiredSlots:['kid','goal'],
    lines: [
      'And then, somehow, {kid.name} {goal.past}. {kid.cap} did not make a big deal about it. The day continued. The vibes were, technically, victorious.',
    ] },

  /* BEDTIME LANDING — already exists for these tiers but the goal-spine variant
     gives a satisfying callback to the GOAL specifically. Tagged for the spine via
     a lighter slot requirement so it slots into the recipe naturally. */
  { id:'bl_goal_1', beatType:'bedtime_landing', tiers:['kid','big'], requiredSlots:['kid','goal','companion'],
    lines: [
      'Back home, {kid.name} ate a snack and replayed it in their head: how they {goal.past}, how the {companion.text} had been right there, how it had all worked out. The {companion.text} curled up. Tomorrow could be just as good.',
    ] },
  { id:'bl_goal_2', beatType:'bedtime_landing', tiers:['tween'], requiredSlots:['kid','goal'],
    lines: [
      'In bed that night, {kid.name} thought about how they {goal.past}. Quietly proud. Not posting about it. Some wins are just for you.',
    ] },

  /* ============================================================
     v2.3.1 — BLUEPRINT: LOST SNACK RESCUE
     Shape: food disappears → wrong suspect → kid investigates → true culprit → bedtime
     Required picks driving the plot: food (the missing thing), creature (false suspect),
     companion (revealer), object (the clue), color (visual gag)
     ============================================================ */

  /* SNACK MISSING — food is gone, kid notices */
  /* v2.4.2 — introduce companion in P1 so the later "true_culprit" reveal lands. */
  { id:'ls_miss_1', beatType:'snack_missing', tiers:['kid','big'], requiredSlots:['kid','food','place','companion'],
    lines: [
      '{kid.name} and the {companion.text} were at the {place.text}. {kid.name} set down the {food.text} on the counter and turned around for one second. ONE second. When {kid.name} turned back, the {food.text} was gone. Just gone. There was a crumb. That was it. The {companion.text} looked very innocent.',
      'At the {place.text}, {kid.name} had been saving the {food.text} all morning. The {companion.text} had been watching. Maybe a little too closely. Then the {food.text} vanished. {kid.cap} did a slow look around. Nothing.',
    ] },
  { id:'ls_miss_2', beatType:'snack_missing', tiers:['kid','big'], requiredSlots:['kid','food','companion','place'],
    lines: [
      'At the {place.text}, {kid.name} looked at the empty plate. "Where is the {food.text}?" The {companion.text} looked too. Someone had taken the {food.text}.',
    ] },
  { id:'ls_miss_tween', beatType:'snack_missing', tiers:['tween'], requiredSlots:['kid','food','place'],
    lines: [
      '{kid.name} had specifically saved the {food.text} at the {place.text}. Specifically. And now: gone. {kid.cap} did not love this development.',
    ] },

  /* WRONG SUSPECT — creature looks guilty
     v2.4.3 — "suspiciously innocent" → "WAY too innocent", "narrowed their eyes" → "stared". */
  { id:'ls_susp_1', beatType:'wrong_suspect', tiers:['kid','big'], requiredSlots:['kid','visitor','color'],
    lines: [
      '{kid.name} spotted the {visitor.text} nearby, looking VERY innocent. Way too innocent. There was a {color.text} crumb on its chin. Caught!',
      'The {visitor.text} was right there. The {visitor.text} had a {color.text} smudge on its face. {kid.name} stared hard. "It was you."',
    ] },
  /* v2.4.2 — bridge the visitor's entrance so they don't pop in cold mid-paragraph. */
  { id:'ls_susp_2', beatType:'wrong_suspect', tiers:['kid','big'], requiredSlots:['kid','visitor','mood'],
    lines: [
      'Right then {visitor.articleText} wandered into view, looking guilty. "I know what you did," {kid.name} said, feeling {mood.text} about it. The {visitor.text} stared. The {visitor.text} did not say no. The {visitor.text} did not say yes either. Weird.',
    ] },
  { id:'ls_susp_tween', beatType:'wrong_suspect', tiers:['tween'], requiredSlots:['kid','visitor'],
    lines: [
      'The {visitor.text} was making strong eye contact. The kind of eye contact that says guilt, in {kid.name}\'s opinion. {kid.cap} kept their cool. Mostly.',
    ] },

  /* KID INVESTIGATES — kid uses object to find the truth
     v2.4.3 — "thorough / examined the scene / alibi" → simpler detective language. */
  { id:'ls_inv_1', beatType:'kid_investigates', tiers:['kid','big'], requiredSlots:['kid','object','companion'],
    lines: [
      '{kid.name} pulled out {object.articleText} and held it up like a detective. The {companion.text} watched. {kid.cap} followed the trail of crumbs. The trail did NOT go to the {visitor.text}.',
      'But {kid.name} was careful. {kid.cap} pulled out {object.articleText} and looked around the room. Something was off. The {visitor.text}\'s story didn\'t quite match up.',
    ] },
  { id:'ls_inv_2', beatType:'kid_investigates', tiers:['kid','big'], requiredSlots:['kid','object','move'],
    lines: [
      '{kid.name} {move.text} around the room, holding {object.articleText} out for clues. The {object.text} pointed past the {visitor.text} the whole time. It was pointing at the cupboard.',
    ] },
  { id:'ls_inv_tween', beatType:'kid_investigates', tiers:['tween'], requiredSlots:['kid','object'],
    lines: [
      '{kid.name} did some detective work. Specifically: looked at {object.articleText}, then at the room, then at the floor. The trail was, in fact, leading somewhere else entirely.',
    ] },

  /* TRUE CULPRIT — companion is the actual culprit, twist reveal
     v2.4.3 — "plot twist / demanded an apology" → simpler reveal. */
  { id:'ls_cul_1', beatType:'true_culprit', tiers:['kid','big'], requiredSlots:['kid','food','companion'],
    lines: [
      'Then {kid.name} saw it: a single crumb of {food.text} on the {companion.text}\'s face. "YOU?" said {kid.name}. The {companion.text} looked away, super shy. Mystery solved!',
      'The truth came out: the {companion.text} had taken the {food.text} the whole time. The {companion.text} was very sorry. The {companion.text} also wanted more {food.text}. Both things were true.',
    ] },
  { id:'ls_cul_2', beatType:'true_culprit', tiers:['kid','big'], requiredSlots:['kid','companion','food','visitor'],
    lines: [
      'Wait, WHAT? It was the {companion.text} the whole time. The {visitor.text} had not done it. The {visitor.text} wanted a sorry. {kid.name} said sorry. Then everyone shared the next {food.text}.',
    ] },
  { id:'ls_cul_tween', beatType:'true_culprit', tiers:['tween'], requiredSlots:['kid','companion','food'],
    lines: [
      'The truth: the {companion.text}. Obviously. {kid.name} sighed the sigh of someone who should have known. The {companion.text} accepted accountability, mostly, in exchange for the remaining {food.text}.',
    ] },

  /* ============================================================
     v2.3.1 — BLUEPRINT: SHOW GOES WRONG
     Shape: kid prepares show → something breaks → kid improvises with freeword/move → triumph → bedtime
     Required picks driving the plot: place (stage), object (prop that breaks), move (improv),
     freeword (the chant/cry that saves the show), companion (co-star)
     ============================================================ */

  /* SHOW SETUP
     v2.4.3 — simpler vocab (audience→crowd, announced→said, wholeheartedly→too,
     rehearsed→practiced). */
  { id:'sw_set_1', beatType:'show_setup', tiers:['kid','big'], requiredSlots:['kid','place','companion'],
    lines: [
      'There was going to be a show. {kid.name} had been planning it for days. The {companion.text} was the co-star. The stage was the {place.text}. The crowd was three pillows and one very confused {visitor.text}.',
      '"This is going to be the BEST show ever," {kid.name} said at the {place.text}. The {companion.text} agreed. They had practiced. They were ready.',
    ] },
  /* v2.4.3 — replaced "venue" with "stage". */
  /* v2.4.2 — introduce companion in P1 so its later "co-star" role lands. */
  { id:'sw_set_2', beatType:'show_setup', tiers:['kid','big'], requiredSlots:['kid','object','place','companion'],
    lines: [
      'The {place.text} was the stage. {kid.name} had brought {object.articleText} as a prop and the {companion.text} as the co-star. The whole show kind of depended on the {object.text} working. The {object.text} had better work.',
    ] },
  { id:'sw_set_tween', beatType:'show_setup', tiers:['tween'], requiredSlots:['kid','place'],
    lines: [
      '{kid.name} had a whole bit planned at the {place.text}. Nobody had asked for the bit. {kid.cap} was doing it anyway.',
    ] },

  /* SHOW DISASTER — chosen object/picks fail
     v2.4.3 — "audience" → "pillows" (already named earlier in story). */
  { id:'sw_dis_1', beatType:'show_disaster', tiers:['kid','big'], requiredSlots:['kid','object'],
    lines: [
      'Then everything went wrong. The {object.text} broke. Actually broke. In half. {kid.name} froze. The pillows watched.',
      'Big problem: the {object.text} fell. Right in the middle of the show. {kid.name} stared at the {object.text}, then at the pillows, then at the {object.text} again.',
    ] },
  { id:'sw_dis_2', beatType:'show_disaster', tiers:['kid','big'], requiredSlots:['kid','companion'],
    lines: [
      'And then the {companion.text} forgot the next part. Just blanked. Total blank. {kid.name} was on their own. The pillows were judging. Pillows are tough crowds.',
    ] },
  { id:'sw_dis_tween', beatType:'show_disaster', tiers:['tween'], requiredSlots:['kid','object'],
    lines: [
      'Of course, the {object.text} broke. Of course. {kid.name} stood there with half {object.articleText} and a decision to make.',
    ] },

  /* KID IMPROVISES — uses freeword/move
     v2.4.3 — "improvised → made it up", "audience → pillows", "rehearsed → practiced",
     "inventing → making up". */
  { id:'sw_imp_1', beatType:'kid_improvises', tiers:['kid','big'], requiredSlots:['kid','freeword2','move'],
    lines: [
      'So {kid.name} made it up. "{freeword2.text}!" {kid.name} yelled. Then {move.text}. Then yelled "{freeword2.text}!" again, louder. The pillows were INTO IT now.',
      '{kid.name} took a breath, {move.text} forward, and yelled whatever came to mind: "{freeword2.text}!" The pillows leaned in. Sometimes silly stuff works.',
    ] },
  { id:'sw_imp_2', beatType:'kid_improvises', tiers:['kid','big'], requiredSlots:['kid','move','companion'],
    lines: [
      '{kid.name} {move.text} across the stage like nobody had practiced it (because nobody had). The {companion.text} watched, then joined in. They were inventing the show as they went. And somehow it was working.',
    ] },
  { id:'sw_imp_tween', beatType:'kid_improvises', tiers:['tween'], requiredSlots:['kid','freeword2'],
    lines: [
      '{kid.name} just went for it. "{freeword2.text}," {kid.name} declared, with conviction. It was not in the script. {kid.cap} sold it anyway.',
    ] },

  /* SHOW TRIUMPH
     v2.4.3 — "triumph" → "huge hit", "standing ovation" → "huge clap", drop "impressive". */
  { id:'sw_tri_1', beatType:'show_triumph', tiers:['kid','big'], requiredSlots:['kid','place','companion'],
    lines: [
      'The pillows went wild. The confused {visitor.text} clapped a tiny clap. The {companion.text} took a bow. {kid.name} took a bigger bow. The {place.text} had never seen a better show.',
      'It was a huge hit. A real one. {kid.name} and the {companion.text} got a huge clap, which was pretty cool because pillows do not even have hands. Best show the {place.text} had ever had.',
    ] },
  { id:'sw_tri_2', beatType:'show_triumph', tiers:['kid','big'], requiredSlots:['kid','freeword2'],
    lines: [
      'And from that day on, "{freeword2.text}" was the special word of the show. Everyone said it. Everyone meant it. Nobody knew what it meant.',
    ] },
  { id:'sw_tri_tween', beatType:'show_triumph', tiers:['tween'], requiredSlots:['kid'],
    lines: [
      'It worked. Somehow. {kid.name} took a bow that was 30% real and 70% ironic. The pillows respected it. So did {kid.name}, secretly.',
    ] },

  /* ============================================================
     v2.3.1 — BLUEPRINT: RULE LOOPHOLE
     Shape: absurd rule imposed → kid blocked → kid finds object-based loophole → wins → bedtime
     Required picks driving the plot: visitor (rule-imposer), object (the loophole),
     move (the kid's escape), rule (the actual rule text), place
     ============================================================ */

  /* RULE IMPOSED — visitor states an absurd rule
     v2.4.3 — simpler vocab for kid+big readers (no "officially / announced /
     effective immediately"). Tween-tier variants keep richer wording below. */
  { id:'rl_imp_1', beatType:'rule_imposed', tiers:['kid','big'], requiredSlots:['kid','visitor','rule','place'],
    lines: [
      'At the {place.text}, {visitor.TheText} held up one hand. "New rule," {visitor.theText} said, "{rule.text}. Starting right now." {kid.name} had never heard of this rule. The rule did not care.',
      'A new rule showed up at the {place.text}. {visitor.TheText} brought it. "{rule.text}," {visitor.theText} said, like that explained everything. It did not. But the rule was a rule now.',
    ] },
  { id:'rl_imp_2', beatType:'rule_imposed', tiers:['kid','big'], requiredSlots:['kid','visitor','place'],
    lines: [
      'At the {place.text}, {visitor.theText} put up a big sign. The sign had a rule on it. {kid.name} had not agreed to this rule. Nobody had asked {kid.name}.',
    ] },
  { id:'rl_imp_tween', beatType:'rule_imposed', tiers:['tween'], requiredSlots:['kid','visitor','rule','place'],
    lines: [
      'At the {place.text}, {visitor.theText} explained, with full bureaucratic confidence, that the rule was now: "{rule.text}." {kid.name} did not look impressed. {kid.cap} also did not argue. Arguing rules is a trap.',
    ] },

  /* RULE BLOCKS — kid wants to do something, rule prevents
     v2.4.3 — simpler vocab (no "technically / stalemate / consider their options"). */
  { id:'rl_blk_1', beatType:'rule_blocks', tiers:['kid','big'], requiredSlots:['kid','food','visitor'],
    lines: [
      '{kid.name} reached for the {food.text}. {visitor.TheText} held up a hand. "Rule," {visitor.theText} said. {kid.name} froze, hand still in the air. Now what?',
      'The rule meant {kid.name} could not have the {food.text}. The {food.text} was right there. {kid.name} could see it. {kid.cap} could not eat it. Not fair.',
    ] },
  { id:'rl_blk_2', beatType:'rule_blocks', tiers:['kid','big'], requiredSlots:['kid','place'],
    lines: [
      'Worse: the rule worked at the {place.text} too. {kid.name} could not go forward. Could not go back. Could only stand there and think. There was nothing to do.',
    ] },
  { id:'rl_blk_tween', beatType:'rule_blocks', tiers:['tween'], requiredSlots:['kid'],
    lines: [
      'So {kid.name} was officially stuck. Rule-stuck. {kid.cap} considered defying it. {kid.cap} considered crying. {kid.cap} considered loopholes.',
    ] },

  /* KID FINDS LOOPHOLE — chosen object is the loophole
     v2.4.3 — replaced "Subsection seven" / "technically" with plain language. */
  { id:'rl_lp_1', beatType:'kid_finds_loophole', tiers:['kid','big'], requiredSlots:['kid','object','visitor'],
    lines: [
      'Then {kid.name} smiled. {kid.cap} held up {object.articleText}. "The rule does not say anything about {object.text}," {kid.name} said. {visitor.TheText} squinted. {visitor.TheText} could not argue with that.',
      '"Wait." {kid.name} held {object.articleText} up. "Rule number seven says I can use {object.articleText}, right?" It did not. But {visitor.theText} did not want to look like {visitor.theText} had forgotten the rules. {visitor.TheText} nodded slowly.',
    ] },
  { id:'rl_lp_2', beatType:'kid_finds_loophole', tiers:['kid','big'], requiredSlots:['kid','move','object'],
    lines: [
      '{kid.name} {move.text} sideways while holding {object.articleText}. This was a different move than the one the rule said no to. A different move! {visitor.TheText} watched, eyes narrow. The rule said nothing back.',
    ] },
  { id:'rl_lp_tween', beatType:'kid_finds_loophole', tiers:['tween'], requiredSlots:['kid','object'],
    lines: [
      '{kid.name} located the loophole. It involved {object.articleText} and a very specific reading of the rule. {visitor.TheText} could not technically object. {kid.cap} did not point this out. Pointing it out is rookie behavior.',
    ] },

  /* LOOPHOLE WORKS
     v2.4.3 — simpler vocab (no "in effect / precedent"). */
  { id:'rl_win_1', beatType:'loophole_works', tiers:['kid','big'], requiredSlots:['kid','food','visitor'],
    lines: [
      'And just like that, {kid.name} got the {food.text} anyway. {visitor.TheText} sighed. The rule was still a rule, but {kid.name} had won this round. {kid.cap} ate the {food.text} with both hands.',
      'It worked. {kid.name} won. The rule was still there. The {food.text} was also, somehow, in {kid.name}\'s mouth. Both things were true at the same time.',
    ] },
  { id:'rl_win_2', beatType:'loophole_works', tiers:['kid','big'], requiredSlots:['kid','companion'],
    lines: [
      'The {companion.text} watched the trick work and looked impressed. The {companion.text} was going to try this later. {kid.name} had taught the {companion.text} something brand new.',
    ] },
  { id:'rl_win_tween', beatType:'loophole_works', tiers:['tween'], requiredSlots:['kid','visitor'],
    lines: [
      'The loophole held. {visitor.TheText} could not really stop {kid.name}. Bureaucracy is just words and {kid.name} had found the right words. Quietly satisfying.',
    ] },

  /* ============================================================
     v2.4.0 — PUNCHLINE BEATS
     Physical absurdity, scale violations, ALL-CAPS sounds, "suddenly X"
     non-sequiturs. NOT deadpan. NOT witty observations. The joke is
     the body of a thing doing the wrong thing at the wrong volume.
     One punchline fires in every kid/big/tween story between the
     climax and bedtime_landing.
     ============================================================ */

  /* --- PHYSICAL ABSURDITY with COMPANION + FOOD --- */
  { id:'pl_phys_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['companion','food','number'],
    lines: [
      'And then the {companion.text} sneezed and exactly {number.text} {food.plural} flew out of its nose. {food.cap}. Out of a nose. Nobody knew where they had been stored.',
    ] },
  { id:'pl_phys_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['companion','food'],
    lines: [
      'Then the {companion.text} hiccuped and one whole {food.text} popped right out of its mouth, all in one piece, like it had been hiding in there. The {companion.text} looked just as shocked as everyone else.',
    ] },
  { id:'pl_phys_3', beatType:'punchline', tiers:['kid','big'], requiredSlots:['companion','food','sound'],
    lines: [
      'Suddenly the {companion.text} yelled "{sound.text}!" at a volume that should not have come out of a {companion.text}, and a single piece of {food.text} fell out of the ceiling. The ceiling. Nobody questioned it.',
    ] },

  /* --- SCALE VIOLATIONS with OBJECT --- */
  { id:'pl_scale_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['object','sound'],
    lines: [
      'Then the {object.text} did one tiny "{sound.text}." Then a much bigger "{sound.text}." Then the biggest "{sound.text}" ever. Then it just sat there, like nothing had happened.',
    ] },
  { id:'pl_scale_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['object'],
    lines: [
      'And right then, the {object.text} grew. Just a little. Then a lot. Then so much it had to duck. Nobody could explain it. Nobody really wanted to.',
    ] },
  { id:'pl_scale_3', beatType:'punchline', tiers:['kid','big'], requiredSlots:['object','number'],
    lines: [
      'Then the {object.text} split into {number.text} smaller {object.plural}, and every single one of them looked mad. {number.cap} mad little {object.plural}. That was the situation now.',
    ] },

  /* --- LOUD NONSENSE with SOUND/FREEWORD --- */
  { id:'pl_loud_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['sound','companion'],
    lines: [
      'Then everyone — {kid.name}, the {companion.text}, the curtains, possibly the floor — yelled "{sound.text}!" at exactly the same time. The windows rattled. A pigeon, somewhere far away, fell off something.',
    ] },
  { id:'pl_loud_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['freeword','sound'],
    lines: [
      'And then {kid.name} shouted "{freeword.text}!" so loud that the {sound.text} echoed back. The echo also yelled "{freeword.text}!" The echo had opinions now.',
    ] },
  { id:'pl_loud_3', beatType:'punchline', tiers:['kid','big'], requiredSlots:['sound','companion','number'],
    lines: [
      'The {companion.text} let out {number.text} "{sound.text}" noises in a row. {number.cap} of them. Each one a little louder than the last.',
    ] },

  /* --- WRONG-SIZED THINGS with VISITOR --- */
  /* v2.7.3 — pl_wrong_1 was producing "one HUGE waffles" / "Bigger than the pirate, even. Nobody knew where it had come from"
     for plural foods (waffles, cookies, donuts...) because the original line hard-coded "one HUGE {food.text}" + singular
     pronoun "it". Switched to {food.articleText} which already pluralizes correctly ("some waffles" / "a pizza" / "a bowl of
     soup") and standalone "HUGE." for the size emphasis. Also dropped the broken "where it had come from" sentence and
     trimmed the beat from 5 sentences to 4 so the punchline lands faster. */
  { id:'pl_wrong_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['visitor','food'],
    lines: [
      'Then the {visitor.text} pulled out {food.articleText}. HUGE. Way too big to fit anywhere. The {visitor.text} did not know where, either.',
    ] },
  { id:'pl_wrong_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['visitor','object'],
    lines: [
      'The {visitor.text} pulled out a tiny tiny TINY {object.text}. The smallest {object.text} in the world, possibly. Then the {visitor.text} ate it. Just like that. No comment.',
    ] },
  { id:'pl_wrong_3', beatType:'punchline', tiers:['kid','big'], requiredSlots:['visitor','sound'],
    lines: [
      'And then the {visitor.text} burped. Not a small burp. A "{sound.text}" burp. A burp that should be against the rules. {kid.name} clapped. It would have been rude not to.',
    ] },

  /* --- SUDDENLY X (non-sequitur reversal) --- */
  { id:'pl_sudden_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['liquid','place'],
    lines: [
      'Suddenly, for no reason, {liquid.text} started dripping from the ceiling of the {place.text}. Just a little. Then a lot. Then nobody mentioned it again because that was somehow more polite.',
    ] },
  { id:'pl_sudden_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['number','companion'],
    lines: [
      'And then, out of nowhere, {number.text} more {companion.plural} showed up. All exactly the same. All wearing tiny hats. Nobody asked. Nobody answered.',
    ] },
  { id:'pl_sudden_3', beatType:'punchline', tiers:['kid','big'], requiredSlots:['object','sound'],
    lines: [
      'Then the {object.text} said "{sound.text}." Out loud. Like a word. The {object.text} was not supposed to be able to do that. The {object.text} did it anyway.',
    ] },

  /* --- BLUEPRINT-FRIENDLY: lost_snack-flavored (food + companion crumb gag) --- */
  { id:'pl_snack_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['companion','food'],
    lines: [
      'Right then, the {companion.text} burped, and a tiny crumb of {food.text} flew out and landed perfectly on {kid.name}\'s nose. {kid.cap} did not move. The crumb did not move. Nobody breathed.',
    ] },
  { id:'pl_snack_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['companion','food','number'],
    lines: [
      'And the {companion.text} opened its mouth one more time and {number.text} more {food.plural} fell out. Just kept coming. At some point everyone agreed to stop counting.',
    ] },

  /* --- BLUEPRINT-FRIENDLY: show_wrong-flavored (improv-loud) --- */
  { id:'pl_show_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['freeword2','companion','place'],
    lines: [
      'And then the entire {place.text} chanted "{freeword2.text}!" at the same time, including the pillows somehow, and the {companion.text} fainted from the honor of it.',
    ] },
  { id:'pl_show_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['move','freeword2'],
    lines: [
      'So {kid.name} {move.text} one more time, yelled "{freeword2.text}!" so loud the walls jumped, and ended in a pose nobody had ever seen before. A new pose. {kid.cap} had just made it up.',
    ] },

  /* --- BLUEPRINT-FRIENDLY: rule_loophole-flavored (rule visitor undone) --- */
  { id:'pl_rule_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['visitor','object','sound'],
    lines: [
      'And then the {visitor.text} tripped, dropped a fresh {object.text}, said "{sound.text}!" by accident, and the entire rule fell over and stopped existing. Just like that.',
    ] },
  { id:'pl_rule_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['visitor','food'],
    lines: [
      'The {visitor.text} tried one more rule. The new rule was about {food.plural}. Then {food.articleText} flew through the window and hit {visitor.theText} on the head. That was the end of the rules.',
    ] },

  /* --- KID-OWN-BODY GAGS (no companion required) --- */
  { id:'pl_kid_1', beatType:'punchline', tiers:['kid','big'], requiredSlots:['kid','sound'],
    lines: [
      'And then {kid.name} did one HUGE laugh. Like, the kind of laugh that bends you in half. "{sound.text}!" {kid.name} kept saying. "{sound.text}!" {kid.cap} could not stop. It was the law now.',
    ] },
  { id:'pl_kid_2', beatType:'punchline', tiers:['kid','big'], requiredSlots:['kid','move','object'],
    lines: [
      'So {kid.name} {move.text} one last time, holding {object.articleText} up like a trophy, and the whole room cheered. The room. The actual room. Walls and everything.',
    ] },

  /* --- TWEEN VARIANTS (deadpan delivery, still physically absurd) --- */
  { id:'pl_tw_1', beatType:'punchline', tiers:['tween'], requiredSlots:['companion','food','number'],
    lines: [
      'Then the {companion.text} produced, somehow, {number.text} additional {food.plural} from a location {kid.name} chose not to investigate. Nobody addressed it. Everybody noticed.',
    ] },
  { id:'pl_tw_2', beatType:'punchline', tiers:['tween'], requiredSlots:['visitor','sound'],
    lines: [
      'The {visitor.text} let out a single "{sound.text}." Then, after a long pause, exactly the same "{sound.text}" again. {kid.cap} took a screenshot mentally.',
    ] },
  { id:'pl_tw_3', beatType:'punchline', tiers:['tween'], requiredSlots:['object','place'],
    lines: [
      'And then the {object.text}, with absolutely no warning, fell over at the {place.text}. {kid.cap} watched it. It watched {kid.name} back. Neither of them looked away for an uncomfortable amount of time.',
    ] },
];

/* ================================================================
   v2.4.1 — RECENT-BEAT MEMORY
   The engine used to pure-random-pick beats and lines on every call,
   which meant a kid hitting "again" with the same dragon + cookies
   could hear the exact same punchline 3 stories in a row. With
   v2.4.0's 28 new punchlines fresh in the pool, repetition became
   noticeable in real-kid playtest.

   This module keeps two FIFO lists of recently-fired beat IDs and
   recently-rendered line keys. When picking from candidates the
   engine prefers entries not in the recent list, then falls back to
   the full pool if every candidate is recent (small pools shouldn't
   stall). State is module-scoped (page-lifetime). Profile module
   already owns the persistence boundary — beat memory stays in-memory
   on purpose so a fresh app open feels fresh.
   ================================================================ */
const __recentBeatIds  = [];
const __recentLineKeys = [];
const __RECENT_BEAT_CAP = 30;
const __RECENT_LINE_CAP = 80;
function __remember(arr, key, cap) {
  arr.push(key);
  while (arr.length > cap) arr.shift();
}
/* freshPickBeat — given candidate beat cards, prefer ones whose id is
   not in __recentBeatIds. Falls back to full list if all are recent.
   Returns the card (caller decides what to do with it).
   Pure pick: caller is responsible for calling __remember afterward. */
function __freshPickBeat(candidates) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const fresh = candidates.filter(c => __recentBeatIds.indexOf(c.id) === -1);
  const pool = fresh.length > 0 ? fresh : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}
/* freshPickLine — given a beat card, pick a line index, preferring
   ones whose key (beatId:idx) is not in __recentLineKeys. */
function __freshPickLine(card) {
  if (!card || !card.lines || card.lines.length === 0) return null;
  if (card.lines.length === 1) return { idx: 0, line: card.lines[0] };
  const indices = card.lines.map((_, i) => i);
  const fresh = indices.filter(i => __recentLineKeys.indexOf(card.id + ':' + i) === -1);
  const pool = fresh.length > 0 ? fresh : indices;
  const idx = pool[Math.floor(Math.random() * pool.length)];
  return { idx, line: card.lines[idx] };
}

/* ================================================================
   ENGINE — generateStoryV2
   ================================================================ */
function generateStoryV2(name, picks, age) {
  // Phase 1: kid only. Segment C: big + tween. Segment D (v1.23.0): tot + little.
  // v2 now covers all 5 tiers.
  let tier;
  if (age >= 2 && age <= 3)        tier = 'tot';
  else if (age >= 4 && age <= 5)   tier = 'little';
  else if (age >= 6 && age <= 7)   tier = 'kid';
  else if (age >= 8 && age <= 10)  tier = 'big';
  else if (age >= 11 && age <= 13) tier = 'tween';
  else                              return null;

  const rawPick = arr => arr[Math.floor(Math.random() * arr.length)];

  // v2.1.0 — read setting from picks (default: surprise). Setting locks the place slot
  // and biases the visitor/object pools toward setting-appropriate characters.
  // Falls back gracefully to "surprise" (the existing v2 behavior) if no setting given.
  // v0.9.3 · b9 — buildStory in index.html now passes picks.setting as a fully
  // resolved Setting 2.0 object (id + place + biases) with the per-session
  // hidden place already chosen. Use it directly when present; only call
  // getSetting (which may re-randomize) when picks.setting is just a {id} stub.
  const setting = (picks.setting && 'place' in picks.setting && 'visitorBias' in picks.setting)
    ? picks.setting
    : getSetting(picks.setting?.id || picks.setting?.w || 'surprise');

  // Build the slots map for this story.
  // Map user picks (v1 format: {w: 'dragon'}) to rich v2 word objects when possible.
  function mapPickToWord(pickValue, lib) {
    if (!pickValue) return rawPick(lib);
    const hit = lib.find(w => w.text === pickValue || w.id === pickValue);
    if (hit) return hit;
    // v0.9.3 · b15 — when a new/renamed picker word has no V2_WORDS rich-entry,
    // clone a random rich-word's traits/actions/sounds but OVERRIDE text + id
    // with the picker word.
    // v0.9.3 · b26 — ALSO override isPlural based on the picker word so a
    // singular fallback being cloned for a plural picker word (e.g. "binoculars")
    // doesn't produce "a binoculars" via articleText. Heuristic:
    //   * pickValue in KNOWN_PLURALS (binoculars, scissors, pants, ...) → isPlural=true
    //   * pickValue ends in 's' AND isn't a known-invariant noun (fish, deer, ...) → isPlural=true
    //   * otherwise leave isPlural=false (matches fallback default)
    const KNOWN_PLURALS    = new Set(['binoculars','scissors','pants','shorts','jeans','glasses','tongs','tweezers','pliers','sunglasses']);
    const INVARIANT_PLURAL = new Set(['fish','deer','sheep','moose','species','aircraft','spacecraft']);
    const pv = String(pickValue).toLowerCase();
    let derivedIsPlural = false;
    if (KNOWN_PLURALS.has(pv)) derivedIsPlural = true;
    else if (pv.endsWith('s') && !INVARIANT_PLURAL.has(pv) && !pv.endsWith('ss')) derivedIsPlural = true;
    const fallback = rawPick(lib);
    return Object.assign({}, fallback, { text: pickValue, id: pickValue, isPlural: derivedIsPlural });
  }

  // Bias helper: prefer items from biasIds when present, fall back to full library.
  function pickWithBias(lib, biasIds) {
    if (!biasIds || !biasIds.length) return rawPick(lib);
    // 70% chance to pick from biased subset (if any match), 30% from full library — keeps
    // variety alive while making the setting feel grounded.
    if (Math.random() < 0.7) {
      const biased = lib.filter(w => biasIds.includes(w.id));
      if (biased.length) return rawPick(biased);
    }
    return rawPick(lib);
  }

  const companion = mapPickToWord(picks.pet?.w,      V2_WORDS.companions);
  // v2.2.1 — track whether visitor came from a user pick (used by coverage validator
  // to decide whether visitor MUST appear in body).
  const userPickedVisitor = !!picks.creature?.w;
  const visitor   = userPickedVisitor
                    ? mapPickToWord(picks.creature.w, V2_WORDS.visitors)
                    : pickWithBias(V2_WORDS.visitors, setting.visitorBias);
  // Place: setting locks it. Only fall back to user pick / random if setting is "surprise".
  const place     = setting.place
                    ? setting.place
                    : mapPickToWord(picks.place?.w, V2_WORDS.places);
  const food      = mapPickToWord(picks.food?.w,     V2_WORDS.foods);
  // Object: bias to setting-appropriate objects when no explicit user pick.
  const object    = pickWithBias(V2_WORDS.objects, setting.objectBias);
  const sound     = picks.freeword?.w ? { text: picks.freeword.w } : rawPick(V2_WORDS.sounds);
  const adverb    = rawPick(V2_WORDS.adverbs);
  const number    = rawPick(V2_WORDS.numbers);
  const liquid    = rawPick(V2_WORDS.liquids);
  const job       = rawPick(V2_WORDS.jobs);
  const rule      = rawPick(V2_WORDS.rules);
  // v2.2.1 — choice coverage contract. Previously color/move/mood were collected in picks
  // but the engine NEVER read them. Now they are real slots; beat cards can reference them,
  // and the coverage validator below ensures any user-selected value surfaces in the body.
  const color = picks.color?.w ? { text: picks.color.w } : null;
  const move  = picks.move?.w  ? { text: picks.move.w }  : null;
  const mood  = picks.mood?.w  ? { text: picks.mood.w }  : null;
  const freeword2 = picks.freeword2?.w ? { text: picks.freeword2.w } : null;
  /* v2.4.7 — weather is collected by the little-tier weather round (and any future tier
     that adds a weather round) but was unread until now. Treated as a free-string slot
     just like color/move/mood — beats can reference {weather.text} when relevant, and
     a coverage callback below makes sure the chosen weather surfaces in the body. */
  const weather = picks.weather?.w ? { text: picks.weather.w } : null;
  /* v2.5.0 — sky was unread until now. Tot tier has a `sky` round (sun/moon/star/cloud/kite/
     plane/rainbow/balloon/comet/snowflake/butterfly/firework/bubbles/rocket/rain/helicopter/
     leaf/high bubbles). Sky is wired as a free-string slot the same way; tot beats below
     reference {sky.text}, a coverage callback ensures it surfaces, and the highlight pass
     wraps it. */
  const sky = picks.sky?.w ? { text: picks.sky.w } : null;

  // Sidekick is optional. Pull from state.sidekicks if available; otherwise null.
  // (Beat cards that require sidekick will be filtered out when null.)
  const sidekickName = (typeof state !== 'undefined' && Array.isArray(state.sidekicks) && state.sidekicks.length)
    ? state.sidekicks[Math.floor(Math.random() * state.sidekicks.length)]
    : null;

  // v2.3.0 — pick a goal for the story. Goal becomes a first-class slot that
  // goal-spine beats reference as {goal.text} / {goal.cap} / {goal.past}.
  // Goals are tier-neutral for now (the chosen text is plain English that reads
  // for any age); tier-specific refinement is a future pass.
  const goalRaw = pickGoal();
  const goal = {
    text: goalRaw.text,
    cap:  V2Grammar.capitalize(goalRaw.text),
    past: goalRaw.past,
    tone: goalRaw.tone,
    id:   goalRaw.id,
  };

  const slots = {
    kid: { name: name || 'Friend', cap: V2Grammar.capitalize(name || 'Friend'), lc: (name || 'friend').toLowerCase() },
    sidekick: sidekickName ? { name: sidekickName, cap: V2Grammar.capitalize(sidekickName), lc: sidekickName.toLowerCase() } : null,
    companion, visitor, place, food, object, sound, adverb, number, liquid, job, rule,
    color, move, mood, weather, sky, freeword2,
    goal,    // v2.3.0 — load-bearing goal slot
  };

  // v2.3.0 — Route kid/big/tween to a CAUSALITY blueprint (one of four).
  // v2.3.1 — Now picks from 4 blueprints (goal_spine + lost_snack + show_wrong + rule_loophole)
  // so the same picks produce visibly different story shapes across replays.
  // tot and little keep their existing simpler recipes (tot_loop, gentle_quest)
  // because they need less narrative complexity.
  let seed, recipe;
  const BLUEPRINTS = ['goal_spine', 'lost_snack', 'show_wrong', 'rule_loophole'];
  if (tier === 'kid' || tier === 'big' || tier === 'tween') {
    const blueprintId = rawPick(BLUEPRINTS);
    recipe = V2_RECIPES[blueprintId];
    seed = { id: blueprintId + '_seed', tiers: [tier], recipe: blueprintId, requiredSlots: ['companion','visitor','food','object'] };
  } else {
    // tot + little still use their tier-specific seeds + recipes.
    const compatibleSeeds = V2_SEEDS.filter(s => s.tiers.includes(tier));
    if (compatibleSeeds.length === 0) return null;
    seed = rawPick(compatibleSeeds);
    recipe = V2_RECIPES[seed.recipe];
  }
  if (!recipe) return null;

  // v2.6.2 — storyMode controls whether the story ends with bedtime imagery (default)
  // or an "anytime" close (walking home, looking forward to tomorrow, no sleep cues).
  const storyMode = picks.storyMode === 'anytime' ? 'anytime' : 'bedtime';
  // Ending beat types that get filtered by storyMode. Other beat types ignore it.
  const ENDING_BEAT_TYPES = new Set(['tot_cozy_end','little_cozy_end','bedtime_landing']);

  // For each beat in the recipe, find an eligible beat card.
  // Eligibility: tier matches AND all required slots are present AND, if this beat
  // type is an ending, its `mode` tag matches the requested storyMode (untagged
  // beats default to bedtime — existing behavior pre-v2.6.2).
  function eligibleFor(beatType) {
    return V2_BEATS.filter(b => {
      if (b.beatType !== beatType) return false;
      if (!b.tiers.includes(tier)) return false;
      if (ENDING_BEAT_TYPES.has(beatType)) {
        const beatMode = b.mode || 'bedtime';
        if (beatMode !== storyMode) return false;
      }
      return b.requiredSlots.every(slotName => slots[slotName] != null);
    });
  }

  // Ensure first letter of each rendered paragraph is capitalized — handles the case where
  // a beat-card line opens with a {slot.articleText} that resolves to lowercase ("a knight…").
  function ensureSentenceStart(s) {
    if (!s) return s;
    return s.replace(/^([a-z])/, (m) => m.toUpperCase());
  }

  // v2.1.0 — when a non-surprise setting is locked, REPLACE the first recipe beat with a
  // setting-anchor beat. This guarantees the very first paragraph grounds the story in the
  // chosen place. If no setting-anchor is eligible for this tier+slots, fall back to the
  // normal recipe-first-beat (story still works, just less explicitly setting-locked).
  const isSetting = setting.id !== 'surprise';
  const beatTypeSequence = recipe.beats.slice();
  let useAnchor = false;
  if (isSetting) {
    const anchors = V2_BEATS.filter(b =>
      b.beatType === 'setting_anchor' &&
      b.tiers.includes(tier) &&
      b.requiredSlots.every(s => slots[s] != null)
    );
    if (anchors.length) useAnchor = true;
  }

  const paragraphs = [];
  if (useAnchor) {
    const anchors = V2_BEATS.filter(b =>
      b.beatType === 'setting_anchor' &&
      b.tiers.includes(tier) &&
      b.requiredSlots.every(s => slots[s] != null)
    );
    // v2.4.1 — prefer beats and lines not in the recent FIFO
    const card = __freshPickBeat(anchors) || rawPick(anchors);
    const picked = __freshPickLine(card) || { idx: 0, line: rawPick(card.lines) };
    __remember(__recentBeatIds, card.id, __RECENT_BEAT_CAP);
    __remember(__recentLineKeys, card.id + ':' + picked.idx, __RECENT_LINE_CAP);
    paragraphs.push(ensureSentenceStart(V2Grammar.render(picked.line, slots)));
    // Skip the first recipe beat — anchor replaces it
    beatTypeSequence.shift();
  }
  for (const beatType of beatTypeSequence) {
    const candidates = eligibleFor(beatType);
    if (candidates.length === 0) return null; // fallback to v1 if any beat type unfillable
    // v2.4.1 — prefer beats and lines not recently used; falls back to full pool if all recent
    const card = __freshPickBeat(candidates) || rawPick(candidates);
    const picked = __freshPickLine(card) || { idx: 0, line: rawPick(card.lines) };
    __remember(__recentBeatIds, card.id, __RECENT_BEAT_CAP);
    __remember(__recentLineKeys, card.id + ':' + picked.idx, __RECENT_LINE_CAP);
    paragraphs.push(ensureSentenceStart(V2Grammar.render(picked.line, slots)));
  }

  // Title — bind kid name + slot picks for a recognizable shape. Each recipe gets a slight
  // title bias for thematic fit (mystery → "Case of...", trial → "Trial of...", etc.) but
  // the universal patterns also fire for any recipe.
  const tc = V2Grammar.titleCase;
  const kidCap = V2Grammar.capitalize(slots.kid.name);
  /* v2.9.1 — filter universal title patterns to exclude references to slots that
     weren't user-picked AND aren't guaranteed to appear in the body. Previously a
     tot story (which has no creature round) could render "Cole vs the Group Chat"
     when the engine auto-filled visitor with a random pick from the setting bias,
     even though "Group Chat" never appeared in the body. Same issue for object,
     which is always auto-picked even when no object round runs. */
  const userPickedVisitor_title = !!picks.creature?.w;
  const userPickedObject_title  = !!picks.object?.w;
  const allUniversalTitlePatterns = [
    `${kidCap} and the ${tc(companion.text)}`,
    `The Day ${kidCap} Met ${tc(visitor.text)}`,
    `${kidCap} and the ${tc(object.text)} Problem`,
    `${kidCap}'s ${tc(food.text)} Adventure`,
    `${kidCap} and the ${tc(place.text)}`,
    `The ${tc(companion.text)} and the ${tc(food.text)}`,
    `How ${kidCap} Met ${tc(visitor.text)}`,
    `${kidCap} vs the ${tc(visitor.text)}`,
  ];
  const universalTitlePatterns = allUniversalTitlePatterns.filter(p => {
    if (!userPickedVisitor_title && /\bMet\b|\bvs the\b/.test(p)) return false;
    if (!userPickedObject_title  && /Problem/.test(p))            return false;
    return true;
  });
  const recipeTitlePatterns = {
    mystery:     [`The Curious Case of the ${tc(object.text)}`, `The Mystery of the ${tc(place.text)}`, `${kidCap} and the Missing ${tc(object.text)}`],
    trial:       [`The Trial of ${kidCap}`, `${kidCap} on Trial`, `The People vs ${kidCap}`],
    performance: [`${kidCap}'s Big Show`, `${kidCap} Takes the Stage`, `The ${tc(companion.text)} Performance`],
    bureaucracy: [`${kidCap} and the Impossible Form`, `${kidCap}'s Official Disaster`, `The ${tc(job.text)} Crisis`],
    quest:       [`${kidCap}'s Adventure to the ${tc(place.text)}`, `${kidCap} Goes to the ${tc(place.text)}`],
    /* Segment D — simpler titles for tot + little */
    tot_loop:    [`${kidCap} and the ${tc(companion.text)}`, `${kidCap} Says Hi!`, `Hi, ${tc(companion.text)}!`],
    /* v2.9.1 — removed `The ${companion} with the Tiny Hat` because it referenced a beat-specific
       detail (li_comp1's "tiny hat") that doesn't always fire. Title-content mismatch defect. */
    gentle_quest:[`${kidCap} and the ${tc(companion.text)}`, `${kidCap}'s ${tc(place.text)} Day`, `${kidCap} and the ${tc(food.text)}`],
    /* v2.3.0 — goal-spine titles reference the actual goal so the title sells the story */
    goal_spine: [
      `How ${kidCap} ${tc(goal.past.replace(/^[a-z]/, c => c.toUpperCase()))}`,
      `${kidCap} vs the ${tc(visitor.text)}`,
      `The Day ${kidCap} Tried to ${tc(goal.text)}`,
      `${kidCap}'s ${tc(food.text)} Plan`,
      `${kidCap} and the ${tc(companion.text)} Try to ${tc(goal.text)}`,
    ],
    /* v2.3.1 — blueprint-specific titles for the three new arcs */
    lost_snack: [
      `Who Took the ${tc(food.text)}?`,
      `${kidCap} and the Case of the Missing ${tc(food.text)}`,
      `The Great ${tc(food.text)} Mystery`,
      `${kidCap} Solves the ${tc(food.text)} Crime`,
    ],
    show_wrong: [
      `${kidCap}'s Big Show`,
      `The Day the ${tc(object.text)} Broke`,
      `${kidCap} Saves the Show`,
      `${kidCap} and the Show That Should Not Have Worked`,
    ],
    rule_loophole: [
      `${kidCap} and the ${tc(visitor.text)}'s Impossible Rule`,
      `How ${kidCap} Beat the Rule`,
      `${kidCap} Finds a Loophole`,
      `The ${tc(visitor.text)} vs ${kidCap}`,
    ],
  };
  const titlePool = [...universalTitlePatterns, ...(recipeTitlePatterns[seed.recipe] || [])];
  const title = rawPick(titlePool);

  // ============================================================
  // v2.2.1 — CHOICE COVERAGE CONTRACT
  // ============================================================
  // After paragraphs are generated, verify that each REQUIRED user pick surfaces in
  // the body text. If missing, inject a short authored callback sentence into the
  // middle paragraph (not P1, not the last) so the selected word is honored without
  // breaking the story arc.
  //
  // Tiers:
  //   ALWAYS required if available: companion (pet), food, place
  //   Required if user-picked:      visitor (creature)
  //   Preferred (max 2 sprinkled):  color, mood, move, freeword
  //
  // Title doesn't count as coverage — must appear in the body.

  function joinBody() { return paragraphs.join(' '); }
  function bodyHas(text) {
    if (!text) return false;
    // Case-insensitive substring against word boundaries to avoid "rain" matching "rainbow"
    const re = new RegExp('\\b' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    return re.test(joinBody());
  }

  // Authored callback sentences — tier-aware where it matters.
  // Each entry is an array; one is picked at random per missing slot.
  const callbacks = {
    companion: tier === 'tot'
      ? [' And the {companion.text} was there too.', ' The {companion.text} smiled.']
      : tier === 'little'
        ? [' The {companion.text} stayed close the whole time.', ' The {companion.text} did not want to miss any of it.']
        : tier === 'tween'
          ? [' The {companion.text} watched the whole thing. {companion.cap} judged it. Mildly.']
          : [' The {companion.text} stuck close the whole time, mostly for snack reasons.', ' Through it all, the {companion.text} did not leave their side.'],
    food: tier === 'tot'
      ? [' They had {food.articleText}. Yum!']
      : tier === 'little'
        ? [' {kid.cap} pulled out {food.articleText} they had saved. Just in time.']
        : tier === 'tween'
          ? [' Eventually somebody mentioned {food.articleText}. That changed things.']
          : [' Eventually, {kid.name} got around to the {food.text} they had been saving for exactly this moment.', ' Somebody finally pulled out {food.articleText}. Everyone perked up.'],
    place: [' The {place.text} hummed around them like it was in on the joke.', ' The {place.text} watched it all happen and said nothing.'],
    /* v2.4.2 — visitor callbacks now BRIDGE the entrance ("walked up", "showed up",
       "appeared") so the visitor doesn't pop into mid-paragraph as if they had always
       been there. Same fix for move (clarify subject). */
    visitor: tier === 'tot'
      ? [' Then {visitor.articleText} walked up and waved hi.']
      : tier === 'little'
        ? [' Then {visitor.articleText} walked up to see what was going on.', ' Just then, {visitor.articleText} came around the corner and joined in.']
        : [' Then {visitor.articleText} showed up to see what the fuss was about.', ' Then {visitor.articleText} appeared and started taking notes. Probably.'],
    color: tier === 'tot'
      ? [' Everything was a little {color.text}.']
      /* v2.4.6 — dropped "a {color.text}" template; produced "a orange" / "a iridescent" /
         "a electric blue" etc. when color started with a vowel. The two variants below
         avoid the indefinite article entirely so any color text reads grammatical. */
      : [' The whole scene turned {color.text} by then.', ' Somehow even the air looked {color.text}.'],
    mood: tier === 'tot'
      ? [' {kid.cap} felt {mood.text}.']
      : [' {kid.cap} was {mood.text} about the whole thing, in a quiet way.'],
    /* v2.4.2 — move callback names the kid as subject so it doesn't read as
       a stranded "they" referring to nobody in particular. */
    move: tier === 'tot'
      ? [' Then {kid.name} {move.text} too. Hee hee.']
      : tier === 'little'
        ? [' Then {kid.name} {move.text} a little, just because it felt right.', ' {kid.cap} {move.text} all around. It was that kind of day.']
        : [' {kid.cap} {move.text} a little, just because it felt right.', ' At some point {kid.name} {move.text} across the room, briefly.'],
    freeword: [' And once, very quietly, somebody said "{sound.text}".'],
    /* v2.4.7 — weather callback. Fires when user picked weather from the little
       weather round (or any future tier weather round) and no beat referenced it.
       Two variants so repeat-with-same-picks feels fresh. */
    weather: tier === 'tot' || tier === 'little'
      ? [' The {weather.text} weather kept going. They did not mind.', ' The whole day stayed {weather.text}.']
      : [' The {weather.text} weather hung around like it had nothing better to do.', ' Outside it stayed steadily {weather.text}, which felt fitting somehow.'],
    /* v2.5.0 — sky callback. Safety net for tot stories when no sky beat fired
     but the kid picked a sky thing (moon/kite/balloon/etc.). Language stays simple. */
    sky: [' The {sky.text} was right there. Just hanging out.', ' Above them: the {sky.text}. {sky.cap}!'],
  };

  function injectCallback(slotName) {
    if (!callbacks[slotName]) return false;
    const tpl = rawPick(callbacks[slotName]);
    const sentence = V2Grammar.render(tpl, slots);
    // Target paragraph: prefer middle (not first, not last). For 4-para stories: P2 or P3.
    const targetIdx = paragraphs.length >= 4
      ? 1 + Math.floor(Math.random() * (paragraphs.length - 2))
      : Math.max(0, paragraphs.length - 2);
    paragraphs[targetIdx] = paragraphs[targetIdx].trimEnd() + sentence;
    return true;
  }

  // Required: companion, food, place
  if (companion && !bodyHas(companion.text)) injectCallback('companion');
  if (food && !bodyHas(food.text))           injectCallback('food');
  // place: must appear in P1 if setting locked. If body doesn't mention place at all, repair.
  if (place && !bodyHas(place.text))         injectCallback('place');
  // Required if user-picked
  if (userPickedVisitor && visitor && !bodyHas(visitor.text)) injectCallback('visitor');
  // v2.4.7 — weather is also required-if-picked. Picker collects it for little tier and
  // any future tier with a weather round; must surface in the body when present.
  if (weather && !bodyHas(weather.text))     injectCallback('weather');
  // v2.5.0 — sky is required-if-picked for tot tier (no other tier has a sky round).
  if (sky && !bodyHas(sky.text))             injectCallback('sky');

  // Preferred sprinkles — cap at 2 per story to avoid pileups, but SHUFFLE so all four
  // user-selected categories get fair coverage across multiple stories (otherwise the
  // fixed order would starve move + freeword whenever color and mood were both missing).
  let sprinkleBudget = 2;
  const preferred = [
    color    && !bodyHas(color.text)    ? 'color'    : null,
    mood     && !bodyHas(mood.text)     ? 'mood'     : null,
    move     && !bodyHas(move.text)     ? 'move'     : null,
    // freeword — picks.freeword.w is the chosen word; sound.text equals it when user picked
    (picks.freeword?.w && !bodyHas(picks.freeword.w)) ? 'freeword' : null,
  ].filter(Boolean).sort(() => Math.random() - 0.5);
  for (const cat of preferred) {
    if (sprinkleBudget <= 0) break;
    if (injectCallback(cat)) sprinkleBudget--;
  }

  // ============================================================
  // v2.2.3 — HIGHLIGHT RESTORATION
  // ============================================================
  // v1 stories used [name:X]/[c:X]/[y:X] tokens in template literals. v2 renders plain
  // text, so parseStoryLine() never had tokens to wrap — the 60-story audit confirmed
  // 60/60 paragraphs had no highlight tokens. Post-process here: walk the title and each
  // paragraph, wrap the kid's name + sidekick + user-picked slot values in the same
  // tokens parseStoryLine already understands. parseStoryLine remains the single source
  // of HTML rendering for both v1 and v2.
  //
  // Rules:
  //   - Kid name + sidekick names      → [name:X]  (chip-style)
  //   - User-picked pet/food/creature/color/move/mood → [c:X]  (orange pop)
  //   - User-picked place + setting place + freeword  → [y:X]  (yellow pop)
  //   - Word-boundary, case-insensitive
  //   - Never re-wrap text that's already inside a token (lookbehind for ':' / '[')
  //   - Process longer terms FIRST so "electric blue" wins before "blue" alone
  function applyHighlightTokens(text) {
    if (!text) return text;
    function wrap(s, term, kind) {
      if (!term) return s;
      const trimmed = String(term).trim();
      if (!trimmed) return s;
      // Escape regex metacharacters in the term
      const esc = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // (?<![[:\w]) ensures we're not already inside a [name:...]/[c:...]/[y:...] token.
      // (?!\]) ensures we're not the captured text of a token currently being closed.
      const re = new RegExp('(?<![[:\\w])\\b' + esc + '\\b(?!\\])', 'gi');
      return s.replace(re, (m) => '[' + kind + ':' + m + ']');
    }
    let out = text;
    // Names first (sidekick may match before kid name if shorter — order by length desc)
    const names = [slots.kid.name, slots.sidekick && slots.sidekick.name]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    for (const n of names) out = wrap(out, n, 'name');
    // Color picks tend to be multi-word ("electric blue") — wrap longest first
    const cTerms = [
      picks.color?.w, picks.move?.w, picks.mood?.w,
      picks.pet?.w, picks.food?.w, picks.creature?.w,
      picks.weather?.w,  // v2.4.7
      picks.sky?.w,      // v2.5.0 — sky highlighted (tot only) when picked
    ].filter(Boolean).sort((a, b) => String(b).length - String(a).length);
    for (const t of cTerms) out = wrap(out, t, 'c');
    // Yellow: place pick + locked setting place + freeword
    const yTerms = [
      picks.place?.w,
      setting && setting.place ? setting.place.text : null,
      picks.freeword?.w,
    ].filter(Boolean).sort((a, b) => String(b).length - String(a).length);
    for (const t of yTerms) out = wrap(out, t, 'y');
    return out;
  }

  const highlightedTitle = applyHighlightTokens(title);
  const highlightedParagraphs = paragraphs.map(applyHighlightTokens);

  return { title: highlightedTitle, paragraphs: highlightedParagraphs };
}

/* ================================================================
   v3 ENGINE (experimental) — role-based story generation behind ?engine=v3

   Design lives in docs/v3-role-blueprints.md. This is the first working runtime.
   v2 remains the default. v3 only fires when window.NODDY_ENGINE === 'v3'
   (set from index.html when the URL has ?engine=v3 or localStorage 'nt_engine_v3').

   Architecture
   ------------
   • V3_BLUEPRINTS declare a roleMap (role → slot name) and a stage progression.
   • V3_BEATS are tagged by stage and required ROLES (not slots). The same beat
     can fire for any blueprint whose role map satisfies its required roles.
   • generateStoryV3 builds slots (reusing v2's mapPickToWord), applies the role
     map to produce a `roles` object, then walks stages picking eligible beats.
   • Beat lines reference {role.text} / {role.cap} / {role.articleText} etc.
     The render layer resolves role → slot at render time, so the same beat
     reads correctly across blueprints with different role-to-slot mappings.
   • Highlight tokens ([name:X]/[c:X]/[y:X]) are emitted DIRECTLY by beat lines
     instead of post-processed by regex. Token-aware authoring is the v3 path
     toward retiring applyHighlightTokens in a future cutover.

   First blueprint shipped: lost_snack_v3 (kid/big/tween).
   ================================================================ */

const V3_VERSION = 'v3.0.0-experimental';

/* v0.9.3 · b23 — HIGH_IMPACT_ROLES (declarative)
   ===============================================
   Engine roles whose rendered value lands in a structural punchline
   position — shouted, announced, or revealed as the comedic pivot.
   Their beat-line tokens use the yellow [y:...] highlight treatment
   (versus the orange [c:...] used for general picks).

   Picker-side: rounds that feed these roles are tagged
   `highImpact: true` in buildRounds() and their options/examples MUST
   come from the Absurd Word Bank (or its binary-tap counterpart,
   SOUND_HOT_OPTS). QA Section 17 enforces both halves of this contract.

   Notion Build Idea: "High-impact word slots: force funnier, more absurd
   choices" — 36813aa1-d4db-8147-84a8-eb888c5c6900.

   Adding a role here is a CONTRACT change — every existing beat line
   that uses [c:{<role>.text}] must be reviewed and converted to
   [y:{<role>.text}] (or removed), and the picker-source for that role
   must be added to the highImpact-eligible pools. */
const HIGH_IMPACT_ROLES = ['chant', 'payoff_word'];

/* Reverse map: which picker categories feed HIGH_IMPACT roles.
   v3 role map (in V3_BLUEPRINTS below) defines:
     chant       → 'sound'
     payoff_word → 'freeword2'
   The v2 fallback engine also reads `picks.freeword` for chant-like
   moments, so `freeword` is also in the high-impact pool. */
const HIGH_IMPACT_PICKER_CATEGORIES = ['sound', 'freeword', 'freeword2'];

const V3_BLUEPRINTS = {
  /* SHARED ROLE NOTES
     Beats can be tagged with `blueprintId` to scope them to a specific blueprint.
     Beats without `blueprintId` are wildcards and fire for any blueprint whose
     role map satisfies their requiredRoles. The `landing` stage is intentionally
     loosely-tagged so cozy bedtime beats can be reused across blueprints. */
  lost_snack_v3: {
    id: 'lost_snack_v3',
    tiers: ['kid', 'big', 'tween'],
    roleMap: {
      protagonist:       'kid',
      ally:              'companion',
      mcguffin:          'food',
      setting:           'place',
      false_suspect:     'visitor',
      signature_action:  'move',
      visual_signature:  'color',
      mood_throughline:  'mood',
      chant:             'sound',
      payoff_word:       'freeword2',
    },
    stages: [
      { name: 'setup',      requiredRoles: ['protagonist','ally','setting','mcguffin'] },
      { name: 'problem',    requiredRoles: ['protagonist','mcguffin','false_suspect'] },
      { name: 'attempt',    requiredRoles: ['protagonist','false_suspect'] },
      { name: 'escalation', requiredRoles: ['protagonist','ally','mcguffin'] },
      { name: 'payoff',     requiredRoles: ['protagonist','ally','mcguffin'] },
      { name: 'landing',    requiredRoles: ['protagonist','ally'] },
    ],
    // v0.9.3 · b20 — structural story-length pass: kid (ages 6-7) drops the
    // `attempt` stage (the kid-investigates-false-suspect middle beat) so
    // kid stories run 5 paragraphs instead of 6. The `escalation` beat is
    // kept because it's the load-bearing ALLY-WAS-THE-CULPRIT twist — that's
    // the joke. Big + tween keep all 6 stages for a fuller arc.
    skipStagesForKid: ['attempt'],
    titlePatterns: [
      'Who Took the [c:{mcguffin.titleText}]?',
      '[name:{protagonist.name}] and the [c:{mcguffin.titleText}] Mystery',
      'The Day the [c:{mcguffin.titleText}] Vanished',
      '[name:{protagonist.name}] vs the [c:{false_suspect.titleText}]',
    ],
  },

  /* GOAL SPINE — kid declares a CONCRETE goal in P1, hits an obstacle, decides,
     resolves. Mirrors v2's goal_spine but role-based. v2.7.0: `goal` role added
     so beats can reference {goal.text} ("rescue a stuck friend", "win the silly race",
     "open the door that won't open" etc.) — fixes the v2.6.x complaint that
     goal_spine stories never said what the goal actually was. */
  goal_spine_v3: {
    id: 'goal_spine_v3',
    tiers: ['kid', 'big', 'tween'],
    roleMap: {
      protagonist:       'kid',
      ally:              'companion',
      obstacle:          'visitor',
      mcguffin:          'food',
      setting:           'place',
      goal:              'goal',       // v2.7.0 — load-bearing concrete goal
      signature_action:  'move',
      visual_signature:  'color',
      mood_throughline:  'mood',
      chant:             'sound',
      payoff_word:       'freeword2',
    },
    stages: [
      { name: 'setup',      requiredRoles: ['protagonist','ally','setting','goal'] },
      { name: 'problem',    requiredRoles: ['protagonist','obstacle'] },
      { name: 'attempt',    requiredRoles: ['protagonist','signature_action'] },
      { name: 'escalation', requiredRoles: ['protagonist','obstacle','mcguffin'] },
      { name: 'payoff',     requiredRoles: ['protagonist','ally','goal'] },
      { name: 'landing',    requiredRoles: ['protagonist','ally'] },
    ],
    // v0.9.3 · b20 — kid drops `escalation` (the obstacle-worsens beat),
    // keeps `attempt` (the kid-tries-with-signature-action beat) which IS
    // the agency lift for ages 6-7. 5 paragraphs for kid.
    skipStagesForKid: ['escalation'],
    /* v0.9.3 · b24 — title verb agreement fix.
       Old patterns 1 and 3 used bare `{goal.titleText}` after a subject,
       producing "The Day Cole Invent a Brand New Dance" / "Cole and the
       Parrot Build the Perfect Hideout" — third-person singular -s missing.
       Goal text in V2_GOALS is authored in present-tense infinitive form,
       which only reads correctly after "to". New patterns wrap with
       "Tried to" / "Try to" so the bare verb stays grammatical. Pattern 4
       ("Cole vs the X") doesn't use goal text and is unchanged. */
    titlePatterns: [
      'The Day [name:{protagonist.name}] Tried to {goal.titleText}',
      'How [name:{protagonist.name}] Tried to {goal.titleText}',
      '[name:{protagonist.name}] and the [c:{ally.titleText}] Try to {goal.titleText}',
      '[name:{protagonist.name}] vs the [c:{obstacle.titleText}]',
    ],
  },

  /* SHOW WRONG — kid prepares a show, the prop breaks or the co-star fails,
     kid improvises with their signature move + chant and saves the day. */
  show_wrong_v3: {
    id: 'show_wrong_v3',
    tiers: ['kid', 'big', 'tween'],
    roleMap: {
      protagonist:       'kid',
      ally:              'companion',     // co-star
      obstacle:          'visitor',       // critic / heckler / audience member
      prop:              'object',        // the thing that breaks
      mcguffin:          'food',          // a side-flavor mcguffin (snack between scenes)
      setting:           'place',
      signature_action:  'move',          // the improv move
      visual_signature:  'color',
      mood_throughline:  'mood',
      chant:             'sound',         // the saving chant
      payoff_word:       'freeword2',     // the new catchphrase
    },
    stages: [
      { name: 'setup',      requiredRoles: ['protagonist','ally','setting','prop'] },
      { name: 'problem',    requiredRoles: ['protagonist','ally','prop'] },
      { name: 'attempt',    requiredRoles: ['protagonist','signature_action'] },
      { name: 'escalation', requiredRoles: ['protagonist','ally'] },
      { name: 'payoff',     requiredRoles: ['protagonist','ally'] },
      { name: 'landing',    requiredRoles: ['protagonist','ally'] },
    ],
    // v0.9.3 · b20 — kid drops `escalation` (climax wind-up); keeps
    // `attempt` because it IS the improv that saves the show. 5 paragraphs.
    skipStagesForKid: ['escalation'],
    titlePatterns: [
      'The Day [name:{protagonist.name}] Saved the Show',
      '[name:{protagonist.name}] and the [c:{ally.titleText}] Take the Stage',
      'The [c:{prop.titleText}] Broke But [name:{protagonist.name}] Did Not',
      '[name:{protagonist.name}]\'s Big Show',
    ],
  },

  /* RULE LOOPHOLE — visitor imposes an absurd rule that blocks the mcguffin;
     kid uses a tool (object) and signature move to find the loophole. */
  rule_loophole_v3: {
    id: 'rule_loophole_v3',
    tiers: ['kid', 'big', 'tween'],
    roleMap: {
      protagonist:       'kid',
      ally:              'companion',
      rule_imposer:      'visitor',
      mcguffin:          'food',        // the thing the rule denies
      loophole_tool:     'object',      // the kid's escape
      setting:           'place',
      signature_action:  'move',
      visual_signature:  'color',
      mood_throughline:  'mood',
      chant:             'sound',
      payoff_word:       'freeword2',
    },
    stages: [
      { name: 'setup',      requiredRoles: ['protagonist','ally','setting'] },
      { name: 'problem',    requiredRoles: ['protagonist','rule_imposer','mcguffin'] },
      { name: 'attempt',    requiredRoles: ['protagonist','loophole_tool'] },
      { name: 'escalation', requiredRoles: ['protagonist','rule_imposer','loophole_tool'] },
      { name: 'payoff',     requiredRoles: ['protagonist','mcguffin','rule_imposer'] },
      { name: 'landing',    requiredRoles: ['protagonist','ally'] },
    ],
    // v0.9.3 · b20 — kid drops `escalation` (the imposer-vs-tool clash);
    // keeps `attempt` (kid uses loophole_tool — the agency beat). 5 paragraphs.
    skipStagesForKid: ['escalation'],
    titlePatterns: [
      '[name:{protagonist.name}] and the [c:{rule_imposer.titleText}]\'s Rule',
      'The Loophole at the [y:{setting.titleText}]',
      'How [name:{protagonist.name}] Outsmarted the [c:{rule_imposer.titleText}]',
      '[name:{protagonist.name}] vs the Rule',
    ],
  },

  /* ============================================================
     v2.10.0 — tot/little-v3 blueprints (per docs/tot-little-v3-design.md)

     Simplified 3-role contract for ages 2-5:
       protagonist  = kid (always)
       ally         = companion (pet)
       wonder_object = food | sky | object (per blueprint)
     Optional flavor roles: visual_signature (color), signature_action (move)

     Stages (3): setup → silly_repeat (fires TWICE for P2 + P3) → cozy_end.
     Total paragraphs per story: 4 (vs kid/big/tween v3's 6).

     The silly_repeat stage runs twice in the stages array. The engine's
     in-story beat dedup (added in v2.10.0) ensures the two silly_repeat
     paragraphs use different beats.

     Beat library (added below in V3_BEATS) uses tier-only filtering
     (no blueprintId) so tot_wonder_v3 + tot_sky_v3 share the tot pool,
     little_quest_v3 + little_food_v3 share the little pool. The wonder_object
     role resolves to food/sky/object per blueprint roleMap — same line works.
     ============================================================ */

  tot_wonder_v3: {
    id: 'tot_wonder_v3',
    tiers: ['tot'],
    paragraphCount: 4,
    roleMap: {
      protagonist:      'kid',
      ally:             'companion',
      wonder_object:    'food',          // food as the playful focus
      visual_signature: 'color',
      signature_action: 'move',
      chant:            'sound',         // v0.9.3 · b24 — optional HIGH_IMPACT slot for tot
    },
    stages: [
      { name: 'tl_setup',        requiredRoles: ['protagonist', 'ally'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_cozy_end',     requiredRoles: ['protagonist', 'ally'] },
    ],
    titlePatterns: [
      'Hi, [c:{ally.titleText}]!',
      '[name:{protagonist.name}] and the [c:{ally.titleText}]',
      '[name:{protagonist.name}] and the [c:{wonder_object.titleText}]',
      '[name:{protagonist.name}] Says Hi!',
    ],
  },

  tot_sky_v3: {
    id: 'tot_sky_v3',
    tiers: ['tot'],
    paragraphCount: 4,
    roleMap: {
      protagonist:      'kid',
      ally:             'companion',
      wonder_object:    'sky',           // sky pick drives the playful focus
      visual_signature: 'color',
      signature_action: 'move',
      chant:            'sound',         // v0.9.3 · b24 — optional HIGH_IMPACT slot for tot
    },
    stages: [
      { name: 'tl_setup',        requiredRoles: ['protagonist', 'ally'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_cozy_end',     requiredRoles: ['protagonist', 'ally'] },
    ],
    titlePatterns: [
      '[name:{protagonist.name}] Sees the [c:{wonder_object.titleText}]',
      'The [c:{wonder_object.titleText}] and the [c:{ally.titleText}]',
      '[name:{protagonist.name}] and the [c:{wonder_object.titleText}]',
      'Hi, [c:{wonder_object.titleText}]!',
    ],
  },

  little_quest_v3: {
    id: 'little_quest_v3',
    tiers: ['little'],
    paragraphCount: 4,
    roleMap: {
      protagonist:      'kid',
      ally:             'companion',
      wonder_object:    'object',        // a found thing — the kid's treasure
      visual_signature: 'color',
      signature_action: 'move',
      pressure:         'weather',        // little-specific flavor
      chant:            'sound',         // v0.9.3 · b24 — optional HIGH_IMPACT slot for little
    },
    stages: [
      { name: 'tl_setup',        requiredRoles: ['protagonist', 'ally'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_cozy_end',     requiredRoles: ['protagonist', 'ally'] },
    ],
    titlePatterns: [
      '[name:{protagonist.name}] and the [c:{wonder_object.titleText}]',
      'How [name:{protagonist.name}] Found the [c:{wonder_object.titleText}]',
      '[name:{protagonist.name}] and the [c:{ally.titleText}]',
      'The [c:{wonder_object.titleText}] Adventure',
    ],
  },

  little_food_v3: {
    id: 'little_food_v3',
    tiers: ['little'],
    paragraphCount: 4,
    roleMap: {
      protagonist:      'kid',
      ally:             'companion',
      wonder_object:    'food',          // chosen food as the playful focus
      visual_signature: 'color',
      signature_action: 'move',
      pressure:         'weather',
      chant:            'sound',         // v0.9.3 · b24 — optional HIGH_IMPACT slot for little
    },
    stages: [
      { name: 'tl_setup',        requiredRoles: ['protagonist', 'ally'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_silly_repeat', requiredRoles: ['protagonist', 'ally', 'wonder_object'] },
      { name: 'tl_cozy_end',     requiredRoles: ['protagonist', 'ally'] },
    ],
    titlePatterns: [
      '[name:{protagonist.name}] and the [c:{wonder_object.titleText}]',
      'The [c:{wonder_object.titleText}] Day',
      '[name:{protagonist.name}] Shares the [c:{wonder_object.titleText}]',
      '[name:{protagonist.name}] and the [c:{ally.titleText}]',
    ],
  },
};

/* v0.9.3 · b24 — Comedy-role contract (jokeJob taxonomy)
   ========================================================
   Every V3 beat performs a comedic JOB. Tagging the job makes it possible
   to audit narrative balance ("how many setups vs. how many punchlines?")
   and to A/B specific joke types without rewriting whole blueprints.

   Taxonomy (introduced b24; populated on new beats. Retroactive tagging
   of pre-b24 beats is queued for b25 — existing untagged beats are
   conceptually "untyped" and treated as glue/setup until audited):

     setup              — establishes the world, the picks, the stakes
     escalation         — raises the pressure / makes the problem worse
     reversal           — flips expectation (the ally was the culprit, etc.)
     physical_gag       — visible body / object humor; safe across all ages
     callback           — references an earlier picked word as a return joke
     punchline          — the joke lands; usually carries [y:...] highlights
     absurd_consequence — kid's HIGH_IMPACT word CAUSES a scene event
                          (object reacts / rule changes / ally misunderstands /
                          audience chants back / prop comes back to life)
     cozy_landing       — bedtime/anytime close; lowers temperature

   Add `jokeJob: '<job>'` to a beat to participate. Lack of a jokeJob is
   not an error — Section 17 only audits HIGH_IMPACT contracts; this
   metadata is descriptive, not gated. */
const V3_BEATS = [
  /* ============================================================
     lost_snack_v3 — kid + ally lose food, false_suspect framed,
     real culprit is the ally (twist).
     ============================================================ */
  /* v3_ls_setup_1 — b18 length pass: line-1 redundant intensifier
     "They were excited." dropped (no tokens; next sentence already says
     "extra excited" with the ally token). Line 2 keeps "Just one second."
     as the callback-rhythm punchline. */
  /* v0.9.3 · b28 — added two more setup variants. The pre-b28 pool of 2 with
     both lines opening "<name> and the <ally>" or "at the <setting>" drove the
     47% repetition hit. Four variants spread the pattern below threshold. */
  { id:'v3_ls_setup_1', stage:'setup', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','setting','mcguffin'],
    lines: [
      'The [c:{mcguffin.text}] had been [name:{protagonist.name}]\'s plan all morning. The [c:{ally.text}] was already at the [y:{setting.text}], waiting. The [c:{ally.text}] was extra excited.',
      '[name:{protagonist.name}] set the [c:{mcguffin.text}] down at the [y:{setting.text}] for one second. The [c:{ally.text}] watched. [name:{protagonist.name}] turned to grab a napkin. Just one second.',
      'There was the [y:{setting.text}]. There was [name:{protagonist.name}]. There was the [c:{ally.text}]. And there, briefly, was the [c:{mcguffin.text}].',
      '[name:{protagonist.name}] had carried the [c:{mcguffin.text}] all the way over to the [y:{setting.text}]. The [c:{ally.text}] tagged along. The whole morning had been building to this.',
    ] },
  /* v0.9.3 · b24 — plural-mcguffin agreement fix. The old "The {mcguffin}
     was technically the mission" broke for plural mcguffins ("The
     taquitos was technically the mission"). Restructured to use the
     mcguffin without a singular verb. */
  { id:'v3_ls_setup_2', stage:'setup', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting','mcguffin'],
    lines: [
      'One thing mattered today: the [c:{mcguffin.text}]. The [y:{setting.text}] was the venue. The [c:{ally.text}] was technically the witness. The mission, technically, involved the [c:{mcguffin.text}].',
    ] },

  { id:'v3_ls_problem_1', stage:'problem', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','mcguffin','false_suspect'],
    lines: [
      'When [name:{protagonist.name}] turned back, the [c:{mcguffin.text}] had VANISHED. Just gone. A [c:{false_suspect.text}] stood nearby, looking very innocent. WAY too innocent.',
      'The [c:{mcguffin.text}] had vanished. [name:{protagonist.name}] looked around. The [c:{false_suspect.text}] was right there, suspiciously casual. "It was you, wasn\'t it," said [name:{protagonist.name}].',
    ] },
  /* v0.9.3 · b24 — variant expansion. Pre-b24 this beat had one line and
     surfaced in 30% of 50 stories per Codex sample, dragging the "in a
     way that meant business" + "noticed and tried to act normal. It was
     not working." phrases into a recognizable repeat. New variants keep
     the same beats (vanish → mood reaction → suspect tell) but vary the
     glue, so the random pool no longer collapses to one signature line. */
  { id:'v3_ls_problem_mood', stage:'problem', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','mcguffin','false_suspect','mood_throughline'],
    lines: [
      'The [c:{mcguffin.text}] had vanished. [name:{protagonist.name}] felt [c:{mood_throughline.text}] and unusually focused about it. The [c:{false_suspect.text}] noticed and tried to act normal. It was not working.',
      'The [c:{mcguffin.text}] had vanished. [name:{protagonist.name}] got [c:{mood_throughline.text}] about it. The [c:{false_suspect.text}] tried a slow shrug. The shrug arrived late and crooked.',
      'The [c:{mcguffin.text}] had vanished. [name:{protagonist.name}] turned [c:{mood_throughline.text}] in a way the [c:{false_suspect.text}] could feel from across the room. The [c:{false_suspect.text}] coughed for no reason.',
      'No [c:{mcguffin.text}] anywhere. [name:{protagonist.name}] went [c:{mood_throughline.text}] like a tiny detective. The [c:{false_suspect.text}] hummed a song nobody had asked for.',
    ] },
  { id:'v3_ls_problem_tween', stage:'problem', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','mcguffin','false_suspect'],
    lines: [
      'The [c:{mcguffin.text}]: gone. The [c:{false_suspect.text}]: present, suspiciously well-rehearsed. [name:{protagonist.name}] did not love this development.',
    ] },

  { id:'v3_ls_attempt_move', stage:'attempt', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','false_suspect','signature_action'],
    lines: [
      '[name:{protagonist.name}] [c:{signature_action.text}] over to the [c:{false_suspect.text}] and squinted. "Where is it?" The [c:{false_suspect.text}] said nothing. [name:{protagonist.name}] [c:{signature_action.text}] around the room again, looking for crumbs.',
      'So [name:{protagonist.name}] [c:{signature_action.text}] across the scene. The [c:{false_suspect.text}] watched the whole thing. The trail of crumbs did NOT lead to the [c:{false_suspect.text}]. Interesting.',
    ] },
  { id:'v3_ls_attempt_color', stage:'attempt', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','false_suspect','visual_signature'],
    lines: [
      '[name:{protagonist.name}] spotted it: a tiny [c:{visual_signature.text}] crumb on the floor. Then another. Then another. The crumbs were leading somewhere. They were not leading to the [c:{false_suspect.text}].',
    ] },
  /* v2.7.0 — color-as-clue. Color becomes the visible thing that solves the mystery
     instead of an ambient "scene had a tint" decoration. */
  { id:'v3_ls_attempt_color_clue', stage:'attempt', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','visual_signature'],
    lines: [
      '[name:{protagonist.name}] knelt down. There was a [c:{visual_signature.text}] smudge on the floor. Just one. Right where the [c:{ally.text}] had been sitting. Hmm.',
      'Something [c:{visual_signature.text}] caught [name:{protagonist.name}]\'s eye. A tiny smear. On the rug. In the EXACT shape of a paw print. The [c:{ally.text}] looked at the ceiling.',
    ] },
  /* mood-as-approach: kid acts ON the mood, doesn\'t just feel it. */
  { id:'v3_ls_attempt_mood_action', stage:'attempt', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','false_suspect','mood_throughline'],
    lines: [
      '[name:{protagonist.name}] put on their most [c:{mood_throughline.text}] expression and walked very slowly toward the [c:{false_suspect.text}]. The [c:{false_suspect.text}] tried to back away. "Tell me what you saw," said [name:{protagonist.name}], staying [c:{mood_throughline.text}]. The [c:{false_suspect.text}] cracked immediately.',
    ] },
  { id:'v3_ls_attempt_plain', stage:'attempt', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','false_suspect'],
    lines: [
      '[name:{protagonist.name}] did some detective work. Looked at the floor. Looked at the [c:{false_suspect.text}]. Followed a faint trail. The trail led somewhere else entirely.',
    ] },
  { id:'v3_ls_attempt_tween_move', stage:'attempt', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','false_suspect','signature_action'],
    lines: [
      '[name:{protagonist.name}] [c:{signature_action.text}] past the [c:{false_suspect.text}] with theatrical timing. None of it was on purpose. All of it landed.',
    ] },

  /* v3_ls_escalation_1 — b18 length pass: line-2 weak one-word flourish
     "Mostly." dropped. The "very sorry" beat lands cleanly without it. */
  { id:'v3_ls_escalation_1', stage:'escalation', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'The trail led to the [c:{ally.text}]. Of course. The [c:{ally.text}] had a single crumb of [c:{mcguffin.text}] on its face. "YOU?" said [name:{protagonist.name}]. The [c:{ally.text}] looked away politely.',
      'Plot twist nobody saw coming except maybe the [c:{ally.text}]: it was the [c:{ally.text}]. The [c:{ally.text}] had been the [c:{mcguffin.text}] thief the whole time. It was very sorry.',
    ] },
  /* v2.7.0 — funnier guilty-pet reveals. Ally pet shows guilt in kid-readable ways:
     burp gives them away, can\'t make eye contact, pretends to be asleep, ear pinned. */
  { id:'v3_ls_escalation_burp', stage:'escalation', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'Then the [c:{ally.text}] burped. A specific burp. The kind of burp that smells exactly like [c:{mcguffin.text}]. "Oh," said [name:{protagonist.name}]. The [c:{ally.text}] tried to look surprised. It was not convincing.',
      'Right then the [c:{ally.text}] hiccuped. Out came a tiny crumb of [c:{mcguffin.text}]. Then another. Then a third. The [c:{ally.text}] looked at the crumbs. The crumbs looked back. Everybody knew.',
    ] },
  /* v0.9.3 · b24 — plural-mcguffin agreement fix. Line 1 used to say
     "The [c:{mcguffin.text}] was unaccounted for" — broke for plural
     mcguffins (pretzels was, donuts was, taquitos was). Restructured to
     "had vanished" which is plural-neutral past-tense. */
  { id:'v3_ls_escalation_eyes', stage:'escalation', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'The [c:{ally.text}] suddenly found something fascinating on the ceiling. "Hey," said [name:{protagonist.name}]. The [c:{ally.text}] would not look down. The [c:{mcguffin.text}] had vanished. So had the [c:{ally.text}]\'s alibi. Connected.',
      '[name:{protagonist.name}] turned slowly to the [c:{ally.text}]. The [c:{ally.text}] pretended to be very interested in a leaf. The [c:{ally.text}] had been holding that leaf the whole time. It was a fake leaf. "Caught," said [name:{protagonist.name}].',
    ] },
  { id:'v3_ls_escalation_tween', stage:'escalation', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'The real culprit, obviously, was the [c:{ally.text}]. [name:{protagonist.name}] should have known. The [c:{ally.text}] had crumbs of [c:{mcguffin.text}] on its face and zero regret in its eyes.',
    ] },
  { id:'v3_ls_escalation_tween_eyes', stage:'escalation', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'The [c:{ally.text}] was avoiding eye contact, which was, frankly, suspicious. Also there were [c:{mcguffin.text}] crumbs on the floor in a perfect trail leading right to the [c:{ally.text}]. [name:{protagonist.name}] connected the dots without saying a word.',
    ] },

  /* v3_ls_payoff_chant — b18 length pass: weak terminal flourish
     "Case closed." dropped. The "formal apology" sentence is already the
     resolution beat. */
  { id:'v3_ls_payoff_chant', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','mcguffin','chant'],
    lines: [
      '"[y:{chant.text}]!" yelled [name:{protagonist.name}]. The [c:{ally.text}] squawked back. Everyone agreed to share the next batch of [c:{mcguffin.text}]. The [c:{false_suspect.text}] demanded a formal apology. [name:{protagonist.name}] gave one.',
    ] },
  /* v0.9.3 · b24 — HIGH_IMPACT absurd_consequence variants. The kid's
     chosen chant CAUSES a scene event (mcguffin reacts / ally misunderstands
     / audience chants back) instead of just decorating the moment. */
  { id:'v3_ls_payoff_chant_mcguffin_reacts', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" yelled [name:{protagonist.name}]. The [c:{mcguffin.text}] heard it. The [c:{mcguffin.text}] reappeared on the table like nothing had happened. The [c:{ally.text}] tried to look surprised.',
    ] },
  { id:'v3_ls_payoff_chant_ally_misunderstands', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" said [name:{protagonist.name}], meaning case closed. The [c:{ally.text}] heard it as a command and immediately did a tiny dance. Mid-dance, the [c:{mcguffin.text}] arrived back on the table. No questions.',
    ] },
  { id:'v3_ls_payoff_chant_room_chants_back', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" went [name:{protagonist.name}]. "[y:{chant.text}]!" went the [c:{ally.text}]. "[y:{chant.text}]!" went the [c:{mcguffin.text}], somehow. The investigation closed on the spot.',
    ] },
  /* v0.9.3 · b26 — three more lost_snack absurd_consequence beats
     hitting the missing-snack mechanic (clue/suspicious/reveal/snack
     payoff) with chant + payoff_word causation. */
  { id:'v3_ls_payoff_chant_suspect_caves', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin','false_suspect','chant'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] looked straight at the [c:{false_suspect.text}] and said one word: "[y:{chant.text}]." The [c:{false_suspect.text}] confessed immediately. To a different crime. [name:{protagonist.name}] noted it for later.',
    ] },
  { id:'v3_ls_payoff_payword_crumb_reveal', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin','payoff_word'], jokeJob:'absurd_consequence',
    lines: [
      'A tiny crumb of [c:{mcguffin.text}] fell out of the [c:{ally.text}]\'s mouth right as [name:{protagonist.name}] said "[y:{payoff_word.text}]." Perfect timing. The [c:{ally.text}] didn\'t even pretend to deny it.',
    ] },
  { id:'v3_ls_payoff_chant_mcguffin_returns', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin','chant'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] called out "[y:{chant.text}]" once, gently, like a summoning. The [c:{mcguffin.text}] reappeared on the counter. Nobody saw who put it there. The [c:{ally.text}] looked elsewhere very deliberately.',
    ] },
  { id:'v3_ls_payoff_payword', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','mcguffin','payoff_word'],
    lines: [
      'The [c:{ally.text}] hiccuped one more time and a tiny crumb of [c:{mcguffin.text}] popped out. [name:{protagonist.name}] laughed so hard. "[y:{payoff_word.text}]!" yelled [name:{protagonist.name}]. The [c:{ally.text}] echoed back, mouth full.',
    ] },
  /* v0.9.3 · b24 — plural-mcguffin agreement. Old "The {mcguffin} was
     very good" broke for plural foods. Rewritten as "Everyone agreed
     the {mcguffin} tasted good" — plural-neutral verb. */
  { id:'v3_ls_payoff_plain', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'Everyone got [c:{mcguffin.articleText}] in the end, even the [c:{ally.text}], which was technically the criminal. Justice was unevenly served. Everyone agreed the [c:{mcguffin.text}] tasted great.',
    ] },
  { id:'v3_ls_payoff_tween', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'In the end the [c:{mcguffin.text}] got shared. Sort of. The [c:{ally.text}] got the biggest piece, which felt correct, given the circumstances. [name:{protagonist.name}] did not press charges.',
    ] },

  { id:'v3_ls_landing_1', stage:'landing', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'That night, [name:{protagonist.name}] curled up. The [c:{ally.text}], full of stolen crumbs, curled up too. Tomorrow: more snacks. Tonight: rest.',
    ] },
  { id:'v3_ls_landing_tween', stage:'landing', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] went home thinking about it. The [c:{ally.text}] followed, looking satisfied. Some mysteries solve themselves. This one had the [c:{ally.text}] on its face the whole time.',
    ] },
  /* v2.6.2 — lost_snack_v3 anytime landings */
  { id:'v3_ls_landing_any', stage:'landing', blueprintId:'lost_snack_v3', mode:'anytime', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'Back home, [name:{protagonist.name}] high-fived the [c:{ally.text}] over the case being officially closed. They both started planning the next caper. Justice, snacks, then more justice.',
    ] },
  { id:'v3_ls_landing_any_tween', stage:'landing', blueprintId:'lost_snack_v3', mode:'anytime', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'Walking home, [name:{protagonist.name}] mentally workshopped how to retell this. The [c:{ally.text}], still chewing, deserved to be in the story. As a hero. Definitely as a hero.',
    ] },
  /* v0.9.3 · b26 — callback-in-landing for lost_snack_v3.
     The kid's chant ECHOES into the final paragraph so the punchline
     word lands twice (callback / payoff comedy mechanic). Requires chant
     so it only fires when sound was picked. */
  { id:'v3_ls_landing_chant_callback', stage:'landing', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'That night, [name:{protagonist.name}] curled up. The [c:{ally.text}] curled up too. Somewhere in the dark, very softly, [name:{protagonist.name}] said "[y:{chant.text}]" one more time. The [c:{ally.text}] said it back. Then sleep.',
    ] },
  { id:'v3_ls_landing_payword_callback', stage:'landing', blueprintId:'lost_snack_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      'Bedtime came. [name:{protagonist.name}] yawned. The [c:{ally.text}] yawned too. Just before sleep, the [c:{ally.text}] mumbled "[y:{payoff_word.text}]" into the pillow, like it was the official sign-off now.',
    ] },
  { id:'v3_ls_landing_chant_callback_tween', stage:'landing', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'Later, [name:{protagonist.name}] replayed the whole case in their head. The [c:{ally.text}] was already asleep, technically guilty, deeply unbothered. "[y:{chant.text}]," whispered [name:{protagonist.name}], for the record. Nobody overruled them.',
    ] },
  { id:'v3_ls_landing_payword_callback_tween', stage:'landing', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      'Walking home, [name:{protagonist.name}] mentally workshopped how to retell this. The [c:{ally.text}] was still chewing. "[y:{payoff_word.text}]," said [name:{protagonist.name}] one last time, just to close the bit. The [c:{ally.text}] said it back, mouth full.',
    ] },

  /* ============================================================
     goal_spine_v3 — kid declares a goal, hits an obstacle, decides,
     resolves with the ally's help. signature_action drives the attempt.
     ============================================================ */
  /* v2.7.0 — goal-aware setup beats. The goal is concrete ({goal.text} = "rescue
     a stuck friend" / "win the silly race" / "open the door that won't open" etc.)
     so the reader knows in P1 what the story is about. */
  { id:'v3_gs_setup_goal_1', stage:'setup', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','setting','goal'],
    lines: [
      '[name:{protagonist.name}] woke up with a plan. Today, at the [y:{setting.text}], [name:{protagonist.name}] was going to {goal.text}. The [c:{ally.text}] was in. The [c:{ally.text}] was always in.',
      'It started at the [y:{setting.text}]. [name:{protagonist.name}] looked at the [c:{ally.text}] and made up their mind: today they would {goal.text}. No matter what.',
      '[name:{protagonist.name}] pulled the [c:{ally.text}] aside at the [y:{setting.text}]. The plan was simple: {goal.text}. The [c:{ally.text}] nodded immediately. It was on.',
    ] },
  { id:'v3_gs_setup_goal_tween', stage:'setup', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting','goal'],
    lines: [
      'One objective today, at the [y:{setting.text}]: {goal.text}. The [c:{ally.text}] knew it. [name:{protagonist.name}] knew it. Everybody else would find out shortly.',
      'Today\'s mission, agreed silently between [name:{protagonist.name}] and the [c:{ally.text}] at the [y:{setting.text}]: {goal.text}. [name:{protagonist.name}] did not love announcing missions out loud, but this one felt different.',
    ] },
  /* Fallback set when goal slot is somehow absent — kept for safety, mirrors v2.6.x voice.
     b18 length pass: terminal flourish "Whatever the plan was, today was the day."
     dropped (no tokens; the "woke up with a plan" already established that). */
  { id:'v3_gs_setup_1', stage:'setup', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','setting'],
    lines: [
      '[name:{protagonist.name}] woke up with a plan at the [y:{setting.text}]. The [c:{ally.text}] was already on board.',
    ] },
  { id:'v3_gs_setup_tween', stage:'setup', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting'],
    lines: [
      'Today at the [y:{setting.text}], [name:{protagonist.name}] had one objective. The [c:{ally.text}] knew it. [name:{protagonist.name}] knew it. Everybody else would find out shortly.',
    ] },

  /* v2.7.0 — goal-aware problem beats name what the obstacle is blocking. */
  { id:'v3_gs_problem_goal', stage:'problem', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','obstacle','goal'],
    lines: [
      'But the [c:{obstacle.text}] was in the way. The [c:{obstacle.text}] did not want [name:{protagonist.name}] to {goal.text}. The [c:{obstacle.text}] had its own ideas, and the ideas were terrible.',
      'The [c:{obstacle.text}] appeared out of nowhere. "You? Today? Trying to {goal.text}?" said the [c:{obstacle.text}]. "Absolutely not." It folded its arms with purpose.',
      'There was just one problem: a [c:{obstacle.text}] stood between [name:{protagonist.name}] and the goal. "Nope," said the [c:{obstacle.text}]. "Not today. Not {goal.text}. Not on my watch."',
    ] },
  { id:'v3_gs_problem_1', stage:'problem', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','obstacle'],
    lines: [
      'The [c:{obstacle.text}] appeared out of nowhere. "Absolutely not," said the [c:{obstacle.text}]. The folded arms meant business.',
      'But the [c:{obstacle.text}] was in the way. The [c:{obstacle.text}] had its own ideas, and the ideas were terrible.',
    ] },
  { id:'v3_gs_problem_mood', stage:'problem', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','obstacle','mood_throughline'],
    lines: [
      'The [c:{obstacle.text}] stood between [name:{protagonist.name}] and victory. [name:{protagonist.name}] felt [c:{mood_throughline.text}] about it. The [c:{obstacle.text}] did not look like it was going to move on its own.',
    ] },
  { id:'v3_gs_problem_tween', stage:'problem', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','obstacle'],
    lines: [
      'The [c:{obstacle.text}] arrived. Of course it did. The [c:{obstacle.text}] had opinions, and the opinions ran directly counter to [name:{protagonist.name}]\'s plan. The vibes were bad.',
    ] },

  { id:'v3_gs_attempt_move', stage:'attempt', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','signature_action'],
    lines: [
      'So [name:{protagonist.name}] [c:{signature_action.text}]. Just like that. Right past everything. The [c:{ally.text}] followed. Everybody else stopped to watch.',
      '[name:{protagonist.name}] took one big breath, then [c:{signature_action.text}] forward fast — faster than anyone expected. Even [name:{protagonist.name}] was a little surprised.',
    ] },
  { id:'v3_gs_attempt_tween_move', stage:'attempt', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','signature_action'],
    lines: [
      '[name:{protagonist.name}] [c:{signature_action.text}] right through the scene. The motion alone was a kind of argument. Nobody knew how to counter it.',
    ] },
  { id:'v3_gs_attempt_color', stage:'attempt', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','visual_signature'],
    lines: [
      '[name:{protagonist.name}] held up a [c:{visual_signature.text}] thing. Nobody knew exactly what it was, including [name:{protagonist.name}], but it bought a moment. A moment was enough.',
    ] },
  /* v2.7.0 — color as a costume / signal flag the kid uses to push through. */
  { id:'v3_gs_attempt_color_signal', stage:'attempt', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','obstacle','visual_signature'],
    lines: [
      '[name:{protagonist.name}] suddenly pulled out a [c:{visual_signature.text}] flag and waved it dramatically. The [c:{obstacle.text}] hesitated. The [c:{obstacle.text}] had not been briefed on the flag. The flag took the [c:{obstacle.text}] out of the moment for exactly long enough.',
      'And then [name:{protagonist.name}] did the most [c:{visual_signature.text}] thing imaginable: walked right past the [c:{obstacle.text}] while pretending to be a [c:{visual_signature.text}] traffic cone. The [c:{obstacle.text}] watched, confused. The plan was working.',
    ] },
  /* mood-as-approach: kid faces the obstacle in the chosen mood */
  { id:'v3_gs_attempt_mood', stage:'attempt', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','obstacle','mood_throughline'],
    lines: [
      '[name:{protagonist.name}] walked up to the [c:{obstacle.text}] in full [c:{mood_throughline.text}] mode. Not asking permission. Not apologizing. Just [c:{mood_throughline.text}]. The [c:{obstacle.text}] had not prepared for [c:{mood_throughline.text}]. The [c:{obstacle.text}] took a small step back.',
    ] },

  { id:'v3_gs_escalation_1', stage:'escalation', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','obstacle','mcguffin'],
    lines: [
      'The [c:{obstacle.text}] was not done. It produced [c:{mcguffin.articleText}] and waved that around like a tiny threat. "Now what?" [name:{protagonist.name}] had not seen that coming. [name:{protagonist.name}] kept going anyway.',
      'The [c:{obstacle.text}] doubled down. "[c:{mcguffin.text}] or nothing," it said, which barely made sense. [name:{protagonist.name}] decided "or nothing" was not on the table.',
    ] },
  { id:'v3_gs_escalation_tween', stage:'escalation', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','obstacle','mcguffin'],
    lines: [
      'The [c:{obstacle.text}] tried to introduce [c:{mcguffin.articleText}] into the negotiation. It was a stretch. [name:{protagonist.name}] did not negotiate. [name:{protagonist.name}] kept moving.',
    ] },

  /* v2.7.0 — goal-aware payoffs name what was actually accomplished. */
  { id:'v3_gs_payoff_goal_chant', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','goal','chant'],
    lines: [
      'And then [name:{protagonist.name}] did it. [name:{protagonist.name}] {goal.past}, right in front of the [c:{obstacle.text}]. "[y:{chant.text}]!" yelled [name:{protagonist.name}]. The [c:{ally.text}] took a small bow on [name:{protagonist.name}]\'s behalf.',
      'It worked. [name:{protagonist.name}] {goal.past} despite the [c:{obstacle.text}]. The [c:{ally.text}] cheered (in its own way). "[y:{chant.text}]!" said [name:{protagonist.name}]. The day was officially won.',
    ] },
  /* v0.9.3 · b24 — goal_spine absurd_consequence variants. The chant
     causes the obstacle to react absurdly OR the ally adopts it as their
     new favorite word. */
  /* v0.9.3 · b28 — rewritten. Previous line carried THREE top-20% n-grams
     ("heard it made a small noise and stepped aside", "in a way that",
     "applauded the X because manners") in a single beat. Two structurally
     distinct replacements. */
  { id:'v3_gs_payoff_chant_obstacle_caves', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','goal','obstacle','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" yelled [name:{protagonist.name}]. The [c:{obstacle.text}] froze, blinked twice, and quietly slid out of the way. [name:{protagonist.name}] {goal.past}. The [c:{ally.text}] gave a single dignified nod.',
      '[name:{protagonist.name}] said "[y:{chant.text}]" once, calmly. The [c:{obstacle.text}] suddenly remembered somewhere else it needed to be. [name:{protagonist.name}] {goal.past} through the gap. The [c:{ally.text}] noted this for later.',
    ] },
  { id:'v3_gs_payoff_chant_ally_adopts', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','goal','chant'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] {goal.past} and said "[y:{chant.text}]" the second it was over. The [c:{ally.text}] said "[y:{chant.text}]" back. The [c:{ally.text}] then said it again, mostly to itself. New favorite word, apparently.',
    ] },
  { id:'v3_gs_payoff_payword_mcguffin_responds', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','goal','mcguffin','payoff_word'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] {goal.past} and held up the [c:{mcguffin.text}] like proof. "[y:{payoff_word.text}]!" yelled [name:{protagonist.name}]. The [c:{mcguffin.text}] vibrated slightly. Nobody talked about that part.',
    ] },
  /* v0.9.3 · b26 — three more goal_spine absurd_consequence beats:
     obstacle physically caves to the chant, obstacle misunderstands the
     chant as instructions, kid solves the goal "sideways" via the chant. */
  { id:'v3_gs_payoff_chant_obstacle_collapses', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','goal','obstacle','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" said [name:{protagonist.name}]. The [c:{obstacle.text}] tried to argue, tipped slightly, and folded in on itself like cheap furniture. [name:{protagonist.name}] {goal.past}. Sideways victory.',
    ] },
  { id:'v3_gs_payoff_chant_obstacle_misreads', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','goal','obstacle','chant'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] said "[y:{chant.text}]" softly, like a code word. The [c:{obstacle.text}] heard it as an instruction it apparently knew, stepped aside, and held the door. [name:{protagonist.name}] {goal.past} without breaking stride.',
    ] },
  { id:'v3_gs_payoff_payword_audience_responds', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','goal','payoff_word'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] {goal.past}. "[y:{payoff_word.text}]!" yelled [name:{protagonist.name}]. The [c:{ally.text}] yelled "[y:{payoff_word.text}]!" louder. Somewhere distantly, a third voice yelled it back. The day was officially named "[y:{payoff_word.text}]" now.',
    ] },
  { id:'v3_gs_payoff_goal_payword', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','goal','payoff_word'],
    lines: [
      '[name:{protagonist.name}] {goal.past}. Yes! The [c:{ally.text}] high-fived (somehow). [name:{protagonist.name}] yelled "[y:{payoff_word.text}]!" once, with full conviction. The [c:{obstacle.text}] had nothing left to say.',
    ] },
  { id:'v3_gs_payoff_goal_plain', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','goal'],
    lines: [
      'And just like that, [name:{protagonist.name}] {goal.past}. The [c:{ally.text}] looked at [name:{protagonist.name}] like, of course we did. The day was open now. Anything was possible.',
      'Mission complete: [name:{protagonist.name}] {goal.past}. The [c:{ally.text}] grinned. The [c:{obstacle.text}] retreated. Win logged.',
    ] },
  { id:'v3_gs_payoff_goal_tween', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','goal'],
    lines: [
      'Done. [name:{protagonist.name}] {goal.past}. Nobody clapped. [name:{protagonist.name}] did not need clapping. The story now belonged to [name:{protagonist.name}].',
    ] },
  /* Fallback payoff beats (no goal slot) — kept so the engine stays robust. */
  { id:'v3_gs_payoff_plain', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'And just like that, [name:{protagonist.name}] had the [c:{mcguffin.text}], the [c:{ally.text}] still on their team, and the rest of the day open. Win logged.',
    ] },

  { id:'v3_gs_landing_1', stage:'landing', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'Back home, [name:{protagonist.name}] replayed it in their head: how the [c:{ally.text}] had been right there, how it had all worked out. The [c:{ally.text}] curled up. Tomorrow could be just as good.',
    ] },
  { id:'v3_gs_landing_tween', stage:'landing', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'In bed that night, [name:{protagonist.name}] thought about how it had gone. The [c:{ally.text}] was a co-conspirator now. Quietly proud. Not posting about it. Some wins are just for you.',
    ] },
  /* v2.6.2 — goal_spine_v3 anytime landings */
  { id:'v3_gs_landing_any', stage:'landing', blueprintId:'goal_spine_v3', mode:'anytime', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'On the way home, [name:{protagonist.name}] replayed the moment everything turned around. The [c:{ally.text}] kept bouncing along, already ready for whatever was next. Win logged. Onward.',
    ] },
  { id:'v3_gs_landing_any_tween', stage:'landing', blueprintId:'goal_spine_v3', mode:'anytime', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'Walking home, [name:{protagonist.name}] thought about how it had gone. The [c:{ally.text}] was a co-conspirator now. Quietly proud. Not posting about it. Some wins are just for you.',
    ] },
  /* v0.9.3 · b26 — callback-in-landing for goal_spine_v3.
     The chant returns one final time at the end as a "we did it" code-word. */
  { id:'v3_gs_landing_chant_callback', stage:'landing', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'That night, [name:{protagonist.name}] thought about it one more time and quietly said "[y:{chant.text}]" into the dark. The [c:{ally.text}] half-heard it and twitched a little ear in agreement.',
    ] },
  { id:'v3_gs_landing_payword_callback', stage:'landing', blueprintId:'goal_spine_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      '[name:{protagonist.name}] climbed into bed. The [c:{ally.text}] climbed in too. The day got its closing line: "[y:{payoff_word.text}]," whispered [name:{protagonist.name}]. The [c:{ally.text}] sneezed in approval.',
    ] },
  { id:'v3_gs_landing_chant_callback_tween', stage:'landing', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'In bed that night, [name:{protagonist.name}] catalogued the day. The [c:{ally.text}] was already asleep, technically a co-conspirator. "[y:{chant.text}]," said [name:{protagonist.name}], one last time. Quietly, but on the record.',
    ] },
  { id:'v3_gs_landing_payword_callback_tween', stage:'landing', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      'On the way home, [name:{protagonist.name}] played it back. The [c:{ally.text}] kept bouncing along. "[y:{payoff_word.text}]," said [name:{protagonist.name}], filing it. The [c:{ally.text}] heard and stamped its approval, which is a thing the [c:{ally.text}] can apparently do now.',
    ] },

  /* ============================================================
     show_wrong_v3 — kid + ally prepare a show; prop breaks or co-star
     fails; kid improvises with signature_action + chant; triumph.
     ============================================================ */
  /* v0.9.3 · b28 — show_wrong_v3 setup beats trimmed from 5 sentences to 3.
     Each variant now opens with a different structure (declaration / location /
     plan-statement / aside) so the 47% "at the <place>" repetition no longer
     dominates show_wrong openings. */
  { id:'v3_sw_setup_1', stage:'setup', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','setting','prop'],
    lines: [
      'Show day. [name:{protagonist.name}] had a [c:{prop.text}], a co-star ([c:{ally.text}]), and a stage ([y:{setting.text}]). The plan was rock solid. Or rock-ish.',
      'The whole thing rested on one [c:{prop.text}]. [name:{protagonist.name}] had practiced. The [c:{ally.text}] had practiced. The [y:{setting.text}] was, technically, ready.',
      'Backstage at the [y:{setting.text}], [name:{protagonist.name}] gave the [c:{prop.text}] one final inspection. The [c:{ally.text}] was already in character. Showtime in thirty.',
    ] },
  { id:'v3_sw_setup_tween', stage:'setup', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting','prop'],
    lines: [
      'The bit was simple: [name:{protagonist.name}], the [c:{ally.text}], the [c:{prop.text}], one [y:{setting.text}]. Nobody had asked for this. [name:{protagonist.name}] was doing it anyway.',
      '[name:{protagonist.name}] had been workshopping the [c:{prop.text}] thing all week. The [c:{ally.text}] was reluctantly co-starring. The [y:{setting.text}] was the venue. Stakes were imaginary but real.',
    ] },

  /* v0.9.3 · b28 — show_wrong_v3 problem beats trimmed from 4-6 sentences to
     2-3. Three distinct prop-failure mini-arcs (snaps / refuses / launches)
     instead of one generic "broke" template. */
  { id:'v3_sw_problem_1', stage:'problem', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','prop'],
    lines: [
      'The [c:{prop.text}] snapped. Right in the middle. [name:{protagonist.name}] and the [c:{ally.text}] stared at each half.',
      'The [c:{ally.text}] blanked. The [c:{prop.text}] hit the floor a second later. Two crises at once.',
    ] },
  /* v2.7.0 — physically silly prop disasters with vivid imagery a kid can picture. */
  { id:'v3_sw_problem_visual', stage:'problem', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','prop'],
    lines: [
      'The [c:{prop.text}] launched itself, bounced once, and landed in the [c:{ally.text}]\'s lap. The look on the [c:{ally.text}]\'s face was unsurvivable.',
      'The [c:{prop.text}] tipped sideways. Then kept tipping. Then was still tipping. [name:{protagonist.name}] had about three seconds.',
      'The [c:{prop.text}] refused. Just refused. The [c:{ally.text}] poked it twice. Nothing. [name:{protagonist.name}] had to come up with something.',
    ] },
  { id:'v3_sw_problem_tween', stage:'problem', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','prop'],
    lines: [
      'The [c:{prop.text}] broke. [name:{protagonist.name}] held half a [c:{prop.text}] and made eye contact with the universe.',
    ] },
  { id:'v3_sw_problem_tween_visual', stage:'problem', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','prop'],
    lines: [
      'The [c:{prop.text}] fell over in front of everyone, in slow motion, like it had timing. [name:{protagonist.name}] had to commit to something immediately.',
    ] },

  /* v0.9.3 · b28 — show_wrong_v3 attempt beats. The chant-bearing variants are
     the punchy mini-arcs. "in a way that" replaced with concrete imagery so the
     repetition n-gram dies. */
  { id:'v3_sw_attempt_move_chant', stage:'attempt', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','signature_action','chant'],
    lines: [
      '[name:{protagonist.name}] improvised. "[y:{chant.text}]!" Then [c:{signature_action.text}]. Then "[y:{chant.text}]!" again, louder. The pillows were INTO IT.',
      '[name:{protagonist.name}] [c:{signature_action.text}] and shouted "[y:{chant.text}]!" The audience leaned in. Sometimes nonsense lands.',
      'Out came the only word that fit: "[y:{chant.text}]." [name:{protagonist.name}] [c:{signature_action.text}] for emphasis. The bit was a different bit now.',
    ] },
  { id:'v3_sw_attempt_move', stage:'attempt', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','signature_action'],
    lines: [
      '[name:{protagonist.name}] [c:{signature_action.text}] across the stage like nobody had rehearsed it. The room watched. Somehow it was working.',
      '[name:{protagonist.name}] [c:{signature_action.text}] like it was the plan. The [y:{setting.text}] held its breath. The bit picked itself up.',
    ] },

  /* v0.9.3 · b28 — show_wrong_v3 escalation. New audience-mistakes-improv beat
     to break out of the heckler-only pattern. */
  { id:'v3_sw_escalation_1', stage:'escalation', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','obstacle'],
    lines: [
      'A [c:{obstacle.text}] in the audience laughed too loudly. The [c:{ally.text}] mistook it for applause and bowed. [name:{protagonist.name}] rolled with it. Different show now.',
      'The [c:{obstacle.text}] heckled, genuinely. The [c:{ally.text}] hissed. [name:{protagonist.name}] kept going. The conflict made the bit.',
      'The [c:{obstacle.text}] tried to leave. The [c:{ally.text}] blocked the exit, on purpose, somehow. [name:{protagonist.name}] now had a captive audience.',
    ] },
  /* v2.6.1 — tween escalation rewritten to reference obstacle so picks.creature
     always lands in body for show_wrong_v3 at ages 11-13. Two variants. */
  { id:'v3_sw_escalation_tween', stage:'escalation', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally','obstacle'],
    lines: [
      'A [c:{obstacle.text}] in the audience filmed the whole thing on a phone. The [c:{ally.text}] noticed and started playing to the camera. [name:{protagonist.name}] decided this was now content. It might even go viral.',
      'The [c:{obstacle.text}] critiqued the show out loud. The [c:{ally.text}] glared. [name:{protagonist.name}] absorbed the feedback in real time and kept going. The bit improved.',
    ] },
  { id:'v3_sw_escalation_tween_alt', stage:'escalation', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'The [c:{ally.text}] picked up [name:{protagonist.name}]\'s energy and ran with it. Now it was a duet. Neither of them had agreed to this. It was happening.',
    ] },

  /* v0.9.3 · b28 — show_wrong payoff/landing trims. Each line dropped one
     sentence of decoration. Aim: drop show_wrong median sentence count from
     27 (b27) toward 20. */
  { id:'v3_sw_payoff_payword', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','payoff_word'],
    lines: [
      'The pillows went wild. The [c:{ally.text}] took a bow. "[y:{payoff_word.text}]!" yelled [name:{protagonist.name}]. The room repeated it back.',
      'It was a real hit. [name:{protagonist.name}] and the [c:{ally.text}] got a huge clap. The new catchphrase "[y:{payoff_word.text}]" was officially live.',
    ] },
  /* v0.9.3 · b24 — show_wrong absurd_consequence variants. The prop comes
     back to life via the chant, the audience adopts it as the show's
     name, or the ally treats the payoff word as the new cue. */
  { id:'v3_sw_payoff_chant_prop_revives', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','prop','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" yelled [name:{protagonist.name}] at the broken [c:{prop.text}]. The [c:{prop.text}] twitched, then did exactly what it had refused to do five minutes ago. Pillows lost it.',
    ] },
  { id:'v3_sw_payoff_chant_crowd_chants', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" went [name:{protagonist.name}]. The [c:{ally.text}] picked it up; so did the whole room — pillows, lamp, the dog who had wandered in. The show was named "[y:{chant.text}]" now.',
    ] },
  { id:'v3_sw_payoff_payword_ally_cues', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] said "[y:{payoff_word.text}]" once, like a cue. The [c:{ally.text}] did the entire finale from memory, including the parts nobody had rehearsed. The bow was perfect.',
    ] },
  /* v0.9.3 · b26 — three more show_wrong absurd_consequence beats hitting
     the broken-show mechanic (prop failure → improvised save → audience
     reaction → catchphrase callback). */
  { id:'v3_sw_payoff_chant_prop_unbreaks', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','prop','chant'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] pointed at the broken [c:{prop.text}]: "[y:{chant.text}]." The [c:{prop.text}] reassembled itself in roughly the wrong order. The [c:{ally.text}] applauded the wrong order. The show was now better.',
    ] },
  { id:'v3_sw_payoff_payword_audience_chants', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{payoff_word.text}]!" yelled [name:{protagonist.name}]. The audience (pillows, the [c:{ally.text}], a wandering dog) said it back. Then again, louder, like a chant.',
    ] },
  { id:'v3_sw_payoff_chant_obstacle_caves', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','obstacle','chant'], jokeJob:'absurd_consequence',
    lines: [
      'The [c:{obstacle.text}] tried to heckle. "[y:{chant.text}]," replied [name:{protagonist.name}], calmly. The [c:{obstacle.text}] forgot what it was going to say and later claimed it had been a planned bit.',
    ] },
  { id:'v3_sw_payoff_chant', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','chant'],
    lines: [
      '"[y:{chant.text}]" was the special word of the show now. Everyone said it. Nobody knew what it meant. The [c:{ally.text}] approved.',
    ] },
  { id:'v3_sw_payoff_plain', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'It worked. Somehow. [name:{protagonist.name}] took a bow that was 30% real and 70% ironic. The [c:{ally.text}] respected it. So did [name:{protagonist.name}], secretly.',
    ] },

  { id:'v3_sw_landing_1', stage:'landing', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'Backstage, [name:{protagonist.name}] high-fived the [c:{ally.text}]. The show would never be performed exactly that way again. That was kind of the point.',
    ] },
  { id:'v3_sw_landing_tween', stage:'landing', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'Later, [name:{protagonist.name}] replayed the whole disaster in their head. The [c:{ally.text}] was already asleep. The story would get better every time [name:{protagonist.name}] told it. That was definitely allowed.',
    ] },
  /* v2.6.2 — show_wrong_v3 anytime landings */
  { id:'v3_sw_landing_any', stage:'landing', blueprintId:'show_wrong_v3', mode:'anytime', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'Backstage, [name:{protagonist.name}] high-fived the [c:{ally.text}]. The show was unrepeatable, which felt right. Time to pack up and find the next thing.',
    ] },
  { id:'v3_sw_landing_any_tween', stage:'landing', blueprintId:'show_wrong_v3', mode:'anytime', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'Walking out, [name:{protagonist.name}] was already rewriting the encore in their head. The [c:{ally.text}] kept asking when the next show was. Soon. Definitely soon.',
    ] },
  /* v0.9.3 · b26 — callback-in-landing for show_wrong_v3.
     The chant became the show's name; landing reprises it as the official
     sign-off catchphrase the kid + ally will use forever after. */
  { id:'v3_sw_landing_chant_callback', stage:'landing', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'Backstage, [name:{protagonist.name}] and the [c:{ally.text}] looked at each other and at the exact same moment said "[y:{chant.text}]." That was the show\'s name now, apparently. Forever.',
    ] },
  { id:'v3_sw_landing_payword_callback', stage:'landing', blueprintId:'show_wrong_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      'Curtain down. [name:{protagonist.name}] high-fived the [c:{ally.text}]. "[y:{payoff_word.text}]?" said [name:{protagonist.name}]. "[y:{payoff_word.text}]!" said the [c:{ally.text}]. The new catchphrase had landed.',
    ] },
  { id:'v3_sw_landing_chant_callback_tween', stage:'landing', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'Walking out, [name:{protagonist.name}] was already rewriting the encore. "[y:{chant.text}]," they said with the [c:{ally.text}], like a band name. Apparently they had a band.',
    ] },
  { id:'v3_sw_landing_payword_callback_tween', stage:'landing', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      'Later, [name:{protagonist.name}] replayed the whole disaster. The [c:{ally.text}] was already asleep. "[y:{payoff_word.text}]," said [name:{protagonist.name}] to nobody, retroactively naming the whole thing. Some sign-offs are just for you.',
    ] },

  /* ============================================================
     rule_loophole_v3 — rule_imposer (visitor) blocks mcguffin with absurd
     rule; kid uses loophole_tool (object) + signature_action to win.
     ============================================================ */
  { id:'v3_rl_setup_1', stage:'setup', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','setting'],
    lines: [
      'It was a normal day at the [y:{setting.text}]. [name:{protagonist.name}] and the [c:{ally.text}] were minding their own business. The day was, technically, fine. So far.',
      '[name:{protagonist.name}] and the [c:{ally.text}] had arrived at the [y:{setting.text}] with a simple plan: have a regular afternoon. The [c:{ally.text}] was good at regular afternoons.',
    ] },
  { id:'v3_rl_setup_tween', stage:'setup', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting'],
    lines: [
      '[name:{protagonist.name}] was at the [y:{setting.text}], doing nothing in particular. The [c:{ally.text}] was nearby, also doing nothing. Things were going fine. They would not stay fine.',
    ] },

  { id:'v3_rl_problem_1', stage:'problem', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','rule_imposer','mcguffin'],
    lines: [
      'Over at the [y:{setting.text}], the [c:{rule_imposer.text}] held up one hand. "New rule," the [c:{rule_imposer.text}] said. "Nobody touches the [c:{mcguffin.text}]. Starting right now." [name:{protagonist.name}] had not heard of this rule before. The rule did not care.',
      'A new rule showed up at the [y:{setting.text}]. The [c:{rule_imposer.text}] brought it. The new rule: no [c:{mcguffin.text}]. For anybody. [name:{protagonist.name}] could see the [c:{mcguffin.text}] from here. The rule was already cruel.',
    ] },
  /* v0.9.3 · b28 — single beat used to fire in 20% of stories and cascaded
     into 12 separate top-20% n-gram hits. Replaced with three structurally
     distinct mood-flavored problem variants.
     NOTE: Avoid leading any sentence with `[c:{mcguffin...}]` because the
     mcguffin token can be plural ("nachos") and would render "the nachos
     was..." → plural-singular agreement bug. Same with leading `[c:{mood...
     }]` — mood-throughline tokens are lowercase adjectives ("ridiculous")
     so leading a sentence with them triggers the lowercase-start lint. */
  { id:'v3_rl_problem_mood', stage:'problem', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','rule_imposer','mcguffin','mood_throughline'],
    lines: [
      'Off-limits, said the [c:{rule_imposer.text}], pointing at the [c:{mcguffin.text}]. [name:{protagonist.name}] turned a particular shade of [c:{mood_throughline.text}]. The [c:{rule_imposer.text}] had not seen that energy before.',
      'A wall of "no" landed between [name:{protagonist.name}] and the [c:{mcguffin.text}]. [name:{protagonist.name}] went very [c:{mood_throughline.text}]. The [c:{rule_imposer.text}] sensed escalation.',
      'According to the [c:{rule_imposer.text}], the [c:{mcguffin.text}] could no longer be touched. [name:{protagonist.name}] kept a [c:{mood_throughline.text}] face. Underneath: scheming.',
    ] },
  { id:'v3_rl_problem_tween', stage:'problem', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','rule_imposer','mcguffin'],
    lines: [
      'The [c:{rule_imposer.text}] explained, with full bureaucratic confidence, that the [c:{mcguffin.text}] was now off-limits. [name:{protagonist.name}] did not look impressed. [name:{protagonist.name}] also did not argue. Arguing rules is a trap.',
    ] },
  /* v2.7.0 — more absurd-but-comprehensible rules. Each one is specific enough
     that a kid can picture the workaround. */
  { id:'v3_rl_problem_absurd', stage:'problem', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','rule_imposer','mcguffin'],
    lines: [
      'The [c:{rule_imposer.text}] held up an official-looking finger. "New rule," it announced. "[c:{mcguffin.text}] can only be touched on Tuesdays." It was not Tuesday. [name:{protagonist.name}] looked at the [c:{mcguffin.text}]. The [c:{mcguffin.text}] looked back. Tragic.',
      'A new rule appeared. The [c:{rule_imposer.text}] read it aloud: "Nobody is allowed to eat [c:{mcguffin.text}] while standing." [name:{protagonist.name}] checked. [name:{protagonist.name}] was, indeed, standing. The rule, somehow, was working.',
      '"By order of me," declared the [c:{rule_imposer.text}], "[c:{mcguffin.text}] must remain at least three feet from any [protagonist]." The rule was nonsense. It was also, technically, in effect. [name:{protagonist.name}] sized up the three feet.',
    ] },
  { id:'v3_rl_problem_tween_absurd', stage:'problem', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','rule_imposer','mcguffin'],
    lines: [
      'The [c:{rule_imposer.text}] announced, with the energy of someone who had just read a memo: "No [c:{mcguffin.text}] before sundown." It was 2pm. The [c:{mcguffin.text}] was right there. [name:{protagonist.name}] noted the exact wording.',
      'Per the [c:{rule_imposer.text}], "[c:{mcguffin.text}] is forbidden until further notice." Further notice was deliberately undefined. [name:{protagonist.name}] mentally booked an appointment with the loophole.',
    ] },

  { id:'v3_rl_attempt_tool', stage:'attempt', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','loophole_tool'],
    lines: [
      'Then [name:{protagonist.name}] smiled. [name:{protagonist.name}] held up the [c:{loophole_tool.text}]. "The rule does not say anything about [c:{loophole_tool.text}]," said [name:{protagonist.name}]. The rule held its tongue.',
      '"Wait." [name:{protagonist.name}] held the [c:{loophole_tool.text}] up. "Rule number seven says I can use the [c:{loophole_tool.text}], right?" It did not. But nobody wanted to look like they had forgotten the rules.',
    ] },
  { id:'v3_rl_attempt_tool_move', stage:'attempt', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','loophole_tool','signature_action'],
    lines: [
      '[name:{protagonist.name}] [c:{signature_action.text}] sideways while holding the [c:{loophole_tool.text}]. This was a different move than the one the rule said no to. A different move! The rule said nothing back.',
    ] },
  { id:'v3_rl_attempt_tween_tool', stage:'attempt', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','loophole_tool'],
    lines: [
      '[name:{protagonist.name}] located the loophole. It involved the [c:{loophole_tool.text}] and a very specific reading of the rule. [name:{protagonist.name}] did not point this out. Pointing it out is rookie behavior.',
    ] },

  { id:'v3_rl_escalation_1', stage:'escalation', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','rule_imposer','loophole_tool'],
    lines: [
      'The [c:{rule_imposer.text}] tried to amend the rule on the fly. The [c:{rule_imposer.text}] said, "Actually—" [name:{protagonist.name}] held the [c:{loophole_tool.text}] higher. The [c:{rule_imposer.text}] could not actually argue against that. The amendment was abandoned.',
      'The [c:{rule_imposer.text}] squinted at the [c:{loophole_tool.text}]. The [c:{rule_imposer.text}] could not technically object. [name:{protagonist.name}] was technically still inside the rule. The [c:{rule_imposer.text}] muttered something and looked away.',
    ] },
  { id:'v3_rl_escalation_tween', stage:'escalation', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','rule_imposer','loophole_tool'],
    lines: [
      'The [c:{rule_imposer.text}] watched [name:{protagonist.name}] hold the [c:{loophole_tool.text}] and felt outmaneuvered by precisely one inch of vocabulary. Bureaucracy is just words. [name:{protagonist.name}] had the right ones.',
    ] },

  { id:'v3_rl_payoff_chant', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','mcguffin','rule_imposer','chant'],
    lines: [
      'And just like that, [name:{protagonist.name}] got the [c:{mcguffin.text}] anyway. The [c:{rule_imposer.text}] sighed. "[y:{chant.text}]!" yelled [name:{protagonist.name}]. The rule was still a rule, but [name:{protagonist.name}] had won this round.',
    ] },
  { id:'v3_rl_payoff_payword', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','mcguffin','rule_imposer','payoff_word'],
    lines: [
      '[name:{protagonist.name}] held the [c:{mcguffin.text}] up like a trophy. The [c:{rule_imposer.text}] could only watch. "[y:{payoff_word.text}]!" yelled [name:{protagonist.name}]. Both things were now true at once.',
    ] },
  /* v0.9.3 · b24 — rule_loophole absurd_consequence variants. The chant
     either makes the rule literally break, or the rule_imposer
     misinterprets the chant as a code word, or the loophole_tool
     activates absurdly. */
  { id:'v3_rl_payoff_chant_rule_cracks', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','mcguffin','rule_imposer','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" said [name:{protagonist.name}]. The rule developed a small visible crack. Nobody could see it, but everyone agreed it was there. The [c:{rule_imposer.text}] handed over the [c:{mcguffin.text}] without comment.',
    ] },
  { id:'v3_rl_payoff_chant_imposer_misreads', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','mcguffin','rule_imposer','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" went [name:{protagonist.name}]. The [c:{rule_imposer.text}] heard a code word it apparently knew, mumbled "ah, the [c:{chant.text}] clause," and waved [name:{protagonist.name}] through with the [c:{mcguffin.text}]. There was no [c:{chant.text}] clause.',
    ] },
  { id:'v3_rl_payoff_payword_tool_activates', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','mcguffin','loophole_tool','payoff_word'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] held up the [c:{loophole_tool.text}] and said "[y:{payoff_word.text}]." The [c:{loophole_tool.text}] did something briefly impressive that nobody could later describe. The [c:{mcguffin.text}] arrived in [name:{protagonist.name}]\'s hand.',
    ] },
  /* v0.9.3 · b26 — three more rule_loophole absurd_consequence beats
     hitting the literal-interpretation / authority-confusion mechanic. */
  { id:'v3_rl_payoff_chant_rule_inverts', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','mcguffin','rule_imposer','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]," said [name:{protagonist.name}]. The rule, which had said "no [c:{mcguffin.text}]," now apparently said "yes [c:{mcguffin.text}]." The [c:{rule_imposer.text}] checked the paperwork. The paperwork agreed.',
    ] },
  { id:'v3_rl_payoff_payword_imposer_resigns', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','rule_imposer','payoff_word'], jokeJob:'absurd_consequence',
    lines: [
      '[name:{protagonist.name}] said "[y:{payoff_word.text}]" with such confidence that the [c:{rule_imposer.text}] stepped back. The [c:{rule_imposer.text}] muttered something about a coffee break. The [c:{rule_imposer.text}] did not return.',
    ] },
  { id:'v3_rl_payoff_chant_audience_validates', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','ally','rule_imposer','chant'], jokeJob:'absurd_consequence',
    lines: [
      '"[y:{chant.text}]!" said [name:{protagonist.name}]. The [c:{ally.text}] nodded. Three witnesses appeared from nowhere. They also nodded. The [c:{rule_imposer.text}] tried to recount. The recount confirmed the loophole.',
    ] },
  { id:'v3_rl_payoff_plain', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['kid','big','tween'], requiredRoles:['protagonist','mcguffin','rule_imposer'],
    lines: [
      'It worked. [name:{protagonist.name}] won. The rule was still there. The [c:{mcguffin.text}] had also, somehow, ended up in [name:{protagonist.name}]\'s hands. The [c:{rule_imposer.text}] retired for the day.',
    ] },
  { id:'v3_rl_payoff_tween', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','mcguffin','rule_imposer'],
    lines: [
      'The loophole held. The [c:{rule_imposer.text}] could not really stop [name:{protagonist.name}]. [name:{protagonist.name}] walked off with the [c:{mcguffin.text}] without technically breaking anything. Quietly satisfying.',
    ] },

  { id:'v3_rl_landing_1', stage:'landing', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'The [c:{ally.text}] watched the loophole work and looked impressed. The [c:{ally.text}] was going to try this later. [name:{protagonist.name}] had taught the [c:{ally.text}] something brand new. Bedtime: earned.',
    ] },
  { id:'v3_rl_landing_tween', stage:'landing', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'On the way home, [name:{protagonist.name}] mentally filed the loophole away for next time. The [c:{ally.text}] was definitely going to use it on [name:{protagonist.name}] eventually. That was fair.',
    ] },
  /* v2.6.2 — rule_loophole_v3 anytime landings */
  { id:'v3_rl_landing_any', stage:'landing', blueprintId:'rule_loophole_v3', mode:'anytime', tiers:['kid','big'], requiredRoles:['protagonist','ally'],
    lines: [
      'Heading home, [name:{protagonist.name}] explained the loophole to the [c:{ally.text}] one more time. The [c:{ally.text}] was nodding seriously, clearly planning to deploy it later. Knowledge: transferred.',
    ] },
  { id:'v3_rl_landing_any_tween', stage:'landing', blueprintId:'rule_loophole_v3', mode:'anytime', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'On the walk home, [name:{protagonist.name}] mentally filed the loophole for future use. The [c:{ally.text}] was definitely going to use it on [name:{protagonist.name}] eventually. That was fair.',
    ] },
  /* v0.9.3 · b26 — callback-in-landing for rule_loophole_v3.
     The chant becomes the kid's private "case closed" code-word the [c:ally]
     adopts in solidarity. */
  { id:'v3_rl_landing_chant_callback', stage:'landing', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'In bed, [name:{protagonist.name}] thought about the loophole and quietly said "[y:{chant.text}]" one more time, just to seal it. The [c:{ally.text}] said "[y:{chant.text}]" too, like a co-signature. Bedtime: earned.',
    ] },
  { id:'v3_rl_landing_payword_callback', stage:'landing', blueprintId:'rule_loophole_v3', tiers:['kid','big'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      'The [c:{ally.text}] watched [name:{protagonist.name}] yawn and yawned too. "[y:{payoff_word.text}]," said [name:{protagonist.name}], using it for the last time today. The [c:{ally.text}] approved. Sleep.',
    ] },
  { id:'v3_rl_landing_chant_callback_tween', stage:'landing', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','ally','chant'], jokeJob:'callback',
    lines: [
      'On the walk home, [name:{protagonist.name}] filed the loophole for future use. The [c:{ally.text}] was definitely going to use it back on [name:{protagonist.name}] eventually. "[y:{chant.text}]," said [name:{protagonist.name}] one more time, quietly. The [c:{ally.text}] saved it.',
    ] },
  { id:'v3_rl_landing_payword_callback_tween', stage:'landing', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','ally','payoff_word'], jokeJob:'callback',
    lines: [
      'In bed, [name:{protagonist.name}] mentally rehearsed the loophole again. "[y:{payoff_word.text}]," said [name:{protagonist.name}], rehearsing for next time. The [c:{ally.text}] was already filed away as a co-author. Some wins compound.',
    ] },

  /* ============================================================
     v2.8.0 — TWEEN VOICE PASS
     Distinct deadpan voice for ages 11-13. Reuses the tween mood
     vocabulary already in V2_WORDS ("aggressively normal",
     "professionally unhinged", "NPC behavior") and leans into the
     screenshot / group-chat / replay-mentally / "filed for later"
     register. 4 new tween-only beats per blueprint = 16 total.
     ============================================================ */

  /* --- lost_snack_v3 tween additions --- */
  { id:'v3_ls_attempt_tween_screenshot', stage:'attempt', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','false_suspect'],
    lines: [
      '[name:{protagonist.name}] took a mental screenshot of the room. Three angles. Multiple suspects. The [c:{ally.text}] looked away too quickly. Filed for later.',
    ] },
  { id:'v3_ls_escalation_tween_group', stage:'escalation', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'If this were a group chat, the [c:{ally.text}] would have already left it. [name:{protagonist.name}] could feel the guilty silence. So could everyone.',
    ] },
  { id:'v3_ls_payoff_tween_filed', stage:'payoff', blueprintId:'lost_snack_v3', tiers:['tween'], requiredRoles:['protagonist','ally','mcguffin'],
    lines: [
      'Mystery solved without a single accusation. [name:{protagonist.name}] filed it under: ally-related incidents, low priority. Crumbs were everywhere. So was the [c:{ally.text}].',
    ] },
  { id:'v3_ls_landing_tween_replay', stage:'landing', blueprintId:'lost_snack_v3', mode:'anytime', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'Walking back, [name:{protagonist.name}] replayed the whole thing. The [c:{ally.text}] kept pretending nothing happened. Both knew. Neither said. Vibe correct.',
    ] },

  /* --- goal_spine_v3 tween additions --- */
  { id:'v3_gs_setup_tween_committed', stage:'setup', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting','goal'],
    lines: [
      'Decision made. Today, at the [y:{setting.text}], [name:{protagonist.name}] would {goal.text}. The [c:{ally.text}] was on board. Quietly. Without making it a thing.',
    ] },
  { id:'v3_gs_attempt_tween_unhinged', stage:'attempt', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','obstacle','signature_action'],
    lines: [
      '[name:{protagonist.name}] [c:{signature_action.text}] like a professional who had committed to a specific kind of unhinged. The [c:{obstacle.text}] had not budgeted for this. [name:{protagonist.name}] did not break eye contact.',
    ] },
  { id:'v3_gs_escalation_tween_screenshot', stage:'escalation', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','obstacle','mcguffin'],
    lines: [
      'The [c:{obstacle.text}] tried something with the [c:{mcguffin.text}]. [name:{protagonist.name}] mentally screenshotted it. Could be evidence later. Probably wouldn\'t be.',
    ] },
  { id:'v3_gs_payoff_tween_logged', stage:'payoff', blueprintId:'goal_spine_v3', tiers:['tween'], requiredRoles:['protagonist','goal','obstacle','ally'],
    lines: [
      '[name:{protagonist.name}] {goal.text}. The [c:{obstacle.text}] said nothing. Win logged. No comment from the [c:{ally.text}], because the [c:{ally.text}] was already moving on.',
    ] },

  /* --- show_wrong_v3 tween additions --- */
  { id:'v3_sw_setup_tween_committed', stage:'setup', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting'],
    lines: [
      '[name:{protagonist.name}] had a bit planned at the [y:{setting.text}]. Nobody had asked. [name:{protagonist.name}] was doing it anyway. The [c:{ally.text}] was either co-star or hostage. To be determined.',
    ] },
  { id:'v3_sw_attempt_tween_unhinged', stage:'attempt', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','prop','signature_action'],
    lines: [
      'The [c:{prop.text}] failed exactly on cue. [name:{protagonist.name}] [c:{signature_action.text}] across the stage like that had been the plan all along. The audience was, technically, into it. Mostly.',
    ] },
  { id:'v3_sw_escalation_tween_filmed', stage:'escalation', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'Someone in the back was filming. [name:{protagonist.name}] noticed and leaned in. If it was going viral, it was going viral with intent. The [c:{ally.text}] adjusted posture accordingly.',
    ] },
  { id:'v3_sw_payoff_tween_replay', stage:'payoff', blueprintId:'show_wrong_v3', tiers:['tween'], requiredRoles:['protagonist','ally'],
    lines: [
      'The bit ended. [name:{protagonist.name}] took a bow that was 40% real, 60% ironic. The [c:{ally.text}] respected it. So did everybody else, secretly. The whole disaster was now content.',
    ] },

  /* --- rule_loophole_v3 tween additions --- */
  { id:'v3_rl_setup_tween_calm', stage:'setup', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','ally','setting'],
    lines: [
      'Over by the [y:{setting.text}], [name:{protagonist.name}] was doing the bare minimum. So was the [c:{ally.text}]. Suspiciously calm energy. Things were technically fine. They would not stay fine.',
    ] },
  { id:'v3_rl_problem_tween_rookie', stage:'problem', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','rule_imposer','mcguffin'],
    lines: [
      'The [c:{rule_imposer.text}] declared the [c:{mcguffin.text}] forbidden. [name:{protagonist.name}] did not react. Reacting is rookie behavior. The [c:{rule_imposer.text}] expected something. There was nothing.',
    ] },
  { id:'v3_rl_attempt_tween_filed', stage:'attempt', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','loophole_tool'],
    lines: [
      '[name:{protagonist.name}] located the loophole within seconds. It involved the [c:{loophole_tool.text}] and a generous interpretation. Pointing it out would be amateur. [name:{protagonist.name}] simply executed.',
    ] },
  { id:'v3_rl_payoff_tween_logged', stage:'payoff', blueprintId:'rule_loophole_v3', tiers:['tween'], requiredRoles:['protagonist','mcguffin','rule_imposer'],
    lines: [
      '[name:{protagonist.name}] walked off with the [c:{mcguffin.text}]. The [c:{rule_imposer.text}] could not technically argue. [name:{protagonist.name}] filed it under: small wins, large vibes. Justice was unevenly served. As expected.',
    ] },

  /* ============================================================
     v2.10.0 — tot/little-v3 beats (per docs/tot-little-v3-design.md)

     Three stages: tl_setup, tl_silly_repeat (fires twice per story for
     P2 + P3), tl_cozy_end (mode-tagged for bedtime vs anytime).

     No blueprintId on tot beats so tot_wonder_v3 + tot_sky_v3 share the
     tot pool. Same for little. The wonder_object role resolves per
     blueprint roleMap (food | sky | object).

     Voice: action-driven (Cole spots, picks up, grabs, points, holds,
     leads). Inherits the kid-agency lift from v2.8.0. Short sentences,
     heavy repetition with restraint, one memorable image per paragraph.
     ============================================================ */

  /* --- TOT SETUP (5 variants) ---
     b18 story-length pass: trailing flourishes ("They were a team.",
     "Off we go!", "Big day!", "Adventure time.") removed from setup_1
     through setup_4 to drop per-paragraph sentence count from 4 → 3.
     setup_5 already lands in 4 short sentences and stays as-is for variety. */
  { id:'v3_tl_tot_setup_1', stage:'tl_setup', tiers:['tot'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] ran outside. The [c:{ally.text}] was right there. "Hi [c:{ally.text}]!" said [name:{protagonist.name}].',
    ] },
  { id:'v3_tl_tot_setup_2', stage:'tl_setup', tiers:['tot'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] spotted the [c:{ally.text}] from across the room. [name:{protagonist.name}] waved. The [c:{ally.text}] waved back.',
    ] },
  { id:'v3_tl_tot_setup_3', stage:'tl_setup', tiers:['tot'], requiredRoles:['protagonist','ally'],
    lines: [
      '"Come on, [c:{ally.text}]!" said [name:{protagonist.name}]. The [c:{ally.text}] came. [name:{protagonist.name}] led the way.',
    ] },
  { id:'v3_tl_tot_setup_4', stage:'tl_setup', tiers:['tot'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] grabbed the [c:{ally.text}]\'s paw. "Ready?" said [name:{protagonist.name}]. The [c:{ally.text}] nodded.',
    ] },
  { id:'v3_tl_tot_setup_5', stage:'tl_setup', tiers:['tot'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] opened the door. There was the [c:{ally.text}]! "Hi!" said [name:{protagonist.name}]. "Hi!" said the [c:{ally.text}] back.',
    ] },

  /* --- TOT SILLY REPEAT (8 variants, fires twice per story) ---
     b18 story-length pass: redundant flourishes ("Yay!", "Hee hee.",
     "Big win!", final "Hee hee." after "Everyone danced.", redundant "Then"
     before "both giggled") trimmed. Call/response + hat + share keep their
     full structure because the repetition IS the cozy pattern for ages 2-3. */
  { id:'v3_tl_tot_repeat_pick_up', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] picked up the [c:{wonder_object.text}]. [name:{protagonist.name}] held it up high. "Look!" said [name:{protagonist.name}]. The [c:{ally.text}] looked.',
    ] },
  { id:'v3_tl_tot_repeat_point', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] pointed at the [c:{wonder_object.text}]. "[c:{wonder_object.cap}]!" said [name:{protagonist.name}]. "[c:{wonder_object.cap}]!" said the [c:{ally.text}].',
    ] },
  { id:'v3_tl_tot_repeat_share', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] showed the [c:{wonder_object.text}] to the [c:{ally.text}]. The [c:{ally.text}] sniffed it. [name:{protagonist.name}] giggled.',
    ] },
  { id:'v3_tl_tot_repeat_carry', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] carried the [c:{wonder_object.text}] very carefully. The [c:{ally.text}] watched. [name:{protagonist.name}] did not drop it.',
    ] },
  { id:'v3_tl_tot_repeat_dance', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] did a little dance with the [c:{wonder_object.text}]. The [c:{ally.text}] danced too. So did a tiny bug.',
    ] },
  { id:'v3_tl_tot_repeat_call_response', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '"[c:{wonder_object.cap}]?" said [name:{protagonist.name}]. The [c:{ally.text}] looked. "[c:{wonder_object.cap}]!" said [name:{protagonist.name}]. The [c:{ally.text}] said "[c:{wonder_object.cap}]!" too.',
    ] },
  /* v0.9.3 · b24 — sky-on-head physicality fix.
     The old single-line "put the [wonder] on top of the [ally]'s head"
     read absurd in a bad way when wonder_object was sky-class (cloud,
     star, comet, moon) — physically nonsensical without magical framing.
     Forking into two variants: line 1 stays for food-class wonders only
     (filtered by jokeJob comment so beat-card audit notices), line 2 is
     a "point at the sky" variant safe for sky_wonder. Engine doesn't
     gate by wonder type yet, so both lines may fire for either wonder;
     line 2 reads OK for both, line 1 reads silly only for food.
     Acceptable trade — 50% of hat-beat fires are now safe physicality. */
  { id:'v3_tl_tot_repeat_hat', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] showed the [c:{wonder_object.text}] to the [c:{ally.text}]. The [c:{ally.text}] held still. [name:{protagonist.name}] clapped.',
      '[name:{protagonist.name}] pointed up at the [c:{wonder_object.text}]. The [c:{ally.text}] looked up too. They watched it for a long second.',
    ] },
  { id:'v3_tl_tot_repeat_chase', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] reached for the [c:{wonder_object.text}]. The [c:{ally.text}] reached too. Both giggled.',
    ] },

  /* v0.9.3 · b24 — HIGH_IMPACT call-and-response beats for tot.
     These fire only when the kid picked a sound (chant role present).
     Pattern: kid shouts the chant → ally echoes → wonder_object does a
     small physical gag. Read-aloud safe, no irony, age 2-3 friendly. */
  { id:'v3_tl_tot_repeat_chant_call', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '"[y:{chant.text}]?" said [name:{protagonist.name}]. "[y:{chant.text}]!" said the [c:{ally.text}]. Then the [c:{wonder_object.text}] wiggled.',
    ] },
  { id:'v3_tl_tot_repeat_chant_sneeze', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '"[y:{chant.text}]!" said [name:{protagonist.name}]. "[y:{chant.text}]!" said the [c:{ally.text}]. Then the [c:{wonder_object.text}] sneezed.',
    ] },
  /* v0.9.3 · b26 — three more tot call-and-response variants.
     Pattern: "Glorp?" said Cole. "Glorp!" said the puppy. Then the X did Y.
     Short. Physical. Repeatable. Easy to say aloud. Ages 2-3. */
  { id:'v3_tl_tot_repeat_chant_clap', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '"[y:{chant.text}]!" said [name:{protagonist.name}]. "[y:{chant.text}]!" said the [c:{ally.text}]. The [c:{wonder_object.text}] hopped. Once.',
    ] },
  { id:'v3_tl_tot_repeat_chant_tip', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '"[y:{chant.text}]?" whispered [name:{protagonist.name}]. "[y:{chant.text}]?" whispered the [c:{ally.text}]. The [c:{wonder_object.text}] tipped over by itself.',
    ] },
  { id:'v3_tl_tot_repeat_chant_dance', stage:'tl_silly_repeat', tiers:['tot'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '[name:{protagonist.name}] sang "[y:{chant.text}]." The [c:{ally.text}] sang it too. The [c:{wonder_object.text}] joined in.',
    ] },

  /* --- TOT COZY END — bedtime (3 variants) ---
     b18 story-length pass: drop redundant terminal closers ("Goodnight.",
     "Sweet dreams.") because "Night, [ally]" already carries the closing.
     end_bed_3 keeps its full repetition because the parallel structure IS
     the cozy pattern. */
  { id:'v3_tl_tot_end_bed_1', stage:'tl_cozy_end', tiers:['tot'], mode:'bedtime', requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] picked up the [c:{ally.text}] for a hug. "Night, [c:{ally.text}]," said [name:{protagonist.name}]. Then [name:{protagonist.name}] curled up.',
    ] },
  { id:'v3_tl_tot_end_bed_2', stage:'tl_cozy_end', tiers:['tot'], mode:'bedtime', requiredRoles:['protagonist','ally'],
    lines: [
      'Time for a hug. [name:{protagonist.name}] hugged the [c:{ally.text}]. Then [name:{protagonist.name}] yawned. The [c:{ally.text}] yawned too.',
    ] },
  { id:'v3_tl_tot_end_bed_3', stage:'tl_cozy_end', tiers:['tot'], mode:'bedtime', requiredRoles:['protagonist','ally'],
    lines: [
      'Now [name:{protagonist.name}] is sleepy. The [c:{ally.text}] is sleepy too. Good night, [c:{ally.text}]. Good night, [name:{protagonist.name}].',
    ] },

  /* --- TOT COZY END — anytime (2 variants) ---
     b18 story-length pass: drop tail closers ("See you soon!", "Yay!") —
     "Bye for now!" and the nod already close the anytime beat cleanly. */
  { id:'v3_tl_tot_end_any_1', stage:'tl_cozy_end', tiers:['tot'], mode:'anytime', requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] waved at the [c:{ally.text}]. "Bye for now!" said [name:{protagonist.name}]. The [c:{ally.text}] waved back.',
    ] },
  { id:'v3_tl_tot_end_any_2', stage:'tl_cozy_end', tiers:['tot'], mode:'anytime', requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] hugged the [c:{ally.text}] one more time. "Come back tomorrow?" said [name:{protagonist.name}]. The [c:{ally.text}] nodded.',
    ] },

  /* --- LITTLE SETUP (5 variants) ---
     b18 story-length pass: trim narrator flourishes ("Adventure unlocked.",
     "The day had decided to be fun.", redundant "They were extra ready.")
     while keeping the kid-agency openers ("We have a plan", "Hi back!") intact. */
  { id:'v3_tl_little_setup_1', stage:'tl_setup', tiers:['little'], requiredRoles:['protagonist','ally'],
    lines: [
      'It was a bright morning. [name:{protagonist.name}] grabbed the [c:{ally.text}] and headed out. "We have a plan," said [name:{protagonist.name}].',
    ] },
  { id:'v3_tl_little_setup_2', stage:'tl_setup', tiers:['little'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] packed a tiny bag and called the [c:{ally.text}]. The [c:{ally.text}] came running. [name:{protagonist.name}] led the way.',
    ] },
  { id:'v3_tl_little_setup_3', stage:'tl_setup', tiers:['little'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] spotted the [c:{ally.text}] across the yard. "Hey [c:{ally.text}]!" said [name:{protagonist.name}]. The [c:{ally.text}] was already smiling.',
    ] },
  { id:'v3_tl_little_setup_4', stage:'tl_setup', tiers:['little'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] opened a door and the [c:{ally.text}] tumbled in. "Hi!" said [name:{protagonist.name}]. "Hi back!" said the [c:{ally.text}] — somehow.',
    ] },
  { id:'v3_tl_little_setup_5', stage:'tl_setup', tiers:['little'], requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] told the [c:{ally.text}], "Today is going to be a big one." The [c:{ally.text}] agreed. They were ready.',
    ] },

  /* --- LITTLE SILLY REPEAT (8 variants, fires twice per story) ---
     b18 story-length pass: trim trailing flourishes that don't carry any
     selected words or {wonder_object} / {ally} tokens. Keep call-response
     (point) + repetition-as-pattern (chase). The "build" variant keeps its
     "looked very safe" close because that contains the wonder_object token. */
  { id:'v3_tl_little_repeat_pick_up', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] spotted the [c:{wonder_object.text}] and picked it up like a treasure. "Look what I found!" said [name:{protagonist.name}]. The [c:{ally.text}] bowed dramatically.',
    ] },
  { id:'v3_tl_little_repeat_share', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] showed the [c:{wonder_object.text}] to the [c:{ally.text}]. "Want some?" said [name:{protagonist.name}]. The [c:{ally.text}] very much wanted some.',
    ] },
  { id:'v3_tl_little_repeat_carry', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] carried the [c:{wonder_object.text}] carefully across the room. The [c:{ally.text}] followed, watching every step. "Steady," said [name:{protagonist.name}].',
    ] },
  { id:'v3_tl_little_repeat_dance', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] held up the [c:{wonder_object.text}] and did a little dance. The [c:{ally.text}] copied the dance. Then they made up a new one together.',
    ] },
  { id:'v3_tl_little_repeat_point', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '"[c:{wonder_object.cap}]!" yelled [name:{protagonist.name}]. The [c:{ally.text}] turned its head. "[c:{wonder_object.cap}]!" yelled [name:{protagonist.name}] again, louder. The [c:{ally.text}] yelled it back.',
    ] },
  { id:'v3_tl_little_repeat_build', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] built a tiny fort around the [c:{wonder_object.text}]. The [c:{ally.text}] approved. "Safe now," said [name:{protagonist.name}].',
    ] },
  { id:'v3_tl_little_repeat_decide', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      '[name:{protagonist.name}] decided the [c:{wonder_object.text}] needed a name. "I name you Friend," said [name:{protagonist.name}]. The [c:{ally.text}] solemnly agreed.',
    ] },
  { id:'v3_tl_little_repeat_chase', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object'],
    lines: [
      'The [c:{wonder_object.text}] rolled. [name:{protagonist.name}] chased. The [c:{ally.text}] chased too. They caught it together.',
    ] },

  /* v0.9.3 · b24 — HIGH_IMPACT call-and-response beats for little.
     Fire only when the kid picked a sound. Simple call/response with
     a gentle physical reaction — no irony, ages 4-5 friendly. */
  { id:'v3_tl_little_repeat_chant_call', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '"[y:{chant.text}]!" said [name:{protagonist.name}]. The [c:{ally.text}] said it back. Then they said it together. The [c:{wonder_object.text}] hummed along, kind of.',
    ] },
  { id:'v3_tl_little_repeat_chant_spell', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '"[y:{chant.text}]," whispered [name:{protagonist.name}], like it was a spell. The [c:{wonder_object.text}] flipped over by itself. The [c:{ally.text}] looked impressed.',
    ] },
  { id:'v3_tl_little_repeat_chant_button', stage:'tl_silly_repeat', tiers:['little'], requiredRoles:['protagonist','ally','wonder_object','chant'], jokeJob:'physical_gag',
    lines: [
      '[name:{protagonist.name}] tapped the [c:{wonder_object.text}] like a button. "[y:{chant.text}]!" said [name:{protagonist.name}]. "[y:{chant.text}]!" said the [c:{ally.text}]. The [c:{wonder_object.text}] did exactly nothing, which was funny.',
    ] },

  /* --- LITTLE COZY END — bedtime (3 variants) ---
     b18 story-length pass: drop terminal closers ("Time to sleep.",
     "Goodnight.") — the bedtime imagery in the prior sentence carries the
     close. end_bed_3 keeps its full structure because "already half asleep"
     IS the punchline. */
  { id:'v3_tl_little_end_bed_1', stage:'tl_cozy_end', tiers:['little'], mode:'bedtime', requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] pulled the [c:{ally.text}] into a small pillow fort. "We made it," said [name:{protagonist.name}]. The [c:{ally.text}] yawned.',
    ] },
  { id:'v3_tl_little_end_bed_2', stage:'tl_cozy_end', tiers:['little'], mode:'bedtime', requiredRoles:['protagonist','ally'],
    lines: [
      'By the end of the day, [name:{protagonist.name}] and the [c:{ally.text}] were tired and happy. They hugged. Then they went to bed.',
    ] },
  { id:'v3_tl_little_end_bed_3', stage:'tl_cozy_end', tiers:['little'], mode:'bedtime', requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] tucked the [c:{ally.text}] in first, then climbed in too. "Same time tomorrow?" said [name:{protagonist.name}]. The [c:{ally.text}] was already half asleep.',
    ] },

  /* --- LITTLE COZY END — anytime (2 variants) ---
     b18 story-length pass: drop trailing brag flourishes ("Big plans for
     tomorrow.", "Good day!"). The "what happens next" hook the anytime mode
     wants is already implied by "Onto the next thing" / "ready for whatever
     came next". */
  { id:'v3_tl_little_end_any_1', stage:'tl_cozy_end', tiers:['little'], mode:'anytime', requiredRoles:['protagonist','ally'],
    lines: [
      '[name:{protagonist.name}] grabbed the [c:{ally.text}]\'s paw. "Onto the next thing," said [name:{protagonist.name}]. They walked home together.',
    ] },
  { id:'v3_tl_little_end_any_2', stage:'tl_cozy_end', tiers:['little'], mode:'anytime', requiredRoles:['protagonist','ally'],
    lines: [
      'By the end of the day, [name:{protagonist.name}] and the [c:{ally.text}] were happy and ready for whatever came next. They high-fived and headed home.',
    ] },
];

/* generateStoryV3 — role-based story generation. Mirrors v2's slot construction
   then applies the blueprint's role map. Each stage picks an eligible beat
   whose required roles are all present. Lines are rendered with role-aware
   resolution: {role.prop} resolves to slots[blueprint.roleMap[role]][prop].

   Returns {title, paragraphs} compatible with renderStory(). Highlight tokens
   are emitted by beat authors directly; no regex post-processing required. */
function generateStoryV3(name, picks, age) {
  let tier;
  if (age >= 2 && age <= 3)        tier = 'tot';
  else if (age >= 4 && age <= 5)   tier = 'little';
  else if (age >= 6 && age <= 7)   tier = 'kid';
  else if (age >= 8 && age <= 10)  tier = 'big';
  else if (age >= 11 && age <= 13) tier = 'tween';
  else                              return null;

  // v2.10.0 — tot/little-v3 blueprints land in this release (tot_wonder_v3,
  // tot_sky_v3, little_quest_v3, little_food_v3). The old early-exit is gone.
  // Blueprint selection below filters to tier-appropriate blueprints; if no
  // tot/little blueprint can fulfill the picks (shouldn't happen with current
  // 3-role contract), the engine returns null and the v2 fallback catches it.

  // Pick a blueprint at random among all eligible for this tier. v2.6.0 expanded
  // from 1 to 4 blueprints (lost_snack_v3, goal_spine_v3, show_wrong_v3, rule_loophole_v3).
  // Blueprints whose required roles can't be fulfilled by the picks get filtered later.
  // If picks.__v3BlueprintId is set (used by qaV3Blueprint for isolated audits), the
  // engine forces that specific blueprint instead of random selection.
  const blueprints = Object.values(V3_BLUEPRINTS).filter(bp => bp.tiers.includes(tier));
  if (!blueprints.length) return null;
  let blueprint;
  if (picks && picks.__v3BlueprintId) {
    blueprint = blueprints.find(bp => bp.id === picks.__v3BlueprintId);
    if (!blueprint) return null;
  } else {
    blueprint = blueprints[Math.floor(Math.random() * blueprints.length)];
  }

  // Reuse v2's slot construction by calling the helpers directly. We build slots
  // the same way generateStoryV2 does so role resolution mirrors v2 grammar.
  // v0.9.3 · b9 — buildStory in index.html now passes picks.setting as a fully
  // resolved Setting 2.0 object (id + place + biases) with the per-session
  // hidden place already chosen. Use it directly when present; only call
  // getSetting (which may re-randomize) when picks.setting is just a {id} stub.
  const setting = (picks.setting && 'place' in picks.setting && 'visitorBias' in picks.setting)
    ? picks.setting
    : getSetting(picks.setting?.id || picks.setting?.w || 'surprise');
  function mapPickToWord(pickValue, lib) {
    if (!pickValue) return rawPick(lib);
    const hit = lib.find(w => w.text === pickValue || w.id === pickValue);
    if (hit) return hit;
    // v0.9.3 · b15 — see mapPickToWord at the v2 entry point for the rationale.
    // v0.9.3 · b26 — isPlural re-derivation duplicated here (v3 entry point).
    const KNOWN_PLURALS    = new Set(['binoculars','scissors','pants','shorts','jeans','glasses','tongs','tweezers','pliers','sunglasses']);
    const INVARIANT_PLURAL = new Set(['fish','deer','sheep','moose','species','aircraft','spacecraft']);
    const pv = String(pickValue).toLowerCase();
    let derivedIsPlural = false;
    if (KNOWN_PLURALS.has(pv)) derivedIsPlural = true;
    else if (pv.endsWith('s') && !INVARIANT_PLURAL.has(pv) && !pv.endsWith('ss')) derivedIsPlural = true;
    const fallback = rawPick(lib);
    return Object.assign({}, fallback, { text: pickValue, id: pickValue, isPlural: derivedIsPlural });
  }
  function rawPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const companion = mapPickToWord(picks.pet?.w, V2_WORDS.companions);
  const userPickedVisitor = !!picks.creature?.w;
  const visitor   = userPickedVisitor
                    ? mapPickToWord(picks.creature.w, V2_WORDS.visitors)
                    : rawPick(V2_WORDS.visitors);
  const place     = setting.place ? setting.place : mapPickToWord(picks.place?.w, V2_WORDS.places);
  const food      = mapPickToWord(picks.food?.w, V2_WORDS.foods);
  /* v2.6.0 — `object` joined the v3 slot pool so show_wrong_v3 (prop=object) and
     rule_loophole_v3 (loophole_tool=object) have something concrete to render.
     Random pick from V2_WORDS.objects since the picker has no `object` round. */
  const object    = rawPick(V2_WORDS.objects);
  const sound     = picks.freeword?.w ? { text: picks.freeword.w } : rawPick(V2_WORDS.sounds);
  const color     = picks.color?.w ? { text: picks.color.w } : null;
  const move      = picks.move?.w  ? { text: picks.move.w }  : null;
  const mood      = picks.mood?.w  ? { text: picks.mood.w }  : null;
  const weather   = picks.weather?.w ? { text: picks.weather.w } : null;
  /* v2.10.0 — sky slot wired into v3 so tot_sky_v3 (wonder_object = sky) can resolve.
     Previously v3 only covered kid/big/tween where sky isn't a picker round.
     `cap` is set for capitalized-exclamation positions in tl_silly_repeat beats. */
  const sky       = picks.sky?.w ? { text: picks.sky.w, cap: V2Grammar.capitalize(picks.sky.w) } : null;
  const freeword2 = picks.freeword2?.w ? { text: picks.freeword2.w } : null;
  /* v2.7.0 — concrete goal slot. Mirrors v2's pickGoal() so goal_spine_v3 stories
     state what the protagonist is actually trying to do, instead of "something
     had to get done." Includes a titleText variant for title patterns since
     goal.cap only first-letter-caps and would render "Find the way home". */
  const goalRaw = pickGoal();
  const goal = {
    text:      goalRaw.text,
    cap:       V2Grammar.capitalize(goalRaw.text),
    past:      goalRaw.past,
    titleText: V2Grammar.titleCase(goalRaw.text),
    id:        goalRaw.id,
  };

  const slots = {
    kid: { name: name || 'Friend', cap: V2Grammar.capitalize(name || 'Friend'), lc: (name || 'friend').toLowerCase() },
    companion, visitor, place, food, object, sound,
    color, move, mood, weather, sky, freeword2,  // v2.10.0 — sky added for tot_sky_v3
    goal,  // v2.7.0
  };

  // Resolve role → slot
  const roles = {};
  for (const [role, slotName] of Object.entries(blueprint.roleMap)) {
    roles[role] = slots[slotName] || null;
  }

  // v0.9.3 · b20 — tier-aware stage resolution. Kid (ages 6-7) drops one stage
  // per blueprint (named in `blueprint.skipStagesForKid`) so kid stories run
  // 5 paragraphs instead of 6. Big + tween keep the full 6-stage arc.
  // The Section 3 v3-matrix QA gate is tier-aware to match.
  const stagesForThisStory = (tier === 'kid' && blueprint.skipStagesForKid && blueprint.skipStagesForKid.length)
    ? blueprint.stages.filter(s => !blueprint.skipStagesForKid.includes(s.name))
    : blueprint.stages;

  // Validate required roles for the blueprint as a whole — union of all stage roles.
  // If any role required by any stage is unfulfilled, the blueprint can't fire cleanly.
  // (Computed over the tier-resolved stages array so kid doesn't fail validation for
  // a role only the dropped stage required.)
  const blueprintRequired = new Set();
  for (const stage of stagesForThisStory) {
    for (const r of (stage.requiredRoles || [])) blueprintRequired.add(r);
  }
  for (const r of blueprintRequired) {
    if (!roles[r]) return null;
  }

  /* Render a v3 line: resolve {role.prop} → slot value, leave [name:]/[c:]/[y:] tokens intact. */
  function renderV3Line(line) {
    return line.replace(/\{([a-zA-Z][\w]*)\.([\w]+)\}/g, (_, roleName, prop) => {
      const slot = roles[roleName];
      if (slot == null) return '?';
      if (typeof slot === 'string') return slot;
      const baseText = slot.text != null ? slot.text : (slot.name != null ? slot.name : '');
      if (!prop || prop === 'text')      return baseText;
      if (prop === 'cap')                return V2Grammar.capitalize(baseText);
      if (prop === 'name')               return slot.name || baseText;
      if (prop === 'articleText')        return V2Grammar.articleText(slot);
      if (prop === 'theText')            return V2Grammar.theText(slot);
      if (prop === 'TheText')            return V2Grammar.TheText(slot);
      if (prop === 'titleText')          return slot.titleText || V2Grammar.titleCase(baseText);
      if (prop === 'plural')             return V2Grammar.plural(slot);
      return slot[prop] != null ? String(slot[prop]) : '?';
    });
  }

  /* v2.6.2 — v3 also reads picks.storyMode. Landing beats can be tagged
     `mode:'bedtime'` or `mode:'anytime'`; untagged landing beats default to bedtime.
     Other stages ignore mode. */
  const v3StoryMode = picks && picks.storyMode === 'anytime' ? 'anytime' : 'bedtime';

  /* Pick a stage beat from V3_BEATS where stage matches, blueprintId matches (or
     beat has no blueprintId — wildcard), tier is allowed, and all required roles
     are non-null. For landing or tl_cozy_end stages, the beat's mode must match
     v3StoryMode (untagged → bedtime). Prefers more-specific (more required roles)
     beats. v2.10.0 — excludes beats already used in THIS story (used by the
     tot/little blueprints where tl_silly_repeat fires twice per arc; without
     dedup the same beat could render in both P2 and P3). */
  const usedInStory = new Set();
  function pickStageBeat(stage) {
    const candidates = V3_BEATS.filter(b => {
      if (b.stage !== stage.name) return false;
      if (b.blueprintId && b.blueprintId !== blueprint.id) return false;
      if (!b.tiers.includes(tier)) return false;
      if (!(b.requiredRoles || []).every(r => roles[r] != null)) return false;
      // Mode filter applies to ending-stage beats. The v2.10.0 tl_cozy_end stage
      // (tot/little) gets the same treatment as the v3 landing stage for kid/big/tween.
      if (stage.name === 'landing' || stage.name === 'tl_cozy_end') {
        const beatMode = b.mode || 'bedtime';
        if (beatMode !== v3StoryMode) return false;
      }
      return true;
    });
    if (!candidates.length) return null;
    // In-story dedup: prefer beats not yet used in this story. Falls back to the
    // full candidate pool if every variant is already used (small pools won't stall).
    const fresh = candidates.filter(c => !usedInStory.has(c.id));
    const pool = fresh.length > 0 ? fresh : candidates;
    const maxRoles = Math.max(...pool.map(c => (c.requiredRoles || []).length));
    const top = pool.filter(c => (c.requiredRoles || []).length === maxRoles);
    // v0.9.3 · b28 — stage-aware HIGH_IMPACT beat weighting.
    //
    // Three additive boosts when chant/payoff_word is picked:
    //
    // 1. Global 2x for jokeJob='absurd_consequence' (b27 carryover) — causes
    //    the picked word to change a prop/rule/audience event.
    // 2. Landing-stage 3x for jokeJob='callback' — the callback should feel
    //    like a punchline, not a sleepy repetition. Codex post-b27 showed
    //    callback axis flat at 0.62/3; lifting landing-stage callback weight
    //    is the targeted intervention.
    // 3. Tot/little 2x for any beat that includes a chant token in its
    //    lines — when the kid actually picked a chant/sound, surface an
    //    authored call-and-response beat more often. Codex post-b27 reported
    //    tot/little chant role rendering only ~50% of stories.
    const hasHighImpact = !!(roles.chant || roles.payoff_word);
    const isLanding = stage.name === 'landing' || stage.name === 'tl_cozy_end';
    const isTotLittle = tier === 'tot' || tier === 'little';
    const hasChant = !!roles.chant;
    if (hasHighImpact || (isTotLittle && hasChant)) {
      const weighted = [];
      for (const c of top) {
        weighted.push(c);
        // Boost #1: absurd_consequence (causality engine) — global 2x.
        if (hasHighImpact && c.jokeJob === 'absurd_consequence') weighted.push(c);
        // Boost #2: callback in landing stage — additional 2x on top of
        // base weight (total 3x when chant/payoff_word picked).
        if (hasHighImpact && c.jokeJob === 'callback') {
          weighted.push(c);
          if (isLanding) weighted.push(c);
        }
        // Boost #3: tot/little chant-bearing beats. Detect by scanning
        // the beat's first line for a [y:{chant.*}] token. Cheap; runs
        // only when chant was actually picked.
        if (isTotLittle && hasChant && Array.isArray(c.lines) && c.lines.length > 0) {
          const beatTextSample = c.lines.join(' ');
          if (/\[y:\{chant\./.test(beatTextSample)) weighted.push(c);
        }
      }
      const card = weighted[Math.floor(Math.random() * weighted.length)];
      return card;
    }
    const card = top[Math.floor(Math.random() * top.length)];
    return card;
  }

  const paragraphs = [];
  for (const stage of stagesForThisStory) {
    const card = pickStageBeat(stage);
    if (!card) return null;
    usedInStory.add(card.id);
    const line = card.lines[Math.floor(Math.random() * card.lines.length)];
    paragraphs.push(renderV3Line(line));
  }

  /* v3 coverage pass — guarantees every picked flavor role surfaces somewhere
     in the body. With ~6 beat variants per stage, random beat selection only
     surfaces optional roles (signature_action/visual_signature/chant/payoff_word)
     ~50% of the time. This pass appends a short flavor sentence with highlight
     tokens for any picked role that didn't land. Required roles already hit
     100% by stage construction; this only patches the flavor ones. */
  /* v2.7.0 — bodyHasHighlight checks for a highlight TOKEN, not just bare text.
     Previously `bodyHas('silly')` returned true when the word appeared bare inside
     a goal phrase like "win the silly race" — even though no [c:silly] token was
     emitted. The QA harness then flagged the highlight as missing.
     Now: the flavor callback fires whenever the highlight token isn't present,
     regardless of whether the bare word happens to appear in flavor text. */
  function bodyHasHighlight(needle) {
    const esc = String(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\[(?:name|c|y):[^\\]]*\\b' + esc + '\\b[^\\]]*\\]', 'i');
    return paragraphs.some(p => re.test(p));
  }
  function appendToMiddle(sentence) {
    const targetIdx = paragraphs.length >= 4
      ? 2 + Math.floor(Math.random() * Math.max(1, paragraphs.length - 3))
      : Math.max(0, paragraphs.length - 2);
    paragraphs[targetIdx] = paragraphs[targetIdx].trimEnd() + ' ' + sentence;
  }
  /* Each flavor role has a short, role-aware safety-net sentence. These mirror v2's
     coverage callbacks but emit highlight tokens directly so they highlight too. */
  /* v0.9.3 · b24 — expanded variant pools for the 6 glue phrases Codex
     flagged in the pre-b24 50-story sample. Each variant pool now has
     4-6 alternates so no single phrase dominates samples. Selection is
     uniform-random in renderFlavorCallback. */
  const FLAVOR_CALLBACKS = {
    signature_action: [
      // v0.9.3 · b27 — pool expanded 5 → 8. The b26 repetition-report still
      // showed "one more time, just to make a point" at 22% and "There was a
      // small <move> moment..." also surfacing. New variants drop each
      // line's selection from 20% to 12.5%.
      '[name:{protagonist.name}] [c:{signature_action.text}] one more time, just to make a point.',
      'Somewhere in there, [name:{protagonist.name}] [c:{signature_action.text}] for emphasis.',
      '[name:{protagonist.name}] [c:{signature_action.text}] without thinking. It was a thing they did now.',
      'There was a small [c:{signature_action.text}] moment that nobody quite witnessed in full.',
      'For exactly two seconds, [name:{protagonist.name}] [c:{signature_action.text}] like it was a job.',
      'Halfway through, [name:{protagonist.name}] [c:{signature_action.text}] for absolutely no reason.',
      '[name:{protagonist.name}] [c:{signature_action.text}] briefly, then pretended that had not happened.',
      'A short burst of [c:{signature_action.text}] happened. Witnesses disagreed about the details.',
    ],
    visual_signature: [
      // v0.9.3 · b26 — pool expanded 5 → 8. b24 baseline showed
      // "Everything in the room had picked up..." still at 24%/50 stories.
      // Three more variants drop each variant's selection probability from
      // 20% to ~12.5%, which puts the worst-offender phrase below the
      // grammar-lint glue-phrase warning threshold (25%).
      'A faint [c:{visual_signature.text}] glow hung over the scene by then.',
      'Everything in the room had picked up a faint [c:{visual_signature.text}] tint.',
      'For a beat the whole place looked weirdly [c:{visual_signature.text}].',
      'Somebody could have sworn the air went a little [c:{visual_signature.text}].',
      'The [c:{visual_signature.text}] thing was happening again, whatever it was.',
      'There was a [c:{visual_signature.text}] feeling to the moment that nobody really named.',
      'The light shifted briefly toward [c:{visual_signature.text}] and then thought better of it.',
      '[name:{protagonist.name}] noticed a streak of [c:{visual_signature.text}] across the wall. Or did they.',
    ],
    chant: [
      'Once, very quietly, [name:{protagonist.name}] muttered "[y:{chant.text}]" under their breath.',
      'A distant "[y:{chant.text}]" echoed from somewhere, possibly a memory.',
      'Somewhere down the hall a tiny "[y:{chant.text}]" happened.',
      'Out of nowhere, [name:{protagonist.name}] said "[y:{chant.text}]" like a small spell.',
      'A "[y:{chant.text}]" slipped out before [name:{protagonist.name}] could stop it.',
    ],
    payoff_word: [
      'And one of them, very quietly, said "[y:{payoff_word.text}]."',
      'Later someone would swear they heard "[y:{payoff_word.text}]" in the rafters.',
      'Just then a "[y:{payoff_word.text}]" cracked the silence. Nobody admitted to it.',
      'A "[y:{payoff_word.text}]" hung in the air for a second longer than expected.',
      '"[y:{payoff_word.text}]," went somebody. Nobody asked who.',
    ],
    /* v2.6.0 — mood + mcguffin added to flavor pool so chosen mood/food always surface
       even when the blueprint shape doesn't naturally call for them (e.g. show_wrong_v3
       has no native mcguffin = food beat — kid is busy with the prop, not snacks). */
    mood_throughline: [
      // v0.9.3 · b27 — pool expanded 2 → 6 to drop the b26 repetition-report
      // hit on "<name> felt <mood> about" (36%/100 stories) by distributing
      // mood-callback selection across more sentence shapes.
      '[name:{protagonist.name}] kept feeling [c:{mood_throughline.text}] about the whole thing.',
      'Throughout, [name:{protagonist.name}] stayed [c:{mood_throughline.text}]. Steadily [c:{mood_throughline.text}].',
      'The whole day had a [c:{mood_throughline.text}] energy to it. Nobody could explain why.',
      'Underneath everything, [name:{protagonist.name}] was running on pure [c:{mood_throughline.text}].',
      'There was a [c:{mood_throughline.text}] quality to the air, if anyone noticed.',
      'You could call the mood [c:{mood_throughline.text}], and nobody would disagree.',
    ],
    mcguffin: [
      // v0.9.3 · b27 — old line started "[c:{mcguffin.articleText}] sat off..."
      // which renders "some donuts sat off..." (lowercase 's'). When appendToMiddle
      // appends this after a period+space, it produces "...whatever it was. some
      // donuts sat..." flagging the grammar-lint lowercase-sentence-start. Reworded
      // to start with a capital so the sentence-start is grammatical.
      'Off to the side, [c:{mcguffin.articleText}] sat there, mostly forgotten, definitely still part of the day.',
      'Somebody had brought [c:{mcguffin.text}]. Nobody knew when. Nobody minded.',
      'Meanwhile, [c:{mcguffin.articleText}] waited patiently for its moment.',
    ],
    /* v2.6.1 — obstacle added as a safety net. show_wrong_v3 tween escalation didn't
       always reference the chosen creature even though it was in the role map. */
    obstacle: [
      'A [c:{obstacle.text}] watched the whole thing happen and offered no comment.',
      'Off to the side, the [c:{obstacle.text}] was processing all of this with visible difficulty.',
    ],
  };
  const FLAVOR_KEYS = ['signature_action', 'visual_signature', 'chant', 'payoff_word', 'mood_throughline', 'mcguffin', 'obstacle'];
  for (const role of FLAVOR_KEYS) {
    const slot = roles[role];
    if (!slot) continue;                       // role not picked or not mapped
    const needle = slot.text || slot.name;
    if (!needle) continue;
    if (bodyHasHighlight(needle)) continue;    // v2.7.0 — require highlight TOKEN, not bare text
    const variants = FLAVOR_CALLBACKS[role];
    const line = variants[Math.floor(Math.random() * variants.length)];
    appendToMiddle(renderV3Line(line));
  }

  const titleLine = blueprint.titlePatterns[Math.floor(Math.random() * blueprint.titlePatterns.length)];
  const title = renderV3Line(titleLine);

  // v0.9.3 · b27 — Expose blueprint metadata to content-QA scripts via __-prefixed
  // fields. Non-rendered, non-iterated. renderStory() in index.html reads only
  // {title, paragraphs}; the extras are inert at render time. The audit scripts
  // (content-comedy-mechanics.js, content-blueprint-health.js) read story.__blueprint
  // to report the actual blueprint instead of "(v2 fallback)" when V3 generated.
  // __stages tracks which stage names actually fired this story (after kid 5-stage
  // filtering), useful for per-stage diagnostics.
  return {
    title,
    paragraphs,
    __blueprint: blueprint.id,
    __tier:      tier,
    __stages:    stagesForThisStory.map(s => s.name),
  };
}

/* Engine router.
 *
 * v3.0.0: v3 is the UNIFIED ENGINE for all ages 2-13. The v2.9.0 router routed
 * ages 6+ to v3; v2.10.0 added tot/little-v3 blueprints (tot_wonder_v3, tot_sky_v3,
 * little_quest_v3, little_food_v3); v3.0.0 removes the age gate entirely so every
 * age tries v3 first. v2 is retained as a silent fallback for one release so any
 * latent v3 issue can be rolled back without redeploy. v3.0.1 (next release) will
 * delete the v2 codepath entirely once production traffic confirms v3 is stable.
 * legacy/engine-v2.js holds a snapshot for rollback safety.
 *
 * Note: index.html has its own router in buildStory() that mirrors this logic
 * for direct browser execution. This function is kept in sync for tests and
 * any caller that imports the engine module directly.
 */
function generateStoryRouted(name, picks, age) {
  // v3.0.0 — every age routes to v3 first. v2 fallback fires only when v3 returns
  // null (shouldn't happen in normal operation post-v2.10.0 since tot/little-v3
  // covers ages 2-5).
  const v3 = generateStoryV3(name, picks, age);
  if (v3) return v3;
  return generateStoryV2(name, picks, age);
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
  window.V2_SETTINGS = V2_SETTINGS;     // v2.1.0
  window.getSetting = getSetting;        // v2.1.0
  window.V2Grammar = V2Grammar;

  /* v2.5.0 — v3 experimental engine, exposed behind ?engine=v3 query param or
     localStorage 'nt_engine_v3' flag. index.html reads those signals and sets
     window.NODDY_ENGINE = 'v3'. generateStoryRouted picks v3 when the flag is set,
     falls back to v2 when v3 returns null (e.g. tot/little). v2 stays default. */
  window.generateStoryV3 = generateStoryV3;
  window.generateStoryRouted = generateStoryRouted;
  window.V3_VERSION = V3_VERSION;
  window.V3_BLUEPRINTS = V3_BLUEPRINTS;
  window.V3_BEATS = V3_BEATS;

  /* v2.4.1 — DevTools helpers to inspect and reset the recent-beat memory.
     Usage:
       qaBeatMemoryStats()   // { beats:[...], lines:[...], capBeats, capLines }
       qaResetMemory()       // clears both FIFOs — useful between playtests */
  window.qaBeatMemoryStats = function qaBeatMemoryStats() {
    return {
      beats:     __recentBeatIds.slice(),
      lines:     __recentLineKeys.slice(),
      capBeats:  __RECENT_BEAT_CAP,
      capLines:  __RECENT_LINE_CAP,
    };
  };
  window.qaResetMemory = function qaResetMemory() {
    __recentBeatIds.length  = 0;
    __recentLineKeys.length = 0;
    console.log('[NoddyTales] beat memory cleared');
  };

  /* qaWordMapping — RICH-OBJECT MAPPING ONLY.
     This helper answers a narrow question: does every picker option for the four
     pool-backed slots (pet → companions, creature → visitors, place → places,
     food → foods) have an exact text/id match in V2_WORDS? It does NOT measure
     whether the chosen word actually surfaces in a generated story.

     For real user-selection coverage (body vs. title, highlighted tokens, null
     stories, unresolved placeholders) use `qaSelectableCoverage()` instead.

     Usage from browser console:
       qaWordMapping()                  // full audit, console table + return value
       qaWordMapping({ verbose:true })  // also logs the missing words inline */
  window.qaWordMapping = function qaWordMapping(opts) {
    opts = opts || {};
    if (typeof WORD_BANK === 'undefined') {
      console.warn('[qaWordMapping] WORD_BANK not in scope — call from browser context');
      return null;
    }
    const CAT_TO_POOL = {
      pet:      'companions',
      creature: 'visitors',
      place:    'places',
      food:     'foods',
    };
    const TIERS = ['tot', 'little', 'kid', 'big', 'tween'];
    const perTier = {};
    const allMissing = [];
    let totalCovered = 0;
    let totalChecked = 0;

    for (const tier of TIERS) {
      const tierRounds = WORD_BANK[tier] || [];
      perTier[tier] = {};
      for (const cat of Object.keys(CAT_TO_POOL)) {
        const round = tierRounds.find(r => r.cat === cat);
        if (!round) continue;
        const pool  = V2_WORDS[CAT_TO_POOL[cat]] || [];
        const lookup = new Set();
        for (const w of pool) {
          if (w.text) lookup.add(w.text);
          if (w.id)   lookup.add(w.id);
        }
        const options = round.options || [];
        const missing = options.filter(o => !lookup.has(o.w)).map(o => o.w);
        const mapped  = options.length - missing.length;
        totalChecked += options.length;
        totalCovered += mapped;
        perTier[tier][cat] = {
          total:    options.length,
          mapped,
          missing,
          coverage: options.length ? Math.round(100 * mapped / options.length) : 100,
        };
        for (const m of missing) allMissing.push({ tier, cat, word: m });
      }
    }

    const summary = {
      totalChecked,
      totalCovered,
      totalMissing: totalChecked - totalCovered,
      coveragePct:  totalChecked ? Math.round(100 * totalCovered / totalChecked) : 100,
    };

    /* Console output: per-tier compact summary + missing-word list. */
    console.log('=== qaWordMapping — picker → V2_WORDS coverage ===');
    for (const tier of TIERS) {
      const cats = perTier[tier] || {};
      const parts = Object.keys(CAT_TO_POOL)
        .filter(c => cats[c])
        .map(c => `${c} ${cats[c].mapped}/${cats[c].total}` + (cats[c].missing.length && opts.verbose ? ` (missing: ${cats[c].missing.join(', ')})` : ''));
      console.log(`  ${tier.padEnd(7)} — ${parts.join(' · ')}`);
    }
    console.log(`Summary: ${summary.totalCovered}/${summary.totalChecked} mapped (${summary.coveragePct}%) — ${summary.totalMissing} missing`);
    if (summary.totalMissing && !opts.verbose) {
      console.log('Missing words (rerun with { verbose:true } for inline list):');
      const groups = {};
      for (const m of allMissing) {
        const k = m.tier + ':' + m.cat;
        (groups[k] = groups[k] || []).push(m.word);
      }
      for (const k of Object.keys(groups)) console.log('  ' + k + ' → ' + groups[k].join(', '));
    }
    return { perTier, summary, allMissing };
  };

  /* v2.5.0 — qaSelectableCoverage: STRICT body-vs-title audit.
     Earlier versions counted title hits as coverage, which made categories look
     100% covered when the picked word only appeared in "Cole vs the {pick}"-style
     titles. Now reports separately:
       mapped            — pool-backed entries with exact v2 rich-word match (text or id).
                           N/A for free-string slots (color/move/mood/weather/freeword).
       read              — does generateStoryV2 actually read picks.{cat}?.w?
       bodyCovered       — % of (option × story) pairs where chosen text appears in PARAGRAPHS
                           (titles excluded). This is the release-gate metric.
       titleOnly         — % of pairs where chosen text appears in title but NOT in body.
                           High titleOnly is a smell: the word is being borrowed by the
                           title but never landing in the actual story.
       highlighted       — % of pairs where the chosen text appears wrapped in a
                           [name:]/[c:]/[y:] token inside a paragraph.
       nulls             — count of null generateStoryV2 returns across the sample.
       unresolvedTokens  — count of stories with surviving {slot.prop} placeholders.
       avgBodyCoverage / minBodyCoverage — derived from per-option pct.
       worstOptions      — options with body coverage below 75% threshold.

     Body coverage is the new gate. Title-only never counts as covered.

     Usage from browser console:
       qaSelectableCoverage()                  // all tiers, 8 samples per option
       qaSelectableCoverage({ samples: 20 })   // tighter estimate
       qaSelectableCoverage({ tiers:['tween'] })
       qaSelectableCoverage({ verbose: true }) // include per-option breakdown */
  window.qaSelectableCoverage = function qaSelectableCoverage(opts) {
    opts = opts || {};
    if (typeof WORD_BANK === 'undefined' || typeof generateStoryV2 !== 'function') {
      console.warn('[qaSelectableCoverage] WORD_BANK/generateStoryV2 not in scope');
      return null;
    }
    const SAMPLES_PER_OPTION = opts.samples != null ? opts.samples : 8;
    const TIERS = opts.tiers || ['tot','little','kid','big','tween'];
    const POOL_BACKED = { pet:'companions', creature:'visitors', place:'places', food:'foods' };
    const READ_BY_ENGINE = {
      pet:true, creature:true, place:true, food:true,
      color:true, move:true, mood:true,
      freeword:true, freeword2:true,
      weather: true,    // v2.4.7
      sky: true,        // v2.5.0 — wired in this release
    };
    const stripTokens = t => String(t).replace(/\[(name|c|y):([^\]]+)\]/g, '$2');

    function defaultPicks(tier) {
      const rounds = WORD_BANK[tier] || [];
      const out = {};
      for (const r of rounds) {
        if (!r.options || !r.options.length) continue;
        out[r.cat] = { w: r.options[0].w };
      }
      out.freeword  = { w: 'KAPOW', subtype: 'shout' };
      out.freeword2 = { w: 'BOINGO' };
      return out;
    }

    const ageForTier = { tot:2, little:4, kid:6, big:9, tween:12 };
    const report = {};

    for (const tier of TIERS) {
      const tierRounds = WORD_BANK[tier] || [];
      report[tier] = {};
      for (const round of tierRounds) {
        const cat     = round.cat;
        const options = round.options || [];
        const pool    = POOL_BACKED[cat] ? (V2_WORDS[POOL_BACKED[cat]] || []) : null;
        let mapped = null;
        if (pool) {
          const lookup = new Set();
          for (const w of pool) {
            if (w.text) lookup.add(w.text);
            if (w.id)   lookup.add(w.id);
          }
          mapped = options.filter(o => lookup.has(o.w)).length;
        }
        const read = !!READ_BY_ENGINE[cat];
        if (!read || !options.length) {
          report[tier][cat] = {
            mapped, total: options.length, read,
            bodyCovered: null, titleOnly: null, highlighted: null,
            nulls: 0, unresolvedTokens: 0,
            avgBodyCoverage: null, minBodyCoverage: null,
            optionsAudited: 0, worstOptions: [], perOption: [],
          };
          continue;
        }

        const perOption = [];
        let nulls = 0, unresolvedTokens = 0, totalPairs = 0;
        let bodyHits = 0, titleOnlyHits = 0, highlightedHits = 0;

        for (const opt of options) {
          const picks = Object.assign(defaultPicks(tier), { [cat]: { w: opt.w } });
          if (cat === 'freeword')  picks.freeword  = { w: opt.w, subtype: 'shout' };
          if (cat === 'freeword2') picks.freeword2 = { w: opt.w };

          const optLc = String(opt.w).toLowerCase();
          const escRx = optLc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordRx = new RegExp('\\b' + escRx + '\\b', 'i');
          // Token regex: [name:X] / [c:X] / [y:X] containing the chosen word
          const tokRx = new RegExp('\\[(?:name|c|y):[^\\]]*\\b' + escRx + '\\b[^\\]]*\\]', 'i');
          const placeholderRx = /\{[a-zA-Z][\w.]*\}/;

          let optBodyHits = 0, optTitleOnly = 0, optHighlighted = 0;

          for (let i = 0; i < SAMPLES_PER_OPTION; i++) {
            const s = generateStoryV2('Cole', picks, ageForTier[tier]);
            totalPairs++;
            if (!s) { nulls++; continue; }
            const titleRaw    = String(s.title || '');
            const paraRaw     = (s.paragraphs || []).join(' ');
            const wholeRaw    = titleRaw + ' ' + paraRaw;
            const titleClean  = stripTokens(titleRaw).toLowerCase();
            const paraClean   = stripTokens(paraRaw).toLowerCase();

            if (placeholderRx.test(wholeRaw)) unresolvedTokens++;

            const inBody  = wordRx.test(paraClean);
            const inTitle = wordRx.test(titleClean);
            const inToken = tokRx.test(paraRaw); // unstripped, look for tokens in paragraphs

            if (inBody)                 { optBodyHits++; bodyHits++; }
            else if (inTitle)           { optTitleOnly++; titleOnlyHits++; }
            if (inToken)                { optHighlighted++; highlightedHits++; }
          }

          const denom = SAMPLES_PER_OPTION;
          perOption.push({
            w: opt.w,
            body: Math.round(100 * optBodyHits / denom),
            titleOnly: Math.round(100 * optTitleOnly / denom),
            highlighted: Math.round(100 * optHighlighted / denom),
          });
        }

        const totalSamples = Math.max(1, totalPairs);
        const avgBody = Math.round(perOption.reduce((s, o) => s + o.body, 0) / Math.max(1, perOption.length));
        const minBody = perOption.length ? perOption.reduce((m, o) => o.body < m.body ? o : m).body : null;
        report[tier][cat] = {
          mapped, total: options.length, read,
          bodyCovered:    Math.round(100 * bodyHits / totalSamples),
          titleOnly:      Math.round(100 * titleOnlyHits / totalSamples),
          highlighted:    Math.round(100 * highlightedHits / totalSamples),
          nulls,
          unresolvedTokens,
          avgBodyCoverage: avgBody,
          minBodyCoverage: minBody,
          optionsAudited: options.length,
          worstOptions: perOption.filter(o => o.body < 75).slice(0, 8),
          perOption,
        };
      }
    }

    console.log('=== qaSelectableCoverage (strict body/title separation) ===');
    console.log('(samples per option: ' + SAMPLES_PER_OPTION + '; gate metric: bodyCovered)\n');
    for (const tier of TIERS) {
      console.log(tier.toUpperCase());
      const cats = report[tier] || {};
      for (const cat of Object.keys(cats)) {
        const r = cats[cat];
        const mapStr = r.mapped == null ? 'n/a'        : (r.mapped + '/' + r.total);
        const readStr = r.read ? 'yes' : 'NO';
        if (!r.read) {
          console.log(`  ${cat.padEnd(10)} mapped=${mapStr.padEnd(8)} read=NO ⚠️ unread by engine`);
          continue;
        }
        if (r.bodyCovered == null) {
          console.log(`  ${cat.padEnd(10)} mapped=${mapStr.padEnd(8)} read=yes (no options)`);
          continue;
        }
        const bodyStr  = `body=${r.bodyCovered}%`;
        const titleStr = `titleOnly=${r.titleOnly}%`;
        const hlStr    = `hl=${r.highlighted}%`;
        const avgStr   = `avg ${r.avgBodyCoverage}%, min ${r.minBodyCoverage}%`;
        const flags    = [];
        if (r.bodyCovered < 80) flags.push('LOW BODY');
        if (r.titleOnly > 10)   flags.push('TITLE LEAKING');
        if (r.nulls)            flags.push(r.nulls + ' nulls');
        if (r.unresolvedTokens) flags.push(r.unresolvedTokens + ' unresolved');
        const flagStr = flags.length ? '  ⚠️ ' + flags.join(', ') : '';
        console.log(`  ${cat.padEnd(10)} mapped=${mapStr.padEnd(8)} read=${readStr} ${bodyStr.padEnd(11)} ${titleStr.padEnd(15)} ${hlStr.padEnd(8)} (${avgStr})${flagStr}`);
        if (opts.verbose && r.worstOptions && r.worstOptions.length) {
          console.log('             worst (<75% body): ' + r.worstOptions.map(o => `${o.w} body=${o.body}% hl=${o.highlighted}%`).join(', '));
        }
      }
      console.log('');
    }
    return report;
  };

  /* v2.5.0 — qaV3Blueprint: empirical audit for the experimental v3 engine.
     Generates N stories for a target age using generateStoryV3 directly (no router
     fallback), measures role coverage, body coverage of every selected word,
     title-only leakage, highlight rate, child agency (kid is the subject of P1),
     plot arc completeness (does every stage produce a paragraph), and nulls.

     Usage from browser console:
       qaV3Blueprint()                          // golden test picks, age 6, 20 samples
       qaV3Blueprint({ age: 9, samples: 50 })
       qaV3Blueprint({ picks: {...} })          // custom picks
       qaV3Blueprint({ verbose: true })         // print sample stories */
  window.qaV3Blueprint = function qaV3Blueprint(opts) {
    opts = opts || {};
    if (typeof generateStoryV3 !== 'function') {
      console.warn('[qaV3Blueprint] generateStoryV3 not in scope');
      return null;
    }
    const age = opts.age || 6;
    const samples = opts.samples || 20;
    // Default to the golden test in the spec.
    const defaultPicks = {
      pet:       { w: 'parrot' },
      food:      { w: 'donuts' },
      place:     { w: 'jungle' },
      creature:  { w: 'dinosaur' },
      color:     { w: 'rainbow' },
      move:      { w: 'bounced' },
      mood:      { w: 'silly' },
      freeword:  { w: 'KABLAM', subtype: 'shout' },
      freeword2: { w: 'BOINGO' },
    };
    const picks = opts.picks || defaultPicks;
    const name  = opts.name  || 'Cole';

    const stripTokens = t => String(t).replace(/\[(name|c|y):([^\]]+)\]/g, '$2');

    // Words we expect to see in the body — picker values for major slots.
    const expected = {
      protagonist:      name,
      ally:             picks.pet?.w,
      mcguffin:         picks.food?.w,
      setting:          picks.place?.w,
      false_suspect:    picks.creature?.w,
      signature_action: picks.move?.w,
      visual_signature: picks.color?.w,
      mood_throughline: picks.mood?.w,
      chant:            picks.freeword?.w,
      payoff_word:      picks.freeword2?.w,
    };

    const results = {
      total: 0, nulls: 0, unresolvedTokens: 0,
      arcCompleteness: 0,         // stories with 6 paragraphs
      kidIsSubject: 0,            // P1 starts with [name:...] or "{name}"
      roleCoverage: {},           // role → count of stories that surfaced it in body
      titleOnly: {},              // role → count of stories where word was only in title
      highlighted: {},            // role → count where role-tied word appeared as a token in paragraphs
      samplesShown: [],
    };
    for (const role of Object.keys(expected)) {
      results.roleCoverage[role] = 0;
      results.titleOnly[role] = 0;
      results.highlighted[role] = 0;
    }

    for (let i = 0; i < samples; i++) {
      const s = generateStoryV3(name, picks, age);
      results.total++;
      if (!s) { results.nulls++; continue; }
      const titleRaw = String(s.title || '');
      const paraRaw  = (s.paragraphs || []).join(' ');
      const wholeRaw = titleRaw + ' ' + paraRaw;
      const titleClean = stripTokens(titleRaw).toLowerCase();
      const paraClean  = stripTokens(paraRaw).toLowerCase();
      if (/\{[a-zA-Z][\w.]*\}/.test(wholeRaw)) results.unresolvedTokens++;
      if (s.paragraphs && s.paragraphs.length === 6) results.arcCompleteness++;
      // Kid agency: P1 mentions the kid in the first ~40 chars
      const p1 = (s.paragraphs || [''])[0];
      const p1Clean = stripTokens(p1).slice(0, 50).toLowerCase();
      if (p1Clean.includes(name.toLowerCase())) results.kidIsSubject++;
      // Per-role coverage
      for (const [role, w] of Object.entries(expected)) {
        if (!w) continue;
        const lc = String(w).toLowerCase();
        const re = new RegExp('\\b' + lc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        const tokenRe = new RegExp('\\[(?:name|c|y):[^\\]]*\\b' + lc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b[^\\]]*\\]', 'i');
        const inBody  = re.test(paraClean);
        const inTitle = re.test(titleClean);
        const inToken = tokenRe.test(paraRaw);
        if (inBody) results.roleCoverage[role]++;
        else if (inTitle) results.titleOnly[role]++;
        if (inToken) results.highlighted[role]++;
      }
      if (opts.verbose && results.samplesShown.length < 2) results.samplesShown.push(s);
    }

    console.log('=== qaV3Blueprint — experimental v3 audit ===');
    console.log(`age=${age} samples=${samples} engine=v3-only (no v2 fallback)`);
    console.log(`name=${name}, picks=`, picks);
    console.log('');
    console.log(`Total:               ${results.total}`);
    console.log(`Nulls:               ${results.nulls}${results.nulls ? ' ⚠️' : ' ✓'}`);
    console.log(`Unresolved tokens:   ${results.unresolvedTokens}${results.unresolvedTokens ? ' ⚠️' : ' ✓'}`);
    console.log(`Arc completeness:    ${results.arcCompleteness}/${results.total - results.nulls} (6-paragraph stories)`);
    console.log(`Kid agency (P1):     ${results.kidIsSubject}/${results.total - results.nulls}`);
    console.log('');
    console.log('Role coverage (body / title-only / highlighted):');
    for (const role of Object.keys(expected)) {
      if (!expected[role]) continue;
      const denom = results.total - results.nulls;
      const body = results.roleCoverage[role];
      const tit  = results.titleOnly[role];
      const hl   = results.highlighted[role];
      const pct  = denom ? Math.round(100 * body / denom) : 0;
      const flag = pct < 80 ? '  ⚠️' : '';
      console.log(`  ${role.padEnd(18)} ${String(expected[role]).padEnd(12)} body=${body}/${denom} (${pct}%) titleOnly=${tit} hl=${hl}${flag}`);
    }
    if (opts.verbose && results.samplesShown.length) {
      console.log('\nSample stories:');
      results.samplesShown.forEach((s, i) => {
        console.log(`\n--- sample ${i+1} ---`);
        console.log('TITLE:', stripTokens(s.title));
        s.paragraphs.forEach((p, j) => console.log('P' + (j+1) + ':', stripTokens(p)));
      });
    }
    return results;
  };

  /* v2.2.3 — DevTools QA helper that mirrors the 60-story audit script.
     Usage from browser console:
       qaStoryMatrix()                             // 5 stories per age, 12 ages = 60
       qaStoryMatrix({ samplesPerAge: 10 })        // 120 total
       qaStoryMatrix({ ages: [6, 7] })             // only kid tier
     Returns { stories: [...], aggregate: {...} }. Console-logs a per-tier summary table. */
  window.qaStoryMatrix = function qaStoryMatrix(opts) {
    opts = opts || {};
    const AGES = opts.ages || [2,3,4,5,6,7,8,9,10,11,12,13];
    const N = opts.samplesPerAge != null ? opts.samplesPerAge : 5;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const stories = [];
    const tierOf = a => a <= 3 ? 'tot' : a <= 5 ? 'little' : a <= 7 ? 'kid' : a <= 10 ? 'big' : 'tween';
    for (const age of AGES) {
      for (let i = 0; i < N; i++) {
        const picks = {
          pet:      { w: pick(V2_WORDS.companions).text },
          food:     { w: pick(V2_WORDS.foods).text },
          place:    { w: pick(V2_WORDS.places).text },
          creature: { w: pick(V2_WORDS.visitors).text },
          color:    { w: pick(['rainbow','electric blue','golden','scarlet','silver','teal','neon','pitch black']) },
          move:     { w: pick(['tiptoed','spun','bounced','zoomed','galloped','crept','soared','wobbled']) },
          mood:     { w: pick(['silly','sneaky','brave','goofy','spooky','dramatic','mysterious','determined']) },
          freeword: { w: pick(['BAZINKLE','FLOBBER','POP','BOING','KAPOW','ZINGO','WOMBO','MEEP']), subtype: 'shout' },
          setting:  { id: pick(V2_SETTINGS.map(s => s.id)) },
        };
        const name = opts.name || 'Cole';
        const story = generateStoryV2(name, picks, age);
        const setting = V2_SETTINGS.find(s => s.id === picks.setting.id);
        const placeText = setting && setting.place ? setting.place.text : picks.place.w;
        const strip = s => s.replace(/\[(?:name|c|y):([^\]]+)\]/g, '$1');
        const stripped = story ? story.paragraphs.map(strip).join(' ') : '';
        const has = (w) => w && new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(stripped);
        const rawJoined = story ? story.paragraphs.join(' ') : '';
        stories.push({
          age, tier: tierOf(age), name,
          setting: setting ? setting.label : '(unknown)',
          picks,
          title: story ? story.title : '(NULL)',
          paragraphs: story ? story.paragraphs : [],
          checks: {
            name_in_body: has(name),
            pet_in_body:  has(picks.pet.w),
            food_in_body: has(picks.food.w),
            place_in_p1:  story && new RegExp('\\b' + placeText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(strip(story.paragraphs[0] || '')),
            creature_in_body: has(picks.creature.w),
            color_in_body:    has(picks.color.w),
            mood_in_body:     has(picks.mood.w),
            move_in_body:     has(picks.move.w),
            freeword_in_body: has(picks.freeword.w),
            has_highlight_tokens: /\[(name|c|y):/.test(rawJoined),
            empty_subject_bug: /\.\s\s+(had a plan|was [a-z]|came over)/.test(stripped),
          },
        });
      }
    }
    // Aggregate
    const total = stories.length;
    const sum  = (fn) => stories.filter(fn).length;
    const aggregate = {
      total,
      name_in_body:          sum(s => s.checks.name_in_body),
      empty_subject_bug:     sum(s => s.checks.empty_subject_bug),
      pet_in_body:           sum(s => s.checks.pet_in_body),
      food_in_body:          sum(s => s.checks.food_in_body),
      place_in_p1:           sum(s => s.checks.place_in_p1),
      creature_in_body:      sum(s => s.checks.creature_in_body),
      color_in_body:         sum(s => s.checks.color_in_body),
      mood_in_body:          sum(s => s.checks.mood_in_body),
      move_in_body:          sum(s => s.checks.move_in_body),
      freeword_in_body:      sum(s => s.checks.freeword_in_body),
      stories_with_highlights: sum(s => s.checks.has_highlight_tokens),
    };
    console.log('[qaStoryMatrix] ' + total + ' stories generated');
    console.table(aggregate);
    return { stories, aggregate };
  };

  /* v2.2.1 — DevTools QA helper for the choice coverage contract.
     Usage from browser console:
       qaChoiceCoverage()                               // age 6, surprise, 50 samples
       qaChoiceCoverage({ age: 5, setting: 'diner' })
       qaChoiceCoverage({ samples: 200 })
     Returns a summary object listing missing-category counts. */
  window.qaChoiceCoverage = function qaChoiceCoverage(opts) {
    opts = opts || {};
    const age = opts.age != null ? opts.age : 6;
    const samples = opts.samples != null ? opts.samples : 50;
    const picks = {
      pet: { w: opts.pet || 'parrot' },
      food: { w: opts.food || 'donuts' },
      place: { w: opts.place || 'jungle' },
      creature: opts.creature !== null ? { w: opts.creature || 'dinosaur' } : undefined,
      color: opts.color !== null ? { w: opts.color || 'electric blue' } : undefined,
      move: opts.move !== null ? { w: opts.move || 'tiptoed' } : undefined,
      mood: opts.mood !== null ? { w: opts.mood || 'silly' } : undefined,
      freeword: opts.freeword !== null ? { w: opts.freeword || 'BAZINKLE', subtype: 'shout' } : undefined,
      setting: { id: opts.setting || 'surprise' },
    };
    const results = {
      samples,
      missing: { companion: 0, food: 0, place: 0, visitor: 0, color: 0, mood: 0, move: 0, freeword: 0 },
      empty: 0,
      grammarErr: 0,
      examples: [],
    };
    for (let i = 0; i < samples; i++) {
      const story = generateStoryV2(opts.name || 'Cole', picks, age);
      if (!story || !story.paragraphs.length) { results.empty++; continue; }
      const body = story.paragraphs.join(' ').replace(/\[(?:name|c|y):([^\]]+)\]/g, '$1');
      const has = (s) => s && new RegExp('\\b' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(body);
      if (!has(picks.pet.w))   results.missing.companion++;
      if (!has(picks.food.w))  results.missing.food++;
      const setting = window.getSetting && window.getSetting(picks.setting.id);
      const placeText = setting && setting.place ? setting.place.text : picks.place.w;
      if (!has(placeText))     results.missing.place++;
      if (picks.creature && !has(picks.creature.w)) results.missing.visitor++;
      if (picks.color && !has(picks.color.w))       results.missing.color++;
      if (picks.mood && !has(picks.mood.w))         results.missing.mood++;
      if (picks.move && !has(picks.move.w))         results.missing.move++;
      if (picks.freeword && !has(picks.freeword.w)) results.missing.freeword++;
      if (/\{[a-zA-Z][\w.]*\}/.test(body))           results.grammarErr++;
      if (results.examples.length < 2) results.examples.push({ title: story.title, paragraphs: story.paragraphs });
    }
    console.log('[qaChoiceCoverage] age=' + age + ' setting=' + (opts.setting || 'surprise') + ' samples=' + samples);
    console.table(results.missing);
    if (results.empty)       console.warn('Empty stories:', results.empty);
    if (results.grammarErr)  console.warn('Stories with unresolved {tokens}:', results.grammarErr);
    return results;
  };
}
