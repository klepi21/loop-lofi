// popcorn moon: photos of the popcorn explosion over time, plus a fast bot match for errors
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro{display:none!important}'});
 await p.evaluate(()=>{pSel=true;MODE='p';startMatch();});await sleep(4500);
 await p.evaluate(()=>{for(const c of chickens)if(!c.isP){c.alive=false;c.hidden=true;}window.__k=setInterval(()=>{player.invuln=1;player.x=0;player.z=10;player.y=0;player.vx=player.vz=0;player.aimYaw=Math.PI;player.aimPitch=.05;},5);});
 await sleep(500);
 await p.evaluate(()=>{popBoom(0,.05,1,null);});
 for(const [i,ms] of [[0,90],[1,150],[2,300],[3,500]]){await sleep(ms);await p.screenshot({path:OUT+'popboom_'+i+'.jpg',type:'jpeg',quality:80});}
 await p.evaluate(()=>{clearInterval(window.__k);window.requestAnimationFrame=()=>0;});await sleep(200);
 const r=await p.evaluate(()=>{clearTimeout(overT);showMenu();buildWorld(2);pSel=true;MODE='p';startMatch();const dt=1/30;let n=0,maxP=0;while(state==='play'&&n<30*60*3){n++;timeNow+=dt;cdT=0;player.invuln=1;update(dt,timeNow);if(pbs.length>maxP)maxP=pbs.length;}
   let k=0;for(const c of chickens)if(!c.isP)k+=c.kills;return {arena:AR.name,state,botKills:k,maxPieces:maxP,left:pbs.length};});
 console.log(JSON.stringify(r));await b.close();process.exit(0);})();
