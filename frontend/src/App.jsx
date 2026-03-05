import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./pages/DashboardLayout";
import AlertsPage from "./pages/AlertsPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import WorkflowDetailPage from "./pages/WorkflowDetailPage";
import CaregiversPage from "./pages/CaregiversPage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AlertsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="workflows" element={<WorkflowsPage />} />
        <Route path="workflows/:id" element={<WorkflowDetailPage />} />
        <Route path="caregivers" element={<CaregiversPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}