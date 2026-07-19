import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Plus, Receipt } from "lucide-react";

export default function POSBilling() {
  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);

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
    inventory.forEach((b) => {
      if (!map[b.medicine_id]) map[b.medicine_id] = { total: 0, batches: [] };
      map[b.medicine_id].total += b.current_stock_qty;
      map[b.medicine_id].batches.push(b);
    });
    Object.values(map).forEach((v) =>
      v.batches.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
    );
    return map;
  }, [inventory]);

  const addToCart = (medId) => {
    if (!medId) return;
    setCart((c) => {
      const exists = c.find((l) => l.medicine_id === medId);
      if (exists) return c;
      return [...c, { medicine_id: medId, quantity: 1 }];
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
      toast.success("Receipt generated · FIFO deduction applied");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6" data-testid="pos-view">
      <div className="k-panel p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart size={18} className="text-[#10B981]" />
          <h2 className="font-display text-white text-xl">POS Checkout Workspace</h2>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <p className="k-label mb-2">Add Medicine to Cart</p>
            <select
              data-testid="pos-medicine-select"
              onChange={(e) => {
                addToCart(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
            >
              <option value="">Select medicine…</option>
              {medicines.map((m) => {
                const s = stockByMed[m.id];
                const inStock = (s?.total || 0) > 0;
                return (
                  <option key={m.id} value={m.id} disabled={!inStock}>
                    {m.brand_name} · {m.generic_composition} · stock {s?.total || 0}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="k-divider my-6" />

        {cart.length === 0 ? (
          <div className="border border-dashed border-[#E2E8F0]/15 p-8 text-center" data-testid="pos-cart-empty">
            <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#E2E8F0]/50">
              Cart Empty
            </p>
            <p className="text-[#E2E8F0]/50 text-sm mt-2">
              Select a medicine to begin the FIFO checkout.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2" data-testid="pos-cart">
            {cart.map((line) => {
              const med = medicines.find((m) => m.id === line.medicine_id);
              const stock = stockByMed[line.medicine_id];
              return (
                <div
                  key={line.medicine_id}
                  className="border border-[#E2E8F0]/12 p-3 flex items-center gap-3"
                  data-testid={`pos-cart-line-${med?.brand_name}`}
                >
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{med?.brand_name}</p>
                    <p className="text-[#E2E8F0]/50 text-xs">
                      {med?.generic_composition} · stock {stock?.total || 0}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    data-testid={`pos-cart-qty-${med?.brand_name}`}
                    onChange={(e) => updateQty(line.medicine_id, parseInt(e.target.value, 10))}
                    className="w-20 px-3 py-2 bg-black border border-[#E2E8F0]/20 text-white font-mono text-sm text-right focus:border-[#10B981] focus:outline-none"
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
          disabled={cart.length === 0 || busy}
          data-testid="pos-checkout-btn"
          className="mt-6 w-full py-3 bg-white text-[#1E2B4E] font-mono text-xs tracking-[0.28em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-40"
        >
          <Receipt size={14} />
          Finalise Transaction (FIFO)
        </button>
      </div>

      <ReceiptPanel receipt={receipt} />
    </div>
  );
}

function ReceiptPanel({ receipt }) {
  if (!receipt) {
    return (
      <div className="k-panel p-6 flex flex-col items-center justify-center text-center min-h-[400px]" data-testid="pos-receipt-empty">
        <Receipt size={40} className="text-[#E2E8F0]/25" />
        <p className="mt-4 font-mono text-[11px] tracking-[0.3em] uppercase text-[#E2E8F0]/50">
          No Receipt Yet
        </p>
      </div>
    );
  }
  return (
    <div className="k-panel p-6 md:p-8" data-testid="pos-receipt">
      <div className="flex items-center justify-between mb-6">
        <p className="k-label">// Receipt</p>
        <p className="font-mono text-[10px] text-[#E2E8F0]/60">
          {new Date(receipt.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {receipt.lines.map((l, i) => (
          <div key={i} className="border border-[#E2E8F0]/12 p-4" data-testid={`pos-receipt-line-${i}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium">{l.medicine.brand_name}</p>
                <p className="text-[#E2E8F0]/50 text-xs">
                  {l.medicine.generic_composition} · qty {l.requested_qty}
                </p>
              </div>
              <p className="text-white font-mono text-sm">₹{l.line_total.toFixed(2)}</p>
            </div>
            <div className="mt-3 border-l border-[#10B981]/40 pl-3 flex flex-col gap-1">
              {l.deductions.map((d, j) => (
                <p key={j} className="font-mono text-[10px] text-[#E2E8F0]/60">
                  FIFO · {d.batch_number} · exp {d.expiry_date} · qty {d.qty_taken} @ ₹{d.mrp}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="k-divider my-6" />
      <div className="flex justify-between items-center">
        <p className="k-label">Grand Total</p>
        <p className="font-display text-white text-3xl" data-testid="pos-receipt-total">
          ₹{receipt.grand_total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
