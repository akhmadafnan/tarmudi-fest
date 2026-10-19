"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const {TF26Domain}=require("../src/server/ContestDomain.js");
const context=vm.createContext({TF26Domain,Math,Array,Object,String,Number,JSON,Error,Set,Map});
vm.runInContext(fs.readFileSync(path.join(__dirname,"../src/server/ContestApplication.js"),"utf8"),context);
const App=vm.runInContext("TF26Application",context);
const ADMIN={uid:"admin-uat",role:"admin",competition:"ALL"};
const JUDGE={uid:"judge-1",role:"juri",competition:"THF"};
const REGISTRAR={uid:"registration-uat",role:"registrasi",competition:"THF"};
const JURORS=["judge-1","judge-2","judge-3"];
const criteria=[["Kelancaran/Tahfidz",40],["Tajwid",30],["Fashohah/Makhroj",20],["Irama/Lagu",10]];
const reason="Keputusan tertulis dewan juri sesuai berita acara pengujian.";
const at="2026-10-19T19:00:00+07:00";
function fixture(number,opts={}){
 const data={
  participants:Array.from({length:number},(_,i)=>({
   id:"SIM-THF-"+(i+1),competition:"THF",fullName:"SIM CHILD "+(i+1),
   school:"SIM SCHOOL",verified:true
  })),
  checkins:Array.from({length:number},(_,i)=>({
   participantId:"SIM-THF-"+(i+1),competition:"THF",startNo:i+1,
   at,actorUid:"registration-uat"
  })),
  scores:[],
  config:[{
   competition:"THF",label:"Tahfidz",requiredJudges:3,
   state:"JUDGING_OPEN",version:1,criteria,
   publication:"ANONYMOUS",privacyApproved:false
  }],
  ties:[],audit:[],mutations:[]
 };
 for(let i=1;i<=number;i++){
  const points=[40-(i%35),27,18,8];
  for(const judgeUid of JURORS){
   data.scores.push({
    key:"THF::"+i+"::"+judgeUid+"::1",
    competition:"THF",startNo:i,judgeUid,version:1,
    points:points.slice(),total:points.reduce((a,b)=>a+b,0),
    status:"FINAL",at
   });
  }
 }
 const store={
  participants:()=>data.participants,checkins:()=>data.checkins,
  scores:()=>data.scores,settings:()=>data.config,tieDecisions:()=>data.ties,
  setPhase:(conf,state)=>{data.mutations.push("PHASE_"+state);conf.state=state;},
  appendAudit:(...entry)=>{data.audit.push(entry);},
  appendTieDecision:row=>{data.ties.push(row);data.mutations.push("TIE_DECISION");},
  markOfficial:()=>{data.mutations.push("OFFICIAL");throw Error("NOT_EXPECTED_IN_CLOSE");}
 };
 const assignments={ "admin-uat":{role:"admin",competition:"ALL",active:true} };
 JURORS.forEach(uid=>assignments[uid]={role:"juri",competition:"THF",active:true});
 let holds=false;
 const locks={getScriptLock(){return{
  tryLock(){if(opts.busy||holds)return false;holds=true;return true;},
  releaseLock(){holds=false;}
 }}};
 const service=new App(store,locks,()=>at,assignments,[],false);
 return{data,service,assignments};
}
function assertNoMutation(data){
 assert.equal(data.config[0].state,"JUDGING_OPEN");
 assert.equal(data.config[0].publication,"ANONYMOUS");
 assert.equal(data.config[0].privacyApproved,false);
 assert.equal(data.audit.length,0);
 assert.equal(data.ties.length,0);
 assert.deepEqual(data.mutations,[]);
}
test("UAT-CLOSE-01: four fully finalized participants cannot close a competition (current UAT situation)",()=>{
 const {service,data}=fixture(4);
 assert.equal(data.scores.length,12);
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 assertNoMutation(data);
});
test("UAT-CLOSE-02: zero or five attended participants remain below the minimum of six",()=>{
 for(const n of [0,1,5]){
  const {service,data}=fixture(n);
  assert.throws(()=>service.closeJudging(ADMIN,"THF"),/INCOMPLETE_SCORES/);
  assertNoMutation(data);
 }
});
test("UAT-CLOSE-03: all six checked in but one judge DRAFT blocks closing without any writes",()=>{
 const {service,data}=fixture(6);
 const row=data.scores.find(x=>x.startNo===6&&x.judgeUid==="judge-3");
 row.status="DRAFT";row.total=null;
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 assertNoMutation(data);
 row.status="FINAL";row.total=row.points.reduce((a,b)=>a+b,0);
 const done=service.closeJudging(ADMIN,"THF");
 assert.equal(done.state,"REVIEW");assert.equal(done.completed,6);
});
test("UAT-CLOSE-04: wrong scheme version of one FINAL score blocks closing",()=>{
 const {service,data}=fixture(6);
 data.scores.find(x=>x.startNo===3&&x.judgeUid==="judge-2").version=2;
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 assertNoMutation(data);
});
test("UAT-CLOSE-05: unassigned judge score never substitutes assigned judge's FINAL score",()=>{
 const {service,data}=fixture(6);
 data.scores=data.scores.filter(x=>!(x.startNo===4&&x.judgeUid==="judge-2"));
 data.scores.push({competition:"THF",startNo:4,judgeUid:"outsider",version:1,
  points:[40,27,18,8],total:93,status:"FINAL",at});
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 assertNoMutation(data);
});
test("UAT-CLOSE-06: duplicated FINAL from same assigned UID cannot satisfy 3 distinct jurors",()=>{
 const {service,data}=fixture(6);
 const atIndex=data.scores.findIndex(x=>x.startNo===5&&x.judgeUid==="judge-3");
 const duplicate={...data.scores.find(x=>x.startNo===5&&x.judgeUid==="judge-2")};
 data.scores.splice(atIndex,1,duplicate);
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 assertNoMutation(data);
});
test("UAT-CLOSE-07: all six complete transitions JUDGING_OPEN -> REVIEW exactly once and writes one audit",()=>{
 const {service,data}=fixture(6);
 const sourceScores=JSON.stringify(data.scores);
 const output=service.closeJudging(ADMIN,"THF");
 assert.equal(output.competition,"THF");assert.equal(output.state,"REVIEW");assert.equal(output.completed,6);
 assert.equal(data.config[0].state,"REVIEW");
 assert.equal(data.config[0].publication,"ANONYMOUS");
 assert.equal(data.config[0].privacyApproved,false);
 assert.deepEqual(data.mutations,["PHASE_REVIEW"]);
 assert.equal(data.audit.length,1);
 const [uid,action,competition,detail,time]=data.audit[0];
 assert.equal(uid,"admin-uat");assert.equal(action,"CLOSE_JUDGING");
 assert.equal(competition,"THF");assert.equal(detail,"completed=6");assert.equal(time,at);
 assert.equal(data.ties.length,0);
 assert.equal(JSON.stringify(data.scores),sourceScores);
 assert.equal(service.publicResults("THF").phase,"INTERIM");
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/WRONG_PHASE/);
 assert.equal(data.audit.length,1);
});
test("UAT-CLOSE-08: tie affecting six best does not block REVIEW, only subsequent official publication",()=>{
 const {service,data}=fixture(6);
 for(const row of data.scores.filter(x=>x.startNo===2)) {
  const same=data.scores.find(x=>x.startNo===1&&x.judgeUid===row.judgeUid);
  row.points=same.points.slice();row.total=same.total;
 }
 const prior=service.publicResults("THF").results;
 assert.ok(prior.some(x=>x.pendingDeliberation));
 const closed=service.closeJudging(ADMIN,"THF");
 assert.equal(closed.state,"REVIEW");assert.equal(data.config[0].publication,"ANONYMOUS");
 assert.equal(data.ties.length,0);
});
test("UAT-CLOSE-09: branch-specific close ignores independent check-ins and draft scores in other competitions",()=>{
 const {service,data}=fixture(6);
 data.checkins.push({participantId:"SIM-MDG-1",competition:"MDG",startNo:1});
 data.scores.push({competition:"MDG",startNo:1,judgeUid:"other",version:1,status:"DRAFT",points:[10],total:null});
 const output=service.closeJudging(ADMIN,"THF");
 assert.equal(output.completed,6);assert.equal(data.config[0].state,"REVIEW");
});
test("UAT-CLOSE-10: registrasi and juri cannot close judging",()=>{
 const {service,data}=fixture(6);
 assert.throws(()=>service.closeJudging(JUDGE,"THF"),/NOT_ALLOWED/);
 assert.throws(()=>service.closeJudging(REGISTRAR,"THF"),/NOT_ALLOWED/);
 assertNoMutation(data);
});
test("UAT-CLOSE-11: busy lock fails safely without changing phase or audit",()=>{
 const {service,data}=fixture(6,{busy:true});
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/BUSY_RETRY/);
 assertNoMutation(data);
});
test("UAT-CLOSE-12: 200 fully finalized entrants can be closed; one missing final score blocks it",()=>{
 const {service,data}=fixture(200);
 assert.equal(data.scores.length,600);
 const affected=data.scores.find(x=>x.startNo===200&&x.judgeUid==="judge-3");
 affected.status="DRAFT";
 assert.throws(()=>service.closeJudging(ADMIN,"THF"),/INCOMPLETE_SCORES/);
 assertNoMutation(data);
 affected.status="FINAL";
 const output=service.closeJudging(ADMIN,"THF");
 assert.equal(output.completed,200);
 assert.equal(data.config[0].state,"REVIEW");
 assert.equal(data.audit.length,1);
 assert.equal(data.audit[0][3],"completed=200");
 assert.equal(data.config[0].publication,"ANONYMOUS");
});
