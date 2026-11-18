// LOOP first look: desktop loads with no errors and takes a photo of the menu and a match; a phone gets the "play on a computer" screen
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('requestfailed',r=>console.log('REQFAIL',r.url().slice(0,90)));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await sleep(5500);await p.screenshot({path:OUT+'l_menu.jpg',type:'jpeg',quality:75});
 await p.evaluate(()=>{MODE='f';startMatch();cdT=0;});await sleep(3500);await p.screenshot({path:OUT+'l_game.jpg',type:'jpeg',quality:75});
 const ph=await b.newPage();await ph.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');await ph.setViewport({width:390,height:844,isMobile:true,hasTouch:true});ph.on('pageerror',e=>console.log('PHONE PAGEERR',e.message));
 await ph.goto('http://localhost:8766/index.html',{waitUntil:'load'});await sleep(1500);await ph.screenshot({path:OUT+'l_phone.jpg',type:'jpeg',quality:75});
 await b.close();process.exit(0);})();
