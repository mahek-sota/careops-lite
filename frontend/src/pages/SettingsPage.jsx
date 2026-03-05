import React, { useState, useEffect } from "react";
import { apiFetch } from "../hooks/useApi";

const FIELDS = [
  { key: "weeklyHoursThreshold", label: "Weekly Hours Threshold", unit: "hours", description: "Alerts fire when a caregiver exceeds this many hours in a week." },
  { key: "restGapHoursThreshold", label: "Minimum Rest Gap", unit: "hours", description: "Minimum required rest between shifts before a burnout alert fires." },
  { key: "workflowTimeoutMinutes", label: "Workflow Step Timeout", unit: "minutes", description: "A workflow alert fires if a step is pending longer than this." },
  { key: "consecutiveShiftThreshold", label: "Consecutive Long Shifts Threshold", unit: "shifts", description: "Number of back-to-back long shifts before flagging burnout risk." },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/settings").then(d => { setSettings(d); setDraft(d); setLoading(false); });
  }, []);

  const save = async () => {
    const updated = await apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(draft) });
    setSettings(updated); setDraft(updated); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isDirty = settings && draft && JSON.stringify(settings) !== JSON.stringify(draft);

  if (loading) return <div className="page-loading">Loading settings…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Alert Thresholds</h2>
        {saved && <div className="save-toast">✅ Settings saved</div>}
      </div>
      <div className="settings-form">
        {FIELDS.map(f => (
          <div key={f.key} className="settings-row">
            <div className="settings-label">
              <label>{f.label}</label>
              <p className="settings-desc">{f.description}</p>
            </div>
            <div className="settings-input">
              <input
                type="number" min="0" value={draft[f.key]}
                onChange={e => setDraft(d => ({ ...d, [f.key]: Number(e.target.value) }))}
              />
              <span className="unit">{f.unit}</span>
            </div>
          </div>
        ))}
        <div className="settings-footer">
          <button className="btn" disabled={!isDirty} onClick={save}>Save Changes</button>
          <button className="btn secondary" disabled={!isDirty} onClick={() => setDraft(settings)}>Reset</button>
        </div>
      </div>
    </div>
  );
}