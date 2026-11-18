// popcorn moon on a phone: which touch buttons show in popcorn moon and back in free for all
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 const vis=()=>p.evaluate(()=>['bf','bj','bd','bv','ba','bg'].map(i=>{const e=$(i);return i+':'+(getComputedStyle(e).display!=='none'?e.textContent:'-')}).join(' '));
 await p.evaluate(()=>{touchMode=true;vSel=true;MODE='v';startMatch();});await sleep(8000);await p.evaluate(()=>{player.x=0;player.z=6;player.aimYaw=Math.PI;});await sleep(600);
 console.log('cavalry',await vis());await p.screenshot({path:OUT+'cav_phone.jpg',type:'jpeg',quality:80});
 await p.evaluate(()=>{clearTimeout(overT);showMenu();vSel=false;MODE='f';startMatch();});await sleep(4500);
 console.log('ffa    ',await vis());
 await b.close();process.exit(0);})();
