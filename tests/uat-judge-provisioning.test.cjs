"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const api=fs.readFileSync(path.join(__dirname,"../src/server/ContestApi.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
const start=api.indexOf("function tf26SeedSpec_(");
const end=api.indexOf("function apiApp(",start);
assert.ok(start>=0&&end>start,"Server provisioning entrypoints not present");
const section=api.slice(start,end);
function fixture(opts={}){
  const map={adminUid:{role:"admin",competition:"ALL",active:true},
    pilotUid:{role:"juri",competition:"THF",active:true}};
  if(opts.full){
    for(let n=0;n<11;n++)map["extra"+n]={role:"juri",competition:"MWN",active:true};
  }
  let unlocks=0;
  const props={
    getProperty(name){if(name!=="TF26_AUTH_ALLOWLIST_JSON")throw Error("Unexpected private property");return JSON.stringify(map);},
    setProperty(name,val){if(name!=="TF26_AUTH_ALLOWLIST_JSON")throw Error("Unexpected property write");const parsed=JSON.parse(val);for(const k of Object.keys(map))delete map[k];Object.assign(map,parsed);}
  };
  class FirebaseVerifier {
    verify(input){
      if(!/^signed(02|03|other)$/.test(String(input)))throw Error("BAD_TOKEN");
      return {uid:"firebase-uid-"+input};
    }
  }
  const ctx={
    tf26Actor_(token){
      if(token==="admin-token")return {uid:"adminUid",role:"admin",competition:"ALL"};
      if(token==="judge-token")return {uid:"pilotUid",role:"juri",competition:"THF"};
      throw Error("UNAUTHORIZED");
    },
    tf26Properties_(){return props;},
    FirebaseIdentityVerifier:FirebaseVerifier,
    UrlFetchApp:{},Utilities:{},Date,Math,
    LockService:{getScriptLock(){return{tryLock(){return opts.locked!==true;},releaseLock(){unlocks++;}};}},
    tf26Error_(err){return {ok:false,error:["NOT_ALLOWED","INVALID_REQUEST","ACCOUNT_EXISTS","ACCOUNT_LIMIT","BUSY_RETRY"].includes(err.message)?err.message:"REQUEST_FAILED"};}
  };
  vm.createContext(ctx);
  vm.runInContext(section,ctx,{timeout:2000});
  return {map,provision:ctx.apiProvisionAccount,unlockCount:()=>unlocks};
}
test("Admin can register exactly the two new Tahfidz judge UIDs",()=>{
 const env=fixture();
 for(const n of [2,3]){
  const username="juri-thf-0"+n;
  const response=env.provision("admin-token",username,"signed0"+n);
  assert.equal(response.ok,true);
  assert.equal(response.data.role,"juri");
  assert.equal(response.data.competition,"THF");
 }
 const active=Object.values(env.map).filter(x=>x.active&&x.role==="juri"&&x.competition==="THF");
 assert.equal(active.length,3);
 assert.ok(active.every(x=>x.competition==="THF"));
 assert.equal(env.unlockCount(),2);
});
test("Juri may not give themselves or others authorization",()=>{
 const env=fixture();
 assert.equal(env.provision("judge-token","juri-thf-02","signed02").ok,false);
 assert.equal(Object.keys(env.map).length,2);
});
test("Unknown username and privilege escalation attempts are rejected",()=>{
 const env=fixture();
 for(const name of ["admin","super-admin","juri-thf-04","JURI-THF-02","juri-xxx-02"]){
  assert.equal(env.provision("admin-token",name,"signed02").ok,false);
 }
 assert.equal(Object.keys(env.map).length,2);
});
test("Duplicate UID and repeated username are denied without mutation",()=>{
 const env=fixture();
 assert.equal(env.provision("admin-token","juri-thf-02","signed02").ok,true);
 assert.equal(env.provision("admin-token","juri-thf-02","signed03").error,"ACCOUNT_EXISTS");
 assert.equal(env.provision("admin-token","juri-thf-03","signed02").error,"ACCOUNT_EXISTS");
 assert.equal(Object.keys(env.map).length,3);
});
test("Invalid provider token rejected and cannot add UID",()=>{
 const env=fixture();
 assert.equal(env.provision("admin-token","juri-thf-02","bad-token").ok,false);
 assert.equal(Object.keys(env.map).length,2);
});
test("Account ceiling and busy lock deny authorization changes",()=>{
 assert.equal(fixture({full:true}).provision("admin-token","juri-thf-02","signed02").error,"ACCOUNT_LIMIT");
 assert.equal(fixture({locked:true}).provision("admin-token","juri-thf-02","signed02").error,"BUSY_RETRY");
});
test("UAT frontend only displays two test judge creation flow, without passwords or UID literals",()=>{
 assert.match(html,/function drawUatTahfidzJudges\(\)/);
 assert.match(html,/"juri-thf-02","juri-thf-03"/);
 assert.match(html,/call\("apiProvisionAccount",\[TOKEN,username,signedToken\]\)/);
 const admin=html.slice(html.indexOf("function drawAdmin(root){"),html.indexOf("function drawUatTahfidzJudges(){"));
 assert.doesNotMatch(admin,/const accounts=drawAccountProvisioner\(\)/);
 assert.doesNotMatch(html,/TF26_TEST_JURY_CREDS.*localStorage/);
 assert.match(html,/Unduh kredensial uji \(privat\)/);
});
