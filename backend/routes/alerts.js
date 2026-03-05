import { Router } from "express";
import { caregiverData, workflowData } from "../data/seed.js";
import { getMemSettings } from "./settings.js";

const router = Router();
const memOverrides = {};

function generateAlerts(settings) {
  const alerts = [];
  const {
    weeklyHoursThreshold,
    restGapHoursThreshold,
    consecutiveShiftThreshold,
    workflowTimeoutMinutes,
  } = settings;

  for (const cg of caregiverData) {
    const hoursOver = cg.weeklyHours - weeklyHoursThreshold;
    const restDeficit = +(restGapHoursThreshold - cg.minRestGapHours).toFixed(1);
    const consecOver = cg.consecutiveLongShifts >= consecutiveShiftThreshold;

    const isCritical = hoursOver > 0 || restDeficit > 0;
    const isWarningConsec = consecOver && !isCritical;

    if (isCritical || isWarningConsec) {
      const detailParts = [];
      if (hoursOver > 0) {
        detailParts.push(`${cg.name} has worked ${cg.weeklyHours}h this week — ${hoursOver}h over the ${weeklyHoursThreshold}h limit`);
      }
      if (restDeficit > 0) {
        detailParts.push(`shortest rest gap is ${cg.minRestGapHours}h, which is ${restDeficit}h below the required ${restGapHoursThreshold}h`);
      }
      if (consecOver) {
        detailParts.push(`${cg.consecutiveLongShifts} consecutive long shifts (limit: ${consecutiveShiftThreshold})`);
      }

      alerts.push({
        id: `ALT-BRN-${cg.id}`,
        severity: isCritical ? "critical" : "warning",
        type: "burnout",
        entity: cg.name,
        title: hoursOver > 0 ? "Weekly hours limit exceeded" : "Burnout risk factors detected",
        details: detailParts.join(". ") + ".",
        timestamp: new Date().toISOString(),
        status: "open",
      });
      continue;
    }

    // Projection — use actual avg hours from logged shifts
    if (cg.shifts.length > 0) {
      const totalLoggedHours = cg.shifts.reduce((sum, s) => sum + s.hoursWorked, 0);
      const avgHoursPerShift = totalLoggedHours / cg.shifts.length;

      // Assume a standard 5-shift work week
      const STANDARD_WEEKLY_SHIFTS = 5;
      const shiftsRemaining = Math.max(0, STANDARD_WEEKLY_SHIFTS - cg.shifts.length);
      const projected = Math.round(cg.weeklyHours + shiftsRemaining * avgHoursPerShift);

      // Only warn if genuinely close — within 10% of threshold
      const nearThreshold = cg.weeklyHours >= weeklyHoursThreshold * 0.85;

      if (projected > weeklyHoursThreshold && nearThreshold) {
        alerts.push({
          id: `ALT-BRN-${cg.id}`,
          severity: "warning",
          type: "burnout",
          entity: cg.name,
          title: "Approaching weekly hours limit",
          details: `${cg.name} has worked ${cg.weeklyHours}h with ~${shiftsRemaining} shift${shiftsRemaining !== 1 ? "s" : ""} remaining this week. At their average of ${avgHoursPerShift.toFixed(1)}h/shift, they are projected to reach ${projected}h — over the ${weeklyHoursThreshold}h limit.`,
          timestamp: new Date().toISOString(),
          status: "open",
        });
      }
    }
  }

  // ---- Workflow alerts ----
  for (const wf of workflowData) {
    for (const e of wf.events) {
      if (e.status === "timeout" && e.duration > workflowTimeoutMinutes) {
        alerts.push({
          id: `ALT-WF-${wf.id}-TIMEOUT`,
          severity: "critical",
          type: "workflow",
          entity: `${wf.id} (${wf.clientName} - ${wf.name})`,
          title: "Workflow step timeout exceeded",
          details: `Step '${e.step}' has been pending for ${e.duration} min. The timeout threshold is ${workflowTimeoutMinutes} min.`,
          timestamp: wf.startedAt,
          status: "open",
        });
      }
      if (e.status === "skipped") {
        alerts.push({
          id: `ALT-WF-${wf.id}-SKIP`,
          severity: "critical",
          type: "workflow",
          entity: `${wf.id} (${wf.clientName} - ${wf.name})`,
          title: "Required step skipped",
          details: `Step '${e.step}' was never completed but the workflow was marked as finished. This step is required and cannot be skipped.`,
          timestamp: wf.startedAt,
          status: "open",
        });
      }
      if (e.status === "out-of-order") {
        alerts.push({
          id: `ALT-WF-${wf.id}-ORDER`,
          severity: "warning",
          type: "workflow",
          entity: `${wf.id} (${wf.clientName} - ${wf.name})`,
          title: "Steps executed out of order",
          details: `Step '${e.step}' was recorded before its prerequisites were completed in workflow '${wf.name}' for ${wf.clientName}.`,
          timestamp: wf.startedAt,
          status: "open",
        });
      }
    }
  }

  return alerts.map(a => ({
    ...a,
    ...(memOverrides[a.id] || {}),
  }));
}

router.get("/", (req, res) => {
  res.json(generateAlerts(getMemSettings()));
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { status, snoozedUntil } = req.body;
  const validStatuses = ["open", "acknowledged", "resolved", "snoozed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  memOverrides[id] = { status, ...(snoozedUntil ? { snoozedUntil } : {}) };
  res.json({ ok: true, id, status });
});

export default router;