'use strict';
// Course progress is stored on this browser; practice and map previews never unlock courses.
(() => {
 const key='shikabou.journey.v1';
 const courses=[
  {id:'1-1',name:'はじまりの冒険',ready:true,x:88,y:558},
  {id:'1-2',name:'水辺と水音の洞窟',ready:true,x:248,y:414},
  {id:'1-3',name:'風に揺れる大樹の森',ready:true,x:104,y:272},
  {id:'1-4',name:'島の向こうへ',ready:false,x:246,y:124}
 ];
 const empty=()=>({schema:1,cleared:[],position:'1-1',records:{}});
 function clean(raw){
  const out=empty();if(!raw||raw.schema!==1)return out;
  // Only a contiguous chain can unlock a later course.
  for(const c of courses){if(!Array.isArray(raw.cleared)||!raw.cleared.includes(c.id))break;out.cleared.push(c.id);}
  const max=Math.min(out.cleared.length,courses.length-1),i=courses.findIndex(c=>c.id===raw.position);if(i>=0&&i<=max)out.position=raw.position;
  for(const c of courses){const r=raw.records?.[c.id];if(!out.cleared.includes(c.id)||!r)continue;out.records[c.id]={stars:Math.max(0,Math.min(3,Math.floor(Number(r.stars)||0))),rank:['S','A','B','C'].includes(r.rank)?r.rank:'C'};}
  return out;
 }
 let state=empty(),persistent=true;
 try{state=clean(JSON.parse(window.localStorage.getItem(key)||'null'));}catch{persistent=false;}
 function save(){try{window.localStorage.setItem(key,JSON.stringify(state));persistent=true;}catch{persistent=false;}}
 function snapshot(){return JSON.parse(JSON.stringify(state));}
 function available(id,s=state){const i=courses.findIndex(c=>c.id===id);return i>=0&&(i===0||s.cleared.includes(courses[i-1].id));}
 function complete(id,result){
  const c=courses.find(c=>c.id===id);if(!c||!c.ready||!available(id)||result?.practice)return false;
  if(!state.cleared.includes(id))state.cleared.push(id);
  const old=state.records[id]||{stars:0,rank:'C'},order={S:3,A:2,B:1,C:0},rank=['S','A','B','C'].includes(result?.rank)?result.rank:'C';
  state.records[id]={stars:Math.max(old.stars,Math.min(3,Math.max(0,Math.floor(Number(result?.stars)||0)))),rank:order[rank]>order[old.rank]?rank:old.rank};
  state.position=id;save();return true;
 }
 function setPosition(id){if(!available(id))return false;state.position=id;save();return true;}
 function exportSave(){
  return {format:'shikabou-hop-save',version:1,progress:snapshot()};
 }
 function importSave(file){
  if(!file||file.format!=='shikabou-hop-save'||file.version!==1)throw Error('シカぼうのセーブファイルではないか、対応していない形式です。');
  const data=file.progress,known=courses.map(c=>c.id);
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const validRecord=r=>object(r)&&Number.isInteger(r.stars)&&r.stars>=0&&r.stars<=3&&['S','A','B','C'].includes(r.rank);
  if(!object(data)||data.schema!==1||!Array.isArray(data.cleared)||!object(data.records)||
     !data.cleared.every((id,i)=>id===known[i]&&i<known.length)||
     !known.slice(0,data.cleared.length+1).includes(data.position)||
     !Object.entries(data.records).every(([id,r])=>data.cleared.includes(id)&&validRecord(r))){
   throw Error('セーブファイルの中身が壊れているため、読み込めませんでした。');
  }
  const ranks=['C','B','A','S'];
  const cleared=known.slice(0,Math.max(state.cleared.length,data.cleared.length));
  const records={...state.records};
  for(const id of cleared){
   const a=records[id],b=data.records[id];if(!b)continue;
   records[id]=a?{stars:Math.max(a.stars,b.stars),rank:ranks[Math.max(ranks.indexOf(a.rank),ranks.indexOf(b.rank))]}:{...b};
  }
  state={schema:1,cleared,position:data.position,records};save();
  return snapshot();
 }
 window.ShikabouJourney={courses,snapshot,available,complete,setPosition,exportSave,importSave,get persistent(){return persistent;}};
})();
