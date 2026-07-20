import React, { useEffect } from "react";
import { X, Printer } from "lucide-react";

/**
 * Full-screen printable invoice overlay. Uses browser's window.print() with a
 * @media print CSS block. Non-print UI is hidden. Reusable for reprint from
 * Sales History too.
 */
export default function InvoicePrint({ receipt, onClose }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const doPrint = () => window.print();

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 flex items-start md:items-center justify-center overflow-auto p-4"
      data-testid="invoice-print-overlay"
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-print-region], [data-print-region] * { visibility: visible !important; }
          [data-print-region] { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; background: white !important; color: #111 !important; }
          .no-print { display: none !important; }
          .invoice-header { background: white !important; color: #111 !important; }
        }
      `}</style>

      <div
        className="relative w-full max-w-[720px] bg-white text-[#111] shadow-2xl"
        data-print-region
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 no-print">
          <p className="text-[11px] tracking-[0.14em] text-black/60">Invoice preview</p>
          <div className="flex items-center gap-2">
            <button
              onClick={doPrint}
              data-testid="invoice-print-do"
              className="inline-flex items-center gap-2 bg-[#1E2B4E] text-white px-4 py-2 text-sm hover:bg-[#0f1a34] transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={onClose}
              data-testid="invoice-print-close"
              aria-label="Close"
              className="w-9 h-9 border border-black/15 inline-flex items-center justify-center hover:bg-black/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="invoice-header flex items-start justify-between border-b border-black/15 pb-6">
            <div>
              <p className="text-[10px] tracking-[0.28em] uppercase text-[#1E2B4E]/70">
                Kyrenis Reference Pharmacy
              </p>
              <h1 className="font-display text-3xl mt-2 text-[#1E2B4E]">Tax Invoice</h1>
              <p className="text-black/55 text-xs mt-2">
                Andheri East, Mumbai 400 069 · GSTIN 27ABCDE1234F1Z5
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-[0.14em] text-black/55">Invoice #</p>
              <p className="text-[#1E2B4E] font-mono text-sm mt-1">{receipt.invoice_number}</p>
              <p className="text-[10px] tracking-[0.14em] text-black/55 mt-3">Date</p>
              <p className="text-sm mt-1">{new Date(receipt.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <table className="w-full text-sm mt-8 border-collapse">
            <thead>
              <tr className="border-b border-black/20 text-left text-black/60 text-[11px] tracking-[0.14em] uppercase">
                <th className="py-3">Item</th>
                <th className="py-3">Batch (FIFO)</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Rate (₹)</th>
                <th className="py-3 text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {receipt.lines.map((l, i) => (
                <React.Fragment key={i}>
                  {l.deductions.map((d, j) => (
                    <tr key={j} className="border-b border-black/10">
                      <td className="py-3">
                        {j === 0 ? (
                          <>
                            <p className="font-medium">{l.medicine.brand_name}</p>
                            <p className="text-black/55 text-xs">{l.medicine.generic_composition}</p>
                          </>
                        ) : (
                          <span className="text-black/55">↳</span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-xs">
                        {d.batch_number}
                        <br />
                        <span className="text-black/45">exp {d.expiry_date}</span>
                      </td>
                      <td className="py-3 text-right">{d.qty_taken}</td>
                      <td className="py-3 text-right">₹{d.mrp.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        ₹{(d.qty_taken * d.mrp).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-8">
            <div className="w-full max-w-[320px] text-sm">
              <Row label="Taxable Value" value={`₹${receipt.taxable_value.toFixed(2)}`} />
              <Row label="CGST (6%)" value={`₹${receipt.cgst.toFixed(2)}`} />
              <Row label="SGST (6%)" value={`₹${receipt.sgst.toFixed(2)}`} />
              <div className="border-t border-black/25 mt-2 pt-3 flex justify-between font-medium">
                <span>Grand Total</span>
                <span className="text-[#1E2B4E] text-lg">₹{receipt.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-black/10 mt-10 pt-4 text-xs text-black/55 flex justify-between">
            <span>Status: {receipt.status}</span>
            <span>Powered by Kyrenis · Regulatory Intelligence Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-black/65">{label}</span>
      <span>{value}</span>
    </div>
  );
}
