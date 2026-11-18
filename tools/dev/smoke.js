// Smoke check before a release: the game loads, every practice mode runs, the main pages open, an online join works
// (needs `python3 -m http.server 8765` in the project root; the online part needs the local server on 8099, see srvwrap.js).
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let errs=0;const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 for(const [n,w,h,mob] of [['desk',1280,720,false]]){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob});p.on('pageerror',e=>{errs++;console.log(n,'PAGEERR',e.message);});
  await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
  await p.goto('http://localhost:8766/index.html?browser=1'+(process.env.ONLINE?'&srv='+(process.env.SRV||'ws://localhost:8099/ws'):''),{waitUntil:'load'});await sleep(2800);
  for(const m of ['f','t','c','d']){await p.evaluate(m=>{MODE=m;modeSel=m;startMatch();cdT=0;},m);await sleep(2500);const r=await p.evaluate(()=>state+' '+MODE+' alive '+chickens.filter(c=>c.alive&&!c.hidden).length+' on '+AR.name);console.log(n,'practice',r);await p.evaluate(()=>showMenu());await sleep(300);}
  for(const id of ['prc','set','howto','chl','lbd','frd','lock','modes']){await p.evaluate(id=>pgOpen(id),id);await sleep(350);await p.evaluate(id=>pgClose(id),id);await sleep(300);}
  if(process.env.ONLINE){await p.evaluate(()=>{modeSet('f');playGo();});await sleep(6000);console.log(n,'online',await p.evaluate(()=>NET+' '+state+' room '+roomCode));await p.evaluate(()=>showMenu());}
  await p.close();}
 console.log(errs?'FAILED with '+errs+' page errors':'OK, no page errors');await b.close();process.exit(errs?1:0);})();
