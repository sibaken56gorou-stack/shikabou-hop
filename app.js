'use strict';
(() => {
 const install=document.getElementById('installApp'),dialog=document.getElementById('installDialog'),fullscreen=document.getElementById('fullscreen'),status=document.getElementById('appStatus');
 const standalone=window.matchMedia('(display-mode: standalone)'),immersive=window.matchMedia('(display-mode: fullscreen)');
 let promptEvent=null,statusTimer=0;
 const appleMobile=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const isInstalled=()=>standalone.matches||immersive.matches||navigator.standalone===true;
 const updateInstall=()=>{install.hidden=isInstalled();};
 function notify(message){clearTimeout(statusTimer);status.textContent=message;status.hidden=false;statusTimer=setTimeout(()=>{status.hidden=true;},4500);}
 updateInstall();standalone.addEventListener?.('change',updateInstall);immersive.addEventListener?.('change',updateInstall);
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;updateInstall();});
 window.addEventListener('appinstalled',()=>{promptEvent=null;install.hidden=true;if(dialog.open)dialog.close();notify('追加しました！ ホーム画面のシカぼうから起動できます。');});
 function showInstallHelp(){
  document.getElementById('installFeedback').hidden=true;
  if(appleMobile){
   document.getElementById('installSteps').innerHTML='<li>このページを<strong>Safari</strong>で開きます。</li><li><strong>共有 →「ホーム画面に追加」</strong>を選びます。</li><li>「ウェブアプリとして開く」が表示されたらオンにして、「追加」を押します。</li>';
   document.getElementById('installNote').textContent='オフラインで遊ぶには、追加したアイコンから通信できる状態で一度起動し、「オフラインで遊ぶ」からゲームを端末に保存してください。';
  }
  if(!dialog.open)dialog.showModal();
 }
 install.addEventListener('click',async()=>{
  if(!promptEvent){showInstallHelp();return;}
  const event=promptEvent;promptEvent=null;
  try{await event.prompt();const choice=await event.userChoice;if(choice.outcome!=='accepted')updateInstall();}catch{showInstallHelp();}
 });
 for(const type of ['keydown','keyup'])dialog.addEventListener(type,event=>event.stopPropagation());
 document.getElementById('closeInstall').addEventListener('click',()=>dialog.close());
 document.getElementById('copyAppLink').addEventListener('click',async()=>{
  const feedback=document.getElementById('installFeedback');feedback.hidden=false;
  try{await navigator.clipboard.writeText(new URL('./',location.href).href);feedback.textContent=`URLをコピーしました。${appleMobile?'Safari':'Chrome'}のアドレス欄に貼り付けて開けます。`;}catch{feedback.textContent='コピーできませんでした。ブラウザの共有メニューからURLをコピーしてください。';}
 });
 if(document.documentElement.requestFullscreen){
  fullscreen.hidden=false;
  fullscreen.addEventListener('click',async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('この画面では全画面表示にできません。Chromeで開いてお試しください。');}
  });
  document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;fullscreen.setAttribute('aria-pressed',String(active));fullscreen.setAttribute('aria-label',active?'全画面をやめる':'全画面で遊ぶ');fullscreen.textContent=active?'⊡':'⛶';});
 }
})();
