'use strict';
(() => {
 const journey=window.ShikabouJourney,open=document.getElementById('openSave');
 if(!journey||!open)return;
 const dialog=document.createElement('dialog');
 dialog.className='shikabou-save-dialog';
 dialog.setAttribute('aria-labelledby','saveTitle');
 dialog.innerHTML=`<h2 id="saveTitle">セーブデータ</h2>
  <p>コースの解放・星の数・最高評価を、セーブファイルで持ち運べます。</p>
  <p>読み込むと、今の記録とファイルの良い方が残ります。</p>
  <div class="shikabou-save-actions">
   <a data-save="export" download>セーブを書き出す</a>
   <button type="button" data-save="import">セーブファイルを読み込む</button>
   <input type="file" accept=".json,application/json" hidden>
   <a href="area-map.html" data-save="map" hidden>読み込んだ記録でマップへ →</a>
   <button type="button" data-save="close">閉じる</button>
  </div><p class="shikabou-save-status" role="status"></p>`;
 document.body.append(dialog);
 const download=dialog.querySelector('[data-save="export"]');
 const field=dialog.querySelector('input'),notice=dialog.querySelector('[role="status"]'),map=dialog.querySelector('[data-save="map"]');
 const report=(message,error=false)=>{notice.textContent=message;notice.dataset.error=String(error);};
 open.addEventListener('click',()=>{prepareExport();if(!dialog.open)dialog.showModal();});
 dialog.querySelector('[data-save="close"]').addEventListener('click',()=>dialog.close());
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,event=>event.stopPropagation());
 function prepareExport(){
  const save=JSON.stringify(journey.exportSave(),null,2)+'\n';
  const now=new Date(),pad=n=>String(n).padStart(2,'0');
  download.href='data:application/json;charset=utf-8,'+encodeURIComponent(save);
  download.download=`shikabou-save-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}.json`;
 }
 download.addEventListener('click',()=>{prepareExport();report('ダウンロード先に、セーブのJSONファイルが保存されます。');});
 map.addEventListener('click',()=>dialog.close());
 dialog.querySelector('[data-save="import"]').addEventListener('click',()=>field.click());
 field.addEventListener('change',async()=>{
  const file=field.files[0];field.value='';if(!file)return;
  try{
   if(file.size>32768)throw Error('セーブファイルのサイズが大きすぎます。');
   let data;try{data=JSON.parse((await file.text()).replace(/^\uFEFF/,''));}catch{throw Error('セーブファイルを読めませんでした。書き出したJSONファイルを選んでください。');}
   const next=journey.importSave(data);window.dispatchEvent(new Event('shikabou:save-loaded'));
   map.hidden=false;prepareExport();
   report(`読み込みました（${next.cleared.length}コースクリア済み）。`+(journey.persistent?'':' このブラウザは自動保存に対応していません。閉じる前に書き出してください。'));
  }catch(error){report(error.message||'セーブを読み込めませんでした。',true);}
 });
})();
