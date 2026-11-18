// kill clip with sound: plays a short practice match (game muted on purpose), shoots and kills a bot, makes the clip, saves it to out/clip_test.(mp4|webm) for ffmpeg to inspect
const puppeteer=require('puppeteer-core');const fs=require('fs');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200));});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 await p.evaluate(()=>{initAudio();diff=1;MODE='f';startMatch();introSkipNow&&introSkipNow();});await sleep(5000);
 console.log('audio',await p.evaluate(()=>({ac:AC&&AC.state,muted,battle:!!musBuf.battle,clipOK})));
 // aim and shoot at the nearest bot, then finish it
 const v=await p.evaluate(()=>{let n=null,nd=1e9;for(const c of chickens){if(c.isP||!c.alive)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<nd){nd=d;n=c;}}window.__v=n;window.__a=setInterval(()=>{const n=window.__v;if(!n||state!=='play')return;player.invuln=1;n.invuln=0;player.aimYaw=Math.atan2(n.x-player.x,n.z-player.z);player.aimPitch=Math.atan2(n.y+.5-player.y-.9,Math.hypot(n.x-player.x,n.z-player.z));mouseFire=true;},30);return n.name;});
 await sleep(2500);await p.evaluate(()=>{mouseFire=false;clearInterval(window.__a);const n=window.__v;if(n.alive)damage(n,500,player,1,0,true);});await sleep(2200);
 console.log('clip ready',await p.evaluate(()=>!!clip),v);
 await p.evaluate(()=>{clearTimeout(overT);state='over';clipMake();});
 const t0=Date.now();while(Date.now()-t0<30000){await sleep(500);if(await p.evaluate(()=>!clipRun&&!!clipBlob))break;}
 const r=await p.evaluate(async()=>{const b=clipBlob;const buf=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode.apply(null,buf.subarray(i,i+32768));return {type:b.type,size:b.size,data:btoa(s),connected:!!(clipRun),mg:master.gain.value,spk:spk.gain.value,video:$('clv').muted};});
 const ext=r.type.includes('mp4')?'mp4':'webm';fs.writeFileSync(OUT+'clip_test.'+ext,Buffer.from(r.data,'base64'));
 console.log('clip',r.type,r.size,'bytes, after: master',r.mg,'speaker',r.spk,'saved',OUT+'clip_test.'+ext);
 await b.close();process.exit(0);})();
