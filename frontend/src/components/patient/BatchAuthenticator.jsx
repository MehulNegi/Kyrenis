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
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 bg-white relative z-10"
      data-testid="batch-authenticator"
    >
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 p-6 k-panel md:p-8"
        data-testid="consumer-verify-form"
      > 
<div className="flex items-center gap-3">
           <ShieldCheck size={18} className="text-emerald-700" />
           <h2 className="text-xl font-display text-slate-900">Regulatory Batch Verification</h2>
         </div>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] text-slate-500 tracking-[0.14em]">Batch Number</span>
          <input
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            data-testid="consumer-batch-input"
            placeholder="e.g. SHT7550"
            className="w-full px-3 py-3 text-sm transition-colors bg-white border border-slate-200 text-slate-900 focus:border-emerald-700 focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowCamera((v) => !v)}
            data-testid="consumer-scan-camera-btn"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm transition-colors border border-slate-300 text-slate-900 hover:border-slate-300 hover:bg-slate-100"
          >
            <Camera size={14} />
            {showCamera ? "Close camera" : "Scan Using Camera"}
          </button>
          <button
            type="submit"
            disabled={busy}
            data-testid="consumer-verify-btn"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 text-sm font-medium hover:bg-slate-100 active:scale-[0.98] transition-colors disabled:opacity-50"
          >
            {busy ? "Checking CDSCO records…" : "Check Regulatory Status"}
          </button>
        </div>

{showCamera && (
           <div data-testid="consumer-camera-wrap">
             <CameraScanner onDetected={handleScan} />
           </div>
         )}

        {recent.length > 0 && (
          <div
            className="flex flex-col gap-3 pt-5 border-t border-slate-200"
            data-testid="consumer-recent-section"
          >
              <p className="text-[11px] text-slate-400 tracking-[0.14em] inline-flex items-center gap-2">
              <History size={11} />
              Recent Searches
            </p>
            <div className="flex flex-wrap gap-2" data-testid="consumer-recent-list">
              {recent.map((val, i) => (
                <div
                  key={val + "-" + i}
                  data-testid={`consumer-recent-chip-${i}`}
                  className="inline-flex items-center gap-1 transition-colors border border-slate-200 hover:border-emerald-200 group"
                >
                  <button
                    type="button"
                    onClick={() => rerunRecent(val)}
                    data-testid={`consumer-recent-run-${i}`}
                    className="px-3 py-1.5 text-[11px] text-slate-600 group-hover:text-slate-900 font-mono"
                  >
                    {val}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecent(val)}
                    aria-label={`Remove ${val}`}
                    data-testid={`consumer-recent-remove-${i}`}
                    className="pr-2 pl-1 py-1.5 text-slate-400 hover:text-red-700"
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
        <div className="relative overflow-hidden border-2 w-28 h-28 border-slate-200">
          <div className="absolute inset-x-2 h-[2px] bg-emerald-700 k-scanline" />
        </div>
<p className="mt-6 text-[11px] tracking-[0.14em] text-slate-400 uppercase">
           Awaiting a batch
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
        <div className="w-16 h-16 border-2 animate-pulse border-emerald-200" />
        <p className="mt-6 text-sm text-slate-600">Checking the CDSCO regulatory record…</p>
      </div>
    );
  }
  const alert = verdict.alert_found;
  const color = alert ? "#EF4444" : "#10B981";
  const Icon = alert ? ShieldAlert : ShieldCheck;
  return (
    <div
      className="p-8 min-h-[420px] relative overflow-hidden"
      style={{ background: "#FFFFFF", border: `1px solid ${color}66` }}
      data-testid="consumer-verdict-card"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: `radial-gradient(circle at 20% 0%, ${color}11, transparent 55%)` }}
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
                className="mt-2 text-2xl leading-tight font-display text-slate-900 md:text-3xl"
              data-testid="consumer-verdict-headline"
            >
              {verdict.headline}
            </h3>
              <p
                className="mt-2 text-sm text-slate-600"
                data-testid="consumer-verdict-status"
              >
              {alert
                ? "CDSCO Match Found — this batch appears in an official surveillance advisory."
                : "CDSCO Match Not Found — this batch does not appear in the integrated datasets."}
            </p>
          </div>
          <div
            className="flex items-center justify-center w-16 h-16 border-2 shrink-0"
            style={{ borderColor: color, color }}
            data-testid={`consumer-verdict-icon-${alert ? "high" : "low"}`}
          >
            <Icon size={34} />
          </div>
        </div>

        {/* Risk gauge — binary presentation per new spec */}
          <div className="mt-6" data-testid="consumer-risk-gauge">
            <div className="flex items-center justify-between text-[11px] text-slate-500 tracking-[0.14em]">
              <span>Risk Level</span>
              <span
                className="text-sm text-slate-900"
                data-testid="consumer-risk-score"
              >
              {alert ? "High" : "Low"}
            </span>
          </div>
          <div className="relative h-2 mt-2 border bg-slate-100 border-slate-200">
            <div
              className="absolute top-0 left-0 h-full transition-all"
              style={{
                width: alert ? "95%" : "8%",
                background: color,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            <span>No Regulatory Alert Found</span>
            <span>Regulatory Alert</span>
          </div>
        </div>

        {alert ? (
          <div
            className="grid grid-cols-1 gap-4 p-5 mt-8 border md:grid-cols-2"
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
            className="grid grid-cols-1 gap-4 p-5 mt-8 bg-[#10B9810a] border border-emerald-200 md:grid-cols-2"
            data-testid="consumer-clean-card"
          >
              <p className="text-sm text-slate-900">{verdict.message}</p>
              <p className="text-slate-400 text-[11px] mt-4">
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
      <p className="text-[10px] tracking-[0.14em] text-slate-400">{label}</p>
      <p
        className={`text-slate-900 mt-1 text-sm ${mono ? "font-mono" : ""}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
