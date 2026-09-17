function addedKongChoices(p=0){
  if(!g||g.end||g.turn!==p||g.phase!=='discard'||g.riichi[p]||!g.rules.pong||!g.wall.length||(g.rules.mode==='jp'&&g.kongs>=4))return [];
  return g.m[p].map((meld,index)=>({meld,index,base:meld.length===3&&meld.every(t=>baseTile(t)===baseTile(meld[0]))?baseTile(meld[0]):-1})).filter(x=>x.base>=0&&g.h[p].some(t=>baseTile(t)===x.base));
}
function addedKong(p,t){
  const b=baseTile(t),choice=addedKongChoices(p).find(x=>x.base===b);if(!choice)return;
  const handIndex=g.h[p].findIndex(x=>baseTile(x)===b),actual=g.h[p].splice(handIndex,1)[0];
  g.ippatsu.fill(false);choice.meld.push(actual);sort(choice.meld);
  if(g.mcore[p][choice.index])g.mcore[p][choice.index]+=jpTile(actual)[1];
  g.drawn[p]=null;g.log.unshift(`${who[p]}加槓${names[b]}`);
  if(!draw(p,true)){render();return}effect('加槓',p,b);selected=-1;render();
}
const renderBeforeAddedKong=render;
render=function(){
  renderBeforeAddedKong();
  document.documentElement.classList.toggle('motion-off',g?.rules?.motion===false);
  const actions=document.querySelector('.control-bar .actions');if(!actions)return;
  for(const choice of addedKongChoices(0)){
    const button=document.createElement('button');button.className='primary added-kong';button.textContent='加槓 '+names[choice.base];button.onclick=()=>addedKong(0,choice.base);actions.appendChild(button);
  }
};
