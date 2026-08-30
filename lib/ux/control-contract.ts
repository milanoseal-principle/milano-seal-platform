export const CRITICAL_QA_ACTIONS = Object.freeze(["wise-check-settlement", "portal-upload-document", "ron-create-session", "ron-open-session", "apostille-open-matter", "courier-release", "tracking-open", "review-request-submit", "search-console-sync", "certification-evidence-record"]);
export type CriticalQaAction = typeof CRITICAL_QA_ACTIONS[number];
export function qaAction(action: CriticalQaAction) { return { "data-qa-action": action } as const; }
