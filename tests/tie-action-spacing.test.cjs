"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("src/client/Index.html","utf8");
const css=html.split("<style>")[1].split("</style>")[0];
test("deliberation save action is visually separated from reason input",()=>{
 assert.match(html,/const save=node\("button",\{class:"green tie-resolution-save"\},\["Rekam keputusan musyawarah"\]\)/);
 assert.match(css,/\.tie-resolution-save\{display:block;margin-top:18px;min-height:48px\}/);
});
test("jury tie decision save is full width and remains separated on mobile",()=>{
 assert.match(css,/@media\(max-width:700px\)\{\.tie-resolution-save\{width:100%;margin-top:20px\}\}/);
});
test("spacing change does not modify tie persistence flow",()=>{
 const section=html.slice(html.indexOf("function drawAdminStandings(){"),html.indexOf("function tf26HasStartNumber("));
 assert.match(section,/submitAction\("RESOLVE_TIE"/);
 assert.match(section,/reason\.value\.trim\(\)\.length<15/);
});
