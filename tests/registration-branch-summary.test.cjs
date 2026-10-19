"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
const start=html.indexOf("function tf26HasStartNumber(");
const end=html.indexOf("function drawRegistration(",start);
assert.ok(start>=0&&end>start,"Registration helper section not found");
const code=html.slice(start,end);
const context=vm.createContext({Number,Math,String,Array,Object,Intl});
vm.runInContext(code,context);
const summary=context.tf26RegistrationSummary;
assert.equal(typeof summary,"function");
const fixture=[];
for(const [code,checkedIn] of [["MDG",1],["THF",4],["MWN",0]]){
 for(let i=1;i<=10;i++){
  fixture.push({
   competition:code,
   fullName:code+" Peserta "+String(i).padStart(2,"0"),
   school:"Sekolah "+code+" "+i,
   id:"TF26-"+code+"-"+String(i).padStart(3,"0"),
   startNo:i<=checkedIn?i:null
  });
 }
}
test("all-branch summary uses 30 participants and 5 check-ins",()=>{
 const r=summary(fixture,"ALL","",true);
 assert.deepEqual([r.participants,r.checkedIn,r.displayed],[30,5,30]);
});
test("branch-specific counters match actual 10 / 1, 10 / 4, 10 / 0",()=>{
 for(const [code,checkedIn] of [["MDG",1],["THF",4],["MWN",0]]){
  const result=summary(fixture,code,"",true);
  assert.deepEqual([result.participants,result.checkedIn,result.displayed],[10,checkedIn,10]);
  assert.ok(result.entries.every(x=>x.competition===code));
 }
});
test("search narrows displayed rows but preserves branch participants and checked-in",()=>{
 const r=summary(fixture,"THF","Peserta 10",true);
 assert.deepEqual([r.participants,r.checkedIn,r.displayed],[10,4,1]);
 assert.equal(r.entries[0].competition,"THF");
 const none=summary(fixture,"MWN","does not exist",true);
 assert.deepEqual([none.participants,none.checkedIn,none.displayed],[10,0,0]);
});
test("registered officer remains restricted to the scoped backend data, no other branch required",()=>{
 const limited=fixture.filter(x=>x.competition==="THF");
 const r=summary(limited,"ALL","",false);
 assert.deepEqual([r.participants,r.checkedIn,r.displayed],[10,4,10]);
 assert.equal(r.entries.every(x=>x.competition==="THF"),true);
});
test("only positive integer assigned start numbers count as attendance",()=>{
 const participants=[
  {competition:"MDG",fullName:"A",school:"S",id:"1",startNo:1},
  {competition:"MDG",fullName:"B",school:"S",id:"2",startNo:0},
  {competition:"MDG",fullName:"C",school:"S",id:"3",startNo:"2"},
  {competition:"MDG",fullName:"D",school:"S",id:"4",startNo:-1},
  {competition:"MDG",fullName:"E",school:"S",id:"5",startNo:2.5}
 ];
 const r=summary(participants,"MDG","",true);
 assert.deepEqual([r.participants,r.checkedIn,r.displayed],[5,1,5]);
});
test("registration summary preserves original participant array and start-number ordering",()=>{
 const original=fixture.map(x=>x.id).join("|");
 const r=summary(fixture,"THF","",true);
 assert.equal(r.entries[0].startNo,1);
 assert.equal(r.entries[3].startNo,4);
 assert.equal(fixture.map(x=>x.id).join("|"),original);
});
test("registration and judge filters keep all four choices visible on narrow mobile screens",()=>{
 assert.match(html,/@media\(max-width:700px\)\{[\s\S]*?\.chips\.registration-filters,[\s\S]*?\.chips\.jury-filters\{/);
 assert.match(html,/\.chips\.registration-filters,[\s\S]*?\.chips\.jury-filters\{\s*display:grid;\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(html,/\.chips\.registration-filters \.chip,[\s\S]*?\.chips\.jury-filters \.chip\{[\s\S]*?min-height:46px;[\s\S]*?white-space:normal/);
});
test("visual counters bind to scoped summary, not DATA.participants global totals",()=>{
 const start=html.indexOf("function drawRegistration(root,asAdmin){");
 const end=html.indexOf("// The Juri interface",start);
 const content=html.slice(start,end);
 assert.match(content,/tf26RegistrationSummary\(DATA\.participants,currentBranch,FILTER,asAdmin\)/);
 assert.match(content,/summary\.participants\+" peserta"/);
 assert.match(content,/summary\.checkedIn\+" sudah check-in"/);
 assert.match(content,/summary\.displayed\+" ditampilkan"/);
 assert.doesNotMatch(content,/all\.length\+" peserta"/);
});
