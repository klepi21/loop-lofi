// Chickageddon multiplayer server. Runs the game's own code (from index.html) once per room inside a vm.
const fs=require('fs'),path=require('path'),vm=require('vm'),http=require('http'),crypto=require('crypto');
const {WebSocketServer}=require('ws');
const PORT=+process.env.PORT||8080,MAXH=8,MAXROOMS=24,MAXDUEL=16,HOLDMS=180000,LETTERS='ABCDEFGHJKLMNPQRSTUVWXYZ';
const html=fs.readFileSync(process.env.GAME||path.join(__dirname,'index.html'),'utf8');
const m=html.match(/<script>([\s\S]*)<\/script>/);if(!m)throw new Error('no script in index.html');
const code=m[1]+'\n'+fs.readFileSync(path.join(__dirname,'room_ctx.js'),'utf8');
const script=new vm.Script(code,{filename:'game.js'});

function stub(){const f=function(){};const P=new Proxy(f,{
  get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='then'||k===Symbol.iterator||k===Symbol.asyncIterator)return undefined;if(k==='length')return 0;return P;},
  set(){return true;},apply(){return P;},construct(){return P;},has(){return true;},deleteProperty(){return true;}});return P;}
function makeRoom(id,arena,mode){mode=mode==='d'||mode==='t'||mode==='c'?mode:'f';const duel=mode==='d';
  const S=stub(),store={};
  const sb={__SRV:true,__MATCHT:process.env.MATCHT?+process.env.MATCHT:undefined,console,Math,JSON,Date,setTimeout,clearTimeout,setInterval:()=>0,clearInterval(){},performance:{now:()=>Number(process.hrtime.bigint())/1e6},
    Float32Array,Float64Array,Uint8Array,Uint16Array,Uint32Array,Int32Array,Int16Array,Int8Array,ArrayBuffer,URLSearchParams,TextEncoder,atob,
    innerWidth:1280,innerHeight:720,devicePixelRatio:1,
    document:new Proxy({},{get(t,k){if(k==='hidden')return false;return S;}}),
    navigator:{userAgent:'server',platform:'server',maxTouchPoints:0,standalone:false},
    location:{hash:'',search:'',hostname:'server',pathname:'/',origin:'',href:''},history:{replaceState(){}},
    localStorage:{getItem:k=>(k in store?store[k]:null),setItem(k,v){store[k]=String(v);},removeItem(k){delete store[k];}},
    matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},removeEventListener(){},requestAnimationFrame(){return 0;},
    fetch:()=>Promise.reject(new Error('no fetch')),crypto:{getRandomValues:a=>a,subtle:S},screen:{width:1280,height:720},WebSocket:function(){}};
  sb.window=sb;sb.globalThis=sb;sb.self=sb;
  const ctx=vm.createContext(sb);script.runInContext(ctx);
  const R=sb.ROOM;R.init(arena,mode);
  return {id,R,clients:new Map(),specs:new Set(),n:0,code:newCode(),holds:[],duel,mode,max:duel?2:MAXH};
}

const rooms=[];let nextId=1,players=0;
// small daily counters for the admin dashboard (no personal data), kept in metrics.json next to the server
const MFILE=path.join(__dirname,'metrics.json');let METR={},mDirty=false;try{METR=JSON.parse(fs.readFileSync(MFILE,'utf8'))||{};}catch(e){METR={};}
function mday(){const d=new Date().toISOString().slice(0,10);if(!METR[d]){METR[d]={joins:0,peak:0,matches:0,duel:0,code:0,invites:0,team:0,ctf:0,party:0};const ks=Object.keys(METR).sort();while(ks.length>120)delete METR[ks.shift()];}return METR[d];}
function mAdd(k,n){const m=mday();m[k]=(m[k]||0)+(n||1);mDirty=true;}
setInterval(()=>{if(!mDirty)return;mDirty=false;fs.writeFile(MFILE,JSON.stringify(METR),()=>{});},60000);
// every room has a short code that players can share; an invite holds two seats in the room for a few minutes
function newCode(){for(;;){let c='';for(let i=0;i<4;i++)c+=LETTERS[Math.floor(Math.random()*LETTERS.length)];if(!rooms.some(r=>r.code===c))return c;}}
function held(r){const n=Date.now();if(r.holds.length)r.holds=r.holds.filter(t=>t>n);return r.holds.length;}
function pickRoom(need,mode){need=need||1;mode=mode==='d'||mode==='t'||mode==='c'?mode:'f';const duel=mode==='d';let best=null;
  for(const r of rooms){if(r.mode!==mode)continue;if(r.max-r.clients.size-held(r)>=need&&(!best||r.clients.size>best.clients.size))best=r;}
  if(!best){const n=rooms.filter(r=>r.duel===duel).length;if(n>=(duel?MAXDUEL:MAXROOMS))return null;best=makeRoom(nextId++,Math.floor(Math.random()*2520),mode);rooms.push(best);}return best;}

// ---------- friends: who is online, and parties that move into the same room together (kept in memory only) ----------
const SUPA=(html.match(/const SUPA='([^']+)'/)||[])[1]||'',SKEY=(html.match(/SKEY='([^']+)'/)||[])[1]||'';
const TOK=new Map(),PRES=new Map(),TICK=new Map(),PARTY=new Map(),PCODE=new Map(),rnd=n=>crypto.randomBytes(n).toString('hex');
// a player proves who they are with their sign-in token; we ask the account service once and remember the answer for a while
async function whoIs(at){if(typeof at!=='string'||at.length<20||at.length>4000||!SUPA)return null;const now=Date.now(),c=TOK.get(at);if(c&&now-c.t<1800000)return c.u;if(TOK.size>20000)TOK.clear();
  try{const r=await fetch(SUPA+'/auth/v1/user',{headers:{apikey:SKEY,Authorization:'Bearer '+at},signal:AbortSignal.timeout(6000)});if(!r.ok)return null;const d=await r.json();
    if(!d||typeof d.id!=='string'||!/^[0-9a-f-]{36}$/.test(d.id))return null;TOK.set(at,{u:d.id,t:now});return d.id;}catch(e){return null;}}
function online(P){return !!P.room||Date.now()-P.t<45000;}
function stateOf(P){if(P.room){const r=P.room;return [2,r.code,r.mode,Math.max(0,r.max-r.clients.size-held(r))];}return Date.now()-P.t<45000?[1]:null;}
function leaveParty(P){const pt=P.party&&PARTY.get(P.party);P.party=null;if(!pt)return;pt.mem=pt.mem.filter(u=>u!==P.u);if(pt.lead===P.u)pt.lead=pt.mem[0];
  if(pt.mem.length<2){for(const u of pt.mem){const q=PRES.get(u);if(q&&q.party===pt.id)q.party=null;}PARTY.delete(pt.id);}}
function partyView(P){const pt=P.party&&PARTY.get(P.party);if(!pt)return null;const L=PRES.get(pt.lead);
  const now=Date.now(),pend=[];if(!pt.pend)pt.pend={};for(const k in pt.pend){if(now-pt.pend[k]>180000||pt.mem.includes(k)){delete pt.pend[k];continue;}pend.push({u:k,n:(PRES.get(k)||{}).n||''});}
  return {id:pt.id,code:pt.code||'',lead:pt.lead,mode:pt.mode||'f',pend,go:L&&L.room?L.room.code:null,mem:pt.mem.map(u=>{const q=PRES.get(u)||{};return {u,n:q.n||'',sel:q.sel|0,lvl:q.lvl|0,st:q.room?2:online(q)?1:0};})};}
async function soc(d){const u=await whoIs(d&&d.at);if(!u)return {err:'auth'};const now=Date.now();let P=PRES.get(u);
  if(!P){if(PRES.size>50000)return {err:'busy'};P={u,t:now,n:'',sel:0,lvl:1,f:new Set(),k:rnd(12),room:null,ws:null,slot:0,party:null,inv:[]};PRES.set(u,P);TICK.set(P.k,u);}
  P.t=now;if(typeof d.n==='string')P.n=d.n.replace(/[^A-Za-z0-9_ ]/g,'').slice(0,14);P.sel=(d.sel|0)&7;P.lvl=Math.min(999,Math.max(1,d.lvl|0));
  if(Array.isArray(d.f))P.f=new Set(d.f.filter(x=>typeof x==='string'&&x.length===36).slice(0,200));
  P.inv=P.inv.filter(i=>now-i.t<180000&&PARTY.has(i.pid));const a=d.a;let ir,jr;
  // a party is the lobby friends gather in before a match: the leader invites, picks the match style and starts. It lives while someone in it is around.
  const MOK=m=>m==='f'||m==='t'||m==='c'||m==='d',mkParty=()=>{let code='';do{code='';for(let i=0;i<5;i++)code+=LETTERS[Math.floor(Math.random()*LETTERS.length)];}while(PCODE.has(code));
    const pt={id:rnd(6),code,lead:u,mem:[u],t:now,mode:MOK(d.m)?d.m:'f',pend:{}};PARTY.set(pt.id,pt);PCODE.set(code,pt.id);P.party=pt.id;return pt;};
  {const pt=P.party&&PARTY.get(P.party);if(pt)pt.t=now;}
  if(a==='inv'&&typeof d.to==='string'){const T=PRES.get(d.to);ir='off';
    // the answer tells the sender what happened: ok, off (friend not reachable), lead (only the leader invites), full, in (already in the party)
    if(T&&T!==P&&T.f.has(u)&&P.f.has(d.to)&&online(T)){let pt=P.party&&PARTY.get(P.party);if(pt&&pt.lead!==u)ir='lead';else if(pt&&pt.mem.includes(d.to))ir='in';else if(pt&&pt.mem.length>=4)ir='full';
      else{if(!pt)pt=mkParty();if(!pt.pend)pt.pend={};pt.t=now;T.inv=T.inv.filter(i=>i.from!==u);if(T.inv.length<5){T.inv.push({from:u,pid:pt.id,t:now});pt.pend[d.to]=now;ir='ok';}else ir='full';}}}
  else if(a==='new'){if(!(P.party&&PARTY.get(P.party)))mkParty();}
  // joining with the party link: no friendship needed, the id in the link is the key
  else if(a==='pjoin'&&(typeof d.pid==='string'||typeof d.code==='string')){const pt=PARTY.get(typeof d.pid==='string'?d.pid:PCODE.get(String(d.code).toUpperCase().replace(/[^A-Z]/g,'').slice(0,5))||'');if(!pt)jr='gone';else if(pt.mem.includes(u))jr='ok';else if(pt.mem.length>=4)jr='full';
    else{leaveParty(P);pt.mem.push(u);pt.t=now;P.party=pt.id;if(pt.pend)delete pt.pend[u];P.inv=P.inv.filter(q=>q.pid!==pt.id);mAdd('party');jr='ok';}}
  else if(a==='mode'){const pt=P.party&&PARTY.get(P.party);if(pt&&pt.lead===u&&MOK(d.m))pt.mode=d.m;}
  else if(a==='acc'){const i=P.inv.find(q=>q.pid===d.pid),pt=i&&PARTY.get(i.pid);P.inv=P.inv.filter(q=>q!==i);if(pt&&pt.mem.length<4&&!pt.mem.includes(u)){leaveParty(P);pt.mem.push(u);pt.t=now;P.party=pt.id;if(pt.pend)delete pt.pend[u];mAdd('party');}}
  else if(a==='dec'){const pt=PARTY.get(d.pid);if(pt&&pt.pend)delete pt.pend[u];P.inv=P.inv.filter(q=>q.pid!==d.pid);}
  else if(a==='leave')leaveParty(P);
  // the leader can end the party for everyone, or take one member out
  else if(a==='end'){const pt=P.party&&PARTY.get(P.party);if(pt&&pt.lead===u){for(const m of pt.mem){const q=PRES.get(m);if(q&&q.party===pt.id)q.party=null;}if(pt.code)PCODE.delete(pt.code);PARTY.delete(pt.id);}}
  else if(a==='kick'&&typeof d.to==='string'){const pt=P.party&&PARTY.get(P.party),T=PRES.get(d.to);if(pt&&pt.lead===u&&d.to!==u&&T&&T.party===pt.id)leaveParty(T);}
  const fr={};for(const id of P.f){const T=PRES.get(id);if(!T||!T.f.has(u))continue;const st=stateOf(T);if(st)fr[id]=st;}
  return {u,k:P.k,players,fr,party:partyView(P),ir,jr,inv:P.inv.map(i=>({pid:i.pid,from:i.from,n:(PRES.get(i.from)||{}).n||''}))};}
setInterval(()=>{const now=Date.now();
  for(const [u,P] of PRES){if(P.room)continue;if(now-P.t>75000&&P.party)leaveParty(P);if(now-P.t>600000){TICK.delete(P.k);PRES.delete(u);}}
  for(const [id,pt] of PARTY)if(pt.mem.length<2&&now-pt.t>180000){for(const u of pt.mem){const q=PRES.get(u);if(q&&q.party===id)q.party=null;}PARTY.delete(id);}
  for(const [c,id] of PCODE)if(!PARTY.has(id))PCODE.delete(c);
  for(const [k,v] of TOK)if(now-v.t>1800000)TOK.delete(k);},30000);

// one-time sign-in hand-off for the iOS home screen app (Google returns into a separate Safari sheet)
const HO=new Map(),RL=new Map(),RS=new Map();setInterval(()=>{const n=Date.now();for(const [k,v] of HO)if(n-v.t>180000)HO.delete(k);for(const [k,v] of RL)if(!v.length||n-v[v.length-1]>60000)RL.delete(k);RS.clear();},30000);
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'};
// LOOP on Sui (devnet): wallets, sponsored gas, signed match results, tournaments. Loaded on the side so the game runs without it.
let SUI=null;import('./sui.mjs').then(m=>{SUI=m;console.log('sui on');}).catch(e=>console.error('sui off',e.message));
function suiHttp(req,res){const J=(c,o)=>{res.writeHead(c,Object.assign({'Content-Type':'application/json'},CORS));res.end(JSON.stringify(o));};
  if(req.method==='OPTIONS'){res.writeHead(204,CORS);res.end();return;}
  if(!SUI){J(503,{err:'Sui is starting, try again in a moment'});return;}
  const u=new URL(req.url,'http://x'),path=u.pathname.replace(/^\/sui\//,''),ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0];
  const go=(f)=>Promise.resolve().then(f).then(o=>J(200,o),e=>J(400,{err:String(e&&e.message||e).slice(0,240)}));
  if(req.method==='GET'){
    if(path==='config'){J(200,SUI.config());return;}
    if(path==='wallet'){go(()=>SUI.wallet(String(u.searchParams.get('a')||'').toLowerCase()));return;}
    if(path==='tours'){go(()=>SUI.tournaments());return;}
    if(path==='board'){J(200,SUI.leaderboard());return;}
    if(path==='epoch'){go(()=>SUI.epoch());return;}
    J(404,{err:'not found'});return;}
  let b='';req.on('data',c=>{b+=c;if(b.length>65536)req.destroy();});req.on('end',()=>{let d={};try{d=JSON.parse(b||'{}');}catch(e){J(400,{err:'bad json'});return;}
    if(path==='salt')go(()=>SUI.salt(d.jwt));else if(path==='prepare')go(()=>SUI.prepare(d,ip));else if(path==='exec')go(()=>SUI.execute(d));else if(path==='admin')go(()=>SUI.adminCall(d));else J(404,{err:'not found'});});}
const srv=http.createServer((req,res)=>{
  if(req.url.startsWith('/sui/')){suiHttp(req,res);return;}
  if(req.url.startsWith('/handoff')){
    if(req.method==='OPTIONS'){res.writeHead(204,CORS);res.end();return;}
    if(req.method==='POST'){let b='';req.on('data',c=>{b+=c;if(b.length>6000)req.destroy();});req.on('end',()=>{let ok=false;try{const d=JSON.parse(b);
        if(/^h[0-9a-f]{32}$/.test(d.id)&&typeof d.tok==='string'&&d.tok.length<4000&&HO.size<2000){HO.set(d.id,{tok:d.tok,t:Date.now()});ok=true;}}catch(e){}
      res.writeHead(ok?200:400,Object.assign({'Content-Type':'application/json'},CORS));res.end(JSON.stringify({ok}));});return;}
    const id=(req.url.split('id=')[1]||'').slice(0,33),v=HO.get(id);if(v)HO.delete(id);
    res.writeHead(200,Object.assign({'Content-Type':'application/json'},CORS));res.end(JSON.stringify(v?{tok:v.tok}:{}));return;}
  if(req.url.startsWith('/room')){
    if(req.method==='OPTIONS'){res.writeHead(204,CORS);res.end();return;}
    const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim(),now=Date.now(),q=(RL.get(ip)||[]).filter(t=>now-t<60000);let out;
    if(q.length>=4)out={err:'Too many invites, wait a minute'};
    else{q.push(now);RL.set(ip,q);let r=null;const mm=(/[?&]m=([dtcf])/.exec(req.url)||[])[1]||'f',nn=Math.min(4,Math.max(2,+((/[?&]n=(\d)/.exec(req.url)||[])[1]||2)));try{r=pickRoom(Math.min(nn,mm==='d'?2:4),mm);}catch(e){console.error('room error',e);}
      if(!r)out={err:'Servers are full, try again soon'};else{for(let i=0;i<Math.min(nn,r.max);i++)r.holds.push(now+HOLDMS);out={code:r.code,hold:HOLDMS/1000,mode:r.mode};mAdd('invites');}}
    res.writeHead(200,Object.assign({'Content-Type':'application/json'},CORS));res.end(JSON.stringify(out));return;}
  if(req.url.startsWith('/soc')){
    if(req.method==='OPTIONS'){res.writeHead(204,CORS);res.end();return;}
    const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim(),c=(RS.get(ip)||0)+1;RS.set(ip,c);
    const send=o=>{res.writeHead(200,Object.assign({'Content-Type':'application/json'},CORS));res.end(JSON.stringify(o));};
    if(req.method!=='POST'||c>90){send({err:c>90?'slow':'post'});return;}
    let b='';req.on('data',x=>{b+=x;if(b.length>16000)req.destroy();});req.on('end',()=>{let d=null;try{d=JSON.parse(b);}catch(e){}if(!d||typeof d!=='object'){send({err:'bad'});return;}
      soc(d).then(send,e=>{console.error('soc error',e);send({err:'fail'});});});return;}
  if(req.url==='/metrics'){mday();res.writeHead(200,Object.assign({'Content-Type':'application/json'},CORS));res.end(JSON.stringify({now:{players,rooms:rooms.length},days:METR}));return;}
  if(req.url==='/status'){res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});
    res.end(JSON.stringify({players,max:MAXROOMS*MAXH+MAXDUEL*2,rooms:rooms.map(r=>Object.assign({id:r.id,humans:r.clients.size,duel:r.duel?1:0,mode:r.mode},r.R.info()))}));return;}
  res.writeHead(200,{'Content-Type':'text/plain'});res.end('Chickageddon server\n');});
const wss=new WebSocketServer({server:srv,path:'/ws',maxPayload:2048});
wss.on('connection',ws=>{
  let room=null,slot=0,count=0,winT=Date.now(),pres=null,spec=null;
  const bye=()=>{if(spec){spec.specs.delete(ws);spec=null;}if(room&&slot){room.clients.delete(slot);room.R.leave(slot);players--;}if(pres&&pres.ws===ws){pres.ws=null;pres.room=null;pres.slot=0;pres.t=Date.now();}pres=null;room=null;slot=0;};
  const no=t=>{ws.send(JSON.stringify({e:[['x',t]]}));ws.close();};
  ws.on('message',data=>{
    const now=Date.now();if(now-winT>1000){winT=now;count=0;}if(++count>240){try{ws.close();}catch(e){}return;}
    let m;try{m=JSON.parse(data.toString());}catch(e){return;}if(!Array.isArray(m))return;
    try{
      // watching: no seat is taken. Only for a signed in player who has a friend (both ways) playing in that room.
      if(m[0]==='sp'){if(room||spec)return;const code=typeof m[1]==='string'?m[1].toUpperCase().replace(/[^A-Z]/g,'').slice(0,4):'',r=rooms.find(q=>q.code===code),P=typeof m[2]==='string'&&TICK.has(m[2])?PRES.get(TICK.get(m[2])):null;
        if(!r||!r.clients.size){no('That match is over');return;}if(!P){no('Sign in to watch a friend');return;}
        let ok=false;for(const id of P.f){const q=PRES.get(id);if(q&&q.room===r&&q.f.has(P.u)){ok=true;break;}}
        if(!ok){no('You can only watch a match a friend is playing');return;}if(r.specs.size>=6){no('Too many people are watching this match');return;}
        spec=r;r.specs.add(ws);mAdd('watch');ws.send(JSON.stringify({e:[r.R.welcome(0),['rc',r.code,r.duel?1:0,r.mode]],u:r.R.snap()}));return;}
      if(spec)return;
      if(m[0]==='j'){if(room)return;let name=String(m[1]||'Yeti').replace(/[^A-Za-z0-9_ ]/g,'').slice(0,14)||'Yeti';const look=(m[2]|0)&7,ver=m[3]|0,cos=(m[6]|0)&65535;
        const code=typeof m[4]==='string'?m[4].toUpperCase().replace(/[^A-Z]/g,'').slice(0,4):'';
        if(code){const r=rooms.find(q=>q.code===code);if(!r||r.clients.size>=r.max){no(r?'That room is full right now':'That room is closed. Ask for a new code');return;}room=r;}
        else room=pickRoom(1,m[5]);
        if(!room){no('Servers are full, try again soon');return;}
        if(ver<5){room=null;no('A new version is out. Close the game and open it again to play online');return;}
        const P=typeof m[7]==='string'&&TICK.has(m[7])?PRES.get(TICK.get(m[7])):null;let pref=-1;
        if(P&&P.party){const pt=PARTY.get(P.party);if(pt)for(const u of pt.mem){const q=PRES.get(u);if(q&&q!==P&&q.room===room&&q.slot){pref=q.slot<=4?0:1;break;}}}
        ws.addr=typeof m[9]==='string'&&/^0x[0-9a-f]{64}$/.test(m[9])?m[9]:'';ws.pname=name;slot=room.R.join(name,look,cos,pref,Math.min(999,Math.max(0,(m[8]|0)||(P?P.lvl|0:0))));if(!slot){room=null;no('Room is full, try again');return;}
        if(code&&room.holds.length)room.holds.shift();
        room.clients.set(slot,ws);players++;if(P){if(P.ws&&P.ws!==ws){try{P.ws.close();}catch(e){}}pres=P;P.ws=ws;P.room=room;P.slot=slot;P.t=now;}
        {const md=mday();md.joins++;if(players>md.peak)md.peak=players;if(room.duel)md.duel++;if(room.mode==='t')md.team=(md.team||0)+1;if(room.mode==='c')md.ctf=(md.ctf||0)+1;if(code)md.code++;mDirty=true;}
        ws.send(JSON.stringify({e:[room.R.welcome(slot),['rc',room.code,room.duel?1:0,room.mode]],u:room.R.snap()}));if(room.duel&&room.clients.size===2)room.R.restart();}
      else if(room)room.R.msg(slot,m);
    }catch(e){console.error('msg error',e);}
  });
  ws.on('close',bye);ws.on('error',()=>{});
});

let last=process.hrtime.bigint(),tickN=0;
setInterval(()=>{const now=process.hrtime.bigint();let dt=Number(now-last)/1e9;last=now;if(dt>.05)dt=.05;tickN++;
  for(let i=rooms.length-1;i>=0;i--){const r=rooms[i];
    if(!r.clients.size){if(r.specs.size){for(const w of r.specs){try{w.send(JSON.stringify({e:[['x','The players left that match']]}));w.close();}catch(e){}}r.specs.clear();}r.idle=(r.idle||0)+dt;if(r.idle>60&&(r.mode!=='f'||rooms.filter(q=>q.mode==='f').length>1)&&!held(r)){rooms.splice(i,1);}continue;}r.idle=0;
    try{r.R.tick(dt);}catch(e){console.error('tick error room',r.id,e);continue;}
    // players who stood still too long go out, a bot takes the seat
    {const ks=r.R.kicks();if(ks)for(const s of ks){const w=r.clients.get(s);if(!w)continue;mAdd('afk');try{w.send(JSON.stringify({e:[['x','You were taken out for standing still. Jump back in when you are ready']]}));w.close();}catch(e){}}}
    const ev=r.R.drain(),snap=tickN%3===0;if(!ev&&!snap)continue;if(ev)for(const e of ev)if(e[0]==='en'){mAdd('matches');if(SUI){try{const rs=r.R.results();for(const q of rs){const w=r.clients.get(q.slot);if(w&&w.addr)SUI.recordResult(w.addr,{kills:q.kills,deaths:q.deaths,won:q.won,name:w.pname,map:q.map});}}catch(err){console.error('results',err.message);}}}
    const o={};if(ev)o.e=ev;if(snap)o.u=r.R.snap();const s=JSON.stringify(o);
    for(const w of r.clients.values())if(w.readyState===1&&w.bufferedAmount<262144)w.send(s);
    for(const w of r.specs)if(w.readyState===1&&w.bufferedAmount<262144)w.send(s);}
},1000/60);
rooms.push(makeRoom(nextId++,0,'f'));
srv.listen(PORT,process.env.HOST||'127.0.0.1',()=>console.log('loop server on',PORT));
