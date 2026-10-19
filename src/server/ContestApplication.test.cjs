"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {TF26Domain}=require("./ContestDomain.js");
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,"ContestApplication.js"),"utf8");
function app(){
 const ctx=vm.createContext({TF26Domain,Error,Math,Array,Object,String,Number,JSON});
 vm.runInContext(code,ctx);
 const C=vm.runInContext("TF26Application",ctx);
 const data={
  participants:[{id:"TF26-THF-001",fullName:"PRIVATE CHILD",school:"PRIVATE SCHOOL",competition:"THF",verified:true},
    {id:"TF26-MDG-001",fullName:"ANOTHER CHILD",school:"PRIVATE OTHER",competition:"MDG",verified:true}],
  checkins:[],scores:[],
  settings:[
   {competition:"THF",label:"Tahfidz",requiredJudges:3,state:"READY",version:1,criteria:[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]],publication:"ANONYMOUS",privacyApproved:false},
   {competition:"MDG",label:"Mendongeng",requiredJudges:3,state:"READY",version:1,criteria:[["Ekspresi",25],["Artikulasi",25],["Isi",20],["Kreativitas",15],["Penampilan",15]],publication:"ANONYMOUS",privacyApproved:false}
  ],logs:[]
 };
 const repo={
  participants:()=>data.participants,checkins:()=>data.checkins,scores:()=>data.scores,settings:()=>data.settings,
  appendCheckin:x=>data.checkins.push(x),
  updateScheme:(old,criteria,count,v)=>{old.criteria=criteria;old.requiredJudges=count;old.version=v;},
  replaceParticipants:x=>{data.participants=x.map(p=>({id:p.id,fullName:p.fullName,school:p.school,competition:p.competition,verified:p.status==="TERVERIFIKASI"}));return "BACKUP_TEST";},
  saveScore:(x,old)=>{if(old){Object.assign(old,x)}else data.scores.push({...x})},
  setPhase:(s,v)=>{s.state=v},
  appendAudit:(...args)=>data.logs.push(args)
 };
 let locked=false;const lock={getScriptLock(){return{tryLock(){if(locked)return false;locked=true;return true},releaseLock(){locked=false}}}};
 const roles={adminUid:{role:"admin",competition:"ALL",active:true},judge1:{role:"juri",competition:"THF",active:true},
  judge2:{role:"juri",competition:"THF",active:true},judge3:{role:"juri",competition:"THF",active:true},
  registrar:{role:"registrasi",competition:"MDG",active:true}};
 const service=new C(repo,lock,()=>"2026-10-19T10:00:00+07:00",roles);
 return{data,service,roles};
}
const admin={uid:"adminUid",role:"admin",competition:"ALL"};
const judge={uid:"judge1",role:"juri",competition:"THF"};
const registrar={uid:"registrar",role:"registrasi",competition:"MDG"};
test("Admin sees participant identities; Judge receives no name/school/source IDs",()=>{
 const s=app();const adminView=s.service.dashboard(admin);
 assert.equal(adminView.participants[0].fullName,"PRIVATE CHILD");
 const j=s.service.dashboard(judge);
 const json=JSON.stringify(j);
 assert.ok(!json.includes("PRIVATE"));assert.ok(!json.includes("TF26-THF-001"));
});
test("Registration officer restricted to their competition and cannot check other branch",()=>{
 const s=app();assert.throws(()=>s.service.checkIn(registrar,"TF26-THF-001"),/NOT_ALLOWED/);
 const c=s.service.checkIn(registrar,"TF26-MDG-001");assert.equal(c.competition,"MDG");
});
test("Check-in idempotency, consecutive numbers independent per branch",()=>{
 const s=app();const a=s.service.checkIn(admin,"TF26-THF-001");const b=s.service.checkIn(admin,"TF26-THF-001");
 const c=s.service.checkIn(admin,"TF26-MDG-001");assert.equal(a.startNo,1);assert.equal(b.startNo,1);
 assert.equal(c.startNo,1);assert.equal(b.repeated,true);assert.equal(s.data.checkins.length,2);
});
test("Judge cannot check-in; Registrar cannot score or open judging",()=>{
 const s=app();assert.throws(()=>s.service.checkIn(judge,"TF26-THF-001"),/NOT_ALLOWED/);
 assert.throws(()=>s.service.score(registrar,{startNo:1,points:[1,2,3,4],final:true}),/NOT_ALLOWED/);
 assert.throws(()=>s.service.setJudgingOpen(registrar,"MDG"),/NOT_ALLOWED/);
});
test("Judging opens only when all three required judges assigned",()=>{
 const s=app();delete s.roles.judge3;
 assert.throws(()=>s.service.setJudgingOpen(admin,"THF"),/JUDGES_INCOMPLETE/);
 s.roles.judge3={role:"juri",competition:"THF",active:true};
 assert.equal(s.service.setJudgingOpen(admin,"THF").state,"JUDGING_OPEN");
});
test("Finalized score cannot change and never leaks to other judge",()=>{
 const s=app();s.service.checkIn(admin,"TF26-THF-001");
 s.service.setJudgingOpen(admin,"THF");
 assert.throws(()=>s.service.score(judge,{startNo:1,points:[41,27,18,8],final:true}),/INVALID_POINTS/);
 const v=s.service.score(judge,{startNo:1,points:[35,27,18,8],final:true});
 assert.equal(v.total,88);
 assert.throws(()=>s.service.score(judge,{startNo:1,points:[35,27,18,8],final:true}),/SCORE_LOCKED/);
 const other=s.service.dashboard({uid:"judge2",role:"juri",competition:"THF"});
 assert.equal(other.entries[0].status,"NOT_STARTED");
 assert.ok(!JSON.stringify(other).includes('"total":88'));
});
test("No public ranking until three assigned jurors finalized",()=>{
 const s=app();s.service.checkIn(admin,"TF26-THF-001");s.service.setJudgingOpen(admin,"THF");
 s.service.score(judge,{startNo:1,points:[35,27,18,8],final:true});
 assert.equal(s.service.publicResults("THF").results.length,0);
});
test("Unverified participants are not eligible for checkin",()=>{
 const s=app();s.data.participants[0].verified=false;
 assert.throws(()=>s.service.checkIn(admin,"TF26-THF-001"),/NOT_VERIFIED/);
});

function importRows(){
 return [
  {id:"TF26-MDG-101",fullName:"Fictional A",school:"TK Simulasi A",branch:"Mendongeng",status:"TERVERIFIKASI"},
  {id:"TF26-MDG-102",fullName:"Fictional B",school:"TK Simulasi A",branch:"Mendongeng",status:"TERVERIFIKASI"},
  {id:"TF26-THF-101",fullName:"Fictional C",school:"TK Simulasi B",branch:"Tahfidz",status:"TERVERIFIKASI"}
 ];
}
test("Import preview validates accepted synthetic rows without mutating store",()=>{
 const s=app();const before=s.data.participants.length;
 const result=s.service.previewImport(admin,importRows());
 assert.equal(result.canCommit,true);assert.equal(result.accepted,3);assert.equal(s.data.participants.length,before);
});
test("Import rejects duplicate source IDs and school delegation above two",()=>{
 const s=app(),rows=importRows();
 assert.equal(s.service.previewImport(admin,[...rows,rows[0]]).canCommit,false);
 const third={...rows[0],id:"TF26-MDG-103"};
 assert.equal(s.service.previewImport(admin,[...rows,third]).canCommit,false);
});
test("Registration officer and judge cannot import participant data",()=>{
 const s=app();
 assert.throws(()=>s.service.previewImport(judge,importRows()),/NOT_ALLOWED/);
 assert.throws(()=>s.service.commitImport(registrar,importRows()),/NOT_ALLOWED/);
});
test("Admin import replacement backed up and audited only before check-in",()=>{
 const s=app();const result=s.service.commitImport(admin,importRows());
 assert.equal(result.imported,3);assert.equal(result.backupCreated,true);
 assert.equal(s.data.participants.length,3);assert.equal(s.data.logs.length,1);
 s.service.checkIn(admin,"TF26-MDG-101");
 assert.throws(()=>s.service.commitImport(admin,importRows()),/IMPORT_LOCKED/);
 assert.equal(s.data.participants.length,3);
});
test("Reject dangerous invalid input, invalid statuses and oversized files",()=>{
 const s=app();
 const invalid=[{...importRows()[0],status:"SOME_UNKNOWN_STATUS"}];
 assert.equal(s.service.previewImport(admin,invalid).canCommit,false);
 assert.throws(()=>s.service.previewImport(admin,Array(501).fill(importRows()[0])),/INVALID_IMPORT/);
});

test("Admin may publish versioned 100-point scoring scheme before judging",()=>{
 const s=app();const out=s.service.updateScheme(admin,{
  competition:"THF",requiredJudges:3,
  criteria:[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]]
 });
 assert.equal(out.version,2);assert.equal(s.data.settings[0].version,2);
 assert.equal(s.data.logs.length,1);
});
test("Invalid total and non-admin config changes rejected",()=>{
 const s=app();
 assert.throws(()=>s.service.updateScheme(judge,{competition:"THF",requiredJudges:3,
  criteria:[["A",50],["B",50]]}),/NOT_ALLOWED/);
 assert.throws(()=>s.service.updateScheme(admin,{competition:"THF",requiredJudges:3,
  criteria:[["A",50],["B",49]]}),/SCHEME_NOT_100/);
});
test("Two jurors on Tahfidz/Mendongeng require signed addendum gate",()=>{
 const s=app();
 assert.throws(()=>s.service.updateScheme(admin,{competition:"THF",requiredJudges:2,
  criteria:[["A",50],["B",50]]}),/POLICY_ADDENDUM_REQUIRED/);
 s.service.approvedTwoJudgeBranches_.push("THF");
 assert.equal(s.service.updateScheme(admin,{competition:"THF",requiredJudges:2,
  criteria:[["A",50],["B",50]]}).requiredJudges,2);
});
test("Cannot change scoring scheme after judging begins",()=>{
 const s=app();s.service.setJudgingOpen(admin,"THF");
 assert.throws(()=>s.service.updateScheme(admin,{competition:"THF",requiredJudges:3,
  criteria:[["A",50],["B",50]]}),/WRONG_PHASE/);
});
