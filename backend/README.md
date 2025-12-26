# AZZ&CO LABS Website Backend

Backend API pour le site web AZZ&CO LABS avec chatbot Ollama et système d'analytics.

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

1. Copiez `.env.example` vers `.env`:
```bash
cp .env.example .env
```

2. Configurez vos variables d'environnement dans `.env`:
```env
# Ollama API Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_API_KEY=votre_cle_api_ollama_ici
OLLAMA_TIMEOUT=30000

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=http://localhost:5500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Note importante :** 
- La clé API Ollama (`OLLAMA_API_KEY`) est requise pour authentifier les requêtes vers l'API Ollama. Cette clé est automatiquement incluse dans les headers `Authorization` et `X-API-Key` de toutes les requêtes API.
- **Ne confondez pas avec la clé Vercel** : La clé Vercel est utilisée pour le déploiement, pas pour l'API Ollama. Voir `DEPLOYMENT_VERCEL.md` pour plus d'informations sur le déploiement.

## 📦 Prérequis

- Node.js 16+
- Ollama installé et démarré localement
- SQLite3 (inclus avec Node.js)

### Installation d'Ollama

1. Téléchargez Ollama depuis https://ollama.ai
2. Installez et démarrez Ollama
3. Téléchargez un modèle:
```bash
ollama pull llama2
```

## 🏃 Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📡 API Endpoints

### Chatbot

- `POST /api/chatbot/message` - Envoyer un message au chatbot
- `GET /api/chatbot/health` - Vérifier l'état du service
- `GET /api/chatbot/history/:sessionId` - Récupérer l'historique d'une session

### Analytics

- `POST /api/analytics/visitor` - Enregistrer un visiteur
- `POST /api/analytics/pageview` - Enregistrer une page vue
- `POST /api/analytics/event` - Enregistrer un événement personnalisé
- `GET /api/analytics/stats` - Obtenir les statistiques (admin)

## 🎭 Système de Personas

Le chatbot détecte automatiquement la persona de l'utilisateur basée sur ses messages:

- **Professional** - Persona par défaut
- **Investor** - Pour les investisseurs
- **Job Seeker** - Pour les chercheurs d'emploi
- **Tech Enthusiast** - Pour les passionnés de tech
- **Curious Visitor** - Pour les nouveaux visiteurs
- **Partner** - Pour les partenaires
- **Media** - Pour les journalistes
- **Student** - Pour les étudiants

## 📝 Système de Prompts

Les prompts sont organisés par contexte dans `backend/prompts/`:

- `jobboat.json` - Questions sur JobBoat
- `outwings.json` - Questions sur OutWings
- `contact.json` - Informations de contact
- `mission.json` - Mission et philosophie
- `ai.json` - Questions sur l'IA
- `technology.json` - Questions techniques
- `general.json` - Questions générales

## 💾 Base de Données

SQLite avec 4 tables principales:

- `visitors` - Données des visiteurs
- `chat_logs` - Historique des conversations
- `page_views` - Vues de pages
- `events` - Événements personnalisés

## 🔒 Sécurité

- Helmet.js pour les headers de sécurité
- Rate limiting sur toutes les routes API
- CORS configuré
- Validation des entrées

## 📊 Analytics

Le système collecte automatiquement:
- Visiteurs uniques
- Pages vues
- Temps passé sur les pages
- Interactions avec le chatbot
- Événements personnalisés

## 🛠️ Développement

Structure du projet:
```
backend/
├── models/          # Modèles de base de données
├── routes/          # Routes API
├── services/        # Services métier
├── prompts/         # Fichiers de prompts
└── utils/           # Utilitaires
```

## 📝 Notes

- Assurez-vous qu'Ollama est démarré avant de lancer le serveur
- La base de données SQLite est créée automatiquement au premier démarrage
- Les logs sont stockés dans la console et peuvent être redirigés vers des fichiers