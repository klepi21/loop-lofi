// joust balance probe: player stands still (or charges with P=1); logs hits with closing speed, team kills, bot sprint share
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(200);
 const r=await p.evaluate(P=>{diff=1;vSel=true;MODE='v';startMatch();const dt=1/30;let n=0,spr=[0,0],tot=[0,0],hits=[],tk=[0,0],blk=0;
  const od=damage;window.damage=(v,a,att,dx,dz,h)=>{hits.push([att.team,Math.round(a)]);od(v,a,att,dx,dz,h);};
  const ok=kill;window.kill=(v,att,...q)=>{if(att)tk[att.team]++;ok(v,att,...q);};
  while(state==='play'&&n<30*400){n++;timeNow+=dt;keys.KeyW=!!P;mouseFire=!!P;
    if(P&&player.alive){let t=null,td=1e9;for(const c of chickens){if(c.team===player.team||!c.alive)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<td){td=d;t=c;}}if(t)player.aimYaw=Math.atan2(t.x-player.x,t.z-player.z);}
    update(dt,timeNow);if(cdT<=.3)for(const c of chickens)if(!c.isP&&c.alive){tot[c.team]++;if(c.sprint)spr[c.team]++;if(c.blk)blk++;}}
  const avg=t=>{const h=hits.filter(x=>x[0]===t);return h.length+' hits avg '+(h.reduce((a,x)=>a+x[1],0)/(h.length||1)).toFixed(0);};
  return {score:JR.w.join(':'),rounds:JR.n,teamKills:tk,red:avg(0),blue:avg(1),sprintShare:[+(spr[0]/tot[0]).toFixed(2),+(spr[1]/tot[1]).toFixed(2)],skills:chickens.map(c=>c.team+':'+(c.skill||0).toFixed(2)).join(' '),you:player.kills+'/'+player.deaths};},+(process.env.P||0));
 console.log(JSON.stringify(r));await b.close();process.exit(0);})();
