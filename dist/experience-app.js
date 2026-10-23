'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],T=(zh,en)=>lang==='zh'?zh:en;
let lang='zh';try{lang=localStorage.getItem('guilin-language')==='en'?'en':'zh'}catch{}
let place=0,palette='jade',inkView=false,cardMode='art',geoView='surface',playing=false,playFrame=0,geoVisible=false;
let waterPath=[0],waterRunning=false,waterComplete=false,waterProgress=0,hintVisible=false,waterFrame=0,boarding=false;
let cardInspiration=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function bilingual(element,zh,en,html=false){
 element.classList.add('bilingual-text');element.replaceChildren();
 const values=lang==='zh'?[[zh,'zh-CN'],[en,'en']]:[[en,'en'],[zh,'zh-CN']];
 values.forEach(([value,language],index)=>{const span=document.createElement('span');span.className=index?'reading-translation':'reading-primary';span.lang=language;if(html)span.innerHTML=value;else span.textContent=value;element.append(span)});
}
window.GuilinBilingual={render:bilingual};
const realPlaces=window.GuilinContent.places,cultureWorks=window.GuilinContent.works;
const stages=[
 ['ROCK & FRACTURES','先有岩石，也先有裂隙','Rock, with a way in','石灰岩中的节理、裂隙与层面为水提供了通道。地形演化还受构造、岩性和排水条件影响，起点不是一整块没有缝隙的石头。','Joints, fractures and bedding planes give water a way into limestone. Structure, rock type and drainage also matter; the starting point is not a perfectly solid block.'],
 ['INFILTRATION & DISSOLUTION','水从土壤，走进岩石','From soil into stone','降水在空气和土壤中吸收二氧化碳，变得微酸。水沿裂隙渗流时缓慢溶解石灰岩，地表与地下的水路逐渐改变。','Rainwater absorbs carbon dioxide from air and soil and becomes mildly acidic. Moving through fractures, it slowly dissolves limestone and modifies water pathways.'],
 ['OPENINGS & DRAINAGE','通道扩大，谷地展开','Passages widen. Valleys open.','长时间的溶蚀可扩大地下裂隙与洞道。地表河流、溶蚀及排水条件共同参与谷地的发展；地下洞穴不是所有山峰形成的必经阶段。','Over time, dissolution can widen fractures and cave passages. Rivers, dissolution and drainage help develop valleys; caves are not a mandatory stage for every peak.'],
 ['DIVERSE KARST LANDSCAPES','同一片桂林，多样的山水','Different forms, side by side','相连基部的峰丛与较平坦地面上的峰林可以共存。河流与地下水继续作用，这些形态并非统一年代刻度上的固定终点。','Cone karst with connected bases and tower karst above flatter ground can coexist. Rivers and groundwater remain active; these forms are not fixed endpoints on a single age scale.']
];
let detailView=false,pendingPlace=null,cameraRequest=0;
const scenicImages=window.GuilinScenic.createImageLoader(Image,()=>{if(cardMode==='photo')drawPostcard()});
function renderCamera(){
 const p=realPlaces[place],d=p.detail,img=$('#destination-photo'),c=window.GuilinScenic.camera(d.point,detailView?d.zoom:1);
 img.classList.toggle('close-view',detailView);
 img.style.setProperty('--zoom',String(c.zoom));img.style.setProperty('--pan-x',c.x+'%');img.style.setProperty('--pan-y',c.y+'%');
 const button=$('#reset-camera');button.textContent=detailView?T('↔ 返回全景','↔ Full view'):T('⌕ 看'+d.label,'⌕ View detail');
 button.setAttribute('aria-label',detailView?T('返回全景','Back to full view'):T('放大查看'+d.label,'Explore '+d.labelEn));
 button.setAttribute('aria-pressed',String(detailView));
 $('#scenic-focus').style.left=d.point[0]*100+'%';$('#scenic-focus').style.top=d.point[1]*100+'%';
 $('#scenic-focus').hidden=detailView;$('#scenic-focus-label').textContent=T(d.label,d.labelEn);
 $('#scenic-focus').setAttribute('aria-label',T('放大查看'+d.label,'Explore '+d.labelEn));
 bilingual($('#camera-caption'),detailView?d.note:'全景 · 点击「'+d.label+'」或右上角按钮，走近细节。',detailView?d.noteEn:'Full view · select “'+d.labelEn+'” or the button above to explore the detail.');
}
function renderPlace(zoom=detailView){
 detailView=zoom;const p=realPlaces[place],img=$('#destination-photo');img.alt=T(p.name+'实景',p.en+' photograph');
 $('#place-index').textContent=String(place+1).padStart(2,'0');$('#place-en').textContent=p.en.toUpperCase();$('#place-title').textContent=T(p.name,p.en);
 $('#destination-name').textContent=T(p.name,p.en);$('#destination-region').textContent=T(p.region,p.regionEn);bilingual($('#place-location'),'⌖ '+p.location,'⌖ '+p.locationEn);
 bilingual($('#place-description'),p.story,p.storyEn);bilingual($('#place-look'),p.look,p.lookEn);$('#place-source').href=p.source;
 $('#photo-credit').textContent=p.author+' · '+p.license+' · '+T('全景 / 细节','full view / detail');
 $$('[data-place]').forEach(b=>{const active=Number(b.dataset.place)===place;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 renderPending();renderCamera();
}
function renderPending(error=false){
 const loading=$('#scenic-loading');loading.hidden=pendingPlace===null&&!error;
 loading.textContent=error?T('这张照片暂时未能载入，请再次选择景点。','Photo unavailable. Select the stop to retry.'):pendingPlace===null?'':T('正在前往 '+realPlaces[pendingPlace].name+'…','Opening '+realPlaces[pendingPlace].en+'…');
 $('.destination-photo-stage').setAttribute('aria-busy',String(pendingPlace!==null));
 $$('[data-place]').forEach(b=>b.classList.toggle('pending',Number(b.dataset.place)===pendingPlace));
 // Avoid exporting an old photograph while a different stop is opening.
 $('#collect-place').disabled=pendingPlace!==null;
}
function showScenicImage(image,fade=true){
 const previous=$('#destination-photo');if(previous===image)return;
 image.id='destination-photo';image.className='scenic-photo scenic-fresh';image.removeAttribute('aria-hidden');image.alt=previous.alt;image.width=1920;image.height=1280;
 previous.removeAttribute('id');previous.setAttribute('aria-hidden','true');previous.classList.add('scenic-outgoing');
 previous.after(image);renderCamera();requestAnimationFrame(()=>requestAnimationFrame(()=>image.classList.remove('scenic-fresh')));
 if(fade&&!reducedMotion){image.classList.add('scenic-entering');setTimeout(()=>image.classList.remove('scenic-entering'),400);setTimeout(()=>{if(previous.classList.contains('scenic-outgoing'))previous.remove()},400);}else previous.remove();
}
const selectScenicPlace=window.GuilinScenic.createSelection(
 index=>scenicImages.load(realPlaces[index].preview),
 (index,image)=>{cameraRequest++;place=index;pendingPlace=null;detailView=false;showScenicImage(image);renderPlace(false);},
 index=>{pendingPlace=index;renderPending();},
 ()=>{pendingPlace=null;renderPending(true);}
);
$$('[data-place]').forEach(b=>{
 const preload=()=>scenicImages.get(realPlaces[Number(b.dataset.place)].preview);
 b.addEventListener('pointerenter',preload,{passive:true});b.addEventListener('focus',preload);
 b.addEventListener('click',()=>selectScenicPlace(Number(b.dataset.place)));
});
async function toggleScenicDetail(){
 const ticket=++cameraRequest;detailView=!detailView;renderCamera();if(!detailView)return;
 // Upgrade sharpness after the move, avoiding a mid-animation jump on fast connections.
 const selected=place,[record]=await Promise.all([scenicImages.load(realPlaces[selected].image),new Promise(resolve=>setTimeout(resolve,reducedMotion?0:1000))]);
 if(ticket===cameraRequest&&record.ready&&selected===place&&detailView&&pendingPlace===null){showScenicImage(record.image,false);renderPlace(true);}
}
$('#reset-camera').addEventListener('click',toggleScenicDetail);
$('#scenic-focus').addEventListener('click',toggleScenicDetail);

$('#board-raft').addEventListener('click',()=>{if(boarding)return;boarding=true;$('#home').classList.add('boarding');$('#board-raft').disabled=true;setTimeout(()=>{$('#journey').scrollIntoView({behavior:reducedMotion?'instant':'smooth'});history.replaceState(null,'','#journey');setTimeout(()=>{$('#home').classList.remove('boarding');$('#board-raft').disabled=false;boarding=false},1000)},reducedMotion?0:850)});
let collectionFeedbackTimer;
function confirmPostcardUpdate(){
 let notice=$('#collection-feedback');
 if(!notice){notice=document.createElement('p');notice.id='collection-feedback';notice.className='collection-feedback';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');document.body.append(notice)}
 clearTimeout(collectionFeedbackTimer);notice.hidden=false;notice.textContent=T('✓ 已加入明信片，可继续浏览。','✓ Added to your postcard. Keep exploring.');
 collectionFeedbackTimer=setTimeout(()=>{notice.hidden=true},3200);
}
$('#collect-place').addEventListener('click',()=>{$('#card-place').value=String(place);$('#photo-pan').value='50';setCardMode('photo');confirmPostcardUpdate()});
function setLanguage(next){lang=next;document.documentElement.lang=lang==='zh'?'zh-CN':'en';$$('[data-zh][data-en]').forEach(e=>{if(e.matches('p,h2,h3,h4'))bilingual(e,e.dataset.zh,e.dataset.en,true);else e.innerHTML=e.dataset[lang]});$('#language').innerHTML=lang==='zh'?'EN first <span>↗</span>':'中文优先 <span>↗</span>';$('#language').setAttribute('aria-label',T('Put English first; both languages remain visible','中文优先；保留中英对照'));const c=$('#card-caption');if(['此刻，心在山水之间。','Between mountains and water.'].includes(c.value))c.value=T('此刻，心在山水之间。','Between mountains and water.');c.placeholder=T('写一句心情','Write a little message');$('#geo-canvas').setAttribute('aria-label',T('可控制的地表与地下喀斯特过程示意','Interactive surface and underground karst process illustration'));$('#postcard-canvas').setAttribute('aria-label',T('你的双语桂林明信片预览','Your bilingual Guilin postcard preview'));renderPlace($('#destination-photo').classList.contains('close-view'));updateEvolution();renderCulture();renderGame();drawPostcard();updateSoundLabel();$('#game-hint').textContent=hintVisible?T('隐藏路线提示','Hide route hint'):T('显示路线提示','Show route hint');document.dispatchEvent(new CustomEvent('guilin-languagechange',{detail:lang}));try{localStorage.setItem('guilin-language',lang)}catch{}}
$('#language').addEventListener('click',()=>setLanguage(lang==='zh'?'en':'zh'));

// Smooth cutaway terrain illustrates processes, rather than a surveyed site.
const smooth=(a,b,v)=>{const x=Math.max(0,Math.min(1,(v-a)/(b-a)));return x*x*(3-2*x)};
function terrainHeight(x,z,p){const centers=[[.13,.18,.16,.20],[.38,.18,.15,.20],[.63,.19,.13,.27],[.85,.2,.10,.28],[.17,.53,.15,.20],[.45,.50,.13,.24],[.71,.51,.11,.23],[.87,.57,.09,.25],[.26,.85,.15,.17],[.56,.85,.13,.20],[.82,.86,.11,.27]];let peaks=0;for(const[cx,cz,r,h]of centers){const d=((x-cx)**2+(z-cz)**2)/(r*r);peaks=Math.max(peaks,h*Math.exp(-d*1.4))}const relief=smooth(.12,1,p),fracture=Math.pow(Math.abs(Math.sin(x*19+z*5)),18)*smooth(0,.45,p)*.012;return .15*(1-relief)+(.025+peaks)*relief-fracture}
function drawGeology(time=0){const{ctx,w,h}=configureCanvas($('#geo-canvas')),p=Number($('#evolution').value)/100;const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#e8ebdf');g.addColorStop(1,'#cbd8c3');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);if(geoView==='section'){drawUnderground(ctx,w,h,p,time);return}const N=24,M=18,scale=Math.min(w*.82,h*1.65),ox=w*.5,oy=h*.24;const project=(x,z,e)=>[ox+(x-z)*scale*.61,oy+(x+z)*scale*.24-e*scale*.85];function face(points,fill){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#6f855f16';ctx.lineWidth=.4;ctx.stroke()}
 for(let i=0;i<N;i++){const a=i/N,b=(i+1)/N;face([project(a,1,terrainHeight(a,1,p)),project(b,1,terrainHeight(b,1,p)),project(b,1,-.08),project(a,1,-.08)],'#839176');face([project(1,a,terrainHeight(1,a,p)),project(1,b,terrainHeight(1,b,p)),project(1,b,-.08),project(1,a,-.08)],'#687c65')}
 ctx.strokeStyle='#b9c6a46b';ctx.lineWidth=1;for(let j=0;j<4;j++){const e=-.06+j*.037;ctx.beginPath();ctx.moveTo(...project(0,1,e));ctx.lineTo(...project(1,1,e));ctx.lineTo(...project(1,0,e));ctx.stroke()}
 for(let sum=0;sum<N+M;sum++)for(let i=0;i<N;i++){const j=sum-i;if(j<0||j>=M)continue;const x=i/N,z=j/M,dx=1/N,dz=1/M,e=terrainHeight(x,z,p),ez=terrainHeight(x+dx,z+dz,p),slope=(e-ez)*60,green=Math.round(111+e*150+Math.max(-15,Math.min(15,slope))),red=Math.round(green*.78),blue=Math.round(green*.67);const riverCenter=.49+Math.sin(z*6)*.065,river=Math.abs(x-riverCenter)<(.012+.018*p)&&e<.11;face([project(x,z,e),project(x+dx,z,terrainHeight(x+dx,z,p)),project(x+dx,z+dz,ez),project(x,z+dz,terrainHeight(x,z+dz,p))],river&&p>.47?'#7eb8b5':`rgb(${red},${green},${blue})`)}
 ctx.strokeStyle='#4a9baeb3';ctx.lineWidth=1;ctx.setLineDash([3,4]);for(let i=0;i<5;i++){const x=.12+i*.18,z=.25+(i%2)*.2,top=project(x,z,terrainHeight(x,z,p));ctx.beginPath();ctx.moveTo(top[0]+5,top[1]-45+Math.sin(time/600+i)*5);ctx.lineTo(top[0],top[1]-3);ctx.stroke()}ctx.setLineDash([]);ctx.font='10px '+getComputedStyle(document.body).fontFamily;ctx.fillStyle='#456248';ctx.fillText(T('降水与地表排水','Rain & surface drainage'),w*.07,h*.14);ctx.fillText(T('岩层剖面','Rock strata'),w*.08,h*.8);ctx.strokeStyle='#6d8260';ctx.beginPath();ctx.moveTo(w*.26,h*.79);ctx.lineTo(w*.39,h*.77);ctx.stroke();if(p>.7){ctx.fillStyle='#3d6249';ctx.font='9px '+getComputedStyle(document.body).fontFamily;ctx.fillText(T('峰丛与峰林可共存','Cone and tower karst can coexist'),w*.4,h*.87)}}
function drawUnderground(ctx,w,h,p,time){const margin=w*.065,top=h*.25,bottom=h*.83;ctx.fillStyle='#7d9273';ctx.beginPath();ctx.moveTo(margin,top);ctx.bezierCurveTo(w*.24,top-h*.04,w*.4,top+h*.04,w*.55,top);ctx.bezierCurveTo(w*.7,top-h*.07,w*.82,top,w-margin,top-h*.01);ctx.lineTo(w-margin,bottom);ctx.lineTo(margin,bottom);ctx.closePath();ctx.fill();ctx.save();ctx.clip();ctx.strokeStyle='#becaa04d';ctx.lineWidth=1;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(0,top+25+i*25);ctx.bezierCurveTo(w*.4,top+18+i*25,w*.6,top+35+i*25,w,top+25+i*25);ctx.stroke()}const paths=[[[.2,.25],[.25,.41],[.3,.49],[.38,.61]],[[.55,.22],[.52,.40],[.58,.55],[.58,.63]],[[.8,.25],[.75,.43],[.68,.56],[.62,.65]],[[.38,.61],[.5,.65],[.7,.66],[.92,.76]]];const grow=smooth(.06,.85,p);for(let i=0;i<paths.length;i++){ctx.strokeStyle='#344f46';ctx.lineWidth=1.5+grow*(i===3?13:8);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();paths[i].forEach(([x,y],j)=>j?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.stroke();if(p>.05){ctx.strokeStyle='#8bd3d7';ctx.lineWidth=1+grow*1.5;ctx.setLineDash([4,9]);ctx.lineDashOffset=-time/85;ctx.stroke();ctx.setLineDash([])}}const cave=smooth(.4,1,p);ctx.fillStyle='#33584c';ctx.beginPath();ctx.ellipse(w*.57,h*.63,w*.105*cave,h*.058*cave,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7ab8bb';ctx.fillRect(w*.5,h*.651,w*.15*cave,h*.012*cave);ctx.restore();ctx.strokeStyle='#5d9587';ctx.lineWidth=1.2;for(let i=0;i<9;i++){const x=w*(.12+i*.09),offset=(time/40+i*11)%40;ctx.beginPath();ctx.moveTo(x+3,h*.09+offset);ctx.lineTo(x,h*.09+offset+9);ctx.stroke()}ctx.font='10px '+getComputedStyle(document.body).fontFamily;ctx.fillStyle='#3c6047';ctx.fillText(T('空气与土壤中的 CO₂','CO₂ from air & soil'),w*.09,h*.12);ctx.fillText(T('水沿裂隙渗入','Water follows fractures'),w*.07,h*.39);ctx.fillText(T('随时间扩大的地下通道','Passages widen over time'),w*.44,h*.91)}
function updateEvolution(){const value=Number($('#evolution').value),index=Math.min(3,Math.floor(value/25)),s=stages[index];$('#geo-percent').textContent=value+'%';$('#geo-number').textContent=String(index+1).padStart(2,'0');$('#stage-label').textContent=s[0];bilingual($('#stage-title'),s[1],s[2]);bilingual($('#stage-description'),s[3],s[4]);$$('[data-stage]').forEach((b,i)=>b.classList.toggle('active',i===index));drawGeology(performance.now())}
function stopTimeline(){playing=false;cancelAnimationFrame(playFrame);$('#play-timeline').textContent='▶';$('#play-timeline').setAttribute('aria-pressed','false')}
$('#evolution').addEventListener('input',()=>{stopTimeline();updateEvolution()});$$('[data-stage]').forEach(b=>b.addEventListener('click',()=>{stopTimeline();$('#evolution').value=b.dataset.stage;updateEvolution()}));
$('#play-timeline').addEventListener('click',()=>{if(playing){stopTimeline();return}playing=true;$('#play-timeline').textContent='Ⅱ';$('#play-timeline').setAttribute('aria-pressed','true');let value=Number($('#evolution').value);if(value>=100)value=0;let last=performance.now();function frame(t){if(!playing)return;value+=(t-last)/190;last=t;$('#evolution').value=String(Math.min(100,Math.round(value)));updateEvolution();if(value>=100)stopTimeline();else playFrame=requestAnimationFrame(frame)}playFrame=requestAnimationFrame(frame)});
function setGeoView(view){geoView=view;$('#surface-view').classList.toggle('active',view==='surface');$('#section-view').classList.toggle('active',view==='section');$('#surface-view').setAttribute('aria-pressed',String(view==='surface'));$('#section-view').setAttribute('aria-pressed',String(view==='section'));drawGeology(performance.now())}
$('#surface-view').addEventListener('click',()=>setGeoView('surface'));$('#section-view').addEventListener('click',()=>setGeoView('section'));let geoLast=0;function geoAmbient(t){if(geoVisible&&!playing&&!document.hidden&&t-geoLast>100){drawGeology(t);geoLast=t}requestAnimationFrame(geoAmbient)}if(!reducedMotion)requestAnimationFrame(geoAmbient);

// A fracture graph supports clicking, dragging and backtracking; water follows the chosen path.
const {nodes,edges,adjacency}=window.GuilinFractures;
function updateHint(){const hint=window.GuilinFractures.route(waterPath.at(-1));$('#hint-path').setAttribute('d',pathD(hint))}
const pathD=ids=>ids.map((id,i)=>`${i?'L':'M'}${nodes[id].x},${nodes[id].y}`).join(' ');
function initGame(){const ns='http://www.w3.org/2000/svg';edges.forEach(([a,b])=>{const line=document.createElementNS(ns,'line');line.setAttribute('x1',nodes[a].x);line.setAttribute('y1',nodes[a].y);line.setAttribute('x2',nodes[b].x);line.setAttribute('y2',nodes[b].y);line.setAttribute('stroke','#3e574c');line.setAttribute('stroke-width','4');line.setAttribute('stroke-linecap','round');$('#fracture-lines').append(line)});nodes.forEach((n,i)=>{const b=document.createElement('button');b.type='button';b.className='fracture-node';b.style.left=n.x/650*100+'%';b.style.top=n.y/350*100+'%';b.dataset.node=String(i);b.addEventListener('click',()=>visitNode(i));$('#fracture-nodes').append(b)});$('#hint-path').setAttribute('d',pathD(window.GuilinFractures.route(0)));renderGame()}
function visitNode(i){
 if(waterRunning||waterComplete)return;
 const next=window.GuilinFractures.move(waterPath,i);
 if(!next){$('#game-status').textContent=T('沿着与当前水滴相连的裂隙前进。','Follow a fracture connected to the current drop.');return}
 waterPath=next;renderGame();
}
function renderGame(){updateHint();const current=waterPath.at(-1),ready=current===19;$('#water-path').setAttribute('d',pathD(waterPath));$('#water-path').setAttribute('stroke-width',String(4+waterProgress*8));if(!waterRunning){$('#water-drop').setAttribute('cx',nodes[current].x);$('#water-drop').setAttribute('cy',nodes[current].y)}$$('.fracture-node').forEach((b,i)=>{b.classList.toggle('traversed',waterPath.includes(i));b.classList.toggle('current',i===current);b.classList.toggle('available',adjacency[current].includes(i));b.classList.toggle('goal',i===19);b.disabled=waterRunning;b.textContent=i===0?'↓':i===19?'↗':String(i+1);b.setAttribute('aria-label',i===0?T('雨水入口','Rainwater inlet'):i===19?T('地下水出口','Groundwater outlet'):T(`裂隙节点 ${i+1}`,`Fracture junction ${i+1}`));b.setAttribute('aria-pressed',String(waterPath.includes(i)))});$('#release-water').disabled=!ready||waterRunning||waterComplete;$('#game-progress').textContent=waterComplete?T('已观察 ✓','Observed ✓'):T(`路径 ${waterPath.length} 节点`,`${waterPath.length} junctions`);$('#game-status').textContent=waterComplete?T('水沿裂隙流动，长期溶蚀使通道扩大。动画压缩了漫长时间。','Water follows fractures; long-term dissolution enlarges openings. The animation compresses geological time.'):waterRunning?T('跟随水滴，观察裂隙怎样逐渐扩大……','Follow the drop and watch the openings slowly widen…'):ready?T('路线已连通！点击“放水”观察长期作用。','The route is connected! Release water to observe long-term change.'):T('只有一条通路。先找到入口旁亮起的节点，走进死路时退回再试。','There is one solution. Start beside the inlet and backtrack from dead ends.')}
$('#release-water').addEventListener('click',()=>{if(waterPath.at(-1)!==19||waterRunning)return;waterRunning=true;waterProgress=0;renderGame();const line=$('#water-path'),length=line.getTotalLength(),started=performance.now();function frame(t){waterProgress=Math.min(1,(t-started)/(reducedMotion?1:4800));const point=line.getPointAtLength(length*waterProgress);$('#water-drop').setAttribute('cx',point.x);$('#water-drop').setAttribute('cy',point.y);$('#water-path').setAttribute('stroke-width',String(4+waterProgress*8));$('#game-cave').setAttribute('rx',String(37*waterProgress));$('#game-cave').setAttribute('ry',String(19*waterProgress));if(waterProgress<1)waterFrame=requestAnimationFrame(frame);else{waterRunning=false;waterComplete=true;renderGame()}}waterFrame=requestAnimationFrame(frame)});
$('#game-reset').addEventListener('click',()=>{cancelAnimationFrame(waterFrame);waterPath=[0];waterRunning=false;waterComplete=false;waterProgress=0;$('#game-cave').setAttribute('rx','0');$('#game-cave').setAttribute('ry','0');renderGame()});$('#game-hint').addEventListener('click',()=>{hintVisible=!hintVisible;$('#hint-path').setAttribute('visibility',hintVisible?'visible':'hidden');$('#game-hint').textContent=hintVisible?T('隐藏路线提示','Hide route hint'):T('显示路线提示','Show route hint')});
let draggingDrop=false;$('#game-board').addEventListener('pointerdown',e=>{if(waterRunning||waterComplete)return;const r=$('#fracture-svg').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*650,y=(e.clientY-r.top)/r.height*350,n=nodes[waterPath.at(-1)];if(Math.hypot(x-n.x,y-n.y)<30){draggingDrop=true;e.currentTarget.setPointerCapture(e.pointerId)}});$('#game-board').addEventListener('pointermove',e=>{if(!draggingDrop)return;const r=$('#fracture-svg').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*650,y=(e.clientY-r.top)/r.height*350;nodes.forEach((n,i)=>{if(Math.hypot(x-n.x,y-n.y)<22&&adjacency[waterPath.at(-1)].includes(i))visitNode(i)})});['pointerup','pointercancel','lostpointercapture'].forEach(event=>$('#game-board').addEventListener(event,()=>draggingDrop=false));

function setArtStyle(ink){inkView=ink;$('#view-ink').classList.toggle('active',ink);$('#view-green').classList.toggle('active',!ink);$('#view-ink').setAttribute('aria-pressed',String(ink));$('#view-green').setAttribute('aria-pressed',String(!ink));const{ctx,w,h}=configureCanvas($('#culture-canvas'));renderLandscape(ctx,w,h,{palette:ink?'ink':'jade',mist:.4,boat:true})}
$('#view-ink').addEventListener('click',()=>setArtStyle(true));$('#view-green').addEventListener('click',()=>setArtStyle(false));
function renderCulture(){
 const open=$$('.work-card[open]').map(e=>e.dataset.work);$('#culture-works').replaceChildren();
 cultureWorks.forEach((work,i)=>{
  const detail=document.createElement('details');detail.className='work-card';detail.dataset.work=String(i);detail.open=open.includes(String(i));
  const summary=document.createElement('summary');summary.innerHTML='<span class="work-type"></span><div><h4></h4><p></p></div><span class="work-preview"></span><span class="work-expand">+</span>';
  summary.querySelector('.work-type').textContent=work.type==='painting'?T('画','ART'):T('诗','POEM');
  bilingual(summary.querySelector('h4'),work.title,work.titleEn);bilingual(summary.querySelector('p'),work.author,work.authorEn);
  summary.querySelector('.work-preview').textContent=T(work.preview,work.type==='painting'?'Ink, mist and open space.':work.interpretation);
  const body=document.createElement('div');body.className='work-body';const left=document.createElement('div');
  if(work.image){const img=document.createElement('img');img.src=work.image;img.alt=work.title+' / '+work.titleEn;img.className='work-painting';left.append(img)}
  const original=document.createElement('blockquote');original.lang='zh-CN';original.textContent=work.original;left.append(original);
  const english=document.createElement('p');english.lang='en';english.className='work-english';english.textContent=work.interpretation;left.append(english);
  const credit=document.createElement('p');credit.className='translation-credit';bilingual(credit,work.type==='painting'?'作品说明 · 本站英文释义':'原诗节选 · 本站英文意译','Project-written English interpretation · Chinese original above');left.append(credit);
  const right=document.createElement('div'),heading=document.createElement('h5');heading.textContent=work.type==='painting'?'作品与观看 / THE WORK & HOW TO LOOK':'原文节选与背景 / EXCERPT & CONTEXT';right.append(heading);
  const background=document.createElement('p');bilingual(background,work.background,work.backgroundEn);right.append(background);
  const meta=document.createElement('p');meta.className='work-meta';bilingual(meta,work.meta,work.metaEn);right.append(meta);
  if(work.contextSource){const context=document.createElement('a');context.href=work.contextSource;context.target='_blank';context.rel='noopener';context.className='work-reference';context.textContent='历史地名说明 / Historical place-name context ↗';right.append(context,document.createElement('br'))}
  const reference=document.createElement('a');reference.href=work.source;reference.target='_blank';reference.rel='noopener';reference.className='work-reference';reference.textContent=T('查看原文与馆藏来源 ↗','Read the source / museum record ↗');right.append(reference);
  appendWorkPostcardAction(work,right,i);body.append(left,right);detail.append(summary,body);$('#culture-works').append(detail);
 });
}

function appendWorkPostcardAction(work,container,index){
 const button=document.createElement('button');button.type='button';button.className='work-caption-action text-link';button.dataset.workPostcard=String(index);
 const painting=work.type==='painting';
 button.textContent=painting?T('以这幅画的意境制作明信片 →','Create a postcard inspired by this painting →'):T('把这句诗写入明信片 →','Use this line on my postcard →');
 button.addEventListener('click',()=>{
   if(painting){
     cardInspiration=work;palette='ink';$('#composition').value='blank';$('#mist').value='72';$('#boat').checked=true;
     $('#card-caption').value=T(work.original,work.titleEn);
     $$('[data-palette]').forEach(b=>{const selected=b.dataset.palette==='ink';b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))});
     setCardMode('art');
   }else{$('#card-caption').value=T(work.original,work.interpretation).slice(0,160);drawPostcard()}
   confirmPostcardUpdate();
 });
 container.append(button);
}

function drawPostcard(){
 drawPostcardBase();
 const note=$('#card-inspiration');
 const inspired=cardMode==='art'&&cardInspiration;
 note.hidden=!inspired;
 if(!inspired){note.replaceChildren();return}
 const work=cardInspiration;
 bilingual(note,'画意参考：'+work.title+' · '+work.author,'Inspired by: '+work.titleEn+' · '+work.authorEn);
 const link=document.createElement('a');link.href=work.source;link.target='_blank';link.rel='noopener';link.textContent=T('查看馆藏原作 ↗','View museum record ↗');note.append(link);
 const canvas=$('#postcard-canvas'),ctx=canvas.getContext('2d');ctx.fillStyle=palettes[palette].paper;ctx.fillRect(52,1130,canvas.width-104,110);
 ctx.textAlign='center';ctx.fillStyle='#75866b';ctx.font='13px sans-serif';
 ctx.fillText('本站山水创作 · 画意参考：'+work.title+' · 徐悲鸿（1937）',canvas.width/2,1156);
 ctx.fillText('Original site illustration · inspired by '+work.titleEn+' — Xu Beihong, 1937',canvas.width/2,1180);
 ctx.font='10px sans-serif';ctx.fillText(work.source,canvas.width/2,1206);
}

function getImage(src){return scenicImages.get(src)}
function setCardMode(mode){if(mode==='photo')cardInspiration=null;cardMode=mode;$$('[data-card-mode]').forEach(b=>{const active=b.dataset.cardMode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});$('#art-controls').hidden=mode!=='art';$('#photo-controls').hidden=mode!=='photo';drawPostcard()}
$$('[data-card-mode]').forEach(b=>b.addEventListener('click',()=>setCardMode(b.dataset.cardMode)));
function wrapCanvasText(ctx,text,maxWidth){const lines=[];let line='';for(const char of Array.from(text)){const next=line+char;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=char}else line=next}if(line)lines.push(line);return lines}
function drawPostcardBase(){const c=$('#postcard-canvas'),ctx=c.getContext('2d'),w=c.width=1800,h=c.height=1260,p=palettes[palette],margin=52,artW=w-margin*2,artH=805,selected=realPlaces[Number($('#card-place').value)];ctx.fillStyle=p.paper;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(margin,margin);ctx.beginPath();ctx.rect(0,0,artW,artH);ctx.clip();let loaded=true;if(cardMode==='art')renderLandscape(ctx,artW,artH,{palette,mist:Number($('#mist').value)/100,boat:$('#boat').checked,composition:$('#composition').value});else{const record=getImage(selected.image);loaded=record.ready;if(loaded){const img=record.image,scale=Math.max(artW/img.width,artH/img.height),rw=img.width*scale,rh=img.height*scale,pan=Number($('#photo-pan').value)/100;ctx.drawImage(img,(artW-rw)*pan,(artH-rh)*pan,rw,rh);const shade=ctx.createLinearGradient(0,0,0,160);shade.addColorStop(0,'#14382a55');shade.addColorStop(1,'#14382a00');ctx.fillStyle=shade;ctx.fillRect(0,0,artW,160)}else{ctx.fillStyle='#d8e2ce';ctx.fillRect(0,0,artW,artH);ctx.fillStyle='#4f6d4d';ctx.font='28px sans-serif';ctx.textAlign='center';ctx.fillText(record.error?T('照片暂不可用，请选择其他景点或山水创作。','Photo unavailable. Choose another view or landscape art.'):T('正在载入桂林山水……','Loading a little Guilin…'),artW/2,artH/2)}}ctx.restore();$('#download').disabled=!loaded;$('#postcard-canvas').classList.toggle('card-loading',!loaded);ctx.fillStyle=cardMode==='photo'?'#fff6df':p.near;ctx.textAlign='left';ctx.font='40px Georgia,serif';ctx.fillText('GUILIN',95,130);ctx.font='14px sans-serif';ctx.fillText('WHERE MOUNTAINS MEET WATER',97,164);ctx.strokeStyle=cardMode==='photo'?'#fff6df':p.near;ctx.lineWidth=1.5;ctx.strokeRect(w-155,95,53,90);ctx.textAlign='center';ctx.font='29px SimSun,serif';ctx.fillText('桂',w-128,133);ctx.fillText('林',w-128,169);const text=$('#card-caption').value.trim()||T('此刻，心在山水之间。','Between mountains and water.');ctx.fillStyle=p.near;ctx.font='38px '+getComputedStyle(document.body).fontFamily;const lines=wrapCanvasText(ctx,text,w-190).slice(0,2),ty=lines.length===1?951:928;lines.forEach((line,i)=>ctx.fillText(line,w/2,ty+i*48));ctx.font='22px Georgia,serif';ctx.fillStyle='#65795e';ctx.fillText(cardMode==='photo'?selected.en+' · '+selected.name:'Guilin, China · 桂林山水',w/2,1024);const signature=$('#card-name').value.trim();ctx.font='17px '+getComputedStyle(document.body).fontFamily;ctx.fillText(signature?T('寄自山水之间 · ','From the landscape · ')+signature:T('山水之间，自有天地。','Water shapes the stone. Imagination shapes the view.'),w/2,1075);ctx.strokeStyle='#b9c4ac';ctx.beginPath();ctx.moveTo(100,1120);ctx.lineTo(w-100,1120);ctx.stroke();ctx.fillStyle='#859578';ctx.font='12px sans-serif';if(cardMode==='photo'){ctx.fillText('Photo: '+selected.author+' | '+selected.license+' | cropped / adapted',w/2,1158);ctx.fillText(selected.licenseUrl,w/2,1181);ctx.fillText(selected.sourceImage,w/2,1206)}else{ctx.fillText('ORIGINAL LANDSCAPE ILLUSTRATION · 桂林山水意象创作 · NOT A REAL-WORLD RECONSTRUCTION',w/2,1165);ctx.fillText('Guilin: Where Mountains Meet Water',w/2,1201)}$('#card-preview-note').textContent=cardMode==='photo'?T('实景记忆 · 照片署名与授权随图片保留','Photo memory · attribution and licence included'):T('桂林山水意象创作 · 非实景复原','Inspired by Guilin · artistic composition')}
$$('[data-palette]').forEach(b=>b.addEventListener('click',()=>{palette=b.dataset.palette;$$('[data-palette]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});drawPostcard()}));['mist','card-caption','boat','composition','card-name','card-place','photo-pan'].forEach(id=>$('#'+id).addEventListener('input',drawPostcard));
$$('[data-caption]').forEach(b=>b.addEventListener('click',()=>{$('#card-caption').value=b.dataset.caption==='poem'?T('江作青罗带，山如碧玉篸。','The river, a blue-green ribbon; the hills, jade hairpins.'):T('此刻，心在山水之间。','Between mountains and water.');drawPostcard()}));
$('#card-reset').addEventListener('click',()=>{cardInspiration=null;palette='jade';$('#composition').value='river';$('#mist').value='45';$('#boat').checked=true;$('#photo-pan').value='50';$('#card-caption').value=T('此刻，心在山水之间。','Between mountains and water.');$('#card-name').value='';$$('[data-palette]').forEach(b=>{const active=b.dataset.palette==='jade';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});setCardMode('art')});
$('#download').addEventListener('click',()=>{drawPostcard();if($('#download').disabled)return;try{$('#postcard-canvas').toBlob(blob=>{if(!blob){$('#download-note').textContent=T('图片生成失败，请重试。','Could not create the image. Please retry.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Guilin-'+(cardMode==='art'?'landscape':'photo')+'-postcard.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);$('#download-note').textContent=T('✓ 明信片已生成，请查看浏览器下载。','✓ Your postcard is ready. Check your downloads.')},'image/png')}catch{$('#download-note').textContent=T('请通过网站链接或本地预览打开后，再导出照片明信片。','Open the website link or local preview to export a photo postcard.')}});
$('#open-sources').addEventListener('click',()=>$('#sources').showModal());$('#close-sources').addEventListener('click',()=>$('#sources').close());$('#sources').addEventListener('click',e=>{if(e.target===$('#sources')){const r=$('#sources').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#sources').close()}});
let audioContext=null,audioGain=null,soundOn=false;function updateSoundLabel(){$('#sound').setAttribute('aria-label',T(soundOn?'关闭流水声':'开启流水声',soundOn?'Turn river sound off':'Play river sound'));$('#sound').setAttribute('aria-pressed',String(soundOn))}
$('#sound').addEventListener('click',async()=>{try{if(!audioContext){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('unsupported');audioContext=new AC();const buffer=audioContext.createBuffer(1,audioContext.sampleRate*4,audioContext.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+.02*(Math.random()*2-1))/1.02;data[i]=brown*4}const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1100;audioGain=audioContext.createGain();audioGain.gain.value=0;noise.connect(filter);filter.connect(audioGain);audioGain.connect(audioContext.destination);noise.start()}await audioContext.resume();soundOn=!soundOn;audioGain.gain.setTargetAtTime(soundOn?.18:0,audioContext.currentTime,.3);updateSoundLabel()}catch{$('#sound').setAttribute('aria-label',T('此浏览器暂不支持声音','Sound unavailable in this browser'))}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTimeline();if(audioContext&&soundOn)audioContext.suspend()}else if(audioContext&&soundOn)audioContext.resume()});function drawScenes(){const{ctx,w,h}=configureCanvas($('#hero-fallback'));renderLandscape(ctx,w,h,{palette:'jade',mist:.72,boat:true});setArtStyle(inkView);drawGeology(performance.now());drawPostcard()}let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawScenes,120)});
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});if(!reducedMotion)$$('.section-heading,.intro-strip,.culture-copy,.postcard-layout').forEach(e=>{e.classList.add('reveal');observer.observe(e)});const navObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)$$('.header nav a').forEach(a=>a.classList.toggle('current',a.hash==='#'+e.target.id))}),{rootMargin:'-10% 0px -60% 0px'});$$('main>section[id]').forEach(s=>navObserver.observe(s));new IntersectionObserver(entries=>geoVisible=entries.some(e=>e.isIntersecting)).observe($('#geo-canvas'))}

const extraSources=[
 ...realPlaces.map(p=>({title:p.name+' / '+p.en,url:p.sourceImage,note:p.author+' · '+p.license+' · '+p.licenseUrl+' · cropped; photo adaptations retain the same licence'})),
 ...cultureWorks.map(w=>({title:w.title+' / '+w.titleEn+' · '+w.authorEn,url:w.source,note:w.type==='painting'?'馆藏记录与原作链接 / Museum record and original artwork link':'原文节选；英文为本站释义 / Original excerpt; English interpretation by this site'})),
 ...window.GuilinCourse.terms.map(term=>({title:term.zh+' / '+term.en,url:term.source,note:'文化词入门说明与本站英文示例 / Introductory cultural explanation and project-written English examples'})),
 {title:'桂州与桂林 / Historical Guizhou and present-day Guilin',url:cultureWorks[0].contextSource,note:'历史地名背景 / Historical place-name context'},
 {title:'USGS · Karst Topography — Teachers Guide',url:'https://pubs.usgs.gov/of/1997/0536a/report.pdf',note:'降水、土壤 CO₂、裂隙和地下通道 / Rain, soil CO₂, fractures and passages'}
];
extraSources.forEach(source=>{const li=document.createElement('li'),a=document.createElement('a'),p=document.createElement('p');a.href=source.url;a.target='_blank';a.rel='noopener';a.textContent=source.title;p.textContent=source.note;li.append(a,p);$('#sources ul').append(li)});

initGame();setLanguage(lang);drawScenes();
scenicImages.preload(realPlaces.map(p=>p.preview));
