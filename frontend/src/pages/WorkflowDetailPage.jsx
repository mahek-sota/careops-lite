import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../hooks/useApi";

const STEP_ICONS = {
  completed: "✅", timeout: "⏱️", skipped: "⛔", "out-of-order": "🔀", pending: "⏳",
};

const STEP_BADGE = {
  completed:     "badge badge-success",
  timeout:       "badge badge-critical",
  skipped:       "badge badge-critical",
  "out-of-order": "badge badge-warning",
  pending:       "badge badge-muted",
};

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wf, setWf] = useState(null);

  useEffect(() => {
    apiFetch(`/api/workflows/${id}`).then(setWf);
  }, [id]);

  if (!wf) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back to Workflows</button>
      <div className="page-header">
        <div>
          <span className="wf-id-large">{wf.id}</span>
          <h2>{wf.name} — {wf.clientName}</h2>
        </div>
        <span className={`badge ${wf.status === "broken" ? "badge-critical" : "badge-success"}`}>
          {wf.status}
        </span>
      </div>

      {wf.alertReason && (
        <div className="reason-banner">
          <strong>Alert reason:</strong> {wf.alertReason}
        </div>
      )}

      <div className="timeline">
        <h3>Step Timeline</h3>
        {wf.events.map((ev, i) => (
          <div key={ev.id} className={`timeline-step step-${ev.status}`}>
            <div className="step-dot" aria-hidden="true">
              {STEP_ICONS[ev.status] || "•"}
            </div>
            <div className="step-body">
              <div className="step-name">{ev.step}</div>
              <div className="step-meta">
                {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "—"}
                {ev.duration > 0 && ` · ${ev.duration} min`}
                {ev.details && <span className="step-detail"> · {ev.details}</span>}
              </div>
            </div>
            <span className={STEP_BADGE[ev.status] || "badge badge-muted"}>
              {ev.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}