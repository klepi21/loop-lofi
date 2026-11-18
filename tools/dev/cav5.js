// chicken cavalry on a phone, real time: joystick plus taps on every button, through deaths and respawns. Reports any second the player could not move.
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200));});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 const cdp=await p.target().createCDPSession();
 const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 const btn=async id=>{const r=await p.evaluate(id=>{const e=document.getElementById(id).getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2];},id);return r;};
 await p.evaluate(()=>{diff=1;vSel=true;MODE='v';startMatch();});await sleep(8500);await T('touchStart',[{x:420,y:200,id:9}]);await T('touchEnd',[]);await sleep(300);
 const B={sw:await btn('bf'),sh:await btn('ba'),ch:await btn('bd'),j:await btn('bj')};console.log('buttons',JSON.stringify(B));
 let stuck=0,log=[];
 for(let s=0;s<40;s++){
  const a=await p.evaluate(()=>({x:player.x,z:player.z,alive:player.alive,st:state}));if(s===0){const d=await p.evaluate(()=>{const x=player.x,z=player.z;return new Promise(r=>setTimeout(()=>r(Math.hypot(player.x-x,player.z-z)),2000));});console.log('drift in 2s with no input',d.toFixed(3));}
  const dir=s%4;const dx=[0,40,0,-40][dir],dy=[-40,0,40,0][dir];
  await T('touchStart',[{x:150,y:280,id:1}]);
  for(let i=1;i<=6;i++){await T('touchMove',[{x:150+dx*i/6,y:280+dy*i/6,id:1}]);await sleep(20);}
  const k=['sw','sh','ch','j','sw'][s%5];const q=B[k];
  await T('touchStart',[{x:150+dx,y:280+dy,id:1},{x:q[0],y:q[1],id:2}]);await sleep(k==='sh'?400:80);await T('touchEnd',[{x:150+dx,y:280+dy,id:1}]);
  await sleep(600);
  const c=await p.evaluate(()=>({jr:JR?JR.end.toFixed(1)+"/"+JR.n:"",x:player.x,z:player.z,alive:player.alive,blk:player.blk,ads:adsW,stick:stickId,fire:fireId,shId,tS:tSprint,st:state,cd:cdT,wx:player.wx,hp:Math.round(player.hp),y:+player.y.toFixed(2)}));
  await T('touchEnd',[]);
  const mv=Math.hypot(c.x-a.x,c.z-a.z);
  if(a.alive&&c.alive&&c.st==='play'&&mv<.5){stuck++;log.push({s,k,mv:+mv.toFixed(2),...c});}
  if(s===20)await p.screenshot({path:OUT+'cav_rt.jpg',type:'jpeg',quality:75});
 }
 console.log('stuck seconds',stuck);for(const l of log)console.log(JSON.stringify(l));
 console.log('end',await p.evaluate(()=>state+' kills '+player.kills+' deaths '+player.deaths));
 await b.close();process.exit(0);})();
