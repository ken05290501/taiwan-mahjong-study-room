const tileImageCache=[];
const tileImagesReady=Promise.allSettled(Array.from({length:42},(_,id)=>new Promise(resolve=>{
  const image=new Image();
  image.decoding='async';
  image.onload=image.onerror=()=>resolve();
  image.src=`assets/tiles/${id}.svg`;
  tileImageCache.push(image);
})));
