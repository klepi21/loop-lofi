// joust on a phone: hold the joystick forward, then also hold CHARGE; reports speed and sprint, plus a phone screenshot mid charge
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 const cdp=await p.target().createCDPSession();const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 await p.evaluate(()=>{touchMode=true;diff=1;vSel=true;MODE='v';startMatch();});await sleep(9500);
 await T('touchStart',[{x:150,y:280,id:1}]);await sleep(200);
 const bf=await p.evaluate(()=>{const e=$('bf').getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2,$('bf').textContent];});console.log('charge button',bf);for(let i=1;i<=6;i++){await T('touchMove',[{x:150,y:280-i*8,id:1}]);await sleep(20);}await sleep(700);
 console.log('trot',await p.evaluate(()=>({spd:+Math.hypot(player.vx,player.vz).toFixed(1),sprint:player.sprint,cd:+cdT.toFixed(1)})));
 await T('touchStart',[{x:150,y:232,id:1},{x:bf[0],y:bf[1],id:2}]);await sleep(700);
 console.log('charge',await p.evaluate(()=>({spd:+Math.hypot(player.vx,player.vz).toFixed(1),sprint:player.sprint,st:+player.stamina.toFixed(2)})));
 await p.screenshot({path:OUT+'joust_phone.jpg',type:'jpeg',quality:75});
 await T('touchEnd',[]);await b.close();process.exit(0);})();
