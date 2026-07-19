import React from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import { ArrowUpRight, ShieldCheck, ScanLine, Boxes, Activity } from "lucide-react";

const HERO_STATS = [
  { label: "Medicines Tracked", value: "109", suffix: "SKUs" },
  { label: "Batch Scan Logs", value: "1,694", suffix: "records" },
  { label: "Active Anomalies", value: "15", suffix: "flagged" },
  { label: "Distribution Hubs", value: "5", suffix: "cities" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-[#E2E8F0]" data-testid="landing-page">
      {/* Top bar (no header component so landing feels like an OS bootscreen) */}
      <div className="border-b border-[#E2E8F0]/10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <div className="flex items-center gap-4 text-white">
            <KyrenisLogo size={44} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[22px] leading-none"
                style={{ letterSpacing: "0.35em" }}
              >
                KYRENIS
              </span>
              <span
                className="font-mono text-[#E2E8F0]/70 mt-1"
                style={{ fontSize: "9px", letterSpacing: "0.32em" }}
              >
                SCAN&nbsp;·&nbsp;VERIFY&nbsp;·&nbsp;TRUST
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 font-mono text-[10px] tracking-[0.3em] uppercase text-[#E2E8F0]/60">
            <span>Kyrenis OS · v1.0</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#10B981]" />
              Network Live
            </span>
          </div>
        </div>
      </div>

      {/* Hero split */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-10">
        <section className="pt-16 pb-10">
          <p className="k-label mb-6" data-testid="landing-boot-tag">
            // Boot Sequence · Select Access Layer
          </p>
          <h1
            className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tighter max-w-4xl"
            data-testid="landing-headline"
          >
            The pharmacy operating system engineered to
            <span className="text-[#10B981]"> scan</span>,
            <span className="text-white"> verify</span>, and
            <span className="text-[#E2E8F0]"> hold the supply chain accountable</span>
            <span className="k-caret text-[#10B981]">_</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[#E2E8F0]/70 text-base md:text-lg leading-relaxed">
            Kyrenis unifies retail inventory, POS billing, CDSCO recall intelligence and
            network-wide counterfeit telemetry into one auditable interface — with a public
            trust channel for patients to authenticate every foil, every strip, every batch.
          </p>
        </section>

        {/* Split gateway */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12" data-testid="landing-gateway-grid">
          <GatewayCard
            testid="gateway-pharmacy"
            href="/pharmacy/auth"
            eyebrow="Layer 01"
            title="Pharmacy Portal"
            subtitle="Enterprise Inventory System"
            body="Sign in with staff credentials to unlock intake, POS FIFO billing, replenishment governance and the anomaly telemetry grid."
            actionLabel="Open Pharmacy Portal"
            variant="navy"
            icon={<Boxes size={24} />}
          />
          <GatewayCard
            testid="gateway-patient"
            href="/patient"
            eyebrow="Layer 02"
            title="Patient Trust Hub"
            subtitle="Instant Drug Verification · Anonymous"
            body="No sign-up. Paste a batch code or scan the QR on your medicine strip to verify authenticity and pull real-time OpenFDA safety data."
            actionLabel="Enter Trust Hub"
            variant="green"
            icon={<ShieldCheck size={24} />}
          />
        </section>

        {/* Stats + capability strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-16" data-testid="landing-stats-grid">
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="k-panel p-5"
              data-testid={`landing-stat-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <p className="k-label">{s.label}</p>
              <p className="font-mono text-[28px] md:text-[32px] text-white leading-none mt-3">
                {s.value}
              </p>
              <p className="text-[#E2E8F0]/50 text-xs mt-2">{s.suffix}</p>
            </div>
          ))}
        </section>

        <section className="pb-24 grid grid-cols-1 md:grid-cols-3 gap-4">
          <CapabilityCell
            icon={<ScanLine size={20} />}
            title="4-Step Verification Pipeline"
            body="OCR ↔ GS1 DataMatrix cross-check, Mod-10 checksum, CDSCO recall query, MRP deviation flag — every intake, without exception."
          />
          <CapabilityCell
            icon={<Activity size={20} />}
            title="Anomaly Telemetry"
            body="Volumetric saturation + spatial teleportation engines fire alerts the moment counterfeit clone rings cross detection thresholds."
          />
          <CapabilityCell
            icon={<ShieldCheck size={20} />}
            title="Privacy Hashing"
            body="GTIN + Batch + Pharmacy ID are SHA-256 hashed at intake; cross-network correlation runs on hashes, never raw commercial data."
          />
        </section>
      </main>

      <footer className="border-t border-[#E2E8F0]/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between text-[#E2E8F0]/50 font-mono text-[10px] tracking-[0.3em] uppercase">
          <span>© Kyrenis Systems</span>
          <span data-testid="landing-footer-hash">SHA256 · 3a9f8c7b…</span>
        </div>
      </footer>
    </div>
  );
}

function GatewayCard({ eyebrow, title, subtitle, body, actionLabel, href, testid, variant, icon }) {
  const isNavy = variant === "navy";
  const accent = isNavy ? "#1E2B4E" : "#10B981";
  return (
    <Link
      to={href}
      data-testid={testid}
      className="group relative overflow-hidden border transition-transform hover:-translate-y-1"
      style={{
        background: isNavy ? "#1F2326" : "#1F2326",
        borderColor: "rgba(226, 232, 240, 0.15)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: isNavy
            ? "linear-gradient(135deg, rgba(30,43,78,0.55), transparent 55%)"
            : "linear-gradient(135deg, rgba(16,185,129,0.15), transparent 55%)",
        }}
      />
      <div className="relative p-8 md:p-10 min-h-[320px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="k-label">{eyebrow}</span>
            <span
              className="inline-flex items-center justify-center w-10 h-10 border"
              style={{
                borderColor: accent,
                color: accent,
              }}
            >
              {icon}
            </span>
          </div>
          <h2 className="font-display font-bold text-white text-3xl md:text-4xl tracking-tight">
            {title}
          </h2>
          <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#E2E8F0]/60 mt-2">
            {subtitle}
          </p>
          <p className="text-[#E2E8F0]/75 mt-6 leading-relaxed max-w-md">{body}</p>
        </div>
        <div
          className="mt-8 inline-flex items-center justify-between gap-3 border-t pt-5"
          style={{ borderColor: "rgba(226,232,240,0.15)" }}
        >
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-white">
            {actionLabel}
          </span>
          <span
            className="inline-flex items-center justify-center w-9 h-9 border transition-colors group-hover:bg-white group-hover:text-[#1E2B4E]"
            style={{ borderColor: accent, color: accent }}
          >
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CapabilityCell({ icon, title, body }) {
  return (
    <div className="k-panel p-6 flex flex-col gap-3" data-testid={`landing-capability-${title.split(" ")[0].toLowerCase()}`}>
      <span className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0]/25 text-[#E2E8F0]">
        {icon}
      </span>
      <h3 className="font-display font-medium text-white text-lg mt-1">{title}</h3>
      <p className="text-[#E2E8F0]/65 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
