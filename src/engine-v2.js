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

const ENGINE_V2_VERSION = 'v2.3.0';

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
    { id:'banshee', text:'banshee', emoji:'🌬️', article:'a',
      traits:['shrieky','dramatic','well-meaning'],
      actions:['wailed once for effect','floated upside-down','apologized for the noise'],
      sounds:['WAAAA','soft sigh','tiny whistle'] },
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
    { id:'binoculars',          text:'binoculars',          emoji:'🔭', article:'some' },
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

/* Helper: look up a setting by id, with safe fallback to "surprise". */
function getSetting(id) {
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
  goal_spine: {
    id: 'goal_spine',
    beats: ['goal_stated', 'goal_obstacle', 'kid_decides', 'goal_resolved', 'bedtime_landing'],
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
  { id:'to_intro2', beatType:'tot_intro', tiers:['tot'], requiredSlots:['kid','companion','sound'],
    lines: [
      '{kid.name} heard a {sound.text}. It was {companion.articleText}! {companion.cap}! Hi {companion.text}!',
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

  /* ============================================================
     Segment D — Little (ages 4-5) beat library
     Voice: tiny jobs, confused animals, weather nonsense, gentle.
     Slightly more structure than tot, but no irony.
     ============================================================ */

  { id:'li_intro1', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','place'],
    lines: [
      'One sunny morning, {kid.name} headed to the {place.text}. It was a perfect day for an adventure.',
    ] },
  { id:'li_intro2', beatType:'little_intro', tiers:['little'], requiredSlots:['kid','object'],
    lines: [
      '{kid.name} found {object.articleText} on the doorstep. What a surprise! What was it for?',
    ] },

  { id:'li_comp1', beatType:'little_companion', tiers:['little'], requiredSlots:['kid','companion'],
    lines: [
      'A friendly {companion.text} came to say hello. The {companion.text} had a tiny hat on. The hat was a little too big.',
    ] },
  { id:'li_comp2', beatType:'little_companion', tiers:['little'], requiredSlots:['kid','companion','sound'],
    lines: [
      '"{sound.text}!" said the {companion.text}. {kid.name} giggled. "{sound.text}!" said the {companion.text} again. {kid.name} giggled even more.',
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

  { id:'li_end1', beatType:'little_cozy_end', tiers:['little'], requiredSlots:['kid','companion'],
    lines: [
      'By the end of the day, {kid.name} and the {companion.text} were tired and happy. They hugged. Then they went to bed. Goodnight.',
    ] },
  { id:'li_end2', beatType:'little_cozy_end', tiers:['little'], requiredSlots:['kid','companion','food'],
    lines: [
      'They ate one last bite of {food.text}. The {companion.text} yawned. {kid.name} yawned too. Time to sleep.',
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
      '{kid.name} decided this was a {food.text} problem. {kid.name} reached into a pocket for {food.articleText} they had been saving.',
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
  { id:'gs_kid_1', beatType:'goal_stated', tiers:['kid','big'], requiredSlots:['kid','goal','companion'],
    lines: [
      '{kid.name} woke up with a plan. Today, {kid.name} was going to {goal.text}. The {companion.text} was in. The {companion.text} was always in.',
      'Today was the day. {kid.name} had decided yesterday and slept on it and decided again this morning: {kid.name} was going to {goal.text}. The {companion.text} agreed before {kid.name} even finished saying it.',
    ] },
  { id:'gs_kid_2', beatType:'goal_stated', tiers:['kid','big'], requiredSlots:['kid','goal','place'],
    lines: [
      'It started at the {place.text}. {kid.name} looked around and made up their mind: today they would {goal.text}. No matter what.',
    ] },
  { id:'gs_tween_1', beatType:'goal_stated', tiers:['tween'], requiredSlots:['kid','goal'],
    lines: [
      '{kid.name} woke up with a goal. Specifically: {goal.text}. {kid.name} did not love announcing goals out loud, but this one felt different.',
      'There was one objective today, and {kid.name} had committed to it: {goal.text}. {kid.cap} would deal with the consequences after.',
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
      '{kid.name} thought for a second, then produced {object.articleText} they had brought just in case. "Will this work?" asked {kid.name}. The {companion.text} considered it, then nodded once.',
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
];

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
  const setting = getSetting(picks.setting?.id || picks.setting?.w || 'surprise');

  // Build the slots map for this story.
  // Map user picks (v1 format: {w: 'dragon'}) to rich v2 word objects when possible.
  function mapPickToWord(pickValue, lib) {
    if (!pickValue) return rawPick(lib);
    const hit = lib.find(w => w.text === pickValue || w.id === pickValue);
    return hit || rawPick(lib);
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
    color, move, mood, freeword2,
    goal,    // v2.3.0 — load-bearing goal slot
  };

  // v2.3.0 — Route kid/big/tween to the GOAL SPINE recipe (causality engine).
  // tot and little keep their existing simpler recipes (tot_loop, gentle_quest)
  // because they need less narrative complexity. The spine is what gives the
  // older tiers a real arc with chosen-words as causes, not decoration.
  let seed, recipe;
  if (tier === 'kid' || tier === 'big' || tier === 'tween') {
    recipe = V2_RECIPES.goal_spine;
    seed = { id: 'goal_spine_seed', tiers: [tier], recipe: 'goal_spine', requiredSlots: ['companion','visitor','food','object'] };
  } else {
    // tot + little still use their tier-specific seeds + recipes.
    const compatibleSeeds = V2_SEEDS.filter(s => s.tiers.includes(tier));
    if (compatibleSeeds.length === 0) return null;
    seed = rawPick(compatibleSeeds);
    recipe = V2_RECIPES[seed.recipe];
  }
  if (!recipe) return null;

  // For each beat in the recipe, find an eligible beat card.
  // Eligibility: tier matches AND all required slots are present in `slots`.
  function eligibleFor(beatType) {
    return V2_BEATS.filter(b => {
      if (b.beatType !== beatType) return false;
      if (!b.tiers.includes(tier)) return false;
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
    const card = rawPick(anchors);
    const line = rawPick(card.lines);
    paragraphs.push(ensureSentenceStart(V2Grammar.render(line, slots)));
    // Skip the first recipe beat — anchor replaces it
    beatTypeSequence.shift();
  }
  for (const beatType of beatTypeSequence) {
    const candidates = eligibleFor(beatType);
    if (candidates.length === 0) return null; // fallback to v1 if any beat type unfillable
    const card = rawPick(candidates);
    const line = rawPick(card.lines);
    paragraphs.push(ensureSentenceStart(V2Grammar.render(line, slots)));
  }

  // Title — bind kid name + slot picks for a recognizable shape. Each recipe gets a slight
  // title bias for thematic fit (mystery → "Case of...", trial → "Trial of...", etc.) but
  // the universal patterns also fire for any recipe.
  const tc = V2Grammar.titleCase;
  const kidCap = V2Grammar.capitalize(slots.kid.name);
  const universalTitlePatterns = [
    `${kidCap} and the ${tc(companion.text)}`,
    `The Day ${kidCap} Met ${tc(visitor.text)}`,
    `${kidCap} and the ${tc(object.text)} Problem`,
    `${kidCap}'s ${tc(food.text)} Adventure`,
    `${kidCap} and the ${tc(place.text)}`,
    `The ${tc(companion.text)} and the ${tc(food.text)}`,
    `How ${kidCap} Met ${tc(visitor.text)}`,
    `${kidCap} vs the ${tc(visitor.text)}`,
  ];
  const recipeTitlePatterns = {
    mystery:     [`The Curious Case of the ${tc(object.text)}`, `The Mystery of the ${tc(place.text)}`, `${kidCap} and the Missing ${tc(object.text)}`],
    trial:       [`The Trial of ${kidCap}`, `${kidCap} on Trial`, `The People vs ${kidCap}`],
    performance: [`${kidCap}'s Big Show`, `${kidCap} Takes the Stage`, `The ${tc(companion.text)} Performance`],
    bureaucracy: [`${kidCap} and the Impossible Form`, `${kidCap}'s Official Disaster`, `The ${tc(job.text)} Crisis`],
    quest:       [`${kidCap}'s Adventure to the ${tc(place.text)}`, `${kidCap} Goes to the ${tc(place.text)}`],
    /* Segment D — simpler titles for tot + little */
    tot_loop:    [`${kidCap} and the ${tc(companion.text)}`, `${kidCap} Says Hi!`, `Hi, ${tc(companion.text)}!`],
    gentle_quest:[`${kidCap} and the ${tc(companion.text)}`, `${kidCap}'s ${tc(place.text)} Day`, `The ${tc(companion.text)} with the Tiny Hat`],
    /* v2.3.0 — goal-spine titles reference the actual goal so the title sells the story */
    goal_spine: [
      `How ${kidCap} ${tc(goal.past.replace(/^[a-z]/, c => c.toUpperCase()))}`,
      `${kidCap} vs the ${tc(visitor.text)}`,
      `The Day ${kidCap} Tried to ${tc(goal.text)}`,
      `${kidCap}'s ${tc(food.text)} Plan`,
      `${kidCap} and the ${tc(companion.text)} Try to ${tc(goal.text)}`,
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
          : [' Eventually, {kid.name} got around to the {food.text} they had been saving for exactly this moment.', ' Somebody finally produced {food.articleText}. The room shifted.'],
    place: [' The {place.text} hummed around them like it was in on the joke.', ' The {place.text} watched it all happen and said nothing.'],
    visitor: tier === 'tot'
      ? [' The {visitor.text} waved hi too.']
      : [' Even the {visitor.text} came by to see what the fuss was about.', ' The {visitor.text} took notes. Probably.'],
    color: tier === 'tot'
      ? [' Everything was a little {color.text}.']
      : [' The whole scene had a {color.text} tint by then.', ' Somehow even the air looked {color.text}.'],
    mood: tier === 'tot'
      ? [' {kid.cap} felt {mood.text}.']
      : [' {kid.cap} was {mood.text} about the whole thing, in a quiet way.'],
    move: tier === 'tot'
      ? [' Then they all {move.text}.']
      : [' They {move.text} a little, just because it felt right.', ' At some point everybody {move.text}, briefly.'],
    freeword: [' And once, very quietly, somebody said "{sound.text}".'],
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
