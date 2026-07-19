import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { PackageSearch, AlertTriangle, Timer, FileText, Zap } from "lucide-react";

export default function Replenishment() {
  const [low, setLow] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [pos, setPos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [lastPo, setLastPo] = useState(null);

  const load = async () => {
    try {
      const [l, e, p] = await Promise.all([
        api.get("/pharmacy/replenishment/low-stock"),
        api.get("/pharmacy/replenishment/expiring"),
        api.get("/pharmacy/purchase-orders"),
      ]);
      setLow(l.data.low_stock);
      setExpiring(e.data.expiring);
      setPos(p.data.purchase_orders);
    } catch (err) {
      toast.error(formatApiErrorDetail(err?.response?.data?.detail) || err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generatePO = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/pharmacy/replenishment/generate-po");
      if (data.po) {
        setLastPo(data.po);
        toast.success(`PO ${data.po.po_number} generated`);
        await load();
      } else {
        toast.info(data.message || "Nothing to reorder");
      }
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6" data-testid="replenishment-view">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="k-panel p-6 md:p-8" data-testid="low-stock-panel">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-[#EF4444]" />
              <h2 className="font-display text-white text-xl">Low-Stock Queue</h2>
            </div>
            <button
              onClick={generatePO}
              disabled={busy || low.length === 0}
              data-testid="generate-po-btn"
              className="inline-flex items-center gap-2 border border-[#10B981]/50 text-[#10B981] px-4 py-2 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-[#10B981]/10 disabled:opacity-40 transition-colors"
            >
              <Zap size={12} />
              Auto-Generate PO
            </button>
          </div>

          {low.length === 0 ? (
            <p className="text-[#E2E8F0]/50 text-sm">All items above safety threshold.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[380px] overflow-auto pr-1" data-testid="low-stock-list">
              {low.map((item) => (
                <div
                  key={item.medicine.id}
                  className="border border-[#EF4444]/25 p-3 flex items-center justify-between"
                  style={{ background: "rgba(239,68,68,0.05)" }}
                  data-testid={`low-stock-item-${item.medicine.brand_name}`}
                >
                  <div>
                    <p className="text-white text-sm font-medium">{item.medicine.brand_name}</p>
                    <p className="text-[#E2E8F0]/60 text-xs">{item.medicine.generic_composition}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[#EF4444] text-lg leading-none">
                      {item.total_stock}
                    </p>
                    <p className="font-mono text-[10px] text-[#E2E8F0]/50 mt-1">
                      / min {item.minimum_safety_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring within 60 days */}
        <div className="k-panel p-6 md:p-8" data-testid="expiring-panel">
          <div className="flex items-center gap-3 mb-6">
            <Timer size={18} className="text-[#F59E0B]" />
            <h2 className="font-display text-white text-xl">Expiring · Next 60 Days</h2>
          </div>

          {expiring.length === 0 ? (
            <p className="text-[#E2E8F0]/50 text-sm">No near-expiry stock detected.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[380px] overflow-auto pr-1" data-testid="expiring-list">
              {expiring.slice(0, 20).map((b) => (
                <div
                  key={b.id}
                  className="border border-[#F59E0B]/30 p-3 flex items-center justify-between"
                  style={{ background: "rgba(245,158,11,0.05)" }}
                  data-testid={`expiring-item-${b.batch_number}`}
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {b.medicine?.brand_name || "—"}
                    </p>
                    <p className="font-mono text-[10px] text-[#E2E8F0]/60">
                      Batch {b.batch_number} · qty {b.current_stock_qty}
                    </p>
                  </div>
                  <p className="font-mono text-[#F59E0B] text-sm">{b.expiry_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PO history */}
      <div className="k-panel p-6 md:p-8" data-testid="po-history-panel">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={18} className="text-[#E2E8F0]" />
          <h2 className="font-display text-white text-xl">Purchase Orders</h2>
        </div>

        {lastPo && (
          <div className="border border-[#10B981]/40 p-4 mb-4" data-testid="latest-po-callout">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#10B981]">
              // Just Generated
            </p>
            <p className="text-white text-sm mt-2">
              {lastPo.po_number} · {lastPo.lines.length} line items · ₹
              {lastPo.estimated_total.toFixed(2)}
            </p>
          </div>
        )}

        {pos.length === 0 ? (
          <p className="text-[#E2E8F0]/50 text-sm">No purchase orders yet.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm" data-testid="po-table">
              <thead>
                <tr className="text-left border-b border-[#E2E8F0]/12">
                  <Th>PO #</Th>
                  <Th>Lines</Th>
                  <Th>Estimated</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {pos.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#E2E8F0]/8"
                    data-testid={`po-row-${p.po_number}`}
                  >
                    <Td mono>{p.po_number}</Td>
                    <Td>{p.lines.length}</Td>
                    <Td mono>₹{p.estimated_total.toFixed(2)}</Td>
                    <Td>
                      <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#10B981]">
                        {p.status}
                      </span>
                    </Td>
                    <Td mono>{new Date(p.created_at).toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const Th = ({ children }) => (
  <th className="py-3 pr-6 font-mono text-[10px] tracking-[0.25em] uppercase text-[#E2E8F0]/60">
    {children}
  </th>
);
const Td = ({ children, mono }) => (
  <td className={`py-3 pr-6 text-[#E2E8F0]/90 ${mono ? "font-mono text-xs" : "text-sm"}`}>
    {children}
  </td>
);
