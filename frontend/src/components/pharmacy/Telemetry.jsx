import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import { Radar, AlertTriangle, MapPin, Waves, Download, Activity } from "lucide-react";

export default function Telemetry() {
  const [volumetric, setVolumetric] = useState([]);
  const [threshold, setThreshold] = useState(40000);
  const [spatial, setSpatial] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recalls, setRecalls] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const BACKEND = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    (async () => {
      try {
        const [v, s, a, r, t] = await Promise.all([
          api.get("/pharmacy/telemetry/volumetric").catch(() => ({ data: { volumetric: [], threshold: 40000 } })),
          api.get("/pharmacy/telemetry/spatial").catch(() => ({ data: { spatial_anomalies: [] } })),
          api.get("/pharmacy/security-alerts").catch(() => ({ data: { alerts: [] } })),
          api.get("/pharmacy/recalls").catch(() => ({ data: { recalls: [] } })),
          api.get("/pharmacy/telemetry/timeline?hours=168").catch(() => ({ data: { timeline: [] } })),
        ]);
        setVolumetric(v?.data?.volumetric ?? []);
        setThreshold(v?.data?.threshold ?? 40000);
        setSpatial(s?.data?.spatial_anomalies ?? []);
        setAlerts(a?.data?.alerts ?? []);
        setRecalls(r?.data?.recalls ?? []);
        setTimeline(t?.data?.timeline ?? []);
      } catch (e) {
        toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
      }
    })();
  }, []);

  const exceededBatches = volumetric.filter((v) => v.threshold_exceeded);
  const chartData = useMemo(
    () =>
      volumetric.slice(0, 12).map((v) => ({
        batch: v.batch_number,
        total: v.total_units,
        exceeded: v.threshold_exceeded,
      })),
    [volumetric]
  );

  return (
    <div className="flex flex-col gap-6 bg-white" data-testid="telemetry-view">
      {/* CSV export bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="k-label">// Network Telemetry Grid</p>
        </div>
        <a
          href={`${BACKEND}/api/pharmacy/export/audit-log.csv`}
          data-testid="telemetry-export-csv"
          className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-700 px-4 py-2 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-emerald-50 transition-colors"
        >
          <Download size={12} />
          Export Audit CSV
        </a>
      </div>

      {/* Volumetric Saturation Banner */}
      {exceededBatches.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 border"
          style={{ borderColor: "#EF4444", background: "#FEF2F2" }}
          data-testid="volumetric-critical-banner"
        >
          <AlertTriangle size={20} className="text-red-700 mt-0.5" />
          <div>
            <p className="font-medium text-slate-900">
              CRITICAL: Volumetric Threshold Exceeded (Suspected Batch Cloning Ring)
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {exceededBatches.length} batch(es) have surpassed 40,000 units cumulative — suspected clone circulation.
            </p>
          </div>
        </div>
      )}

      {/* Timeline area chart */}
      <div className="relative z-10 p-6 bg-white k-panel md:p-8" data-testid="telemetry-timeline-panel">
        <div className="flex items-center gap-3 mb-6">
          <Activity size={18} className="text-emerald-700" />
          <h2 className="text-xl font-display text-slate-900">Scan Activity · Last 7 Days</h2>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">No recent scan activity.</p>
        ) : (
          <div className="h-[220px]" data-testid="timeline-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 12, bottom: 24, left: 8 }}>
                <defs>
                  <linearGradient id="k-safe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="k-anom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#64748B", fontFamily: "JetBrains Mono", fontSize: 9 }}
                  tickFormatter={(h) => (typeof h === "string" ? h.slice(5) : h)}
                  interval={Math.max(Math.floor(timeline.length / 12), 1)}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontFamily: "JetBrains Mono", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                    color: "#0F172A",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#64748B" }}
                />
                <Area
                  type="monotone"
                  dataKey="valid"
                  name="Valid Scans"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#k-safe)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="anomaly"
                  name="Anomaly Flagged"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#k-anom)"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        {/* Volumetric chart */}
        <div className="relative z-10 p-6 bg-white k-panel md:p-8" data-testid="volumetric-chart-panel">
          <div className="flex items-center gap-3 mb-6">
          <Waves size={18} className="text-emerald-700" />
          <h2 className="text-xl font-display text-slate-900">Batch Volume Distribution</h2>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 12, bottom: 40, left: 8 }}>
                <XAxis
                  dataKey="batch"
                  tick={{ fill: "#E2E8F0", fontFamily: "JetBrains Mono", fontSize: 10 }}
                  angle={-38}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontFamily: "JetBrains Mono", fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                    color: "#0F172A",
                  }}
                />
                <ReferenceLine
                  y={threshold}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `Threshold ${threshold.toLocaleString()}`,
                    fill: "#EF4444",
                    fontSize: 11,
                    fontFamily: "JetBrains Mono",
                    position: "insideTopRight",
                  }}
                />
                <Bar dataKey="total" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.exceeded ? "#EF4444" : "#E2E8F0"}
                      stroke={entry.exceeded ? "#EF4444" : "#E2E8F0"}
                      strokeOpacity={0.25}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spatial teleportation list */}
        <div className="relative z-10 p-6 bg-white k-panel md:p-8" data-testid="spatial-panel">
          <div className="flex items-center gap-3 mb-6">
          <MapPin size={18} className="text-red-700" />
          <h2 className="text-xl font-display text-slate-900">Verification Trends by City</h2>
          </div>
          {spatial.length === 0 ? (
            <p className="text-sm text-slate-400">No spatial anomalies within 12h window.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-auto pr-1" data-testid="spatial-list">
              {spatial.slice(0, 10).map((a, i) => (
                <div
                  key={i}
                  className="p-3 border border-red-200"
                  style={{ background: "#FEF2F2" }}
                  data-testid={`spatial-item-${a.batch_number}`}
                >
                  <p className="text-sm font-medium text-slate-900">{a.batch_number}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {a.from_city} → {a.to_city}
                  </p>
                  <p className="font-mono text-[10px] text-red-700 mt-1">
                    Gap {a.gap_hours}h
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security alerts + CDSCO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative z-10 p-6 bg-white k-panel md:p-8" data-testid="security-alerts-panel">
          <div className="flex items-center gap-3 mb-6">
          <Radar size={18} className="text-red-700" />
          <h2 className="text-xl font-display text-slate-900">Risk Alerts</h2>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400">Network clean.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-auto pr-1">
              {alerts.slice(0, 20).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 border border-slate-200"
                  data-testid={`alert-${a.target_batch_number}`}
                >
                  <div>
                    <p className="text-sm text-slate-900">{a.alert_type}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-1">
                      {a.target_batch_number} · {a.target_medicine_name || "—"}
                    </p>
                  </div>
                  <span
                    className="font-mono text-[10px] tracking-[0.25em] uppercase px-2 py-1 border"
                    style={{
                      borderColor:
                        a.severity === "Critical" ? "#EF4444" : "#F59E0B",
                      color: a.severity === "Critical" ? "#EF4444" : "#F59E0B",
                      backgroundColor: a.severity === "Critical" ? "#EF44440a" : "F59E0B0a"
                    }}
                  >
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 p-6 bg-white k-panel md:p-8" data-testid="cdsco-panel">
          <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={18} className="text-amber-600" />
          <h2 className="text-xl font-display text-slate-900">Recall Intelligence</h2>
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-auto pr-1">
            {recalls.map((r) => (
              <div
                key={r.id}
                  className="p-3 border border-amber-200 bg-amber-50"
                data-testid={`recall-${r.target_batch_number}`}
              >
                <p className="text-sm text-slate-900">{r.target_medicine_name}</p>
                <p className="font-mono text-[10px] text-amber-600 mt-1">
                  Batch {r.target_batch_number} · {r.date_published}
                </p>
                  <p className="mt-1 text-xs text-slate-500">{r.hazard_classification}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
