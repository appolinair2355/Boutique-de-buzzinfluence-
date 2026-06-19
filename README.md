# ABENGOUROU-MARKET

Plateforme numérique d'Abengourou (Côte d'Ivoire) — acheter, vendre, immobilier, emploi, rencontres.

## Déploiement (n'importe quel hébergeur Node.js)

### Variables d'environnement requises

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL complète | `postgresql://user:pass@host:5432/db` |
| `ADMIN_ID` | Identifiant admin (défaut : `buzz`) | `monadmin` |
| `ADMIN_PWD` | Mot de passe admin (défaut : `arrow`) | `motdepasse` |
| `PORT` | Port du serveur (défaut : `5000`) | `3000` |

### Déploiement sur Render.com

1. Créez un **Web Service** et uploadez ce ZIP (ou connectez votre dépôt Git)
2. **Build Command** : `npm install`
3. **Start Command** : `npm start`
4. Ajoutez les variables d'environnement ci-dessus dans l'onglet "Environment"
5. Pour la base de données PostgreSQL : créez un service "PostgreSQL" sur Render et copiez l'URL interne dans `DATABASE_URL`

### Déploiement local

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env à partir du modèle
cp .env.example .env
# Remplissez DATABASE_URL avec votre connexion PostgreSQL

# 3. Démarrer
npm start
```

Le serveur démarre sur http://localhost:5000 (ou le port défini dans `PORT`).

## Compte administrateur par défaut

- **Identifiant** : `buzz`
- **Mot de passe** : `arrow`

Modifiables via les variables d'environnement `ADMIN_ID` et `ADMIN_PWD`.

## Fonctionnalités

- **Marketplace** : articles, panier, commandes avec envoi WhatsApp aux vendeurs
- **Rencontres & Amitiés** : profils avec accès payant
- **Emploi / Concours CI** : offres avec détails verrouillés
- **Transport** : offres de taxi et livraison
- **Immobilier, Véhicules, Téléphones…** : toutes les catégories
- **Tableau de bord admin** : gestion vendeurs, articles, commandes, exports/imports BD
- **SMS** : notifications vendeurs configurables (n'importe quelle API SMS)
- **Export/Import** : JSON (complet avec images) + Excel (données tabulaires)

## Structure du projet

```
server.js          — Serveur Express + API REST + PostgreSQL
package.json       — Dépendances Node.js
public/
  index.html       — Structure HTML (SPA)
  app.js           — Logique frontend complète
  styles.css       — Styles CSS
  img/             — Logos et assets statiques
.env.example       — Modèle de configuration
```

## Notes importantes sur les images

Les images des articles et des profils Rencontres sont stockées en **base64** dans PostgreSQL.

- **Export JSON** : contient les images complètes — à utiliser pour les sauvegardes
- **Export Excel** : affiche `[IMAGE xxKB]` à la place (limite Excel de 32 767 caractères/cellule)
- **Import JSON** : restaure les images intégralement
- **Import Excel** : restaure toutes les données sauf les images (utilisez JSON pour les images)

> ⚠️ Les images en base64 occupent de l'espace en base de données. Surveillez l'espace disponible
> depuis le tableau de bord admin → onglet **Base de données**.
