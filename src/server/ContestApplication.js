"use strict";
/** TF26 application use cases. Client-provided role/competition has no authority. */
class TF26Application {
  constructor(store,locks,clock,assignments,approvedTwoJudgeBranches,privacyReleaseApproved){
    this.store_=store;this.locks_=locks;this.clock_=clock;
    this.assignments_=assignments||{};
    this.approvedTwoJudgeBranches_=approvedTwoJudgeBranches||[];
    this.privacyReleaseApproved_=privacyReleaseApproved===true;
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
      assignedJudgeCount:this.assignedJudges_(s.competition).length,version:s.version,criteria:s.criteria,
      publication:s.publication,privacyApproved:s.privacyApproved
    }));
    const privateStandings=confs.map(s=>{
      const safe=this.publicResults(s.competition);
      const participants=this.participantsAndAttendance_(s.competition);
      return {competition:s.competition,items:safe.results.map(r=>{
        const p=participants.find(x=>x.startNo===r.startNo);
        return {...r,fullName:p?p.fullName:"",school:p?p.school:""};
      })};
    });
    const provisionedAccounts=Object.values(this.assignments_)
      .filter(u=>u&&u.active===true&&typeof u.username==="string")
      .map(u=>u.username);
    return {role:"admin",competition:"ALL",provisionedAccounts,config:confs,
      participants:this.participantsAndAttendance_(null),privateStandings};
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
  updateScheme(actor,req){
    this.assertActor_(actor,["admin"]);
    if(!req||!["MDG","THF","MWN"].includes(req.competition)||
      ![2,3].includes(req.requiredJudges))throw Error("INVALID_CONFIGURATION");
    TF26Domain.checkScheme(req.criteria);
    if(req.criteria.some(c=>c[0].trim().length>80))throw Error("INVALID_SCHEME");
    if(req.requiredJudges===2&&["MDG","THF"].includes(req.competition)&&
       !this.approvedTwoJudgeBranches_.includes(req.competition))
      throw Error("POLICY_ADDENDUM_REQUIRED");
    return this.locked_(()=>{
      const conf=this.setting_(req.competition);
      if(!["READY","DRAFT"].includes(conf.state)||
        this.store_.scores().some(row=>row.competition===req.competition))
        throw Error("WRONG_PHASE");
      const newVersion=conf.version+1;
      this.store_.updateScheme(conf,req.criteria,req.requiredJudges,newVersion,actor.uid,this.stamp_());
      this.store_.appendAudit(actor.uid,"SCHEME_UPDATE",req.competition,
        "v"+conf.version+"->v"+newVersion+";required="+req.requiredJudges,this.stamp_());
      return {competition:req.competition,version:newVersion,requiredJudges:req.requiredJudges};
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
  closeJudging(actor,competition){
    this.assertActor_(actor,["admin"]);
    if(!["MDG","THF","MWN"].includes(competition))throw Error("INVALID_REQUEST");
    return this.locked_(()=>{
      const conf=this.setting_(competition);
      if(conf.state!=="JUDGING_OPEN")throw Error("WRONG_PHASE");
      const attendance=this.store_.checkins().filter(x=>x.competition===competition);
      const results=this.publicResults(competition).results;
      if(attendance.length<6||results.length!==attendance.length)
        throw Error("INCOMPLETE_SCORES");
      this.store_.setPhase(conf,"REVIEW");
      this.store_.appendAudit(actor.uid,"CLOSE_JUDGING",competition,
        "completed="+results.length,this.stamp_());
      return {competition,state:"REVIEW",completed:results.length};
    });
  }
  resolveTie(actor,req){
    this.assertActor_(actor,["admin"]);
    if(!req||!["MDG","THF","MWN"].includes(req.competition)||
      !Array.isArray(req.orderedStartNumbers)||req.orderedStartNumbers.length<2||
      !req.orderedStartNumbers.every(n=>Number.isInteger(n)&&n>0)||
      typeof req.reason!=="string"||req.reason.trim().length<15||req.reason.length>500)
      throw Error("INVALID_TIE_DECISION");
    return this.locked_(()=>{
      const conf=this.setting_(req.competition);
      if(conf.state!=="REVIEW")throw Error("WRONG_PHASE");
      const all=this.publicResults(req.competition).results;
      const pending=all.filter(x=>x.pendingDeliberation===true);
      const candidates=pending.filter(x=>req.orderedStartNumbers.includes(x.startNo));
      if(candidates.length!==req.orderedStartNumbers.length||
        new Set(req.orderedStartNumbers).size!==req.orderedStartNumbers.length)
        throw Error("INVALID_TIE_DECISION");
      // An exact-score tie is identified by its pre-deliberation group
      // position. Equal *rounded means* alone do not prove a genuine tie,
      // particularly in Tahfidz with criterion-priority ordering.
      const tiedPosition=candidates[0].tieGroupPosition;
      const exactGroup=pending.filter(x=>x.tieGroupPosition===tiedPosition);
      const winnerSlots=Math.min(exactGroup.length,7-tiedPosition);
      if(!Number.isInteger(tiedPosition)||tiedPosition<1||tiedPosition>6||
        winnerSlots<1||req.orderedStartNumbers.length!==winnerSlots||
        candidates.some(x=>x.tieGroupPosition!==tiedPosition))
        throw Error("INVALID_TIE_DECISION");
      const key=this.tieKey_(req.competition,candidates[0].startNo,conf);
      if(!key||exactGroup.some(x=>this.tieKey_(req.competition,x.startNo,conf)!==key))
        throw Error("INVALID_TIE_DECISION");
      if(this.store_.tieDecisions().some(d=>d.competition===req.competition&&d.scoreKey===key))
        throw Error("TIE_ALREADY_DECIDED");
      const payload={competition:req.competition,orderedStartNumbers:req.orderedStartNumbers,
        scoreKey:key,reason:req.reason.trim(),actorUid:actor.uid,at:this.stamp_()};
      this.store_.appendTieDecision(payload);
      this.store_.appendAudit(actor.uid,"RESOLVE_TIE",req.competition,
        "numbers="+payload.orderedStartNumbers.join(",")+";reason_documented",payload.at);
      return {competition:req.competition,orderedStartNumbers:req.orderedStartNumbers,resolved:true};
    });
  }
  tieKey_(competition,startNo,conf){
    const scores=this.store_.scores().filter(x=>x.competition===competition&&x.startNo===startNo&&
      x.version===conf.version&&x.status==="FINAL"&&this.assignedJudges_(competition).includes(x.judgeUid));
    if(scores.length!==conf.requiredJudges)return null;
    let sum=0;const parts=Array(conf.criteria.length).fill(0);
    for(const score of scores){
      sum+=TF26Domain.validatePoints(conf.criteria,score.points);
      score.points.forEach((v,i)=>parts[i]+=v);
    }
    return competition==="THF"?[sum,...parts].join(":"):String(sum);
  }
  publishOfficial(actor,competition){
    this.assertActor_(actor,["admin"]);
    if(!["MDG","THF","MWN"].includes(competition))throw Error("INVALID_REQUEST");
    if(!this.privacyReleaseApproved_)throw Error("PRIVACY_APPROVAL_REQUIRED");
    return this.locked_(()=>{
      const conf=this.setting_(competition);
      if(conf.state!=="REVIEW")throw Error("WRONG_PHASE");
      const count=this.store_.checkins().filter(x=>x.competition===competition).length;
      const results=this.publicResults(competition).results;
      if(results.length!==count||count<6)throw Error("INCOMPLETE_SCORES");
      // Every unresolved top-six or 6th-place-boundary tie must be decided.
      // Lower shared ranks do not prevent publication.
      if(results.some(x=>x.pendingDeliberation===true)||
        results.slice(0,6).some(x=>!Number.isInteger(x.rank)))
        throw Error("TIE_RESOLUTION_REQUIRED");
      const now=this.stamp_();
      this.store_.markOfficial(conf,actor.uid,now);
      this.store_.appendAudit(actor.uid,"PUBLISH_OFFICIAL",competition,
        "winners=6;privacyGate=owner-approved",now);
      return {competition,state:"OFFICIAL",publishedAt:now,winners:6};
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
  /**
   * Explicit correction of a previously FINAL score. Ordinary SAVE_SCORE
   * remains immutable; this separate action requires a written reason,
   * original-value optimistic guard and an immutable before/after journal.
   */
  correctFinalScore(actor,req){
    this.assertActor_(actor,["juri"]);
    if(!req||typeof req!=="object"||Array.isArray(req)||
      !Number.isInteger(req.startNo)||req.startNo<1||req.startNo>9999||
      !Array.isArray(req.points)||!Array.isArray(req.expectedPoints)||
      typeof req.reason!=="string"||
      req.reason.trim().length<15||req.reason.trim().length>400)
      throw Error("INVALID_CORRECTION");
    const competition=actor.competition;
    return this.locked_(()=>{
      const conf=this.setting_(competition);
      if(conf.state!=="JUDGING_OPEN")throw Error("CORRECTION_CLOSED");
      if(!this.assignedJudges_(competition).includes(actor.uid))throw Error("NOT_ASSIGNED");
      if(!this.store_.checkins().some(c=>c.competition===competition&&c.startNo===req.startNo))
        throw Error("NOT_CHECKED_IN");
      const key=[competition,req.startNo,actor.uid,conf.version].join("::");
      const original=this.store_.scores().find(s=>s.key===key&&s.judgeUid===actor.uid);
      if(!original||original.status!=="FINAL")throw Error("SCORE_NOT_FINAL");
      const oldTotal=TF26Domain.validatePoints(conf.criteria,original.points);
      if(!Number.isInteger(original.total)||original.total!==oldTotal)
        throw Error("SCORE_DATA_INVALID");
      if(JSON.stringify(req.expectedPoints)!==JSON.stringify(original.points))
        throw Error("SCORE_CHANGED_REFRESH");
      const newTotal=TF26Domain.validatePoints(conf.criteria,req.points);
      if(JSON.stringify(req.points)===JSON.stringify(original.points))
        throw Error("NO_SCORE_CHANGE");
      const now=this.stamp_();
      // First preserve an immutable before/after snapshot. If the subsequent
      // write fails, the journal remains PENDING for manual reconciliation.
      const revisionRow=this.store_.appendScoreRevision({
        competition,startNo:req.startNo,judgeUid:actor.uid,
        schemeVersion:conf.version,oldPoints:original.points,oldTotal,
        newPoints:req.points,newTotal,reason:req.reason.trim(),at:now
      });
      this.store_.saveScore({
        key,competition,startNo:req.startNo,judgeUid:actor.uid,
        version:conf.version,points:req.points,total:newTotal,status:"FINAL",at:now
      },original);
      this.store_.markScoreRevisionApplied(revisionRow);
      this.store_.appendAudit(actor.uid,"CORRECT_FINAL_SCORE",
        competition+"#"+req.startNo,
        "v"+conf.version+";old="+oldTotal+";new="+newTotal+
        ";reason_recorded;revision_row="+revisionRow,now);
      return {competition,startNo:req.startNo,status:"FINAL",total:newTotal,corrected:true};
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
      participants,tieDecisions:this.store_.tieDecisions()
    });
    return {competition,phase:conf.publication==="OFFICIAL"&&conf.privacyApproved?"OFFICIAL":"INTERIM",
      results:result,updatedAt:this.stamp_()};
  }
}
