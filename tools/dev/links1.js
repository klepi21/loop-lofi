// live check: the short invite links open the game with the invite pending
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const [n,u] of [['room','https://chickensoutofpatience.com/r/ABCD?from=Dinos'],['party','https://chickensoutofpatience.com/p/0123456789ab?from=Dinos']]){const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true});p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await p.evaluateOnNewDocument(()=>{localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
  await p.goto(u,{waitUntil:'load',timeout:60000});await sleep(5500);
  console.log(n,await p.evaluate(()=>JSON.stringify({url:location.pathname+location.search,pendRoom,pendPty,from:pendFrom||pendPtyF,toast:$('toast').textContent.slice(0,90),roomDlg:$('room').style.display,roomTxt:($('rmh').textContent+' '+$('rmmsg').textContent).slice(0,90)})));
  await p.screenshot({path:OUT+'link_'+n+'.jpg',type:'jpeg',quality:75});await ctx.close();}
 const p=await b.newPage();await p.evaluateOnNewDocument(()=>{localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});await p.goto('https://chickensoutofpatience.com/game?browser=1',{waitUntil:'load'});await sleep(4000);
 console.log('links the game makes now:',await p.evaluate(()=>invText('WXYZ').url+' | build '+BUILD));
 await b.close();process.exit(0);})();
