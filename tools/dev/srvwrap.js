// test wrapper: pretend to be the account service (tokens "testtoken-<letter>-...") and start the real server
const real=global.fetch;global.fetch=async(u,o)=>{if(String(u).includes('/auth/v1/user')){const t=(o.headers.Authorization||'').replace('Bearer ','');const m=/^testtoken-(\w)-/.exec(t);
  if(!m)return {ok:false,status:401,json:async()=>({})};const id=m[1].repeat(8)+'-'+m[1].repeat(4)+'-'+m[1].repeat(4)+'-'+m[1].repeat(4)+'-'+m[1].repeat(12);return {ok:true,status:200,json:async()=>({id})};}return real(u,o);};
require(require('path').join(__dirname,'..','..','server','server.js'));
