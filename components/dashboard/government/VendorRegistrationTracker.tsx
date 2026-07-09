"use client";

import {
  VENDOR_REGISTRATION_STATUSES,
  summarizeVendorRegistrations,
  type VendorRegistration,
} from "@/lib/government/vendorRegistrationTracker";

export function VendorRegistrationTracker({
  registrations = [],
}: {
  registrations?: VendorRegistration[];
}) {
  const summary = summarizeVendorRegistrations(registrations);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Vendor Registration Tracker
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {VENDOR_REGISTRATION_STATUSES.map((s) => (
          <div key={s} className="rounded-xl border border-amber-300/10 bg-black/40 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/60">
              {s.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-100">
              {s === "active"
                ? summary.active
                : s === "in_progress"
                ? summary.inProgress
                : s === "submitted"
                ? summary.submitted
                : s === "expired"
                ? summary.expired
                : summary.notStarted}
            </p>
          </div>
        ))}
      </div>

      {registrations.length === 0 ? (
        <p className="text-xs text-stone-500">
          No registrations tracked yet. A registration is only marked active once
          a verified vendor ID is issued — never assumed.
        </p>
      ) : (
        <div className="space-y-2">
          {registrations.map((r) => (
            <div
              key={`${r.portal}-${r.agency}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs text-stone-300"
            >
              <span className="font-medium text-amber-100">{r.portal}</span>
              <span>{r.agency}</span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">
                {r.status.replace(/_/g, " ")}
              </span>
              <span className="text-stone-500">
                {r.vendorId ? `ID ${r.vendorId}` : "no verified ID"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
