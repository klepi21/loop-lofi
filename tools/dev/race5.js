// chicken derby on a phone: item button shows the item and uses it on tap; JUMP right behind a rival steals their chicken
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_demo','1');localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?browser=1',{waitUntil:'load'});await sleep(2800);
 const cdp=await p.target().createCDPSession();const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 await p.evaluate(()=>{touchMode=true;diff=1;vSel=true;MODE='r';startMatch();});await sleep(4400);
 await T('touchStart',[{x:150,y:280,id:1}]);await T('touchEnd',[]);await sleep(200);
 await p.evaluate(()=>{player.item='gold';});await sleep(300);
 const pos=id=>p.evaluate(id=>{const e=$(id).getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2,$(id).textContent,getComputedStyle($(id)).display,$(id).className];},id);
 const bg=await pos('bg');console.log('item button',bg);await p.screenshot({path:OUT+'race_phone_item.jpg',type:'jpeg',quality:75});
 await T('touchStart',[{x:bg[0],y:bg[1],id:3}]);await T('touchEnd',[]);await sleep(150);
 console.log('after tap',await p.evaluate(()=>({item:player.item,boost:+(player.boostT||0).toFixed(2)})),await pos('bg'));
 const victim=await p.evaluate(()=>{const o=chickens[2];const fx=Math.sin(player.yaw),fz=Math.cos(player.yaw);o.x=player.x+fx*2.4;o.z=player.z+fz*2.4;o.ti=player.ti;o.blkT=0;o.blk=false;return o.name;});
 const bj=await pos('bj');await T('touchStart',[{x:bj[0],y:bj[1],id:4}]);await sleep(60);await T('touchEnd',[]);await sleep(250);
 await p.screenshot({path:OUT+'race_phone_hijack.jpg',type:'jpeg',quality:75});await sleep(500);
 console.log('hijack',victim,await p.evaluate(n=>{const o=chickens.find(c=>c.name===n);return {meOnFoot:player.dis,victimOnFoot:o.dis,msg:$('msg').textContent};},victim));
 await b.close();process.exit(0);})();
