/**
 * ABENGOUROU-MARKET - serveur Express + PostgreSQL (Render.com)
 */
const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const XLSX = require("xlsx");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;

const ADMIN_ID  = process.env.ADMIN_ID  || "buzz";
const ADMIN_PWD = process.env.ADMIN_PWD || "arrow";

// ─── Connexion PostgreSQL ────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ||
  "postgresql://boutique_en_ligne_user:28HKostTV7XpwU2nVso0cKbQwd1avOBn@dpg-d8pq2337uimc73aedqog-a.oregon-postgres.render.com/boutique_en_ligne";

const isLocalDB = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocalDB ? false : { rejectUnauthorized: false },
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
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_phone TEXT DEFAULT '+225 0767202271';
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_email TEXT DEFAULT 'contact@abengourou-market.com';
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_website TEXT DEFAULT '';
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_whatsapp TEXT DEFAULT '2250767202271';

    CREATE TABLE IF NOT EXISTS rencontres (
      id               BIGINT PRIMARY KEY,
      nom              TEXT NOT NULL,
      prenom           TEXT NOT NULL,
      birthdate        TEXT NOT NULL,
      profession       TEXT DEFAULT '',
      ville            TEXT DEFAULT '',
      quartier         TEXT DEFAULT '',
      sexe             TEXT DEFAULT '',
      whatsapp         TEXT DEFAULT '',
      phone            TEXT DEFAULT '',
      photo            TEXT,
      description      TEXT DEFAULT '',
      sous_cat         TEXT DEFAULT 'amitie',
      prix_acces       NUMERIC DEFAULT 500,
      approved         BOOLEAN DEFAULT FALSE,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO settings (id, company_name, subscription_price, sms_config)
    VALUES (1, 'ABENGOUROU-MARKET.CI', 5000,
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
    companyName: s.company_name || "ABENGOUROU-MARKET.CI",
    companyPhone: s.company_phone || "+225 0767202271",
    companyEmail: s.company_email || "contact@abengourou-market.com",
    companyWebsite: s.company_website || "",
    companyWhatsapp: s.company_whatsapp || "2250767202271",
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

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
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
    const { companyName, companyPhone, companyEmail, companyWebsite, companyWhatsapp, subscriptionPrice, sms } = req.body || {};
    const newName      = companyName      !== undefined ? companyName      : cur.companyName;
    const newPhone     = companyPhone     !== undefined ? companyPhone     : cur.companyPhone;
    const newEmail     = companyEmail     !== undefined ? companyEmail     : cur.companyEmail;
    const newWebsite   = companyWebsite   !== undefined ? companyWebsite   : cur.companyWebsite;
    const newWhatsapp  = companyWhatsapp  !== undefined ? String(companyWhatsapp).replace(/\D/g,"") : cur.companyWhatsapp;
    const newPrice     = subscriptionPrice !== undefined ? Number(subscriptionPrice) : cur.subscriptionPrice;
    const newSms       = sms ? { ...cur.sms, ...sms } : cur.sms;
    await pool.query(
      `UPDATE settings SET company_name=$1, subscription_price=$2, sms_config=$3,
       company_phone=$4, company_email=$5, company_website=$6, company_whatsapp=$7 WHERE id=1`,
      [newName, newPrice, JSON.stringify(newSms), newPhone, newEmail, newWebsite, newWhatsapp]
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

// Modifier un article (admin)
app.post("/api/products/update", async (req, res) => {
  try {
    const b = req.body || {};
    const id = Number(b.id);
    if (!id) return res.status(400).json({ error: "id manquant" });
    await pool.query(
      `UPDATE products SET
        title=$1, category=$2, price=$3, old_price=$4, stock=$5,
        description=$6, whatsapp=$7, personal_phone=$8,
        employer=$9, job_location=$10, contract_type=$11, salary=$12, deadline=$13
       WHERE id=$14`,
      [
        b.title||"", b.category||"", Number(b.price)||0,
        b.oldPrice ? Number(b.oldPrice) : null,
        Number(b.stock)||0,
        b.description||"", b.whatsapp||"", b.personalPhone||"",
        b.employer||"", b.jobLocation||"", b.contractType||"",
        b.salary||"", b.deadline||"", id,
      ]
    );
    const { rows } = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    res.json(rows[0] ? rowToProduct(rows[0]) : { ok: true });
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

// Supprimer une commande (admin)
app.post("/api/orders/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id=$1", [Number(req.body.id)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Supprimer TOUTES les commandes (admin)
app.post("/api/orders/clear", async (_req, res) => {
  try {
    await pool.query("DELETE FROM orders");
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Modifier une commande (admin — statut / note)
app.post("/api/orders/update", async (req, res) => {
  try {
    const b = req.body || {};
    const id = Number(b.id);
    if (!id) return res.status(400).json({ error: "id manquant" });
    await pool.query(
      `UPDATE orders SET client_name=$1, client_phone=$2, delivery=$3, total=$4, pay_method=$5, pay_num=$6 WHERE id=$7`,
      [b.name||"", b.phone||"", b.delivery||"", Number(b.total)||0, b.payMethod||"", b.payNum||"", id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Rencontres ───────────────────────────────────────────────────────────────
function calcAge(birthdate) {
  const b = new Date(birthdate);
  const n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}

function rowToRencontrePublic(r) {
  const initials = ((r.nom||"")[0]||"").toUpperCase() + "." + ((r.prenom||"")[0]||"").toUpperCase() + ".";
  const title = (r.sexe||"").toLowerCase().startsWith("f") ? "Madame" : "Monsieur";
  return {
    id: Number(r.id),
    displayName: `${title} ${initials}`,
    age: calcAge(r.birthdate),
    profession: r.profession || "",
    ville: r.ville || "",
    quartier: r.quartier || "",
    sexe: r.sexe || "",
    souscat: r.sous_cat || "amitie",
    prixAcces: Number(r.prix_acces) || 500,
    descShort: (r.description || "").slice(0, 150),
    approved: r.approved,
    createdAt: r.created_at,
  };
}

function rowToRencontreAdmin(r) {
  return {
    ...rowToRencontrePublic(r),
    nom: r.nom, prenom: r.prenom, birthdate: r.birthdate,
    whatsapp: r.whatsapp || "", phone: r.phone || "",
    photo: r.photo || null, description: r.description || "",
  };
}

app.get("/api/rencontres", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM rencontres WHERE approved=true ORDER BY created_at DESC");
    res.json(rows.map(rowToRencontrePublic));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/rencontres/all", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM rencontres ORDER BY created_at DESC");
    res.json(rows.map(rowToRencontreAdmin));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/rencontres", async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.nom || !b.prenom || !b.birthdate) return res.status(400).json({ error: "Champs requis manquants" });
    const id = Date.now();
    await pool.query(
      `INSERT INTO rencontres (id,nom,prenom,birthdate,profession,ville,quartier,sexe,whatsapp,phone,photo,description,sous_cat,prix_acces)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [id, b.nom, b.prenom, b.birthdate, b.profession||"", b.ville||"", b.quartier||"",
       b.sexe||"", b.whatsapp||"", b.phone||"", b.photo||null, b.description||"",
       b.souscat||"amitie", Number(b.prixAcces)||500]
    );
    res.json({ ok: true, id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/rencontres/approve", async (req, res) => {
  try {
    const id = Number(req.body.id);
    const prix = req.body.prixAcces != null ? Number(req.body.prixAcces) : null;
    const souscat = req.body.souscat || null;
    if (prix !== null && souscat) {
      await pool.query(
        "UPDATE rencontres SET approved=true, prix_acces=$2, sous_cat=$3 WHERE id=$1",
        [id, prix, souscat]
      );
    } else if (prix !== null) {
      await pool.query("UPDATE rencontres SET approved=true, prix_acces=$2 WHERE id=$1", [id, prix]);
    } else {
      await pool.query("UPDATE rencontres SET approved=true WHERE id=$1", [id]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/rencontres/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM rencontres WHERE id=$1", [Number(req.body.id)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── EXPORT / IMPORT BASE DE DONNÉES ─────────────────────────────────────────

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Toutes les tables exportées (noms de table → colonnes à exclure pour la sécurité minimale)
const EXPORT_TABLES = ["users", "products", "orders", "settings", "rencontres"];

// Export JSON complet de toutes les tables
app.get("/api/admin/export/json", async (req, res) => {
  try {
    const result = {};
    for (const t of EXPORT_TABLES) {
      const { rows } = await pool.query(`SELECT * FROM ${t} ORDER BY id`);
      result[t] = rows;
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="abengourou-market-backup-${new Date().toISOString().slice(0,10)}.json"`);
    res.send(JSON.stringify(result, null, 2));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Export Excel multi-feuilles (une feuille par table)
// Note: les images base64 sont trop longues pour Excel (limite 32767 chars/cellule).
// Elles sont remplacées par "[IMAGE: voir export JSON pour données complètes]".
// Utilisez l'export JSON pour un backup complet avec images.
app.get("/api/admin/export/excel", async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    const IMG_COLS = new Set(["image", "photo"]); // colonnes contenant des base64
    for (const t of EXPORT_TABLES) {
      const { rows } = await pool.query(`SELECT * FROM ${t} ORDER BY id`);
      if (!rows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[`Aucune donnée dans ${t}`]]), t);
        continue;
      }
      const ws = XLSX.utils.json_to_sheet(rows.map(r => {
        const o = {};
        for (const [k, v] of Object.entries(r)) {
          if (IMG_COLS.has(k) && typeof v === "string" && v.length > 100) {
            // Indiquer qu'une image existe sans la copier dans la cellule
            o[k] = v.startsWith("data:") ? `[IMAGE ${Math.round(v.length/1024)}KB — voir JSON export]` : v.slice(0, 200);
          } else if (typeof v === "object" && v !== null) {
            o[k] = JSON.stringify(v);
          } else {
            o[k] = v;
          }
        }
        return o;
      }));
      XLSX.utils.book_append_sheet(wb, ws, t);
    }
    // Feuille de légende
    const legend = XLSX.utils.aoa_to_sheet([
      ["ABENGOUROU-MARKET.CI — Export base de données", new Date().toLocaleString("fr-FR")],
      [""],
      ["⚠️ Note importante sur les images"],
      ["Les colonnes 'image' et 'photo' affichent [IMAGE xxKB] car Excel ne peut pas stocker les images base64."],
      ["Utilisez l'export JSON (/api/admin/export/json) pour un backup complet incluant toutes les images."],
      [""],
      ["Tables exportées:", EXPORT_TABLES.join(", ")],
    ]);
    XLSX.utils.book_append_sheet(wb, legend, "README");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="abengourou-market-${new Date().toISOString().slice(0,10)}.xlsx"`);
    res.send(buf);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Aperçu des comptages pour l'onglet admin
app.get("/api/admin/db-stats", async (req, res) => {
  try {
    const stats = {};
    for (const t of EXPORT_TABLES) {
      const { rows } = await pool.query(`SELECT COUNT(*) FROM ${t}`);
      stats[t] = Number(rows[0].count);
    }
    res.json(stats);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Import JSON — réimporte les données (UPSERT par table)
app.post("/api/admin/import/json", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Fichier manquant" });
    const data = JSON.parse(req.file.buffer.toString("utf8"));
    const report = {};

    // users
    if (data.users) {
      let n = 0;
      for (const u of data.users) {
        await pool.query(`
          INSERT INTO users (id,pwd,name,phone,email,role,approved,subscription_until,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (id) DO UPDATE SET
            pwd=EXCLUDED.pwd, name=EXCLUDED.name, phone=EXCLUDED.phone,
            email=EXCLUDED.email, role=EXCLUDED.role, approved=EXCLUDED.approved,
            subscription_until=EXCLUDED.subscription_until
        `, [u.id,u.pwd,u.name||"",u.phone||"",u.email||"",u.role||"client",u.approved??false,u.subscription_until||null,u.created_at||new Date()]);
        n++;
      }
      report.users = n;
    }

    // products — colonne "image" TEXT (base64 ou null)
    if (data.products) {
      let n = 0;
      for (const p of data.products) {
        // Support both snake_case (raw DB export) and camelCase (API export)
        const imgVal = p.image || null; // colonne réelle = image TEXT
        await pool.query(`
          INSERT INTO products
            (id,title,description,price,old_price,category,image,stock,stock_init,
             owner_id,owner_name,owner_role,whatsapp,personal_phone,approved,blocked,
             employer,job_location,contract_type,salary,deadline,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
          ON CONFLICT (id) DO UPDATE SET
            title=EXCLUDED.title, description=EXCLUDED.description, price=EXCLUDED.price,
            old_price=EXCLUDED.old_price, category=EXCLUDED.category, image=EXCLUDED.image,
            stock=EXCLUDED.stock, approved=EXCLUDED.approved, blocked=EXCLUDED.blocked
        `, [
          p.id, p.title||p.name||"", p.description||"",
          Number(p.price)||0, p.old_price!=null?Number(p.old_price):null,
          p.category||"", imgVal,
          Number(p.stock)||0, Number(p.stock_init||p.stock)||0,
          p.owner_id||p.ownerId||"", p.owner_name||p.ownerName||"", p.owner_role||p.ownerRole||"vendeur",
          p.whatsapp||"", p.personal_phone||p.personalPhone||"",
          p.approved??false, p.blocked??false,
          p.employer||"", p.job_location||p.jobLocation||"",
          p.contract_type||p.contractType||"", p.salary||"", p.deadline||"",
          p.created_at||p.createdAt||new Date()
        ]);
        n++;
      }
      report.products = n;
    }

    // orders
    if (data.orders) {
      let n = 0;
      for (const o of data.orders) {
        await pool.query(`
          INSERT INTO orders (id,order_no,client_name,client_phone,delivery,items,total,pay_method,pay_num,sms_results,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (id) DO NOTHING
        `, [o.id,o.order_no||"",o.client_name||"",o.client_phone||"",o.delivery||"",
            typeof o.items==="string"?o.items:JSON.stringify(o.items||[]),
            Number(o.total)||0,o.pay_method||"",o.pay_num||"",
            o.sms_results||null,o.created_at||new Date()]);
        n++;
      }
      report.orders = n;
    }

    // rencontres — colonne DB = sous_cat (pas souscat)
    if (data.rencontres) {
      let n = 0;
      for (const r of data.rencontres) {
        const souscat = r.sous_cat || r.souscat || "amitie"; // support both DB and API export formats
        await pool.query(`
          INSERT INTO rencontres (id,nom,prenom,birthdate,profession,ville,quartier,sexe,whatsapp,phone,photo,description,sous_cat,prix_acces,approved,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
          ON CONFLICT (id) DO UPDATE SET
            approved=EXCLUDED.approved, photo=EXCLUDED.photo,
            description=EXCLUDED.description, profession=EXCLUDED.profession
        `, [r.id,r.nom||"",r.prenom||"",r.birthdate||null,r.profession||"",r.ville||"",
            r.quartier||"",r.sexe||"",r.whatsapp||"",r.phone||"",r.photo||null,
            r.description||"",souscat,Number(r.prix_acces||r.prixAcces)||500,
            r.approved??false,r.created_at||new Date()]);
        n++;
      }
      report.rencontres = n;
    }

    // settings (optionnel — restaurer les paramètres)
    if (data.settings && Array.isArray(data.settings)) {
      for (const s of data.settings) {
        await pool.query(`
          UPDATE settings SET
            company_name=COALESCE($1, company_name),
            subscription_price=COALESCE($2, subscription_price),
            sms_config=COALESCE($3, sms_config),
            company_phone=COALESCE($4, company_phone),
            company_email=COALESCE($5, company_email),
            company_website=COALESCE($6, company_website)
          WHERE id=1
        `, [
          s.company_name||null, s.subscription_price||null,
          s.sms_config ? JSON.stringify(s.sms_config) : null,
          s.company_phone||null, s.company_email||null, s.company_website||null
        ]);
      }
      report.settings = data.settings.length;
    }

    res.json({ ok: true, imported: report });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Import Excel ─────────────────────────────────────────────────────────────
app.post("/api/admin/import/excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Fichier manquant" });
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const report = {};

    function sheetToRows(name) {
      if (!wb.SheetNames.includes(name)) return [];
      return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
    }

    // users
    const users = sheetToRows("users");
    if (users.length) {
      let n = 0;
      for (const u of users) {
        if (!u.id) continue;
        await pool.query(`
          INSERT INTO users (id,pwd,name,phone,role,approved,subscription_until,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (id) DO UPDATE SET
            pwd=EXCLUDED.pwd, name=EXCLUDED.name, phone=EXCLUDED.phone,
            role=EXCLUDED.role, approved=EXCLUDED.approved,
            subscription_until=EXCLUDED.subscription_until
        `, [u.id, u.pwd||"", u.name||"", u.phone||"", u.role||"vendeur",
            u.approved === true || u.approved === "true" || u.approved === 1,
            u.subscription_until||null, u.created_at||new Date()]);
        n++;
      }
      report.users = n;
    }

    // products
    const products = sheetToRows("products");
    if (products.length) {
      let n = 0;
      for (const p of products) {
        if (!p.id) continue;
        const imgVal = typeof p.image === "string" && p.image.startsWith("[IMAGE") ? null : (p.image || null);
        await pool.query(`
          INSERT INTO products
            (id,title,description,price,old_price,category,image,stock,stock_init,
             owner_id,owner_name,owner_role,whatsapp,personal_phone,approved,blocked,
             employer,job_location,contract_type,salary,deadline,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
          ON CONFLICT (id) DO UPDATE SET
            title=EXCLUDED.title, description=EXCLUDED.description, price=EXCLUDED.price,
            old_price=EXCLUDED.old_price, category=EXCLUDED.category,
            stock=EXCLUDED.stock, approved=EXCLUDED.approved, blocked=EXCLUDED.blocked
        `, [
          p.id, p.title||"", p.description||"",
          Number(p.price)||0, p.old_price ? Number(p.old_price) : null,
          p.category||"", imgVal,
          Number(p.stock)||0, Number(p.stock_init||p.stock)||0,
          p.owner_id||"", p.owner_name||"", p.owner_role||"vendeur",
          p.whatsapp||"", p.personal_phone||"",
          p.approved === true || p.approved === "true" || p.approved === 1,
          p.blocked === true || p.blocked === "true" || p.blocked === 1,
          p.employer||"", p.job_location||"", p.contract_type||"",
          p.salary||"", p.deadline||"", p.created_at||new Date()
        ]);
        n++;
      }
      report.products = n;
    }

    // orders
    const orders = sheetToRows("orders");
    if (orders.length) {
      let n = 0;
      for (const o of orders) {
        if (!o.id) continue;
        let items = o.items || "[]";
        if (typeof items === "string") { try { JSON.parse(items); } catch { items = "[]"; } }
        else items = JSON.stringify(items);
        await pool.query(`
          INSERT INTO orders (id,order_no,client_name,client_phone,delivery,items,total,pay_method,pay_num,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id) DO NOTHING
        `, [o.id, o.order_no||"", o.client_name||"", o.client_phone||"",
            o.delivery||"", items, Number(o.total)||0,
            o.pay_method||"", o.pay_num||"", o.created_at||new Date()]);
        n++;
      }
      report.orders = n;
    }

    // rencontres
    const rencontres = sheetToRows("rencontres");
    if (rencontres.length) {
      let n = 0;
      for (const r of rencontres) {
        if (!r.id) continue;
        const photoVal = typeof r.photo === "string" && r.photo.startsWith("[IMAGE") ? null : (r.photo || null);
        await pool.query(`
          INSERT INTO rencontres (id,nom,prenom,birthdate,profession,ville,quartier,sexe,whatsapp,phone,photo,description,sous_cat,prix_acces,approved,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
          ON CONFLICT (id) DO UPDATE SET
            approved=EXCLUDED.approved, profession=EXCLUDED.profession,
            description=EXCLUDED.description, prix_acces=EXCLUDED.prix_acces
        `, [r.id, r.nom||"", r.prenom||"", r.birthdate||null,
            r.profession||"", r.ville||"", r.quartier||"", r.sexe||"",
            r.whatsapp||"", r.phone||"", photoVal, r.description||"",
            r.sous_cat||"amitie", Number(r.prix_acces)||500,
            r.approved === true || r.approved === "true" || r.approved === 1,
            r.created_at||new Date()]);
        n++;
      }
      report.rencontres = n;
    }

    // settings
    const settingsRows = sheetToRows("settings");
    if (settingsRows.length) {
      const s = settingsRows[0];
      let smsConfig = s.sms_config;
      if (typeof smsConfig === "string") { try { smsConfig = JSON.parse(smsConfig); } catch { smsConfig = null; } }
      await pool.query(`
        UPDATE settings SET
          company_name=COALESCE($1, company_name),
          subscription_price=COALESCE($2, subscription_price),
          sms_config=COALESCE($3, sms_config),
          company_phone=COALESCE($4, company_phone),
          company_email=COALESCE($5, company_email),
          company_website=COALESCE($6, company_website)
        WHERE id=1
      `, [s.company_name||null, s.subscription_price||null,
          smsConfig ? JSON.stringify(smsConfig) : null,
          s.company_phone||null, s.company_email||null, s.company_website||null]);
      report.settings = 1;
    }

    res.json({ ok: true, imported: report });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Surveillance espace base de données ─────────────────────────────────────
// Render.com PostgreSQL gratuit = 1 Go (1 073 741 824 octets)
const RENDER_FREE_DB_LIMIT_BYTES = 1073741824;
app.get("/api/admin/db-size", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT pg_database_size(current_database()) AS size_bytes");
    const sizeBytes = Number(rows[0].size_bytes);
    const limitBytes = RENDER_FREE_DB_LIMIT_BYTES;
    const pct = (sizeBytes / limitBytes) * 100;
    const sizeMB = (sizeBytes / 1048576).toFixed(2);
    const limitMB = (limitBytes / 1048576).toFixed(0);
    res.json({
      sizeBytes,
      limitBytes,
      sizeMB: Number(sizeMB),
      limitMB: Number(limitMB),
      pct: Number(pct.toFixed(2)),
      alert: pct >= 90,
      warning: pct >= 75,
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── Export ZIP de déploiement (sans fichiers spécifiques à l'IDE) ────────────
app.get("/api/admin/export/zip", async (req, res) => {
  try {
    const AdmZip = require("adm-zip");
    const fs = require("fs");
    const zip = new AdmZip();

    // Générer le fichier .env.example dynamiquement
    const envExample = [
      "# Variables d'environnement requises pour ABENGOUROU-MARKET",
      "# Renommez ce fichier en .env avant de démarrer",
      "",
      "# URL de connexion PostgreSQL (obligatoire)",
      "DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME",
      "",
      "# Identifiants administrateur (optionnel — défaut : buzz / arrow)",
      "ADMIN_ID=buzz",
      "ADMIN_PWD=arrow",
      "",
      "# Port du serveur (optionnel — défaut : 5000)",
      "PORT=5000",
    ].join("\n");
    zip.addFile(".env.example", Buffer.from(envExample, "utf8"));

    // Fichiers racine à inclure (sans fichiers spécifiques à l'IDE)
    const filesToInclude = ["server.js", "package.json", "package-lock.json", "README.md"];
    for (const f of filesToInclude) {
      const fp = path.join(__dirname, f);
      if (fs.existsSync(fp)) zip.addLocalFile(fp);
    }

    // Dossier public/ complet (HTML, CSS, JS, images)
    const publicDir = path.join(__dirname, "public");
    if (fs.existsSync(publicDir)) zip.addLocalFolder(publicDir, "public");

    const buf = zip.toBuffer();
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="amzon.zip"`);
    res.send(buf);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// ─── Démarrage ────────────────────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () => console.log(`ABENGOUROU-MARKET sur http://localhost:${PORT}`)))
  .catch((err) => { console.error("❌ Erreur DB:", err.message); process.exit(1); });
