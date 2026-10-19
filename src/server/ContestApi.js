"use strict";
/**
 * GAS browser RPC façade; deny by default.
 * Each request independently authenticates Firebase ID token and maps a
 * verified UID to private role/cabang assigned in Script Properties.
 */
function tf26Properties_(){return PropertiesService.getScriptProperties();}
function tf26Actor_(token){
  const props=tf26Properties_();
  const verified=new FirebaseIdentityVerifier(
    props,UrlFetchApp,Utilities,()=>Math.floor(Date.now()/1000)
  ).verify(token);
  const authorization=new InternalAccountAuthorizer(props).findEnabledAccount(verified.uid);
  return {uid:verified.uid,role:authorization.role,competition:authorization.competition};
}
function tf26Service_(){
  const props=tf26Properties_();
  const id=props.getProperty("TF26_DATA_SHEET_ID");
  if(typeof id!=="string"||!/^[A-Za-z0-9_-]{20,90}$/.test(id))throw Error("DATABASE_NOT_READY");
  const book=SpreadsheetApp.openById(id);
  let roles;
  try{roles=JSON.parse(props.getProperty("TF26_AUTH_ALLOWLIST_JSON")||"{}")}
  catch(_){throw Error("INVALID_CONFIGURATION")}
  if(!roles||typeof roles!=="object"||Array.isArray(roles))throw Error("INVALID_CONFIGURATION");
  const allowedReduced=String(props.getProperty("TF26_ALLOW_TWO_JUDGE_BRANCHES")||"")
    .split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
  return new TF26Application(new TF26SheetStore(book),LockService,
    ()=>Utilities.formatDate(new Date(),"Asia/Jakarta","yyyy-MM-dd'T'HH:mm:ss")+"+07:00",
    roles,allowedReduced,
    String(props.getProperty("TF26_PRIVACY_RELEASE_AUTHORIZED")||"").toUpperCase()==="TRUE");
}
function tf26Error_(error){
  // A bounded set of user-actionable errors; never reveal internal system
  // exception details, raw token, Firebase config, participant identity.
  const allowed=[
    "AUTH_REQUIRED","NOT_ALLOWED","INVALID_REQUEST","ACCOUNT_EXISTS","ACCOUNT_LIMIT","INVALID_IMPORT","IMPORT_LOCKED","INVALID_SCHEME","INVALID_CONFIGURATION","POLICY_ADDENDUM_REQUIRED","INCOMPLETE_SCORES","TIE_RESOLUTION_REQUIRED","INVALID_TIE_DECISION","TIE_ALREADY_DECIDED","PRIVACY_APPROVAL_REQUIRED","NOT_VERIFIED",
    "INVALID_POINTS","NOT_CHECKED_IN","SCORE_LOCKED","JUDGING_NOT_OPEN",
    "JUDGES_INCOMPLETE","WRONG_PHASE","BUSY_RETRY","DATABASE_NOT_READY"
  ];
  const code=error&&error.message;
  return {ok:false,error:allowed.includes(code)?code:"REQUEST_FAILED"};
}
function tf26SeedSpec_(username){
  // All business roles are an explicit server-side allowlist, not chosen by browser.
  const seeds={
    "reg-mdg":["registrasi","MDG"],"reg-thf":["registrasi","THF"],"reg-mwn":["registrasi","MWN"]
  };
  for(const [prefix,branch] of [["mdg","MDG"],["thf","THF"],["mwn","MWN"]]){
    for(let i=1;i<=3;i++){
      const id="juri-"+prefix+"-"+String(i).padStart(2,"0");
      seeds[id]=["juri",branch];
    }
  }
  const result=Object.prototype.hasOwnProperty.call(seeds,username)?seeds[username]:null;
  return result?{role:result[0],competition:result[1]}:null;
}
function apiProvisionAccount(adminToken,username,newUserIdToken){
  try{
    const admin=tf26Actor_(adminToken);
    if(admin.role!=="admin")throw Error("NOT_ALLOWED");
    if(typeof username!=="string"||!/^((reg-(mdg|thf|mwn))|(juri-(mdg|thf|mwn)-0[1-3]))$/.test(username))
      throw Error("INVALID_REQUEST");
    const spec=tf26SeedSpec_(username);
    if(!spec)throw Error("INVALID_REQUEST");
    const props=tf26Properties_();
    const newIdentity=new FirebaseIdentityVerifier(
      props,UrlFetchApp,Utilities,()=>Math.floor(Date.now()/1000)
    ).verify(newUserIdToken);
    const lock=LockService.getScriptLock();
    if(!lock.tryLock(25000))throw Error("BUSY_RETRY");
    try{
      const map=JSON.parse(props.getProperty("TF26_AUTH_ALLOWLIST_JSON")||"{}");
      if(!map||typeof map!=="object"||Array.isArray(map))throw Error("INVALID_CONFIGURATION");
      if(Object.values(map).some(x=>x&&x.active===true&&x.username===username))throw Error("ACCOUNT_EXISTS");
      if(Object.prototype.hasOwnProperty.call(map,newIdentity.uid))throw Error("ACCOUNT_EXISTS");
      // Replace initial synthetic Tahfidz judge pilot with the real alias account.
      if(username==="juri-thf-01"){
        for(const uid of Object.keys(map)){
          const old=map[uid];
          if(old&&old.role==="juri"&&old.competition==="THF"&&!old.username&&old.active===true)
            old.active=false;
        }
      }
      const active=Object.values(map).filter(x=>x&&x.active===true);
      if(active.length>=13)throw Error("ACCOUNT_LIMIT");
      map[newIdentity.uid]={role:spec.role,competition:spec.competition,username,active:true};
      props.setProperty("TF26_AUTH_ALLOWLIST_JSON",JSON.stringify(map));
      return {ok:true,data:{username,role:spec.role,competition:spec.competition}};
    }finally{lock.releaseLock();}
  }catch(err){return tf26Error_(err);}
}
function apiApp(idToken){
  try{
    const actor=tf26Actor_(idToken);
    return {ok:true,data:tf26Service_().dashboard(actor)};
  }catch(err){return tf26Error_(err);}
}
function apiCommand(idToken,operation,payload){
  try{
    const actor=tf26Actor_(idToken);
    if(typeof operation!=="string"||!payload||typeof payload!=="object"||Array.isArray(payload))
      throw Error("INVALID_REQUEST");
    const app=tf26Service_();
    let result;
    if(operation==="PREVIEW_IMPORT")result=app.previewImport(actor,payload.rows);
    else if(operation==="COMMIT_IMPORT")result=app.commitImport(actor,payload.rows);
    else if(operation==="CHECK_IN")result=app.checkIn(actor,payload.id);
    else if(operation==="OPEN_JUDGING")result=app.setJudgingOpen(actor,payload.competition);
    else if(operation==="UPDATE_SCHEME")result=app.updateScheme(actor,payload);
    else if(operation==="CLOSE_JUDGING")result=app.closeJudging(actor,payload.competition);
    else if(operation==="PUBLISH_OFFICIAL")result=app.publishOfficial(actor,payload.competition);
    else if(operation==="RESOLVE_TIE")result=app.resolveTie(actor,payload);
    else if(operation==="SAVE_SCORE")result=app.score(actor,{
      startNo:payload.startNo,points:payload.points,final:payload.final
    });
    else throw Error("NOT_ALLOWED");
    return {ok:true,data:result};
  }catch(err){return tf26Error_(err);}
}
function apiPublic(competition){
  try{return {ok:true,data:tf26Service_().publicResults(competition)};}
  catch(err){return tf26Error_(err);}
}
function doGet(request){
  if(request&&request.parameter&&request.parameter.view==="results"){
    const branch=String(request.parameter.cabang||"").toUpperCase();
    const payload=apiPublic(branch);
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const props=tf26Properties_();
  const apiKey=props.getProperty("TF26_FIREBASE_API_KEY")||"";
  const domain=props.getProperty("TF26_INTERNAL_LOGIN_DOMAIN")||"";
  const projectId=props.getProperty("TF26_FIREBASE_PROJECT_ID")||"";
  const template=HtmlService.createTemplateFromFile("Index");
  template.publicConfig=JSON.stringify({
    apiKey:/^AIza[A-Za-z0-9_-]{20,}$/.test(apiKey)?apiKey:"",
    projectId:/^[a-z][a-z0-9-]{4,40}$/.test(projectId)?projectId:"",
    domain:/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)?domain:""
  });
  return template.evaluate().setTitle("Tarmudi Fest 2026 — Sistem Lomba")
    .addMetaTag("viewport","width=device-width,initial-scale=1");
}
