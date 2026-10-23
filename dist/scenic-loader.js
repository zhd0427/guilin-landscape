(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GuilinScenic=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 function createImageLoader(ImageType,onSettled=()=>{}){
  const cache=new Map();
  function get(src){
   if(cache.has(src))return cache.get(src);
   const image=new ImageType(),record={image,ready:false,error:false};
   cache.set(src,record);image.decoding='async';
   record.promise=new Promise(resolve=>{
    image.onload=async()=>{
     // Never replace the visible photograph until its pixels are decoded.
     try{if(image.decode)await image.decode();}catch{}
     record.ready=image.naturalWidth>0;record.error=!record.ready;
     resolve(record);onSettled(record);
    };
    image.onerror=()=>{record.error=true;resolve(record);onSettled(record);};
    image.src=src;
   });
   return record;
  }
  return {get,load(src){if(cache.get(src)?.error)cache.delete(src);return get(src).promise;},preload(urls){return Promise.all(urls.map(src=>get(src).promise));}};
 }
 function createSelection(load,commit,onPending=()=>{},onError=()=>{}){
  let request=0;
  return async function select(index){
   const ticket=++request;onPending(index);
   try{const record=await load(index);if(ticket!==request)return false;
    if(!record.ready){onError(index);return false;}
    commit(index,record.image);return true;
   }catch(error){if(ticket===request)onError(index,error);return false;}
  };
 }
 function camera(focus,zoom){if(zoom===1)return {zoom:1,x:0,y:0};const limit=(zoom-1)/2;return {zoom,x:Math.max(-limit,Math.min(limit,(.5-focus[0])*zoom))*100,y:Math.max(-limit,Math.min(limit,(.5-focus[1])*zoom))*100};}
 return {createImageLoader,createSelection,camera};
});
