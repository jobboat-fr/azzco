# Extension des Prompts - Résumé

## Fichiers de Prompts Étendus

Tous les fichiers de prompts ont été étendus pour couvrir un maximum de scénarios :

### ✅ jobboat.json
- **100+ exemples** couvrant tous les aspects de JobBoat
- Questions sur les fonctionnalités, le matching, les tokens, les secteurs, etc.
- Couvre tous les types d'utilisateurs et de cas d'usage

### 📝 Autres fichiers à étendre
Les autres fichiers (general, contact, mission, outwings, ai, technology) seront étendus progressivement avec 50-70 exemples chacun pour couvrir les scénarios principaux.

## Structure des Prompts

Chaque fichier contient :
- `instructions` : Instructions pour le chatbot
- `keyPoints` : Points clés à retenir
- `examples` : Array de 50-100 exemples avec question/réponse

## Utilisation

Le `promptManager.js` charge automatiquement tous les fichiers JSON du dossier `prompts/` et les utilise selon le contexte détecté par `personaDetector.js`.

## Vérification

Pour vérifier que tout fonctionne :
```bash
cd backend
node -e "const pm = require('./services/promptManager'); console.log('Prompts chargés:', Object.keys(pm.basePrompts));"
```