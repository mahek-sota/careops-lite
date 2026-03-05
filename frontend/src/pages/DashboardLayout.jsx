import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

const NAV = [
  { path: "/dashboard/alerts",     label: "Alerts",       icon: "🔔" },
  { path: "/dashboard/workflows",  label: "Workflows",    icon: "⚙️" },
  { path: "/dashboard/caregivers", label: "Burnout Risk", icon: "👤" },
  { path: "/dashboard/settings",   label: "Settings",     icon: "🎛️" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="layout">
      {/* Mobile topbar */}
      <header className="topbar" role="banner">
        <button
          className="topbar-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
        >
          ☰
        </button>
        <span className="topbar-title">🏥 CareOps</span>
      </header>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-logo" aria-hidden="true">🏥</span>
            <span className="sidebar-title">CareOps</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              aria-current={location.pathname.startsWith(n.path) ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={toggle}
            className="btn-theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {user && (
            <div className="user-info" role="status" aria-label={`Signed in as ${user.name}`}>
              {user.photo && <img src={user.photo} alt="" className="user-avatar" aria-hidden="true" />}
              <div className="user-text">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          )}

          <button onClick={logout} className="btn-logout" aria-label="Sign out of CareOps">
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}