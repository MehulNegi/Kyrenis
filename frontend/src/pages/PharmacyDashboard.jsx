import React, { useState } from "react";
import KyrenisHeader from "@/components/KyrenisHeader";
import LandingBackground from "@/components/LandingBackground";
import StockIntake from "@/components/pharmacy/StockIntake";
import POSBilling from "@/components/pharmacy/POSBilling";
import Replenishment from "@/components/pharmacy/Replenishment";
import Telemetry from "@/components/pharmacy/Telemetry";
import SalesHistory from "@/components/pharmacy/SalesHistory";
import SecurityRecalls from "@/components/pharmacy/SecurityRecalls";
import { ScanLine, ShoppingCart, PackageSearch, BarChart3, Receipt, ShieldAlert } from "lucide-react";

const TABS = [
  { key: "intake", label: "Stock Intake", icon: ScanLine, testid: "tab-intake" },
  { key: "pos", label: "POS Billing", icon: ShoppingCart, testid: "tab-pos" },
  { key: "sales", label: "Sales History", icon: Receipt, testid: "tab-sales" },
  { key: "telemetry", label: "Telemetry", icon: BarChart3, testid: "tab-telemetry" },
  { key: "security", label: "Security & Recalls", icon: ShieldAlert, testid: "tab-security" },
];

export default function PharmacyDashboard() {
  const [active, setActive] = useState("intake");
  return (
    <div className="relative min-h-screen bg-white text-slate-600" data-testid="pharmacy-dashboard">
      <LandingBackground />
      <KyrenisHeader variant="Pharmacy Operations Hub" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-emerald-700 ml-2">Pharmacy Console</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight font-display text-slate-900 md:text-4xl">
              Retail Operations Hub
            </h1>
            <p className="max-w-2xl mt-2 text-slate-600">
              Batch intake, First-In-First-Out point-of-sale billing, sales history and CDSCO regulatory analytics — all in one console.
            </p>
          </div>
        </div>

        <div
          className="relative flex flex-wrap gap-1 p-1 mb-8 bg-white border z-100 border-slate-200 "
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
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                active === key
                  ? "bg-emerald-50 text-emerald-500"
                  : "text-slate-600 hover:text-slate-900"
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
          {active === "sales" && <SalesHistory />}
          {active === "telemetry" && <Telemetry />}
          {active === "security" && <SecurityRecalls />}
        </div>
      </div>
    </div>
  );
}
