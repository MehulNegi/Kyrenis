import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import KyrenisLogo from "./KyrenisLogo";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export default function KyrenisHeader({ variant = "default" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPatientSurface = location.pathname.startsWith("/patient");

  return (
    <header
      className="top-0 z-40 border-b"
      style={{
        background: "white",
        borderColor: "#E2E8F0",
      }}
      data-testid="kyrenis-header"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-4">
        <Link to="/" className="flex items-center gap-4 group" data-testid="header-home-link">
          <div className="text-slate-900 transition-transform group-hover:-translate-y-0.5">
            <KyrenisLogo size={40} />
          </div>
          <div className="flex flex-col">
            <span
              className="font-display font-bold text-slate-900 text-[20px] leading-none"
              style={{ letterSpacing: "0.32em" }}
            >
              KYRENIS
            </span>
            <span
              className="text-slate-600 mt-1 text-[10px] tracking-[0.14em]"
              style={{ letterSpacing: "0.14em" }}
            >
              Regulatory Intelligence Platform
            </span>
          </div>
        </Link>

        

        <div className="flex items-center gap-4">
          {variant !== "default" && (
            <span
              className="hidden md:block text-[11px] text-slate-600"
              data-testid="header-variant-tag"
            >
              {variant}
            </span>
          )}
          {user && user.designated_role === "PHARMACY_STAFF" && !isPatientSurface && (
            <>
              <div className="flex-col items-end hidden mr-1 md:flex">
                <span className="text-sm font-medium text-slate-900" data-testid="header-user-email">
                  {user.email}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Pharmacy Staff</span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                data-testid="header-logout-btn"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs transition-colors border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-red-700"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
