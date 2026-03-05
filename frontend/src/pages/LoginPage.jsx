import React from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function LoginPage() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">🛠️</span>
          <h1>CareOps Lite</h1>
          <p>Supervisor Console</p>
        </div>

        {error === "not_authorized" && (
          <div className="login-error">
            Your account is not authorized to access this supervisor console.
          </div>
        )}

        <button
          className="btn-google"
          onClick={() => (window.location.href = "http://localhost:4000/auth/google")}
        >
          Sign in with Google
        </button>

        <div className="login-note">
          Demo access is restricted to authorized supervisors.
        </div>
      </div>
    </div>
  );
}