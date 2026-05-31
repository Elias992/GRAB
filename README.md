# GRAB — Video Downloader

Téléchargeur de vidéos universel déployé sur Vercel, alimenté par RapidAPI.  
Supporte YouTube, Instagram, TikTok, Twitter/X, Facebook, Reddit, Twitch, Dailymotion, Vimeo, Pinterest, Snapchat, Bilibili.

---

## 🗂️ Structure du projet

```
/
├── api/
│   ├── analyze.js      ← Serverless Function : analyse une URL, retourne les formats
│   └── download.js     ← Serverless Function : valide et retourne le lien de téléchargement
├── public/
│   ├── index.html      ← Interface utilisateur
│   ├── style.css       ← Styles (thème sombre, design retro-futuriste)
│   └── app.js          ← Logique frontend (détection plateforme, appels API, historique)
├── vercel.json         ← Configuration Vercel (rewrites, headers CORS)
├── .env.example        ← Modèle variables d'environnement
├── .gitignore
└── README.md
```

---

## ✅ Prérequis

- **Node.js** ≥ 18 (pour `vercel dev` en local)
- **Compte Vercel** : [vercel.com](https://vercel.com) (gratuit)
- **Compte RapidAPI** : [rapidapi.com](https://rapidapi.com) (gratuit avec limites)

---

## 1. Obtenir une clé API RapidAPI

1. Créez un compte sur [RapidAPI](https://rapidapi.com)
2. Cherchez **"Social Media Video Downloader"** et souscrivez au plan gratuit  
   Lien direct : https://rapidapi.com/o.a.r.3.n.o.k/api/social-media-video-downloader
3. Copiez votre **`X-RapidAPI-Key`** depuis le dashboard
4. Notez le **`X-RapidAPI-Host`** : `social-media-video-downloader.p.rapidapi.com`

> **Alternatives** si cette API est indisponible :
> - [All Video Downloader API](https://rapidapi.com/search/video%20downloader) → `all-video-downloader1.p.rapidapi.com`
> - Cherchez "video downloader" sur RapidAPI et adaptez `RAPIDAPI_HOST` dans `.env`

---

## 2. Installation locale

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USERNAME/grab-video-downloader.git
cd grab-video-downloader

# Créer le fichier .env
cp .env.example .env
```

Éditez `.env` :
```
RAPIDAPI_KEY=votre_cle_rapidapi
RAPIDAPI_HOST=social-media-video-downloader.p.rapidapi.com
```

---

## 3. Lancer en local avec Vercel Dev

```bash
# Installer la CLI Vercel (une seule fois)
npm install -g vercel

# Lancer le serveur de développement local
vercel dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

> `vercel dev` simule l'environnement Vercel complet (serverless functions + fichiers statiques)
> et lit automatiquement votre fichier `.env`.

---

## 4. Déployer sur Vercel

### Option A — Via CLI (recommandé)

```bash
# 1. Se connecter à Vercel
vercel login

# 2. Déployer
vercel

# 3. Lors du premier déploiement, ajouter la variable d'environnement :
vercel env add RAPIDAPI_KEY
# → Entrez votre clé quand demandé

vercel env add RAPIDAPI_HOST
# → social-media-video-downloader.p.rapidapi.com

# 4. Re-déployer pour prendre en compte les variables
vercel --prod
```

### Option B — Via l'interface web Vercel

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Importez votre repo GitHub
3. Dans **"Environment Variables"**, ajoutez :
   - `RAPIDAPI_KEY` → votre clé
   - `RAPIDAPI_HOST` → `social-media-video-downloader.p.rapidapi.com`
4. Cliquez **Deploy**

---

## 5. Lier à un repo GitHub (pour déploiements automatiques)

```bash
# Dans le dossier du projet
git init
git add .
git commit -m "🚀 Initial commit — GRAB video downloader"

# Créer le repo sur GitHub (via gh CLI ou l'interface web)
gh repo create grab-video-downloader --public --source=. --push

# OU manuellement :
git remote add origin https://github.com/VOTRE_USERNAME/grab-video-downloader.git
git branch -M main
git push -u origin main
```

Ensuite, dans Vercel, importez le repo : chaque `git push` déclenchera un déploiement automatique.

---

## 🔧 Adapter à une autre API RapidAPI

Si vous changez d'API, modifiez `api/analyze.js` :

1. Changez `RAPIDAPI_HOST` dans `.env`
2. Adaptez l'URL de l'API dans la fonction `handler` :
   ```js
   const apiUrl = `https://${apiHost}/VOTRE_ENDPOINT?url=${encodeURIComponent(url)}`;
   ```
3. Adaptez `normalizeFormats()` selon la structure de réponse de la nouvelle API

---

## ⚠️ Limites connues

| Contrainte | Détail |
|---|---|
| Timeout Vercel (gratuit) | 10s — suffisant pour la plupart des requêtes |
| Rate limit intégré | 15 req/min/IP (réinitialisé aux cold starts) |
| Pas de proxy fichier | Le téléchargement se fait depuis le CDN source |
| Quota RapidAPI | Selon votre plan (gratuit ~500 req/mois selon l'API) |

---

## ⚖️ Mentions légales

Ce projet est destiné à un **usage personnel uniquement**.  
Respectez les droits d'auteur et les conditions d'utilisation des plateformes concernées.  
L'utilisation pour du scraping commercial ou la redistribution de contenu protégé est interdite.

---

## 🐛 Dépannage

**"Configuration serveur incomplète"**  
→ La variable `RAPIDAPI_KEY` n'est pas définie dans les variables d'environnement Vercel.

**"Quota API dépassé"**  
→ Vous avez atteint la limite de votre plan RapidAPI. Upgradez ou attendez la réinitialisation.

**"Aucun format trouvé"**  
→ La vidéo est peut-être privée, géo-restreinte, ou l'API ne supporte pas cette URL précise.

**Téléchargement bloqué par le navigateur**  
→ Certains navigateurs bloquent les téléchargements cross-origin. Essayez Firefox ou désactivez votre bloqueur de publicités.
