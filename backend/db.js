const mysql = require("mysql2/promise");
const { randomUUID } = require("crypto");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function testDb() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}

//USERS
async function dbFindUserByEmail(email) {
  const [rows] = await pool.query(
    "SELECT id, email, name, password_hash FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function dbCreateUser({ name, email, passwordHash }) {
  await pool.query(
    "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
    [email, name, passwordHash]
  );
  const u = await dbFindUserByEmail(email);
  return u ? { email: u.email, name: u.name } : { email, name };
}

//CONTACTS
async function dbCreateContact({ name, subject, email, description }) {
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO contacts (id, name, subject, email, description)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, subject, email, description]
  );
  return id;
}

async function dbGetAllContacts() {
  const [rows] = await pool.query(
    "SELECT * FROM contacts ORDER BY created_at DESC"
  );
  return rows;
}

async function dbDeleteContact(id) {
  const [result] = await pool.execute("DELETE FROM contacts WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

//Carts
async function dbGetCartByEmail(email) {
  const [rows] = await pool.query(
    "SELECT cart_json FROM carts WHERE email = ? LIMIT 1",
    [email]
  );

  if (!rows.length) return [];

  const v = rows[0].cart_json;

  if (Array.isArray(v)) return v;

  if (v && typeof v === "object") return [];

  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

async function dbUpsertCart(email, cartArray) {
  const cartJson = JSON.stringify(Array.isArray(cartArray) ? cartArray : []);

  await pool.execute(
    `INSERT INTO carts (email, cart_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       cart_json = VALUES(cart_json),
       updated_at = CURRENT_TIMESTAMP`,
    [email, cartJson]
  );

  return true;
}

//ORDERS 
async function dbCreateOrder({ email, customerName, address, subtotal, fee, total }) {
  const id = randomUUID();

  await pool.execute(
    `INSERT INTO orders (id, email, customer_name, address, subtotal, fee, total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, email, customerName, address, subtotal, fee, total]
  );

  return id;
}

async function dbCreateOrderItem({ orderId, itemId, name, price, qty }) {
  await pool.execute(
    `INSERT INTO order_items (order_id, item_id, name, price, qty)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, itemId, name, price, qty]
  );
  return true;
}


async function dbGetAllOrdersWithItems() {
  const [orders] = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );

  const [items] = await pool.query(
    "SELECT * FROM order_items ORDER BY created_at DESC"
  );

  const map = new Map();
  for (const o of orders) map.set(o.id, { ...o, items: [] });
  for (const it of items) {
    const o = map.get(it.order_id);
    if (o) o.items.push(it);
  }

  return Array.from(map.values());
}

module.exports = {
  pool,
  testDb,
  // users
  dbFindUserByEmail,
  dbCreateUser,
  // contacts
  dbCreateContact,
  dbGetAllContacts,
  dbDeleteContact,
  // carts
  dbGetCartByEmail,
  dbUpsertCart,
  // orders
  dbCreateOrder,
  dbCreateOrderItem,
  dbGetAllOrdersWithItems,
};