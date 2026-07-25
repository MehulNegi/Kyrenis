import React from "react";

export default function LandingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full opacity-[0.35]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {/* Grid dots */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="#686868" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Medical crosses */}
        <g stroke="#686868" strokeWidth="1.5" fill="none" opacity="0.5">
          <g transform="translate(120, 180)">
            <line x1="-8" y1="0" x2="8" y2="0" />
            <line x1="0" y1="-8" x2="0" y2="8" />
          </g>
          <g transform="translate(1320, 240)">
            <line x1="-12" y1="0" x2="12" y2="0" />
            <line x1="0" y1="-12" x2="0" y2="12" />
          </g>
          <g transform="translate(980, 620)">
            <line x1="-6" y1="0" x2="6" y2="0" />
            <line x1="0" y1="-6" x2="0" y2="6" />
          </g>
          <g transform="translate(240, 780)">
            <line x1="-10" y1="0" x2="10" y2="0" />
            <line x1="0" y1="-10" x2="0" y2="10" />
          </g>
        </g>

        {/* Capsules */}
        <g fill="#686868" opacity="0.6">
          <rect x="80" y="420" width="12" height="32" rx="6" transform="rotate(15 86 436)" />
          <rect x="1250" y="160" width="10" height="28" rx="5" transform="rotate(-12 1255 174)" />
          <rect x="680" y="820" width="14" height="36" rx="7" transform="rotate(8 687 838)" />
        </g>

        {/* Circles / molecular nodes */}
        <g fill="#686868" opacity="0.5">
          <circle cx="400" cy="140" r="4" />
          <circle cx="1160" cy="520" r="5" />
          <circle cx="520" cy="860" r="3.5" />
          <circle cx="900" cy="340" r="4.5" />
          <circle cx="180" cy="620" r="3" />
        </g>

        {/* Connection lines */}
        <g stroke="#686868" strokeWidth="1" opacity="0.35">
          <line x1="400" y1="140" x2="520" y2="860" />
          <line x1="1160" y1="520" x2="900" y2="340" />
          <line x1="180" y1="620" x2="400" y2="140" />
        </g>

        {/* Subtle arcs */}
        <g stroke="#686868" strokeWidth="1" fill="none" opacity="0.5">
          <path d="M 200 500 Q 400 300 600 500 T 1000 500" />
          <path d="M 800 200 Q 1000 400 1200 200" />
        </g>

        {/* Pills / tablets */}
        <g fill="#686868" opacity="0.55">
          <rect x="320" y="260" width="10" height="22" rx="5" transform="rotate(25 325 271)" />
          <rect x="340" y="265" width="10" height="22" rx="5" transform="rotate(-20 345 276)" />
          <rect x="1100" y="720" width="12" height="26" rx="6" transform="rotate(18 1106 733)" />
          <rect x="1125" y="715" width="12" height="26" rx="6" transform="rotate(-15 1131 728)" />
          <rect x="760" y="180" width="8" height="18" rx="4" transform="rotate(30 764 189)" />
          <rect x="158" y="840" width="9" height="20" rx="4.5" transform="rotate(-25 162.5 850)" />
        </g>

        {/* Medicine bottle */}
        <g fill="#686868" stroke="#686868" strokeWidth="1.2" opacity="0.55">
          <rect x="1360" y="440" width="22" height="34" rx="4" />
          <rect x="1364" y="434" width="14" height="8" rx="2" />
          <line x1="1366" y1="448" x2="1376" y2="448" />
          <line x1="1366" y1="452" x2="1376" y2="452" />
          <line x1="1366" y1="456" x2="1376" y2="456" />
        </g>

        {/* Small syringe */}
        <g fill="none" stroke="#686868" strokeWidth="1.2" opacity="0.5">
          <rect x="620" y="160" width="10" height="28" rx="2" transform="rotate(35 625 174)" />
          <line x1="624" y1="155" x2="624" y2="148" transform="rotate(35 625 174)" />
          <line x1="621" y1="155" x2="627" y2="155" transform="rotate(35 625 174)" />
          <line x1="625" y1="188" x2="625" y2="195" transform="rotate(35 625 174)" />
        </g>

        {/* Plus / medical symbol */}
        <g stroke="#686868" strokeWidth="1.5" fill="none" opacity="0.45">
          <g transform="translate(1050, 140)">
            <line x1="-7" y1="0" x2="7" y2="0" />
            <line x1="0" y1="-7" x2="0" y2="7" />
          </g>
          <g transform="translate(420, 720)">
            <line x1="-9" y1="0" x2="9" y2="0" />
            <line x1="0" y1="-9" x2="0" y2="9" />
          </g>
        </g>

        {/* Dotted hexagon / molecular shape */}
        <g fill="#686868" opacity="0.45">
          <circle cx="820" cy="560" r="3" />
          <circle cx="852" cy="540" r="3" />
          <circle cx="852" cy="580" r="3" />
          <circle cx="820" cy="600" r="3" />
          <circle cx="788" cy="580" r="3" />
          <circle cx="788" cy="540" r="3" />
        </g>
        <g stroke="#686868" strokeWidth="1" opacity="0.35">
          <line x1="820" y1="560" x2="852" y2="540" />
          <line x1="852" y1="540" x2="852" y2="580" />
          <line x1="852" y1="580" x2="820" y2="600" />
          <line x1="820" y1="600" x2="788" y2="580" />
          <line x1="788" y1="580" x2="788" y2="540" />
          <line x1="788" y1="540" x2="820" y2="560" />
        </g>

        {/* Small shield / safety mark */}
        <g fill="#686868" stroke="#686868" strokeWidth="1.2" opacity="0.5">
          <path d="M460 820 L470 808 L490 808 L495 820 L490 836 L470 836 Z" />
          <polyline points="474,820 484,820" stroke="#686868" strokeWidth="1.5" fill="none" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
