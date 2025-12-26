# 🚀 Push vers Production (jobboat-fr/azzco)

## 📍 Repository de Production

- **URL** : https://github.com/jobboat-fr/azzco
- **Remote** : `jobboat-fr`
- **Vercel** : https://azzco.vercel.app
- **Status** : ✅ Remote déjà configuré

---

## ⚡ Push Rapide vers Production

### Commande Simple

```bash
cd azzco-website
git push jobboat-fr main
```

Cela va :
1. ✅ Pousser votre code vers `jobboat-fr/azzco`
2. ✅ Déclencher automatiquement un déploiement sur Vercel
3. ✅ Mettre à jour https://azzco.vercel.app

---

## 📋 Checklist Avant Push

### 1. Variables d'Environnement Vercel

Assurez-vous que toutes les variables sont configurées dans Vercel :

- [ ] `OLLAMA_API_URL` - URL de votre API Ollama cloud
- [ ] `OLLAMA_API_KEY` - Clé API Ollama valide
- [ ] `OLLAMA_MODEL` - Modèle à utiliser (ex: llama2)
- [ ] `IPAPI_API_KEY` - `78036192dfca37ca069160b4400858e9`
- [ ] `POSTGRES_URL` ou `DATABASE_URL` - URL de votre base PostgreSQL
- [ ] `NODE_ENV` - `production`
- [ ] `FRONTEND_URL` - `https://azzco.vercel.app`

**Où configurer** :
1. https://vercel.com/dashboard
2. Sélectionner le projet `azzco`
3. Settings → Environment Variables
4. Ajouter toutes les variables

### 2. Base de Données

⚠️ **CRITIQUE** : SQLite ne fonctionne PAS sur Vercel !

- [ ] Créer une base PostgreSQL (Vercel Postgres recommandé)
- [ ] Configurer `POSTGRES_URL` dans Vercel
- [ ] Exécuter les migrations si nécessaire

### 3. Code

- [ ] Tous les fichiers sont commités
- [ ] Aucune information sensible dans le code
- [ ] `.gitignore` exclut bien `.env`, `.db`, etc.
- [ ] `vercel.json` est correct

---

## 🔄 Workflow Complet

### Étape 1 : Vérifier l'état local

```bash
cd azzco-website
git status
```

### Étape 2 : S'assurer que tout est commité

```bash
# Si des changements non commités
git add .
git commit -m "Votre message de commit"
```

### Étape 3 : Push vers le repository de développement (optionnel)

```bash
git push origin main
```

### Étape 4 : Push vers la production

```bash
git push jobboat-fr main
```

### Étape 5 : Vérifier le déploiement

1. Allez sur https://vercel.com/dashboard
2. Vérifiez les logs de déploiement
3. Testez https://azzco.vercel.app

---

## 🐛 Résolution de Problèmes

### Erreur : "Permission denied"

```bash
# Vérifier les permissions sur le repository
# Vous devez avoir les droits d'écriture sur jobboat-fr/azzco
```

### Erreur : "Remote already exists"

Le remote est déjà configuré, c'est normal. Utilisez directement :
```bash
git push jobboat-fr main
```

### Erreur de déploiement Vercel

1. Vérifier les logs Vercel
2. Vérifier que toutes les variables d'environnement sont configurées
3. Vérifier que la base de données PostgreSQL est accessible
4. Vérifier que les clés API sont valides

---

## 📊 Vérifier les Remotes

```bash
# Voir tous les remotes
git remote -v

# Résultat attendu :
# jobboat-fr  https://github.com/jobboat-fr/azzco.git (fetch)
# jobboat-fr  https://github.com/jobboat-fr/azzco.git (push)
# origin      git@github.com:azerrached3-a11y/AZZ-CO-LABS-.git (fetch)
# origin      git@github.com:azerrached3-a11y/AZZ-CO-LABS-.git (push)
```

---

## 🎯 Commandes Rapides

```bash
# Push vers production
git push jobboat-fr main

# Voir les différences
git diff main jobboat-fr/main

# Récupérer les changements de production
git fetch jobboat-fr

# Voir l'historique
git log --oneline -10
```

---

## ⚠️ Important

1. **Ne jamais pousser les fichiers sensibles** :
   - `.env`
   - `*.db`
   - Clés API dans le code

2. **Vercel déploie automatiquement** :
   - Chaque push vers `main` déclenche un déploiement
   - Vérifiez toujours les logs après un push

3. **Base de données** :
   - SQLite = ❌ Ne fonctionne pas sur Vercel
   - PostgreSQL = ✅ Utilisez Vercel Postgres ou Supabase

---

## 📚 Documentation

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [DEPLOYMENT_DATA_ENV.md](./DEPLOYMENT_DATA_ENV.md) - Guide complet sur les données et variables d'environnement
