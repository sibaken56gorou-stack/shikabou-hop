'use strict';
// The second course uses the same character and controls, with its own terrain and species.
(() => {
 const length=12660,goal=length-240;
 const terrain=[[0,930,400],[1290,900,400],[2520,1480,400],[4000,800,400],[4920,610,400],[5530,350,365],[6030,690,390],[6840,620,350],[7600,400,400],[8000,650,400],[9230,800,390],[10600,900,370],[12010,650,400]].map(([x,w,y])=>({x,w,y,h:560-y}));
 const obstacles=[[4390,355,70],[5150,346,76],[6250,335,76],[7040,300,70]].map(([x,y,w])=>({x,y,w,h:(terrain.find(t=>x>=t.x&&x<t.x+t.w)?.y||400)-y,kind:'cave-rock'}));
 const platforms=[[910,390,160,'float'],[1145,390,155,'float'],[2160,390,150,'float'],[2370,380,170,'float'],[2560,320,130,'bank'],[2710,264,130,'bank'],[4640,310,130,'cave-rock'],[6050,315,140,'cave-rock'],[6230,255,150,'cave-rock'],[8620,390,150,'float'],[8840,370,180,'float'],[9060,380,180,'float'],[10000,380,140,'float'],[10220,355,175,'float'],[10440,370,175,'float'],[10660,285,145,'bank'],[10850,225,130,'bank'],[11460,360,150,'float'],[11660,380,150,'float'],[11880,390,150,'float']].map(([x,y,w,kind])=>({x,y,w,h:18,baseY:y,kind,hold:0,sink:0,away:0,state:'idle',time:0,collidable:true,shakeX:0,angle:0}));
 const regions=[{x:0,label:'01 · せせらぎの水辺',scene:0,audio:12000},{x:4000,label:'02 · 水音の洞窟',scene:1,audio:16000,hint:'水音の洞窟へ！ 高いところにはコウモリ'},{x:8000,label:'03 · 夕映えの水辺',scene:2,audio:20000,hint:'外へ出た！ 水しぶきのあとには半魚人'}];
 const practiceAreas=[{key:0,name:'せせらぎの水辺',start:85,left:0,right:4000,finish:3880,hint:'沈む丸太と大きく跳ねるアメンボ'},{key:4000,name:'水音の洞窟',start:4085,left:4000,right:8000,finish:7880,hint:'素早いネズミと高く飛ぶコウモリ'},{key:8000,name:'夕映えの水辺',start:8085,left:8000,right:length,finish:goal,hint:'水から飛び出す半魚人を見極めよう'}];
 const sceneAt=x=>x<4000?0:x<8000?1:2;
 function createEnemies(){
  return [[700,570,850,'strider'],[1560,1450,1750,'strider'],[3020,2890,3200,'strider'],[3520,3400,3680,'strider'],[4580,4480,4720,'rat'],[5100,4970,5300,'bat'],[5630,5580,5780,'rat'],[5950,5820,6120,'bat'],[6510,6410,6680,'bat'],[6910,6870,7000,'rat'],[7440,7300,7670,'bat'],[7680,7620,7710,'rat'],[8788,8788,8788,'fish'],[9023,9023,9023,'fish'],[10163,10163,10163,'fish'],[10400.5,10400.5,10400.5,'fish'],[11618,11618,11618,'fish'],[11828,11828,11828,'fish'],[9550,9430,9820,'fish'],[11090,11010,11310,'fish']].map(([x,min,max,kind],i)=>{
   const land=kind==='fish'&&max>min,floor=terrain.find(t=>x>=t.x&&x<t.x+t.w)?.y||400,h=kind==='fish'?(land?50:48):kind==='rat'?27:26,baseY=kind==='bat'?284:floor-h;
   return{x,y:kind==='fish'&&!land?465:baseY,baseY,w:kind==='fish'?34:38,h,min,max,kind,land,v:(i%2?1:-1)*(kind==='rat'?86:kind==='bat'?68:kind==='fish'?54:48),vy:0,phase:i*.73,hopWait:.55+i%3*.3,state:land?'walking':'hidden',wait:0,alive:true,collidable:kind!=='fish'||land};
  });
 }
 function updateEnemy(e,dt,player){
  e.phase+=dt;
  if(e.kind==='fish'&&!e.land){
   if(e.state==='hidden'){e.collidable=false;e.y=465;if(Math.abs(player.x+player.w/2-e.x-e.w/2)<235){e.wait-=dt;if(e.wait<=0){e.state='warning';e.wait=.32;}}}
   else if(e.state==='warning'){e.collidable=false;e.wait-=dt;if(e.wait<=0){e.state='leaping';e.y=430;e.vy=-510;e.collidable=true;}}
   else{e.vy+=1000*dt;e.y+=e.vy*dt;e.collidable=e.y<432;if(e.y>455){e.state='hidden';e.wait=1.15;e.collidable=false;}}
   return;
  }
  if(e.kind==='fish'&&e.land){e.collidable=true;e.y=e.baseY;}
  if(e.kind==='bat')e.y=e.baseY+Math.sin(e.phase*2.4)*24;
  if(e.kind==='strider'){e.hopWait-=dt;if(e.y>=e.baseY&&e.hopWait<=0){e.vy=-420;e.hopWait=1.9;}e.vy+=900*dt;e.y=Math.min(e.baseY,e.y+e.vy*dt);if(e.y>=e.baseY)e.vy=0;}
  e.x+=e.v*dt;if(e.x<e.min){e.x=e.min;e.v=Math.abs(e.v);}if(e.x>e.max){e.x=e.max;e.v=-Math.abs(e.v);}
 }
 // A log warns before it drops, stays submerged, then visibly returns on its own.
 function updatePlatforms(items,dt,player){
  for(const p of items){if(p.kind!=='float')continue;
   const on=player.grounded&&player.supportPlatform===p&&p.collidable!==false,oldY=p.y;p.time+=dt;p.shakeX=0;p.angle=0;
   if(p.state==='idle'){
    p.hold=on?p.hold+dt:Math.max(0,p.hold-dt*2);p.sink=0;p.collidable=true;
    if(p.hold>=.9){p.state='shaking';p.time=0;}
   }else if(p.state==='shaking'){
    p.shakeX=Math.sin(p.time*66)*2.8;p.angle=Math.sin(p.time*53)*.025;p.sink=Math.sin(p.time*49)*.65;
    if(p.time>=.5){p.state='falling';p.time=0;p.sink=0;}
   }else if(p.state==='falling'){
    p.sink=130*Math.min(1,p.time/.65)**2;p.angle=Math.sin(p.time*8)*.055;
    if(p.time>=.65){p.state='submerged';p.time=0;p.sink=130;p.collidable=false;}
   }else if(p.state==='submerged'){
    p.sink=130;p.collidable=false;if(p.time>=1.45){p.state='returning';p.time=0;}
   }else if(p.state==='returning'){
    p.sink=130*(1-Math.min(1,p.time/.6))**2;p.collidable=false;
    if(p.time>=.6){p.state='idle';p.time=0;p.hold=0;p.sink=0;p.collidable=true;}
   }
   p.y=p.baseY+p.sink;
   if(on&&p.collidable!==false)player.y+=p.y-oldY;
   else if(on){player.supportPlatform=null;player.grounded=false;}
  }
 }
 function resetPlatforms(items){for(const p of items){p.y=p.baseY;p.sink=0;p.hold=0;p.away=0;p.state='idle';p.time=0;p.collidable=true;p.shakeX=0;p.angle=0;}}
 function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function box(c,x,y,w,h,color,r=4){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
 function repeat(camera,ratio,step,W,fn){const off=camera*ratio;for(let i=Math.floor(off/step)-1;i<Math.ceil((off+W)/step)+1;i++)fn(i*step-off,i);}
 function background(c,{W,H,camera,clock,scene}){
  const cave=scene===1,late=scene===2,g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,cave?'#182d40':late?'#e6c9ad':'#b9dde0');g.addColorStop(1,cave?'#36565a':late?'#d5e5cb':'#edf1d6');c.fillStyle=g;c.fillRect(0,0,W,H);
  if(cave){
   repeat(camera,.14,210,W,(x,i)=>{poly(c,[[x-90,480],[x-62,169],[x+5,73],[x+65,158],[x+92,480]],i%2?'#284455':'#223d4d');oval(c,x+24,188,45,90,'#33515b');});
   repeat(camera,.38,230,W,(x,i)=>{poly(c,[[x-80,0],[x-33,66],[x-12,141+i%3*18],[x+9,51],[x+43,87],[x+77,0]],'#152c3d');box(c,x+14,0,15,94,'#1c3446',2);});
   repeat(camera,.55,330,W,(x,i)=>{box(c,x-22,344,42,100,'#304f59',15);oval(c,x+16,365,20,54,'#355a61');for(let k=0;k<3;k++){box(c,x+k*12-10,321-k*7,8,27,'#7ab4b5',3);oval(c,x+k*12-6,322-k*7,3,3,'#c1e3d4');}});
   repeat(camera,.28,370,W,(x,i)=>{const y=100+((clock*85+i*74)%310);oval(c,x+50,y,1.5,4,'#a9dcd981');oval(c,x+50,418,12+Math.sin(clock*2+i)*3,2,'#a9dcd935');});
  }else{
   oval(c,W-75,85,33,33,late?'#ffe3a3':'#fff1bb');
   repeat(camera,.12,410,W,(x,i)=>{oval(c,x+40,410,300,180,late?'#b7c9a5':'#aecbb4');oval(c,x+195,435,240,142,late?'#a6bba0':'#91b8a6');oval(c,x+55,82+(i%3)*22,43,13,'#fff9e8bb');oval(c,x+33,76+(i%3)*22,23,18,'#fff9e8bb');});
   box(c,0,315,W,165,late?'#73b1b0':'#74b5bc',0);
   repeat(camera,.27,170,W,(x,i)=>{c.strokeStyle=late?'#e8e1bc68':'#d2f0d878';c.lineWidth=2;c.beginPath();c.moveTo(x,343+i%3*19);c.quadraticCurveTo(x+25,339+i%3*19,x+57,343+i%3*19);c.stroke();});
   repeat(camera,.5,310,W,(x,i)=>{c.strokeStyle='#668e74';c.lineWidth=3;for(let k=0;k<5;k++){const px=x+k*10,y=404;c.beginPath();c.moveTo(px,y);c.quadraticCurveTo(px+8,y-30,px+5+Math.sin(clock+i)*3,y-57-k%3*9);c.stroke();oval(c,px+5,y-58-k%3*9,3,8,'#997e54');}});
  }
 }
 function water(c,{W,camera,clock,scene}){
  const left=scene*4000,right=scene===2?length:left+4000;for(const [a,b] of [[0,4000],[8000,length]]){if(scene===1||right<=a||left>=b)continue;const x=Math.max(a,camera),end=Math.min(b,camera+W);if(end<=x)continue;box(c,x,431,end-x,55,scene===2?'#5caaaac4':'#61a9bac4',0);c.strokeStyle='#d4efe2b0';c.lineWidth=2;for(let px=Math.floor(x/48)*48;px<end;px+=48){c.beginPath();c.moveTo(px,433+Math.sin(clock*3+px)*2);c.quadraticCurveTo(px+11,429,px+25,433);c.stroke();}}}
 function drawTerrain(c,{terrain,obstacles,platforms,W,camera,clock,scene}){
  const cave=scene===1,start=scene*4000,end=scene===2?length:start+4000;
  for(const t of [...terrain,...obstacles]){if(t.x+t.w<=start||t.x>=end||t.x>camera+W+80||t.x+t.w<camera-80)continue;
   box(c,t.x,t.y,t.w,t.h,cave?'#567174':'#a79a71',5);c.save();c.beginPath();c.rect(t.x,t.y,t.w,t.h);c.clip();c.strokeStyle=cave?'#3d595f':'#928764';c.lineWidth=2;
   for(let x=Math.floor(Math.max(camera,t.x)/80)*80;x<Math.min(camera+W+80,t.x+t.w);x+=80){c.beginPath();c.moveTo(x,t.y+18);c.lineTo(x-12,t.y+47);c.lineTo(x+22,t.y+68);c.stroke();}
   box(c,t.x,t.y,t.w,12,cave?'#8aa1a0':'#668f6f',3);box(c,t.x,t.y,t.w,4,cave?'#b0c5b9':'#afc398',2);c.restore();
  }
  for(const p of platforms){if(p.x<start||p.x>=end||p.x>camera+W+80||p.x+p.w<camera-80)continue;
   if(p.kind==='float')drawLog(c,p);
   else{box(c,p.x,p.y,p.w,p.h+7,cave?'#657d80':'#8ba38a',7);box(c,p.x,p.y,p.w,5,cave?'#a9c7bb':'#bdd0a4',4);}
  }
 }

 function drawLog(c,p){
  if(p.state==='submerged')return;
  oval(c,p.x+p.w/2,p.baseY+19,p.w*.55,4,'#c2ece14d');
  c.save();if(p.state==='falling')c.globalAlpha=Math.max(.08,1-Math.max(0,p.sink-45)/100);else if(p.state==='returning')c.globalAlpha=Math.min(1,.25+p.time/.6*.75);
  c.translate(p.x+p.w/2+(p.shakeX||0),p.y+8);c.rotate(p.angle||0);const x=-p.w/2;
  box(c,x,-8,p.w,17,p.state==='shaking'?'#bd9154':'#ad8759',9);box(c,x+6,-6,p.w-12,4,'#d7b57d',3);oval(c,x+9,0,6,6,'#e1c794');oval(c,x+9,0,2,3,'#9c7a53');
  c.strokeStyle='#7b6648';c.lineWidth=2;for(let px=x+30;px<p.w/2-8;px+=34){c.beginPath();c.moveTo(px,2);c.lineTo(px+17,2);c.stroke();}
  if(p.state==='shaking'){c.strokeStyle='#f6d987';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(side*(p.w/2+4),-10);c.lineTo(side*(p.w/2+9),-16);c.moveTo(side*(p.w/2+8),-4);c.lineTo(side*(p.w/2+15),-5);c.stroke();}}
  c.restore();
  if(p.state==='falling'||p.state==='returning'){oval(c,p.x+p.w/2,432,p.w*.45+Math.sin(p.time*12)*4,4,'#e3f2d998');for(let i=0;i<3;i++)oval(c,p.x+p.w*(i+1)/4,423-Math.sin(p.time*9+i)*6,2,3,'#e3f2d9');}
 }
 function portals(c,{W,camera,scene}){
  const right=scene===0?4000:scene===1?8000:null;
  if(right!==null&&right>camera-180&&right<camera+W+200){
   const cave=scene===1;c.fillStyle=cave?'#304a51':'#6d8681';c.fillRect(right-110,0,Math.max(220,camera+W-right+110),480);
   poly(c,[[right-150,400],[right-140,155],[right-112,75],[right-53,18],[right+30,0],[right+220,0],[right+220,480],[right-150,480]],cave?'#405c60':'#8fa29a');
   c.fillStyle=cave?'#f4edbf':'#162b3b';c.beginPath();c.moveTo(right-78,400);c.lineTo(right-78,289);c.bezierCurveTo(right-78,205,right+21,205,right+21,289);c.lineTo(right+21,400);c.closePath();c.fill();
   c.strokeStyle=cave?'#29464f':'#6b827e';c.lineWidth=3;for(let k=0;k<4;k++){const x=right+68+k*112;c.beginPath();c.moveTo(x,40+k%2*35);c.lineTo(x-19,136);c.lineTo(x+9,187);c.lineTo(x-8,268+k%2*55);c.moveTo(x-19,136);c.lineTo(x+45,119);c.stroke();}
   c.strokeStyle=cave?'#9fc4b2':'#c0c8ac';c.lineWidth=13;c.beginPath();c.moveTo(right-90,399);c.lineTo(right-90,285);c.bezierCurveTo(right-90,190,right+34,190,right+34,285);c.lineTo(right+34,399);c.stroke();
   if(!cave){for(let i=0;i<4;i++)oval(c,right-97+i*24,217-i%2*22,21,12,'#6e9374');poly(c,[[right-66,270],[right-58,301],[right-49,271]],'#264556');}
   else{box(c,right-67,358,74,43,'#78b8af',1);c.strokeStyle='#e7f4cd';c.beginPath();c.moveTo(right-66,365);c.lineTo(right+4,365);c.stroke();}
   box(c,right-198,315,96,40,'#f6ebc9',8);box(c,right-155,355,6,45,'#957853',2);c.fillStyle='#46655f';c.textAlign='center';c.font='800 12px system-ui,sans-serif';c.fillText(cave?'出口 →':'洞窟入口 →',right-150,340);
  }
  const left=scene*4000;if(scene>0&&left>camera-200&&left<camera+W){
   box(c,left-60,0,100,400,scene===1?'#304c56':'#7f9990',12);box(c,left-38,242,59,158,scene===1?'#b7d4bb':'#243e4c',28);
   if(scene===1)poly(c,[[left+21,252],[left+21,398],[left+165,398]],'#c9e3bb16');
  }
 }
 function drawEnemy(c,e,clock){
  const x=e.x+e.w/2,y=e.y;
  if(e.kind==='fish'&&!e.land&&e.state!=='leaping'){
   if(e.state==='warning'){oval(c,x,431,26+Math.sin(clock*16)*4,4,'#d5f2ce9c');for(let i=0;i<3;i++)oval(c,x-12+i*12,425-(clock*30+i*6)%16,2,3,'#ddf4d9');c.fillStyle='#f3d18b';c.font='900 17px system-ui';c.textAlign='center';c.fillText('!',x,409);}return;
  }
  c.save();c.translate(x,y);if(e.kind==='rat'||e.kind==='fish'&&e.land)c.scale(e.v<0?-1:1,1);c.strokeStyle='#334f59';c.lineWidth=2;
  if(e.kind==='strider'){
   oval(c,0,27+Math.max(0,e.baseY-e.y),25,3,'#477e7325');for(const side of [-1,1])for(let i=0;i<3;i++){const angle=Math.sin(clock*12+i)*3;c.beginPath();c.moveTo(side*7,12);c.lineTo(side*(19+i*3),8+i*7+angle);c.lineTo(side*(33+i*2),16+i*6+angle);c.stroke();}
   oval(c,0,14,13,11,'#719b91');oval(c,0,3,10,8,'#a3bd9b');oval(c,-5,1,3,4,'#f7ecc9');oval(c,5,1,3,4,'#f7ecc9');oval(c,-4,1,1.6,2,'#304a50');oval(c,4,1,1.6,2,'#304a50');c.beginPath();c.moveTo(-5,-3);c.lineTo(-12,-12);c.moveTo(5,-3);c.lineTo(12,-12);c.stroke();
  }else if(e.kind==='rat'){
   const step=Math.abs(e.v)>.1?Math.sin(e.phase*14):0;
   c.strokeStyle='#bd9f91';c.lineWidth=3;c.beginPath();c.moveTo(-17,18);c.bezierCurveTo(-36,3,-41,26,-32,28);c.stroke();oval(c,-8+step*3.2,26-Math.max(0,step)*1.4,8,3,'#5a5960');oval(c,13-step*3.2,26-Math.max(0,-step)*1.4,8,3,'#5a5960');oval(c,-2,15,21,13,'#a4a1aa');oval(c,13,12,13,11,'#b7afb3');oval(c,7,0,8,9,'#aea6b0');oval(c,7,0,4,5,'#dabbb7');oval(c,18,9,2.5,3,'#293f4a');oval(c,27,14,3,2,'#d9b2a0');
  }else if(e.kind==='bat'){
   const flap=Math.sin(clock*15+e.phase)*15;for(const side of [-1,1])poly(c,[[side*6,12],[side*31,-9+flap],[side*39,16+flap*.4],[side*25,13],[side*19,25],[side*10,19]],'#8796b4');poly(c,[[-10,5],[-8,-9],[0,0],[8,-9],[10,5]],'#a3adc7');oval(c,0,13,12,13,'#8a95b0');oval(c,-5,9,3,3,'#ece6c2');oval(c,5,9,3,3,'#ece6c2');oval(c,-4,9,1.3,2,'#263e4f');oval(c,4,9,1.3,2,'#263e4f');
  }else{
   poly(c,[[-12,21],[-26,7],[-20,31],[-12,35]],'#4d948f');oval(c,0,29,15,20,'#76b8a0');oval(c,0,10,16,15,'#85c4aa');poly(c,[[-7,-1],[0,-13],[8,-1]],'#438e8a');oval(c,-7,8,4,5,'#f1eac7');oval(c,7,8,4,5,'#f1eac7');oval(c,-6,8,2,3,'#304c55');oval(c,6,8,2,3,'#304c55');oval(c,0,20,7,3,'#558e7b');c.strokeStyle='#558e7b';c.lineWidth=6;c.beginPath();c.moveTo(-12,26);c.lineTo(-23,16);c.moveTo(12,26);c.lineTo(23,16);const stride=e.land?Math.sin(clock*11)*5:0;c.moveTo(-6,42);c.lineTo(-10+stride,50);c.moveTo(6,42);c.lineTo(10-stride,50);c.stroke();
  }
  c.restore();
 }
 window.ShikabouWatercourse={length,goal,terrain,obstacles,platforms,regions,practiceAreas,sceneAt,createEnemies,updateEnemy,updatePlatforms,resetPlatforms,background,water,drawTerrain,portals,drawEnemy,starSites:[{x:2770,y:205,label:'せせらぎの星',area:'水辺'},{x:6310,y:200,label:'洞窟の星',area:'洞窟'},{x:10915,y:175,label:'夕映えの星',area:'夕映えの水辺'}],acornSpots:[1820,3370,5350,7200,9730,12230],checkpoints:[{x:2000,label:'水辺の中間地点'},{x:6100,label:'洞窟の中間地点'},{x:9620,label:'夕映えの中間地点'}]};
})();
