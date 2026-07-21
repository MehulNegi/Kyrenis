import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import { api } from "@/lib/api";
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
    <div className="min-h-screen bg-black text-[#E2E8F0]" data-testid="landing-page">
      {/* Header */}
      <header className="border-b border-[#E2E8F0]/10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link to="/" className="flex items-center gap-4 text-white" data-testid="landing-home-link">
            <KyrenisLogo size={40} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[20px] leading-none"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-[#E2E8F0]/70 mt-1 tracking-[0.14em]">
                Regulatory Intelligence Platform
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-sm text-[#E2E8F0]/80">
            <Link
              to="/about"
              className="hover:text-white transition-colors"
              data-testid="landing-nav-about"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="hover:text-white transition-colors"
              data-testid="landing-nav-contact"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-10">
        <section className="pt-20 pb-16">
          <p
            className="text-[11px] tracking-[0.28em] uppercase text-[#10B981] mb-5"
            data-testid="landing-eyebrow"
          >
            CDSCO-Powered Regulatory Intelligence
          </p>
          <h1
            className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-5xl"
            data-testid="landing-headline"
          >
            India's Regulatory Intelligence Platform for{" "}
            <span className="text-[#E2E8F0]/70">medicine batch verification.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[#E2E8F0]/75 text-base md:text-lg leading-relaxed">
            Kyrenis aggregates the Central Drugs Standard Control Organisation's NSQ, Recall and
            Spurious Drug advisories into a single searchable repository, producing a transparent
            risk assessment for every medicine batch — for pharmacies, distributors and consumers.
          </p>
        </section>

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
              <p className="text-[11px] text-[#E2E8F0]/60 tracking-[0.14em]">{s.label}</p>
              <p
                className="font-display text-[32px] md:text-[36px] text-white leading-none mt-4"
                data-testid={`landing-stat-${s.key}-value`}
              >
                {s.value}
              </p>
              <p className="text-[#E2E8F0]/55 text-xs mt-3 leading-snug">{s.suffix}</p>
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
              <span className="inline-flex items-center justify-center w-11 h-11 border border-[#E2E8F0]/25 text-[#E2E8F0]">
                <c.icon size={20} />
              </span>
              <h3 className="font-display text-white text-xl">{c.title}</h3>
              <p className="text-[#E2E8F0]/70 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[#E2E8F0]/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[#E2E8F0]/55 text-xs">
          <div>
            © {new Date().getFullYear()} Kyrenis Systems · CDSCO-Powered Regulatory Intelligence
            for Medicine Batch Verification
          </div>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link to="/patient" className="hover:text-white transition-colors">
              Verify a Batch
            </Link>
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
        isLight ? "bg-white text-[#1E2B4E]" : ""
      }`}
      style={{
        background: isLight ? "#FFFFFF" : "#1F2326",
        borderColor: isLight ? "transparent" : "rgba(226, 232, 240, 0.15)",
      }}
    >
      <div className="p-8 md:p-10 min-h-[320px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <span
              className={`text-[11px] tracking-[0.14em] ${
                isLight ? "text-[#1E2B4E]/70" : "text-[#E2E8F0]/60"
              }`}
            >
              {eyebrow}
            </span>
            <span
              className={`inline-flex items-center justify-center w-11 h-11 border ${
                isLight ? "border-[#1E2B4E]/25 text-[#1E2B4E]" : "border-[#E2E8F0]/25 text-white"
              }`}
            >
              {icon}
            </span>
          </div>
          <h2
            className={`font-display font-bold text-3xl md:text-4xl tracking-tight ${
              isLight ? "text-[#1E2B4E]" : "text-white"
            }`}
          >
            {title}
          </h2>
          <p
            className={`mt-6 leading-relaxed max-w-md text-[15px] ${
              isLight ? "text-[#1E2B4E]/80" : "text-[#E2E8F0]/75"
            }`}
          >
            {body}
          </p>
        </div>
        <div
          className={`mt-8 inline-flex items-center justify-between gap-3 border-t pt-5 ${
            isLight ? "border-[#1E2B4E]/15" : "border-[#E2E8F0]/15"
          }`}
        >
          <span className={`text-sm font-medium ${isLight ? "text-[#1E2B4E]" : "text-white"}`}>
            {action}
          </span>
          <span
            className={`inline-flex items-center justify-center w-9 h-9 border ${
              isLight
                ? "border-[#1E2B4E]/30 text-[#1E2B4E] group-hover:bg-[#1E2B4E] group-hover:text-white"
                : "border-[#E2E8F0]/25 text-white group-hover:bg-white group-hover:text-[#1E2B4E]"
            } transition-colors`}
          >
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}
