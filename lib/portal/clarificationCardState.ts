// State transitions for the portal clarification card, kept pure so the
// Matter-switching behaviour can be tested without a DOM.
//
// Every async result carries the Matter it was issued for. A result for a Matter
// that is no longer the active one is ignored, and switching Matters resets all
// per-Matter state, including an in-flight submission.

export type ClarificationQuestion = {
  fact: string;
  prompt: string;
  help?: string;
  kind: "choice" | "text";
  options?: Array<{ value: string; label: string }>;
};

export type ClarificationView = {
  status: "closed" | "needs_client_input" | "awaiting_milano_review" | "review_confirmed";
  questions: ClarificationQuestion[];
  answered: string[];
};

export type ClarificationState = {
  matterId: string | null;
  view: ClarificationView | null;
  answers: Record<string, string>;
  busy: boolean;
  message: string | null;
};

export type ClarificationAction =
  | { type: "matter_changed"; matterId: string | null }
  | { type: "view_loaded"; matterId: string; view: ClarificationView }
  | { type: "answer_changed"; matterId: string; fact: string; value: string }
  | { type: "submit_started"; matterId: string }
  | { type: "submit_succeeded"; matterId: string; view: ClarificationView }
  | { type: "submit_failed"; matterId: string; message: string };

export const SUBMIT_SUCCESS_MESSAGE = "Thank you. Your answers were received and Milano is reviewing your Matter.";

export function initialClarificationState(matterId: string | null): ClarificationState {
  return { matterId, view: null, answers: {}, busy: false, message: null };
}

export function clarificationReducer(state: ClarificationState, action: ClarificationAction): ClarificationState {
  if (action.type === "matter_changed") {
    return action.matterId === state.matterId ? state : initialClarificationState(action.matterId);
  }
  // Results and edits for a Matter that is no longer active never touch the current Matter.
  if (action.matterId !== state.matterId) return state;
  switch (action.type) {
    case "view_loaded":
      return { ...state, view: action.view };
    case "answer_changed":
      return { ...state, answers: { ...state.answers, [action.fact]: action.value } };
    case "submit_started":
      return state.busy ? state : { ...state, busy: true, message: null };
    case "submit_succeeded":
      return { ...state, busy: false, answers: {}, view: action.view, message: SUBMIT_SUCCESS_MESSAGE };
    case "submit_failed":
      return { ...state, busy: false, message: action.message };
  }
}

export function clarificationComplete(state: ClarificationState): boolean {
  return Boolean(state.view?.questions.every((q) => (state.answers[q.fact] ?? "").trim().length >= (q.kind === "text" ? 2 : 1)));
}
