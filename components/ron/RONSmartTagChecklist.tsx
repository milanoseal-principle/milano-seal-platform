'use client';

import { useState } from 'react';
import { TAG_PRESETS, type SmartTagPreset } from '@/lib/bluenotary/tags';

interface DocumentTagItem {
  documentId: string;
  documentName: string;
  documentType: string | null;
  suggestedPreset: SmartTagPreset | null;
  operatorApproved: boolean;
}

interface Props {
  documents: DocumentTagItem[];
  onApprove?: (documentId: string, preset: SmartTagPreset | null) => void;
  className?: string;
}

export function RONSmartTagChecklist({ documents, onApprove, className = '' }: Props) {
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});

  function handleApprove(docId: string, preset: SmartTagPreset | null) {
    setApprovals((prev) => ({ ...prev, [docId]: true }));
    onApprove?.(docId, preset);
  }

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">Smart Tag Review</h3>
      <p className="text-xs text-zinc-500 mb-4">
        Review and approve smart-tag presets before document upload. Operator approval required.
      </p>

      {documents.length === 0 ? (
        <p className="text-xs text-zinc-500">No documents to tag</p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const preset = doc.suggestedPreset ? TAG_PRESETS[doc.suggestedPreset] : null;
            const isApproved = approvals[doc.documentId] || doc.operatorApproved;

            return (
              <div
                key={doc.documentId}
                className={`border rounded p-3 text-xs ${
                  isApproved
                    ? 'border-amber-600/40 bg-amber-950/10'
                    : preset?.requiresOperatorReview
                    ? 'border-red-700/40 bg-red-950/10'
                    : 'border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-white font-medium">{doc.documentName}</p>
                    <p className="text-zinc-500">{doc.documentType ?? 'Unknown type'}</p>
                  </div>
                  {isApproved && (
                    <span className="text-amber-400 text-[10px] font-semibold">Approved</span>
                  )}
                </div>

                {preset ? (
                  <div>
                    <p className="text-zinc-400 mb-1">
                      Preset:{' '}
                      <span className="text-amber-400 font-mono">{preset.preset}</span>
                    </p>
                    <p className="text-zinc-500 mb-2">{preset.description}</p>

                    {preset.requiresOperatorReview && (
                      <p className="text-red-400 mb-2">Operator review required — do not auto-tag</p>
                    )}

                    {preset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {preset.tags.map((tag) => (
                          <code
                            key={tag}
                            className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[10px]"
                          >
                            {tag}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-500 mb-2">No preset available — manual tag placement required</p>
                )}

                {!isApproved && (
                  <button
                    onClick={() => handleApprove(doc.documentId, doc.suggestedPreset)}
                    className="text-[10px] px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-900/60 text-amber-400 border border-amber-600/40 transition-colors"
                  >
                    Approve &amp; Proceed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
