// chicken derby chaos counter: one fast Normal race, counts knock offs by cause, items used by type, hijacks, slips, ramp jumps, mud time
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await sleep(200);
 const r=await p.evaluate(D=>{diff=D;vSel=true;MODE='r';startMatch();const dt=1/30;let n=0;const K={},I={},E={ramps:0,slips:0,maxOff:0,youOff:0};
  const ko=knockOff;window.knockOff=(c,fx,fz,why)=>{if(!c.dis&&!c.fin&&c.alive){const w=(why||'').split('!')[0].replace(/ BY [A-Z]+$/,'');K[w]=(K[w]||0)+1;if(c.isP)E.youOff++;}ko(c,fx,fz,why);};
  const ui=useItem;window.useItem=c=>{if(c.item&&!c.dis&&cdT<=.3)I[c.item]=(I[c.item]||0)+1;ui(c);};
  while(state==='play'&&n<30*400){n++;timeNow+=dt;
    if(cdT<=.3&&player.alive){const N=TRK.P.length,i=((player.ti|0)+5)%N,q=player.dis&&player.mt?[player.mt.x,player.mt.z]:TRK.P[i],want=Math.atan2(q[0]-player.x,q[1]-player.z),d=angDiff(player.aimYaw,want);stx=clamp(-d*2.5,-1,1);const a=TRK.Tg[((player.ti|0)+4)%N],c=TRK.Tg[((player.ti|0)+14)%N];mouseFire=a[0]*c[0]+a[1]*c[1]>.9&&player.stamina>.3;}
    for(const c of chickens){if(c.rAir&&!c._ra)E.ramps++;c._ra=c.rAir;if(c.spinT>1.05&&!c._sp)E.slips++;c._sp=c.spinT>1.05;}
    update(dt,timeNow);}
  const off=chickens.filter(c=>c.dis).length;
  return {diff:D,raceMin:+(RC.t/60).toFixed(1),knockOffs:K,youKnockedOff:E.youOff,items:I,rampJumps:E.ramps,eggSlips:E.slips,you:ORD[chickens.slice().sort((a,b)=>rProg(b)-rProg(a)).indexOf(player)],state};},+(process.env.D||1));
 console.log(JSON.stringify(r));await b.close();process.exit(0);})();
