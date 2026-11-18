// popcorn moon: close-up of a popcorn shot held in front of the camera
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro{display:none!important}'});
 await p.evaluate(()=>{pSel=true;MODE='p';startMatch();});await sleep(4500);
 await p.evaluate(()=>{for(const c of chickens)if(!c.isP){c.alive=false;c.hidden=true;}
   window.__k=setInterval(()=>{player.invuln=1;player.x=0;player.z=8;player.y=0;player.aimYaw=Math.PI;player.aimPitch=0;
     kernels.length=0;for(const [dx,dy] of [[-.5,0],[.5,.15]])kernels.push({x:cam.x+Math.sin(player.aimYaw)*2.2+dx,y:cam.y-.2+dy,z:cam.z+Math.cos(player.aimYaw)*2.2,vx:0,vy:0,vz:0,o:player,life:9,pop:1,sd:dx*4});},5);});
 await sleep(800);await p.screenshot({path:OUT+'pop_close.jpg',type:'jpeg',quality:85,clip:{x:340,y:150,width:600,height:400}});
 await b.close();process.exit(0);})();
