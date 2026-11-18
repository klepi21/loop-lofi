// joust: phone screenshot of the round result text, and of spectating a mate after you are out
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.evaluate(()=>{touchMode=true;diff=1;vSel=true;MODE='v';startMatch();});await sleep(9500);
 await p.evaluate(()=>{for(const c of chickens)if(c.team===1)kill(c,player,1,0,false);});await sleep(350);
 await p.screenshot({path:OUT+'joust_round.jpg',type:'jpeg',quality:75});
 await sleep(7000);await p.evaluate(()=>{kill(player,chickens[5],1,0,false);});await sleep(2500);
 await p.screenshot({path:OUT+'joust_spec.jpg',type:'jpeg',quality:75});
 console.log(await p.evaluate(()=>'round '+JR.n+' score '+JR.w.join(':')+' msg '+$('msg').textContent));
 await b.close();process.exit(0);})();
