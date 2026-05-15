/* ================================================================
   NoddyTales — Content data
   Edit this file to change words, prompts, or round order.
   Story template logic lives in index.html (buildStory).
   ================================================================ */

/* Binary rounds by tier */
const WORD_BANK = {
  tot: [
    { cat: 'pet',   label: 'Pick a friend',          options: [{w:'dog',  e:'🐕'}, {w:'cat',  e:'🐈'}] },
    { cat: 'color', label: 'Pick a color',            options: [{w:'red',  e:'🔴'}, {w:'blue', e:'🔵'}] },
    { cat: 'food',  label: 'Pick a snack',            options: [{w:'cake', e:'🍰'}, {w:'jam',  e:'🍓'}] },
    { cat: 'place', label: 'Pick a place',            options: [{w:'park', e:'🌳'}, {w:'pond', e:'🦆'}] },
    { cat: 'sky',   label: 'Pick something up high',  options: [{w:'sun',  e:'☀️'}, {w:'moon', e:'🌙'}] },
    { cat: 'move',  label: 'Pick a wiggle',           options: [{w:'hop',  e:'🐇'}, {w:'spin', e:'🌀'}] },
  ],
  little: [
    { cat: 'pet',     label: 'Choose a buddy',    options: [{w:'puppy',   e:'🐶'}, {w:'bunny',   e:'🐰'}] },
    { cat: 'color',   label: 'Choose a color',    options: [{w:'pink',    e:'🌸'}, {w:'green',   e:'🌿'}] },
    { cat: 'food',    label: 'Choose a treat',    options: [{w:'pizza',   e:'🍕'}, {w:'cookies', e:'🍪'}] },
    { cat: 'place',   label: 'Choose a spot',     options: [{w:'beach',   e:'🏖️'}, {w:'forest',  e:'🌲'}] },
    { cat: 'creature',label: 'Choose a creature', options: [{w:'frog',    e:'🐸'}, {w:'fish',    e:'🐠'}] },
    { cat: 'move',    label: 'Choose a move',     options: [{w:'jump',    e:'🦘'}, {w:'dance',   e:'💃'}] },
    { cat: 'weather', label: 'Choose the weather',options: [{w:'sunny',   e:'☀️'}, {w:'snowy',   e:'❄️'}] },
  ],
  kid: [
    { cat: 'pet',     label: 'Pick your sidekick',  options: [{w:'dragon',  e:'🐲'}, {w:'panda',   e:'🐼'}] },
    { cat: 'color',   label: 'Pick a color',         options: [{w:'purple',  e:'🟣'}, {w:'rainbow', e:'🌈'}] },
    { cat: 'food',    label: 'Pick a snack',          options: [{w:'tacos',   e:'🌮'}, {w:'donuts',  e:'🍩'}] },
    { cat: 'place',   label: 'Pick a location',       options: [{w:'jungle',  e:'🌴'}, {w:'castle',  e:'🏰'}] },
    { cat: 'creature',label: 'Pick a creature',       options: [{w:'robot',   e:'🤖'}, {w:'mermaid', e:'🧜'}] },
    { cat: 'move',    label: 'Pick a move',           options: [{w:'zooming', e:'⚡'}, {w:'tiptoe',  e:'👣'}] },
    { cat: 'mood',    label: 'Pick a feeling',        options: [{w:'silly',   e:'🤪'}, {w:'sneaky',  e:'🕵️'}] },
  ],
  big: [
    { cat: 'pet',     label: 'Pick your companion',    options: [{w:'mischievous fox',   e:'🦊'}, {w:'glittering octopus', e:'🐙'}] },
    { cat: 'color',   label: 'Pick a wild color',      options: [{w:'shimmering gold',   e:'✨'}, {w:'electric violet',    e:'⚡'}] },
    { cat: 'food',    label: 'Pick a peculiar snack',  options: [{w:'enchanted pickles', e:'🥒'}, {w:'thunder pancakes',   e:'🥞'}] },
    { cat: 'place',   label: 'Pick a setting',         options: [{w:'mossy labyrinth',   e:'🌿'}, {w:'cloud observatory',  e:'☁️'}] },
    { cat: 'creature',label: 'Pick a creature',        options: [{w:'grumbling gargoyle',e:'🗿'}, {w:'sparkly squid',      e:'🦑'}] },
    { cat: 'move',    label: 'Pick a verb',            options: [{w:'cartwheeled',       e:'🤸'}, {w:'tiptoed cautiously', e:'👣'}] },
    { cat: 'mood',    label: 'Pick a vibe',            options: [{w:'absolutely bonkers',e:'🤪'}, {w:'mysteriously calm',  e:'🌙'}] },
  ],
};

/* Free-text rounds (ages 6+) — inserted at specific positions by buildRounds() */
const FREE_TEXT_ROUNDS = {
  kid: [
    {
      type: 'freetext',
      cat: 'freeword',
      label: "What's a sound that makes you laugh?",
      examples: ['splat', 'burp', 'boing'],
    },
  ],
  big: [
    {
      type: 'freetext',
      cat: 'freeword',
      label: "Name something you'd find under a couch.",
      examples: ['dust', 'remote', 'crumbs'],
    },
    {
      type: 'freetext',
      cat: 'freeword2',
      label: "What's a word that just sounds silly?",
      examples: ['wobble', 'glorp', 'squish'],
    },
  ],
};

/* Category order per tier — controls which rounds appear and in what sequence */
const ROUND_PLAN = {
  tot:    ['pet', 'color', 'food', 'place', 'move'],
  little: ['pet', 'color', 'food', 'place', 'creature', 'move'],
  kid:    ['pet', 'color', 'food', 'place', 'creature', 'move', 'mood'],
  big:    ['pet', 'color', 'food', 'place', 'creature', 'move', 'mood'],
};
