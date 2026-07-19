import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import Landing from "@/pages/Landing";
import PharmacyAuth from "@/pages/PharmacyAuth";
import PharmacyDashboard from "@/pages/PharmacyDashboard";
import PatientHub from "@/pages/PatientHub";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pharmacy/auth" element={<PharmacyAuth />} />
            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute>
                  <PharmacyDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/patient" element={<PatientHub />} />
          </Routes>
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#1F2326",
                border: "1px solid rgba(226,232,240,0.15)",
                color: "#E2E8F0",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
