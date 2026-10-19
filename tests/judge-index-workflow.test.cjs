"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
const domain=fs.readFileSync(path.join(__dirname,"../src/server/ContestApplication.js"),"utf8");
const judgeStart=html.indexOf("function tf26JudgeLabel(entry){");
const judgeEnd=html.indexOf("function tabs(){",judgeStart);
assert.ok(judgeStart>=0&&judgeEnd>judgeStart,"Judge UI section absent");
const judge=html.slice(judgeStart,judgeEnd);
const helperEnd=judge.indexOf("function drawJudge(root){");
assert.ok(helperEnd>0);
const ctx=vm.createContext({Number,String,Array,Object});
vm.runInContext(judge.slice(0,helperEnd),ctx,{timeout:2000});
const rubrics=[["Kelancaran",40],["Tajwid",30],["Fashohah",20],["Irama",10]];
const entry=(startNo,status,ownPoints=[])=>({startNo,status,ownPoints});
test("judge index sorts not-started before draft and final, within status by startNo",()=>{
 const data=[entry(4,"FINAL",[35,27,18,8]),entry(3,"DRAFT"),entry(2,"NOT_STARTED"),
 entry(1,"FINAL",[40,30,20,10]),entry(5,"NOT_STARTED"),entry(6,"DRAFT")];
 const result=ctx.tf26JudgeEntries(data,"","ALL");
 assert.deepEqual(result.map(x=>x.startNo).join(","),"2,5,3,6,1,4");
});
test("numeric search supports leading zeros and status filtering",()=>{
 const data=[entry(1,"NOT_STARTED"),entry(4,"FINAL",[35,27,18,8]),entry(14,"DRAFT")];
 assert.deepEqual(ctx.tf26JudgeEntries(data,"004","ALL").map(x=>x.startNo),[4]);
 assert.deepEqual(ctx.tf26JudgeEntries(data,"4","ALL").map(x=>x.startNo).join(","),"14,4");
 assert.deepEqual(ctx.tf26JudgeEntries(data,"","NOT_STARTED").map(x=>x.startNo),[1]);
 assert.deepEqual(ctx.tf26JudgeEntries(data,"","FINAL").map(x=>x.startNo),[4]);
});
test("score shown only for own completed FINAL, draft never appears as final score",()=>{
 assert.equal(ctx.tf26JudgeOwnTotal(entry(1,"FINAL",[35,27,18,8]),rubrics),88);
 assert.equal(ctx.tf26JudgeOwnTotal(entry(1,"DRAFT",[35,27,18,8]),rubrics),null);
 assert.equal(ctx.tf26JudgeOwnTotal(entry(1,"NOT_STARTED",[]),rubrics),null);
 assert.equal(ctx.tf26JudgeOwnTotal(entry(1,"FINAL",[40,31,20,9]),rubrics),null);
 assert.equal(ctx.tf26JudgeOwnTotal(entry(1,"FINAL",[35,27,18]),rubrics),null);
});
test("index never renders input scoring; form is single-number detail",()=>{
 const index=judge.slice(judge.indexOf("function drawJudgeIndex("),judge.indexOf("function drawJudgeDetail("));
 const detail=judge.slice(judge.indexOf("function drawJudgeDetail("));
 assert.doesNotMatch(index,/type:"number"/);
 assert.match(detail,/type:"number"/);
 assert.match(index,/JUDGE_SELECTED_NUMBER=item.startNo/);
 assert.match(detail,/← Kembali ke indeks/);
 assert.match(detail,/JUDGE_SELECTED_NUMBER=null;/);
});
test("after a successful save, judge returns to updated index",()=>{
 assert.match(judge,/const saved=await submitAction\("SAVE_SCORE"/);
 assert.match(judge,/if\(saved\)\{\s*JUDGE_SELECTED_NUMBER=null;\s*if\(DATA&&DATA.role==="juri"\)drawWorkspace\(\)/);
});
test("judge view never prints identity, school or registration IDs",()=>{
 assert.doesNotMatch(judge,/\b(fullName|school|participantId|registrationId|otherJudge|idPendaftaran)\b/i);
 assert.doesNotMatch(judge,/innerHTML\s*=/);
 const only=domain.slice(domain.indexOf('if(actor.role==="juri"){'),domain.indexOf('if(actor.role==="registrasi"){'));
 assert.match(only,/s\.judgeUid===actor\.uid/);
 assert.match(only,/s\.competition===actor\.competition/);
 const executable=only.replace(/\/\/[^\r\n]*/g,"");
 assert.doesNotMatch(executable,/\b(fullName|school|participantId|idPendaftaran)\b/);
});
test("status READY prevents drafts and finalization; finalized own score always locked",()=>{
 assert.match(judge,/const canWrite=DATA\.phase==="JUDGING_OPEN"&&!finalized/);
 assert.match(judge,/button\.disabled=!canWrite/);
});
test("mobile index uses full-width button; contrast and touch targets retained",()=>{
 assert.match(html,/@media\(max-width:700px\)/);
 assert.match(html,/\.jury-index-row \.jury-open\{grid-area:open;width:100%;min-height:46px\}/);
 assert.match(html,/\.jury-form-actions button\{width:100%\}/);
});
test("logout clears search and selection for shared judge devices",()=>{
 assert.match(html,/JUDGE_SELECTED_NUMBER=null;JUDGE_SEARCH="";JUDGE_FILTER="ALL";/);
});
