import React from "react";

/**
 * A small "Continue with Google" button that redirects to Emergent's OAuth
 * gateway. `flow` is echoed back in the callback query string so we can route
 * appropriately (pharmacy onboarding vs patient identify-yourself).
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
export default function GoogleSignInButton({ flow = "pharmacy", label, className = "", testid }) {
  const start = () => {
    const redirectUrl = `${window.location.origin}/auth/callback?flow=${encodeURIComponent(flow)}`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <button
      type="button"
      onClick={start}
      data-testid={testid || `google-signin-${flow}`}
      className={`w-full inline-flex items-center justify-center gap-3 py-3 px-4 border border-[#E2E8F0]/25 bg-black text-white text-sm font-medium hover:bg-[#1E2B4E] transition-colors ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l5.9-5.8C34.4 3.6 29.8 1.5 24 1.5 14.8 1.5 6.9 6.9 3 14.8l6.9 5.4C11.7 14.3 17.4 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.8 6.7-17.4z"/>
        <path fill="#FBBC05" d="M9.9 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6L3 14C1.4 17.1.5 20.4.5 24s.9 6.9 2.5 10l6.9-5.4z"/>
        <path fill="#34A853" d="M24 46.5c6.5 0 11.9-2.2 15.9-5.9l-7.3-5.7c-2 1.4-4.6 2.2-8.6 2.2-6.6 0-12.3-4.8-14.1-11.2L3 30.6C6.9 39.1 14.8 46.5 24 46.5z"/>
      </svg>
      <span>{label || "Continue with Google"}</span>
    </button>
  );
}
