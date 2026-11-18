// the zombie mode. SIM=1: plays waves as fast as the machine allows with a simple kiting player and reports.
// Without SIM: photos of the graveyard, of the four kinds of zombie up close, of a wave coming, of the HUD and the end screen.
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200));});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 if(process.env.SIM){await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(300);
  for(const df of [0,1,2]){const r=await p.evaluate(df=>{diff=df;zSel=true;buildWorld(ZA);MODE='z';startMatch();const dt=1/30;let steps=0,stuck=0,inside=0,maxZ=0,hop=0,last=new Map(),types={},tWave=[];let w0=0;
    while(state==='play'&&steps<30*60*12){steps++;timeNow+=dt;
      let n=null,nd=1e9;for(const z of zoms){if(!z.alive||z.rise>0)continue;const d=Math.hypot(z.x-player.x,z.z-player.z);if(d<nd){nd=d;n=z;}}
      keys.KeyS=false;keys.KeyD=false;keys.KeyW=false;mouseFire=false;
      if(n){player.aimYaw=Math.atan2(n.x-player.x,n.z-player.z);player.aimPitch=Math.atan2(n.y+.55*n.sc-(player.y+.75),nd);mouseFire=true;
        const r=Math.hypot(player.x,player.z);if(nd<8){keys.KeyS=true;if(r>19)keys.KeyD=true;}}
      update(dt,timeNow);updateCamera(timeNow,dt);
      if(Z&&Z.wave!==w0){w0=Z.wave;tWave.push(Math.round(steps/30));}
      let al=0;for(const z of zoms){if(!z.alive)continue;al++;types[z.t]=(types[z.t]||0);if(z.y>.3)hop++;if(z.rise<=0&&pointSolid(z.x,z.y+.3,z.z))inside++;}
      if(al>maxZ)maxZ=al;
      if(steps%90===0){for(const z of zoms){if(!z.alive||z.rise>0)continue;const d=Math.hypot(z.x-player.x,z.z-player.z),q=last.get(z);if(q!==undefined&&d>3&&d>q-.6)stuck++;last.set(z,d);}}
      for(const z of zoms)if(z.alive&&!types['s'+z.t]){types['s'+z.t]=1;}}
    const out={diff:df,sec:Math.round(steps/30),wave:Z?Z.wave:-1,kills:Z?Z.kills:-1,score:Z?Z.score:-1,hp:Math.round(player.hp),state,maxZ,stuck,inside,hop,seen:Object.keys(types).filter(k=>k[0]==='s').join(''),waveAt:tWave.join(','),over:document.getElementById('over').style.display,resline:document.getElementById('resline').textContent};
    clearTimeout(overT);showMenu();return out;},df);console.log(JSON.stringify(r));}
  console.log('after menu',await p.evaluate(()=>AR.name+' Z='+Z+' zoms='+zoms.length+' MODE='+MODE));await b.close();process.exit(0);}
 // ---- photos ----
 const hide=await p.addStyleTag({content:'#game,#menu,.hud,#hurt,#yolk,#toast,#upd,#over,#pause,#intro{display:none!important}'});
 await p.evaluate(()=>{zSel=true;buildWorld(ZA);MODE='z';startMatch();fp=true;});
 console.log('arena',await p.evaluate(()=>AR.name+' | solids '+solids.length+' pickups '+pickups.length+' lights '+LIGHTS.length+' with radius '+LIGHTS.filter(L=>L[3]>0).length+' tris '+staticCount/3));
 const pin=(x,z,y,pit,yaw,hold)=>p.evaluate((x,z,y,pit,yaw,hold)=>{clearInterval(window.__pin);window.__pin=setInterval(()=>{cdT=0;if(hold&&Z){Z.brk=5;Z.thT=99;}player.x=x;player.z=z;player.y=y;player.vx=player.vy=player.vz=0;player.aimYaw=yaw===undefined||yaw===null?Math.atan2(-x,-z):yaw;player.aimPitch=pit;player.hp=100;player.invuln=2;},5);},x,z,y,pit,yaw,hold);
 const shot=(n,full)=>p.screenshot({path:OUT+'zm_'+n+'.jpg',type:'jpeg',quality:82,clip:{x:0,y:0,width:1280,height:full?720:560}});
 for(const [n,x,z,y,pit,yaw] of [["south",0,25,2.2,-0.08],["chapel",0,-9,1.2,0.1,Math.PI],["crypt",9,-8,1,0.12,null],["tree",-9,9,1,0.2,null],["high",17,19,13,-0.5,null]]){await pin(x,z,y,pit,yaw,true);await sleep(1700);await shot(n);}
 // the four kinds up close
 await pin(-2,7,0,-0.02,Math.PI/2,true);await sleep(300);
 const line=(arr,yaw)=>p.evaluate((arr,yaw)=>{zoms.length=0;Z.wave=5;for(const [t,v,dx,dz] of arr){zSpawn(t);const q=zoms[zoms.length-1];q.v=v;q.x=player.x+dx;q.z=player.z+dz;q.rise=0;q.y=0;q.sp=0;q.yaw=yaw;q.cd=1e9;q.gT=1e9;}Z.wave=0;},arr,yaw);
 await line([['w',0,3,-2.4],['w',1,3,-.8],['w',2,3,.8],['w',3,3,2.4]],-Math.PI/2);await sleep(1200);await shot('walkers');
 await line([['w',0,3,-2.4],['w',1,3,-.8],['w',2,3,.8],['w',3,3,2.4]],-Math.PI/2+.9);await sleep(900);await shot('walkers_side');
 await line([['r',0,3,-2],['b',0,3.6,0],['k',0,5.4,3]],-Math.PI/2+.3);await sleep(1200);await shot('kinds');
 await line([['w',0,1.9,-.9],['w',2,1.9,.9]],-Math.PI/2);await sleep(900);await shot('close');
 console.log('instances with 2 zombies',await p.evaluate(()=>[SPH.n,CYL.n,CONE.n].join(',')));
 await pin(-2,24,0,0,Math.PI,true);await sleep(200);
 await p.evaluate(()=>{zoms.length=0;Z.wave=3;let i=0;for(const d of [5,9,13,17,21,25]){zSpawn(i%3===1?'r':'w');const q=zoms[zoms.length-1];q.v=i%4;q.x=player.x+[-2.4,1.6,-.8,2.6,-2,.6][i++];q.z=player.z-d;q.rise=0;q.y=0;q.sp=0;q.yaw=0;q.cd=1e9;q.gT=1e9;}Z.wave=0;});
 await sleep(900);await shot('dist');

 console.log('instances with 4 zombies',await p.evaluate(()=>[SPH.n,CYL.n,CONE.n].join(',')));
 // a real wave coming at the player, third person, with the HUD
 await p.evaluate(()=>{zoms.length=0;fp=false;Z.wave=5;Z.brk=.1;Z.thT=3.2;});await p.evaluate(e=>e.remove(),hide);
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro{display:none!important}'});
 await pin(4,6,0,-0.05,null,false);
 await sleep(6500);await shot('wave1',true);await sleep(3000);await shot('wave2',true);
 console.log('instances in wave',await p.evaluate(()=>[SPH.n,CYL.n,CONE.n,zoms.length,bbs.length].join(',')));
 await p.evaluate(()=>{fp=true;});await sleep(2500);await shot('wave3',true);
 await p.evaluate(()=>{zFl=1;});await sleep(30);await shot('flash',true);
 await p.evaluate(()=>{pans.push({o:player,t:0});});await sleep(900);await shot('pan1',true);await sleep(800);await shot('pan2',true);await sleep(2600);
 await pin(0,25,2.2,-0.02,null,false);await p.evaluate(()=>{Z.wave=11;zDr=1;Z.brk=30;zoms.length=0;Z.q.length=0;fp=true;});await sleep(1500);await shot('red',true);
 await p.evaluate(()=>{zFl=1;});await sleep(30);await shot('red_flash',true);
 await pin(4,6,0,-0.05,null,false);await p.evaluate(()=>{Z.brk=0;});
 // let them win
 await p.evaluate(()=>{clearInterval(window.__pin);player.invuln=0;player.hp=10;});await sleep(9000);await shot('end',true);
 console.log('end',await p.evaluate(()=>state+' | '+document.getElementById('overk').textContent+' | '+document.getElementById('overh').textContent+' | '+document.getElementById('resline').textContent+' | '+document.getElementById('xpline').textContent));
 await b.close();process.exit(0);})();
