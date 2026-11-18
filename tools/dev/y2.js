// close photos: a tall yeti next to the camera height marker, the snow leopard, and an ice bomb blast
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await sleep(3000);
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro,#game{display:none!important}'});
 await p.evaluate(()=>{buildWorld(2);MODE='f';startMatch();});await sleep(4500);
 await p.evaluate(()=>{const bs=chickens.filter(c=>!c.isP);window.__k=setInterval(()=>{cdT=0;player.invuln=1;player.x=0;player.z=13;player.y=0;player.vx=player.vz=0;player.aimYaw=Math.PI;player.aimPitch=-.12;fp=true;
   bs.forEach((c,i)=>{if(i>1){c.alive=false;c.hidden=true;return;}c.alive=true;c.hidden=false;c.x=i?1.6:-1.2;c.z=9.6;c.y=0;c.vx=c.vz=0;c.onG=true;c.yaw=c.aimYaw=i?-.5:.3;c.aimPitch=0;c.thinkT=9;c.fire=false;c.invuln=0;c.spawnT=0;});},5);
   dogs.push(mkDog(player,.2,0,10.6,0));});
 await sleep(1200);await p.screenshot({path:OUT+'y2_yeti_leopard.jpg',type:'jpeg',quality:85});
 await p.evaluate(()=>{for(const d of dogs){d.life=99;d.x=.2;d.z=10.6;d.vx=d.vz=0;}nades.push({x:-1,y:1.2,z:6.5,vx:0,vy:0,vz:0,o:chickens[3],fuse:.4});});await sleep(250);await p.screenshot({path:OUT+'y2_bomb.jpg',type:'jpeg',quality:85});
 await sleep(550);await p.screenshot({path:OUT+'y2_blast.jpg',type:'jpeg',quality:85});
 await b.close();process.exit(0);})();
