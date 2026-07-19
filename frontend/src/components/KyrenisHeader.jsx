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
  const showUserPill = user && user.designated_role === "PHARMACY_STAFF" && !isPatientSurface;

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "#1E2B4E",
        borderColor: "rgba(226, 232, 240, 0.18)",
      }}
      data-testid="kyrenis-header"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 py-4">
        <Link to="/" className="flex items-center gap-4 group" data-testid="header-home-link">
          <div className="text-white transition-transform group-hover:-translate-y-0.5">
            <KyrenisLogo size={44} />
          </div>
          <div className="flex flex-col">
            <span
              className="font-display font-bold text-white text-[22px] leading-none"
              style={{ letterSpacing: "0.35em" }}
            >
              KYRENIS
            </span>
            <span
              className="font-mono text-[#E2E8F0]/70 mt-1"
              style={{ fontSize: "9px", letterSpacing: "0.32em" }}
            >
              SCAN&nbsp;·&nbsp;VERIFY&nbsp;·&nbsp;TRUST
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {variant !== "default" && (
            <span
              className="hidden md:block font-mono text-[10px] tracking-[0.3em] uppercase text-[#E2E8F0]/70"
              data-testid="header-variant-tag"
            >
              {variant}
            </span>
          )}
          {user && user.designated_role === "PHARMACY_STAFF" && !isPatientSurface && (
            <>
              <div className="hidden md:flex flex-col items-end mr-1">
                <span className="text-white text-sm font-medium" data-testid="header-user-email">
                  {user.email}
                </span>
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#10B981]">
                  Pharmacy Staff · Verified
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                data-testid="header-logout-btn"
                className="inline-flex items-center gap-2 border border-[#E2E8F0]/25 px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] text-[#E2E8F0] hover:text-white hover:border-[#EF4444] transition-colors"
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
