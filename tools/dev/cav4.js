// chicken cavalry on a phone: real touch on the joystick, does the player move? Compares with free for all.
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200));});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 const cdp=await p.target().createCDPSession();
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
 for(const m of ['v','f']){
  await p.evaluate(m=>{vSel=m==='v';pSel=false;zSel=false;MODE=m;startMatch();},m);await sleep(9000);
  const a=await p.evaluate(()=>({x:player.x,z:player.z,st:state,cd:cdT,alive:player.alive,intro:typeof introE==='function'?introE():'?'}));
  await touch('touchStart',150,280);for(let i=1;i<=10;i++){await touch('touchMove',150,280-i*6);await sleep(30);}await sleep(1500);
  const bb=await p.evaluate(()=>({x:player.x,z:player.z,wx:player.wx,wz:player.wz,stick:stickId,blk:player.blk,ads:adsW,onG:player.onG,y:player.y,vx:player.vx,vz:player.vz}));
  await touch('touchEnd');
  console.log(m,'before',JSON.stringify(a),'after',JSON.stringify(bb),'moved',Math.hypot(bb.x-a.x,bb.z-a.z).toFixed(2));
  await p.evaluate(()=>{clearTimeout(overT);showMenu();});await sleep(500);}
 await b.close();process.exit(0);})();
