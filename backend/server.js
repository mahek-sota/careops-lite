import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { fileURLToPath } from "url";
import path from "path";
import MemoryStore from "memorystore";

import alertsRouter from "./routes/alerts.js";
import workflowsRouter from "./routes/workflows.js";
import caregiverRouter from "./routes/caregivers.js";
import settingsRouter from "./routes/settings.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const MemStore = MemoryStore(session);

// trust proxy MUST be first
app.set("trust proxy", 1);

// single CORS — must be before everything else
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  name: "careops.sid",
  store: new MemStore({ checkPeriod: 86400000 }),
  cookie: {
    secure: false,
    sameSite: "lax",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL || "http://localhost:4000"}/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => {
  return done(null, {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    photo: profile.photos[0]?.value,
  });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

import { loadState } from "./data/state.js";

function isAuthorized(email) {
  const st = loadState();
  const auth = st.auth || {};

  const allowedEmails = (auth.allowedEmails || []).map(e => e.toLowerCase());
  const allowedDomains = (auth.allowedDomains || []).map(d => d.toLowerCase());

  const userEmail = (email || "").toLowerCase();
  const domain = userEmail.split("@")[1];

  if (allowedEmails.includes(userEmail)) return true;
  if (allowedDomains.includes(domain)) return true;

  return false;
}

function getRole(email) {
  const st = loadState();
  const admins = (st.auth?.admins || []).map(e => e.toLowerCase());
  return admins.includes(email.toLowerCase()) ? "admin" : "supervisor";
}

// Auth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login?error=auth_failed"
  }),
  (req, res) => {

    const email = req.user?.email;

    if (!isAuthorized(email)) {
      req.logout(() => {
        res.redirect("http://localhost:5173/login?error=not_authorized");
      });
      return;
    }

    req.session.user = {
      email,
      role: getRole(email),
      org: "heylo.tech"
    };

    req.session.save(() => {
      res.redirect("http://localhost:5173/dashboard");
    });
  }
);

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.post("/auth/logout", (req, res) => {
  req.logout(() => res.json({ ok: true }));
});

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
}

app.use("/api/alerts", requireAuth, alertsRouter);
app.use("/api/workflows", requireAuth, workflowsRouter);
app.use("/api/caregivers", requireAuth, caregiverRouter);
app.use("/api/settings", requireAuth, settingsRouter);

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CareOps backend running on port ${PORT}`));