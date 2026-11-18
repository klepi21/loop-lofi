// hidden maps: Olympos must never come up in map cycling, practice or the online vote pool
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 console.log(await p.evaluate(()=>{const seen=new Set();for(let i=0;i<20;i++){setArena(1);seen.add(AR.name);}profile.arena=8;const h=homeA();return {NAR,idx:ARENAS.findIndex(a=>a.hid),cycled:[...seen].join(', '),profile8home:ARENAS[h].name,practice8:ARENAS[(8|0)%NAR].name};}));
 await b.close();process.exit(0);})();
