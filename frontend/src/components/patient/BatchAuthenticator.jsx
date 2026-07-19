import React, { useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, ScanLine, Sparkles } from "lucide-react";

const PRESETS = [
  {
    label: "Sample · Genuine strip",
    testid: "consumer-sample-clean",
    payload: {
      qr_string: "(01)08900000000019(10)CRO241001(17)261231",
      batch_number: "CRO241001",
      package_declared_mrp: 32.5,
    },
  },
  {
    label: "Sample · Recalled batch",
    testid: "consumer-sample-recall",
    tone: "danger",
    payload: {
      qr_string: "(01)08900000000026(10)PCM240721(17)261231",
      batch_number: "PCM240721",
      package_declared_mrp: 30,
    },
  },
  {
    label: "Sample · Anomaly locked",
    testid: "consumer-sample-anomaly",
    tone: "danger",
    payload: {
      qr_string: "(01)08900000000033(10)SAT240001(17)261231",
      batch_number: "SAT240001",
      package_declared_mrp: 178,
    },
  },
];

export default function BatchAuthenticator() {
  const [payload, setPayload] = useState({
    qr_string: "",
    batch_number: "",
    package_declared_mrp: "",
  });
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setPayload((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setVerdict(null);
    try {
      const { data } = await api.post("/consumer/verify-batch", {
        qr_string: payload.qr_string,
        batch_number: payload.batch_number,
        package_declared_mrp: payload.package_declared_mrp
          ? parseFloat(payload.package_declared_mrp)
          : undefined,
      });
      setVerdict(data);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  const runPreset = (preset) => {
    setPayload({
      qr_string: preset.payload.qr_string,
      batch_number: preset.payload.batch_number,
      package_declared_mrp: String(preset.payload.package_declared_mrp),
    });
    setTimeout(submit, 60);
  };

  const shield = verdict?.shield || null;
  const shieldColor =
    shield === "green" ? "#10B981" : shield === "amber" ? "#F59E0B" : "#EF4444";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6" data-testid="batch-authenticator">
      <form onSubmit={submit} className="k-panel p-6 md:p-8 flex flex-col gap-5" data-testid="consumer-verify-form">
        <div className="flex items-center gap-3">
          <ScanLine size={18} className="text-[#10B981]" />
          <h2 className="font-display text-white text-xl">Instant Batch Authenticator</h2>
        </div>
        <p className="text-[#E2E8F0]/60 text-sm -mt-2">
          Anonymous. Nothing you enter is stored against your identity — Kyrenis SHA-256 hashes
          the query at intake.
        </p>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.testid}
              type="button"
              onClick={() => runPreset(p)}
              data-testid={p.testid}
              className="border px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase transition-colors"
              style={{
                borderColor: `${p.tone === "danger" ? "#EF4444" : "#10B981"}55`,
                color: p.tone === "danger" ? "#EF4444" : "#10B981",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Field label="Raw QR (GS1 DataMatrix) — optional">
          <textarea
            data-testid="consumer-qr-input"
            rows={3}
            value={payload.qr_string}
            onChange={(e) => set("qr_string", e.target.value)}
            placeholder="(01)0890...(10)PCM240721(17)261231"
            className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none transition-colors"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Batch Number">
            <input
              data-testid="consumer-batch-input"
              value={payload.batch_number}
              onChange={(e) => set("batch_number", e.target.value)}
              className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none transition-colors"
              placeholder="PCM240721"
            />
          </Field>
          <Field label="Package MRP (optional)">
            <input
              data-testid="consumer-mrp-input"
              type="number"
              step="0.01"
              value={payload.package_declared_mrp}
              onChange={(e) => set("package_declared_mrp", e.target.value)}
              className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none transition-colors"
              placeholder="32.50"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={busy}
          data-testid="consumer-verify-btn"
          className="mt-2 py-3 bg-white text-[#1E2B4E] font-mono text-xs tracking-[0.28em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-50"
        >
          <Sparkles size={14} />
          Verify Authenticity
        </button>
      </form>

      {/* Verdict card */}
      {verdict ? (
        <div
          className="p-8 flex flex-col items-center text-center justify-center min-h-[420px] relative overflow-hidden"
          style={{
            background: "#1F2326",
            border: `1px solid ${shieldColor}66`,
          }}
          data-testid="consumer-verdict-card"
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(circle at center, ${shieldColor}22, transparent 60%)`,
            }}
          />
          <div className="relative flex flex-col items-center">
            <div
              className="w-28 h-28 border-4 flex items-center justify-center"
              style={{ borderColor: shieldColor, color: shieldColor }}
              data-testid={`shield-icon-${shield}`}
            >
              {shield === "green" ? <ShieldCheck size={54} /> : <ShieldAlert size={54} />}
            </div>
            <p
              className="mt-6 font-mono text-[10px] tracking-[0.32em] uppercase"
              style={{ color: shieldColor }}
            >
              // Verdict
            </p>
            <h3
              className="font-display text-white text-2xl md:text-3xl mt-3 tracking-tight"
              data-testid="consumer-verdict-title"
            >
              {verdict.title}
            </h3>
            <p className="text-[#E2E8F0]/70 max-w-xs mt-4 text-sm leading-relaxed">
              {verdict.detail}
            </p>

            {verdict.medicine && (
              <div className="mt-6 border border-[#E2E8F0]/15 px-4 py-2 font-mono text-[11px] text-white">
                {verdict.medicine} · {verdict.batch_number}
              </div>
            )}

            <div className="mt-8 w-full flex flex-col gap-2">
              {verdict.checks.map((c, i) => (
                <div
                  key={i}
                  className="border border-[#E2E8F0]/12 px-3 py-2 flex items-center justify-between text-left"
                >
                  <span className="text-[#E2E8F0]/80 text-xs">{c.name}</span>
                  <span
                    className="font-mono text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: c.passed ? "#10B981" : "#EF4444" }}
                  >
                    {c.passed ? "Cleared" : "Blocked"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="k-panel p-8 flex flex-col items-center justify-center text-center min-h-[420px]" data-testid="consumer-verdict-empty">
          <div className="w-28 h-28 border-2 border-[#E2E8F0]/20 relative overflow-hidden">
            <div className="absolute inset-x-2 h-[2px] bg-[#10B981] k-scanline" />
          </div>
          <p className="mt-6 font-mono text-[11px] tracking-[0.3em] uppercase text-[#E2E8F0]/50">
            Awaiting Batch
          </p>
          <p className="text-[#E2E8F0]/50 text-sm mt-2 max-w-xs">
            Paste a batch number or run one of the sample presets to see the trust verdict.
          </p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="k-label">{label}</span>
      {children}
    </label>
  );
}
