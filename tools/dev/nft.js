// NFT portraits: each of the 8 yetis close up, saved as nft/<skin>.png, plus nft/clip.png
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1000,height:1000});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await sleep(3000);
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro,#game,.hud{display:none!important}'});
 await p.evaluate(()=>{buildWorld(0);MODE='f';startMatch();});await sleep(4000);
 for(let k=0;k<8;k++){await p.evaluate(k=>{clearInterval(window.__k);const c=chickens[1];setLook(c,ROSTER[k]);for(const o of chickens)if(!o.isP&&o!==c){o.alive=false;o.hidden=true;}
   window.__k=setInterval(()=>{cdT=0;player.invuln=1;player.x=0;player.z=16.75;player.y=.12;player.vx=player.vz=0;player.aimYaw=Math.PI;player.aimPitch=.06;fp=true;
     c.alive=true;c.hidden=false;c.x=0;c.z=15;c.y=0;c.vx=c.vz=0;c.vy=0;c.onG=true;c.phase=0;c.yaw=c.aimYaw=0;c.aimPitch=-.05;c.thinkT=9;c.fire=false;c.hat=0;c.fit=0;c.invuln=0;c.spawnT=0;c.flash=0;c.blink=1;},5);},k);
  await sleep(900);await p.screenshot({path:__dirname+'/../../nft/'+k+'.png',clip:{x:150,y:60,width:700,height:700}});}
 await b.close();})();
