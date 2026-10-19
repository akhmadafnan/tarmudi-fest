"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {TF26Domain}=require("../src/server/ContestDomain.js");
const assigned=["judge1","judge2","judge3"];
const criteria=[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]];
const make=(data,competition="THF")=>{
 const checkins=data.map((_,i)=>({competition,startNo:i+1}));
 const scores=data.flatMap((points,i)=>assigned.map(uid=>({competition,startNo:i+1,judgeUid:uid,points,status:"FINAL",version:1})));
 const config={competition,criteria,requiredJudges:3,assignedJudgeUids:assigned,
  checkins,scores,schemeVersion:1,phase:"INTERIM",privacyApproved:false,tieDecisions:[]};
 return config;
};
const top=[40,30,20,10],a=[39,30,20,10],b=[38,30,20,10],c=[37,30,20,10],d=[36,30,20,10],e=[35,30,20,10],below=[30,25,15,10];
test("tie entirely within top six requires deliberation (positions 4 and 5)",()=>{
 const v=[top,a,b,c,c,e,below,below];
 const out=TF26Domain.rank(make(v));
 assert.deepEqual(out.filter(x=>x.pendingDeliberation).map(x=>x.startNo),[4,5]);
 assert.deepEqual(out.filter(x=>x.pendingDeliberation).map(x=>x.tieGroupPosition),[4,4]);
 assert.equal(out.find(x=>x.startNo===6).rank,6);
 assert.deepEqual(out.filter(x=>x.startNo>=7).map(x=>x.rank),[7,7]);
 assert.ok(out.filter(x=>x.startNo>=7).every(x=>x.sharedRank&&!x.pendingDeliberation));
});
test("exact tie straddling sixth/seventh remains mandatory for both members",()=>{
 const out=TF26Domain.rank(make([top,a,b,c,d,e,e,below,below]));
 assert.deepEqual(out.filter(x=>x.pendingDeliberation).map(x=>x.startNo),[6,7]);
 assert.deepEqual(out.filter(x=>x.pendingDeliberation).map(x=>x.rank),[null,null]);
 assert.equal(out[5].tieGroupPosition,6);
 assert.equal(out[6].tieGroupPosition,6);
 assert.deepEqual(out.slice(7).map(x=>x.rank),[8,8]);
});
test("tie entirely below sixth is shared rank, never required deliberation",()=>{
 const out=TF26Domain.rank(make([top,a,b,c,d,e,below,below,below]));
 assert.equal(out.filter(x=>x.pendingDeliberation).length,0);
 assert.deepEqual(out.slice(6).map(x=>x.rank),[7,7,7]);
 assert.ok(out.slice(6).every(x=>x.sharedRank===true));
});
test("resolved boundary tie can determine sixth and seventh, while lower ties remain shared",()=>{
 const conf=make([top,a,b,c,d,e,e,below,below]);
 conf.tieDecisions=[{competition:"THF",scoreKey:"285:105:90:60:30",orderedStartNumbers:[7,6]}];
 const result=TF26Domain.rank(conf);
 assert.deepEqual(result.slice(5,7).map(x=>x.startNo),[7,6]);
 assert.deepEqual(result.slice(5,7).map(x=>x.rank),[6,7]);
 assert.equal(result.filter(x=>x.pendingDeliberation).length,0);
 assert.deepEqual(result.slice(7).map(x=>x.rank),[8,8]);
});
test("200 participants render full ranking but trigger only cutoff deliberation",()=>{
 const data=[top,a,b,c,d,e,e];
 while(data.length<200)data.push(below);
 const out=TF26Domain.rank(make(data));
 assert.equal(out.length,200);
 assert.deepEqual(out.filter(x=>x.pendingDeliberation).map(x=>x.startNo),[6,7]);
 assert.equal(out.slice(7).length,193);
 assert.ok(out.slice(7).every(x=>x.sharedRank&&!x.pendingDeliberation&&x.rank===8));
 assert.ok(out.every(x=>x.fullName===undefined&&x.school===undefined));
});
test("separate Tahfidz criterion-priority groups sharing an average never merge",()=>{
 const c1=[38,24,18,10],c2=[37,25,18,10];
 const out=TF26Domain.rank(make([c1,c1,c2,c2,[36,25,18,10],[35,25,18,10],below]));
 assert.deepEqual(out.filter(x=>x.pendingDeliberation).map(x=>x.tieGroupPosition),[1,1,3,3]);
 assert.equal(out[0].meanScore,out[2].meanScore);
 assert.equal(out[0].meanScore,90);
});
test("twenty entrants tied at sixth only need one winner selected for position six",()=>{
 const data=[top,a,b,c,d];
 while(data.length<25)data.push(e);
 const config=make(data);
 const before=TF26Domain.rank(config);
 assert.equal(before.filter(x=>x.pendingDeliberation).length,20);
 const key="285:105:90:60:30";
 config.tieDecisions=[{competition:"THF",scoreKey:key,orderedStartNumbers:[25]}];
 const after=TF26Domain.rank(config);
 assert.equal(after.filter(x=>x.pendingDeliberation).length,0);
 assert.equal(after[5].startNo,25);
 assert.equal(after[5].rank,6);
 assert.ok(after.slice(6).every(x=>x.sharedRank&&x.rank===7));
 assert.equal(after.length,25);
});
test("Mendongeng ties outside sixth use shared rank without a compulsory jury action",()=>{
 const cMDG=[["Ekspresi",25],["Artikulasi",25],["Isi",20],["Kreativitas",15],["Penampilan",15]];
 const scores=[[25,25,20,15,15],[24,25,20,15,15],[23,25,20,15,15],[22,25,20,15,15],[21,25,20,15,15],[20,25,20,15,15],[19,25,20,15,15],[20,24,20,15,15]];
 const config={...make(scores,"MDG"),criteria:cMDG};
 const out=TF26Domain.rank(config);
 assert.ok(out.slice(6).every(x=>x.rank===7&&x.sharedRank&&!x.pendingDeliberation));
});
