import { useState, useEffect } from "react";

const API = "http://localhost:4000";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API}/api/me`, { credentials: "include" });

        if (res.status === 401) {
          if (!cancelled) setUser(null);
          return;
        }

        if (!res.ok) throw new Error(`Auth check failed: ${res.status}`);

        const data = await res.json();
        // backend returns the user object directly
        if (!cancelled) setUser(data || null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/login";
  };

  return { user, loading, logout };
}