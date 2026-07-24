import React from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import { ArrowLeft, ShieldCheck, FileSearch, Building2, Users } from "lucide-react";

const PILLARS = [
  {
    icon: FileSearch,
    title: "CDSCO Regulatory Intelligence",
    body: "Kyrenis aggregates the monthly NSQ, Recall and Spurious Drug advisories published by the Central Drugs Standard Control Organisation into a single searchable repository accessible to pharmacies and consumers alike.",
  },
  {
    icon: ShieldCheck,
    title: "Rapid Batch Risk Assessment",
    body: "Every reported batch is indexed by product, manufacturer and reporting laboratory. Kyrenis returns a rapid regulatory risk assessment so pharmacies can identify potentially flagged stock before dispensing.",
  },
  {
    icon: Building2,
    title: "Pharmacy Safety Operations",
    body: "Beyond regulatory lookup, Kyrenis provides expiry-aware POS billing, GST-compliant invoicing, replenishment governance and a printable audit trail — helping small pharmacies operate safely without heavy IT.",
  },
  {
    icon: Users,
    title: "Consumer Awareness",
    body: "The public verification portal lets any patient check the regulatory status of a medicine batch anonymously. Kyrenis reports only what the regulator has recorded — it does not make authenticity claims.",
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
              <span className="text-[10px] text-[#E2E8F0]/70">
                Regulatory Intelligence Platform
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#E2E8F0]/80">
            <Link to="/" className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <ArrowLeft size={14} />
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 md:px-10 py-20">
        <p className="text-[11px] tracking-[0.28em] uppercase text-[#10B981] mb-4">Our Mission</p>
        <h1 className="font-display font-bold text-white text-4xl md:text-5xl tracking-tight leading-[1.08]">
          India's Regulatory Intelligence Platform for Medicine Batch Verification.
        </h1>
        <p className="mt-8 text-[#E2E8F0]/80 text-lg leading-relaxed max-w-3xl">
          Kyrenis helps pharmacies and consumers verify medicine batches against official CDSCO
          surveillance data. We aggregate the NSQ, Recall and Spurious Drug advisories published
          each month by the Central Drugs Standard Control Organisation, and provide rapid risk
          assessment for medicine batches — enabling pharmacies to identify potentially flagged
          stock before it is dispensed.
        </p>

        <div
          className="mt-10 p-6 md:p-8 border border-[#10B981]/30 bg-[#10B981]/5"
          data-testid="about-positioning-callout"
        >
          <p className="text-[11px] tracking-[0.14em] text-[#10B981]">Product positioning</p>
          <p className="mt-3 text-white text-lg leading-relaxed">
            "Kyrenis performs regulatory intelligence checks using official surveillance and
            advisory datasets."
          </p>
          <p className="mt-3 text-[#E2E8F0]/70 text-sm leading-relaxed max-w-3xl">
            Kyrenis is a regulatory intelligence and risk assessment platform — not a definitive
            authenticity detector. Presence in a CDSCO advisory yields a "High Risk / Regulatory
            Alert" result; absence yields "Low Risk / No Regulatory Alert Found". No batch is
            invented, flagged, or scored outside the integrated datasets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-[#1f2326]/50 p-6 md:p-8">
              <span className="inline-flex items-center justify-center w-11 h-11 border border-[#E2E8F0]/25 text-[#E2E8F0] mb-5">
                <p.icon size={20} />
              </span>
              <h2 className="font-display text-white text-2xl">{p.title}</h2>
              <p className="text-[#E2E8F0]/75 mt-3 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#1f2326]/50 p-8 md:p-10 mt-10">
          <h3 className="font-display text-white text-2xl">What Kyrenis is not</h3>
          <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[#E2E8F0]/80 text-sm">
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not a counterfeit-detection guarantee. We do not claim certainty about authenticity.
            </li>
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not a chemical analysis or laboratory verification service.
            </li>
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not a manufacturer API or private serialisation network.
            </li>
            <li className="border-l-2 border-[#EF4444]/70 pl-4">
              Not an AI-generated medical opinion — alerts are surfaced verbatim from the regulator.
            </li>
          </ul>
        </div>

        <div className="p-8 md:p-10 mt-10 border border-[#10B981]/30 bg-[#10B981]/5 shadow-md shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <h3 className="font-display text-white text-2xl">Meet our Team</h3>
          <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[#E2E8F0]/80 text-sm">
            <li className="border-l-2 border-[#10B981]/70 pl-4">
              <a href="https://www.linkedin.com/in/swasti-nayak-8093053b4/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Swasti Soumyaa Nayak - Team Lead
              </a>
            </li>
            <li className="border-l-2 border-[#10B981]/70 pl-4">
              <a href="https://www.linkedin.com/in/mehul-negi/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Mehul Pundir Negi - Lead Developer
              </a>
            </li>
            <li className="border-l-2 border-[#10B981]/70 pl-4">
              <a href="https://www.linkedin.com/in/rishabhagrawal124/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Rishabh Agrawal - Frontend Developer
              </a>
            </li>
            <li className="border-l-2 border-[#10B981]/70 pl-4">
              <a href="https://x.com/BichaliVin47775" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Vinay Shambuling Bichchali - UI/UX Designer
              </a>
            </li>
            <li className="border-l-2 border-[#10B981]/70 pl-4">
              <a href="https://www.linkedin.com/in/vaibhvi-kataria-b1259a423/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Vaibhvi Kataria - Marketing Lead
              </a>
            </li>
            <li className="border-l-2 border-[#10B981]/70 pl-4">
              <a href="https://www.linkedin.com/in/rudraksh-sitoke-186b003ba/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Rudraksh Sitoke - Pitch Lead
              </a>
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
