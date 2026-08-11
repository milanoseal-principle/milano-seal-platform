import { COMPLIMENTARY_REASON_LABELS, type ComplimentaryReasonCode } from "@/lib/payments/complimentary-policy";

export function ComplimentaryReasonSelect({ value, onChange }: { value: ComplimentaryReasonCode; onChange: (value: ComplimentaryReasonCode) => void }) {
  return (
    <label className="grid gap-2 text-sm text-neutral-300">
      Reason
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ComplimentaryReasonCode)}
        className="min-h-11 rounded-xl border border-[#8d6a22]/40 bg-black/40 px-3 text-sm text-[#f4e5b8] outline-none"
      >
        {Object.entries(COMPLIMENTARY_REASON_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </label>
  );
}
