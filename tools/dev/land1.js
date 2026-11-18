// landing page check: consent bar, no page errors, no sideways scroll
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const [n,w,h,mob] of [['desk',1280,720,false],['phone',390,780,true]]){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:mob,deviceScaleFactor:mob?2:1});p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await p.goto('http://localhost:8766/landing/index.html?ck=1',{waitUntil:'load'});await sleep(1200);
  console.log(n,await p.evaluate(()=>{const e=document.getElementById('ck'),r=e.getBoundingClientRect();return JSON.stringify({barShown:!e.hidden,box:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],vw:innerWidth,vh:innerHeight,sideScroll:document.documentElement.scrollWidth>innerWidth,gaLoaded:!!document.querySelector('script[src*=googletagmanager]')});}));
  await p.screenshot({path:OUT+'land_'+n+'.jpg',type:'jpeg',quality:78});
  await p.evaluate(()=>document.getElementById('cky').click());await sleep(200);console.log(n,'after OK:',await p.evaluate(()=>document.getElementById('ck').hidden+' saved '+localStorage.getItem('coop_consent')));
  await p.reload({waitUntil:'load'});await sleep(600);console.log(n,'after reload bar hidden:',await p.evaluate(()=>document.getElementById('ck').hidden));await p.close();}
 await b.close();process.exit(0);})();
