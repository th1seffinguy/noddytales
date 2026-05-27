const fs = require('fs');
const ROOT = '/Users/johncarmano/AI/projects/active/noddytales';
const code = fs.readFileSync(ROOT + '/src/engine-v2.js', 'utf8');
const win = {};
const ctx = { window: win };
new Function('window', code).call(ctx, win);
const gen = win.generateStoryV3;

const TIERS = [{name:'tot',ages:[2,3]},{name:'little',ages:[4,5]},{name:'kid',ages:[6,7]},{name:'big',ages:[8,9,10]},{name:'tween',ages:[11,12,13]}];
function PICKS(color) { return {
  pet: {w:'cat'}, food:{w:'pizza'}, place:{w:'forest'},
  creature: {w:'dragon'}, color:{w:color}, move:{w:'zoomed'},
  mood: {w:'sleepy'}, freeword:{w:'plop'}, freeword2:{w:'glorp'}, sound:{w:'TOOT'}, sky:{w:'stars'},
  setting: {id:'at_home', place:{text:'bedroom',articleText:'the bedroom'}, visitorBias:'creature', objectBias:'object'},
  storyMode:'bedtime', pottyMode:false,
};}
const ABSTRACT = /(feeling to the moment|thing was happening again|light shifted briefly toward|picked up a faint .* tint|looked weirdly|faint .* glow hung)/i;
const ARTICLE_MISMATCH = /\ba (apple|electric|orange|ice|acid|electric|aqua|amber|olive|emerald|opal|umber|onyx|indigo)\b/i;
const COLORS = ['apple red','electric blue','orange','ice','acid yellow','tomato red','midnight blue','lemon yellow'];
const hits = {abstract:0,article:0,total:0};
const SAMPLES = [];
for (const t of TIERS) {
  for (const age of t.ages) {
    for (const c of COLORS) {
      for (let i=0;i<3;i++) {
        const s = gen('Cole', PICKS(c), age);
        if (!s) continue;
        const text = [s.title, ...(s.paragraphs||[])].join(' ');
        hits.total++;
        if (ABSTRACT.test(text)) { hits.abstract++; const m=text.match(ABSTRACT); if (SAMPLES.length<10) SAMPLES.push({tier:t.name,age,issue:'abstract',color:c,m:m[0],line:text.match(new RegExp('[^.!?]*'+m[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^.!?]*[.!?]'))?.[0] || m[0]}); }
        if (ARTICLE_MISMATCH.test(text)) { hits.article++; const m=text.match(ARTICLE_MISMATCH); if (SAMPLES.length<10) SAMPLES.push({tier:t.name,age,issue:'article',color:c,m:m[0],line:text.match(new RegExp('[^.!?]*'+m[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^.!?]*[.!?]'))?.[0] || m[0]}); }
      }
    }
  }
}
console.log('BEFORE (b37) — total stories:', hits.total);
console.log('abstract callback hits:', hits.abstract, '('+(hits.abstract/hits.total*100).toFixed(1)+'%)');
console.log('article mismatch hits:', hits.article, '('+(hits.article/hits.total*100).toFixed(1)+'%)');
console.log('\nSAMPLE FAILURES:');
for (const s of SAMPLES) console.log('  ['+s.tier+' age '+s.age+' color="'+s.color+'" '+s.issue+']', s.line.slice(0,180));
