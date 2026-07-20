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
    <div className="flex flex-col gap-6" data-testid="telemetry-view">
      {/* CSV export bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="k-label">// Network Telemetry Grid</p>
          <p className="text-[#E2E8F0]/60 text-sm mt-1">
            Live signals across {volumetric.length} tracked batches · {alerts.length} unresolved anomalies.
          </p>
        </div>
        <a
          href={`${BACKEND}/api/pharmacy/export/audit-log.csv`}
          data-testid="telemetry-export-csv"
          className="inline-flex items-center gap-2 border border-[#10B981]/50 text-[#10B981] px-4 py-2 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-[#10B981]/10 transition-colors"
        >
          <Download size={12} />
          Export Audit CSV
        </a>
      </div>

      {/* Volumetric Saturation Banner */}
      {exceededBatches.length > 0 && (
        <div
          className="border p-4 flex items-start gap-3"
          style={{ borderColor: "#EF4444", background: "rgba(239,68,68,0.09)" }}
          data-testid="volumetric-critical-banner"
        >
          <AlertTriangle size={20} className="text-[#EF4444] mt-0.5" />
          <div>
            <p className="text-white font-medium">
              CRITICAL: Volumetric Threshold Exceeded (Suspected Batch Cloning Ring)
            </p>
            <p className="text-[#E2E8F0]/70 text-sm mt-1">
              {exceededBatches.length} batch(es) have surpassed 40,000 units cumulative — suspected clone circulation.
            </p>
          </div>
        </div>
      )}

      {/* Timeline area chart */}
      <div className="k-panel p-6 md:p-8" data-testid="telemetry-timeline-panel">
        <div className="flex items-center gap-3 mb-6">
          <Activity size={18} className="text-[#10B981]" />
          <h2 className="font-display text-white text-xl">Scan Activity · Last 7 Days</h2>
        </div>
        {timeline.length === 0 ? (
          <p className="text-[#E2E8F0]/50 text-sm">No recent scan activity.</p>
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
                <CartesianGrid stroke="rgba(226,232,240,0.08)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#E2E8F0", fontFamily: "JetBrains Mono", fontSize: 9 }}
                  tickFormatter={(h) => (typeof h === "string" ? h.slice(5) : h)}
                  interval={Math.max(Math.floor(timeline.length / 12), 1)}
                />
                <YAxis
                  tick={{ fill: "#E2E8F0", fontFamily: "JetBrains Mono", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1F2326",
                    border: "1px solid rgba(226,232,240,0.2)",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                    color: "#E2E8F0",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#E2E8F0" }}
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
        <div className="k-panel p-6 md:p-8" data-testid="volumetric-chart-panel">
          <div className="flex items-center gap-3 mb-6">
            <Waves size={18} className="text-[#10B981]" />
            <h2 className="font-display text-white text-xl">Batch Volume Distribution</h2>
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
                  tick={{ fill: "#E2E8F0", fontFamily: "JetBrains Mono", fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(30, 43, 78, 0.4)" }}
                  contentStyle={{
                    background: "#1F2326",
                    border: "1px solid rgba(226,232,240,0.2)",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                    color: "#E2E8F0",
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
                      fill={entry.exceeded ? "#EF4444" : "#1E2B4E"}
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
        <div className="k-panel p-6 md:p-8" data-testid="spatial-panel">
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={18} className="text-[#EF4444]" />
            <h2 className="font-display text-white text-xl">Verification Trends by City</h2>
          </div>
          {spatial.length === 0 ? (
            <p className="text-[#E2E8F0]/50 text-sm">No spatial anomalies within 12h window.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-auto pr-1" data-testid="spatial-list">
              {spatial.slice(0, 10).map((a, i) => (
                <div
                  key={i}
                  className="border border-[#EF4444]/40 p-3"
                  style={{ background: "rgba(239,68,68,0.05)" }}
                  data-testid={`spatial-item-${a.batch_number}`}
                >
                  <p className="font-mono text-white text-sm">{a.batch_number}</p>
                  <p className="text-[#E2E8F0]/70 text-xs mt-1">
                    {a.from_city} → {a.to_city}
                  </p>
                  <p className="font-mono text-[10px] text-[#EF4444] mt-1">
                    Gap {a.gap_hours}h
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security alerts + CDSCO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="k-panel p-6 md:p-8" data-testid="security-alerts-panel">
          <div className="flex items-center gap-3 mb-6">
            <Radar size={18} className="text-[#EF4444]" />
            <h2 className="font-display text-white text-xl">Risk Alerts</h2>
          </div>
          {alerts.length === 0 ? (
            <p className="text-[#E2E8F0]/50 text-sm">Network clean.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-auto pr-1">
              {alerts.slice(0, 20).map((a) => (
                <div
                  key={a.id}
                  className="border border-[#E2E8F0]/12 p-3 flex items-center justify-between"
                  data-testid={`alert-${a.target_batch_number}`}
                >
                  <div>
                    <p className="text-white text-sm">{a.alert_type}</p>
                    <p className="font-mono text-[10px] text-[#E2E8F0]/60 mt-1">
                      {a.target_batch_number} · {a.target_medicine_name || "—"}
                    </p>
                  </div>
                  <span
                    className="font-mono text-[10px] tracking-[0.25em] uppercase px-2 py-1 border"
                    style={{
                      borderColor:
                        a.severity === "Critical" ? "#EF4444" : "#F59E0B",
                      color: a.severity === "Critical" ? "#EF4444" : "#F59E0B",
                    }}
                  >
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="k-panel p-6 md:p-8" data-testid="cdsco-panel">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={18} className="text-[#F59E0B]" />
            <h2 className="font-display text-white text-xl">Recall Intelligence</h2>
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-auto pr-1">
            {recalls.map((r) => (
              <div
                key={r.id}
                className="border border-[#F59E0B]/30 p-3"
                data-testid={`recall-${r.target_batch_number}`}
              >
                <p className="text-white text-sm">{r.target_medicine_name}</p>
                <p className="font-mono text-[10px] text-[#F59E0B] mt-1">
                  Batch {r.target_batch_number} · {r.date_published}
                </p>
                <p className="text-[#E2E8F0]/60 text-xs mt-1">{r.hazard_classification}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
