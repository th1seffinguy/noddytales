const fs = require('fs');
const ROOT = '/Users/johncarmano/AI/projects/active/noddytales';
const code = fs.readFileSync(ROOT + '/src/engine-v2.js', 'utf8');
const win = {};
new Function('window', code).call({window:win}, win);
const gen = win.generateStoryV3;
function strip(t){return t.replace(/\[c:([^\]]*)\]/g,'$1').replace(/\[y:([^\]]*)\]/g,'$1').replace(/\[name:([^\]]*)\]/g,'$1');}

// P1: show_wrong_v3 with prop=binoculars — force kid/big/tween samples
console.log('=== P1: show_wrong_v3 plural prop (binoculars) ===\n');
const P1_RX = /\b(had a binoculars|half a binoculars|one binoculars|a binoculars\b)/i;
let p1Total=0, p1Hits=0; const p1Sample=[];
for (const age of [6,7,8,9,10,11,12,13]) {
  for (let i=0;i<20;i++) {
    const picks = { pet:{w:'crow'}, food:{w:'pizza'}, place:{w:'mall'},
      creature:{w:'eagle'}, color:{w:'red'}, move:{w:'zoomed'}, mood:{w:'silly'},
      freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'somewhere_weird', place:{text:'mall', articleText:'the mall'}, visitorBias:'creature', objectBias:'binoculars'},
      storyMode:'bedtime', pottyMode:false };
    // Force show_wrong_v3 by retrying until blueprint matches
    let s; for (let t=0;t<40;t++){ s = gen('Cole', picks, age); if (s && s.__blueprint==='show_wrong_v3') break; }
    if (!s || s.__blueprint!=='show_wrong_v3') continue;
    p1Total++;
    const text = strip([s.title, ...(s.paragraphs||[])].join(' '));
    if (P1_RX.test(text)) {
      p1Hits++;
      if (p1Sample.length<6) {
        const m = text.match(new RegExp('[^.!?]*'+P1_RX.source+'[^.!?]*[.!?]','i'));
        p1Sample.push('  age '+age+': '+(m?m[0]:text.match(P1_RX)[0]));
      }
    }
  }
}
console.log('  total show_wrong samples:', p1Total);
console.log('  plural-prop grammar hits:', p1Hits, '('+(p1Total?(p1Hits/p1Total*100).toFixed(1):'0')+'%)');
p1Sample.forEach(s=>console.log(s));

// P2: signature_action + mood_throughline filler
console.log('\n=== P2: signature_action + mood_throughline filler ===\n');
const P2_SA = /(There was a small \S+ moment that nobody quite witnessed in full|A short burst of \S+ happened\. Witnesses disagreed)/i;
const P2_MOOD = /(\b\S+ energy to it\. Nobody could explain why|\b\S+ quality to the air|turned a particular shade of \S+)/i;
let p2Total=0, p2SaHits=0, p2MoodHits=0; const p2Sample=[];
for (const age of [2,3,4,5,6,7,8,9,10,11,12,13]) {
  for (let i=0;i<15;i++) {
    const picks = { pet:{w:'duck'}, food:{w:'pizza'}, place:{w:'forest'},
      creature:{w:'dragon'}, color:{w:'red'}, move:{w:'splashed'}, mood:{w:'snack-motivated'},
      freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
      setting:{id:'at_home', place:{text:'bedroom', articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
      storyMode:'bedtime', pottyMode:false };
    const s = gen('Cole', picks, age);
    if (!s) continue;
    p2Total++;
    const text = strip([s.title, ...(s.paragraphs||[])].join(' '));
    if (P2_SA.test(text)) {
      p2SaHits++;
      if (p2Sample.length<5) {
        const m = text.match(new RegExp('[^.!?]*'+P2_SA.source+'[^.!?]*[.!?]','i'));
        p2Sample.push('  age '+age+' SA: '+(m?m[0]:text.match(P2_SA)[0]));
      }
    }
    if (P2_MOOD.test(text)) {
      p2MoodHits++;
      if (p2Sample.length<10) {
        const m = text.match(new RegExp('[^.!?]*'+P2_MOOD.source+'[^.!?]*[.!?]','i'));
        p2Sample.push('  age '+age+' MOOD: '+(m?m[0]:text.match(P2_MOOD)[0]));
      }
    }
  }
}
console.log('  total samples:', p2Total);
console.log('  signature_action filler hits:', p2SaHits, '('+(p2SaHits/p2Total*100).toFixed(1)+'%)');
console.log('  mood_throughline filler hits:', p2MoodHits, '('+(p2MoodHits/p2Total*100).toFixed(1)+'%)');
console.log('  SAMPLES:');
p2Sample.forEach(s=>console.log(s));
