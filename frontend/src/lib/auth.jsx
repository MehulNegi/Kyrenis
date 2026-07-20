import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, formatApiErrorDetail } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=guest, object=user
  const [error, setError] = useState("");

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes("session_id=")) {
      setUser(false);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (e) {
        setUser(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const msg = formatApiErrorDetail(e?.response?.data?.detail) || e.message;
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  const register = async (payload) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register", payload);
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const msg = formatApiErrorDetail(e?.response?.data?.detail) || e.message;
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children, allowRoles = ["PHARMACY_STAFF"] }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-[#E2E8F0]">
        <p className="font-mono text-xs tracking-[0.3em] uppercase">Authenticating…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/pharmacy/auth" state={{ from: loc }} replace />;
  }
  if (!allowRoles.includes(user.designated_role)) {
    // A pending Google user landing on /pharmacy → route to onboarding
    if (user.designated_role === "PENDING_ONBOARDING") {
      return <Navigate to="/pharmacy/onboarding" replace />;
    }
    return <Navigate to="/pharmacy/auth" state={{ from: loc }} replace />;
  }
  return children;
}
