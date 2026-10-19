"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {TF26Domain}=require("../src/server/ContestDomain.js");
const context=vm.createContext({TF26Domain,Math,Array,Object,String,Number,JSON,Error,Date,
 SpreadsheetApp:{flush(){context.flushCount=(context.flushCount||0)+1;}}});
vm.runInContext(fs.readFileSync("src/server/ContestStore.js","utf8"),context);
const Store=vm.runInContext("TF26SheetStore",context);
const NOW="2026-10-19T19:01:00+07:00";
const criteria=[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]];
function makeBook(failColumn=0){
 const tables={
  SETTINGS:[["competition","label","requiredJudges","state","version","criteria","publication","privacyApproved","approvedBy","approvedAt"],
    ["THF","Tahfidz",3,"REVIEW",1,JSON.stringify(criteria),"ANONYMOUS","FALSE","",""]],
  TIE_RESOLUTIONS:[["competition","order","scoreKey","orderedStartNumbers","reason","approvedBy","approvedAt"]],
  SCORE_REVISIONS:[["at","competition","startNo","judgeUid","schemeVersion","oldPoints","oldTotal","newPoints","newTotal","reason","status"]],
  AUDIT:[["at","actorUid","action","entity","detail"]]
 };
 const operations=[];
 const sheets=Object.fromEntries(Object.keys(tables).map(name=>[name,{
  appendRow(values){tables[name].push(values);operations.push("APPEND_"+name);return this;},
  getLastRow(){return tables[name].length;},
  getDataRange(){return{getValues(){return tables[name];}};},
  getRange(row,column,rowCount=1,colCount=1){
   return{
    setValue(value){
     if(name==="SETTINGS"&&column===failColumn)throw Error("WRITE_FAILED");
     tables[name][row-1][column-1]=value;
     operations.push("SET_"+name+"_"+column);
    },
    setValues(rows){
     if(name==="SETTINGS"&&column===failColumn)throw Error("WRITE_FAILED");
     rows.forEach((cells,ri)=>cells.forEach((value,ci)=>{
      tables[name][row-1+ri][column-1+ci]=value;
     }));
     operations.push("SETS_"+name+"_"+column);
    }
   };
  }
 }]));
 return {store:new Store({getSheetByName:name=>sheets[name]}),tables,operations};
}
function captureApproval(failColumn=0){
 const f=makeBook(failColumn);
 const config=f.store.settings()[0];
 return{...f,config};
}
const tiePayload=(reason)=>({
 competition:"THF",orderedStartNumbers:[2,4],
 scoreKey:"249:103:76:51:19",reason,actorUid:"admin-private",at:NOW
});
test("UAT-REVIEW-SHEET-01: four formula-like jury minutes are stored as inert text",()=>{
 const f=makeBook();
 for(const str of [
  '=IMPORTXML("https://invalid.example","//a")',
  '+HYPERLINK("https://invalid.example","klik")',
  '-SUM(2,1)',
  '@SUM(1,2)'
 ])f.store.appendTieDecision(tiePayload(str));
 assert.equal(f.tables.TIE_RESOLUTIONS.length,5);
 for(let i=1;i<5;i++){
  const reason=f.tables.TIE_RESOLUTIONS[i][4];
  assert.ok(reason.startsWith("'"));
  assert.equal(reason.slice(1),[
   '=IMPORTXML("https://invalid.example","//a")',
   '+HYPERLINK("https://invalid.example","klik")',
   '-SUM(2,1)',
   '@SUM(1,2)'
  ][i-1]);
 }
 assert.equal(f.tables.TIE_RESOLUTIONS[1][2],"249:103:76:51:19");
});
test("UAT-REVIEW-SHEET-02: ordinary jury minutes remain legible without changes",()=>{
 const f=makeBook();
 const reason="Keputusan tim juri disetujui setelah musyawarah resmi.";
 f.store.appendTieDecision(tiePayload(reason));
 assert.equal(f.tables.TIE_RESOLUTIONS[1][4],reason);
 assert.deepEqual(Array.from(f.store.tieDecisions()[0].orderedStartNumbers),[2,4]);
 assert.equal(f.store.tieDecisions()[0].reason,reason);
});
test("UAT-REVIEW-SHEET-03: revision and audit text fields are protected too",()=>{
 const f=makeBook();
 const revision=f.store.appendScoreRevision({
  at:NOW,competition:"THF",startNo:3,judgeUid:"j1",schemeVersion:1,
  oldPoints:[35,25,17,6],oldTotal:83,newPoints:[35,26,17,6],newTotal:84,
  reason:'=HYPERLINK("https://invalid.example","uji")'
 });
 assert.equal(revision,2);
 assert.ok(f.tables.SCORE_REVISIONS[1][9].startsWith("'="));
 assert.equal(f.tables.SCORE_REVISIONS[1][10],"PENDING");
 f.store.appendAudit("admin","RESOLVE_TIE","=HYPERLINK(1,2)","+SUM(2,3)",NOW);
 assert.equal(f.tables.AUDIT[1][3],"'=HYPERLINK(1,2)");
 assert.equal(f.tables.AUDIT[1][4],"'+SUM(2,3)");
});
test("UAT-REVIEW-SHEET-04: approval writes publication flag LAST after owner, timestamp, and state",()=>{
 const f=captureApproval();
 f.store.markOfficial(f.config,"admin-private",NOW);
 assert.deepEqual(f.operations,[
  "SET_SETTINGS_8","SETS_SETTINGS_9","SET_SETTINGS_4","SET_SETTINGS_7"
 ]);
 const stored=f.store.settings()[0];
 assert.equal(stored.state,"OFFICIAL");
 assert.equal(stored.publication,"OFFICIAL");
 assert.equal(stored.privacyApproved,true);
 assert.equal(stored.approvedBy,"admin-private");
 assert.equal(stored.approvedAt,NOW);
});
test("UAT-REVIEW-SHEET-05: failure on any pre-publication write keeps official results hidden",()=>{
 for(const column of [8,9,4,7]){
  const f=captureApproval(column);
  assert.throws(()=>f.store.markOfficial(f.config,"admin-private",NOW),/WRITE_FAILED/);
  const stored=f.store.settings()[0];
  assert.equal(stored.publication,"ANONYMOUS");
  assert.ok(stored.state==="REVIEW"||stored.state==="OFFICIAL");
  const official=stored.publication==="OFFICIAL"&&stored.privacyApproved===true;
  assert.equal(official,false);
 }
});
