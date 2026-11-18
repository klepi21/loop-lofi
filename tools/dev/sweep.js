// photo of every page and state, to hunt for anything left from the chicken game
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/sw_';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});let e=0;p.on('pageerror',x=>{e++;console.log('ERR',x.message)});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await sleep(900);await p.screenshot({path:OUT+'intro.jpg',type:'jpeg',quality:60});await sleep(5000);
 await p.screenshot({path:OUT+'menu.jpg',type:'jpeg',quality:60});
 for(const id of ['prc','set','howto','chl','lock','modes','stats']){await p.evaluate(id=>{if(id==='stats'){$('stats').style.display='block';if(typeof statsUI==='function')statsUI();}else pgOpen(id);},id);await sleep(700);await p.screenshot({path:OUT+id+'.jpg',type:'jpeg',quality:60});await p.evaluate(id=>{if(id==='stats')$('stats').style.display='none';else pgClose(id);},id);await sleep(300);}
 for(const t of [1,2]){await p.evaluate(t=>{pgOpen('lock');const bt=document.querySelector('#lktabs button[data-t="'+t+'"]');if(bt)bt.click();},t);await sleep(800);await p.screenshot({path:OUT+'lock'+t+'.jpg',type:'jpeg',quality:60});await p.evaluate(()=>pgClose('lock'));}
 await p.evaluate(()=>{MODE='c';modeSel='c';startMatch();cdT=0;});await sleep(3000);await p.screenshot({path:OUT+'ctf.jpg',type:'jpeg',quality:60});
 await p.evaluate(()=>{matchT=.05;});await sleep(2500);await p.screenshot({path:OUT+'over.jpg',type:'jpeg',quality:60});
 console.log(e?'errors '+e:'no errors');await b.close();})();
