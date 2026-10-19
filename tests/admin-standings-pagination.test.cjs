"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const html=fs.readFileSync("src/client/Index.html","utf8");
const start=html.indexOf("function tf26AdminStandingPage(entries,query,requestedPage,pageSize){");
const end=html.indexOf("const TF26_ADMIN_STANDINGS_PAGE_SIZE",start);
assert.ok(start>=0&&end>start,"Missing Admin paging helper");
const ctx=vm.createContext({Array,String,Number,Math});
vm.runInContext(html.slice(start,end),ctx);
const page=ctx.tf26AdminStandingPage;
const fixture=Array.from({length:200},(_,index)=>({
 competition:"THF",startNo:index+1,rank:index+1,
 fullName:"Peserta Simulasi "+String(index+1).padStart(3,"0"),
 school:"TK/RA Simulasi "+(index%9)
}));
test("200 Admin results render 20/page over exactly ten pages",()=>{
 for(let current=1;current<=10;current++){
  const out=page(fixture,"",current,20);
  assert.equal(out.page,current);
  assert.equal(out.total,200);
  assert.equal(out.pageCount,10);
  assert.equal(out.rows.length,20);
  assert.equal(out.rows[0].startNo,(current-1)*20+1);
  assert.equal(out.rows.at(-1).startNo,current*20);
 }
});
test("search by leading-zero start number, participant, and school works",()=>{
 const byNumber=page(fixture,"003",1,20);
 assert.equal(byNumber.total,1);
 assert.equal(byNumber.rows[0].startNo,3);
 const byName=page(fixture,"peserta simulasi 150",1,20);
 assert.equal(byName.rows[0].startNo,150);
 const bySchool=page(fixture,"ra simulasi 3",1,20);
 assert.equal(bySchool.total>0,true);
});
test("page numbers clamp if search reduces result count",()=>{
 const out=page(fixture,"peserta simulasi 199",19,20);
 assert.equal(out.page,1);
 assert.equal(out.pageCount,1);
 assert.equal(out.rows[0].startNo,199);
});
test("an empty set displays empty first page, never negative pages",()=>{
 const out=page([],"anything",-9,20);
 assert.equal(out.page,1);
 assert.equal(out.pageCount,1);
 assert.equal(out.total,0);
 assert.equal(out.rows.length,0);
});
test("paginated Admin UI still computes deliberations from all standings",()=>{
 const admin=html.slice(html.indexOf("function drawAdminStandings(){"),html.indexOf("function tf26HasStartNumber("));
 assert.match(admin,/const open=new Map\(\)/);
 assert.match(admin,/for\(const item of standings\.filter\(x=>x\.pendingDeliberation===true\)\)/);
 assert.match(admin,/const key=item\.tieGroupPosition/);
 assert.doesNotMatch(admin,/const groupKey=item\.meanScore\.toFixed\(2\)/);
 assert.match(admin,/if\(!canDecide\)box\.append/);
 assert.match(admin,/save\.disabled=!canDecide/);
});
test("public lower ties use shared-rank language and remain anonymous",()=>{
 const pub=html.slice(html.indexOf("async function loadPublic(){"),html.indexOf("function publicView(){"));
 assert.match(pub,/p\.sharedRank\?"Peringkat bersama/);
 assert.ok(html.includes('return "#"+entry.rank+" (seri)";'));
});
