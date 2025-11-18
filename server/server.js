require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs").promises;
const { randomUUID } = require("crypto");

const app = express();

/* ============ Config ============ */
const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change_me_dev_secret";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@geobites.com";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "Owner@123";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_BASE = {
  httpOnly: true,
  sameSite: IS_PROD ? "none" : "lax",
  secure: IS_PROD,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// file storage
const DATA_DIR = path.join(__dirname, "data");
const CONTACTS_PATH = path.join(DATA_DIR, "contact.json");

/* ============ Store utils ============ */
async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONTACTS_PATH);
  } catch {
    await fs.writeFile(CONTACTS_PATH, "[]", "utf8");
  }
}
async function readContacts() {
  try {
    const raw = await fs.readFile(CONTACTS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
async function writeContacts(list) {
  await fs.writeFile(CONTACTS_PATH, JSON.stringify(list, null, 2), "utf8");
}

/* ============ Middleware ============ */
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    hasCookie: !!req.cookies?.token,
  });
  next();
});

/* ============ Health ============ */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ============ Auth helpers ============ */
function setOwnerCookie(res, email) {
  const token = jwt.sign({ role: "owner", email }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token, COOKIE_BASE);
}
function requireOwner(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "owner")
      return res.status(401).json({ message: "Unauthorized" });
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/* ============ Auth routes ============ */
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid payload" });
  }
  if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
    setOwnerCookie(res, email);
    return res.json({ ok: true, role: "owner", email });
  }
  return res.status(401).json({ message: "Invalid credentials" });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: COOKIE_BASE.sameSite,
    secure: COOKIE_BASE.secure,
  });
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ authenticated: false });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({
      authenticated: true,
      role: payload.role,
      email: payload.email,
    });
  } catch {
    return res.json({ authenticated: false });
  }
});

/* ============ Contact routes ============ */
app.post("/api/contact", async (req, res) => {
  const {
    name = "",
    subject = "",
    email = "",
    description = "",
  } = req.body || {};
  const entry = {
    id: randomUUID(),
    name: String(name).trim(),subject: String(subject).trim(),
    email: String(email).trim(),
    description: String(description).trim(),
    createdAt: new Date().toISOString(),
  };
  if (!entry.name && !entry.email && !entry.subject && !entry.description) {
    return res.status(400).json({ message: "Empty message" });
  }
  try {
    const list = await readContacts();
    list.push(entry);
    await writeContacts(list);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Failed to save message" });
  }
});

app.get("/api/contact", requireOwner, async (_req, res) => {
  try {
    const list = await readContacts();
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(list);
  } catch {
    res.status(500).json({ message: "Failed to read messages" });
  }
});

app.delete("/api/contact/:id", requireOwner, async (req, res) => {
  const id = String(req.params.id || "").trim();
  console.log("DELETE /api/contact", { id });

  try {
    const list = await readContacts();
    const next = list.filter((m) => String(m.id).trim() !== id);
    if (next.length === list.length) {
      return res.status(404).json({ message: "Message not found" });
    }
    await writeContacts(next);
    res.json({ ok: true });
  } catch (e) {
    console.error("Delete error", e);
    res.status(500).json({ message: "Failed to delete" });
  }
});

/* ============ Start ============ */
(async () => {
  await ensureStore();
  console.log("CONTACTS_PATH:", CONTACTS_PATH);
  app.listen(PORT, () =>
    console.log(`API running on http://localhost:${PORT}`)
  );
})();