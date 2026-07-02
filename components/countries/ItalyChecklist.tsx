"use client";

import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ChecklistItem {
  key: string;
  label: string;
  detail: string;
  required: boolean;
}

const ITALY_REQUIREMENTS: ChecklistItem[] = [
  {
    key: "apostille",
    label: "US Apostille",
    detail:
      "Florida Secretary of State apostille required on US-origin documents. Italian authorities do not accept standard notarization alone.",
    required: true,
  },
  {
    key: "notarization",
    label: "Florida Notarization",
    detail:
      "Document must be notarized by a commissioned Florida Notary Public before apostille can be issued.",
    required: true,
  },
  {
    key: "translation",
    label: "Italian Translation",
    detail:
      "Most Italian receiving authorities require a sworn Italian translation. Translation requirements should be confirmed with the specific receiving authority before submission.",
    required: true,
  },
  {
    key: "certified_copy",
    label: "Certified Copy (if applicable)",
    detail:
      "For vital records (birth, marriage, death certificates), a certified copy from the issuing authority is required before notarization.",
    required: false,
  },
  {
    key: "courier",
    label: "International Courier",
    detail:
      "DHL Express or FedEx International Priority recommended for Italy. Standard postal service is not advised for apostilled documents.",
    required: false,
  },
];

const ITALY_AUTHORITY_NOTES = [
  "Italian consulates, municipalities (Comuni), and courts each have specific submission requirements.",
  "Requirements may differ between Italian regions and specific receiving offices.",
  "Acceptance by a receiving authority is subject to that authority's review. No guarantee of acceptance can be made.",
  "Processing timelines at Italian authorities are outside the control of the execution liaison.",
];

interface ItalyChecklistProps {
  compact?: boolean;
  showTitle?: boolean;
}

export function ItalyChecklist({
  compact = false,
  showTitle = true,
}: ItalyChecklistProps) {
  return (
    <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl overflow-hidden">
      {showTitle && (
        <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center gap-2">
          <span className="text-lg">🇮🇹</span>
          <div>
            <p className="text-[9px] font-mono tracking-[0.28em] uppercase text-[#6A5520]">
              Destination Requirements
            </p>
            <h3 className="text-sm font-medium text-white">
              Italy — Document Execution Checklist
            </h3>
          </div>
        </div>
      )}

      <div className={compact ? "p-4" : "p-5"}>
        <div className="space-y-3 mb-5">
          {ITALY_REQUIREMENTS.map((item) => (
            <div key={item.key} className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-0.5">
                {item.required ? (
                  <CheckCircle2 className="w-4 h-4 text-[#C6A55A]" />
                ) : (
                  <Info className="w-4 h-4 text-gray-500" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {item.label}
                  </span>
                  {item.required && (
                    <span className="text-[8px] font-mono tracking-widest uppercase text-[#C6A55A] bg-[#C6A55A]/10 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                {!compact && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-amber-500">
              Receiving Authority Notice
            </span>
          </div>
          <ul className="space-y-1.5">
            {ITALY_AUTHORITY_NOTES.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                <span className="flex-shrink-0 w-1 h-1 rounded-full bg-gray-600 mt-1.5" />
                {note}
              </li>
            ))}
          </ul>
        </div>

        {!compact && (
          <div className="mt-4">
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-gray-600">
              Standard Execution Path
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Notarization → Florida Secretary of State apostille → Italian
              translation → International courier dispatch
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
          <p className="text-[9px] text-gray-600 leading-relaxed">
            The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Document execution coordination only. The Milano Seal™ does not provide legal guidance. Legal questions should be handled by a licensed attorney.</p>
        </div>
      </div>
    </div>
  );
}
