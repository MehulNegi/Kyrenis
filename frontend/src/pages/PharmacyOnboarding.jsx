import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import KyrenisHeader from "@/components/KyrenisHeader";
import { Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function PharmacyOnboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pharmacy_name: "",
    license_number: "",
    location_city: "",
    postal_code: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/complete-onboarding", form);
      setUser(data.user);
      toast.success("Pharmacy verified · access unlocked");
      navigate("/pharmacy", { replace: true });
    } catch (err) {
      toast.error(formatApiErrorDetail(err?.response?.data?.detail) || err.message);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-600" data-testid="onboarding-page">
      <KyrenisHeader variant="Pharmacy Onboarding" />
      <main className="max-w-[880px] mx-auto px-6 md:px-10 py-14">
        <p className="k-label">Pharmacy verification</p>
        <h1 className="font-display font-bold text-slate-900 text-3xl md:text-4xl tracking-tight mt-3">
          Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Attach your pharmacy.
        </h1>
        <p className="text-slate-600 mt-3 max-w-xl">
          Kyrenis links your Google identity to your retail outlet. Provide your CDSCO
          license and location once — you'll never see this screen again.
        </p>

        <form onSubmit={submit} className="k-panel p-8 md:p-10 mt-8 flex flex-col gap-5" data-testid="onboarding-form">
          <Field label="Pharmacy Name" testid="onboarding-pharmacy-name">
            <input
              value={form.pharmacy_name}
              onChange={(e) => set("pharmacy_name", e.target.value)}
              required
              placeholder="e.g. Kyrenis Reference Pharmacy"
              data-testid="onboarding-pharmacy-name-input"
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="CDSCO / Retail License #" testid="onboarding-license">
              <input
                value={form.license_number}
                onChange={(e) => set("license_number", e.target.value)}
                required
                placeholder="MH-RTL-77812"
                data-testid="onboarding-license-input"
                className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
              />
            </Field>
            <Field label="City" testid="onboarding-city">
              <input
                value={form.location_city}
                onChange={(e) => set("location_city", e.target.value)}
                required
                placeholder="Mumbai"
                data-testid="onboarding-city-input"
                className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
              />
            </Field>
          </div>
          <Field label="Postal Code (optional)" testid="onboarding-postal">
            <input
              value={form.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              placeholder="400001"
              data-testid="onboarding-postal-input"
              className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-700 focus:outline-none transition-colors"
            />
          </Field>

          <button
            type="submit"
            disabled={busy}
            data-testid="onboarding-submit"
            className="mt-2 py-3 bg-white text-slate-900 font-mono text-xs tracking-[0.28em] uppercase inline-flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98] transition-colors disabled:opacity-50"
          >
            <Building2 size={14} />
            Grant Pharmacy Staff Access
            <ArrowRight size={14} />
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, testid, children }) {
  return (
    <label className="flex flex-col gap-2" data-testid={`onboarding-field-${testid}`}>
      <span className="k-label">{label}</span>
      {children}
    </label>
  );
}
