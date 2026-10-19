"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const html=fs.readFileSync("src/client/Index.html","utf8");
const begin=html.indexOf("function tf26ClearAuth(){");
const end=html.indexOf("function describe(code){",begin);
assert.ok(begin>0&&end>begin,"Firebase refresh helpers missing");
const unit=html.slice(begin,end);
function environment(options={}){
 const calls=[],refreshes=[],state={loginScreens:0};
 let responder=options.respond||(()=>({ok:true,data:{role:"juri"}}));
 let refresh=options.refresh||(()=>({ok:true,json:async()=>({
  id_token:"jwt-renewed",refresh_token:"refresh-renewed",expires_in:"3600"
 })}));
 const runner={
  withSuccessHandler(cb){this.onSuccess=cb;return this;},
  withFailureHandler(cb){this.onFailure=cb;return this;},
  apiApp(...args){calls.push({name:"apiApp",args});try{this.onSuccess(responder("apiApp",args))}catch(e){this.onFailure(e)}},
  apiCommand(...args){calls.push({name:"apiCommand",args});try{this.onSuccess(responder("apiCommand",args))}catch(e){this.onFailure(e)}},
  apiProvisionAccount(...args){calls.push({name:"apiProvisionAccount",args});try{this.onSuccess(responder("apiProvisionAccount",args))}catch(e){this.onFailure(e)}},
  apiWhoAmI(...args){calls.push({name:"apiWhoAmI",args});this.onSuccess({ok:true,data:{uid:"juri"}})}
 };
 const ctx=vm.createContext({
  CFG:{apiKey:"test-api-key"},Date,Math,Number,Error,Promise,String,JSON,encodeURIComponent,
  google:{script:{run:runner}},
  fetch:async (...args)=>{refreshes.push(args);return refresh(...args)},
  showLogin:()=>{state.loginScreens++}
 });
 vm.runInContext('let TOKEN=null,TF26_REFRESH_TOKEN=null,TF26_TOKEN_EXPIRES_AT=0,TF26_REFRESH_INFLIGHT=null,TF26_SESSION_EPOCH=0;\n'+unit,ctx);
 const fn=name=>vm.runInContext(name,ctx);
 const save=payload=>fn("tf26SaveAuth")(payload||{idToken:"jwt-initial",refreshToken:"refresh-initial",expiresIn:"3600"});
 const expire=()=>vm.runInContext("TF26_TOKEN_EXPIRES_AT=Date.now()+30000",ctx);
 const tokens=()=>vm.runInContext("({token:TOKEN,refresh:TF26_REFRESH_TOKEN,expire:TF26_TOKEN_EXPIRES_AT})",ctx);
 return {ctx,fn,save,expire,tokens,calls,refreshes,state};
}
test("OPS-AUTH-01: fresh sign-in uses original token without needless refresh",async()=>{
 const e=environment();e.save();
 const result=await e.fn("call")("apiApp",["jwt-initial"]);
 assert.equal(result.ok,true);
 assert.equal(e.calls.length,1);
 assert.equal(e.calls[0].args[0],"jwt-initial");
 assert.equal(e.refreshes.length,0);
});
test("OPS-AUTH-02: near-expiry token refreshes before scoring command without losing payload",async()=>{
 const e=environment();e.save();e.expire();
 const payload={competition:"THF",startNo:3,points:[35,25,17,6],final:true};
 const result=await e.fn("call")("apiCommand",["jwt-initial","SAVE_SCORE",payload]);
 assert.equal(result.ok,true);assert.equal(e.refreshes.length,1);
 assert.equal(e.calls.length,1);
 assert.equal(e.calls[0].args[0],"jwt-renewed");
 assert.equal(e.calls[0].args[1],"SAVE_SCORE");
 assert.equal(e.calls[0].args[2],payload);
 assert.match(e.refreshes[0][0],/^https:\/\/securetoken\.googleapis\.com\/v1\/token\?key=/);
 assert.match(e.refreshes[0][1].body,/grant_type=refresh_token/);
});
test("OPS-AUTH-03: simultaneous protected calls use only one refresh request",async()=>{
 let finish;
 const blocked=new Promise(resolve=>{finish=resolve});
 const e=environment({refresh:()=>blocked});e.save();e.expire();
 const p1=e.fn("call")("apiApp",["jwt-initial"]);
 const p2=e.fn("call")("apiCommand",["jwt-initial","SAVE_SCORE",{startNo:3}]);
 await Promise.resolve();await Promise.resolve();
 assert.equal(e.refreshes.length,1);
 finish({ok:true,json:async()=>({
  id_token:"jwt-shared",refresh_token:"refresh-shared",expires_in:"3600"
 })});
 await Promise.all([p1,p2]);
 assert.deepEqual(e.calls.map(c=>c.args[0]),["jwt-shared","jwt-shared"]);
 assert.equal(e.state.loginScreens,0);
});
test("OPS-AUTH-04: invalid or revoked refresh logs out and prevents score write",async()=>{
 const e=environment({refresh:()=>({ok:false})});e.save();e.expire();
 await assert.rejects(e.fn("call")("apiCommand",["jwt-initial","SAVE_SCORE",{startNo:3}]),/AUTH_REQUIRED/);
 assert.equal(e.calls.length,0);assert.equal(e.state.loginScreens,1);
 assert.equal(e.tokens().token,null);assert.equal(e.tokens().refresh,null);
});
test("OPS-AUTH-05: a refresh started before logout cannot resurrect the earlier session",async()=>{
 let finish;
 const blocked=new Promise(resolve=>{finish=resolve});
 const e=environment({refresh:()=>blocked});e.save();e.expire();
 const stale=e.fn("call")("apiApp",["jwt-initial"]);
 await Promise.resolve();await Promise.resolve();
 e.fn("tf26ClearAuth")();
 e.save({idToken:"jwt-second-user",refreshToken:"refresh-second-user",expiresIn:"3600"});
 finish({ok:true,json:async()=>({
  id_token:"jwt-old",refresh_token:"refresh-old",expires_in:"3600"
 })});
 await assert.rejects(stale,/AUTH_REQUIRED/);
 assert.equal(e.tokens().token,"jwt-second-user");
 assert.equal(e.tokens().refresh,"refresh-second-user");
 assert.equal(e.state.loginScreens,0);
});
test("OPS-AUTH-06: backend AUTH_REQUIRED retries exactly once with renewed token",async()=>{
 let n=0;
 const e=environment({respond:()=>{n++;return n===1?{ok:false,error:"AUTH_REQUIRED"}:{ok:true,data:{ok:true}}}});
 e.save();
 const result=await e.fn("call")("apiCommand",["jwt-initial","SAVE_SCORE",{startNo:1}]);
 assert.equal(result.ok,true);
 assert.equal(e.calls.length,2);
 assert.deepEqual(e.calls.map(c=>c.args[0]),["jwt-initial","jwt-renewed"]);
 assert.equal(e.refreshes.length,1);
});
test("OPS-AUTH-07: persistent backend authorization failure never loops and clears login",async()=>{
 const e=environment({respond:()=>({ok:false,error:"AUTH_REQUIRED"})});e.save();
 const response=await e.fn("call")("apiApp",["jwt-initial"]);
 assert.equal(response.ok,false);
 assert.equal(e.calls.length,2);
 assert.equal(e.refreshes.length,1);
 assert.equal(e.state.loginScreens,1);
 assert.equal(e.tokens().token,null);
});
test("OPS-AUTH-08: uncertain transport failure never triggers duplicate score submissions",async()=>{
 const e=environment({respond:()=>{throw Error("GAS_TRANSPORT_FAILED")}});e.save();
 await assert.rejects(e.fn("call")("apiCommand",["jwt-initial","SAVE_SCORE",{startNo:2}]),/GAS_TRANSPORT_FAILED/);
 assert.equal(e.calls.length,1);
 assert.equal(e.refreshes.length,0);
});
test("OPS-AUTH-09: public and login verification do not depend on a privileged session",async()=>{
 const e=environment();
 const result=await e.fn("call")("apiWhoAmI",["fresh-firebase-token"]);
 assert.equal(result.ok,true);
 assert.equal(e.calls.length,1);
 assert.equal(e.calls[0].args[0],"fresh-firebase-token");
 assert.equal(e.refreshes.length,0);
});
test("OPS-AUTH-10: invalid auth payloads are rejected rather than saved",()=>{
 const e=environment();
 for(const x of [
  {idToken:"jwt",expiresIn:"3600"},
  {idToken:"jwt",refreshToken:"rt",expiresIn:"NaN"},
  {idToken:"jwt",refreshToken:"rt",expiresIn:"10"},
  {refreshToken:"rt",expiresIn:"3600"}
 ])assert.throws(()=>e.fn("tf26SaveAuth")(x),/AUTH_REQUIRED/);
 assert.equal(e.tokens().token,null);
});
test("OPS-AUTH-11: logout clears refresh token in memory, not persistent browser storage",()=>{
 assert.match(html,/\$\("logout"\)\.onclick=\(\)=>\{tf26ClearAuth\(\)/);
 assert.doesNotMatch(unit,/localStorage|sessionStorage\s*\.|document\.cookie\s*=/);
 const e=environment();e.save();e.fn("tf26ClearAuth")();
 assert.equal(e.tokens().token,null);
 assert.equal(e.tokens().refresh,null);
 assert.equal(e.tokens().expire,0);
});
