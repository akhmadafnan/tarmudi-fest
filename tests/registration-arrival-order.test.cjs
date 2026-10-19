"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
function extract(start,end) {
 const a=html.indexOf(start);
 const b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a, "missing function: "+start);
 return html.slice(a,b);
}
const script=extract("function tf26DisplayCompetitionCode(code){","function drawRegistration(root,asAdmin){");
const check=extract("function tf26HasStartNumber(value){","function tf26DisplayCompetitionCode(code){");
const ctx=vm.createContext({Number,Object,String,Set});
vm.runInContext(check+"\n"+script,ctx);
const {tf26DisplayCompetitionCode:label,tf26RegistrationOrder:compare}=ctx;
const row=(id,competition,startNo,fullName)=>({id,competition,startNo,fullName});
test("visible code is branch prefix; internal unique ID remains intact",()=>{
 assert.equal(label("MDG"),"TF26-MDG");
 assert.equal(label("THF"),"TF26-THF");
 assert.equal(label("MWN"),"TF26-MWN");
 assert.ok(!html.includes('p.school+" • "+branches[p.competition]+" • "+p.id'));
 assert.match(html,/tf26DisplayCompetitionCode\(p\.competition\)/);
 assert.match(html,/submitAction\("CHECK_IN",\{id:p\.id\}/);
});
test("earliest checked-in participant always appears above unchecked in own branch",()=>{
 const source=[row("TF26-THF-001","THF",null,"Cahaya"),
 row("TF26-THF-004","THF",1,"Dahlia"),
 row("TF26-THF-003","THF",2,"Melati"),
 row("TF26-THF-002","THF",undefined,"Anggrek")];
 const sorted=source.slice().sort(compare);
 assert.deepEqual(sorted.map(x=>x.id),["TF26-THF-004","TF26-THF-003","TF26-THF-002","TF26-THF-001"]);
 assert.equal(source[0].id,"TF26-THF-001"); // sorting must not mutate original
});
test("All filter grouped per competition, attendees on top within each branch",()=>{
 const rows=[row("MWN-2","MWN",null,"Nama 2"),row("THF-2","THF",null,"Nama 3"),row("MDG-2","MDG",null,"Nama 4"),row("MWN-1","MWN",1,"Nama 1"),row("MDG-1","MDG",1,"Nama 0")];
 assert.deepEqual(rows.slice().sort(compare).map(x=>x.id),["MDG-1","MDG-2","THF-2","MWN-1","MWN-2"]);
});
test("fixture participant names contain no start number and IDs remain distinct",()=>{
 const csv=fs.readFileSync(path.join(__dirname,"../examples/synthetic/participants_tarmudi_fest_30.csv"),"utf8").trim().split(/\r?\n/).slice(1);
 assert.equal(csv.length,30);
 const parts=csv.map(r=>r.split(","));
 assert.equal(new Set(parts.map(r=>r[0])).size,30);
 assert.equal(new Set(parts.map(r=>r[1])).size,30);
 for(const p of parts){assert.match(p[1],/^Peserta Simulasi [A-Za-z ]+$/);assert.doesNotMatch(p[1],/\d/);}
});
