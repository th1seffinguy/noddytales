const fs = require('fs');
const code = fs.readFileSync('/Users/johncarmano/AI/projects/active/noddytales/src/engine-v2.js','utf8');
const win = {}; new Function('window', code).call({window:win}, win);
const gen = win.generateStoryV3;
function strip(t){return t.replace(/\[c:([^\]]*)\]/g,'$1').replace(/\[y:([^\]]*)\]/g,'$1').replace(/\[name:([^\]]*)\]/g,'$1');}
const PICK_PROFILES = [
  // varied moves + moods so we exercise both fixed pools per age
  {move:'splashed', mood:'sleepy',           freeword:'plop',     color:'red'},
  {move:'swayed',   mood:'snack-motivated',  freeword:'snorble',  color:'midnight blue'},
  {move:'crawled',  mood:'heroically mediocre', freeword:'wubba', color:'apple red'},
  {move:'zoomed',   mood:'minorly iconic',   freeword:'bonk',     color:'electric blue'},
  {move:'bounced',  mood:'weirdly invested', freeword:'flumpy',   color:'rainbow'},
];
for (const age of [2, 4, 6, 8, 12]) {
  console.log('\n========================================');
  console.log('AGE ' + age + ' — 5 samples');
  console.log('========================================');
  for (let i=0;i<5;i++) {
    const p = PICK_PROFILES[i];
    const picks = {
      pet:{w:'duck'}, food:{w:'pizza'}, place:{w:'forest'},
      creature:{w:'dragon'}, color:{w:p.color}, move:{w:p.move}, mood:{w:p.mood},
      freeword:{w:p.freeword}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
      storyMode:'bedtime', pottyMode:false,
    };
    const s = gen('Cole', picks, age);
    if (!s) { console.log('  age '+age+' sample '+i+': null'); continue; }
    console.log('\n--- age '+age+' #'+(i+1)+' ('+(s.__blueprint||'(v2)')+', move='+p.move+', mood="'+p.mood+'") ---');
    console.log('Title: '+strip(s.title));
    for (const para of s.paragraphs) console.log(' '+strip(para));
  }
}
