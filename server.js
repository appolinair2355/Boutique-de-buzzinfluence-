/**
 * ABENGOUROU-MARKET - serveur Express
 * Render.com - port 1000
 */
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 1000;
const DATA_FILE = path.join(__dirname, "data", "db.json");

const ADMIN_ID = process.env.ADMIN_ID || "buzz";
const ADMIN_PWD = process.env.ADMIN_PWD || "arrow";

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- DB helpers ----------
function emptyDB() {
  return {
    users: [],
    products: [],
    orders: [],
    settings: {
      companyName: "ABENGOUROU-MARKET",
      subscriptionPrice: 5000,          // FCFA / mois (par défaut)
      sms: {
        enabled: false,
        method: "POST",
        url: "",
        contentType: "application/json", // application/json | application/x-www-form-urlencoded
        headers: "",                     // ex: {"Authorization":"Bearer XXX"}
        bodyTemplate: "",                // placeholders: {to} {message} {from}
        sender: "ABGMARKET",
      },
    },
  };
}
function loadDB() {
  try {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const def = emptyDB();
    db.settings = { ...def.settings, ...(db.settings || {}) };
    db.settings.sms = { ...def.settings.sms, ...(db.settings.sms || {}) };
    db.users = db.users || [];
    db.products = db.products || [];
    db.orders = db.orders || [];
    return db;
  } catch {
    return emptyDB();
  }
}
function saveDB(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
if (!fs.existsSync(DATA_FILE)) saveDB(emptyDB());

// ---------- Subscription helpers ----------
function vendorActive(u) {
  if (!u) return false;
  if (u.role === "admin") return true;
  if (!u.approved) return false;
  if (!u.subscriptionUntil) return false;
  return new Date(u.subscriptionUntil).getTime() > Date.now();
}
// A product is publicly visible if approved, not blocked, and its owner is active.
function productVisible(p, db) {
  if (!p.approved || p.blocked) return false;
  if (p.ownerRole === "admin") return true;
  const owner = db.users.find((u) => u.id === p.ownerId);
  return vendorActive(owner);
}

// ---------- Generic SMS sender (any platform) ----------
async function sendSMS(settings, to, message) {
  const sms = settings.sms || {};
  if (!sms.enabled || !sms.url || !to) return { ok: false, skipped: true };
  const fill = (s) =>
    String(s || "")
      .replaceAll("{to}", to)
      .replaceAll("{message}", message)
      .replaceAll("{from}", sms.sender || settings.companyName || "");
  let headers = { "Content-Type": sms.contentType || "application/json" };
  try {
    if (sms.headers && sms.headers.trim()) headers = { ...headers, ...JSON.parse(sms.headers) };
  } catch {}
  let url = fill(sms.url);
  const opts = { method: (sms.method || "POST").toUpperCase(), headers };
  if (opts.method !== "GET") opts.body = fill(sms.bodyTemplate);
  try {
    const r = await fetch(url, opts);
    const text = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, body: text.slice(0, 300) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------- Auth ----------
app.post("/api/login", (req, res) => {
  const { id, pwd } = req.body || {};
  if (id === ADMIN_ID && pwd === ADMIN_PWD)
    return res.json({ role: "admin", name: "Administrateur", id, approved: true, active: true });
  const db = loadDB();
  const u = db.users.find((x) => x.id === id && x.pwd === pwd);
  if (u)
    return res.json({
      role: u.role,
      name: u.name,
      phone: u.phone,
      approved: u.approved,
      active: vendorActive(u),
      subscriptionUntil: u.subscriptionUntil || null,
    });
  res.status(401).json({ error: "Identifiants invalides" });
});

app.post("/api/register", (req, res) => {
  const { id, pwd, name, phone, role } = req.body || {};
  if (!id || !pwd || !name) return res.status(400).json({ error: "Champs requis" });
  const db = loadDB();
  if (db.users.find((u) => u.id === id)) return res.status(400).json({ error: "Identifiant déjà pris" });
  const user = {
    id,
    pwd,
    name,
    phone: phone || "",
    role: role || "client",
    approved: role !== "vendeur",
    subscriptionUntil: null,
  };
  db.users.push(user);
  saveDB(db);
  res.json({ ok: true, approved: user.approved });
});

// ---------- Settings (admin) ----------
app.get("/api/settings", (_req, res) => {
  const s = loadDB().settings;
  res.json({ companyName: s.companyName, subscriptionPrice: s.subscriptionPrice, sms: s.sms });
});
app.post("/api/settings", (req, res) => {
  const db = loadDB();
  const { companyName, subscriptionPrice, sms } = req.body || {};
  if (companyName !== undefined) db.settings.companyName = companyName;
  if (subscriptionPrice !== undefined) db.settings.subscriptionPrice = Number(subscriptionPrice) || 0;
  if (sms) db.settings.sms = { ...db.settings.sms, ...sms };
  saveDB(db);
  res.json({ ok: true, settings: db.settings });
});
app.post("/api/settings/sms-test", async (req, res) => {
  const db = loadDB();
  const { to } = req.body || {};
  const r = await sendSMS(db.settings, to, `${db.settings.companyName}: SMS de test ✓`);
  res.json(r);
});

// ---------- Vendors admin ----------
app.get("/api/vendors", (_req, res) => {
  const db = loadDB();
  res.json(
    db.users
      .filter((u) => u.role === "vendeur")
      .map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        approved: u.approved,
        subscriptionUntil: u.subscriptionUntil || null,
        active: vendorActive(u),
      }))
  );
});
app.post("/api/vendors/approve", (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.body.id);
  if (u) {
    u.approved = true;
    saveDB(db);
  }
  res.json({ ok: true });
});
// Activer l'abonnement : prolonge de N mois (paiement reçu)
app.post("/api/vendors/activate", (req, res) => {
  const db = loadDB();
  const months = Number(req.body.months) || 1;
  const u = db.users.find((x) => x.id === req.body.id);
  if (u) {
    u.approved = true;
    const base = vendorActive(u) ? new Date(u.subscriptionUntil) : new Date();
    base.setMonth(base.getMonth() + months);
    u.subscriptionUntil = base.toISOString();
    saveDB(db);
  }
  res.json({ ok: true, subscriptionUntil: u && u.subscriptionUntil });
});
// Désactiver : pas payé -> articles cachés
app.post("/api/vendors/deactivate", (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.body.id);
  if (u) {
    u.subscriptionUntil = null;
    saveDB(db);
  }
  res.json({ ok: true });
});

// ---------- Products ----------
app.get("/api/products", (_req, res) => {
  const db = loadDB();
  res.json(db.products.filter((p) => productVisible(p, db)));
});
app.get("/api/products/all", (_req, res) => res.json(loadDB().products));
app.get("/api/products/mine/:ownerId", (req, res) => {
  const db = loadDB();
  res.json(db.products.filter((p) => p.ownerId === req.params.ownerId));
});
app.post("/api/products", (req, res) => {
  const db = loadDB();
  const b = req.body || {};
  const stock = Number(b.stock) || 0;
  const isAdmin = b.ownerRole === "admin";
  const p = {
    id: Date.now(),
    title: b.title,
    category: b.category,
    price: Number(b.price) || 0,
    oldPrice: b.oldPrice ? Number(b.oldPrice) : null,
    stock,
    stockInit: stock,
    image: b.image || null,
    description: b.description || "",
    whatsapp: b.whatsapp || "",
    personalPhone: b.personalPhone || "",
    ownerId: b.ownerId,
    ownerName: b.ownerName || "",
    ownerRole: b.ownerRole || "vendeur",
    approved: isAdmin ? true : false, // l'admin publie directement, le vendeur attend validation
    blocked: false,
  };
  db.products.push(p);
  saveDB(db);
  res.json(p);
});
app.post("/api/products/approve", (req, res) => {
  const db = loadDB();
  const p = db.products.find((x) => x.id === Number(req.body.id));
  if (p) {
    p.approved = true;
    p.blocked = false;
    saveDB(db);
  }
  res.json({ ok: true });
});
app.post("/api/products/block", (req, res) => {
  const db = loadDB();
  const p = db.products.find((x) => x.id === Number(req.body.id));
  if (p) {
    p.blocked = true;
    saveDB(db);
  }
  res.json({ ok: true });
});
app.post("/api/products/delete", (req, res) => {
  const db = loadDB();
  db.products = db.products.filter((x) => x.id !== Number(req.body.id));
  saveDB(db);
  res.json({ ok: true });
});

// ---------- Orders ----------
app.get("/api/orders", (_req, res) => res.json(loadDB().orders));
app.post("/api/orders", async (req, res) => {
  const db = loadDB();
  const orderNo = "CMD-" + Date.now().toString().slice(-6);
  const o = { id: Date.now(), orderNo, createdAt: new Date().toISOString(), ...req.body };

  // décrémente le stock + notifie chaque propriétaire d'article par SMS
  const owners = {}; // personalPhone -> {names:[]}
  for (const it of o.items || []) {
    const p = db.products.find((x) => x.id === Number(it.id));
    if (p) {
      if (typeof p.stock === "number") p.stock = Math.max(0, p.stock - (it.qty || 1));
      const phone = p.personalPhone || p.whatsapp || "";
      if (phone) {
        owners[phone] = owners[phone] || [];
        owners[phone].push(`${it.qty}x ${p.title}`);
      }
    }
  }
  saveDB(db);

  // SMS aux propriétaires (en-tête = nom entreprise + n° commande)
  const company = db.settings.companyName || "ABENGOUROU-MARKET";
  const mode = o.delivery === "agence" ? "Retrait sur place" : "Livraison domicile";
  const smsResults = [];
  for (const [phone, articles] of Object.entries(owners)) {
    const message = `${company} - ${o.orderNo}\nNouvelle commande: ${articles.join(", ")}\nClient: ${o.name || ""} ${o.phone || ""}\n${mode}\nTotal: ${o.total || 0} FCFA`;
    smsResults.push(await sendSMS(db.settings, phone, message));
  }

  res.json({ ...o, smsResults });
});

// SPA fallback
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`ABENGOUROU-MARKET sur http://localhost:${PORT}`));
