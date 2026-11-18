// joust: SIM=1 fast matches per difficulty with a simple charging player (rounds, scores, errors); otherwise photos of the lane, the line up and a live charge
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 if(process.env.SIM){await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(200);
  for(const df of [0,1,2]){const r=await p.evaluate(df=>{diff=df;vSel=true;MODE='v';startMatch();const dt=1/30;let n=0,rounds=[],last=0,lens=[],rs=0;
    while(state==='play'&&n<30*600){n++;timeNow+=dt;
      let t=null,td=1e9;for(const c of chickens){if(c.team===player.team||!c.alive||c.hidden)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<td){td=d;t=c;}}
      keys.KeyW=false;mouseFire=false;adsW=false;
      if(t&&player.alive&&cdT<=.3){const want=Math.atan2(t.x-player.x,t.z-player.z)+rand(-.08,.08);player.aimYaw+=clamp(angDiff(player.aimYaw,want),-3*dt,3*dt);keys.KeyW=true;mouseFire=td<25;}
      const w=JR.w[0]+JR.w[1];if(JR.n!==last){if(last)lens.push(+((n*dt-rs)).toFixed(1));rs=n*dt;last=JR.n;}
      update(dt,timeNow);updateCamera(timeNow,dt);}
    let k=0;for(const c of chickens)if(!c.isP)k+=c.kills;return {diff:df,state,score:JR.w.join(':'),myTeam:player.team,rounds:JR.n,roundSecs:lens,you:player.kills+'/'+player.deaths,botKills:k,mins:+(n*dt/60).toFixed(1)};},df);
   console.log(JSON.stringify(r));await p.evaluate(()=>{clearTimeout(overT);showMenu();});}
  await b.close();process.exit(0);}
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro{display:none!important}'});
 await p.evaluate(()=>{vSel=true;prcSync();});
 console.log('arena',await p.evaluate(()=>AR.name+' NAR '+NAR+' JA '+JA));
 await p.evaluate(()=>{MODE='v';startMatch();introSkipNow&&introSkipNow();});await sleep(500);
 await p.screenshot({path:OUT+'joust_intro.jpg',type:'jpeg',quality:80});await sleep(3600);
 await p.screenshot({path:OUT+'joust_line.jpg',type:'jpeg',quality:80});
 await p.evaluate(()=>{window.__a=setInterval(()=>{if(state!=='play'||!player.alive)return;keys.KeyW=true;mouseFire=true;},30);});
 for(let i=0;i<4;i++){await sleep(1100);await p.screenshot({path:OUT+'joust_'+i+'.jpg',type:'jpeg',quality:80});}
 console.log('live',await p.evaluate(()=>'round '+JR.n+' score '+JR.w.join(':')+' player alive '+player.alive+' hp '+Math.round(player.hp)+' feed '+[...document.querySelectorAll('#feed > *')].map(e=>e.textContent).join(' | ')));
 await b.close();process.exit(0);})();
