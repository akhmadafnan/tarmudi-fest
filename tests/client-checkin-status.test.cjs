"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
const match=html.match(/function tf26HasStartNumber\(value\)\s*\{[\s\S]*?\n\}/);
assert.ok(match,"check-in status helper missing");
const sandbox=vm.createContext({Number});
vm.runInContext(match[0],sandbox);
const valid=sandbox.tf26HasStartNumber;
test("unassigned numbers cannot show checked-in status",()=>{
 for(const value of [undefined,null,"",0,-1,NaN,"001",false]){
  assert.equal(valid(value),false,`invalid value: ${String(value)}`);
 }
});
test("only positive integer start numbers count as checked-in",()=>{
 for(const value of [1,2,30,999])assert.equal(valid(value),true);
 for(const value of [1.5,Infinity,{}])assert.equal(valid(value),false);
});
test("all four render decisions use the same guard",()=>{
 assert.match(html,/scoped\.filter\(p=>tf26HasStartNumber\(p\.startNo\)\)/);
 assert.match(html,/const checkedIn=tf26HasStartNumber\(p\.startNo\)/);
 assert.match(html,/const n=checkedIn\?/);
 assert.match(html,/button\.disabled=checkedIn\|\|!p\.verified/);
 assert.doesNotMatch(html,/startNo\s*!==\s*null|startNo\s*===\s*null/);
});
