'use strict';
(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),arena=document.getElementById('arena');
const $=id=>document.getElementById(id),sprite=new Image(),runSprite=new Image(),openSprite=new Image();sprite.src='assets/shikabou-sprite.png';runSprite.src='assets/shikabou-cycle-smile-idle-colors.png';openSprite.src='assets/shikabou-cycle-open-tip-v1.png';
const H=480,GROUND=400,MAX_HEARTS=3,STEP=1/120,JUMP_BUFFER=.20,COYOTE_TIME=.14;
let W=960,dpr=1,mode='ready',elapsed=0,clock=0,acc=0,last=0,camera=0,checkpoint=85,coins=0,hearts=MAX_HEARTS,invincible=0,toastTime=0,sound=true,audio=null;
let soundscape=null,walkPhase=0,landing=0,runDust=0;const effectVoices=new Set();
let stars=[],damageCount=0,fallCount=0,lastResult=null;
let practiceArea=null,menuOpen=false,menuSnapshot=null,pausedFrom='playing',celebration=null;
let player,enemies,tokens,acorns,chestnutZones,fallingChestnuts=[],particles=[];const input={left:false,right:false,jump:false},sources={left:new Set(),right:new Set(),jump:new Set()};let buffer=0,coyote=0,jumpHeld=false;
const nativeTouchControls='ontouchstart' in window,activeTouches=new Map(),activePointers=new Map(),interruptedTouches=new Set(),touchOrigins=new Map();
const inputOptions=typeof location!=='undefined'?new URLSearchParams(location.search):null,inputCheckEnabled=inputOptions?.has('inputcheck')||false,inputCanvasEnabled=inputOptions?.has('canvaspad')||false;
const requestedCourse=inputOptions?.get('course'),courseId=['1-2','1-3'].includes(requestedCourse)?requestedCourse:'1-1',waterCourse=courseId==='1-2'?window.ShikabouWatercourse:null,canopy=courseId==='1-3'?window.ShikabouCanopy:null,coursePreview=inputOptions?.get('preview')==='1';
let canopyRun=null;
const courseData=waterCourse||canopy;
const LENGTH=courseData?.length||12000,GOAL=courseData?.goal||11760;
const courseAllowed=courseId==='1-1'||coursePreview||window.ShikabouJourney?.available(courseId)===true;
let waterScene=0,sceneTransition=null,floatHintShown=false;
let moveStyle='hold',tapDirection=null;
try{if(window.localStorage?.getItem('shikabou.moveStyle')==='tap')moveStyle='tap';}catch{/* Storage may be unavailable. */}
if(['tap','hold'].includes(inputOptions?.get('move'))){moveStyle=inputOptions.get('move');try{window.localStorage?.setItem('shikabou.moveStyle',moveStyle);}catch{}}
const inputRealNow=()=>typeof performance!=='undefined'?performance.now():Date.now(),inputRealStart=inputRealNow();
const hudValues=new Map();let lastInputCheckAt=-Infinity;
const frameSamples=[],longTaskSamples=[];let inputPerformanceObserver=null;
function collectLongTasks(entries){for(const entry of entries){longTaskSamples.push({start:entry.startTime,end:entry.startTime+entry.duration,duration:entry.duration});if(longTaskSamples.length>24)longTaskSamples.shift();}}
try{if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')){inputPerformanceObserver=new PerformanceObserver(list=>collectLongTasks(list.getEntries()));inputPerformanceObserver.observe({type:'longtask',buffered:true});}}catch{inputPerformanceObserver=null;}
function inputPerformance(){
 if(inputPerformanceObserver)collectLongTasks(inputPerformanceObserver.takeRecords());
 const now=inputRealNow(),frames=frameSamples.filter(sample=>sample.at>=now-2000);
 return{windowMs:2000,maxFrameGapMs:Math.round(Math.max(0,...frames.map(s=>s.gap))*10)/10,maxFrameWorkMs:Math.round(Math.max(0,...frames.map(s=>s.work))*10)/10,longTaskSupported:!!inputPerformanceObserver,longTasks:longTaskSamples.filter(s=>s.end>=now-2000&&s.start<=now).slice(-3).map(s=>({atReal:Math.round((s.start-inputRealStart)/10)/100,durationMs:Math.round(s.duration*10)/10}))};
}
function writeHud(id,property,value){
 const key=id+':'+property;if(hudValues.get(key)===value)return;hudValues.set(key,value);
 const node=$(id);if(property==='text')node.textContent=value;else if(property==='width')node.style.width=value;else node.setAttribute(property,value);
}
const inputTrace=[],inputIncidents=[];let lastInputEvent='待機中',touchInterruptions=0;
function inputSnapshot(){return{version:'0.13.2',course:courseId,preview:coursePreview,mode,moveStyle,tapDirection,direction:input.right&&input.left?'左右同時':input.right?'右':input.left?'左':'なし',jump:input.jump,touches:Object.values(sources).reduce((n,set)=>n+[...set].filter(id=>id.startsWith('t')).length,0),interruptions:touchInterruptions,last:lastInputEvent,x:Math.round(player?.x||0),vx:Math.round(player?.vx||0)};}
function updateInputCheck(force=false){if(!inputCheckEnabled)return;const now=inputRealNow();if(!force&&now-lastInputCheckAt<100)return;lastInputCheckAt=now;const s=inputSnapshot();$('inputCheck').hidden=mode!=='playing';$('inputCheck').textContent=`v${s.version}｜移動入力：${s.direction}｜中断：${s.interruptions}\n最後：${s.last}｜接触：${s.touches}｜位置：${s.x}｜${s.mode}`;}
function compactEvent(e){return{at:e.at,atReal:e.atReal,event:e.last,move:e.direction,jump:e.jump,...(e.native?{native:e.native}:{}),...(e.contacts?{contacts:e.contacts}:{})};}
function inputBounds(node){
 const r=node?.getBoundingClientRect();return r&&[r.left,r.top,r.width,r.height].every(Number.isFinite)?[r.left,r.top,r.width,r.height].map(Math.round):null;
}
function inputGeometry(){
 const viewport=[window.innerWidth||null,window.innerHeight||null],game=inputBounds(arena),controls=inputBounds(document.querySelector('.controls'));
 return{viewport,orientation:window.screen?.orientation?.type||(viewport[0]&&viewport[1]?(viewport[0]>viewport[1]?'landscape':'portrait'):null),layout:window.matchMedia?.('(max-height:520px) and (orientation:landscape)')?.matches?'landscape-dock':'flow',game,controls,overlap:game&&controls?game[0]<controls[0]+controls[2]&&controls[0]<game[0]+game[2]&&game[1]<controls[1]+controls[3]&&controls[1]<game[1]+game[3]:null};
}
function touchContext(t){
 const origin=touchOrigins.get(t.identifier),context={id:t.identifier,key:origin?.key||activeTouches.get(t.identifier)||null};
 if(origin){context.heldSeconds=Math.round((clock-origin.at)*100)/100;context.heldRealSeconds=Math.round((inputRealNow()-origin.atReal)/10)/100;if(Number.isFinite(origin.x)&&Number.isFinite(origin.y))context.start=[Math.round(origin.x),Math.round(origin.y)];}
 if(Number.isFinite(t.clientX)&&Number.isFinite(t.clientY))context.point=[Math.round(t.clientX),Math.round(t.clientY)];
 if(Number.isFinite(t.radiusX)&&Number.isFinite(t.radiusY))context.radius=[Math.round(t.radiusX),Math.round(t.radiusY)];
 if(origin?.startButton)context.startButton=origin.startButton;
 const bounds=origin?.button?.getBoundingClientRect();if(bounds&&Number.isFinite(bounds.left)&&Number.isFinite(bounds.top))context.button=[Math.round(bounds.left),Math.round(bounds.top),Math.round(bounds.width),Math.round(bounds.height)];
 return context;
}
function recordInput(label,event=null){
 lastInputEvent=label;const contacts=event?.touches?{live:Array.from(event.touches,t=>t.identifier),changed:Array.from(event.changedTouches,t=>t.identifier),cancelable:event.cancelable,prevented:event.defaultPrevented}:null;
 const delay=event?inputRealNow()-event.timeStamp:NaN;
 const entry={at:Math.round(clock*100)/100,atReal:Math.round((inputRealNow()-inputRealStart)/10)/100,...(event?{native:{type:event.type||null,trusted:event.isTrusted===true,...(Number.isFinite(delay)&&delay>=0&&delay<60000?{delayMs:Math.round(delay*10)/10}:{})}}:{}),...inputSnapshot(),...(contacts?{contacts}:{})};
 for(const incident of inputIncidents)if(incident.after.length<3)incident.after.push(compactEvent(entry));
 if(label.startsWith('タッチ中断：')){
  inputIncidents.push({at:entry.at,atReal:entry.atReal,native:entry.native,performance:inputPerformance(),geometry:inputGeometry(),event:label,x:entry.x,vx:entry.vx,contacts:entry.contacts,touch:event?Array.from(event.changedTouches,touchContext):[],before:inputTrace.slice(-4).map(compactEvent),after:[]});
  if(inputIncidents.length>3)inputIncidents.shift();
 }
 inputTrace.push(entry);if(inputTrace.length>60)inputTrace.shift();updateInputCheck(true);
}
function compactInputReport(){return{state:inputSnapshot(),environment:{surface:inputCanvasEnabled?'canvas':'button',browser:typeof navigator!=='undefined'?navigator.userAgent||null:null,standalone:window.matchMedia?.('(display-mode: standalone)')?.matches||false,viewport:[window.innerWidth||null,window.innerHeight||null],geometry:inputGeometry(),performance:inputPerformance()},...(inputIncidents.length?{incidents:inputIncidents.slice(-2)}:{events:inputTrace.slice(-6).map(compactEvent)})};}
window.ShikabouInputDiagnostics={snapshot:inputSnapshot,report:()=>({state:inputSnapshot(),events:inputTrace.map(e=>({...e}))}),compactReport:compactInputReport};
// The meadow teaches jumps; the forest offers stumps and short branch detours;
// the highland uses solid rock terraces with short, varied gaps.
const terrain=courseData?courseData.terrain:[
 [0,1160,400],[1270,1170,400],[2555,835,400],[3510,890,400],
 [4400,1360,400],[5900,980,400],[7030,1170,400],
 [8200,560,400],[8870,450,370],[9320,460,340],
 [9890,430,370],[10320,380,330],[10820,430,360],[11250,750,400]
].map(([x,w,y])=>({x,y,w,h:560-y}));
const obstacles=courseData?courseData.obstacles:[[4680,350,70],[5270,342,76],[6700,348,76],[7310,340,84],[7820,354,90]].map(([x,y,w])=>({x,y,w,h:GROUND-y,kind:'stump'}));
const chestnutSites=courseData?[]:[{x:5530,offsets:[-40,40]},{x:8040,offsets:[-70,0,70]}];
const starSites=courseData?courseData.starSites:[{x:690,y:210,label:'丘の星',area:'丘'},{x:6450,y:205,label:'森の星',area:'森'},{x:10510,y:175,label:'高原の星',area:'高原'}];
const acornSpots=waterCourse?waterCourse.acornSpots:[1000,2300,4140,6200,7480,9440,10980,11670];
const checkpoints=courseData?courseData.checkpoints:[{x:2220,label:'丘の中間地点'},{x:6120,label:'森の中間地点'},{x:9360,label:'高原の中間地点'}];
const regions=courseData?courseData.regions:[{x:0,label:'01 · はじまりの丘'},{x:4400,label:'02 · 木漏れ日の森',hint:'森へ！ 枝の上には寄り道のコイン'},{x:8200,label:'03 · 見晴らしの高原',hint:'高原へ！ 岩の段差をジャンプで越えよう'}];
const practiceAreas=courseData?courseData.practiceAreas:[{key:0,name:'丘',start:85,left:0,right:4400,finish:4300},{key:4400,name:'森',start:4445,left:4400,right:8200,finish:8100},{key:8200,name:'高原',start:8245,left:8200,right:LENGTH,finish:GOAL}];
function roundGoal(){return practiceArea?.finish||GOAL;}
function cameraTarget(x){if(canopyRun?.scene===0)return (canopy.shaft-W)/2;if(canopyRun?.boss&&!canopyRun.cleared&&W<=canopy.length-canopy.arenaStart)return Math.max(canopy.arenaStart-20,Math.min(canopy.length-W,x));const left=practiceArea?.left||0,right=practiceArea?.right||LENGTH;return Math.max(left,Math.min(right-W,x));}
function regionAt(x){return regions.filter(r=>x>=r.x).at(-1)||regions[0];}
function canopyCamera(dt,snap=false){
 if(!canopyRun)return;canopy.cameraY(canopyRun,player,dt,snap);
 const b=canopyRun.boss,center=player.x+player.w/2;
 const target=b?.hp>0?center-W*.5+Math.max(-W*.25,Math.min(W*.25,(b.x+b.w/2-center)*.48)):player.x-W*.33;
 const x=cameraTarget(target);camera=snap?x:camera+(x-camera)*Math.min(1,dt*8);
}
function musicKey(){return canopyRun?.boss?.hp>0?31000:(regionAt(player.x).audio??regionAt(player.x).x);}
function groundAt(x){return terrain.find(t=>x>=t.x&&x<t.x+t.w);}
const platforms=courseData?courseData.platforms.map(p=>({...p})):[
 [400,310,120],[625,264,130],[900,305,120],[1700,300,130],[2930,290,140],[3700,310,160],
 [4550,310,170,'branch'],[4770,265,160,'branch'],
 [6150,310,170,'branch'],[6370,260,160,'branch'],
 [7440,310,170,'branch'],[7660,265,160,'branch'],
 [5740,400,180,'bridge'],[6860,400,190,'bridge'],
 [8390,308,150,'rock'],[8620,255,135,'rock'],[9030,275,150,'rock'],[9470,245,160,'rock'],[9960,275,145,'rock'],[10440,230,140,'rock'],[10910,265,160,'rock'],[11350,308,150,'rock'],[11550,258,145,'rock']
].map(([x,y,w,kind='wood'])=>({x,y,w,h:22,kind}));
let furthestRegion=0,continueSection=0,firstClearRun=false;
const sectionNames=['前半','中盤','後半'];
function rememberSection(index){
 if(firstClearRun&&index>continueSection)continueSection=index;
}
function reset(area=null){sceneTransition=null;waterScene=0;floatHintShown=false;$('sceneFade').hidden=true;if(waterCourse)waterCourse.resetPlatforms(platforms);practiceArea=area;continueSection=0;firstClearRun=!area&&!window.ShikabouJourney?.snapshot().cleared.includes(courseId);canopyRun=canopy?canopy.createRun(area,platforms):null;menuOpen=false;menuSnapshot=null;pausedFrom='playing';celebration=null;$('practiceMenu').hidden=true;$('backPractice').hidden=true;$('choosePractice').hidden=false;$('skipCelebration').hidden=true;$('overlay').classList.remove('is-menu');$('messageCard').classList.remove('is-menu');player={x:canopy&&!area?32:85,y:338,w:38,h:62,vx:0,vy:0,grounded:true,face:1};enemies=courseData?courseData.createEnemies():[[700,640,860],[1550,1400,1630],[2100,2020,2160],[2810,2650,2890],[3250,3160,3320],[3850,3770,4000],[5100,5000,5200],[6400,6280,6540],[7100,7080,7200],[7620,7540,7720],[8500,8370,8610],[9100,8980,9190],[10070,9990,10180],[11490,11400,11600]].map(([x,min,max],i)=>{const kind=x>=8200?'rock':x>=4400?'mushroom':'walker',baseY=groundAt(x).y-30;return{x,y:baseY,baseY,w:38,h:30,min,max,kind,v:(i%2?1:-1)*(kind==='rock'?72:kind==='mushroom'?24:44),vy:0,hopWait:.8+(i%3)*.35,rollPhase:(i*.31)%2.25,angle:0,alive:true};});chestnutZones=chestnutSites.map(site=>({...site,state:'idle',timer:0,dropped:0,announced:false}));fallingChestnuts=[];stars=starSites.map(s=>({...s,taken:false}));damageCount=0;fallCount=0;lastResult=null;$('result').hidden=true;$('overlay').classList.remove('is-result');$('messageCard').classList.remove('is-result');$('description').hidden=false;$('cardFoot').hidden=false;acorns=canopy?canopy.acorns.map(a=>({...a,taken:false})):acornSpots.map(x=>({x,y:groundAt(x).y-40,taken:false}));tokens=[];for(let x=220;x<GOAL-40;x+=155){const floor=groundAt(x);if(!floor||x<floor.x+24||x>floor.x+floor.w-24||obstacles.some(o=>x>o.x-28&&x<o.x+o.w+28))continue;if(acorns.every(a=>Math.abs(a.x-x)>44))tokens.push({x,y:floor.y-50,taken:false});}for(const p of platforms.filter(p=>p.kind!=='bridge'))for(let x=p.x+25;x<p.x+p.w-10;x+=40)if(stars.every(s=>Math.abs(s.x-x)>40||Math.abs(s.y-(p.y-33))>55))tokens.push({x,y:p.y-33,taken:false});particles=[];elapsed=0;coins=0;hearts=MAX_HEARTS;checkpoint=85;furthestRegion=0;camera=0;invincible=0;buffer=0;coyote=0;walkPhase=0;landing=0;runDust=0;configureRound();if(canopy){if(!area)checkpoint=32;canopyRun.checkpointY=player.y+player.h;arena.style.backgroundColor=regions[canopyRun.scene].sky;canopyCamera(0,true);}if(waterCourse){waterScene=waterCourse.sceneAt(player.x);updateWaterBackdrop();}clearInput();hud();}
function configureRound(){
 if(!practiceArea)return;const a=practiceArea,inside=o=>o.x>=a.left&&o.x<a.right;
 enemies=enemies.filter(inside);tokens=tokens.filter(inside);acorns=acorns.filter(inside);stars=stars.filter(inside);chestnutZones=chestnutZones.filter(inside);
 player.x=a.start;player.y=(groundAt(a.start)?.y||GROUND)-player.h;checkpoint=a.start;furthestRegion=a.key;camera=cameraTarget(player.x-W*.33);
}
function startRound(area=null){if(!courseAllowed){location.assign('area-map.html');return;}stopMusic();reset(area);mode='playing';updateMovementMode();$('overlay').hidden=true;startMusic();if(moveStyle==='tap')showToast('矢印をタップで移動・同じ矢印か停止で止まる');else if(area)showToast(`${area.name}の練習スタート！`);else if(canopy)showToast(regions[0].hint);else if(waterCourse)showToast('丸太は揺れてから沈む！ 水しぶきにも注意');else if(sound)beep(700,.08);}
function openPracticeMenu(){
 if(mode==='celebrating')return;if(mode==='playing'||mode==='transition')pause();
 menuSnapshot={title:$('message').innerHTML,desc:$('description').innerHTML,label:$('start').textContent,tag:$('tag').textContent};
 overlay('エリアを選んで練習','選んだエリアだけを、ライフ3つで練習できます。<br>星・コイン・評価は練習分だけを集計します。','通しプレイをはじめる →','PRACTICE SELECT');
 menuOpen=true;$('overlay').classList.add('is-menu');$('messageCard').classList.add('is-menu');$('practiceMenu').hidden=false;$('backPractice').hidden=false;$('choosePractice').hidden=true;
}
function closePracticeMenu(){
 const previous=menuSnapshot;menuOpen=false;
 if(mode==='won')showClearResult();else if(previous)overlay(previous.title,previous.desc,previous.label,previous.tag);
}
function clearInput(reason='入力解除'){tapDirection=null;activeTouches.clear();activePointers.clear();interruptedTouches.clear();touchOrigins.clear();Object.keys(input).forEach(k=>{input[k]=false;sources[k].clear();});document.querySelectorAll('.pad').forEach(b=>b.classList.remove('pressed'));jumpHeld=false;buffer=0;updateMovementMode();recordInput(reason);}
function updateMovementMode(){
 const tap=moveStyle==='tap';$('movementMode').textContent=tap?'移動：タップ式（切り替える）':'移動：長押し式（切り替える）';
 $('movementMode').setAttribute('aria-pressed',String(tap));
 $('movementModeHelp').textContent=tap?'矢印を1回押すと進みます。同じ矢印か「停止」で止まります。ジャンプは通常どおり。':'矢印を押している間だけ移動します。長押しが途切れる場合はタップ式を選べます。';
 $('stopMoving').hidden=!tap||mode!=='playing';
 $('stopMoving').textContent=tapDirection?'■ 停止':'■ 停止中';
}
function setTapDirection(direction){
 tapDirection=direction;
 for(const key of ['left','right'])action(key,key===direction,'latched-move',false);
 updateMovementMode();
}
function toggleTapDirection(key){setTapDirection(tapDirection===key?null:key);}
function action(key,on,source,queueJump=true){const alreadyDown=sources[key].has(source);if(on)sources[key].add(source);else sources[key].delete(source);const active=sources[key].size>0;if(key==='jump'&&on&&!alreadyDown&&queueJump&&mode==='playing')buffer=JUMP_BUFFER;input[key]=active;document.querySelector(`[data-key="${key}"]`).classList.toggle('pressed',active);}
// Audio starts only from a user gesture. Music and ambience share one controller.
function ensureAudio(){if(!sound)return false;try{audio??=new(window.AudioContext||window.webkitAudioContext)();soundscape??=ShikabouSoundscape.create(audio);const resumed=audio.resume();if(resumed&&resumed.catch)resumed.catch(()=>{});return true;}catch{return false;}}
function tone(midi,when,duration,wave,volume){
 if(!audio||!soundscape||!midi)return;const o=audio.createOscillator(),g=audio.createGain();o.type=wave;o.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),when);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(volume,when+.012);g.gain.exponentialRampToValueAtTime(.001,when+duration);o.connect(g);g.connect(soundscape.effects);
 const voice={o,g};effectVoices.add(voice);o.onended=()=>{effectVoices.delete(voice);o.disconnect();g.disconnect();};o.start(when);o.stop(when+duration+.02);
}
function stopMusic(){soundscape?.stop();for(const voice of effectVoices){voice.o.onended=null;try{voice.o.stop();voice.o.disconnect();voice.g.disconnect();}catch{}}effectVoices.clear();}
function startMusic(){stopMusic();if(mode!=='playing'||!ensureAudio())return;soundscape.start(musicKey());}
function beep(freq=600,duration=.08,type='sine'){if(!ensureAudio())return;try{tone(69+12*Math.log2(freq/440),audio.currentTime,duration,type,.075);}catch{}}
function showToast(text){$('toast').textContent=text;$('toast').classList.add('show');toastTime=2.5;}
function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
function hud(){
 updateInputCheck();writeHud('hearts','text','♥'.repeat(hearts)+'♡'.repeat(MAX_HEARTS-hearts));writeHud('coins','text',String(coins).padStart(2,'0'));writeHud('time','text',formatTime(elapsed));
 writeHud('stars','text',stars.map(s=>s.taken?'★':'☆').join(' '));writeHud('stars','aria-label',stars.map(s=>`${s.label}：${s.taken?'取得済み':'未取得'}`).join('、'));writeHud('starCount','text',`${stars.filter(s=>s.taken).length} / ${stars.length}`);
 writeHud('region','text',practiceArea?`練習 · ${practiceArea.name}`:regionAt(player.x).label);
 let progress=Math.max(0,Math.min(100,(player.x-(practiceArea?.start||0))/(roundGoal()-(practiceArea?.start||0))*100));
 if(canopyRun){
  const climb=Math.min(1,canopyRun.furthestHeight/2020);
  if(canopyRun.scene===0)progress=climb*(practiceArea?100:30);
  else if(!practiceArea)progress=Math.min(canopyRun.cleared?100:96,30+70*(player.x-1070)/(GOAL-1070));
  if(canopyRun.cleared)progress=100;
  const b=canopyRun.boss;if($('bossHud').hidden!==!(b&&!canopyRun.cleared))$('bossHud').hidden=!(b&&!canopyRun.cleared);
  if(b){writeHud('bossHp','width',b.hp*25+'%');writeHud('bossHud','aria-valuenow',String(b.hp));}
  const direction=canopyRun.scene===2&&!b?canopy.horizontal(canopyRun.time):null;
  $('windHud').hidden=direction===null;if(direction!==null)writeHud('windHud','text',direction>0?'風 →':direction<0?'風 ←':'風が止んだ');
 }writeHud('progress','width',`${Math.round(progress*10)/10}%`);
}
function overlay(title,desc,label,tag){$('openAreaMap').hidden=tag==='ADVENTURE COMPLETE'&&!practiceArea;$('replayCourse').hidden=true;$('copyInputReport').hidden=tag!=='PAUSED'&&!inputCheckEnabled;menuOpen=false;$('overlay').classList.remove('is-menu');$('messageCard').classList.remove('is-menu');$('practiceMenu').hidden=true;$('backPractice').hidden=true;$('choosePractice').hidden=false;const result=tag==='ADVENTURE COMPLETE';$('overlay').classList.toggle('is-result',result);$('messageCard').classList.toggle('is-result',result);$('result').hidden=!result;$('description').hidden=result;$('cardFoot').hidden=result;$('message').innerHTML=title;$('description').innerHTML=desc;$('start').textContent=label;$('tag').textContent=tag;$('overlay').hidden=false;}
function clearResult(){
 const collected=stars.filter(s=>s.taken).length,coinRatio=tokens.length?coins/tokens.length:0;
 const checks=[collected===stars.length,coinRatio>=.6,damageCount<=1];
 const rank=checks.every(Boolean)?'S':collected===stars.length||(collected>=2&&coinRatio>=.4)?'A':collected>=1||coinRatio>=.3?'B':'C';
 const title=(practiceArea?{S:'見事な練習クリア！',A:'星も見つけたね！',B:'コースを覚えてきたね！',C:'まずは完走できたね！'}:{S:'星の冒険マスター！',A:'星あつめ名人！',B:'よりみち上手！',C:'おさんぽクリア！'})[rank];
 return{rank,title,course:courseId,practice:!!practiceArea,area:practiceArea?.name||null,targetStars:stars.length,elapsed,coins,totalCoins:tokens.length,coinRate:Math.floor(coinRatio*100),stars:collected,damageCount,fallCount,checks};
}
function showClearResult(){
 const r=lastResult=clearResult();
 if(!practiceArea&&!coursePreview)window.ShikabouJourney?.complete(courseId,r);
 overlay(practiceArea?`${practiceArea.name}の練習クリア！`:'冒険クリア！','',practiceArea?'このエリアをもう一度 →':r.rank==='S'?'もう一度あそぶ →':'もう一度、星を探す →','ADVENTURE COMPLETE');$('tag').textContent=practiceArea?`PRACTICE / ${practiceArea.name}`:'ADVENTURE COMPLETE';$('resultMode').hidden=!practiceArea;$('resultMode').textContent=practiceArea?'このエリアだけの練習記録です。':'通しプレイの記録';$('resultGoalHeading').textContent=practiceArea?'練習Sの目標':'S評価の目標';$('resultStars').classList.toggle('single',!!practiceArea);
 $('resultRank').textContent=r.rank;$('resultTitle').textContent=r.title;
 $('resultTime').textContent=formatTime(r.elapsed);$('resultCoins').textContent=`${r.coins} / ${r.totalCoins}`;$('resultCoinRate').textContent=`回収率 ${r.coinRate}%`;
 $('resultMisses').textContent=`${r.damageCount}回`;$('resultFalls').textContent=`うち落下 ${r.fallCount}回`;
 $('resultStars').innerHTML=stars.map(s=>`<div class="result-star ${s.taken?'collected':''}"><span aria-hidden="true">${s.taken?'★':'☆'}</span><b>${s.label}</b><small>${s.taken?'みつけた！':'まだ見つかっていない'}</small></div>`).join('');
 $('resultCriteria').innerHTML=[`星を${stars.length}つ集める`,'コイン60%以上','ミス1回以内'].map((label,i)=>`<li class="${r.checks[i]?'done':''}"><span aria-hidden="true">${r.checks[i]?'✓':'○'}</span> ${label}</li>`).join('');
 if(!practiceArea){$('start').textContent='エリアマップへ →';$('tag').textContent=`COURSE ${courseId} / CLEAR`;if(courseData)$('message').textContent=canopy?'1-3 大樹の森クリア！':'1-2 クリア！';if(coursePreview){$('resultMode').hidden=false;$('resultMode').textContent='おためしプレイ：クリア進行は保存されません。';}}
 $('replayCourse').hidden=!!practiceArea;$('replayCourse').textContent=`${courseId}をもう一度あそぶ`;
 const missing=stars.find(s=>!s.taken);
 $('resultTip').textContent=missing?`次は${missing.area}の寄り道で、${missing.label}を探してみよう。`:!r.checks[1]?'星はコンプリート！ 次はコイン60%を目指そう。':!r.checks[2]?'星とコインは達成！ 次はミス1回以内でS評価へ。':practiceArea?'このエリアの練習はばっちり！ 次は通しプレイへ。':'3つの星がそろいました。見事な冒険でした！';
}
function pause(){
 if(menuOpen){closePracticeMenu();return;}
 if(mode==='playing'||mode==='celebrating'||mode==='transition'){
  pausedFrom=mode;mode='paused';stopMusic();clearInput();$('sceneFade').hidden=true;$('skipCelebration').hidden=true;
  overlay('ちょっと、ひとやすみ。','準備ができたら、冒険の続きをどうぞ。','つづきから →','PAUSED');
 }else if(mode==='paused'){
  mode=pausedFrom;updateMovementMode();$('overlay').hidden=true;
  if(mode==='celebrating'){$('skipCelebration').hidden=false;playGoalFanfare(celebration.time);}else if(mode==='transition'){$('sceneFade').hidden=false;}else startMusic();
 }
}
function playGoalFanfare(from=0){
 if(!ensureAudio())return;const now=audio.currentTime;
 for(const [offset,note,length] of [[0,72,.16],[.14,76,.16],[.28,79,.2],[.55,84,.28],[.9,79,.18],[1.13,84,.22],[1.48,88,.65]])if(offset>=from)tone(note,now+offset-from,length,'triangle',.065);
 if(from<=1.55)for(const note of [72,76,79])tone(note,now+1.55-from,.65,'sine',.03);
}
function beginCelebration(){
 mode='celebrating';clearInput();stopMusic();landing=0;invincible=0;player.vx=0;player.vy=0;player.grounded=true;player.face=1;if(canopyRun?.scene!==0)player.y=(groundAt(player.x)?.y||GROUND)-player.h;
 celebration={time:0,target:canopy?player.x:practiceArea?Math.min(roundGoal()+20,practiceArea.right-88):roundGoal()+45};
 fallingChestnuts=[];for(const z of chestnutZones){z.state='cooldown';z.timer=4;}
 particles=[];for(let i=0;i<85;i++)particles.push({x:player.x-150+Math.random()*400,y:(canopyRun?.camY||0)+30+Math.random()*180,vx:(Math.random()-.5)*85,vy:-35-Math.random()*95,life:2.8,color:['#e88560','#e9c95d','#76b291','#7bbac1'][i%4]});
 $('skipCelebration').hidden=false;playGoalFanfare();hud();
}
function finishCelebration(){if(mode!=='celebrating')return;stopMusic();mode='won';clearInput();$('skipCelebration').hidden=true;celebration=null;showClearResult();}
function updateCelebration(dt){
 celebration.time+=dt;
 if(celebration.time<.65&&player.x<celebration.target){const dx=Math.min(90*dt,celebration.target-player.x);player.x+=dx;player.vx=dx/dt;walkPhase+=dx/30;}else player.vx=0;
 if(canopy)canopyCamera(dt);else camera+=(cameraTarget(player.x-W*.5)-camera)*Math.min(1,dt*4);
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;}particles=particles.filter(p=>p.life>0);
 if(celebration.time>=2.8)finishCelebration();
}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*220-40,life:.65,color});}
function canContinueBoss(){return mode==='over'&&canopyRun?.scene===2&&canopyRun.boss?.hp>0;}
function canContinueSection(){return mode==='over'&&firstClearRun&&continueSection>0;}
function resumeAt(x,y,grace=0){
 checkpoint=x;
 Object.assign(player,{x,y:y-player.h,vx:0,vy:0,face:1,grounded:true,supportPlatform:null});
 hearts=MAX_HEARTS;invincible=grace;buffer=0;coyote=0;landing=0;walkPhase=0;runDust=0;particles=[];
 clearInput();mode='playing';updateMovementMode();
 if(canopyRun)canopyCamera(0,true);else camera=cameraTarget(x-W*.33);
 $('overlay').hidden=true;startMusic();hud();
}
function continueBoss(){
 const point=canopy.bossCheckpoint;
 canopy.resetBoss(canopyRun);canopyRun.checkpointY=point.y;canopyRun.checkpointIndex=checkpoints.indexOf(point);
 resumeAt(point.x,point.y);
}
function continueFromSection(){
 const area=practiceAreas[continueSection],y=groundAt(area.start)?.y??GROUND;
 if(canopy){
  canopyRun=canopy.createRun(area,platforms);canopyRun.checkpointY=y;
  arena.style.backgroundColor=regions[continueSection].sky;
 }
 if(waterCourse){waterScene=continueSection;waterCourse.resetPlatforms(platforms);updateWaterBackdrop();}
 fallingChestnuts=[];
 resumeAt(area.start,y,1);
 showToast(`${sectionNames[continueSection]}「${area.name}」から再開！`);
}
function damage(fall=false){if(mode==='celebrating'||mode==='won')return;if(invincible>0&&!fall)return;damageCount++;if(fall)fallCount++;hearts--;beep(160,.22,'triangle');burst(player.x+20,player.y+30,'#e47d5b');if(hearts<=0){mode='over';stopMusic();clearInput();hud();if(canContinueBoss()){overlay('大蜘蛛にもう一度挑戦！','大蜘蛛の手前から再開できます。<br>ハートは3つに戻り、集めた星とコインはそのままです。','ボス戦からコンテニュー →','TRY AGAIN');return;}if(canContinueSection()){
 const section=sectionNames[continueSection],area=practiceAreas[continueSection];
 overlay('ここから、もう一度！',`${section}「${area.name}」の入口から再開できます。<br>ハートは3つに戻り、集めた星とコインはそのままです。`,`${section}からコンテニュー →`,'TRY AGAIN');return;
 }overlay('もう一度、いこう！',`コイン ${coins} 枚を集めました。<br>あせらず、穴の手前からジャンプしよう。`,'もう一度チャレンジ →','TRY AGAIN');return;}if(fall){if(moveStyle==='tap')setTapDirection(null);player.x=checkpoint;player.y=(canopyRun?.checkpointY??groundAt(checkpoint)?.y??GROUND)-player.h;player.vx=0;player.vy=0;player.grounded=true;camera=cameraTarget(player.x-W*.28);player.supportPlatform=null;if(canopyRun){canopyRun.bind=0;canopyRun.webCooldown=0;canopyRun.falling=[];canopyRun.boss=null;canopyCamera(0,true);}if(waterCourse){waterScene=waterCourse.sceneAt(player.x);updateWaterBackdrop();}showToast(checkpoint>85?'中間地点から、もう一度！':'スタートから、もう一度！');}else{player.vx=-player.face*220;player.vy=-270;}invincible=1.7;hud();}
function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
// Each species keeps its own predictable rhythm; all share the stomp rule.
function updateEnemy(e,dt){
 if(canopy){canopy.updateEnemy(canopyRun,e,dt,player,platforms);return;}
 if(waterCourse){waterCourse.updateEnemy(e,dt,player);return;}
 const previousX=e.x;
 if(e.kind==='mushroom'){
  e.hopWait-=dt;
  if(e.y>=e.baseY&&e.hopWait<=0){e.vy=-230;e.hopWait=1.9;}
  e.vy+=750*dt;e.y=Math.min(e.baseY,e.y+e.vy*dt);if(e.y>=e.baseY)e.vy=0;
 }
 let moving=true;
 if(e.kind==='rock'){e.rollPhase=(e.rollPhase+dt)%2.25;moving=e.rollPhase>=.45;}
 if(moving)e.x+=e.v*dt;
 if(e.x<e.min){e.x=e.min;e.v=Math.abs(e.v);if(e.kind==='rock')e.rollPhase=0;}
 if(e.x>e.max){e.x=e.max;e.v=-Math.abs(e.v);if(e.kind==='rock')e.rollPhase=0;}
 if(e.kind==='rock')e.angle+=(e.x-previousX)/18;
}
// Sparse chestnut showers: fixed targets, a visible warning, then a safe interval.
function updateChestnuts(dt){
 for(let index=0;index<chestnutZones.length;index++){
  const z=chestnutZones[index],margin=Math.max(...z.offsets.map(Math.abs))+22;
  if(z.state==='idle'){
   if(player.x+player.w>z.x-250&&player.x<z.x+160&&z.x>camera+margin&&z.x<camera+W-margin){
    z.state='warning';z.timer=.85;z.dropped=0;
    if(!z.announced){z.announced=true;showToast('枝が揺れた！ トゲの栗に注意');}beep(340,.07,'triangle');
   }
  }else if(z.state==='warning'){
   z.timer-=dt;if(z.timer<=0){z.state='dropping';z.timer=0;}
  }else if(z.state==='dropping'){
   z.timer-=dt;if(z.timer<=0&&z.dropped<z.offsets.length){
    const x=z.x+z.offsets[z.dropped++];fallingChestnuts.push({x,y:112,vy:40,r:11,angle:z.dropped*.7,zone:index,active:true});z.timer=.2;
   }
  }else if(z.state==='cooldown'){z.timer-=dt;if(z.timer<=0)z.state='idle';}
 }
 for(const n of fallingChestnuts){
  if(!n.active)continue;n.vy=Math.min(650,n.vy+900*dt);n.y+=n.vy*dt;n.angle+=dt*2.2;
  const nearX=Math.max(player.x,Math.min(n.x,player.x+player.w)),nearY=Math.max(player.y,Math.min(n.y,player.y+player.h));
  if((n.x-nearX)**2+(n.y-nearY)**2<n.r*n.r){
   n.active=false;burst(n.x,n.y,'#ac9c52',7);damage();if(mode!=='playing')return;
  }else if(n.y+n.r>=(groundAt(n.x)?.y||GROUND)){n.active=false;burst(n.x,(groundAt(n.x)?.y||GROUND)-8,'#ac9c52',7);}
 }
 fallingChestnuts=fallingChestnuts.filter(n=>n.active);
 chestnutZones.forEach((z,i)=>{if(z.state==='dropping'&&z.dropped===z.offsets.length&&!fallingChestnuts.some(n=>n.zone===i)){z.state='cooldown';z.timer=4;}});
}

function updateWaterBackdrop(){if(waterCourse)arena.style.backgroundColor=['#b9dde0','#182d40','#e6c9ad'][waterScene];}
function inCurrentScene(x){return canopy?canopy.sceneAt(x)===canopyRun.scene:!waterCourse||waterCourse.sceneAt(x)===waterScene;}
function configureCourseMenu(){
 if(canopy){
  $('arena').setAttribute('aria-label','縦と横にスクロールするアクションゲーム');
  $('game').setAttribute('aria-label','シカぼうを操作して大樹を登り、風を読んで大蜘蛛を倒そう');
  $('tag').textContent='COURSE 1-3 / v0.13.2';$('message').innerHTML='風に揺れる<br>大樹の森';
  $('description').innerHTML='根元から頂上へ。葉と枝をつたって登ろう。<br>梢では風を読み、大樹の主・大蜘蛛に挑め！<br>金色の葉は、かくれ星の手がかり。'+(coursePreview?'<br>おためしプレイ：進行は保存されません。':'');
  $('start').textContent=courseAllowed?'1-3に挑戦 →':'エリアマップへ →';
  document.querySelectorAll('[data-practice]').forEach((b,i)=>{const a=practiceAreas[i];b.dataset.practice=String(a.key);b.innerHTML=`<strong>0${i+1} · ${a.name}</strong><span>${a.hint}</span>`;});
  if(!courseAllowed){$('message').textContent='1-2をクリアして出発！';$('description').textContent='1-2をクリアすると、マップの1-3から出発できます。';$('choosePractice').hidden=true;}
  return;
 }
 if(!waterCourse)return;
 $('tag').textContent='COURSE 1-2 / v0.13.2';$('message').innerHTML='水辺の向こうに、<br>ひみつの洞窟。';
 $('description').innerHTML='水辺 → 洞窟 → 夕映えの水辺。<br>沈む丸太を跳び、4種類の敵を見極めよう。<br>星は3つ、回復のドングリは6個。'+(coursePreview?'<br>おためしプレイ：進行は保存されません。':'');
 $('start').textContent=courseAllowed?'1-2に挑戦 →':'エリアマップへ →';
 document.querySelectorAll('[data-practice]').forEach((b,i)=>{const a=practiceAreas[i];b.dataset.practice=String(a.key);b.innerHTML=`<strong>0${i+1} · ${a.name}</strong><span>${a.hint}</span>`;});
 if(!courseAllowed){$('message').textContent='1-1をクリアして出発！';$('description').textContent='1-1をクリアすると、マップの1-2から出発できます。';$('choosePractice').hidden=true;}
}
function checkScenePortal(){
 if(!waterCourse||sceneTransition)return false;
 const center=player.x+player.w/2;
 for(const boundary of [4000,8000]){
  const left=boundary/4000-1,right=left+1;
  if(waterScene===left&&center>=boundary-25&&player.vx>0){beginSceneTransition(right,boundary+85);return true;}
  if(waterScene===right&&center<=boundary+35&&player.vx<0){beginSceneTransition(left,boundary-135);return true;}
 }
 return false;
}
function beginSceneTransition(to,target){
 sceneTransition={time:0,to,target,switched:false};mode='transition';stopMusic();buffer=0;player.vx=0;player.vy=0;player.supportPlatform=null;
 $('sceneFade').hidden=false;$('sceneFade').style.opacity='0';$('sceneFadeTitle').textContent=regions[to].label;$('sceneFadeNote').textContent=canopy?(to===1?'幹の先に、葉の道が広がっている…':'空が近い。葉の流れを見て進もう。'):to===1?'水音が、奥から聞こえる…':'光の向こうへ、もうひと跳び。';
}
function updateSceneTransition(dt){
 const t=sceneTransition;if(!t)return;t.time+=dt;const opacity=t.time<.35?t.time/.35:t.time<.7?1:Math.max(0,1-(t.time-.7)/.4);$('sceneFade').style.opacity=String(opacity);
 if(!t.switched&&t.time>=.4){
  t.switched=true;waterScene=t.to;updateWaterBackdrop();player.x=t.target;player.y=(groundAt(player.x)?.y||GROUND)-player.h;player.vx=0;player.vy=0;player.grounded=true;player.face=t.to>=furthestRegion/4000?1:-1;landing=0;particles=[];
  if(canopyRun){canopyRun.scene=t.to;canopyRun.checkpointY=player.y+player.h;canopyRun.bind=0;canopyRun.falling=[];arena.style.backgroundColor=regions[t.to].sky;canopyCamera(0,true);}
  rememberSection(t.to);checkpoint=Math.max(checkpoint,player.x);furthestRegion=Math.max(furthestRegion,regions[t.to].x);camera=cameraTarget(player.x-W*.33);hud();
 }
 if(t.time>=1.15){sceneTransition=null;mode='playing';$('sceneFade').hidden=true;invincible=Math.max(invincible,1);jumpHeld=input.jump;buffer=0;updateMovementMode();startMusic();showToast(regions[canopyRun?.scene??waterScene].hint||'せせらぎの水辺へ戻った');}
}

function launchJump(){player.supportPlatform=null;landing=0;player.vy=-625;player.grounded=false;buffer=0;coyote=0;beep(430,.12,'triangle');burst(player.x+19,player.y+62,'#f9edbc',5);}
function update(dt){clock+=dt;landing=Math.max(0,landing-dt*5);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}if(mode==='celebrating'){updateCelebration(dt);return;}if(mode==='transition'){updateSceneTransition(dt);return;}if(mode!=='playing')return;elapsed+=dt;invincible=Math.max(0,invincible-dt);buffer=Math.max(0,buffer-dt);coyote=player.grounded?COYOTE_TIME:Math.max(0,coyote-dt);
if(waterCourse)waterCourse.updatePlatforms(platforms,dt,player);
if(canopyRun){
 canopyRun.time+=dt;canopy.updatePlatforms(canopyRun,platforms,player);
 if(canopyRun.bind>0){buffer=0;coyote=0;player.vx=0;}
}
const wasGrounded=player.grounded;const direction=canopyRun?.bind>0?0:(input.right?1:0)-(input.left?1:0);
const wind=canopyRun?canopy.wind(canopyRun,player):0,target=direction*255+(canopyRun?.scene===2&&canopyRun.bind<=0?(direction||!wasGrounded?wind:0):0);
player.vx+=(target-player.vx)*Math.min(1,dt*(player.grounded?15:8));if(direction)player.face=direction;
if(player.grounded)walkPhase+=Math.abs(player.vx)*dt/30;if(player.grounded&&Math.abs(player.vx)>90){runDust+=dt;if(runDust>.13){runDust=0;particles.push({x:player.x+19-player.face*16,y:player.y+60,vx:-player.face*35,vy:-20,life:.35,color:'#f4e4ba'});}}
if(buffer>0&&coyote>0)launchJump();
if(jumpHeld&&!input.jump&&player.vy<-250)player.vy=-250;jumpHeld=input.jump;
const previousX=player.x,previousTop=player.y;
const leftBound=canopyRun?(canopyRun.boss?canopy.arenaStart-20:canopyRun.scene===0?8:regions[canopyRun.scene].x):practiceArea?.left||0;
const rightBound=canopyRun?(canopyRun.scene===0?canopy.shaft+8:canopyRun.scene===1?6400:LENGTH):practiceArea?.right||LENGTH;
player.x=Math.max(leftBound,Math.min(rightBound-player.w,player.x+player.vx*dt));
// A connected log can sit slightly above its bank. Step onto it while grounded;
// airborne players and logs that are falling or returning still use normal landing.
if(waterCourse&&player.grounded&&player.vy>=0&&!player.supportPlatform){
 const foot=player.y+player.h;
 const bank=terrain.find(t=>Math.abs(foot-t.y)<1&&previousX+player.w-5>t.x&&previousX+5<t.x+t.w);
 if(bank){
  const log=platforms.filter(p=>p.kind==='float'&&p.collidable!==false&&(p.state==='idle'||p.state==='shaking')&&foot-p.y>1&&foot-p.y<=24&&p.x<=bank.x+bank.w&&p.x+p.w>=bank.x&&player.x+player.w-5>p.x&&player.x+5<p.x+p.w).sort((a,b)=>a.y-b.y)[0];
  if(log)player.y=log.y-player.h;
 }
}
// Solid faces stop walking into a stump or an ascending cliff. Branches are one-way.
for(const t of [...terrain,...obstacles]){if(player.y+player.h<=t.y||player.y>=t.y+t.h)continue;if(player.x+player.w>t.x&&player.x<t.x+t.w){if(player.vx>0&&previousX+player.w<=t.x+.01){player.x=t.x-player.w;player.vx=0;}else if(player.vx<0&&previousX>=t.x+t.w-.01){player.x=t.x+t.w;player.vx=0;}}}
let prevBottom=player.y+player.h;player.vy=Math.min(900,player.vy+(1650+(canopyRun?.scene===1?wind:0))*dt);player.y+=player.vy*dt;player.grounded=false;player.supportPlatform=null;
for(const t of [...terrain,...obstacles,...platforms]){if(t.collidable===false)continue;if(player.x+player.w-5<=t.x||player.x+5>=t.x+t.w)continue;if(player.vy>=0&&prevBottom<=t.y+1&&player.y+player.h>=t.y){player.y=t.y-player.h;player.vy=0;player.grounded=true;if(canopy&&t.baseX!=null)player.supportPlatform=t;if(t.kind==='float'){player.supportPlatform=t;if(!floatHintShown){floatHintShown=true;showToast('丸太がガタガタ揺れたら、跳んで逃げよう！');}}break;}}
if(player.vy<0)for(const t of [...terrain,...obstacles]){if(previousTop>=t.y+t.h&&player.y<t.y+t.h&&player.x+player.w-5>t.x&&player.x+5<t.x+t.w){player.y=t.y+t.h;player.vy=0;break;}}
if(!wasGrounded&&player.grounded){if(buffer>0)launchJump();else{landing=1;burst(player.x+19,player.y+62,'#f3e4bd',6);beep(160,.035,'triangle');}}
if(waterCourse&&!practiceArea&&checkScenePortal())return;
if(!courseData)rememberSection(regions.indexOf(regionAt(player.x)));
if(waterCourse&&waterScene!==1&&player.y+player.h>431&&!groundAt(player.x+player.w/2)){burst(player.x+19,431,'#bce7de',18);damage(true);if(mode!=='playing')return;}
if(canopyRun){
 const f=player.y+player.h;
 if(canopyRun.scene===0)canopyRun.furthestHeight=Math.max(canopyRun.furthestHeight,400-f);
 const exit=canopy.exit(canopyRun,player,practiceArea);
 if(exit==='clear'){canopyRun.cleared=true;beginCelebration();return;}
 if(exit!=null){beginSceneTransition(exit,practiceAreas[exit].start);return;}
 if(canopyRun.scene===0?canopyRun.checkpointY<390&&f>Math.min(415,canopyRun.checkpointY+510):player.y>H+100){damage(true);return;}
}else if(player.y>H+100){damage(true);if(mode!=='playing')return;}
for(const e of enemies){if(!e.alive||canopyRun&&canopy.sceneAt(e.x)!==canopyRun.scene)continue;const previousEnemyY=e.y;updateEnemy(e,dt);if(e.collidable!==false&&overlaps(player,e)){if(player.vy>80&&prevBottom<=Math.max(e.y,previousEnemyY)+12){e.alive=false;player.vy=-410;burst(e.x+19,e.y+10,e.kind==='mushroom'?'#c89166':e.kind==='rock'?'#9baeb1':'#a88bce');beep(e.kind==='rock'?180:220,.10,'square');}else damage();if(mode!=='playing')return;}}
if(canopyRun){
 const api={damage,beep,burst,say:showToast,safe:()=>invincible>0,clear:beginCelebration};
 canopy.hazards(canopyRun,dt,player,api);if(mode!=='playing')return;
 canopy.revealStar(canopyRun,player,stars,api);
 canopy.bossStep(canopyRun,dt,player,prevBottom,api);if(mode!=='playing')return;
}else updateChestnuts(dt);
if(mode!=='playing')return;
for(const c of tokens){if(!c.taken&&Math.abs(player.x+19-c.x)<29&&Math.abs(player.y+31-c.y)<43){c.taken=true;coins++;burst(c.x,c.y,'#f4bc48',7);beep(1000,.07);}}
for(const a of acorns){if(!a.taken&&hearts<MAX_HEARTS&&Math.abs(player.x+19-a.x)<32&&Math.abs(player.y+31-a.y)<42){a.taken=true;hearts=Math.min(MAX_HEARTS,hearts+1);burst(a.x,a.y,'#a4ce75',16);beep(880,.18,'sine');showToast('ドングリ！ ライフが1つ回復 ♥');}}
for(const s of stars){if(!s.hidden&&!s.taken&&Math.abs(player.x+19-s.x)<31&&Math.abs(player.y+31-s.y)<40){s.taken=true;burst(s.x,s.y,'#f3d16e',22);beep(1320,.22,'sine');showToast(`${s.label}を見つけた！ ★ ${stars.filter(s=>s.taken).length}/${stars.length}`);}}
for(let i=0;i<checkpoints.length;i++){const point=checkpoints[i];
 if(canopyRun){if(point.scene===canopyRun.scene&&i>canopyRun.checkpointIndex&&Math.abs(player.x-point.x)<52&&player.grounded&&Math.abs(player.y+player.h-point.y)<2){canopyRun.checkpointIndex=i;canopyRun.checkpointY=point.y;checkpoint=point.x;showToast('中間地点！ ここから再スタートできるよ');beep(820,.17);}continue;}
 if(player.x>point.x-30&&checkpoint<point.x){checkpoint=point.x;showToast(`${point.label}！ ここから再スタートできるよ`);beep(820,.17);}}
const region=regionAt(player.x);if(sound&&soundscape)soundscape.setArea(musicKey());if(region.x>furthestRegion){furthestRegion=region.x;showToast(region.hint);}
if(canopy)canopyCamera(dt);else camera+=(cameraTarget(player.x-W*.33)-camera)*Math.min(1,dt*7);
for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=520*dt;}particles=particles.filter(p=>p.life>0);
if(!canopy&&player.x>roundGoal())beginCelebration();hud();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function rect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(s,x,y,size,color,align='center'){ctx.fillStyle=color;ctx.font=`800 ${size}px system-ui,sans-serif`;ctx.textAlign=align;ctx.fillText(s,x,y);}
function cloud(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(0,0,36,16,'#fffaf0');ellipse(-22,-5,21,18,'#fffaf0');ellipse(8,-17,28,24,'#fffaf0');ellipse(35,-2,24,17,'#fffaf0');ctx.restore();}
function drawBackground(){if(canopy)canopy.background(ctx,{camera,W,H,run:canopyRun});else if(waterCourse)waterCourse.background(ctx,{W,H,camera,clock,scene:waterScene});else ShikabouScenery.background(ctx,{W,H,camera,clock,region:regionAt(player.x)});}
function drawTerrain(){
 if(canopy){canopy.drawWorld(ctx,{items:platforms,camera,W,H,run:canopyRun,starList:stars,player,chestnut:drawSpikyChestnut});return;}
 if(waterCourse){waterCourse.drawTerrain(ctx,{terrain,obstacles,platforms,W,camera,clock,scene:waterScene});return;}
 for(const t of terrain){
  if(t.x>camera+W+60||t.x+t.w<camera-60)continue;const area=regionAt(t.x).x,forest=area===4400,rock=area===8200;
  rect(t.x,t.y,t.w,t.h,rock?5:7,rock?'#8c9c9b':forest?'#97764f':'#c29b6d');
  ctx.save();ctx.beginPath();ctx.rect(t.x,t.y,t.w,t.h);ctx.clip();
  if(rock){
   ctx.strokeStyle='#748684';ctx.lineWidth=2;
   for(let x=Math.floor(Math.max(t.x,camera)/95)*95;x<Math.min(t.x+t.w,camera+W+95);x+=95){ctx.beginPath();ctx.moveTo(x,t.y+16);ctx.lineTo(x-18,t.y+56);ctx.lineTo(x+4,t.y+100);ctx.lineTo(x-10,t.y+170);ctx.moveTo(x-18,t.y+56);ctx.lineTo(x+45,t.y+66);ctx.stroke();}
   rect(t.x,t.y,t.w,13,4,'#aabd99');rect(t.x,t.y,t.w,5,3,'#d2d6af');
  }else{
   ctx.strokeStyle=forest?'#795d40':'#aa835e';ctx.lineWidth=2;
   for(let x=Math.floor(Math.max(t.x,camera)/64)*64;x<Math.min(t.x+t.w,camera+W+64);x+=64){ctx.beginPath();ctx.moveTo(x,t.y+35);ctx.lineTo(x+22,t.y+43);if(forest){ctx.moveTo(x+12,t.y+10);ctx.quadraticCurveTo(x+6,t.y+45,x+43,t.y+65);}ctx.stroke();}
   rect(t.x,t.y,t.w,14,6,forest?'#496d40':'#527f52');rect(t.x,t.y,t.w,5,3,forest?'#89a55a':'#91b866');
  }
  ctx.restore();
  for(let x=Math.ceil(Math.max(t.x+20,camera)/175)*175;x<t.x+t.w-15&&x<camera+W;x+=175){
   if(forest){ellipse(x,t.y-6,15,5,'#6c9055');ctx.fillStyle='#eee1b9';ctx.fillRect(x+14,t.y-12,3,12);ellipse(x+16,t.y-13,8,4,'#bf7958');}
   else if(rock){ctx.strokeStyle='#8a9e73';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,t.y);ctx.lineTo(x-5,t.y-12);ctx.moveTo(x,t.y);ctx.lineTo(x+6,t.y-15);ctx.stroke();ellipse(x+8,t.y-11,3,3,'#f2e7c1');}
   else{ellipse(x,t.y-5,3,3,'#fff4c7');ellipse(x+8,t.y-9,3,3,'#e9af80');}
  }
 }
 for(const p of platforms){
  if(p.x>camera+W+60||p.x+p.w<camera-60)continue;
  if(p.kind==='bridge'){
   ctx.strokeStyle='#897452';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-5,p.y-23);ctx.quadraticCurveTo(p.x+p.w/2,p.y-9,p.x+p.w+5,p.y-23);ctx.stroke();
   for(let x=p.x;x<p.x+p.w;x+=19){rect(x,p.y,17,16,3,'#b58a57');ctx.fillStyle='#7b6346';ctx.fillRect(x+7,p.y-17,2,17);}continue;
  }
  if(p.kind==='rock'){rect(p.x,p.y,p.w,p.h+5,6,'#899d9d');rect(p.x,p.y,p.w,7,4,'#c1cbaa');ctx.strokeStyle='#6e8586';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+30,p.y+11);ctx.lineTo(p.x+25,p.y+26);ctx.moveTo(p.x+p.w-40,p.y+10);ctx.lineTo(p.x+p.w-30,p.y+24);ctx.stroke();}
  else{
   rect(p.x,p.y,p.w,p.h,p.kind==='branch'?12:9,p.kind==='branch'?'#725438':'#a47f54');rect(p.x,p.y,p.w,6,4,p.kind==='branch'?'#81934e':'#83a863');
   ctx.strokeStyle=p.kind==='branch'?'#503f2b':'#805f40';ctx.lineWidth=2;for(let x=p.x+18;x<p.x+p.w;x+=34){ctx.beginPath();ctx.moveTo(x,p.y+11);ctx.lineTo(x+15,p.y+11);ctx.stroke();}
   if(p.kind==='branch'){ellipse(p.x+8,p.y+9,6,8,'#ba9862');ellipse(p.x+8,p.y+9,2.5,4,'#84653e');ellipse(p.x+p.w-15,p.y-3,15,5,'#65874b');}
  }
 }
 for(const o of obstacles){
  if(o.x>camera+W+50||o.x+o.w<camera-50)continue;
  rect(o.x,o.y,o.w,o.h,6,'#91603e');ellipse(o.x+o.w/2,o.y+4,o.w/2,9,'#d6b57d');ellipse(o.x+o.w/2,o.y+4,o.w*.3,5,'#ac8756');ellipse(o.x+o.w/2,o.y+4,o.w*.2,3,'#d6b57d');
  ctx.strokeStyle='#6d4c32';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(o.x+13,o.y+16);ctx.lineTo(o.x+10,o.y+o.h-3);ctx.moveTo(o.x+o.w-14,o.y+15);ctx.lineTo(o.x+o.w-10,o.y+o.h-2);ctx.stroke();ellipse(o.x+o.w-5,o.y+o.h-4,18,5,'#668047');
 }
}
function sign(x,label){const y=groundAt(x)?.y||GROUND;rect(x,y-52,7,52,2,'#947247');rect(x-35,y-80,82,37,8,'#fff2cf');text(label,x+6,y-56,14,'#577158');}
function drawEnemy(e){
 if(canopy){canopy.drawEnemy(ctx,e);return;}
 if(waterCourse){waterCourse.drawEnemy(ctx,e,clock);return;}
 if(e.kind==='mushroom'){drawMushroom(e);return;}
 if(e.kind==='rock'){drawRock(e);return;}
 drawWalker(e);
}
function drawMushroom(e){
 const air=Math.max(0,e.baseY-e.y),squash=air<.1&&e.hopWait<.2?Math.sin((.2-e.hopWait)*Math.PI/.2)*.09:0;
 ellipse(e.x+19,e.baseY+29,Math.max(11,20-air*.12),3.5,'#264c3820');
 ctx.save();ctx.translate(e.x+19,e.y+30);ctx.scale(1+squash,1-squash);
 ellipse(-8,-1,7,3,'#7a5841');ellipse(8,-1,7,3,'#7a5841');
 rect(-12,-19,24,20,7,'#f1ddb0');
 ctx.fillStyle='#ba6c4f';ctx.strokeStyle='#804f3b';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-24,-17);ctx.quadraticCurveTo(-22,-37,0,-37);ctx.quadraticCurveTo(23,-36,24,-17);ctx.quadraticCurveTo(2,-9,-24,-17);ctx.fill();ctx.stroke();
 ellipse(-11,-25,4,4,'#f1c893');ellipse(5,-30,4,3,'#f1c893');ellipse(14,-21,3,3,'#f1c893');
 ellipse(-5,-10,2.3,3.2,'#534d3b');ellipse(5,-10,2.3,3.2,'#534d3b');
 ctx.strokeStyle='#846a4b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-5,3,0,Math.PI);ctx.stroke();ctx.restore();
}
function drawRock(e){
 ellipse(e.x+19,e.baseY+30,21,4,'#264c3820');ctx.save();ctx.translate(e.x+19,e.y+15);ctx.rotate(e.angle);
 ctx.fillStyle='#9aafb1';ctx.strokeStyle='#5c777f';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-15,-11);ctx.lineTo(-3,-17);ctx.lineTo(12,-14);ctx.lineTo(20,-2);ctx.lineTo(15,12);ctx.lineTo(0,17);ctx.lineTo(-16,10);ctx.lineTo(-20,-2);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#c2d0c8';ctx.beginPath();ctx.moveTo(-15,-11);ctx.lineTo(-3,-17);ctx.lineTo(12,-14);ctx.lineTo(4,-4);ctx.lineTo(-10,-3);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#789096';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(12,2);ctx.lineTo(8,8);ctx.lineTo(13,12);ctx.moveTo(-12,1);ctx.lineTo(-7,7);ctx.stroke();
 ellipse(-5,-2,2.5,3,'#344f59');ellipse(5,-2,2.5,3,'#344f59');
 ctx.strokeStyle='#48616a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,4,3,0,Math.PI);ctx.stroke();ctx.restore();
}
function drawWalker(e){const bob=Math.sin(clock*8+e.x)*1.6;ellipse(e.x+19,e.y+29,20,4,'#264c3820');ellipse(e.x+10,e.y+27,8,4,'#6a537d');ellipse(e.x+29,e.y+27,8,4,'#6a537d');ellipse(e.x+19,e.y+17+bob,23,18,'#ac94c0');ellipse(e.x+9,e.y+1+bob,7,9,'#ac94c0');ellipse(e.x+29,e.y+1+bob,7,9,'#ac94c0');ellipse(e.x+12,e.y+14+bob,3,4,'#344556');ellipse(e.x+27,e.y+14+bob,3,4,'#344556');ctx.strokeStyle='#645376';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x+20,e.y+23+bob,4,0,Math.PI);ctx.stroke();}
function drawCollectibleStar(s){
 const y=s.y+Math.sin(clock*2.5+s.x)*3;ellipse(s.x,y,25,25,'#fff2b42b');
 ctx.save();ctx.translate(s.x,y);ctx.rotate(Math.sin(clock*1.5+s.x)*.05);
 const gold=ctx.createLinearGradient(-18,-20,15,20);gold.addColorStop(0,'#fff0a2');gold.addColorStop(1,'#e9b74c');ctx.fillStyle=gold;ctx.strokeStyle='#527d87';ctx.lineWidth=2.2;
 ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?9:20;const x=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(x,py);else ctx.lineTo(x,py);}ctx.closePath();ctx.fill();ctx.stroke();
 ellipse(-5,-6,2,3,'#fff9d5');ctx.restore();
 ctx.strokeStyle='#fff1a5';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(s.x+25,y-13);ctx.lineTo(s.x+25,y-5);ctx.moveTo(s.x+21,y-9);ctx.lineTo(s.x+29,y-9);ctx.stroke();
}
function drawSpikyChestnut(x,y,angle,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.fillStyle='#929b50';ctx.strokeStyle='#6c753a';ctx.lineWidth=1.5;
 ctx.beginPath();for(let i=0;i<28;i++){const a=i*Math.PI/14,r=i%2?10:17;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
 ellipse(0,0,10,10,'#a4ab60');ctx.fillStyle='#a67543';ctx.beginPath();ctx.moveTo(-2,-8);ctx.quadraticCurveTo(10,-4,7,6);ctx.quadraticCurveTo(0,12,-6,5);ctx.closePath();ctx.fill();ctx.strokeStyle='#d6bd7b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-2,-7);ctx.quadraticCurveTo(3,-1,-5,5);ctx.stroke();ctx.restore();
}
function drawChestnuts(){
 for(const z of chestnutZones){
  if(z.x<camera-160||z.x>camera+W+160)continue;
  const warning=z.state==='warning',dropping=z.state==='dropping',shake=warning?Math.sin(clock*34)*3:0;
  // This canopy twig sits well above the playable branch route.
  ctx.strokeStyle='#536f43';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(z.x-100,77);ctx.quadraticCurveTo(z.x+shake,103,z.x+102,78);ctx.stroke();
  for(const offset of z.offsets){ellipse(z.x+offset-12+shake,79,17,6,'#6c874c');ellipse(z.x+offset+10+shake,86,15,5,'#81944e');}
  if(warning||dropping){
   const pulse=.5+.5*Math.sin(clock*10);
   for(const offset of z.offsets){const x=z.x+offset,y=groundAt(x)?.y||GROUND;ellipse(x,y-2,19,5,`rgba(210,140,66,${.2+pulse*.25})`);ctx.strokeStyle='#c18d49';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-2,19,5,0,0,Math.PI*2);ctx.stroke();text('!',x,y-14,17,'#a16a30');}
  }
  if(z.state==='idle'||warning||dropping){z.offsets.forEach((offset,i)=>{if(dropping&&i<z.dropped)return;drawSpikyChestnut(z.x+offset+shake,107,Math.sin(clock*7+i)*(warning?.12:.02),.8);});}
 }
 for(const n of fallingChestnuts)if(n.active&&n.x>camera-30&&n.x<camera+W+30)drawSpikyChestnut(n.x,n.y,n.angle);
}
function drawAcorn(a){
ctx.save();ctx.translate(a.x,a.y+Math.sin(clock*3+a.x)*3);
ellipse(0,0,22,22,'#eff8de99');
ctx.fillStyle='#bc7a42';ctx.strokeStyle='#79502e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-6);ctx.quadraticCurveTo(-13,8,0,17);ctx.quadraticCurveTo(13,8,10,-6);ctx.closePath();ctx.fill();ctx.stroke();
ellipse(-4,2,2,6,'#e2af70');ellipse(0,-7,13,7,'#795236');
ctx.strokeStyle='#5c432d';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(2,-18);ctx.stroke();
ctx.save();ctx.translate(8,-15);ctx.rotate(-.4);ellipse(0,0,7,3,'#719a4d');ctx.restore();
text('♥ +1',0,-28,11,'#427b4d');ctx.restore();
}
// Use the approved study's eight drawings and 800 ms cycle at full running speed.
const RUN_DURATIONS=[100,100,90,110,100,100,90,110],RUN_SOLES=[484,485,476,454,472,474,468,452],OPEN_SOLES=[489,488,477,458,476,477,470,457],RUN_LIFT=[0,0,10,23,0,0,10,23];
function runFrameAt(ms){let t=((ms%800)+800)%800;for(let i=0;i<8;i++){if(t<RUN_DURATIONS[i])return i;t-=RUN_DURATIONS[i];}return 7;}
function eyesOpenAt(time,airborne=false){return airborne||((time%4.2)+4.2)%4.2<3.6;}
function drawPlayer(){if(invincible>0&&Math.floor(invincible*12)%2===0)return;const moving=Math.abs(player.vx)>25&&player.grounded;
const victory=mode==='celebrating',fight=canopyRun?.boss?.hp>0&&!victory;
const ct=celebration?.time||0,hop=canopy&&victory&&ct>=.35&&ct<1.47?Math.abs(Math.sin((ct-.35)*Math.PI/.56))*24:0;
const cheer=canopy?hop:celebration&&ct>=.75&&ct<1.65?Math.abs(Math.sin((ct-.75)*Math.PI/.45))*17:0;
const bob=moving||!player.grounded?0:Math.sin(clock*3)*1.2,center=player.x+19,foot=player.y+62;
const floor=groundAt(center)?.y||GROUND,airHeight=Math.max(0,floor-foot);ellipse(center,floor+2,Math.max(9,24-airHeight*.05),4,'#32584515');
ctx.save();ctx.translate(center,foot+bob-cheer);if(victory&&!moving)ctx.rotate(Math.sin(ct*(canopy?8:5))*(canopy?.065:.025));if(player.face<0)ctx.scale(-1,1);
let scaleX=1+landing*.2,scaleY=1-landing*.17;if(canopy&&victory){scaleX+=hop*.002;scaleY+=hop*.003;}if(!player.grounded){scaleX=.97;scaleY=1.03;ctx.rotate(player.vy<0?-.08:.05);}ctx.scale(scaleX,scaleY);
const preferred=fight||eyesOpenAt(elapsed,!player.grounded)?openSprite:runSprite,alternate=preferred===openSprite?runSprite:openSprite,art=preferred.complete&&preferred.naturalWidth?preferred:alternate,soles=art===openSprite?OPEN_SOLES:RUN_SOLES;
if((fight||moving||!player.grounded)&&art.complete&&art.naturalWidth&&sprite.complete&&sprite.naturalWidth){const frame=moving?runFrameAt(walkPhase*30000/255):(player.grounded?1:player.vy<0?3:7),sw=art.naturalWidth/4,sh=art.naturalHeight/2,scale=92/452;
ctx.drawImage(ShikabouPalette.art(art,sprite),(frame%4)*sw,Math.floor(frame/4)*sh,sw,sh,-216*scale,-(soles[frame]+(moving?RUN_LIFT[frame]:0))*scale,384*scale,512*scale);
 if(fight&&art===openSprite){
  const [a,b,y1,y2,m,my]=[[92,126,95,95,112,114],[90,124,98,99,109,117],[92,128,98,98,113,117],[95,129,92,91,116,112],
   [92,127,96,97,112,116],[90,124,98,99,110,118],[93,127,98,98,114,117],[95,129,90,90,117,110]][frame];
  const px=x=>(x*384/170-216)*scale,py=y=>(y*512/226.67-soles[frame]-(moving?RUN_LIFT[frame]:0))*scale;
  ctx.strokeStyle='#09304f';ctx.lineWidth=1.8;ctx.lineCap='round';ctx.beginPath();
  ctx.moveTo(px(a-7),py(y1-10));ctx.lineTo(px(a+6),py(y1-4));ctx.moveTo(px(b-6),py(y2-4));ctx.lineTo(px(b+6),py(y2-10));ctx.stroke();
  ellipse(px(m),py(my+.5),4.4,4.3,'#fff5e5');ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(px(m)-2.5,py(my)+1);ctx.lineTo(px(m)+2,py(my)-.5);ctx.stroke();
 }
}else if(sprite.complete&&sprite.naturalWidth){// Match the standing silhouette to the 92 px running height, with soles on the ground.
ctx.drawImage(sprite,-49,-104*(1169/1254),98,104);}else{ellipse(0,-30,22,31,'#dda27e');ellipse(0,-38,18,14,'#fff1d9');}ctx.restore();}
function render(){
 const width=canvas.width/dpr,height=canvas.height/dpr,scale=Math.min(width/W,height/H);
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 // The camera width is bounded for playability. Fit that view uniformly instead
 // of stretching it to fill a tall phone screen or a very wide landscape screen.
 ctx.save();ctx.translate((width-W*scale)/2,(height-H*scale)/2);ctx.scale(scale,scale);
 ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();drawBackground();ctx.save();ctx.translate(-camera,-(canopyRun?.camY||0));drawTerrain();if(!courseData){sign(180,'GO →');for(let i=0;i<terrain.length-1;i++){const end=terrain[i].x+terrain[i].w,next=terrain[i+1].x;if(next>end&&!platforms.some(p=>p.kind==='bridge'&&p.x<=end&&p.x+p.w>=next)&&end>camera-100&&end<camera+W+100)sign(end-105,'ジャンプ！');}sign(4260,'森へ →');sign(4440,'切り株は↑');sign(8080,'高原へ →');sign(9220,'段差は↑');}
for(const point of checkpoints){if(!inCurrentScene(point.x)||point.x<camera-80||point.x>camera+W+80)continue;const y=point.y??groundAt(point.x).y,h=canopy?68:106;
 ctx.strokeStyle='#f8f0d8';ctx.lineWidth=canopy?4:5;ctx.beginPath();ctx.moveTo(point.x,y);ctx.lineTo(point.x,y-h);ctx.stroke();ctx.fillStyle=(canopyRun?canopyRun.checkpointIndex>=checkpoints.indexOf(point):checkpoint>=point.x)?'#eb8759':'#b2bc9a';ctx.beginPath();ctx.moveTo(point.x,y-h);ctx.lineTo(point.x+(canopy?39:50),y-h+15);ctx.lineTo(point.x,y-h+31);ctx.fill();}
for(const c of tokens){if(!inCurrentScene(c.x)||c.taken||c.x<camera-30||c.x>camera+W+30)continue;let y=c.y+Math.sin(clock*3+c.x)*4;ellipse(c.x,y,9,12,'#d89533');ellipse(c.x,y-1,7,10,'#f6d36b');ctx.fillStyle='#dca749';ctx.fillRect(c.x-1,y-6,2,11);}
drawChestnuts();
for(const s of stars)if(inCurrentScene(s.x)&&!s.hidden&&!s.taken&&s.x>camera-40&&s.x<camera+W+40)drawCollectibleStar(s);
for(const a of acorns)if(inCurrentScene(a.x)&&!a.taken&&a.x>camera-40&&a.x<camera+W+40)drawAcorn(a);
for(const e of enemies)if(inCurrentScene(e.x)&&e.alive&&e.x>camera-60&&e.x<camera+W+60)drawEnemy(e);
if(!canopy&&practiceArea&&practiceArea.right<LENGTH){const x=roundGoal(),y=groundAt(x)?.y||GROUND;ctx.strokeStyle='#fdf8de';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-130);ctx.stroke();ctx.fillStyle='#dcbb57';ctx.beginPath();ctx.moveTo(x,y-130);ctx.lineTo(x+58,y-111);ctx.lineTo(x,y-93);ctx.fill();if(mode!=='celebrating')text('FINISH',x+5,y-145,13,'#476a48');}else if(!canopy){
rect(GOAL-30,302,100,98,7,'#f9ecd1');ctx.fillStyle='#5b826b';ctx.beginPath();ctx.moveTo(GOAL-46,306);ctx.lineTo(GOAL+20,253);ctx.lineTo(GOAL+87,306);ctx.fill();rect(GOAL+3,352,30,48,12,'#7fa38a');rect(GOAL-18,325,20,20,4,'#d8bb70');rect(GOAL+40,325,20,20,4,'#d8bb70');ctx.strokeStyle='#fef9e6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(GOAL,302);ctx.lineTo(GOAL,224);ctx.stroke();ctx.fillStyle='#e78b65';ctx.beginPath();ctx.moveTo(GOAL,224);ctx.lineTo(GOAL+50,239);ctx.lineTo(GOAL,255);ctx.fill();text('GOAL',GOAL+20,282,12,'#fff9e9');}
if(mode==='celebrating'){const x=Math.max(camera+115,Math.min(camera+W-115,player.x+19)),y=(canopy?player.y+player.h:(groundAt(player.x)?.y||GROUND))-148;rect(x-105,y-24,210,40,16,'#fff8def0');text(practiceArea?'練習クリア！':canopy?'大蜘蛛を倒した！':'やったね！ ゴール！',x,y+3,19,'#3f7357');}
if(waterCourse){waterCourse.water(ctx,{W,camera,clock,scene:waterScene});waterCourse.portals(ctx,{W,camera,scene:waterScene});}
if(canopy)canopy.drawBoss(ctx,canopyRun);drawPlayer();
if(canopy&&mode==='celebrating'&&celebration.time>.27&&celebration.time<1.82){
 for(let i=0;i<5;i++){const a=celebration.time*2+i*1.25,x=player.x+19+Math.cos(a)*63,y=player.y-2+Math.sin(a)*40;ctx.strokeStyle='#fff2b4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
}if(canopy)canopy.drawBindings(ctx,canopyRun,player);for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.x,p.y,5,5,1,p.color);}ctx.globalAlpha=1;ctx.restore();ctx.restore();}
function resize(){recordInput('画面サイズ変更');const r=canvas.getBoundingClientRect?.()||arena.getBoundingClientRect();if(!(r.width>0&&r.height>0))return;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);W=Math.max(360,Math.min(1500,r.width/r.height*H));if(canopyRun)canopyCamera(0,true);else camera=cameraTarget(player?.x-W*.33||0);render();}
function frame(t){const began=inputRealNow(),gap=last?Math.max(0,t-last):0;if(!last)last=t;acc+=Math.min((t-last)/1000,.08);last=t;while(acc>=STEP){update(STEP);acc-=STEP;}render();frameSamples.push({at:inputRealNow(),gap,work:Math.max(0,inputRealNow()-began)});if(frameSamples.length>240)frameSamples.shift();requestAnimationFrame(frame);}
$('start').addEventListener('click',()=>{if(mode==='won'&&!practiceArea&&!menuOpen){location.assign('area-map.html');return;}if(mode==='paused'&&!menuOpen)pause();else if(!menuOpen&&canContinueBoss())continueBoss();else if(!menuOpen&&canContinueSection())continueFromSection();else startRound(menuOpen?null:practiceArea);});
$('movementMode').addEventListener('click',()=>{
 clearInput();moveStyle=moveStyle==='hold'?'tap':'hold';
 try{window.localStorage?.setItem('shikabou.moveStyle',moveStyle);}catch{}
 updateMovementMode();recordInput('移動方式を変更');
});
$('stopMoving').addEventListener('click',()=>{setTapDirection(null);recordInput('停止ボタン');});
$('replayCourse').addEventListener('click',()=>startRound());
$('pause').addEventListener('click',pause);$('restart').addEventListener('click',()=>startRound(practiceArea));
$('choosePractice').addEventListener('click',openPracticeMenu);$('backPractice').addEventListener('click',closePracticeMenu);$('skipCelebration').addEventListener('click',finishCelebration);
document.querySelectorAll('[data-practice]').forEach(b=>b.addEventListener('click',()=>{const area=practiceAreas.find(a=>a.key===Number(b.dataset.practice));if(area)startRound(area);}));
$('sound').addEventListener('click',()=>{sound=!sound;$('soundState').textContent=sound?' ON':' OFF';$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'音楽・環境音・効果音をオフにする':'音楽・環境音・効果音をオンにする');if(sound){startMusic();beep();}else stopMusic();});
// Keep ownership through interruption; only live contact evidence can restore a hold.
function releasePointer(e){const held=activePointers.has(e.pointerId);activePointers.delete(e.pointerId);const source=`p${e.pointerId}`;for(const key of Object.keys(sources))if(sources[key].has(source))action(key,false,source);if(held)recordInput(e.type==='pointercancel'?'ポインター中断':'ポインター解除');}
// Touch lists may arrive in different orders. Only a contact's own end/cancel may release it.
function syncTouches(e,includeChanged=false){
 const contacts=includeChanged?[...Array.from(e.touches),...Array.from(e.changedTouches)]:Array.from(e.touches);let recovered=false;
 for(const t of contacts){const key=activeTouches.get(t.identifier);if(!key||mode!=='playing'&&mode!=='transition'||moveStyle==='tap'&&key!=='jump')continue;
  interruptedTouches.delete(t.identifier);if(!sources[key].has(`t${t.identifier}`)){action(key,true,`t${t.identifier}`,false);recovered=true;}
 }
 if(recovered)recordInput('接触を確認して復帰');
}
function paintControl(pad){
 const r=pad.getBoundingClientRect(),w=r.width||76,h=r.height||68,ratio=Math.min(window.devicePixelRatio||1,2),c=pad.getContext('2d');
 pad.width=Math.round(w*ratio);pad.height=Math.round(h*ratio);c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);
 c.fillStyle=pad.dataset.key==='jump'?'#ffffff':'#173d46';c.beginPath();
 const x=w/2,y=pad.dataset.key==='jump'?h*.37:h/2,size=Math.min(w,h)*.2;
 if(pad.dataset.key==='jump'){
  c.moveTo(x,y-size);c.lineTo(x+size,y);c.lineTo(x+size*.32,y);c.lineTo(x+size*.32,y+size);c.lineTo(x-size*.32,y+size);c.lineTo(x-size*.32,y);c.lineTo(x-size,y);
 }else{const direction=pad.dataset.key==='right'?1:-1;c.moveTo(x+direction*size*.65,y);c.lineTo(x-direction*size*.65,y-size);c.lineTo(x-direction*size*.65,y+size);}
 c.closePath();c.fill();if(pad.dataset.key==='jump'){c.font='800 9px system-ui,sans-serif';c.textAlign='center';c.fillText('JUMP',x,h*.82);}
}
if(inputCanvasEnabled)document.querySelectorAll('[data-key]').forEach(button=>{
 const pad=document.createElement('canvas');pad.className=button.className;pad.dataset.key=button.dataset.key;
 pad.setAttribute('role','button');pad.setAttribute('tabindex','0');pad.setAttribute('draggable','false');pad.setAttribute('aria-label',button.getAttribute('aria-label'));pad.textContent=button.getAttribute('aria-label');
 button.replaceWith(pad);new ResizeObserver(()=>paintControl(pad)).observe(pad);paintControl(pad);
});
document.querySelectorAll('[data-key]').forEach(b=>{
 if(nativeTouchControls)b.addEventListener('touchstart',e=>{
  if(mode!=='playing'&&mode!=='transition')return;e.preventDefault();
  for(const t of Array.from(e.changedTouches)){const oldKey=activeTouches.get(t.identifier);if(oldKey&&oldKey!==b.dataset.key)action(oldKey,false,`t${t.identifier}`);interruptedTouches.delete(t.identifier);touchOrigins.set(t.identifier,{key:b.dataset.key,at:clock,atReal:inputRealNow(),x:t.clientX,y:t.clientY,button:b,startButton:inputBounds(b)});activeTouches.set(t.identifier,b.dataset.key);if(moveStyle!=='tap'||b.dataset.key==='jump')action(b.dataset.key,true,`t${t.identifier}`);}
  if(moveStyle==='tap'&&b.dataset.key!=='jump')toggleTapDirection(b.dataset.key);
  syncTouches(e,true);recordInput(`${b.dataset.key==='right'?'右':b.dataset.key==='left'?'左':'ジャンプ'}に接触`,e);
 },{passive:false,capture:true});
 b.addEventListener('pointerdown',e=>{
  if(mode!=='playing'&&mode!=='transition'||e.pointerType==='mouse'&&(e.button!==0||e.sourceCapabilities?.firesTouchEvents))return;
  if(nativeTouchControls&&e.pointerType==='touch'){e.preventDefault();return;}
  e.preventDefault();if(moveStyle==='tap'&&b.dataset.key!=='jump'){toggleTapDirection(b.dataset.key);recordInput('タップで移動方向を変更');return;}activePointers.set(e.pointerId,b);action(b.dataset.key,true,`p${e.pointerId}`);recordInput('ポインター押下');
  try{b.setPointerCapture(e.pointerId);}catch{/* Document listeners still receive release events. */}
 },{passive:false,capture:true});
 for(const event of ['pointerup','pointercancel'])b.addEventListener(event,e=>{if(event==='pointercancel'&&nativeTouchControls&&e.pointerType==='touch')recordInput(`ポインター中断：${b.dataset.key==='right'?'右':b.dataset.key==='left'?'左':'ジャンプ'}`,e);e.preventDefault();releasePointer(e);});
 b.addEventListener('lostpointercapture',e=>{
  if(!activePointers.has(e.pointerId))return;recordInput('キャプチャ変更');
  try{b.setPointerCapture(e.pointerId);}catch{/* Keep holding until an actual up/cancel, not capture loss. */}
 });
 for(const event of ['contextmenu','dragstart','selectstart'])b.addEventListener(event,e=>{e.preventDefault();e.stopPropagation?.();recordInput(`${event==='contextmenu'?'長押しメニュー要求':event==='dragstart'?'ドラッグ要求':'文字選択要求'}：${b.dataset.key==='right'?'右':b.dataset.key==='left'?'左':'ジャンプ'}`);},{passive:false,capture:true});
});
if(nativeTouchControls){
 document.addEventListener('touchmove',e=>{
  if(!activeTouches.size)return;
  if(Array.from(e.changedTouches).some(t=>activeTouches.has(t.identifier))&&e.cancelable)e.preventDefault();
  syncTouches(e,true);
 },{passive:false,capture:true});
 for(const event of ['touchend','touchcancel'])document.addEventListener(event,e=>{
  const affected=[];
  for(const t of Array.from(e.changedTouches)){const key=activeTouches.get(t.identifier);if(!key)continue;
   affected.push(key==='right'?'右':key==='left'?'左':'ジャンプ');action(key,false,`t${t.identifier}`);
   if(event==='touchend'){activeTouches.delete(t.identifier);interruptedTouches.delete(t.identifier);}else interruptedTouches.add(t.identifier);
  }
  if(affected.length&&e.cancelable)e.preventDefault();
  // Bound canceled ownership; never infer release of another finger from a missing list entry.
  while(interruptedTouches.size>12){const id=interruptedTouches.values().next().value;interruptedTouches.delete(id);activeTouches.delete(id);touchOrigins.delete(id);}
  syncTouches(e);
  if(affected.length){if(event==='touchcancel')touchInterruptions++;recordInput(`${event==='touchcancel'?'タッチ中断':'指が離れた'}：${affected.join('・')}`,e);}
  if(event==='touchend')for(const t of Array.from(e.changedTouches))touchOrigins.delete(t.identifier);
 },{passive:false,capture:true});
}
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,releasePointer,true);
document.addEventListener('pointermove',e=>{if(activePointers.has(e.pointerId)&&e.buttons===0)releasePointer(e);},true);
$('copyInputReport').hidden=!inputCheckEnabled;$('copyInputReport').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(window.ShikabouInputDiagnostics.compactReport(),null,2));$('copyInputReport').textContent='操作記録をコピーしました';}catch{$('copyInputReport').textContent='コピーできませんでした';}});
const keymap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};window.addEventListener('keydown',e=>{if(keymap[e.code]&&!(mode!=='playing'&&(e.target instanceof HTMLButtonElement||e.target?.matches?.('[data-key]'))&&e.code==='Space')){e.preventDefault();if(keymap[e.code]!=='jump'&&tapDirection)setTapDirection(null);action(keymap[e.code],true,e.code);}if(e.code==='Escape'&&!e.repeat)pause();});window.addEventListener('keyup',e=>{if(keymap[e.code]){e.preventDefault();action(keymap[e.code],false,e.code);}});window.addEventListener('blur',()=>{recordInput('画面からフォーカス移動');clearInput();if(mode==='playing'||mode==='celebrating'||mode==='transition')pause();});document.addEventListener('visibilitychange',()=>{recordInput(document.hidden?'画面を閉じた':'画面に復帰');if(document.hidden&&(mode==='playing'||mode==='celebrating'||mode==='transition'))pause();});new ResizeObserver(resize).observe(arena);sprite.onload=render;runSprite.onload=render;openSprite.onload=render;reset();resize();requestAnimationFrame(frame);
configureCourseMenu();
if(inputOptions?.get('play')==='1'&&courseAllowed&&['1-1','1-2','1-3'].includes(inputOptions?.get('course'))){startRound();window.addEventListener('pointerdown',()=>{if(mode==='playing'&&audio?.state==='suspended')audio.resume().catch(()=>{});},{once:true});}
})();
