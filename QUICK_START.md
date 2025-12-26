# 🚀 Quick Start Guide - AZZ&CO LABS Website

## Installation Rapide (5 minutes)

### 1. Installer Ollama

```bash
# Windows/Mac/Linux
# Téléchargez depuis https://ollama.ai et installez

# Vérifier l'installation
ollama --version

# Télécharger un modèle
ollama pull llama2
```

### 2. Démarrer le Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Le backend démarre sur `http://localhost:3000`

### 3. Ouvrir le Site Web

Ouvrez simplement `index.html` dans votre navigateur, ou :

```bash
# Avec Python
python -m http.server 8000
# Puis ouvrez http://localhost:8000

# Ou avec Node.js
npx http-server
```

### 4. Tester le Chatbot

1. Cliquez sur l'icône de chat en bas à droite
2. Posez une question (ex: "Qu'est-ce que JobBoat ?")
3. Le chatbot répondra en utilisant Ollama !

## ✅ Vérification

- Backend: `curl http://localhost:3000/health`
- Ollama: `curl http://localhost:11434/api/tags`
- Chatbot: Ouvrez le site et testez le widget de chat

## 📝 Prochaines Étapes

1. Lisez `DEPLOYMENT.md` pour déployer sur GitHub
2. Personnalisez les prompts dans `backend/prompts/`
3. Configurez les analytics selon vos besoins

## 🆘 Problèmes ?

- **Backend ne démarre pas**: Vérifiez que le port 3000 est libre
- **Ollama ne répond pas**: Vérifiez qu'Ollama est démarré (`ollama serve`)
- **Chatbot ne fonctionne pas**: Vérifiez la console du navigateur (F12)

---

© 2025 AZZ&CO LABS