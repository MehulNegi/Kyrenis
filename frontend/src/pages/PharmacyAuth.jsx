import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import KyrenisLogo from "@/components/KyrenisLogo";
import { Terminal, LogIn, UserPlus, Zap, ArrowLeft } from "lucide-react";

export default function PharmacyAuth() {
  const { login, register, error } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({
    email: "",
    password: "",
    pharmacy_name: "",
    license_number: "",
    location_city: "",
    postal_code: "",
  });
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setLocalError("");
    const res =
      mode === "signin"
        ? await login(form.email, form.password)
        : await register(form);
    setBusy(false);
    if (res.ok) navigate("/pharmacy");
    else setLocalError(res.message);
  };

  const autofill = async () => {
    setBusy(true);
    setLocalError("");
    setForm((f) => ({ ...f, email: "chemist@kyrenis.in", password: "password" }));
    const res = await login("chemist@kyrenis.in", "password");
    setBusy(false);
    if (res.ok) navigate("/pharmacy");
    else setLocalError(res.message);
  };

  return (
    <div className="min-h-screen bg-black text-[#E2E8F0] flex flex-col" data-testid="pharmacy-auth-page">
      <div className="border-b border-[#E2E8F0]/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-white" data-testid="auth-home-link">
            <KyrenisLogo size={38} />
            <div className="flex flex-col">
              <span className="font-display font-bold text-[18px]" style={{ letterSpacing: "0.35em" }}>
                KYRENIS
              </span>
              <span className="font-mono text-[9px] tracking-[0.32em] text-[#E2E8F0]/70">
                SCAN · VERIFY · TRUST
              </span>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#E2E8F0]/70 hover:text-white"
            data-testid="auth-back-link"
          >
            <ArrowLeft size={14} />
            Return
          </Link>
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]">
        {/* Left contextual panel */}
        <section
          className="hidden lg:flex flex-col justify-between px-14 py-16"
          style={{ background: "#0a0d10" }}
        >
          <div>
            <p className="k-label">// Pharmacy Portal · Layer 01</p>
            <h1 className="font-display font-bold text-white text-5xl mt-6 leading-[1.05] tracking-tighter">
              Every intake, verified in
              <br />
              <span className="text-[#10B981]">four sovereign checks.</span>
            </h1>
            <p className="text-[#E2E8F0]/70 mt-6 max-w-md leading-relaxed">
              Access the operator dashboard to log new inventory through the sealed 4-step
              verification pipeline, run FIFO POS transactions, and monitor cross-network
              anomaly telemetry in real time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "Pipeline", v: "OCR ↔ QR ↔ Mod10 ↔ CDSCO" },
              { k: "Alert Model", v: "Volumetric + Teleportation" },
              { k: "Privacy", v: "SHA-256 GTIN + Batch hashes" },
              { k: "Compliance", v: "CDSCO Recall Registry sync" },
            ].map((x) => (
              <div key={x.k} className="border border-[#E2E8F0]/12 p-4">
                <p className="k-label">{x.k}</p>
                <p className="font-mono text-[#E2E8F0]/90 text-sm mt-2">{x.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right auth panel */}
        <section
          className="flex items-center justify-center px-6 md:px-10 py-14"
          style={{
            background:
              "linear-gradient(180deg, rgba(30,43,78,0.55), rgba(0,0,0,1) 70%), #000000",
          }}
        >
          <div className="w-full max-w-[420px]">
            <div className="k-panel p-8" data-testid="auth-terminal-card">
              <div className="flex items-center gap-2 mb-6">
                <Terminal size={16} className="text-[#10B981]" />
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#E2E8F0]/70">
                  kyrenis-os :: auth-gateway
                </p>
              </div>

              <div className="flex gap-2 mb-6 border border-[#E2E8F0]/15 p-1" data-testid="auth-mode-tabs">
                <button
                  onClick={() => setMode("signin")}
                  data-testid="auth-mode-signin"
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-colors ${
                    mode === "signin"
                      ? "bg-[#1E2B4E] text-white"
                      : "text-[#E2E8F0]/70 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode("register")}
                  data-testid="auth-mode-register"
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-colors ${
                    mode === "register"
                      ? "bg-[#1E2B4E] text-white"
                      : "text-[#E2E8F0]/70 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <button
                onClick={autofill}
                disabled={busy}
                data-testid="auth-autofill-btn"
                className="w-full mb-6 py-3 border border-[#10B981]/50 text-[#10B981] font-mono text-xs tracking-[0.25em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#10B981]/10 disabled:opacity-50 transition-colors"
              >
                <Zap size={14} />
                Autofill Test Pharmacy Credentials
              </button>

              <form onSubmit={submit} className="flex flex-col gap-4" data-testid="auth-form">
                <Field
                  label="Email"
                  testid="auth-email-input"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  type="email"
                  autoComplete="email"
                  required
                />
                <Field
                  label="Password"
                  testid="auth-password-input"
                  value={form.password}
                  onChange={(v) => set("password", v)}
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                />
                {mode === "register" && (
                  <>
                    <Field
                      label="Pharmacy Name"
                      testid="auth-pharmacy-name"
                      value={form.pharmacy_name}
                      onChange={(v) => set("pharmacy_name", v)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label="License #"
                        testid="auth-license"
                        value={form.license_number}
                        onChange={(v) => set("license_number", v)}
                      />
                      <Field
                        label="City"
                        testid="auth-city"
                        value={form.location_city}
                        onChange={(v) => set("location_city", v)}
                      />
                    </div>
                    <Field
                      label="Postal Code"
                      testid="auth-postal"
                      value={form.postal_code}
                      onChange={(v) => set("postal_code", v)}
                    />
                  </>
                )}

                {(localError || error) && (
                  <p
                    className="text-[#EF4444] text-sm font-mono border border-[#EF4444]/40 p-3"
                    data-testid="auth-error"
                  >
                    {localError || error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  data-testid="auth-submit-btn"
                  className="mt-2 py-3 bg-white text-[#1E2B4E] font-mono text-xs tracking-[0.28em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-50"
                >
                  {mode === "signin" ? (
                    <>
                      <LogIn size={14} />
                      Access Terminal
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Provision Account
                    </>
                  )}
                </button>
              </form>
            </div>
            <p className="mt-4 text-[10px] font-mono text-[#E2E8F0]/45 tracking-[0.28em] uppercase text-center">
              // Test creds → chemist@kyrenis.in · password
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, testid, value, onChange, type = "text", required, autoComplete }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="k-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        data-testid={testid}
        className="px-3 py-3 bg-black border border-[#E2E8F0]/20 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none transition-colors"
      />
    </label>
  );
}
