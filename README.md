# AZZ&CO LABS - Site Web Officiel

Site web moderne et interactif pour présenter AZZ&CO LABS, ses produits et sa mission.

## 🚀 Caractéristiques

- **Design moderne et responsive** - S'adapte à tous les écrans (mobile, tablette, desktop)
- **Animations fluides** - Effets de scroll, transitions et animations interactives
- **Navigation intuitive** - Menu fixe avec scroll smooth vers les sections
- **Sections principales** :
  - **Accueil** - Présentation de l'entreprise avec hero section animée
  - **Mission** - Philosophie et engagement de l'entreprise
  - **JobBoat** - Présentation de l'application web et mobile avec démos
  - **OutWings** - Page d'entrée bloquée avec message confidentiel
  - **Contact** - Formulaire de contact et informations de contact

## 📁 Structure des Fichiers

```
azzco-website/
├── index.html      # Structure HTML principale
├── styles.css      # Styles CSS avec design moderne
├── script.js       # Interactivité et animations JavaScript
└── README.md       # Documentation
```

## 🎨 Design

- **Couleurs principales** : Dégradés violets/bleus modernes
- **Typographie** : Inter (Google Fonts)
- **Style** : Glassmorphism, gradients, ombres douces
- **Animations** : Scroll reveal, parallax, hover effects

## 📱 Responsive Design

Le site est entièrement responsive avec des breakpoints pour :
- Desktop (1200px+)
- Tablette (768px - 1200px)
- Mobile (< 768px)

## 🔧 Utilisation

1. Ouvrez `index.html` dans un navigateur web moderne
2. Ou servez les fichiers via un serveur web local :
   ```bash
   # Avec Python
   python -m http.server 8000
   
   # Avec Node.js (http-server)
   npx http-server
   ```

## 📝 Sections du Site

### Accueil
Section hero avec présentation de l'entreprise, animations flottantes et call-to-action.

### Mission
Trois cartes expliquant la philosophie, l'engagement et la vision de l'entreprise. Badge de statut indiquant la phase actuelle (paperwork).

### JobBoat
- **Vue d'ensemble** : Description complète de la plateforme
- **Application Web** : 4 démos (Jupiter Room, Auto-Apply Hub, Mission Control, Web3 Portal)
- **Application Mobile** : 4 démos (Feed Social, Shorts, Jobs Swipe, Create Content)

### OutWings
Page d'entrée bloquée avec :
- Icône de cadenas
- Message "Programme Confidentiel"
- Note expliquant que l'app n'est pas encore publique
- Touch japonais "つづく" (à suivre)

### Contact
- **Informations de contact** :
  - Email: azerrached3@gmail.com
  - Téléphone: +33 6 02 56 02 29
  - LinkedIn: Azer Rached
  - Liens: Linktree
- **Formulaire de contact** : Ouvre le client email par défaut

## 🎯 Fonctionnalités Interactives

- **Navigation fixe** qui change d'apparence au scroll
- **Menu hamburger** pour mobile
- **Scroll smooth** vers les sections
- **Animations au scroll** (fade-in, slide-up)
- **Effet parallax** sur la section hero
- **Hover effects** sur les cartes et boutons
- **Formulaire de contact** avec validation

## 🌐 Compatibilité Navigateurs

- Chrome/Edge (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📸 Placeholders pour Screenshots

Les sections de démo utilisent actuellement des placeholders avec icônes. Pour ajouter de vraies captures d'écran :

1. Remplacez les `.demo-placeholder` par des `<img>` tags
2. Ajoutez vos screenshots dans un dossier `images/`
3. Mettez à jour les chemins dans `index.html`

Exemple :
```html
<div class="demo-placeholder">
    <img src="images/jobboat-jupiter-room.png" alt="Jupiter Room">
</div>
```

## 🔄 Mises à Jour Futures

- [ ] Ajouter de vraies captures d'écran des applications
- [ ] Intégrer un système de newsletter
- [ ] Ajouter un blog section
- [ ] Intégrer les réseaux sociaux
- [ ] Ajouter des analytics (Google Analytics)

## 📧 Contact

Pour toute question ou suggestion concernant le site web :
- Email: azerrached3@gmail.com
- LinkedIn: [Azer Rached](https://www.linkedin.com/in/azer-rached-239258377/)

---

© 2025 AZZ&CO LABS. Tous droits réservés.