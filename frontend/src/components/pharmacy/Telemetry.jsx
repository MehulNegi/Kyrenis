import React, { useMemo } from "react";

import {
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  Radar,
  AlertTriangle,
  Waves,
  Download,
  ShieldCheck,
  Clock3,
  Scale,
  CheckCircle2,
  PackageSearch,
} from "lucide-react";

const BATCH_DATA = [
  { batch: "SAT240001", medicine: "Paracetamol 650mg", produced: 42000, reported: 48250 },
  { batch: "SAT240002", medicine: "Metformin HCl 500mg", produced: 35000, reported: 31700 },
  { batch: "SAT240003", medicine: "Azithromycin 500mg", produced: 44000, reported: 39200 },
  { batch: "SAT240004", medicine: "Amoxicillin 500mg", produced: 38000, reported: 46800 },
  { batch: "SAT240005", medicine: "Losartan 50mg", produced: 50000, reported: 27400 },
  { batch: "SAT240006", medicine: "Atorvastatin 10mg", produced: 41000, reported: 43600 },
  { batch: "SAT240007", medicine: "Pantoprazole 40mg", produced: 46000, reported: 36100 },
  { batch: "SAT240008", medicine: "Cefixime 200mg", produced: 43000, reported: 49100 },
  { batch: "SAT240009", medicine: "Cetirizine 10mg", produced: 37000, reported: 33500 },
  { batch: "SAT240010", medicine: "Glimepiride 2mg", produced: 48000, reported: 44300 },
  { batch: "SAT240011", medicine: "Montelukast 10mg", produced: 33000, reported: 29100 },
  { batch: "SAT240012", medicine: "Telmisartan 40mg", produced: 45000, reported: 40200 },
  { batch: "SAT240013", medicine: "Doxycycline 100mg", produced: 39000, reported: 35200 },
  { batch: "SAT240014", medicine: "Amlodipine 5mg", produced: 47000, reported: 41900 },
  { batch: "SAT240015", medicine: "Omeprazole 20mg", produced: 36000, reported: 38900 },
  { batch: "SAT240016", medicine: "Levocetirizine 5mg", produced: 43000, reported: 37400 },
];

const DEMO_RECALLS = [
  { id: "recall-1", medicine: "Paracetamol 650mg", batch: "PCM240721", units: 18, reason: "Quality / composition alert", date: "28 Jul 2026" },
  { id: "recall-2", medicine: "Losartan 50mg", batch: "LSR00815", units: 9, reason: "Regulatory quality alert", date: "27 Jul 2026" },
  { id: "recall-3", medicine: "Cefixime 200mg", batch: "CFX24031", units: 12, reason: "Batch quality failure", date: "26 Jul 2026" },
  { id: "recall-4", medicine: "ORS Sachet", batch: "ORS25018", units: 21, reason: "Product quality alert", date: "25 Jul 2026" },
];

const OTHER_RISK_ALERTS = [
  { id: "risk-recall-1", alert_type: "Recall Match", target_batch_number: "PCM240721", target_medicine_name: "Paracetamol 650mg", severity: "Critical" },
  { id: "risk-expiry-1", alert_type: "Expiry Risk", target_batch_number: "AZM25014", target_medicine_name: "Azithromycin 500mg", severity: "High" },
  { id: "risk-stock-1", alert_type: "Stock Discrepancy", target_batch_number: "MET55003", target_medicine_name: "Metformin HCl 500mg", severity: "High" },
  { id: "risk-recall-2", alert_type: "Recall Match", target_batch_number: "LSR00815", target_medicine_name: "Losartan 50mg", severity: "Critical" },
  { id: "risk-verification-1", alert_type: "Verification Failure", target_batch_number: "AMX24018", target_medicine_name: "Amoxicillin 500mg", severity: "High" },
  { id: "risk-mismatch-1", alert_type: "Batch Data Mismatch", target_batch_number: "PAN25007", target_medicine_name: "Pantoprazole 40mg", severity: "High" },
];

const TODAY_IMPACT = {
  recallMatches: 4,
  nearExpiryUnits: 31,
  stockDiscrepancies: 3,
  risksResolved: 6,
  risksOpen: 4,
};

function severityStyle(severity) {
  if (severity === "Critical") {
    return { borderColor: "#EF4444", color: "#DC2626", background: "#FEF2F2" };
  }
  return { borderColor: "#F59E0B", color: "#D97706", background: "#FFFBEB" };
}

function BatchTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const exceeded = data.reported > data.produced;
  const excess = Math.max(0, data.reported - data.produced);
  const remaining = Math.max(0, data.produced - data.reported);
  const percentage = Math.round((data.reported / data.produced) * 100);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px", boxShadow: "0 4px 14px rgba(15,23,42,0.10)", minWidth: "240px" }}>
      <p style={{ color: "#0B192C", fontWeight: 700, fontSize: "12px" }}>{label}</p>
      <p style={{ color: "#64748B", fontSize: "10px", marginTop: "2px", marginBottom: "12px" }}>{data.medicine}</p>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", fontSize: "11px", marginBottom: "6px" }}>
        <span style={{ color: "#64748B" }}>Manufacturer Produced</span>
        <span style={{ color: "#0B192C", fontWeight: 600 }}>{data.produced.toLocaleString()}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", fontSize: "11px", marginBottom: "6px" }}>
        <span style={{ color: "#64748B" }}>Kyrenis Reported</span>
        <span style={{ color: "#0B192C", fontWeight: 600 }}>{data.reported.toLocaleString()}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", fontSize: "11px", marginBottom: "10px" }}>
        <span style={{ color: "#64748B" }}>Production Utilization</span>
        <span style={{ color: exceeded ? "#DC2626" : "#475569", fontWeight: 600 }}>{percentage}%</span>
      </div>

      {exceeded ? (
        <div style={{ borderTop: "1px solid #FECACA", paddingTop: "9px" }}>
          <p style={{ color: "#DC2626", fontSize: "10px", fontWeight: 700 }}>+{excess.toLocaleString()} units above declared production</p>
          <p style={{ color: "#991B1B", fontSize: "9px", marginTop: "3px" }}>Potential batch cloning or supply-chain discrepancy</p>
        </div>
      ) : (
        <div style={{ borderTop: "1px solid #D1FAE5", paddingTop: "9px" }}>
          <p style={{ color: "#059669", fontSize: "10px", fontWeight: 600 }}>Within manufacturer production</p>
          <p style={{ color: "#64748B", fontSize: "9px", marginTop: "3px" }}>{remaining.toLocaleString()} units below declared quantity</p>
        </div>
      )}
    </div>
  );
}

export default function Telemetry() {
  const BACKEND = process.env.REACT_APP_BACKEND_URL;

  const volumetricAlerts = useMemo(
    () =>
      BATCH_DATA.filter((batch) => batch.reported > batch.produced).map((batch) => ({
        id: `volume-${batch.batch}`,
        alert_type: "Volumetric Saturation",
        target_batch_number: batch.batch,
        target_medicine_name: batch.medicine,
        severity: "Critical",
        excess: batch.reported - batch.produced,
      })),
    []
  );

  const riskAlerts = useMemo(() => [...volumetricAlerts, ...OTHER_RISK_ALERTS], [volumetricAlerts]);
  const criticalAlerts = useMemo(() => riskAlerts.filter((alert) => alert.severity === "Critical"), [riskAlerts]);
  const highAlerts = useMemo(() => riskAlerts.filter((alert) => alert.severity === "High"), [riskAlerts]);

  const affectedRecallUnits = useMemo(() => DEMO_RECALLS.reduce((total, recall) => total + recall.units, 0), []);

  return (
    <div className="flex flex-col gap-6" data-testid="telemetry-view">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[#64748B]">// Pharmacy Safety Telemetry</p>
          <p className="text-[#64748B] text-sm mt-1">Real-time safety and supply-chain intelligence · {riskAlerts.length} active risks.</p>
        </div>
        <a href={`${BACKEND}/api/pharmacy/export/audit-log.csv`} data-testid="telemetry-export-csv" className="inline-flex items-center gap-2 border border-[#10B981]/50 text-[#059669] px-4 py-2 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-[#ECFDF5] transition-colors">
          <Download size={12} />
          Export Audit CSV
        </a>
      </div>

      <div className="border border-[#EF4444]/60 bg-[#FEF2F2] p-4 flex items-start gap-3 rounded-lg relative z-10" data-testid="critical-threat-banner">
        <AlertTriangle size={20} className="text-[#EF4444] mt-0.5 shrink-0" />
        <div>
          <p className="text-[#991B1B] font-semibold">CRITICAL: Potential Batch Cloning Activity Detected</p>
          <p className="text-[#7F1D1D]/75 text-sm mt-1">{volumetricAlerts.length} batches have exceeded their individual manufacturer-declared production quantities across Kyrenis network stock-intake records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 bg-white relative z-10 border border-[#E2E8F0] rounded-xl p-6 md:p-8" data-testid="security-alerts-panel">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <Radar size={18} className="text-[#EF4444] mt-1 shrink-0" />
              <div>
                <h2 className="font-display text-[#0B192C] text-xl font-semibold">Risk Alerts</h2>
                <p className="text-[#64748B] text-xs mt-1">Active safety and supply-chain risks requiring attention.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase px-2.5 py-1.5 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] rounded">{criticalAlerts.length} Critical</span>
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase px-2.5 py-1.5 border border-[#FDE68A] bg-[#FFFBEB] text-[#D97706] rounded">{highAlerts.length} High</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-h-[410px] overflow-auto pr-1">
            {riskAlerts.map((alert) => (
              <div key={alert.id} className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[#0B192C] text-sm font-semibold">{alert.alert_type}</p>
                  <p className="font-mono text-[10px] text-[#64748B] mt-1">{alert.target_batch_number} · {alert.target_medicine_name}</p>
                  {alert.excess > 0 && <p className="font-mono text-[9px] text-[#DC2626] mt-1.5">+{alert.excess.toLocaleString()} units above declared production</p>}
                </div>
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-1 border rounded shrink-0" style={severityStyle(alert.severity)}>{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white relative z-10 border border-[#E2E8F0] rounded-xl p-6 md:p-8" data-testid="recall-intelligence-panel">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-[#F59E0B] mt-1 shrink-0" />
            <div>
              <h2 className="font-display text-[#0B192C] text-xl font-semibold">Recall Intelligence</h2>
              <p className="text-[#64748B] text-xs mt-1">Recall matches affecting your inventory.</p>
            </div>
          </div>

          <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-lg p-4 mt-6">
            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#DC2626]">Inventory Impact</p>
            <p className="text-[#991B1B] font-semibold mt-1">4 recalls match your stock</p>
            <p className="text-[#7F1D1D]/75 text-xs mt-1">{affectedRecallUnits} units currently require review.</p>
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-auto pr-1 mt-4">
            {DEMO_RECALLS.map((recall) => (
              <div key={recall.id} className="border border-[#FDE68A] bg-[#FFFBEB] rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[#0B192C] text-sm font-semibold">{recall.medicine}</p>
                  <span className="font-mono text-[9px] text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-2 py-1 rounded shrink-0">{recall.units} units</span>
                </div>
                <p className="font-mono text-[10px] text-[#D97706] mt-2">Batch {recall.batch}</p>
                <p className="text-[#64748B] text-xs mt-2">{recall.reason}</p>
                <p className="font-mono text-[9px] text-[#94A3B8] mt-3">Published {recall.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-white relative z-10 border border-[#E2E8F0] rounded-xl p-6 md:p-8" data-testid="batch-volume-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Waves size={18} className="text-[#10B981]" />
              <h2 className="font-display text-[#0B192C] text-xl font-semibold">Batch Volume Distribution</h2>
            </div>
            <p className="text-[#64748B] text-xs mt-2 ml-[30px]">Manufacturer production vs quantities reported through Kyrenis network stock intake.</p>
          </div>
          <div className="flex items-center gap-5 flex-wrap font-mono text-[9px] tracking-[0.12em] uppercase text-[#64748B]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Within Limit</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Exceeded</span>
            <span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: "#1E2B4E" }} /> Manufacturer Produced</span>
          </div>
        </div>

        <div className="mt-5 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg px-4 py-3">
          <p className="text-[#475569] text-xs leading-relaxed">The line represents each batch's manufacturer-declared production quantity. Bars represent quantities reported through unique stock-intake transactions across the Kyrenis network. Repeated barcode scans do not increase these totals.</p>
        </div>

        <div className="h-[460px] mt-4" data-testid="batch-volume-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={BATCH_DATA} margin={{ top: 25, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="batch" angle={-35} textAnchor="end" interval={0} height={80} tick={{ fill: "#475569", fontFamily: "JetBrains Mono", fontSize: 9 }} axisLine={{ stroke: "#CBD5E1" }} tickLine={{ stroke: "#CBD5E1" }} />
              <YAxis domain={[0, 55000]} tickFormatter={(value) => `${value / 1000}k`} tick={{ fill: "#475569", fontFamily: "JetBrains Mono", fontSize: 10 }} axisLine={{ stroke: "#CBD5E1" }} tickLine={{ stroke: "#CBD5E1" }} label={{ value: "Units", angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 10 }} />
              <Tooltip cursor={{ fill: "#F8FAFC" }} content={<BatchTooltip />} />
              <Bar dataKey="reported" name="Kyrenis Reported" radius={[5, 5, 0, 0]} strokeWidth={1} barSize={42}>
                {BATCH_DATA.map((entry, index) => {
                  const exceeded = entry.reported > entry.produced;
                  return <Cell key={`batch-${index}`} fill={exceeded ? "#EF4444" : "#10B981"} stroke={exceeded ? "#DC2626" : "#059669"} />;
                })}
              </Bar>
              <Line type="monotone" dataKey="produced" name="Manufacturer Produced" stroke="#1E2B4E" strokeWidth={2.5} dot={{ r: 4, fill: "#FFFFFF", stroke: "#1E2B4E", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#FFFFFF", stroke: "#1E2B4E", strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[9px] tracking-[0.16em] uppercase text-[#64748B]">Volumetric Saturation Detector</p>
            <p className="text-[#94A3B8] text-[10px] mt-1">Production quantities are evaluated independently for every batch.</p>
          </div>
          <p className="text-[#64748B] text-xs"><span className="text-[#EF4444] font-semibold">{volumetricAlerts.length} batches</span> currently exceed declared production.</p>
        </div>
      </div>

      <div className="bg-white relative z-10 border border-[#E2E8F0] rounded-xl p-6 md:p-8" data-testid="todays-impact-panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={19} className="text-[#10B981]" />
              <h2 className="font-display text-[#0B192C] text-xl font-semibold">Today's Impact</h2>
            </div>
            <p className="text-[#64748B] text-xs mt-2 ml-[31px]">Safety and inventory issues Kyrenis identified today.</p>
          </div>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#059669] border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 rounded">Today</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 mt-7">
          <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-lg p-5">
            <AlertTriangle size={18} className="text-[#EF4444]" />
            <p className="font-display text-3xl font-semibold text-[#991B1B] mt-5">{TODAY_IMPACT.recallMatches}</p>
            <p className="text-[#7F1D1D] text-sm font-medium mt-1">Recall Matches</p>
            <p className="text-[#991B1B]/60 text-xs mt-2">Recalled batches detected in stock.</p>
          </div>

          <div className="border border-[#FDE68A] bg-[#FFFBEB] rounded-lg p-5">
            <Clock3 size={18} className="text-[#D97706]" />
            <p className="font-display text-3xl font-semibold text-[#92400E] mt-5">{TODAY_IMPACT.nearExpiryUnits}</p>
            <p className="text-[#92400E] text-sm font-medium mt-1">Near-Expiry Units</p>
            <p className="text-[#92400E]/60 text-xs mt-2">Units flagged for expiry attention.</p>
          </div>

          <div className="border border-[#FED7AA] bg-[#FFF7ED] rounded-lg p-5">
            <Scale size={18} className="text-[#EA580C]" />
            <p className="font-display text-3xl font-semibold text-[#9A3412] mt-5">{TODAY_IMPACT.stockDiscrepancies}</p>
            <p className="text-[#9A3412] text-sm font-medium mt-1">Stock Discrepancies</p>
            <p className="text-[#9A3412]/60 text-xs mt-2">Inventory differences identified.</p>
          </div>

          <div className="border border-[#A7F3D0] bg-[#ECFDF5] rounded-lg p-5">
            <CheckCircle2 size={18} className="text-[#059669]" />
            <p className="font-display text-3xl font-semibold text-[#065F46] mt-5">{TODAY_IMPACT.risksResolved}</p>
            <p className="text-[#065F46] text-sm font-medium mt-1">Risks Resolved</p>
            <p className="text-[#065F46]/60 text-xs mt-2">Issues addressed today.</p>
          </div>

          <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-5">
            <PackageSearch size={18} className="text-[#475569]" />
            <p className="font-display text-3xl font-semibold text-[#0B192C] mt-5">{TODAY_IMPACT.risksOpen}</p>
            <p className="text-[#0B192C] text-sm font-medium mt-1">Need Attention</p>
            <p className="text-[#64748B] text-xs mt-2">Risks still awaiting action.</p>
          </div>
        </div>

        <div className="mt-5 border border-[#D1FAE5] bg-[#F0FDF4] rounded-lg px-5 py-4 flex items-center gap-3">
          <ShieldCheck size={17} className="text-[#059669] shrink-0" />
          <p className="text-[#166534] text-sm">
            <span className="font-semibold">Kyrenis identified {TODAY_IMPACT.risksResolved + TODAY_IMPACT.risksOpen} inventory risks today.</span> {TODAY_IMPACT.risksResolved} have been resolved, while {TODAY_IMPACT.risksOpen} still require attention.
          </p>
        </div>
      </div>
    </div>
  );
}