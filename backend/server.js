require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs").promises;
const { randomUUID } = require("crypto");

const app = express();

/* ============ Config ============ */
const PORT = Number(process.env.PORT) || 4000;

const IS_PROD = process.env.NODE_ENV === "production";

// ✅ NO DEFAULTS for secrets (especially on Render)
const JWT_SECRET = process.env.JWT_SECRET;
const OWNER_EMAIL = process.env.OWNER_EMAIL;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;

// CORS origin must be your frontend URL (or Render static if same domain)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// ✅ Crash in production if secrets missing
if (IS_PROD) {
  const REQUIRED = ["JWT_SECRET", "OWNER_EMAIL", "OWNER_PASSWORD", "CORS_ORIGIN"];
  for (const k of REQUIRED) {
    if (!process.env[k]) {
      console.error(`❌ Missing environment variable: ${k}`);
      process.exit(1);
    }
  }
}

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: IS_PROD ? "none" : "lax",
  secure: IS_PROD, // must be true with sameSite "none"
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/* ============ File storage paths ============ */
const DATA_DIR = path.join(__dirname, "data");
const CONTACTS_PATH = path.join(DATA_DIR, "contact.json");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const CARTS_PATH = path.join(DATA_DIR, "carts.json");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");

/* ============ Store utils ============ */
async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  async function ensureFile(filePath, fallback) {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, fallback, "utf8");
    }
  }

  await ensureFile(CONTACTS_PATH, "[]");
  await ensureFile(USERS_PATH, "[]");
  await ensureFile(CARTS_PATH, "{}");
  await ensureFile(ORDERS_PATH, "[]");
}

/* ---- Contacts ---- */
async function readContacts() {
  try {
    const raw = await fs.readFile(CONTACTS_PATH, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

async function writeContacts(list) {
  await fs.writeFile(CONTACTS_PATH, JSON.stringify(list, null, 2), "utf8");
}

/* ---- Users ---- */
async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_PATH, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

async function writeUsers(list) {
  await fs.writeFile(USERS_PATH, JSON.stringify(list, null, 2), "utf8");
}

/* ---- Carts ---- */
async function readCarts() {
  try {
    const raw = await fs.readFile(CARTS_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

async function writeCarts(obj) {
  await fs.writeFile(CARTS_PATH, JSON.stringify(obj, null, 2), "utf8");
}

/* ---- Orders ---- */
async function readOrders() {
  try {
    const raw = await fs.readFile(ORDERS_PATH, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

async function writeOrders(list) {
  await fs.writeFile(ORDERS_PATH, JSON.stringify(list, null, 2), "utf8");
}

/* ============ Auth helpers ============ */
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireOwner(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "owner") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/* ============ Middleware ============ */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ============ Health ============ */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ============ Auth routes ============ */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid payload" });
  }

  // ✅ Owner login (from env vars)
  if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
    const token = jwt.sign({ role: "owner", email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, COOKIE_BASE);

    // ✅ DO NOT return token in JSON
    return res.json({
      ok: true,
      user: { role: "owner", email },
    });
  }

  // Normal user login
  try {
    const users = await readUsers();
    const u = users.find((x) => x.email === email);
    if (!u) return res.status(401).json({ message: "Invalid credentials" });

    const ok = bcrypt.compareSync(password, u.passwordHash || "");
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { role: "user", email: u.email, name: u.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, COOKIE_BASE);

    // ✅ DO NOT return token in JSON
    return res.json({
      ok: true,
      user: { role: "user", email: u.email, name: u.name },
    });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { name = "", email = "", password = "" } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const users = await readUsers();
    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "User exists" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = { email, name, passwordHash };
    users.push(user);
    await writeUsers(users);

    const token = jwt.sign(
      { role: "user", email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, COOKIE_BASE);

    // ✅ DO NOT return token in JSON
    res.json({
      ok: true,
      user: { role: "user", email: user.email, name: user.name },
    });
  } catch (e) {
    console.error("signup error", e);
    res.status(500).json({ message: "Failed to create user" });
  }
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
      name: payload.name,
    });
  } catch {
    return res.json({ authenticated: false });
  }
});

/* ============ Contact routes ============ */
app.post("/api/contact", async (req, res) => {
  const { name = "", subject = "", email = "", description = "" } = req.body || {};

  const entry = {
    id: randomUUID(),
    name: String(name).trim(),
    subject: String(subject).trim(),
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

/* ============ Cart routes ============ */
app.get("/api/cart", requireAuth, async (req, res) => {
  try {
    const carts = await readCarts();
    const cart = carts[req.user.email] || [];
    res.json(cart);
  } catch {
    res.status(500).json({ message: "Failed to read cart" });
  }
});

app.post("/api/cart", requireAuth, async (req, res) => {
  try {
    const carts = await readCarts();
    const newCart = Array.isArray(req.body) ? req.body : [];
    carts[req.user.email] = newCart;
    await writeCarts(carts);
    res.json({ ok: true });
  } catch (e) {
    console.error("save cart error", e);
    res.status(500).json({ message: "Failed to save cart" });
  }
});

/* ============ Orders routes ============ */
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const { name = "", address = "", items = [] } = req.body || {};

    if (!name || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing order fields" });
    }

    // ✅ Recalculate totals on server (don’t trust client total)
    const safeItems = items
      .map((it) => ({
        id: String(it.id || ""),
        name: String(it.name || ""),
        price: Number(it.price || 0),
        qty: Number(it.qty || 0),
      }))
      .filter((it) => it.name && it.price > 0 && it.qty > 0);

    if (safeItems.length === 0) {
      return res.status(400).json({ message: "Invalid items" });
    }

    const subtotal = safeItems.reduce((s, it) => s + it.price * it.qty, 0);
    const fee = 3; // your delivery fee
    const total = subtotal + fee;

    const orders = await readOrders();
    const order = {
      id: randomUUID(),
      email: req.user.email,
      name: String(name).trim(),
      address: String(address).trim(),
      items: safeItems,
      subtotal: Number(subtotal.toFixed(2)),
      fee,
      total: Number(total.toFixed(2)),
      createdAt: new Date().toISOString(),
    };

    orders.push(order);
    await writeOrders(orders);
    res.json({ ok: true, orderId: order.id });
  } catch (e) {
    console.error("save order error", e);
    res.status(500).json({ message: "Failed to save order" });
  }
});

app.get("/api/orders", requireOwner, async (_req, res) => {
  try {
    const orders = await readOrders();
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch {
    res.status(500).json({ message: "Failed to read orders" });
  }
});

/* ============ Serve React build (from frontend/build) ============ */
const clientBuildPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(clientBuildPath));


app.use(express.static(clientBuildPath));

// ✅ Node 22 safe catch-all for React Router (exclude /api)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

/* ============ Start ============ */
(async () => {
  await ensureStore();
  app.listen(PORT, () => {
    console.log(`✅ API running on http://localhost:${PORT}`);
  });
})();