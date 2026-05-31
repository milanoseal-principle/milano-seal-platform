import { Shield, Eye, Clock, AlertCircle } from "lucide-react";

// Secure Review Link — token-based, read-only, expiration-ready.
// Raw storage URLs, internal notes, margins, and payment data are never exposed.
// TODO: validate token against review_links table, check expiration, emit audit event.

interface ReviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function SecureReviewPage({ params }: ReviewPageProps) {
  const { token } = await params;

  // Stub: in production this resolves the token against DB and returns the linked record.
  // If token is invalid or expired → show expired state.
  // If token is valid → show read-only document preview (watermarked, no raw URL).
  const isStub = true;

  if (isStub) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Shield size={22} className="text-amber-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Secure Review Link
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Token-based secure review is active. Document rendering will be
            available once the review link infrastructure is fully wired.
          </p>
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 text-left space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <Eye size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>Read-only mode — no download, no copy</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>Link expires — single-use or time-limited</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <AlertCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>
                No internal notes, margins, or storage URLs are exposed
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-mono mt-5">
            Token: {token.slice(0, 12)}…
          </p>
        </div>
      </div>
    );
  }

  // Production: render watermarked read-only document preview here
  return null;
}
