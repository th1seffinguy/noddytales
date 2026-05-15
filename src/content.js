/* ================================================================
   NoddyTales — Content data
   Edit this file to change words, prompts, or round order.
   Story template logic lives in index.html (buildStory).
   ================================================================ */

const APP_VERSION = 'v1.5.0';

/* Binary rounds by tier — each round has 6 options; buildRounds() picks 2 randomly per session */
const WORD_BANK = {
  tot: [
    { cat: 'pet',   label: 'Pick a friend',          options: [{w:'dog',   e:'🐕'}, {w:'cat',   e:'🐈'}, {w:'fish',  e:'🐟'}, {w:'bird',  e:'🐦'}, {w:'frog',  e:'🐸'}, {w:'duck',  e:'🦆'}] },
    { cat: 'color', label: 'Pick a color',            options: [{w:'red',   e:'🔴'}, {w:'blue',  e:'🔵'}, {w:'pink',  e:'🌸'}, {w:'green', e:'🌿'}, {w:'gold',  e:'🌟'}, {w:'white', e:'⬜'}] },
    { cat: 'food',  label: 'Pick a snack',            options: [{w:'cake',  e:'🍰'}, {w:'jam',   e:'🍓'}, {w:'milk',  e:'🥛'}, {w:'bread', e:'🍞'}, {w:'grapes',e:'🍇'}, {w:'corn',  e:'🌽'}] },
    { cat: 'place', label: 'Pick a place',            options: [{w:'park',  e:'🌳'}, {w:'pond',  e:'🦆'}, {w:'farm',  e:'🐄'}, {w:'beach', e:'🏖️'}, {w:'yard',  e:'🌻'}, {w:'hill',  e:'⛰️'}] },
    { cat: 'sky',   label: 'Pick something up high',  options: [{w:'sun',   e:'☀️'}, {w:'moon',  e:'🌙'}, {w:'star',  e:'⭐'}, {w:'cloud', e:'☁️'}, {w:'kite',  e:'🪁'}, {w:'plane', e:'✈️'}] },
    { cat: 'move',  label: 'Pick a wiggle',           options: [{w:'hop',   e:'🐇'}, {w:'spin',  e:'🌀'}, {w:'run',   e:'💨'}, {w:'skip',  e:'🌈'}, {w:'jump',  e:'🦘'}, {w:'clap',  e:'👏'}] },
  ],
  little: [
    { cat: 'pet',     label: 'Choose a buddy',     options: [{w:'puppy',  e:'🐶'}, {w:'bunny',   e:'🐰'}, {w:'kitten', e:'🐱'}, {w:'turtle', e:'🐢'}, {w:'parrot',  e:'🦜'}, {w:'piglet', e:'🐷'}] },
    { cat: 'color',   label: 'Choose a color',     options: [{w:'pink',   e:'🌸'}, {w:'green',   e:'🌿'}, {w:'yellow', e:'🌻'}, {w:'orange', e:'🍊'}, {w:'purple',  e:'💜'}, {w:'silver', e:'🌟'}] },
    { cat: 'food',    label: 'Choose a treat',     options: [{w:'pizza',  e:'🍕'}, {w:'cookies', e:'🍪'}, {w:'muffins',e:'🧁'}, {w:'grapes', e:'🍇'}, {w:'noodles', e:'🍜'}, {w:'popcorn',e:'🍿'}] },
    { cat: 'place',   label: 'Choose a spot',      options: [{w:'beach',  e:'🏖️'}, {w:'forest',  e:'🌲'}, {w:'garden', e:'🌷'}, {w:'meadow', e:'🌾'}, {w:'village', e:'🏘️'}, {w:'castle', e:'🏰'}] },
    { cat: 'creature',label: 'Choose a creature',  options: [{w:'frog',   e:'🐸'}, {w:'fish',    e:'🐠'}, {w:'beetle', e:'🐞'}, {w:'turtle', e:'🐢'}, {w:'rabbit',  e:'🐰'}, {w:'snail',  e:'🐌'}] },
    { cat: 'move',    label: 'Choose a move',      options: [{w:'jump',   e:'🦘'}, {w:'dance',   e:'💃'}, {w:'wiggle', e:'🐛'}, {w:'gallop', e:'🏇'}, {w:'twirl',   e:'🌀'}, {w:'bounce', e:'⚡'}] },
    { cat: 'weather', label: 'Choose the weather', options: [{w:'sunny',  e:'☀️'}, {w:'snowy',   e:'❄️'}, {w:'windy',  e:'🌬️'}, {w:'rainy',  e:'🌧️'}, {w:'cloudy',  e:'☁️'}, {w:'foggy',  e:'🌫️'}] },
  ],
  kid: [
    { cat: 'pet',     label: 'Pick your sidekick',   options: [{w:'dragon',  e:'🐲'}, {w:'panda',   e:'🐼'}, {w:'parrot',  e:'🦜'}, {w:'tiger',   e:'🐯'}, {w:'penguin', e:'🐧'}, {w:'falcon',  e:'🦅'}] },
    { cat: 'color',   label: 'Pick a color',          options: [{w:'purple',  e:'🟣'}, {w:'rainbow', e:'🌈'}, {w:'golden',  e:'⭐'}, {w:'scarlet', e:'🔴'}, {w:'silver',  e:'🌟'}, {w:'teal',    e:'🦚'}] },
    { cat: 'food',    label: 'Pick a snack',           options: [{w:'tacos',   e:'🌮'}, {w:'donuts',  e:'🍩'}, {w:'nachos',  e:'🧀'}, {w:'sushi',   e:'🍣'}, {w:'waffles', e:'🧇'}, {w:'pizza',   e:'🍕'}] },
    { cat: 'place',   label: 'Pick a location',        options: [{w:'jungle',  e:'🌴'}, {w:'castle',  e:'🏰'}, {w:'cavern',  e:'🕳️'}, {w:'forest',  e:'🌲'}, {w:'meadow',  e:'🌾'}, {w:'canyon',  e:'⛰️'}] },
    { cat: 'creature',label: 'Pick a creature',        options: [{w:'robot',   e:'🤖'}, {w:'mermaid', e:'🧜'}, {w:'wizard',  e:'🧙'}, {w:'pirate',  e:'🏴‍☠️'}, {w:'ninja',   e:'🥷'}, {w:'goblin',  e:'👺'}] },
    { cat: 'move',    label: 'Pick a move',            options: [{w:'zooming', e:'⚡'}, {w:'tiptoe',  e:'👣'}, {w:'bouncing',e:'🏀'}, {w:'spinning',e:'🌀'}, {w:'leaping', e:'🦘'}, {w:'galloping',e:'🏇'}] },
    { cat: 'mood',    label: 'Pick a feeling',         options: [{w:'silly',   e:'🤪'}, {w:'sneaky',  e:'🕵️'}, {w:'brave',   e:'🦁'}, {w:'goofy',   e:'🎪'}, {w:'spooky',  e:'👻'}, {w:'grumpy',  e:'😤'}] },
  ],
  big: [
    { cat: 'pet',     label: 'Pick your companion',   options: [{w:'mischievous fox',        e:'🦊'}, {w:'glittering octopus',    e:'🐙'}, {w:'ancient tortoise',     e:'🐢'}, {w:'bewildered penguin',   e:'🐧'}, {w:'melodramatic cat',     e:'🐱'}, {w:'philosophical owl',    e:'🦉'}] },
    { cat: 'color',   label: 'Pick a wild color',     options: [{w:'shimmering gold',        e:'✨'}, {w:'electric violet',       e:'⚡'}, {w:'deep crimson',         e:'🔴'}, {w:'luminous teal',        e:'🌊'}, {w:'faded amber',          e:'🍂'}, {w:'impossible green',     e:'🌿'}] },
    { cat: 'food',    label: 'Pick a peculiar snack', options: [{w:'enchanted pickles',      e:'🥒'}, {w:'thunder pancakes',      e:'🥞'}, {w:'suspicious sandwiches',e:'🥪'}, {w:'bewildering biscuits', e:'🍪'}, {w:'haunted crumpets',     e:'🫖'}, {w:'legendary soup',       e:'🍲'}] },
    { cat: 'place',   label: 'Pick a setting',        options: [{w:'mossy labyrinth',        e:'🌿'}, {w:'cloud observatory',     e:'☁️'}, {w:'sunken ballroom',      e:'🏊'}, {w:'forgotten attic',      e:'🕯️'}, {w:'luminous swamp',       e:'🌙'}, {w:'ancient library',      e:'📚'}] },
    { cat: 'creature',label: 'Pick a creature',       options: [{w:'grumbling gargoyle',     e:'🗿'}, {w:'sparkly squid',         e:'🦑'}, {w:'bewildered sphinx',    e:'🏛️'}, {w:'philosophical crab',   e:'🦀'}, {w:'melodramatic ghost',   e:'👻'}, {w:'indignant mushroom',   e:'🍄'}] },
    { cat: 'move',    label: 'Pick a verb',           options: [{w:'cartwheeled',            e:'🤸'}, {w:'tiptoed cautiously',    e:'👣'}, {w:'stumbled dramatically',e:'💫'}, {w:'waltzed accidentally', e:'💃'}, {w:'skipped solemnly',     e:'🎵'}, {w:'meandered thoughtfully',e:'🌀'}] },
    { cat: 'mood',    label: 'Pick a vibe',           options: [{w:'absolutely bonkers',     e:'🤪'}, {w:'mysteriously calm',     e:'🌙'}, {w:'formally ridiculous',  e:'🎩'}, {w:'suspiciously cheerful',e:'😊'}, {w:'gravely unimpressed',  e:'😒'}, {w:'accidentally heroic',  e:'🦸'}] },
  ],
  tween: [
    { cat: 'pet',     label: 'Pick your sidekick',    options: [{w:'capybara',    e:'🦫'}, {w:'chameleon',  e:'🦎'}, {w:'crow',       e:'🐦‍⬛'}, {w:'hamster',    e:'🐹'}, {w:'axolotl',    e:'🦈'}, {w:'gecko',      e:'🦎'}] },
    { cat: 'color',   label: 'Pick your aesthetic',   options: [{w:'neon green',  e:'💚'}, {w:'void black', e:'🖤'}, {w:'burnt orange',e:'🧡'}, {w:'dusty rose', e:'🌸'}, {w:'electric yellow',e:'⚡'}, {w:'midnight blue',e:'🌌'}] },
    { cat: 'food',    label: 'Pick a snack',          options: [{w:'instant noodles',e:'🍜'}, {w:'cold pizza',e:'🍕'}, {w:'sour candy', e:'🍬'}, {w:'boba tea',   e:'🧋'}, {w:'hot sauce',  e:'🌶️'}, {w:'energy drink',e:'⚡'}] },
    { cat: 'place',   label: 'Pick a location',       options: [{w:'abandoned mall',e:'🏚️'}, {w:'rooftop',   e:'🏙️'}, {w:'skatepark',  e:'🛹'}, {w:'arcade',     e:'🕹️'}, {w:'bus stop',   e:'🚌'}, {w:'parking garage',e:'🚗'}] },
    { cat: 'creature',label: 'Pick a creature',       options: [{w:'cryptid',     e:'👁️'}, {w:'gremlin',    e:'👺'}, {w:'discount vampire',e:'🧛'}, {w:'feral librarian',e:'📚'}, {w:'shadow entity',e:'🌑'}, {w:'sentient vending machine',e:'🤖'}] },
    { cat: 'move',    label: 'Pick an action',        options: [{w:'dramatically sighed', e:'😮‍💨'}, {w:'speed-ran',e:'💨'}, {w:'casually yeeted',e:'🏌️'}, {w:'existentially paused',e:'🫠'}, {w:'chaotically bolted',e:'💥'}, {w:'mysteriously vanished',e:'🌫️'}] },
    { cat: 'mood',    label: 'Pick a vibe',           options: [{w:'chronically online',e:'📱'}, {w:'suspiciously unbothered',e:'😌'}, {w:'barely functional',e:'☕'}, {w:'terminally curious',e:'🔍'}, {w:'aggressively normal',e:'🙂'}, {w:'weirdly proud',e:'😤'}] },
  ],
};

/* Free-text prompt pools — buildRounds() randomly samples from these each session */
const FREE_TEXT_ROUNDS = {
  kid: [
    { type: 'freetext', cat: 'freeword', label: "What's a sound that makes you laugh?",         examples: ['splat', 'burp', 'boing'] },
    { type: 'freetext', cat: 'freeword', label: "Make up a silly word for nose.",                examples: ['snorble', 'snoot', 'blorp'] },
    { type: 'freetext', cat: 'freeword', label: "What noise would a confused robot make?",       examples: ['bzzzt', 'glonk', 'whirr'] },
    { type: 'freetext', cat: 'freeword', label: "Invent a word for when your sock falls down.",  examples: ['floopsy', 'droop', 'schlump'] },
    { type: 'freetext', cat: 'freeword', label: "What sound does happiness make?",               examples: ['woop', 'fizz', 'zing'] },
    { type: 'freetext', cat: 'freeword', label: "Make up a word for a tiny sneeze.",             examples: ['plink', 'achoo-bit', 'sniff-pop'] },
  ],
  big: [
    { type: 'freetext', cat: 'freeword',  label: "Name something you'd find under a couch.",               examples: ['dust', 'remote', 'crumbs'] },
    { type: 'freetext', cat: 'freeword',  label: "Invent a name for a creature that only comes out on Wednesdays.", examples: ['wumblort', 'snaggle', 'glumph'] },
    { type: 'freetext', cat: 'freeword',  label: "What would a very small wizard say as a spell?",          examples: ['zibbidy', 'plonkus', 'snorfle'] },
    { type: 'freetext', cat: 'freeword',  label: "Name the least trustworthy vegetable.",                    examples: ['turnip', 'parsnip', 'fennel'] },
    { type: 'freetext', cat: 'freeword2', label: "What's a word that just sounds silly?",                   examples: ['wobble', 'glorp', 'squish'] },
    { type: 'freetext', cat: 'freeword2', label: "Name an emotion that doesn't exist but should.",          examples: ['glumfuzzle', 'snortle', 'bliss-wump'] },
    { type: 'freetext', cat: 'freeword2', label: "Invent a polite word for a very loud sneeze.",            examples: ['kersplendor', 'snark-boom', 'nasal-fanfare'] },
    { type: 'freetext', cat: 'freeword2', label: "What's the secret name of your left sock?",               examples: ['Gerald', 'Flumf', 'Sir Woolsworth'] },
  ],
  tween: [
    { type: 'freetext', cat: 'freeword',  label: "What's something adults do that makes zero sense?",        examples: ['meetings', 'golf', 'taxes'] },
    { type: 'freetext', cat: 'freeword',  label: "Name the least trustworthy app on your phone.",            examples: ['weather', 'maps', 'autocorrect'] },
    { type: 'freetext', cat: 'freeword',  label: "What's your villain origin story called?",                 examples: ['The WiFi Went Down', 'Last Slice Gone', 'The Projector Froze'] },
    { type: 'freetext', cat: 'freeword',  label: "Invent a word for that moment when you forget why you walked into a room.", examples: ['blankout', 'doorstruck', 'forgotnik'] },
    { type: 'freetext', cat: 'freeword2', label: "What's the password to your brain?",                       examples: ['pizza', 'spite', 'main character energy'] },
    { type: 'freetext', cat: 'freeword2', label: "Name a rule you made up but everyone follows anyway.",     examples: ["don't touch the top shelf", 'left side walk right', 'middle seat rules'] },
    { type: 'freetext', cat: 'freeword2', label: "What's your current mood in two words?",                   examples: ['chaotic tired', 'fine whatever', 'plotting something'] },
    { type: 'freetext', cat: 'freeword2', label: "Invent a band name using only things near you right now.", examples: ['The Lamp', 'Static Carpet', 'USB Hub'] },
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
