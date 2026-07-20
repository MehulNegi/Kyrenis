import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import Landing from "@/pages/Landing";
import PharmacyAuth from "@/pages/PharmacyAuth";
import PharmacyDashboard from "@/pages/PharmacyDashboard";
import PatientHub from "@/pages/PatientHub";
import AuthCallback from "@/pages/AuthCallback";
import PharmacyOnboarding from "@/pages/PharmacyOnboarding";

// Synchronous session_id detection prevents race with global AuthProvider./me
function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
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
      <Route
        path="/pharmacy/onboarding"
        element={
          <ProtectedRoute allowRoles={["PENDING_ONBOARDING", "PHARMACY_STAFF"]}>
            <PharmacyOnboarding />
          </ProtectedRoute>
        }
      />
      <Route path="/patient" element={<PatientHub />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
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
