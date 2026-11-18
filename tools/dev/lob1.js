// scoreboard after an online match (two signed in test players) and the kill badge
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
const uid=k=>k.repeat(8)+'-'+k.repeat(4)+'-'+k.repeat(4)+'-'+k.repeat(4)+'-'+k.repeat(12);
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const mk=async(tag,k,name,w,h,mob)=>{const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:w,height:h,isMobile:!!mob,hasTouch:!!mob,deviceScaleFactor:mob?2:1});p.on('pageerror',e=>console.log(tag,'PAGEERR',e.message));
  await p.evaluateOnNewDocument(s=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');localStorage.setItem('loop_session',JSON.stringify({at:'testtoken-'+s.k+'-12345678901234567890',rt:'y',exp:Date.now()+3600000,uid:s.uid,name:s.name,has:true}));},{k,uid:uid(k),name});
  await p.setRequestInterception(true);p.on('request',r=>{const u=r.url(),j=o=>r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
    if(!/supabase\.co/.test(u))return r.continue();if(r.method()==='OPTIONS')return r.respond({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
    if(/chick_profiles/.test(u)&&r.method()==='GET')return j([{id:uid(k),name,xp:5000,kills:50,deaths:40,matches:9,wins:2,best:7,sel:1,arena:0,extra:{}}]);return j([]);});
  await p.goto('http://localhost:8766/index.html?browser=1&srv=ws://localhost:8099/ws',{waitUntil:'load'});await sleep(2800);return p;};
 const A=await mk('A','a','Dinos',844,390,1),B=await mk('B','b','alexandros',1280,720,0);await sleep(1500);
 await A.evaluate(()=>{modeSet('f');playGo();});await sleep(2500);const code=await A.evaluate(()=>roomCode);await B.evaluate(c=>{joinCode=c;netJoin();},code);await sleep(5000);
 await A.evaluate(()=>{medal('DOUBLE PECK');});await sleep(700);await A.screenshot({path:OUT+'medal.jpg',type:'jpeg',quality:80});console.log('badge image loaded:',await A.evaluate(()=>$('medali').naturalWidth));
 for(let i=0;i<70;i++){await sleep(900);for(const P of [A,B]){await P.bringToFront();await P.keyboard.down('KeyW');await sleep(60);await P.keyboard.up('KeyW');}if(await A.evaluate(()=>state==='over'&&$('lobby').style.display==='flex'))break;}
 await sleep(1200);console.log('A rows:',await A.evaluate(()=>[...document.querySelectorAll('#lbs tr')].slice(1).map(r=>r.children[1].textContent+' h'+Math.round(r.getBoundingClientRect().height)).join(' | ')));
 await A.bringToFront();await A.screenshot({path:OUT+'lob_phone.jpg',type:'jpeg',quality:80});await B.bringToFront();await B.screenshot({path:OUT+'lob_desk.jpg',type:'jpeg',quality:80});
 await b.close();process.exit(0);})();
