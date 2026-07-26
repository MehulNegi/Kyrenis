import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import KyrenisLogo from "@/components/KyrenisLogo";
import LandingBackground from "@/components/LandingBackground";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const sessionId = params.get("session_id");
    const query = new URLSearchParams(location.search);
    const flow = query.get("flow") || "pharmacy";

    if (!sessionId) {
      setError("Missing session_id in callback URL.");
      return;
    }

    (async () => {
      try {
        const { data } = await api.post("/auth/google/session", {
          session_id: sessionId,
          flow,
        });
        setUser(data.user);
        // Strip the hash to prevent re-processing
        window.history.replaceState(null, "", window.location.pathname);
        if (flow === "patient") {
          navigate("/patient", { replace: true, state: { user: data.user } });
          return;
        }
        if (data.needs_onboarding || data.user?.designated_role === "PENDING_ONBOARDING") {
          navigate("/pharmacy/onboarding", { replace: true, state: { user: data.user } });
        } else {
          navigate("/pharmacy", { replace: true, state: { user: data.user } });
        }
      } catch (e) {
        setError(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
      }
    })();
  }, [location.search, navigate, setUser]);

  return (
    <div className="relative flex items-center justify-center min-h-screen p-6 bg-white text-slate-600" data-testid="auth-callback">
      <LandingBackground />
      <div className="w-full max-w-md p-10 text-center k-panel">
        <div className="flex items-center justify-center mb-6 text-slate-900">
          <KyrenisLogo size={56} />
        </div>
        {!error ? (
          <>
            <p className="k-label">Signing you in</p>
            <h1 className="mt-4 text-2xl font-display text-slate-900">Establishing secure session…</h1>
            <p className="mt-3 text-sm text-slate-500">
              Kyrenis is exchanging your Google credentials for a signed session token.
              This takes about a second.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase text-emerald-700">
              <span className="w-1.5 h-1.5 bg-[#10B981]" />
              Ingest OK
            </div>
          </>
        ) : (
          <>
          <p className="text-[11px] tracking-[0.14em] text-red-700">Sign-in failed</p>
          <h1 className="mt-4 text-2xl font-display text-slate-900">Could not complete sign-in</h1>
          <p className="mt-3 text-sm break-words text-slate-600" data-testid="auth-callback-error">
              {error}
            </p>
            <button
              onClick={() => navigate("/pharmacy/auth")}
              className="mt-6 py-3 px-6 bg-white text-slate-900 font-mono text-xs tracking-[0.28em] uppercase hover:bg-slate-100 transition-colors"
              data-testid="auth-callback-retry"
            >
              Return to Sign-in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
