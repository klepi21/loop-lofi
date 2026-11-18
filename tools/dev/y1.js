// yeti photos: the 8 yetis lined up in front of the camera, close up of the face, and a running/throwing yeti
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');localStorage.setItem('H','[12,13,14,15,16,12,13]');localStorage.setItem('F','[8,9,10,11,12,10,11]');});
 await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await sleep(3000);
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro,#game{display:none!important}'});
 await p.evaluate(()=>{MODE='f';startMatch();window.__H=JSON.parse(localStorage.getItem('H')||'null');window.__F=JSON.parse(localStorage.getItem('F')||'null');});await sleep(4500);
 const shot=async(name,dist,n,sp)=>{await p.evaluate((dist,n,sp)=>{clearInterval(window.__k);const bs=chickens.filter(c=>!c.isP);setLook(bs[0],ROSTER[0]);
   window.__k=setInterval(()=>{cdT=0;player.invuln=1;player.alive=true;player.x=0;player.z=5.2+dist;player.y=0;player.vx=player.vz=0;player.aimYaw=Math.PI;player.aimPitch=-.08;fp=true;player.hidden=true;
    bs.forEach((c,i)=>{if(i>=n){c.alive=false;c.hidden=true;return;}c.alive=true;c.hidden=false;c.x=(i-(n-1)/2)*sp;c.z=5.2;c.hat=(window.__H||[1,2,3,4,5,6,10])[i]||0;c.fit=(window.__F||[1,4,5,2,6,7,3])[i]||0;c.y=0;c.vx=c.vz=0;c.vy=0;c.onG=true;c.yaw=c.aimYaw=0;c.aimPitch=0;c.invuln=0;c.spawnT=0;c.fire=false;c.thinkT=9;c.flash=0;
     if(n===2&&i===1){c.yaw=c.aimYaw=-.8;c.vx=Math.sin(-.8)*5;c.vz=Math.cos(-.8)*5;c.phase=(performance.now()/90);c.recoil=(performance.now()/400)%1<.2?1:0;}});},5);},dist,n,sp);await sleep(900);await p.screenshot({path:OUT+name,type:'jpeg',quality:85});};
 await shot('y_line.jpg',4.6,7,1.25);await shot('y_face.jpg',1.25,1,1);await shot('y_two.jpg',2.6,2,1.3);
 await b.close();process.exit(0);})();
