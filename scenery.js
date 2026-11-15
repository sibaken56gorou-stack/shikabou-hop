'use strict';
// Canvas scenery shares the game's illustrated shapes and scales at any viewport.
(() => {
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function shape(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function tiles(camera,ratio,spacing,width,draw){const offset=camera*ratio;for(let i=Math.floor(offset/spacing)-1;i<=Math.ceil((offset+width)/spacing)+1;i++)draw(i*spacing-offset,i);}
function clouds(c,W,camera){tiles(camera,.12,370,W,(x,i)=>{const y=70+(i%3)*25;oval(c,x,y,55,17,'#fffdf0ba');oval(c,x-22,y-10,28,22,'#fffdf0ba');oval(c,x+14,y-15,32,26,'#fffdf0ba');});}
function meadow(c,W,camera,clock){
  oval(c,W-110,78,34,34,'#fff2b5');clouds(c,W,camera);
  tiles(camera,.18,470,W,(x,i)=>{oval(c,x,442,340,200,i%2?'#bfd5b1':'#cbdcbc');oval(c,x+155,465,270,170,'#a8cba2');});
  tiles(camera,.38,610,W,(x,i)=>{
    x+=160;
    if(i%2===0){
      // A quiet windmill against the open hillside.
      shape(c,[[x-19,382],[x-12,271],[x+13,271],[x+24,382]],'#f7eccd');
      shape(c,[[x-22,278],[x,253],[x+24,278]],'#bb795b');
      c.save();c.translate(x,284);c.rotate(clock*.22);c.strokeStyle='#eee6c8';c.lineWidth=5;
      for(let j=0;j<4;j++){c.rotate(Math.PI/2);c.beginPath();c.moveTo(0,0);c.lineTo(0,-53);c.stroke();c.fillStyle='#fff7df';c.fillRect(3,-52,12,34);}oval(c,0,0,6,6,'#8e7953');c.restore();
    }else{oval(c,x,365,34,48,'#83ac7d');c.fillStyle='#8d8056';c.fillRect(x-4,370,8,30);oval(c,x+22,375,23,28,'#96b68a');}
  });
  tiles(camera,.65,280,W,(x,i)=>{c.strokeStyle='#86a06b';c.lineWidth=2;c.beginPath();c.moveTo(x,404);c.lineTo(x+2,385);c.stroke();oval(c,x+3,382,5,4,i%2?'#f3ca83':'#f5e4bd');});
}
function forest(c,W,camera,clock){
  // Tall trunks, overlapping canopies and shafts of light fill the upper frame.
  tiles(camera,.16,165,W,(x,i)=>{c.fillStyle='#89aa8b';c.fillRect(x,92,20+(i%3)*9,330);oval(c,x+12,90,94,98,'#83a887');});
  tiles(camera,.36,255,W,(x,i)=>{
    c.fillStyle=i%2?'#60836a':'#739374';c.fillRect(x-16,70,34+(i%2)*12,345);
    c.strokeStyle='#557a62';c.lineWidth=10;c.beginPath();c.moveTo(x,235);c.lineTo(x+74,173);c.moveTo(x,167);c.lineTo(x-57,115);c.stroke();
    oval(c,x,28,158,94,'#456e57');oval(c,x+73,56,99,70,'#527b5e');
  });
  tiles(camera,.24,450,W,(x,i)=>{shape(c,[[x+50,0],[x+86,0],[x+270,400],[x+150,400]],'#f8f2bd16');});
  tiles(camera,.58,370,W,(x,i)=>{
    c.fillStyle='#426a53';c.fillRect(x-21,0,43,418);c.strokeStyle='#365c48';c.lineWidth=3;
    c.beginPath();c.moveTo(x-7,20);c.lineTo(x-11,320);c.moveTo(x+9,150);c.lineTo(x+10,390);c.stroke();
    oval(c,x+1,407,64,20,'#4c7755');oval(c,x+52,409,44,13,'#6c9461');
  });
  for(let i=0;i<9;i++){const x=((i*173-camera*.26+Math.sin(clock*.45+i)*16)% (W+80)+W+80)%(W+80)-40,y=142+(i*47)%213;oval(c,x,y,2.2,2.2,'#f8e9aa9c');}
}
function mountain(c,x,base,width,height,color,snow){
  shape(c,[[x-width*.55,base],[x-width*.14,base-height*.73],[x+width*.02,base-height],[x+width*.24,base-height*.55],[x+width*.55,base]],color);
  if(snow)shape(c,[[x-width*.14,base-height*.73],[x+width*.02,base-height],[x+width*.15,base-height*.72],[x+width*.06,base-height*.76],[x+width*.015,base-height*.66],[x-width*.04,base-height*.8]],snow);
}
function highland(c,W,camera,clock){
  oval(c,W-130,70,29,29,'#fff4c8');clouds(c,W,camera);
  tiles(camera,.1,500,W,(x,i)=>mountain(c,x,417,690,295+(i%2)*45,'#afc7cf','#eaf0e5'));
  tiles(camera,.23,460,W,(x,i)=>mountain(c,x,459,620,210+(i%2)*45,'#8eaeb5','#cddbd2'));
  tiles(camera,.42,480,W,(x,i)=>{
    shape(c,[[x-130,440],[x-105,345],[x-40,309],[x+8,337],[x+45,277],[x+105,325],[x+137,440]],'#789b9b');
    c.strokeStyle='#6d8e8b';c.lineWidth=3;c.beginPath();c.moveTo(x+45,290);c.lineTo(x+23,393);c.moveTo(x-34,325);c.lineTo(x-48,398);c.stroke();
    // Wind-shaped alpine pines rather than the forest's broad canopies.
    c.fillStyle='#577f76';c.fillRect(x+70,309,7,76);for(let j=0;j<3;j++)shape(c,[[x+39-j*4,350+j*14],[x+74,283+j*16],[x+111+j*4,350+j*14]],'#648d7b');
  });
  for(let i=0;i<3;i++){const x=((i*330+clock*24-camera*.16)%(W+260)+W+260)%(W+260)-160,y=130+i*61;c.strokeStyle='#ffffff55';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+40,y-9,x+88,y-1);c.stroke();}
}
function background(c,{W,H,camera,clock,region}){
  const index=region.x===0?0:region.x===4400?1:2;
  const colors=[['#c6e5e2','#faf0ce'],['#a6c4a1','#d0ddad'],['#a7cee1','#edf1de']][index];
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,colors[0]);sky.addColorStop(1,colors[1]);c.fillStyle=sky;c.fillRect(0,0,W,H);
  [meadow,forest,highland][index](c,W,camera,clock);
}
globalThis.ShikabouScenery={background};
})();
