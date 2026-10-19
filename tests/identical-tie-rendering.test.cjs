"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
const domain=fs.readFileSync(path.join(__dirname,"../src/server/ContestDomain.js"),"utf8");
const start=html.indexOf("function tf26RankLabel(entry,admin){");
const end=html.indexOf("function drawAdminStandings(){",start);
assert.ok(start>=0&&end>start,"Rank label helper missing");
const sandbox=vm.createContext({Number});
vm.runInContext(html.slice(start,end),sandbox);
const label=sandbox.tf26RankLabel;
test("unresolved identical ties display 'Perlu musyawarah' in Admin (undefined rank)",()=>{
 assert.equal(label({startNo:2,rank:undefined,pendingDeliberation:true},true),"Perlu musyawarah");
 assert.equal(label({startNo:4,pendingDeliberation:true},true),"Perlu musyawarah");
});
test("unresolved identical ties display 'Seri' on public results (undefined rank)",()=>{
 assert.equal(label({startNo:2,rank:undefined,pendingDeliberation:true},false),"Seri");
 assert.equal(label({startNo:4,pendingDeliberation:true},false),"Seri");
});
test("explicit null rank also displays unresolved labels",()=>{
 assert.equal(label({rank:null,pendingDeliberation:true},true),"Perlu musyawarah");
 assert.equal(label({rank:null,pendingDeliberation:true},false),"Seri");
});
test("numbered places still show genuine positive integer rank",()=>{
 for(const number of [1,2,3,24]){
  assert.equal(label({rank:number,pendingDeliberation:false},true),"#"+number);
  assert.equal(label({rank:number,pendingDeliberation:false},false),"#"+number);
 }
});
test("pendingDeliberation wins even if a stale rank field is present",()=>{
 assert.equal(label({rank:3,pendingDeliberation:true},true),"Perlu musyawarah");
 assert.equal(label({rank:4,pendingDeliberation:true},false),"Seri");
});
test("unexpected rank payload never displays #undefined or an invented place",()=>{
 for(const invalid of [undefined,null,"",0,-1,3.5,"3",NaN]){
  assert.equal(label({rank:invalid,pendingDeliberation:false},true),"Peringkat belum tersedia");
 }
});
test("both Admin and public ranking views use the same defensive rank label",()=>{
 const admin=html.slice(html.indexOf("function drawAdminStandings(){"),html.indexOf("function tf26HasStartNumber("));
 const pub=html.slice(html.indexOf("async function loadPublic(){"),html.indexOf("function publicView(){"));
 assert.match(admin,/const label=tf26RankLabel\(r,true\)/);
 assert.match(pub,/tf26RankLabel\(p,false\)/);
 assert.doesNotMatch(admin,/#undefined/);
 assert.doesNotMatch(pub,/#undefined/);
});
test("jury deliberation requires deliberate manual ordering rather than a suggested winner",()=>{
 const admin=html.slice(html.indexOf("function drawAdminStandings(){"),html.indexOf("function tf26HasStartNumber("));
 assert.match(admin,/ordered\.value="";/);
 assert.doesNotMatch(admin,/ordered\.value=numbers\.join/);
 assert.match(admin,/new Set\(vals\)\.size!==numbers\.length/);
 assert.match(admin,/reason\.value\.trim\(\)\.length<15/);
 assert.match(admin,/submitAction\("RESOLVE_TIE"/);
});
test("domain leaves truly unresolved tied ranking with a null rank and an explicit flag",()=>{
 assert.match(domain,/rank:requiresDeliberation\?null:isSharedRank\?position:position\+i/);
 assert.match(domain,/pendingDeliberation:requiresDeliberation,sharedRank:isSharedRank/);
 assert.match(domain,/const requiresDeliberation=isUnresolved&&position<=6/);
 assert.match(domain,/const isUnresolved=members\.length>1&&!ordered/);
});
