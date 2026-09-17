const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const sources=['vendor/majiang.js','engine.js','taiwan.js','match.js','japanese.js','yaku.js','enhance.js','quiz-bank.js','discard-challenges.js','experience.js','review.js','history.js','app.js'];let queue=[];let ctx={console,setTimeout:f=>(queue.push(f),queue.length),clearTimeout:()=>{queue=[]},localStorage:{getItem:()=>null},Date,location:{hash:'#play'},window:{addEventListener(){}},document:{querySelector:()=>null,querySelectorAll:()=>[]},confirm:()=>true};let code=sources.map(f=>fs.readFileSync('dist/'+f,'utf8')).join('\n');code=code.slice(0,code.indexOf("$('#settings').onclick="));vm.createContext(ctx);vm.runInContext(code+'\nrender=()=>{};',ctx);
function run(s){return vm.runInContext(s,ctx)}
assert.equal(run('jpShape([0,0,2,2,5,5,9,9,12,12,18,18,33,33])'),true);
assert.equal(run('jpShape([0,8,9,17,18,26,27,28,29,30,31,32,33,33])'),true);
assert.equal(run('jpResult([0,0,2,2,5,5,9,9,12,12,18,18,33,33],[],{seat:1}).fu'),25);
assert.ok(run('jpResult([0,1,2,3,4,5,9,10,11,18,19,20,27,27],[],{seat:1}).hupai.some(x=>x.name.includes("自摸"))'));
for(const mode of ['tw','jp'])for(let k=0;k<35;k++){
 run(`cfg.mode='${mode}';start();`);let steps=0;
 while(!run('!!g.end')&&steps++<700){
   if(queue.length){queue.shift()();}
   else if(run("g.phase==='claim'")){run('pass()')}
   else if(run("g.phase==='discard'&&g.turn===0")){run("if(gameWin(0,true)){won(0,true)}else{let r=riichiDiscards(0);let a=g.h[0].map((_,i)=>i).filter(allowedDiscard);let b=best(g.h[0]).find(i=>a.includes(i));discard(r.length?r[0]:b??a[0],!!r.length)}")}
   else throw Error('stalled '+run('g.phase'));
   assert.equal(run('g.wall.length+g.dead.length+g.h.flat().length+g.m.flat(2).length+g.river.length+g.flowers.reduce((a,b)=>a+b,0)'),mode==='jp'?136:144);
   assert.equal(run('counts([...g.wall,...g.dead,...g.h.flat(),...g.m.flat(2),...g.river.map(x=>x.t)].filter(t=>t<34||t>=100)).every(n=>n===4)'),true);
 }
 assert.ok(run('!!g.end'),'game must finish');
}
run("cfg.mode='jp';start();g.h[0]=[0,1,2,3,4,5,9,10,11,18,19,20,27];g.history[0]=[27];");assert.equal(run('gameWin(0,false,27,1)'),false);
run("redScore=jpResult([0,1,2,3,104,5,9,10,11,18,19,20,27,27],[],{self:true,winning:27,riichi:true,indicators:[3]});normalScore=jpResult([0,1,2,3,4,5,9,10,11,18,19,20,27,27],[],{self:true,winning:27,riichi:true,indicators:[3]})");
assert.equal(run("redScore.hupai.some(x=>x.name==='赤ドラ'&&x.fanshu===1)"),true);
assert.equal(run("redScore.hupai.some(x=>x.name==='ドラ'&&x.fanshu===1)"),true);
assert.equal(run('redScore.fanshu'),run('normalScore.fanshu')+1);
run("cfg.mode='jp';cfg.redDora=true;start();allTiles=[...g.wall,...g.dead,...g.h.flat()]");assert.deepEqual([...run('allTiles.filter(isRedDora).sort((a,b)=>a-b)')],[104,113,122]);
run("cfg.redDora=false;start();allTiles=[...g.wall,...g.dead,...g.h.flat()]");assert.equal(run('allTiles.filter(isRedDora).length'),0);
run("cfg.redDora=true;start();g.h[0]=[0,1,2,3,4,5,9,10,11,18,19,20,27];g.history[0]=[27]");
run("g.history[0]=[];g.furiten[0]=true;");assert.equal(run('gameWin(0,false,27,1)'),false);
run("g.furiten[0]=false;g.riichi[0]=true;g.h[0].push(28);g.drawn[0]=28");assert.equal(run('allowedDiscard(0)'),false);assert.equal(run('allowedDiscard(13)'),true);
for(const mode of ['tw','jp'])for(const route of ['wait','discard'])for(let k=0;k<30;k++){run(`cfg.mode='${mode}';route='${route}';makeQuiz()`);assert.equal(run('quiz.h.length'),mode==='jp'?(route==='wait'?13:14):(route==='wait'?16:17));assert.ok(run('quiz.answer.length>0'));if(route==='discard')assert.equal(run("quiz.mode==='jp'?jpShape(quiz.h):win(quiz.h)"),false,'discard quiz must not already win');}
assert.equal(run('win([4,5,6,13,13,19,20,20,20,20,21,21,22,22,22,22,23])'),true,'reported screenshot is a winning hand');
console.log('PASS: 70 complete games, physical tile conservation, Japanese special hands/scoring, furiten, riichi lock, 120 quizzes.');
run("cfg.mode='jp';start();g.h[1]=[0,1,2,12,13,14,18,19,20,27];g.mcore[1]=['s555-'];g.indicators=[21];g.riichi[1]=false;g.history[1]=[];g.furiten[1]=false");assert.equal(run('gameWin(1,false,27,0)'),false,'dora alone must not count as yaku');
run("start();g.h[1]=[0,1,2,3,4,5,9,10,11,18,19,20,27];g.riichi[1]=true;g.riichi[0]=true;g.scores=[24000,24000,25000,25000];g.sticks=2;g.river=[{p:0,t:27,riichi:true}];g.history[1]=[];g.furiten[1]=false;won(1,false,27,0)");assert.equal(run('g.riichi[0]'),false);assert.equal(run('g.scores.reduce((a,b)=>a+b,0)'),100000,'declaration ron refunds unaccepted riichi deposit');
console.log('PASS: no-yaku dora rejection and interrupted riichi settlement.');
