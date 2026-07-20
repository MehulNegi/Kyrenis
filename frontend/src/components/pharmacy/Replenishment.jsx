import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { AlertTriangle, Timer, FileText, Zap, Plus, Trash2, Send, X } from "lucide-react";
import Autocomplete from "@/components/Autocomplete";

export default function Replenishment() {
  const [low, setLow] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [pos, setPos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [distributors, setDistributors] = useState([]);

  const load = async () => {
    try {
      const [l, e, p, m, d] = await Promise.all([
        api.get("/pharmacy/replenishment/low-stock"),
        api.get("/pharmacy/replenishment/expiring"),
        api.get("/pharmacy/purchase-orders"),
        api.get("/pharmacy/medicines"),
        api.get("/pharmacy/distributors"),
      ]);
      setLow(l.data.low_stock);
      setExpiring(e.data.expiring);
      setPos(p.data.purchase_orders);
      setMedicines(m.data.medicines);
      setDistributors(d.data.distributors);
    } catch (err) {
      toast.error(formatApiErrorDetail(err?.response?.data?.detail) || err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const autoGeneratePO = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/pharmacy/replenishment/generate-po");
      if (data.po) {
        toast.success(`Auto-PO ${data.po.po_number} generated`);
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
    <div className="flex flex-col gap-6" data-testid="replenishment-view">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="k-panel p-6 md:p-8" data-testid="low-stock-panel">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-[#EF4444]" />
              <h2 className="font-display text-white text-xl">Low-Stock Queue</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={autoGeneratePO}
                disabled={busy || low.length === 0}
                data-testid="generate-po-btn"
                className="inline-flex items-center gap-2 border border-[#10B981]/50 text-[#10B981] px-4 py-2 text-[11px] tracking-[0.14em] hover:bg-[#10B981]/10 disabled:opacity-40 transition-colors"
              >
                <Zap size={12} />
                Auto-Generate PO
              </button>
              <button
                onClick={() => setShowManual(true)}
                data-testid="open-manual-po-btn"
                className="inline-flex items-center gap-2 border border-[#E2E8F0]/25 text-[#E2E8F0] px-4 py-2 text-[11px] tracking-[0.14em] hover:text-white hover:border-white transition-colors"
              >
                <Plus size={12} />
                Manual PO
              </button>
            </div>
          </div>

          {low.length === 0 ? (
            <p className="text-[#E2E8F0]/55 text-sm">All items above safety threshold.</p>
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
                    <p className="font-display text-[#EF4444] text-lg leading-none">
                      {item.total_stock}
                    </p>
                    <p className="text-[10px] text-[#E2E8F0]/50 mt-1">
                      / min {item.minimum_safety_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="k-panel p-6 md:p-8" data-testid="expiring-panel">
          <div className="flex items-center gap-3 mb-6">
            <Timer size={18} className="text-[#F59E0B]" />
            <h2 className="font-display text-white text-xl">Expiring · Next 60 Days</h2>
          </div>
          {expiring.length === 0 ? (
            <p className="text-[#E2E8F0]/55 text-sm">No near-expiry stock detected.</p>
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
                    <p className="text-[11px] text-[#E2E8F0]/60">
                      Batch {b.batch_number} · qty {b.current_stock_qty}
                    </p>
                  </div>
                  <p className="text-[#F59E0B] text-sm">{b.expiry_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="k-panel p-6 md:p-8" data-testid="po-history-panel">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={18} className="text-[#E2E8F0]" />
          <h2 className="font-display text-white text-xl">Purchase Orders</h2>
        </div>

        {pos.length === 0 ? (
          <p className="text-[#E2E8F0]/55 text-sm">No purchase orders yet.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm" data-testid="po-table">
              <thead>
                <tr className="text-left border-b border-[#E2E8F0]/12 text-[11px] text-[#E2E8F0]/60 tracking-[0.14em] uppercase">
                  <th className="py-3">PO #</th>
                  <th className="py-3">Mode</th>
                  <th className="py-3">Lines</th>
                  <th className="py-3 text-right">Estimated</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((p) => (
                  <tr key={p.id} className="border-b border-[#E2E8F0]/8" data-testid={`po-row-${p.po_number}`}>
                    <td className="py-3 font-mono text-xs text-white">{p.po_number}</td>
                    <td className="py-3 text-[#E2E8F0]/85">{p.creation_mode || "Auto"}</td>
                    <td className="py-3 text-[#E2E8F0]/85">{p.lines.length}</td>
                    <td className="py-3 text-right text-white">₹{p.estimated_total.toFixed(2)}</td>
                    <td className="py-3">
                      <span className="border border-[#10B981]/50 text-[#10B981] px-2 py-1 text-[10px] tracking-[0.14em]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#E2E8F0]/85">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showManual && (
        <ManualPOModal
          medicines={medicines}
          distributors={distributors}
          onClose={() => setShowManual(false)}
          onCreated={async () => {
            setShowManual(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ManualPOModal({ medicines, distributors, onClose, onCreated }) {
  const [distributorId, setDistributorId] = useState("");
  const [delivery, setDelivery] = useState(
    new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ medicine_id: "", quantity: 10 }]);
  const [busy, setBusy] = useState(false);

  const setLine = (i, k, v) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  const submit = async (e) => {
    e.preventDefault();
    if (!distributorId) return toast.error("Select a distributor");
    const cleanLines = lines.filter((l) => l.medicine_id && l.quantity > 0);
    if (cleanLines.length === 0) return toast.error("Add at least one line");
    setBusy(true);
    try {
      const { data } = await api.post("/pharmacy/purchase-orders/manual", {
        distributor_id: distributorId,
        expected_delivery_date: delivery,
        notes,
        lines: cleanLines,
      });
      toast.success(`Manual PO ${data.po.po_number} created`);
      onCreated?.();
    } catch (err) {
      toast.error(formatApiErrorDetail(err?.response?.data?.detail) || err.message);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-start justify-center overflow-auto p-4" data-testid="manual-po-modal">
      <form
        onSubmit={submit}
        className="k-panel p-6 md:p-8 w-full max-w-[720px] flex flex-col gap-5 mt-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="k-label">Manual Purchase Order</p>
            <h3 className="font-display text-white text-2xl mt-1">Create a new PO</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="manual-po-close"
            className="w-9 h-9 border border-[#E2E8F0]/20 inline-flex items-center justify-center hover:border-white hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="k-label mb-2">Distributor</p>
            <Autocomplete
              options={distributors}
              value={distributorId}
              testid="manual-po-distributor"
              placeholder="Search distributor…"
              getLabel={(d) => d.company_name}
              getSublabel={(d) => `${d.hub_city || ""} · ${d.wholesale_license_number}`}
              onChange={(item) => setDistributorId(item ? item.id : "")}
            />
          </div>
          <div>
            <p className="k-label mb-2">Expected Delivery</p>
            <input
              type="date"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              data-testid="manual-po-delivery"
              className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="k-label">Line Items</p>
            <button
              type="button"
              onClick={() => setLines((ls) => [...ls, { medicine_id: "", quantity: 10 }])}
              data-testid="manual-po-add-line"
              className="inline-flex items-center gap-1 border border-[#E2E8F0]/25 px-3 py-1.5 text-[11px] hover:text-white hover:border-white transition-colors"
            >
              <Plus size={12} />
              Add row
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[280px] overflow-auto pr-1">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_120px_auto] gap-2 items-start" data-testid={`manual-po-line-${i}`}>
                <Autocomplete
                  options={medicines}
                  value={l.medicine_id}
                  testid={`manual-po-medicine-${i}`}
                  placeholder="Search medicine…"
                  getLabel={(m) => m.brand_name}
                  getSublabel={(m) => m.generic_composition}
                  onChange={(item) => setLine(i, "medicine_id", item ? item.id : "")}
                />
                <input
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) => setLine(i, "quantity", parseInt(e.target.value, 10) || 1)}
                  data-testid={`manual-po-qty-${i}`}
                  className="px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm text-right focus:border-[#10B981] focus:outline-none"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                    aria-label="Remove line"
                    data-testid={`manual-po-remove-${i}`}
                    className="w-11 h-11 border border-[#E2E8F0]/20 inline-flex items-center justify-center text-[#EF4444] hover:border-[#EF4444] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="k-label mb-2">Notes (optional)</p>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="manual-po-notes"
            className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          data-testid="manual-po-submit"
          className="py-3 bg-white text-[#1E2B4E] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-50"
        >
          <Send size={14} />
          Create Purchase Order
        </button>
      </form>
    </div>
  );
}
