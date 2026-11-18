// popcorn moon: SIM=1 plays fast bot matches and reports; otherwise screenshots of a live match.
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200));});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 if(process.env.SIM){await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(300);
  for(const ar of [0,3,6]){const r=await p.evaluate(ar=>{buildWorld(ar);pSel=true;zSel=false;MODE='p';startMatch();const dt=1/30;let steps=0,maxK=0,maxY=0,airT=0,eggs=0;
    while(state==='play'&&steps<30*60*4){steps++;timeNow+=dt;cdT=0;player.invuln=1;
      update(dt,timeNow);updateCamera(timeNow,dt);if(kernels.length>maxK)maxK=kernels.length;eggs+=nades.length;
      for(const c of chickens){if(c.alive&&!c.hidden&&!c.isP){if(c.y>maxY)maxY=c.y;if(!c.onG)airT+=dt;}}}
    let k=0,d=0;for(const c of chickens)if(!c.isP){k+=c.kills;d+=c.deaths;}
    const out={arena:AR.name,sec:Math.round(steps/30),state,botKills:k,botDeaths:d,maxKernels:maxK,maxY:+maxY.toFixed(1),airShare:+(airT/(steps*dt*7)).toFixed(2),nades:eggs,dogs:dogs.length,grav:GV(),eggsHeld:chickens.map(c=>c.eggs).join('')};
    clearTimeout(overT);showMenu();out.after=MODE+' g'+GV();return out;},ar);console.log(JSON.stringify(r));}
  await b.close();process.exit(0);}
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro{display:none!important}'});
 await p.evaluate(()=>{pSel=true;zSel=false;prcSync();});
 console.log('practice label',await p.evaluate(()=>$('prcm').textContent+' | '+[...$('prck').children].map(b=>b.textContent+(b.classList.contains('sel')?'*':'')).join(',')));
 await p.evaluate(()=>{MODE='p';startMatch();});await sleep(5000);
 await p.evaluate(()=>{window.__a=setInterval(()=>{if(state!=='play')return;player.invuln=1;let n=null,nd=1e9;for(const c of chickens){if(c.isP||!c.alive||c.hidden)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<nd){nd=d;n=c;}}
   if(n){player.aimYaw=Math.atan2(n.x-player.x,n.z-player.z);player.aimPitch=Math.atan2(n.y-player.y-.3,nd);mouseFire=true;if(player.onG&&Math.random()<.05)player.jumpQ=.1;}},30);});
 for(let i=0;i<6;i++){await sleep(1500);await p.screenshot({path:OUT+'pop_'+i+'.jpg',type:'jpeg',quality:80});}
 console.log('live',await p.evaluate(()=>'kernels '+kernels.length+' booms '+booms.length+' player kills '+player.kills+' score '+score));
 await b.close();process.exit(0);})();
