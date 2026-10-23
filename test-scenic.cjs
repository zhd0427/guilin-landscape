const assert=require('node:assert/strict');
const {createImageLoader,createSelection,camera}=require('./dist/scenic-loader.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const pending=new Map();
class FakeImage{
 constructor(){this.naturalWidth=1280;}
 set src(value){this.url=value;pending.set(value,this);}
 decode(){return new Promise(resolve=>this.finishDecode=resolve);}
}
(async()=>{
 const images=createImageLoader(FakeImage),commits=[],errors=[],busy=[];
 const select=createSelection(i=>images.load(i),(i,image)=>commits.push([i,image.url]),i=>busy.push(i),i=>errors.push(i));
 const first=select('elephant'),second=select('nine');
 pending.get('nine').onload();await tick();
 assert.equal(commits.length,0,'Do not switch text or photo before decode completes');
 pending.get('nine').finishDecode();await second;
 pending.get('elephant').onload();await tick();pending.get('elephant').finishDecode();await first;
 assert.deepEqual(commits,[['nine','nine']],'A late earlier image must not replace the last selection');
 const before=pending.size;await select('nine');assert.equal(pending.size,before,'Cached selections need no new request');
 const failed=select('yellow');pending.get('yellow').onerror();await failed;
 assert.equal(commits.length,2,'Keep the matching old photo and text on a loading error');assert.deepEqual(errors,['yellow']);
 const retry=select('yellow');pending.get('yellow').onload();await tick();pending.get('yellow').finishDecode();await retry;
 assert.deepEqual(commits.at(-1),['yellow','yellow'],'Failed photos can be retried');
 for(const point of [[.22,.75],[.57,.46],[.58,.52],[0,1]]){
  const c=camera(point,1.85),limit=(c.zoom-1)*50;
  assert.ok(Math.abs(c.x)<=limit&&Math.abs(c.y)<=limit,'A detail crop must not reveal empty edges');
 }
 assert.deepEqual(camera([.22,.75],1),{zoom:1,x:0,y:0});
 console.log('Passed: decode-before-commit, fast-click race, shared cache, failure/retry and bounded detail camera.');
})().catch(error=>{console.error(error);process.exitCode=1});
