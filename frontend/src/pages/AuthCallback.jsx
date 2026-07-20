import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import KyrenisLogo from "@/components/KyrenisLogo";

/**
 * Handles the Emergent OAuth callback: reads `session_id` from the URL fragment,
 * exchanges it via /api/auth/google/session, and then routes based on flow +
 * onboarding status. Ref-guarded against StrictMode double-invocation.
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
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
    <div className="min-h-screen bg-black text-[#E2E8F0] flex items-center justify-center p-6" data-testid="auth-callback">
      <div className="k-panel p-10 max-w-md w-full text-center">
        <div className="flex items-center justify-center text-white mb-6">
          <KyrenisLogo size={56} />
        </div>
        {!error ? (
          <>
            <p className="k-label">// Handshake in progress</p>
            <h1 className="font-display text-white text-2xl mt-4">Establishing secure session…</h1>
            <p className="text-[#E2E8F0]/60 mt-3 text-sm">
              Kyrenis is exchanging your Google credentials for a signed session token.
              This takes about a second.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase text-[#10B981]">
              <span className="w-1.5 h-1.5 bg-[#10B981]" />
              Ingest OK
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EF4444]">// Auth Failed</p>
            <h1 className="font-display text-white text-2xl mt-4">Could not complete sign-in</h1>
            <p className="text-[#E2E8F0]/70 mt-3 text-sm break-words" data-testid="auth-callback-error">
              {error}
            </p>
            <button
              onClick={() => navigate("/pharmacy/auth")}
              className="mt-6 py-3 px-6 bg-white text-[#1E2B4E] font-mono text-xs tracking-[0.28em] uppercase hover:bg-[#E2E8F0] transition-colors"
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
