// talks to a running LOOP server like the game does: fresh guest wallet, sponsored mint, read wallet, admin stats
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
const S=process.env.SRV||'http://localhost:8099',TOK=process.env.TOK;
const post=(p,b)=>fetch(S+'/sui/'+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());
const get=p=>fetch(S+'/sui/'+p).then(r=>r.json());
const kp=new Ed25519Keypair(),addr=kp.toSuiAddress();
console.log('config',await get('config'));
const pr=await post('prepare',{sender:addr,action:'mint',args:{name:'TestYeti',skin:2}});if(pr.err)throw new Error(pr.err);
const {signature}=await kp.signTransaction(fromBase64(pr.bytes));
const ex=await post('exec',{bytes:pr.bytes,signatures:[signature,pr.sponsorSig],action:'mint',sender:addr});console.log('exec',ex);
const w=await get('wallet?a='+addr);console.log('wallet yetis',w.yetis);
if(TOK){const st=await post('admin',{token:TOK,action:'stats'});console.log('admin minted',st.minted,'game bal',st.gameBalance,st.err||'');}
