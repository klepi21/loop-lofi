// spectate check: A plays online, B (a friend) watches from the friends list, C (not a friend) is refused
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
const uid=k=>k.repeat(8)+'-'+k.repeat(4)+'-'+k.repeat(4)+'-'+k.repeat(4)+'-'+k.repeat(12);
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const mk=async(tag,k,name,friends,w,h,mob)=>{const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:w,height:h,isMobile:!!mob,hasTouch:!!mob,deviceScaleFactor:mob?2:1});p.on('pageerror',e=>console.log(tag,'PAGEERR',e.message));
  await p.evaluateOnNewDocument(s=>{if(!sessionStorage.getItem('init')){sessionStorage.setItem('init','1');localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');localStorage.setItem('loop_session',JSON.stringify({at:'testtoken-'+s.k+'-12345678901234567890',rt:'y',exp:Date.now()+3600000,uid:s.uid,name:s.name,has:true}));}},{k,uid:uid(k),name});
  await p.setRequestInterception(true);p.on('request',r=>{const u=r.url(),j=o=>r.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
    if(!/supabase\.co/.test(u))return r.continue();if(r.method()==='OPTIONS')return r.respond({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
    if(/chick_profiles/.test(u)&&r.method()==='GET')return j([{id:uid(k),name,xp:5000,kills:50,deaths:40,matches:9,wins:2,best:7,sel:1,arena:0,extra:{}}]);
    if(/rpc\/chick_friends$/.test(u))return j(friends.map(([fk,fn])=>({id:uid(fk),name:fn,xp:3000,sel:2,st:'ok'})));return j([]);});
  await p.goto('http://localhost:8766/index.html?browser=1&srv=ws://localhost:8099/ws',{waitUntil:'load'});await sleep(2800);return p;};
 const A=await mk('A','a','Dinos',[['b','alexandros']],1100,620,0),B=await mk('B','b','alexandros',[['a','Dinos']],844,390,1),C=await mk('C','c','Stranger7',[],900,500,0);await sleep(3500);
 await A.evaluate(()=>{modeSet('t');playGo();});await sleep(7000);const code=await A.evaluate(()=>roomCode);console.log('A plays in room',code,await A.evaluate(()=>state+' '+MODE));
 await B.evaluate(()=>{$('nfr').click();});await sleep(4500);
 console.log('B friends row:',await B.evaluate(()=>[...document.querySelectorAll('#frlist .frr')].map(r=>r.textContent).join(' / ')));await B.screenshot({path:OUT+'spec_friends.jpg',type:'jpeg',quality:75});
 await B.evaluate(()=>{const w=document.querySelector('#frlist button[data-a=w]');if(w)w.click();});await sleep(6000);
 console.log('B watching:',await B.evaluate(()=>JSON.stringify({SPEC,NET,state,mode:MODE,chickens:chickens.length,target:specT&&specT.name,banner:$('specn').textContent,gameClass:$('game').className,playerHidden:player.hidden,alive:chickens.filter(c=>c.alive).length,cam:[cam.x,cam.y,cam.z].map(v=>+v.toFixed(1)),tgt:specT&&[specT.x,specT.z].map(v=>+v.toFixed(1))})));
 await B.screenshot({path:OUT+'spec_watch.jpg',type:'jpeg',quality:78});
 await B.evaluate(()=>specBtn('specn'));await sleep(1500);console.log('B next player:',await B.evaluate(()=>$('specn').textContent+' | first person '+fp));await B.evaluate(()=>specBtn('specv'));await sleep(1200);await B.screenshot({path:OUT+'spec_fp.jpg',type:'jpeg',quality:78});await B.evaluate(()=>specBtn('specv'));
 console.log('server sees:',await (await fetch('http://localhost:8099/status')).text().then(t=>t.slice(0,120)));
 console.log('A still sees 8 seats, itself in:',await A.evaluate(()=>chickens.length+' chickens, humans '+chickens.filter(c=>c.human).map(c=>c.name).join(',')));
 // a stranger with the room code is refused
 await C.evaluate(c=>{specJoin(c,'Dinos');},code);await sleep(3500);console.log('C (not a friend):',await C.evaluate(()=>'SPEC '+SPEC+' NET '+NET+' | '+$('onc').textContent+' | toast '+$('toast').textContent));
 // match end: B stays and sees the next one
 for(let i=0;i<90;i++){await sleep(900);await A.bringToFront();await A.keyboard.down('KeyW');await sleep(80);await A.keyboard.up('KeyW');if(await B.evaluate(()=>state==='over'&&$('lobby').style.display==='flex'))break;}
 console.log('debug: B toast',await B.evaluate(()=>$('toast').textContent+' | onc '+$('onc').textContent),'| A',await A.evaluate(()=>NET+' '+state+' afk '+afkT.toFixed(1)+' onc '+$('onc').textContent));
 console.log('B at match end:',await B.evaluate(()=>state+' lobby '+$('lobby').style.display+' | '+$('lbtitle').textContent+' | '+$('lbres').textContent+' | xp '+profile.xp+' matches '+profile.matches));await B.screenshot({path:OUT+'spec_lobby.jpg',type:'jpeg',quality:75});
 await B.evaluate(()=>$('lbleave').click());await sleep(800);console.log('B after LEAVE:',await B.evaluate(()=>'SPEC '+SPEC+' NET '+NET+' state '+state+' chickens '+chickens.length+' player off '+player.off));
 await b.close();process.exit(0);})();
