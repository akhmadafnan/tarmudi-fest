"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {TF26Domain}=require("../src/server/ContestDomain.js");
const context=vm.createContext({TF26Domain,Error,Math,Array,Object,String,Number,JSON});
vm.runInContext(fs.readFileSync("src/server/ContestApplication.js","utf8"),context);
const App=vm.runInContext("TF26Application",context);
const judgeIds=["j1","j2","j3"];
const admin={uid:"admin",role:"admin",competition:"ALL"};
const reason="Keputusan ini sesuai berita acara lengkap dewan juri.";
const t=[40,30,20,10],a=[39,30,20,10],b=[38,30,20,10],c=[37,30,20,10],d=[36,30,20,10],e=[35,30,20,10],low=[30,25,15,10];
function make(points,opts={}){
 const data={
  participants:points.map((_,i)=>({id:"id"+i,fullName:"Private "+i,school:"Private",competition:"THF",verified:true})),
  checkins:points.map((_,i)=>({competition:"THF",startNo:i+1,participantId:"id"+i})),
  scores:points.flatMap((p,i)=>judgeIds.map(judgeUid=>({competition:"THF",startNo:i+1,
   judgeUid,version:1,status:"FINAL",points:p,total:p.reduce((n,x)=>n+x,0)}))),
  config:[{competition:"THF",state:opts.phase||"REVIEW",requiredJudges:3,version:1,
   criteria:[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]],
   label:"Tahfidz",publication:"ANONYMOUS",privacyApproved:false}],
  ties:[],logs:[]
 };
 const store={participants:()=>data.participants,checkins:()=>data.checkins,
  scores:()=>data.scores,settings:()=>data.config,tieDecisions:()=>data.ties,
  appendTieDecision:v=>data.ties.push(v),appendAudit:(...x)=>data.logs.push(x),
  markOfficial:conf=>{conf.state="OFFICIAL";conf.publication="OFFICIAL";conf.privacyApproved=true;}};
 const roles={admin:{role:"admin",competition:"ALL",active:true}};
 for(const id of judgeIds)roles[id]={role:"juri",competition:"THF",active:true};
 const lock={getScriptLock(){return{tryLock(){return true},releaseLock(){}}}};
 const service=new App(store,lock,()=>"2026-10-19T19:00:00+07:00",roles,[],opts.privacy!==false);
 return {service,data};
}
test("unresolved 6–7 tie blocks official release until Admin writes one winner",()=>{
 const {service,data}=make([t,a,b,c,d,e,e,low]);
 assert.throws(()=>service.publishOfficial(admin,"THF"),/TIE_RESOLUTION_REQUIRED/);
 assert.throws(()=>service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[7,6],reason}),/INVALID_TIE_DECISION/);
 const done=service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[7],reason});
 assert.equal(done.resolved,true);assert.equal(data.ties.length,1);
 const results=service.publicResults("THF").results;
 assert.deepEqual(results.slice(5,7).map(x=>x.startNo).join(","),"7,6");
 assert.deepEqual(results.slice(5,7).map(x=>x.rank).join(","),"6,7");
 assert.equal(results[6].sharedRank,true);
 assert.equal(service.publishOfficial(admin,"THF").state,"OFFICIAL");
});
test("20 candidates at position 6 require only one winner, not an ordering of all 20",()=>{
 const points=[t,a,b,c,d];
 while(points.length<25)points.push(e);
 const {service,data}=make(points);
 assert.equal(service.publicResults("THF").results.filter(x=>x.pendingDeliberation).length,20);
 service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[24],reason});
 const result=service.publicResults("THF").results;
 assert.equal(result[5].startNo,24);
 assert.equal(result.filter(x=>x.rank===7&&x.sharedRank).length,19);
 assert.equal(data.ties.length,1);
 assert.equal(service.publishOfficial(admin,"THF").state,"OFFICIAL");
});
test("wholly internal top-six tie must include all members",()=>{
 const {service}=make([t,a,b,c,c,e,low]);
 assert.throws(()=>service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[4],reason}),/INVALID_TIE_DECISION/);
 service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[5,4],reason});
 assert.equal(service.publicResults("THF").results.filter(x=>x.pendingDeliberation).length,0);
});
test("equal means but different Tahfidz criterion groups never mix",()=>{
 const x=[38,24,18,10],y=[37,25,18,10];
 const {service,data}=make([x,x,y,y,[36,25,18,10],[35,25,18,10]]);
 const before=service.publicResults("THF").results;
 assert.equal(before[0].meanScore,before[2].meanScore);
 assert.equal(before[0].tieGroupPosition,1);assert.equal(before[2].tieGroupPosition,3);
 assert.throws(()=>service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[1,3],reason}),/INVALID_TIE_DECISION/);
 service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[2,1],reason});
 assert.equal(data.ties.length,1);
 assert.equal(service.publicResults("THF").results.filter(x=>x.pendingDeliberation).map(x=>x.startNo).join(","),"3,4");
});
test("ties wholly outside top-six cannot be assigned fake winners",()=>{
 const {service,data}=make([t,a,b,c,d,e,low,low]);
 assert.throws(()=>service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[7,8],reason}),/INVALID_TIE_DECISION/);
 assert.equal(data.ties.length,0);
 assert.equal(service.publishOfficial(admin,"THF").state,"OFFICIAL");
});
test("phase guard, non-admin guard, and privacy release remain enforced",()=>{
 const opened=make([t,a,b,c,d,e,e],{phase:"JUDGING_OPEN"});
 assert.throws(()=>opened.service.resolveTie(admin,{competition:"THF",orderedStartNumbers:[7],reason}),/WRONG_PHASE/);
 const reviewing=make([t,a,b,c,d,e,e],{privacy:false});
 assert.throws(()=>reviewing.service.resolveTie({uid:"j1",role:"juri",competition:"THF"},{competition:"THF",orderedStartNumbers:[7],reason}),/NOT_ALLOWED/);
 assert.throws(()=>reviewing.service.publishOfficial(admin,"THF"),/PRIVACY_APPROVAL_REQUIRED/);
});
