import { Router } from "express";
import { caregiverData } from "../data/seed.js";
import { getMemSettings } from "./settings.js";

const router = Router();

function evaluateCaregiver(cg, settings) {
  const { weeklyHoursThreshold, restGapHoursThreshold, consecutiveShiftThreshold } = settings;
  const reasons = [];
  let riskScore = 0;

  // Weekly hours
  const hoursOver = cg.weeklyHours - weeklyHoursThreshold;
  if (hoursOver > 0) {
    reasons.push(`Working ${cg.weeklyHours}h this week — ${hoursOver}h over the ${weeklyHoursThreshold}h threshold`);
    riskScore += Math.min(40, hoursOver * 4);
  } else {
    // project remaining shifts
    const shiftsLeft = 5 - cg.shifts.length;
    const avgHours = cg.weeklyHours / cg.shifts.length;
    const projected = Math.round(cg.weeklyHours + shiftsLeft * avgHours);
    if (projected > weeklyHoursThreshold) {
      reasons.push(`Projected ${projected}h by week end — will exceed ${weeklyHoursThreshold}h threshold`);
      riskScore += 15;
    }
  }

  // Rest gap
  if (cg.minRestGapHours < restGapHoursThreshold) {
    const deficit = (restGapHoursThreshold - cg.minRestGapHours).toFixed(1);
    reasons.push(`Minimum rest gap is ${cg.minRestGapHours}h — ${deficit}h below the ${restGapHoursThreshold}h requirement`);
    riskScore += 30;
  }

  // Consecutive shifts
  if (cg.consecutiveLongShifts >= consecutiveShiftThreshold) {
    reasons.push(`${cg.consecutiveLongShifts} consecutive long shifts — threshold is ${consecutiveShiftThreshold}`);
    riskScore += 20;
  }

  // Uneven distribution (low risk signal)
  if (reasons.length === 0 && cg.shifts.length > 0) {
    const maxShift = Math.max(...cg.shifts.map(s => s.hoursWorked));
    const minShift = Math.min(...cg.shifts.map(s => s.hoursWorked));
    if (maxShift - minShift >= 4) {
      reasons.push(`Uneven shift distribution — shifts range from ${minShift}h to ${maxShift}h`);
      riskScore += 5;
    }
  }

  const riskLevel = riskScore >= 60 ? "high" : riskScore >= 25 ? "medium" : "low";

  return {
    ...cg,
    maxWeeklyHours: weeklyHoursThreshold,
    reasons,
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
  };
}

router.get("/", (req, res) => {
  const settings = getMemSettings();
  const evaluated = caregiverData
    .map(cg => evaluateCaregiver(cg, settings))
    .sort((a, b) => b.riskScore - a.riskScore);
  res.json(evaluated);
});

router.get("/:id", (req, res) => {
  const settings = getMemSettings();
  const cg = caregiverData.find(c => c.id === req.params.id);
  if (!cg) return res.status(404).json({ error: "Not found" });
  res.json(evaluateCaregiver(cg, settings));
});

export default router;