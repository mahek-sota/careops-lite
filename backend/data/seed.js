import caregiverData from "./caregivers.json" with { type: "json" };
import workflowData from "./workflows.json" with { type: "json" };

export { caregiverData, workflowData };

export const defaultSettings = {
  weeklyHoursThreshold: 48,
  restGapHoursThreshold: 8,
  workflowTimeoutMinutes: 30,
  consecutiveShiftThreshold: 3,
};