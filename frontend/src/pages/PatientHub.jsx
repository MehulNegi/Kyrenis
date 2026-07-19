import React, { useState } from "react";
import KyrenisHeader from "@/components/KyrenisHeader";
import BatchAuthenticator from "@/components/patient/BatchAuthenticator";
import OpenFDADirectory from "@/components/patient/OpenFDADirectory";
import { ShieldCheck, BookOpen } from "lucide-react";

const TABS = [
  { key: "auth", label: "Batch Authenticator", icon: ShieldCheck, testid: "patient-tab-auth" },
  { key: "openfda", label: "Drug Safety Directory", icon: BookOpen, testid: "patient-tab-openfda" },
];

export default function PatientHub() {
  const [active, setActive] = useState("auth");
  return (
    <div className="min-h-screen bg-black text-[#E2E8F0]" data-testid="patient-hub">
      <KyrenisHeader variant="Patient Trust Hub · Guest" />
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 pt-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="k-label">// Layer 02 · Consumer Trust Channel</p>
            <h1 className="font-display font-bold text-white text-3xl md:text-4xl tracking-tighter mt-3">
              Verify the strip in your hand.
            </h1>
            <p className="text-[#E2E8F0]/60 mt-2 max-w-2xl">
              Kyrenis exposes the same forensic layer used by pharmacies — anonymously —
              so anyone can confirm authenticity and pull clinical safety data before taking a dose.
            </p>
          </div>
          <div className="flex items-center gap-2 border border-[#E2E8F0]/15 px-4 py-2">
            <span className="w-1.5 h-1.5 bg-[#10B981]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#E2E8F0]/70">
              Anonymous Guest Session
            </span>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-1 border border-[#E2E8F0]/12 p-1 mb-8"
          role="tablist"
          data-testid="patient-tabs"
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
          {active === "auth" && <BatchAuthenticator />}
          {active === "openfda" && <OpenFDADirectory />}
        </div>
      </div>
    </div>
  );
}
