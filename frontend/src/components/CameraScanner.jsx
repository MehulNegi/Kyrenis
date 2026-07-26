import React, { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { Camera, StopCircle, AlertTriangle } from "lucide-react";

export default function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  const stopScan = async () => {
    try {
      if (workerRef.current) {
        if (typeof workerRef.current.terminate === "function") {
          await workerRef.current.terminate();
        }
        workerRef.current = null;
      }
    } catch {}
    setRunning(false);
    setStatus("");
  };

  const getEnvironmentDeviceId = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      const rear = videoDevices.find((d) => /back|rear|environment/i.test(d.label));
      return rear ? rear.deviceId : videoDevices[0]?.deviceId || undefined;
    } catch {
      return undefined;
    }
  };

  const start = async () => {
    setError("");
    setStatus("Starting camera…");
    try {
      const video = videoRef.current;
      if (!video) throw new Error("Video element not found.");

      const deviceId = await getEnvironmentDeviceId();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" },
        audio: false,
      });

      video.srcObject = stream;
      await video.play();

      setRunning(true);
      setStatus("");
    } catch (e) {
      console.error("[OCR Scanner] Start error:", e);
      setError(e?.message || String(e));
      setRunning(false);
      setStatus("");
    }
  };

  const extractBatchFromOCR = (text) => {
    if (!text) return "";
    const lines = text.split(/\n/);
    for (const line of lines) {
      // Match "BATCH NO: XYZ", "BATCH NUMBER: XYZ", "BATCH: XYZ"
      // Skip the label itself by using a non-capturing group for NO/NUMBER
      const batchMatch = line.match(/BATCH\s*(?:NO|NUMBER)?\s*[:]?\s*([A-Z0-9][A-Z0-9\-]{1,20})/i);
      if (batchMatch && batchMatch[1]) {
        const val = batchMatch[1].trim();
        // Guard against capturing "NO" or "NUMBER" itself
        if (!/^(NO|NUMBER)$/i.test(val)) return val;
      }
    }
    const fallback = text.match(/[A-Z0-9][A-Z0-9\-]{2,20}/);
    if (fallback && fallback[0]) return fallback[0].trim();
    return text.trim();
  };

  const captureAndOCR = async () => {
    setError("");
    setStatus("Reading text…");
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) throw new Error("Video or canvas not found.");

      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setStatus("Loading OCR engine…");

      if (!workerRef.current) {
        try {
          workerRef.current = await createWorker("eng", 1, {
            logger: (m) => {
              if (m.status === "recognizing text") {
                setStatus(`Reading… ${Math.round((m.progress || 0) * 100)}%`);
              } else {
                setStatus(m.status || "");
              }
            },
          });
        } catch (e) {
          console.error("[OCR Scanner] Worker creation error:", e);
          throw new Error("Failed to initialize OCR engine. Check if tesseract.js is installed.");
        }
      }

      console.log("[OCR Scanner] Worker methods:", Object.keys(workerRef.current || {}));

      setStatus("Recognizing text…");

      let result;
      if (typeof workerRef.current.recognize === "function") {
        result = await workerRef.current.recognize(canvas);
      } else if (typeof workerRef.current.recognizeText === "function") {
        result = await workerRef.current.recognizeText(canvas);
      } else {
        throw new Error("OCR worker has no recognize method.");
      }

      const text = result.data?.text?.trim() || "";
      console.log("[OCR Scanner] Extracted text:", text);

      if (text) {
        const batch = extractBatchFromOCR(text);
        console.log("[OCR Scanner] Extracted batch:", batch);
        if (batch) {
          onDetected?.(batch);
          await stopScan();
        } else {
          setError("No batch number detected. Try again with better lighting.");
          setStatus("");
        }
      } else {
        setError("No text detected. Try again with better lighting.");
        setStatus("");
      }
    } catch (e) {
      console.error("[OCR Scanner] Capture error:", e);
      setError(e?.message || String(e));
      setStatus("");
    }
  };

  const stop = async () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
    await stopScan();
  };

  return (
    <div className="flex flex-col gap-3 p-4 border border-slate-200" data-testid="camera-scanner">
      <div className="flex items-center justify-between">
        <p className="k-label">Live camera scan</p>
        <div className="flex items-center gap-2">
          {running && (
            <button
              type="button"
              onClick={captureAndOCR}
              data-testid="camera-scanner-capture"
              className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-700 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-emerald-50 transition-colors"
            >
              <Camera size={12} /> Capture
            </button>
          )}
          {running ? (
            <button
              type="button"
              onClick={stop}
              data-testid="camera-scanner-stop"
              className="inline-flex items-center gap-2 border border-red-200 text-red-700 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-red-50 transition-colors"
            >
              <StopCircle size={12} /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              data-testid="camera-scanner-start"
              className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-700 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-emerald-50 transition-colors"
            >
              <Camera size={12} /> Start Scan
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden border border-slate-200 bg-slate-50">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-[400px]"
          playsInline
          muted
          autoPlay
        />
        {!running && (
          <div className="py-12 flex items-center justify-center text-slate-400 text-xs font-mono tracking-[0.28em] uppercase">
            Camera Off
          </div>
        )}
        {running && status && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 border border-slate-200 px-3 py-1.5 text-[10px] font-mono text-slate-600 tracking-[0.2em] uppercase">
            {status}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div
          className="flex items-start gap-2 p-3 border border-red-200"
          style={{ background: "#FEF2F2" }}
          data-testid="camera-scanner-error"
        >
          <AlertTriangle size={14} className="text-red-700 mt-0.5" />
          <p className="text-xs text-slate-600">{error}. Ensure the device has camera access and reload if permissions were denied.</p>
        </div>
      )}
    </div>
  );
}