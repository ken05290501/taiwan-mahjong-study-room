function jpHintResult(hand,winning,self){
  if(!g||g.rules.mode!=='jp')return null;
  return jpResult(self?[...hand,winning]:hand,g.mcore[0],{self,winning,seat:seatOf(0),round:g.wind,honba:g.honba,riichi:g.riichi[0],ippatsu:false,rinshan:false,last:false,indicators:g.indicators,ura:g.ura,sticks:g.sticks,from:seatOf(1)});
}
function jpWaitYakuStatus(hand,winning){
  const self=jpHintResult(hand,winning,true),ron=jpHintResult(hand,winning,false);
  if(self?.hupai?.length&&ron?.hupai?.length)return {kind:'both',label:'自摸／榮和有役',yaku:[...new Set([...self.hupai,...ron.hupai].map(x=>x.name))]};
  if(self?.hupai?.length)return {kind:'self',label:'僅自摸有役',yaku:self.hupai.map(x=>x.name)};
  if(ron?.hupai?.length)return {kind:'ron',label:'榮和有役',yaku:ron.hupai.map(x=>x.name)};
  return {kind:'none',label:'無役',yaku:[]};
}
function decorateJapaneseWaitHints(){
  if(!g||g.rules.mode!=='jp'||!g.rules.hint)return;
  const tilesOnScreen=[...document.querySelectorAll('.tipbox .hint-tiles .tile')];if(!tilesOnScreen.length)return;
  const current=g.h[0],hand=current.length%3===1?[...current]:selected>=0?current.filter((_,i)=>i!==selected):null;if(!hand)return;
  for(const button of tilesOnScreen){const winning=Number(button.dataset.tile),status=jpWaitYakuStatus(hand,winning);button.classList.add('wait-yaku-'+status.kind);button.title=`${names[winning]}｜${status.label}${status.yaku.length?'：'+status.yaku.join('、'):''}`;button.insertAdjacentHTML('beforeend',`<small class="wait-yaku-badge">${status.label}</small>${status.yaku.length?`<span class="wait-yaku-list">${status.yaku.join('、')}</span>`:''}`)}
}
const previewBeforeYakuHint=previewHandTile;
previewHandTile=function(i){previewBeforeYakuHint(i);if(!g||g.rules.mode!=='jp'||!g.rules.hint||g.turn!==0||g.phase!=='discard')return;const hand=g.h[0].filter((_,j)=>j!==i),waiting=shapeWaits(hand,true);if(!waiting.length)return;const hint=document.querySelector('#tile-hover-hint');if(!hint)return;hint.textContent='打出後聽：'+waiting.map(t=>`${names[t]}（${jpWaitYakuStatus(hand,t).label}）`).join('、');animateTileHint(hint)};
const renderBeforeYakuHints=render;
render=function(){renderBeforeYakuHints();decorateJapaneseWaitHints()};
