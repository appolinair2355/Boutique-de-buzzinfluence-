# ABENGOUROU-MARKET

Plateforme numérique d'Abengourou (Côte d'Ivoire).

## Déploiement Render.com

1. Créez un nouveau **Web Service** sur Render
2. Uploadez ce ZIP (ou connectez le dépôt Git)
3. **Build Command** : `npm install`
4. **Start Command** : `npm start`
5. Render fournit automatiquement la variable `PORT` (l'app l'utilise).

## Local

```bash
npm install
npm start
```

Ouvre http://localhost:1000

## Compte administrateur
- Identifiant : `buzz`
- Mot de passe : `arrow`
- (Modifiables via les variables d'environnement `ADMIN_ID` / `ADMIN_PWD`.)

## Fonctionnalités

### Ajouter un article (vendeur OU administrateur)
- **Espace vendeur** : 👤 Mon compte → connexion vendeur → « Mon espace vendeur ».
- **Espace admin** : 👤 → admin → onglet **Ajouter un article**.
- Champs : titre, **catégorie, prix, stock** (le site calcule le reste / pourcentage),
  **numéro WhatsApp** (contact client) et **numéro personnel** (réception du SMS de commande).
- Article du vendeur = en attente de validation. Article de l'admin = publié immédiatement.

### Administration (onglets du tableau de bord)
- **Comptes vendeurs** : approuver un compte, **Activer** l'abonnement (paiement reçu, +1 mois),
  ou **Désactiver** (non payé → tous ses articles deviennent invisibles).
- **Articles à valider** : approuver, **bloquer/débloquer**, supprimer.
- **Commandes** : historique.
- **SMS & Abonnement** : nom de l'entreprise, **prix de l'abonnement mensuel**,
  et **configuration de l'API SMS de n'importe quelle plateforme**.

### Abonnement vendeur
- L'admin fixe le prix mensuel.
- Tant que l'abonnement n'est pas activé (ou expiré), les articles du vendeur sont cachés.
- L'admin clique **Activer** quand le vendeur paie, **Désactiver** sinon.

### Commande & SMS
- Au paiement, mode **« Je viendrai à l'agence »** (retrait) ou **livraison à domicile**.
- À la réception d'une commande, le propriétaire de l'article reçoit un **SMS sur son numéro personnel**.
- En-tête du SMS : **nom de l'entreprise** + **numéro de commande**.

### Configurer l'API SMS (n'importe quelle plateforme)
Dans **SMS & Abonnement** :
- URL de l'API, méthode (GET/POST), Content-Type, en-têtes (JSON), et corps de requête.
- Placeholders disponibles : `{to}`, `{message}`, `{from}`.
- Exemple corps JSON : `{"to":"{to}","from":"{from}","text":"{message}"}`
- Bouton **Envoyer un SMS test** pour vérifier la configuration.

## Structure
- `public/` — frontend (HTML, CSS, JS)
- `data/` — base de données JSON locale
- `server.js` — serveur Express
