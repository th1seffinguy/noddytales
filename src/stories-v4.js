/* ================================================================
   NoddyTales — Engine v4 story templates (data only; logic in engine-v4.js)

   v0.9.3 · b52 — Phase 1 of the followability pivot (taste-locked 2026-06-09
   on the "Pancake Flip" + "Santa's Cookies" samples; see Story Test Log
   Entry 018 + the "Engine v4" Build Idea).

   EVERY template is a complete, hand-authored story with a real arc:
     want → try → funny mishap → try differently → win → warm close.
   Coherence is guaranteed by construction — there is no beat assembly.

   AUTHORING RULES (the taste-lock contract):
   - One-absurd-thing: the world is normal; the kid's silly word/pet moment
     is the only crazy element, and the story plays it straight.
   - The punchline word ({noise}/{bigword}) lands AT the payoff, not sprinkled.
   - Humor register: little = mishaps, big reactions, peekaboo, repetition;
     kid = escalation in threes, kid-outsmarts-the-problem, slapstick.
     No irony. No meta. No "the bit was working."
   - Retell test: every template must be summarizable in one sentence.
   - Title-promise: whatever the title names must actually happen.

   GRAMMAR SAFETY (lessons b39/b43/b45/b47, enforced by lint + Section 27):
   - {food.text} can be PLURAL-ONLY (cookies/noodles). Only use frames:
     "the {food.text}", "some {food.text}", "of {food.text}",
     "{food.articleText}" — never "a {food.text}", never "{food.text} was/is",
     never "one {food.text}", never "it" referring to the food.
   - {pet.text} is always a singular animal — "it/its" is safe.
   - {noise.text}/{bigword.text} are user text (terminal punctuation already
     stripped by the slot builder); author them inside quotes with our own
     punctuation: "[y:{noise.text}]!"
   - {place.text} frames: "to the {place.text}" / "near the {place.text}" —
     avoid "at the {place.text}" openers (b47: "At the sidewalk").

   TEMPLATE SHAPE:
   { id, tier: 'little'|'kid', pack: 'core'|'christmas',
     uses: [slots consumed — rotation biases toward templates that use more
            of what the kid picked],
     requires: [slots Section 27 hard-gates as rendered-in-body],
     title: [variants], paragraphs: [ [variants], ... ],
     endings: { bedtime: [variants], anytime: [variants] } }

   Tokens: [name:{kid.name}] kid; [c:{x.text}] picked-word highlight;
   [y:{x.text}] big-word highlight. {pet.cap} = capitalized pet text.
   ================================================================ */

const V4_TEMPLATES = [

  /* ============================ LITTLE (ages 4-5) ============================ */

  { id: 'v4_little_pancake_flip', tier: 'little', pack: 'core',
    uses: ['pet', 'noise'], requires: ['pet', 'noise'],
    title: ['[name:{kid.name}] and the Pancake Flip'],
    paragraphs: [
      [
        'Saturday morning. Pancake morning. [name:{kid.name}] got the bowl, and the [c:{pet.text}] got the spoon, because the [c:{pet.text}] always gets the spoon.',
        'It was pancake morning. [name:{kid.name}] wore the big apron. The [c:{pet.text}] held the spoon, very seriously. Those were the jobs.',
      ],
      [
        '[name:{kid.name}] flipped the first pancake. It flew up... and landed right on the [c:{pet.text}]\'s head. "[y:{noise.text}]!" said [name:{kid.name}]. The [c:{pet.text}] sat very still, wearing the pancake like a hat.',
      ],
      [
        '[name:{kid.name}] flipped the second pancake. It flew up... and stuck to the ceiling. [name:{kid.name}] looked at the [c:{pet.text}]. The [c:{pet.text}] looked at the ceiling. They waited. Nothing.',
      ],
      [
        'Then [name:{kid.name}] had an idea. [name:{kid.name}] held a plate way up high, like a catcher. One... two... "[y:{noise.text}]!" The pancake came down — right onto the plate. Perfect.',
      ],
    ],
    endings: {
      bedtime: [
        'So [name:{kid.name}] ate the plate pancake, and the [c:{pet.text}] ate the hat pancake. Then it was time for bed, and [name:{kid.name}] fell asleep still a little bit proud. Goodnight, pancake catcher.',
      ],
      anytime: [
        'So [name:{kid.name}] ate the plate pancake, and the [c:{pet.text}] ate the hat pancake. Best breakfast ever. Same jobs next Saturday.',
      ],
    },
  },

  { id: 'v4_little_hiccup_cure', tier: 'little', pack: 'core',
    uses: ['pet', 'noise'], requires: ['pet', 'noise'],
    title: ['The [c:{pet.cap}] Hiccups', '[name:{kid.name}] and the Hiccups'],
    paragraphs: [
      [
        'The [c:{pet.text}] had the hiccups. Big ones. "[y:{noise.text}]!" went the [c:{pet.text}], every few seconds. "[y:{noise.text}]!" [name:{kid.name}] decided to help.',
      ],
      [
        'Cure number one: a sip of water. The [c:{pet.text}] sipped very carefully. Everyone waited. "[y:{noise.text}]!" Nope.',
        'Cure number one: holding your breath with puffed-up cheeks. The [c:{pet.text}] puffed. [name:{kid.name}] counted to ten. "[y:{noise.text}]!" Nope.',
      ],
      [
        'Cure number two: standing very, very still, like a statue. The [c:{pet.text}] froze. [name:{kid.name}] froze too, just to be fair. They were both excellent statues. "[y:{noise.text}]!" Still nope.',
      ],
      [
        'So [name:{kid.name}] tiptoed away... tiptoed back... and yelled "BOO!" The [c:{pet.text}] jumped. Then it blinked. Then it waited. No hiccup. NO HICCUP! The cure worked!',
      ],
      [
        'Then [name:{kid.name}] hiccuped. A big one. The [c:{pet.text}] tiptoed away... tiptoed back... "BOO!" [name:{kid.name}] jumped, and laughed, and the hiccup was gone. Fair is fair.',
      ],
    ],
    endings: {
      bedtime: [
        'That night they both lay very still and very quiet, listening. No hiccups anywhere. Just sleepy breathing. Goodnight, [name:{kid.name}]. Goodnight, [c:{pet.text}].',
      ],
      anytime: [
        'They shook on it: whoever hiccups next gets the boo. The [c:{pet.text}] kept one eye on [name:{kid.name}] all afternoon, just in case.',
      ],
    },
  },

  { id: 'v4_little_picnic_wind', tier: 'little', pack: 'core',
    uses: ['pet', 'food', 'place'], requires: ['pet', 'food'],
    title: ['The Windy Picnic'],
    paragraphs: [
      [
        '[name:{kid.name}] packed a picnic: a blanket, two cups, and some [c:{food.text}]. The [c:{pet.text}] carried the napkins. Off they went, all the way to the [c:{place.text}].',
      ],
      [
        '[name:{kid.name}] spread out the blanket, nice and flat. WHOOSH — the wind flipped it over. [name:{kid.name}] spread it out again. WHOOSH. The blanket flapped up like it was trying to fly away.',
      ],
      [
        '"Hold the corner!" said [name:{kid.name}]. The [c:{pet.text}] sat on one corner. [name:{kid.name}] sat on another. The wind grabbed the other two corners and flapped them anyway. This blanket really, really wanted to fly.',
      ],
      [
        'Then [name:{kid.name}] had an idea. One shoe on corner three. One shoe on corner four. The wind pushed... and pulled... and gave up. The blanket stayed. "Ha!" said [name:{kid.name}], with no shoes on.',
      ],
    ],
    endings: {
      bedtime: [
        'They ate every bit of the [c:{food.text}] while the wind whooshed around them, beaten. That night, [name:{kid.name}] dreamed of flying blankets and yawned all the way to sleep. Goodnight.',
      ],
      anytime: [
        'They ate every bit of the [c:{food.text}] while the wind whooshed around them, beaten. On the way home, the [c:{pet.text}] carried one shoe and [name:{kid.name}] carried the other. A perfect picnic.',
      ],
    },
  },

  { id: 'v4_little_bath_escape', tier: 'little', pack: 'core',
    uses: ['pet'], requires: ['pet'],
    title: ['The [c:{pet.cap}] Hides from the Bath'],
    paragraphs: [
      [
        'The [c:{pet.text}] found the muddiest mud puddle in the whole world and rolled in it. All of it. "Bath time," said [name:{kid.name}]. And the [c:{pet.text}] was gone.',
      ],
      [
        '[name:{kid.name}] looked under the table. There was a tail sticking out. "Hmm," said [name:{kid.name}], nice and loud. "No [c:{pet.text}] under HERE." The tail pulled itself in, very slowly.',
      ],
      [
        '[name:{kid.name}] looked behind the curtain. There were two muddy feet sticking out at the bottom. "Hmm. No [c:{pet.text}] back HERE either." The feet shuffled sideways. The curtain giggled. Curtains do not giggle.',
      ],
      [
        'So [name:{kid.name}] turned on the warm water and poured in the bubbles — extra bubbles — and said, to nobody at all, "Too bad. This is the best bubble bath I have ever seen." One eye peeked out from the curtain. Then the whole [c:{pet.text}] came out, walked straight past [name:{kid.name}], and climbed into the tub like it had been planning to all along.',
      ],
    ],
    endings: {
      bedtime: [
        'The mud came off, and the [c:{pet.text}] got a bubble beard, which suited it. By bedtime it was the cleanest, sleepiest [c:{pet.text}] in town. Goodnight, bubble beard.',
      ],
      anytime: [
        'The mud came off, and the [c:{pet.text}] got a bubble beard, which suited it. It spent the rest of the day extremely clean and extremely proud, right up until it saw the puddle again.',
      ],
    },
  },

  { id: 'v4_little_block_tower', tier: 'little', pack: 'core',
    uses: ['pet', 'noise'], requires: ['pet'],
    title: ['The Tallest Tower'],
    paragraphs: [
      [
        '[name:{kid.name}] was building the tallest tower ever. Block, block, block. The [c:{pet.text}] watched every block. The tower grew past [name:{kid.name}]\'s knees. Past the [c:{pet.text}]\'s ears. Taller!',
      ],
      [
        'Then the [c:{pet.text}] turned around to see better, and its tail went swish — right through the tower. Crash! Blocks everywhere. The [c:{pet.text}] looked at the blocks. Then at [name:{kid.name}]. Oops.',
      ],
      [
        '[name:{kid.name}] built it again, even taller. The [c:{pet.text}] sat very far away this time, being very careful. Then it sneezed. "[y:{noise.text}]!" Crash. Blocks everywhere. Again.',
      ],
      [
        'So [name:{kid.name}] had the best idea of the whole day: build the tower AROUND the [c:{pet.text}]. Block by block by block, until just its head poked out the top, like a flag. Nothing could knock this tower down. The tower was wagging.',
      ],
    ],
    endings: {
      bedtime: [
        'It was the tallest tower ever, and the only one with a heartbeat. They left it standing and went up to bed, and [name:{kid.name}] fell asleep planning an even taller one. Goodnight, tower. Goodnight, flag.',
      ],
      anytime: [
        'It was the tallest tower ever, and the only one with a heartbeat. When the [c:{pet.text}] finally stepped out, the tower stayed up for one whole second — then crashed for the third time. They both agreed: best crash of the day.',
      ],
    },
  },

  { id: 'v4_little_shared_snack', tier: 'little', pack: 'core',
    uses: ['pet', 'food'], requires: ['pet', 'food'],
    title: ['Who Ate the [c:{food.cap}]?'],
    paragraphs: [
      [
        '[name:{kid.name}] put some [c:{food.text}] in the snack bag for later. Later came. The bag felt very, very light. [name:{kid.name}] looked inside. Almost empty!',
      ],
      [
        // "bits" not "crumbs" — the food pick can be berries/noodles/soup-class;
        // crumbs only work for baked goods.
        'There was a little trail on the floor: tiny bits of [c:{food.text}]. [name:{kid.name}] followed it. One bit... two bits... three bits... right up to the [c:{pet.text}], who was sitting extra still and looking extra innocent.',
      ],
      [
        '"Did you eat the [c:{food.text}]?" asked [name:{kid.name}]. The [c:{pet.text}] shook its head no. But its cheeks were big and round and full, like two little balloons. "Are you SURE?" The cheeks chewed, just once.',
      ],
      [
        'The [c:{pet.text}] looked down. Then it reached into the bag, took out the very last piece, and held it up for [name:{kid.name}]. Saved just for [name:{kid.name}]. Well. [name:{kid.name}] broke it in half — one half each. That\'s the rule.',
      ],
    ],
    endings: {
      bedtime: [
        'They ate their halves slowly, side by side, until the bag was empty for real. Then it was bedtime, and the [c:{pet.text}] curled up close — still looking a little bit guilty, and a lot full. Goodnight, snack sneak.',
      ],
      anytime: [
        'They ate their halves side by side until the bag was empty for real. Next time, [name:{kid.name}] is hiding the snack bag up high. The [c:{pet.text}] is already practicing its climbing.',
      ],
    },
  },

  { id: 'v4_little_rain_race', tier: 'little', pack: 'core',
    uses: ['pet', 'place'], requires: ['pet'],
    title: ['Racing the Rain'],
    paragraphs: [
      [
        '[name:{kid.name}] and the [c:{pet.text}] were playing near the [c:{place.text}] when the sky went gray. Then grayer. Plip — one raindrop landed right on the [c:{pet.text}]\'s nose. Uh-oh.',
      ],
      [
        '"Race you home!" said [name:{kid.name}]. Plip. Plip-plip. They ran. The raindrops ran too. [name:{kid.name}] counted them out loud — "One! Two! Three-four-five!" — and then there were too many to count.',
      ],
      [
        'They ran past the big tree. They jumped over a puddle — well, [name:{kid.name}] jumped over it. The [c:{pet.text}] jumped IN it. Splash! Now the [c:{pet.text}] was the puddle\'s fault, not the rain\'s.',
      ],
      [
        'They reached the door at the exact moment the sky really opened up. WHOOSH — rain everywhere, all at once. [name:{kid.name}] and the [c:{pet.text}] stood inside, dripping just a little, watching it pour. "We won," said [name:{kid.name}]. The rain kept playing without them.',
      ],
    ],
    endings: {
      bedtime: [
        'They dried off with the big towel — the [c:{pet.text}] got the fluffiest corner — and got cozy and warm. The rain tapped on the window all night, like it wanted a rematch. Tomorrow, rain. Goodnight.',
      ],
      anytime: [
        'They dried off with the big towel — the [c:{pet.text}] got the fluffiest corner — and watched the rain from the window with warm cups and proud faces. Winners.',
      ],
    },
  },

  { id: 'v4_little_balloon_rescue', tier: 'little', pack: 'core',
    uses: ['pet', 'noise', 'place'], requires: ['pet', 'noise'],
    title: ['The Balloon in the Tree'],
    paragraphs: [
      [
        '[name:{kid.name}] had a red balloon on a string. It was a good balloon. But one big gust near the [c:{place.text}] — whoosh — and up it went, right into the branches of a tall tree. Stuck.',
      ],
      [
        '[name:{kid.name}] jumped for it. Too high. The [c:{pet.text}] jumped for it. Way too high. They jumped at the same time, which didn\'t make anyone taller, but it was worth a try.',
      ],
      [
        '[name:{kid.name}] tried asking nicely. "Please come down, balloon." The balloon bobbled like it was thinking about it. Then it stayed exactly where it was. Rude.',
      ],
      [
        'Then the [c:{pet.text}]\'s nose started to wiggle. And wrinkle. And — "[y:{noise.text}]!" — the biggest sneeze in the world shook the whole branch. The balloon wobbled, slipped free, and floated down sloooowly, right into [name:{kid.name}]\'s hands. "Bless you," said [name:{kid.name}]. "And thank you."',
      ],
    ],
    endings: {
      bedtime: [
        'They walked home with the balloon tied safe around [name:{kid.name}]\'s wrist. At bedtime the balloon bobbed gently in the corner, keeping watch, while [name:{kid.name}] drifted off. Goodnight, balloon. Goodnight, big sneeze.',
      ],
      anytime: [
        'They walked home with the balloon tied safe around [name:{kid.name}]\'s wrist, and the [c:{pet.text}] got the job of Official Balloon Guard. It took the job very seriously for the rest of the day.',
      ],
    },
  },

  /* ============================ KID (ages 6-7) ============================ */

  { id: 'v4_kid_santa_cookies', tier: 'kid', pack: 'christmas',
    uses: ['pet', 'bigword'], requires: ['pet', 'bigword'],
    title: ['[name:{kid.name}] Saves Santa\'s Cookies'],
    paragraphs: [
      [
        'It was Christmas Eve, and [name:{kid.name}] had one job: put out the cookies for Santa. [name:{kid.name}] set the plate by the tree, lined up perfectly. The [c:{pet.text}] watched from the couch, very innocently. Too innocently.',
      ],
      [
        '[name:{kid.name}] went up to brush teeth, and that\'s when it happened — crunch. [name:{kid.name}] ran back down. The plate was empty. The [c:{pet.text}] was lying very, very still, with one crumb on its nose and a look that said: I have always been asleep.',
      ],
      [
        '"Santa comes in ONE HOUR," said [name:{kid.name}]. There was no time to be mad. There was only time to bake.',
      ],
      [
        '[name:{kid.name}] made emergency cookies. They came out a little wrong — one was shaped like a boot, one was shaped like nothing at all, and the big one cracked right down the middle. [name:{kid.name}] frosted them anyway and wrote a note: "Sorry. The [c:{pet.text}] ate the first ones. These are homemade."',
      ],
      [
        'In the morning, the plate was empty again — and there was a new note, in curly red writing: "Best cookies on the whole route. The boot one especially. What do you call them?" [name:{kid.name}] grinned and wrote the answer down, ready for next year: "[y:{bigword.text}] cookies."',
      ],
    ],
    endings: {
      bedtime: [
        'The [c:{pet.text}], very slowly, looked proud — as if it had planned the whole thing. [name:{kid.name}] climbed into bed with the note from Santa under the pillow. Goodnight, [y:{bigword.text}] cookies. See you next year.',
      ],
      anytime: [
        'The [c:{pet.text}], very slowly, looked proud — as if it had planned the whole thing. [name:{kid.name}] taped Santa\'s note to the fridge, right at [c:{pet.text}] eye level. A warning, and a thank-you.',
      ],
    },
  },

  { id: 'v4_kid_show_and_tell', tier: 'kid', pack: 'core',
    uses: ['pet', 'noise'], requires: ['pet', 'noise'],
    title: ['Show-and-Tell Goes Wrong (Then Right)'],
    paragraphs: [
      [
        'It was show-and-tell day, and [name:{kid.name}] had the best thing in the whole class: the [c:{pet.text}]. All week, they had practiced one amazing trick. The [c:{pet.text}] nailed it every single time. At home.',
      ],
      [
        'At school, [name:{kid.name}] stood up front and said, "Watch this!" The [c:{pet.text}] sat down. Then it lay down. Then it fell asleep. In front of everyone. Somebody in the back row yawned, which felt personal.',
      ],
      [
        '[name:{kid.name}] tried again. "WATCH... this!" The [c:{pet.text}] opened one eye, looked at the class, and closed it again. The class began to wiggle. The teacher looked at the clock. [name:{kid.name}]\'s ears went hot.',
      ],
      [
        'So [name:{kid.name}] gave up on the trick and just told the truth: "Okay. Mostly it sleeps. But at home, I promise, it can—" And right then, behind [name:{kid.name}], the [c:{pet.text}] stood up and did the trick. The whole trick. Perfectly. "[y:{noise.text}]!" shouted [name:{kid.name}], spinning around — just in time to see the ending.',
      ],
      [
        'The class went wild. Total chaos, the good kind. The [c:{pet.text}] bowed once and lay back down, finished for the day. The teacher said, over the noise, "Can it come back next week?"',
      ],
    ],
    endings: {
      bedtime: [
        'That night [name:{kid.name}] told the [c:{pet.text}], "You did it on purpose. The waiting. That was showbiz." The [c:{pet.text}] was already asleep — or pretending. Either way: a professional. Goodnight, superstar.',
      ],
      anytime: [
        'On the walk home, [name:{kid.name}] told the [c:{pet.text}], "Next week, we open with the nap. We end with the trick. Deal?" The [c:{pet.text}] said nothing, which is how professionals say deal.',
      ],
    },
  },

  { id: 'v4_kid_couch_fort', tier: 'kid', pack: 'core',
    uses: ['pet', 'food', 'bigword'], requires: ['pet', 'food', 'bigword'],
    title: ['The Fort with the Secret Password'],
    paragraphs: [
      [
        'It was a rainy Saturday, which is fort weather. [name:{kid.name}] gathered every cushion from the couch and every blanket from the closet. The [c:{pet.text}] was head of security. The fort would be magnificent.',
      ],
      [
        'Attempt one: the blanket roof caved in immediately. Attempt two: [name:{kid.name}] used the big books to pin the corners, and the roof held — until the [c:{pet.text}] walked across the top of it like a hammock. Down it came, [c:{pet.text}] and all.',
      ],
      [
        'Attempt three was genius: the [c:{pet.text}] would BE the tent pole. It sat in the middle, tall and proud, blanket draped over it, and the roof finally held. The fort was complete. One rule, taped to the cushion door: NO ENTRY WITHOUT THE PASSWORD.',
      ],
      [
        'The password was "[y:{bigword.text}]." Nobody got in without it. Not even Mom — especially not Mom — who arrived at the cushion door carrying a plate of [c:{food.text}] and had to stand there until she said it. She took a breath. She said, in her most serious voice, "[y:{bigword.text}]." [name:{kid.name}] nearly fell over. Entry granted.',
      ],
    ],
    endings: {
      bedtime: [
        'They ate the [c:{food.text}] inside the fort while the rain drummed on the windows, and the tent pole got the crumbs as payment. When [name:{kid.name}] finally crawled out and into bed, the password was still the funniest word in the house. "[y:{bigword.text}]," whispered [name:{kid.name}], and fell asleep grinning.',
      ],
      anytime: [
        'They ate the [c:{food.text}] inside the fort while the rain drummed on the windows, and the tent pole got the crumbs as payment. The fort stood all afternoon. The password stays secret. Tell no one.',
      ],
    },
  },

  { id: 'v4_kid_wobbly_tooth', tier: 'kid', pack: 'core',
    uses: ['pet', 'noise'], requires: ['pet', 'noise'],
    title: ['The Wobbliest Tooth in Town'],
    paragraphs: [
      [
        '[name:{kid.name}] had a wobbly tooth. Not a little wobbly — SO wobbly it bent like a tiny diving board. But it would not come out. The [c:{pet.text}] inspected it closely and looked concerned.',
      ],
      [
        'Plan one: the apple trick. [name:{kid.name}] took the biggest, crunchiest bite in apple history. The apple lost a chunk. The tooth stayed exactly where it was, wobbling smugly.',
      ],
      [
        'Plan two: the classic. String on the tooth, string on the door handle, [c:{pet.text}] ready to push the door. "On three," said [name:{kid.name}]. "One... two..." The [c:{pet.text}] pushed on two. The string slipped right off. The door slammed. The tooth wobbled on, untouched. The [c:{pet.text}] could not count, and that was that.',
      ],
      [
        'So [name:{kid.name}] gave up and went back to playing — a big game of chase with the [c:{pet.text}], around the table, over the cushions, laughing the whole way. And mid-laugh, with no warning at all... "[y:{noise.text}]!" Out it popped, just like that, landing right in [name:{kid.name}]\'s hand. The tooth had simply been waiting for a better moment.',
      ],
    ],
    endings: {
      bedtime: [
        'The tooth went under the pillow, shined up and ready. The [c:{pet.text}] stood guard at the foot of the bed — tonight there would be a visitor, and security mattered. [name:{kid.name}] fell asleep with a brand-new gap in a great big smile. Goodnight.',
      ],
      anytime: [
        '[name:{kid.name}] showed everyone the gap, then the tooth, then the gap again. The [c:{pet.text}] got promoted to Tooth Security for tonight\'s pillow visit. Best game of chase ever.',
      ],
    },
  },

  { id: 'v4_kid_sandwich_mountain', tier: 'kid', pack: 'core',
    uses: ['pet', 'food', 'bigword'], requires: ['pet', 'food'],
    title: ['The Great [c:{food.cap}] Mountain'],
    paragraphs: [
      [
        '[name:{kid.name}] was hungry. Not regular hungry — mountain hungry. So lunch would not be a plate of [c:{food.text}]. It would be a MOUNTAIN of [c:{food.text}], the tallest ever stacked. The [c:{pet.text}] was the official taste tester, and approved the plan immediately.',
      ],
      [
        'The stacking began. Layer by layer, taller and taller, until the mountain stood higher than the milk glass. Then it leaned. Just a little. Like a tower thinking about lying down.',
      ],
      [
        '[name:{kid.name}] performed emergency engineering: a toothpick down the middle, a spoon propped on one side, and — the genius part — the [c:{pet.text}] standing guard on the table with its head pressed gently against the leaning side. The mountain straightened. The crowd (one [c:{pet.text}]) went wild.',
      ],
      [
        'For one glorious moment, it was the tallest lunch in the history of lunch. [name:{kid.name}] reached for the camera... and the mountain made its choice. Down it came — "[y:{bigword.text}]!" yelled [name:{kid.name}] — every layer, all at once, the most delicious avalanche ever seen. The [c:{pet.text}] caught a piece without even moving. Taste tester of the year.',
      ],
    ],
    endings: {
      bedtime: [
        'They ate the rubble together, which tasted exactly as good as the mountain would have, and required no engineering at all. That night [name:{kid.name}] drifted off planning Mountain Two: wider base, same taste tester. Goodnight.',
      ],
      anytime: [
        'They ate the rubble together, which tasted exactly as good as the mountain would have. [name:{kid.name}] declared the experiment a delicious success. Mountain Two is already in planning: wider base, same taste tester.',
      ],
    },
  },

  { id: 'v4_kid_lemonade_stand', tier: 'kid', pack: 'core',
    uses: ['pet', 'place', 'food'], requires: ['pet'],
    title: ['The Lemonade Stand Nobody Visited (At First)'],
    paragraphs: [
      [
        '[name:{kid.name}] set up a lemonade stand near the [c:{place.text}]: a little table, a big sign, cups in a perfect row. The [c:{pet.text}] wore the staff badge. They were open for business.',
      ],
      [
        'Business was slow. Business was, in fact, zero. One person walked by looking at their phone. A bird landed on the sign, read it, and left without buying anything. The [c:{pet.text}] reorganized the cups out of stress.',
      ],
      [
        '[name:{kid.name}] tried yelling "LEMONADE!" louder. Nothing. Tried a friendly wave. Nothing. Meanwhile the [c:{pet.text}] got bored, picked up the sign, and started marching around the table wearing it like a sandwich board — completely upside down.',
      ],
      [
        'And THAT stopped traffic. "Look at that!" people said, pointing at the [c:{pet.text}] in its upside-down sign, marching with terrible importance. They came to laugh. They stayed for lemonade. The cups sold out in ten minutes, and [name:{kid.name}] never even had to yell.',
      ],
      [
        '[name:{kid.name}] split the earnings fairly: the money in the jar, and the [c:{pet.text}] paid in full — one entire helping of [c:{food.text}], the staff favorite. The sign stayed upside down forever. Why argue with marketing.',
      ],
    ],
    endings: {
      bedtime: [
        'That night, [name:{kid.name}] counted the jar twice and tucked it on the shelf. The [c:{pet.text}] was already asleep with the staff badge still on. Promotions all around in the morning. Goodnight, business partners.',
      ],
      anytime: [
        'They closed the stand like proper businesspeople: cups stacked, table wiped, badge stored safely. Tomorrow\'s plan, written by [name:{kid.name}], reads: "Step one. The [c:{pet.text}] marches FIRST."',
      ],
    },
  },

  { id: 'v4_kid_backwards_day', tier: 'kid', pack: 'core',
    uses: ['pet'], requires: ['pet'],
    title: ['Backwards Day'],
    paragraphs: [
      [
        'At breakfast, [name:{kid.name}] made an announcement: today was Backwards Day. Dessert first. Pajamas to the table. Walking in reverse. The [c:{pet.text}] was appointed judge, because the judge cannot also be a player. The judge accepted, snacks included.',
      ],
      [
        'It started small. [name:{kid.name}] said "goodnight" instead of "good morning." Wore the backpack on the front. Read a comic from the last page to the first, which honestly made it funnier. The judge awarded full points.',
      ],
      [
        'Then it escalated, as Backwards Days do. Backwards walking down the hallway: points. Backwards hopping in the yard: many points. Backwards skipping past the garden — right toward the sprinkler that nobody remembered was on. The judge saw it coming. The judge said nothing. Judges are like that.',
      ],
      [
        'SPLOOSH. [name:{kid.name}] stood in the spray, fully soaked, fully backwards, and ruled it on the spot: "Ten out of ten." The judge agreed by running through the sprinkler too — forwards, because rules only applied to players. They went around twice more, both directions, until everyone was soaked and the scores stopped mattering.',
      ],
    ],
    endings: {
      bedtime: [
        'Backwards Day ended the only way it could: dinner after dessert, bath after the sprinkler had already done most of the work, and then bed — because [name:{kid.name}] ruled that sleep is the one thing better forwards. "Good morning," said [name:{kid.name}], turning out the light, and fell asleep facing exactly the right way. Perfect score.',
      ],
      anytime: [
        'They dried off in the sun, the judge and the champion, and made it official: Backwards Day will return. Same rules. Same judge. The sprinkler stays on. "Hello," said [name:{kid.name}], which on Backwards Day means see you later.',
      ],
    },
  },

  { id: 'v4_kid_treasure_swap', tier: 'kid', pack: 'core',
    uses: ['pet', 'place', 'bigword'], requires: ['pet', 'bigword'],
    title: ['The Treasure Near the [c:{place.cap}]'],
    paragraphs: [
      [
        '[name:{kid.name}] drew the map first, because all real treasure hunts start with a map: the big rock, the crooked tree, twelve steps past the bench near the [c:{place.text}], and a big X. The [c:{pet.text}] carried the digging spoon. Officially an expedition.',
      ],
      [
        'They counted the steps out loud. The [c:{pet.text}] paced alongside, nose down, taking the work seriously. At step twelve, [name:{kid.name}] marked the spot with a stick and they started to dig. Dirt flew. Mostly onto the [c:{pet.text}], who did not mind.',
      ],
      [
        'CLINK. The spoon hit something. [name:{kid.name}] dug faster — and pulled out... a little toy car. Old. Rusty on one wheel. Somebody\'s treasure from a long, long time ago, buried by some other kid who maybe drew some other map. [name:{kid.name}] turned it over slowly. Real buried treasure. The actual kind.',
      ],
      [
        'So [name:{kid.name}] did what real treasure hunters do: kept the car, and left a treasure back. Into the hole went one excellent marble, one cool feather the [c:{pet.text}] contributed, and a note in careful letters: "Good digging. The password is [y:{bigword.text}]. Pass it on." They filled the hole and patted it flat — ready for the next kid with a map.',
      ],
    ],
    endings: {
      bedtime: [
        'The little car got the best parking spot on the shelf, right where the morning light hits. [name:{kid.name}] fell asleep wondering who buried it — and who would dig up the marble, the feather, and the password someday. Somewhere out there, the treasure was already waiting. Goodnight.',
      ],
      anytime: [
        'The little car got the best parking spot on the shelf. The map went under the mattress — top secret. And every time they pass the spot near the [c:{place.text}] now, [name:{kid.name}] and the [c:{pet.text}] share a look: there\'s treasure down there, and only they know the password.',
      ],
    },
  },
];

/* Browser-global export (matches src/content.js / src/engine-v2.js pattern). */
if (typeof window !== 'undefined') {
  window.V4_TEMPLATES = V4_TEMPLATES;
}
