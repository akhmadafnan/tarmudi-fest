"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("src/client/Index.html","utf8");
test("Admin branch filter preserved after dashboard refresh",()=>{
 assert.match(html,/let REGISTRATION_BRANCH_FILTER="ALL"/);
 assert.match(html,/let currentBranch=asAdmin\?REGISTRATION_BRANCH_FILTER:"ALL"/);
 assert.match(html,/REGISTRATION_BRANCH_FILTER=code;refreshFilters\(\);displayRows\(\);/);
});
test("Reset branch filter on logout, preserving privacy of shared device",()=>{
 assert.match(html,/FILTER="";REGISTRATION_BRANCH_FILTER="ALL";/);
 assert.ok(html.includes('JUDGE_SELECTED_NUMBER=null;JUDGE_SEARCH="";JUDGE_FILTER="ALL";'));
});
