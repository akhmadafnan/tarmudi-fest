"use strict";
/**
 * TF26 GAS storage adapter, test-only until UAT GO.
 * Schema is explicit. Never return raw Sheets rows to judges or public.
 */
class TF26SheetStore {
  constructor(book){this.book_=book;}
  sheet_(name){
    if(!["PESERTA_IMPORT","CHECKINS","SCORES","SETTINGS","AUDIT","TIE_RESOLUTIONS"].includes(name))throw Error("BAD_TAB");
    const sh=this.book_.getSheetByName(name);
    if(!sh)throw Error("DATABASE_NOT_INITIALIZED");
    return sh;
  }
  data_(name){
    const sh=this.sheet_(name);const data=sh.getDataRange().getValues();
    return data.slice(1).map((row,i)=>({row,rowNumber:i+2})).filter(x=>x.row.some(y=>String(y).trim()!==""));
  }
  participants(){
    return this.data_("PESERTA_IMPORT").map(({row})=>({
      id:String(row[0]).trim(),fullName:String(row[1]).trim(),
      school:String(row[2]).trim(),competition:TF26Domain.code(row[3]),
      verified:String(row[4]).trim().toUpperCase()==="TERVERIFIKASI"
    }));
  }
  checkins(){
    return this.data_("CHECKINS").map(({row})=>({
      participantId:String(row[0]),competition:String(row[1]),
      startNo:Number(row[2]),at:String(row[3]),actorUid:String(row[4])
    }));
  }
  scores(){
    return this.data_("SCORES").map(({row,rowNumber})=>{
      let points;try{points=JSON.parse(String(row[5]||"[]"))}catch(_){points=[]}
      return {key:String(row[0]),competition:String(row[1]),startNo:Number(row[2]),
        judgeUid:String(row[3]),version:Number(row[4]),points,total:Number(row[6]),
        status:String(row[7]),at:String(row[8]),rowNumber};
    });
  }
  settings(){
    return this.data_("SETTINGS").map(({row,rowNumber})=>{
      let criteria;try{criteria=JSON.parse(String(row[5]||"[]"))}catch(_){criteria=[]}
      return {competition:String(row[0]),label:String(row[1]),requiredJudges:Number(row[2]),
        state:String(row[3]),version:Number(row[4]),criteria,publication:String(row[6]),
        privacyApproved:String(row[7]).toUpperCase()==="TRUE",
        approvedBy:String(row[8]),approvedAt:String(row[9]),rowNumber};
    });
  }
  appendCheckin(value){
    this.sheet_("CHECKINS").appendRow([value.participantId,value.competition,
      value.startNo,value.at,value.actorUid]);
  }
  saveScore(value,existing){
    const cells=[value.key,value.competition,value.startNo,value.judgeUid,value.version,
      JSON.stringify(value.points),value.total===null?"":value.total,value.status,value.at];
    const sh=this.sheet_("SCORES");
    if(existing&&existing.rowNumber)sh.getRange(existing.rowNumber,1,1,cells.length).setValues([cells]);
    else sh.appendRow(cells);
  }
  setPhase(setting,state){
    this.sheet_("SETTINGS").getRange(setting.rowNumber,4).setValue(state);
  }
  appendAudit(actorUid,action,entity,detail,now){
    // Do not record bearer tokens, full participant names, school or raw score payload.
    this.sheet_("AUDIT").appendRow([now,actorUid,action,entity,detail]);
  }
}
