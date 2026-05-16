/* ================================================================
   NoddyTales — Content data
   Edit this file to change words, prompts, or round order.
   Story template logic lives in index.html (buildStory).
   ================================================================ */

const APP_VERSION = 'v2.2.3';

/* Verb form lookup — maps each past-tense move-pool entry to its base + gerund forms.
   Templates use moveBase()/moveGerund() to derive the right form for the syntactic slot
   ("loved to hop", "set off hopping") instead of forcing past tense everywhere. */
const VERB_FORMS = {
  // tot / little overlap
  'hopped':    { base: 'hop',    gerund: 'hopping' },
  'spun':      { base: 'spin',   gerund: 'spinning' },
  'ran':       { base: 'run',    gerund: 'running' },
  'marched':   { base: 'march',  gerund: 'marching' },
  'jumped':    { base: 'jump',   gerund: 'jumping' },
  'clapped':   { base: 'clap',   gerund: 'clapping' },
  'crawled':   { base: 'crawl',  gerund: 'crawling' },
  'splashed':  { base: 'splash', gerund: 'splashing' },
  'rolled':    { base: 'roll',   gerund: 'rolling' },
  'swayed':    { base: 'sway',   gerund: 'swaying' },
  'stomped':   { base: 'stomp',  gerund: 'stomping' },
  'wiggled':   { base: 'wiggle', gerund: 'wiggling' },
  'danced':    { base: 'dance',  gerund: 'dancing' },
  'galloped':  { base: 'gallop', gerund: 'galloping' },
  'twirled':   { base: 'twirl',  gerund: 'twirling' },
  'bounced':   { base: 'bounce', gerund: 'bouncing' },
  'tiptoed':   { base: 'tiptoe', gerund: 'tiptoeing' },
  'zoomed':    { base: 'zoom',   gerund: 'zooming' },
  'skidded':   { base: 'skid',   gerund: 'skidding' },
  'flopped':   { base: 'flop',   gerund: 'flopping' },
  // kid
  'leapt':     { base: 'leap',   gerund: 'leaping' },
  'tumbled':   { base: 'tumble', gerund: 'tumbling' },
  'glided':    { base: 'glide',  gerund: 'gliding' },
  'charged':   { base: 'charge', gerund: 'charging' },
  'crept':     { base: 'creep',  gerund: 'creeping' },
  'soared':    { base: 'soar',   gerund: 'soaring' },
  'skated':    { base: 'skate',  gerund: 'skating' },
  'shimmied':  { base: 'shimmy', gerund: 'shimmying' },
  'wobbled':   { base: 'wobble', gerund: 'wobbling' },
  'sprinted':  { base: 'sprint', gerund: 'sprinting' },
  // big (verb + adverb phrases)
  'cartwheeled':              { base: 'cartwheel',                 gerund: 'cartwheeling' },
  'tiptoed cautiously':       { base: 'tiptoe cautiously',         gerund: 'tiptoeing cautiously' },
  'stumbled dramatically':    { base: 'stumble dramatically',      gerund: 'stumbling dramatically' },
  'waltzed accidentally':     { base: 'waltz accidentally',        gerund: 'waltzing accidentally' },
  'skipped solemnly':         { base: 'skip solemnly',             gerund: 'skipping solemnly' },
  'meandered thoughtfully':   { base: 'meander thoughtfully',      gerund: 'meandering thoughtfully' },
  'tripped magnificently':    { base: 'trip magnificently',        gerund: 'tripping magnificently' },
  'spun ceremoniously':       { base: 'spin ceremoniously',        gerund: 'spinning ceremoniously' },
  'reversed unexpectedly':    { base: 'reverse unexpectedly',      gerund: 'reversing unexpectedly' },
  'shuffled importantly':     { base: 'shuffle importantly',       gerund: 'shuffling importantly' },
  'scuttled with purpose':    { base: 'scuttle with purpose',      gerund: 'scuttling with purpose' },
  'fell upward somehow':      { base: 'fall upward somehow',       gerund: 'falling upward somehow' },
  // tween
  'dramatically sighed':         { base: 'dramatically sigh',         gerund: 'dramatically sighing' },
  'speed-ran':                   { base: 'speed-run',                 gerund: 'speed-running' },
  'casually yeeted everything':  { base: 'casually yeet everything',  gerund: 'casually yeeting everything' },
  'existentially paused':        { base: 'existentially pause',       gerund: 'existentially pausing' },
  'chaotically bolted':          { base: 'chaotically bolt',          gerund: 'chaotically bolting' },
  'mysteriously vanished':       { base: 'mysteriously vanish',       gerund: 'mysteriously vanishing' },
  'gracefully bailed':           { base: 'gracefully bail',           gerund: 'gracefully bailing' },
  'aggressively scrolled':       { base: 'aggressively scroll',       gerund: 'aggressively scrolling' },
  'passive-aggressively waved':  { base: 'passive-aggressively wave', gerund: 'passive-aggressively waving' },
  'reluctantly arrived':         { base: 'reluctantly arrive',        gerund: 'reluctantly arriving' },
  'took a long sip and stared':  { base: 'take a long sip and stare', gerund: 'taking a long sip and staring' },
  'nodded knowingly':            { base: 'nod knowingly',             gerund: 'nodding knowingly' },
};

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

/* Goofy Shorts pools (v1.18.0) — kid-tier short story rewrite.
   SILLY_ADJ + SILLY_NOUN combine to form the central absurd object of every kid story
   ("wobbly pickle", "stinky pancake", "boingy underpants"). The juxtaposition is the joke.
   Adjectives are physical/sensory (kids understand), not ironic. Nouns are concrete kid-vocab
   things — never abstract. Stories pair one of each randomly. */
const SILLY_ADJ = [
  'wobbly', 'stinky', 'boingy', 'squishy', 'noodle-y', 'floppy', 'slurpy',
  'honking', 'sneezy', 'banana-shaped', 'upside-down', 'extra crunchy',
  'crusty', 'bouncy', 'invisible', 'rubbery', 'jiggly', 'sticky',
  'lumpy', 'slimy', 'fuzzy', 'gloopy', 'crinkly', 'snorty',
];
const SILLY_NOUN = [
  'pickle', 'sock', 'pancake', 'toothbrush', 'banana', 'underpants',
  'spoon', 'cupcake', 'noodle', 'bubble', 'hat', 'meatball',
  'sticker', 'pillow', 'jellybean', 'doughnut', 'sandwich', 'muffin',
  'sneaker', 'helmet', 'pretzel', 'waffle', 'mitten', 'taco',
];

/* v1.19.1 — DEFAULT_SIDEKICKS REMOVED.
   Defect Log entry "Phantom character name injected into story" (Critical): a fabricated name
   from this pool appeared in a generated story when the user had not added any sidekicks.
   Per the defect note, all names in a template must be populated from user input only.
   buildStory now falls back to a common-noun phrase ("their pal" / "Their pal") instead of
   an invented name when state.sidekicks is empty. */

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

/* Absurd rules — Codex callback-motif system (#8). One rule is picked per kid story and
   referenced 3 times across paragraphs in escalating uses (setup → violation → payoff).
   The repetition is what makes generated stories feel authored. */
const RULES = [
  'no soup after moonrise',
  'never trust a sandwich after sunset',
  'always say hello to ladybugs',
  'never run with a clipboard',
  'whoever finds the spoon makes the rules',
  'all left socks must be paired',
  'three hops before any door',
  'pets vote on Tuesdays',
  'no whispering at lunch',
  'check the hat before sitting',
  'every cloud counts',
  'no apologizing on stairs',
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
    { cat: 'creature',label: 'Choose a creature',  options: [{w:'frog',     e:'🐸'}, {w:'fish',      e:'🐠'}, {w:'beetle',  e:'🐞'}, {w:'butterfly', e:'🦋'}, {w:'mouse',     e:'🐭'}, {w:'snail',   e:'🐌'}, {w:'owl',      e:'🦉'}, {w:'fox',       e:'🦊'}, {w:'deer',     e:'🦌'}, {w:'penguin',  e:'🐧'}, {w:'crab',     e:'🦀'}, {w:'bee',         e:'🐝'}] },
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
  // v1.19.2 — little tier (ages 4-5) gets its own freetext pool after Codex QA caught that
  // little Goofy Shorts templates use FW_SAFE heavily but buildRounds wasn't asking for one.
  // Prompts are simpler than kid pool: shorter, more concrete, more shoutable. Most subtypes
  // are 'shout' (the dominant little template pattern). A few 'name' prompts add variety for
  // the future when little templates pick up semantic routing tags.
  little: [
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What's a silly sound?",            examples: ['boing', 'splat', 'pop'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Make up a magic word.",            examples: ['abracadoodle', 'kapow', 'flabbidy'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does a sneeze sound like?",   examples: ['achoo', 'ploof', 'snork'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Pick the loudest word.",           examples: ['BOOM', 'WHEEEE', 'YAY'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What sound does happy make?",      examples: ['yay', 'woop', 'fizz'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does a dragon say?",          examples: ['roar', 'fwoom', 'blarg'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What word do you yell when you win?", examples: ['YAY', 'WHEE', 'WIN'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Make up a goodnight word.",        examples: ['snoozy', 'dreamy', 'blop'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does a bouncy ball say?",     examples: ['boing', 'pop', 'ZIP'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Pick a word that's just fun to say.", examples: ['noodle', 'boop', 'jellybean'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Make up a name for a tiny rock.",  examples: ['Pebbles', 'Rocky', 'Mr. Stone'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Make up a name for a friendly monster.", examples: ['Mumby', 'Grog', 'Smoosh'] },
    /* v2.2.1 — expansion to 30 little prompts with varied subtypes */
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does a duck really say?",     examples: ['quackers', 'BOOP', 'fwip'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Name a teddy bear.",                examples: ['Buttons', 'Hugo', 'Mr. Snuggles'] },
    { type: 'freetext', cat: 'freeword', subtype: 'snack', label: "Make up a new cereal name.",        examples: ['Honey Bonks', 'Crispy Wiggles', 'Crunch Pops'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What do you yell at bubbles?",      examples: ['POP', 'GOTCHA', 'BUBBLE TIME'] },
    { type: 'freetext', cat: 'freeword', subtype: 'smell', label: "What does playdough smell like?",   examples: ['salty', 'rainbowy', 'sneaky'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Hide-and-seek victory yell!",       examples: ['FOUND YOU', 'HAHA', 'GOT YA'] },
    { type: 'freetext', cat: 'freeword', subtype: 'announcement', label: "What does the ice cream truck say?", examples: ['HELLO', 'SCREAM', 'YUM'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Name a tiny bug friend.",            examples: ['Speck', 'Twiggy', 'Beepers'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does a bouncy castle say?",    examples: ['SPROING', 'WHEE', 'BWOOM'] },
    { type: 'freetext', cat: 'freeword', subtype: 'snack', label: "Invent a new lollipop flavor.",     examples: ['blue dragon', 'cloud', 'sparkle'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does a tickle feel like?",     examples: ['HEEHEE', 'SQUIRMY', 'NO STOP'] },
    { type: 'freetext', cat: 'freeword', subtype: 'spell', label: "Cast a quiet little spell.",        examples: ['shooshie', 'plinkity', 'sleeppoof'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Hooray word for a new shoe!",       examples: ['ZOOMIES', 'SHINY', 'SHOO YAY'] },
    { type: 'freetext', cat: 'freeword', subtype: 'object',label: "Thing you'd find in a treasure box.", examples: ['shell', 'shiny rock', 'old button'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does mud say when you step on it?", examples: ['SQUISH', 'SPLOOSH', 'WET'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Name a friendly cloud.",            examples: ['Puff', 'Mr. Foof', 'Cottons'] },
    { type: 'freetext', cat: 'freeword', subtype: 'spell', label: "Magic word to make veggies fun.",   examples: ['veggie-poof', 'crunchy zing', 'green wiggle'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does the fridge say at night?", examples: ['hummm', 'shhhh', 'TICK'] },
  ],
  kid: [
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What's a sound that makes you laugh?",          examples: ['splat', 'burp', 'boing'] },
    { type: 'freetext', cat: 'freeword', subtype: 'word',  label: "Make up a silly word for nose.",                 examples: ['snorble', 'snoot', 'blorp'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What noise would a confused robot make?",        examples: ['bzzzt', 'glonk', 'whirr'] },
    { type: 'freetext', cat: 'freeword', subtype: 'word',  label: "Invent a word for when your sock falls down.",   examples: ['floopsy', 'droop', 'schlump'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What sound does happiness make?",                examples: ['woop', 'fizz', 'zing'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Make up a word for a tiny sneeze.",              examples: ['plink', 'achoo-bit', 'sniff-pop'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What would a dragon say instead of hello?",     examples: ['FWOOOM', 'smokeface', 'blarg'] },
    { type: 'freetext', cat: 'freeword', subtype: 'word',  label: "Invent a word for falling asleep by accident.", examples: ['snoopdrop', 'zonkle', 'slumble'] },
    { type: 'freetext', cat: 'freeword', subtype: 'smell', label: "What does a bouncy castle smell like?",         examples: ['rubbery', 'bouncy', 'plasticky fun'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Make up a magic word that fixes everything.",   examples: ['kazamba', 'flumptastic', 'woozle'] },
    { type: 'freetext', cat: 'freeword', subtype: 'dance', label: "Invent a really embarrassing dance move.",      examples: ['the noodle', 'flap-shuffle', 'the wobble-stomp'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What's the loudest word you can think of?",     examples: ['BOOM', 'KABLAM', 'WHAMMO'] },
    { type: 'freetext', cat: 'freeword', subtype: 'smell', label: "Name a smell that means trouble.",              examples: ['burnt toast', 'wet dog', 'old socks'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Invent a battle cry for a tiny knight.",        examples: ['ONWARD!', 'STABBY-STAB!', 'EAT MY BOOT!'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Make up a name for the world's grumpiest cat.", examples: ['Sir Grumblebottom', 'Snarls', 'Mr. NO'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What would your superhero catchphrase be?",     examples: ['NOT ON MY WATCH', 'SNACK ATTACK', 'BY THE POWER OF PIZZA'] },
    /* v2.2.1 — kid expansion to 40 with new subtypes: spell, rule, excuse, job, warning, password, announcement, snack, secret */
    { type: 'freetext', cat: 'freeword', subtype: 'spell', label: "Make up a spell that unsticks gum.",     examples: ['unstickitus', 'goo-poof', 'GUM BE GONE'] },
    { type: 'freetext', cat: 'freeword', subtype: 'rule',  label: "Invent a rule for the playground.",      examples: ['no soup at slides', 'always tag the swing', 'mascots eat last'] },
    { type: 'freetext', cat: 'freeword', subtype: 'excuse',label: "Best excuse for being a little late.",   examples: ['the cat was in charge', 'time blinked', 'spaghetti incident'] },
    { type: 'freetext', cat: 'freeword', subtype: 'job',   label: "Name a job that should exist.",          examples: ['cloud straightener', 'sock detective', 'official giggle counter'] },
    { type: 'freetext', cat: 'freeword', subtype: 'warning',label: "Sign on a haunted lunchbox.",            examples: ['DO NOT OPEN', 'CONTENTS UNSURE', 'BEWARE THE TUNA'] },
    { type: 'freetext', cat: 'freeword', subtype: 'password',label: "Secret password to the fort.",          examples: ['snackgoblin', 'monkey waffle', 'shhhh-banana'] },
    { type: 'freetext', cat: 'freeword', subtype: 'announcement',label: "Cafeteria announcement.",          examples: ['JELLO IS BACK', 'EXTRA TATER TOTS', 'NO RUNNING TODAY'] },
    { type: 'freetext', cat: 'freeword', subtype: 'snack', label: "Invent a snack that should exist.",      examples: ['glitter goldfish', 'rainbow pretzel', 'pizza popsicle'] },
    { type: 'freetext', cat: 'freeword', subtype: 'secret',label: "Word you only say to your best friend.", examples: ['banana code', 'sky tickle', 'flarp'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What does a parade chant sound like?",  examples: ['HEY HEY GO TEAM', 'WHO ARE WE', 'LOUDER LOUDER'] },
    { type: 'freetext', cat: 'freeword', subtype: 'dance', label: "Name a dance you invented at recess.",   examples: ['the noodle slide', 'sock spin', 'wiggle stomp'] },
    { type: 'freetext', cat: 'freeword', subtype: 'object',label: "What's stuck at the bottom of your backpack?", examples: ['mystery wrapper', 'old pencil', 'crumb city'] },
    { type: 'freetext', cat: 'freeword', subtype: 'smell', label: "What does a school bus smell like?",     examples: ['vinyl', 'old crackers', 'a thousand recesses'] },
    { type: 'freetext', cat: 'freeword', subtype: 'job',   label: "Name a fake job at the diner.",          examples: ['ketchup wizard', 'milkshake intern', 'pancake commissioner'] },
    { type: 'freetext', cat: 'freeword', subtype: 'announcement',label: "Loudspeaker at the football game.", examples: ['TOUCHDOWN', 'GET THE FOAM FINGER', 'POPCORN HALFTIME'] },
    { type: 'freetext', cat: 'freeword', subtype: 'warning',label: "Sign at the mall food court.",          examples: ['NO SAMPLE LOOPING', 'HOT TRAY HOT TRAY', 'JUICE EMERGENCY'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Name a mascot for the cafeteria.",       examples: ['Sir Crinkle Fries', 'Pizzo', 'Captain Cookie'] },
    { type: 'freetext', cat: 'freeword', subtype: 'rule',  label: "Bus rule that should be real.",          examples: ['back row bows first', 'no humming after 4 stops', 'window seats vote'] },
    { type: 'freetext', cat: 'freeword', subtype: 'spell', label: "Spell for finding your missing sock.",   examples: ['sockety find', 'toesy reveal', 'come back foot fluff'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "What's a really good groan word?",       examples: ['BLERGH', 'NOOOOO', 'WHY'] },
    { type: 'freetext', cat: 'freeword', subtype: 'name',  label: "Name a tiny trophy you'd put on a shelf.", examples: ['Best Toast Ever', 'Champion Sneaker', 'Top Snack Award'] },
    { type: 'freetext', cat: 'freeword', subtype: 'secret',label: "Code word your sidekick yells in trouble.", examples: ['MANGO MANGO', 'red waffle', 'plan zero'] },
    { type: 'freetext', cat: 'freeword', subtype: 'object',label: "Something you'd find in a grocery aisle.", examples: ['jar with eyes', 'samples table', 'crinkly cereal'] },
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Word you say when the slide is fast.",   examples: ['WHEEE', 'AHHH YES', 'WOOSH'] },
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
    /* v2.2.1 — big tier expansion to 40 with varied subtypes */
    { type: 'freetext', cat: 'freeword',  subtype: 'rule',  label: "Rule that should be enforced in libraries.", examples: ['no whispering to cupcakes', 'turn pages clockwise', 'cite your snack'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'excuse',label: "Excuse for missing your shift at the snack bar.", examples: ['stamp shortage', 'broom incident', 'sandwich crisis'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'job',   label: "Job at a haunted mall.",                 examples: ['fountain coin certifier', 'escalator priest', 'pretzel exorcist'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'warning',label: "Warning printed on a haunted backpack.", examples: ['contents may bargain', 'previously owned by a ghost', 'do not feed after midnight'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'password',label: "Password to a very official treehouse.", examples: ['twigbiscuit', 'leaves know', 'oak protocol'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'announcement',label: "Mall PA system mystery.",          examples: ['will the owner of the kazoo please report', 'the fountain is full again', 'sample tray is sentient'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'snack', label: "Make up a snack invented at 2am.",       examples: ['cereal sandwich', 'pickle taco', 'crunchwrap apology'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'secret',label: "Code word for 'time to leave this party'.", examples: ['banana protocol', 'sweater drill', 'orange alert'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'spell', label: "Spell to fix a stuck zipper.",            examples: ['unstickitate', 'fabric unbind', 'pull-zee-poof'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'name',  label: "Name a tiny trophy in your room.",        examples: ['Best At Sitting', 'Most Improved Yawn', 'Snack Champion 4th Grade'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'rule',  label: "Cafeteria rule everyone secretly follows.", examples: ['no whispering to cupcakes', 'tray must be carried at an angle', 'pudding goes last'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'dance', label: "Embarrassing dance move from a school dance.", examples: ['the lawnmower', 'cabbage shuffle', 'reverse worm'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'object',label: "Item you'd find in the school's lost and found.", examples: ['one mitten', 'broken whistle', 'foam finger'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'smell', label: "Smell that means a substitute teacher is coming.", examples: ['old marker', 'mystery coffee', 'binder dust'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'name',  label: "Name a fake school mascot.",              examples: ['the Sentient Pencil', 'Captain Loose-Leaf', 'Lord Sticker'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'shout', label: "Battle cry of the recess kickball team.", examples: ['KICK IT KICK IT', 'BOOT TIME', 'FOR THE BASES'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'snack', label: "Diner special invented just now.",        examples: ['the moon plate', 'big banana attack', 'milkshake of regret'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'job',   label: "Job description for 'professional spoon tester'.", examples: ['stirs daily', 'evaluates clinks', 'reports to soup'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'announcement',label: "Driver's announcement on the school bus.", examples: ['STAY SEATED PLEASE', 'NO HUMMING TODAY', 'THIS IS NOT YOUR STOP'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'warning',label: "Note your sidekick left on the fridge.",  examples: ['the toaster knows', 'do not trust the bread', 'snack debt is due'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'secret',label: "Inside-joke word that nobody else gets.",  examples: ['flarbo', 'klompy', 'cucumbersome'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'password',label: "Password to your imaginary clubhouse.",  examples: ['rocket pancakes', 'silent cookie', 'permission granted'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'shout', label: "What you yell when the toast pops.",      examples: ['SUCCESS', 'TOAST', 'BREAKFAST'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'spell', label: "Spell to make homework easier.",          examples: ['math be kind', 'pencil obey', 'study-poof'] },
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
    /* v2.2.1 — tween expansion to 40 with varied subtypes */
    { type: 'freetext', cat: 'freeword',  subtype: 'announcement',label: "Group chat opens with…",            examples: ['ok so', 'guys', 'unrelated but'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'excuse',label: "Excuse for ignoring a text for 14 hours.",  examples: ['phone died emotionally', 'do-not-disturb stuck', 'I was a vibe'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'rule',  label: "Bus seat rule that's never written down.", examples: ['back row is back row', 'never sit alone if you can help it', 'aisle bows to window'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'spell', label: "Spell to skip a boring class.",            examples: ['be elsewhere', 'time-jump-please', 'fire alarm but politely'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'job',   label: "Fake job title to put in your bio.",       examples: ['vibe consultant', 'snack analyst', 'professional bystander'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'warning',label: "Warning on a cursed group project.",     examples: ['do not lead this', 'subject to vibes', 'cancel before next class'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'password',label: "Password to your finsta.",               examples: ['notmybusiness', 'main is fake', 'we live'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'snack', label: "Gas-station snack you'd actually buy.",    examples: ['hot chip with no chill', 'mystery cracker', 'iced coffee from a bag'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'secret',label: "Word your group chat uses to bail.",       examples: ['exit protocol', 'mango', 'pizza emergency'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'object',label: "Item you carry that nobody knows about.",  examples: ['three hair ties', 'mystery receipt', 'old gum'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'name',  label: "Name a fake band you'd be in.",            examples: ['The Awkward Lunch', 'Bus Crisis', 'Substitute Energy'] },
    { type: 'freetext', cat: 'freeword',  subtype: 'smell', label: "Smell of the school hallway after lunch.", examples: ['microwaved mystery', 'lemon cleaner', 'a thousand sandwiches'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'shout', label: "What you yell when group chat goes off.",   examples: ['WAIT WHAT', 'NO WAY', 'GO BACK SCROLL UP'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'rule',  label: "Unspoken rule of the school cafeteria.",   examples: ['nobody sits there', 'pudding gets traded last', 'the corner table is sacred'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'snack', label: "Bag of chips with a 100% chance of betrayal.", examples: ['salt-and-vinegar', 'mystery flavor', 'whatever has dust'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'dance', label: "Dance move you'd never admit to.",          examples: ['the lawnmower', 'reverse worm', 'cabbage shuffle'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'announcement',label: "Loudspeaker says…",                   examples: ['this is not a drill', 'attention students', 'whoever owns the chicken'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'object',label: "Thing in your bag that has no explanation.", examples: ['a random key', 'one earbud', 'a glitter pen'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'spell', label: "Spell to make the wifi come back.",         examples: ['signal please', 'router I beg', 'bars-be-with-me'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'warning',label: "Sign on the back of a locker.",            examples: ['cursed shelf', 'do not stack', 'belongs to the lunch lady'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'job',   label: "Mall job that probably isn't real.",        examples: ['fountain coin retriever', 'pretzel arbitrator', 'mall walker captain'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'name',  label: "Name a mascot for your boring elective.",   examples: ['Lord PowerPoint', 'Captain Worksheet', 'Sir Group Project'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'secret',label: "Word that means 'leave now without explaining'.", examples: ['banana', 'mango protocol', 'sweater drill'] },
    { type: 'freetext', cat: 'freeword2', subtype: 'excuse',label: "Why you're suddenly busy this weekend.",     examples: ['family thing', 'I have to be elsewhere', 'previously committed to a nap'] },
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
