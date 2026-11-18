// online match with a wallet: guest wallet, mint, join a short online match on the local server, then save the result to the Yeti NFT
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('http://localhost:8766/index.html?srv=ws://localhost:8099/ws',{waitUntil:'load'});await sleep(7000);
 await p.evaluate(()=>{LOOPSUI.useGuest();});await sleep(1500);
 const m=await p.evaluate(()=>LOOPSUI.mint(0,'Lofi').then(x=>{const y=x.created.find(o=>/::yeti::Yeti/.test(o.type));suiNft=y.id;localStorage.setItem('loop_nft',y.id);return y.id;}).catch(e=>'ERR '+e.message));console.log('minted',m);
 await p.evaluate(()=>{modeSet('f');playGo();});await sleep(5000);console.log('online',await p.evaluate(()=>NET+' '+state+' room '+roomCode));
 for(let i=0;i<60;i++){await sleep(1000);await p.evaluate(()=>{keys.KeyW=true;mouseFire=true;player.aimYaw+=.1;});const s=await p.evaluate(()=>$('lbchain').style.display);if(s==='inline-block'){console.log('lobby button shown after',i,'s');break;}}
 await p.screenshot({path:OUT+'sui_lobby.jpg',type:'jpeg',quality:70});
 const r=await p.evaluate(()=>LOOPSUI.record(suiNft).then(x=>x.digest).catch(e=>'ERR '+e.message));console.log('record',r);
 await sleep(1500);console.log('yeti',await p.evaluate(()=>JSON.stringify(LOOPSUI.st.data.yetis.map(y=>({lv:y.level,k:y.kills,m:y.matches,xp:y.xp})))));
 await b.close();})();
