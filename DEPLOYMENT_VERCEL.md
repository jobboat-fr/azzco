# Déploiement sur Vercel - AZZ&CO LABS Website

## 🔑 Configuration SSH pour Vercel

### Clé SSH fournie
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID/kgkTPn+ItHpvdVT1wbnnzff3gK8AHZhMAOSzb41R1
```

## 📋 Étapes de déploiement

### 1. Installation de Vercel CLI
```bash
npm install -g vercel
```

### 2. Connexion à Vercel
```bash
vercel login
```

### 3. Ajout de la clé SSH (si nécessaire)
Si vous devez utiliser cette clé SSH pour Git, ajoutez-la à votre agent SSH :
```bash
# Windows (PowerShell)
ssh-add ~/.ssh/id_ed25519

# Ou ajoutez la clé à votre profil GitHub
```

### 4. Configuration des variables d'environnement
Dans le dashboard Vercel, ajoutez les variables suivantes :

```env
# Ollama API Configuration
OLLAMA_API_URL=https://votre-url-ollama.com
OLLAMA_MODEL=llama2
OLLAMA_API_KEY=votre_cle_ollama_ici
OLLAMA_TIMEOUT=30000

# Server Configuration
NODE_ENV=production
PORT=3000

# Frontend URL
FRONTEND_URL=https://votre-site.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Déploiement
```bash
# Depuis le dossier azzco-website
vercel

# Pour la production
vercel --prod
```

## 🔧 Configuration du projet

Le fichier `vercel.json` est déjà configuré pour :
- Servir le backend Node.js sur `/api/*`
- Servir les fichiers statiques (HTML, CSS, JS)
- Gérer les routes correctement

## 📝 Notes importantes

1. **Clé Ollama** : Assurez-vous d'avoir une vraie clé API Ollama (pas la clé Vercel) dans les variables d'environnement Vercel.

2. **Base de données** : ⚠️ **CRITIQUE** - SQLite ne fonctionne PAS sur Vercel (système de fichiers éphémère). 
   - Les données seront **perdues** à chaque déploiement
   - **Solution** : Migrer vers PostgreSQL (Vercel Postgres recommandé)
   - Voir `DEPLOYMENT_DATA_ENV.md` pour un guide complet
   - Le code supporte automatiquement PostgreSQL en production et SQLite en local

3. **Ollama Cloud** : Si vous utilisez Ollama en local, vous devrez :
   - Soit utiliser Ollama Cloud
   - Soit déployer Ollama sur un serveur séparé
   - Soit utiliser une alternative cloud (OpenAI, Anthropic, etc.)

## 🚀 Commandes utiles

```bash
# Voir les logs
vercel logs

# Voir les déploiements
vercel ls

# Ouvrir le dashboard
vercel dashboard
```
