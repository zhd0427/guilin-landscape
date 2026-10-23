const assert=require('node:assert/strict');
const {nodes,edges,adjacency,move,route}=require('./dist/fracture-model.js');
function follow(numbered){let path=[numbered[0]-1];for(const n of numbered.slice(1)){path=move(path,n-1);assert.ok(path,`Connected route rejected at ${n}`)}return path}
assert.equal(follow([1,2,7,8,13,14,19,20]).at(-1),19);
const sideBranch=follow([1,2,7,8,13,12,17,18]);
assert.equal(move(sideBranch,18),null,'The visible 18–19 gap must block the former alternative');
assert.equal(follow([1,2,7,8,13,12,17,18,17,12,13,14,19,20]).at(-1),19,'Players must be able to return from the side branch and finish');
assert.equal(move([0],19),null,'Disconnected jumps must not be accepted');
assert.equal(move([0],20),null,'Out-of-range junctions must not be accepted');
for(const [a,b]of edges){assert.equal(Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5)),1,'No segment may silently skip a grid junction');assert.ok(adjacency[a].includes(b)&&adjacency[b].includes(a))}
for(let start=0;start<nodes.length;start++){const hint=route(start);assert.equal(hint[0],start);assert.equal(hint.at(-1),19);assert.equal(new Set(hint).size,hint.length);for(let i=1;i<hint.length;i++)assert.ok(adjacency[hint[i-1]].includes(hint[i]),'Hints must follow actual rendered connections')}
function countRoutes(current,visited=new Set()){
  if(current===19)return 1;
  const seen=new Set(visited).add(current);
  return adjacency[current].filter(next=>!seen.has(next)).reduce((count,next)=>count+countRoutes(next,seen),0);
}
assert.equal(edges.length,nodes.length-1,'All connected nodes must form a tree');
assert.equal(countRoutes(0),1,'Exactly one simple inlet-to-outlet path is allowed');
console.log('Passed: exactly one solution, blocked former bypass, side-branch return, disconnected jumps, edge geometry and all hints.');
