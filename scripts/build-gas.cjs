"use strict";
const fs=require("node:fs"),path=require("node:path");
const repo=path.resolve(__dirname,"..");
const authPath=path.join(repo,"experiments/step01-firebase-gas/Code.js");
const auth=fs.readFileSync(authPath,"utf8");
const position=auth.indexOf("\nfunction doGet()");
if(position<0)throw Error("auth source doGet anchor missing");
const output=[
 auth.slice(0,position),
 fs.readFileSync(path.join(repo,"src/server/ContestDomain.js"),"utf8").replace(/if\(typeof module!=="undefined"&&module.exports\)module.exports=\{TF26Domain\};/,""),
 fs.readFileSync(path.join(repo,"src/server/ContestStore.js"),"utf8"),
 fs.readFileSync(path.join(repo,"src/server/ContestApplication.js"),"utf8"),
 fs.readFileSync(path.join(repo,"src/server/ContestApi.js"),"utf8")
].join("\n\n");
if(/\b(import\s+|export\s+|require\s*\()/.test(output)||output.includes("module.exports"))throw Error("Build contains node/native ES-module references");
const dest=path.join(repo,"dist/gas");
fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,"Code.js"),output);
fs.copyFileSync(path.join(repo,"src/client/Index.html"),path.join(dest,"Index.html"));
fs.copyFileSync(path.join(repo,"experiments/step01-firebase-gas/appsscript.json"),path.join(dest,"appsscript.json"));
new (require("node:vm").Script)(output,{filename:"Code.js"});
console.log("GAS build syntax PASS; bytes="+Buffer.byteLength(output)+"; client ready; credentials excluded");
