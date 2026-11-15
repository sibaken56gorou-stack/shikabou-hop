'use strict';
(()=>{
 const button=document.getElementById('openOffline');
 if(!button||!('serviceWorker' in navigator)||location.protocol==='file:')return;
 button.hidden=false;
 const appleMobile=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const homeGuide=appleMobile?(navigator.standalone===true||window.matchMedia('(display-mode: standalone)').matches?'':'<p>ホーム画面から使う場合は、Safariの <b>共有 →「ホーム画面に追加」</b> で追加し、アイコンから開いて保存してください。</p>'):'<p>Androidでは、Chromeの <b>︙</b> からホーム画面に追加できます。</p>';
 const service=navigator.serviceWorker,dialog=document.createElement('dialog');
 dialog.className='shikabou-save-dialog';
 dialog.setAttribute('aria-labelledby','offlineTitle');
 dialog.innerHTML=`<h2 id="offlineTitle">オフラインで遊ぶ</h2>
  <p>Wi-Fiなどにつないだ状態で、ゲームを端末に保存してください。保存後は、通信なしで1-1〜1-3とエリアマップを遊べます。</p>
  ${homeGuide}
  <div class="shikabou-save-actions"><button type="button" data-offline="save">ゲームを端末に保存</button><button type="button" data-offline="close">閉じる</button></div>
  <p class="shikabou-save-status" role="status">保存状態を確認しています…</p>`;
 document.body.append(dialog);
 const notice=dialog.querySelector('[role="status"]'),save=dialog.querySelector('[data-offline="save"]');
 const report=(message,error=false)=>{notice.textContent=message;notice.dataset.error=String(error);};
 const registration=service.register('./game-offline-worker.js',{scope:'./',updateViaCache:'none'}).catch(()=>service.getRegistration()).catch(()=>null);
 const request=async type=>{
  const r=await registration;
  if(!r)throw Error(`このブラウザでゲームを保存できません。${appleMobile?'Safari':'Chrome'}で開いてお試しください。`);
  const target=r.active||(await Promise.race([service.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('保存機能を準備できませんでした。ページを開き直してください。')),10000))])).active;
  if(!target)throw Error('ページを開き直してから、もう一度お試しください。');
  const channel=new MessageChannel();
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{channel.port1.close();reject(Error('通信を確認して、もう一度お試しください。'));},type==='save-offline'?90000:10000);
   channel.port1.onmessage=({data})=>{
    clearTimeout(timer);channel.port1.close();
    if(data.error)reject(Error('保存できませんでした。通信を確認してから、もう一度お試しください。'));else resolve(data);
   };
   target.postMessage({type},[channel.port2]);
  });
 };
 function show(data){
  button.textContent=data.saved?'オフラインで遊ぶ ✓':'オフラインで遊ぶ';
  save.textContent=data.saved&&!data.current?'最新版を端末に保存':'ゲームを端末に保存';
  save.disabled=!!data.current;
  report(data.saved?(data.current?'保存済みです。通信なしでも起動できます。':'保存済みの版で遊べます。オンラインなら最新版も保存できます。'):'まだ保存されていません。');
 }
 button.addEventListener('click',async()=>{
  if(!dialog.open)dialog.showModal();
  save.disabled=true;report('保存状態を確認しています…');
  try{show(await request('check-offline'));}catch(error){save.disabled=false;report(error.message,true);}
 });
 dialog.querySelector('[data-offline="close"]').addEventListener('click',()=>dialog.close());
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,event=>event.stopPropagation());
 save.addEventListener('click',async()=>{
  save.disabled=true;report('ゲームを端末に保存しています。この画面を開いたままお待ちください…');
  try{show(await request('save-offline'));}catch(error){save.disabled=false;report(error.message,true);}
 });
 request('check-offline').then(data=>{if(data.saved)button.textContent='オフラインで遊ぶ ✓';}).catch(()=>{});
})();
