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
    const {competition,criteria,requiredJudges,assignedJudgeUids,checkins,scores,phase,participants,privacyApproved,tieDecisions}=input||{};
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
    const official=phase==="OFFICIAL"&&privacyApproved===true;
    const groups=[];
    function key(item){return competition==="THF"?[item.sum,...item.criteriaSum].join(":"):String(item.sum);}
    for(const candidate of result){
      let group=groups[groups.length-1];
      if(!group||group.key!==key(candidate)){
        group={key:key(candidate),members:[]};groups.push(group);
      }
      group.members.push(candidate);
    }
    const ranked=[];let position=1;
    for(const group of groups){
      const members=group.members.slice();
      let ordered=false;
      // If a group crosses the top-six boundary, the panel only selects
      // enough ordered winners to fill the remaining top-six places.
      // All other tied entries share the first rank outside those places.
      const winningSlots=Math.min(members.length,Math.max(0,7-position));
      if(members.length>1&&winningSlots>0){
        const options=(tieDecisions||[]).filter(d=>d&&d.competition===competition&&d.scoreKey===group.key);
        const valid=options.find(d=>{
          const nums=d.orderedStartNumbers;
          return Array.isArray(nums)&&nums.length===winningSlots&&
            new Set(nums).size===winningSlots&&nums.every(n=>members.some(m=>m.startNo===n));
        });
        if(valid){
          const winnerOrder=valid.orderedStartNumbers;
          members.sort((a,b)=>{
            const ia=winnerOrder.indexOf(a.startNo),ib=winnerOrder.indexOf(b.startNo);
            if(ia>=0&&ib>=0)return ia-ib;
            if(ia>=0)return -1;
            if(ib>=0)return 1;
            return a.startNo-b.startNo;
          });
          ordered=true;
        }
      }
      for(let i=0;i<members.length;i++){
        const item=members[i];
        const isUnresolved=members.length>1&&!ordered;
        const requiresDeliberation=isUnresolved&&position<=6;
        const isBeyondWinnerSlots=ordered&&members.length>winningSlots&&i>=winningSlots;
        const isSharedRank=(isUnresolved&&!requiresDeliberation)||isBeyondWinnerSlots;
        const row={
          competition,startNo:item.startNo,meanScore:Number((item.sum/requiredJudges).toFixed(2)),
          rank:requiresDeliberation?null:isSharedRank?position+(ordered?winningSlots:0):position+i,
          pendingDeliberation:requiresDeliberation,sharedRank:isSharedRank,
          tieGroupPosition:members.length>1?position:null,
          phase:official?"OFFICIAL":"INTERIM"
        };
        if(official){
          const p=(participants||[]).find(x=>x.competition===competition&&x.startNo===item.startNo);
          if(p){row.fullName=p.fullName;row.school=p.school;}
        }
        ranked.push(row);
      }
      position+=members.length;
    }
    return ranked;
  }
}

if(typeof module!=="undefined"&&module.exports)module.exports={TF26Domain};
