"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {TF26Domain}=require("./ContestDomain.js");
const cTHF=[["Kelancaran / Tahfidz",40],["Tajwid",30],["Fashohah / Makhroj",20],["Irama / Lagu",10]];
const cMDG=[["Ekspresi dan Keberanian",25],["Artikulasi dan Intonasi",25],["Isi Cerita",20],["Kreativitas",15],["Penampilan Keseluruhan",15]];
const assigned=["judge1","judge2","judge3"];
function record(startNo,judgeUid,points,status="FINAL"){return{competition:"THF",startNo,judgeUid,points,status,version:1};}
function input(scores,more={}){return{competition:"THF",criteria:cTHF,requiredJudges:3,assignedJudgeUids:assigned,
  schemeVersion:1,checkins:[{competition:"THF",startNo:1},{competition:"THF",startNo:2}],scores,
  phase:"INTERIM",privacyApproved:false,participants:[{competition:"THF",startNo:1,fullName:"PRIVATE CHILD",school:"PRIVATE SCHOOL"}],...more};}
test("valid scoring scheme totals 100",()=>{assert.equal(TF26Domain.checkScheme(cMDG),true);assert.throws(()=>TF26Domain.checkScheme([["A",99]]));});
test("exact criterion integer points sum",()=>assert.equal(TF26Domain.validatePoints(cTHF,[35,27,18,8]),88));
test("reject fractional, missing, negative and over-maximum points",()=>{
 for(const bad of [[35.5,27,18,8],[41,27,18,8],[-1,27,18,8],[35,27,18]])assert.throws(()=>TF26Domain.validatePoints(cTHF,bad));
});
test("no rankings before all assigned judges finalize",()=>{
 assert.deepEqual(TF26Domain.rank(input([record(1,"judge1",[35,27,18,8]),record(1,"judge2",[36,27,18,8])])),[]);
});
test("3 final jurors average is exact 88.00",()=>{
 const rank=TF26Domain.rank(input([record(1,"judge1",[35,27,18,8]),record(1,"judge2",[38,27,18,8]),record(1,"judge3",[32,27,18,8])]));
 assert.equal(rank.length,1);assert.equal(rank[0].meanScore,88);assert.equal(rank[0].rank,1);
});
test("interim output never contains participant name or school",()=>{
 const rank=TF26Domain.rank(input(assigned.map(j=>record(1,j,[35,27,18,8]))));
 assert.equal(rank[0].fullName,undefined);assert.equal(rank[0].school,undefined);
 assert.ok(!JSON.stringify(rank).includes("PRIVATE"));
});
test("official identity requires explicit phase and privacy permission",()=>{
 const scores=assigned.map(j=>record(1,j,[35,27,18,8]));
 assert.equal(TF26Domain.rank(input(scores,{phase:"OFFICIAL",privacyApproved:false}))[0].fullName,undefined);
 assert.equal(TF26Domain.rank(input(scores,{phase:"OFFICIAL",privacyApproved:true}))[0].fullName,"PRIVATE CHILD");
});
test("Tahfidz tie breaks using criterion priority not display rounding",()=>{
 const scores=[...assigned.map(j=>record(1,j,[40,20,20,10])),...assigned.map(j=>record(2,j,[39,30,11,10]))];
 const rank=TF26Domain.rank(input(scores));
 assert.equal(rank[0].startNo,1);assert.equal(rank[0].rank,1);assert.equal(rank[1].rank,2);
});
test("fully tied score must not invent winner",()=>{
 const scores=[...assigned.map(j=>record(1,j,[40,20,20,10])),...assigned.map(j=>record(2,j,[40,20,20,10]))];
 const rank=TF26Domain.rank(input(scores));assert.equal(rank[0].rank,null);assert.equal(rank[1].rank,null);
 assert.equal(rank[0].pendingDeliberation,true);
});
test("Mendongeng equal totals require deliberation",()=>{
 const scores=assigned.flatMap(j=>[{competition:"MDG",judgeUid:j,startNo:1,points:[20,20,20,15,15],status:"FINAL",version:1},
 {competition:"MDG",judgeUid:j,startNo:2,points:[25,25,15,15,10],status:"FINAL",version:1}]);
 const rank=TF26Domain.rank(input(scores,{competition:"MDG",criteria:cMDG,checkins:[{competition:"MDG",startNo:1},{competition:"MDG",startNo:2}]}));
 assert.ok(rank.every(x=>x.pendingDeliberation && x.rank===null));
});
test("only scoped assigned judges counted",()=>{
 const scores=[...assigned.slice(0,2).map(j=>record(1,j,[35,27,18,8])),record(1,"unauthorized",[35,27,18,8])];
 assert.deepEqual(TF26Domain.rank(input(scores)),[]);
});
test("invalid active judge-count has no ranking",()=>assert.deepEqual(TF26Domain.rank(input(assigned.map(j=>record(1,j,[35,27,18,8])),{assignedJudgeUids:["judge1"]})),[]));
