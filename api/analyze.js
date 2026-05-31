/**
 * /api/analyze.js — Vercel Serverless Function
 *
 * Reçoit : POST { url: string }
 * Retourne : { title, thumbnail, formats: [{ quality, ext, type, url, filesize }] }
 *
 * La clé RapidAPI est stockée dans RAPIDAPI_KEY (variable d'environnement Vercel).
 * Elle n'est JAMAIS exposée au frontend.
 *
 * API utilisée : Social Media Video Downloader (social-media-video-downloader.p.rapidapi.com)
 * https://rapidapi.com/o.a.r.3.n.o.k/api/social-media-video-downloader
 */

// Rate limiting simple en mémoire (remis à zéro à chaque cold start serverless)
const requestCounts = new Map();
const RATE_LIMIT    = 15;   // requêtes max par IP par fenêtre
const WINDOW_MS     = 60_000; // fenêtre de 1 minute

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Méthode non autorisée' });

  // ── Rate limiting ────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Trop de requêtes. Attendez une minute avant de réessayer.' });
  }

  // ── Validation de l'URL ──────────────────────────────────────
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL manquante ou invalide.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'URL malformée.' });
  }

  // ── Clé API ──────────────────────────────────────────────────
  const apiKey  = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || 'social-media-video-downloader.p.rapidapi.com';

  if (!apiKey) {
    console.error('[analyze] RAPIDAPI_KEY manquante — configurez la variable d\'environnement Vercel');
    return res.status(500).json({ error: 'Configuration serveur incomplète. Contactez l\'administrateur.' });
  }

  // ── Appel RapidAPI ───────────────────────────────────────────
  try {
    const apiUrl = `https://${apiHost}/smvd/get/all?url=${encodeURIComponent(url)}`;

    const apiRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key':  apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    // Gestion quota dépassé
    if (apiRes.status === 429) {
      return res.status(429).json({ error: 'Quota API dépassé. Réessayez dans quelques instants.' });
    }

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      console.error('[analyze] API error:', apiRes.status, errText);
      return res.status(502).json({ error: `Service externe indisponible (${apiRes.status}).` });
    }

    const data = await apiRes.json();

    // ── Normalisation de la réponse ─────────────────────────
    // L'API retourne des formats variés selon la plateforme.
    // On normalise en un tableau de formats standard.
    const formats = normalizeFormats(data);

    if (formats.length === 0) {
      return res.status(422).json({ error: 'Aucun format disponible pour cette URL. Elle est peut-être privée ou expirée.' });
    }

    return res.status(200).json({
      title:     data.title     || data.name         || 'Vidéo sans titre',
      thumbnail: data.thumbnail || data.picture      || data.thumbnail_url || null,
      formats,
    });

  } catch (err) {
    console.error('[analyze] Erreur:', err);
    return res.status(500).json({ error: 'Erreur interne. Réessayez.' });
  }
}

/**
 * Normalise la réponse de l'API vers un tableau de formats uniforme.
 * Compatible avec "Social Download All In One" (champ `medias`).
 */
function normalizeFormats(data) {
  const formats = [];

  const links = data.medias || data.links || data.formats || [];

  links.forEach((item) => {
    const isAudio  = item.type === 'audio' || item.extension === 'mp3' || item.extension === 'aac';
    const ext      = item.extension || (isAudio ? 'mp3' : 'mp4');
    const url      = item.url || item.link || '';
    if (!url) return;

    // Libellé qualité lisible
    let quality;
    if (isAudio) {
      quality = 'MP3';
    } else if (item.quality) {
      // ex: "hd_no_watermark" → "HD", "no_watermark" → "SD", "watermark" → "SD ⚠"
      const q = item.quality;
      if (q.includes('hd'))        quality = item.width ? `${item.width}p` : 'HD';
      else if (q === 'watermark')  quality = 'SD ⚠';
      else                         quality = item.width ? `${item.width}p` : 'SD';
    } else {
      quality = item.width ? `${item.width}p` : 'HD';
    }

    formats.push({
      quality,
      ext,
      type:     isAudio ? 'audio' : 'video',
      url,
      filesize: item.data_size || item.filesize || null,
    });
  });

  // Certaines APIs retournent directement un url HD et SD
  if (formats.length === 0) {
    if (data.url_hd || data.hd_url) {
      formats.push({ quality: '1080p', ext: 'mp4', type: 'video', url: data.url_hd || data.hd_url });
    }
    if (data.url_sd || data.sd_url || data.url) {
      formats.push({ quality: '720p', ext: 'mp4', type: 'video', url: data.url_sd || data.sd_url || data.url });
    }
    if (data.audio_url || data.mp3_url) {
      formats.push({ quality: 'MP3', ext: 'mp3', type: 'audio', url: data.audio_url || data.mp3_url });
    }
  }

  return formats;
}

/**
 * Rate limiting simple côté serverless.
 * Note : remis à zéro à chaque cold start — protection contre les abus légers uniquement.
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = requestCounts.get(ip) || { count: 0, start: now };

  if (now - entry.start > WINDOW_MS) {
    requestCounts.set(ip, { count: 1, start: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  requestCounts.set(ip, entry);
  return true;
}
