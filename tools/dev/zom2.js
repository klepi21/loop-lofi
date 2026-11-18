// the zombie switch on the practice screen, on a desktop and on a phone, then PLAY AGAIN and MENU after dying
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 for(const [nm,w,h,mob] of [['desk',1280,720,false],['phone',844,390,true]]){
  const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob,deviceScaleFactor:mob?2:1});p.on('pageerror',e=>console.log('PAGEERR',nm,e.message));
  await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
  await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
  await p.evaluate(()=>{const i=document.getElementById('intro');if(i)i.style.display='none';pgOpen('prc');});await sleep(1500);
  await p.screenshot({path:OUT+'zp_'+nm+'_battle.jpg',type:'jpeg',quality:80});
  await p.evaluate(()=>document.querySelector('#prck button[data-z="1"]').click());await sleep(2200);
  await p.screenshot({path:OUT+'zp_'+nm+'_zombies.jpg',type:'jpeg',quality:80});
  console.log(nm,'picker',await p.evaluate(()=>AR.name+' | '+document.getElementById('prcm').textContent+' | '+document.getElementById('prcn').textContent));
  await p.evaluate(()=>document.querySelector('#prck button[data-z="0"]').click());await sleep(900);
  console.log(nm,'back to battle',await p.evaluate(()=>AR.name+' | '+document.getElementById('prcm').textContent));
  await p.evaluate(()=>{document.querySelector('#prck button[data-z="1"]').click();document.getElementById('prcgo').click();});await sleep(9500);
  await p.screenshot({path:OUT+'zp_'+nm+'_play.jpg',type:'jpeg',quality:80});
  console.log(nm,'play',await p.evaluate(()=>state+' '+MODE+' '+AR.name+' wave '+Z.wave+' zoms '+zoms.length+' hidden '+chickens.filter(c=>c.off).length+' best:"'+document.getElementById('best').textContent+'"'));
  await p.evaluate(()=>{player.hp=1;player.invuln=0;for(const z of zoms){z.rise=0;z.y=0;z.x=player.x+.5;z.z=player.z;z.cd=0;}});await sleep(5200);
  console.log(nm,'dead',await p.evaluate(()=>state+' | '+document.getElementById('overh').textContent+' | over '+document.getElementById('over').style.display));
  await p.screenshot({path:OUT+'zp_'+nm+'_over.jpg',type:'jpeg',quality:80});
  await p.evaluate(()=>document.getElementById('again').click());await sleep(1500);
  console.log(nm,'again',await p.evaluate(()=>state+' '+MODE+' wave '+Z.wave+' zoms '+zoms.length+' hp '+player.hp+' kills '+player.kills));
  await p.evaluate(()=>{showMenu();});await sleep(1500);
  console.log(nm,'menu',await p.evaluate(()=>state+' '+MODE+' '+AR.name+' Z '+Z+' off '+chickens.filter(c=>c.off).length+' best:"'+document.getElementById('best').textContent+'"'));
  await p.evaluate(()=>{pgOpen('prc');});await sleep(1200);console.log(nm,'reopen',await p.evaluate(()=>AR.name+' zSel '+zSel));
  await p.evaluate(()=>{pgClose('prc');});await sleep(1200);console.log(nm,'closed',await p.evaluate(()=>AR.name));
  await p.close();}
 await b.close();process.exit(0);})();
