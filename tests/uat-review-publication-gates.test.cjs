"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {TF26Domain}=require("../src/server/ContestDomain.js");
const sandbox=vm.createContext({TF26Domain,Error,Math,Array,Object,String,Number,JSON,Set,Map});
vm.runInContext(fs.readFileSync("src/server/ContestApplication.js","utf8"),sandbox);
const App=vm.runInContext("TF26Application",sandbox);
const ADMIN={uid:"admin-synthetic",role:"admin",competition:"ALL"};
const JUDGE={uid:"j1",role:"juri",competition:"THF"};
const REGISTRAR={uid:"reg1",role:"registrasi",competition:"THF"};
const CRITERIA=[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]];
const MDG_CRITERIA=[["Ekspresi",25],["Artikulasi",25],["Isi",20],["Kreativitas",15],["Penampilan",15]];
const JURORS=["j1","j2","j3"];
const NOW="2026-10-19T19:01:00+07:00";
const REASON="Penetapan urutan dilakukan dewan juri berdasarkan berita acara tertulis.";
const P=[40,30,20,10],A=[39,30,20,10],B=[38,30,20,10],C=[37,30,20,10],D=[36,30,20,10],E=[35,30,20,10],LOW=[30,25,15,10];
const sum=v=>v.reduce((n,x)=>n+x,0);
function fixture(points,options={}){
 const comp=options.competition||"THF";
 const criteria=options.criteria||CRITERIA;
 const persons=points.map((p,i)=>({
  id:"SYN-"+comp+"-"+String(i+1).padStart(3,"0"),
  fullName:"PESERTA SINTETIS "+String(i+1).padStart(3,"0"),
  school:"SEKOLAH SINTETIS "+(i%4),competition:comp,verified:true
 }));
 const data={
  participants:persons,
  checkins:persons.map((p,i)=>({participantId:p.id,competition:comp,startNo:i+1,at:NOW,actorUid:"reg1"})),
  scores:points.flatMap((p,i)=>JURORS.map(judgeUid=>({
   key:comp+"::"+(i+1)+"::"+judgeUid+"::1",
   competition:comp,startNo:i+1,judgeUid,version:1,status:"FINAL",
   points:p.slice(),total:sum(p),at:NOW
  }))),
  settings:[{competition:comp,label:comp,requiredJudges:3,version:1,
   criteria,state:options.initialPhase||"JUDGING_OPEN",
   publication:"ANONYMOUS",privacyApproved:false,approvedBy:"",approvedAt:""}],
  ties:[],audit:[],writes:[]
 };
 const repo={
  participants:()=>data.participants,
  checkins:()=>data.checkins,
  scores:()=>data.scores,
  settings:()=>data.settings,
  tieDecisions:()=>data.ties,
  setPhase:(conf,phase)=>{data.writes.push("SET_PHASE_"+phase);conf.state=phase;},
  appendTieDecision:v=>{data.ties.push(v);data.writes.push("APPEND_TIE");},
  appendAudit:(...parts)=>{data.audit.push(parts);data.writes.push("APPEND_AUDIT");},
  markOfficial:(conf,uid,at)=>{
   if(options.failMarkOfficial)throw Error("STORAGE_WRITE_FAILED");
   data.writes.push("MARK_OFFICIAL");
   conf.state="OFFICIAL";conf.publication="OFFICIAL";conf.privacyApproved=true;
   conf.approvedBy=uid;conf.approvedAt=at;
  }
 };
 const roles={ "admin-synthetic":{role:"admin",competition:"ALL",active:true},
  reg1:{role:"registrasi",competition:comp,active:true} };
 for(const uid of JURORS)roles[uid]={role:"juri",competition:comp,active:true};
 let held=false;
 const lock={getScriptLock(){return{tryLock(){if(held)return false;held=true;return true;},releaseLock(){held=false;}}}};
 const service=new App(repo,lock,()=>NOW,roles,[],options.ownerApproved===true);
 return {service,data,repo};
}
function checkedNoOfficial(data){
 assert.equal(data.settings[0].publication,"ANONYMOUS");
 assert.equal(data.settings[0].privacyApproved,false);
 assert.equal(data.settings[0].approvedBy,"");
 assert.equal(data.settings[0].approvedAt,"");
 assert.ok(!data.writes.includes("MARK_OFFICIAL"));
}
function noIdentity(result){
 assert.equal(result.phase,"INTERIM");
 assert.ok(result.results.every(r=>r.fullName===undefined&&r.school===undefined));
}
function closeToReview(f){
 const closed=f.service.closeJudging(ADMIN,f.data.settings[0].competition);
 assert.equal(closed.state,"REVIEW");
 assert.equal(f.data.settings[0].state,"REVIEW");
 assert.equal(f.data.audit.filter(x=>x[1]==="CLOSE_JUDGING").length,1);
 checkedNoOfficial(f.data);
 return f;
}
function choose(f,nums,reason=REASON){
 return f.service.resolveTie(ADMIN,{competition:f.data.settings[0].competition,orderedStartNumbers:nums,reason});
}
test("UAT-REVIEW-01: six finalized check-ins move to REVIEW but public remains anonymous and INTERIM",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E],{ownerApproved:false}));
 noIdentity(f.service.publicResults("THF"));
 assert.equal(f.data.audit.length,1);
 const priv=f.service.dashboard(ADMIN).privateStandings[0].items;
 assert.equal(priv[0].fullName,"PESERTA SINTETIS 001");
 assert.ok(priv.every(x=>x.school.startsWith("SEKOLAH SINTETIS")));
 assert.equal(f.data.ties.length,0);
});
test("UAT-REVIEW-02: resolving a tie before REVIEW is denied without any mutations",()=>{
 const f=fixture([P,P,B,C,D,E]);
 assert.throws(()=>choose(f,[2,1]),/WRONG_PHASE/);
 assert.equal(f.data.ties.length,0);
 assert.equal(f.data.audit.length,0);
 checkedNoOfficial(f.data);
});
test("UAT-REVIEW-03: Admin cannot enter a spurious decision for a non-tied list",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E]));
 assert.throws(()=>choose(f,[1,2]),/INVALID_TIE_DECISION/);
 assert.equal(f.data.ties.length,0);
 checkedNoOfficial(f.data);
});
test("UAT-REVIEW-04: reason is mandatory, 15–500 chars, and winner numbers must be valid",()=>{
 const f=closeToReview(fixture([P,P,B,C,D,E]));
 for(const [numbers,reason] of [
  [[1,2],"short"],[[1,2]," "],[[1,2],"X".repeat(501)],
  [[1,1],REASON],[[1,99],REASON],[[1,2,3],REASON],
  [[2.2,1],REASON],[[0,1],REASON]
 ])assert.throws(()=>choose(f,numbers,reason),/INVALID_TIE_DECISION/);
 assert.equal(f.data.ties.length,0);
 assert.equal(f.data.audit.filter(x=>x[1]==="RESOLVE_TIE").length,0);
});
test("UAT-REVIEW-05: only Admin can record a decision; same decision cannot be replayed",()=>{
 const f=closeToReview(fixture([P,P,B,C,D,E]));
 const request={competition:"THF",orderedStartNumbers:[2,1],reason:REASON};
 assert.throws(()=>f.service.resolveTie(JUDGE,request),/NOT_ALLOWED/);
 assert.throws(()=>f.service.resolveTie(REGISTRAR,request),/NOT_ALLOWED/);
 const original=JSON.stringify(f.data.scores);
 const result=choose(f,[2,1]);
 assert.equal(result.resolved,true);
 assert.equal(f.data.ties.length,1);
 assert.equal(f.data.ties[0].actorUid,ADMIN.uid);
 assert.equal(f.data.ties[0].reason,REASON);
 assert.equal(f.data.ties[0].at,NOW);
 assert.equal(f.data.audit.filter(x=>x[1]==="RESOLVE_TIE").length,1);
 assert.equal(JSON.stringify(f.data.scores),original);
 assert.throws(()=>choose(f,[1,2]),/INVALID_TIE_DECISION|TIE_ALREADY_DECIDED/);
 assert.equal(f.data.ties.length,1);
 const ranked=f.service.publicResults("THF").results;
 assert.deepEqual(ranked.slice(0,2).map(x=>x.startNo).join(","),"2,1");
 assert.deepEqual(ranked.slice(0,2).map(x=>x.rank).join(","),"1,2");
 noIdentity(f.service.publicResults("THF"));
});
test("UAT-REVIEW-06: privacy authorization alone never bypasses unresolved six-place tie",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E,E,LOW],{ownerApproved:true}));
 assert.deepEqual(f.service.publicResults("THF").results.filter(x=>x.pendingDeliberation).map(x=>x.startNo).join(","),"6,7");
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/TIE_RESOLUTION_REQUIRED/);
 checkedNoOfficial(f.data);noIdentity(f.service.publicResults("THF"));
 assert.equal(f.data.audit.some(x=>x[1]==="PUBLISH_OFFICIAL"),false);
});
test("UAT-REVIEW-07: choosing just one sixth-place winner resolves a 6–7 tie, enabling publication only after authorization",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E,E,LOW],{ownerApproved:false}));
 assert.throws(()=>choose(f,[7,6]),/INVALID_TIE_DECISION/);
 assert.equal(choose(f,[7]).resolved,true);
 const ranks=f.service.publicResults("THF").results;
 assert.deepEqual(ranks.slice(5,7).map(x=>x.startNo).join(","),"7,6");
 assert.equal(ranks[5].rank,6);
 assert.equal(ranks[6].rank,7);
 assert.equal(ranks[6].sharedRank,true);
 assert.equal(ranks.some(x=>x.pendingDeliberation),false);
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/PRIVACY_APPROVAL_REQUIRED/);
 checkedNoOfficial(f.data);
 noIdentity(f.service.publicResults("THF"));
});
test("UAT-REVIEW-08: two separate top-six ties require two decisions before official release",()=>{
 const X=[38,24,18,10],Y=[37,25,18,10];
 const f=closeToReview(fixture([X,X,Y,Y,D,E,LOW],{ownerApproved:true}));
 const before=f.service.publicResults("THF").results;
 assert.equal(before[0].meanScore,before[2].meanScore);
 assert.deepEqual(before.filter(x=>x.tieGroupPosition===1).map(x=>x.startNo).join(","),"1,2");
 assert.deepEqual(before.filter(x=>x.tieGroupPosition===3).map(x=>x.startNo).join(","),"3,4");
 assert.throws(()=>choose(f,[1,3]),/INVALID_TIE_DECISION/);
 choose(f,[2,1]);
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/TIE_RESOLUTION_REQUIRED/);
 assert.equal(f.data.ties.length,1);
 choose(f,[4,3]);
 assert.equal(f.data.ties.length,2);
 assert.equal(f.service.publicResults("THF").results.some(x=>x.pendingDeliberation),false);
 assert.equal(f.service.publishOfficial(ADMIN,"THF").state,"OFFICIAL");
});
test("UAT-REVIEW-09: user consent gate blocks publication when no unresolved ties exist",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E],{ownerApproved:false}));
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/PRIVACY_APPROVAL_REQUIRED/);
 assert.throws(()=>f.service.publishOfficial(JUDGE,"THF"),/NOT_ALLOWED/);
 assert.throws(()=>f.service.publishOfficial(REGISTRAR,"THF"),/NOT_ALLOWED/);
 checkedNoOfficial(f.data);
 noIdentity(f.service.publicResults("THF"));
});
test("UAT-REVIEW-10: completing REVIEW and owner authorization publishes once; official identity and audit are gated",()=>{
 const f=closeToReview(fixture([P,P,B,C,D,E],{ownerApproved:true}));
 const sourceScores=JSON.stringify(f.data.scores);
 const sourceCheckins=JSON.stringify(f.data.checkins);
 choose(f,[2,1]);
 const before=f.service.publicResults("THF");
 noIdentity(before);
 const out=f.service.publishOfficial(ADMIN,"THF");
 assert.equal(out.state,"OFFICIAL");assert.equal(out.winners,6);
 assert.equal(out.competition,"THF");assert.equal(out.publishedAt,NOW);
 assert.equal(f.data.settings[0].state,"OFFICIAL");
 assert.equal(f.data.settings[0].publication,"OFFICIAL");
 assert.equal(f.data.settings[0].privacyApproved,true);
 assert.equal(f.data.settings[0].approvedBy,ADMIN.uid);
 assert.equal(f.data.audit.length,3);
 const actionNames=f.data.audit.map(x=>x[1]);
 assert.deepEqual(actionNames,["CLOSE_JUDGING","RESOLVE_TIE","PUBLISH_OFFICIAL"]);
 assert.equal(f.data.audit[2][3],"winners=6;privacyGate=owner-approved");
 const official=f.service.publicResults("THF");
 assert.equal(official.phase,"OFFICIAL");
 assert.ok(official.results.every(x=>x.fullName.startsWith("PESERTA SINTETIS")&&x.school.startsWith("SEKOLAH SINTETIS")));
 assert.equal(JSON.stringify(f.data.scores),sourceScores);
 assert.equal(JSON.stringify(f.data.checkins),sourceCheckins);
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/WRONG_PHASE/);
 assert.throws(()=>choose(f,[1,2]),/WRONG_PHASE/);
 assert.equal(f.data.audit.length,3);
});
test("UAT-REVIEW-11: lower ties remain a shared place and do not prevent publication",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E,LOW,LOW,LOW],{ownerApproved:true}));
 const result=f.service.publicResults("THF").results;
 assert.deepEqual(result.slice(6).map(x=>x.rank).join(","),"7,7,7");
 assert.ok(result.slice(6).every(x=>x.sharedRank&&!x.pendingDeliberation));
 assert.equal(f.service.publishOfficial(ADMIN,"THF").state,"OFFICIAL");
});
test("UAT-REVIEW-12: 200 participant group at sixth requires exactly one chosen finalist, not 195 individual decisions",()=>{
 const points=[P,A,B,C,D];
 while(points.length<200)points.push(E);
 const f=closeToReview(fixture(points,{ownerApproved:true}));
 assert.equal(f.data.scores.length,600);
 assert.equal(f.service.publicResults("THF").results.filter(x=>x.pendingDeliberation).length,195);
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/TIE_RESOLUTION_REQUIRED/);
 choose(f,[200]);
 const ranked=f.service.publicResults("THF").results;
 assert.equal(ranked.length,200);
 assert.equal(ranked[5].startNo,200);
 assert.equal(ranked[5].rank,6);
 assert.equal(ranked.filter(x=>x.rank===7&&x.sharedRank).length,194);
 assert.equal(f.data.ties.length,1);
 assert.equal(f.service.publishOfficial(ADMIN,"THF").state,"OFFICIAL");
});
test("UAT-REVIEW-13: a DRAFT introduced during REVIEW fails publication even with authorized privacy",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E],{ownerApproved:true}));
 const broken=f.data.scores.find(x=>x.startNo===6&&x.judgeUid==="j3");
 broken.status="DRAFT";
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 checkedNoOfficial(f.data);
});
test("UAT-REVIEW-14: fewer than six finalists never publish, even when REVIEW is forced by test fixture",()=>{
 const f=fixture([P,A,B,C,D],{ownerApproved:true,initialPhase:"REVIEW"});
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 checkedNoOfficial(f.data);
});
test("UAT-REVIEW-15: publication storage failure cannot fabricate an OFFICIAL record",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E],{ownerApproved:true,failMarkOfficial:true}));
 assert.throws(()=>f.service.publishOfficial(ADMIN,"THF"),/STORAGE_WRITE_FAILED/);
 checkedNoOfficial(f.data);
 noIdentity(f.service.publicResults("THF"));
 assert.equal(f.data.audit.filter(x=>x[1]==="PUBLISH_OFFICIAL").length,0);
});
test("UAT-REVIEW-16: OFFICIAL projection stays anonymous unless BOTH store flags are set",()=>{
 const f=closeToReview(fixture([P,A,B,C,D,E],{ownerApproved:true}));
 const conf=f.data.settings[0];
 conf.publication="OFFICIAL";
 conf.privacyApproved=false;
 noIdentity(f.service.publicResults("THF"));
 conf.publication="ANONYMOUS";
 conf.privacyApproved=true;
 noIdentity(f.service.publicResults("THF"));
});
test("UAT-REVIEW-17: all tied MDG totals require decision even if rubric criteria differ",()=>{
 const c1=[25,25,20,15,15],c2=[24,25,20,15,15];
 const c3=[23,25,20,15,15],c4=[22,25,20,15,15],c5=[21,25,20,15,15];
 const mid1=[20,25,20,15,15],mid2=[25,20,20,15,15];
 const f=closeToReview(fixture([c1,c2,c3,c4,c5,mid1,mid2],{
  competition:"MDG",criteria:MDG_CRITERIA,ownerApproved:true
 }));
 const before=f.service.publicResults("MDG").results;
 assert.deepEqual(before.filter(x=>x.pendingDeliberation).map(x=>x.startNo).join(","),"6,7");
 assert.throws(()=>f.service.publishOfficial(ADMIN,"MDG"),/TIE_RESOLUTION_REQUIRED/);
 assert.equal(choose(f,[7]).resolved,true);
 assert.equal(f.service.publishOfficial(ADMIN,"MDG").state,"OFFICIAL");
});
