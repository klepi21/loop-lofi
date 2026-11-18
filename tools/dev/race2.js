// chicken derby on a phone: stick left and right steers, CHARGE gallops, pulling back brakes; phone screenshot
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 const cdp=await p.target().createCDPSession();const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 await p.evaluate(()=>{touchMode=true;diff=1;vSel=true;MODE='r';startMatch();});await sleep(4300);
 const st=()=>p.evaluate(()=>({yaw:+player.aimYaw.toFixed(2),spd:+Math.hypot(player.vx,player.vz).toFixed(1),sprint:player.sprint,s:+player.rs.toFixed(0),cd:+cdT.toFixed(1)}));
 console.log('no touch, auto run',await st());await sleep(800);console.log('after 0.8s',await st());
 await T('touchStart',[{x:150,y:280,id:1}]);await sleep(150);const bf=await p.evaluate(()=>{const e=$('bf').getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2,$('bf').textContent];});console.log('button',bf);
 for(let i=1;i<=6;i++){await T('touchMove',[{x:150+i*8,y:280,id:1}]);await sleep(20);}await sleep(500);console.log('steer right 0.5s',await st());
 for(let i=1;i<=12;i++){await T('touchMove',[{x:198-i*8,y:280,id:1}]);await sleep(20);}await sleep(500);console.log('steer left 0.5s',await st());
 await T('touchMove',[{x:150,y:280,id:1}]);await T('touchStart',[{x:150,y:280,id:1},{x:bf[0],y:bf[1],id:2}]);await sleep(900);console.log('charge',await st());
 await p.screenshot({path:OUT+'race_phone.jpg',type:'jpeg',quality:75});
 await T('touchEnd',[]);await sleep(100);await T('touchStart',[{x:150,y:280,id:1}]);for(let i=1;i<=6;i++){await T('touchMove',[{x:150,y:280+i*9,id:1}]);await sleep(20);}await sleep(700);console.log('pull back brake',await st());
 await T('touchEnd',[]);
 console.log('visible',await p.evaluate(()=>['bf','bj','bd','ba','bg'].map(i=>i+':'+(getComputedStyle($(i)).display!=='none'?$(i).textContent:'-')).join(' ')));
 await b.close();process.exit(0);})();
