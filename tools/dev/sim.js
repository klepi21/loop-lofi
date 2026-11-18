// full bot matches on one map in the three main modes, as fast as the machine allows: AI=<map index> node sim.js
// Looks for bots that get stuck, end up inside a wall or outside the arena.
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:900,height:500});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2600);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(300);
 for(const mode of ['f','t','c']){const r=await p.evaluate((mode,AI)=>{buildWorld(AI);MODE=mode;startMatch();const dt=1/30;let steps=0,stuck=0,moved=new Array(8).fill(0),last=chickens.map(c=>[c.x,c.z]);
   while(state==='play'&&steps<7000){steps++;player.isP=false;timeNow+=dt;update(dt,timeNow);updateCamera(timeNow,dt);
     if(steps%90===0)chickens.forEach((c,i)=>{const d=Math.hypot(c.x-last[i][0],c.z-last[i][1]);moved[i]+=d;if(c.alive&&d<.3)stuck++;last[i]=[c.x,c.z];});}
   player.isP=true;clearTimeout(overT);const out={steps,arena:AR.name,kills:chickens.map(c=>c.kills),caps:CAPS.slice(),stuck,moved:moved.map(v=>Math.round(v)),insideSolid:chickens.filter(c=>c.alive&&pointSolid(c.x,c.y+.2,c.z)).length,outside:chickens.filter(c=>Math.hypot(c.x,c.z)>28.2).length,roof:chickens.filter(c=>c.y>2).length};showMenu();return out;},mode,+process.env.AI);
  console.log(mode,JSON.stringify(r));}
 await b.close();process.exit(0);})();
