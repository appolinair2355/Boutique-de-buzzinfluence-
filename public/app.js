/* ABENGOUROU-MARKET — frontend */

// ============ DATA (12 sections du cahier des charges) ============
const CATEGORIES = [
  ["immobilier","🏠","Immobilier"],
  ["vehicules","🚗","Véhicules et motos"],
  ["telephones","📱","Téléphones et accessoires"],
  ["informatique","💻","Informatique"],
  ["mode","👕","Mode et beauté"],
  ["supermarche","🛒","Supermarché"],
  ["restaurants","🍽️","Restaurants et livraison"],
  ["agriculture","🌾","Agriculture et élevage"],
  ["services","👨‍🔧","Services et artisans"],
  ["scolaires","🎓","Scolaires"],
  ["sante","🏥","Santé et pharmacies"],
  ["evenements","🎉","Événements et loisirs"],
  ["annonces","📢","Petites annonces"],
  ["actualites","📰","Actualités Abengourou"],
  ["concours-ci","📚","Actualités Concours-CI"],
  ["emploi","💼","Offres d'emploi"],
  ["transport","🚕","Transport et taxi"],
];

const SHORTCUTS = [
  ["📚","Concours CI"],["💼","Emploi"],["🏠","Immobilier"],["🚕","Taxi"],
  ["🍽️","Livraison"],["📢","Annonces"],["📰","Actualités"],["🎉","Événements"],
];

const FLASH = [
  {id:1,name:"Téléphone Tecno Spark 20",price:95000,oldPrice:130000,stock:12,stockInit:50,emoji:"📱"},
  {id:2,name:"Ordinateur HP 15 - 8Go RAM",price:280000,oldPrice:350000,stock:5,stockInit:20,emoji:"💻"},
  {id:3,name:"Moto Apsonic AP150",price:650000,oldPrice:750000,stock:3,stockInit:10,emoji:"🏍️"},
  {id:4,name:"Robe Wax Premium",price:12000,oldPrice:18000,stock:28,stockInit:60,emoji:"👗"},
  {id:5,name:"Sac de riz 25kg",price:18500,oldPrice:21000,stock:45,stockInit:100,emoji:"🌾"},
  {id:6,name:"Casque Bluetooth JBL",price:22000,oldPrice:30000,stock:8,stockInit:25,emoji:"🎧"},
];

const CONCOURS = ["INSFS","INFAS","ENA","Police","Gendarmerie","Douanes","Eaux et Forêts","Fonction Publique"];
const JOBS = [
  {t:"Comptable",c:"PME Abengourou"},{t:"Chauffeur",c:"Transport CI"},
  {t:"Commercial",c:"Distrib+"},{t:"Infirmier",c:"Clinique Espoir"},
  {t:"Enseignant",c:"Collège privé"},{t:"Agent de sécurité",c:"SecuriPro CI"},
];
const REAL = [
  {t:"Terrain 500m²",p:"8 000 000 FCFA",l:"Aniassué",e:"🌳"},
  {t:"Villa 4 pièces",p:"45 000 000 FCFA",l:"Résidentiel",e:"🏡"},
  {t:"Studio meublé",p:"75 000 FCFA/mois",l:"Centre-ville",e:"🛏️"},
  {t:"Magasin commercial",p:"200 000 FCFA/mois",l:"Grand marché",e:"🏬"},
];
const TRANSPORT = [
  {n:"Réservation Taxi",e:"🚖"},{n:"Moto Taxi",e:"🛵"},{n:"Livraison Colis",e:"📦"},
];
const RESTO = [
  {n:"Chez Tantie Adjoua",s:"Attiéké poisson",p:"1 500 FCFA",e:"🐟"},
  {n:"Maquis Le Baoulé",s:"Poulet braisé",p:"3 500 FCFA",e:"🍗"},
  {n:"Fast-food Le Délice",s:"Burger + frites",p:"2 500 FCFA",e:"🍔"},
  {n:"Restaurant L'Indénié",s:"Menu du jour",p:"2 000 FCFA",e:"🍛"},
];
const NEWS = [
  {c:"Politique",t:"Le maire annonce de nouveaux projets pour 2026"},
  {c:"Économie",t:"Hausse du prix du cacao : les planteurs satisfaits"},
  {c:"Éducation",t:"Rentrée scolaire : 12 nouvelles salles inaugurées"},
  {c:"Culture",t:"Festival des arts d'Abengourou : programme dévoilé"},
  {c:"Sport",t:"L'AS Indénié remporte le tournoi régional"},
  {c:"Société",t:"Campagne de salubrité : la ville se mobilise"},
];

const ADMIN_PHONE = "22901679240076";
const fmt = n => Number(n).toLocaleString("fr-FR") + " FCFA";

// ============ STATE ============
let CART = JSON.parse(localStorage.getItem("cart") || "[]");
let USER = JSON.parse(localStorage.getItem("user") || "null");
const saveCart = () => { localStorage.setItem("cart", JSON.stringify(CART)); updateCartCount(); };
const updateCartCount = () => document.getElementById("cartCount").textContent = CART.reduce((s,i)=>s+i.qty,0);

// ============ RENDER ============
function renderSidebar(target) {
  target.innerHTML = `<div class="head">NOS CATÉGORIES</div><ul>${
    CATEGORIES.map(([s,i,n]) => `<li><a href="#" onclick="alert('Catégorie : ${n}');return false;">${i} ${n}</a></li>`).join("")
  }</ul>`;
}

function renderHome() {
  renderSidebar(document.getElementById("desktopSidebar"));
  document.getElementById("shortcuts").innerHTML = SHORTCUTS.map(([i,n]) =>
    `<a href="#" class="shortcut" onclick="return false"><span class="ico">${i}</span><span>${n}</span></a>`
  ).join("");

  document.getElementById("flashGrid").innerHTML = FLASH.map(p => {
    const red = Math.round(((p.oldPrice - p.price)/p.oldPrice)*100);
    const pct = Math.round((p.stock/p.stockInit)*100);
    return `<article class="card">
      <div class="img"><span>${p.emoji}</span><span class="badge">-${red}%</span></div>
      <div class="body">
        <h3>${p.name}</h3>
        <div class="price">${fmt(p.price)}</div>
        <div class="old">${fmt(p.oldPrice)}</div>
        <div class="stockbar"><span style="width:${pct}%"></span></div>
        <div class="stocklabel">${p.stock} restants (${pct}%)</div>
        <button class="btn btn-primary" onclick='addCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Acheter</button>
      </div>
    </article>`;
  }).join("");

  document.getElementById("concoursGrid").innerHTML = CONCOURS.map(n =>
    `<div class="tile"><h4>${n}</h4><span class="tag">Inscription ouverte</span></div>`
  ).join("");

  document.getElementById("jobsGrid").innerHTML = JOBS.map(j =>
    `<div class="tile">
      <h4>${j.t}</h4><p>${j.c} · Abengourou</p>
      <button class="btn btn-primary" style="margin-top:8px" onclick="alert('Postulez : envoyez votre CV à contact@abengourou-market.com')">Postuler</button>
    </div>`
  ).join("");

  document.getElementById("realGrid").innerHTML = REAL.map(r =>
    `<div class="card">
      <div class="img" style="background:#ECFDF5">${r.e}</div>
      <div class="body">
        <h3>${r.t}</h3><p style="font-size:12px;color:var(--muted)">📍 ${r.l}</p>
        <div class="price" style="color:var(--primary);margin-top:4px">${r.p}</div>
        <button class="btn btn-secondary" onclick="window.open('https://wa.me/${ADMIN_PHONE}?text=' + encodeURIComponent('Bonjour, je suis intéressé par : ${r.t} (${r.p})'))">Contacter le vendeur</button>
      </div>
    </div>`
  ).join("");

  document.getElementById("transportGrid").innerHTML = TRANSPORT.map(t =>
    `<div class="tile" style="text-align:center">
      <div style="font-size:42px">${t.e}</div>
      <h4>${t.n}</h4>
      <button class="btn btn-primary" style="margin-top:8px" onclick="addCart({id:'tr-${t.n}',name:'${t.n}',price:1000,emoji:'${t.e}'})">Commander</button>
    </div>`
  ).join("");

  document.getElementById("restoGrid").innerHTML = RESTO.map(r =>
    `<div class="card">
      <div class="img" style="background:#FFF7ED">${r.e}</div>
      <div class="body">
        <h3>${r.n}</h3><p style="font-size:12px;color:var(--muted)">${r.s}</p>
        <div class="price" style="color:var(--primary);margin-top:4px">${r.p}</div>
        <button class="btn btn-primary" onclick='addCart({id:"r-${r.n}",name:"${r.n} - ${r.s}",price:${parseInt(r.p)||2000},emoji:"${r.e}"})'>Commander maintenant</button>
      </div>
    </div>`
  ).join("");

  document.getElementById("newsList").innerHTML = NEWS.map(n =>
    `<li><span class="cat">${n.c}</span><div><p style="font-size:14px;font-weight:500">${n.t}</p><p style="font-size:11px;color:var(--muted)">Aujourd'hui</p></div></li>`
  ).join("");

  loadShop();
}

async function loadShop() {
  const grid = document.getElementById("shopGrid");
  if (!grid) return;
  let products = [];
  try { products = await (await fetch("/api/products")).json(); } catch {}
  if (!products.length) { grid.innerHTML = `<p style="color:var(--muted)">Aucun article en ligne pour le moment.</p>`; return; }
  grid.innerHTML = products.map(p => {
    const wa = (p.whatsapp || "").replace(/\D/g, "");
    const img = p.image ? `<img src="${p.image}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover" />` : `🛍️`;
    return `<div class="card">
      <div class="img" style="background:#F1F5F9">${img}</div>
      <div class="body">
        <h3>${p.title}</h3>
        <p style="font-size:12px;color:var(--muted)">Par ${p.ownerName||""}</p>
        <div class="price" style="color:var(--primary);margin-top:4px">${fmt(p.price)}</div>
        <div class="stocklabel">${p.stock} en stock</div>
        <button class="btn btn-primary" onclick='addCart({id:${p.id},name:${JSON.stringify(p.title)},price:${p.price},emoji:"🛍️"})'>Acheter</button>
        ${wa?`<button class="btn btn-secondary" onclick="window.open('https://wa.me/${wa}?text='+encodeURIComponent('Bonjour, je suis intéressé par : ${(p.title||"").replace(/'/g,"")}'))">WhatsApp</button>`:""}
      </div>
    </div>`;
  }).join("");
}

// ============ NAVIGATION ============
function showPage(id) {
  document.querySelectorAll(".page-view").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0,0);
}
function showHome() { showPage("page-home"); }
function showText(key) {
  const TEXTS = {
    apropos: { t:"À propos de nous", b:`ABENGOUROU-MARKET est une plateforme numérique conçue pour faciliter les échanges commerciaux, la diffusion d'informations et l'accès aux opportunités dans la ville d'Abengourou et partout en Côte d'Ivoire.

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
    conditions: { t:"Conditions d'utilisation", b:`En utilisant ABENGOUROU-MARKET, vous acceptez les présentes conditions d'utilisation.

Utilisation du service
Les utilisateurs s'engagent à fournir des informations exactes lors de leur inscription et de leurs publications.

Publications interdites
• Informations mensongères
• Contenus frauduleux
• Contenus diffamatoires ou injurieux
• Produits ou services interdits par la loi

Responsabilité
ABENGOUROU-MARKET agit comme intermédiaire entre les utilisateurs et ne peut être tenu responsable des transactions réalisées entre eux.

Suspension de compte
Tout compte ne respectant pas les présentes conditions pourra être suspendu ou supprimé sans préavis.

Modification des conditions
ABENGOUROU-MARKET se réserve le droit de modifier ces conditions à tout moment.` },
    conf: { t:"Politique de confidentialité", b:`ABENGOUROU-MARKET accorde une grande importance à la protection des données personnelles.

Données collectées
• Nom et prénom
• Adresse e-mail
• Numéro de téléphone
• Informations liées aux annonces publiées

Utilisation des données
• Créer et gérer votre compte
• Faciliter les échanges entre utilisateurs
• Améliorer nos services
• Garantir la sécurité de la plateforme

Protection
Nous mettons en œuvre des mesures de sécurité afin de protéger les données contre tout accès non autorisé.

Partage
Nous ne vendons ni ne louons les données personnelles à des tiers.

Vos droits
Vous pouvez demander la modification ou la suppression de vos données à tout moment.` },
    contact: { t:"Contact", b:`📍 Abengourou, Côte d'Ivoire
📞 Téléphone : +225 XX XX XX XX XX
📧 E-mail : contact@abengourou-market.com
🌐 Site web : www.abengourou-market.com

Service client
Du lundi au samedi · 08h00 à 18h00

Pour toute question, suggestion ou réclamation, contactez-nous.` },
    pub: { t:"Publicité", b:`Faites connaître votre activité à des milliers d'utilisateurs à Abengourou et dans toute la Côte d'Ivoire.

Contactez-nous pour les tarifs publicitaires :
📧 contact@abengourou-market.com
📞 +225 XX XX XX XX XX` },
  };
  const T = TEXTS[key];
  document.getElementById("textBody").innerHTML = `<h2>${T.t}</h2><div style="white-space:pre-line;margin-top:10px;font-size:14px;line-height:1.7">${T.b}</div>`;
  showPage("page-text");
}

// ============ CART & CHECKOUT ============
function addCart(p) {
  const ex = CART.find(i => i.id === p.id);
  if (ex) ex.qty++;
  else CART.push({ id:p.id, name:p.name, price:p.price, emoji:p.emoji||"📦", qty:1 });
  saveCart();
  toast("Ajouté au panier ✓");
}
function openCart() {
  if (CART.length === 0) {
    modalHTML(`<h2>🛒 Mon panier</h2><p style="margin:14px 0">Votre panier est vide.</p><button class="btn btn-ghost" onclick="closeModal()">Fermer</button>`);
    return;
  }
  const total = CART.reduce((s,i)=>s+i.price*i.qty,0);
  modalHTML(`
    <h2>🛒 Mon panier <button class="close-x" onclick="closeModal()">✕</button></h2>
    <div style="margin-top:10px">
      ${CART.map((i,idx)=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <div><strong>${i.emoji} ${i.name}</strong><br><small>${i.qty} × ${fmt(i.price)}</small></div>
          <button class="btn btn-ghost" onclick="removeItem(${idx})">×</button>
        </div>`).join("")}
      <p style="text-align:right;font-size:18px;font-weight:700;margin-top:10px">Total : ${fmt(total)}</p>
    </div>
    <div class="row"><button class="btn btn-ghost" onclick="closeModal()">Continuer</button><button class="btn btn-primary" onclick="startCheckout()">Commander / Payer</button></div>
  `);
}
function removeItem(i) { CART.splice(i,1); saveCart(); openCart(); }

function startCheckout() {
  modalHTML(`
    <h2>📦 Mode de livraison <button class="close-x" onclick="closeModal()">✕</button></h2>
    <p style="font-size:13px;color:var(--muted);margin:6px 0 12px">Choisissez comment vous souhaitez recevoir votre commande.</p>
    <div class="row" style="flex-direction:column">
      <button class="btn btn-primary" onclick="chooseDelivery('agence')">🏢 Je viendrai à l'agence</button>
      <button class="btn btn-secondary" onclick="chooseDelivery('domicile')">🚚 Livraison à domicile</button>
    </div>
  `);
}
let CHECKOUT = {};
function chooseDelivery(mode) {
  CHECKOUT.delivery = mode;
  if (mode === "agence") return askContactThenPay();
  // domicile → demander géolocalisation
  modalHTML(`<h2>📍 Activation de la localisation</h2><p style="margin:10px 0;font-size:14px">Nous avons besoin de votre localisation pour la livraison à domicile.</p><div class="row"><button class="btn btn-ghost" onclick="startCheckout()">Retour</button><button class="btn btn-primary" onclick="getLocation()">Activer la localisation</button></div>`);
}
function getLocation() {
  if (!navigator.geolocation) { CHECKOUT.location = "Non disponible"; return askContactThenPay(); }
  modalHTML(`<h2>📍 Localisation…</h2><p style="margin:10px 0">Récupération en cours…</p>`);
  navigator.geolocation.getCurrentPosition(
    pos => { CHECKOUT.location = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`; CHECKOUT.mapsUrl = `https://www.google.com/maps?q=${CHECKOUT.location}`; askContactThenPay(); },
    () => { CHECKOUT.location = "Refusée — adresse manuelle"; askContactThenPay(); }
  );
}
function askContactThenPay() {
  modalHTML(`
    <h2>📝 Vos coordonnées <button class="close-x" onclick="closeModal()">✕</button></h2>
    <label>Nom complet</label><input id="coName" />
    <label>Téléphone</label><input id="coPhone" />
    <label>Adresse (quartier, repère)</label><input id="coAddr" />
    <div class="row"><button class="btn btn-primary" onclick="showPayment()">Continuer vers le paiement →</button></div>
  `);
}
function showPayment() {
  CHECKOUT.name = document.getElementById("coName").value;
  CHECKOUT.phone = document.getElementById("coPhone").value;
  CHECKOUT.address = document.getElementById("coAddr").value;
  if (!CHECKOUT.name || !CHECKOUT.phone) return toast("Veuillez remplir nom et téléphone");
  modalHTML(`
    <h2>💳 Mode de paiement <button class="close-x" onclick="closeModal()">✕</button></h2>
    <p style="font-size:13px;color:var(--muted);margin:6px 0">Choisissez votre opérateur mobile money.</p>
    <div class="pay-grid">
      <div class="pay-opt" onclick="selectPay(this,'Wave')"><div class="logo wave">Wave</div><div class="nm">Wave</div></div>
      <div class="pay-opt" onclick="selectPay(this,'Orange Money')"><div class="logo orange">OM</div><div class="nm">Orange Money</div></div>
      <div class="pay-opt" onclick="selectPay(this,'MTN MoMo')"><div class="logo mtn">MTN</div><div class="nm">MTN MoMo</div></div>
      <div class="pay-opt" onclick="selectPay(this,'Moov Money')"><div class="logo moov">Moov</div><div class="nm">Moov Money</div></div>
    </div>
    <label style="margin-top:14px">Numéro mobile money</label>
    <input id="payNum" placeholder="Ex : 0700000000" />
    <div class="row"><button class="btn btn-primary" onclick="finalizeOrder()">Payer maintenant</button></div>
  `);
}
function selectPay(el, name) {
  document.querySelectorAll(".pay-opt").forEach(o => o.classList.remove("sel"));
  el.classList.add("sel");
  CHECKOUT.payMethod = name;
}
async function finalizeOrder() {
  if (!CHECKOUT.payMethod) return toast("Choisissez un mode de paiement");
  CHECKOUT.payNum = document.getElementById("payNum").value;
  if (!CHECKOUT.payNum) return toast("Entrez votre numéro");
  const total = CART.reduce((s,i)=>s+i.price*i.qty,0);
  const order = { ...CHECKOUT, items: CART, total };
  try { await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(order)}); } catch{}
  // WhatsApp admin
  const msg = `🛒 *Nouvelle commande ABENGOUROU-MARKET*%0A👤 ${order.name} (${order.phone})%0A📍 ${order.delivery==='domicile' ? 'Livraison : '+order.address+(order.mapsUrl?' '+order.mapsUrl:'') : "Retrait à l'agence"}%0A📦 Articles :%0A${order.items.map(i=>`• ${i.qty}× ${i.name} = ${fmt(i.price*i.qty)}`).join("%0A")}%0A💰 Total : ${fmt(total)}%0A💳 Paiement : ${order.payMethod} (${order.payNum})`;
  window.open(`https://wa.me/${ADMIN_PHONE}?text=${msg}`, "_blank");
  CART = []; saveCart(); CHECKOUT = {};
  modalHTML(`<h2 style="color:var(--secondary)">✅ Commande confirmée</h2><p style="margin:14px 0">Votre commande a été envoyée. Vous recevrez un appel pour la confirmation.</p><button class="btn btn-primary" onclick="closeModal();showHome()">Retour à l'accueil</button>`);
}

// ============ ACCOUNT ============
function openAccount() {
  if (USER) {
    const links = USER.role === "admin" ? `<button class="btn btn-primary" onclick="closeModal();showAdmin()">Tableau de bord Admin</button>` :
                  USER.role === "vendeur" ? `<button class="btn btn-primary" onclick="closeModal();showVendeur()">Mon espace vendeur</button>` : "";
    modalHTML(`<h2>👤 Bonjour ${USER.name} <button class="close-x" onclick="closeModal()">✕</button></h2>
      <p style="margin:8px 0;color:var(--muted);font-size:13px">Compte : <strong>${USER.role}</strong></p>
      <div class="row" style="flex-direction:column">${links}<button class="btn btn-ghost" onclick="logout()">Se déconnecter</button></div>`);
    return;
  }
  modalHTML(`
    <h2>👤 Mon compte <button class="close-x" onclick="closeModal()">✕</button></h2>
    <div class="tabs">
      <button class="active" onclick="accTab(this,'login')">Connexion</button>
      <button onclick="accTab(this,'register')">Inscription</button>
    </div>
    <div id="accBody"></div>
  `);
  accTab(document.querySelector(".tabs button"), "login");
}
function accTab(btn, which) {
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const body = document.getElementById("accBody");
  if (which === "login") {
    body.innerHTML = `
      <label>Identifiant</label><input id="lgId" />
      <label>Mot de passe</label><input id="lgPwd" type="password" />
      <div class="row"><button class="btn btn-primary" onclick="doLogin()">Se connecter</button></div>
      <p style="font-size:11px;color:var(--muted);margin-top:6px">Compte admin : buzz / arrow</p>`;
  } else {
    body.innerHTML = `
      <label>Type de compte</label>
      <select id="rgRole"><option value="client">Client</option><option value="vendeur">Vendeur (validation requise)</option></select>
      <label>Nom complet</label><input id="rgName" />
      <label>Téléphone (mobile money pour les vendeurs)</label><input id="rgPhone" />
      <label>Identifiant</label><input id="rgId" />
      <label>Mot de passe</label><input id="rgPwd" type="password" />
      <div class="row"><button class="btn btn-primary" onclick="doRegister()">Créer mon compte</button></div>`;
  }
}
async function doLogin() {
  const id = document.getElementById("lgId").value, pwd = document.getElementById("lgPwd").value;
  const r = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,pwd})});
  if (!r.ok) return toast("Identifiants invalides");
  const u = await r.json();
  if (u.role === "vendeur" && !u.approved) return toast("Compte en attente de validation admin");
  USER = { ...u, id };
  localStorage.setItem("user", JSON.stringify(USER));
  closeModal(); toast(`Bienvenue ${u.name}`);
  if (u.role === "admin") showAdmin();
  else if (u.role === "vendeur") showVendeur();
}
async function doRegister() {
  const data = {
    id: document.getElementById("rgId").value,
    pwd: document.getElementById("rgPwd").value,
    name: document.getElementById("rgName").value,
    phone: document.getElementById("rgPhone").value,
    role: document.getElementById("rgRole").value,
  };
  if (!data.id || !data.pwd || !data.name) return toast("Remplissez tous les champs");
  const r = await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  const j = await r.json();
  if (!r.ok) return toast(j.error || "Erreur");
  toast(data.role === "vendeur" ? "Inscription envoyée — en attente de validation admin" : "Compte créé, connectez-vous");
  accTab(document.querySelectorAll(".tabs button")[0], "login");
}
function logout() { USER = null; localStorage.removeItem("user"); closeModal(); toast("Déconnecté"); }

// ============ VENDEUR ============
function showVendeur() {
  if (!USER || USER.role !== "vendeur") return toast("Réservé aux vendeurs");
  showPage("page-vendeur");
  document.getElementById("catSelect").innerHTML = CATEGORIES.map(([s,_,n])=>`<option value="${s}">${n}</option>`).join("");
  const banner = document.getElementById("subBanner");
  if (banner) {
    if (USER.active) {
      const until = USER.subscriptionUntil ? new Date(USER.subscriptionUntil).toLocaleDateString("fr-FR") : "";
      banner.innerHTML = `<div class="tile" style="background:#ECFDF5;border-color:#A7F3D0">✅ Abonnement actif${until?` jusqu'au ${until}`:""}. Vos articles sont visibles.</div>`;
    } else {
      banner.innerHTML = `<div class="tile" style="background:#FEF2F2;border-color:#FECACA">⛔ Abonnement inactif. Vos articles sont cachés tant que l'administrateur n'a pas activé votre paiement.</div>`;
    }
  }
  loadMyProducts();
}

// Soumission d'article (espace vendeur ET espace admin)
document.addEventListener("submit", async e => {
  if (e.target.id !== "productForm" && e.target.id !== "adminProductForm") return;
  e.preventDefault();
  const f = e.target;
  const file = f.image.files[0];
  let img = null;
  if (file) img = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
  const stock = Number(f.stock.value);
  const body = {
    ownerId: USER.id, ownerName: USER.name, ownerRole: USER.role,
    title: f.title.value, category: f.category.value,
    price: Number(f.price.value), oldPrice: Number(f.oldPrice.value) || null,
    stock, whatsapp: f.whatsapp.value, personalPhone: f.personalPhone.value,
    image: img, description: f.description.value,
  };
  const r = await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if (r.ok) {
    f.reset();
    if (USER.role === "admin") { toast("Article publié ✓"); adminTab("products"); }
    else { toast("Article envoyé — en attente de validation admin"); loadMyProducts(); }
  }
});

async function loadMyProducts() {
  const mine = await (await fetch("/api/products/mine/" + encodeURIComponent(USER.id))).json();
  document.getElementById("myProducts").innerHTML = mine.length === 0 ? `<p style="color:var(--muted)">Aucun article</p>` :
    mine.map(p => `<div class="tile" style="margin-bottom:8px"><strong>${p.title}</strong> — ${fmt(p.price)} — Stock ${p.stock}/${p.stockInit} — ${p.blocked?'<span style="color:#9A3412">🚫 Bloqué</span>':p.approved?'<span style="color:var(--secondary)">✓ Validé</span>':'<span style="color:#9A3412">⏳ En attente</span>'}</div>`).join("");
}

// ============ ADMIN ============
function showAdmin() {
  if (!USER || USER.role !== "admin") return toast("Réservé à l'administrateur");
  showPage("page-admin");
  adminTab("vendors");
}
function productFormFields() {
  const cats = CATEGORIES.map(([s,_,n])=>`<option value="${s}">${n}</option>`).join("");
  return `
    <label>Titre de l'article</label><input name="title" required />
    <label>Catégorie</label><select name="category" required>${cats}</select>
    <label>Prix (FCFA)</label><input name="price" type="number" required />
    <label>Ancien prix (optionnel)</label><input name="oldPrice" type="number" />
    <label>Stock disponible</label><input name="stock" type="number" required />
    <label>Numéro WhatsApp (contact client)</label><input name="whatsapp" required placeholder="2250700000000" />
    <label>Numéro personnel (réception SMS)</label><input name="personalPhone" required placeholder="2250700000000" />
    <label>Image de l'article</label><input name="image" type="file" accept="image/*" />
    <label>Description</label><textarea name="description" rows="3"></textarea>`;
}
async function adminTab(which) {
  document.querySelectorAll("#page-admin .tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab===which));
  const c = document.getElementById("adminContent");
  if (which === "vendors") {
    const list = await (await fetch("/api/vendors")).json();
    c.innerHTML = list.length === 0 ? `<p style="margin-top:10px;color:var(--muted)">Aucun vendeur</p>` :
      list.map(v => {
        const until = v.subscriptionUntil ? new Date(v.subscriptionUntil).toLocaleDateString("fr-FR") : "—";
        const status = v.active ? `<span style="color:var(--secondary)">Actif (jusqu'au ${until})</span>` : v.approved ? `<span style="color:#9A3412">Inactif</span>` : `<span style="color:#9A3412">Non approuvé</span>`;
        return `<div class="tile" style="margin-top:8px">
          <strong>${v.name}</strong> — ${status}<br><small>${v.id} · ${v.phone||""}</small>
          <div class="row" style="margin-top:8px;flex-wrap:wrap">
            ${!v.approved?`<button class="btn btn-secondary" style="width:auto" onclick="approveVendor('${v.id}')">Approuver le compte</button>`:""}
            <button class="btn btn-primary" style="width:auto" onclick="activateVendor('${v.id}')">Activer (payé) +1 mois</button>
            <button class="btn btn-ghost" style="width:auto" onclick="deactivateVendor('${v.id}')">Désactiver</button>
          </div></div>`;
      }).join("");
  } else if (which === "products") {
    const all = await (await fetch("/api/products/all")).json();
    c.innerHTML = all.length === 0 ? `<p style="margin-top:10px;color:var(--muted)">Aucun article</p>` :
      all.map(p => {
        const st = p.blocked?'🚫 Bloqué':p.approved?'✓ Validé':'⏳ En attente';
        return `<div class="tile" style="margin-top:8px"><strong>${p.title}</strong> — ${fmt(p.price)} — Stock ${p.stock} — ${st}<br>
          <small>Par : ${p.ownerName} (${p.ownerRole}) · WhatsApp ${p.whatsapp||"—"} · Perso ${p.personalPhone||"—"}</small>
          <div class="row" style="margin-top:8px;flex-wrap:wrap">
            ${!p.approved?`<button class="btn btn-primary" style="width:auto" onclick="approveProduct(${p.id})">Approuver</button>`:""}
            ${!p.blocked?`<button class="btn btn-ghost" style="width:auto" onclick="blockProduct(${p.id})">Bloquer</button>`:`<button class="btn btn-secondary" style="width:auto" onclick="approveProduct(${p.id})">Débloquer</button>`}
            <button class="btn btn-ghost" style="width:auto" onclick="deleteProduct(${p.id})">Supprimer</button>
          </div></div>`;
      }).join("");
  } else if (which === "addproduct") {
    c.innerHTML = `<p style="color:var(--muted);font-size:13px;margin:10px 0">Article publié immédiatement (compte administrateur).</p>
      <form id="adminProductForm">${productFormFields()}
      <div class="row"><button type="submit" class="btn btn-primary">Publier l'article</button></div></form>`;
  } else if (which === "settings") {
    const s = await (await fetch("/api/settings")).json();
    const sm = s.sms || {};
    c.innerHTML = `
      <h3 style="margin-top:12px">Entreprise & Abonnement</h3>
      <label>Nom de l'entreprise (en-tête des SMS)</label><input id="setCompany" value="${s.companyName||""}" />
      <label>Prix de l'abonnement vendeur (FCFA / mois)</label><input id="setSubPrice" type="number" value="${s.subscriptionPrice||0}" />
      <h3 style="margin-top:16px">API SMS (n'importe quelle plateforme)</h3>
      <label><input type="checkbox" id="smsEnabled" ${sm.enabled?"checked":""}/> Activer l'envoi de SMS</label>
      <label>Méthode</label><select id="smsMethod"><option ${sm.method==="GET"?"selected":""}>GET</option><option ${sm.method!=="GET"?"selected":""}>POST</option></select>
      <label>URL de l'API <small>(placeholders : {to} {message} {from})</small></label><input id="smsUrl" value="${(sm.url||"").replace(/"/g,'&quot;')}" placeholder="https://api.exemple.com/send" />
      <label>Content-Type</label><select id="smsCT"><option ${sm.contentType==="application/json"?"selected":""}>application/json</option><option ${sm.contentType==="application/x-www-form-urlencoded"?"selected":""}>application/x-www-form-urlencoded</option></select>
      <label>En-têtes (JSON)</label><textarea id="smsHeaders" rows="2" placeholder='{"Authorization":"Bearer VOTRE_CLE"}'>${sm.headers||""}</textarea>
      <label>Corps de la requête <small>(placeholders : {to} {message} {from})</small></label><textarea id="smsBody" rows="3" placeholder='{"to":"{to}","from":"{from}","text":"{message}"}'>${(sm.bodyTemplate||"").replace(/</g,"&lt;")}</textarea>
      <label>Expéditeur / Sender</label><input id="smsSender" value="${sm.sender||""}" />
      <div class="row" style="flex-wrap:wrap"><button class="btn btn-primary" style="width:auto" onclick="saveSettings()">Enregistrer</button>
      <input id="smsTestNum" placeholder="Numéro de test" style="width:auto;flex:1" />
      <button class="btn btn-secondary" style="width:auto" onclick="testSMS()">Envoyer un SMS test</button></div>
      <div id="settingsMsg" style="margin-top:8px;font-size:13px"></div>`;
  } else {
    const orders = await (await fetch("/api/orders")).json();
    c.innerHTML = orders.length === 0 ? `<p style="margin-top:10px;color:var(--muted)">Aucune commande</p>` :
      orders.reverse().map(o => `<div class="tile" style="margin-top:8px"><strong>${o.orderNo||o.id}</strong> — ${o.name} · ${o.phone}<br><small>${new Date(o.createdAt).toLocaleString("fr-FR")} — ${o.delivery==="agence"?"Retrait sur place":"Livraison"} — ${o.payMethod}</small><div style="margin-top:6px;font-size:13px">${o.items.map(i=>`${i.qty}× ${i.name}`).join(", ")}</div><strong>Total : ${fmt(o.total)}</strong></div>`).join("");
  }
}
async function approveVendor(id) { await fetch("/api/vendors/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Compte vendeur approuvé"); adminTab("vendors"); }
async function activateVendor(id) { await fetch("/api/vendors/activate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,months:1})}); toast("Abonnement activé (+1 mois)"); adminTab("vendors"); }
async function deactivateVendor(id) { await fetch("/api/vendors/deactivate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Vendeur désactivé — articles cachés"); adminTab("vendors"); }
async function approveProduct(id) { await fetch("/api/products/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Article validé"); adminTab("products"); }
async function blockProduct(id) { await fetch("/api/products/block",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Article bloqué"); adminTab("products"); }
async function deleteProduct(id) { if(!confirm("Supprimer cet article ?"))return; await fetch("/api/products/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); toast("Article supprimé"); adminTab("products"); }
async function saveSettings() {
  const body = {
    companyName: document.getElementById("setCompany").value,
    subscriptionPrice: document.getElementById("setSubPrice").value,
    sms: {
      enabled: document.getElementById("smsEnabled").checked,
      method: document.getElementById("smsMethod").value,
      url: document.getElementById("smsUrl").value,
      contentType: document.getElementById("smsCT").value,
      headers: document.getElementById("smsHeaders").value,
      bodyTemplate: document.getElementById("smsBody").value,
      sender: document.getElementById("smsSender").value,
    },
  };
  await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  document.getElementById("settingsMsg").innerHTML = '<span style="color:var(--secondary)">✓ Paramètres enregistrés</span>';
}
async function testSMS() {
  const to = document.getElementById("smsTestNum").value;
  if (!to) return toast("Entrez un numéro de test");
  const r = await (await fetch("/api/settings/sms-test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to})})).json();
  document.getElementById("settingsMsg").textContent = r.ok ? "✓ SMS envoyé (statut " + (r.status||"") + ")" : "✗ Échec : " + (r.error || r.body || r.status || "config incomplète");
}

// ============ UTIL ============
function modalHTML(html) { document.getElementById("modalBody").innerHTML = html; document.getElementById("modal").classList.add("show"); }
function closeModal() { document.getElementById("modal").classList.remove("show"); }
function toast(m) { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(()=>t.remove(), 2500); }
function doSearch() { const q = document.getElementById("searchInput").value; if (q) toast(`Recherche : ${q}`); }
document.getElementById("menuBtn").onclick = () => {
  const p = document.getElementById("mobileSidebarPanel");
  renderSidebar(p);
  document.getElementById("mobileSidebar").classList.add("show");
};

// ============ INIT ============
document.getElementById("yr").textContent = new Date().getFullYear();
renderHome();
updateCartCount();
