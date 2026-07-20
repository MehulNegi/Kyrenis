import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { ShieldAlert, AlertOctagon, Filter, RefreshCw } from "lucide-react";

const severityStyle = (sev) => {
  const s = (sev || "").toLowerCase();
  if (s === "critical") return "text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/10";
  if (s === "high") return "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10";
  return "text-[#E2E8F0]/80 border-[#E2E8F0]/20 bg-[#E2E8F0]/5";
};

const categoryStyle = (cat) => {
  const c = (cat || "").toLowerCase();
  if (c === "recall") return "text-[#EF4444]";
  if (c === "spurious") return "text-[#F97316]";
  if (c === "theft") return "text-[#8B5CF6]";
  if (c === "nsq") return "text-[#F59E0B]";
  return "text-[#E2E8F0]/70";
};

export default function SecurityRecalls() {
  const [tab, setTab] = useState("recalls");
  const [recalls, setRecalls] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [r, a] = await Promise.all([
        api.get(`/pharmacy/recalls`),
        api.get(`/pharmacy/security-alerts`),
      ]);
      const rList = r.data?.recalls ?? r.data ?? [];
      const aList = a.data?.alerts ?? a.data ?? [];
      setRecalls(Array.isArray(rList) ? rList : []);
      setAlerts(Array.isArray(aList) ? aList : []);
    } catch (e) {
      setError(formatApiErrorDetail(e?.response?.data?.detail) || "Unable to load security & recalls feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRecalls = useMemo(() => {
    if (filter === "all") return recalls;
    return recalls.filter(
      (r) => (r.alert_category || "").toLowerCase() === filter
    );
  }, [recalls, filter]);

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter(
      (a) => (a.severity || "").toLowerCase() === filter
    );
  }, [alerts, filter]);

  return (
    <section data-testid="security-recalls-section" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="k-label">Regulatory Feed</p>
          <h2 className="font-display text-white text-2xl md:text-3xl tracking-tight mt-2">
            Security &amp; Recalls
          </h2>
          <p className="text-[#E2E8F0]/65 text-sm mt-1">
            CDSCO advisories cross-referenced with in-pharmacy telemetry saturation and spatial
            anomaly hits.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          data-testid="security-recalls-refresh"
          className="inline-flex items-center gap-2 border border-[#E2E8F0]/20 px-3 py-2 text-sm text-[#E2E8F0]/80 hover:text-white hover:border-white/40 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div
        className="inline-flex border border-[#E2E8F0]/12 p-1"
        role="tablist"
        data-testid="security-recalls-tabs"
      >
        <button
          onClick={() => {
            setTab("recalls");
            setFilter("all");
          }}
          role="tab"
          aria-selected={tab === "recalls"}
          data-testid="security-recalls-tab-recalls"
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm ${
            tab === "recalls" ? "bg-[#1E2B4E] text-white" : "text-[#E2E8F0]/70 hover:text-white"
          }`}
        >
          <ShieldAlert size={14} />
          CDSCO Recalls ({recalls.length})
        </button>
        <button
          onClick={() => {
            setTab("alerts");
            setFilter("all");
          }}
          role="tab"
          aria-selected={tab === "alerts"}
          data-testid="security-recalls-tab-alerts"
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm ${
            tab === "alerts" ? "bg-[#1E2B4E] text-white" : "text-[#E2E8F0]/70 hover:text-white"
          }`}
        >
          <AlertOctagon size={14} />
          Security Alerts ({alerts.length})
        </button>
      </div>

      {error && (
        <div
          data-testid="security-recalls-error"
          className="border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#FCA5A5] px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      {tab === "recalls" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Filter size={12} className="text-[#E2E8F0]/50" />
            {[
              ["all", "All"],
              ["recall", "Recall"],
              ["spurious", "Spurious"],
              ["nsq", "NSQ"],
              ["theft", "Diversion"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                data-testid={`security-recalls-filter-${k}`}
                className={`px-3 py-1.5 border transition-colors ${
                  filter === k
                    ? "border-[#10B981] text-[#10B981]"
                    : "border-[#E2E8F0]/15 text-[#E2E8F0]/65 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            data-testid="security-recalls-recalls-list"
            className="border border-[#E2E8F0]/12 divide-y divide-[#E2E8F0]/10"
          >
            {loading && (
              <div className="px-4 py-6 text-[#E2E8F0]/50 text-sm">Loading CDSCO advisories…</div>
            )}
            {!loading && filteredRecalls.length === 0 && (
              <div className="px-4 py-6 text-[#E2E8F0]/50 text-sm">
                No advisories match the current filter.
              </div>
            )}
            {filteredRecalls.map((r, i) => (
              <div
                key={r.id || i}
                data-testid={`security-recalls-recall-row-${i}`}
                className="px-4 py-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-white/2.5"
              >
                <div className="md:w-56 shrink-0">
                  <p className="text-white font-medium text-sm">{r.product_name}</p>
                  <p className="text-[#E2E8F0]/60 text-xs mt-0.5">{r.generic_composition}</p>
                </div>
                <div className="md:w-40 shrink-0">
                  <p className="k-mono text-[#E2E8F0]/80 text-xs">{r.batch_number}</p>
                  <p className="text-[#E2E8F0]/55 text-[11px] mt-0.5">{r.manufacturer}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#E2E8F0]/85 text-sm">
                    {r.failure_reason || r.hazard_classification}
                  </p>
                  <p className="text-[#E2E8F0]/50 text-[11px] mt-1">
                    {r.reporting_authority} • {r.reporting_lab} •{" "}
                    {r.reporting_date || r.date_published}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-1 text-[11px] uppercase tracking-wider border ${severityStyle(
                      r.risk_score >= 95 ? "critical" : r.risk_score >= 80 ? "high" : "info"
                    )}`}
                  >
                    Risk {r.risk_score ?? "—"}
                  </span>
                  <span
                    className={`text-xs uppercase tracking-wider ${categoryStyle(
                      r.alert_category
                    )}`}
                  >
                    {r.alert_category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Filter size={12} className="text-[#E2E8F0]/50" />
            {[
              ["all", "All"],
              ["critical", "Critical"],
              ["high", "High"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                data-testid={`security-recalls-alert-filter-${k}`}
                className={`px-3 py-1.5 border transition-colors ${
                  filter === k
                    ? "border-[#10B981] text-[#10B981]"
                    : "border-[#E2E8F0]/15 text-[#E2E8F0]/65 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            data-testid="security-recalls-alerts-list"
            className="border border-[#E2E8F0]/12 divide-y divide-[#E2E8F0]/10"
          >
            {loading && (
              <div className="px-4 py-6 text-[#E2E8F0]/50 text-sm">Loading security alerts…</div>
            )}
            {!loading && filteredAlerts.length === 0 && (
              <div className="px-4 py-6 text-[#E2E8F0]/50 text-sm">
                No security alerts match the current filter.
              </div>
            )}
            {filteredAlerts.map((a, i) => (
              <div
                key={a.id || i}
                data-testid={`security-recalls-alert-row-${i}`}
                className="px-4 py-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="md:w-56 shrink-0">
                  <p className="text-white font-medium text-sm">{a.target_medicine_name}</p>
                  <p className="k-mono text-[#E2E8F0]/60 text-xs mt-0.5">
                    {a.target_batch_number}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#E2E8F0]/85 text-sm">{a.alert_type}</p>
                  {a.triggering_telemetry_json?.detail && (
                    <p className="text-[#E2E8F0]/55 text-[11px] mt-1">
                      {a.triggering_telemetry_json.detail}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-1 text-[11px] uppercase tracking-wider border ${severityStyle(
                      a.severity
                    )}`}
                  >
                    {a.severity}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-1 border ${
                      a.resolved_status
                        ? "border-[#10B981]/40 text-[#10B981]"
                        : "border-[#F59E0B]/40 text-[#F59E0B]"
                    }`}
                  >
                    {a.resolved_status ? "Resolved" : "Open"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
