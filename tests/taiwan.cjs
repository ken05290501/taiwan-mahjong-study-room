const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const ctx={console};vm.createContext(ctx);vm.runInContext(['engine.js','taiwan.js'].map(f=>fs.readFileSync('dist/'+f,'utf8')).join('\n'),ctx);const run=s=>vm.runInContext(s,ctx);
run(`function only(ids){const r=twDefaults();for(const k in r.enabled)r.enabled[k]=ids.includes(k);return r}function check(hand,ids,extra={}){return twEvaluate({hand,melds:[],core:[],flowers:[],self:true,winning:hand.at(-1),rules:only(ids),...extra})}`);
const fivePungs='[0,0,0,3,3,3,9,9,9,18,18,18,22,22,22,27,27]';
assert.equal(run(`check(${fivePungs},['concealed5','allPungs']).tai`),12);
assert.equal(run(`check(${fivePungs},['concealed5','concealed4'],{self:false,winning:22}).tai`),5);
assert.equal(run(`check(${fivePungs},['concealed5','concealed4'],{self:false,winning:27}).tai`),8);
assert.equal(run(`check(${fivePungs},['closed','self','closedSelf']).tai`),3);
assert.equal(run(`check(${fivePungs},['closed','self']).tai`),2);
assert.equal(run(`check([0,0,0,9,9,9,31,31,31,32,32,32,33,33,33,18,18],['bigDragon','dragon']).tai`),8);
assert.equal(run(`r=only(['bigDragon','dragon']);r.dragonStack=true;check([0,0,0,9,9,9,31,31,31,32,32,32,33,33,33,18,18],[],{rules:r}).tai`),11);
assert.equal(run(`check(${fivePungs},['flower','flowerSet'],{flowers:[34,35,36,37,38]}).tai`),3);
assert.equal(run(`r=only(['flower','flowerSet']);r.flowerMode='all';r.flowerStack=true;check(${fivePungs},[],{rules:r,flowers:[34,35,36,37,38]}).tai`),7);
assert.equal(run(`r=only(['flower']);r.flowerMode='seat';check(${fivePungs},[],{rules:r,flowers:[34,35,38,39],seat:1}).tai`),2);
assert.equal(run(`check([0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,11],['pure'])`),null);
// 111222333 can be three concealed triplets or three sequences: score every decomposition.
assert.equal(run(`check([0,0,0,1,1,1,2,2,2,12,12,12,21,21,21,27,27],['concealed5']).tai`),8);
// An exposed copy can eliminate an otherwise legal second wait; counts include melds.
assert.equal(run(`check([0,1,2,3,4,5,9,10,11,18,19,20,27,27],['single'],{self:false,winning:27,melds:[[6,7,8]],core:['m789+']}).tai`),1);
// Pairwise dealer additions and cap, then discarder pays three shares.
run(`let g={h:[${fivePungs},${fivePungs},[],[]],m:[[],[],[],[]],mcore:[[],[],[],[]],flowerTiles:[[],[],[],[]],drawn:[27,27,null,null],rinshan:[false,false,false,false],wall:[1],wind:0,dealer:0,repeatCount:2,rules:{base:100,unit:20,tw:only(['self','dealer','repeat'])}};function seatOf(p){return (p-g.dealer+4)%4}`);
assert.deepEqual(Array.from(run('twGameScore(1,true,null,0).payments.map(x=>x.money)')),[220,120,120]);
assert.equal(run('g.rules.tw.cap=3;twGameScore(1,true,null,0).payments[0].money'),160);
assert.equal(run('g.h[1].pop();g.rules.tw.payment="discarderAll";twGameScore(1,false,27,0).payments[0].money'),480);
assert.equal(run('twNormalize({values:{self:-10,closed:Infinity},cap:-1}).values.self'),0);
assert.equal(run('twNormalize({values:{closed:Infinity}}).values.closed'),1);
console.log('PASS: decomposition maximization, ron versus concealed triplets, combination replacement, flower modes, dealer/repeat payments, caps, and rule validation.');
