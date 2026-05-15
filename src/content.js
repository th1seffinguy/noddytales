/* ================================================================
   NoddyTales — Content data
   Edit this file to change words, prompts, or round order.
   Story template logic lives in index.html (buildStory).
   ================================================================ */

const APP_VERSION = 'v1.13.0';

/* Auto-injected vocabulary for the kid tier — chosen randomly inside buildStory when the user
   didn't pick body/sound from a round. PG pools are used by default. _HOT pools activate when
   pottyMode is on. Stays bounded: PG = school-safe, HOT = Captain-Underpants tier (no real swears). */
const BODY_PG  = ['toot', 'burp', 'wedgie', 'stinky sock', 'smelly shoe', 'hiccup', 'sneeze', 'snort', 'drool', 'snore', 'yawn', 'sniffle'];
const BODY_HOT = ['fart', 'poop', 'butt', 'pee', 'booger', 'snot rocket', 'underpants', 'stinky armpit', 'swamp foot', 'nostril', 'toilet', 'wedgie'];
const SOUND_PG  = ['SPLAT', 'BOING', 'PFFT', 'WUMP', 'FWOOSH', 'KERPLUNK', 'BLORP', 'SQUISH', 'HONK', 'BWAH', 'BLARP', 'WAFLOOP', 'POOF', 'ZINK', 'PLOP', 'YIKES', 'BANG', 'WHEE'];
const SOUND_HOT = ['PFFFFART', 'BTHHHPP', 'PLOPP', 'FAAAARP', 'TOOOT', 'PARP', 'BLEEEEH', 'SCHPLAT', 'GLOOP', 'KAFOOM', 'BWAHAHA', 'SQUOMP'];

/* Always-on absurd objects for kid-tier stories — never gated by pottyMode, never user-picked.
   One gets injected as a parenthetical aside per kid story so every story has a baseline of
   weird without needing the toggle. Phrases are noun-phrases that fit "Also there: X." */
const SILLY_THINGS = [
  'a sock with strong opinions',
  'a slightly haunted spoon',
  'a confused calculator',
  'a polite-looking rock',
  'a very tall jellybean',
  'a deeply offended pillow',
  'a suspiciously cheerful toothbrush',
  'a tiny philosophical mushroom',
  'a mysteriously friendly hat',
  'a slightly damp sticker',
  'a yo-yo with attitude',
  'a sock puppet that knows things',
];

/* Mad Libs-style auto-injected pools (kid tier) — Codex peer-review recommended additions.
   Story-mechanic-friendly: objects produce plot, jobs create roles, numbers are instant comedy,
   liquids are classic Mad Libs, adverbs preserve grammar while adding absurd motion. */
const OBJECTS = [
  'clipboard', 'suspicious envelope', 'tiny key', 'noisy spoon',
  'haunted lunchbox', 'emergency kazoo', 'apology balloon', 'dramatic cape',
  'pocket-sized door', 'glittery helmet', 'sleepy megaphone', 'map covered in crumbs',
];
const ADVERBS = [
  'suspiciously', 'sideways', 'with great confidence', 'for unclear reasons',
  'professionally', 'accidentally on purpose', 'extremely slowly', 'in a hurry',
  'backwards', 'politely but firmly', 'with concerning enthusiasm', 'somehow',
];
const NUMBERS = [
  'seventeen', 'twenty-three', 'eleventy-eight', 'one and a half',
  'exactly forty-two', 'nine plus three', 'too many', 'a small but specific number of',
  'three (allegedly)', 'eight thousand', 'a polite handful of', 'six (rude)',
];
const LIQUIDS = [
  'pickle juice', 'moon milk', 'glitter lemonade', 'warm soup',
  'rainbow water', 'questionable broth', 'extremely loud orange juice', 'emergency apple juice',
  'haunted iced tea', 'formally polite hot chocolate', 'thunder soda', 'a single tear',
];
const JOBS = [
  'official puddle inspector', 'assistant cloud dentist', 'sandwich lawyer',
  'emergency hat consultant', 'junior moon accountant', 'certified dragon whisperer',
  'substitute wizard', 'snack detective', 'hallway mayor',
  'professional button counter', 'royal nap supervisor', 'chief sock investigator',
];

/* Pickable round options for kid tier — surfaced ONLY when pottyMode is on so the toggle has
   an immediate, visible effect on the selection flow. Each option pairs a word with an emoji
   for the binary picker UI. */
const BODY_HOT_OPTS = [
  {w:'fart',          e:'💨'}, {w:'poop',          e:'💩'}, {w:'butt',         e:'🍑'},
  {w:'pee',           e:'💧'}, {w:'booger',        e:'👃'}, {w:'underpants',   e:'🩲'},
  {w:'toilet',        e:'🚽'}, {w:'snot rocket',   e:'💦'}, {w:'swamp foot',   e:'🦶'},
  {w:'stinky armpit', e:'🧅'}, {w:'wedgie',        e:'😱'}, {w:'nostril hair', e:'👃'},
];
const SOUND_HOT_OPTS = [
  {w:'PFFFFART', e:'💨'}, {w:'BTHHHPP',  e:'🌬️'}, {w:'FAAAARP',  e:'📯'},
  {w:'KAFOOM',   e:'💥'}, {w:'BWAHAHA',  e:'😂'}, {w:'PARP',     e:'🎺'},
  {w:'BLEEEEH',  e:'😝'}, {w:'SQUOMP',   e:'💦'}, {w:'PLOPP',    e:'💧'},
  {w:'TOOOT',    e:'🎺'}, {w:'SCHPLAT',  e:'💥'}, {w:'GLOOP',    e:'🟢'},
];

/* Binary rounds by tier — each round has 12 options; buildRounds() picks 2 randomly per session */
const WORD_BANK = {
  tot: [
    { cat: 'pet',   label: 'Pick a friend',          options: [{w:'dog',     e:'🐕'}, {w:'cat',    e:'🐈'}, {w:'fish',   e:'🐟'}, {w:'bird',   e:'🐦'}, {w:'frog',   e:'🐸'}, {w:'duck',   e:'🦆'}, {w:'bunny',  e:'🐰'}, {w:'bear',   e:'🐻'}, {w:'lamb',   e:'🐑'}, {w:'mouse',  e:'🐭'}, {w:'pig',    e:'🐷'}, {w:'cow',    e:'🐄'}] },
    { cat: 'color', label: 'Pick a color',            options: [{w:'red',     e:'🔴'}, {w:'blue',   e:'🔵'}, {w:'pink',   e:'🌸'}, {w:'green',  e:'🌿'}, {w:'gold',   e:'🥇'}, {w:'white',  e:'⬜'}, {w:'yellow', e:'🌻'}, {w:'orange', e:'🍊'}, {w:'purple', e:'💜'}, {w:'brown',  e:'🟤'}, {w:'rainbow',e:'🌈'}, {w:'silver', e:'🥈'}] },
    { cat: 'food',  label: 'Pick a snack',            options: [{w:'cake',    e:'🍰'}, {w:'jam',    e:'🍓'}, {w:'milk',   e:'🥛'}, {w:'bread',  e:'🍞'}, {w:'grapes', e:'🍇'}, {w:'corn',   e:'🌽'}, {w:'apple',  e:'🍎'}, {w:'banana', e:'🍌'}, {w:'cheese', e:'🧀'}, {w:'carrot', e:'🥕'}, {w:'honey',  e:'🍯'}, {w:'cookie', e:'🍪'}] },
    { cat: 'place', label: 'Pick a place',            options: [{w:'park',    e:'🌳'}, {w:'pond',   e:'🦆'}, {w:'farm',   e:'🐄'}, {w:'beach',  e:'🏖️'}, {w:'yard',   e:'🌻'}, {w:'hill',   e:'⛰️'}, {w:'woods',  e:'🌲'}, {w:'house',  e:'🏠'}, {w:'shop',   e:'🏪'}, {w:'bridge', e:'🌉'}, {w:'field',  e:'🌾'}, {w:'sandbox',e:'🪣'}] },
    { cat: 'sky',   label: 'Pick something up high',  options: [{w:'sun',     e:'☀️'}, {w:'moon',   e:'🌙'}, {w:'star',   e:'⭐'}, {w:'cloud',  e:'☁️'}, {w:'kite',   e:'🪁'}, {w:'plane',  e:'✈️'}, {w:'rainbow',e:'🌈'}, {w:'balloon',e:'🎈'}, {w:'comet',  e:'☄️'}, {w:'snowflake',e:'❄️'}, {w:'butterfly',e:'🦋'}, {w:'firework',e:'🎆'}] },
    { cat: 'move',  label: 'Pick a wiggle',           options: [{w:'hopped',  e:'🐇'}, {w:'spun',   e:'🌀'}, {w:'ran',    e:'💨'}, {w:'marched',e:'🥁'}, {w:'jumped', e:'🦘'}, {w:'clapped',e:'👏'}, {w:'crawled',e:'🐛'}, {w:'splashed',e:'💦'},{w:'rolled', e:'⚽'}, {w:'swayed', e:'🌊'}, {w:'stomped',e:'🦶'}, {w:'wiggled',e:'🐍'}] },
  ],
  little: [
    { cat: 'pet',     label: 'Choose a buddy',     options: [{w:'puppy',    e:'🐶'}, {w:'bunny',     e:'🐰'}, {w:'kitten',  e:'🐱'}, {w:'turtle',  e:'🐢'}, {w:'parrot',    e:'🦜'}, {w:'piglet',  e:'🐷'}, {w:'lamb',     e:'🐑'}, {w:'hamster',   e:'🐹'}, {w:'duckling', e:'🐥'}, {w:'hedgehog', e:'🦔'}, {w:'cub',      e:'🐻'}, {w:'foal',     e:'🐴'}] },
    { cat: 'color',   label: 'Choose a color',     options: [{w:'pink',     e:'🌸'}, {w:'green',     e:'🌿'}, {w:'yellow',  e:'🌻'}, {w:'orange',  e:'🍊'}, {w:'purple',    e:'💜'}, {w:'silver',  e:'🥈'}, {w:'rainbow',  e:'🌈'}, {w:'teal',      e:'🌊'}, {w:'lavender', e:'💐'}, {w:'crimson',  e:'🔴'}, {w:'golden',   e:'🥇'}, {w:'striped',  e:'🦓'}] },
    { cat: 'food',    label: 'Choose a treat',     options: [{w:'pizza',    e:'🍕'}, {w:'cookies',   e:'🍪'}, {w:'muffins', e:'🧁'}, {w:'grapes',  e:'🍇'}, {w:'noodles',   e:'🍜'}, {w:'popcorn', e:'🍿'}, {w:'sandwich', e:'🥪'}, {w:'waffles',   e:'🧇'}, {w:'strawberries',e:'🍓'},{w:'dumplings',e:'🥟'}, {w:'soup',     e:'🍲'}, {w:'candy',       e:'🍬'}] },
    { cat: 'place',   label: 'Choose a spot',      options: [{w:'beach',    e:'🏖️'}, {w:'forest',    e:'🌲'}, {w:'garden',  e:'🌷'}, {w:'meadow',  e:'🌾'}, {w:'village',   e:'🏘️'}, {w:'castle',  e:'🏰'}, {w:'cave',     e:'🕳️'}, {w:'island',    e:'🏝️'}, {w:'mountain', e:'🏔️'}, {w:'river',    e:'🏞️'}, {w:'treehouse',e:'🌳'}, {w:'volcano',  e:'🌋'}] },
    { cat: 'creature',label: 'Choose a creature',  options: [{w:'frog',     e:'🐸'}, {w:'fish',      e:'🐠'}, {w:'beetle',  e:'🐞'}, {w:'turtle',  e:'🐢'}, {w:'rabbit',    e:'🐰'}, {w:'snail',   e:'🐌'}, {w:'owl',      e:'🦉'}, {w:'fox',       e:'🦊'}, {w:'deer',     e:'🦌'}, {w:'penguin',  e:'🐧'}, {w:'crab',     e:'🦀'}, {w:'bee',         e:'🐝'}] },
    { cat: 'move',    label: 'Choose a move',      options: [{w:'jumped',   e:'🦘'}, {w:'danced',    e:'💃'}, {w:'wiggled', e:'🐛'}, {w:'galloped',e:'🏇'}, {w:'twirled',   e:'🌀'}, {w:'bounced', e:'🏀'}, {w:'splashed', e:'💦'}, {w:'tiptoed',   e:'👣'}, {w:'zoomed',   e:'💨'}, {w:'hopped',   e:'🐇'}, {w:'skidded',  e:'🛷'}, {w:'flopped',  e:'🐟'}] },
    { cat: 'weather', label: 'Choose the weather', options: [{w:'sunny',    e:'☀️'}, {w:'snowy',     e:'❄️'}, {w:'windy',   e:'🌬️'}, {w:'rainy',   e:'🌧️'}, {w:'cloudy',    e:'☁️'}, {w:'foggy',   e:'🌫️'}, {w:'stormy',   e:'⛈️'}, {w:'frosty',    e:'🌨️'}, {w:'breezy',   e:'🍃'}, {w:'misty',    e:'🌁'}, {w:'thundery', e:'⚡'}, {w:'glittery', e:'✨'}] },
  ],
  kid: [
    { cat: 'pet',     label: 'Pick your sidekick',   options: [{w:'dragon',    e:'🐲'}, {w:'panda',     e:'🐼'}, {w:'parrot',    e:'🦜'}, {w:'tiger',     e:'🐯'}, {w:'penguin',   e:'🐧'}, {w:'falcon',    e:'🦅'}, {w:'wolf',      e:'🐺'}, {w:'otter',     e:'🦦'}, {w:'lynx',      e:'🐱'}, {w:'fennec fox',e:'🦊'}, {w:'unicorn',   e:'🦄'}, {w:'capybara',  e:'🦫'}, {w:'octopus',   e:'🐙'}, {w:'hedgehog',  e:'🦔'}, {w:'axolotl',   e:'🐠'}, {w:'llama',     e:'🦙'}, {w:'sloth',     e:'🦥'}, {w:'koala',     e:'🐨'}] },
    { cat: 'color',   label: 'Pick a color',          options: [{w:'purple',    e:'🟣'}, {w:'rainbow',   e:'🌈'}, {w:'golden',    e:'🥇'}, {w:'scarlet',   e:'🔴'}, {w:'silver',    e:'🥈'}, {w:'teal',      e:'🦚'}, {w:'neon',      e:'💚'}, {w:'pitch black',e:'🖤'}, {w:'electric blue',e:'⚡'},{w:'moss green', e:'🌿'}, {w:'burnt orange',e:'🍊'},{w:'rose gold',  e:'🌸'}, {w:'tomato red', e:'🍅'}, {w:'lemon yellow',e:'🍋'},{w:'watermelon pink',e:'🍉'},{w:'mint green',e:'🍃'},{w:'sunset orange',e:'🌅'},{w:'midnight blue',e:'🌌'}] },
    { cat: 'food',    label: 'Pick a snack',           options: [{w:'tacos',     e:'🌮'}, {w:'donuts',    e:'🍩'}, {w:'nachos',    e:'🧀'}, {w:'sushi',     e:'🍣'}, {w:'waffles',   e:'🧇'}, {w:'pizza',     e:'🍕'}, {w:'ramen',     e:'🍜'}, {w:'burritos',  e:'🌯'}, {w:'dumplings', e:'🥟'}, {w:'ice cream', e:'🍦'}, {w:'pretzels',  e:'🥨'}, {w:'grilled cheese',e:'🥪'}, {w:'spaghetti', e:'🍝'}, {w:'popcorn',   e:'🍿'}, {w:'hot dogs',  e:'🌭'}, {w:'pancakes',  e:'🥞'}, {w:'cupcakes',  e:'🧁'}, {w:'french fries',e:'🍟'}] },
    { cat: 'place',   label: 'Pick a location',        options: [{w:'jungle',    e:'🌴'}, {w:'castle',    e:'🏰'}, {w:'cavern',    e:'🕳️'}, {w:'forest',    e:'🌲'}, {w:'meadow',    e:'🌾'}, {w:'canyon',    e:'🏞️'}, {w:'volcano',   e:'🌋'}, {w:'labyrinth', e:'🌀'}, {w:'shipwreck', e:'⚓'}, {w:'glacier',   e:'🧊'}, {w:'rooftop',   e:'🏙️'}, {w:'desert',    e:'🏜️'}, {w:'treehouse', e:'🌳'}, {w:'lighthouse',e:'🗼'}, {w:'carnival',  e:'🎡'}, {w:'aquarium',  e:'🐠'}, {w:'planetarium',e:'🪐'},{w:'bakery',    e:'🥐'}] },
    { cat: 'creature',label: 'Pick a creature',        options: [{w:'robot',     e:'🤖'}, {w:'mermaid',   e:'🧜'}, {w:'wizard',    e:'🧙'}, {w:'pirate',    e:'🏴‍☠️'}, {w:'ninja',     e:'🥷'}, {w:'goblin',    e:'👺'}, {w:'knight',    e:'⚔️'}, {w:'alien',     e:'👽'}, {w:'witch',     e:'🧙‍♀️'}, {w:'giant',    e:'🗿'}, {w:'ghost',     e:'👻'}, {w:'troll',     e:'🧌'}, {w:'vampire',   e:'🧛'}, {w:'fairy',     e:'🧚'}, {w:'dinosaur',  e:'🦖'}, {w:'phoenix',   e:'🔥'}, {w:'centaur',   e:'🐎'}, {w:'banshee',   e:'🌬️'}] },
    { cat: 'move',    label: 'Pick a move',            options: [{w:'zoomed',    e:'⚡'}, {w:'tiptoed',   e:'👣'}, {w:'bounced',   e:'🏀'}, {w:'spun',      e:'🌀'}, {w:'leapt',     e:'🦘'}, {w:'galloped',  e:'🏇'}, {w:'tumbled',   e:'🤸'}, {w:'glided',    e:'🪂'}, {w:'charged',   e:'🐂'}, {w:'crept',     e:'🐛'}, {w:'soared',    e:'🦅'}, {w:'skated',    e:'⛸️'}, {w:'shimmied',  e:'🎵'}, {w:'wobbled',   e:'🌊'}, {w:'marched',   e:'🥁'}, {w:'stomped',   e:'🦶'}, {w:'danced',    e:'💃'}, {w:'sprinted',  e:'🏃'}] },
    { cat: 'mood',    label: 'Pick a feeling',         options: [{w:'silly',     e:'🤪'}, {w:'sneaky',    e:'🕵️'}, {w:'brave',     e:'🦁'}, {w:'goofy',     e:'🎪'}, {w:'spooky',    e:'👻'}, {w:'grumpy',    e:'😤'}, {w:'wobbly',    e:'🫨'}, {w:'dramatic',  e:'🎭'}, {w:'mysterious',e:'🌙'}, {w:'determined',e:'💪'}, {w:'clumsy',    e:'🤦'}, {w:'legendary', e:'🏆'}, {w:'cozy',      e:'🥰'}, {w:'suspiciously polite',e:'🎩'},{w:'professionally confused',e:'🤔'},{w:'ridiculously cheerful',e:'🌟'},{w:'sleepy',    e:'😴'}, {w:'jubilant',  e:'🎉'}] },
  ],
  big: [
    { cat: 'pet',     label: 'Pick your companion',   options: [{w:'mischievous fox',         e:'🦊'}, {w:'glittering octopus',     e:'🐙'}, {w:'ancient tortoise',      e:'🐢'}, {w:'bewildered penguin',    e:'🐧'}, {w:'melodramatic cat',      e:'🐱'}, {w:'philosophical owl',     e:'🦉'}, {w:'imperious corgi',       e:'👑'}, {w:'overconfident raccoon', e:'🦝'}, {w:'anxious hedgehog',      e:'🦔'}, {w:'exasperated flamingo',  e:'🦩'}, {w:'suspicious seagull',    e:'🐦'}, {w:'theatrical moth',       e:'🦋'}] },
    { cat: 'color',   label: 'Pick a wild color',     options: [{w:'shimmering gold',         e:'✨'}, {w:'electric violet',        e:'⚡'}, {w:'deep crimson',          e:'🔴'}, {w:'luminous teal',         e:'🌊'}, {w:'faded amber',           e:'🍂'}, {w:'impossible green',      e:'🌿'}, {w:'impossible orange',     e:'🍊'}, {w:'eerie periwinkle',      e:'🟣'}, {w:'violently pleasant blue',e:'🔵'},{w:'suspiciously beige',    e:'🟤'}, {w:'strangely familiar gray',e:'🩶'},{w:'obviously red',         e:'🔴'}] },
    { cat: 'food',    label: 'Pick a peculiar snack', options: [{w:'enchanted pickles',       e:'🥒'}, {w:'thunder pancakes',       e:'🥞'}, {w:'suspicious sandwiches', e:'🥪'}, {w:'bewildering cookies',   e:'🍪'}, {w:'haunted scones',        e:'🫖'}, {w:'legendary soup',        e:'🍲'}, {w:'suspicious casserole',  e:'🍱'}, {w:'haunted macaroni',      e:'🍝'}, {w:'ancient granola bar',   e:'🥣'}, {w:'overconfident pudding', e:'🍮'}, {w:'mysterious leftovers',  e:'🥡'}, {w:'extremely bold lasagna',e:'🍝'}] },
    { cat: 'place',   label: 'Pick a setting',        options: [{w:'mossy labyrinth',         e:'🌿'}, {w:'cloud observatory',      e:'☁️'}, {w:'sunken ballroom',       e:'🏊'}, {w:'forgotten attic',       e:'🕯️'}, {w:'luminous swamp',        e:'🌙'}, {w:'ancient library',       e:'📚'}, {w:'collapsing lighthouse', e:'🏚️'}, {w:'underground ballroom',  e:'🎭'}, {w:'partially flooded tower',e:'🌊'},{w:'extremely long corridor',e:'🚶'},{w:'theoretical basement',  e:'🏠'}, {w:'spectacularly average hallway',e:'🚪'}] },
    { cat: 'creature',label: 'Pick a creature',       options: [{w:'grumbling gargoyle',      e:'🗿'}, {w:'sparkly squid',          e:'🦑'}, {w:'bewildered sphinx',     e:'🏛️'}, {w:'philosophical crab',    e:'🦀'}, {w:'melodramatic ghost',    e:'👻'}, {w:'indignant mushroom',    e:'🍄'}, {w:'suspicious accountant', e:'💼'}, {w:'deeply committed scarecrow',e:'🌾'},{w:'partially trained wizard',e:'🧙'},{w:'overqualified fish',    e:'🐟'}, {w:'concerned librarian',   e:'📚'}, {w:'accidental prophet',    e:'🔮'}] },
    { cat: 'move',    label: 'Pick a verb',           options: [{w:'cartwheeled',             e:'🤸'}, {w:'tiptoed cautiously',     e:'👣'}, {w:'stumbled dramatically', e:'💫'}, {w:'waltzed accidentally',  e:'💃'}, {w:'skipped solemnly',      e:'🎵'}, {w:'meandered thoughtfully',e:'🌀'}, {w:'tripped magnificently', e:'💃'}, {w:'spun ceremoniously',    e:'🌀'}, {w:'reversed unexpectedly', e:'↩️'}, {w:'shuffled importantly',  e:'🚶'}, {w:'scuttled with purpose', e:'🦀'}, {w:'fell upward somehow',   e:'⬆️'}] },
    { cat: 'mood',    label: 'Pick a vibe',           options: [{w:'absolutely bonkers',      e:'🤪'}, {w:'mysteriously calm',      e:'🌙'}, {w:'formally ridiculous',   e:'🎩'}, {w:'suspiciously cheerful', e:'😊'}, {w:'gravely unimpressed',   e:'😒'}, {w:'accidentally heroic',   e:'🦸'}, {w:'deeply unimpressed',    e:'😑'}, {w:'heroically mediocre',   e:'🏅'}, {w:'surprisingly enthusiastic',e:'🎉'},{w:'professionally confused',e:'🤔'},{w:'thoughtfully menacing', e:'😏'}, {w:'gloriously incorrect',  e:'💯'}] },
  ],
  tween: [
    { cat: 'pet',     label: 'Pick your sidekick',    options: [{w:'capybara',     e:'🦫'}, {w:'crow',           e:'🐦‍⬛'}, {w:'red panda',    e:'🦊'}, {w:'hamster',      e:'🐹'}, {w:'axolotl',      e:'🫧'}, {w:'chameleon',    e:'🦎'}, {w:'raccoon',      e:'🦝'}, {w:'mantis shrimp',e:'🦐'}, {w:'rat',          e:'🐀'}, {w:'pigeon',       e:'🐦'}, {w:'quokka',       e:'🐨'}, {w:'tardigrade',   e:'🦠'}] },
    { cat: 'color',   label: 'Pick your aesthetic',   options: [{w:'neon green',   e:'💚'}, {w:'void black',     e:'🖤'}, {w:'burnt orange', e:'🧡'}, {w:'dusty rose',   e:'🌸'}, {w:'electric yellow',e:'⚡'}, {w:'midnight blue',e:'🌌'}, {w:'moss green',   e:'🌿'}, {w:'acid yellow',  e:'💛'}, {w:'deep purple',  e:'💜'}, {w:'washed out gray',e:'🩶'},{w:'rust orange',  e:'🍂'}, {w:'iridescent',   e:'🌈'}] },
    { cat: 'food',    label: 'Pick a snack',          options: [{w:'instant noodles',e:'🍜'}, {w:'cold pizza',   e:'🍕'}, {w:'sour candy',   e:'🍬'}, {w:'boba tea',     e:'🧋'}, {w:'hot sauce',    e:'🌶️'}, {w:'energy drink', e:'⚡'}, {w:'gas station sushi',e:'🍣'},{w:'cereal at midnight',e:'🥣'},{w:'mystery chips',e:'🍟'}, {w:'sad granola bar',e:'🥣'}, {w:'third coffee', e:'☕'}, {w:'everything bagel',e:'🥯'}] },
    { cat: 'place',   label: 'Pick a location',       options: [{w:'abandoned mall',e:'🏚️'}, {w:'rooftop',      e:'🏙️'}, {w:'skatepark',    e:'🛹'}, {w:'arcade',       e:'🕹️'}, {w:'bus stop',     e:'🚌'}, {w:'parking garage',e:'🚗'}, {w:'library at closing time',e:'📚'},{w:'empty school hallway',e:'🏫'},{w:'convenience store',e:'🏪'},{w:'slightly wrong neighborhood',e:'🗺️'},{w:'the back of the bus',e:'🚌'},{w:'someone else\'s backyard',e:'🌿'}] },
    { cat: 'creature',label: 'Pick a creature',       options: [{w:'cryptid',      e:'👁️'}, {w:'gremlin',      e:'👺'}, {w:'discount vampire',e:'🧛'}, {w:'feral librarian',e:'📚'}, {w:'shadow entity',e:'🌑'}, {w:'sentient vending machine',e:'🤖'},{w:'stressed barista',e:'☕'},{w:'mysterious substitute teacher',e:'🎓'},{w:'aggressively normal pigeon',e:'🐦'},{w:'wifi ghost',e:'📶'},{w:'unreasonably tall pigeon',e:'🐦'},{w:'very confident rat',e:'🐀'}] },
    { cat: 'move',    label: 'Pick an action',        options: [{w:'dramatically sighed',e:'😮‍💨'}, {w:'speed-ran', e:'💨'}, {w:'casually yeeted everything',e:'🏌️'}, {w:'existentially paused',e:'🫠'}, {w:'chaotically bolted',e:'💥'}, {w:'mysteriously vanished',e:'🌫️'},{w:'gracefully bailed',e:'🫣'},{w:'aggressively scrolled',e:'📱'},{w:'passive-aggressively waved',e:'👋'},{w:'reluctantly arrived',e:'🚪'},{w:'took a long sip and stared',e:'☕'},{w:'nodded knowingly',e:'😌'}] },
    { cat: 'mood',    label: 'Pick a vibe',           options: [{w:'chronically online',e:'📱'}, {w:'suspiciously unbothered',e:'😌'}, {w:'barely functional',e:'☕'}, {w:'terminally curious',e:'🔍'}, {w:'aggressively normal',e:'🙂'}, {w:'weirdly proud',e:'😤'}, {w:'main character energy',e:'✨'},{w:'NPC behavior',e:'🤖'}, {w:'menacingly chill',e:'😶'}, {w:'lowkey feral',e:'🐺'}, {w:'professionally unhinged',e:'💼'},{w:'catastrophically fine',e:'🙂'}] },
  ],
};

/* Free-text prompt pools — buildRounds() randomly samples from these each session */
const FREE_TEXT_ROUNDS = {
  kid: [
    { type: 'freetext', cat: 'freeword', label: "What's a sound that makes you laugh?",          examples: ['splat', 'burp', 'boing'] },
    { type: 'freetext', cat: 'freeword', label: "Make up a silly word for nose.",                 examples: ['snorble', 'snoot', 'blorp'] },
    { type: 'freetext', cat: 'freeword', label: "What noise would a confused robot make?",        examples: ['bzzzt', 'glonk', 'whirr'] },
    { type: 'freetext', cat: 'freeword', label: "Invent a word for when your sock falls down.",   examples: ['floopsy', 'droop', 'schlump'] },
    { type: 'freetext', cat: 'freeword', label: "What sound does happiness make?",                examples: ['woop', 'fizz', 'zing'] },
    { type: 'freetext', cat: 'freeword', label: "Make up a word for a tiny sneeze.",              examples: ['plink', 'achoo-bit', 'sniff-pop'] },
    { type: 'freetext', cat: 'freeword', label: "What would a dragon say instead of hello?",     examples: ['FWOOOM', 'smokeface', 'blarg'] },
    { type: 'freetext', cat: 'freeword', label: "Invent a word for falling asleep by accident.", examples: ['snoopdrop', 'zonkle', 'slumble'] },
    { type: 'freetext', cat: 'freeword', label: "What does a bouncy castle smell like?",         examples: ['rubbery', 'bouncy', 'plasticky fun'] },
    { type: 'freetext', cat: 'freeword', label: "Make up a magic word that fixes everything.",   examples: ['kazamba', 'flumptastic', 'woozle'] },
    { type: 'freetext', cat: 'freeword', label: "Invent a really embarrassing dance move.",      examples: ['the noodle', 'flap-shuffle', 'the wobble-stomp'] },
    { type: 'freetext', cat: 'freeword', label: "What's the loudest word you can think of?",     examples: ['BOOM', 'KABLAM', 'WHAMMO'] },
    { type: 'freetext', cat: 'freeword', label: "Name a smell that means trouble.",              examples: ['burnt toast', 'wet dog', 'old socks'] },
    { type: 'freetext', cat: 'freeword', label: "Invent a battle cry for a tiny knight.",        examples: ['ONWARD!', 'STABBY-STAB!', 'EAT MY BOOT!'] },
    { type: 'freetext', cat: 'freeword', label: "Make up a name for the world's grumpiest cat.", examples: ['Sir Grumblebottom', 'Snarls', 'Mr. NO'] },
    { type: 'freetext', cat: 'freeword', label: "What would your superhero catchphrase be?",     examples: ['NOT ON MY WATCH', 'SNACK ATTACK', 'BY THE POWER OF PIZZA'] },
  ],
  big: [
    { type: 'freetext', cat: 'freeword',  label: "Name something you'd find under a couch.",                examples: ['dust', 'remote', 'crumbs'] },
    { type: 'freetext', cat: 'freeword',  label: "Invent a name for a creature that only comes out on Wednesdays.", examples: ['wumblort', 'snaggle', 'glumph'] },
    { type: 'freetext', cat: 'freeword',  label: "What would a very small wizard say as a spell?",          examples: ['zibbidy', 'plonkus', 'snorfle'] },
    { type: 'freetext', cat: 'freeword',  label: "Name the least trustworthy vegetable.",                    examples: ['turnip', 'parsnip', 'fennel'] },
    { type: 'freetext', cat: 'freeword',  label: "What's the official name of that thing stuck in your teeth?", examples: ['schmibble', 'lodgeling', 'dental hostage'] },
    { type: 'freetext', cat: 'freeword',  label: "Invent a word for the urge to poke bubble wrap.",         examples: ['pobbly', 'bubblust', 'pressitivity'] },
    { type: 'freetext', cat: 'freeword',  label: "What would a haunted cookie say?",                        examples: ['crumble', 'I was delicious', 'chew me not'] },
    { type: 'freetext', cat: 'freeword',  label: "Name a job that definitely doesn't exist but should.",    examples: ['cloud straightener', 'official awkward pause filler', 'sock loss investigator'] },
    { type: 'freetext', cat: 'freeword2', label: "What's a word that just sounds silly?",                   examples: ['wobble', 'glorp', 'squish'] },
    { type: 'freetext', cat: 'freeword2', label: "Name an emotion that doesn't exist but should.",          examples: ['glumfuzzle', 'snortle', 'bliss-wump'] },
    { type: 'freetext', cat: 'freeword2', label: "Invent a polite word for a very loud sneeze.",            examples: ['kersplendor', 'snark-boom', 'nasal-fanfare'] },
    { type: 'freetext', cat: 'freeword2', label: "What's the secret name of your left sock?",               examples: ['Gerald', 'Flumf', 'Sir Woolsworth'] },
    { type: 'freetext', cat: 'freeword2', label: "Name an award you definitely deserve.",                   examples: ['Most Dramatically Sighing', 'Outstanding Snack Selection', 'Gold Medal Overthinker'] },
    { type: 'freetext', cat: 'freeword2', label: "What noise does a disappointed sandwich make?",           examples: ['squelp', 'glumch', 'oh no'] },
    { type: 'freetext', cat: 'freeword2', label: "Invent a word for the feeling of stepping on a lego.",    examples: ['scream-stomp', 'floorstab', 'brick agony'] },
    { type: 'freetext', cat: 'freeword2', label: "What's the proper term for losing your train of thought mid-sentence?", examples: ['thoughtlapse', 'brain-hiccup', 'wordinosauritis'] },
  ],
  tween: [
    { type: 'freetext', cat: 'freeword',  label: "What's something adults do that makes zero sense?",        examples: ['meetings', 'golf', 'taxes'] },
    { type: 'freetext', cat: 'freeword',  label: "Name the least trustworthy app on your phone.",            examples: ['weather', 'maps', 'autocorrect'] },
    { type: 'freetext', cat: 'freeword',  label: "What's your villain origin story called?",                 examples: ['The WiFi Went Down', 'Last Slice Gone', 'The Projector Froze'] },
    { type: 'freetext', cat: 'freeword',  label: "Invent a word for that moment when you forget why you walked into a room.", examples: ['blankout', 'doorstruck', 'forgotnik'] },
    { type: 'freetext', cat: 'freeword',  label: "Name a rule that should be illegal but somehow isn't.",   examples: ['assigned seating', 'group projects', 'mandatory participation'] },
    { type: 'freetext', cat: 'freeword',  label: "What's the most suspicious thing a teacher has ever said?", examples: ['this will be on the test', 'I hear everything', 'interesting choice'] },
    { type: 'freetext', cat: 'freeword',  label: "Invent the worst possible password.",                      examples: ['password1', 'my name', 'i forgot'] },
    { type: 'freetext', cat: 'freeword',  label: "Name a skill that sounds useless but actually isn't.",    examples: ['speed eating', 'napping anywhere', 'predicting skip ads'] },
    { type: 'freetext', cat: 'freeword2', label: "What's the password to your brain?",                       examples: ['pizza', 'spite', 'main character energy'] },
    { type: 'freetext', cat: 'freeword2', label: "Name a rule you made up but everyone follows anyway.",     examples: ["don't touch the top shelf", 'left side walk right', 'middle seat rules'] },
    { type: 'freetext', cat: 'freeword2', label: "What's your current mood in two words?",                   examples: ['chaotic tired', 'fine whatever', 'plotting something'] },
    { type: 'freetext', cat: 'freeword2', label: "Invent a band name using only things near you right now.", examples: ['The Lamp', 'Static Carpet', 'USB Hub'] },
    { type: 'freetext', cat: 'freeword2', label: "What would the title of your autobiography be?",          examples: ['I Was There', 'Somehow Still Standing', 'This Was Not The Plan'] },
    { type: 'freetext', cat: 'freeword2', label: "Name a cryptid you would absolutely trust.",              examples: ['Mothman', 'a very organized Bigfoot', 'the good kind of shadow person'] },
    { type: 'freetext', cat: 'freeword2', label: "What's the most chaotic thing you could add to a group project?", examples: ['make it a musical', 'comic sans everything', 'include a plot twist'] },
    { type: 'freetext', cat: 'freeword2', label: "Describe your sleep schedule in one made-up word.",        examples: ['disastrophic', 'nocturno-chaos', 'unreasonable'] },
  ],
};

/* Category order per tier — controls which rounds appear and in what sequence */
const ROUND_PLAN = {
  tot:    ['pet', 'color', 'food', 'place', 'sky', 'move'],
  little: ['pet', 'color', 'food', 'place', 'creature', 'move'],
  kid:    ['pet', 'color', 'food', 'place', 'creature', 'move', 'mood'],
  big:    ['pet', 'color', 'food', 'place', 'creature', 'move', 'mood'],
  tween:  ['pet', 'color', 'food', 'place', 'creature', 'move', 'mood'],
};
