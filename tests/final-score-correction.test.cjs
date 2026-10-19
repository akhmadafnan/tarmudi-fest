"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const {TF26Domain}=require("../src/server/ContestDomain.js");
const source=fs.readFileSync(path.join(__dirname,"../src/server/ContestApplication.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
function setup(){
 const context=vm.createContext({TF26Domain,Error,Math,Array,Object,String,Number,JSON});
 vm.runInContext(source,context);
 const TF26Application=vm.runInContext("TF26Application",context);
 const data={
  participants:[{id:"synthetic-thf",fullName:"PRIVATE_NAME",school:"PRIVATE_SCHOOL",competition:"THF",verified:true}],
  checkins:[{participantId:"synthetic-thf",competition:"THF",startNo:1}],
  scores:[],revisions:[],audits:[],
  settings:[{competition:"THF",label:"Tahfidz",requiredJudges:3,state:"JUDGING_OPEN",version:1,
   criteria:[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]],publication:"ANONYMOUS",privacyApproved:false}]
 };
 const roles={adminUid:{role:"admin",competition:"ALL",active:true},
  j1:{role:"juri",competition:"THF",active:true},
  j2:{role:"juri",competition:"THF",active:true},
  j3:{role:"juri",competition:"THF",active:true},
  reg:{role:"registrasi",competition:"THF",active:true}};
 const repo={
  participants:()=>data.participants,
  checkins:()=>data.checkins,
  scores:()=>data.scores,
  settings:()=>data.settings,
  tieDecisions:()=>[],
  saveScore:(value,original)=>{
   if(original)Object.assign(original,value);
   else data.scores.push({...value});
  },
  appendScoreRevision:revision=>{
   if(data.rejectRevision)throw Error("REVISION_LOG_UNAVAILABLE");
   const row=data.revisions.length+2;
   data.revisions.push({...revision,row,status:"PENDING"});
   return row;
  },
  markScoreRevisionApplied:row=>{
   const record=data.revisions.find(x=>x.row===row);
   if(!record)throw Error("REVISION_NOT_FOUND");
   record.status="APPLIED";
  },
  appendAudit:(uid,action,subject,detail,time)=>data.audits.push({uid,action,subject,detail,time}),
  setPhase:(cfg,phase)=>{cfg.state=phase}
 };
 const lock={getScriptLock(){return{tryLock(){return true},releaseLock(){}}}};
 const app=new TF26Application(repo,lock,()=>"2026-10-19T10:48:00+07:00",roles);
 const judge=(uid="j1")=>({uid,role:"juri",competition:"THF"});
 const old=[35,27,18,8],next=[35,28,18,8];
 const reason="Koreksi salah input pada kriteria Tajwid";
 function finalize(){
  const out=app.score(judge(),{startNo:1,points:old.slice(),final:true});
  assert.equal(out.total,88);
 }
 return {app,data,judge,old,next,reason,finalize};
}
test("juri can explicitly correct own FINAL and keep FINAL state",()=>{
 const {app,data,judge,old,next,reason,finalize}=setup();finalize();
 const result=app.correctFinalScore(judge(),{startNo:1,points:next,expectedPoints:old,reason});
 assert.equal(result.total,89);assert.equal(result.status,"FINAL");assert.equal(result.corrected,true);
 assert.equal(data.scores.length,1);assert.equal(data.scores[0].total,89);
 assert.equal(data.scores[0].status,"FINAL");
 const revision=data.revisions[0];
 assert.equal(revision.oldTotal,88);assert.equal(revision.newTotal,89);
 assert.equal(revision.status,"APPLIED");assert.equal(revision.reason,reason);
 assert.equal(data.audits.at(-1).action,"CORRECT_FINAL_SCORE");
 assert.ok(!JSON.stringify(revision).includes("PRIVATE_"));
});
test("ordinary save remains locked after FINAL, despite correction feature",()=>{
 const {app,judge,old,finalize}=setup();finalize();
 assert.throws(()=>app.score(judge(),{startNo:1,points:old,final:true}),/SCORE_LOCKED/);
});
test("cross-jury access denied, including Juri 2 correcting Juri 1 score",()=>{
 const {app,data,judge,old,next,reason,finalize}=setup();finalize();
 assert.throws(()=>app.correctFinalScore(judge("j2"),{startNo:1,points:next,expectedPoints:old,reason}),/SCORE_NOT_FINAL/);
 assert.throws(()=>app.correctFinalScore({uid:"adminUid",role:"admin",competition:"ALL"},
  {startNo:1,points:next,expectedPoints:old,reason}),/NOT_ALLOWED/);
 assert.equal(data.scores[0].total,88);assert.equal(data.revisions.length,0);
});
test("reason is mandatory, written and bounded, and new points must differ",()=>{
 const {app,data,judge,old,next,reason,finalize}=setup();finalize();
 for(const explanation of ["","Salah", "X".repeat(401)]){
  assert.throws(()=>app.correctFinalScore(judge(),{startNo:1,points:next,expectedPoints:old,reason:explanation}),/INVALID_CORRECTION/);
 }
 assert.throws(()=>app.correctFinalScore(judge(),{startNo:1,points:old,expectedPoints:old,reason}),/NO_SCORE_CHANGE/);
 assert.equal(data.revisions.length,0);
});
test("reject over-maximum, fractional and incomplete corrections without modifying final",()=>{
 const {app,data,judge,old,reason,finalize}=setup();finalize();
 for(const points of [[41,28,18,8],[35,28.5,18,8],[35,28,18]]){
  assert.throws(()=>app.correctFinalScore(judge(),{startNo:1,points,expectedPoints:old,reason}));
 }
 assert.equal(data.scores[0].total,88);
 assert.equal(data.revisions.length,0);
});
test("stale original-value token blocks overwritten score and requires refresh",()=>{
 const {app,data,judge,old,next,reason,finalize}=setup();finalize();
 app.correctFinalScore(judge(),{startNo:1,points:next,expectedPoints:old,reason});
 assert.throws(()=>app.correctFinalScore(judge(),{startNo:1,points:[36,28,18,8],expectedPoints:old,reason}),/SCORE_CHANGED_REFRESH/);
 assert.equal(data.scores[0].total,89);
 assert.equal(data.revisions.length,1);
});
test("correction forbidden after judging closes, with no history rows",()=>{
 const {app,data,judge,old,next,reason,finalize}=setup();finalize();
 data.settings[0].state="REVIEW";
 assert.throws(()=>app.correctFinalScore(judge(),{startNo:1,points:next,expectedPoints:old,reason}),/CORRECTION_CLOSED/);
 assert.equal(data.scores[0].total,88);assert.equal(data.revisions.length,0);
});
test("audit journal failure fails closed; scores remain unchanged",()=>{
 const {app,data,judge,old,next,reason,finalize}=setup();finalize();
 data.rejectRevision=true;
 assert.throws(()=>app.correctFinalScore(judge(),{startNo:1,points:next,expectedPoints:old,reason}),/REVISION_LOG_UNAVAILABLE/);
 assert.equal(data.scores[0].total,88);assert.equal(data.revisions.length,0);
});
test("corrected FINAL stays scoped to own dashboard, excluded from public until all judges FINAL",()=>{
 const {app,judge,old,next,reason,finalize}=setup();finalize();
 app.correctFinalScore(judge(),{startNo:1,points:next,expectedPoints:old,reason});
 const own=app.dashboard(judge());
 assert.equal(own.entries[0].status,"FINAL");
 assert.equal(own.entries[0].ownPoints.join(","),"35,28,18,8");
 const other=app.dashboard(judge("j2"));
 assert.equal(other.entries[0].status,"NOT_STARTED");
 assert.ok(!JSON.stringify(other).includes('"ownPoints":[35,28,18,8]'));
 assert.equal(app.publicResults("THF").results.length,0);
});
test("client correction requires reason and explicitly scoped server action; mobile friendly",()=>{
 const body=html.slice(html.indexOf("function drawJudgeDetail(root,entry){"),html.indexOf("function tabs(){"));
 assert.match(body,/if\(finalized\)\{/);
 assert.match(body,/Koreksi nilai/);
 assert.match(body,/reason\.value\.trim\(\)/);
 assert.match(body,/submitAction\("CORRECT_FINAL_SCORE",\{/);
 assert.match(body,/expectedPoints:entry\.ownPoints\.slice\(\)/);
 assert.match(body,/const available=DATA\.phase==="JUDGING_OPEN"/);
 assert.doesNotMatch(body,/\b(fullName|school|participantId|registrationId)\b/i);
 assert.match(html,/\.jury-correct-form textarea\{width:100%/);
});
