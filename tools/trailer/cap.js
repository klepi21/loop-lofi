// node cap.js W H out.mp4 [stills=N] [only=0,3,5]
const puppeteer=require('puppeteer-core'),{spawn}=require('child_process'),fs=require('fs'),path=require('path');
const W=+process.argv[2],H=+process.argv[3],out=process.argv[4];
const arg=k=>{const a=process.argv.find(x=>x.startsWith(k+'='));return a?a.split('=')[1]:null;};
const stills=arg('stills')?+arg('stills'):0,only=arg('only')?arg('only').split(',').map(Number):null;
(async()=>{
  const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,
    args:['--use-angle=metal','--ignore-gpu-blocklist','--enable-gpu','--hide-scrollbars','--mute-audio','--autoplay-policy=no-user-gesture-required','--window-size='+W+','+H]});
  const p=await b.newPage();await p.setViewport({width:W,height:H,deviceScaleFactor:1});
  p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{const t=m.text();if(!/net::|Failed to load/.test(t))console.log('LOG',t.slice(0,300));});
  await p.evaluateOnNewDocument(o=>{window.requestAnimationFrame=()=>0;window.__ONLY=o;},only);
  await p.goto('http://localhost:8766/index.html',{waitUntil:'load'});await new Promise(r=>setTimeout(r,1500));
  console.log('gl',await p.evaluate(()=>{const g=document.createElement('canvas').getContext('webgl2');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return g?(e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'webgl2'):'NO WEBGL2';}));
  await p.addScriptTag({path:path.join(__dirname,'dir.js')});
  const total=await p.evaluate(()=>DIR.total);console.log('frames',total);
  let ff=null;
  if(!stills){ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','15','-pix_fmt','yuv420p','-movflags','+faststart',out]);ff.stderr.on('data',d=>process.stderr.write(d));}
  else fs.mkdirSync(out,{recursive:true});
  let n=0;const t0=Date.now();
  while(true){const r=await p.evaluate(()=>{try{return DIR.step()?[DIR.si,DIR.sf]:null;}catch(e){return 'ERR '+e.message+' @'+DIR.si+':'+DIR.sf+' '+(e.stack||'').split('\n')[1];}});
    if(!r)break;if(typeof r==='string'){console.log(r);break;}
    if(stills){if((r[1]-1)%stills===Math.min(stills-1,12)||r[1]===1){const buf=await p.screenshot({type:'jpeg',quality:80});fs.writeFileSync(path.join(out,'s'+String(r[0]).padStart(2,'0')+'_'+String(r[1]).padStart(3,'0')+'.jpg'),buf);}}
    else{const buf=await p.screenshot({type:'jpeg',quality:94});if(!ff.stdin.write(buf))await new Promise(res=>ff.stdin.once('drain',res));}
    n++;if(n%150===0)console.log(n,'frames',((Date.now()-t0)/1000).toFixed(0)+'s');}
  const log=await p.evaluate(()=>DIR.log);fs.writeFileSync((stills?path.join(out,'log'):out)+'.json',JSON.stringify(log));
  console.log('done',n,'frames, sfx events',log.length,((Date.now()-t0)/1000).toFixed(0)+'s');
  if(ff){ff.stdin.end();await new Promise(r=>ff.on('close',r));}
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
