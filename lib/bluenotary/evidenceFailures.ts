const actions:Record<string,{next_action:string;action_href:string}>= {
  GOVERNED_RON_QC_REQUIRED:{next_action:'Pass the canonical RON QA review and resolve its missing or blocking checklist items.',action_href:'/dashboard/execution-qa'},
  BLOCKING_EXECUTION_EXCEPTION:{next_action:'Resolve the blocking compliance incident before verifying execution.',action_href:'/dashboard/incidents'},
  WITNESS_APPLICABILITY_REVIEW_REQUIRED:{next_action:'Complete governed witness applicability review before verification.',action_href:'/dashboard/execution-qa'},
  WITNESS_EVIDENCE_REQUIRED:{next_action:'Confirm required witnesses and record their identity and execution evidence.',action_href:'/dashboard/execution-qa'},
  VERIFIED_EVIDENCE_LOCKED_REOPEN_REQUIRED:{next_action:'Refresh the session, then use the authorized reopen action with a correction reason.',action_href:'/dashboard/ron'},
  STALE_EVIDENCE:{next_action:'Refresh the session and review the latest evidence revision before retrying.',action_href:'/dashboard/ron'},
  PROVIDER_COMPLETION_REQUIRED:{next_action:'Obtain actual provider completion evidence before verifying execution.',action_href:'/dashboard/ron'},
  COMMISSION_EXPIRED_OR_UNKNOWN:{next_action:'Review commission validity at the actual execution time; resolve the exception before verification.',action_href:'/dashboard/incidents'},
  FLORIDA_RON_RETENTION_REQUIRED:{next_action:'Confirm recording retention evidence covering the established Florida ten-year period.',action_href:'/dashboard/ron'},
};
export function ronEvidenceFailure(error:{code?:string;message?:string}|null) {
  const code=error?.code==='42501'?'FORBIDDEN':error?.code==='40001'?'STALE_EVIDENCE':Object.keys(actions).find(key=>error?.message?.split(':')[0]===key) ?? 'EVIDENCE_NOT_VERIFIED';
  return {error:code,...(actions[code]??{next_action:'Review provider evidence, exact document versions and the current session; refresh before retrying.',action_href:'/dashboard/ron'})};
}
