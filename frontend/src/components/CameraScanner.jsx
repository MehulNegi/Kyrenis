import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Camera, StopCircle, AlertTriangle } from "lucide-react";

/**
 * Compact webcam-based QR/DataMatrix scanner.
 * `onDetected(text)` fires once when a code is decoded (scanner auto-stops).
 * Renders as a compact card that a parent form can embed alongside the
 * text-input simulation fields.
 */
export default function CameraScanner({ onDetected }) {
  const containerId = useRef(`k-scanner-${Math.random().toString(36).slice(2, 9)}`).current;
  const scannerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scannerRef.current.clear();
            } catch {}
            scannerRef.current = null;
          });
      }
    };
  }, []);

  const start = async () => {
    setError("");
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, { verbose: false });
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onDetected?.(decodedText);
          stop();
        },
        () => {}
      );
      setRunning(true);
    } catch (e) {
      setError(e?.message || String(e));
      setRunning(false);
    }
  };

  const stop = async () => {
    const s = scannerRef.current;
    if (!s) {
      setRunning(false);
      return;
    }
    try {
      const state = s.getState?.();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await s.stop();
      }
      await s.clear();
    } catch (e) {
      // swallow — scanner may not be running or already cleared
    }
    setRunning(false);
  };

  return (
    <div className="border border-[#E2E8F0]/15 p-4 flex flex-col gap-3" data-testid="camera-scanner">
      <div className="flex items-center justify-between">
        <p className="k-label">Live camera scan</p>
        {running ? (
          <button
            type="button"
            onClick={stop}
            data-testid="camera-scanner-stop"
            className="inline-flex items-center gap-2 border border-[#EF4444]/60 text-[#EF4444] px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-[#EF4444]/10 transition-colors"
          >
            <StopCircle size={12} />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            data-testid="camera-scanner-start"
            className="inline-flex items-center gap-2 border border-[#10B981]/60 text-[#10B981] px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-[#10B981]/10 transition-colors"
          >
            <Camera size={12} />
            Start Scan
          </button>
        )}
      </div>

      <div className="relative aspect-video border border-[#E2E8F0]/15 bg-black overflow-hidden">
        <div id={containerId} className="w-full h-full" />
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center text-[#E2E8F0]/50 text-xs font-mono tracking-[0.28em] uppercase">
            Camera Off
          </div>
        )}
      </div>

      {error && (
        <div
          className="flex items-start gap-2 border border-[#EF4444]/40 p-3"
          style={{ background: "rgba(239,68,68,0.06)" }}
          data-testid="camera-scanner-error"
        >
          <AlertTriangle size={14} className="text-[#EF4444] mt-0.5" />
          <p className="text-[#E2E8F0]/80 text-xs">
            {error}. Ensure the device has camera access and reload if permissions were denied.
          </p>
        </div>
      )}
    </div>
  );
}
