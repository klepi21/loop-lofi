/* Runs INSIDE the game script scope on the server (appended to the game code).
   Exposes globalThis.ROOM for server.js. One vm context = one room. */
(()=>{
Q=Object.assign({},QL[QL.length-1],{p:0});fxOff=true;
const OUT=[];EV=e=>OUT.push(e);
chickens.push(setLook(mk('',ROSTER[0].col,ROSTER[0].col2,1),ROSTER[0]));
chickens.forEach((c,i)=>{c.slot=i;c.net=false;c.look=(i+7)%8;c.life=0;c.credits=0;c.lastShot=0;c.pname='';c.cos=0;c.bcos=0;});
let T=0,wasOver=false,overClock=0,nextArena=0,DUEL=false,cands=[],votes={},locked=false;const GAP=30,LATE=40,LOCK=5,IDLEK=21,KICK=[];
// seats without a real player are played by the computer under a name that reads like a player's, so a room is never empty
const BN1='Kostas Nikos Giorgos Yannis Dimitris Panos Stavros Thanos Vasilis Manos Petros Tasos Makis Stelios Lefteris Maria Eleni Katerina Sofia Anna Dora Ioanna Alex Chris Mike Leo Max Luca Jack Emma Mia Noah Liam Tom Ben Ivan Omar Kai Sam Nick Jim Tony Marco Pablo Hugo Lena Nina Zoe'.split(' ');
const BN2='yeti frost blizzard avalanche glacier sherpa momo icepick snow leopard ninja wolf sniper shadow gamer king boss legend beast hawk fox panda turbo ghost viper rocket pixel noob pro chill lofi'.split(' ');
const BN3='Dark Pro Big Lil Mad Fast Lazy Crazy Angry Epic Mega Super Silent Lucky'.split(' ');
function botName(){const pk=l=>l[Math.floor(Math.random()*l.length)],cap=w=>w[0].toUpperCase()+w.slice(1),num=()=>Math.random()<.5?String(Math.random()<.5?85+Math.floor(Math.random()*15):Math.floor(Math.random()*12)).padStart(2,'0'):String(1+Math.floor(Math.random()*999));
  for(let k=0;k<40;k++){const r=Math.random();let n;
    if(r<.3){n=pk(BN1)+num();if(Math.random()<.35)n=n.toLowerCase();}
    else if(r<.45)n=(pk(BN1)+'_'+pk(BN2)).toLowerCase();
    else if(r<.65)n=pk(BN3)+cap(pk(BN2))+(Math.random()<.3?num():'');
    else if(r<.75)n=pk(BN2)+num();
    else if(r<.83)n='xX'+pk(BN2)+'Xx';
    else if(r<.93)n=pk(BN1)+'ABDGKLMNPST'[Math.floor(Math.random()*11)];
    else n=pk(BN1).toLowerCase()+(Math.random()<.5?'_sui':'SUI');
    if(!/^[A-Za-z0-9_]{3,14}$/.test(n)||nameBad(n))continue;const l=n.toLowerCase();if(chickens.some(c=>String(c.name||'').toLowerCase()===l||String(c.bname||'').toLowerCase()===l))continue;return n;}
  return 'Yeti'+(100+Math.floor(Math.random()*900));}
// between matches a few of these seats change name, the way players come and go
function botNames(all){for(let i=1;i<chickens.length;i++){const c=chickens[i];if(!c.bname||all||(!c.net&&Math.random()<.3))c.bname=botName();}}
// 1 v 1 rooms: only seats 1 and 2 play, the other six chickens stay switched off
function hideOff(){if(!DUEL)return;for(let i=3;i<chickens.length;i++){const c=chickens[i];c.off=true;c.hidden=true;c.alive=false;c.deadT=0;}}
// three maps to vote on in the break; the first one is the default if nobody votes
function pickCands(){const pool=[];for(let i=0;i<NAR;i++)if(i!==arenaI)pool.push(i);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),t=pool[i];pool[i]=pool[j];pool[j]=t;}cands=pool.slice(0,3);votes={};locked=false;nextArena=cands[0];}
function tally(){const n=[0,0,0];for(const s in votes){const c=chickens[s],v=votes[s];if(c&&c.net&&v>=0&&v<cands.length)n[v]++;}return n;}
function lockVote(){locked=true;const n=tally(),mx=Math.max(n[0],n[1],n[2]),best=[];for(let i=0;i<cands.length;i++)if(n[i]===mx)best.push(i);nextArena=cands[best[Math.floor(Math.random()*best.length)]];OUT.push(['vw',nextArena]);}
// the bots' skill follows the average level of the real players in the room, worked out again whenever someone joins or leaves
function roomLvl(){const L=[];for(let i=1;i<chickens.length;i++){const c=chickens[i];if(c.net&&c.lvl>0)L.push(c.lvl);}RLVL=L.length?L.reduce((a,b)=>a+b,0)/L.length:8;botSkills();}
function hidePlayer(){player.hidden=true;player.alive=false;}
function applyRoster(){for(let i=1;i<chickens.length;i++){const c=chickens[i];setLook(c,ROSTER[c.look%8]);setCos(c,c.net?c.cos:c.bcos);c.name=c.net?c.pname:c.bname||c.name;}}
function rosterList(){const r=[];for(let i=1;i<chickens.length;i++){const c=chickens[i];r.push([i,c.name,c.look%8,c.net?0:1,c.off?1:0,cosPack({h:c.hat|0,o:c.fit|0,e:c.egg|0,p:c.pan|0})]);}return r;}
function newMatch(arena){OUT.push(['st',arena,180,3.3]);if(arenaI!==arena)buildWorld(arena);for(const c of chickens){c.late=false;if(!c.net)c.bcos=botCos();}botNames(false);pickCands();startMatch();if(typeof __MATCHT==='number')matchT=__MATCHT;hidePlayer();hideOff();applyRoster();OUT.push(['ro',rosterList()]);wasOver=false;overClock=0;}
function num(v){return typeof v==='number'&&isFinite(v);}
globalThis.ROOM={
  bots(){return {lvl:RLVL,seats:chickens.slice(1).map(c=>[c.net?'human':'bot',c.lvl|0,+(c.skill||0).toFixed(2),c.team])};},
  humans(){let n=0;for(let i=1;i<chickens.length;i++)if(chickens[i].net)n++;return n;},
  init(arena,mode){MODE=mode==='d'||mode==='t'||mode==='c'?mode:'f';DUEL=MODE==='d';buildWorld(arena%NAR);for(const c of chickens)c.bcos=botCos();botNames(true);pickCands();startMatch();if(typeof __MATCHT==='number')matchT=__MATCHT;hidePlayer();hideOff();applyRoster();OUT.length=0;},
  restart(){if(state==='play')newMatch(arenaI);},
  // pref: 0 or 1 to sit with party friends on that team, anything else lets the room balance the teams
  join(name,look,cos,pref,lvl){if(nameBad(name))name='Yeti'+(100+Math.floor(Math.random()*900));const free=[];for(let i=1;i<chickens.length;i++)if(!chickens[i].net&&!chickens[i].off)free.push(i);if(!free.length)return 0;let pool=free;
    if(teamM()){const h=[0,0];for(let i=1;i<chickens.length;i++)if(chickens[i].net)h[i<=4?0:1]++;const t=pref===0||pref===1?pref:h[0]<h[1]?0:h[1]<h[0]?1:Math.floor(Math.random()*2),q=free.filter(i=>(i<=4?0:1)===t);if(q.length)pool=q;}
    const s=pool[Math.floor(Math.random()*pool.length)],c=chickens[s];c.net=true;c.pname=name;c.look=look%8;c.cos=cos|0;setLook(c,ROSTER[c.look]);setCos(c,c.cos);c.name=name;c.kills=0;c.deaths=0;c.streak=0;c.credits=0;c.fire=false;c.wx=c.wz=0;c.route=null;
    c.lvl=lvl>0?Math.min(999,lvl|0):0;roomLvl();c.idleT=0;c.iyaw=1e9;c.ipit=0;c.alive=false;c.deadT=0;c.late=!DUEL&&state==='play'&&matchT<LATE;if(state==='play'&&!c.late)respawn(c);OUT.push(['ro',rosterList()]);return s;},
  welcome(s){const late=!!chickens[s].late&&state==='play';return ['w',s,arenaI,r2(matchT),r2(cdT),late?'over':state,rosterList(),nextArena,r2(late?matchT+GAP:Math.max(0,GAP-overClock)),late?1:0,MODE,state==='over'?cands:[],tally(),locked?nextArena:-1];},
  leave(s){const c=chickens[s];if(!c||!c.net)return;c.net=false;c.lvl=0;roomLvl();c.late=false;c.cos=0;c.look=(s+7)%8;setLook(c,ROSTER[c.look]);setCos(c,c.bcos);c.bname=botName();c.name=c.bname;c.kills=0;c.deaths=0;c.streak=0;if(s in votes){delete votes[s];if(state==='over'&&!locked)OUT.push(['vt',tally()]);}OUT.push(['ro',rosterList()]);},
  msg(s,m){const c=chickens[s];if(!c||!c.net||!Array.isArray(m))return;const k=m[0];
    if(k==='v'){if(state==='over'&&!locked){const i=m[1]|0;if(i>=0&&i<cands.length&&votes[s]!==i){votes[s]=i;OUT.push(['vt',tally()]);}}return;}
    if(c.late)return;
    if(k==='p'){if(m[1]!==c.life||!c.alive||state!=='play')return;for(let i=2;i<=9;i++)if(!num(m[i]))return;
      let x=m[2],z=m[4];const d=Math.hypot(x,z);if(d>R+3){x*=(R+3)/d;z*=(R+3)/d;}
      c.x=x;c.y=clamp(m[3],-2,60);c.z=z;c.vx=clamp(m[5],-40,40);c.vy=clamp(m[6],-60,40);c.vz=clamp(m[7],-40,40);c.aimYaw=c.yaw=m[8];c.aimPitch=clamp(m[9],-1.3,1.3);c.onG=!!(m[10]&2);c.sprint=!!(m[10]&4);
      // a new life starts with a new aim: that is the respawn, not the player
      if(c.ilife!==m[1]){c.ilife=m[1];c.iyaw=m[8];c.ipit=m[9];}
      if((m[10]&8)||Math.abs(m[8]-c.iyaw)>.03||Math.abs(m[9]-c.ipit)>.03){c.iyaw=m[8];c.ipit=m[9];c.idleT=0;}}
    else if(k==='rs'){if(!c.alive&&!c.late)c.wantR=true;}
    else if(k==='s'){if(!c.alive||state!=='play'||cdT>.3)return;for(let i=1;i<=6;i++)if(!num(m[i]))return;if(T-c.lastShot<.05)return;c.lastShot=T;c.idleT=0;
      if(Math.hypot(m[1]-c.x,m[3]-c.z)>4)return;c.credits=Math.min(40,c.credits+1);c.recoil=1;OUT.push(['s',s,m[1],m[2],m[3],m[4],m[5],m[6]]);}
    else if(k==='h'){const v=chickens[m[1]|0];if(!c.alive||!v||v===c||!m[1]||!v.alive||v.hidden||c.credits<1||state!=='play')return;c.credits--;
      const dx=num(m[3])?clamp(m[3],-1,1):0,dz=num(m[4])?clamp(m[4],-1,1):0;if(Math.hypot(v.x-c.x,v.z-c.z)>95)return;damage(v,m[2]?26:12,c,dx,dz,!!m[2]);}
    else if(k==='o'){const p=pots[m[1]|0];if(!c.alive||!p||!p.alive||c.credits<1)return;c.credits--;p.hp--;if(p.hp<=0){p.alive=false;p.resp=20;}}
    else if(k==='hd'){if(!c.alive||c.credits<1||state!=='play')return;let d=null;for(const q of dogs)if(q.o.slot===(m[1]|0))d=q;if(!d||d.o===c||ally(c,d.o))return;c.credits--;dogHurt(d,12,c);}
    else if(k==='g'){if(!(c.eggs>0)||!c.alive||state!=='play'||cdT>.3)return;for(let i=1;i<=3;i++)if(!num(m[i]))return;let vx=m[1],vy=m[2],vz=m[3];const l=Math.hypot(vx,vy,vz);if(l>34){vx*=34/l;vy*=34/l;vz*=34/l;}
      c.eggs--;c.idleT=0;nades.push({x:c.x+Math.sin(c.aimYaw)*.55,y:c.y+1,z:c.z+Math.cos(c.aimYaw)*.55,vx,vy,vz,o:c,fuse:1.7});}
  },
  tick(dt){T+=dt;update(dt,T);hidePlayer();hideOff();
    // a player who gives no input for IDLEK seconds while alive in a running match is taken out (not in 1 v 1 rooms)
    if(state==='play'&&cdT<=.3&&!DUEL)for(let i=1;i<chickens.length;i++){const c=chickens[i];if(!c.net||c.late||!c.alive)continue;c.idleT=(c.idleT||0)+dt;if(c.idleT>IDLEK){c.idleT=0;KICK.push(i);}}
    if(state==='over'){if(!wasOver){wasOver=true;overClock=0;votes={};locked=false;OUT.push(['en',nextArena,GAP,cands]);}overClock+=dt;if(!locked&&overClock>GAP-LOCK)lockVote();if(overClock>GAP)newMatch(nextArena);}},
  snap(){const cs=[];for(let i=1;i<chickens.length;i++){const c=chickens[i];
      cs.push([i,r2(c.x),r2(c.y),r2(c.z),r3(c.aimYaw),r3(c.aimPitch),r2(c.vx),r2(c.vy),r2(c.vz),(c.alive?1:0)|(c.onG?2:0)|(c.sprint?4:0)|(c.invuln>0?8:0),Math.max(0,Math.round(c.hp)),c.shield|0,c.kills|0,c.deaths|0,c.eggs|0,c.rapidT>0?r2(c.rapidT):0]);}
    const n=[],no=[];for(const g of nades){n.push(r2(g.x),r2(g.y),r2(g.z));no.push(g.o?g.o.slot|0:0);}let pk=0,pt=0;pickups.forEach((p,i)=>{if(p.active)pk|=1<<i;});pots.forEach((p,i)=>{if(p.alive)pt|=1<<i;});
    const dg=[];for(const d of dogs)dg.push(d.o.slot,r2(d.x),r2(d.y),r2(d.z),r3(d.yaw),Math.max(0,Math.round(d.hp)));
    let ct=0;if(MODE==='c'){ct=[];for(const e of EGGS)ct.push(e.st,r2(e.x),r2(e.y),r2(e.z),e.by?e.by.slot|0:0);ct.push(CAPS[0],CAPS[1]);}
    return [r2(matchT),cs,n,pk,pt,dg,no,ct];},
  kicks(){if(!KICK.length)return null;const k=KICK.slice();KICK.length=0;return k;},
  drain(){if(!OUT.length)return null;const o=OUT.slice();OUT.length=0;return o;},
  info(){return {arena:arenaI,state,t:Math.round(matchT),mode:MODE};}
};
})();
