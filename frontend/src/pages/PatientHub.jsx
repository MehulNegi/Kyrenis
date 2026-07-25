import React, { useState } from "react";
import KyrenisHeader from "@/components/KyrenisHeader";
import LandingBackground from "@/components/LandingBackground";
import BatchAuthenticator from "@/components/patient/BatchAuthenticator";
import OpenFDADirectory from "@/components/patient/OpenFDADirectory";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, BookOpen, UserCheck } from "lucide-react";

const TABS = [
  { key: "auth", label: "Batch Authenticator", icon: ShieldCheck, testid: "patient-tab-auth" },
  { key: "openfda", label: "Drug Safety Directory", icon: BookOpen, testid: "patient-tab-openfda" },
];

export default function PatientHub() {
  const [active, setActive] = useState("auth");
  const { user } = useAuth();
  const isIdentified = user && (user.designated_role === "CONSUMER_GUEST" || user.auth_provider === "google");
  return (
    <div className="relative min-h-screen bg-white text-slate-600" data-testid="patient-hub">
      <LandingBackground />
      <KyrenisHeader variant="Patient Trust Hub · Guest" />
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-emerald-700 ml-2">Consumer Verification</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight font-display text-slate-900 md:text-4xl">
               Check the <span className="text-emerald-500"> regulatory status </span> of a medicine batch.
             </h1>
             <p className="max-w-2xl mt-2 text-slate-600">
               Enter a batch number or scan the barcode on your strip — Kyrenis searches CDSCO advisories and reports what has been recorded.
             </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isIdentified ? (
              <div className="flex items-center gap-2 px-4 py-2 border border-emerald-200" data-testid="patient-identified-pill">
                <UserCheck size={14} className="text-emerald-700" />
                <span className="text-[11px] tracking-[0.14em] text-emerald-700">
                  Signed in as {user.name || user.email}
                </span>
              </div>
            ) : (
<div className="flex items-center gap-2 px-4 py-2 border border-slate-200">
                   <span className="w-1.5 h-1.5 bg-emerald-700" />
                 </div>
            )}
            {!isIdentified && (
              <div className="w-[240px]" data-testid="patient-google-signin-wrap">
                <GoogleSignInButton
                  flow="patient"
                  label="Sign in with Google · optional"
                  testid="patient-google-signin"
                  className="!py-2 !text-xs"
                />
              </div>
            )}
          </div>
        </div>

        <div
          className="relative z-10 flex flex-wrap gap-1 p-1 mb-8 bg-white border border-slate-200"
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
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                active === key
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:text-slate-900"
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
