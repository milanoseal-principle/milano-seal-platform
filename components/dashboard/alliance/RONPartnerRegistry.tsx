import { assessRonPartner } from "@/lib/alliance/ron/ronPartnerVerification";
import type { RonPartnerRecord } from "@/lib/alliance/ron/types";

export function RONPartnerRegistry({ partners }: { partners: RonPartnerRecord[] }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#090909] p-5">
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/50">Partner Registry</p>
        <h2 className="mt-1 font-serif text-xl text-white/80">Credentialed execution network</h2>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">
            <tr className="border-b border-white/[0.06]">
              <th className="py-2 pr-3">Partner</th><th className="py-2 pr-3">State</th><th className="py-2 pr-3">Level</th><th className="py-2 pr-3">RON</th><th className="py-2 pr-3">Mobile</th><th className="py-2 pr-3">Languages</th><th className="py-2 pr-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => {
              const assessment = assessRonPartner(partner);
              return (
                <tr key={partner.id} className="border-b border-white/[0.04] text-white/45">
                  <td className="py-3 pr-3"><p className="text-white/70">{partner.fullName}</p><p className="mt-1 text-[10px] text-white/25">{partner.email}</p></td>
                  <td className="py-3 pr-3">{partner.stateCommissioned}</td>
                  <td className="py-3 pr-3"><span className="rounded border border-[#C6A55A]/15 bg-[#C6A55A]/[0.03] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#E4CA8C]/65">{assessment.level.replaceAll("_", " ")}</span></td>
                  <td className="py-3 pr-3">{partner.ronAuthorized ? "Verified input" : "Not verified"}</td>
                  <td className="py-3 pr-3">{partner.mobileAvailable ? "Yes" : "No"}</td>
                  <td className="py-3 pr-3">{partner.languages.length ? partner.languages.join(", ") : "—"}</td>
                  <td className="py-3 pr-3">{partner.updatedAt ? new Date(partner.updatedAt).toLocaleDateString("en-US") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
