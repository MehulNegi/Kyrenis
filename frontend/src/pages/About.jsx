import React from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import { ArrowLeft, ShieldCheck, FileSearch, Building2, Users } from "lucide-react";

const PILLARS = [
  {
    icon: FileSearch,
    title: "CDSCO Regulatory Intelligence",
    body: "Kyrenis consolidates monthly advisories published by the Central Drugs Standard Control Organisation — NSQ, Spurious, Recall and Theft/Diversion — into a single searchable repository accessible to pharmacies and the public.",
  },
  {
    icon: ShieldCheck,
    title: "NSQ Monitoring",
    body: "Every reported Not-of-Standard-Quality batch is indexed by product, manufacturer and reporting laboratory. The platform surfaces the failure reason so pharmacies can quarantine affected stock before it is dispensed.",
  },
  {
    icon: Building2,
    title: "Pharmacy Safety Operations",
    body: "Beyond regulatory lookup, Kyrenis provides expiry-aware POS billing, GST-compliant invoicing, replenishment governance and a printable audit trail — helping small pharmacies operate safely without heavy IT.",
  },
  {
    icon: Users,
    title: "Consumer Awareness",
    body: "The public verification portal lets any patient check the regulatory status of a medicine batch anonymously. Kyrenis never claims a medicine is authentic — it reports what the regulator has recorded.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-black text-[#E2E8F0]" data-testid="about-page">
      <header className="border-b border-[#E2E8F0]/10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link to="/" className="flex items-center gap-3 text-white" data-testid="about-home-link">
            <KyrenisLogo size={36} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[18px]"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-[#E2E8F0]/70">Regulatory Intelligence Platform</span>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#E2E8F0]/80">
            <Link to="/" className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <ArrowLeft size={14} />
              Home
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 md:px-10 py-20">
        <p className="text-[11px] tracking-[0.28em] uppercase text-[#10B981] mb-4">Our Mission</p>
        <h1 className="font-display font-bold text-white text-4xl md:text-5xl tracking-tight leading-[1.08]">
          A transparent regulatory intelligence layer for India's medicine supply chain.
        </h1>
        <p className="mt-8 text-[#E2E8F0]/80 text-lg leading-relaxed max-w-3xl">
          Kyrenis exists to make CDSCO's monthly regulatory advisories usable at the counter — where
          it matters most. Pharmacists shouldn't need to hunt through PDF bulletins to know if a
          batch on their shelves is under recall. Patients shouldn't take a strip on trust when a
          public dataset already flags the concern. Kyrenis closes that gap with a fast,
          transparent lookup and a set of workflow tools that keep everyday pharmacy operations honest.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-14">
          {PILLARS.map((p) => (
            <div key={p.title} className="k-panel p-6 md:p-8">
              <span className="inline-flex items-center justify-center w-11 h-11 border border-[#E2E8F0]/25 text-[#E2E8F0] mb-5">
                <p.icon size={20} />
              </span>
              <h2 className="font-display text-white text-2xl">{p.title}</h2>
              <p className="text-[#E2E8F0]/75 mt-3 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="k-panel-navy p-8 md:p-10 mt-10">
          <h3 className="font-display text-white text-2xl">What Kyrenis is not.</h3>
          <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[#E2E8F0]/80 text-sm">
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not a counterfeit-detection guarantee. We report regulatory findings, not chemical composition.
            </li>
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not a manufacturer API. We do not pull data from private serialisation systems.
            </li>
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not a blockchain track-and-trace network. Our source of truth is the public CDSCO record.
            </li>
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not an AI-driven medical opinion. Alerts are surfaced verbatim from the regulator.
            </li>
          </ul>
        </div>

        <div className="mt-14">
          <Link
            to="/patient"
            className="inline-flex items-center gap-3 bg-white text-[#1E2B4E] px-6 py-4 text-sm font-medium hover:bg-[#E2E8F0] transition-colors"
            data-testid="about-cta-verify"
          >
            Verify a batch now
          </Link>
        </div>
      </main>
    </div>
  );
}
