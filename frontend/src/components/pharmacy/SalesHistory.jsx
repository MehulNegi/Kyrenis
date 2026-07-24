import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { Receipt, Search, Printer, RotateCcw } from "lucide-react";
import InvoicePrint from "@/components/pharmacy/InvoicePrint";

export default function SalesHistory() {
  const [receipts, setReceipts] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = async (query = "") => {
    setBusy(true);
    try {
      const { data } = await api.get(`/pharmacy/pos/receipts${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setReceipts(data.receipts);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const summary = receipts.reduce(
    (acc, r) => ({
      count: acc.count + 1,
      total: acc.total + (r.grand_total || 0),
      gst: acc.gst + (r.gst_total || 0),
    }),
    { count: 0, total: 0, gst: 0 }
  );

  return (
    <div className="flex flex-col gap-6" data-testid="sales-history-view">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCell label="Invoices" value={summary.count} />
        <SummaryCell label="Revenue" value={`₹${summary.total.toFixed(2)}`} />
        <SummaryCell label="GST Collected" value={`₹${summary.gst.toFixed(2)}`} />
      </div>

      <div className="k-panel p-6 md:p-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
          <Receipt size={18} className="text-emerald-700" />
          <h2 className="font-display text-slate-900 text-xl">Sales & Invoice History</h2>
          </div>
            <div className="flex items-center gap-2 border border-slate-200 px-3 focus-within:border-emerald-700 transition-colors w-full md:w-[380px]">
              <Search size={14} className="text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(q)}
                placeholder="Search by invoice # or medicine name"
                data-testid="sales-search-input"
                className="flex-1 py-3 bg-transparent text-slate-900 text-sm focus:outline-none placeholder:text-slate-400"
            />
            <button
              onClick={() => load(q)}
              data-testid="sales-search-btn"
              className="text-[11px] text-emerald-700 hover:text-slate-900 tracking-[0.14em]"
            >
              Search
            </button>
          </div>
        </div>

        <div className="k-divider my-6" />

        {busy ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : receipts.length === 0 ? (
          <p className="text-slate-400 text-sm" data-testid="sales-empty">
            No invoices match your search.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm" data-testid="sales-table">
              <thead>
                <tr className="text-left border-b border-slate-200 text-[11px] text-slate-500 tracking-[0.14em] uppercase">
                  <th className="py-3">Invoice #</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Product</th>
                  <th className="py-3 text-right">Qty</th>
                  <th className="py-3 text-right">Amount</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => {
                  const primary = r.lines?.[0];
                  const productLabel = primary
                    ? `${primary.medicine.brand_name}${r.lines.length > 1 ? ` +${r.lines.length - 1}` : ""}`
                    : "—";
                  const totalQty = r.lines?.reduce(
                    (a, l) => a + (l.requested_qty || 0),
                    0
                  );
                  return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-200"
                    data-testid={`sales-row-${r.invoice_number}`}
                  >
                    <td className="py-3 font-mono text-xs text-slate-900">{r.invoice_number}</td>
                    <td className="py-3 text-slate-700">
                      {new Date(r.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-slate-700">{productLabel}</td>
                    <td className="py-3 text-right text-slate-700">{totalQty}</td>
                    <td className="py-3 text-right text-slate-900">₹{r.grand_total?.toFixed(2)}</td>
                    <td className="py-3">
                      <span className="border border-emerald-200 text-emerald-700 px-2 py-1 text-[10px] tracking-[0.14em]">
                          {r.status || "Paid"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setPreview(r)}
                          data-testid={`sales-reprint-${r.invoice_number}`}
                          className="inline-flex items-center gap-1 border border-slate-200 px-3 py-1.5 text-[11px] hover:text-slate-900 hover:border-slate-300 transition-colors"
                        >
                          <Printer size={12} />
                          Reprint
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {preview && <InvoicePrint receipt={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function SummaryCell({ label, value }) {
  return (
      <div className="k-panel p-5">
        <p className="text-[11px] text-slate-400 tracking-[0.14em]">{label}</p>
        <p className="font-display text-slate-900 text-2xl mt-2">{value}</p>
    </div>
  );
}
