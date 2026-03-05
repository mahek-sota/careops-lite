import React, { useEffect, useState } from "react";
import { apiFetch } from "../hooks/useApi";

const RISK_BADGE = { high: "badge badge-critical", medium: "badge badge-warning", low: "badge badge-success" };
const RISK_BAR   = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    apiFetch("/api/caregivers")
      .then(d => { setCaregivers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading caregiver data…</div>;

  const sorted = [...caregivers].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Burnout Risk Monitor</h2>
        <div className="stats-row">
          <div className="stat-chip critical">
            {caregivers.filter(c => c.riskLevel === "high").length} high risk
          </div>
          <div className="stat-chip warning">
            {caregivers.filter(c => c.riskLevel === "medium").length} medium
          </div>
          <div className="stat-chip success">
            {caregivers.filter(c => c.riskLevel === "low").length} low
          </div>
        </div>
      </div>

      <div className="cg-table-wrap">
        <table className="cg-table" role="table" aria-label="Caregiver burnout risk">
          <thead>
            <tr>
              <th scope="col">Caregiver</th>
              <th scope="col">Risk</th>
              <th scope="col">Score</th>
              <th scope="col">Weekly Hours</th>
              <th scope="col">Min Rest Gap</th>
              <th scope="col">Consec. Shifts</th>
              <th scope="col">Risk Factors</th>
              <th scope="col"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(cg => (
              <React.Fragment key={cg.id}>
                <tr
                  className={`cg-row risk-row-${cg.riskLevel} ${selected === cg.id ? "cg-row-selected" : ""}`}
                  onClick={() => setSelected(cg.id === selected ? null : cg.id)}
                  aria-expanded={selected === cg.id}
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setSelected(cg.id === selected ? null : cg.id)}
                  role="button"
                  aria-label={`${cg.name}, ${cg.riskLevel} risk, score ${cg.riskScore}. Click to ${selected === cg.id ? "collapse" : "expand"} details.`}
                >
                  <td className="cg-name-cell">{cg.name}</td>

                  <td>
                    <span className={RISK_BADGE[cg.riskLevel]}>
                      {cg.riskLevel === "high" ? "⚠ " : cg.riskLevel === "medium" ? "◐ " : "✓ "}
                      {cg.riskLevel}
                    </span>
                  </td>

                  <td>
                    <div className="score-cell">
                      <div className="mini-bar-track" role="progressbar" aria-valuenow={cg.riskScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Risk score ${cg.riskScore} out of 100`}>
                        <div className="mini-bar-fill" style={{ width: `${cg.riskScore}%`, background: RISK_BAR[cg.riskLevel] }} />
                      </div>
                      <span className="mini-score">{cg.riskScore}</span>
                    </div>
                  </td>

                  <td>
                    <span className={cg.weeklyHours > cg.maxWeeklyHours ? "text-critical" : ""}>
                      {cg.weeklyHours}h
                    </span>
                    <span className="text-muted"> / {cg.maxWeeklyHours}h</span>
                  </td>

                  <td>
                    <span className={cg.minRestGapHours < 8 ? "text-critical" : ""}>
                      {cg.minRestGapHours}h
                    </span>
                  </td>

                  <td>
                    <span className={cg.consecutiveLongShifts >= 3 ? "text-warning" : ""}>
                      {cg.consecutiveLongShifts}
                    </span>
                  </td>

                  <td className="reasons-cell">
                    {cg.reasons.length === 0
                      ? <span className="text-success">None</span>
                      : cg.reasons.map((r, i) => (
                          <span key={i} className="reason-tag">{r}</span>
                        ))
                    }
                  </td>

                  <td className="expand-cell" aria-hidden="true">
                    <span className="expand-btn">{selected === cg.id ? "▲" : "▼"}</span>
                  </td>
                </tr>

                {selected === cg.id && (
                  <tr className="cg-detail-row">
                    <td colSpan={8}>
                      <div className="cg-detail-inner">
                        <h4>Recent Shifts — {cg.name}</h4>
                        {cg.reasons.length > 0 && (
                          <div className="detail-reasons">
                            {cg.reasons.map((r, i) => (
                              <div key={i} className="detail-reason-item">
                                <span className="badge badge-warning" aria-hidden="true">⚠</span>
                                {r}
                              </div>
                            ))}
                          </div>
                        )}
                        <table className="shift-table" aria-label={`Shifts for ${cg.name}`}>
                          <thead>
                            <tr>
                              <th scope="col">Date</th>
                              <th scope="col">Start</th>
                              <th scope="col">End</th>
                              <th scope="col">Hours</th>
                              <th scope="col">Client</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cg.shifts.map((s, i) => (
                              <tr key={i}>
                                <td>{s.date}</td>
                                <td>{s.startTime}</td>
                                <td>{s.endTime}</td>
                                <td><strong>{s.hoursWorked}h</strong></td>
                                <td>{s.clientName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}