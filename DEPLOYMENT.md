# Guide de Déploiement - AZZ&CO LABS Website

## 📋 Prérequis

1. **Node.js** 16+ installé
2. **Ollama** installé et configuré
3. **Git** pour le versioning
4. **Compte GitHub** pour le repository

## 🚀 Installation Locale

### 1. Installer les dépendances du backend

```bash
cd backend
npm install
```

### 2. Configurer l'environnement

```bash
cp backend/.env.example backend/.env
```

Éditez `backend/.env` avec vos configurations :
```env
PORT=3000
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2
DB_PATH=./data/visitors.db
```

### 3. Installer et configurer Ollama

```bash
# Télécharger Ollama depuis https://ollama.ai
# Installer et démarrer Ollama

# Télécharger un modèle
ollama pull llama2

# Vérifier que Ollama fonctionne
ollama list
```

### 4. Démarrer le backend

```bash
cd backend
npm start
# ou en mode développement
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### 5. Tester le site web

Ouvrez `index.html` dans votre navigateur ou servez-le avec un serveur local :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js (http-server)
npx http-server
```

## 📦 Déploiement sur GitHub

### 1. Créer un nouveau repository GitHub

1. Allez sur GitHub et créez un nouveau repository
2. Nommez-le (ex: `azzco-website`)
3. Ne cochez PAS "Initialize with README" (nous avons déjà nos fichiers)

### 2. Initialiser Git localement

```bash
cd azzco-website
git init
git add .
git commit -m "Initial commit: AZZ&CO LABS website with Ollama chatbot"
```

### 3. Connecter au repository GitHub

```bash
# Remplacez YOUR_USERNAME et YOUR_REPO_NAME
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Configuration pour le déploiement

#### Option A: GitHub Pages (Frontend uniquement)

1. Allez dans Settings > Pages
2. Sélectionnez la branche `main` et le dossier `/ (root)`
3. Le site sera disponible sur `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

**Note**: Le backend devra être déployé séparément (voir Option B)

#### Option B: Déploiement complet (Frontend + Backend)

Pour déployer le backend, vous avez plusieurs options :

**Heroku:**
```bash
# Installer Heroku CLI
# Créer un app
heroku create azzco-website-backend

# Configurer les variables d'environnement
heroku config:set OLLAMA_API_URL=your_ollama_url
heroku config:set OLLAMA_MODEL=llama2

# Déployer
git subtree push --prefix backend heroku main
```

**Railway / Render / Fly.io:**
- Suivez leurs guides de déploiement Node.js
- Configurez les variables d'environnement
- Déployez le dossier `backend/`

**VPS (DigitalOcean, AWS, etc.):**
```bash
# SSH dans votre serveur
# Cloner le repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME/backend

# Installer les dépendances
npm install --production

# Configurer PM2 ou systemd pour gérer le processus
pm2 start server.js --name azzco-backend

# Configurer Nginx comme reverse proxy
```

### 5. Mettre à jour l'URL de l'API dans le frontend

Si vous déployez le backend sur un autre serveur, mettez à jour `chatbot.js` :

```javascript
// Dans chatbot.js, ligne ~3
this.apiUrl = 'https://your-backend-url.com/api';
// ou pour production
this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
```

## 🔧 Configuration Ollama en Production

### Option 1: Ollama local sur le serveur

```bash
# Installer Ollama sur le serveur
# Configurer pour accepter les connexions distantes
export OLLAMA_HOST=0.0.0.0:11434
```

### Option 2: Ollama Cloud (si disponible)

Mettez à jour `OLLAMA_API_URL` dans `.env` avec l'URL du service cloud.

### Option 3: API Ollama externe

Utilisez un service qui fournit une API Ollama (ex: OpenRouter, etc.)

## 📊 Base de Données

La base de données SQLite est créée automatiquement au premier démarrage dans `backend/data/visitors.db`.

Pour la production, vous pouvez :
- Utiliser SQLite (simple, pour petits volumes)
- Migrer vers PostgreSQL (recommandé pour la production)
- Utiliser une base de données cloud (Supabase, PlanetScale, etc.)

## 🔒 Sécurité en Production

1. **Variables d'environnement**: Ne commitez JAMAIS le fichier `.env`
2. **HTTPS**: Utilisez toujours HTTPS en production
3. **Rate Limiting**: Déjà configuré, ajustez selon vos besoins
4. **CORS**: Configurez `FRONTEND_URL` dans `.env` pour limiter les origines
5. **Secrets**: Utilisez des secrets managers pour les clés API

## 📝 Checklist de Déploiement

- [ ] Backend installé et testé localement
- [ ] Ollama installé et fonctionnel
- [ ] Variables d'environnement configurées
- [ ] Base de données initialisée
- [ ] Frontend testé avec le backend local
- [ ] Repository GitHub créé
- [ ] Code poussé sur GitHub
- [ ] Backend déployé (Heroku/Railway/etc.)
- [ ] Frontend déployé (GitHub Pages/Vercel/etc.)
- [ ] URL API mise à jour dans le frontend
- [ ] HTTPS configuré
- [ ] Tests de bout en bout effectués

## 🐛 Dépannage

### Le chatbot ne répond pas

1. Vérifiez que le backend est démarré : `curl http://localhost:3000/health`
2. Vérifiez qu'Ollama fonctionne : `curl http://localhost:11434/api/tags`
3. Vérifiez la console du navigateur pour les erreurs
4. Vérifiez les logs du backend

### Erreurs CORS

1. Vérifiez que `FRONTEND_URL` est configuré dans `.env`
2. Vérifiez que le frontend utilise la bonne URL API
3. Vérifiez les headers CORS dans `server.js`

### Base de données ne se crée pas

1. Vérifiez les permissions du dossier `backend/data/`
2. Vérifiez que SQLite3 est installé
3. Vérifiez les logs pour les erreurs de création

## 📞 Support

Pour toute question ou problème :
- Email: azerrached3@gmail.com
- LinkedIn: [Azer Rached](https://www.linkedin.com/in/azer-rached-239258377/)

---

© 2025 AZZ&CO LABS. Tous droits réservés.