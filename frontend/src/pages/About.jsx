import React from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import LandingBackground from "@/components/LandingBackground";
import { ArrowLeft, ShieldCheck, FileSearch, Building2, Users } from "lucide-react";

const PILLARS = [
  {
    icon: FileSearch,
    title: "CDSCO Regulatory Intelligence",
    body: "Aggregates monthly NSQ, Recall and Spurious Drug advisories into a single searchable repository.",
  },
  {
    icon: ShieldCheck,
    title: "Rapid Batch Risk Assessment",
    body: "Indexes every reported batch by product, manufacturer and lab — returns a regulatory risk assessment before dispensing.",
  },
  {
    icon: Building2,
    title: "Pharmacy Safety Operations",
    body: "Expiry-aware POS billing, GST-compliant invoicing, replenishment governance and a printable audit trail.",
  },
  {
    icon: Users,
    title: "Consumer Awareness",
    body: "Public verification portal lets any patient check batch regulatory status anonymously — reports only what the regulator recorded.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white text-slate-600 relative" data-testid="about-page">
      <LandingBackground />
      <header className="border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link to="/" className="flex items-center gap-3 text-slate-900" data-testid="about-home-link">
            <KyrenisLogo size={36} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[18px]"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-slate-500">
                Regulatory Intelligence Platform
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link to="/" className="inline-flex items-center gap-2 hover:text-slate-900 transition-colors">
              <ArrowLeft size={14} />
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 md:px-10 py-20">
          <p className="text-[11px] tracking-[0.28em] uppercase text-emerald-700 mb-4">Our Mission</p>
          <h1 className="font-display font-bold text-slate-900 text-4xl md:text-5xl tracking-tight leading-[1.08]">
          India's Regulatory Intelligence Platform for Medicine Batch Verification.
        </h1>
<p className="mt-8 text-slate-600 text-lg leading-relaxed max-w-3xl">
          Kyrenis aggregates CDSCO NSQ, Recall and Spurious Drug advisories to help pharmacies identify flagged stock before dispensing.
        </p>

        <div
          className="mt-10 p-6 md:p-8 border border-emerald-200 bg-emerald-50"
          data-testid="about-positioning-callout"
        >
          <p className="text-[11px] tracking-[0.14em] text-emerald-700">Product positioning</p>
          <p className="mt-3 text-slate-900 text-lg leading-relaxed">
            "Kyrenis performs regulatory intelligence checks using official surveillance and
            advisory datasets."
          </p>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-3xl">
            Kyrenis is a regulatory intelligence and risk assessment platform — not a definitive
            authenticity detector. Presence in a CDSCO advisory yields a "High Risk / Regulatory
            Alert" result; absence yields "Low Risk / No Regulatory Alert Found". No batch is
            invented, flagged, or scored outside the integrated datasets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-slate-50 p-6 md:p-8">
              <span className="inline-flex items-center justify-center w-11 h-11 border border-slate-200 text-slate-600 mb-5">
                <p.icon size={20} />
              </span>
              <h2 className="font-display text-slate-900 text-2xl">{p.title}</h2>
              <p className="text-slate-600 mt-3 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="p-8 md:p-10 mt-10 border border-emerald-200 bg-emerald-50">
          <h3 className="font-display text-slate-900 text-2xl">Meet our Team</h3>
          <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <li className="border-l-2 border-emerald-200 pl-4">
              <a href="https://www.linkedin.com/in/swasti-nayak-8093053b4/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                Swasti Soumyaa Nayak
              </a>
            </li>
            <li className="border-l-2 border-emerald-200 pl-4">
              <a href="https://www.linkedin.com/in/mehul-negi/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                Mehul Pundir Negi
              </a>
            </li>
            <li className="border-l-2 border-emerald-200 pl-4">
              <a href="https://www.linkedin.com/in/rishabhagrawal124/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                Rishabh Agrawal
              </a>
            </li>
            <li className="border-l-2 border-emerald-200 pl-4">
              <a href="https://x.com/BichaliVin47775" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                Vinay Shambuling Bichchali
              </a>
            </li>
            <li className="border-l-2 border-emerald-200 pl-4">
              <a href="https://www.linkedin.com/in/vaibhvi-kataria-b1259a423/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                Vaibhvi Kataria
              </a>
            </li>
            <li className="border-l-2 border-emerald-200 pl-4">
              <a href="https://www.linkedin.com/in/rudraksh-sitoke-186b003ba/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                Rudraksh Sitoke
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-14">
          <Link
            to="/patient"
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-4 text-sm font-medium hover:bg-slate-100 transition-colors"
            data-testid="about-cta-verify"
          >
            Verify a batch now
          </Link>
        </div>
      </main>
    </div>
  );
}
