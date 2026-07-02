import type { OperatorVoiceNote } from "./types";

const RISK_PATTERNS = [/payment/i, /release/i, /custody/i, /legal advice/i, /guarantee/i, /passport|birth certificate|social security/i];
export function parseOperatorVoiceNote(note: string): OperatorVoiceNote { return { id: `voice-${Math.abs(hash(note))}`, rawNote: redactDocumentDetail(note), parsedAction: note.trim() ? "Draft internal task suggestion" : undefined, suggestedTask: buildTaskFromVoiceNote(note), riskFlags: getVoiceNoteRiskFlags(note), operatorReviewRequired: true }; }
export function buildTaskFromVoiceNote(note: string) { return note.trim() ? `Review voice note and create draft task: ${redactDocumentDetail(note).slice(0, 120)}` : "No voice note content provided."; }
export function getVoiceNoteRiskFlags(note: string) { return RISK_PATTERNS.filter((pattern) => pattern.test(note)).map((pattern) => pattern.source); }
export function requireVoiceNoteReview(result: OperatorVoiceNote) { return result.operatorReviewRequired || result.riskFlags.length > 0; }
function redactDocumentDetail(value: string) { return value.replace(/document contents?:.*$/i, "document detail redacted"); }
function hash(value: string) { return value.split("").reduce((total, char) => (total * 31 + char.charCodeAt(0)) | 0, 0); }
