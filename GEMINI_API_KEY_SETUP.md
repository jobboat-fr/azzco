# 🔑 Configuration de la Clé API Gemini

## ⚠️ PROBLÈME RÉSOLU

Votre ancienne clé API Gemini a été **désactivée par Google** car elle était exposée publiquement dans le fichier `vercel.env.example`.

## ✅ SOLUTION - Obtenir une Nouvelle Clé

### Étape 1: Créer une Nouvelle Clé API

1. Allez sur **Google AI Studio**: https://aistudio.google.com/apikey
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. Sélectionnez un projet Google Cloud (ou créez-en un nouveau)
5. **Copiez la clé générée** (elle commence par `AIza...`)

### Étape 2: Configurer dans Vercel

1. Allez sur votre **Vercel Dashboard**: https://vercel.com/dashboard
2. Sélectionnez le projet **azzco-website**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez la variable:
   - **Name**: `GOOGLE_AI_API_KEY`
   - **Value**: `VOTRE_NOUVELLE_CLE_ICI` (collez la clé que vous venez de créer)
   - **Environments**: Cochez ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Cliquez sur **Save**

### Étape 3: Redéployer

1. Dans Vercel Dashboard, allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**
4. Attendez que le déploiement se termine

### Étape 4: Tester

1. Allez sur https://azzcolabs.business/contact.html
2. Testez le chatbot
3. Vérifiez que les messages fonctionnent

## 🔒 SÉCURITÉ - Ne Jamais Exposer la Clé!

### ❌ À NE JAMAIS FAIRE:
- ❌ Commiter la clé dans Git
- ❌ Mettre la clé dans le code source
- ❌ Partager la clé publiquement
- ❌ Mettre la clé dans des fichiers commités

### ✅ BONNES PRATIQUES:
- ✅ Utiliser uniquement les **Environment Variables** de Vercel
- ✅ Utiliser des placeholders dans les fichiers d'exemple (`YOUR_KEY_HERE`)
- ✅ Vérifier que `.gitignore` exclut les fichiers `.env`
- ✅ Utiliser des clés différentes pour dev/prod si possible

## 📝 Vérification

Pour vérifier que la clé est bien configurée:

1. Dans Vercel Dashboard → Settings → Environment Variables
2. Vérifiez que `GOOGLE_AI_API_KEY` existe
3. Vérifiez que la valeur commence par `AIza...`
4. Vérifiez que les 3 environnements sont cochés

## 🆘 En Cas de Problème

Si vous obtenez encore l'erreur `403 - API key was reported as leaked`:

1. **Générez une NOUVELLE clé** (l'ancienne est définitivement désactivée)
2. **Supprimez l'ancienne** dans Vercel Environment Variables
3. **Ajoutez la nouvelle** clé
4. **Redéployez** l'application

---

**Dernière mise à jour**: 28 Décembre 2025
