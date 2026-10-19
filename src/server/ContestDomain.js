"use strict";
/**
 * Tarmudi Fest 2026 — pure contest domain rules.
 * GAS V8 and Node-compatible; NO Google or browser APIs.
 * Scoring and ranking source of truth, PRD V1.5.
 */
class TF26Domain {
  static code(label) {
    const key=String(label||"").trim().toLowerCase();
    const codes={mendongeng:"MDG",tahfidz:"THF",mewarnai:"MWN"};
    if(!Object.prototype.hasOwnProperty.call(codes,key))throw Error("UNKNOWN_COMPETITION");
    return codes[key];
  }
  static checkScheme(criteria) {
    if(!Array.isArray(criteria)||criteria.length<2||criteria.length>12)throw Error("INVALID_SCHEME");
    let sum=0;
    const labels=new Set();
    criteria.forEach(item=>{
      if(!Array.isArray(item)||item.length!==2||typeof item[0]!=="string"||
        !item[0].trim()||!Number.isInteger(item[1])||item[1]<1||item[1]>100)throw Error("INVALID_SCHEME");
      const label=item[0].trim().toLowerCase();
      if(labels.has(label))throw Error("DUPLICATE_CRITERION");
      labels.add(label);sum+=item[1];
    });
    if(sum!==100)throw Error("SCHEME_NOT_100");
    return true;
  }
  static validatePoints(criteria,points) {
    TF26Domain.checkScheme(criteria);
    if(!Array.isArray(points)||points.length!==criteria.length)throw Error("INCOMPLETE_SCORES");
    let total=0;
    for(let i=0;i<criteria.length;i++){
      const v=points[i];
      if(typeof v!=="number"||!Number.isInteger(v)||v<0||v>criteria[i][1])throw Error("INVALID_POINTS");
      total+=v;
    }
    return total;
  }
  static rank(input) {
    const {competition,criteria,requiredJudges,assignedJudgeUids,checkins,scores,phase,participants,privacyApproved}=input||{};
    TF26Domain.checkScheme(criteria);
    if(!["MDG","THF","MWN"].includes(competition)||![2,3].includes(requiredJudges))throw Error("INVALID_CONFIGURATION");
    const judgeIds=Array.isArray(assignedJudgeUids)?assignedJudgeUids:[];
    if(judgeIds.length!==requiredJudges||new Set(judgeIds).size!==requiredJudges)return [];
    const attendance=(checkins||[]).filter(x=>x.competition===competition);
    const result=[];
    for(const row of attendance){
      if(!Number.isInteger(row.startNo)||row.startNo<1)continue;
      const own=(scores||[]).filter(x=>x.competition===competition&&x.startNo===row.startNo&&x.version===input.schemeVersion&&x.status==="FINAL"&&judgeIds.includes(x.judgeUid));
      if(own.length!==requiredJudges||new Set(own.map(x=>x.judgeUid)).size!==requiredJudges)continue;
      let sum=0; const sumCriteria=Array(criteria.length).fill(0);let valid=true;
      for(const score of own){
        try{sum+=TF26Domain.validatePoints(criteria,score.points)}
        catch(err){valid=false;break}
        score.points.forEach((value,i)=>{sumCriteria[i]+=value;});
      }
      if(!valid)continue;
      result.push({startNo:row.startNo,sum,criteriaSum:sumCriteria});
    }
    result.sort((a,b)=>{
      if(a.sum!==b.sum)return b.sum-a.sum;
      if(competition==="THF"){
        for(let i=0;i<criteria.length;i++)if(a.criteriaSum[i]!==b.criteriaSum[i])return b.criteriaSum[i]-a.criteriaSum[i];
      }
      return a.startNo-b.startNo; // display only, not a tie-resolution decision
    });
    let prior=null;let baseRank=0;
    const official=phase==="OFFICIAL"&&privacyApproved===true;
    return result.map((item,i)=>{
      const scoreKey=competition==="THF"?[item.sum,...item.criteriaSum].join(":"):String(item.sum);
      if(scoreKey!==prior){baseRank=i+1;prior=scoreKey;}
      const neighborSame=result.some(other=>other!==item&&
        (competition==="THF"?[other.sum,...other.criteriaSum].join(":"):String(other.sum))===scoreKey);
      const row={competition,startNo:item.startNo,meanScore:Number((item.sum/requiredJudges).toFixed(2)),rank:neighborSame?null:baseRank,pendingDeliberation:neighborSame,phase:official?"OFFICIAL":"INTERIM"};
      if(official){
        const p=(participants||[]).find(x=>x.competition===competition&&x.startNo===item.startNo);
        if(p){row.fullName=p.fullName;row.school=p.school;}
      }
      return row;
    });
  }
}

if(typeof module!=="undefined"&&module.exports)module.exports={TF26Domain};
