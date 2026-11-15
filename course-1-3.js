'use strict';
(() => {
 const length=11960, goal=11720, shaft=352, arenaStart=11030;
 const regions=[
  {x:0,label:'01 · 大樹の根元',name:'大樹の根元',hint:'葉と枝をつたって上へ！ 頂上の右に道がある',audio:28000,sky:'#294d42'},
  {x:1000,label:'02 · 木々の上',name:'木々の上',hint:'下向きの風に注意。葉が止まったら跳ぼう',audio:29000,sky:'#698a64'},
  {x:6400,label:'03 · 風が抜ける樹上',name:'風が抜ける樹上',hint:'葉の流れを見て、追い風に乗って大ジャンプ！',audio:30000,sky:'#b0cdc1'}
 ];
 const sceneAt=x=>x<1000?0:x<6400?1:2;
 const practiceAreas=[
  {key:0,name:regions[0].name,start:32,left:0,right:1000,finish:328,hint:'トゲの栗と毛虫をよけて、真上へ'},
  {key:1000,name:regions[1].name,start:1070,left:1000,right:6400,finish:6250,hint:'揺れる葉と、ときどき吹く下向きの風'},
  {key:6400,name:regions[2].name,start:6470,left:6400,right:length,finish:goal,hint:'追い風ジャンプ、クモの巣、大蜘蛛'}
 ];
 const terrain=[
  [8,400,344],[1000,380,560],[1760,390,445],[2347,375,523],[3050,385,500],[3695,367,500],[4375,380,500],[5040,386,545],[5728,373,672],
  [6400,385,730],[7375,385,590],[8210,390,580],[9060,385,470],[9730,389,490],[10470,385,520],[10990,400,970]
 ].map(([x,y,w])=>({x,y,w,h:x<1000||x>=10990?170:24}));
 for(const t of terrain)if(t.x===10470)t.h=15;
 // Each surface has its own fixed origin; leaves carry riders as they sway.
 const route=[
  [116,326,102,'root'],[208,250,112,'root'],[115,172,103,'leaf'],[26,94,111,'branch'],
  [117,15,107,'leaf'],[219,-63,112,'branch'],[136,-141,103,'leaf'],[49,-220,106,'branch'],
  [135,-297,106,'leaf'],[226,-375,112,'branch'],[130,-453,112,'leaf'],[34,-531,112,'branch'],
  [130,-609,116,'leaf'],[222,-687,112,'branch'],[141,-765,103,'leaf'],[40,-843,110,'branch'],
  [133,-921,115,'leaf'],[223,-999,110,'branch'],[130,-1077,116,'leaf'],[38,-1155,115,'branch'],
  [127,-1233,115,'leaf'],[223,-1311,111,'branch'],[129,-1390,112,'leaf'],[43,-1468,105,'branch'],
  [142,-1544,115,'leaf'],[224,-1620,120,'branch']
 ];
 const extras=[
  [25,-374,77,'leaf'],[21,-454,90,'branch'], // 葉の裏の寄り道
  [1624,378,84,'leaf'],[2250,382,70,'leaf'],[2930,372,66,'leaf'],[4230,369,79,'leaf'],[4905,381,72,'leaf'],
  [3880,295,126,'branch'],[4053,223,102,'leaf'],[4180,154,110,'branch'],
  [6710,315,148,'branch'],[7460,307,145,'leaf'],[7790,311,140,'branch'],
  [9170,310,152,'leaf'],[9770,301,121,'branch'],[9950,229,125,'leaf'],[10132,155,105,'branch'],
  [10478,310,175,'branch'],[10754,308,146,'leaf']
 ];
 const platforms=[...route,...extras].map(([x,y,w,kind],i)=>({x,y,w,h:17,kind,baseX:x,baseY:y,phase:i*1.43}));
 const obstacles=[];
 const bossCheckpoint={x:arenaStart+30,y:400,scene:2,label:'大蜘蛛の手前'};
 const checkpoints=[
  {x:72,y:-531,scene:0,label:'根元の中間地点'},
  {x:74,y:-1155,scene:0,label:'樹の中腹'},
  {x:3110,y:385,scene:1,label:'木々の上の中間地点'},
  {x:4510,y:380,scene:1,label:'風を抜けた枝'},
  {x:6530,y:385,scene:2,label:'樹上の入り口'},
  {x:9250,y:385,scene:2,label:'樹上の中間地点'},
  bossCheckpoint
 ];
 const secrets=[
  {scene:0,x:54,y:-374,starX:58,starY:-488,label:'根元のかくれ星',area:'大樹の根元'},
  {scene:1,x:4100,y:223,starX:4235,starY:118,label:'梢のかくれ星',area:'木々の上'},
  {scene:2,x:10008,y:229,starX:10184,starY:120,label:'風のかくれ星',area:'風が抜ける樹上'}
 ];
 const starSites=secrets.map(s=>({x:s.starX,y:s.starY,label:s.label,area:s.area,hidden:true}));
 const acorns=[
  {x:267,y:-103},{x:167,y:-810},{x:2760,y:335},{x:5380,y:346},{x:7540,y:270},{x:11053,y:360}
 ];
 const vents=[{x:2205,w:142,phase:.5},{x:3550,w:145,phase:2.2},{x:5585,w:143,phase:4.7}];
 const gusts=[{left:6890,right:7640},{left:7795,right:8405},{left:8695,right:9270},{left:9365,right:9850},{left:10025,right:10715}];
 const webs=[{x:9330,y:334},{x:9790,y:338},{x:10184,y:339},{x:10570,y:325},{x:10805,y:326},{x:10900,y:330}];
 const drops=[{x:192,y:-89,ground:15},{x:283,y:-490,ground:-375},{x:100,y:-964,ground:-843},{x:278,y:-1430,ground:-1311}];
 const signs=[
  {x:168,y:400,text:'↑ 枝と葉をつたって上へ',scene:0},{x:284,y:-1620,text:'梢へ →',scene:0},
  {x:2140,y:390,text:'葉が止まったら、ジャンプ！',scene:1},
  {x:6940,y:385,text:'追い風に乗って、遠くまで！',scene:2},{x:6200,y:373,text:'風の抜ける樹上へ →',scene:1},{x:10865,y:385,text:'大蜘蛛のなわばり →',scene:2}
 ];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), T=Math.PI*2;
 const foot=p=>p.y+p.h;
 const airPhase=(t,offset)=>{
  const waits=[1.64,2.25,1.82,2.64,1.44],bursts=[1.35,1.86,1.54,1.42,1.8];
  let n=(t+offset)%(waits.reduce((a,v,i)=>a+v+bursts[i]+.48,0));
  for(let i=0;i<waits.length;i++){if(n<waits[i])return 0;n-=waits[i];if(n<.48)return .32;n-=.48;if(n<bursts[i])return 1;n-=bursts[i];}
  return 0;
 };
 function horizontal(t){const p=(t+.4)%8;return p<3.45?1:p<4?0:p<7.45?-1:0;}
 function windDrift(t){const p=(t+.4)%8;return Math.min(p,3.45)-clamp(p-4,0,3.45);}
 function wind(run,p){
  const scene=sceneAt(p.x),cx=p.x+p.w/2;
  if(scene===1){const vent=vents.find(v=>cx>=v.x&&cx<v.x+v.w);return !p.grounded&&vent&&airPhase(run.time,vent.phase)===1?5250:0;}
  if(scene===2&&gusts.some(v=>cx>=v.left&&cx<v.right))return 144*horizontal(run.time);
  return 0;
 }
 function createEnemies(){
  const specs=[
   ['caterpillar',2],['caterpillar',5],['caterpillar',9],['caterpillar',14],['caterpillar',17],['caterpillar',21],
   ['caterpillar',null,1260,1400,380],['caterpillar',26],['squirrel',null,1840,2100,390],['dropper',null,2080,2080,264],
   ['squirrel',null,2510,2740,375],['caterpillar',null,3160,3370,385],['dropper',null,3460,3460,260],
   ['caterpillar',null,3810,3970,367],['squirrel',null,4650,4770,380],['dropper',null,5345,5345,262],
   ['caterpillar',null,5780,5980,373],['bird',null,6590,6870,248],['bird',null,7545,7770,263],
   ['spider',null,8330,8540,390],['spider',null,9180,9370,385],['spider',null,9800,9940,389],['spider',null,10635,10835,385]
  ];
  const sizes={caterpillar:[35,19,37],squirrel:[36,31,62],dropper:[36,31,0],bird:[38,24,100],spider:[42,27,54]};
  return specs.map(([kind,surface,min,max,y],i)=>{
   const [w,h,speed]=sizes[kind],p=platforms[surface];const x=p?p.x+12:min;
   return {kind,surface,min,max,x,y:(p?p.y:y)-h,baseY:y-h,w,h,v:speed*(i%2?-1:1),local:12,time:0,alive:true,cooldown:i%3*.35,warning:0};
  });
 }
 function updateEnemy(run,e,dt,p,items){
  e.time+=dt;const support=e.surface!=null?items[e.surface]:null;
  if(support){
   e.local+=e.v*dt;if(e.local<6){e.local=6;e.v=Math.abs(e.v);}if(e.local>support.w-e.w-6){e.local=support.w-e.w-6;e.v=-Math.abs(e.v);}
   e.x=support.x+e.local;e.y=support.y-e.h;return;
  }
  if(e.kind==='dropper'){
   e.cooldown=Math.max(0,e.cooldown-dt);
   if(e.warning>0){e.warning-=dt;if(e.warning<=0){run.falling.push({x:e.x+18,y:e.y+15,limit:e.y+245,vy:150,kind:'nut',spin:0});e.cooldown=2.7;}}
   else if(!e.cooldown&&Math.abs(p.x+19-e.x-18)<112){e.warning=.48;}
   return;
  }
  e.x+=e.v*dt;if(e.x<e.min){e.x=e.min;e.v=Math.abs(e.v);}if(e.x>e.max){e.x=e.max;e.v=-Math.abs(e.v);}
  if(e.kind==='bird')e.y=e.baseY+Math.sin(e.time*3)*4;
 }
 function createRun(area,items){
  for(const q of items){q.x=q.baseX;q.y=q.baseY;}
  return {time:0,scene:sceneAt(area?.start||0),camY:0,checkpointY:400,checkpointIndex:-1,furthestHeight:0,bind:0,webCooldown:0,falling:[],drops:drops.map(d=>({...d,state:'idle',timer:0})),boss:null,cleared:false,exitPose:false};
 }
 function updatePlatforms(run,items,p){
  for(const q of items){
   if(q.kind!=='leaf'||sceneAt(q.baseX)!==run.scene)continue;
   const x=q.x,y=q.y,t=run.time*(run.scene===0?1.65:2.1)+q.phase,range=run.scene===0?11:20;
   q.x=q.baseX+Math.sin(t)*range;q.y=q.baseY+Math.sin(t+.6)*6;
   if(p.grounded&&p.supportPlatform===q){p.x+=q.x-x;p.y+=q.y-y;}
  }
 }
 function cameraY(run,p,dt,snap=false){
  const y=run.scene===0?clamp(foot(p)-325,-1765,0):0;
  run.camY=snap?y:run.camY+(y-run.camY)*Math.min(1,dt*10);
 }
 function exit(run,p,area){
  if(run.scene===0&&p.x+p.w/2>308&&foot(p)<-1610&&p.grounded)return area?'clear':1;
  if(run.scene===1&&p.x>=(area?area.finish:6320))return area?'clear':2;
  return null;
 }
 function hitCircle(p,x,y,r){const dx=x-clamp(x,p.x,p.x+p.w),dy=y-clamp(y,p.y,p.y+p.h);return dx*dx+dy*dy<r*r;}
 function hazards(run,dt,p,api){
  run.bind=Math.max(0,run.bind-dt);run.webCooldown=Math.max(0,run.webCooldown-dt);
  if(run.scene===0)for(const d of run.drops){
   if(d.state==='idle'&&Math.abs(p.x+19-d.x)<110&&foot(p)>d.y+25&&foot(p)<d.ground+38){d.state='warning';d.timer=.50;api.beep(310,.07);}
   else if(d.state==='warning'){d.timer-=dt;if(d.timer<=0){run.falling.push({x:d.x,y:d.y,limit:d.ground+115,vy:370,kind:'chestnut',spin:0});d.state='rest';d.timer=3.15;}}
   else if(d.state==='rest'){d.timer-=dt;if(d.timer<=0)d.state='idle';}
  }
  for(const n of run.falling){
   n.vy=Math.min(790,n.vy+1450*dt);n.y+=n.vy*dt;n.spin+=dt*8;
   if(hitCircle(p,n.x,n.y,n.kind==='nut'?10:13)){n.hit=true;api.damage();}
  }
  run.falling=run.falling.filter(n=>!n.hit&&n.y<n.limit);
  if(run.scene===2&&!run.webCooldown){
   const w=webs.find(w=>hitCircle(p,w.x,w.y,19));
   if(w){run.bind=Math.max(run.bind,.62);run.webCooldown=1.8;api.say('糸にからまった！');api.beep(195,.13);}
  }
 }
 function revealStar(run,p,stars,api){
  const clue=secrets[run.scene],s=stars.find(s=>s.label===clue.label);
  const q=p.supportPlatform,dx=q&&q.baseY===clue.y?q.x-q.baseX:0;
  if(s?.hidden&&p.grounded&&Math.abs(p.x+19-clue.x-dx)<25&&Math.abs(foot(p)-clue.y)<10){s.hidden=false;api.burst(s.x,s.y,'#ebcf7b',14);api.beep(920,.17);api.say('金色の葉を踏んで、かくれ星が現れた！');}
 }
 const newBoss=()=>({x:11525,y:346,w:98,h:54,hp:4,state:'intro',t:0,dir:-1,step:0,attack:0,shot:null,contactGrace:0,mark:11570,ceiling:130,anchor:11570});
 const spiderLift=state=>['rushTell','recover','webTell','impact','defeat'].includes(state)?5:state==='slam'?-4:0;
 const BOSS_SCALE=1.62;
 function bossContact(b,p,prevBottom){
  if(b.state==='intro'||b.state==='hit'||b.state==='defeat')return null;
  if(b.y<346&&['threadUp','above','slam'].includes(b.state)){
   return p.x+p.w-5>b.x+8&&p.x+5<b.x+b.w-8&&foot(p)>b.y&&p.y<b.y+b.h-5?'body':null;
  }
  const middle=b.x+b.w/2,head=middle+b.dir*11*BOSS_SCALE,back=middle-b.dir*12*BOSS_SCALE;
  const top=b.y+b.h-4+(-34+spiderLift(b.state))*BOSS_SCALE;
  const feet=foot(p),cx=p.x+p.w/2;
  // Give the visible head and upper back a landing band separate from the lower body.
  const overBack=Math.abs(cx-back)<27+13,overHead=Math.abs(cx-head)<25+13;
  if(!p.grounded&&p.vy>0&&feet>prevBottom&&prevBottom<=top+12&&feet>=top-4&&feet<=top+20&&(overHead||overBack))return 'stomp';
  const left=Math.min(head-24,back-31),right=Math.max(head+24,back+31);
  return p.x+p.w-6>left&&p.x+6<right&&feet>top+16&&p.y<b.y+b.h-5?'body':null;
 }
 function resetBoss(run){
  run.boss=newBoss();run.bind=0;run.webCooldown=0;run.falling=[];
 }
 function bossStep(run,dt,p,prevBottom,api){
  if(run.scene!==2||p.x<arenaStart&&!run.boss)return;
  const b=run.boss??=newBoss();b.t+=dt;b.contactGrace=Math.max(0,b.contactGrace-dt);
  const cx=p.x+p.w/2,bx=b.x+b.w/2,dx=cx-bx,face=dx>=0?1:-1;
  const set=(state)=>{b.state=state;b.t=0;};
  p.x=clamp(p.x,arenaStart-20,length-p.w-17);
  if(b.state==='intro'){
   if(b.t<dt*2)api.say('大蜘蛛が現れた！ 突進を跳び越えて、上から踏もう');
   if(b.t>.84)set('idle');
  }else if(b.state==='idle'){
   b.dir=face;if(b.t>.43)set('walk');
  }else if(b.state==='walk'){
   b.dir=face;b.x+=face*55*dt;b.step+=dt*8;
   if(b.t>.74||Math.abs(dx)<110){
    b.attack++;
    set(b.hp<=2&&b.attack%3===0?'threadUp':b.attack%3===2?'webTell':'rushTell');
   }
  }else if(b.state==='webTell'){
   b.dir=face;
   if(b.t>.52){b.shot={x:bx+b.dir*33,y:b.y+21,vx:b.dir*410,life:1};api.beep(460,.15);set('webWait');}
  }else if(b.state==='webWait'){
   if(!b.shot&&b.t>.3||b.t>.78){b.dir=face;set('rushTell');}
  }else if(b.state==='rushTell'){
   if(b.t>(b.boundRush?.93:.43)){b.boundRush=false;set('rush');api.beep(170,.21,'triangle');}
  }else if(b.state==='rush'){
   b.x+=b.dir*468*dt;b.step+=dt*23;
   if(b.t>.65||b.x<arenaStart+18||b.x>length-b.w-30){set('recover');api.burst(bx,393,'#ba9c82',10);}
  }else if(b.state==='threadUp'){
   if(!b.fired){b.fired=true;b.anchor=bx;}
   if(b.t>.18)b.y=346+(b.ceiling-346)*clamp((b.t-.18)/.6,0,1);
   if(b.t>.8){b.mark=clamp(cx+face*16,arenaStart+95,length-100);set('above');}
  }else if(b.state==='above'){
   b.x+=(b.mark-b.w/2-b.x)*Math.min(1,dt*10);b.anchor=b.x+b.w/2;
   if(b.t>.74){b.x=b.mark-b.w/2;b.anchor=b.mark;set('slam');api.beep(210,.18);}
  }else if(b.state==='slam'){
   b.y=Math.min(346,b.y+780*dt);
   if(b.y>=346){set('impact');api.burst(bx,395,'#e5ae79',24);}
  }else if(b.state==='impact'){
   if(p.grounded&&Math.abs(dx)<96)api.damage();
   if(b.t>.16)set('recover');
  }else if(b.state==='recover'){
   if(b.t>1.32)set('idle');
  }else if(b.state==='hit'){
   if(b.t>.58)set('idle');
  }else if(b.state==='defeat'){
   if(b.t>1.12){run.cleared=true;api.clear();}
   return;
  }
  if(b.state!=='threadUp')b.fired=false;
  b.x=clamp(b.x,arenaStart+18,length-b.w-29);
  const contact=bossContact(b,p,prevBottom);
  if(contact==='stomp'){
   b.hp--;b.shot=null;b.boundRush=false;b.contactGrace=.85;run.bind=0;
   p.y=Math.min(foot(p),b.y)-p.h;p.vy=-440;p.grounded=false;p.supportPlatform=null;
   api.burst(p.x+p.w/2,foot(p),'#f4ca8c',22);api.beep(670,.17);
   if(!b.hp){set('defeat');api.say('大蜘蛛を倒した！');}
   else {set('hit');if(b.hp===2){b.attack=2;api.say('大蜘蛛が糸で上へ！ 足元の影に注意');}}
   return;
  }
  if(b.shot){
   const s=b.shot;s.life-=dt;s.x+=s.vx*dt;
   if(s.life<=0||s.x<arenaStart-10||s.x>length)b.shot=null;
   else if(!b.contactGrace&&hitCircle(p,s.x,s.y,16)&&!api.safe()){
    run.bind=.64;b.boundRush=true;b.shot=null;b.dir=face;set('rushTell');
    api.say('糸に捕まった！ ほどけたらジャンプ！');api.beep(230,.17);
   }
  }
  if(contact==='body'&&!b.contactGrace)api.damage();
 }
 function oval(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,T);c.fill();}
 function box(c,x,y,w,h,r,fill){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
 function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 function poly(c,points,fill){c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function text(c,s,x,y,size,color){c.font='800 '+size+'px system-ui,sans-serif';c.textAlign='center';c.fillStyle=color;c.fillText(s,x,y);}
 function leaf(c,x,y,w,h,rot,color,vein){
  c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=color;c.beginPath();c.moveTo(-w/2,0);c.quadraticCurveTo(-w*.12,-h,w/2,-2);c.quadraticCurveTo(w*.15,h,-w/2,0);c.fill();
  if(vein)line(c,[[-w*.43,0],[w*.3,-1]],vein,1.5);c.restore();
 }
 function background(c,{W,H,camera,run}){
  const scene=run.scene,y=run.camY,t=run.time;
  const colors=[['#315849','#bad09d'],['#8eb28c','#e7e6b3'],['#a4cdd3','#f3e5af']][scene],g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
  if(scene<2){
   for(let i=-2;i<Math.ceil(W/110)+3;i++){
    const x=i*115-camera*.18%115,off=y*.21%150;
    box(c,x,-35,10+(i&1)*13,H+70,5,scene===0?'#315a485e':'#5679634c');
    for(let j=-1;j<5;j++)oval(c,x+29*((i+j)&1?1:-1),j*136-off,61,27,scene===0?'#64866047':'#779c6952');
   }
   if(scene===0){
    const x=W/2;
    c.fillStyle='#795743';c.beginPath();c.moveTo(x-123,-12);c.bezierCurveTo(x-111,170,x-148,357,x-139,495);
    c.lineTo(x+138,495);c.bezierCurveTo(x+118,340,x+137,135,x+122,-12);c.closePath();c.fill();
    box(c,x-101,-8,203,H+16,15,'#91694d');
    for(let i=0;i<9;i++){const px=x-107+i*27,off=(y*.63+i*54)%158;for(let j=-2;j<4;j++){const py=j*158-off;line(c,[[px,py],[px-8,py+36],[px+2,py+84]],i%2?'#af805850':'#654d3b83',4+i%3);}}
    for(let i=0;i<8;i++){const yy=i*78-(y*.76%78);oval(c,x+123*((i&1)?1:-1),yy,32,8,'#60834486');}
   }else{
    for(let i=-1;i<Math.ceil(W/200)+2;i++){const x=i*200-camera*.28%200;box(c,x+42,0,33,H,12,'#5b795544');oval(c,x+83,82+i%3*32,105,48,'#547d5268');oval(c,x+24,146+i%3*22,72,29,'#6c924f60');}
   }
  }else{
   oval(c,W*.77,104,44,44,'#fff0bc');
   for(let i=-2;i<Math.ceil(W/191)+4;i++){
    const x=i*191-camera*.2%191;
    oval(c,x+85,369,155,112,'#a2bea2');oval(c,x,424,133,91,'#739987');
    oval(c,x+45,177+(i&3)*28,63,12,'#fff6dcb0');
   }
  }
  for(let i=0;i<12;i++){
   const dir=scene===2?horizontal(t):0,drift=scene===2?windDrift(t)*8:t*5,x=((i*119+drift)%(W+40)+W+40)%(W+40)-20;
   leaf(c,x,30+(i*39+t*9)%430,7+i%5,5,.2+dir*.55+Math.sin(t+i)*.28,'#fff2bf5c');
  }
 }
 function branch(c,p,isGround){
  const x=p.x,y=p.y,w=p.w;
  if(p.kind==='leaf'){
   c.save();c.translate(x+w/2,y+8);
   box(c,-w/2,-8,w,13,7,'#7f9f4e');
   leaf(c,0,0,w,29,0,'#668a42','#c8d681');
   leaf(c,7,-4,w*.77,9,0,'#a4bc65');
   for(let i=-1;i<=1;i++)line(c,[[i*w/4,-1],[i*w/4+12,5]],'#b5ca726f',1);
   c.restore();return;
  }
  box(c,x,y,w,isGround?Math.min(38,p.h+13):20,7,p.kind==='root'?'#684b39':'#785e43');
  box(c,x,y,w,8,5,p.kind==='root'?'#ac8152':'#9bb460');box(c,x+3,y,w-6,3,3,'#c5cf7e');
  for(let k=x+21;k<x+w-10;k+=39)line(c,[[k,y+13],[k+11,y+15],[k+18,y+12]],'#b28c5b8c',2);
  if(isGround&&w>185)for(let k=x+29;k<x+w-10;k+=107){
   const s=Math.sin(k)*.18;leaf(c,k,y-9,25,11,-.85+s,'#6d8e46');leaf(c,k+11,y-7,18,8,.78+s,'#84a654');
  }
 }
 function drawWeb(c,x,y,r,color='#e9eee0a8'){
  for(let i=0;i<8;i++){const a=i*T/8;line(c,[[x,y],[x+Math.cos(a)*r,y+Math.sin(a)*r]],color,1);}
  for(const k of [.32,.58,.82,1]){
   c.strokeStyle=color;c.lineWidth=1;c.beginPath();for(let i=0;i<=8;i++){const a=i*T/8,px=x+r*k*Math.cos(a),py=y+r*k*Math.sin(a);if(i===0)c.moveTo(px,py);else c.quadraticCurveTo(x+(px-x)*.80,y+(py-y)*.80,px,py);}c.stroke();
  }
 }
 function drawWorld(c,{items,camera,W,H,run,starList,player,chestnut}){
  const t=run.time,scene=run.scene,view=(x,y,w=0)=>x+w>camera-125&&x<camera+W+125&&y>run.camY-120&&y<run.camY+H+140;
  if(scene===0){
   line(c,[[91,388],[120,336],[151,314],[170,261]],'#6b4c38',24);
   line(c,[[268,390],[245,312],[267,254]],'#76543b',22);
   for(let i=0;i<12;i++){const y=326-i*174;line(c,[[73,y+15],[49,y],[31,y-20]],'#82974c7f',3);leaf(c,31,y-20,38,19,.33,'#70904b');}
   box(c,320,-1776,32,160,12,'#6f7546');box(c,326,-1760,26,133,12,'#3b5743');
  }
  for(const q of terrain)if(sceneAt(q.x)===scene&&view(q.x,q.y,q.w))branch(c,q,true);
  for(const q of items)if(sceneAt(q.baseX)===scene&&view(q.x,q.y,q.w))branch(c,q,false);
  for(const s of signs)if(s.scene===scene&&view(s.x,s.y)){
   const size=s.text.length*12+18;box(c,s.x-size/2,s.y-57,size,31,8,'#f4ebc6');line(c,[[s.x,s.y-25],[s.x,s.y]],'#96724c',4);text(c,s.text,s.x,s.y-36,12,'#4d6b46');
  }
  if(scene===1){
   for(const v of vents){
    if(!view(v.x,260,v.w))continue;const power=airPhase(t,v.phase);if(!power)continue;
    const strong=power===1;
    c.fillStyle=strong?'#e2f3de60':'#f9ecc34f';c.fillRect(v.x,65,v.w,390);
    for(let j=0;j<11;j++){const x=v.x+12+j*(v.w-24)/10,y=71+(j*47+t*(strong?230:105))%350;line(c,[[x,y-28],[x,y+4],[x+4,y+13]],strong?'#edf8e2bb':'#fff1b096',strong?2:1);leaf(c,x+3,y+15,11,5,1.26,'#d2e6a9');}
    text(c,strong?'↓ 下降気流':'↓ 風が来る',v.x+v.w/2,224,14,strong?'#385c49':'#6d6639');
   }
  }
  if(scene===2){
   const dir=horizontal(t);
   for(const g of gusts)if(view(g.left,215,g.right-g.left)&&dir){
    for(let i=0;i<15;i++){
     const span=g.right-g.left,x=g.left+((i*71+windDrift(t)*123)%span+span)%span,y=176+i*11;
     line(c,[[x-13*dir,y],[x+14*dir,y-2]],'#f5fff1a4',1.8);leaf(c,x+19*dir,y-2,14,6,dir*.32,'#dce39b','#869e57');
    }
   }
   for(const w of webs)if(view(w.x,w.y))drawWeb(c,w.x,w.y,29);
   if(player.x>arenaStart-90){
    for(const [x,y,r] of [[11062,121,61],[11360,111,54],[11690,92,72],[11905,244,65]])if(view(x,y))drawWeb(c,x,y,r,'#edf0dca6');
    box(c,11031,115,929,22,9,'#645140');box(c,11039,112,915,7,4,'#8a7f59');
    if(run.boss&&!run.cleared)line(c,[[arenaStart-14,151],[arenaStart-4,392],[arenaStart+7,163]],'#f1ece5aa',2);
   }
  }
  const clue=secrets[scene],s=starList.find(s=>s.label===clue.label);
  if(s?.hidden&&view(clue.x,clue.y)){
   const q=items.find(q=>clue.x>=q.baseX&&clue.x<=q.baseX+q.w&&q.baseY===clue.y);
   const dx=q?q.x-q.baseX:0,dy=q?q.y-q.baseY:0;
   oval(c,clue.x+dx,clue.y+dy-2,21,9,'#eed27462');
   leaf(c,clue.x+dx,clue.y+dy-4,29,11,-.12,'#ebcc64','#956831');
   oval(c,clue.x+dx,clue.y+dy-11+Math.sin(t*3)*2,2.4,2.4,'#fff1bf');
  }
  if(scene===0){
   for(const d of run.drops){
    if(!view(d.x,d.y)||d.state==='rest')continue;
    const shake=d.state==='warning'?Math.sin(t*43)*5:0;
    line(c,[[d.x-30,d.y-17],[d.x+shake,d.y-12]],'#8b9653',4);chestnut(d.x+shake,d.y,shake*.06,.70);
    if(d.state==='warning'){oval(c,d.x,d.ground-1,17,4,'#e3a55385');text(c,'!',d.x,d.y-27,16,'#f6dc9f');}
   }
  }
  for(const n of run.falling)if(view(n.x,n.y)){
   if(n.kind==='chestnut')chestnut(n.x,n.y,n.spin,.82);
   else{oval(c,n.x,n.y,9,11,'#a35d39');oval(c,n.x,n.y-6,10,5,'#6f4c38');oval(c,n.x-3,n.y+1,2,4,'#dcab69');}
  }
 }
 function spider(c,{x,y,w,h,dir,step,state='',t=0,hp=4}){
  const scale=w>60?BOSS_SCALE:.72;
  c.save();c.translate(x+w/2,y+h-4);c.scale(dir*scale,scale);
  const defeated=state==='defeat',lift=spiderLift(state);
  if(defeated){c.rotate(Math.min(.4,t*.46));c.scale(1,Math.max(.28,1-t*.67));c.globalAlpha=Math.max(.05,1-t*.83);}
  const body='#3c2f44',highlight='#6d485b',joint='#6f4a5a';
  for(const far of [true,false]){
   if(!far){
    oval(c,-12,-19+lift,21,16,body);oval(c,-15,-24+lift,14,9,highlight);
    poly(c,[[-23,-27+lift],[-15,-31+lift],[-6,-27+lift],[-13,-22+lift]],hp>2?'#b27870':'#ca6754');
   }
   for(let i=0;i<4;i++){
    const rootX=-16+i*10,sw=Math.sin(step+i*Math.PI+Number(far)*Math.PI)*5,flex=['walk','rush',''].includes(state)?sw:0;
    const spread=[-32,-16,3,21][i],raised=state==='threadUp'||state==='above'||state==='slam';
    const points=[[rootX,-19+lift],[rootX+spread*.40+flex,-32+lift+Number(far)*5],[rootX+spread*.72+flex*.85,-14+lift],[rootX+spread+flex,raised?-10-Math.abs(sw)*.32:1-Math.max(0,flex)*.66]];
    line(c,points,far?'#483747':body,far?3.2:4.3);
    line(c,[points[0],points[1]],far?'#634555':joint,far?1.3:2);
   }
  }
  oval(c,11,-17+lift,14,12,'#564052');oval(c,16,-22+lift,9,5,'#785366');
  for(const d of [-1,1]){oval(c,17+d*5,-19+lift,3.1,3.5,'#f4c874');oval(c,18+d*5,-19+lift,1.3,2.4,'#352237');}
  for(const d of [-1,1])poly(c,[[17+d*4,-12+lift],[21+d*4,-12+lift],[19+d*4,-6+lift]],'#f3dfc2');
  if(state==='recover'||state==='hit'){for(let i=0;i<3;i++){const xx=8+(i-1)*9,yy=-42+Math.sin(t*9+i)*2;line(c,[[xx-2,yy],[xx+2,yy]],'#f7d780',1.7);line(c,[[xx,yy-2],[xx,yy+2]],'#f7d780',1.7);}}
  c.restore();
 }
 function drawEnemy(c,e){
  if(e.kind==='spider'){spider(c,{...e,dir:Math.sign(e.v)||1,step:e.time*9});return;}
  c.save();c.translate(e.x+e.w/2,e.y+e.h);c.scale(e.v<0?-1:1,1);const t=e.time;
  if(e.kind==='caterpillar'){
   for(let i=0;i<4;i++){const x=-15+i*8,y=-9-i%2*1+Math.sin(t*8-i*.86)*2;oval(c,x+1,y+6+Math.max(0,Math.sin(t*10-i))*-3,3.5,2.5,'#536d39');oval(c,x,y,6.8,6.5,'#8cae55');oval(c,x-1,y-2,4,2,'#b8ca70');}
   oval(c,12,-11,8,8,'#a7be61');line(c,[[12,-17],[10,-22],[7,-23]],'#657b48',1.8);line(c,[[15,-17],[17,-22]],'#657b48',1.7);oval(c,15,-12,1.6,2.1,'#2e4735');
  }else if(e.kind==='bird'){
   const y=Math.sin(t*17)*10;oval(c,0,-12,13,8,'#65939a');leaf(c,-11,-10,19,9,.48,'#496d80');poly(c,[[-1,-10],[-17,-19+y],[0,-23+y],[8,-13]],'#8fb6b5');
   oval(c,10,-15,8,7,'#77a9ac');oval(c,13,-16,1.5,1.9,'#243e47');poly(c,[[16,-16],[23,-13],[16,-12]],'#e4b46a');
  }else{
   const step=e.v?Math.sin(t*13)*3:0;
   oval(c,-12,-19,10,15,'#ab734b');oval(c,-15,-24,6,9,'#c78a59');oval(c,-6+step,-1,6,3,'#7c5038');oval(c,8-step,-1,6,3,'#7c5038');
   oval(c,0,-12,13,12,'#b67e53');oval(c,7,-12,7,9,'#efd4a8');oval(c,11,-23,10,9,'#c88d5f');oval(c,6,-30,5,7,'#ad713e');oval(c,14,-25,1.8,2,'#343a31');oval(c,21,-21,3,2,'#5f4436');
   if(e.kind==='dropper'){box(c,-29,-2,57,6,3,'#826a4c');oval(c,12,-7,5,6,'#956240');if(e.warning>0){text(c,'!',10,-42,14,'#f6cd79');}}
  }
  c.restore();
 }
 function drawBoss(c,run){
  const b=run.boss;if(!b||run.cleared)return;
  const bx=b.x+b.w/2,up=['threadUp','above','slam'].includes(b.state);
  if(up){
   const end=b.state==='threadUp'&&b.t<.18?b.y+(b.ceiling-b.y)*(b.t/.18):124;
   line(c,[[b.anchor,end],[bx-b.dir*29,b.y+27]],'#f5eddbc9',2.2);
   if(b.state!=='threadUp'){
    oval(c,b.mark,396,43+Math.sin(b.t*20)*4,7,'#8c5b5380');line(c,[[b.mark,200],[b.mark,381]],'#efd3a862',1.5);
    text(c,'↓',b.mark,374,29,'#b87d58');
   }
  }
  if(b.state==='rushTell'){
   const front=bx+b.dir*55;line(c,[[front,382],[front+b.dir*32,382]],'#eeb07c',3);poly(c,[[front+b.dir*40,382],[front+b.dir*28,376],[front+b.dir*28,388]],'#eeb07c');
  }
  if(b.state==='webTell')drawWeb(c,bx+b.dir*24,b.y+20,11+b.t*21,'#f8ecd7dc');
  if(b.state==='rush')for(let i=0;i<3;i++)line(c,[[bx-b.dir*(42+i*6),366+i*9],[bx-b.dir*(75+i*5),366+i*9]],'#eddbb296',2);
  if(b.state==='impact')oval(c,bx,397,70+b.t*150,4,'#ecd496af');
  spider(c,b);
  if(b.shot){const s=b.shot;oval(c,s.x,s.y,15,15,'#e0e9d8aa');drawWeb(c,s.x,s.y,16,'#fff9e7');}
 }
 function drawBindings(c,run,p){if(run.bind>0){for(let i=0;i<4;i++)line(c,[[p.x-5,p.y+19+i*9],[p.x+44,p.y+29+i*6]],'#f1ecdce6',2);}}
 window.ShikabouCanopy={length,goal,shaft,arenaStart,regions,sceneAt,practiceAreas,terrain,platforms,obstacles,starSites,acorns,checkpoints,
  createRun,createEnemies,updateEnemy,updatePlatforms,cameraY,wind,horizontal,exit,hazards,revealStar,bossCheckpoint,resetBoss,bossStep,background,drawWorld,drawEnemy,drawBoss,drawBindings};
})();
