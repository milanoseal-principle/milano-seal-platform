export const GOVERNANCE_VIEW_ROLES=new Set(['founder','founder_admin','admin_operator','ops_manager']);
export const GOVERNANCE_FOUNDER_ROLES=new Set(['founder','founder_admin']);
export function governanceAccess(role:string,founderOnly=false){return (founderOnly?GOVERNANCE_FOUNDER_ROLES:GOVERNANCE_VIEW_ROLES).has(role);}
