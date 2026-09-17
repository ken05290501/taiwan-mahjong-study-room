function bindRoundEndAction(){
  if(!g?.end)return;
  const bar=document.querySelector('.control-bar'),actions=bar?.querySelector('.actions'),status=bar?.querySelector('.status');if(!actions)return;
  const label=nextMatchLabel();
  actions.innerHTML=`<button id="round-end-next" class="primary round-end-next" type="button">${label} →</button>`;
  actions.querySelector('#round-end-next').onclick=()=>{clearTimeout(timer);advanceMatch()};
  if(status){const detail=status.querySelector('span');if(detail)detail.textContent=`${g.end}。查看結算後，按「${label}」繼續。`}
}
const renderBeforeEndFlow=render;
render=function(){renderBeforeEndFlow();bindRoundEndAction()};
