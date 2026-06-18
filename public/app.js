/* ABENGOUROU-MARKET — frontend v2 */

// ============ DATA ============
const CATEGORIES = [
  ["immobilier","🏠","Immobilier"],
  ["vehicules","🚗","Véhicules & Motos"],
  ["telephones","📱","Téléphones"],
  ["informatique","💻","Informatique"],
  ["mode","👕","Mode & Beauté"],
  ["supermarche","🛒","Supermarché"],
  ["restaurants","🍽️","Restaurants"],
  ["agriculture","🌾","Agriculture"],
  ["services","👨‍🔧","Services"],
  ["scolaires","🎓","Scolaires"],
  ["sante","🏥","Santé"],
  ["evenements","🎉","Événements"],
  ["annonces","📢","Annonces"],
  ["actualites","📰","Actualités"],
  ["concours-ci","📚","Concours CI"],
  ["emploi","💼","Emploi"],
  ["transport","🚕","Transport"],
];

const SHORTCUTS = [
  ["📚","Concours CI","concours-ci"],["💼","Emploi","emploi"],["🏠","Immobilier","immobilier"],
  ["🚕","Taxi","transport"],["🍽️","Livraison","restaurants"],["📢","Annonces","annonces"],
  ["📰","Actualités","actualites"],["🎉","Événements","evenements"],
];

const BANNERS = [
  { bg: "linear-gradient(135deg,#F57C00 0%,#E65100 50%,#BF360C 100%)", title: "Bienvenue sur ABENGOUROU-MARKET", sub: "La plateforme numérique d'Abengourou · Acheter, Vendre, Découvrir", cta: "Découvrir les offres" },
  { bg: "linear-gradient(135deg,#2E7D32 0%,#1B5E20 100%)", title: "🏡 Immobilier à Abengourou", sub: "Terrains, villas, studios — les meilleures offres au meilleur prix", cta: "Voir l'immobilier" },
  { bg: "linear-gradient(135deg,#0277BD 0%,#01579B 100%)", title: "💼 Trouvez votre emploi ici", sub: "Des centaines d'offres d'emploi dans la région d'Abengourou", cta: "Voir les offres d'emploi" },
  { bg: "linear-gradient(135deg,#6A1B9A 0%,#4A148C 100%)", title: "🎓 Concours de la Fonction Publique", sub: "Toutes les informations sur les concours CI — INFAS, ENA, Police…", cta: "Voir les concours" },
  { bg: "linear-gradient(135deg,#C62828 0%,#B71C1C 100%)", title: "⚡ Offres Flash du Jour", sub: "Profitez des meilleures promotions — stocks limités !", cta: "Voir les offres flash" },
];


const ADMIN_PHONE = "22901679240076";
const fmt = n => Number(n).toLocaleString("fr-FR") + " FCFA";

// ============ STATE ============
let CART = JSON.parse(localStorage.getItem("cart") || "[]");
let USER = JSON.parse(localStorage.getItem("user") || "null");
const saveCart = () => { localStorage.setItem("cart", JSON.stringify(CART)); updateCartCount(); };
const updateCartCount = () => {
  const n = CART.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cartCount").textContent = n;
  document.getElementById("cartCount").style.display = n > 0 ? "" : "none";
};

// ============ SIDEBAR ============
function renderSidebar(target) {
  target.innerHTML = `
    <div class="sidebar-logo"><img src="/img/logo.png" alt="logo" /></div>
    <div class="sidebar-head">NOS CATÉGORIES</div>
    <ul>${CATEGORIES.map(([s,i,n]) => `<li><a href="#" onclick="filterCat('${s}');return false;">${i} ${n}</a></li>`).join("")}</ul>`;
}

// Catégories "payantes" (détails cachés — payer pour voir)
const PAID_CATS = new Set(["emploi","concours-ci","recrutement"]);

async function filterCat(cat) {
  document.getElementById("mobileSidebar").classList.remove("show");
  const catInfo = CATEGORIES.find(c => c[0] === cat) || [cat, "🗂️", cat];
  const [slug, icon, label] = catInfo;

  showPage("page-category");

  const wrap = document.getElementById("catPageContent");
  wrap.innerHTML = `
    <div class="cat-page-header">
      <span class="cat-page-icon">${icon}</span>
      <div>
        <h2>${label}</h2>
        <p>Toutes les annonces · Abengourou et Côte d'Ivoire</p>
      </div>
    </div>
    <div class="section-block">
      <div class="loading-placeholder"><div class="spinner"></div><p>Chargement…</p></div>
    </div>`;

  let all = [];
  try { all = await (await fetch("/api/products")).json(); } catch {}
  const products = all.filter(p => p.category === slug);

  if (!products.length) {
    wrap.querySelector(".section-block").innerHTML = `
      <div class="empty-state">
        <div class="empty-ico">${icon}</div>
        <p>Aucune annonce dans cette catégorie pour le moment.</p>
        <p style="font-size:13px;color:var(--muted);margin-top:6px">0 résultat — revenez bientôt !</p>
      </div>`;
    return;
  }

  const isPaid = PAID_CATS.has(slug);
  wrap.querySelector(".section-block").innerHTML = `
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px">${products.length} annonce${products.length>1?"s":""} disponible${products.length>1?"s":""}</div>
    <div class="${isPaid ? "listings-grid" : "products-grid"}">
      ${products.map(p => isPaid ? paidListingCard(p) : productCard({...p, name:p.title})).join("")}
    </div>`;
}

// ============ CAT NAV ============
function renderCatNav() {
  const el = document.getElementById("catNavLinks");
  if (!el) return;
  el.innerHTML = CATEGORIES.slice(0, 12).map(([s,i,n]) =>
    `<a href="#" onclick="filterCat('${s}');return false;">${i} ${n}</a>`
  ).join("");
}

// ============ CAROUSEL ============
let carIdx = 0, carTimer = null;
function renderCarousel() {
  const track = document.getElementById("carouselTrack");
  const dots = document.getElementById("carDots");
  if (!track) return;
  track.innerHTML = BANNERS.map((b, i) => `
    <div class="car-slide">
      <div class="car-slide-bg" style="background:${b.bg}"></div>
      <div class="car-slide-overlay" style="background:rgba(0,0,0,.18)"></div>
      <div class="car-slide-content">
        <h2>${b.title}</h2>
        <p>${b.sub}</p>
        <span class="car-cta">${b.cta}</span>
      </div>
    </div>`).join("");
  dots.innerHTML = BANNERS.map((_, i) =>
    `<span class="car-dot${i===0?" active":""}" onclick="carGo(${i})"></span>`
  ).join("");
  carTimer = setInterval(() => carMove(1), 4500);
}
function carMove(dir) {
  carIdx = (carIdx + dir + BANNERS.length) % BANNERS.length;
  carGo(carIdx);
}
function carGo(idx) {
  carIdx = idx;
  const track = document.getElementById("carouselTrack");
  if (track) track.style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll(".car-dot").forEach((d, i) => d.classList.toggle("active", i === idx));
}

// ============ COUNTDOWN FLASH ============
function startCountdown() {
  const el = document.getElementById("flashCountdown");
  if (!el) return;
  const end = new Date(); end.setHours(23, 59, 59, 0);
  function tick() {
    const diff = end - Date.now();
    if (diff <= 0) { el.textContent = "TERMINÉ"; return; }
    const h = String(Math.floor(diff/3600000)).padStart(2,"0");
    const m = String(Math.floor((diff%3600000)/60000)).padStart(2,"0");
    const s = String(Math.floor((diff%60000)/1000)).padStart(2,"0");
    el.textContent = `${h}:${m}:${s}`;
  }
  tick(); setInterval(tick, 1000);
}

// ============ PAID LISTING CARD (Emploi / Concours-CI) ============
function paidListingCard(p) {
  const img = p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy" />` : `<span>🔒</span>`;
  return `<div class="plisting-card">
    <div class="plisting-img">${img}</div>
    <div class="plisting-body">
      <div class="plisting-cat">${CATEGORIES.find(c=>c[0]===p.category)?.[2]||p.category}</div>
      <div class="plisting-title">${p.title}</div>
      <div class="plisting-lock">
        <span class="lock-icon">🔒</span>
        <span>Détails accessibles après paiement</span>
      </div>
      <div class="plisting-price">${fmt(p.price)}</div>
      <button class="btn-add plisting-btn" onclick='openPaidListing(${JSON.stringify({id:p.id,title:p.title,price:p.price,category:p.category,ownerName:""}).replace(/'/g,"&#39;")})'>
        🔓 Accéder aux détails
      </button>
    </div>
  </div>`;
}

function openPaidListing(p) {
  modalHTML(`
    <h2>🔒 Offre protégée <button class="modal-close" onclick="closeModal()">✕</button></h2>
    <div style="background:#F3F4F6;border-radius:var(--radius);padding:14px;margin-bottom:14px">
      <strong style="font-size:16px">${p.title}</strong>
    </div>
    <div style="background:#FFF3E0;border:1.5px solid #FFCC80;border-radius:var(--radius);padding:14px;margin-bottom:16px;font-size:14px;line-height:1.7">
      <strong>📋 Comment ça marche ?</strong><br>
      1. Vous ajoutez cette offre à votre panier<br>
      2. Vous effectuez le paiement (${fmt(p.price)})<br>
      3. Vous recevez les <strong>détails complets</strong> via WhatsApp immédiatement après confirmation
    </div>
    <div class="plisting-price" style="font-size:20px;margin-bottom:14px">${fmt(p.price)}</div>
    <div class="btn-row">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick='addCart({id:${p.id},name:${JSON.stringify(p.title)},price:${p.price},emoji:"🔒",isPaid:true});closeModal()'>
        🛒 Acheter — Voir les détails
      </button>
    </div>`);
}

// ============ PRODUCT CARD ============
function productCard(p, isFlash = false) {
  const pct = isFlash ? Math.round((p.stock/p.stockInit)*100) : null;
  const red = (p.oldPrice && p.price) ? Math.round(((p.oldPrice-p.price)/p.oldPrice)*100) : 0;
  const img = p.image ? `<img src="${p.image}" alt="${p.name||p.title}" loading="lazy" />` : `<span>${p.emoji||"🛍️"}</span>`;
  const wa = (p.whatsapp || "").replace(/\D/g, "");
  const name = p.name || p.title || "";
  const pData = JSON.stringify({id:p.id,name,price:p.price,oldPrice:p.oldPrice||null,stock:p.stock||0,image:p.image||null,description:p.description||"",whatsapp:wa,emoji:p.emoji||"🛍️"}).replace(/'/g,"&#39;");
  return `<div class="pcard" onclick='openProductDetail(${pData})' style="cursor:pointer">
    <div class="pcard-img">
      ${img}
      ${red > 0 ? `<span class="pcard-badge">-${red}%</span>` : ""}
      <span class="pcard-wish">♡</span>
    </div>
    <div class="pcard-body">
      <div class="pcard-name">${name}</div>
      <div class="pcard-price">${fmt(p.price)}</div>
      ${p.oldPrice ? `<div class="pcard-oldprice">${fmt(p.oldPrice)}</div>` : ""}
      ${isFlash && p.stock > 0 ? `<div class="stock-bar"><span style="width:${pct}%"></span></div><div class="pcard-stock">${p.stock} restants</div>` : (!isFlash && p.stock > 0 ? `<div class="pcard-stock">${p.stock} en stock</div>` : "")}
      <div class="pcard-actions">
        <button class="btn-add" onclick='event.stopPropagation();addCart(${JSON.stringify({id:p.id,name,price:p.price,emoji:p.emoji||"🛍️"})})'>+ Panier</button>
        ${wa ? `<button class="btn-wa" onclick="event.stopPropagation();window.open('https://wa.me/${wa}?text='+encodeURIComponent('Bonjour, article: ${name.replace(/'/g,"")}'))">W</button>` : ""}
      </div>
    </div>
  </div>`;
}

function openProductDetail(p) {
  const wa = (p.whatsapp || "").replace(/\D/g, "");
  const img = p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;max-height:260px;object-fit:cover;border-radius:var(--radius);margin-bottom:14px" />` : "";
  const desc = (p.description || "").trim();
  modalHTML(`
    <h2 style="font-size:17px;margin-bottom:4px">${p.name} <button class="modal-close" onclick="closeModal()">✕</button></h2>
    ${img}
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap">
      <span style="font-size:22px;font-weight:700;color:var(--primary)">${fmt(p.price)}</span>
      ${p.oldPrice ? `<span style="font-size:14px;color:var(--muted);text-decoration:line-through">${fmt(p.oldPrice)}</span>` : ""}
      <span style="font-size:13px;color:var(--muted)">${p.stock > 0 ? p.stock+" en stock" : "Rupture de stock"}</span>
    </div>
    ${desc ? `<div style="font-size:14px;line-height:1.7;color:var(--text);white-space:pre-line;margin-bottom:14px;background:#f9f9f9;padding:12px;border-radius:var(--radius)">${desc}</div>` : ""}
    <div class="btn-row">
      <button class="btn btn-ghost" onclick="closeModal()">Fermer</button>
      ${wa ? `<button class="btn btn-secondary" onclick="window.open('https://wa.me/${wa}?text='+encodeURIComponent('Bonjour, je suis intéressé par : ${p.name.replace(/'/g,"")}'))">💬 WhatsApp</button>` : ""}
      <button class="btn btn-primary" onclick='addCart(${JSON.stringify({id:p.id,name:p.name,price:p.price,emoji:p.emoji||"🛍️"})});closeModal()'>+ Panier</button>
    </div>`);
}

// ============ RENDER HOME ============
function renderHome() {
  renderSidebar(document.getElementById("desktopSidebar"));
  renderCatNav();
  renderCarousel();

  document.getElementById("shortcuts").innerHTML = SHORTCUTS.map(([i,n,cat]) =>
    `<a href="#" class="shortcut" onclick="filterCat('${cat}');return false;"><span class="ico">${i}</span><span>${n}</span></a>`
  ).join("");

  loadFlashSection();
  loadPaidSection("concoursGrid", "concours-ci", "📚");
  loadPaidSection("jobsGrid", "emploi", "💼");
  loadCatSection("realGrid", "immobilier", "🏠", "Aucun bien immobilier disponible.", "products-grid");
  loadTransportSection();
  loadCatSection("restoGrid", "restaurants", "🍽️", "Aucun restaurant disponible.", "products-grid");
  loadNewsSection();
  loadShop();
}

// Offres flash = produits avec remise publiés (oldPrice > price)
async function loadFlashSection() {
  const el = document.getElementById("flashGrid");
  if (!el) return;
  let products = [];
  try {
    const all = await (await fetch("/api/products")).json();
    products = all.filter(p => p.oldPrice && Number(p.oldPrice) > Number(p.price) && !PAID_CATS.has(p.category));
  } catch {}
  if (!products.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">⚡</div><p>Aucune offre flash pour le moment.</p></div>`;
    return;
  }
  el.innerHTML = products.map(p => productCard({...p, name:p.title}, true)).join("");
}

// Charge une catégorie depuis l'API dans une grille
async function loadCatSection(gridId, category, icon, emptyMsg, gridClass) {
  const el = document.getElementById(gridId);
  if (!el) return;
  let products = [];
  try {
    const all = await (await fetch("/api/products")).json();
    products = all.filter(p => p.category === category);
  } catch {}
  if (!products.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">${icon}</div><p>${emptyMsg}</p></div>`;
    return;
  }
  el.className = gridClass;
  el.innerHTML = products.map(p => productCard({...p, name:p.title})).join("");
}

// Transport depuis l'API
async function loadTransportSection() {
  const el = document.getElementById("transportGrid");
  if (!el) return;
  let products = [];
  try {
    const all = await (await fetch("/api/products")).json();
    products = all.filter(p => p.category === "transport");
  } catch {}
  if (!products.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-ico">🚕</div><p>Aucune offre de transport pour le moment.</p></div>`;
    return;
  }
  el.innerHTML = products.map(p => `
    <div class="transport-card">
      <div class="t-ico">${p.image ? `<img src="${p.image}" style="width:60px;height:60px;object-fit:cover;border-radius:50%">` : "🚕"}</div>
      <h4>${p.title}</h4>
      <p style="font-size:12px;color:var(--muted);margin-top:4px">${p.description||""}</p>
      <button class="btn-add" style="display:block;width:100%;margin-top:12px;border-radius:20px"
        onclick='addCart({id:${p.id},name:"${p.title.replace(/"/g,"&quot;")}",price:${p.price},emoji:"🚕"})'>Commander</button>
    </div>`).join("");
}

// Actualités depuis l'API
async function loadNewsSection() {
  const el = document.getElementById("newsList");
  if (!el) return;
  let products = [];
  try {
    const all = await (await fetch("/api/products")).json();
    products = all.filter(p => p.category === "actualites");
  } catch {}
  if (!products.length) {
    el.innerHTML = `<li style="list-style:none;padding:20px;text-align:center;color:var(--muted)">📰 Aucune actualité pour le moment.</li>`;
    return;
  }
  el.innerHTML = products.map(p => `
    <li>
      <span class="news-cat">Actualité</span>
      <div class="news-txt"><h5>${p.title}</h5><span>${new Date(p.createdAt||Date.now()).toLocaleDateString("fr-FR")}</span></div>
    </li>`).join("");
}

// ============ LOAD SHOP (API) ============
async function loadShop() {
  const grid = document.getElementById("shopGrid");
  if (!grid) return;
  let products = [];
  try { products = await (await fetch("/api/products")).json(); } catch {}
  // Exclure les offres emploi/concours de la boutique principale
  const shopItems = products.filter(p => !PAID_CATS.has(p.category));
  if (!shopItems.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">🛍️</div><p>Aucun article en ligne pour le moment.</p></div>`;
    return;
  }
  grid.innerHTML = shopItems.map(p => productCard({ ...p, name: p.title }, false)).join("");
}

// ============ LOAD PAID SECTIONS (Emploi / Concours) ============
async function loadPaidSection(gridId, category, icon) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  let all = [];
  try { all = await (await fetch("/api/products")).json(); } catch {}
  const items = all.filter(p => p.category === category);
  if (!items.length) {
    grid.innerHTML = `<div class="tile-empty"><span>${icon}</span><p>0 offre disponible pour le moment</p></div>`;
    return;
  }
  grid.innerHTML = items.map(p => `
    <div class="tile tile-paid" onclick='openPaidListing(${JSON.stringify({id:p.id,title:p.title,price:p.price,category:p.category,ownerName:p.ownerName||"Administrateur"}).replace(/'/g,"&#39;")})'>
      <div class="tile-lock">🔒</div>
      <h4>${p.title}</h4>
      <div class="tile-paid-price">${fmt(p.price)}</div>
      <span class="tag tag-orange">Payer pour voir les détails</span>
    </div>`).join("");
}

// ============ SEARCH ============
async function doSearch() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const cat = document.getElementById("searchCat").value;
  if (!q && !cat) return toast("Entrez un mot-clé ou choisissez une catégorie", "red");

  showPage("page-category");
  const wrap = document.getElementById("catPageContent");
  const label = cat ? (CATEGORIES.find(c=>c[0]===cat)?.[2]||cat) : `"${q}"`;
  wrap.innerHTML = `
    <div class="cat-page-header">
      <span class="cat-page-icon">🔍</span>
      <div><h2>Résultats : ${label}</h2><p>Recherche en cours…</p></div>
    </div>
    <div class="section-block"><div class="loading-placeholder"><div class="spinner"></div><p>Chargement…</p></div></div>`;

  let all = [];
  try { all = await (await fetch("/api/products")).json(); } catch {}

  let results = all;
  if (cat) results = results.filter(p => p.category === cat);
  if (q) results = results.filter(p =>
    p.title?.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q) ||
    p.ownerName?.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q)
  );

  if (!results.length) {
    wrap.querySelector(".section-block").innerHTML =
      `<div class="empty-state"><div class="empty-ico">🔍</div><p>Aucun résultat pour <strong>${label}</strong>.</p></div>`;
    return;
  }
  wrap.querySelector("p").textContent = `${results.length} résultat${results.length>1?"s":""}`;
  wrap.querySelector(".section-block").innerHTML = `
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px">${results.length} résultat${results.length>1?"s":""}</div>
    <div class="products-grid">
      ${results.map(p => PAID_CATS.has(p.category) ? paidListingCard(p) : productCard({...p,name:p.title})).join("")}
    </div>`;
}
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.activeElement.id === "searchInput") doSearch();
});

// ============ NAVIGATION ============
function showPage(id) {
  document.querySelectorAll(".page-view").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showHome() {
  showPage("page-home");
  // Recharger les sections dynamiques emploi/concours
  loadPaidSection("concoursGrid", "concours-ci", "📚");
  loadPaidSection("jobsGrid", "emploi", "💼");
  loadShop();
}
function showText(key) {
  const TEXTS = {
    apropos: { t:"À propos de nous", ico:"ℹ️", b:`ABENGOUROU-MARKET est une plateforme numérique conçue pour faciliter les échanges commerciaux, la diffusion d'informations et l'accès aux opportunités dans la ville d'Abengourou et partout en Côte d'Ivoire.

Notre mission est de rapprocher vendeurs, acheteurs, employeurs, chercheurs d'emploi, propriétaires immobiliers, prestataires de services et citoyens au sein d'une même plateforme moderne et accessible.

À travers ABENGOUROU-MARKET, vous pouvez :
• Acheter et vendre des produits
• Publier et consulter des offres d'emploi
• Suivre les actualités des concours
• Trouver des biens immobiliers
• Publier des petites annonces
• Découvrir les actualités et événements locaux
• Accéder à divers services de proximité

Notre ambition est de contribuer au développement économique et numérique de la région d'Abengourou.` },
    conditions: { t:"Conditions d'utilisation", ico:"📋", b:`En utilisant ABENGOUROU-MARKET, vous acceptez les présentes conditions d'utilisation.

Utilisation du service
Les utilisateurs s'engagent à fournir des informations exactes lors de leur inscription et de leurs publications.

Publications interdites
• Informations mensongères ou frauduleuses
• Contenus diffamatoires ou injurieux
• Produits ou services interdits par la loi

Responsabilité
ABENGOUROU-MARKET agit comme intermédiaire et ne peut être tenu responsable des transactions entre utilisateurs.

Suspension de compte
Tout compte ne respectant pas ces conditions pourra être suspendu sans préavis.` },
    conf: { t:"Politique de confidentialité", ico:"🔒", b:`ABENGOUROU-MARKET accorde une grande importance à la protection des données personnelles.

Données collectées : Nom, téléphone, informations des annonces publiées.

Utilisation : Créer et gérer votre compte, faciliter les échanges, améliorer nos services.

Protection : Mesures de sécurité contre tout accès non autorisé.

Partage : Nous ne vendons ni ne louons les données personnelles à des tiers.

Vos droits : Vous pouvez demander la modification ou suppression de vos données à tout moment.` },
    contact: { t:"Nous contacter", ico:"📞", b:`📍 Abengourou, Côte d'Ivoire
📞 Téléphone : +225 XX XX XX XX XX
📧 E-mail : contact@abengourou-market.com
🌐 Site web : www.abengourou-market.com

Service client
Du lundi au samedi · 08h00 à 18h00

Pour toute question, suggestion ou réclamation, n'hésitez pas à nous contacter.` },
    pub: { t:"Faire de la publicité", ico:"📢", b:`Faites connaître votre activité à des milliers d'utilisateurs à Abengourou et dans toute la Côte d'Ivoire.

Nos offres publicitaires :
• Bannière en page d'accueil
• Mise en avant de vos articles
• Article sponsorisé

Contactez-nous pour les tarifs :
📧 contact@abengourou-market.com
📞 +225 XX XX XX XX XX` },
  };
  const T = TEXTS[key];
  document.getElementById("textBody").innerHTML = `
    <h2 style="display:flex;align-items:center;gap:10px;margin-bottom:16px">${T.ico} ${T.t}</h2>
    <div style="white-space:pre-line;font-size:14px;line-height:1.8;color:var(--text)">${T.b}</div>`;
  showPage("page-text");
}

// ============ CART ============
function addCart(p) {
  const ex = CART.find(i => String(i.id) === String(p.id));
  if (ex) ex.qty++;
  else CART.push({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || "📦", qty: 1 });
  saveCart();
  toast("✓ Ajouté au panier", "green");
}

function openCart() {
  if (!CART.length) {
    modalHTML(`
      <h2>🛒 Mon panier <button class="modal-close" onclick="closeModal()">✕</button></h2>
      <div class="empty-state"><div class="empty-ico">🛒</div><p>Votre panier est vide.</p></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Continuer les achats</button></div>`);
    return;
  }
  const total = CART.reduce((s, i) => s + i.price * i.qty, 0);
  modalHTML(`
    <h2>🛒 Mon panier <button class="modal-close" onclick="closeModal()">✕</button></h2>
    ${CART.map((i, idx) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${i.emoji} ${i.name}</strong>
          <small>${i.qty} × ${fmt(i.price)}</small>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <strong>${fmt(i.price * i.qty)}</strong>
          <button class="btn btn-ghost btn-sm" onclick="removeItem(${idx})">✕</button>
        </div>
      </div>`).join("")}
    <hr class="modal-divider" />
    <div class="cart-total-bar"><span>Total</span><span>${fmt(total)}</span></div>
    <div class="btn-row">
      <button class="btn btn-ghost" onclick="closeModal()">Continuer</button>
      <button class="btn btn-primary" onclick="startCheckout()">Commander →</button>
    </div>`);
}

function removeItem(i) { CART.splice(i, 1); saveCart(); openCart(); }

// ============ CHECKOUT ============
function startCheckout() {
  modalHTML(`
    <h2>📦 Livraison <button class="modal-close" onclick="closeModal()">✕</button></h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Comment souhaitez-vous recevoir votre commande ?</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-primary btn-lg" onclick="chooseDelivery('agence')">🏢 Retrait à l'agence</button>
      <button class="btn btn-outline btn-lg" onclick="chooseDelivery('domicile')">🚚 Livraison à domicile</button>
    </div>`);
}

let CHECKOUT = {};
function chooseDelivery(mode) {
  CHECKOUT.delivery = mode;
  if (mode === "agence") return askContact();
  // Démarrage automatique de la géolocalisation
  getLocation();
}
function getLocation() {
  if (!navigator.geolocation) {
    // GPS non supporté par le navigateur
    CHECKOUT.location = "GPS non disponible";
    return askContact();
  }
  // Affiche l'écran de chargement immédiatement
  modalHTML(`
    <h2>📍 Localisation en cours… <button class="modal-close" onclick="closeModal()">✕</button></h2>
    <div style="text-align:center;padding:30px 20px">
      <div class="spinner" style="margin:0 auto 16px"></div>
      <p style="font-size:14px;color:var(--muted)">Récupération de votre position GPS…</p>
      <p style="font-size:12px;color:var(--muted);margin-top:8px">Autorisez la localisation si votre navigateur le demande.</p>
    </div>`);
  navigator.geolocation.getCurrentPosition(
    pos => {
      // Succès : coordonnées récupérées
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      CHECKOUT.location = `${lat},${lng}`;
      CHECKOUT.mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      askContact();
    },
    err => {
      // Échec : localisation refusée ou indisponible
      const reason = err.code === 1 ? "accès refusé" : err.code === 2 ? "position indisponible" : "délai dépassé";
      modalHTML(`
        <h2>📍 Localisation requise <button class="modal-close" onclick="closeModal()">✕</button></h2>
        <div style="background:#FFF3E0;border:1.5px solid #FFCC80;border-radius:var(--radius);padding:14px;margin-bottom:16px">
          <strong style="color:var(--primary)">⚠️ Localisation ${reason}</strong>
          <p style="font-size:13px;margin-top:6px;line-height:1.6">Pour la livraison à domicile, nous avons besoin de votre position GPS.<br>
          Veuillez activer la localisation dans votre navigateur :</p>
          <ul style="font-size:13px;margin:8px 0 0 16px;line-height:1.8">
            <li><strong>Chrome :</strong> Cadenas 🔒 dans la barre d'adresse → Localisation → Autoriser</li>
            <li><strong>Firefox :</strong> Icône d'emplacement dans la barre → Autoriser</li>
            <li><strong>Safari :</strong> Réglages → Sites web → Localisation → Autoriser</li>
          </ul>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-primary" onclick="getLocation()">🔄 Réessayer la localisation</button>
          <button class="btn btn-ghost" style="font-size:13px" onclick="skipLocation()">Continuer sans localisation (entrer l'adresse manuellement)</button>
          <button class="btn btn-ghost" onclick="startCheckout()">← Retour</button>
        </div>`);
    },
    { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true }
  );
}
function skipLocation() {
  CHECKOUT.location = "Adresse manuelle";
  CHECKOUT.mapsUrl = null;
  askContact();
}
function askContact() {
  const isHome = CHECKOUT.delivery === "domicile";
  const hasGPS = CHECKOUT.location && CHECKOUT.location !== "Adresse manuelle" && CHECKOUT.location !== "GPS non disponible";
  const gpsBanner = isHome
    ? hasGPS
      ? `<div style="background:#E8F5E9;border:1.5px solid #81C784;border-radius:var(--radius);padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;font-size:13px">
           <span style="font-size:20px">📍</span>
           <div>
             <strong style="color:var(--secondary)">Position GPS capturée ✓</strong><br>
             <span style="color:var(--muted)">Coordonnées : ${CHECKOUT.location}</span>
             ${CHECKOUT.mapsUrl ? `&nbsp;— <a href="${CHECKOUT.mapsUrl}" target="_blank" style="color:var(--info)">Voir sur la carte</a>` : ""}
           </div>
         </div>`
      : `<div style="background:#FFF3E0;border:1.5px solid #FFCC80;border-radius:var(--radius);padding:10px 14px;margin-bottom:14px;font-size:13px">
           ⚠️ Localisation non capturée — précisez bien votre adresse ci-dessous.
         </div>`
    : "";
  modalHTML(`
    <h2>📝 Vos coordonnées <button class="modal-close" onclick="closeModal()">✕</button></h2>
    ${gpsBanner}
    <div class="form-group"><label>Nom complet *</label><input id="coName" placeholder="Jean Kouassi" /></div>
    <div class="form-group"><label>Téléphone *</label><input id="coPhone" placeholder="07 00 00 00 00" type="tel" /></div>
    <div class="form-group">
      <label>${isHome ? "Quartier / Adresse de livraison" : "Adresse (optionnel)"}</label>
      <input id="coAddr" placeholder="${isHome ? "Quartier, rue, point de repère précis…" : "Quartier, repère…"}" />
    </div>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-ghost" onclick="startCheckout()">← Retour</button>
      <button class="btn btn-primary" onclick="showPayment()">Continuer →</button>
    </div>`);
}
function showPayment() {
  CHECKOUT.name = document.getElementById("coName").value;
  CHECKOUT.phone = document.getElementById("coPhone").value;
  CHECKOUT.address = document.getElementById("coAddr").value;
  if (!CHECKOUT.name || !CHECKOUT.phone) return toast("Veuillez remplir nom et téléphone", "red");
  modalHTML(`
    <h2>💳 Paiement <button class="modal-close" onclick="closeModal()">✕</button></h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Choisissez votre mode de paiement :</p>
    <div class="pay-grid">
      <div class="pay-opt" onclick="selectPay(this,'Wave')"><div class="pay-logo wave-c">Wave</div><div class="pay-nm">Wave</div></div>
      <div class="pay-opt" onclick="selectPay(this,'Orange Money')"><div class="pay-logo orange-c">OM</div><div class="pay-nm">Orange Money</div></div>
      <div class="pay-opt" onclick="selectPay(this,'MTN MoMo')"><div class="pay-logo mtn-c" style="color:#000">MTN</div><div class="pay-nm">MTN MoMo</div></div>
      <div class="pay-opt" onclick="selectPay(this,'Moov Money')"><div class="pay-logo moov-c">Moov</div><div class="pay-nm">Moov Money</div></div>
    </div>
    <div class="form-group" style="margin-top:14px"><label>Numéro mobile money *</label><input id="payNum" placeholder="07 00 00 00 00" type="tel" /></div>
    <div style="background:#FFF3E0;border-radius:var(--radius);padding:10px 12px;font-size:13px;margin-top:10px">
      💰 Total à payer : <strong>${fmt(CART.reduce((s,i)=>s+i.price*i.qty,0))}</strong>
    </div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-ghost" onclick="askContact()">← Retour</button>
      <button class="btn btn-primary" onclick="finalizeOrder()">✓ Confirmer la commande</button>
    </div>`);
}
function selectPay(el, name) {
  document.querySelectorAll(".pay-opt").forEach(o => o.classList.remove("sel"));
  el.classList.add("sel");
  CHECKOUT.payMethod = name;
}
async function finalizeOrder() {
  if (!CHECKOUT.payMethod) return toast("Choisissez un mode de paiement", "red");
  CHECKOUT.payNum = document.getElementById("payNum").value;
  if (!CHECKOUT.payNum) return toast("Entrez votre numéro", "red");
  const total = CART.reduce((s, i) => s + i.price * i.qty, 0);
  const order = { ...CHECKOUT, items: CART, total };
  try { await fetch("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(order) }); } catch {}
  const msg = `🛒 *Nouvelle commande ABENGOUROU-MARKET*%0A👤 ${order.name} (${order.phone})%0A📍 ${order.delivery==="domicile"?"Livraison : "+order.address+(order.mapsUrl?" "+order.mapsUrl:""):"Retrait à l'agence"}%0A📦 Articles :%0A${order.items.map(i=>`• ${i.qty}× ${i.name} = ${fmt(i.price*i.qty)}`).join("%0A")}%0A💰 Total : ${fmt(total)}%0A💳 Paiement : ${order.payMethod} (${order.payNum})`;
  window.open(`https://wa.me/${ADMIN_PHONE}?text=${msg}`, "_blank");
  CART = []; saveCart(); CHECKOUT = {};
  modalHTML(`
    <div style="text-align:center;padding:20px">
      <div style="font-size:64px">✅</div>
      <h2 style="color:var(--secondary);margin-top:12px">Commande confirmée !</h2>
      <p style="margin:12px 0;color:var(--muted);font-size:14px">Votre commande a été envoyée. Vous recevrez un appel pour confirmation dans quelques minutes.</p>
      <button class="btn btn-primary btn-lg" onclick="closeModal();showHome()">Retour à l'accueil</button>
    </div>`);
}

// ============ ACCOUNT ============
function openAccount() {
  if (USER) {
    const initials = USER.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2);
    const actionBtn = USER.role === "admin"
      ? `<button class="btn btn-primary" onclick="closeModal();showAdmin()">🎛️ Tableau de bord Admin</button>`
      : USER.role === "vendeur"
        ? `<button class="btn btn-primary" onclick="closeModal();showVendeur()">🏪 Mon espace vendeur</button>`
        : "";
    modalHTML(`
      <h2>Mon compte <button class="modal-close" onclick="closeModal()">✕</button></h2>
      <div style="display:flex;align-items:center;gap:14px;padding:12px;background:#f9f9f9;border-radius:var(--radius);margin-bottom:16px">
        <div class="account-avatar">${initials}</div>
        <div><strong style="font-size:16px">${USER.name}</strong><br><span style="font-size:13px;color:var(--muted)">Compte : ${USER.role}</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${actionBtn}
        <button class="btn btn-ghost" onclick="logout()">🚪 Se déconnecter</button>
      </div>`);
    return;
  }
  modalHTML(`
    <h2>👤 Mon compte <button class="modal-close" onclick="closeModal()">✕</button></h2>
    <div class="tabs">
      <button class="active" onclick="accTab(this,'login')">Connexion</button>
      <button onclick="accTab(this,'register')">Inscription</button>
    </div>
    <div id="accBody"></div>`);
  accTab(document.querySelector(".tabs button"), "login");
}
function accTab(btn, which) {
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const body = document.getElementById("accBody");
  if (which === "login") {
    body.innerHTML = `
      <div class="form-group"><label>Identifiant</label><input id="lgId" placeholder="Votre identifiant" autocomplete="username" /></div>
      <div class="form-group"><label>Mot de passe</label><input id="lgPwd" type="password" placeholder="••••••••" autocomplete="current-password" /></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="doLogin()">Se connecter</button></div>
      <p style="font-size:12px;color:var(--muted);margin-top:10px;text-align:center">Espace réservé aux vendeurs et à l'administrateur.<br>Les clients commandent directement sans compte.</p>`;
  } else {
    body.innerHTML = `
      <div style="background:var(--primary-light);border-left:4px solid var(--primary);border-radius:0 var(--radius) var(--radius) 0;padding:10px 14px;font-size:13px;margin-bottom:14px">
        🏪 L'inscription est réservée aux <strong>vendeurs</strong>. Les clients peuvent commander librement sans compte.
      </div>
      <div class="form-group"><label>Nom complet</label><input id="rgName" placeholder="Jean Kouassi" /></div>
      <div class="form-group"><label>Téléphone</label><input id="rgPhone" placeholder="07 00 00 00 00" type="tel" /></div>
      <div class="form-group"><label>Identifiant</label><input id="rgId" placeholder="Choisissez un identifiant" /></div>
      <div class="form-group"><label>Mot de passe</label><input id="rgPwd" type="password" placeholder="••••••••" autocomplete="new-password" /></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="doRegister()">Créer mon compte vendeur</button></div>`;
  }
}
async function doLogin() {
  const id = document.getElementById("lgId").value.trim(), pwd = document.getElementById("lgPwd").value;
  if (!id || !pwd) return toast("Remplissez tous les champs", "red");
  const r = await fetch("/api/login", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, pwd }) });
  if (!r.ok) return toast("Identifiants invalides", "red");
  const u = await r.json();
  if (u.role === "vendeur" && !u.approved) return toast("Compte en attente de validation admin", "red");
  USER = { ...u, id };
  localStorage.setItem("user", JSON.stringify(USER));
  closeModal(); toast(`Bienvenue ${u.name} !`, "green");
  if (u.role === "admin") showAdmin();
  else if (u.role === "vendeur") showVendeur();
}
async function doRegister() {
  const data = {
    id: document.getElementById("rgId").value.trim(),
    pwd: document.getElementById("rgPwd").value,
    name: document.getElementById("rgName").value.trim(),
    phone: document.getElementById("rgPhone").value.trim(),
    role: "vendeur",
  };
  if (!data.id || !data.pwd || !data.name) return toast("Remplissez tous les champs", "red");
  const r = await fetch("/api/register", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
  const j = await r.json();
  if (!r.ok) return toast(j.error || "Erreur", "red");
  toast(data.role === "vendeur" ? "Inscription envoyée — en attente de validation" : "Compte créé ! Connectez-vous.", "green");
  accTab(document.querySelectorAll(".tabs button")[0], "login");
}
function logout() { USER = null; localStorage.removeItem("user"); closeModal(); toast("Déconnecté"); showHome(); }

// ============ VENDEUR ============
function showVendeur() {
  if (!USER || USER.role !== "vendeur") return toast("Réservé aux vendeurs", "red");
  showPage("page-vendeur");
  const sel = document.getElementById("catSelect");
  if (sel) sel.innerHTML = CATEGORIES.map(([s,_,n]) => `<option value="${s}">${n}</option>`).join("");
  const banner = document.getElementById("subBanner");
  if (banner) {
    banner.innerHTML = USER.active
      ? `<div class="sub-active">✅ Compte actif — vos articles sont visibles sur la plateforme.</div>`
      : `<div class="sub-inactive">⏳ Compte en attente de validation par l'administrateur.</div>`;
  }
  const form = document.getElementById("productForm");
  if (form) {
    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) {
      submitBtn.disabled = !USER.active;
      submitBtn.title = USER.active ? "" : "En attente de validation par l'admin";
      submitBtn.style.opacity = USER.active ? "" : "0.5";
    }
  }
  loadMyProducts();
}

// ============ IMAGE PREVIEW ============
function previewImg(input) {
  const wrap = input.closest(".form-group").querySelector(".img-preview-wrap");
  const imgEl = input.closest(".form-group").querySelector(".img-preview");
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = ev => {
    imgEl.src = ev.target.result;
    wrap.style.display = "flex";
  };
  reader.readAsDataURL(input.files[0]);
}

function removeImgPreview(btn) {
  const group = btn.closest(".form-group");
  const input = group.querySelector(".img-file-input");
  const wrap = group.querySelector(".img-preview-wrap");
  const imgEl = group.querySelector(".img-preview");
  input.value = "";
  imgEl.src = "";
  wrap.style.display = "none";
}

function togglePaidHint(sel) { switchFormForCat(sel); }

function switchFormForCat(sel) {
  const form = sel.closest("form");
  if (!form) return;
  const isPaid = PAID_CATS.has(sel.value);
  const artSection = form.querySelector(".pf-article");
  const jobSection = form.querySelector(".pf-job");
  if (artSection) artSection.style.display = isPaid ? "none" : "";
  if (jobSection) jobSection.style.display = isPaid ? "" : "none";
}

// ============ IMAGE COMPRESSION ============
async function compressImage(file, maxW = 900, quality = 0.78) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const image = new Image();
      image.onload = () => {
        let w = image.width, h = image.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(image, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ============ PRODUCT FORM SUBMIT ============
document.addEventListener("submit", async e => {
  if (e.target.id !== "productForm" && e.target.id !== "adminProductForm") return;
  e.preventDefault();
  const f = e.target;
  const submitBtn = f.querySelector("button[type=submit]");
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Publication en cours…"; }

  const file = f.image && f.image.files[0];
  let img = null;
  if (file) img = await compressImage(file);

  const cat = f.category.value;
  const isPaid = PAID_CATS.has(cat);

  // Pour les offres emploi/concours, enrichir la description avec les champs spécifiques
  let desc = f.description ? f.description.value : "";
  if (isPaid) {
    const employer = f.employer ? f.employer.value : "";
    const loc      = f.jobLocation ? f.jobLocation.value : "";
    const ctype    = f.contractType ? f.contractType.value : "";
    const salary   = f.salary ? f.salary.value : "";
    const deadline = f.deadline ? f.deadline.value : "";
    const extras = [
      employer  ? `🏢 Entreprise : ${employer}` : "",
      loc       ? `📍 Lieu : ${loc}` : "",
      ctype     ? `📄 Contrat : ${ctype}` : "",
      salary    ? `💰 Salaire : ${salary}` : "",
      deadline  ? `⏰ Date limite : ${new Date(deadline).toLocaleDateString("fr-FR")}` : "",
    ].filter(Boolean).join("\n");
    desc = (extras ? extras + "\n\n" : "") + desc;
  }

  // Récupérer price/stock/whatsapp selon la section ACTIVE uniquement
  const activeSection = isPaid ? f.querySelector(".pf-job") : f.querySelector(".pf-article");
  const price = Number(activeSection?.querySelector("input[name='price']")?.value || 0);
  const stock = isPaid ? 9999 : (Number(activeSection?.querySelector("input[name='stock']")?.value) || 0);
  const whatsapp = activeSection?.querySelector("input[name='whatsapp']")?.value || "";
  const oldPrice = isPaid ? null : (Number(f.querySelector(".pf-article input[name='oldPrice']")?.value) || null);
  const personalPhone = isPaid ? "" : (f.querySelector(".pf-article input[name='personalPhone']")?.value || "");

  const body = {
    ownerId: USER.id, ownerName: USER.name, ownerRole: USER.role,
    title: f.title.value, category: cat,
    price, oldPrice, stock, whatsapp, personalPhone,
    image: img, description: desc,
  };

  try {
    const r = await fetch("/api/products", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    if (r.ok) {
      f.reset();
      f.querySelectorAll(".img-preview-wrap").forEach(w => { w.style.display = "none"; });
      f.querySelectorAll(".img-preview").forEach(i => { i.src = ""; });
      f.querySelectorAll(".pf-job").forEach(s => { s.style.display = "none"; });
      f.querySelectorAll(".pf-article").forEach(s => { s.style.display = ""; });
      if (USER.role === "admin") { toast("✓ Publié immédiatement !", "green"); adminTab("products"); }
      else { toast("Article envoyé — en attente de validation", "green"); loadMyProducts(); }
    } else { toast("Erreur lors de la publication", "red"); }
  } catch { toast("Erreur réseau", "red"); }
  finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || "Publier l'article"; }
  }
});

async function loadMyProducts() {
  const el = document.getElementById("myProducts");
  if (!el) return;
  const mine = await (await fetch("/api/products/mine/" + encodeURIComponent(USER.id))).json();
  if (!mine.length) { el.innerHTML = `<div class="empty-state"><div class="empty-ico">📦</div><p>Aucun article publié.</p></div>`; return; }
  el.innerHTML = mine.map(p => {
    const badge = p.blocked
      ? `<span class="status-badge status-block">🚫 Bloqué</span>`
      : p.approved
        ? `<span class="status-badge status-ok">✓ Validé</span>`
        : `<span class="status-badge status-wait">⏳ En attente</span>`;
    return `<div class="my-product-item">
      <div><strong>${p.title}</strong><br><small>${fmt(p.price)} · Stock: ${p.stock}/${p.stockInit||p.stock}</small></div>
      ${badge}
    </div>`;
  }).join("");
}

// ============ ADMIN ============
function showAdmin() {
  if (!USER || USER.role !== "admin") return toast("Réservé à l'administrateur", "red");
  showPage("page-admin");
  adminTab("vendors");
}

function productFormFields() {
  const cats = CATEGORIES.map(([s, _, n]) => `<option value="${s}">${n}</option>`).join("");
  return `
    <div class="form-row">
      <div class="form-group"><label>Titre</label><input name="title" required placeholder="Ex: iPhone 14 Pro  /  Comptable Sénior" /></div>
      <div class="form-group"><label>Catégorie</label><select name="category" required onchange="switchFormForCat(this)">${cats}</select></div>
    </div>

    <!-- SECTION : Article standard -->
    <div class="pf-section pf-article">
      <div class="form-row">
        <div class="form-group"><label>Prix de vente (FCFA)</label><input name="price" type="number" placeholder="0" /></div>
        <div class="form-group"><label>Ancien prix (optionnel)</label><input name="oldPrice" type="number" placeholder="0" /></div>
        <div class="form-group"><label>Stock disponible</label><input name="stock" type="number" placeholder="1" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>N° WhatsApp vendeur</label><input name="whatsapp" placeholder="2250700000000" /></div>
        <div class="form-group"><label>N° SMS commande</label><input name="personalPhone" placeholder="2250700000000" /></div>
      </div>
    </div>

    <!-- SECTION : Offre Emploi / Concours -->
    <div class="pf-section pf-job" style="display:none">
      <div class="paid-hint">
        <span>🔒 Offre payante — le client paie pour accéder aux détails complets. Remplissez tous les champs ci-dessous.</span>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Entreprise / Organisme *</label><input name="employer" placeholder="Ex: PME Abengourou / Ministère de la Santé" /></div>
        <div class="form-group"><label>Lieu / Ville *</label><input name="jobLocation" placeholder="Ex: Abengourou, Côte d'Ivoire" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Type de contrat</label>
          <select name="contractType">
            <option value="">— Sélectionner —</option>
            <option>CDI</option><option>CDD</option><option>Stage</option>
            <option>Freelance</option><option>Concours d'entrée</option><option>Autres</option>
          </select>
        </div>
        <div class="form-group"><label>Salaire / Dotation</label><input name="salary" placeholder="Ex: 200 000 FCFA/mois" /></div>
        <div class="form-group"><label>Date limite (optionnel)</label><input name="deadline" type="date" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Prix d'accès aux détails (FCFA) *</label><input name="price" type="number" placeholder="Ex: 500" /></div>
        <div class="form-group"><label>N° WhatsApp contact</label><input name="whatsapp" placeholder="2250700000000" /></div>
      </div>
      <!-- champs cachés non utilisés pour emploi -->
      <input type="hidden" name="oldPrice" value="" />
      <input type="hidden" name="stock" value="9999" />
      <input type="hidden" name="personalPhone" value="" />
    </div>

    <div class="form-group" style="margin-top:8px">
      <label>📷 Image (JPG, PNG, WebP, HEIC…)</label>
      <input name="image" type="file" accept="image/*,image/heic,image/heif" class="img-file-input" onchange="previewImg(this)" />
      <div class="img-preview-wrap" style="display:none">
        <img class="img-preview" alt="Aperçu" />
        <button type="button" class="img-preview-remove" onclick="removeImgPreview(this)">✕ Supprimer</button>
      </div>
    </div>
    <div class="form-group">
      <label>Description / Détails complets <small style="color:var(--muted)">(confidentiel pour emploi/concours)</small></label>
      <textarea name="description" rows="4" placeholder="Décrivez l'offre — profil requis, missions, conditions, comment postuler…"></textarea>
    </div>`;
}

async function adminTab(which) {
  document.querySelectorAll(".admin-tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === which));
  const c = document.getElementById("adminContent");
  c.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div></div>`;

  if (which === "vendors") {
    const list = await (await fetch("/api/vendors")).json();
    const active = list.filter(v => v.active).length;
    const pending = list.filter(v => !v.approved).length;
    c.innerHTML = `
      <div class="admin-stats">
        <div class="stat-card"><div class="stat-num">${list.length}</div><div class="stat-lbl">Total vendeurs</div></div>
        <div class="stat-card green"><div class="stat-num">${active}</div><div class="stat-lbl">Actifs</div></div>
        <div class="stat-card dark"><div class="stat-num">${pending}</div><div class="stat-lbl">En attente</div></div>
      </div>
      ${list.length === 0
        ? `<div class="empty-state"><div class="empty-ico">👥</div><p>Aucun vendeur inscrit.</p></div>`
        : list.map(v => {
            const statusBadge = v.active
              ? `<span class="status-badge status-ok">✅ Actif</span>`
              : `<span class="status-badge status-wait">⏳ En attente</span>`;
            return `<div class="admin-row">
              <div class="admin-row-head">
                <div>
                  <div class="admin-row-name">${v.name}</div>
                  <div class="admin-row-sub">ID: ${v.id} · 📞 ${v.phone || "—"}</div>
                </div>
                ${statusBadge}
              </div>
              <div class="admin-row-actions">
                ${!v.approved ? `<button class="btn btn-secondary btn-sm" onclick="approveVendor('${v.id}')">✓ Approuver</button>` : ""}
                <button class="btn btn-ghost btn-sm" onclick="deleteVendor('${v.id}')">🗑 Supprimer</button>
              </div>
            </div>`;
          }).join("")}`;

  } else if (which === "products") {
    const all = await (await fetch("/api/products/all")).json();
    const pending = all.filter(p => !p.approved && !p.blocked).length;
    c.innerHTML = `
      <div class="admin-stats">
        <div class="stat-card"><div class="stat-num">${all.length}</div><div class="stat-lbl">Total articles</div></div>
        <div class="stat-card green"><div class="stat-num">${all.filter(p=>p.approved&&!p.blocked).length}</div><div class="stat-lbl">Approuvés</div></div>
        <div class="stat-card dark"><div class="stat-num">${pending}</div><div class="stat-lbl">En attente</div></div>
      </div>
      ${all.length === 0
        ? `<div class="empty-state"><div class="empty-ico">📦</div><p>Aucun article.</p></div>`
        : all.map(p => {
            const st = p.blocked
              ? `<span class="status-badge status-block">🚫 Bloqué</span>`
              : p.approved
                ? `<span class="status-badge status-ok">✓ Validé</span>`
                : `<span class="status-badge status-wait">⏳ En attente</span>`;
            const img = p.image ? `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0" />` : `<div style="width:44px;height:44px;background:#f5f5f5;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px">🛍️</div>`;
            return `<div class="admin-row">
              <div class="admin-row-head">
                <div style="display:flex;gap:10px;align-items:center">
                  ${img}
                  <div>
                    <div class="admin-row-name">${p.title}</div>
                    <div class="admin-row-sub">${fmt(p.price)} · Stock: ${p.stock} · Par: ${p.ownerName} (${p.ownerRole})</div>
                  </div>
                </div>
                ${st}
              </div>
              <div class="admin-row-actions">
                ${!p.approved ? `<button class="btn btn-secondary btn-sm" onclick="approveProduct(${p.id})">✓ Approuver</button>` : ""}
                ${!p.blocked ? `<button class="btn btn-ghost btn-sm" onclick="blockProduct(${p.id})">🚫 Bloquer</button>` : `<button class="btn btn-secondary btn-sm" onclick="approveProduct(${p.id})">↩ Débloquer</button>`}
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Supprimer</button>
              </div>
            </div>`;
          }).join("")}`;

  } else if (which === "addproduct") {
    c.innerHTML = `
      <div style="background:var(--primary-light);border-left:4px solid var(--primary);border-radius:0 var(--radius) var(--radius) 0;padding:10px 14px;font-size:13px;margin-bottom:16px">
        ℹ️ Les articles ajoutés depuis ce tableau de bord sont <strong>publiés immédiatement</strong> (compte administrateur).
      </div>
      <form id="adminProductForm" class="product-form">
        ${productFormFields()}
        <button type="submit" data-label="Publier l'article" class="btn btn-primary btn-lg" style="margin-top:4px">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Publier l'article
        </button>
      </form>`;

  } else if (which === "orders") {
    const orders = await (await fetch("/api/orders")).json();
    const rev = [...orders].reverse();
    const total = orders.reduce((s, o) => s + (o.total || 0), 0);
    c.innerHTML = `
      <div class="admin-stats">
        <div class="stat-card"><div class="stat-num">${orders.length}</div><div class="stat-lbl">Total commandes</div></div>
        <div class="stat-card green"><div class="stat-num">${fmt(total)}</div><div class="stat-lbl">Valeur totale</div></div>
      </div>
      ${rev.length === 0
        ? `<div class="empty-state"><div class="empty-ico">📋</div><p>Aucune commande reçue.</p></div>`
        : rev.map(o => `
          <div class="order-card">
            <div class="order-head">
              <div>
                <span class="order-num">${o.orderNo || o.id}</span>
                <span class="delivery-badge ${o.delivery==="agence"?"delivery-agence":"delivery-home"}" style="margin-left:8px">${o.delivery==="agence"?"🏢 Retrait":"🚚 Livraison"}</span>
              </div>
              <div class="order-meta">${new Date(o.createdAt).toLocaleString("fr-FR")}</div>
            </div>
            <div class="order-meta" style="margin-top:6px">👤 ${o.name} · 📞 ${o.phone}</div>
            <div class="order-items">📦 ${(o.items||[]).map(i => `${i.qty}× ${i.name}`).join(" · ")}</div>
            <div class="order-total">💰 Total : ${fmt(o.total)} · 💳 ${o.payMethod||"—"}</div>
          </div>`).join("")}`;

  } else if (which === "settings") {
    const s = await (await fetch("/api/settings")).json();
    const sm = s.sms || {};
    c.innerHTML = `
      <div class="sms-settings-wrap">
        <!-- SECTION 1: Entreprise -->
        <div class="settings-section">
          <div class="settings-section-title">🏢 Informations de l'entreprise</div>
          <div class="form-row">
            <div class="form-group">
              <label>Nom de l'entreprise</label>
              <input id="setCompany" value="${s.companyName || ""}" placeholder="ABENGOUROU-MARKET" />
              <div class="form-hint">Apparaît dans l'en-tête des SMS envoyés aux vendeurs.</div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: API SMS -->
        <div class="settings-section">
          <div class="settings-section-title">📱 Configuration API SMS</div>

          <!-- Toggle -->
          <div class="sms-toggle-row">
            <label class="toggle-switch">
              <input type="checkbox" id="smsEnabled" ${sm.enabled ? "checked" : ""} onchange="toggleSmsFields()" />
              <span class="toggle-slider"></span>
            </label>
            <div class="toggle-label">
              Activer l'envoi de SMS
              <small>Notifier automatiquement les vendeurs lors d'une nouvelle commande</small>
            </div>
          </div>

          <div id="smsFieldsWrap" style="${sm.enabled ? "" : "opacity:.45;pointer-events:none"}">
            <!-- Placeholders help -->
            <div class="sms-placeholder-help">
              <h5>📌 Placeholders disponibles dans l'URL et le corps :</h5>
              <div class="placeholder-tags">
                <span class="ph-tag">{to}</span>
                <span class="ph-tag">{message}</span>
                <span class="ph-tag">{from}</span>
              </div>
              <div style="font-size:12px;color:#0277BD;margin-top:8px">
                <strong>{to}</strong> = numéro du destinataire &nbsp;·&nbsp; <strong>{message}</strong> = texte du SMS &nbsp;·&nbsp; <strong>{from}</strong> = expéditeur / nom entreprise
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Expéditeur (Sender ID)</label>
                <input id="smsSender" value="${sm.sender || ""}" placeholder="ABGMARKET" />
                <div class="form-hint">Nom affiché comme expéditeur du SMS</div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:12px">
              <label>URL de l'API SMS</label>
              <input id="smsUrl" value="${(sm.url || "").replace(/"/g, "&quot;")}" placeholder="https://api.votre-sms.com/send?to={to}&msg={message}" />
              <div class="form-hint">Exemple Infobip : https://api.infobip.com/sms/2/text/single</div>
            </div>

            <div class="form-group" style="margin-bottom:12px">
              <label>Clé API (Authorization Bearer)</label>
              <input id="smsApiKey" type="password" value="${sm.apiKey || ""}" placeholder="VOTRE_CLE_API_SMS" />
              <div class="form-hint">Ajoutée automatiquement en en-tête : Authorization: Bearer {clé}</div>
            </div>
          </div>
        </div>

        <!-- SECTION 3: Save + Test -->
        <div class="settings-section">
          <div class="settings-section-title">💾 Enregistrer & Tester</div>
          <button class="btn btn-primary" style="min-width:200px" onclick="saveSettings()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Enregistrer les paramètres
          </button>
          <hr class="modal-divider" style="margin:16px 0" />
          <div class="sms-test-row">
            <div class="form-group">
              <label>Numéro de test (format international)</label>
              <input id="smsTestNum" placeholder="Ex : 2250700000000" type="tel" />
            </div>
            <button class="btn btn-secondary" onclick="testSMS()" style="height:42px;white-space:nowrap;align-self:flex-end">
              📤 Envoyer un SMS test
            </button>
          </div>
          <div id="settingsMsg"></div>
        </div>
      </div>`;
  }
}

function toggleSmsFields() {
  const enabled = document.getElementById("smsEnabled").checked;
  const wrap = document.getElementById("smsFieldsWrap");
  if (wrap) { wrap.style.opacity = enabled ? "1" : ".45"; wrap.style.pointerEvents = enabled ? "" : "none"; }
}

async function approveVendor(id) { await fetch("/api/vendors/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Compte vendeur approuvé ✓","green"); adminTab("vendors"); }
async function deleteVendor(id) { if(!confirm("Supprimer ce compte vendeur ?"))return; await fetch("/api/vendors/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Vendeur supprimé",""); adminTab("vendors"); }
async function approveProduct(id) { await fetch("/api/products/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Article validé ✓","green"); adminTab("products"); }
async function blockProduct(id) { await fetch("/api/products/block",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Article bloqué"); adminTab("products"); }
async function deleteProduct(id) { if(!confirm("Supprimer définitivement cet article ?"))return; await fetch("/api/products/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Article supprimé"); adminTab("products"); }

async function saveSettings() {
  const body = {
    companyName: document.getElementById("setCompany").value,
    sms: {
      enabled: document.getElementById("smsEnabled").checked,
      url: document.getElementById("smsUrl").value,
      apiKey: document.getElementById("smsApiKey").value,
      sender: document.getElementById("smsSender").value,
    },
  };
  await fetch("/api/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
  const msg = document.getElementById("settingsMsg");
  if (msg) { msg.className = "sms-result ok"; msg.textContent = "✓ Paramètres enregistrés avec succès."; }
  toast("Paramètres enregistrés ✓","green");
}

async function testSMS() {
  const to = document.getElementById("smsTestNum").value.trim();
  if (!to) return toast("Entrez un numéro de test","red");
  const btn = event.target; btn.disabled = true; btn.textContent = "Envoi en cours…";
  const r = await (await fetch("/api/settings/sms-test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to})})).json();
  btn.disabled = false; btn.textContent = "📤 Envoyer un SMS test";
  const msg = document.getElementById("settingsMsg");
  if (msg) {
    msg.className = r.ok ? "sms-result ok" : "sms-result err";
    msg.textContent = r.ok ? `✓ SMS envoyé avec succès (statut HTTP ${r.status || "200"})` : `✗ Échec : ${r.error || r.body || "Configuration incomplète — vérifiez l'URL et les en-têtes."}`;
  }
}

// ============ UTILS ============
function modalHTML(html) { document.getElementById("modalBody").innerHTML = html; document.getElementById("modal").classList.add("show"); }
function closeModal() { document.getElementById("modal").classList.remove("show"); }
function toast(m, type) {
  const t = document.createElement("div");
  t.className = "toast" + (type==="green"?" green":type==="red"?" red":"");
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ============ MENU BUTTONS ============
function setupMenuButtons() {
  const openMenu = () => {
    const p = document.getElementById("mobileSidebarPanel");
    renderSidebar(p);
    document.getElementById("mobileSidebar").classList.add("show");
  };
  const b1 = document.getElementById("menuBtn");
  const b2 = document.getElementById("menuBtn2");
  if (b1) b1.onclick = openMenu;
  if (b2) b2.onclick = openMenu;
}

// ============ INIT ============
document.getElementById("yr").textContent = new Date().getFullYear();
renderHome();
updateCartCount();
setupMenuButtons();
