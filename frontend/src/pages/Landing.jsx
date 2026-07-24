import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import { api } from "@/lib/api";
import coverImage from '../assets/coverImage.jpeg';
import {
  ArrowRight,
  ScanLine,
  Boxes,
  BarChart3,
  BadgeCheck,
  Building2,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: ScanLine,
    title: "Batch Risk Verification",
    body: "Every batch is matched against CDSCO NSQ, Recall and Spurious Drug advisories from official surveillance releases. Kyrenis returns a regulatory risk score — never an authenticity claim.",
  },
  {
    icon: Boxes,
    title: "Retail Operations",
    body: "Inventory, First-In-First-Out point-of-sale billing with GST breakdown, replenishment governance, expiry-aware dispensing and printable invoices for regulator audits.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    body: "Scan activity, risk-alert distribution, verification trends and recall intelligence — presented as internal analytics for your pharmacy, without inflated surveillance claims.",
  },
];

const numberFmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "—");

export default function Landing() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api
      .get("/public/metrics")
      .then((r) => setMetrics(r.data))
      .catch(() => setMetrics(null));
  }, []);

  const stats = [
    {
      key: "categories",
      label: "Alert Categories Monitored",
      value:"3",
      suffix: "NSQ · Recall · Spurious",
    },
    {
      key: "flagged",
      label: "Flagged Batches Indexed",
      value: metrics ? numberFmt(metrics.flagged_batches_indexed) : "—",
      suffix: "Unique batches from integrated CDSCO datasets",
    },
    {
      key: "records",
      label: "CDSCO Records Indexed",
      value: metrics ? numberFmt(metrics.cdsco_records_indexed) : "—",
      suffix: "Total advisories across integrated releases",
    },
    {
      key: "cycle",
      label: "Advisory Refresh Cycle",
      value: "Monthly",
      suffix: "Updated from CDSCO surveillance releases",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-600" data-testid="landing-page">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link to="/" className="flex items-center gap-4 text-slate-900" data-testid="landing-home-link">
            <KyrenisLogo size={40} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[20px] leading-none"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-slate-600 mt-1 tracking-[0.14em]">
                Regulatory Intelligence Platform
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-sm text-slate-600">
            <Link
              to="/about"
              className="hover:text-slate-900 transition-colors"
              data-testid="landing-nav-about"
            >
              About our Mission
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-10">
        <div className="flex flew-row gap-5">
          <section className="pt-20 pb-16">
            <p
              className="text-[11px] tracking-[0.28em] uppercase text-emerald-700 mb-5"
              data-testid="landing-eyebrow"
            >
              CDSCO-Powered Regulatory Intelligence
            </p>
            <h1
              className="font-display font-bold text-slate-900 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-5xl"
              data-testid="landing-headline"
            >
              India's Regulatory Intelligence Platform for{" "}
              <span className="text-emerald-700/70">medicine batch verification.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-slate-600 text-base md:text-lg leading-relaxed">
              Kyrenis aggregates the Central Drugs Standard Control Organisation's NSQ, Recall and
              Spurious Drug advisories into a single searchable repository, producing a transparent
              risk assessment for every medicine batch — for pharmacies, distributors and consumers.
            </p>
          </section>
          <img src={coverImage} className="hidden md:block w-1/2 h-1/2 mt-10 position-absolute object-contain"/>
        </div>

        {/* Two-card gateway — primary entry points */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20"
          data-testid="landing-gateway-grid"
        >
          <GatewayCard
            href="/pharmacy/auth"
            testid="gateway-pharmacy"
            eyebrow="For Pharmacies"
            title="Pharmacy Console"
            body="Sign in to manage inventory, intake, POS billing with GST, replenishment governance, sales history and regulatory alerts."
            icon={<Building2 size={22} />}
            action="Sign in"
          />
          <GatewayCard
            href="/patient"
            testid="gateway-patient"
            eyebrow="For Consumers"
            title="Batch Verification Portal"
            body="No account required. Enter a batch number or scan your medicine strip to check whether the batch appears in CDSCO's regulatory record."
            icon={<BadgeCheck size={22} />}
            action="Verify a batch"
            variant="light"
          />
        </section>

        {/* Real dataset-driven metrics */}
        <section
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-16"
          data-testid="landing-stats"
        >
          {stats.map((s) => (
            <div key={s.key} className="k-panel p-6" data-testid={`landing-stat-${s.key}`}>
            <p className="text-[11px] text-slate-500 tracking-[0.14em]">{s.label}</p>
            <p
              className="font-display text-[32px] md:text-[36px] text-slate-900 leading-none mt-4"
                data-testid={`landing-stat-${s.key}-value`}
              >
                {s.value}
              </p>
              <p className="text-slate-400 text-xs mt-3 leading-snug">{s.suffix}</p>
            </div>
          ))}
        </section>

        {/* Capability strip */}
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-24"
          data-testid="landing-capabilities"
        >
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="k-panel p-6 flex flex-col gap-4">
              <span className="inline-flex items-center justify-center w-11 h-11 border border-slate-200 text-slate-600">
                <c.icon size={20} />
              </span>
              <h3 className="font-display text-slate-900 text-xl">{c.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-400 text-xs">
          <div className="flex flex-col gap-3">
            <div className="flex flew-row gap-3 items-center">
              <KyrenisLogo size='40'/>
              <div className="text-3xl">Kyrenis</div>
            </div>
            <div>
              © {new Date().getFullYear()} Cypher
            </div>
            <div>
              CDSCO-Powered Regulatory Intelligence for Medicine Batch Verification
            </div>
          </div>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-slate-900 transition-colors">
              About
            </Link>
            <Link to="/patient" className="hover:text-slate-900 transition-colors">
              Verify a Batch
            </Link>
            <a href="https://www.instagram.com/kyrenis.health/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GatewayCard({ href, testid, eyebrow, title, body, icon, action, variant }) {
  const isLight = variant === "light";
  return (
    <Link
      to={href}
      data-testid={testid}
      className={`group relative overflow-hidden border transition-transform hover:-translate-y-1 ${
        isLight ? "bg-white text-slate-900" : "bg-slate-50 text-slate-900"
      }`}
      style={{
        background: isLight ? "#FFFFFF" : "#F8FAFC",
        borderColor: isLight ? "transparent" : "#E2E8F0",
      }}
    >
      <div className="p-8 md:p-10 min-h-[320px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
              <span
                className={`text-[11px] tracking-[0.14em] ${
                  isLight ? "text-slate-900/70" : "text-slate-500"
                }`}
            >
              {eyebrow}
            </span>
              <span
                className={`inline-flex items-center justify-center w-11 h-11 border ${
                  isLight ? "border-slate-300 text-slate-900" : "border-slate-200 text-slate-600"
                }`}
            >
              {icon}
            </span>
          </div>
          <h2
            className={`font-display font-bold text-3xl md:text-4xl tracking-tight ${
              isLight ? "text-slate-900" : "text-slate-900"
            }`}
          >
            {title}
          </h2>
          <p
            className={`mt-6 leading-relaxed max-w-md text-[15px] ${
              isLight ? "text-slate-900/80" : "text-slate-600"
            }`}
          >
            {body}
          </p>
        </div>
        <div
          className={`mt-8 inline-flex items-center justify-between gap-3 border-t pt-5 ${
            isLight ? "border-slate-200" : "border-slate-200"
          }`}
        >
          <span className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-slate-900"}`}>
            {action}
          </span>
          <span
            className={`inline-flex items-center justify-center w-9 h-9 border ${
              isLight
                ? "border-slate-300 text-slate-900 group-hover:bg-slate-100 group-hover:text-slate-900"
                : "border-slate-200 text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-900"
            } transition-colors`}
          >
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}
