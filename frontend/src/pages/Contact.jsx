import React, { useState } from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Building2,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";

const CATEGORIES = [
  { value: "support", label: "Technical Support", icon: LifeBuoy },
  { value: "partnership", label: "Partnership Enquiry", icon: Building2 },
  { value: "regulatory", label: "Regulatory Collaboration", icon: ShieldCheck },
  { value: "general", label: "General Enquiry", icon: MessageSquare },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organisation: "",
    category: "support",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/public/contact", form);
      setSubmitted(true);
    } catch (err) {
      toast.error(
        formatApiErrorDetail(err?.response?.data?.detail) ||
          "Unable to submit your enquiry right now. Please try again in a moment."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-600" data-testid="contact-page">
      <header className="border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link
            to="/"
            className="flex items-center gap-3 text-slate-900"
            data-testid="contact-home-link"
          >
            <KyrenisLogo size={36} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[18px]"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-slate-500">
                Regulatory Intelligence Platform
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link to="/" className="inline-flex items-center gap-2 hover:text-slate-900 transition-colors">
              <ArrowLeft size={14} />
              Home
            </Link>
            <Link to="/about" className="hover:text-slate-900 transition-colors">
              About
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 md:px-10 py-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10">
        <section>
          <p className="text-[11px] tracking-[0.28em] uppercase text-emerald-700 mb-4">Contact</p>
          <h1 className="font-display font-bold text-slate-900 text-4xl md:text-5xl tracking-tight leading-[1.08]">
            Send the Kyrenis team an enquiry.
          </h1>
          <p className="mt-6 text-slate-600 leading-relaxed max-w-lg">
            Whether you run a single-outlet pharmacy or a hospital chain, we're happy to walk you
            through the platform, discuss regulatory data partnerships, or answer any support
            question you have about your account. Fill in the form and a member of the team will
            get back to you.
          </p>

          <ul className="mt-10 flex flex-col gap-4 text-sm text-slate-600">
            <li className="border-l-2 border-emerald-200 pl-4">
              <p className="text-[11px] text-slate-400 tracking-[0.14em]">Technical Support</p>
              <p className="text-slate-900 mt-1">
                Account access, invoicing, batch intake or POS billing issues.
              </p>
            </li>
            <li className="border-l-2 border-emerald-200 pl-4">
              <p className="text-[11px] text-slate-400 tracking-[0.14em]">Partnership Enquiry</p>
              <p className="text-slate-900 mt-1">
                Distributor, chain-pharmacy and hospital roll-outs.
              </p>
            </li>
            <li className="border-l-2 border-emerald-200 pl-4">
              <p className="text-[11px] text-slate-400 tracking-[0.14em]">
                Regulatory Collaboration
              </p>
              <p className="text-slate-900 mt-1">
                State FDAs, CDSCO liaison, laboratory data-sharing.
              </p>
            </li>
          </ul>
        </section>

        <section>
          {submitted ? (
            <div
              className="k-panel p-8 md:p-10 flex flex-col items-center text-center min-h-[520px] justify-center"
              data-testid="contact-submitted"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 border border-emerald-700 text-emerald-700 mb-6">
                <Send size={22} />
              </span>
              <h2 className="font-display text-slate-900 text-2xl">Enquiry submitted</h2>
              <p
                className="text-slate-600 mt-3 max-w-sm"
                data-testid="contact-submitted-message"
              >
                Thank you for contacting Kyrenis. Your enquiry has been submitted successfully.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: "",
                    email: "",
                    organisation: "",
                    category: "support",
                    message: "",
                  });
                }}
                className="mt-8 border border-slate-200 px-5 py-2.5 text-sm hover:text-slate-900 hover:border-slate-300 transition-colors"
                data-testid="contact-submit-another"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="k-panel p-8 md:p-10 flex flex-col gap-5"
              data-testid="contact-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full name">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    data-testid="contact-name"
                    className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 text-sm focus:border-emerald-700 focus:outline-none transition-colors"
                  />
                </Field>
                <Field label="Work email">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    data-testid="contact-email"
                    className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 text-sm focus:border-emerald-700 focus:outline-none transition-colors"
                  />
                </Field>
              </div>

              <Field label="Organisation">
                <input
                  value={form.organisation}
                  onChange={(e) => set("organisation", e.target.value)}
                  data-testid="contact-org"
                  className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 text-sm focus:border-emerald-700 focus:outline-none transition-colors"
                />
              </Field>

              <div>
                <p className="text-[11px] text-slate-500 tracking-[0.14em] mb-2">Enquiry Type</p>
                <div className="grid grid-cols-2 gap-2" data-testid="contact-category-grid">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("category", c.value)}
                      data-testid={`contact-category-${c.value}`}
                      className={`flex items-center gap-2 border p-3 text-left text-sm transition-colors ${
                        form.category === c.value
                          ? "bg-slate-100 border-slate-300 text-slate-900"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <c.icon size={14} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Message">
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    data-testid="contact-message"
                    placeholder="Tell us how we can help…"
                    className="w-full px-3 py-3 bg-white border border-slate-200 text-slate-900 text-sm focus:border-emerald-700 focus:outline-none transition-colors"
                  />
              </Field>

              <button
                type="submit"
                disabled={busy}
                data-testid="contact-submit"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 text-sm font-medium hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Send size={14} />
                {busy ? "Sending…" : "Send Enquiry"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
        <label className="flex flex-col gap-2">
          <span className="text-[11px] text-slate-500 tracking-[0.14em]">{label}</span>
      {children}
    </label>
  );
}
