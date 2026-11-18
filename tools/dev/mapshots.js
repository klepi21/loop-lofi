// photos of one map from several places: AI=<map index> PF=<file prefix> node mapshots.js
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.addStyleTag({content:'#game,#menu,.hud,#hurt,#yolk,#toast,#upd,#over,#pause,#intro{display:none!important}'});
 await p.evaluate(ai=>{buildWorld(ai);MODE='f';startMatch();fp=true;},+process.env.AI);
 console.log('arena',await p.evaluate(()=>AR.name+' | solids '+solids.length+' pots '+pots.length+' pickups '+pickups.length+' bases '+JSON.stringify(BASES.map(b=>b.map(v=>Math.round(v))))+' lights '+LIGHTS.length+' logos '+(typeof decCount==='number'?decCount/6:0)+' texture '+!!decTex));
 const views=JSON.parse(process.env.VIEWS||'[["south",0,26,7,-0.25],["north",0,-26,7,-0.25],["east",26,2,5,-0.18],["ground",-9,17,0.3,0.12],["kiosk",-20,-18,3,-0.08],["high",18,-20,16,-0.5]]');
 for(const [n,x,z,y,pit,yaw] of views){await p.evaluate((x,z,y,pit,yaw)=>{clearInterval(window.__pin);window.__pin=setInterval(()=>{cdT=0;matchT=170;player.x=x;player.z=z;player.y=y;player.vx=player.vy=player.vz=0;player.aimYaw=yaw===undefined||yaw===null?Math.atan2(-x,-z):yaw;player.aimPitch=pit;player.hp=100;player.invuln=2;},5);},x,z,y,pit,yaw);
  await sleep(1800);await p.screenshot({path:OUT+process.env.PF+'_'+n+'.jpg',type:'jpeg',quality:80,clip:{x:0,y:0,width:1280,height:470}});}
 await b.close();process.exit(0);})();
