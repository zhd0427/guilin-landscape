(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.GuilinFractures=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const nodes=Array.from({length:20},(_,i)=>({x:55+(i%5)*135+Math.sin(i*5)*9,y:55+Math.floor(i/5)*76+Math.sin(i*7)*7}));
  // A connected tree gives exactly one inlet-to-outlet path. The 18–19 gap is
  // visible in the same edge data that controls movement, so side branches end honestly.
  const edges=[[0,1],[1,2],[2,3],[3,4],[1,6],[6,5],[5,10],[6,7],[7,8],[8,9],[7,12],[12,11],[11,16],[12,13],[13,14],[13,18],[17,16],[16,15],[18,19]];
  const adjacency=nodes.map((_,i)=>edges.filter(e=>e.includes(i)).map(e=>e[0]===i?e[1]:e[0]));
  function move(path,next){
    if(!Array.isArray(path)||!path.length||!Number.isInteger(next)||!adjacency[next])return null;
    const current=path[path.length-1];
    if(!adjacency[current])return null;
    if(next===current)return path.slice();
    if(!adjacency[current].includes(next))return null;
    const visited=path.indexOf(next);
    return visited>=0?path.slice(0,visited+1):path.concat(next);
  }
  function route(start,goal=19){
    if(!adjacency[start]||!adjacency[goal])return [];
    const queue=[[start]],seen=new Set([start]);
    for(let i=0;i<queue.length;i++){
      const path=queue[i],current=path[path.length-1];
      if(current===goal)return path;
      for(const next of adjacency[current])if(!seen.has(next)){seen.add(next);queue.push(path.concat(next))}
    }
    return [];
  }
  return {nodes,edges,adjacency,move,route};
});
