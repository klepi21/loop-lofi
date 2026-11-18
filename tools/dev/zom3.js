// the zombie music: starts with the first wave, moves to the next track as waves pass, stops at death, gone in the menu
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();await p.setViewport({width:900,height:500});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2600);
 const st=()=>p.evaluate(()=>'cur='+musCur+' bufs='+Object.keys(musBuf).join(',')+' rate='+(musSrc?musSrc.s.playbackRate.value.toFixed(3):'-')+' gain='+(musSrc?musSrc.g.gain.value.toFixed(3):'-')+' wave='+(Z?Z.wave:'-')+' stage='+(Z?Z.mst:'-'));
 await p.evaluate(()=>{initAudio();});await sleep(2500);console.log('menu  ',await st());
 await p.evaluate(()=>{pgOpen('prc');document.querySelector('#prck button[data-z="1"]').click();});await sleep(2500);console.log('picker',await st());
 await p.evaluate(()=>{document.getElementById('prcgo').click();window.__k=setInterval(()=>{player.hp=100;player.invuln=2;},50);});await sleep(9000);console.log('wave 1',await st());
 await p.evaluate(()=>{for(const z of zoms.slice())zKill(z,false,true);Z.q.length=0;Z.wave=3;Z.brk=.2;});await sleep(5000);console.log('wave 4',await st());
 await p.evaluate(()=>{for(const z of zoms.slice())zKill(z,false,true);Z.q.length=0;Z.wave=4;Z.brk=.2;});await sleep(5000);console.log('wave 5',await st());
 await p.evaluate(()=>{for(const z of zoms.slice())zKill(z,false,true);Z.q.length=0;Z.boss=null;Z.wave=5;Z.brk=.2;});await sleep(5000);console.log('wave 6',await st());
 await p.evaluate(()=>{for(const z of zoms.slice())zKill(z,false,true);Z.q.length=0;Z.wave=8;Z.brk=.2;});await sleep(5000);console.log('wave 9',await st());
 await p.evaluate(()=>{clearInterval(window.__k);player.invuln=0;zDmg(999,1,0);});await sleep(1500);console.log('dead  ',await st());
 await sleep(3000);await p.evaluate(()=>{showMenu();});await sleep(3000);console.log('menu  ',await st());
 await b.close();process.exit(0);})();
