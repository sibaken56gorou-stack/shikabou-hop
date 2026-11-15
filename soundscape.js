'use strict';
// Original, browser-generated music and ambience; no audio downloads are needed.
(() => {
const THEMES={
  0:{name:'meadow',bpm:118,wave:'triangle',volume:.048,
    melody:[76,0,79,81,79,76,74,0,72,74,76,79,76,74,72,0,76,0,79,81,84,81,79,76,74,76,74,71,72,0,0,0,77,0,81,84,81,79,77,76,74,0,77,79,81,79,76,0,74,76,79,0,77,76,74,71,72,76,79,84,79,76,72,0],
    roots:[48,48,45,45,41,41,43,43],thirds:[4,4,3,3,4,4,4,4],noise:'lowpass',cutoff:420,air:.012,birds:9},
  4400:{name:'forest',bpm:88,wave:'sine',volume:.045,
    melody:[76,0,74,72,69,0,72,0,74,0,76,0,72,0,0,0,77,0,76,72,69,0,72,0,76,0,74,0,72,0,0,0,76,0,79,0,76,74,72,0,74,0,76,0,79,0,0,0,77,0,76,74,72,0,71,0,69,0,72,0,69,0,0,0],
    roots:[45,45,41,41,48,48,43,43],thirds:[3,3,4,4,4,4,4,4],noise:'bandpass',cutoff:1150,air:.019,birds:6.5},
  8200:{name:'highland',bpm:104,wave:'triangle',volume:.043,
    melody:[79,0,74,76,78,0,79,81,83,0,81,79,78,0,74,0,81,0,78,74,76,0,78,79,81,0,79,78,74,0,0,0,79,0,83,0,86,0,83,81,79,0,78,76,74,0,0,0,76,0,79,81,83,0,81,79,78,0,76,74,79,0,0,0],
    roots:[43,43,38,38,40,40,36,36],thirds:[4,4,4,4,3,3,4,4],noise:'lowpass',cutoff:360,air:.038,birds:0}
};
// Water, resonant cave and warm evening themes for course 1-2.
THEMES[12000]={name:'river',bpm:112,wave:'sine',volume:.043,melody:[76,79,0,81,79,76,74,0,72,76,79,0,81,79,76,0,77,81,0,84,81,77,76,0,74,77,79,0,76,74,72,0,76,79,84,0,83,79,76,0,74,76,79,0,81,79,76,0,77,81,84,0,81,77,74,0,76,74,72,0,74,72,0,0],roots:[48,48,41,41,45,45,43,43],thirds:[4,4,4,4,3,3,4,4],noise:'lowpass',cutoff:820,air:.023,birds:0};
THEMES[16000]={name:'cave',bpm:76,wave:'sine',volume:.04,melody:[69,0,0,76,0,72,0,0,67,0,0,74,0,71,0,0,65,0,0,72,0,69,0,0,64,0,0,71,0,67,0,0,69,0,76,0,72,0,0,0,67,0,74,0,71,0,0,0,65,0,72,0,69,0,0,0,64,0,71,0,69,0,0,0],roots:[45,45,43,43,41,41,40,40],thirds:[3,3,4,4,4,4,3,3],noise:'bandpass',cutoff:240,air:.012,birds:0};
THEMES[20000]={name:'estuary',bpm:108,wave:'triangle',volume:.041,melody:[79,81,83,0,86,83,81,79,78,0,79,81,83,0,79,0,76,79,81,0,83,81,79,76,74,0,76,78,79,0,0,0,79,83,86,0,88,86,83,81,79,0,78,76,74,0,0,0,76,79,83,0,81,79,76,74,78,0,79,83,79,0,0,0],roots:[43,43,40,40,36,36,38,38],thirds:[4,4,3,3,4,4,4,4],noise:'lowpass',cutoff:650,air:.029,birds:0};
// A leisurely island tune with soft flute-like notes, plucked chords and a breeze.
THEMES[24000]={name:'island',bpm:88,wave:'sine',volume:.035,melody:[76,0,79,0,81,79,76,0,74,0,71,74,79,0,0,0,72,0,76,0,81,79,76,0,77,0,76,74,72,0,0,0,76,0,79,0,84,83,79,0,77,0,76,74,69,0,74,0,72,0,77,0,81,79,77,0,74,0,71,0,72,0,0,0],roots:[48,43,45,41,48,50,41,43],thirds:[4,4,3,4,4,3,4,4],noise:'lowpass',cutoff:340,air:.007,birds:12};
// Climb, canopy, wind, and the guardian all have their own voice.
const treePhrase=[72,0,76,0,79,76,74,0,72,74,76,0,79,0,0,0,74,0,77,81,77,0,76,74,72,0,76,0,72,0,0,0,76,0,79,84,79,76,0,74,77,0,76,74,71,0,0,0,72,76,79,0,81,79,76,0,74,71,72,0,0,0,0,0];
const tree=(name,bpm,roots,thirds,melody=treePhrase)=>({name,bpm,wave:'triangle',volume:.039,melody,roots,thirds,noise:'lowpass',cutoff:name==='wind'?700:450,air:name==='wind'?.021:.011,birds:name==='canopy'?11:0});
THEMES[28000]=tree('roots',94,[48,48,50,43,45,41,48,43],[4,4,3,4,3,4,4,4]);
THEMES[29000]=tree('canopy',107,[48,43,50,48,45,43,41,43],[4,4,3,4,3,4,4,4],treePhrase.slice(32).concat(treePhrase.slice(0,32)));
THEMES[30000]=tree('wind',116,[43,43,40,36,43,38,40,43],[4,4,3,4,4,4,3,4],treePhrase.map(n=>n?n+7:0));
THEMES[31000]=tree('guardian',132,[45,45,41,43,45,45,40,45],[3,3,4,4,3,3,3,3],[69,0,69,72,76,0,75,72,69,0,72,74,76,72,0,67,65,0,69,72,77,76,72,0,67,0,71,74,77,74,0,71,69,0,72,76,81,79,76,0,69,0,72,75,76,75,72,0,68,0,71,74,76,77,76,71,69,72,76,0,75,72,69,0]);
const midiFrequency=n=>440*Math.pow(2,(n-69)/12);
class Soundscape{
  constructor(context){
    this.context=context;this.sessions=new Set();this.active=null;this.timer=null;this.running=false;
    this.master=context.createGain();this.master.gain.setValueAtTime(.8,context.currentTime);this.master.connect(context.destination);
    this.effects=context.createGain();this.effects.gain.setValueAtTime(1,context.currentTime);this.effects.connect(this.master);
    this.noiseBuffer=null;
  }
  get step(){return this.active?.step||0;}
  get area(){return this.active?.key??null;}
  get voiceCount(){let n=0;for(const s of this.sessions)n+=s.voices.size;return n;}
  track(session,source,nodes){
    const voice={source,nodes};session.voices.add(voice);
    source.onended=()=>this.release(session,voice);return voice;
  }
  release(session,voice){
    voice.source.onended=null;for(const n of voice.nodes){try{n.disconnect();}catch{}}
    session.voices.delete(voice);
  }
  dispose(session){
    for(const voice of [...session.voices]){try{voice.source.stop();}catch{}this.release(session,voice);}
    session.mix.disconnect();this.sessions.delete(session);if(this.active===session)this.active=null;
  }
  note(s,midi,when,duration,wave,volume,pad=false){
    if(!midi)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=wave;
    o.frequency.setValueAtTime(midiFrequency(midi),when);
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(volume,when+(pad?.22:.014));
    g.gain.exponentialRampToValueAtTime(.0001,when+Math.max(duration,pad?.3:.03));
    o.connect(g);g.connect(s.mix);this.track(s,o,[o,g]);o.start(when);o.stop(when+duration+.04);
  }
  noise(){
    if(this.noiseBuffer)return this.noiseBuffer;
    const c=this.context,length=Math.ceil(c.sampleRate*2),b=c.createBuffer(1,length,c.sampleRate),data=b.getChannelData(0),edge=Math.max(1,Math.round(c.sampleRate*.01));
    for(let i=0;i<length;i++){const fade=Math.min(1,i/edge,(length-1-i)/edge);data[i]=(Math.random()*2-1)*.45*fade;}
    this.noiseBuffer=b;return b;
  }
  ambience(s){
    const c=this.context,t=c.currentTime,theme=s.theme;
    const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
    source.buffer=this.noise();source.loop=true;filter.type=theme.noise;filter.frequency.setValueAtTime(theme.cutoff,t);filter.Q.setValueAtTime(.55,t);gain.gain.setValueAtTime(theme.air,t);
    source.connect(filter);filter.connect(gain);gain.connect(s.mix);this.track(s,source,[source,filter,gain]);source.start(t);
    // Slow modulation turns the same noise into a breeze, leaves or alpine wind.
    const lfo=c.createOscillator(),depth=c.createGain();lfo.type='sine';lfo.frequency.setValueAtTime(theme.name==='forest'?.19:.095,t);depth.gain.setValueAtTime(theme.air*.38,t);lfo.connect(depth);depth.connect(gain.gain);this.track(s,lfo,[lfo,depth]);lfo.start(t);
    if(theme.name==='highland'){
      const gust=c.createOscillator(),range=c.createGain();gust.type='sine';gust.frequency.setValueAtTime(.07,t);range.gain.setValueAtTime(125,t);gust.connect(range);range.connect(filter.frequency);this.track(s,gust,[gust,range]);gust.start(t);
    }
  }
  birds(s,when){
    const c=this.context;
    for(let i=0;i<(s.theme.name==='forest'?3:2);i++){
      const t=when+i*.16,o=c.createOscillator(),g=c.createGain();o.type='sine';
      o.frequency.setValueAtTime(1850+i*170,t);o.frequency.linearRampToValueAtTime(2700-i*100,t+.045);o.frequency.exponentialRampToValueAtTime(1500+i*100,t+.12);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.008,t+.014);g.gain.exponentialRampToValueAtTime(.0001,t+.13);
      o.connect(g);g.connect(s.mix);this.track(s,o,[o,g]);o.start(t);o.stop(t+.15);
    }
  }
  phrase(s){
    const theme=s.theme,step=s.step%64,block=Math.floor(step/8),root=theme.roots[block],third=theme.thirds[block],beat=60/theme.bpm/2,t=s.next;
    let hold=1;while(hold<3&&theme.melody[(step+hold)%64]===0)hold++;
    this.note(s,theme.melody[step],t,beat*hold*.86,theme.wave,theme.volume);
    if(theme.name==='guardian'){
      if(step%2===0)this.note(s,root+(step%8===4?12:0),t,beat*1.32,'triangle',.045);
      if(step%4===0)this.note(s,root+19,t,beat*.5,'sine',.017);
    }else if(theme.name==='meadow'){
      if(step%2===0)this.note(s,root,t,beat*1.55,'triangle',.055);
      const arp=[0,7,12,7,third,7,12,7];this.note(s,root+12+arp[step%8],t,beat*.42,'sine',.019);
    }else if(theme.name==='island'){
      if(step%8===0){this.note(s,root,t,beat*7.3,'sine',.033);for(const n of [root+12,root+12+third,root+19])this.note(s,n,t,beat*7.3,'sine',.007,true);}
      if(step%2===0){const arp=[0,7,third,7];this.note(s,root+24+arp[step/2%4],t,beat*1.1,'triangle',.012);}
    }else{
      if(step%4===0)this.note(s,root,t,beat*3.4,'sine',.045);
      if(step%8===0)for(const n of [root+12,root+12+third,root+19])this.note(s,n,t,beat*7.3,'sine',theme.name==='forest'?.009:.012,true);
      if(theme.name==='forest'&&step%4===2)this.note(s,root+24+(step%8===2?7:0),t,beat*.8,'triangle',.012);
      if(['highland','river','estuary','roots','canopy','wind'].includes(theme.name)&&step%2===0){const arp=[0,7,12,7,third,7,12,7];this.note(s,root+12+arp[step%8],t,beat*.65,'sine',.014);}
    }
    if(theme.name==='cave'&&step%8===4)this.note(s,root+36,t+.08,.18,'sine',.025);
    s.step++;s.next+=beat;
  }
  setArea(area){
    if(!this.running)return;const key=THEMES[area]?Number(area):0;if(this.active?.key===key)return;
    const c=this.context,now=c.currentTime,old=this.active;
    // Bound overlap to two sessions, including quick trips across an area border.
    for(const s of [...this.sessions])if(s!==old)this.dispose(s);
    if(old){old.mix.gain.cancelScheduledValues(now);old.mix.gain.setValueAtTime(old.mix.gain.value,now);old.mix.gain.linearRampToValueAtTime(0,now+.7);old.end=now+.75;}
    const mix=c.createGain();mix.gain.setValueAtTime(0,now);mix.gain.linearRampToValueAtTime(1,now+.65);mix.connect(this.master);
    const s={key,theme:THEMES[key],mix,step:0,next:now+.04,nextBird:now+2.8,end:Infinity,voices:new Set()};
    this.active=s;this.sessions.add(s);this.ambience(s);this.tick();
  }
  tick(){
    if(!this.running)return;const now=this.context.currentTime;
    for(const s of [...this.sessions])if(s.end<=now)this.dispose(s);
    const s=this.active;if(!s)return;
    if(s.next<now-.1)s.next=now+.03;
    while(s.next<now+.15)this.phrase(s);
    if(s.theme.birds&&s.nextBird<now+.15){this.birds(s,s.nextBird);s.nextBird=now+s.theme.birds;}
  }
  start(area){this.stop();this.running=true;this.setArea(area);this.timer=setInterval(()=>this.tick(),40);}
  stop(){
    this.running=false;if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
    for(const s of [...this.sessions])this.dispose(s);this.active=null;
  }
}
globalThis.ShikabouSoundscape={create:context=>new Soundscape(context),themes:THEMES};
})();
