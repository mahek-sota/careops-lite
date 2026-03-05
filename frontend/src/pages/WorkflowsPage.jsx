import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../hooks/useApi";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/workflows")
      .then(d => { setWorkflows(d); setLoading(false); })
      .catch(err => {
        console.error("Workflows fetch failed:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-loading">Loading workflows…</div>;

  const broken = workflows.filter(w => w.status === "broken");
  const ok = workflows.filter(w => w.status !== "broken");

  return (
    <div className="page">
      <div className="page-header">
        <h2>Workflow Debugger</h2>
        <div className="stats-row">
          <div className="stat-chip red">{broken.length} broken</div>
          <div className="stat-chip green">{ok.length} healthy</div>
        </div>
      </div>

      {broken.length > 0 && (
        <>
          <h3 className="section-label">🔴 Broken Workflows</h3>
          <div className="workflow-grid">
            {broken.map(wf => (
              <div key={wf.id} className="workflow-card broken" onClick={() => navigate(`/dashboard/workflows/${wf.id}`)}>
                <div className="wf-header">
                  <span className="wf-id">{wf.id}</span>
                  <span className="badge badge-critical">broken</span>
                </div>
                <div className="wf-name">{wf.name}</div>
                <div className="wf-client">👤 {wf.clientName}</div>
                <div className="wf-reason">⚠️ {wf.alertReason}</div>
                <div className="wf-footer">
                  <span>{wf.stepCount} steps</span>
                  <span className="wf-issues">{wf.issueCount} issue{wf.issueCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="section-label">✅ Healthy Workflows</h3>
      <div className="workflow-grid">
        {ok.map(wf => (
          <div key={wf.id} className="workflow-card" onClick={() => navigate(`/dashboard/workflows/${wf.id}`)}>
            <div className="wf-header">
              <span className="wf-id">{wf.id}</span>
              <span className="badge badge-success">completed</span>
            </div>
            <div className="wf-name">{wf.name}</div>
            <div className="wf-client">👤 {wf.clientName}</div>
            <div className="wf-footer"><span>{wf.stepCount} steps</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}