'use strict';
(() => {
 const $=id=>document.getElementById(id),journey=window.ShikabouJourney,courses=journey.courses;
 const preview=new URLSearchParams(location.search).get('preview')==='1';
 const state=preview?{schema:1,cleared:['1-1'],position:'1-1',records:{'1-1':{stars:0,rank:'C'}}}:journey.snapshot();
 let current=courses.findIndex(c=>c.id===state.position),position={x:courses[current].x,y:courses[current].y},moving=false,facing=1,walkMs=0,selected=null;
 const buttons=[],dialog=$('courseDialog'),avatar=$('mapAvatar'),canvas=$('avatarArt'),ctx=canvas.getContext('2d');
 let musicWanted=true,musicActivated=false,mapAudio=null,mapMusic=null;
 try{musicWanted=window.localStorage?.getItem('shikabou.mapSound')!=='off';}catch{}
 function updateMusicButton(){
  const playing=musicWanted&&mapMusic?.running&&mapAudio?.state==='running';
  $('mapMusic').textContent=musicWanted?'♪ 音楽：オン':'♪ 音楽：オフ';
  $('mapMusic').setAttribute('aria-pressed',String(musicWanted));
  $('mapMusic').title=musicWanted?(playing?'タップで音楽をオフ':'音楽はオンです。再生待ちの場合は画面をタップすると流れます。タップで音楽をオフ。'):'タップで音楽をオン';
 }
 async function startMapMusic(){
  if(!musicWanted||document.hidden)return;musicActivated=true;
  try{
   if(!mapAudio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;mapAudio=new Audio();mapMusic=ShikabouSoundscape.create(mapAudio);mapAudio.addEventListener('statechange',updateMusicButton);}
   if(mapAudio.state!=='running')await mapAudio.resume();
   if(musicWanted&&!document.hidden&&mapAudio.state==='running'&&!mapMusic.running)mapMusic.start(24000);
  }catch{/* A later tap can retry when browser audio is unavailable. */}
  updateMusicButton();
 }
 function stopMapMusic(){mapMusic?.stop();if(mapAudio?.state==='running')mapAudio.suspend().catch(()=>{});updateMusicButton();}
 $('mapMusic').addEventListener('click',()=>{
  musicWanted=!musicWanted;if(musicWanted)startMapMusic();else stopMapMusic();
  try{window.localStorage?.setItem('shikabou.mapSound',musicWanted?'on':'off');}catch{}
  updateMusicButton();
 });
 function unlockMapMusic(event){if(!event.target?.closest?.('#mapMusic'))startMapMusic();}
 document.addEventListener('pointerdown',unlockMapMusic,{capture:true,passive:true});
 document.addEventListener('keydown',event=>{if(!event.repeat&&(event.key==='Enter'||event.key===' '))unlockMapMusic(event);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMapMusic();else if(musicActivated)startMapMusic();});
 window.addEventListener('pagehide',stopMapMusic);
 window.addEventListener('pageshow',()=>{if(musicActivated)startMapMusic();});
 updateMusicButton();startMapMusic();
 const idle=new Image(),run=new Image(),openRun=new Image();
 const curves=[[[88,558],[88,489],[248,485],[248,414]],[[248,414],[248,345],[104,341],[104,272]],[[104,272],[104,197],[246,202],[246,124]]];
 function curvePoint(curve,t){const a=1-t;return{x:a*a*a*curve[0][0]+3*a*a*t*curve[1][0]+3*a*t*t*curve[2][0]+t*t*t*curve[3][0],y:a*a*a*curve[0][1]+3*a*a*t*curve[1][1]+3*a*t*t*curve[2][1]+t*t*t*curve[3][1]};}
 const roads=curves.map(curve=>{const points=Array.from({length:81},(_,i)=>curvePoint(curve,i/80));let length=0;for(let i=0;i<points.length;i++){if(i)length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);points[i].distance=length;}return{points,length};});
 function roadPoint(road,distance){const points=road.points;if(distance<=0)return points[0];if(distance>=road.length)return points[points.length-1];const i=points.findIndex(p=>p.distance>=distance),a=points[i-1],b=points[i],t=(distance-a.distance)/(b.distance-a.distance);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
 function runFrame(ms){const durations=[100,100,90,110,100,100,90,110];let t=ms%800;for(let i=0;i<8;i++){if(t<durations[i])return i;t-=durations[i];}return 7;}
 function drawAvatar(){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,180,220);ctx.save();ctx.translate(90,207);ctx.scale(facing*1.65,1.65);
  if(moving&&run.complete&&run.naturalWidth&&idle.complete&&idle.naturalWidth){
   const art=openRun.complete&&openRun.naturalWidth?openRun:run,frame=runFrame(walkMs),open=art===openRun,soles=open?[489,488,477,458,476,477,470,457]:[484,485,476,454,472,474,468,452],lift=[0,0,10,23,0,0,10,23],scale=92/452;
   ctx.drawImage(ShikabouPalette.art(art,idle),(frame%4)*art.naturalWidth/4,Math.floor(frame/4)*art.naturalHeight/2,art.naturalWidth/4,art.naturalHeight/2,-216*scale,-(soles[frame]+lift[frame])*scale,384*scale,512*scale);
  }else if(idle.complete&&idle.naturalWidth)ctx.drawImage(idle,-49,-104*(1169/1254),98,104);
  ctx.restore();avatar.style.left=`${position.x/360*100}%`;avatar.style.top=`${(position.y-10)/660*100}%`;
 }
 for(const [image,src]of [[idle,'assets/shikabou-sprite.png'],[run,'assets/shikabou-cycle-smile-idle-colors.png'],[openRun,'assets/shikabou-cycle-open-tip-v1.png']]){image.onload=drawAvatar;image.src=src;}
 function available(c){return journey.available(c.id,state);}
 function status(text){$('mapStatus').textContent=text;}
 function updateNodes(){
  courses.forEach((c,i)=>{const b=buttons[i],done=state.cleared.includes(c.id),locked=!available(c);b.classList.toggle('cleared',done);b.classList.toggle('locked',locked);b.setAttribute('aria-disabled',String(locked||moving));b.disabled=moving;
   if(i===current)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');
   const record=state.records[c.id],mark=done?`${'★'.repeat(record?.stars||0)}${'☆'.repeat(3-(record?.stars||0))}`:locked?`${courses[i-1].id}クリアで開く`:c.ready?'挑戦できる':'コース準備中';
   b.querySelector('.node-state').textContent=mark;b.querySelector('.node-lock').textContent=locked?'🔒':'';
   b.setAttribute('aria-label',`${c.id} ${c.name}。${done?'クリア済み。':''}${mark}${i===current?'。シカぼうはここにいます':''}`);
  });
  $('mapProgress').textContent=`${state.cleared.length} / ${courses.length} クリア`;['openRoad','roadTwo','roadThree'].forEach((id,i)=>{$(id).style.opacity=available(courses[i+1])?'1':'.18';});
 }
 function openCourse(index){
  selected=index;const c=courses[index];$('courseTag').textContent=`COURSE ${c.id}`;$('courseTitle').textContent=`${c.id}に挑戦しますか？`;
  $('courseDescription').textContent=c.ready?`${c.name}\n${c.id==='1-2'?'水辺から洞窟へ。沈む丸太と水しぶきに注意。':c.id==='1-3'?'根元から頂上へ。風を読み、大蜘蛛に挑もう。':'丘・森・高原をめぐる、3つの星の冒険。'}`:'ここから次の冒険へ。\nこのコースの内容は、これから作ります。';
  $('courseYes').textContent='はい';$('courseNo').textContent='いいえ';$('courseYes').hidden=false;dialog.showModal();$('courseYes').focus();
 }
 function arrive(index){
  current=index;position={x:courses[index].x,y:courses[index].y};state.position=courses[index].id;moving=false;if(!preview)journey.setPosition(state.position);drawAvatar();updateNodes();status(`${courses[index].id}に到着しました。`);openCourse(index);
 }
 function travel(index){
  if(moving||dialog.open)return;
  if(!available(courses[index])){status(`${courses[index-1].id}をクリアすると、${courses[index].id}への道が開きます。`);return;}
  if(index===current){openCourse(index);return;}
  const direction=index>current?1:-1,legs=[];for(let i=current;i!==index;i+=direction){const road=roads[direction===1?i:i-1];legs.push({road,reverse:direction===-1});}
  moving=true;updateNodes();status(`${courses[index].id}へ移動中…`);let leg=0,distance=0,last=0;
  function tick(now){
   const dt=last?Math.min((now-last)/1000,.05):0;last=now;distance+=dt*95;walkMs+=dt*1000;
   while(distance>=legs[leg].road.length){distance-=legs[leg].road.length;leg++;if(leg===legs.length){arrive(index);return;}}
   const route=legs[leg],next=roadPoint(route.road,route.reverse?route.road.length-distance:distance);if(Math.abs(next.x-position.x)>.01)facing=next.x>position.x?1:-1;position={x:next.x,y:next.y};drawAvatar();requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
 }
 courses.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='course-node';b.style.left=`${c.x/360*100}%`;b.style.top=`${c.y/660*100}%`;
  const label=document.createElement('span');label.textContent=c.id;b.appendChild(label);
  for(const className of ['node-lock','node-state']){const span=document.createElement('span');span.className=className;span.setAttribute('aria-hidden','true');b.appendChild(span);}
  b.addEventListener('click',()=>travel(i));$('mapNodes').appendChild(b);buttons.push(b);
 });
 $('courseNo').addEventListener('click',()=>dialog.close());
 $('courseYes').addEventListener('click',()=>{
  if(selected===null)return;const c=courses[selected];if(!available(c))return;
  if(c.ready){stopMapMusic();location.assign(`./?v=0.13.3&course=${c.id}&play=1${preview?'&preview=1':''}`);return;}
  $('courseTitle').textContent=`${c.id}は、ただいま準備中`;$('courseDescription').textContent='マップでの移動と確認はここまで。\n新しいコースができたら、ここから出発できます。';$('courseYes').hidden=true;$('courseNo').textContent='マップに戻る';$('courseNo').focus();
 });
 dialog.addEventListener('close',()=>{selected=null;buttons[current].focus();});
 if(preview){document.body.classList.add('preview');$('previewNotice').hidden=false;$('previewLink').hidden=true;$('realMapLink').hidden=false;status('1-2をタップして、走って移動する様子を試そう。');}
 else if(!journey.persistent)status('このブラウザでは記録を保存できません。クリア後の動きは「動作見本」で確認できます。');
 else{const next=courses.find(c=>available(c)&&!state.cleared.includes(c.id));status(!next?'島のコースをすべてクリアしました！':next.id==='1-1'?'まずは1-1へ。クリアすると、次の道が開きます。':`${next.id}への道が開きました。${next.ready?'行きたい地点をタップしよう。':'次のコースは準備中です。'}`);}
 window.addEventListener('shikabou:save-loaded',()=>{
  if(preview)return;
  Object.assign(state,journey.snapshot());
  if(!moving){current=courses.findIndex(c=>c.id===state.position);position={x:courses[current].x,y:courses[current].y};drawAvatar();}
  updateNodes();status('セーブを読み込みました。行きたいコースをタップしよう。');
 });
 updateNodes();drawAvatar();
})();
