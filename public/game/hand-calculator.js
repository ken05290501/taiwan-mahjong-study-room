let handCalculatorState={
  tw:{hand:[],flowers:[],melds:[],meldDraft:[],target:'hand',self:true,seat:0,round:0,from:1,repeat:0,result:null,error:'',meldError:''},
  jp:{hand:[],dora:[],melds:[],meldDraft:[],target:'hand',self:true,seat:0,round:0,from:1,riichi:false,result:null,error:'',meldError:''}
};
FLOWER_NAMES.forEach((name,i)=>names[34+i]=name);

function calculatorState(){return handCalculatorState[yakuMode]}
function calculatorBaseLimit(){return yakuMode==='tw'?17:14}
function calculatorMeldLimit(){return yakuMode==='tw'?5:4}
function calculatorHandLimit(){return calculatorBaseLimit()-calculatorState().melds.length*3}
function calculatorAllTiles(includeDraft=true){
  const s=calculatorState();
  return [...s.hand,...(s.dora||[]),...s.melds.flatMap(m=>m.tiles),...(includeDraft?s.meldDraft:[])];
}
function calculatorTileCount(id,includeDraft=true){
  const base=baseTile(id);
  return calculatorAllTiles(includeDraft).filter(t=>baseTile(t)===base).length;
}
function calculatorSelectOptions(value){
  return ['東','南','西','北'].map((name,i)=>`<option value="${i}" ${value===i?'selected':''}>${name}</option>`).join('');
}
function calculatorFlowerTile(t,attrs=''){
  const name=FLOWER_NAMES[t-34];
  return `<button class="tile mini" ${attrs} data-tile-id="${t}" aria-label="${name}" title="${name}"><img src="assets/tiles/${t}.svg" alt="${name}" draggable="false" width="60" height="80"></button>`;
}
function calculatorMeldName(type){return {chi:'吃',pong:'碰',openKong:'明槓',closedKong:'暗槓'}[type]||type}
function calculatorMeldCode(m){
  const s=calculatorState(),tiles=[...m.tiles].sort((a,b)=>baseTile(a)-baseTile(b));
  if(m.type==='closedKong')return meldCode(tiles,null,s.seat,s.seat,true);
  const from=m.type==='chi'?(s.seat+3)%4:(s.seat+1)%4;
  return meldCode(tiles,tiles[0],s.seat,from);
}
function calculatorMeldValid(type,tiles){
  const bases=tiles.map(baseTile).sort((a,b)=>a-b);
  if(type==='chi')return bases.length===3&&bases[2]<27&&Math.floor(bases[0]/9)===Math.floor(bases[2]/9)&&bases[1]===bases[0]+1&&bases[2]===bases[1]+1;
  if(type==='pong')return bases.length===3&&bases.every(t=>t===bases[0]);
  return ['openKong','closedKong'].includes(type)&&bases.length===4&&bases.every(t=>t===bases[0]);
}
function calculatorHandMarkup(){
  const s=calculatorState(),limit=calculatorHandLimit();
  if(!s.hand.length)return `<p class="calculator-empty">點選下方牌面，輸入 ${limit} 張未副露手牌。</p>`;
  return s.hand.map((t,i)=>`<span class="calculator-hand-tile ${i===s.hand.length-1?'winning':''}">${tile(t,false,`type="button" data-calc-remove="${i}"`)}${i===s.hand.length-1?'<b>胡牌</b>':''}</span>`).join('');
}
function calculatorMeldsMarkup(){
  const s=calculatorState();
  if(!s.melds.length)return '';
  return `<div class="calculator-melds"><span>副露／槓</span>${s.melds.map((m,i)=>`<div><b>${calculatorMeldName(m.type)}</b>${m.tiles.map(t=>tile(t,true,'type="button" tabindex="-1"')).join('')}<button type="button" data-calc-remove-meld="${i}" aria-label="移除${calculatorMeldName(m.type)}">×</button></div>`).join('')}</div>`;
}
function calculatorPalette(){
  const s=calculatorState();
  if(yakuMode==='tw'&&s.target==='flowers'){
    return Array.from({length:8},(_,i)=>calculatorFlowerTile(34+i,`type="button" data-calc-add="${34+i}" ${s.flowers.includes(34+i)?'disabled':''}`)).join('');
  }
  const ids=Array.from({length:34},(_,i)=>i);
  if(yakuMode==='jp')ids.splice(5,0,104),ids.splice(15,0,113),ids.splice(25,0,122);
  return ids.map(t=>tile(t,true,`type="button" data-calc-add="${t}" ${calculatorTileCount(t)>=4?'disabled':''}`)).join('');
}
function calculatorMeldBuilder(){
  const s=calculatorState();
  if(s.target!=='meld')return '';
  return `<div class="calculator-meld-builder"><div class="calculator-meld-draft">${s.meldDraft.length?s.meldDraft.map((t,i)=>tile(t,false,`type="button" data-calc-remove-draft="${i}"`)).join(''):'<span>先選 3 張或 4 張牌</span>'}</div><div class="calculator-meld-actions"><button type="button" data-calc-meld="chi">加入吃</button><button type="button" data-calc-meld="pong">加入碰</button><button type="button" data-calc-meld="openKong">加入明槓</button><button type="button" data-calc-meld="closedKong">加入暗槓</button></div>${s.meldError?`<p class="calculator-meld-error" role="status">${s.meldError}</p>`:''}</div>`;
}
function calculatorShapeWaits(hand){
  return shapeWaits(hand,yakuMode==='jp');
}
function calculatorWaitHasYaku(hand,winning){
  if(yakuMode!=='jp')return true;
  const s=calculatorState(),codes=s.melds.map(calculatorMeldCode);
  try{
    const input=s.self?[...hand,winning]:hand;
    const result=jpResult(input,codes,{self:s.self,winning,seat:s.seat,round:s.round,riichi:s.riichi,indicators:s.dora,from:s.from});
    return !!result?.hupai?.length;
  }catch{return false}
}
function calculatorWaitRows(hand){
  const seen=counts(calculatorAllTiles(false));
  return calculatorShapeWaits(hand).map(t=>({tile:t,left:Math.max(0,4-seen[t]),yaku:calculatorWaitHasYaku(hand,t)}));
}
function calculatorAdvice(){
  const s=calculatorState(),limit=calculatorHandLimit();
  if(s.hand.length===limit-1){
    const waits=calculatorWaitRows(s.hand);
    if(!waits.length)return {kind:'none',text:'目前尚未聽牌，可再調整手牌或副露。'};
    return {kind:'waits',waits};
  }
  if(s.hand.length===limit){
    const rows=[];
    const checked=new Set();
    s.hand.forEach((discard,index)=>{
      const key=String(discard);
      if(checked.has(key))return;
      checked.add(key);
      const rest=s.hand.filter((_,i)=>i!==index),waits=calculatorWaitRows(rest);
      const legal=waits.filter(w=>w.left>0&&(yakuMode!=='jp'||w.yaku));
      rows.push({discard,waits,total:legal.reduce((n,w)=>n+w.left,0),quality:quality(rest)*10-(isRedDora(discard)?1:0)});
    });
    const max=Math.max(...rows.map(r=>r.total));
    if(max>0)return {kind:'discard',rows:rows.filter(r=>r.total===max).slice(0,3),max};
    const best=Math.max(...rows.map(r=>r.quality));
    return {kind:'shape',rows:rows.filter(r=>r.quality===best).slice(0,3)};
  }
  const missing=limit-s.hand.length;
  return {kind:'progress',text:missing>0?`再輸入 ${missing} 張手牌，就能分析聽牌或推薦出牌。`:`目前手牌多出 ${Math.abs(missing)} 張，請移除後再分析。`};
}
function calculatorAdviceMarkup(){
  const a=calculatorAdvice();
  if(a.kind==='progress'||a.kind==='none')return `<div class="calculator-advice"><strong>牌效率提示</strong><p>${a.text}</p></div>`;
  if(a.kind==='waits')return `<div class="calculator-advice"><strong>聽牌 ${a.waits.length} 種</strong><div class="calculator-waits">${a.waits.map(w=>`<span>${tile(w.tile,true,'type="button" tabindex="-1"')}<b>剩 ${w.left} 張</b>${yakuMode==='jp'? `<small class="${w.yaku?'has-yaku':'no-yaku'}">${w.yaku?'有役':'無役'}</small>`:''}</span>`).join('')}</div></div>`;
  if(a.kind==='discard')return `<div class="calculator-advice"><strong>推薦出牌</strong><p>以下選擇可聽到最多 ${a.max} 張有效牌。</p><div class="calculator-recommendations">${a.rows.map(r=>`<article><div>${tile(r.discard,true,'type="button" tabindex="-1"')}<b>打 ${names[r.discard]||names[baseTile(r.discard)]}</b></div><p>${r.waits.filter(w=>w.left>0&&(yakuMode!=='jp'||w.yaku)).map(w=>`${names[w.tile]} ${w.left} 張`).join('、')}</p></article>`).join('')}</div></div>`;
  return `<div class="calculator-advice"><strong>推薦整理方向</strong><p>目前沒有能立即聽牌的捨牌，建議先打出：</p><div class="calculator-shape-picks">${a.rows.map(r=>`<span>${tile(r.discard,true,'type="button" tabindex="-1"')}<b>${names[r.discard]||names[baseTile(r.discard)]}</b></span>`).join('')}</div><small>依搭子與對子連結度估算，未納入防守及做大牌取捨。</small></div>`;
}
function calculatorResultMarkup(){
  const s=calculatorState();
  if(s.error)return `<div class="calculator-result error" role="status"><strong>無法計算</strong><p>${s.error}</p></div>`;
  if(!s.result)return '<div class="calculator-result muted-result" role="status">完成手牌後可計算台數／番數；牌效率提示會隨輸入即時更新。</div>';
  if(yakuMode==='tw'){
    const r=s.result;
    return `<div class="calculator-result" role="status"><div class="calculator-total"><span>牌型合計</span><strong>${r.tai} 台</strong></div><ul>${r.items.map(x=>`<li><span>${x.name}${x.count>1?' × '+x.count:''}</span><b>${x.tai} 台</b></li>`).join('')||'<li><span>無加台牌型</span><b>0 台</b></li>'}</ul>${r.payments.length?`<div class="calculator-payments"><strong>付款試算</strong>${r.payments.map(x=>`<p><span>${x.label}</span><b>${x.tai} 台 · ${x.money.toLocaleString()} 點</b></p>`).join('')}</div>`:''}<small>採目前全會員共用台數；封頂、莊家與連莊已套用到付款試算。</small></div>`;
  }
  const r=s.result,items=r.hupai||[],total=r.damanguan?`${r.damanguan} 倍役滿`:`${r.fanshu} 番 ${r.fu} 符`;
  return `<div class="calculator-result" role="status"><div class="calculator-total"><span>和牌結果</span><strong>${total}</strong></div><ul>${items.map(x=>`<li><span>${x.name}</span><b>${typeof x.fanshu==='number'?x.fanshu+' 番':String(x.fanshu).replace(/\*/g,'役滿')}</b></li>`).join('')}</ul><div class="calculator-points"><span>${s.self?'自摸':'榮和'}得點</span><b>${Number(r.defen||0).toLocaleString()} 點</b></div><small>寶牌與赤牌會加番，但不能單獨構成役；未輸入的場況役不會計算。</small></div>`;
}
function handCalculatorView(){
  const s=calculatorState(),limit=calculatorHandLimit(),target=s.target;
  return `<section class="hand-calculator"><div class="calculator-heading"><div><span class="eyebrow">HAND CALCULATOR</span><h2>輸入手牌計算</h2><p>最後加入的手牌預設為胡牌；副露與槓請切換輸入區建立。</p></div><span class="calculator-count ${s.hand.length===limit?'complete':''}">${s.hand.length} / ${limit} 張${s.melds.length?` · ${s.melds.length} 組`:''}</span></div><div class="calculator-context"><div class="segmented"><button type="button" data-calc-self="true" class="${s.self?'active':''}">${s.self?'✓ ':''}自摸</button><button type="button" data-calc-self="false" class="${!s.self?'active':''}">${!s.self?'✓ ':''}${yakuMode==='jp'?'榮和':'放槍'}</button></div><label>門風<select data-calc-field="seat">${calculatorSelectOptions(s.seat)}</select></label><label>圈風<select data-calc-field="round">${calculatorSelectOptions(s.round)}</select></label>${!s.self?`<label>放槍者<select data-calc-field="from">${calculatorSelectOptions(s.from)}</select></label>`:''}${yakuMode==='tw'?`<label>連莊次數<input data-calc-field="repeat" type="number" min="0" max="99" value="${s.repeat}"></label>`:`<label class="calculator-check"><input data-calc-field="riichi" type="checkbox" ${s.riichi?'checked':''}>立直</label>`}</div><div class="calculator-selected"><div class="calculator-hand" aria-label="已輸入手牌">${calculatorHandMarkup()}</div>${calculatorMeldsMarkup()}${yakuMode==='tw'&&s.flowers.length?`<div class="calculator-extras"><span>花牌</span>${s.flowers.map((t,i)=>calculatorFlowerTile(t,`type="button" data-calc-remove-flower="${i}"`)).join('')}</div>`:''}${yakuMode==='jp'&&s.dora.length?`<div class="calculator-extras"><span>寶牌指示牌</span>${s.dora.map((t,i)=>tile(t,true,`type="button" data-calc-remove-dora="${i}"`)).join('')}</div>`:''}</div>${calculatorAdviceMarkup()}<div class="calculator-target segmented" role="group" aria-label="輸入區域"><button type="button" data-calc-target="hand" class="${target==='hand'?'active':''}">手牌</button><button type="button" data-calc-target="meld" class="${target==='meld'?'active':''}">副露／槓</button>${yakuMode==='tw'?`<button type="button" data-calc-target="flowers" class="${target==='flowers'?'active':''}">花牌</button>`:`<button type="button" data-calc-target="dora" class="${target==='dora'?'active':''}">寶牌指示牌</button>`}</div><div class="calculator-palette">${calculatorPalette()}</div>${calculatorMeldBuilder()}<div class="calculator-actions"><button type="button" data-calc-clear>清空</button><button type="button" class="primary" data-calc-run ${s.hand.length===limit?'':'disabled'}>計算${yakuMode==='tw'?'台數':'番數'}</button></div>${calculatorResultMarkup()}</section>`;
}
function addCalculatorMeld(type){
  const s=calculatorState(),tiles=[...s.meldDraft];
  s.meldError='';
  if(s.melds.length>=calculatorMeldLimit()){s.meldError=`最多可建立 ${calculatorMeldLimit()} 組副露或槓。`;render();return}
  if(!calculatorMeldValid(type,tiles)){s.meldError=type==='chi'?'吃牌必須選擇同花色的連續三張。':type==='pong'?'碰牌必須選擇三張相同牌。':'槓牌必須選擇四張相同牌。';render();return}
  const nextLimit=calculatorBaseLimit()-(s.melds.length+1)*3;
  if(s.hand.length>nextLimit){s.meldError=`建立後手牌區最多 ${nextLimit} 張，請先移除多餘手牌。`;render();return}
  s.melds.push({type,tiles});s.meldDraft=[];s.result=null;s.error='';render();
}
function runHandCalculator(){
  const s=calculatorState(),limit=calculatorHandLimit();s.result=null;s.error='';
  if(s.hand.length!==limit){s.error=`請輸入 ${limit} 張未副露手牌。`;render();return}
  const winning=s.hand.at(-1);
  try{
    if(yakuMode==='tw'){
      const melds=s.melds.map(m=>m.tiles),core=s.melds.map(m=>m.type==='closedKong'?'closed':'open+');
      const score=twEvaluate({hand:s.hand,melds,core,flowers:s.flowers,self:s.self,winning,seat:s.seat,round:s.round,rules:cfg.tw});
      if(!score){s.error='這副牌尚未形成台灣十六張的五面子加一對將。';render();return}
      const payers=s.self?[0,1,2,3].filter(x=>x!==s.seat):[s.from],rules=twNormalize(cfg.tw);
      const payments=payers.map(payer=>{let extras=0;if(s.seat===0||payer===0){if(rules.enabled.dealer)extras+=rules.values.dealer||0;if(rules.enabled.repeat&&s.repeat)extras+=(rules.values.repeat||0)*s.repeat}const raw=score.tai+extras,tai=rules.cap?Math.min(raw,rules.cap):raw,multiplier=!s.self&&rules.payment==='discarderAll'?3:1;return {label:s.self?`${'東南西北'[payer]}家支付`:`${'東南西北'[payer]}家放槍`,tai,money:(cfg.base+tai*cfg.unit)*multiplier}});
      s.result={...score,payments};
    }else{
      const input=s.self?s.hand:s.hand.slice(0,-1),codes=s.melds.map(calculatorMeldCode);
      const result=jpResult(input,codes,{self:s.self,winning,seat:s.seat,round:s.round,riichi:s.riichi,indicators:s.dora,from:s.from});
      if(!result?.hupai?.length){s.error=calculatorShapeWaits(s.hand.slice(0,-1)).includes(baseTile(winning))?'牌型已完成，但目前沒有役，不能和牌。':'這副牌尚未形成日本麻將的和牌牌型。';render();return}
      s.result=result;
    }
  }catch(error){console.warn(error);s.error='牌型無法計算，請確認牌數、副露與內容。'}
  render();
}
function bindHandCalculator(){
  if(route!=='yaku')return;
  const s=calculatorState();
  document.querySelectorAll('[data-calc-target]').forEach(b=>b.onclick=()=>{s.target=b.dataset.calcTarget;s.meldDraft=[];s.meldError='';s.result=null;s.error='';render()});
  document.querySelectorAll('[data-calc-self]').forEach(b=>b.onclick=()=>{s.self=b.dataset.calcSelf==='true';s.result=null;s.error='';render()});
  document.querySelectorAll('[data-calc-add]').forEach(b=>b.onclick=()=>{const t=+b.dataset.calcAdd;if(yakuMode==='tw'&&s.target==='flowers'){if(!s.flowers.includes(t))s.flowers.push(t)}else if(yakuMode==='jp'&&s.target==='dora'){if(s.dora.length<5&&calculatorTileCount(t)<4)s.dora.push(t)}else if(s.target==='meld'){if(s.meldDraft.length<4&&calculatorTileCount(t)<4)s.meldDraft.push(t)}else if(s.hand.length<calculatorHandLimit()&&calculatorTileCount(t)<4)s.hand.push(t);s.result=null;s.error='';s.meldError='';render()});
  document.querySelectorAll('[data-calc-remove]').forEach(b=>b.onclick=()=>{s.hand.splice(+b.dataset.calcRemove,1);s.result=null;s.error='';render()});
  document.querySelectorAll('[data-calc-remove-draft]').forEach(b=>b.onclick=()=>{s.meldDraft.splice(+b.dataset.calcRemoveDraft,1);s.meldError='';render()});
  document.querySelectorAll('[data-calc-remove-meld]').forEach(b=>b.onclick=()=>{s.melds.splice(+b.dataset.calcRemoveMeld,1);s.result=null;s.error='';render()});
  document.querySelectorAll('[data-calc-remove-flower]').forEach(b=>b.onclick=()=>{s.flowers.splice(+b.dataset.calcRemoveFlower,1);s.result=null;render()});
  document.querySelectorAll('[data-calc-remove-dora]').forEach(b=>b.onclick=()=>{s.dora.splice(+b.dataset.calcRemoveDora,1);s.result=null;render()});
  document.querySelectorAll('[data-calc-meld]').forEach(b=>b.onclick=()=>addCalculatorMeld(b.dataset.calcMeld));
  document.querySelectorAll('[data-calc-field]').forEach(el=>el.onchange=()=>{const key=el.dataset.calcField;s[key]=el.type==='checkbox'?el.checked:Number(el.value);s.result=null;s.error='';render()});
  document.querySelector('[data-calc-clear]')?.addEventListener('click',()=>{s.hand=[];s.melds=[];s.meldDraft=[];if(s.flowers)s.flowers=[];if(s.dora)s.dora=[];s.result=null;s.error='';s.meldError='';render()});
  document.querySelector('[data-calc-run]')?.addEventListener('click',runHandCalculator);
}

const handCalculatorBaseRender=render;
render=function(){handCalculatorBaseRender();bindHandCalculator()};
if(route==='yaku')render();
let liveAnalysisCache={key:'',html:''};
function liveAnalysisMarkup(){
  if(!cfg.liveAnalysis)return '';
  if(!g||g.end)return '<section class="live-analysis"><b>即時分析</b><span>下一局開始後顯示。</span></section>';
  if(g.turn!==0||g.phase!=='discard')return '<section class="live-analysis"><b>即時分析</b><span>輪到你時顯示推薦出牌。</span></section>';
  const hand=g.h[0].map(baseTile),legal=[...new Set(g.h[0].filter((_,i)=>allowedDiscard(i)&&(!riichiPicking||riichiDiscards(0).includes(i))).map(baseTile))];
  if(!legal.length)return '';
  const seen=counts([...hand,...g.river.map(x=>baseTile(x.t)),...g.m.flat(2).map(baseTile),...g.indicators.map(baseTile)]),key=[g.rules.mode,hand.join(','),legal.join(','),seen.join(','),g.mcore[0].join('|')].join(';');
  if(liveAnalysisCache.key===key)return liveAnalysisCache.html;
  const move={hand,seen,legal,tile:legal[0],drawn:g.drawn[0]===null?null:baseTile(g.drawn[0]),melds:g.m[0].map(m=>m.map(baseTile)),codes:[...g.mcore[0]]};
  const a=analyzeDiscardReview(move,g.rules.mode),best=a.rows.filter(x=>x.distance===a.best.distance&&x.total===a.best.total).slice(0,4);
  const cards=best.map(row=>{let extra='';if(g.rules.mode==='jp'&&row.distance===0){const rest=[...hand];rest.splice(rest.indexOf(row.tile),1);const waits=shapeWaits(rest,true);extra=waits.length?`<small>${waits.map(t=>names[t]+'：'+jpWaitYakuStatus(rest,t).label).join('、')}</small>`:''}return `<span class="live-choice">${tile(row.tile,true,'tabindex="-1"')}<strong>${reviewDistance(row.distance)}</strong><em>${row.total} 張進張</em>${extra}</span>`}).join('');
  const html=`<section class="live-analysis"><div><b>即時牌效分析</b><span>${g.rules.mode==='jp'?'含有役檢查；不含防守風險':'依可見牌扣除剩餘進張'}</span></div><div class="live-choices">${cards}</div></section>`;
  liveAnalysisCache={key,html};return html;
}
function mountLiveAnalysis(){
  const tools=document.querySelector('.game-tools'),menu=tools?.querySelector('.game-menu-panel')||tools;if(tools&&!tools.querySelector('#live-analysis-toggle')){const b=document.createElement('button');b.id='live-analysis-toggle';b.type='button';b.setAttribute('role','menuitem');b.setAttribute('aria-pressed',String(!!cfg.liveAnalysis));b.textContent='即時分析：'+(cfg.liveAnalysis?'開':'關');b.onclick=()=>{cfg.liveAnalysis=!cfg.liveAnalysis;try{localStorage.setItem('mj-rules',JSON.stringify(cfg))}catch{}liveAnalysisCache.key='';render()};menu.insertBefore(b,menu.querySelector('#game-restart'))}
  const hand=document.querySelector('.hand-zone');if(!hand||hand.querySelector('.live-analysis'))return;const marker=hand.querySelector('#tile-hover-hint');marker?.insertAdjacentHTML('beforebegin',liveAnalysisMarkup());
}
const renderBeforeLiveAnalysis=render;render=function(){renderBeforeLiveAnalysis();mountLiveAnalysis()};mountLiveAnalysis();
