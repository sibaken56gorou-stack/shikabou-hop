'use strict';
// Use the standing drawing as the color reference for every running pose.
// This is applied once after loading; the animation still uses the original cells.
(() => {
const cache=new WeakMap(),references=new WeakMap();
function material(r,g,b){
  if(b>45&&b>r*3.3&&b>g*2.1&&b<155)return 0; // navy outlines
  if(b>=155&&b>r*4&&b>g*1.3)return 1; // blue fabric
  if(r>170&&g>95&&b<190&&r-g>38&&g-b>15)return 2; // fur
  if(r>210&&g>205&&b>150&&r-b>15&&g-b>10)return 3; // antlers
  if(r>200&&g>150&&b<150)return 4; // cheeks
  if(r>90&&g<120&&b<65&&r>g*1.9&&r<235)return 5; // hooves, inner ears
  if(r>=235&&g<120&&b<120)return 6; // mouth
  if(Math.min(r,g,b)>215&&Math.max(r,g,b)-Math.min(r,g,b)<24)return 7; // white fur
  return -1; // cap, pupils, and boundary blends retain their original colors
}
function histogram(data){
  const hist=Array.from({length:8},()=>Array.from({length:3},()=>new Uint32Array(256)));
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<245)continue;
    const group=material(data[i],data[i+1],data[i+2]);if(group<0)continue;
    for(let c=0;c<3;c++)hist[group][c][data[i+c]]++;
  }
  return hist;
}
function table(source,target){
  const median=h=>{const n=h.reduce((s,v)=>s+v,0);let sum=0;for(let i=0;i<256;i++){sum+=h[i];if(sum>=n/2)return i;}return 0;};
  const shift=median(target)-median(source),out=new Uint8Array(256);
  // A smooth offset retains the original shading and anti-aliasing rather than
  // expanding tiny color variations into visible patches.
  for(let i=0;i<256;i++)out[i]=Math.max(0,Math.min(255,i+shift));
  return out;
}
function recolor(data,target){
  const source=histogram(data),maps=source.map((channels,k)=>channels.map((h,c)=>table(h,target[k][c])));
  for(let i=0;i<data.length;i+=4){
    if(!data[i+3])continue;
    const group=material(data[i],data[i+1],data[i+2]);if(group<0)continue;
    for(let c=0;c<3;c++)data[i+c]=maps[group][c][data[i+c]];
  }
  return data;
}
function surface(image){
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  return {canvas,context,pixels:context.getImageData(0,0,canvas.width,canvas.height)};
}
function art(image,reference){
  if(!image.naturalWidth||!reference.naturalWidth)return image;
  if(cache.has(image))return cache.get(image);
  if(!references.has(reference))references.set(reference,histogram(surface(reference).pixels.data));
  const output=surface(image);recolor(output.pixels.data,references.get(reference));
  output.context.putImageData(output.pixels,0,0);cache.set(image,output.canvas);return output.canvas;
}
globalThis.ShikabouPalette={art,material,histogram,recolor};
})();
