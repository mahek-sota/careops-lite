import React, { useState, useEffect } from "react";
import { apiFetch } from "../hooks/useApi";

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };
const SEVERITY_BADGE = { critical: "badge badge-critical", warning: "badge badge-warning", info: "badge badge-info" };
const TYPE_BADGE     = { workflow: "badge badge-info", burnout: "badge badge-purple" };
const STATUS_BADGE   = { open: "badge badge-critical", acknowledged: "badge badge-warning", snoozed: "badge badge-info", resolved: "badge badge-success" };

export default function AlertsPage() {
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState({ severity: "all", type: "all", status: "all" });
  const [snoozeModal, setSnoozeModal] = useState(null);
  const [snoozeHours, setSnoozeHours] = useState(24);

  const load = () =>
    apiFetch("/api/alerts").then(d => { setAlerts(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const updateAlert = async (id, status, snoozedUntil) => {
    await apiFetch(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...(snoozedUntil ? { snoozedUntil } : {}) }),
    });
    load();
  };

  const filtered = alerts
    .filter(a =>
      (filter.severity === "all" || a.severity === filter.severity) &&
      (filter.type === "all"     || a.type === filter.type) &&
      (filter.status === "all"   || a.status === filter.status)
    )
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  const counts = {
    total:    alerts.length,
    open:     alerts.filter(a => a.status === "open").length,
    critical: alerts.filter(a => a.severity === "critical").length,
  };

  if (loading) return <div className="page-loading">Loading alerts…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Unified Alerts</h2>
        <div className="stats-row">
          <div className="stat-chip">{counts.total} total</div>
          <div className="stat-chip critical">{counts.open} open</div>
          <div className="stat-chip critical">{counts.critical} critical</div>
        </div>
      </div>

      <div className="filter-bar" role="group" aria-label="Filter alerts">
        <select
          value={filter.severity}
          onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}
          aria-label="Filter by severity"
        >
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={filter.type}
          onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          <option value="workflow">Workflow</option>
          <option value="burnout">Burnout</option>
        </select>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="snoozed">Snoozed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="alert-list" role="list" aria-label="Alerts">
        {filtered.map(alert => (
          <div
            key={alert.id}
            className={`alert-card sev-${alert.severity}`}
            role="listitem"
            aria-label={`${alert.severity} alert: ${alert.title}`}
          >
            <div className="alert-card-header">
              <div className="alert-meta">
                <span className={SEVERITY_BADGE[alert.severity]}>{alert.severity}</span>
                <span className={TYPE_BADGE[alert.type]}>{alert.type}</span>
                <span className={STATUS_BADGE[alert.status]}>{alert.status}</span>
              </div>
              <time className="alert-time" dateTime={alert.timestamp}>
                {new Date(alert.timestamp).toLocaleString()}
              </time>
            </div>

            <div className="alert-body">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-entity">📍 {alert.entity}</div>
              <div className="alert-details">{alert.details}</div>
              {alert.status === "snoozed" && alert.snoozedUntil && (
                <div className="snooze-until">
                  Snoozed until {new Date(alert.snoozedUntil).toLocaleString()}
                </div>
              )}
            </div>

            <div className="alert-actions">
              {alert.status === "open" && (
                <>
                  <button className="btn sm secondary" onClick={() => updateAlert(alert.id, "acknowledged")}>
                    Acknowledge
                  </button>
                  <button className="btn sm secondary" onClick={() => setSnoozeModal(alert.id)}>
                    Snooze
                  </button>
                  <button className="btn sm success" onClick={() => updateAlert(alert.id, "resolved")}>
                    Resolve
                  </button>
                </>
              )}
              {alert.status === "acknowledged" && (
                <button className="btn sm success" onClick={() => updateAlert(alert.id, "resolved")}>
                  Resolve
                </button>
              )}
              {alert.status === "snoozed" && (
                <button className="btn sm secondary" onClick={() => updateAlert(alert.id, "open")}>
                  Reopen
                </button>
              )}
              {alert.status === "resolved" && (
                <button className="btn sm secondary" onClick={() => updateAlert(alert.id, "open")}>
                  Reopen
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" role="status">No alerts match your filters.</div>
        )}
      </div>

      {snoozeModal && (
        <div
          className="modal-overlay"
          onClick={() => setSnoozeModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Snooze alert"
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Snooze Alert</h3>
            <label htmlFor="snooze-hours">Snooze for how many hours?</label>
            <input
              id="snooze-hours"
              type="number"
              min="1"
              max="168"
              value={snoozeHours}
              onChange={e => setSnoozeHours(Number(e.target.value))}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => {
                const until = new Date(Date.now() + snoozeHours * 3600000).toISOString();
                updateAlert(snoozeModal, "snoozed", until);
                setSnoozeModal(null);
              }}>
                Confirm Snooze
              </button>
              <button className="btn secondary" onClick={() => setSnoozeModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}