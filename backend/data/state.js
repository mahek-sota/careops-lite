import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultSettings } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "state.json");

export function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch {}
  return {
    settings: { ...defaultSettings },
    alertOverrides: {},
  };
}

export function saveState(state) {
  fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), (err) => {
    if (err) console.error("Failed to write state.json:", err);
  });
}