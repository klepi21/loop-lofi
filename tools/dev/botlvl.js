// online bot skill by room level: builds rooms the same way server/server.js does, joins players with given levels, prints the bots' skill
const fs=require('fs'),path=require('path'),vm=require('vm');const SD=path.join(__dirname,'../../server');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),m=html.match(/<script>([\s\S]*)<\/script>/);
const script=new vm.Script(m[1]+'\n'+fs.readFileSync(path.join(SD,'room_ctx.js'),'utf8'),{filename:'game.js'});
const src=fs.readFileSync(path.join(SD,'server.js'),'utf8'),a=src.indexOf('function stub'),b=src.indexOf('\nconst rooms');
const newCode=()=>'TEST',MAXH=8;eval(src.slice(a,b));
const avg=r=>{const s=r.R.bots().seats.filter(x=>x[0]==='bot');return +(s.reduce((t,x)=>t+x[2],0)/s.length).toFixed(2);};
for(const mode of ['f','t']){
 for(const lv of [[],[0],[1],[1,1,2],[5],[8],[12],[20],[1,20],[3,9,15]]){const r=makeRoom(1,0,mode);for(const l of lv)r.R.join('P'+l,0,0,-1,l);const B=r.R.bots();
  console.log(mode,'players',JSON.stringify(lv),'room level',+B.lvl.toFixed(1),'bot skill avg',avg(r),'range',JSON.stringify(B.seats.filter(x=>x[0]==='bot').map(x=>x[2]).sort()));}
 const r=makeRoom(1,0,mode);const s1=r.R.join('Pro',0,0,-1,20);console.log(mode,'join level 20 ->',avg(r));const s2=r.R.join('New',0,0,-1,1);console.log(mode,'+ level 1 ->',avg(r));r.R.leave(s1);console.log(mode,'level 20 leaves ->',avg(r),'room level',r.R.bots().lvl);
 for(let i=0;i<30*20;i++)r.R.tick(1/30);console.log(mode,'20s of play ok, skill still',avg(r));}
