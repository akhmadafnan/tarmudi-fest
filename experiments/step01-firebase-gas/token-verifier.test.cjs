"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const file = path.join(__dirname, "Code.js");
const source = fs.readFileSync(file, "utf8");
const now = 1_800_000_000;
const project = "tarmudi-fest-test";
const uid = "firebase-user-test-01";

function token(claimOverrides = {}) {
  const header = Buffer.from(JSON.stringify({alg:"RS256",typ:"JWT",kid:"mock"})).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    aud: project,
    iss: "https://securetoken.google.com/" + project,
    sub: uid,
    iat: now - 20,
    exp: now + 3600,
    ...claimOverrides
  })).toString("base64url");
  return [header,payload,Buffer.alloc(64,7).toString("base64url")].join(".");
}

function boot(options = {}) {
  const properties = new Map(Object.entries({
    TF26_FIREBASE_API_KEY: "AIza" + "A".repeat(32),
    TF26_FIREBASE_PROJECT_ID: project,
    TF26_INTERNAL_LOGIN_DOMAIN: "accounts.tarmudi.example",
    TF26_AUTH_ALLOWLIST_JSON: JSON.stringify({
      [uid]: {role:"juri",competition:"THF",active:true}
    }),
    ...(options.properties || {})
  }));
  let requests=0;
  const user={
    localId:uid,
    disabled:false,
    validSince:String(now-1000),
    ...(options.account || {})
  };
  const ctx={
    PropertiesService:{
      getScriptProperties(){return{getProperty(key){return properties.get(key)||null;}};}
    },
    UrlFetchApp:{
      fetch(url,opts){
        requests++;
        assert.match(url,/^https:\/\/identitytoolkit\.googleapis\.com\/v1\/accounts:lookup\?key=/);
        assert.equal(opts.method,"post");
        assert.equal(typeof JSON.parse(opts.payload).idToken,"string");
        return {
          getResponseCode(){return options.http || 200;},
          getContentText(){return JSON.stringify({users:[user]});}
        };
      }
    },
    Utilities:{
      base64DecodeWebSafe(encoded){return Array.from(Buffer.from(encoded,"base64url"));},
      newBlob(bytes){return{getDataAsString(){return Buffer.from(bytes).toString("utf8");}}}
    },
    Date: {now(){return now*1000;}},
    JSON,Number,Array,Object,String,Boolean,Math,RegExp,Error,
    encodeURIComponent
  };
  vm.runInNewContext(source,ctx,{filename:file,timeout:2000});
  return {whoAmI:ctx.apiWhoAmI,getRequestCount(){return requests;}};
}

test("valid provider-checked token and whitelisted UID expose only role and branch",()=>{
  const api=boot();
  const result=api.whoAmI(token());
  assert.equal(result.ok,true);
  assert.equal(result.role,"juri");
  assert.equal(result.competition,"THF");
  assert.equal(Object.keys(result).sort().join(","),"competition,ok,role");
  assert.equal(api.getRequestCount(),1);
});

test("missing/malformed token rejected before remote lookup",()=>{
  const api=boot();
  for(const candidate of [undefined,null,"","not.a.jwt","bad"]) {
    assert.equal(api.whoAmI(candidate).ok,false);
  }
  assert.equal(api.getRequestCount(),0);
});

test("remote Firebase 401 rejects even a well-shaped mock token",()=>{
  const api=boot({http:401});
  assert.deepEqual(JSON.parse(JSON.stringify(api.whoAmI(token()))),
    {ok:false,error:"AUTH_REQUIRED"});
});

test("disabled Firebase user rejected",()=>{
  assert.equal(boot({account:{disabled:true}}).whoAmI(token()).ok,false);
});

test("other Firebase project audience or issuer denied",()=>{
  const api=boot();
  assert.equal(api.whoAmI(token({aud:"foreign-project"})).ok,false);
  assert.equal(api.whoAmI(token({iss:"https://securetoken.google.com/foreign-project"})).ok,false);
});

test("expired, future-issued or pre-revocation tokens denied",()=>{
  const api=boot();
  assert.equal(api.whoAmI(token({exp:now-1})).ok,false);
  assert.equal(api.whoAmI(token({iat:now+120})).ok,false);
  const revoked=boot({account:{validSince:String(now+100)}});
  assert.equal(revoked.whoAmI(token()).ok,false);
});

test("uid mismatch, unknown uid and inactive private account denied",()=>{
  assert.equal(boot({account:{localId:"different-uid"}}).whoAmI(token()).ok,false);
  const unknown=boot({properties:{TF26_AUTH_ALLOWLIST_JSON:JSON.stringify({other:{role:"admin",competition:"ALL",active:true}})}});
  assert.equal(unknown.whoAmI(token()).ok,false);
  const inactive=boot({properties:{TF26_AUTH_ALLOWLIST_JSON:JSON.stringify({[uid]:{role:"juri",competition:"THF",active:false}})}});
  assert.equal(inactive.whoAmI(token()).ok,false);
});

test("unconfigured project fails closed",()=>{
  const api=boot({properties:{TF26_FIREBASE_API_KEY:"",TF26_FIREBASE_PROJECT_ID:""}});
  assert.equal(api.whoAmI(token()).ok,false);
  assert.equal(api.getRequestCount(),0);
});
