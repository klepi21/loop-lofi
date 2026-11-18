// Sui page in the browser: guest wallet, mint a Yeti NFT through the local server, photo of the page
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));const OUT=__dirname+'/out/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();await p.setViewport({width:1280,height:720});p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200));});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('https://loop-lofi.vercel.app/game',{waitUntil:'load'});await sleep(7000);
 console.log('lsui',await p.evaluate(()=>!!window.LOOPSUI&&JSON.stringify({ready:LOOPSUI.st.ready,err:LOOPSUI.st.err,cfg:!!LOOPSUI.st.cfg})));
 await p.evaluate(()=>$('nsui').click());await sleep(1500);await p.screenshot({path:OUT+'live_sui0.jpg',type:'jpeg',quality:70});
 await p.evaluate(()=>document.querySelector('#sui [data-s="guest"]').click());await sleep(2500);
 await p.evaluate(()=>document.querySelector('#sui [data-s="mint"]').click());
 for(let i=0;i<30;i++){await sleep(1000);const d=await p.evaluate(()=>LOOPSUI.st.data&&LOOPSUI.st.data.yetis.length);if(d)break;}
 await sleep(1500);await p.screenshot({path:OUT+'live_sui1.jpg',type:'jpeg',quality:70});
 console.log('state',await p.evaluate(()=>JSON.stringify({addr:LOOPSUI.st.addr,yetis:LOOPSUI.st.data&&LOOPSUI.st.data.yetis.map(y=>y.name+' lv'+y.level),nft:suiNft,msg:$('suiw').innerText.slice(-120)})));
 await b.close();})();
