// popcorn moon kill rate: fast 3 minute matches on Normal with a simple aiming player (noisy aim, jumps, fires at the nearest bot)
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(200);
 const mode=process.env.M||'p';await p.evaluate(d=>{window.__D=d;},+(process.env.D||1));
 for(const ar of [0,2,5]){const r=await p.evaluate((ar,mode)=>{diff=+(window.__D||0);buildWorld(ar);pSel=mode==='p';MODE=mode;startMatch();const dt=1/30;let n=0,shots=0,aliveT=0,life=0,quick=0,was=true;
   while(state==='play'&&n<30*178){n++;timeNow+=dt;cdT=0;
     let t=null,td=1e9;for(const c of chickens){if(c.isP||!c.alive||c.hidden)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<td&&los(player,c)){td=d;t=c;}}
     keys.KeyW=false;mouseFire=false;
     if(t&&player.alive){const e=.05;player.aimYaw=Math.atan2(t.x-player.x,t.z-player.z)+rand(-e,e);player.aimPitch=Math.atan2(t.y-player.y-.2,td)+rand(-e,e);xt=null;mouseFire=true;if(td>14)keys.KeyW=true;if(player.onG&&Math.random()<.04)player.jumpQ=.1;}
     else keys.KeyW=true;
     update(dt,timeNow);updateCamera(timeNow,dt);if(player.alive){aliveT+=dt;life+=dt;}else if(was){if(life<3)quick++;life=0;}was=player.alive;}
   let k=0;for(const c of chickens)if(!c.isP)k+=c.kills;return {arena:AR.name,you:player.kills+'/'+player.deaths,bots:k,perBotMin:+(k/7/(n*dt/60)).toFixed(1),youMin:+(player.kills/(n*dt/60)).toFixed(1),alive:+(aliveT/(n*dt)).toFixed(2),diedWithin3s:quick};},ar,mode);
  console.log(mode,JSON.stringify(r));await p.evaluate(()=>{clearTimeout(overT);showMenu();});}
 await b.close();process.exit(0);})();
