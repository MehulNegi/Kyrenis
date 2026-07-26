import React from "react";

export default function KyrenisLogo({ size = 44, className = "" }) {
  const s = size;
  return (
    <svg
      viewBox="0 0 100 100"
      width={s}
      height={s}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kyrenis logo"
      data-testid="kyrenis-logo"
    >
      {/* Viewfinder brackets */}
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="square" fill="none">
        <path d="M8 22 V8 H22" />
        <path d="M78 8 H92 V22" />
        <path d="M92 78 V92 H78" />
        <path d="M22 92 H8 V78" />
      </g>

      {/* Capsule outer stroke */}
      <rect
        x="34"
        y="18"
        width="32"
        height="64"
        rx="16"
        ry="16"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />

      {/* Top half – barcode lines */}
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="butt">
        <line x1="41" y1="30" x2="41" y2="46" />
        <line x1="45" y1="30" x2="45" y2="46" />
        <line x1="49" y1="28" x2="49" y2="48" />
        <line x1="53" y1="30" x2="53" y2="46" />
        <line x1="57" y1="28" x2="57" y2="48" />
        <line x1="61" y1="30" x2="61" y2="46" />
      </g>

      {/* Divider */}
      <line x1="34" y1="50" x2="66" y2="50" stroke="currentColor" strokeWidth="2" />

      {/* Bottom half solid capsule with cut-out checkmark */}
      <path
        d="M34 66 A0 0 0 0 1 34 66 V50 H66 V66 A16 16 0 0 1 50 82 A16 16 0 0 1 34 66 Z"
        fill="currentColor"
      />
      {/* Checkmark cutout */}
      <path
        d="M42 66 L48 72 L60 60"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
