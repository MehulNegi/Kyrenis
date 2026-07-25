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
    <div className="relative min-h-screen bg-white text-slate-600" data-testid="about-page">
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
            <Link to="/" className="inline-flex items-center gap-2 transition-colors hover:text-slate-900">
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
<p className="max-w-3xl mt-8 text-lg leading-relaxed text-slate-600">
          Kyrenis aggregates CDSCO NSQ, Recall and Spurious Drug advisories to help pharmacies identify flagged stock before dispensing.
        </p>

        <div
          className="p-6 mt-10 border md:p-8 border-emerald-200 bg-emerald-50"
          data-testid="about-positioning-callout"
        >
          <p className="text-[11px] tracking-[0.14em] text-emerald-700">Product positioning</p>
          <p className="mt-3 text-lg leading-relaxed text-slate-900">
            "Kyrenis performs regulatory intelligence checks using official surveillance and
            advisory datasets."
          </p>
          <p className="max-w-3xl mt-3 text-sm leading-relaxed text-slate-600">
            Kyrenis is a regulatory intelligence and risk assessment platform — not a definitive
            authenticity detector. Presence in a CDSCO advisory yields a "High Risk / Regulatory
            Alert" result; absence yields "Low Risk / No Regulatory Alert Found". No batch is
            invented, flagged, or scored outside the integrated datasets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="p-6 bg-slate-50 md:p-8">
              <span className="inline-flex items-center justify-center mb-5 border w-11 h-11 border-slate-200 text-slate-600">
                <p.icon size={20} />
              </span>
              <h2 className="text-2xl font-display text-slate-900">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="p-8 mt-10 border md:p-10 border-emerald-200 bg-emerald-50">
          <h3 className="text-2xl font-display text-slate-900">Meet our Team</h3>
          <ul className="grid grid-cols-1 gap-3 mt-5 md:grid-cols-2">
            <li className="pl-4 border-l-2 border-emerald-200">
              <a href="https://www.linkedin.com/in/swasti-nayak-8093053b4/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">
                Swasti Soumyaa Nayak - <span className="text-xs">Team Lead</span>
              </a>
            </li>
            <li className="pl-4 border-l-2 border-emerald-200">
              <a href="https://www.linkedin.com/in/mehul-negi/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">
                Mehul Pundir Negi - <span className="text-xs">Lead Developer</span>
              </a>
            </li>
            <li className="pl-4 border-l-2 border-emerald-200">
              <a href="https://www.linkedin.com/in/rishabhagrawal124/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">
                Rishabh Agrawal - <span className="text-xs">Frontend Developer</span>
              </a>
            </li>
            <li className="pl-4 border-l-2 border-emerald-200">
              <a href="https://x.com/BichaliVin47775" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">
                Vinay Shambuling Bichchali - <span className="text-xs">UI/UX Designer</span>
              </a>
            </li>
            <li className="pl-4 border-l-2 border-emerald-200">
              <a href="https://www.linkedin.com/in/vaibhvi-kataria-b1259a423/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">
                Vaibhvi Kataria - <span className="text-xs">Marketing Lead</span>
              </a>
            </li>
            <li className="pl-4 border-l-2 border-emerald-200">
              <a href="https://www.linkedin.com/in/rudraksh-sitoke-186b003ba/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">
                Rudraksh Sitoke - <span className="text-xs">Pitch Lead</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-14">
          <Link
            to="/patient"
            className="inline-flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors bg-white text-slate-900 hover:bg-slate-100"
            data-testid="about-cta-verify"
          >
            Verify a batch now
          </Link>
        </div>
      </main>
    </div>
  );
}
