// WATCH against a server that does not answer (or answers late): no page errors while waiting, and a clear message at the end
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let errs=0;const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage();p.on('pageerror',e=>{errs++;if(errs<3)console.log('PAGEERR',e.message);});
 await p.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('loop_tut','1');localStorage.setItem('loop_mute','1');localStorage.setItem('loop_session',JSON.stringify({at:'testtoken-a-12345678901234567890',rt:'y',exp:Date.now()+3600000,uid:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',name:'Dinos',has:true}));});
 await p.goto('http://localhost:8766/index.html?browser=1&srv=ws://localhost:8097/ws',{waitUntil:'load'});await sleep(3000);   // nothing listens on 8097
 await p.evaluate(()=>specJoin('ABCD','x'));await sleep(9000);
 console.log('after WATCH with no server:',await p.evaluate(()=>'SPEC '+SPEC+' waiting '+netWait+' | '+$('toast').textContent+' | error box "'+$('err').textContent+'"'),'| page errors',errs);await b.close();process.exit(errs?1:0);})();
