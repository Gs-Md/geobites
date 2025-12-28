require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const {
  testDb,
  dbFindUserByEmail,
  dbCreateUser,
  dbCreateContact,
  dbGetAllContacts,
  dbDeleteContact,
  dbGetCartByEmail,
  dbUpsertCart,
  dbCreateOrder,
  dbCreateOrderItem,
  dbGetAllOrdersWithItems,
} = require("./db");

const app = express();

/* ============ Config ============ */
const PORT = Number(process.env.PORT) || 4000;
const IS_PROD = process.env.NODE_ENV === "production";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@test.com";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "123456";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

/**
 * IMPORTANT:
 * - For localhost testing: sameSite="lax", secure=false
 * - For production HTTPS: sameSite="none", secure=true
 */
const COOKIE_BASE = {
  httpOnly: true,
  sameSite: IS_PROD ? "none" : "lax",
  secure: IS_PROD,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ============ Middleware (ORDER MATTERS) ============ */
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

/* ============ Auth helpers ============ */
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
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
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/* ============ Health ============ */
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/health", async (_req, res) => {
  try {
    const ok = await testDb();
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ============ Auth routes ============ */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid payload" });
  }

  // Owner login from env
  if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
    const token = jwt.sign({ role: "owner", email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, COOKIE_BASE);
    return res.json({ ok: true, user: { role: "owner", email } });
  }

  // Normal user login (MySQL)
  try {
    const u = await dbFindUserByEmail(email);
    if (!u) return res.status(401).json({ message: "Invalid credentials" });

    const ok = bcrypt.compareSync(password, u.password_hash || "");
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { role: "user", email: u.email, name: u.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, COOKIE_BASE);
    return res.json({
      ok: true,
      user: { role: "user", email: u.email, name: u.name },
    });
  } catch (e) {
    console.error("login mysql error", e);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { name = "", email = "", password = "" } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const existing = await dbFindUserByEmail(email);
    if (existing) return res.status(400).json({ message: "User exists" });

    const passwordHash = bcrypt.hashSync(password, 10);
    const created = await dbCreateUser({ name, email, passwordHash });

    const token = jwt.sign(
      { role: "user", email: created.email, name: created.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, COOKIE_BASE);
    return res.json({
      ok: true,
      user: { role: "user", email: created.email, name: created.name },
    });
  } catch (e) {
    console.error("signup mysql error", e);
    return res.status(500).json({ message: "Failed to create user" });
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

/* ============ CART (DB) ============ */
app.post("/api/cart", requireAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    await dbUpsertCart(req.user.email, items);
    return res.json({ ok: true });
  } catch (e) {
    console.error("save cart error", e);
    return res.status(500).json({ message: "Failed to save cart" });
  }
});

app.get("/api/cart", requireAuth, async (req, res) => {
  try {
    const cart = await dbGetCartByEmail(req.user.email);
    return res.json(cart);
  } catch (e) {
    console.error("read cart error", e);
    return res.status(500).json({ message: "Failed to read cart" });
  }
});

/* ============ ORDERS (DB) ============ */
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const { name = "", address = "" } = req.body || {};
    if (!name || !address) {
      return res.status(400).json({ message: "Missing order fields" });
    }

    // ✅ Read items from DB cart
    const cartItems = await dbGetCartByEmail(req.user.email);
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // sanitize
    const safeItems = cartItems
      .map((it) => ({
        id: String(it.id || ""),
        name: String(it.name || ""),
        price: Number(it.price || 0),
        qty: Number(it.qty || 0),
      }))
      .filter((it) => it.name && it.price > 0 && it.qty > 0);

    if (safeItems.length === 0) {
      return res.status(400).json({ message: "Invalid cart items" });
    }

    const subtotal = safeItems.reduce((s, it) => s + it.price * it.qty, 0);
    const fee = 3;
    const total = subtotal + fee;

    // ✅ Create order header
    const orderId = await dbCreateOrder({
      email: req.user.email,
      customerName: String(name).trim(),
      address: String(address).trim(),
      subtotal: Number(subtotal.toFixed(2)),
      fee: Number(fee.toFixed(2)),
      total: Number(total.toFixed(2)),
    });

    // ✅ Create order items (NO uuid for id)
    for (const it of safeItems) {
      await dbCreateOrderItem({
        orderId,
        itemId: it.id,
        name: it.name,
        price: it.price,
        qty: it.qty,
      });
    }

    // ✅ Clear cart after order
    await dbUpsertCart(req.user.email, []);

    return res.json({ ok: true, orderId });
  } catch (e) {
    console.error("save order error", e);
    return res.status(500).json({ message: "Failed to save order" });
  }
});

app.get("/api/orders", requireOwner, async (_req, res) => {
  try {
    const list = await dbGetAllOrdersWithItems();
    return res.json(list);
  } catch (e) {
    console.error("get orders error", e);
    return res.status(500).json({ message: "Failed to read orders" });
  }
});

/* ============ CONTACTS (DB) ============ */
app.post("/api/contact", async (req, res) => {
  const { name = "", subject = "", email = "", description = "" } = req.body || {};
  if (!name && !email && !subject && !description) {
    return res.status(400).json({ message: "Empty message" });
  }

  try {
    await dbCreateContact({
      name: String(name).trim(),
      subject: String(subject).trim(),
      email: String(email).trim(),
      description: String(description).trim(),
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("contact mysql error", e);
    res.status(500).json({ message: "Failed to save message" });
  }
});

app.get("/api/contact", requireOwner, async (_req, res) => {
  try {
    const list = await dbGetAllContacts();
    res.json(list);
  } catch (e) {
    console.error("get contacts mysql error", e);
    res.status(500).json({ message: "Failed to read messages" });
  }
});

app.delete("/api/contact/:id", requireOwner, async (req, res) => {
  const id = String(req.params.id || "").trim();
  try {
    const ok = await dbDeleteContact(id);
    if (!ok) return res.status(404).json({ message: "Message not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("delete contact mysql error", e);
    res.status(500).json({ message: "Failed to delete" });
  }
});

/* ============ Start ============ */
app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});