/* ================================================================
   NoddyTales — Content data
   Edit this file to change words, prompts, or round order.
   Story template logic lives in index.html (buildStory).
   ================================================================ */

/* Versioning policy (introduced 2026-05-21, see docs/versioning.md):
   - APP_VERSION is the user-facing PRODUCT version. v0.9.x = late beta, pre-App-Store.
     Bumps minor on real product milestones (App-Store-ready, real-kid playtest signoff,
     feature additions). v1.0.0 = public App Store launch.
   - ENGINE_V2_VERSION (in src/engine-v2.js) is the INTERNAL engine version, not shown in
     the badge. Bumps on engine architecture changes (v2 deletion → v3.1.0, etc.).
   - BUILD_NUMBER increments every release shipped to main. Shown in the badge alongside
     APP_VERSION so every release is traceable without semver inflation.
   The v3.0.x version line that ran v3.0.0 → v3.0.3 was an engine-architecture milestone
   mistakenly applied to the user-facing product version. This release corrects the
   labeling: product is in late beta (v0.9.x), engine is still v3 internally. The
   historical v3.0.0-v3.0.3 CHANGELOG entries stay as-is for traceability. */
const APP_VERSION  = 'v0.9.3';
const BUILD_NUMBER = 37;

/* v0.9.3 · b8 — Narrator Voice Selector MVP.
   v0.9.3 · b16 — lineup refresh.
   v0.9.3 · b20 — labels simplified to performance-style names (Sunny /
   Storybook / Adventure / Silly). User feedback after b16/b18: accent +
   geography labels ("Sunny American" / "Storybook British" / "Adventure
   American" / "Silly Cartoon") felt off for a kid app and exposed the
   accent of the underlying ElevenLabs voice in a way that was confusing
   when the voice itself was foreign-sounding (Mimi b18). UI now describes
   the PERFORMANCE STYLE only; accent details live in implementation docs.

   Keys (sunny/cozy/adventure/silly) stay stable so saved `nt_voice_preset`
   and IndexedDB cache entries (`<preset>|<sha256>` for stories,
   `preview:<preset>` for previews) survive across every rename.

   No celebrity / licensed-character / real-person imitation in any label,
   tagline, or previewText — QA Section 14 scans for it.

   The client knows only `key`, `label`, `tagline`, and `previewText`. Raw
   ElevenLabs voice IDs live server-side (api/tts.js VOICE_MAP `defaultId`
   + env-var overrides). Adding a preset here requires a matching server-side
   allowlist entry; unknown presets are 400'd. */
const VOICE_PRESETS = [
  { key: 'sunny',     label: 'Sunny',     tagline: 'Warm, clear, everyday reader',
    previewText: "Hi, I'm Sunny. I'm your personal story reader." },
  { key: 'cozy',      label: 'Storybook', tagline: 'Classic bedtime narrator',
    previewText: "Hi, I'm Storybook. I'll read this like a cozy tale." },
  { key: 'adventure', label: 'Adventure', tagline: 'Bold, energetic, exciting',
    previewText: "Hi, I'm Adventure. Let's make this story sound big." },
  // b20 — label simplified to "Silly". Two stock-voice attempts (Gigi b17
  // too calm-American; Mimi b18 foreign-accented) had failed against the
  // "high-pitched cartoon" target.
  // b23 — rebrand: "Silly" → "Cheerful". User reframe — the previous brief
  // ("high-pitched, goofy, cartoon") was the wrong target for Mimi, whose
  // actual voice quality is bright + warm rather than cartoony. Renaming
  // the preset around the voice we have, instead of the voice we wanted,
  // lands honestly. Preset key stays `silly` so saved nt_voice_preset
  // values + IndexedDB cache (preview:v2:silly + v2:silly|<sha>) survive
  // across the rename. The api/tts.js silly defaultId stays Mimi — she's
  // now the intended voice, not a documented backstop. Operator override
  // via ELEVENLABS_VOICE_SILLY remains available for parents who want a
  // different cheerful voice.
  { key: 'silly',     label: 'Cheerful',  tagline: 'Bright, warm, lifts the mood',
    previewText: "Hi, I'm Cheerful. I'm here to lighten the mood." },
];
const VOICE_PRESET_DEFAULT = 'sunny';
const VOICE_PRESET_KEYS    = VOICE_PRESETS.map(p => p.key); // for validation

/* v0.9.3 · b22 — VOICE_CACHE_VERSION invalidates the client-side IndexedDB
   audio cache without forcing every user to manually clear browser storage.
   Story keys become `<version>:<preset>|<sha>` and preview keys become
   `preview:<version>:<preset>`. Bumping this constant orphans every cached
   blob keyed by an older version — the browser misses cache once per
   (voice, story) pair and re-fetches from /api/tts with the current
   resolver. Stale orphans get GC'd by the browser's IndexedDB quota policy.

   When to bump:
     - Voice-routing config changed (new defaultId, new env-var collapse fix)
     - Cache-key shape changed (new prefix, new separator)
     - User reports stale audio after a deploy that should have fixed it

   History:
     v1 — implicit (no version prefix). Used b8 → b21.
     v2 — b22 fix for the recurring "all previews are George" defect:
          unversioned `preview:sunny` / `preview:cozy` / `preview:adventure` /
          `preview:silly` blobs in returning-user IndexedDB stores were
          replaying pre-b17 George audio regardless of resolver fixes.

   This constant is FROZEN at v2 until the next cache-invalidation event;
   it does NOT bump every release. Bumping BUILD_NUMBER alone does not
   bump this. */
const VOICE_CACHE_VERSION  = 'v2';

/* v0.9.3 · b9 — Setting 2.0: broad story-flavor categories.
   User feedback: the prior exact-setting grid (Diner / Mall / Football Game / etc.)
   made the app feel limited — the visible list WAS the list of places the engine
   supports. Setting 2.0 repositions settings as broad "story flavor" categories
   with hidden specific-place variety underneath. The visible UI is 8 broad vibes;
   each vibe holds a pool of 8 specific places; the engine picks one per session.

   - SETTING_FLAVOR_KEYS: client + server allowlist of valid flavor keys
   - getFlavor(key): lookup helper
   - resolveSetting(key): returns a fully-resolved {id,place,visitorBias,objectBias}
     object compatible with the legacy V2_SETTINGS shape. For non-surprise flavors,
     a random hidden place is picked at resolution time → varies per session.
   - migrateLegacySetting(value): maps old exact keys (diner/mall/zoo/...) to the
     closest new flavor; unknown / corrupted values fall back to 'surprise'.

   Engine-side (engine-v2.js) getSetting() routes flavor keys through this map.
   Hidden places must use the shape { id, text, emoji, article } so the existing
   grammar helpers + render path (place.text, place.titleText, place.articleText)
   continue to work unchanged. */
const SETTING_FLAVORS = [
  { key: 'surprise', label: 'Surprise Me', emoji: '✨',
    note: 'Anywhere the story takes us',
    hiddenPlaces: null,                                 // null = engine picks freely
    visitorBias: [], objectBias: [] },

  { key: 'at_home', label: 'At Home', emoji: '🏠',
    note: 'Bedrooms, kitchens, blanket forts',
    hiddenPlaces: [
      { id:'bedroom',      text:'bedroom',      emoji:'🛏️', article:'the' },
      { id:'kitchen',      text:'kitchen',      emoji:'🍽️', article:'the' },
      { id:'living_room',  text:'living room',  emoji:'🛋️', article:'the' },
      { id:'home_backyard',text:'backyard',     emoji:'🌳', article:'the' },
      { id:'blanket_fort', text:'blanket fort', emoji:'🛏️', article:'a' },
      { id:'garage',       text:'garage',       emoji:'🚪', article:'the' },
      { id:'bathtub',      text:'bathtub',      emoji:'🛁', article:'the' },
      { id:'home_hallway', text:'hallway',      emoji:'🚪', article:'the' },
    ],
    visitorBias: ['fairy','gnome','ghost'],
    objectBias:  ['shiny_rock','umbrella','crumb_map','tiny_key','lost_mitten','water_bottle'] },

  { key: 'at_school', label: 'At School', emoji: '🏫',
    note: 'Classroom, library, cafeteria',
    hiddenPlaces: [
      { id:'classroom',         text:'classroom',         emoji:'📚', article:'the' },
      { id:'school_library',    text:'library',           emoji:'📖', article:'the' },
      { id:'cafeteria',         text:'cafeteria',         emoji:'🍱', article:'the' },
      { id:'playground',        text:'playground',        emoji:'🛝', article:'the' },
      { id:'gym',               text:'gym',               emoji:'🏀', article:'the' },
      { id:'art_room',          text:'art room',          emoji:'🎨', article:'the' },
      { id:'school_bus_line',   text:'school bus line',   emoji:'🚌', article:'the' },
      { id:'nurses_office',     text:"nurse's office",    emoji:'🩹', article:'the' },
    ],
    visitorBias: ['sub_teacher','feral_librarian','knight','goblin','jester'],
    objectBias:  ['hallway_pass','lunch_tray','library_card','backpack_zipper','sticker_sheet','tiny_clipboard'] },

  { key: 'outside', label: 'Outside', emoji: '🌳',
    note: 'Parks, forests, the great outdoors',
    hiddenPlaces: [
      { id:'park',          text:'park',          emoji:'🌳', article:'the' },
      { id:'forest_path',   text:'forest path',   emoji:'🌲', article:'a' },
      { id:'beach',         text:'beach',         emoji:'🏖️', article:'the' },
      { id:'garden',        text:'garden',        emoji:'🌷', article:'the' },
      { id:'puddle_street', text:'puddle street', emoji:'💧', article:'a' },
      { id:'camping_spot',  text:'camping spot',  emoji:'⛺', article:'a' },
      { id:'soccer_field',  text:'soccer field',  emoji:'⚽', article:'the' },
      { id:'treehouse',     text:'treehouse',     emoji:'🌳', article:'the' },
    ],
    visitorBias: ['fairy','gnome','dinosaur','goblin','ghost'],
    objectBias:  ['shiny_rock','umbrella','crumb_map','tiny_key','lost_mitten','water_bottle'] },

  { key: 'food_place', label: 'Food Place', emoji: '🍕',
    note: 'Diners, bakeries, ice cream trucks',
    hiddenPlaces: [
      { id:'diner',          text:'diner',          emoji:'🍔', article:'the' },
      { id:'pizza_shop',     text:'pizza shop',     emoji:'🍕', article:'the' },
      { id:'bakery',         text:'bakery',         emoji:'🥐', article:'the' },
      { id:'ice_cream_truck',text:'ice cream truck',emoji:'🍦', article:'the' },
      { id:'grocery_aisle',  text:'grocery aisle',  emoji:'🛒', article:'the' },
      { id:'taco_stand',     text:'taco stand',     emoji:'🌮', article:'the' },
      { id:'pancake_house',  text:'pancake house',  emoji:'🥞', article:'the' },
      { id:'snack_bar',      text:'snack bar',      emoji:'🍿', article:'the' },
    ],
    visitorBias: ['stressed_barista','jester','wizard','knight'],
    objectBias:  ['noisy_spoon','bent_spoon','milkshake_straw','receipt','lunch_tray','sticker_sheet','cereal_box','pickle_jar'] },

  { key: 'animal_place', label: 'Animal Place', emoji: '🦁',
    note: 'Zoos, pet stores, dog parks',
    hiddenPlaces: [
      { id:'zoo',             text:'zoo',             emoji:'🦁', article:'the' },
      { id:'pet_store',       text:'pet store',       emoji:'🐶', article:'the' },
      { id:'aquarium',        text:'aquarium',        emoji:'🐠', article:'the' },
      { id:'farm',            text:'farm',            emoji:'🐄', article:'the' },
      { id:'dog_park',        text:'dog park',        emoji:'🐕', article:'the' },
      { id:'animal_shelter',  text:'animal shelter',  emoji:'🐾', article:'the' },
      { id:'pony_field',      text:'pony field',      emoji:'🐴', article:'a' },
      { id:'butterfly_house', text:'butterfly house', emoji:'🦋', article:'the' },
    ],
    visitorBias: ['knight','pirate','wizard','jester','dinosaur'],
    objectBias:  ['crumb_map','wobbly_telescope','binoculars','ticket_stub','water_bottle','tiny_key'] },

  { key: 'on_the_go', label: 'On the Go', emoji: '🚌',
    note: 'Buses, trains, planes, sidewalks',
    hiddenPlaces: [
      { id:'bus',              text:'bus',              emoji:'🚌', article:'the' },
      { id:'train',            text:'train',            emoji:'🚆', article:'the' },
      { id:'airplane',         text:'airplane',         emoji:'✈️', article:'the' },
      { id:'car_ride',         text:'car ride',         emoji:'🚗', article:'a' },
      { id:'ferry',            text:'ferry',            emoji:'⛴️', article:'the' },
      { id:'sidewalk',         text:'sidewalk',         emoji:'🚶', article:'the' },
      { id:'elevator',         text:'elevator',         emoji:'🛗', article:'the' },
      { id:'subway_platform',  text:'subway platform',  emoji:'🚉', article:'the' },
    ],
    visitorBias: ['sub_teacher','wifi_ghost','goblin','stressed_barista','gnome'],
    objectBias:  ['bus_ticket','backpack_zipper','lost_mitten','lunch_tray','sticker_sheet','water_bottle'] },

  { key: 'somewhere_weird', label: 'Somewhere Weird', emoji: '🌀',
    note: 'Moon bases, cloud castles, noodle planets',
    hiddenPlaces: [
      { id:'moon_base',          text:'moon base',          emoji:'🌙', article:'the' },
      { id:'cloud_castle',       text:'cloud castle',       emoji:'☁️', article:'a' },
      { id:'upside_down_museum', text:'upside-down museum', emoji:'🔄', article:'the' },
      { id:'tiny_city',          text:'tiny city',          emoji:'🏙️', article:'a' },
      { id:'giants_pocket',      text:"giant's pocket",     emoji:'👖', article:'a' },
      { id:'sock_dimension',     text:'sock dimension',     emoji:'🧦', article:'the' },
      { id:'noodle_planet',      text:'noodle planet',      emoji:'🍜', article:'a' },
      { id:'invisible_hotel',    text:'invisible hotel',    emoji:'🏨', article:'an' },
    ],
    visitorBias: ['wizard','witch','dinosaur','goblin','ghost','fairy'],
    objectBias:  ['shiny_rock','wobbly_telescope','tiny_key','mystery_coupon','crumb_map','umbrella'] },
];
const SETTING_FLAVOR_KEYS    = SETTING_FLAVORS.map(f => f.key);
const SETTING_FLAVOR_DEFAULT = 'surprise';

function getFlavor(key) {
  return SETTING_FLAVORS.find(f => f.key === key);
}

/* Resolve a flavor key to a fully-realized setting object compatible with
   the legacy V2_SETTINGS shape consumed by the v2/v3 engines. For non-surprise
   flavors, a random hidden place is picked at call time (so a kid who locks
   "Food Place" gets diner one session and bakery the next). */
function resolveSetting(key) {
  const flavor = getFlavor(key);
  if (!flavor) {
    // Unknown key — try legacy exact-key lookup (V2_SETTINGS lives in engine-v2.js
    // which loads after content.js; guarded by typeof). Otherwise fall to surprise.
    if (typeof V2_SETTINGS !== 'undefined') {
      const legacy = V2_SETTINGS.find(s => s.id === key);
      if (legacy) return legacy;
    }
    const surprise = getFlavor('surprise');
    return { id: 'surprise', place: null, visitorBias: surprise.visitorBias, objectBias: surprise.objectBias };
  }
  if (!flavor.hiddenPlaces) {
    // Surprise flavor — engine picks place from V2_WORDS.places freely.
    return { id: flavor.key, place: null, visitorBias: flavor.visitorBias, objectBias: flavor.objectBias };
  }
  const chosen = flavor.hiddenPlaces[Math.floor(Math.random() * flavor.hiddenPlaces.length)];
  return { id: flavor.key, place: chosen, visitorBias: flavor.visitorBias, objectBias: flavor.objectBias };
}

/* Migrate a legacy exact-setting key from pre-b9 saved profiles to the closest
   new flavor key. Called from Profile.load() so saved nt_setting values from
   v2.1.0+ continue to work. Unknown values fall back to surprise. */
function migrateLegacySetting(value) {
  if (!value) return SETTING_FLAVOR_DEFAULT;
  if (SETTING_FLAVOR_KEYS.includes(value)) return value;  // already a flavor key
  const LEGACY_MAP = {
    diner:         'food_place',
    grocery_store: 'food_place',
    mall:          'surprise',          // doesn't fit any single flavor cleanly
    football_game: 'at_school',
    school:        'at_school',
    backyard:      'at_home',
    zoo:           'animal_place',
    bus:           'on_the_go',
  };
  return LEGACY_MAP[value] || SETTING_FLAVOR_DEFAULT;
}

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
/* v3.0.3 — replaced bathroom-style sound words (PARP / PFFFFART / FAAAARP / BTHHHPP
   / PLOPP / SQUOMP / BLEEEEH / SCHPLAT / TOOOT / GLOOP) with cartoon-style action
   sounds per parent feedback. Kid-readable, punchy, distinct from bodily-function
   register. BWAHAHA + KAFOOM retained — already inoffensive Looney Tunes-style. */
const SOUND_HOT = ['BABOOM', 'WHAMMY', 'CRASH', 'TOOT', 'ZAP', 'SPLAT', 'CLANG', 'SMASH', 'BONK', 'WHOOSH', 'BWAHAHA', 'KAFOOM'];

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
/* v0.9.3 · b2 — fixed 👃 collision (booger + nostril hair both used 👃). The new
   Section 11 gate that scans BODY_HOT_OPTS for within-pool emoji uniqueness caught
   the pre-existing duplicate; booger moves to 🤧 (sneeze face), nostril hair keeps 👃.
   v0.9.3 · b15 — "snot rocket 💦" → 🚀 (rocket emoji makes the "rocket" half land). */
/* v0.9.3 · b23 — ABSURD WORD BANK
   ================================
   Notion Build Idea: "High-impact word slots: force funnier, more absurd
   choices" (36813aa1-d4db-8147-84a8-eb888c5c6900).

   Certain story-template moments are structurally punchlines: the kid's
   selected word is shouted, announced, or revealed as the comedic pivot.
   These slots are marked HIGH_IMPACT — they MUST pull from this bank,
   never from the general vocabulary pool.

   In the v3 engine these correspond to the `chant` and `payoff_word`
   roles (rendered with [y:...] yellow punchline tokens). Picker rounds
   that feed those roles (`sound` / `freeword` / `freeword2`) are tagged
   `highImpact: true` and source their hints/options from this bank.

   Categories (per Notion Build Idea spec):
     - sillySounds:     short onomatopoeia / pure absurd phonemes
     - grossButSafe:    bathroom/body without crossing the safe-for-app line
     - randomObjects:   wearable-on-head / pet-from-the-fridge tier objects
     - nonsenseCompound:invented compounds with -pants, -flop, -bunch suffixes

   Per-entry `tiers` is the eligibility list. Simpler/shorter words ship
   for `tot` (ages 2-3) because they shout in single-syllable patterns.
   Compound silliness and gross-but-safe entries open up at little+.

   Minimum count contract (Section 17 QA gate):
     - 50+ total entries
     - 4 categories present
     - tot has ≥ 12 entries available
     - little/kid/big/tween each have ≥ 30 entries available

   Authoring rules:
     - Age-appropriate. NO actual profanity. NO bathroom shock value past
       "stinky / booger / burp" tier. NO licensed characters / celebrity
       names (the QA Section 14 blocklist applies here too).
     - Each entry must be one or two words / a short compound. Avoid full
       sentences — these are PUNCHLINE words, not phrases.
     - Prefer phonemes that read well aloud through ElevenLabs TTS.
       Avoid letter combos the narrator garbles (e.g. avoid "xz", "qq"). */
const ABSURD_WORD_BANK = {
  sillySounds: [
    { w:'glorp',     tiers:['tot','little','kid','big','tween'] },
    { w:'blorp',     tiers:['tot','little','kid','big','tween'] },
    { w:'splat',     tiers:['tot','little','kid','big','tween'] },
    { w:'boing',     tiers:['tot','little','kid','big','tween'] },
    { w:'honk',      tiers:['tot','little','kid','big','tween'] },
    { w:'squonk',    tiers:['little','kid','big','tween'] },
    { w:'plop',      tiers:['tot','little','kid','big','tween'] },
    { w:'fwoosh',    tiers:['little','kid','big','tween'] },
    { w:'kabloom',   tiers:['little','kid','big','tween'] },
    { w:'sproing',   tiers:['little','kid','big','tween'] },
    { w:'zoinks',    tiers:['kid','big','tween'] },
    { w:'bonk',      tiers:['tot','little','kid','big','tween'] },
    { w:'thwip',     tiers:['little','kid','big','tween'] },
    { w:'gloop',     tiers:['tot','little','kid','big','tween'] },
    { w:'wubba',     tiers:['little','kid','big','tween'] },
  ],
  grossButSafe: [
    // Tot is intentionally excluded from this category per design (kids
    // 2-3 don't need bathroom humor primed for them, even safe variants).
    { w:'stinky bananas',     tiers:['little','kid','big','tween'] },
    { w:'soggy sock',         tiers:['little','kid','big','tween'] },
    { w:'booger cloud',       tiers:['little','kid','big','tween'] },
    { w:'burp bubble',        tiers:['little','kid','big','tween'] },
    { w:'slime puddle',       tiers:['little','kid','big','tween'] },
    { w:'damp toast',         tiers:['kid','big','tween'] },
    { w:'mystery jelly',      tiers:['kid','big','tween'] },
    { w:'pickle juice',       tiers:['little','kid','big','tween'] },
    { w:'sneezy sandwich',    tiers:['little','kid','big','tween'] },
    { w:'crusty pretzel',     tiers:['kid','big','tween'] },
    { w:'ear cheese',         tiers:['big','tween'] },
    { w:'foot soup',          tiers:['kid','big','tween'] },
  ],
  randomObjects: [
    { w:'cheese hat',         tiers:['tot','little','kid','big','tween'] },
    { w:'rubber duck',        tiers:['tot','little','kid','big','tween'] },
    { w:'underpants helmet',  tiers:['little','kid','big','tween'] },
    { w:'Captain Noodle',     tiers:['little','kid','big','tween'] },
    { w:'tiny piano',         tiers:['tot','little','kid','big','tween'] },
    { w:'spoon hat',          tiers:['tot','little','kid','big','tween'] },
    { w:'sock puppet',        tiers:['little','kid','big','tween'] },
    { w:'moon spoon',         tiers:['kid','big','tween'] },
    { w:'pickle crown',       tiers:['little','kid','big','tween'] },
    { w:'banana phone',       tiers:['tot','little','kid','big','tween'] },
    { w:'paper crown',        tiers:['tot','little','kid','big','tween'] },
    { w:'magnet shoe',        tiers:['kid','big','tween'] },
    { w:'noodle scarf',       tiers:['little','kid','big','tween'] },
    { w:'bubble wand',        tiers:['tot','little','kid','big','tween'] },
  ],
  nonsenseCompound: [
    // Tot is excluded — compound silliness is harder for ages 2-3 to grok.
    { w:'wobble-flop',        tiers:['kid','big','tween'] },
    { w:'sneezy-pants',       tiers:['little','kid','big','tween'] },
    { w:'jiggly blorp',       tiers:['little','kid','big','tween'] },
    { w:'flumpy',             tiers:['little','kid','big','tween'] },
    { w:'snorble-doo',        tiers:['little','kid','big','tween'] },
    { w:'crinkle-bonk',       tiers:['kid','big','tween'] },
    { w:'wibble-whap',        tiers:['kid','big','tween'] },
    { w:'noodle-jumper',      tiers:['kid','big','tween'] },
    { w:'mister floof',       tiers:['little','kid','big','tween'] },
    { w:'pickle wizard',      tiers:['kid','big','tween'] },
    { w:'soggy genius',       tiers:['big','tween'] },
    { w:'fluffypants',        tiers:['little','kid','big','tween'] },
    { w:'bonkledink',         tiers:['kid','big','tween'] },
    { w:'sprongulous',        tiers:['big','tween'] },
    { w:'grumblepoof',        tiers:['little','kid','big','tween'] },
  ],
};

/* Returns up to `n` random absurd-bank entries eligible for the given tier.
   Used by buildRounds() in index.html to populate the `examples` array of
   highImpact freetext rounds so kids see absurd-flavored hints instead of
   generic ones. Pure function, no I/O. */
function absurdWordsForTier(tier, n) {
  const pool = [];
  for (const cat of Object.keys(ABSURD_WORD_BANK)) {
    for (const entry of ABSURD_WORD_BANK[cat]) {
      if (entry.tiers.includes(tier)) pool.push(entry.w);
    }
  }
  // Fisher-Yates shuffle, take first n.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}

/* Convenience: 3 absurd hint strings tier-appropriate. The default n=3
   matches the existing freetext `examples.length` so the hint-chip
   render in index.html doesn't need to change shape. */
function absurdHintsForTier(tier) {
  return absurdWordsForTier(tier, 3);
}

const BODY_HOT_OPTS = [
  {w:'fart',          e:'💨'}, {w:'poop',          e:'💩'}, {w:'butt',         e:'🍑'},
  {w:'pee',           e:'💧'}, {w:'booger',        e:'🤧'}, {w:'underpants',   e:'🩲'},
  {w:'toilet',        e:'🚽'}, {w:'snot rocket',   e:'🚀'}, {w:'swamp foot',   e:'🦶'},
  {w:'stinky armpit', e:'🧅'}, {w:'wedgie',        e:'😱'}, {w:'nostril hair', e:'👃'},
];
/* v3.0.3 — replaced bathroom-style picker options. Parent screenshot showed
   "Pick a chaotic sound" rendering PARP + PFFFFART side-by-side. User feedback:
   "they just arent good words. go with Baboom! Whammy! Crash! Toot! stuff like
   that". 12 distinct cartoon-style action sounds with distinct emojis.

   v0.9.3 · b2 — Selection Joy Pass Phase 1: this pool is now the UNIVERSAL silly-sound
   pool used by EVERY little + kid + (potty-mode) session. Previously it surfaced only
   when parent enabled Potty Word Mode; now it's the default sound-round content for
   ages 4-7 (replacing the prior freetext-by-default behavior that created typing
   friction). Kept name SOUND_HOT_OPTS to avoid breaking grep / commit history; the
   name is historical and no longer accurate. All 12 emojis must remain distinct
   (enforced by QA Section 11). */
/* v0.9.3 · b15 — ZAP! reclaimed its native lightning bolt ⚡; WHAMMY! moves to
   💫 dizzy-stars to avoid the within-pool collision. Section 11 keeps it honest. */
const SOUND_HOT_OPTS = [
  {w:'BABOOM!', e:'💥'}, {w:'WHAMMY!', e:'💫'}, {w:'CRASH!',  e:'🥁'},
  {w:'TOOT!',   e:'🎺'}, {w:'ZAP!',    e:'⚡'}, {w:'SPLAT!',  e:'💦'},
  {w:'CLANG!',  e:'🔔'}, {w:'SMASH!',  e:'🔨'}, {w:'BONK!',   e:'👊'},
  {w:'WHOOSH!', e:'🌬️'}, {w:'BWAHAHA!',e:'😂'}, {w:'KAFOOM!', e:'🎆'},
];

/* Binary rounds by tier — each round has 12 options; buildRounds() picks 2 randomly per session */
const WORD_BANK = {
  tot: [
    /* v2.4.6 — picker expansion: tot 12 → 18 per category. New entries appended below
       the original 12 in each round so existing combinations stay valid for any kid mid-session. */
    { cat: 'pet',   label: 'Pick a friend',          options: [{w:'dog',     e:'🐕'}, {w:'cat',    e:'🐈'}, {w:'fish',   e:'🐟'}, {w:'bird',   e:'🐦'}, {w:'frog',   e:'🐸'}, {w:'duck',   e:'🦆'}, {w:'bunny',  e:'🐰'}, {w:'bear',   e:'🐻'}, {w:'lamb',   e:'🐑'}, {w:'mouse',  e:'🐭'}, {w:'pig',    e:'🐷'}, {w:'cow',    e:'🐄'}, {w:'puppy',  e:'🐶'}, {w:'turtle', e:'🐢'}, {w:'chick',  e:'🐥'}, {w:'squirrel',e:'🐿️'}, {w:'pony',   e:'🐴'}, {w:'monkey', e:'🐵'}] },
    { cat: 'color', label: 'Pick a color',            options: [{w:'red',     e:'🔴'}, {w:'blue',   e:'🔵'}, {w:'pink',   e:'🌸'}, {w:'green',  e:'🌿'}, {w:'gold',   e:'🥇'}, {w:'white',  e:'⬜'}, {w:'yellow', e:'🌻'}, {w:'orange', e:'🍊'}, {w:'purple', e:'💜'}, {w:'brown',  e:'🟤'}, {w:'rainbow',e:'🌈'}, {w:'silver', e:'🥈'}, {w:'black',  e:'⚫'}, {w:'gray',   e:'🩶'}, {w:'sky blue',e:'🩵'}, {w:'lime green',e:'🍃'}, {w:'sunshine yellow',e:'☀️'}, {w:'apple red',e:'🍎'}] },
    /* v0.9.3 · b15 — jam 🍓 → strawberries 🍓 (word-emoji alignment); peas 🟢 → 🫛 (native peapod). */
    { cat: 'food',  label: 'Pick a snack',            options: [{w:'cake',    e:'🍰'}, {w:'strawberries',e:'🍓'}, {w:'milk',   e:'🥛'}, {w:'bread',  e:'🍞'}, {w:'grapes', e:'🍇'}, {w:'corn',   e:'🌽'}, {w:'apple',  e:'🍎'}, {w:'banana', e:'🍌'}, {w:'cheese', e:'🧀'}, {w:'carrot', e:'🥕'}, {w:'honey',  e:'🍯'}, {w:'cookie', e:'🍪'}, {w:'cereal', e:'🥣'}, {w:'muffin', e:'🧁'}, {w:'yogurt', e:'🥄'}, {w:'pasta',  e:'🍝'}, {w:'pancakes',e:'🥞'}, {w:'peas',   e:'🫛'}] },
    { cat: 'place', label: 'Pick a place',            options: [{w:'park',    e:'🌳'}, {w:'pond',   e:'🦆'}, {w:'farm',   e:'🐄'}, {w:'beach',  e:'🏖️'}, {w:'yard',   e:'🌻'}, {w:'hill',   e:'⛰️'}, {w:'woods',  e:'🌲'}, {w:'house',  e:'🏠'}, {w:'shop',   e:'🏪'}, {w:'bridge', e:'🌉'}, {w:'field',  e:'🌾'}, {w:'sandbox',e:'🪣'}, {w:'playground',e:'🛝'}, {w:'bedroom',e:'🛏️'}, {w:'kitchen',e:'🍽️'}, {w:'garden', e:'🌷'}, {w:'library',e:'📚'}, {w:'bus',    e:'🚌'}] },
    /* v0.9.3 · b15 — "high bubbles 🌌" → "stars 🌌" (galaxy emoji = many stars; clearer word match). */
    { cat: 'sky',   label: 'Pick something up high',  options: [{w:'sun',     e:'☀️'}, {w:'moon',   e:'🌙'}, {w:'star',   e:'⭐'}, {w:'cloud',  e:'☁️'}, {w:'kite',   e:'🪁'}, {w:'plane',  e:'✈️'}, {w:'rainbow',e:'🌈'}, {w:'balloon',e:'🎈'}, {w:'comet',  e:'☄️'}, {w:'snowflake',e:'❄️'}, {w:'butterfly',e:'🦋'}, {w:'firework',e:'🎆'}, {w:'bubbles',e:'🫧'}, {w:'rocket', e:'🚀'}, {w:'rain',   e:'🌧️'}, {w:'helicopter',e:'🚁'}, {w:'leaf',   e:'🍃'}, {w:'stars',  e:'🌌'}] },
    { cat: 'move',  label: 'Pick a wiggle',           options: [{w:'hopped',  e:'🐇'}, {w:'spun',   e:'🌀'}, {w:'ran',    e:'💨'}, {w:'marched',e:'🥁'}, {w:'jumped', e:'🦘'}, {w:'clapped',e:'👏'}, {w:'crawled',e:'🐛'}, {w:'splashed',e:'💦'},{w:'rolled', e:'⚽'}, {w:'swayed', e:'🌊'}, {w:'stomped',e:'🦶'}, {w:'wiggled',e:'🐍'}, {w:'danced', e:'💃'}, {w:'slid',   e:'🛝'}, {w:'tiptoed',e:'👣'}, {w:'bounced',e:'🏀'}, {w:'peeked', e:'👀'}, {w:'hugged', e:'🤗'}] },
  ],
  little: [
    /* v2.4.6 — picker expansion: little 12 → 18 per category. */
    /* v0.9.3 · b15 — duckling 🐥 → 🦆 (avoids chick 🐤 visual collision);
       guinea pig 🐀 (rat emoji, no Unicode for guinea pig) replaced with koala 🐨. */
    { cat: 'pet',     label: 'Choose a buddy',     options: [{w:'puppy',    e:'🐶'}, {w:'bunny',     e:'🐰'}, {w:'kitten',  e:'🐱'}, {w:'turtle',  e:'🐢'}, {w:'parrot',    e:'🦜'}, {w:'piglet',  e:'🐷'}, {w:'lamb',     e:'🐑'}, {w:'hamster',   e:'🐹'}, {w:'duckling', e:'🦆'}, {w:'hedgehog', e:'🦔'}, {w:'bear cub', e:'🐻'}, {w:'foal',     e:'🐴'}, {w:'koala',     e:'🐨'}, {w:'pony',     e:'🐎'}, {w:'seal',     e:'🦭'}, {w:'squirrel', e:'🐿️'}, {w:'baby goat',e:'🐐'}, {w:'chick',    e:'🐤'}] },
    { cat: 'color',   label: 'Choose a color',     options: [{w:'pink',     e:'🌸'}, {w:'green',     e:'🌿'}, {w:'yellow',  e:'🌻'}, {w:'orange',  e:'🍊'}, {w:'purple',    e:'💜'}, {w:'silver',  e:'🥈'}, {w:'rainbow',  e:'🌈'}, {w:'teal',      e:'🌊'}, {w:'lavender', e:'💐'}, {w:'crimson',  e:'🔴'}, {w:'golden',   e:'🥇'}, {w:'striped',  e:'🦓'}, {w:'mint green',e:'🍃'}, {w:'sky blue', e:'🩵'}, {w:'peach',    e:'🍑'}, {w:'cherry red',e:'🍒'}, {w:'sandy tan',e:'🏖️'}, {w:'leafy green',e:'🌳'}] },
    { cat: 'food',    label: 'Choose a treat',     options: [{w:'pizza',    e:'🍕'}, {w:'cookies',   e:'🍪'}, {w:'cupcakes', e:'🧁'}, {w:'grapes',  e:'🍇'}, {w:'noodles',   e:'🍜'}, {w:'popcorn', e:'🍿'}, {w:'sandwich', e:'🥪'}, {w:'waffles',   e:'🧇'}, {w:'strawberries',e:'🍓'},{w:'dumplings',e:'🥟'}, {w:'soup',     e:'🍲'}, {w:'candy',       e:'🍬'}, {w:'cereal',     e:'🥣'}, {w:'pancakes', e:'🥞'}, {w:'blueberries',e:'🫐'}, {w:'toast',    e:'🍞'}, {w:'apple slices',e:'🍎'}, {w:'mac and cheese',e:'🧀'}] },
    { cat: 'place',   label: 'Choose a spot',      options: [{w:'beach',    e:'🏖️'}, {w:'forest',    e:'🌲'}, {w:'garden',  e:'🌷'}, {w:'meadow',  e:'🌾'}, {w:'village',   e:'🏘️'}, {w:'castle',  e:'🏰'}, {w:'cave',     e:'🕳️'}, {w:'island',    e:'🏝️'}, {w:'mountain', e:'🏔️'}, {w:'river',    e:'🏞️'}, {w:'treehouse',e:'🌳'}, {w:'volcano',  e:'🌋'}, {w:'playground',e:'🛝'}, {w:'library',  e:'📚'}, {w:'classroom',e:'🏫'}, {w:'kitchen',  e:'🍽️'}, {w:'backyard', e:'🏡'}, {w:'grocery store',e:'🛒'}] },
    { cat: 'creature',label: 'Choose a creature',  options: [{w:'frog',     e:'🐸'}, {w:'fish',      e:'🐠'}, {w:'beetle',  e:'🐞'}, {w:'butterfly', e:'🦋'}, {w:'mouse',     e:'🐭'}, {w:'snail',   e:'🐌'}, {w:'owl',      e:'🦉'}, {w:'fox',       e:'🦊'}, {w:'deer',     e:'🦌'}, {w:'penguin',  e:'🐧'}, {w:'crab',     e:'🦀'}, {w:'bee',         e:'🐝'}, {w:'dragon',     e:'🐲'}, {w:'unicorn',  e:'🦄'}, {w:'robot',    e:'🤖'}, {w:'tiny monster',e:'👾'}, {w:'cloud friend',e:'☁️'}, {w:'talking tree',e:'🌳'}] },
    { cat: 'move',    label: 'Choose a move',      options: [{w:'jumped',   e:'🦘'}, {w:'danced',    e:'💃'}, {w:'wiggled', e:'🐛'}, {w:'galloped',e:'🏇'}, {w:'twirled',   e:'🌀'}, {w:'bounced', e:'🏀'}, {w:'splashed', e:'💦'}, {w:'tiptoed',   e:'👣'}, {w:'zoomed',   e:'💨'}, {w:'hopped',   e:'🐇'}, {w:'skidded',  e:'🛷'}, {w:'flopped',  e:'🐟'}, {w:'skipped',    e:'🏃'}, {w:'slid',     e:'🛝'}, {w:'peeked',   e:'👀'}, {w:'waved',    e:'👋'}, {w:'tumbled',  e:'🤸'}, {w:'floated',  e:'🫧'}] },
    { cat: 'weather', label: 'Choose the weather', options: [{w:'sunny',    e:'☀️'}, {w:'snowy',     e:'❄️'}, {w:'windy',   e:'🌬️'}, {w:'rainy',   e:'🌧️'}, {w:'cloudy',    e:'☁️'}, {w:'foggy',   e:'🌫️'}, {w:'stormy',   e:'⛈️'}, {w:'frosty',    e:'🌨️'}, {w:'breezy',   e:'🍃'}, {w:'misty',    e:'🌁'}, {w:'thundery', e:'⚡'}, {w:'glittery', e:'✨'}] },
  ],
  kid: [
    /* v2.4.6 — picker expansion: kid 18 → 24 per category. */
    /* v0.9.3 · b13 — removed "red panda 🦝" (raccoon emoji caught by user;
       regular panda 🐼 is already in this pool, so the duplicate-ish entry
       with the wrong emoji is gone). Pool drops from 24 → 23; still well
       above the 2 cards shown per session, no impact on variety. */
    /* v0.9.3 · b15 — image-word polish + replay variety:
       falcon → eagle (the 🦅 emoji is literally an eagle);
       capybara 🦫 → beaver 🦫 (beaver emoji semantically matches);
       axolotl 🐠 → goldfish (the b15 swap dropped axolotl correctly but the
         b15 comment was wrong: 🐠 is the tropical-fish emoji, not a goldfish.
         v0.9.3 · b32 corrects goldfish emoji 🐠 → 🐟 (generic fish — the only
         remaining fish option in Unicode, renders orange on Apple platforms,
         matches the word better than a striped angelfish);
       added raccoon 🦝 + goose 🪿 (clean emoji matches, fill replay variety).
       Pool 23 → 25. */
    { cat: 'pet',     label: 'Pick your sidekick',   options: [{w:'dragon',    e:'🐲',s:['somewhere_weird']}, {w:'panda',     e:'🐼',s:['animal_place']}, {w:'parrot',    e:'🦜',s:['animal_place']}, {w:'tiger',     e:'🐯',s:['animal_place']}, {w:'penguin',   e:'🐧',s:['animal_place']}, {w:'eagle',     e:'🦅',s:['outside','animal_place']}, {w:'wolf',      e:'🐺',s:['outside']}, {w:'otter',     e:'🦦',s:['animal_place','outside']}, {w:'lynx',      e:'🐱',s:['outside']}, {w:'fennec fox',e:'🦊',s:['animal_place','outside']}, {w:'unicorn',   e:'🦄',s:['somewhere_weird']}, {w:'beaver',    e:'🦫',s:['outside','animal_place']}, {w:'octopus',   e:'🐙',s:['animal_place']}, {w:'hedgehog',  e:'🦔',s:['animal_place']}, {w:'goldfish',  e:'🐠',s:['animal_place','at_home']}, {w:'llama',     e:'🦙',s:['animal_place']}, {w:'sloth',     e:'🦥',s:['animal_place']}, {w:'koala',     e:'🐨',s:['animal_place']}, {w:'chameleon', e:'🦎',s:['animal_place']}, {w:'crow',      e:'🐦‍⬛',s:['outside','on_the_go']}, {w:'hamster',   e:'🐹',s:['animal_place','at_home']}, {w:'duckling',  e:'🐥',s:['outside','animal_place']}, {w:'turtle',    e:'🐢',s:['animal_place']}, {w:'raccoon',   e:'🦝',s:['outside','on_the_go']}, {w:'goose',     e:'🪿',s:['outside','animal_place']}] },
    { cat: 'color',   label: 'Pick a color',          options: [{w:'purple',    e:'🟣'}, {w:'rainbow',   e:'🌈'}, {w:'golden',    e:'🥇'}, {w:'scarlet',   e:'🔴'}, {w:'silver',    e:'🥈'}, {w:'teal',      e:'🦚'}, {w:'neon',      e:'💚'}, {w:'pitch black',e:'🖤'}, {w:'electric blue',e:'⚡'},{w:'moss green', e:'🌿'}, {w:'burnt orange',e:'🍊'},{w:'rose gold',  e:'🌸'}, {w:'tomato red', e:'🍅'}, {w:'lemon yellow',e:'🍋'},{w:'watermelon pink',e:'🍉'},{w:'mint green',e:'🍃'},{w:'sunset orange',e:'🌅'},{w:'midnight blue',e:'🌌'}] },
    /* v0.9.3 · b15 — nachos 🫓 → quesadilla 🫓 (the 🫓 flatbread emoji reads as a tortilla,
       not nachos). Added fried chicken 🍗 (chose "fried chicken" over user's "chicken nuggets"
       since 🍗 is poultry leg — accurate to fried chicken / drumstick, not nuggets);
       smoothie 🧋 (boba emoji is a smoothie cousin; milkshake 🥤 already taken);
       warm croissant 🥐 (chose "warm croissant" over user's "cinnamon roll" since 🥐 is a
       croissant emoji — accurate to croissant, not a cinnamon roll). Pool 24 → 27. */
    { cat: 'food',    label: 'Pick a snack',           options: [{w:'tacos',     e:'🌮',s:['food_place']}, {w:'donuts',    e:'🍩',s:['food_place']}, {w:'quesadilla',e:'🫓',s:['food_place']}, {w:'sushi',     e:'🍣',s:['food_place']}, {w:'waffles',   e:'🧇',s:['at_home']}, {w:'pizza',     e:'🍕',s:['food_place']}, {w:'ramen',     e:'🍜',s:['food_place']}, {w:'burritos',  e:'🌯',s:['food_place']}, {w:'dumplings', e:'🥟',s:['food_place']}, {w:'ice cream', e:'🍦',s:['food_place','outside']}, {w:'pretzels',  e:'🥨',s:['on_the_go']}, {w:'grilled cheese',e:'🥪',s:['at_home']}, {w:'spaghetti', e:'🍝'}, {w:'popcorn',   e:'🍿',s:['outside']}, {w:'hot dogs',  e:'🌭',s:['food_place','outside','on_the_go']}, {w:'pancakes',  e:'🥞',s:['at_home']}, {w:'cupcakes',  e:'🧁',s:['at_home']}, {w:'french fries',e:'🍟',s:['food_place']}, {w:'milkshake', e:'🥤',s:['food_place']}, {w:'cereal',    e:'🥣',s:['at_home','at_school']}, {w:'garlic bread',e:'🥖'}, {w:'pickles',   e:'🥒'}, {w:'cheese puffs',e:'🧀'}, {w:'birthday cake',e:'🎂'}, {w:'fried chicken',e:'🍗',s:['food_place']}, {w:'smoothie',  e:'🧋',s:['food_place']}, {w:'warm croissant',e:'🥐',s:['food_place']}] },
    /* v0.9.3 · b15 — lighthouse 🗼 → tower 🗼 (🗼 is Tokyo Tower, generic "tower" matches better).
       Added arcade 🕹️, pizza shop 🍕, water park 💦, movie theater 🎬. Pool 24 → 28. */
    { cat: 'place',   label: 'Pick a location',        options: [{w:'jungle',    e:'🌴',s:['outside','animal_place']}, {w:'castle',    e:'🏰',s:['somewhere_weird']}, {w:'cavern',    e:'🕳️',s:['outside']}, {w:'forest',    e:'🌲',s:['outside','animal_place']}, {w:'meadow',    e:'🌾',s:['outside']}, {w:'canyon',    e:'🏞️',s:['outside']}, {w:'volcano',   e:'🌋',s:['outside']}, {w:'maze',      e:'🧩',s:['somewhere_weird']}, {w:'shipwreck', e:'⚓'}, {w:'glacier',   e:'🧊',s:['outside']}, {w:'rooftop',   e:'🏙️',s:['on_the_go']}, {w:'desert',    e:'🏜️',s:['outside']}, {w:'treehouse', e:'🌳',s:['outside']}, {w:'tower',     e:'🗼',s:['somewhere_weird']}, {w:'carnival',  e:'🎡',s:['outside']}, {w:'aquarium',  e:'🐠',s:['animal_place']}, {w:'planetarium',e:'🪐',s:['somewhere_weird']},{w:'bakery',    e:'🥐',s:['food_place']}, {w:'school cafeteria',e:'🏫',s:['at_school']}, {w:'grocery store',e:'🛒',s:['food_place']}, {w:'diner',     e:'🍔',s:['food_place']}, {w:'mall',      e:'🛍️',s:['on_the_go']}, {w:'bus stop',  e:'🚌',s:['on_the_go']}, {w:'playground',e:'🛝',s:['at_school','outside']}, {w:'arcade',    e:'🕹️',s:['on_the_go']}, {w:'pizza shop',e:'🍕',s:['food_place']}, {w:'water park',e:'💦',s:['outside']}, {w:'movie theater',e:'🎬',s:['on_the_go']}] },
    /* v0.9.3 · b15 — giant 🗿 → stone giant 🗿 (matches moai-face emoji);
       phoenix 🔥 → fire bird (kid-friendly word);
       centaur 🐎 → talking horse 🐎 (more age-6 friendly per user spec).
       Added sock monster 🧦, tiny wizard 🪄, backpack troll 🎒. Pool 24 → 27.
       v0.9.3 · b29 — fire bird emoji upgraded 🔥 → 🐦‍🔥 (Unicode 15.1
       phoenix ZWJ, supported on iOS 17.4+, Android 14+, Win11 24H2+,
       macOS Sonoma 14.4+). On older OS the emoji falls back to 🐦 + 🔥
       rendered side-by-side, which still reads as fire bird. */
    { cat: 'creature',label: 'Pick a creature',        options: [{w:'robot',     e:'🤖',s:['somewhere_weird']}, {w:'mermaid',   e:'🧜',s:['somewhere_weird','animal_place']}, {w:'wizard',    e:'🧙',s:['somewhere_weird']}, {w:'pirate',    e:'🏴‍☠️'}, {w:'ninja',     e:'🥷'}, {w:'goblin',    e:'👺',s:['outside']}, {w:'knight',    e:'⚔️'}, {w:'alien',     e:'👽',s:['somewhere_weird']}, {w:'witch',     e:'🧙‍♀️',s:['somewhere_weird']}, {w:'stone giant',e:'🗿',s:['somewhere_weird']}, {w:'ghost',     e:'👻'}, {w:'troll',     e:'🧌',s:['outside']}, {w:'vampire',   e:'🧛'}, {w:'fairy',     e:'🧚',s:['outside']}, {w:'dinosaur',  e:'🦖',s:['outside','animal_place']}, {w:'fire bird', e:'🐦‍🔥',s:['somewhere_weird','outside']}, {w:'talking horse',e:'🐎',s:['outside','animal_place']}, {w:'yeti',      e:'🐻‍❄️',s:['outside','somewhere_weird']}, {w:'talking sandwich',e:'🥪',s:['food_place']}, {w:'substitute teacher',e:'🧑‍🏫',s:['at_school']}, {w:'lunch wizard',e:'🍱',s:['at_school','food_place']}, {w:'hallway ghost',e:'🚪',s:['at_school']}, {w:'tiny king', e:'👑',s:['somewhere_weird']}, {w:'grumpy cloud',e:'☁️',s:['outside','somewhere_weird']}, {w:'sock monster',e:'🧦',s:['at_home']}, {w:'tiny wizard',e:'🪄',s:['somewhere_weird']}, {w:'backpack troll',e:'🎒',s:['at_school']}] },
    { cat: 'move',    label: 'Pick a move',            options: [{w:'zoomed',    e:'⚡'}, {w:'tiptoed',   e:'👣'}, {w:'bounced',   e:'🏀'}, {w:'spun',      e:'🌀'}, {w:'leapt',     e:'🦘'}, {w:'galloped',  e:'🏇'}, {w:'tumbled',   e:'🤸'}, {w:'glided',    e:'🪂'}, {w:'charged',   e:'🐂'}, {w:'crept',     e:'🐛'}, {w:'soared',    e:'🦅'}, {w:'skated',    e:'⛸️'}, {w:'shimmied',  e:'🎵'}, {w:'wobbled',   e:'🌊'}, {w:'marched',   e:'🥁'}, {w:'stomped',   e:'🦶'}, {w:'danced',    e:'💃'}, {w:'sprinted',  e:'🏃'}, {w:'cartwheeled',e:'🛞'}, {w:'slid',      e:'🛝'}, {w:'zigzagged', e:'🪃'}, {w:'moonwalked',e:'🕺'}, {w:'belly-flopped',e:'💦'}, {w:'shuffled',  e:'🚶'}] },
    /* v0.9.3 · b15 — "professionally confused 🤔" → "puzzled 🧩" (age-6 friendly +
       puzzle-piece emoji matches the word); "jubilant 🎉" → "super happy 😄" (age-6
       readable; emoji upgraded to grinning face which matches the word better than the
       generic celebration popper). Added curious 🔍 + worried 😟. Pool 24 → 26. */
    { cat: 'mood',    label: 'Pick a feeling',         options: [{w:'silly',     e:'🤪'}, {w:'sneaky',    e:'🕵️'}, {w:'brave',     e:'🦁'}, {w:'goofy',     e:'🎪'}, {w:'spooky',    e:'👻'}, {w:'grumpy',    e:'😤'}, {w:'wobbly',    e:'🫨'}, {w:'dramatic',  e:'🎭'}, {w:'mysterious',e:'🌙'}, {w:'determined',e:'💪',s:['at_school']}, {w:'clumsy',    e:'🤦'}, {w:'legendary', e:'🏆'}, {w:'cozy',      e:'🥰',s:['at_home']}, {w:'polite',e:'🎩'},{w:'puzzled',e:'🧩',s:['at_school']},{w:'ridiculously cheerful',e:'🌟'},{w:'sleepy',    e:'😴',s:['at_home']}, {w:'super happy',e:'😄'}, {w:'snacky',    e:'🍿',s:['food_place','outside']}, {w:'confused',  e:'😵‍💫'}, {w:'overexcited',e:'🤩'}, {w:'suspicious',e:'🤨'}, {w:'extra brave',e:'🛡️'}, {w:'secretly proud',e:'😌'}, {w:'curious',   e:'🔍',s:['at_school','animal_place']}, {w:'worried',   e:'😟',s:['at_school']}] },
  ],
  big: [
    /* v2.4.6 — picker expansion: big 12 → 18 per category. */
    /* v0.9.3 · b15 — "overly formal ferret 🦦" → "overly formal otter 🦦" (no ferret emoji
       exists; otter matches the emoji). Added tiny horse 🐴. Pool 18 → 19. */
    { cat: 'pet',     label: 'Pick your companion',   options: [{w:'mischievous fox',         e:'🦊'}, {w:'glittering octopus',     e:'🐙'}, {w:'ancient tortoise',      e:'🐢'}, {w:'bewildered penguin',    e:'🐧'}, {w:'melodramatic cat',      e:'🐱'}, {w:'philosophical owl',     e:'🦉'}, {w:'imperious corgi',       e:'👑'}, {w:'overconfident raccoon', e:'🦝'}, {w:'anxious hedgehog',      e:'🦔'}, {w:'exasperated flamingo',  e:'🦩'}, {w:'suspicious seagull',    e:'🐦'}, {w:'theatrical moth',       e:'🦋'}, {w:'overly formal otter',   e:'🦦'}, {w:'dramatic lizard',       e:'🦎'}, {w:'suspicious duck',       e:'🦆'}, {w:'tiny alpaca',           e:'🦙'}, {w:'retired dragon',        e:'🐲'}, {w:'nervous goose',         e:'🪿'}, {w:'tiny horse',            e:'🐴'}] },
    /* v0.9.3 · b15 — "violently pleasant blue 🔵" → "wildly pleasant blue 🔵" (less
       jarring word; emoji unchanged). Pool 18 → 18. */
    { cat: 'color',   label: 'Pick a wild color',     options: [{w:'shimmering gold',         e:'✨'}, {w:'electric violet',        e:'⚡'}, {w:'deep crimson',          e:'🔴'}, {w:'luminous teal',         e:'🌊'}, {w:'faded amber',           e:'🍂'}, {w:'impossible green',      e:'🌿'}, {w:'impossible orange',     e:'🍊'}, {w:'eerie periwinkle',      e:'🟣'}, {w:'wildly pleasant blue',  e:'🔵'},{w:'suspiciously beige',    e:'🟤'}, {w:'strangely familiar gray',e:'🩶'},{w:'obviously red',         e:'❤️'}, {w:'forgotten gray',         e:'🪨'}, {w:'lunchbox yellow',       e:'🟨'}, {w:'cafeteria green',       e:'🥗'}, {w:'gym sock white',        e:'🧦'}, {w:'recess orange',         e:'🟠'}, {w:'permission slip blue',  e:'📘'}] },
    /* v0.9.3 · b15 — "haunted scones 🫖" → "haunted tea 🫖" (teapot emoji matches tea, not
       scones); "ancient granola bar 🥣" → "ancient snack bar 🍫" (chocolate bar emoji
       matches "snack bar" better than the cereal-bowl 🥣); "official pudding 🥧" → "official
       pie 🥧" (pie emoji is literally pie; user wanted 🍮 for pudding, but overconfident
       pudding 🍮 already takes that — renaming the word side preserves uniqueness).
       Added emergency burrito 🌯, courtroom cupcake 🧁, mystery smoothie 🥤. Pool 18 → 21. */
    { cat: 'food',    label: 'Pick a peculiar snack', options: [{w:'enchanted pickles',       e:'🥒'}, {w:'thunder pancakes',       e:'🥞'}, {w:'suspicious sandwiches', e:'🥪'}, {w:'bewildering cookies',   e:'🍪'}, {w:'haunted tea',           e:'🫖'}, {w:'legendary soup',        e:'🍲'}, {w:'suspicious casserole',  e:'🍱'}, {w:'haunted macaroni',      e:'🍝'}, {w:'ancient snack bar',     e:'🍫'}, {w:'overconfident pudding', e:'🍮'}, {w:'mysterious leftovers',  e:'🥡'}, {w:'extremely bold lasagna',e:'🥘'}, {w:'ceremonial nachos',     e:'🧀'}, {w:'forbidden waffles',     e:'🧇'}, {w:'emergency noodles',     e:'🍜'}, {w:'aggressively normal toast',e:'🍞'}, {w:'suspicious fruit salad',e:'🍓'}, {w:'official pie',          e:'🥧'}, {w:'emergency burrito',     e:'🌯'}, {w:'courtroom cupcake',     e:'🧁'}, {w:'mystery smoothie',      e:'🥤'}] },
    /* v0.9.3 · b15 — added school office 🏢 (used office-building emoji since 🏫 was already
       taken by cafeteria of mysteries), mini golf course ⛳, roller rink 🛼, science museum 🔬.
       Pool 18 → 22. */
    { cat: 'place',   label: 'Pick a setting',        options: [{w:'mossy labyrinth',         e:'🌿'}, {w:'cloud observatory',      e:'☁️'}, {w:'sunken ballroom',       e:'🏊'}, {w:'forgotten attic',       e:'🕯️'}, {w:'luminous swamp',        e:'🌙'}, {w:'ancient library',       e:'📚'}, {w:'collapsing lighthouse', e:'🏚️'}, {w:'underground ballroom',  e:'🎭'}, {w:'partially flooded tower',e:'🌊'},{w:'extremely long corridor',e:'🚶'},{w:'theoretical basement',  e:'🏠'}, {w:'spectacularly average hallway',e:'🚪'}, {w:'cafeteria of mysteries',e:'🏫'}, {w:'suspiciously quiet mall',e:'🛍️'}, {w:'museum basement',       e:'🏛️'}, {w:'indoor water park',     e:'💦'}, {w:'bus depot',             e:'🚌'}, {w:'grocery aisle seven',   e:'🛒'}, {w:'school office',         e:'🏢'}, {w:'mini golf course',      e:'⛳'}, {w:'roller rink',           e:'🛼'}, {w:'science museum',        e:'🔬'}] },
    /* v0.9.3 · b15 — added tiny judge ⚖️, confused mascot 🐻. Pool 18 → 20. */
    { cat: 'creature',label: 'Pick a creature',       options: [{w:'grumbling gargoyle',      e:'🗿'}, {w:'sparkly squid',          e:'🦑'}, {w:'bewildered sphinx',     e:'🏛️'}, {w:'philosophical crab',    e:'🦀'}, {w:'melodramatic ghost',    e:'👻'}, {w:'indignant mushroom',    e:'🍄'}, {w:'suspicious accountant', e:'💼'}, {w:'deeply committed scarecrow',e:'🌾'},{w:'partially trained wizard',e:'🧙'},{w:'overqualified fish',    e:'🐟'}, {w:'concerned librarian',   e:'📚'}, {w:'accidental prophet',    e:'🔮'}, {w:'substitute principal',  e:'🧑‍🏫'}, {w:'retired wizard',        e:'🪄'}, {w:'tiny mayor',            e:'👑'}, {w:'snack inspector',       e:'🕵️'}, {w:'confused dragon',       e:'🐲'}, {w:'courtroom duck',        e:'🦆'}, {w:'tiny judge',            e:'⚖️'}, {w:'confused mascot',       e:'🐻'}] },
    /* v0.9.3 · b15 — duplicate word "shuffled with purpose 🥾" renamed to "marched
       stubbornly 🥾" (boots emoji matches stomping/marching). Added posed dramatically 🎭,
       slid heroically 🛝, stared bravely 👀. Pool 18 → 21. */
    { cat: 'move',    label: 'Pick a verb',           options: [{w:'cartwheeled',             e:'🤸'}, {w:'tiptoed cautiously',     e:'👣'}, {w:'stumbled dramatically', e:'💫'}, {w:'waltzed accidentally',  e:'💃'}, {w:'skipped solemnly',      e:'🎵'}, {w:'meandered thoughtfully',e:'🌀'}, {w:'tripped magnificently', e:'💥'}, {w:'spun ceremoniously',    e:'🌪️'}, {w:'reversed unexpectedly', e:'↩️'}, {w:'shuffled importantly',  e:'🚶'}, {w:'scuttled with purpose', e:'🦀'}, {w:'fell upward somehow',   e:'⬆️'}, {w:'moonwalked carefully',  e:'🕺'}, {w:'lurched heroically',    e:'🦸'}, {w:'marched stubbornly',    e:'🥾'}, {w:'flailed politely',      e:'👋'}, {w:'sprinted incorrectly',  e:'🏃'}, {w:'hovered suspiciously',  e:'🛸'}, {w:'posed dramatically',    e:'🎭'}, {w:'slid heroically',       e:'🛝'}, {w:'stared bravely',        e:'👀'}] },
    { cat: 'mood',    label: 'Pick a vibe',           options: [{w:'absolutely bonkers',      e:'🤪'}, {w:'mysteriously calm',      e:'🌙'}, {w:'formally ridiculous',   e:'🎩'}, {w:'suspiciously cheerful', e:'😊'}, {w:'gravely unimpressed',   e:'😒'}, {w:'accidentally heroic',   e:'🦸'}, {w:'deeply unimpressed',    e:'😑'}, {w:'heroically mediocre',   e:'🏅'}, {w:'surprisingly enthusiastic',e:'🎉'},{w:'professionally confused',e:'🤔'},{w:'thoughtfully menacing', e:'😏'}, {w:'gloriously incorrect',  e:'💯'}, {w:'deeply snack-motivated',e:'🍿'}, {w:'quietly heroic',        e:'🕯️'}, {w:'suspiciously prepared', e:'🎒'}, {w:'mildly legendary',      e:'🏆'}, {w:'extremely unconvinced', e:'🙄'}, {w:'accidentally important',e:'📋'}] },
  ],
  /* v2.4.6 — picker expansion: tween 12 → 18 per category. */
  tween: [
    /* v0.9.3 · b13 — "red panda 🦊" (fox emoji) replaced with regular "panda 🐼"
       per same audit pass that removed kid.pet's red panda. Tween had no
       regular panda entry; this adds one. Pool count unchanged at 18. */
    /* v0.9.3 · b15 — quokka 🐨 → koala 🐨 (no quokka emoji exists; koala matches);
       sleepy gecko 🐊 → sleepy croc 🐊 (croc emoji is literally a crocodile;
       chameleon 🦎 already takes the lizard emoji so renaming the word side is the
       only collision-safe path). Added judgy cat 🐱. Pool 18 → 19. */
    { cat: 'pet',     label: 'Pick your sidekick',    options: [{w:'capybara',     e:'🦫'}, {w:'crow',           e:'🐦‍⬛'}, {w:'panda',        e:'🐼'}, {w:'hamster',      e:'🐹'}, {w:'axolotl',      e:'🫧'}, {w:'chameleon',    e:'🦎'}, {w:'raccoon',      e:'🦝'}, {w:'mantis shrimp',e:'🦐'}, {w:'rat',          e:'🐀'}, {w:'pigeon',       e:'🐦'}, {w:'koala',        e:'🐨'}, {w:'tardigrade',   e:'🦠'}, {w:'judgmental duck',e:'🦆'}, {w:'sleepy croc', e:'🐊'}, {w:'tiny possum',  e:'🐾'}, {w:'overthinking ferret',e:'🦦'}, {w:'dramatic goldfish',e:'🐟'}, {w:'chaotic goose',e:'🪿'}, {w:'judgy cat',    e:'🐱'}] },
    { cat: 'color',   label: 'Pick your aesthetic',   options: [{w:'neon green',   e:'💚'}, {w:'void black',     e:'🖤'}, {w:'burnt orange', e:'🧡'}, {w:'dusty rose',   e:'🌸'}, {w:'electric yellow',e:'⚡'}, {w:'midnight blue',e:'🌌'}, {w:'moss green',   e:'🌿'}, {w:'acid yellow',  e:'💛'}, {w:'deep purple',  e:'💜'}, {w:'washed out gray',e:'🩶'},{w:'rust orange',  e:'🍂'}, {w:'iridescent',   e:'🌈'}, {w:'bleached denim',e:'👖'}, {w:'mall food court orange',e:'🍊'}, {w:'parking lot gray',e:'🚗'}, {w:'highlighter pink',e:'💗'}, {w:'gas station green',e:'⛽'}, {w:'late bus yellow',e:'🚌'}] },
    /* v0.9.3 · b15 — mystery chips 🍟 → mystery snack bag 🛍️ (frees 🍟 for the more
       accurate cafeteria fries 🍟 rename; chips=fries in British/American confusion);
       vending machine chips 🥨 → vending machine pretzels 🥨 (pretzel emoji is accurate);
       cafeteria fries 🥔 → cafeteria fries 🍟 (now the actual fries emoji).
       Added gas station taquitos 🌯, leftover pasta 🍝. Pool 18 → 20. */
    { cat: 'food',    label: 'Pick a snack',          options: [{w:'instant noodles',e:'🍜'}, {w:'cold pizza',   e:'🍕'}, {w:'sour candy',   e:'🍬'}, {w:'boba tea',     e:'🧋'}, {w:'hot sauce',    e:'🌶️'}, {w:'energy drink', e:'⚡'}, {w:'gas station sushi',e:'🍣'},{w:'cereal at midnight',e:'🥣'},{w:'mystery snack bag',e:'🛍️'}, {w:'sad granola bar',e:'🍫'}, {w:'third coffee', e:'☕'}, {w:'everything bagel',e:'🥯'}, {w:'vending machine pretzels',e:'🥨'}, {w:'cafeteria fries',e:'🍟'}, {w:'emergency ramen',e:'🥡'}, {w:'suspicious smoothie',e:'🥤'}, {w:'leftover birthday cake',e:'🎂'}, {w:'gas station nachos',e:'🧀'}, {w:'gas station taquitos',e:'🌯'}, {w:'leftover pasta',e:'🍝'}] },
    /* v0.9.3 · b15 — added mall elevator 🛗 (the elevator emoji is accurate to "elevator"
       even though user suggested "escalator"; escalator is 🚇 or 🛗 depending; elevator
       word matches the emoji exactly), empty movie theater 🎬, forgotten hallway 🚪.
       Pool 18 → 21. */
    { cat: 'place',   label: 'Pick a location',       options: [{w:'abandoned mall',e:'🏚️'}, {w:'rooftop',      e:'🏙️'}, {w:'skatepark',    e:'🛹'}, {w:'arcade',       e:'🕹️'}, {w:'bus stop',     e:'🚏'}, {w:'parking garage',e:'🚗'}, {w:'library at closing time',e:'📚'},{w:'empty school hallway',e:'🏫'},{w:'convenience store',e:'🏪'},{w:'slightly wrong neighborhood',e:'🗺️'},{w:'back of the bus',e:'🚌'},{w:'someone else\'s backyard',e:'🌿'}, {w:'school cafeteria',e:'🍱'}, {w:'mall food court',e:'🛍️'}, {w:'drama hallway',e:'🎭'}, {w:'late bus',     e:'⏰'}, {w:'weird stairwell',e:'🪜'}, {w:'gym bleachers',e:'🏀'}, {w:'mall elevator',e:'🛗'}, {w:'empty movie theater',e:'🎬'}, {w:'forgotten hallway',e:'🚪'}] },
    /* v0.9.3 · b15 — "unreasonably tall pigeon 🪿" → "unreasonably tall goose 🪿"
       (🪿 is goose, not pigeon; renaming the word side fixes the mismatch).
       Added algorithm ghost 🧠 (brain emoji = "the algorithm's mind"; 📱 already taken
       by group chat ghost), expired mascot 🪦 (headstone = "expired"; matches the word),
       vending machine oracle 🥠 (fortune cookie matches "oracle" + vending vibe; 🔮
       already taken by cafeteria oracle), cafeteria cryptid 👽 (alien emoji works as
       a cryptid; 👁️ already taken by the generic "cryptid"). Pool 18 → 22. */
    { cat: 'creature',label: 'Pick a creature',       options: [{w:'cryptid',      e:'👁️'}, {w:'gremlin',      e:'👺'}, {w:'discount vampire',e:'🧛'}, {w:'feral librarian',e:'📚'}, {w:'shadow entity',e:'🌑'}, {w:'sentient vending machine',e:'🤖'},{w:'stressed barista',e:'☕'},{w:'mysterious substitute teacher',e:'🎓'},{w:'aggressively normal pigeon',e:'🐦'},{w:'wifi ghost',e:'📶'},{w:'unreasonably tall goose',e:'🪿'},{w:'very confident rat',e:'🐀'}, {w:'hallway monitor',e:'🪪'}, {w:'overconfident mascot',e:'🐻'}, {w:'group chat ghost',e:'📱'}, {w:'cafeteria oracle',e:'🔮'}, {w:'substitute coach',e:'🏈'}, {w:'vending machine goblin',e:'🛒'}, {w:'algorithm ghost',e:'🧠'}, {w:'expired mascot',e:'🪦'}, {w:'vending machine oracle',e:'🥠'}, {w:'cafeteria cryptid',e:'👽'}] },
    { cat: 'move',    label: 'Pick an action',        options: [{w:'dramatically sighed',e:'😮‍💨'}, {w:'speed-ran', e:'💨'}, {w:'casually yeeted everything',e:'🏌️'}, {w:'existentially paused',e:'🫠'}, {w:'chaotically bolted',e:'💥'}, {w:'mysteriously vanished',e:'🌫️'},{w:'gracefully bailed',e:'🫣'},{w:'aggressively scrolled',e:'📱'},{w:'passive-aggressively waved',e:'👋'},{w:'reluctantly arrived',e:'🚪'},{w:'took a long sip and stared',e:'☕'},{w:'nodded knowingly',e:'😌'}, {w:'awkwardly hovered',e:'🧍'}, {w:'rage-walked',e:'🚶'}, {w:'blinked dramatically',e:'👀'}, {w:'panicked quietly',e:'😶'}, {w:'speed-walked nowhere',e:'🏃'}, {w:'stared into the middle distance',e:'😐'}] },
    /* v0.9.3 · b15 — added quietly panicking 😬 (grimace; 😶 already taken by menacingly
       chill), deeply over it 🙄 (eye-roll matches the over-it vibe), weirdly optimistic 🤗
       (hugging face), minorly iconic 💅 (nail-polish = tween iconography). Pool 18 → 22. */
    { cat: 'mood',    label: 'Pick a vibe',           options: [{w:'chronically online',e:'📱'}, {w:'suspiciously unbothered',e:'😌'}, {w:'barely functional',e:'☕'}, {w:'terminally curious',e:'🔍'}, {w:'aggressively normal',e:'🙂'}, {w:'weirdly proud',e:'😤'}, {w:'main character energy',e:'✨'},{w:'NPC behavior',e:'🤖'}, {w:'menacingly chill',e:'😶'}, {w:'lowkey feral',e:'🐺'}, {w:'professionally unhinged',e:'💼'},{w:'catastrophically fine',e:'🔥'}, {w:'socially exhausted',e:'😮‍💨'}, {w:'suspiciously calm',e:'🧘'}, {w:'weirdly invested',e:'👀'}, {w:'pre-annoyed', e:'😑'}, {w:'snack-driven',e:'🍿'}, {w:'emotionally buffering',e:'⏳'}, {w:'quietly panicking',e:'😬'}, {w:'deeply over it',e:'🙄'}, {w:'weirdly optimistic',e:'🤗'}, {w:'minorly iconic',e:'💅'}] },
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
    /* v2.10.2 — replaced 'STABBY-STAB!' and 'EAT MY BOOT!' which appeared as visible
       prompt examples to children. Critical defect: violent/weapon-adjacent language
       has no place in a bedtime story app for ages 6-7. Replacements are age-appropriate
       knight-themed exclamations. */
    { type: 'freetext', cat: 'freeword', subtype: 'shout', label: "Invent a battle cry for a tiny knight.",        examples: ['ONWARD!', 'TO THE CASTLE!', 'FOR HONOR!'] },
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
    /* v2.10.2 — replaced 'floorstab' (contained 'stab' root) per Critical defect cleanup.
       'brick agony' is hyperbolic but acceptable big-tier voice. */
    { type: 'freetext', cat: 'freeword2', label: "Invent a word for the feeling of stepping on a lego.",    examples: ['scream-stomp', 'ouch-mageddon', 'brick agony'] },
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
