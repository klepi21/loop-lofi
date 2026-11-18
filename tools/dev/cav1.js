// chicken cavalry: SIM=1 fast matches per difficulty with a simple sword player; otherwise photos of the riders and a live fight
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 if(process.env.SIM){await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(200);
  for(const df of [0,1,2])for(const ar of [0,4]){const r=await p.evaluate((df,ar)=>{diff=df;buildWorld(ar);vSel=true;MODE='v';startMatch();const dt=1/30;let n=0,aliveT=0,blocks=0;
    while(state==='play'&&n<30*178){n++;timeNow+=dt;cdT=0;
      let t=null,td=1e9;for(const c of chickens){if(c.isP||!c.alive||c.hidden||c.invuln>0)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<td){td=d;t=c;}}
      keys.KeyW=false;keys.ShiftLeft=false;mouseFire=false;adsW=false;
      if(t&&player.alive){player.aimYaw=Math.atan2(t.x-player.x,t.z-player.z)+rand(-.1,.1);player.aimPitch=0;if(td>1.6)keys.KeyW=true;if(td>5&&td<14)keys.ShiftLeft=true;mouseFire=td<2.6;
        let thr=false;for(const c of chickens)if(!c.isP&&c.alive&&c.swing>.6&&Math.hypot(c.x-player.x,c.z-player.z)<3)thr=true;if(thr&&Math.random()<.5){adsW=true;mouseFire=false;}}
      else keys.KeyW=true;
      if(player.blk)blocks++;
      update(dt,timeNow);updateCamera(timeNow,dt);if(player.alive)aliveT+=dt;}
    let k=0;for(const c of chickens)if(!c.isP)k+=c.kills;return {diff:df,arena:AR.name,you:player.kills+'/'+player.deaths,bots:k,perBotMin:+(k/7/(n*dt/60)).toFixed(1),alive:+(aliveT/(n*dt)).toFixed(2)};},df,ar);
   console.log(JSON.stringify(r));await p.evaluate(()=>{clearTimeout(overT);showMenu();});}
  await b.close();process.exit(0);}
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro{display:none!important}'});
 await p.evaluate(()=>{vSel=true;prcSync();});
 console.log('practice',await p.evaluate(()=>$('prcm').textContent+' | '+[...$('prck').children].map(b=>b.textContent+(b.classList.contains('sel')?'*':'')).join(',')));
 await p.evaluate(()=>{MODE='v';startMatch();});await sleep(4500);
 // line up three riders in front of the camera: one resting, one swinging, one blocking
 await p.evaluate(()=>{const bs=chickens.filter(c=>!c.isP);for(const c of bs.slice(3)){c.alive=false;c.hidden=true;}
   window.__k=setInterval(()=>{cdT=0;player.invuln=1;player.x=0;player.z=9;player.y=0;player.vx=player.vz=0;player.aimYaw=Math.PI;player.aimPitch=-.05;
     fp=true;bs.slice(0,3).forEach((c,i)=>{c.alive=true;c.hidden=false;c.x=-2.2+i*2.2;c.z=5.2;c.y=0;c.vx=c.vz=0;c.vy=0;c.onG=true;c.aimYaw=c.yaw=i===1?-1.2:i===2?.5:1.9;c.invuln=0;c.spawnT=0;c.fire=false;c.thinkT=9;c.blkT=i===2?1:0;c.blk=i===2;if(i===1)c.swing=(performance.now()/600)%1;});},5);});
 await sleep(1200);await p.screenshot({path:OUT+'cav_line.jpg',type:'jpeg',quality:85});
 await p.evaluate(()=>{clearInterval(window.__k);fp=false;for(const c of chickens){if(!c.isP){c.hidden=false;c.alive=false;respawn(c);}}});
 await p.evaluate(()=>{window.__a=setInterval(()=>{if(state!=='play')return;player.invuln=1;let n=null,nd=1e9;for(const c of chickens){if(c.isP||!c.alive||c.hidden)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<nd){nd=d;n=c;}}
   if(n){player.aimYaw=Math.atan2(n.x-player.x,n.z-player.z);player.aimPitch=-.1;keys.KeyW=nd>1.6;mouseFire=nd<2.6;}},30);});
 for(let i=0;i<4;i++){await sleep(1800);await p.screenshot({path:OUT+'cav_'+i+'.jpg',type:'jpeg',quality:80});}
 console.log('live',await p.evaluate(()=>'player kills '+player.kills+' score '+score+' feed '+[...document.querySelectorAll('#feed > *')].map(e=>e.textContent).join(' | ')));
 await b.close();process.exit(0);})();
