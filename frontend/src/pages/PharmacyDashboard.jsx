import React, { useState } from "react";
import KyrenisHeader from "@/components/KyrenisHeader";
import StockIntake from "@/components/pharmacy/StockIntake";
import POSBilling from "@/components/pharmacy/POSBilling";
import Replenishment from "@/components/pharmacy/Replenishment";
import Telemetry from "@/components/pharmacy/Telemetry";
import { ScanLine, ShoppingCart, PackageSearch, Radar } from "lucide-react";

const TABS = [
  { key: "intake", label: "Stock Intake", icon: ScanLine, testid: "tab-intake" },
  { key: "pos", label: "POS Billing", icon: ShoppingCart, testid: "tab-pos" },
  { key: "replenishment", label: "Replenishment", icon: PackageSearch, testid: "tab-replenishment" },
  { key: "telemetry", label: "Telemetry", icon: Radar, testid: "tab-telemetry" },
];

export default function PharmacyDashboard() {
  const [active, setActive] = useState("intake");
  return (
    <div className="min-h-screen bg-black text-[#E2E8F0]" data-testid="pharmacy-dashboard">
      <KyrenisHeader variant="Pharmacy Operations Hub" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="k-label">// Layer 01 · Enterprise Operations</p>
            <h1 className="font-display font-bold text-white text-3xl md:text-4xl tracking-tighter mt-3">
              Retail Operations Hub
            </h1>
            <p className="text-[#E2E8F0]/60 mt-2 max-w-2xl">
              Every intake ships through the 4-step verification pipeline. Every POS
              transaction respects First-In-First-Out expiry. Every anomaly is escalated.
            </p>
          </div>
          <div className="flex items-center gap-2 border border-[#E2E8F0]/15 px-4 py-2">
            <span className="w-1.5 h-1.5 bg-[#10B981]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#E2E8F0]/70">
              Network Live · Ingest OK
            </span>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-1 border border-[#E2E8F0]/12 p-1 mb-8"
          role="tablist"
          data-testid="pharmacy-tabs"
        >
          {TABS.map(({ key, label, icon: Icon, testid }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              role="tab"
              aria-selected={active === key}
              data-testid={testid}
              className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-[0.25em] transition-colors ${
                active === key
                  ? "bg-[#1E2B4E] text-white"
                  : "text-[#E2E8F0]/70 hover:text-white"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="pb-24">
          {active === "intake" && <StockIntake />}
          {active === "pos" && <POSBilling />}
          {active === "replenishment" && <Replenishment />}
          {active === "telemetry" && <Telemetry />}
        </div>
      </div>
    </div>
  );
}
