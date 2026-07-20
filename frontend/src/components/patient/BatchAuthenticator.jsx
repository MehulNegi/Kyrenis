import React, { useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ScanLine,
  Keyboard,
  QrCode,
} from "lucide-react";

const SAMPLES = [
  {
    label: "Try · Clean batch (XYZ99900)",
    tone: "safe",
    testid: "consumer-sample-clean",
    payload: { batch_number: "XYZ99900" },
  },
  {
    label: "Try · Spurious alert (05240226)",
    tone: "danger",
    testid: "consumer-sample-spurious",
    payload: { batch_number: "05240226" },
  },
  {
    label: "Try · NSQ alert (AZT24118)",
    tone: "warning",
    testid: "consumer-sample-nsq",
    payload: { batch_number: "AZT24118" },
  },
  {
    label: "Try · Recall (PCM240721)",
    tone: "danger",
    testid: "consumer-sample-recall",
    payload: { batch_number: "PCM240721" },
  },
];

export default function BatchAuthenticator() {
  const [mode, setMode] = useState("manual"); // manual | gs1
  const [manualBatch, setManualBatch] = useState("");
  const [qrString, setQrString] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);

  const runVerify = async (payload) => {
    setBusy(true);
    setVerdict(null);
    try {
      const { data } = await api.post("/consumer/verify-batch", payload);
      setVerdict(data);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    const payload =
      mode === "manual" ? { batch_number: manualBatch } : { qr_string: qrString };
    runVerify(payload);
  };

  const runSample = (s) => {
    setMode("manual");
    setManualBatch(s.payload.batch_number || "");
    setQrString("");
    runVerify(s.payload);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6" data-testid="batch-authenticator">
      <form onSubmit={onSubmit} className="k-panel p-6 md:p-8 flex flex-col gap-5" data-testid="consumer-verify-form">
        <div className="flex items-center gap-3">
          <ScanLine size={18} className="text-[#10B981]" />
          <h2 className="font-display text-white text-xl">Regulatory Batch Verification</h2>
        </div>
        <p className="text-[#E2E8F0]/65 text-sm -mt-2">
          Enter your medicine's batch number, or paste the GS1 DataMatrix payload from the strip.
          Kyrenis checks the CDSCO regulatory intelligence repository for any advisories.
        </p>

        <div className="flex gap-1 border border-[#E2E8F0]/15 p-1" role="tablist" data-testid="consumer-mode-tabs">
          <TabBtn active={mode === "manual"} onClick={() => setMode("manual")} icon={<Keyboard size={14} />} testid="consumer-mode-manual">
            Manual · Batch Number
          </TabBtn>
          <TabBtn active={mode === "gs1"} onClick={() => setMode("gs1")} icon={<QrCode size={14} />} testid="consumer-mode-gs1">
            GS1 DataMatrix
          </TabBtn>
        </div>

        {mode === "manual" ? (
          <label className="flex flex-col gap-2">
            <span className="text-[11px] text-[#E2E8F0]/60 tracking-[0.14em]">Batch Number</span>
            <input
              value={manualBatch}
              onChange={(e) => setManualBatch(e.target.value)}
              data-testid="consumer-batch-input"
              placeholder="e.g. 05240226"
              className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-2">
            <span className="text-[11px] text-[#E2E8F0]/60 tracking-[0.14em]">GS1 DataMatrix Payload</span>
            <textarea
              value={qrString}
              onChange={(e) => setQrString(e.target.value)}
              rows={4}
              data-testid="consumer-qr-input"
              placeholder="(01)08901234567892(10)05240226(17)261231(21)0000001"
              className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors font-mono"
            />
            <span className="text-[11px] text-[#E2E8F0]/50">
              Parses GTIN (01), Batch (10), Expiry (17) and Serial (21) if present.
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={busy}
          data-testid="consumer-verify-btn"
          className="mt-2 py-3 bg-white text-[#1E2B4E] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-50"
        >
          {busy ? "Checking CDSCO records…" : "Check Regulatory Status"}
        </button>

        <div className="border-t border-[#E2E8F0]/10 pt-5 flex flex-col gap-3">
          <p className="text-[11px] text-[#E2E8F0]/55 tracking-[0.14em]">Try one of these samples</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.testid}
                type="button"
                onClick={() => runSample(s)}
                data-testid={s.testid}
                className="border px-3 py-1.5 text-[11px] transition-colors"
                style={{
                  borderColor:
                    s.tone === "danger" ? "#EF444488" : s.tone === "warning" ? "#F59E0B88" : "#10B98188",
                  color: s.tone === "danger" ? "#EF4444" : s.tone === "warning" ? "#F59E0B" : "#10B981",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      <VerdictPanel verdict={verdict} busy={busy} />
    </div>
  );
}

function TabBtn({ active, onClick, icon, testid, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-testid={testid}
      className={`flex-1 inline-flex items-center justify-center gap-2 py-2 text-sm transition-colors ${
        active ? "bg-[#1E2B4E] text-white" : "text-[#E2E8F0]/70 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function VerdictPanel({ verdict, busy }) {
  if (!verdict && !busy) {
    return (
      <div className="k-panel p-8 flex flex-col items-center justify-center text-center min-h-[420px]" data-testid="consumer-verdict-empty">
        <div className="w-28 h-28 border-2 border-[#E2E8F0]/20 relative overflow-hidden">
          <div className="absolute inset-x-2 h-[2px] bg-[#10B981] k-scanline" />
        </div>
        <p className="mt-6 text-[11px] tracking-[0.14em] text-[#E2E8F0]/50 uppercase">Awaiting a batch</p>
        <p className="text-[#E2E8F0]/55 text-sm mt-2 max-w-xs">
          Enter a batch number or paste a GS1 payload — Kyrenis returns a regulatory risk score
          along with the CDSCO advisory (if any).
        </p>
      </div>
    );
  }
  if (busy) {
    return (
      <div className="k-panel p-8 min-h-[420px] flex flex-col items-center justify-center text-center" data-testid="consumer-verdict-loading">
        <div className="animate-pulse w-16 h-16 border-2 border-[#10B981]/60" />
        <p className="mt-6 text-sm text-[#E2E8F0]/70">Checking the CDSCO regulatory record…</p>
      </div>
    );
  }
  const sev = verdict.severity;
  const color = sev === "Critical" ? "#EF4444" : sev === "Quality Risk" ? "#F59E0B" : "#10B981";
  const Icon = sev === "Clear" ? ShieldCheck : sev === "Quality Risk" ? AlertTriangle : ShieldAlert;
  return (
    <div
      className="p-8 min-h-[420px] relative overflow-hidden"
      style={{ background: "#1F2326", border: `1px solid ${color}66` }}
      data-testid="consumer-verdict-card"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: `radial-gradient(circle at 20% 0%, ${color}22, transparent 55%)` }}
      />
      <div className="relative flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.14em]" style={{ color }} data-testid="consumer-verdict-severity">
              {verdict.alert_found ? sev.toUpperCase() : "REGULATORY STATUS"}
            </p>
            <h3
              className="font-display text-white text-2xl md:text-3xl mt-2 leading-tight"
              data-testid="consumer-verdict-headline"
            >
              {verdict.headline}
            </h3>
          </div>
          <div
            className="w-16 h-16 border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: color, color }}
            data-testid={`consumer-verdict-icon-${sev.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <Icon size={34} />
          </div>
        </div>

        {/* Risk gauge */}
        <div className="mt-6" data-testid="consumer-risk-gauge">
          <div className="flex items-center justify-between text-[11px] text-[#E2E8F0]/60 tracking-[0.14em]">
            <span>Risk Score</span>
            <span className="text-white text-sm" data-testid="consumer-risk-score">
              {verdict.risk_score}/100
            </span>
          </div>
          <div className="mt-2 h-2 bg-[#0d1013] border border-[#E2E8F0]/12 relative">
            <div
              className="absolute top-0 left-0 h-full transition-all"
              style={{
                width: `${Math.max(4, Math.min(verdict.risk_score, 100))}%`,
                background: color,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-[#E2E8F0]/45">
            <span>0 · Clear</span>
            <span>80 · Quality Risk</span>
            <span>95+ · Critical</span>
          </div>
        </div>

        {/* Alert card OR clean context */}
        {verdict.alert_found ? (
          <div
            className="mt-8 border p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
            style={{ borderColor: `${color}55`, background: `${color}0a` }}
            data-testid="consumer-alert-card"
          >
            <AlertRow label="Product" value={verdict.alert_card?.product_name} />
            <AlertRow label="Batch" value={verdict.alert_card?.batch_number} mono />
            <AlertRow label="Manufacturer" value={verdict.alert_card?.manufacturer} />
            <AlertRow label="Alert Category" value={`${verdict.alert_card?.alert_category} Drug Alert`} accent={color} />
            <AlertRow label="Failure Reason" value={verdict.alert_card?.failure_reason} full />
            <AlertRow
              label="Reporting Authority"
              value={
                verdict.alert_card?.reporting_lab
                  ? `${verdict.alert_card?.reporting_authority} · ${verdict.alert_card?.reporting_lab}`
                  : verdict.alert_card?.reporting_authority
              }
            />
            <AlertRow label="Reporting Date" value={verdict.alert_card?.reporting_date} mono />
            <AlertRow label="Source" value={verdict.alert_card?.source || "CDSCO"} accent="#E2E8F0" />
          </div>
        ) : (
          <div className="mt-8 border border-[#10B981]/40 p-5" data-testid="consumer-clean-card">
            <p className="text-white text-sm">{verdict.message}</p>
            {verdict.product_context && (
              <p className="text-[#E2E8F0]/70 text-xs mt-2">
                Product recognised from GS1: {verdict.product_context.brand_name} · {verdict.product_context.generic_composition}
              </p>
            )}
            <p className="text-[#E2E8F0]/55 text-[11px] mt-4">
              Kyrenis reports what has been recorded by the regulator. A "no alert" result is not a
              guarantee of authenticity — always buy from a licensed pharmacy.
            </p>
          </div>
        )}

        {/* Parsed payload */}
        {(verdict.parsed_payload?.batch_number || verdict.parsed_payload?.gtin) && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs" data-testid="consumer-parsed-payload">
            <ParsedCell label="GTIN" value={verdict.parsed_payload?.gtin} />
            <ParsedCell label="Batch" value={verdict.parsed_payload?.batch_number} />
            <ParsedCell label="Expiry" value={verdict.parsed_payload?.expiry} />
            <ParsedCell label="Serial" value={verdict.parsed_payload?.serial} />
          </div>
        )}
      </div>
    </div>
  );
}

function AlertRow({ label, value, mono, full, accent }) {
  if (!value) return null;
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-[10px] tracking-[0.14em] text-[#E2E8F0]/55">{label}</p>
      <p
        className={`text-white mt-1 text-sm ${mono ? "font-mono" : ""}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function ParsedCell({ label, value }) {
  return (
    <div className="border border-[#E2E8F0]/12 px-3 py-2">
      <p className="text-[10px] text-[#E2E8F0]/55">{label}</p>
      <p className="text-[#E2E8F0]/90 font-mono text-xs mt-1 truncate">{value || "—"}</p>
    </div>
  );
}
