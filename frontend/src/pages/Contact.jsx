import React, { useState } from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import { ArrowLeft, Send, Mail, MessageSquare, Building2, ShieldCheck, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

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

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    // Client-only demo submission — production would POST to a support inbox
    setSubmitted(true);
    toast.success("Thanks. Our team will reach out within one working day.");
  };

  return (
    <div className="min-h-screen bg-black text-[#E2E8F0]" data-testid="contact-page">
      <header className="border-b border-[#E2E8F0]/10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link to="/" className="flex items-center gap-3 text-white" data-testid="contact-home-link">
            <KyrenisLogo size={36} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[18px]"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-[#E2E8F0]/70">Regulatory Intelligence Platform</span>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#E2E8F0]/80">
            <Link to="/" className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <ArrowLeft size={14} />
              Home
            </Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-6 md:px-10 py-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10">
        <section>
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#10B981] mb-4">Contact</p>
          <h1 className="font-display font-bold text-white text-4xl md:text-5xl tracking-tight leading-[1.08]">
            Reach the Kyrenis team.
          </h1>
          <p className="mt-6 text-[#E2E8F0]/80 leading-relaxed max-w-lg">
            Whether you run a single-outlet pharmacy or a hospital chain, we're happy to walk you
            through the platform, discuss regulatory data partnerships or answer any support
            question you have about your account.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            <ContactRow icon={<Mail size={16} />} label="Email" value="hello@kyrenis.in" />
            <ContactRow icon={<Building2 size={16} />} label="Head Office" value="Andheri East, Mumbai 400 069" />
            <ContactRow icon={<LifeBuoy size={16} />} label="Support Hours" value="Mon – Sat · 9:00 to 20:00 IST" />
          </div>
        </section>

        <section>
          {submitted ? (
            <div className="k-panel p-8 md:p-10 flex flex-col items-center text-center min-h-[520px] justify-center" data-testid="contact-submitted">
              <span className="inline-flex items-center justify-center w-14 h-14 border border-[#10B981] text-[#10B981] mb-6">
                <Send size={22} />
              </span>
              <h2 className="font-display text-white text-2xl">Thank you.</h2>
              <p className="text-[#E2E8F0]/75 mt-3 max-w-sm">
                Your enquiry has been received. A member of the Kyrenis team will get back to you
                within one working day.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", email: "", organisation: "", category: "support", message: "" });
                }}
                className="mt-8 border border-[#E2E8F0]/25 px-5 py-2.5 text-sm hover:text-white hover:border-white transition-colors"
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
                    className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
                  />
                </Field>
                <Field label="Work email">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    data-testid="contact-email"
                    className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
                  />
                </Field>
              </div>

              <Field label="Organisation">
                <input
                  value={form.organisation}
                  onChange={(e) => set("organisation", e.target.value)}
                  data-testid="contact-org"
                  className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
                />
              </Field>

              <div>
                <p className="text-[11px] text-[#E2E8F0]/60 tracking-[0.14em] mb-2">Enquiry Type</p>
                <div className="grid grid-cols-2 gap-2" data-testid="contact-category-grid">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("category", c.value)}
                      data-testid={`contact-category-${c.value}`}
                      className={`flex items-center gap-2 border p-3 text-left text-sm transition-colors ${
                        form.category === c.value
                          ? "bg-[#1E2B4E] border-[#1E2B4E] text-white"
                          : "border-[#E2E8F0]/20 text-[#E2E8F0]/85 hover:border-[#E2E8F0]/40"
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
                  className="w-full px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white text-sm focus:border-[#10B981] focus:outline-none transition-colors"
                />
              </Field>

              <button
                type="submit"
                data-testid="contact-submit"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1E2B4E] px-6 py-3 text-sm font-medium hover:bg-[#E2E8F0] active:scale-[0.98] transition-all"
              >
                <Send size={14} />
                Send Enquiry
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function ContactRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 border-l-2 border-[#10B981]/60 pl-4">
      <div className="text-[#10B981] mt-0.5">{icon}</div>
      <div>
        <p className="text-[11px] text-[#E2E8F0]/55 tracking-[0.14em]">{label}</p>
        <p className="text-white text-sm mt-1">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] text-[#E2E8F0]/60 tracking-[0.14em]">{label}</span>
      {children}
    </label>
  );
}
