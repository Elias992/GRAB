/**
 * /api/download.js — Vercel Serverless Function
 *
 * Reçoit : POST { url: string, format: string }
 * Retourne : { downloadUrl: string, filename: string }
 *
 * Ce endpoint valide et sécurise les URL de téléchargement avant de les transmettre au client.
 * Le téléchargement réel se fait côté client depuis le CDN source (pas de proxy de fichier).
 *
 * Note : Pour la plupart des cas, l'URL directe est déjà retournée par /api/analyze.
 * Ce endpoint est utile pour des cas où un deuxième appel API est nécessaire
 * (ex : certaines APIs retournent un token à échanger contre une URL réelle).
 */

// Domaines autorisés comme sources de téléchargement (sécurité basique)
const ALLOWED_DOWNLOAD_DOMAINS = [
  'googlevideo.com',
  'cdninstagram.com',
  'video.twimg.com',
  'v16-webapp.tiktok.com',
  'v19-webapp.tiktok.com',
  'v.redd.it',
  'facebook.com',
  'fbcdn.net',
  'clips.twitch.tv',
  'secure.twitch.tv',
  'dailymotion.com',
  'vimeo.com',
  'akamaized.net',
  'cloudfront.net',
  'r.cloudstorage.com',
  'snapchat.com',
  'bilibili.com',
  // Hébergements CDN génériques
  'cdn.discordapp.com',
  'storage.googleapis.com',
  'amazonaws.com',
];

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Méthode non autorisée' });

  const { url, format } = req.body || {};

  // ── Validation ───────────────────────────────────────────────
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL de téléchargement manquante.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Protocole non autorisé');
  } catch {
    return res.status(400).json({ error: 'URL de téléchargement invalide.' });
  }

  // ── Vérification domaine (protection basique SSRF) ───────────
  // Désactivée en production si l'API retourne des CDN variés — décommentez selon vos besoins
  /*
  const host = parsedUrl.hostname;
  const isAllowed = ALLOWED_DOWNLOAD_DOMAINS.some(
    (domain) => host === domain || host.endsWith('.' + domain)
  );
  if (!isAllowed) {
    return res.status(403).json({ error: 'Domaine source non autorisé.' });
  }
  */

  // ── Génération du nom de fichier ─────────────────────────────
  const ext      = format || guessExtension(url) || 'mp4';
  const filename = `grab_video_${Date.now()}.${ext}`;

  // Retourne l'URL directe pour téléchargement côté client
  return res.status(200).json({
    downloadUrl: url,
    filename,
  });
}

/**
 * Devine l'extension depuis l'URL.
 */
function guessExtension(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'mp3', 'aac', 'm4a', 'm4v', 'mov'].includes(ext)) return ext;
  } catch {}
  return 'mp4';
}
