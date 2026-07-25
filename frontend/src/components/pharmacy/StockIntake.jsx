import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { ScanLine, Package, ShieldCheck, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import CameraScanner from "@/components/CameraScanner";

const SAMPLE_QR = "(01)89000000000014(10)CRO241001(17)261231";
const SAMPLE_OCR = "BATCH:CRO241001 EXP:2026-12 MFG:2024-10 MRP:32.50";

export default function StockIntake() {
  const [distributors, setDistributors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({
    qr_string: "",
    ocr_text: "",
    distributor_id: "",
    medicine_id: "",
    package_declared_mrp: "",
    quantity: 100,
    mfg_date: "2024-07-01",
    expiry_date: "2026-12-31",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, m] = await Promise.all([
          api.get("/pharmacy/distributors"),
          api.get("/pharmacy/medicines"),
        ]);
        setDistributors(d.data.distributors);
        setMedicines(m.data.medicines);
      } catch (e) {
        toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
      }
    })();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadSample = (variant) => {
    if (variant === "clean") {
      set("qr_string", "(01)89000000000014(10)CRO241001(17)261231");
      set("ocr_text", "BATCH:CRO241001 EXP:2026-12 MFG:2024-10 MRP:32.50");
      set("package_declared_mrp", "32.50");
      if (medicines[0]) set("medicine_id", medicines[0].id);
    } else if (variant === "recall") {
      set("qr_string", "(01)89000000000021(10)PCM240721(17)261231");
      set("ocr_text", "BATCH:PCM240721 EXP:2026-12 MFG:2024-07 MRP:30.00");
      set("package_declared_mrp", "30.00");
      const med = medicines.find((m) => m.brand_name.includes("Dolo")) || medicines[1];
      if (med) set("medicine_id", med.id);
    } else if (variant === "mismatch") {
      set("qr_string", "(01)89000000000038(10)ABC000111(17)261231");
      set("ocr_text", "BATCH:XYZ000999 EXP:2026-12 MFG:2024-07 MRP:32.50");
      set("package_declared_mrp", "32.50");
      if (medicines[0]) set("medicine_id", medicines[0].id);
    }
    if (distributors[0]) set("distributor_id", distributors[0].id);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post("/pharmacy/intake", {
        ...form,
        package_declared_mrp: parseFloat(form.package_declared_mrp || "0"),
        quantity: parseInt(form.quantity, 10),
      });
      setResult(data);
      if (data.inventory_written) {
        toast.success("Intake accepted — inventory batch written", { duration: 3000 });
      } else {
        toast.error("Intake blocked by verification pipeline", { duration: 4000 });
      }
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6" data-testid="stock-intake-view">
      {/* Form */}
      <form onSubmit={submit} className="k-panel p-6 md:p-8 flex flex-col gap-5" data-testid="intake-form">
        <div className="flex items-center gap-3">
          <ScanLine size={18} className="text-emerald-700" />
          <h2 className="font-display text-slate-900 text-xl">Batch Intake</h2>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <SampleChip label="Clean" onClick={() => loadSample("clean")} testid="sample-clean" />
          <SampleChip label="Mismatch" onClick={() => loadSample("mismatch")} testid="sample-mismatch" tone="danger" />
          <button
            type="button"
            data-testid="intake-reset-demo-btn"
            onClick={async () => {
              try {
                const { data } = await api.post("/pharmacy/reset-demo");
                const c = data.cleared;
                toast.success(
                  `Demo reset · alerts:${c.security_alerts} · telemetry:${c.scan_telemetry} · inv:${c.inventory_batches} · POs:${c.purchase_orders}`
                );
                setResult(null);
              } catch (e) {
                toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
              }
            }}
            className="ml-auto inline-flex items-center gap-2 border border-slate-200 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase text-slate-500 hover:text-slate-900 hover:border-red-700 transition-colors"
          >
            <RotateCcw size={12} />
            Reset Demo
          </button>
        </div>

        <CameraScanner
          onDetected={(text) => {
            set("qr_string", text);
            toast.success("QR captured — verify fields, then fire the pipeline");
          }}
        />

        <Field label="Raw 2D DataMatrix QR Output" testid="intake-qr">
          <textarea
            data-testid="intake-qr-input"
            rows={3}
            placeholder={SAMPLE_QR}
            value={form.qr_string}
            onChange={(e) => set("qr_string", e.target.value)}
            className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
          />
        </Field>
        <Field label="Foil Stamped OCR Text Payload" testid="intake-ocr">
          <textarea
            data-testid="intake-ocr-input"
            rows={3}
            placeholder={SAMPLE_OCR}
            value={form.ocr_text}
            onChange={(e) => set("ocr_text", e.target.value)}
            className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Supplying Distributor" testid="intake-distributor">
            <select
              data-testid="intake-distributor-input"
              value={form.distributor_id}
              onChange={(e) => set("distributor_id", e.target.value)}
              required
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            >
              <option value="">Select node…</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Medicine SKU" testid="intake-medicine">
            <select
              data-testid="intake-medicine-input"
              value={form.medicine_id}
              onChange={(e) => set("medicine_id", e.target.value)}
              required
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            >
              <option value="">Select SKU…</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>{`${m.brand_name} — ${m.generic_composition}`}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Declared MRP (₹)" testid="intake-mrp">
            <input
              data-testid="intake-mrp-input"
              type="number"
              step="0.01"
              value={form.package_declared_mrp}
              onChange={(e) => set("package_declared_mrp", e.target.value)}
              required
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            />
          </Field>
          <Field label="Quantity" testid="intake-qty">
            <input
              data-testid="intake-qty-input"
              type="number"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              min={1}
              required
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="MFG Date" testid="intake-mfg">
            <input
              data-testid="intake-mfg-input"
              type="date"
              value={form.mfg_date}
              onChange={(e) => set("mfg_date", e.target.value)}
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            />
          </Field>
          <Field label="EXP Date" testid="intake-exp">
            <input
              data-testid="intake-exp-input"
              type="date"
              value={form.expiry_date}
              onChange={(e) => set("expiry_date", e.target.value)}
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={busy}
          data-testid="intake-submit-btn"
          className="mt-2 py-3 bg-white text-slate-900 text-sm font-medium hover:bg-slate-100 active:scale-[0.98] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <ShieldCheck size={14} />
          Verify & Add to Inventory
        </button>
      </form>

      {/* Result panel */}
      <div className="flex flex-col gap-4">
        <VerificationResult result={result} />
      </div>
    </div>
  );
}

function SampleChip({ label, onClick, tone, testid }) {
  const color = tone === "danger" ? "#EF4444" : "#10B981";
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className="border px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-slate-100 transition-colors"
      style={{ borderColor: `${color}55`, color }}
    >
      {label}
    </button>
  );
}

function Field({ label, testid, children }) {
  return (
    <label className="flex flex-col gap-2" data-testid={`field-${testid}`}>
      <span className="k-label">{label}</span>
      {children}
    </label>
  );
}

function VerificationResult({ result }) {
  if (!result) {
    return (
      <div className="k-panel p-6 flex-1 flex flex-col items-center justify-center text-center min-h-[400px]" data-testid="intake-result-empty">
        <ScanLine size={40} className="text-slate-300" />
        <p className="mt-4 font-mono text-[11px] tracking-[0.3em] uppercase text-slate-400">
          Awaiting Payload
        </p>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">
          Submit a QR + OCR payload to see the 4-step verification breakdown.
        </p>
      </div>
    );
  }

  const v = result.verification;
  const isPass = result.inventory_written;
  const accent = isPass ? "#10B981" : "#EF4444";

  return (
    <div className="k-panel p-6 md:p-8 flex flex-col gap-5" data-testid="intake-result">
      <div className="flex items-center justify-between">
        <p className="k-label">Verification result</p>
        <span
          className="font-mono text-[10px] tracking-[0.28em] uppercase px-3 py-1 border"
          style={{ borderColor: `${accent}66`, color: accent }}
          data-testid="intake-result-status"
        >
          {isPass ? "Verified" : "Anomaly Flagged"}
        </span>
      </div>

      {result.verification.final_alert && (
        <div
          className="border p-4 flex gap-3 items-start"
          style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}
          data-testid="intake-critical-banner"
        >
          <AlertTriangle size={20} className="text-red-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-900 font-medium">
              {result.verification.final_alert.level}: {result.verification.final_alert.title}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              {result.verification.final_alert.detail}
            </p>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-2" data-testid="intake-check-list">
        {v.checks.map((c, i) => (
          <li
            key={i}
            className="flex items-center justify-between border border-slate-200 px-4 py-3"
            data-testid={`intake-check-${i}`}
          >
            <div className="flex items-center gap-3">
                {c.passed ? (
                  <CheckCircle2 size={16} className="text-emerald-700" />
                ) : (
                  <AlertTriangle size={16} className="text-red-700" />
                )}
                <span className="font-mono text-xs tracking-wider text-slate-900">Check {i + 1}</span>
                <span className="text-slate-600 text-sm">{c.name}</span>
            </div>
            {c.detail && (
                <span className="hidden md:block font-mono text-[10px] text-slate-500">
                {c.detail}
              </span>
            )}
          </li>
        ))}
      </ol>

      {v.warnings && v.warnings.length > 0 && (
        <div
          className="border p-4"
          style={{ borderColor: "#F59E0B", background: "#FFFBEB" }}
          data-testid="intake-mrp-warning"
        >
          <p className="text-amber-600 font-mono text-[10px] tracking-[0.28em] uppercase">
            Warning · Persistent Tag
          </p>
          <p className="text-slate-900 mt-2 text-sm">{v.warnings[0].tag}</p>
          <p className="text-slate-500 text-xs mt-1">{v.warnings[0].detail}</p>
        </div>
      )}

      {result.triggered_alerts && result.triggered_alerts.length > 0 && (
        <div className="flex flex-col gap-2" data-testid="intake-triggered-alerts">
          {result.triggered_alerts.map((a, i) => (
            <div
              key={i}
          className="border p-3 flex items-start gap-3"
          style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}
            >
              <AlertTriangle size={16} className="text-red-700 mt-0.5" />
              <div>
                <p className="text-slate-900 text-sm font-medium">
                  {a.alert_type} · {a.severity}
                </p>
                <p className="text-slate-600 text-xs mt-1">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.inventory_batch && (
        <div         className="border border-emerald-200 p-4 flex items-start gap-3" data-testid="intake-inventory-written">
          <Package size={18} className="text-emerald-700 mt-0.5" />
          <div>
            <p className="text-slate-900 text-sm font-medium">Inventory Batch Written</p>
            <p className="font-mono text-[11px] text-slate-500 mt-1">
              Batch {result.inventory_batch.batch_number} · Qty {result.inventory_batch.current_stock_qty} ·
              Exp {result.inventory_batch.expiry_date}
            </p>
          </div>
        </div>
      )}

      <div className="k-divider" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="k-label">Parsed GTIN</p>
          <p className="font-mono text-slate-600 mt-1 text-sm">{v.qr_gtin || "—"}</p>
        </div>
        <div>
          <p className="k-label">Parsed Batch</p>
          <p className="font-mono text-slate-600 mt-1 text-sm">{v.qr_batch || "—"}</p>
        </div>
        <div>
          <p className="k-label">QR Expiry</p>
          <p className="font-mono text-slate-600 mt-1 text-sm">{v.qr_expiry || "—"}</p>
        </div>
        <div>
          <p className="k-label">OCR Expiry</p>
          <p className="font-mono text-slate-600 mt-1 text-sm">{v.ocr_expiry || "—"}</p>
        </div>
      </div>
    </div>
  );
}
