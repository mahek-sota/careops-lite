import { Router } from "express";
import { loadState } from "../data/state.js";

const router = Router();

let memSettings = null;

export function getMemSettings() {
  if (!memSettings) {
    memSettings = loadState().settings;
  }
  return memSettings;
}

router.get("/", (req, res) => {
  res.json(getMemSettings());
});

router.put("/", (req, res) => {
  const { weeklyHoursThreshold, restGapHoursThreshold, workflowTimeoutMinutes, consecutiveShiftThreshold } = req.body;
  memSettings = {
    weeklyHoursThreshold: Number(weeklyHoursThreshold),
    restGapHoursThreshold: Number(restGapHoursThreshold),
    workflowTimeoutMinutes: Number(workflowTimeoutMinutes),
    consecutiveShiftThreshold: Number(consecutiveShiftThreshold),
  };
  res.json(memSettings);
});

export default router;