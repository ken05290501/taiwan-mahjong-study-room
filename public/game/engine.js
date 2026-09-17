const names=Array.from({length:34},(_,i)=>i<27?'一二三四五六七八九'[i%9]+['萬','筒','索'][Math.floor(i/9)]:['東','南','西','北','中','發','白'][i-27]);
function baseTile(t){return t>=100?t-100:t}
function isRedDora(t){return t===104||t===113||t===122}
for(const t of [4,13,22])names[100+t]='赤'+names[t];
function counts(h){let c=Array(34).fill(0);h.forEach(t=>c[baseTile(t)]++);return c}
function win(h){if(h.length%3!==2)return false;let c=counts(h);function meld(){let i=c.findIndex(n=>n>0);if(i<0)return true;if(c[i]>=3){c[i]-=3;if(meld()){c[i]+=3;return true}c[i]+=3}if(i<27&&i%9<7&&c[i+1]&&c[i+2]){c[i]--;c[i+1]--;c[i+2]--;let ok=meld();c[i]++;c[i+1]++;c[i+2]++;if(ok)return true}return false}for(let i=0;i<34;i++)if(c[i]>=2){c[i]-=2;let ok=meld();c[i]+=2;if(ok)return true}return false}
function waits(h){let c=counts(h);return names.map((_,i)=>i).filter(i=>c[i]<4&&win([...h,i]))}
function quality(h){let c=counts(h),s=0;for(let i=0;i<34;i++){if(c[i]>=2)s+=c[i]===2?5:11;if(i<27){if(i%9<8&&c[i]&&c[i+1])s+=4;if(i%9<7&&c[i]&&c[i+2])s+=2}}return s}
function best(h){let top=-1e9,res=[];h.forEach((t,i)=>{let a=h.filter((_,j)=>j!==i),w=waits(a),q=w.length?1000+w.reduce((s,t)=>s+4-counts(a)[t],0):quality(a);if(q>top){top=q;res=[i]}else if(q===top)res.push(i)});return res}
function shuffle(a){if(a.length===136&&typeof cfg!=='undefined'&&cfg.mode==='jp'&&cfg.redDora)for(const t of [4,13,22]){const i=a.indexOf(t);if(i>=0)a[i]=100+t}for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function sort(h){return h.sort((a,b)=>baseTile(a)-baseTile(b)||(isRedDora(a)?1:0)-(isRedDora(b)?1:0))}
