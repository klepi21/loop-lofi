// the match intro: photos at several moments, skip, and the countdown after it
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const [nm,w,h,mob] of [['desk',1280,720,false],['phone',844,390,true]]){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob});p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
  await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
  await p.evaluate(()=>{const i=document.getElementById('intro');if(i)i.style.display='none';if(window.__mob)touchMode=true;buildWorld(5);MODE='t';startMatch();});
  const t0=Date.now();const at=async(s,n)=>{const w=s*1000-(Date.now()-t0);if(w>0)await sleep(w);console.log(nm,n,await p.evaluate(()=>'e='+introE().toFixed(2)+' cdT='+cdT.toFixed(2)+' cls='+document.getElementById('game').className+' cd="'+document.getElementById('cd').textContent+'"'));if(nm==='desk'||n==='b')await p.screenshot({path:OUT+'intro_'+nm+'_'+n+'.jpg',type:'jpeg',quality:75});};
  await at(.8,'a');await at(2.6,'b');await at(3.9,'c');await at(4.7,'d');await at(6.2,'e');await at(8.6,'f');
  console.log(nm,'after',await p.evaluate(()=>state+' cdT='+cdT.toFixed(2)+' alive '+chickens.filter(c=>c.alive).length));
  // skip in a second match
  await p.evaluate(()=>{startMatch();});await sleep(1200);await p.keyboard.press('KeyW');await sleep(200);
  console.log(nm,'skip',await p.evaluate(()=>'e='+introE().toFixed(2)+' cdT='+cdT.toFixed(2)+' skip='+introSkip+' cls='+document.getElementById('game').className));
  await p.close();}
 await b.close();process.exit(0);})();
