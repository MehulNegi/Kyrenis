import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import CameraScanner from "@/components/CameraScanner";
import { ShieldCheck, ShieldAlert, Camera, X, History } from "lucide-react";

const RECENT_KEY = "kyrenis_recent_batches";
const MAX_RECENT = 5;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* localStorage may be blocked */
  }
}

// Extract a plausible batch identifier out of a scanned code.
// Handles GS1 DataMatrix payloads that carry AI (10) BatchNumber, and falls
// back to using the raw scan string if the payload is a plain barcode.
function parseScanForBatch(text) {
  if (!text) return "";
  const gs1 = /\(10\)([A-Za-z0-9\-\/]+)/.exec(text);
  if (gs1 && gs1[1]) return gs1[1].trim();
  // If the payload starts with 10 after a GTIN, try FNC1-less form: 01<gtin14>10<batch>...
  const m = /10([A-Za-z0-9\-\/]{2,20})(?:17|21|11|$)/.exec(text.replace(/[\s()]/g, ""));
  if (m && m[1]) return m[1].trim();
  return text.trim();
}

export default function BatchAuthenticator() {
  const [batch, setBatch] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [recent, setRecent] = useState(loadRecent);

  useEffect(() => {
    saveRecent(recent);
  }, [recent]);

  const runVerify = async (query) => {
    const b = (query || "").trim();
    if (!b) {
      toast.error("Enter a batch number to check.");
      return;
    }
    setBusy(true);
    setVerdict(null);
    try {
      const { data } = await api.post("/consumer/verify-batch", { batch_number: b });
      setVerdict(data);
      // Push to recent (dedupe, most recent first)
      setRecent((prev) => [b, ...prev.filter((x) => x.toUpperCase() !== b.toUpperCase())].slice(0, MAX_RECENT));
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    runVerify(batch);
  };

  const handleScan = (decoded) => {
    const extracted = parseScanForBatch(decoded);
    setBatch(extracted);
    setShowCamera(false);
    toast.success(`Batch captured: ${extracted}. Review and confirm to verify.`);
  };

  const removeRecent = (val) => {
    setRecent((prev) => prev.filter((x) => x !== val));
  };

  const rerunRecent = (val) => {
    setBatch(val);
    runVerify(val);
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6"
      data-testid="batch-authenticator"
    >
      <form
        onSubmit={onSubmit}
        className="k-panel p-6 md:p-8 flex flex-col gap-5"
        data-testid="consumer-verify-form"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-[#10B981]" />
          <h2 className="font-display text-white text-xl">Regulatory Batch Verification</h2>
        </div>
        <p className="text-[#E2E8F0]/65 text-sm -mt-2">
          Enter the batch number printed on your medicine strip, or scan it using the camera.
          Kyrenis checks the integrated CDSCO NSQ, Recall and Spurious Drug datasets and reports
          only what has been recorded by the regulator.
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] text-[#E2E8F0]/60 tracking-[0.14em]">Batch Number</span>
          <input
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            data-testid="consumer-batch-input"
            placeholder="e.g. SHT7550"
            className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setShowCamera((v) => !v)}
            data-testid="consumer-scan-camera-btn"
            className="inline-flex items-center justify-center gap-2 border border-[#E2E8F0]/30 text-white px-5 py-3 text-sm hover:border-white hover:bg-[#1E2B4E] transition-colors"
          >
            <Camera size={14} />
            {showCamera ? "Close camera" : "Scan Using Camera"}
          </button>
          <button
            type="submit"
            disabled={busy}
            data-testid="consumer-verify-btn"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-[#1E2B4E] px-6 py-3 text-sm font-medium hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-50"
          >
            {busy ? "Checking CDSCO records…" : "Check Regulatory Status"}
          </button>
        </div>

        {showCamera && (
          <div data-testid="consumer-camera-wrap">
            <CameraScanner onDetected={handleScan} />
            <p className="text-[10px] text-[#E2E8F0]/50 mt-2">
              Point the camera at the QR code or barcode on your medicine strip. The scanner will
              capture the batch identifier and fill it above — you can review and edit before
              running the regulatory check.
            </p>
          </div>
        )}

        {recent.length > 0 && (
          <div
            className="border-t border-[#E2E8F0]/10 pt-5 flex flex-col gap-3"
            data-testid="consumer-recent-section"
          >
            <p className="text-[11px] text-[#E2E8F0]/55 tracking-[0.14em] inline-flex items-center gap-2">
              <History size={11} />
              Recent Searches
            </p>
            <div className="flex flex-wrap gap-2" data-testid="consumer-recent-list">
              {recent.map((val, i) => (
                <div
                  key={val + "-" + i}
                  data-testid={`consumer-recent-chip-${i}`}
                  className="inline-flex items-center gap-1 border border-[#E2E8F0]/20 hover:border-[#10B981]/60 group transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => rerunRecent(val)}
                    data-testid={`consumer-recent-run-${i}`}
                    className="px-3 py-1.5 text-[11px] text-[#E2E8F0]/80 group-hover:text-white font-mono"
                  >
                    {val}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecent(val)}
                    aria-label={`Remove ${val}`}
                    data-testid={`consumer-recent-remove-${i}`}
                    className="pr-2 pl-1 py-1.5 text-[#E2E8F0]/50 hover:text-[#EF4444]"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      <VerdictPanel verdict={verdict} busy={busy} />
    </div>
  );
}

function VerdictPanel({ verdict, busy }) {
  if (!verdict && !busy) {
    return (
      <div
        className="k-panel p-8 flex flex-col items-center justify-center text-center min-h-[420px]"
        data-testid="consumer-verdict-empty"
      >
        <div className="w-28 h-28 border-2 border-[#E2E8F0]/20 relative overflow-hidden">
          <div className="absolute inset-x-2 h-[2px] bg-[#10B981] k-scanline" />
        </div>
        <p className="mt-6 text-[11px] tracking-[0.14em] text-[#E2E8F0]/50 uppercase">
          Awaiting a batch
        </p>
        <p className="text-[#E2E8F0]/55 text-sm mt-2 max-w-xs">
          Enter a batch number or scan your strip — Kyrenis returns a regulatory risk assessment
          based only on the integrated CDSCO surveillance datasets.
        </p>
      </div>
    );
  }
  if (busy) {
    return (
      <div
        className="k-panel p-8 min-h-[420px] flex flex-col items-center justify-center text-center"
        data-testid="consumer-verdict-loading"
      >
        <div className="animate-pulse w-16 h-16 border-2 border-[#10B981]/60" />
        <p className="mt-6 text-sm text-[#E2E8F0]/70">Checking the CDSCO regulatory record…</p>
      </div>
    );
  }
  const alert = verdict.alert_found;
  const color = alert ? "#EF4444" : "#10B981";
  const Icon = alert ? ShieldAlert : ShieldCheck;
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
            <p
              className="text-[11px] tracking-[0.14em]"
              style={{ color }}
              data-testid="consumer-verdict-severity"
            >
              {alert ? "HIGH RISK" : "LOW RISK"}
            </p>
            <h3
              className="font-display text-white text-2xl md:text-3xl mt-2 leading-tight"
              data-testid="consumer-verdict-headline"
            >
              {verdict.headline}
            </h3>
            <p
              className="text-[#E2E8F0]/70 text-sm mt-2"
              data-testid="consumer-verdict-status"
            >
              {alert
                ? "CDSCO Match Found — this batch appears in an official surveillance advisory."
                : "CDSCO Match Not Found — this batch does not appear in the integrated datasets."}
            </p>
          </div>
          <div
            className="w-16 h-16 border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: color, color }}
            data-testid={`consumer-verdict-icon-${alert ? "high" : "low"}`}
          >
            <Icon size={34} />
          </div>
        </div>

        {/* Risk gauge — binary presentation per new spec */}
        <div className="mt-6" data-testid="consumer-risk-gauge">
          <div className="flex items-center justify-between text-[11px] text-[#E2E8F0]/60 tracking-[0.14em]">
            <span>Risk Level</span>
            <span
              className="text-white text-sm"
              data-testid="consumer-risk-score"
            >
              {alert ? "High" : "Low"}
            </span>
          </div>
          <div className="mt-2 h-2 bg-[#0d1013] border border-[#E2E8F0]/12 relative">
            <div
              className="absolute top-0 left-0 h-full transition-all"
              style={{
                width: alert ? "95%" : "8%",
                background: color,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-[#E2E8F0]/45">
            <span>No Regulatory Alert Found</span>
            <span>Regulatory Alert</span>
          </div>
        </div>

        {alert ? (
          <div
            className="mt-8 border p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
            style={{ borderColor: `${color}55`, background: `${color}0a` }}
            data-testid="consumer-alert-card"
          >
            <AlertRow label="Product Name" value={verdict.alert_card?.product_name} full />
            <AlertRow label="Manufacturer" value={verdict.alert_card?.manufacturer} full />
            <AlertRow label="Batch Number" value={verdict.alert_card?.batch_number} mono />
            <AlertRow
              label="Alert Category"
              value={verdict.alert_card?.alert_category}
              accent={color}
            />
            <AlertRow label="Failure Reason" value={verdict.alert_card?.failure_reason} full />
            <AlertRow
              label="Source"
              value={
                verdict.alert_card?.reporting_lab
                  ? `${verdict.alert_card?.source || "CDSCO"} · ${verdict.alert_card?.reporting_lab}`
                  : verdict.alert_card?.source || "CDSCO"
              }
            />
            <AlertRow
              label="Reporting Month"
              value={verdict.alert_card?.reporting_month || verdict.alert_card?.reporting_date}
              mono
            />
          </div>
        ) : (
          <div
            className="mt-8 border border-[#10B981]/40 p-5"
            data-testid="consumer-clean-card"
          >
            <p className="text-white text-sm">{verdict.message}</p>
            <p className="text-[#E2E8F0]/55 text-[11px] mt-4">
              Kyrenis reports what has been recorded by the regulator in the integrated CDSCO
              surveillance datasets. A "No Regulatory Alert Found" result is not a guarantee of
              authenticity — always purchase from a licensed pharmacy.
            </p>
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
