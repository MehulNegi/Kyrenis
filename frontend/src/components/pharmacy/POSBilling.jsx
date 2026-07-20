import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Receipt, Printer, AlertTriangle, CheckCircle2 } from "lucide-react";
import Autocomplete from "@/components/Autocomplete";
import InvoicePrint from "@/components/pharmacy/InvoicePrint";

export default function POSBilling() {
  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [m, i] = await Promise.all([
          api.get("/pharmacy/medicines"),
          api.get("/pharmacy/inventory"),
        ]);
        setMedicines(m.data.medicines);
        setInventory(i.data.inventory);
      } catch (e) {
        toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
      }
    })();
  }, []);

  const stockByMed = useMemo(() => {
    const map = {};
    const today = new Date().toISOString().slice(0, 10);
    inventory.forEach((b) => {
      if (!map[b.medicine_id]) map[b.medicine_id] = { total: 0, dispensable: 0, expiredOnly: true, batches: [] };
      const entry = map[b.medicine_id];
      entry.total += b.current_stock_qty;
      if (b.expiry_date >= today) {
        entry.dispensable += b.current_stock_qty;
        entry.expiredOnly = false;
      }
      entry.batches.push(b);
    });
    Object.values(map).forEach((v) =>
      v.batches.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
    );
    return map;
  }, [inventory]);

  const addToCart = (item) => {
    if (!item) return;
    setCart((c) => {
      if (c.find((l) => l.medicine_id === item.id)) return c;
      return [...c, { medicine_id: item.id, quantity: 1 }];
    });
  };
  const updateQty = (medId, qty) =>
    setCart((c) =>
      c.map((l) => (l.medicine_id === medId ? { ...l, quantity: Math.max(1, qty) } : l))
    );
  const removeLine = (medId) => setCart((c) => c.filter((l) => l.medicine_id !== medId));

  const submit = async () => {
    if (cart.length === 0) return;
    setBusy(true);
    setReceipt(null);
    try {
      const { data } = await api.post("/pharmacy/pos/checkout", { items: cart });
      setReceipt(data);
      setCart([]);
      const inv = await api.get("/pharmacy/inventory");
      setInventory(inv.data.inventory);
      toast.success(`Invoice ${data.invoice_number} generated`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  const cartHasIssues = cart.some((l) => stockByMed[l.medicine_id]?.expiredOnly);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6" data-testid="pos-view">
      <div className="k-panel p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart size={18} className="text-[#10B981]" />
          <h2 className="font-display text-white text-xl">POS Checkout</h2>
        </div>

        <div>
          <p className="k-label mb-2">Add Medicine (search brand or generic)</p>
          <Autocomplete
            options={medicines}
            value=""
            testid="pos-medicine-select"
            placeholder="Search Crocin, Paracetamol, Atorvastatin…"
            getLabel={(m) => `${m.brand_name} · ${m.generic_composition}`}
            getSublabel={(m) => {
              const s = stockByMed[m.id];
              if (!s) return "No stock";
              if (s.expiredOnly) return "Expired only · billing locked";
              return `Dispensable stock ${s.dispensable} · total ${s.total}`;
            }}
            onChange={(item) => item && addToCart(item)}
          />
        </div>

        <div className="k-divider my-6" />

        {cart.length === 0 ? (
          <div className="border border-dashed border-[#E2E8F0]/15 p-8 text-center" data-testid="pos-cart-empty">
            <p className="text-[11px] text-[#E2E8F0]/55 tracking-[0.14em]">Cart empty</p>
            <p className="text-[#E2E8F0]/60 text-sm mt-2">
              Search for a medicine to start a checkout.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2" data-testid="pos-cart">
            {cart.map((line) => {
              const med = medicines.find((m) => m.id === line.medicine_id);
              const s = stockByMed[line.medicine_id];
              const locked = s?.expiredOnly;
              return (
                <div
                  key={line.medicine_id}
                  className={`border p-3 flex items-center gap-3 ${
                    locked ? "border-[#EF4444]/60" : "border-[#E2E8F0]/12"
                  }`}
                  style={locked ? { background: "rgba(239,68,68,0.06)" } : {}}
                  data-testid={`pos-cart-line-${med?.brand_name}`}
                >
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{med?.brand_name}</p>
                    <p className="text-[#E2E8F0]/55 text-xs">
                      {med?.generic_composition} · dispensable {s?.dispensable ?? 0}
                    </p>
                    {locked && (
                      <p className="text-[#EF4444] text-xs mt-1 inline-flex items-center gap-1" data-testid={`pos-expiry-lock-${med?.brand_name}`}>
                        <AlertTriangle size={12} />
                        Billing locked — all on-hand stock has expired.
                      </p>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    data-testid={`pos-cart-qty-${med?.brand_name}`}
                    onChange={(e) => updateQty(line.medicine_id, parseInt(e.target.value, 10))}
                    className="w-20 px-3 py-2 bg-black border border-[#E2E8F0]/20 text-white text-sm text-right focus:border-[#10B981] focus:outline-none"
                  />
                  <button
                    onClick={() => removeLine(line.medicine_id)}
                    data-testid={`pos-cart-remove-${med?.brand_name}`}
                    className="text-[#EF4444] hover:text-white p-2 border border-[#E2E8F0]/12 hover:border-[#EF4444] transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={submit}
          disabled={cart.length === 0 || busy || cartHasIssues}
          data-testid="pos-checkout-btn"
          className="mt-6 w-full py-3 bg-white text-[#1E2B4E] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-40"
        >
          <Receipt size={14} />
          {cartHasIssues ? "Resolve expiry lock to continue" : "Finalise & Generate Invoice"}
        </button>
      </div>

      <ReceiptPanel receipt={receipt} onPrint={() => setShowPrint(true)} />
      {showPrint && receipt && <InvoicePrint receipt={receipt} onClose={() => setShowPrint(false)} />}
    </div>
  );
}

function ReceiptPanel({ receipt, onPrint }) {
  if (!receipt) {
    return (
      <div className="k-panel p-6 flex flex-col items-center justify-center text-center min-h-[400px]" data-testid="pos-receipt-empty">
        <Receipt size={40} className="text-[#E2E8F0]/25" />
        <p className="mt-4 text-[11px] tracking-[0.14em] text-[#E2E8F0]/55">No invoice yet</p>
      </div>
    );
  }
  return (
    <div className="k-panel p-6 md:p-8" data-testid="pos-receipt">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="k-label">Invoice</p>
          <p className="text-white font-medium mt-1" data-testid="pos-receipt-number">
            {receipt.invoice_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 border border-[#10B981]/50 text-[#10B981] px-3 py-1.5 text-[11px] tracking-[0.14em]">
            <CheckCircle2 size={12} />
            {receipt.status}
          </span>
          <button
            onClick={onPrint}
            data-testid="pos-print-btn"
            className="inline-flex items-center gap-2 border border-[#E2E8F0]/25 px-3 py-1.5 text-[11px] hover:text-white hover:border-white transition-colors"
          >
            <Printer size={12} />
            Print
          </button>
        </div>
      </div>
      <p className="text-[#E2E8F0]/55 text-xs">
        {new Date(receipt.timestamp).toLocaleString()}
      </p>

      <div className="flex flex-col gap-3 mt-6">
        {receipt.lines.map((l, i) => (
          <div key={i} className="border border-[#E2E8F0]/12 p-4" data-testid={`pos-receipt-line-${i}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium">{l.medicine.brand_name}</p>
                <p className="text-[#E2E8F0]/55 text-xs">
                  {l.medicine.generic_composition} · qty {l.requested_qty}
                </p>
              </div>
              <p className="text-white text-sm">₹{l.line_total.toFixed(2)}</p>
            </div>
            <div className="mt-3 border-l border-[#10B981]/40 pl-3 flex flex-col gap-1">
              {l.deductions.map((d, j) => (
                <p key={j} className="text-[11px] text-[#E2E8F0]/60">
                  FIFO · {d.batch_number} · exp {d.expiry_date} · qty {d.qty_taken} @ ₹{d.mrp}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="k-divider my-6" />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <p className="text-[#E2E8F0]/70">Taxable Value</p>
        <p className="text-right text-white">₹{receipt.taxable_value.toFixed(2)}</p>
        <p className="text-[#E2E8F0]/70">CGST (6%)</p>
        <p className="text-right text-white">₹{receipt.cgst.toFixed(2)}</p>
        <p className="text-[#E2E8F0]/70">SGST (6%)</p>
        <p className="text-right text-white">₹{receipt.sgst.toFixed(2)}</p>
        <p className="text-[#E2E8F0]/70 font-medium">Grand Total</p>
        <p className="text-right font-display text-white text-2xl" data-testid="pos-receipt-total">
          ₹{receipt.grand_total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
