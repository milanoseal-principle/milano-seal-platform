"use client";

import { Star } from "lucide-react";

export type ReviewProof = {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  executionLane?: string;
  destinationCountry?: string;
  documentType?: string;
  date?: string;
};

type ReviewProofCardsProps = {
  reviews: ReviewProof[];
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "fill-[#C6A55A] text-[#C6A55A]"
              : "text-[#2A2A2A]"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewProofCards({ reviews }: ReviewProofCardsProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 text-center">
        <p className="text-[#4A4A4A] text-sm italic">
          Verified client reviews will appear here after completed matters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 space-y-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-medium text-sm">
                {review.reviewerName}
              </p>
              {review.date && (
                <p className="text-[#4A4A4A] text-xs mt-0.5">{review.date}</p>
              )}
            </div>
            <StarDisplay rating={review.rating} />
          </div>

          <p className="text-[#B0B0B0] text-sm leading-relaxed">
            &ldquo;{review.text}&rdquo;
          </p>

          {(review.executionLane ||
            review.destinationCountry ||
            review.documentType) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {review.executionLane && (
                <span className="px-2 py-0.5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-full text-[#8A8A8A] text-[10px] uppercase tracking-[0.1em]">
                  {review.executionLane}
                </span>
              )}
              {review.destinationCountry && (
                <span className="px-2 py-0.5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-full text-[#8A8A8A] text-[10px] uppercase tracking-[0.1em]">
                  {review.destinationCountry}
                </span>
              )}
              {review.documentType && (
                <span className="px-2 py-0.5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-full text-[#8A8A8A] text-[10px] uppercase tracking-[0.1em]">
                  {review.documentType}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
