const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const files=['vendor/majiang.js','engine.js','taiwan.js','match.js','japanese.js','yaku.js','victory.js','enhance.js','quiz-bank.js','discard-challenges.js','experience.js','review.js','history.js','app.js'];const src=files.map(f=>fs.readFileSync('dist/'+f,'utf8')).join('\n');const storage=new Map();const c={Date,console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout(){},clearTimeout(){}};vm.createContext(c);vm.runInContext(src.slice(0,src.indexOf("$('#settings').onclick="))+'\nrender=()=>{};',c);const run=s=>vm.runInContext(s,c);
run("cfg.mode='tw';start();g.h[0]=[0,1,2,3,4,5,9,10,11,18,19,20,21,22,23,27,28];g.drawn[0]=28;g.river=[{p:1,t:27}];g.m=[[],[],[],[]];g.indicators=[];captureDiscardReview(16,false);move=g.reviewMoves[0];result=analyzeDiscardReview(move,'tw')");assert.equal(run('result.actual.distance'),0);assert.equal(run('result.actual.total'),2);assert.equal(run('result.tied.includes(27)'),true);assert.equal(run('result.tied.includes(28)'),false);
run('snapshot=JSON.stringify(move);g.wall=[];g.h[1]=[27,27,27];g.h[2]=[28,28,28]');assert.equal(run('JSON.stringify(g.reviewMoves[0])'),run('snapshot'));assert.equal(run("analyzeDiscardReview(move,'tw').actual.total"),2);
run("discard(16);finish('流局')");assert.equal(run('roundHistory[0].reviewMoves.length'),2);assert.equal(JSON.parse(storage.get('mj-round-history-v1'))[0].reviewMoves[0].tile,28);
assert.match(run("reviewResultMarkup(move,'tw')"),/多 1 張/);
// Shanten zero must agree with the existing complete-hand detector on varied 16-tile hands.
run("for(const group of Object.values(QUIZ_BANK['tw-wait']))for(const h of group){if(reviewShanten(h,'tw')!==0)throw Error('tenpai disagreement');for(const t of shapeWaits(h))if(reviewShanten([...h,t],'tw')!==-1)throw Error('win disagreement')}");
assert.equal(run("reviewShanten([0,0,1,1,9,9,10,10,18,18,19,19,27],'jp')"),0);
assert.equal(run("reviewShanten([0,8,9,17,18,26,27,28,29,30,31,32,33],'jp')"),0);
assert.equal(run("reviewShanten([0,1,2,9,10,11,18,19,20,27],'tw',[],2)"),0);
run("move.locked=true;move.legal=[move.tile]");assert.match(run("reviewResultMarkup(move,'tw')"),/不評分/);
console.log('PASS: visible-only snapshots, live-copy counts, tied alternatives, persisted moves, locked discard, Taiwan shanten/wins and Japanese special shapes.');

assert.equal(run("discardReviewRating({locked:false,tile:28},result).score"),90);
assert.equal(run("discardReviewRating({locked:true},result).score"),null);
assert.equal(run("discardReviewRating({tile:1},{actual:{distance:0,total:8},best:{distance:0,total:8},tied:[1]}).score"),100);
assert.equal(run("discardReviewRating({tile:1},{actual:{distance:1,total:90},best:{distance:0,total:1},tied:[2]}).score"),60);
assert.equal(run("discardReviewRating({tile:1},{actual:{distance:5,total:0},best:{distance:0,total:1},tied:[2]}).score"),0);
assert.equal(run("discardReviewRating({tile:1},{actual:{distance:0,total:0},best:{distance:0,total:0},tied:[1]}).score"),100);
assert.match(run("roundReviewMarkup(roundHistory[0])"),/review-score/);
console.log('PASS: score ties, remaining-tile penalty, shanten priority, zero bounds, forced discards and per-move score slot.');
