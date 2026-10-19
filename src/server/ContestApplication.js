"use strict";
/** TF26 application use cases. Client-provided role/competition has no authority. */
class TF26Application {
  constructor(store,locks,clock,assignments){
    this.store_=store;this.locks_=locks;this.clock_=clock;this.assignments_=assignments||{};
  }
  stamp_(){return this.clock_();}
  assertActor_(actor,roles){
    if(!actor||typeof actor.uid!=="string"||!actor.uid||!roles.includes(actor.role))throw Error("NOT_ALLOWED");
  }
  allowed_(actor,competition){
    if(actor.role!=="admin"&&actor.competition!==competition)throw Error("NOT_ALLOWED");
  }
  setting_(competition){
    const s=this.store_.settings().find(row=>row.competition===competition);
    if(!s)throw Error("INVALID_CONFIGURATION");
    TF26Domain.checkScheme(s.criteria);
    if(![2,3].includes(s.requiredJudges))throw Error("INVALID_CONFIGURATION");
    return s;
  }
  assignedJudges_(competition){
    return Object.keys(this.assignments_).filter(uid=>{
      const a=this.assignments_[uid];return a&&a.role==="juri"&&a.active===true&&a.competition===competition;
    });
  }
  participantsAndAttendance_(competition){
    const checked=this.store_.checkins();
    return this.store_.participants().filter(p=>!competition||p.competition===competition)
      .map(p=>{const c=checked.find(x=>x.participantId===p.id);
        return {id:p.id,fullName:p.fullName,school:p.school,competition:p.competition,
          verified:p.verified,startNo:c?c.startNo:null};
      });
  }
  dashboard(actor){
    this.assertActor_(actor,["admin","registrasi","juri"]);
    if(actor.role==="juri"){
      const conf=this.setting_(actor.competition);
      const scored=this.store_.scores().filter(s=>s.judgeUid===actor.uid&&s.competition===actor.competition&&s.version===conf.version);
      const entries=this.store_.checkins().filter(s=>s.competition===actor.competition)
        .map(c=>{const own=scored.find(s=>s.startNo===c.startNo);
          return {startNo:c.startNo,status:own?own.status:"NOT_STARTED",ownPoints:own?own.points:[]};
        }).sort((a,b)=>a.startNo-b.startNo);
      // Never return names, schools, source registration IDs, or other judges' data.
      return {role:"juri",competition:actor.competition,phase:conf.state,
        criteria:conf.criteria,schemeVersion:conf.version,entries};
    }
    if(actor.role==="registrasi"){
      const conf=this.setting_(actor.competition);
      return {role:"registrasi",competition:actor.competition,phase:conf.state,
        participants:this.participantsAndAttendance_(actor.competition)};
    }
    const confs=this.store_.settings().map(s=>({
      competition:s.competition,label:s.label,phase:s.state,requiredJudges:s.requiredJudges,
      assignedJudgeCount:this.assignedJudges_(s.competition).length,version:s.version,
      publication:s.publication,privacyApproved:s.privacyApproved
    }));
    return {role:"admin",competition:"ALL",config:confs,participants:this.participantsAndAttendance_(null)};
  }
  locked_(handler){
    const lock=this.locks_.getScriptLock();
    if(!lock.tryLock(25000))throw Error("BUSY_RETRY");
    try{return handler()}finally{lock.releaseLock();}
  }
  inspectImport_(actor,rows){
    this.assertActor_(actor,["admin"]);
    if(!Array.isArray(rows)||rows.length<1||rows.length>500)throw Error("INVALID_IMPORT");
    const seen=new Set();const schoolCaps=new Map();const valid=[];
    const errors=[];
    rows.forEach((r,i)=>{
      const line=i+2;
      if(!r||typeof r!=="object"||Array.isArray(r)){errors.push("Baris "+line+": kosong atau tidak valid");return}
      const id=String(r.id||"").trim(),fullName=String(r.fullName||"").trim(),
        school=String(r.school||"").trim(),branch=String(r.branch||"").trim(),
        status=String(r.status||"").trim().toUpperCase();
      let code;
      try{code=TF26Domain.code(branch)}
      catch(_){errors.push("Baris "+line+": cabang tidak dikenal");return}
      if(id.length<3||id.length>90||fullName.length<2||fullName.length>120||
        school.length<2||school.length>180||!["TERVERIFIKASI","BELUM_VERIFIKASI","DITOLAK"].includes(status)){
        errors.push("Baris "+line+": ID/nama/sekolah/status tidak sesuai");return;
      }
      if(seen.has(id.toUpperCase())){errors.push("Baris "+line+": ID pendaftaran duplikat");return}
      seen.add(id.toUpperCase());
      const key=code+"::"+school.toLocaleLowerCase("id-ID").replace(/\s+/g," ");
      const count=(schoolCaps.get(key)||0)+1;schoolCaps.set(key,count);
      if((code==="MDG"||code==="THF")&&count>2){
        errors.push("Baris "+line+": delegasi sekolah melebihi 2 untuk "+branch);
      }
      valid.push({id,fullName,school,competition:code,status});
    });
    return {total:rows.length,accepted:valid.length,rejected:errors.length,issues:errors.slice(0,30),valid};
  }
  previewImport(actor,rows){
    const p=this.inspectImport_(actor,rows);
    return {total:p.total,accepted:p.accepted,rejected:p.rejected,
      issues:p.issues,canCommit:p.rejected===0};
  }
  commitImport(actor,rows){
    const checked=this.inspectImport_(actor,rows);
    if(checked.rejected!==0)throw Error("INVALID_IMPORT");
    return this.locked_(()=>{
      // Destructive replacement is permissible ONLY before ANY check-in or score.
      if(this.store_.checkins().length>0||this.store_.scores().length>0)
        throw Error("IMPORT_LOCKED");
      const backup=this.store_.replaceParticipants(checked.valid);
      this.store_.appendAudit(actor.uid,"REPLACE_IMPORT","PESERTA_IMPORT",
        "baris="+checked.valid.length+";cadangan="+backup,this.stamp_());
      return {imported:checked.valid.length,backupCreated:true};
    });
  }
  checkIn(actor,registrationId){
    this.assertActor_(actor,["admin","registrasi"]);
    if(typeof registrationId!=="string"||registrationId.length>90||registrationId.length<3)throw Error("INVALID_REQUEST");
    return this.locked_(()=>{
      const p=this.store_.participants().find(x=>x.id===registrationId);
      if(!p||!p.verified)throw Error("NOT_VERIFIED");
      this.allowed_(actor,p.competition);
      const checkins=this.store_.checkins();
      const already=checkins.find(c=>c.participantId===registrationId);
      if(already)return {competition:already.competition,startNo:already.startNo,repeated:true};
      const next=Math.max(0,...checkins.filter(x=>x.competition===p.competition).map(x=>x.startNo))+1;
      const at=this.stamp_();
      this.store_.appendCheckin({participantId:p.id,competition:p.competition,startNo:next,
        actorUid:actor.uid,at});
      this.store_.appendAudit(actor.uid,"CHECKIN",p.id,p.competition+"#"+next,at);
      return {competition:p.competition,startNo:next,repeated:false};
    });
  }
  setJudgingOpen(actor,competition){
    this.assertActor_(actor,["admin"]);
    if(!["MDG","THF","MWN"].includes(competition))throw Error("INVALID_REQUEST");
    return this.locked_(()=>{
      const conf=this.setting_(competition);
      if(conf.state!=="READY")throw Error("WRONG_PHASE");
      if(this.assignedJudges_(competition).length!==conf.requiredJudges)throw Error("JUDGES_INCOMPLETE");
      this.store_.setPhase(conf,"JUDGING_OPEN");
      this.store_.appendAudit(actor.uid,"OPEN_JUDGING",competition,"v"+conf.version,this.stamp_());
      return {competition,state:"JUDGING_OPEN"};
    });
  }
  score(actor,req){
    this.assertActor_(actor,["juri"]);
    if(!req||typeof req!=="object"||!Number.isInteger(req.startNo)||req.startNo<1||req.startNo>9999||
      !Array.isArray(req.points)||typeof req.final!=="boolean")throw Error("INVALID_REQUEST");
    const competition=actor.competition;
    return this.locked_(()=>{
      const conf=this.setting_(competition);
      if(conf.state!=="JUDGING_OPEN")throw Error("JUDGING_NOT_OPEN");
      if(!this.assignedJudges_(competition).includes(actor.uid))throw Error("NOT_ASSIGNED");
      const validNo=this.store_.checkins().some(c=>c.competition===competition&&c.startNo===req.startNo);
      if(!validNo)throw Error("NOT_CHECKED_IN");
      if(req.points.length!==conf.criteria.length)throw Error("INVALID_POINTS");
      let total=null;
      if(req.final)total=TF26Domain.validatePoints(conf.criteria,req.points);
      else{
        req.points.forEach((v,i)=>{
          if(v===null||v==="")return;
          if(typeof v!=="number"||!Number.isInteger(v)||v<0||v>conf.criteria[i][1])throw Error("INVALID_POINTS");
        });
      }
      const key=[competition,req.startNo,actor.uid,conf.version].join("::");
      const original=this.store_.scores().find(s=>s.key===key);
      if(original&&original.status==="FINAL")throw Error("SCORE_LOCKED");
      const now=this.stamp_();
      this.store_.saveScore({key,competition,startNo:req.startNo,judgeUid:actor.uid,
        version:conf.version,points:req.points,total,status:req.final?"FINAL":"DRAFT",at:now},original);
      this.store_.appendAudit(actor.uid,req.final?"FINAL_SCORE":"DRAFT_SCORE",
        competition+"#"+req.startNo,"v"+conf.version,now);
      return {startNo:req.startNo,competition,status:req.final?"FINAL":"DRAFT",total};
    });
  }
  publicResults(competition){
    if(!["MDG","THF","MWN"].includes(competition))throw Error("INVALID_REQUEST");
    const conf=this.setting_(competition);
    const attendance=this.store_.checkins();
    const participants=this.participantsAndAttendance_(competition);
    const judges=this.assignedJudges_(competition);
    const result=TF26Domain.rank({
      competition,criteria:conf.criteria,requiredJudges:conf.requiredJudges,
      assignedJudgeUids:judges,checkins:attendance,scores:this.store_.scores(),
      schemeVersion:conf.version,phase:conf.publication,privacyApproved:conf.privacyApproved,
      participants
    });
    return {competition,phase:conf.publication==="OFFICIAL"&&conf.privacyApproved?"OFFICIAL":"INTERIM",
      results:result,updatedAt:this.stamp_()};
  }
}
