// LOOP demo video director: runs inside the game page and drives it frame by frame (30 fps).
// Part 1 action trailer, part 2 demo sections with big title cards, part 3 end card. Sounds are logged and rebuilt offline.
(()=>{
const D=window.DIR={f:0,log:[],cine:null,tgt:null,pilot:null,lt:0,rec:false,si:-1,sf:0,done:false,marks:{}};
play=function(name,vol,pan,rate,delay){if(vol<.004)return true;if(D.rec)D.log.push(['p',+(D.f/30+(delay||0)).toFixed(3),name,+vol.toFixed(3),+(rate||1).toFixed(3)]);return true;};
tone=function(type,f,dur,vol,pan,o){if(vol<.004)return;o=o||{};if(D.rec)D.log.push(['t',+(D.f/30+(o.delay||0)).toFixed(3),type,f,dur,+vol.toFixed(3)]);};
noise=function(dur,vol,pan,type,f0,f1,q,delay){if(vol<.004)return;if(D.rec)D.log.push(['n',+(D.f/30+(delay||0)).toFixed(3),dur,+vol.toFixed(3),type,f0,f1||0]);};
function sfx(name,vol,rate){D.log.push(['p',+(D.f/30).toFixed(3),name,vol,rate||1]);}
function mark(k){D.marks[k]=+(D.f/30).toFixed(3);}
const AN=new Map();let vms=0;
function sync(){for(const a of document.getAnimations()){if(!AN.has(a)){AN.set(a,vms);try{a.pause();}catch(e){}}try{a.currentTime=Math.max(0,vms-AN.get(a));}catch(e){}}}
let simMs=1000;
function adv(speed){paused=false;for(let k=0;k<2;k++){simMs+=16.6667*(speed==null?1:speed);frame(simMs);}}
function pre(n,speed){const r=D.rec;D.rec=false;for(let i=0;i<n;i++){adv(speed);vms+=33.333;sync();}D.rec=r;}
const _uc=updateCamera;
updateCamera=function(t,dt){if(!D.cine){_uc(t,dt);return;}const c=D.cine(D.lt);let fov=(c.fov||55)*PI/180;const asp=W/H;
  let ex=c.ex,ey=c.ey,ez=c.ez;const dx=c.tx-ex,dy=c.ty-ey,dz=c.tz-ez,l=Math.hypot(dx,dy,dz)||1,fx=dx/l,fy=dy/l,fz=dz/l;
  if(shake>.01){ex+=rand(-1,1)*shake*.22;ey+=rand(-1,1)*shake*.22;ez+=rand(-1,1)*shake*.22;}
  cam.x=ex;cam.y=ey;cam.z=ez;cam.fx=fx;cam.fy=fy;cam.fz=fz;cam.fov=fov;camD=4;
  lookDir(VIEW,ex,ey,ez,fx,fy,fz,cam);persp(PROJ,fov,asp,.1,900);mulO(VP,0,PROJ,VIEW);};
const _ct=crossTarget;crossTarget=function(){return D.pilot?(D.tgt&&D.tgt.alive?D.tgt:null):_ct();};
const _pi=playerInput;playerInput=function(){_pi();if(D.pilot)D.pilot();};
// ---------- overlays ----------
const root=$('root');const LOGO=$('inlogo').src;
const st=document.createElement('style');st.textContent=`
#TT{position:absolute;left:0;right:0;text-align:center;z-index:6;pointer-events:none;font-family:"PG",sans-serif;opacity:0}
#TTm{font-size:calc(var(--vw)*5.4);line-height:.95;color:#E6F1FF;-webkit-text-stroke:calc(var(--vw)*.38) #0B1F44;paint-order:stroke fill;text-shadow:0 calc(var(--vw)*.55) 0 #163F9E,0 calc(var(--vw)*.75) 0 #0B1F44,0 0 calc(var(--vw)*3) rgba(0,209,255,.55);letter-spacing:calc(var(--vw)*.2);padding:0 4%}
#TTs{font-size:calc(var(--vw)*2.5);color:#7FE9FF;-webkit-text-stroke:calc(var(--vw)*.16) #0B1F44;paint-order:stroke fill;letter-spacing:calc(var(--vw)*.45);margin-top:calc(var(--vw)*1)}
#FL{position:absolute;inset:0;background:#E6F1FF;opacity:0;z-index:9;pointer-events:none}
#CARD{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:"PG",sans-serif;background:radial-gradient(ellipse at 50% 45%,rgba(42,107,255,.55),rgba(11,31,68,.94) 70%)}
#CARDn{font-size:calc(var(--vw)*2.2);color:#00D1FF;letter-spacing:calc(var(--vw)*.6);margin-bottom:calc(var(--vw)*.8)}
#CARDt{font-size:calc(var(--vw)*6.4);line-height:.95;color:#E6F1FF;-webkit-text-stroke:calc(var(--vw)*.35) #0B1F44;paint-order:stroke fill;text-shadow:0 calc(var(--vw)*.55) 0 #163F9E,0 0 calc(var(--vw)*4) rgba(0,209,255,.6);letter-spacing:calc(var(--vw)*.2);padding:0 5%}
#CARDs{font-family:ui-rounded,"SF Pro Rounded",system-ui,sans-serif;font-weight:800;font-size:calc(var(--vw)*1.9);color:#A9B8FF;margin-top:calc(var(--vw)*1.6);letter-spacing:0;max-width:70%}
#CARDl{height:calc(var(--vw)*.5);width:0;background:linear-gradient(90deg,#2A6BFF,#00D1FF);border-radius:9px;margin-top:calc(var(--vw)*1.8)}
#CAP{position:absolute;left:calc(var(--vw)*3);bottom:calc(var(--vw)*2.6);z-index:7;pointer-events:none;font-family:"PG",sans-serif;font-size:calc(var(--vw)*2.3);color:#E6F1FF;background:rgba(11,31,68,.78);border:calc(var(--vw)*.18) solid #00D1FF;border-radius:calc(var(--vw)*1.4);padding:calc(var(--vw)*.7) calc(var(--vw)*1.6);letter-spacing:calc(var(--vw)*.12);opacity:0;box-shadow:0 0 calc(var(--vw)*2) rgba(0,209,255,.35)}
#CAP small{display:block;font-family:ui-rounded,system-ui,sans-serif;font-weight:800;font-size:calc(var(--vw)*1.2);color:#A9B8FF;letter-spacing:0;margin-top:calc(var(--vw)*.2)}
#SLAM{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;background:radial-gradient(ellipse at center,rgba(42,107,255,.35),rgba(11,31,68,.75))}
#SLAM img{width:calc(var(--vw)*40);filter:drop-shadow(0 calc(var(--vw)*1.4) calc(var(--vw)*2.4) rgba(0,0,30,.6)) drop-shadow(0 0 calc(var(--vw)*4) rgba(0,209,255,.35))}
#SLAMs{font-family:"PG",sans-serif;font-size:calc(var(--vw)*2.6);color:#7FE9FF;-webkit-text-stroke:calc(var(--vw)*.15) #0B1F44;paint-order:stroke fill;letter-spacing:calc(var(--vw)*.5);margin-top:calc(var(--vw)*.6)}
#EC{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:"PG",sans-serif;background:radial-gradient(ellipse at center,rgba(42,107,255,.45),rgba(11,31,68,.95))}
#EC img{width:calc(var(--vw)*30);filter:drop-shadow(0 calc(var(--vw)*1) calc(var(--vw)*2) rgba(0,0,30,.6))}
#ECt{font-size:calc(var(--vw)*2.6);color:#7FE9FF;letter-spacing:calc(var(--vw)*.5);margin-top:calc(var(--vw)*.5)}
#ECp{font-size:calc(var(--vw)*3.4);color:#0B1F44;background:linear-gradient(#7FE9FF,#2A9BFF);border-radius:calc(var(--vw)*6);padding:calc(var(--vw)*1.1) calc(var(--vw)*4);margin-top:calc(var(--vw)*2.2);box-shadow:0 calc(var(--vw)*.5) 0 #163F9E,0 0 calc(var(--vw)*3) rgba(0,209,255,.5)}
#ECu{font-size:calc(var(--vw)*2.4);color:#E6F1FF;margin-top:calc(var(--vw)*1.6);letter-spacing:calc(var(--vw)*.25)}
#ECs{font-family:ui-rounded,system-ui,sans-serif;font-weight:800;font-size:calc(var(--vw)*1.35);color:#A9B8FF;margin-top:calc(var(--vw)*1.2);letter-spacing:calc(var(--vw)*.1)}
#ECc{position:absolute;left:0;right:0;bottom:calc(var(--vw)*1.2);font-family:ui-rounded,system-ui,sans-serif;font-weight:600;font-size:calc(var(--vw)*.9);color:#fff;opacity:.7}
#medal{display:none!important}#kpop,#hs,#cd{z-index:5}#kpop,#hs{zoom:1.3}body.ttl #kpop{visibility:hidden}#TT{z-index:48}#CAP{z-index:49}#CARD,#SLAM,#EC{z-index:50}#FL{z-index:60}#sui .pgin{zoom:1.45}#lock{zoom:1.25}#clipv .pgin{zoom:1.8}#over{zoom:1.3}#hurt{display:none!important}#msg{visibility:hidden}#yolk{display:none!important}
body.nox #cross,body.nox #hit{visibility:hidden}#cross,#hit{zoom:1.5}#toast,#upd,#intro{display:none!important}`;document.head.appendChild(st);
root.insertAdjacentHTML('beforeend','<div id="TT"><div id="TTm"></div><div id="TTs"></div></div><div id="FL"></div><div id="CAP"></div>'+
 '<div id="CARD"><div id="CARDn"></div><div id="CARDt"></div><div id="CARDs"></div><div id="CARDl"></div></div>'+
 '<div id="SLAM"><img src="'+LOGO+'"><div id="SLAMs">NOW HE IS OUT OF PATIENCE</div></div>'+
 '<div id="EC"><img src="'+LOGO+'"><div id="ECt">CHILL VIBES. COLD HITS.</div><div id="ECp">PLAY FREE NOW</div><div id="ECu">loop-lofi.vercel.app</div><div id="ECs">BUILT ON SUI &nbsp; ZKLOGIN &nbsp; SPONSORED GAS &nbsp; YETI NFTS &nbsp; WALRUS</div><div id="ECc">Music: Exhilarate and Chill Wave by Kevin MacLeod (incompetech.com), licensed CC BY 4.0. Made for CLAY, the Lofi the Yeti hackathon on Sui.</div></div>');
const ease=x=>1-Math.pow(1-clamp(x,0,1),3);
function titleAt(T,i){const e=$('TT');if(!T||i<T.at||i>=T.at+T.dur){return false;}const tl=i-T.at;
  if(tl===0){$('TTm').textContent=T.text;$('TTs').textContent=T.sub||'';e.style.top=T.pos==='c'?'34%':T.pos==='t'?'8%':'70%';if(T.snd!==false)sfx('ring',.45,T.rate||.8);}
  const sc=tl<6?2.1-1.1*ease(tl/6):1+(tl-6)*.0014,op=tl<2?(tl+1)/3:tl>T.dur-5?(T.dur-tl)/5:1;
  e.style.opacity=op;e.style.transform='scale('+(sc*(T.big||1)).toFixed(4)+') rotate(-2deg)';return true;}
function cap(i,a,b,t0,t1){if(i<t0||i>=t1){if(i===t1)$('CAP').style.opacity=0;return;}const e=$('CAP');if(i===t0){e.innerHTML=a+(b?'<small>'+b+'</small>':'');}const v=i<t0?0:i<t0+6?(i-t0)/6:i>t1-6?Math.max(0,(t1-i)/6):1;e.style.opacity=i>=t0&&i<t1?v:0;e.style.transform='translateX('+((1-ease(clamp((i-t0)/8,0,1)))*-40).toFixed(1)+'px)';}
function hud(){for(const id of ['tl','tr','hint','feed','tc','xname','ts'])$(id).style.visibility='hidden';}
function hudOn(){for(const id of ['tl','tr','feed','tc'])$(id).style.visibility='visible';}
function pages(){document.querySelectorAll('.pg').forEach(e=>{e.style.display='none';e.classList.remove('on');});lkOpen=false;}
function go(a,look,mode){document.body.classList.remove('nomedal');pages();if(look!=null){sel=look;assignLooks(sel);}MODE=mode||'f';modeSel=MODE;if(arenaI!==a)buildWorld(a);D.cine=null;D.pilot=null;D.tgt=null;fp=false;adsW=false;startMatch();cdT=0;cdN=0;$('cd').classList.remove('go','end');$('cd').textContent='';matchT=150;setMsg('',0);
  $('game').style.display='block';$('menu').style.display='none';$('over').style.display='none';hud();$('c').style.filter='';$('EC').style.display='none';$('SLAM').style.display='none';
  for(const c of chickens)if(!c.isP&&Math.random()<.7){c.hat=1+Math.floor(Math.random()*16);if(c.hat===11)c.hat=13;c.fit=Math.floor(Math.random()*13);}}
function place(x,z,yaw){const p=player;p.x=x;p.z=z;p.y=0;p.vx=p.vy=p.vz=0;p.aimYaw=p.yaw=yaw;p.aimPitch=0;camY=0;kcYaw=yaw;}
function free(x,z){let k=0;while(blockedAt(x,z,0)&&k<12){x*=.93;z*=.93;k++;}return [x,z];}
function gather(n,dist,spread,hp){const p=player;let j=0;for(let i=1;i<8;i++){const c=chickens[i];if(!c.alive)respawn(c);c.invuln=0;c.spawnT=0;c.target=null;c.route=null;c.goal=null;
    if(j<n){const a=p.aimYaw+(j-(n-1)/2)*(spread||.32),d=dist+(j%2)*2.2+(j%3)*.8;let [x,z]=free(p.x+Math.sin(a)*d,p.z+Math.cos(a)*d);c.x=x;c.z=z;c.y=0;c.vx=c.vz=0;c.aimYaw=c.yaw=a+PI;c.hp=hp||45;j++;}
    else{const a=p.aimYaw+PI+(i-4)*.35;let [x,z]=free(p.x+Math.sin(a)*30,p.z+Math.cos(a)*30);const r=Math.hypot(x,z);if(r>24){x*=24/r;z*=24/r;}c.x=x;c.z=z;c.y=0;}}}
function mkPilot(o){o=o||{};let t=0;return function(){const p=player;t+=1/60;p.hp=100;p.stamina=1;p.dmgT=0;if(o.rapid)p.rapidT=5;
  for(const c of chickens)if(c!==p&&c.alive&&c.hp>(o.hp||40))c.hp=o.hp||40;
  let b=D.tgt&&D.tgt.alive&&!D.tgt.hidden?D.tgt:null;
  if(!b){let bd=1e9;for(const c of chickens){if(c===p||!c.alive||c.hidden||c.invuln>0||(p.team>=0&&c.team===p.team))continue;const d=Math.hypot(c.x-p.x,c.z-p.z)+(los(p,c)?0:40);if(d<bd){bd=d;b=c;}}D.tgt=b;}
  if(!b){p.fire=false;p.wx=p.wz=0;return;}
  const hx=b.x+(o.head?Math.sin(b.yaw)*.3:0),hz=b.z+(o.head?Math.cos(b.yaw)*.3:0),hy=b.y+(o.head?1.17:.65);
  let yaw=p.aimYaw;const off=(D.cine||fp)?0:.65;for(let k=0;k<2;k++){const ox=p.x-Math.cos(yaw)*off,oz=p.z+Math.sin(yaw)*off;yaw=Math.atan2(hx+b.vx*.06-ox,hz+b.vz*.06-oz);}
  const d=Math.hypot(hx-p.x,hz-p.z),pit=fp?Math.atan2(hy-(p.y+.98),d):Math.atan2(hy-(p.y+1.6),d+4.2);
  const df=angDiff(p.aimYaw,yaw);p.aimYaw+=clamp(df,-.16,.16);p.aimPitch+=(pit-p.aimPitch)*.3;
  p.fire=Math.abs(df)<.14&&d<45&&los(p,b);
  const f=d>(o.far||11)?1:d<(o.near||6)?-1:0,sd=Math.sin(t*(o.sf||2.4))>0?1:-1,s=Math.sin(p.aimYaw),c=Math.cos(p.aimYaw),mx=sd*(o.strafe==null?.8:o.strafe),mz=f;
  p.wx=s*mz-c*mx;p.wz=c*mz+s*mx;if(o.jump&&p.onG&&Math.sin(t*3.3)>.985)p.jumpQ=.15;p.sprintW=false;};}
const mid=()=>{const p=player,b=D.tgt&&D.tgt.alive?D.tgt:p;return [(p.x+b.x)/2,(p.z+b.z)/2];};
const CAM={
  orbit:(c,r,h,w,ph,fov,ty)=>lt=>{const a=ph+lt*w;return {ex:c.x+Math.sin(a)*r,ey:Math.max(.35,c.y+h),ez:c.z+Math.cos(a)*r,tx:c.x,ty:c.y+(ty==null?.8:ty),tz:c.z,fov};},
  dolly:(a,b,ta,tb,T,fov)=>lt=>{const k=ease(lt/T)*.6+clamp(lt/T,0,1)*.4;return {ex:a[0]+(b[0]-a[0])*k,ey:a[1]+(b[1]-a[1])*k,ez:a[2]+(b[2]-a[2])*k,tx:ta[0]+(tb[0]-ta[0])*k,ty:ta[1]+(tb[1]-ta[1])*k,tz:ta[2]+(tb[2]-ta[2])*k,fov};},
  side:(dist,h,fov,sgn)=>lt=>{const p=player,[mx,mz]=mid(),rx=-Math.cos(p.aimYaw)*(sgn||1),rz=Math.sin(p.aimYaw)*(sgn||1);return {ex:p.x+rx*dist-Math.sin(p.aimYaw)*2.2,ey:p.y+h,ez:p.z+rz*dist-Math.cos(p.aimYaw)*2.2,tx:mx,ty:1.1,tz:mz,fov};},
};
function bombTo(tx,tz){const p=player,bx=p.x+Math.sin(p.aimYaw)*.55,by=p.y+1.2,bz=p.z+Math.cos(p.aimYaw)*.55,T=.8;p.recoil=1;sFlap(p);
  nades.push({x:bx,y:by,z:bz,vx:(tx-bx)/T,vy:(.35-by)/T+.5*NG*T,vz:(tz-bz)/T,o:p,fuse:T});}
let PIN=null;function pin(){PIN=[];for(let i=1;i<8;i++){const c=chickens[i];PIN.push([c,c.x,c.z]);}}function hold(){if(PIN)for(const [c,x,z] of PIN){if(c.alive){c.x=x;c.z=z;c.vx=c.vz=0;c.hp=100;}}}
// ---------- the Sui pages, with a demo wallet so every state can be shown ----------
const ADDR='0x7a3f9c1e5b2d48a6c0f17e93d4b8a52c6e19f0b7d3a84c25e6f91b0d7c3a2e48';
const Y=(id,skin,name,lv,k,w,m)=>({id,skin,name,level:lv,kills:k,deaths:Math.round(k*.6),wins:w,matches:m,xp:lv*300-120,seq:m,image:'/nft/'+skin+'.png'});
const TOURS=[{id:'0x449a5b9e605b7f9f2fd4e6b81170055a7c8034d7de0200d33ba0f77e4971694f',name:'LOOP Launch Cup',pot:'4000000000',starts:Date.now()-3600e3,ends:Date.now()+6*86400e3,entrants:['0x1','0x2','0x3','0x4','0x5','0x6','0x7','0x8','0x9','0xa','0xb'],paid:false}];
const BOARD=[['Kangri_sui',2350,58,9],['blizzard85',2120,51,8],['Player',1840,44,6],['momo_lofi',1610,39,5],['TenzingSUI',1390,33,4],['frostbite7',1150,27,3]].map(r=>({addr:'0x'+'1'.repeat(64),name:r[0],xp:r[1],kills:r[2],wins:r[3],matches:r[3]+6}));
function wallet(state){const L=window.LOOPSUI||(window.LOOPSUI={});
  L.refresh=()=>Promise.resolve();L.tours=()=>Promise.resolve(TOURS);L.board=()=>Promise.resolve(BOARD);
  L.explorer=a=>'https://suiscan.xyz/devnet/account/'+a;L.walrus=b=>'https://aggregator.walrus-testnet.walrus.space/v1/blobs/'+b;
  L.st=Object.assign({ready:true,addr:'',kind:'',name:'',data:null,busy:'',err:'',cfg:{}},state);}
function suiPage(){$('menu').style.display='block';$('game').style.display='none';showMenu();pages();suiMsg='';suiTours=TOURS;suiBoard=BOARD;const e=$('sui');e.style.display='block';e.scrollTop=0;e.classList.add('on');suiUI();}
function glowBtn(sel,on){const b=document.querySelector(sel);if(b){b.style.boxShadow=on?'0 0 0 4px #00D1FF,0 0 30px rgba(0,209,255,.9)':'';b.style.transform=on?'scale(1.08)':'';}}
// ---------- timeline ----------
let boomC=[0,0];const S=[];
const CARD=(num,title,sub)=>({n:72,card:1,noflash:true,setup(){pages();$('menu').style.display='none';$('game').style.display='block';hud();D.pilot=null;D.cine=CAM.orbit({x:0,y:0,z:0},24,8,.2,Math.random()*6,54,1.5);$('CARDn').textContent=num;$('CARDt').textContent=title;$('CARDs').textContent=sub||'';$('CARD').style.display='flex';sfx('ring',.55,.6);sfx('pop',.35,.5);},
  tick(i){const c=$('CARD');c.style.opacity=i<6?i/6:i>64?(72-i)/8:1;$('CARDt').style.transform='scale('+(i<8?1.6-.6*ease(i/8):1+(i-8)*.0012).toFixed(4)+')';$('CARDl').style.width=(ease((i-4)/30)*22)+'vw';},
  end(){$('CARD').style.display='none';$('CARD').style.opacity=1;}});
function bg(a,lt0){/* a slow orbit behind title cards */if(arenaI!==a){go(a,0);}D.pilot=null;D.cine=CAM.orbit({x:0,y:0,z:0},22,7,.25,lt0||0,52,1.5);}
// PART 1: action trailer
S.push({n:126,noflash:true,setup(){go(3,0);place(0,7,PI);gather(0,9,.3,100);for(let i=1;i<8;i++){chickens[i].alive=false;chickens[i].hidden=true;}state='over';pre(4);
   D.cine=CAM.dolly([9,1.4,14],[3.2,1.1,4.6],[0,1.6,0],[0,1.2,0],4.2,46);mark('start');},
  titles:[{text:'FROZEN IN HIMALAYAN ICE',at:10,dur:52,pos:'b',snd:false},{text:'FOR A THOUSAND YEARS',at:66,dur:56,pos:'b',rate:.6}]});
S.push({n:60,setup(){go(1,0);place(0,10,PI);gather(0,9,.3,100);const L=chickens[1];setLook(L,ROSTER[0]);L.hat=0;L.fit=0;for(let i=2;i<8;i++){chickens[i].alive=false;chickens[i].hidden=true;}
   L.alive=true;L.hidden=false;L.x=0;L.z=6;L.y=0;L.yaw=L.aimYaw=0;L.vx=L.vz=0;L.thinkT=99;L.fire=false;state='over';
   D.cine=lt=>({ex:0,ey:1.2,ez:7.7-lt*.25,tx:0,ty:1.12,tz:6,fov:38});},
  tick(i){const L=chickens[1];L.x=0;L.z=6;L.vx=L.vz=0;L.yaw=L.aimYaw=0;L.blink=i<20?-.1:1;L.aimPitch=-.05;},titles:[{text:'HE WOKE UP CHILL',at:14,dur:44,pos:'b'}]});
S.push({n:84,noflash:true,setup(){go(0,0);place(0,-12,0);gather(6,9,.35,100);D.pilot=mkPilot({hp:100});pre(10);D.cine=CAM.orbit({x:0,y:0,z:-4},24,6,.5,2.2,54,1);$('SLAM').style.display='flex';mark('slam');sfx('fanfare',.9,1);shake=1;},
  tick(i){const s=$('SLAM');s.style.opacity=i>74?(84-i)/10:1;s.querySelector('img').style.transform='scale('+(i<7?2.4-1.4*ease(i/7):1+i*.0009).toFixed(4)+') rotate('+(i<7?-6+6*ease(i/7):0).toFixed(2)+'deg)';$('SLAMs').style.opacity=clamp((i-10)/8,0,1);$('c').style.filter='brightness(.75)';},
  end(){$('SLAM').style.display='none';$('c').style.filter='';}});
const ACT=[
 {n:66,setup(){go(0,0);place(-8,-13,.5);gather(4,10,.3);D.pilot=mkPilot({jump:true});pre(22);},titles:[{text:'SNOWBALL BATTLES',at:4,dur:58,pos:'b'}]},
 {n:62,setup(){go(0,3);place(-6,6,2.3);gather(4,9,.34);D.pilot=mkPilot({strafe:.5,head:true,hp:30});pre(22);D.cine=CAM.side(4.6,1.6,56,1);}},
 {n:62,setup(){go(2,5);place(-10,8,2.2);gather(5,10,.26);D.pilot=mkPilot({rapid:true,strafe:.45,hp:55});fp=true;pre(20);},titles:[{text:'YETI EYES VIEW',at:4,dur:54,pos:'b'}]},
 {n:40,setup(){go(5,1);place(-13,-6,1.15);gather(6,12.5,.13,100);let cx=0,cz=0;for(let i=1;i<=6;i++){cx+=chickens[i].x;cz+=chickens[i].z;}boomC=[cx/6,cz/6];for(const q of pots){q.alive=false;q.resp=99;}pre(3);pin();
   D.cine=lt=>({ex:boomC[0]+5.2,ey:1.1+lt*.2,ez:boomC[1]-6.4+lt*.5,tx:boomC[0]-1.2,ty:1.5,tz:boomC[1],fov:56});},tick(i){player.hp=100;hold();if(i===16)bombTo(boomC[0],boomC[1]);},titles:[{text:'ICE BOMBS',at:2,dur:36,pos:'b'}]},
 {n:80,speed:.3,noflash:true,setup(){PIN=null;D.cine=lt=>({ex:boomC[0]+5.2+lt*.9,ey:1.3+lt*.75,ez:boomC[1]-5.9-lt*1.1,tx:boomC[0]-1.2,ty:1.8+lt*.75,tz:boomC[1],fov:57});},tick(){player.hp=100;}},
 {n:72,setup(){go(4,6);place(2,-12,.3);gather(5,9,.3,60);dogSpawn(player);D.pilot=mkPilot({hp:30,strafe:.5});pre(30);const p=player;D.cine=lt=>{const d=dogs[0]||p;return {ex:d.x+Math.sin(p.aimYaw+2.2)*4.5,ey:1.6,ez:d.z+Math.cos(p.aimYaw+2.2)*4.5,tx:d.x,ty:.7,tz:d.z,fov:52};};},
   tick(){for(const d of dogs){d.life=20;d.hp=90;}},titles:[{text:'SNOW LEOPARDS',at:4,dur:64,pos:'b'}]},
 {n:96,setup(){go(0,4);place(0,-16,0);gather(6,12,.5,100);pre(4);pans.push({o:player,t:0});sPanFall();D.cine=CAM.orbit({x:0,y:0,z:0},34,14,.18,.4,62,2);},
   tick(){player.hp=100;player.invuln=1;},titles:[{text:'AVALANCHES',at:4,dur:80,pos:'t'}]},
 {n:62,setup(){go(3,2);place(-9,9,2.4);gather(5,8,.3);D.pilot=mkPilot({hp:14,rapid:true,strafe:.6});pre(12);}},
 {n:62,setup(){go(0,7,'t');setTeams();place(6,-14,.2);gather(6,9,.4,40);D.pilot=mkPilot({hp:20,strafe:.5});pre(16);D.cine=CAM.side(5,2,60,-1);},titles:[{text:'TEAM UP',at:4,dur:54,pos:'b'}]},
 {n:62,setup(){go(4,3);place(-4,-12,.3);gather(5,8,.3);D.pilot=mkPilot({hp:12,rapid:true,strafe:.6});fp=true;pre(10);}},
 {n:78,setup(){go(1,0);place(4,-6,.2);gather(7,9,.5,100);D.pilot=mkPilot({hp:100});pre(10);D.cine=CAM.orbit({x:0,y:0,z:0},26,9,.35,1.2,56,2);$('c').style.filter='brightness(.85)';},
   titles:[{text:'NOW ON SUI',sub:'ZKLOGIN   YETI NFTS   WALRUS',at:4,dur:72,pos:'c',big:1.1}],end(){$('c').style.filter='';}},
];
for(const a of ACT)S.push(a);
// PART 2: the demo, a title card then the thing itself
S.push(CARD('01','CONNECT WITH GOOGLE','zkLogin gives you a real Sui wallet from your Google account. No seed phrase, no extension.'));
S.push({n:300,noflash:true,setup(){bg(1);pre(2);wallet({});suiPage();},
  tick(i){if(i===60){glowBtn('#sui [data-s="google"]',true);sfx('tick',.6,1);}
    if(i===84){glowBtn('#sui [data-s="google"]',false);LOOPSUI.st.busy='Creating your Sui wallet...';suiUI();}
    if(i===150){wallet({addr:ADDR,kind:'zk',name:'Player',data:{yetis:[],clips:[],balance:'0',pending:null}});suiMsg='';suiUI();sfx('fanfare',.5,1.1);}
    cap(i,'GOOGLE SIGN IN WITH ZKLOGIN','A real Sui address, made from your Google account',10,140);cap(i,'YOUR WALLET IS READY','Devnet. No SUI needed, the game pays the gas',150,296);}});
S.push(CARD('02','MINT YOUR YETI','Free mint. Gas sponsored by the game server.'));
S.push({n:270,noflash:true,setup(){wallet({addr:ADDR,kind:'zk',name:'Player',data:{yetis:[],clips:[],balance:'0',pending:null}});sel=0;suiPage();},
  tick(i){if(i===40){glowBtn('#sui [data-s="mint"]',true);sfx('tick',.6,1);}if(i===62){glowBtn('#sui [data-s="mint"]',false);LOOPSUI.st.busy='Minting your Yeti NFT...';suiUI();}
    if(i===120){LOOPSUI.st.busy='';LOOPSUI.st.data.yetis=[Y('0x47e9fbb9cd35f02b58ad5228d461603d02d31f4111d28d9b5491deb3ed399a3b',0,'Lofi',1,0,0,0)];suiNft=LOOPSUI.st.data.yetis[0].id;suiSay('Minted! Your yeti lives on Sui now.');sfx('fanfare',.6,1);}
    cap(i,'ONE CLICK MINT','Your yeti becomes a Sui NFT with its own stats',8,116);cap(i,'KILLS, WINS AND LEVEL ON CHAIN','Owned by you, tradable through Kiosk',124,266);}});
S.push(CARD('03','MEET THE LOFIS','Eight yetis. Each one out of patience in its own way.'));
S.push({n:384,noflash:true,setup(){go(0,0);$('game').style.display='none';showMenu();pages();lockShow();$('lock').style.visibility='hidden';sel=0;assignLooks(0);for(const q of showc){q.hat=0;q.fit=0;}refreshMenu();},
  tick(i){const k=Math.floor(i/48);if(i%48===0&&i>0){slide(1);sfx('pop',.4,1.2);}const L=ROSTER[sel];cap(i%48,L.name.toUpperCase(),L.tag,2,46);},end(){$('lock').style.visibility='';}});
S.push(CARD('04','DRESS TO IMPRESS','Hats, outfits and ice bombs. The rarest ones unlock only with a Yeti NFT.'));
S.push({n:300,noflash:true,setup(){go(0,0);$('game').style.display='none';showMenu();pages();wallet({addr:ADDR,kind:'zk',name:'Player',data:{yetis:[Y('0x47e9',0,'Lofi',3,21,4,9)],clips:[],balance:'0',pending:null}});sel=0;assignLooks(0);profile.xp=Math.max(profile.xp,9000);lkTab=0;lockShow();},
  tick(i){const H=[12,13,14,15,16,2,5,7],F=[8,9,10,11,12,1,4,5];
    if(i%36===0){const j=Math.floor(i/36);if(j<8){if(j<5){lkTab=0;}else{lkTab=1;}const c=showc[sel];c.hat=H[j];c.fit=F[j];profile.x.cos.h=H[j];profile.x.cos.o=F[j];lockUI();sfx('pop',.4,1.3);}}
    cap(i,'NFT ITEMS GLOW CYAN','Mint a yeti to unlock them, level it to unlock the best',6,150);cap(i,'EVERYONE SEES YOUR STYLE','In every match, online and in practice',156,296);}});
S.push(CARD('05','SIX HIMALAYAN MAPS','From Everest Base Camp to the cave where Lofi slept.'));
const MAPS=[[0,'BASE CAMP','Tents, prayer flags and yaks'],[1,'TENGBOCHE MONASTERY','Golden roofs and prayer wheels'],[2,'KHUMBU ICEFALL','Blue ice towers and ladders'],[3,"LOFI'S ICE TOMB",'Where it all began'],[4,'THE SUMMIT','Sunrise above the clouds'],[5,'NAMCHE BAZAAR','The Sherpa village market']];
MAPS.forEach((m,j)=>S.push({n:84,noflash:j>0?false:true,setup(){go(m[0],j);place(0,-14,0);gather(6,10,.6,100);D.pilot=mkPilot({hp:100,strafe:.6});pre(8);D.cine=CAM.orbit({x:0,y:0,z:0},25+j%2*4,8+j%3*2,.28,j*1.1,56,1.5);},tick(i){cap(i,m[1],m[2],4,82);}}));
S.push(CARD('06','FOUR WAYS TO PLAY','Free for all, teams, capture the crystal and 1 v 1. Bots fill every empty seat.'));
S.push({n:96,noflash:true,setup(){go(0,1,'f');place(-8,-13,.5);gather(5,10,.3);D.pilot=mkPilot({jump:true,hp:20});pre(20);hudOn();},tick(i){cap(i,'FREE FOR ALL','Eight yetis, every paw for itself',4,94);}});
S.push({n:96,setup(){go(1,2,'t');setTeams();place(10,9,-2.3);gather(6,9,.4,30);D.pilot=mkPilot({hp:20,strafe:.5});pre(16);hudOn();$('ts').style.visibility='visible';},tick(i){cap(i,'TEAMS 4 V 4','Red against blue, most bonks wins',4,94);}});
S.push({n:96,setup(){go(5,4,'c');setTeams();place(-4,-8,.6);gather(6,10,.4,40);D.pilot=mkPilot({hp:25,strafe:.6});pre(16);hudOn();$('ts').style.visibility='visible';D.cine=CAM.orbit({x:0,y:0,z:0},22,9,.3,2,58,1.4);},tick(i){cap(i,'CAPTURE THE CRYSTAL','Steal their crystal, carry it home',4,94);}});
S.push({n:96,setup(){go(2,5,'d');place(0,-10,0);gather(1,9,.2,40);D.pilot=mkPilot({hp:30,strafe:.7,jump:true});fp=true;pre(14);hudOn();},tick(i){cap(i,'1 V 1','One rival, no excuses',4,94);}});
S.push(CARD('07','STREAKS GET WILD','Bonk without getting bonked: a snow leopard at 4, an avalanche at 7.'));
S.push({n:120,noflash:true,setup(){go(3,6);place(2,-12,.3);gather(5,9,.3,60);dogSpawn(player);D.pilot=mkPilot({hp:30,strafe:.5});pre(30);const p=player;D.cine=lt=>{const d=dogs[0]||p;return {ex:d.x+Math.sin(p.aimYaw+2.2+lt*.3)*4.5,ey:1.6,ez:d.z+Math.cos(p.aimYaw+2.2+lt*.3)*4.5,tx:d.x,ty:.7,tz:d.z,fov:52};};},
  tick(i){for(const d of dogs){d.life=20;d.hp=90;}cap(i,'SNOW LEOPARD','It hunts for you',4,118);}});
S.push({n:126,setup(){go(4,4);place(0,-16,0);gather(6,12,.5,100);pre(4);pans.push({o:player,t:0});sPanFall();D.cine=CAM.orbit({x:0,y:0,z:0},34,14,.18,1.4,62,2);},tick(i){player.hp=100;player.invuln=1;cap(i,'THE AVALANCHE','It buries everyone else',4,124);}});
S.push(CARD('08','EVERY MATCH ON CHAIN','The server signs your result. A Move contract checks it and levels up your yeti.'));
S.push({n:160,noflash:true,setup(){go(1,0);place(-9,-12,.6);gather(6,9,.3);D.pilot=mkPilot({hp:45,strafe:.6,jump:true});pre(20);matchT=2.2;hudOn();document.body.classList.add('nomedal');},
  tick(i){if(state==='over')clearTimeout(overT);if(i===80){const o=$('over');o.style.display='flex';let b=$('dirsave');if(!b){b=document.createElement('button');b.id='dirsave';b.className='btn';b.textContent='SAVE THIS MATCH TO MY YETI NFT';b.style.cssText='margin-top:14px;font-size:20px;background:linear-gradient(#7FE9FF,#2A9BFF);color:#0B1F44';o.appendChild(b);}b.style.display='';}
    if(i===96){glowBtn('#dirsave',true);sfx('tick',.6,1);}cap(i,'MATCH OVER','Your result is signed by the LOOP server',84,158);},end(){const b=$('dirsave');if(b)b.style.display='none';$('over').style.display='none';}});
S.push({n:240,noflash:true,setup(){wallet({addr:ADDR,kind:'zk',name:'Player',data:{yetis:[Y('0x47e9fbb9cd35f02b58ad5228d461603d02d31f4111d28d9b5491deb3ed399a3b',0,'Lofi',2,14,2,6)],clips:[],balance:'0',pending:{kills:7,deaths:3,won:true,xp:325}}});suiNft=LOOPSUI.st.data.yetis[0].id;suiPage();},
  tick(i){if(i===40){glowBtn('#sui [data-s="rec"]',true);sfx('tick',.6,1);}if(i===62){glowBtn('#sui [data-s="rec"]',false);LOOPSUI.st.busy='Writing your match on chain...';suiUI();}
    if(i===116){LOOPSUI.st.busy='';const y=LOOPSUI.st.data.yetis[0];y.kills=21;y.wins=3;y.matches=7;y.level=3;LOOPSUI.st.data.pending=null;suiSay('Saved. Your yeti stats are updated on chain.');sfx('fanfare',.6,1);}
    cap(i,'SAVE LAST MATCH','7 bonks and a win, verified by Move',6,112);cap(i,'LEVEL 3','More levels unlock the best NFT items',122,236);}});
S.push(CARD('09','BEST KILLS ON WALRUS','Your best kill becomes a replay clip, stored on Walrus and minted as a Clip NFT.'));
S.push({n:150,noflash:true,speed:.45,setup(){go(5,0);place(-13,-6,1.15);gather(6,12.5,.13,100);let cx=0,cz=0;for(let i=1;i<=6;i++){cx+=chickens[i].x;cz+=chickens[i].z;}boomC=[cx/6,cz/6];pre(3);pin();
   D.cine=lt=>{const a=lt*.6;return {ex:boomC[0]+Math.sin(a)*7,ey:2+lt*.4,ez:boomC[1]+Math.cos(a)*7-2,tx:boomC[0],ty:1.4,tz:boomC[1],fov:54};};$('c').style.filter='saturate(1.1) contrast(1.05)';},
  tick(i){player.hp=100;hold();if(i===8)bombTo(boomC[0],boomC[1]);if(i===34)PIN=null;cap(i,'SLOW MOTION REPLAY','Recorded with sound and music',30,148);},end(){$('c').style.filter='';}});
S.push({n:180,noflash:true,setup(){wallet({addr:ADDR,kind:'zk',name:'Player',data:{yetis:[Y('0x47e9',0,'Lofi',3,21,3,7)],clips:[],balance:'0',pending:null}});$('menu').style.display='block';$('game').style.display='none';showMenu();pages();
   clipBlob=new Blob(['x']);const v=$('clv');v.removeAttribute('src');v.poster='/tools/dev/out/y2_blast.jpg';$('clmsg').textContent='';$('clsave').style.display='';const e=$('clipv');e.style.display='block';e.classList.add('on');suiLobby();},
  tick(i){if(i===40){glowBtn('#clsui',true);sfx('tick',.6,1);}if(i===60){glowBtn('#clsui',false);$('clsui').textContent='UPLOADING TO WALRUS...';}
    if(i===112){$('clsui').textContent='STORED ON WALRUS, CLIP NFT MINTED';$('clmsg').innerHTML='Walrus blob <span style="color:#7FE9FF">R3UN99-rWAlydbRVR6oa...</span>';sfx('fanfare',.6,1);}
    cap(i,'STORE ON WALRUS','Decentralized storage on Sui',6,108);cap(i,'CLIP NFT MINTED','Your best moment, owned by you',116,178);},end(){$('clipv').style.display='none';}});
S.push(CARD('10','TOURNAMENTS ON SUI','Free entry. The prize pot lives in a Move contract and pays the weekly top 3.'));
S.push({n:270,noflash:true,setup(){wallet({addr:ADDR,kind:'zk',name:'Player',data:{yetis:[Y('0x47e9',0,'Lofi',3,21,3,7)],clips:[{id:'0x9',blob:'R3UN99',title:'Best kill by Lofi',kills:3,map:'Namche Bazaar',t:Date.now()}],balance:'0',pending:null}});suiPage();},
  tick(i){if(i===50){glowBtn('#sui [data-s="join"]',true);sfx('tick',.6,1);}if(i===72){glowBtn('#sui [data-s="join"]',false);LOOPSUI.st.busy='Joining the tournament...';suiUI();}
    if(i===120){LOOPSUI.st.busy='';TOURS[0].entrants.push(ADDR);suiSay('You are in the tournament. Good luck.');sfx('fanfare',.6,1);}
    cap(i,'LOOP LAUNCH CUP','4 SUI prize pot, held in Move',8,116);cap(i,'CLIMB THE WEEKLY BOARD','Top 3 get paid on chain',126,266);}});
// PART 3: end card
S.push({n:240,noflash:true,setup(){go(0,0);place(0,-12,0);gather(6,9,.4,100);D.pilot=mkPilot({hp:100});pre(10);D.cine=CAM.orbit({x:0,y:0,z:0},28,9,.2,.6,54,4);$('EC').style.display='flex';$('EC').style.opacity=0;sfx('fanfare',.9,1);mark('end');},
  tick(i){const k=ease(i/14);$('EC').style.opacity=k;$('c').style.filter='blur('+(k*7).toFixed(1)+'px) brightness('+(1-.3*k).toFixed(2)+')';
    $('EC').querySelector('img').style.transform='scale('+(i<9?1.8-.8*ease(i/9):1+i*.0006).toFixed(4)+')';
    const pk=i>26?1+Math.sin((i-26)*.3)*.04:ease((i-14)/10);$('ECp').style.transform='scale('+Math.max(0,pk).toFixed(3)+')';$('ECu').style.opacity=clamp((i-24)/10,0,1);$('ECs').style.opacity=clamp((i-34)/10,0,1);}});
D.total=S.reduce((a,s)=>a+s.n,0);D.cuts=S.map(s=>s.n);
const ONLY=window.__ONLY;
D.step=function(){
  if(D.si<0||D.sf>=S[D.si].n){if(D.si>=0&&S[D.si].end)S[D.si].end();D.si++;D.sf=0;
    while(ONLY&&D.si<S.length&&!ONLY.includes(D.si))D.si++;
    if(D.si>=S.length){D.done=true;return false;}
    const s=S[D.si];D.rec=false;$('TT').style.opacity=0;$('CAP').style.opacity=0;if(s.setup)s.setup();D.rec=true;D.lt=0;if(s.card)mark('card'+D.si);}
  const s=S[D.si],i=D.sf;D.lt=i/30;document.body.classList.toggle('nox',!!D.cine||state!=='play');
  if(s.tick)s.tick(i);
  let any=false;if(s.titles)for(const T of s.titles){if(T.at+T.dur>s.n)T.dur=s.n-T.at;if(titleAt(T,i))any=true;}if(!any)$('TT').style.opacity=0;document.body.classList.toggle('ttl',any);
  $('FL').style.opacity=s.noflash?0:i===0?.7:i===1?.35:i===2?.12:0;
  if(!s.card)$('c').style.transform=s.noflash?'':'scale('+(i<7?1.08-.08*ease(i/7):1).toFixed(4)+')';
  adv(s.speed);vms+=33.333;sync();D.f++;D.sf++;return true;};
})();
