// Walrus: upload a real recorded clip file from the browser and mint a Clip NFT on the live site
const puppeteer=require('puppeteer-core');const fs=require('fs');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');});
 await p.goto('https://loop-lofi.vercel.app/game',{waitUntil:'load'});await sleep(7000);
 const f=fs.readFileSync(process.env.CLIP).toString('base64');
 const r=await p.evaluate(async f=>{LOOPSUI.useGuest();await new Promise(r=>setTimeout(r,1000));const bin=Uint8Array.from(atob(f),c=>c.charCodeAt(0));
   try{const x=await LOOPSUI.clip(new Blob([bin],{type:'video/mp4'}),{title:'Walrus test',kills:3,map:'Base Camp'});return JSON.stringify({blob:x.blob,digest:x.digest,size:bin.length});}catch(e){return 'ERR '+e.message;}},f);
 console.log(r);await b.close();})();
