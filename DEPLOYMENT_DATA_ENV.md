# 📊 Stockage des Données & Variables d'Environnement en Production

## ⚠️ Problème Critique : SQLite sur Vercel

### Pourquoi SQLite ne fonctionne PAS sur Vercel

**Vercel utilise un système de fichiers éphémère** :
- ❌ Les fichiers sont **supprimés** à chaque redéploiement
- ❌ Les données SQLite sont **perdues** après chaque déploiement
- ❌ Pas de persistance entre les redémarrages
- ❌ Chaque instance serverless a son propre système de fichiers

**Résultat** : Toutes vos données (visiteurs, analytics, chat logs) seront **perdues** !

---

## ✅ Solutions Recommandées

### Option 1 : Vercel Postgres (Recommandé) ⭐

**Avantages** :
- ✅ Intégration native avec Vercel
- ✅ Gratuit jusqu'à 256 MB
- ✅ Facile à configurer
- ✅ Sauvegarde automatique
- ✅ Performances excellentes

**Configuration** :
1. Dans le dashboard Vercel → Storage → Create Database → Postgres
2. Vercel génère automatiquement `POSTGRES_URL`
3. Cette variable est automatiquement disponible dans votre code

**Coût** : Gratuit (256 MB), puis payant

---

### Option 2 : Supabase (Alternative populaire)

**Avantages** :
- ✅ Gratuit jusqu'à 500 MB
- ✅ Interface graphique (dashboard)
- ✅ API REST automatique
- ✅ Authentification intégrée
- ✅ Bon pour le développement

**Configuration** :
1. Créer un compte sur https://supabase.com
2. Créer un nouveau projet
3. Récupérer la connection string
4. Ajouter `DATABASE_URL` dans Vercel

**Coût** : Gratuit (500 MB), puis payant

---

### Option 3 : PlanetScale (MySQL Serverless)

**Avantages** :
- ✅ MySQL compatible
- ✅ Scaling automatique
- ✅ Branches de base de données (comme Git)
- ✅ Gratuit jusqu'à 5 GB

**Configuration** :
1. Créer un compte sur https://planetscale.com
2. Créer une base de données
3. Récupérer la connection string
4. Ajouter `DATABASE_URL` dans Vercel

**Coût** : Gratuit (5 GB), puis payant

---

## 🔧 Migration de SQLite vers PostgreSQL

### Étape 1 : Installer les dépendances

```bash
cd backend
npm install pg
npm uninstall sqlite3
```

### Étape 2 : Créer un adaptateur de base de données

Créer `backend/models/postgresDatabase.js` (voir exemple ci-dessous)

### Étape 3 : Mettre à jour `database.js`

Utiliser PostgreSQL en production, SQLite en développement local

---

## 🔐 Variables d'Environnement : Local vs Production

### 📁 Local (fichier `.env`)

**Fichier** : `backend/.env` (NE JAMAIS COMMITER !)

```env
# Ollama API Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_API_KEY=votre_cle_ici
OLLAMA_TIMEOUT=30000

# IP Geolocation API
IPAPI_API_KEY=78036192dfca37ca069160b4400858e9

# Database (local SQLite)
DB_PATH=./data/visitors.db

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important** : Le fichier `.env` est dans `.gitignore` et ne sera **JAMAIS** commité.

---

### ☁️ Production (Vercel Dashboard)

**Où configurer** :
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Ajoutez chaque variable

**Variables à ajouter** :

```env
# Ollama API Configuration
OLLAMA_API_URL=https://votre-ollama-cloud.com
OLLAMA_MODEL=llama2
OLLAMA_API_KEY=votre_cle_ollama_production
OLLAMA_TIMEOUT=30000

# IP Geolocation API
IPAPI_API_KEY=78036192dfca37ca069160b4400858e9

# Database (PostgreSQL - généré automatiquement par Vercel)
POSTGRES_URL=postgres://user:pass@host:5432/dbname
# OU si vous utilisez Supabase/PlanetScale
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Server Configuration
NODE_ENV=production
PORT=3000

# Frontend URL
FRONTEND_URL=https://votre-site.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Environnements** :
- ✅ **Production** : Variables utilisées en production
- ✅ **Preview** : Variables pour les preview deployments
- ✅ **Development** : Variables pour `vercel dev`

---

## 📋 Checklist de Déploiement

### Avant le déploiement

- [ ] Créer une base de données cloud (Vercel Postgres, Supabase, ou PlanetScale)
- [ ] Migrer le schéma SQLite vers PostgreSQL
- [ ] Tester la connexion à la base de données
- [ ] Configurer toutes les variables d'environnement dans Vercel
- [ ] Vérifier que les clés API sont valides
- [ ] Tester le chatbot avec l'API Ollama cloud

### Après le déploiement

- [ ] Vérifier que les données sont bien sauvegardées
- [ ] Tester les endpoints analytics
- [ ] Vérifier les logs Vercel pour les erreurs
- [ ] Monitorer l'utilisation de la base de données

---

## 🚨 Points Critiques

### 1. Fichier `.env` en production

**❌ NE FONCTIONNE PAS** :
- Vercel ne lit **PAS** le fichier `.env` en production
- Vous **DEVEZ** configurer les variables dans le dashboard Vercel

**✅ Solution** :
- Utiliser le dashboard Vercel pour toutes les variables de production
- Le fichier `.env` est uniquement pour le développement local

### 2. Base de données SQLite

**❌ NE FONCTIONNE PAS** :
- SQLite nécessite un système de fichiers persistant
- Vercel supprime tous les fichiers à chaque déploiement

**✅ Solution** :
- Migrer vers PostgreSQL (Vercel Postgres recommandé)
- Ou utiliser Supabase/PlanetScale

### 3. Clés API sensibles

**✅ Bonnes pratiques** :
- Ne jamais commiter les clés API dans Git
- Utiliser les variables d'environnement Vercel
- Utiliser des clés différentes pour dev/prod
- Roter les clés régulièrement

---

## 📚 Ressources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase Documentation](https://supabase.com/docs)
- [PlanetScale Documentation](https://planetscale.com/docs)

---

## 🔄 Migration SQLite → PostgreSQL

Voir le fichier `MIGRATION_POSTGRES.md` pour un guide détaillé de migration.
