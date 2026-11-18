// LOOP with sound on and a fresh first visit: plays every yeti sound, runs 20 s of a match, photos of the first time screens
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 let errs=0;const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>{errs++;console.log('PAGEERR',e.message);});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();});
 await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await sleep(1500);await p.screenshot({path:OUT+'f_intro.jpg',type:'jpeg',quality:70});await sleep(4500);
 await p.mouse.click(640,360);await sleep(500);
 console.log('audio',await p.evaluate(()=>{initAudio();audioKick();const c=chickens[1];sCluck(c,0);sBawk(c);sSquawk(c);sDeath(c);sFlap(c);sCrow();return AC?AC.state:'none';}));
 await p.screenshot({path:OUT+'f_menu.jpg',type:'jpeg',quality:70});
 await p.evaluate(()=>$('go').click());await sleep(1500);await p.screenshot({path:OUT+'f_first.jpg',type:'jpeg',quality:70});
 const hasTut=await p.evaluate(()=>!!document.getElementById('tutgo')&&getComputedStyle($('tuto')).display!=='none');console.log('first time screen',hasTut);
 if(hasTut){await p.evaluate(()=>$('tutgo').click());await sleep(6000);await p.screenshot({path:OUT+'f_train.jpg',type:'jpeg',quality:70});await p.evaluate(()=>{if(typeof tutEnd==='function')tutEnd();showMenu();});}
 await p.evaluate(()=>{MODE='f';startMatch();cdT=0;});const t0=Date.now();while(Date.now()-t0<20000){await p.evaluate(()=>{keys.KeyW=true;mouseFire=true;player.aimYaw+=.05;});await sleep(500);}
 await p.screenshot({path:OUT+'f_match.jpg',type:'jpeg',quality:70});console.log('match',await p.evaluate(()=>state+' kills '+player.kills+' bots '+chickens.reduce((a,c)=>a+(c.isP?0:c.kills),0)));
 console.log(errs?'FAILED '+errs:'OK no page errors');await b.close();process.exit(0);})();
