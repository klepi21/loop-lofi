// chicken derby: SIM=1 fast 3 lap races per difficulty with a simple steering player (finish order, lap times, stuck bots); otherwise drawn photos of the grid and the race
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 // simple player: steer toward the centre line 8 m ahead using the same stick input a phone gives, gallop on straights
 const AI=()=>{window.__ai=()=>{const N=TRK.P.length,i=((player.ti|0)+5)%N,q=TRK.P[i],want=Math.atan2(q[0]-player.x,q[1]-player.z),d=angDiff(player.aimYaw,want);stx=clamp(-d*2.5,-1,1);sty=0;const a=TRK.Tg[((player.ti|0)+4)%N],c=TRK.Tg[((player.ti|0)+14)%N];mouseFire=a[0]*c[0]+a[1]*c[1]>.9&&player.stamina>.3;};};
 if(process.env.SIM){await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.evaluate(AI);await sleep(200);
  for(const df of [0,1,2]){const r=await p.evaluate(df=>{diff=df;vSel=true;MODE='r';startMatch();const dt=1/30;let n=0,laps=[],lastLap=0,lt=0,maxStk=0;
    while(state==='play'&&n<30*400){n++;timeNow+=dt;if(cdT<=.3)__ai();update(dt,timeNow);updateCamera(timeNow,dt);
      if(player.lap!==lastLap){if(lastLap>=1)laps.push(+(RC.t-lt).toFixed(1));lt=RC.t;lastLap=player.lap;}for(const c of chickens)if(!c.isP&&c.stk>maxStk)maxStk=c.stk;}
    const ord=chickens.slice().sort((a,b)=>rProg(b)-rProg(a));
    return {diff:df,state,mode:MODE,you:ORD[ord.indexOf(player)],yourLaps:laps,finished:ord.filter(c=>c.fin).length,order:ord.map(c=>(c.isP?'YOU':c.name)+(c.fin?' '+c.fin.toFixed(0)+'s':' lap'+c.lap)).join(', '),maxBotStuck:+maxStk.toFixed(1),raceMin:+(RC.t/60).toFixed(1),over:$('overh').textContent};},df);
   console.log(JSON.stringify(r));await p.evaluate(()=>{clearTimeout(overT);showMenu();});}
  await b.close();process.exit(0);}
 await p.addStyleTag({content:'#menu,#toast,#upd,#intro{display:none!important}'});
 await p.evaluate(()=>{vSel=true;prcSync();});console.log('arena',await p.evaluate(()=>AR.name+' R '+R+' track '+Math.round(TRK.L)+'m'));
 await p.evaluate(()=>{diff=1;MODE='r';startMatch();});await sleep(900);await p.screenshot({path:OUT+'race_grid.jpg',type:'jpeg',quality:80});
 await p.evaluate(AI);await p.evaluate(()=>{window.__k=setInterval(()=>{if(state==='play'&&cdT<=.3)__ai();},30);});
 for(let i=0;i<5;i++){await sleep(i?4000:4200);await p.screenshot({path:OUT+'race_'+i+'.jpg',type:'jpeg',quality:80});}
 console.log('live',await p.evaluate(()=>'t '+RC.t.toFixed(1)+' lap '+player.lap+' pos '+player.pos+' s '+player.rs.toFixed(0)+' hud '+$('tc').textContent+' | '+$('kills').textContent+$('klab').textContent+' | '+$('rank').textContent));
 await b.close();process.exit(0);})();
