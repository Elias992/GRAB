/**
 * GRAB — Video Downloader
 * Frontend app logic
 * Communique uniquement avec les serverless functions /api/*
 * La clé RapidAPI ne touche JAMAIS ce fichier.
 */

// ── Détection de plateforme ──────────────────────────────────
const PLATFORM_PATTERNS = [
  { name: 'youtube',     regex: /youtube\.com\/watch|youtu\.be\//i,          label: 'YouTube' },
  { name: 'instagram',   regex: /instagram\.com\/(p|reel|tv)\//i,            label: 'Instagram' },
  { name: 'tiktok',      regex: /tiktok\.com\/@.+\/video|vm\.tiktok\.com/i,  label: 'TikTok' },
  { name: 'twitter',     regex: /twitter\.com|x\.com\/.*\/status/i,          label: 'Twitter/X' },
  { name: 'facebook',    regex: /facebook\.com\/(watch|video|reel)|fb\.watch/i, label: 'Facebook' },
  { name: 'reddit',      regex: /reddit\.com\/r\/.+\/comments|v\.redd\.it/i, label: 'Reddit' },
  { name: 'twitch',      regex: /twitch\.tv\/.*\/clip|clips\.twitch\.tv/i,   label: 'Twitch' },
  { name: 'dailymotion', regex: /dailymotion\.com\/video/i,                  label: 'Dailymotion' },
  { name: 'vimeo',       regex: /vimeo\.com\/\d+/i,                          label: 'Vimeo' },
  { name: 'pinterest',   regex: /pinterest\.(com|fr|co\.\w+)\/pin\//i,       label: 'Pinterest' },
  { name: 'snapchat',    regex: /snapchat\.com\/spotlight\//i,               label: 'Snapchat' },
  { name: 'bilibili',    regex: /bilibili\.com\/(video|BV)/i,                label: 'Bilibili' },
];

// Icônes SVG par plateforme (inline pour performance)
const PLATFORM_ICONS = {
  youtube:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.46 3.5 12 3.5 12 3.5s-7.46 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.12 0 12 0 12s0 3.88.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.54 20.5 12 20.5 12 20.5s7.46 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.88 24 12 24 12s0-3.88-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z"/></svg>`,
  instagram:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  tiktok:      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  twitter:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  facebook:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  default:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>`,
};

// ── Éléments DOM ────────────────────────────────────────────
const urlInput       = document.getElementById('urlInput');
const analyzeBtn     = document.getElementById('analyzeBtn');
const platformIcon   = document.getElementById('platformIcon');
const inputWrapper   = document.getElementById('inputWrapper');
const inputError     = document.getElementById('inputError');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText    = document.getElementById('loadingText');
const resultsSection = document.getElementById('resultsSection');
const videoMeta      = document.getElementById('videoMeta');
const formatsGrid    = document.getElementById('formatsGrid');
const historySection = document.getElementById('historySection');
const historyList    = document.getElementById('historyList');
const clearHistoryBtn= document.getElementById('clearHistoryBtn');

// ── État ────────────────────────────────────────────────────
let currentPlatform = null;
let sessionHistory  = JSON.parse(localStorage.getItem('grab_history') || '[]');

// ── Détection plateforme au keystroke ───────────────────────
urlInput.addEventListener('input', () => {
  const url = urlInput.value.trim();
  setError('');

  if (!url) {
    resetPlatformIcon();
    return;
  }

  const detected = detectPlatform(url);
  if (detected) {
    currentPlatform = detected;
    platformIcon.innerHTML = PLATFORM_ICONS[detected.name] || PLATFORM_ICONS.default;
    platformIcon.classList.add('detected');
    inputWrapper.classList.add('has-platform');
  } else {
    currentPlatform = null;
    resetPlatformIcon();
  }
});

// Soumission au Enter
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') analyzeBtn.click();
});

// ── Clic Analyser ───────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    setError('Collez une URL vidéo pour commencer.');
    return;
  }
  if (!isValidUrl(url)) {
    setError('URL invalide. Vérifiez le lien copié.');
    return;
  }
  if (!currentPlatform) {
    setError('Plateforme non reconnue. Consultez les plateformes supportées ci-dessous.');
    return;
  }

  await analyzeUrl(url);
});

// ── Appel API analyze ────────────────────────────────────────
async function analyzeUrl(url) {
  showLoading('Analyse de la vidéo…');
  setError('');
  resultsSection.style.display = 'none';

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Erreur serveur (${res.status})`);
    }

    hideLoading();
    renderResults(data, url);
    addToHistory(url, currentPlatform);

  } catch (err) {
    hideLoading();
    setError(formatError(err.message));
  }
}

// ── Rendu des résultats ──────────────────────────────────────
function renderResults(data, originalUrl) {
  // Métadonnées vidéo
  videoMeta.innerHTML = `
    ${data.thumbnail
      ? `<img class="video-thumb" src="${escapeHtml(data.thumbnail)}" alt="Miniature" loading="lazy" />`
      : ''}
    <div class="video-info">
      <div class="video-title">${escapeHtml(data.title || 'Vidéo sans titre')}</div>
      <div class="video-platform-badge">${escapeHtml(currentPlatform?.label || 'Vidéo')}</div>
    </div>
  `;

  // Cartes formats
  formatsGrid.innerHTML = '';
  const formats = data.formats || [];

  if (formats.length === 0) {
    formatsGrid.innerHTML = `<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.8rem;grid-column:1/-1">Aucun format trouvé pour cette vidéo.</p>`;
  } else {
    formats.forEach((fmt) => {
      const isAudio = fmt.type === 'audio' || fmt.ext === 'mp3' || fmt.ext === 'aac';
      const card = document.createElement('div');
      card.className = `format-card${isAudio ? ' audio' : ''}`;
      card.innerHTML = `
        <div class="format-quality">${escapeHtml(fmt.quality || fmt.ext?.toUpperCase() || '?')}</div>
        <div class="format-type">${escapeHtml(fmt.ext?.toUpperCase() || '?')} · ${isAudio ? 'Audio' : 'Vidéo'}</div>
        ${fmt.filesize ? `<div class="format-size">~${formatSize(fmt.filesize)}</div>` : ''}
        <button class="download-btn" data-url="${escapeHtml(fmt.url)}" data-ext="${escapeHtml(fmt.ext || 'mp4')}">
          ↓ Télécharger
        </button>
      `;
      formatsGrid.appendChild(card);
    });

    // Délégation événements téléchargement
    formatsGrid.addEventListener('click', handleDownloadClick);
  }

  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Téléchargement ───────────────────────────────────────────
function handleDownloadClick(e) {
  const btn = e.target.closest('.download-btn');
  if (!btn) return;

  const downloadUrl = btn.dataset.url;
  const ext = btn.dataset.ext || 'mp4';

  if (!downloadUrl) {
    showToast('Lien indisponible.', 'error');
    return;
  }

  // Téléchargement direct côté client — aucun proxy
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `grab_video.${ext}`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast('Téléchargement démarré ✓', 'success');
}

// ── Historique ───────────────────────────────────────────────
function addToHistory(url, platform) {
  const entry = {
    url,
    platform: platform?.label || 'Inconnu',
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };

  // Déduplique
  sessionHistory = sessionHistory.filter((h) => h.url !== url);
  sessionHistory.unshift(entry);

  // Limite à 20 entrées
  if (sessionHistory.length > 20) sessionHistory.pop();

  localStorage.setItem('grab_history', JSON.stringify(sessionHistory));
  renderHistory();
}

function renderHistory() {
  if (sessionHistory.length === 0) {
    historySection.style.display = 'none';
    return;
  }

  historySection.style.display = 'block';
  historyList.innerHTML = sessionHistory
    .map(
      (h) => `
    <div class="history-item" data-url="${escapeHtml(h.url)}">
      <span class="history-platform">${escapeHtml(h.platform)}</span>
      <span class="history-url">${escapeHtml(h.url)}</span>
      <span class="history-time">${escapeHtml(h.time)}</span>
    </div>
  `
    )
    .join('');

  // Clic sur item historique → re-remplit le champ
  historyList.querySelectorAll('.history-item').forEach((item) => {
    item.addEventListener('click', () => {
      urlInput.value = item.dataset.url;
      urlInput.dispatchEvent(new Event('input'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

clearHistoryBtn.addEventListener('click', () => {
  sessionHistory = [];
  localStorage.removeItem('grab_history');
  historySection.style.display = 'none';
});

// ── Clic sur carte plateforme → pré-remplit placeholder ─────
document.querySelectorAll('.platform-card').forEach((card) => {
  card.addEventListener('click', () => {
    const platform = card.dataset.platform;
    const examples = {
      youtube:     'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      instagram:   'https://www.instagram.com/reel/xxxxx/',
      tiktok:      'https://www.tiktok.com/@user/video/123456',
      twitter:     'https://twitter.com/user/status/123456',
      facebook:    'https://www.facebook.com/watch/?v=123456',
      reddit:      'https://v.redd.it/xxxxx',
      twitch:      'https://clips.twitch.tv/xxxxx',
      dailymotion: 'https://www.dailymotion.com/video/xxxxx',
      vimeo:       'https://vimeo.com/123456789',
      pinterest:   'https://www.pinterest.com/pin/123456/',
      snapchat:    'https://www.snapchat.com/spotlight/xxxxx',
      bilibili:    'https://www.bilibili.com/video/BVxxxxx',
    };
    urlInput.placeholder = examples[platform] || 'Collez votre URL ici…';
    urlInput.focus();
  });
});

// ── Utilitaires ──────────────────────────────────────────────
function detectPlatform(url) {
  return PLATFORM_PATTERNS.find((p) => p.regex.test(url)) || null;
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function resetPlatformIcon() {
  platformIcon.innerHTML = PLATFORM_ICONS.default;
  platformIcon.classList.remove('detected');
  inputWrapper.classList.remove('has-platform');
  currentPlatform = null;
}

function setError(msg) {
  inputError.textContent = msg;
}

function showLoading(msg = 'Chargement…') {
  loadingText.textContent = msg;
  loadingOverlay.style.display = 'flex';
  analyzeBtn.disabled = true;
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
  analyzeBtn.disabled = false;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatError(msg) {
  if (msg?.includes('quota') || msg?.includes('rate limit') || msg?.includes('429')) {
    return 'Quota API atteint. Réessayez dans quelques instants.';
  }
  if (msg?.includes('not supported') || msg?.includes('unsupported')) {
    return 'Cette URL n\'est pas supportée par le service.';
  }
  if (msg?.includes('network') || msg?.includes('fetch') || msg?.includes('Failed')) {
    return 'Erreur réseau. Vérifiez votre connexion.';
  }
  return msg || 'Une erreur est survenue. Réessayez.';
}

// ── Toast ────────────────────────────────────────────────────
let toastTimeout;
function showToast(msg, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  const icon = type === 'success' ? '✓' : '✕';
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span>${escapeHtml(msg)}`;

  clearTimeout(toastTimeout);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
  });
}

// ── Init ─────────────────────────────────────────────────────
renderHistory();
