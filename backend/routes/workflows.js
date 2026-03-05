import { Router } from "express";
import { workflowData } from "../data/seed.js";
import { getMemSettings } from "./settings.js";

const router = Router();

function generateAlertReason(events, timeoutMinutes) {
  const issues = [];

  for (const e of events) {
    if (e.status === "timeout") {
      issues.push(`Step '${e.step}' timed out after ${e.duration} min (threshold: ${timeoutMinutes} min)`);
    }
    if (e.status === "skipped") {
      issues.push(`Required step '${e.step}' was skipped`);
    }
    if (e.status === "out-of-order") {
      issues.push(`Step '${e.step}' was executed out of order`);
    }
  }

  return issues.length > 0 ? issues.join("; ") : null;
}

function evaluateWorkflow(wf, timeoutMinutes) {
  const events = wf.events.map(e => {
    if (e.status === "timeout") {
      if (e.duration <= timeoutMinutes) {
        return { ...e, status: "completed", details: null };
      }
      return { ...e, details: `No response for ${e.duration} min (threshold: ${timeoutMinutes} min)` };
    }
    return e;
  });

  const issueEvents = events.filter(e =>
    ["timeout", "skipped", "out-of-order"].includes(e.status)
  );

  const stillBroken = issueEvents.length > 0;
  const alertReason = stillBroken ? generateAlertReason(events, timeoutMinutes) : null;

  return {
    ...wf,
    events,
    status: stillBroken ? "broken" : "completed",
    alertReason,
    issueCount: issueEvents.length,
    stepCount: events.length,
  };
}

router.get("/", (req, res) => {
  const { workflowTimeoutMinutes } = getMemSettings();
  const result = workflowData.map(wf => {
    const evaluated = evaluateWorkflow(wf, workflowTimeoutMinutes);
    const { events, ...summary } = evaluated;
    return summary;
  });
  res.json(result);
});

router.get("/:id", (req, res) => {
  const { workflowTimeoutMinutes } = getMemSettings();
  const wf = workflowData.find(w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: "Not found" });
  res.json(evaluateWorkflow(wf, workflowTimeoutMinutes));
});

export default router;