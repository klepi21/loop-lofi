// a map marked noHome (the sponsored pitch) must never be the backdrop of the home screen
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let errs=0;const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage();p.on('pageerror',e=>{errs++;console.log('PAGEERR',e.message);});
 await p.evaluateOnNewDocument(()=>{if(!sessionStorage.getItem('i')){sessionStorage.setItem('i','1');localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');}});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);const st=()=>p.evaluate(()=>AR.name+' ('+state+(prvOn?', practice open':'')+')');
 await p.evaluate(()=>{$('prac').click();});await sleep(600);await p.evaluate(()=>{setArena(1);setArena(1);});console.log('picked in practice:',await st());
 await p.evaluate(()=>{while(!AR.noHome)setArena(1);});await sleep(300);console.log('picked the sponsored pitch:',await st());
 await p.evaluate(()=>pgClose('prc'));await sleep(500);console.log('closed practice, home shows:',await st());
 await p.evaluate(()=>{$('prac').click();});await sleep(500);console.log('practice opened again:',await st());
 await p.evaluate(()=>$('prcgo').click());await sleep(2500);console.log('started practice:',await st());
 await p.evaluate(()=>showMenu());await sleep(500);console.log('back to the menu, home shows:',await st());
 await p.reload({waitUntil:'load'});await sleep(2800);console.log('after reopening the game, home shows:',await st(),'| saved practice map',await p.evaluate(()=>ARENAS[profile.arena].name));
 console.log(errs?'FAILED':'OK');await b.close();process.exit(errs?1:0);})();
