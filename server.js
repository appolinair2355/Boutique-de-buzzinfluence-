/**
 * ABENGOUROU-MARKET - serveur Express + PostgreSQL (Render.com)
 */
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

const ADMIN_ID  = process.env.ADMIN_ID  || "buzz";
const ADMIN_PWD = process.env.ADMIN_PWD || "arrow";

// ─── Connexion PostgreSQL ────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: "postgresql://boutique_en_ligne_user:28HKostTV7XpwU2nVso0cKbQwd1avOBn@dpg-d8pq2337uimc73aedqog-a.oregon-postgres.render.com/boutique_en_ligne",
  ssl: { rejectUnauthorized: false },
});

// ─── Création des tables au démarrage ───────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id               TEXT PRIMARY KEY,
      pwd              TEXT NOT NULL,
      name             TEXT NOT NULL,
      phone            TEXT DEFAULT '',
      role             TEXT DEFAULT 'vendeur',
      approved         BOOLEAN DEFAULT FALSE,
      subscription_until TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id               BIGINT PRIMARY KEY,
      title            TEXT NOT NULL,
      category         TEXT NOT NULL,
      price            NUMERIC DEFAULT 0,
      old_price        NUMERIC,
      stock            INT DEFAULT 0,
      stock_init       INT DEFAULT 0,
      image            TEXT,
      description      TEXT DEFAULT '',
      whatsapp         TEXT DEFAULT '',
      personal_phone   TEXT DEFAULT '',
      owner_id         TEXT NOT NULL,
      owner_name       TEXT DEFAULT '',
      owner_role       TEXT DEFAULT 'vendeur',
      approved         BOOLEAN DEFAULT FALSE,
      blocked          BOOLEAN DEFAULT FALSE,
      employer         TEXT DEFAULT '',
      job_location     TEXT DEFAULT '',
      contract_type    TEXT DEFAULT '',
      salary           TEXT DEFAULT '',
      deadline         TEXT DEFAULT '',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id               BIGINT PRIMARY KEY,
      order_no         TEXT NOT NULL,
      client_name      TEXT DEFAULT '',
      client_phone     TEXT DEFAULT '',
      delivery         TEXT DEFAULT '',
      items            JSONB DEFAULT '[]',
      total            NUMERIC DEFAULT 0,
      pay_method       TEXT DEFAULT '',
      pay_num          TEXT DEFAULT '',
      sms_results      JSONB DEFAULT '[]',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      id                  INT PRIMARY KEY DEFAULT 1,
      company_name        TEXT DEFAULT 'ABENGOUROU-MARKET',
      subscription_price  NUMERIC DEFAULT 5000,
      sms_config          JSONB DEFAULT '{}'
    );

    INSERT INTO settings (id, company_name, subscription_price, sms_config)
    VALUES (1, 'ABENGOUROU-MARKET', 5000,
      '{"enabled":false,"method":"POST","url":"","contentType":"application/json","headers":"","bodyTemplate":"","sender":"ABGMARKET","apiKey":""}')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log("✅ Tables PostgreSQL prêtes");
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function vendorActive(u) {
  if (!u) return false;
  if (u.role === "admin") return true;
  return u.approved === true;
}

function rowToUser(r) {
  return {
    id: r.id,
    pwd: r.pwd,
    name: r.name,
    phone: r.phone,
    role: r.role,
    approved: r.approved,
    subscription_until: r.subscription_until,
    subscriptionUntil: r.subscription_until,
    active: vendorActive(r),
  };
}

function rowToProduct(r) {
  return {
    id: Number(r.id),
    title: r.title,
    category: r.category,
    price: Number(r.price),
    oldPrice: r.old_price ? Number(r.old_price) : null,
    stock: r.stock,
    stockInit: r.stock_init,
    image: r.image || null,
    description: r.description || "",
    whatsapp: r.whatsapp || "",
    personalPhone: r.personal_phone || "",
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    ownerRole: r.owner_role,
    approved: r.approved,
    blocked: r.blocked,
    employer: r.employer || "",
    jobLocation: r.job_location || "",
    contractType: r.contract_type || "",
    salary: r.salary || "",
    deadline: r.deadline || "",
    createdAt: r.created_at,
  };
}

function rowToOrder(r) {
  return {
    id: Number(r.id),
    orderNo: r.order_no,
    name: r.client_name,
    phone: r.client_phone,
    delivery: r.delivery,
    items: r.items,
    total: Number(r.total),
    payMethod: r.pay_method,
    payNum: r.pay_num,
    smsResults: r.sms_results,
    createdAt: r.created_at,
  };
}

async function getSettings() {
  const { rows } = await pool.query("SELECT * FROM settings WHERE id=1");
  const s = rows[0] || {};
  const defaultSms = { enabled: false, method: "POST", url: "", contentType: "application/json", headers: "", bodyTemplate: "", sender: "ABGMARKET", apiKey: "" };
  return {
    companyName: s.company_name || "ABENGOUROU-MARKET",
    subscriptionPrice: Number(s.subscription_price) || 5000,
    sms: { ...defaultSms, ...(s.sms_config || {}) },
  };
}

async function productVisible(p) {
  if (!p.approved || p.blocked) return false;
  if (p.ownerRole === "admin") return true;
  const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [p.ownerId]);
  return vendorActive(rows[0]);
}

// ─── SMS sender ──────────────────────────────────────────────────────────────
async function sendSMS(settings, to, message) {
  const sms = settings.sms || {};
  if (!sms.enabled || !sms.url || !to) return { ok: false, skipped: true };
  const from = sms.sender || settings.companyName || "ABGMARKET";
  const fill = (s) => String(s || "").replaceAll("{to}", to).replaceAll("{message}", message).replaceAll("{from}", from);
  const headers = { "Content-Type": "application/json" };
  if (sms.apiKey) headers["Authorization"] = `Bearer ${sms.apiKey}`;
  const body = JSON.stringify({ to, from, text: message });
  try {
    const r = await fetch(fill(sms.url), { method: "POST", headers, body });
    const text = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, body: text.slice(0, 300) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─── Auth ────────────────────────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { id, pwd } = req.body || {};
    if (id === ADMIN_ID && pwd === ADMIN_PWD)
      return res.json({ role: "admin", name: "Administrateur", id, approved: true, active: true });
    const { rows } = await pool.query("SELECT * FROM users WHERE id=$1 AND pwd=$2", [id, pwd]);
    if (!rows.length) return res.status(401).json({ error: "Identifiants invalides" });
    const u = rows[0];
    return res.json({
      role: u.role, name: u.name, phone: u.phone, id: u.id,
      approved: u.approved, active: vendorActive(u),
      subscriptionUntil: u.subscription_until || null,
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/register", async (req, res) => {
  try {
    const { id, pwd, name, phone } = req.body || {};
    if (!id || !pwd || !name) return res.status(400).json({ error: "Champs requis" });
    const exists = await pool.query("SELECT id FROM users WHERE id=$1", [id]);
    if (exists.rows.length) return res.status(400).json({ error: "Identifiant déjà pris" });
    await pool.query(
      "INSERT INTO users (id,pwd,name,phone,role,approved) VALUES ($1,$2,$3,$4,'vendeur',false)",
      [id, pwd, name, phone || ""]
    );
    res.json({ ok: true, approved: false });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Settings ────────────────────────────────────────────────────────────────
app.get("/api/settings", async (_req, res) => {
  try { res.json(await getSettings()); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/settings", async (req, res) => {
  try {
    const cur = await getSettings();
    const { companyName, subscriptionPrice, sms } = req.body || {};
    const newName  = companyName !== undefined ? companyName : cur.companyName;
    const newPrice = subscriptionPrice !== undefined ? Number(subscriptionPrice) : cur.subscriptionPrice;
    const newSms   = sms ? { ...cur.sms, ...sms } : cur.sms;
    await pool.query(
      "UPDATE settings SET company_name=$1, subscription_price=$2, sms_config=$3 WHERE id=1",
      [newName, newPrice, JSON.stringify(newSms)]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/settings/sms-test", async (req, res) => {
  try {
    const settings = await getSettings();
    const r = await sendSMS(settings, req.body.to, `${settings.companyName}: SMS de test ✓`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Vendors ─────────────────────────────────────────────────────────────────
app.get("/api/vendors", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE role='vendeur' ORDER BY created_at DESC");
    res.json(rows.map(u => ({
      id: u.id, name: u.name, phone: u.phone,
      approved: u.approved, subscriptionUntil: u.subscription_until || null,
      active: vendorActive(u),
    })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/vendors/approve", async (req, res) => {
  try {
    await pool.query("UPDATE users SET approved=true WHERE id=$1", [req.body.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/vendors/activate", async (req, res) => {
  try {
    const months = Number(req.body.months) || 1;
    const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [req.body.id]);
    if (!rows.length) return res.json({ ok: false });
    const u = rows[0];
    const base = vendorActive(u) ? new Date(u.subscription_until) : new Date();
    base.setMonth(base.getMonth() + months);
    await pool.query(
      "UPDATE users SET approved=true, subscription_until=$1 WHERE id=$2",
      [base.toISOString(), req.body.id]
    );
    res.json({ ok: true, subscriptionUntil: base.toISOString() });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/vendors/deactivate", async (req, res) => {
  try {
    await pool.query("UPDATE users SET subscription_until=NULL WHERE id=$1", [req.body.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/vendors/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=$1", [req.body.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Products ─────────────────────────────────────────────────────────────────
app.get("/api/products", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    const products = rows.map(rowToProduct);
    const visible = [];
    for (const p of products) {
      if (await productVisible(p)) visible.push(p);
    }
    res.json(visible);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/products/all", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(rows.map(rowToProduct));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/products/mine/:ownerId", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products WHERE owner_id=$1 ORDER BY created_at DESC", [req.params.ownerId]);
    res.json(rows.map(rowToProduct));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/products", async (req, res) => {
  try {
    const b = req.body || {};
    const id = Date.now();
    const stock = Number(b.stock) || 0;
    const isAdmin = b.ownerRole === "admin";
    await pool.query(
      `INSERT INTO products
        (id,title,category,price,old_price,stock,stock_init,image,description,
         whatsapp,personal_phone,owner_id,owner_name,owner_role,approved,blocked,
         employer,job_location,contract_type,salary,deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,false,$16,$17,$18,$19,$20)`,
      [
        id, b.title, b.category, Number(b.price)||0,
        b.oldPrice ? Number(b.oldPrice) : null,
        stock, stock, b.image||null, b.description||"",
        b.whatsapp||"", b.personalPhone||"",
        b.ownerId, b.ownerName||"", b.ownerRole||"vendeur",
        isAdmin,
        b.employer||"", b.jobLocation||"", b.contractType||"",
        b.salary||"", b.deadline||"",
      ]
    );
    const { rows } = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    res.json(rowToProduct(rows[0]));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/products/approve", async (req, res) => {
  try {
    await pool.query("UPDATE products SET approved=true, blocked=false WHERE id=$1", [Number(req.body.id)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/products/block", async (req, res) => {
  try {
    await pool.query("UPDATE products SET blocked=true WHERE id=$1", [Number(req.body.id)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/products/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=$1", [Number(req.body.id)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Orders ───────────────────────────────────────────────────────────────────
app.get("/api/orders", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows.map(rowToOrder));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/orders", async (req, res) => {
  try {
    const id = Date.now();
    const orderNo = "CMD-" + String(id).slice(-6);
    const b = req.body || {};

    await pool.query(
      `INSERT INTO orders (id,order_no,client_name,client_phone,delivery,items,total,pay_method,pay_num)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, orderNo, b.name||"", b.phone||"", b.delivery||"",
       JSON.stringify(b.items||[]), Number(b.total)||0,
       b.payMethod||"", b.payNum||""]
    );

    // Décrémente le stock
    const owners = {};
    for (const it of b.items || []) {
      const { rows } = await pool.query("SELECT * FROM products WHERE id=$1", [Number(it.id)]);
      if (rows[0]) {
        const p = rows[0];
        await pool.query("UPDATE products SET stock=GREATEST(0,stock-$1) WHERE id=$2", [it.qty||1, p.id]);
        const phone = p.personal_phone || p.whatsapp || "";
        if (phone) {
          owners[phone] = owners[phone] || [];
          owners[phone].push(`${it.qty}x ${p.title}`);
        }
      }
    }

    // SMS propriétaires
    const settings = await getSettings();
    const mode = b.delivery === "agence" ? "Retrait sur place" : "Livraison domicile";
    const smsResults = [];
    for (const [phone, articles] of Object.entries(owners)) {
      const msg = `${settings.companyName} - ${orderNo}\nNouvelle commande: ${articles.join(", ")}\nClient: ${b.name||""} ${b.phone||""}\n${mode}\nTotal: ${b.total||0} FCFA`;
      smsResults.push(await sendSMS(settings, phone, msg));
    }

    await pool.query("UPDATE orders SET sms_results=$1 WHERE id=$2", [JSON.stringify(smsResults), id]);

    res.json({ id, orderNo, ...b, smsResults, createdAt: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// ─── Démarrage ────────────────────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () => console.log(`ABENGOUROU-MARKET sur http://localhost:${PORT}`)))
  .catch((err) => { console.error("❌ Erreur DB:", err.message); process.exit(1); });
