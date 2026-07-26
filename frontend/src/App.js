import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react"
import "@/App.css";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import Landing from "@/pages/Landing";
import PharmacyAuth from "@/pages/PharmacyAuth";
import PharmacyDashboard from "@/pages/PharmacyDashboard";
import PatientHub from "@/pages/PatientHub";
import AuthCallback from "@/pages/AuthCallback";
import PharmacyOnboarding from "@/pages/PharmacyOnboarding";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

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
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
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
            theme="light"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#0F172A",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
    </div>
  );
}

export default App;
