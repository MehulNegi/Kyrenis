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
    <div className="relative z-10 flex flex-col gap-6 bg-white" data-testid="replenishment-view">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 k-panel md:p-8" data-testid="low-stock-panel">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-700" />
              <h2 className="text-xl font-display text-slate-900">Low-Stock Queue</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={autoGeneratePO}
                disabled={busy || low.length === 0}
                data-testid="generate-po-btn"
                className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-700 px-4 py-2 text-[11px] tracking-[0.14em] hover:bg-emerald-50 disabled:opacity-40 transition-colors"
              >
                <Zap size={12} />
                Auto-Generate PO
              </button>
              <button
                onClick={() => setShowManual(true)}
                data-testid="open-manual-po-btn"
                className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 text-[11px] tracking-[0.14em] hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <Plus size={12} />
                Manual PO
              </button>
            </div>
          </div>

          {low.length === 0 ? (
            <p className="text-sm text-slate-400">All items above safety threshold.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[380px] overflow-auto pr-1" data-testid="low-stock-list">
              {low.map((item) => (
                <div
                  key={item.medicine.id}
                  className="flex items-center justify-between p-3 border border-red-200"
                  style={{ background: "#FEF2F2" }}
                  data-testid={`low-stock-item-${item.medicine.brand_name}`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.medicine.brand_name}</p>
                    <p className="text-xs text-slate-500">{item.medicine.generic_composition}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg leading-none text-red-700 font-display">
                      {item.total_stock}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      / min {item.minimum_safety_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 k-panel md:p-8" data-testid="expiring-panel">
          <div className="flex items-center gap-3 mb-6">
              <Timer size={18} className="text-amber-600" />
              <h2 className="text-xl font-display text-slate-900">Expiring · Next 60 Days</h2>
          </div>
          {expiring.length === 0 ? (
            <p className="text-sm text-slate-400">No near-expiry stock detected.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[380px] overflow-auto pr-1" data-testid="expiring-list">
              {expiring.slice(0, 20).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 border border-amber-200"
                  style={{ background: "#FFFBEB" }}
                  data-testid={`expiring-item-${b.batch_number}`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {b.medicine?.brand_name || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Batch {b.batch_number} · qty {b.current_stock_qty}
                    </p>
                  </div>
                  <p className="text-sm text-amber-600">{b.expiry_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 k-panel md:p-8" data-testid="po-history-panel">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={18} className="text-slate-600" />
          <h2 className="text-xl font-display text-slate-900">Purchase Orders</h2>
        </div>

        {pos.length === 0 ? (
            <p className="text-sm text-slate-400">No purchase orders yet.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm" data-testid="po-table">
              <thead>
                <tr className="text-left border-b border-slate-200 text-[11px] text-slate-500 tracking-[0.14em] uppercase">
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
                  <tr key={p.id} className="border-b border-slate-200" data-testid={`po-row-${p.po_number}`}>
                    <td className="py-3 font-mono text-xs text-slate-900">{p.po_number}</td>
                    <td className="py-3 text-slate-700">{p.creation_mode || "Auto"}</td>
                    <td className="py-3 text-slate-700">{p.lines.length}</td>
                    <td className="py-3 text-right text-slate-900">₹{p.estimated_total.toFixed(2)}</td>
                    <td className="py-3">
                      <span className="border border-emerald-200 text-emerald-700 px-2 py-1 text-[10px] tracking-[0.14em]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700">
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
    <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-start justify-center overflow-auto p-4" data-testid="manual-po-modal">
      <form
        onSubmit={submit}
        className="k-panel p-6 md:p-8 w-full max-w-[720px] flex flex-col gap-5 mt-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="k-label">Manual Purchase Order</p>
            <h3 className="mt-1 text-2xl font-display text-slate-900">Create a new PO</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="manual-po-close"
            className="inline-flex items-center justify-center transition-colors border w-9 h-9 border-slate-200 hover:border-slate-300 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 k-label">Distributor</p>
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
            <p className="mb-2 k-label">Expected Delivery</p>
            <input
              type="date"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              data-testid="manual-po-delivery"
              className="w-full px-3 py-3 text-sm transition-colors bg-white border border-slate-200 text-slate-900 focus:border-emerald-700 focus:outline-none"
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
              className="inline-flex items-center gap-1 border border-slate-200 px-3 py-1.5 text-[11px] hover:text-slate-900 hover:border-slate-300 transition-colors"
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
                  className="px-3 py-3 text-sm text-right bg-white border border-slate-200 text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                    aria-label="Remove line"
                    data-testid={`manual-po-remove-${i}`}
                    className="inline-flex items-center justify-center text-red-700 transition-colors border w-11 h-11 border-slate-200 hover:border-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 k-label">Notes (optional)</p>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="manual-po-notes"
              className="w-full px-3 py-3 text-sm transition-colors bg-white border border-slate-200 text-slate-900 focus:border-emerald-700 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          data-testid="manual-po-submit"
          className="py-3 bg-white text-slate-900 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98] transition-colors disabled:opacity-50"
        >
          <Send size={14} />
          Create Purchase Order
        </button>
      </form>
    </div>
  );
}
