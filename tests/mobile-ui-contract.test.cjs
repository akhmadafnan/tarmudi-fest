"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../src/client/Index.html"),"utf8");
const css=html.split("<style>")[1].split("</style>")[0];
const registration=html.split("function drawRegistration(root,asAdmin){")[1].split("function drawJudge(root){")[0];
test("mobile 320–430px breakpoint exists and avoids desktop columns",()=>{
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/\.grid\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.participant-card\{grid-template-columns:minmax\(0,1fr\) auto;/);
 assert.match(css,/grid-template-areas:"info number" "action action"/);
});
test("mobile touch targets and no iOS input zoom",()=>{
 assert.match(css,/\.participant-card \.checkin-button\{[^}]*min-height:46px/);
 assert.match(css,/\.registration-filters \.chip\{min-height:44px/);
 assert.match(css,/\.registration-search input\{min-height:48px;font-size:16px/);
 assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1">/);
});
test("registration status still driven by positive start number only",()=>{
 assert.match(registration,/tf26HasStartNumber\(p\.startNo\)/);
 assert.match(html,/scoped\.filter\(p=>tf26HasStartNumber\(p\.startNo\)\)/);
 assert.doesNotMatch(registration,/startNo\s*!==\s*null|startNo\s*===\s*null/);
});
test("Admin branch filters use accessible state and preserve text-only rendering",()=>{
 assert.match(registration,/registration-filters/);
 assert.match(registration,/aria-pressed/);
 assert.match(registration,/\["MDG","Mendongeng"\]/);
 assert.match(registration,/\["THF","Tahfidz"\]/);
 assert.match(registration,/\["MWN","Mewarnai"\]/);
 assert.doesNotMatch(registration,/innerHTML\s*=/);
});
test("no backend APIs or sheet writes in mobile presentation section",()=>{
 assert.doesNotMatch(registration,/SpreadsheetApp|PropertiesService|FirebaseIdentityVerifier/);
 assert.match(registration,/submitAction\("CHECK_IN",\{id:p\.id\}/);
});
