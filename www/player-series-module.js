
console.log("🚀 player-series-module.js cargado");
import { supabase } from './js/supabaseClient.js';
import {
    saveSeriesProgress,
    loadMostRecentProgress,
    loadProfileInfo,
    initSession
} from './js/sync-supabase.js';
import { registerView } from './viewsTracker.js';
window.supabase = supabase;
window.saveSeriesProgress = saveSeriesProgress;
window.loadMostRecentProgress = loadMostRecentProgress;

// ---------- Inicializar sesión/perfil (sin bloquear la reproducción) ----------
(async () => {
  try {
    await initSession();
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    await loadProfileInfo();
  } catch (e) {
    console.warn('⚠️ Error al inicializar sesión o cargar perfil:', e);
  }
})();

// ---------- Helpers ----------
function getPlayer() {
  return (window.videojs && window.videojs('video')) || null;
}

function getSeriesName() {
  if (window.seriesName) return window.seriesName;
  const selectors = ['#nombre', '.series-title', '.title', '.hero-title', 'h1'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const txt = (el && (el.innerText || el.textContent || '')).trim();
    if (txt) return txt;
  }
  // Fallback: el <title> de la página (p.ej. "Among Us")
  if (document.title) {
    return document.title.replace(/\s*[-–|]\s*(Digital Knight|Ver).*$/i, '').trim() || document.title;
  }
  return 'Serie';
}

function getCurrentEpisode() {
  const player = getPlayer();
  const url = player && typeof player.currentSrc === 'function' ? player.currentSrc() : '';
  if (url && typeof window.findEpisodeByUrl === 'function') {
    try { return window.findEpisodeByUrl(url); } catch (e) { /* ignorar */ }
  }
  return null;
}

function getLink() {
  return document.getElementById('favoritoEnlace')?.href || window.location.href;
}

// ---------- Registrar "lo visto" al reproducir (ver ahora / playlist) ----------
// 🔒 Supabase SOLO guarda el NOMBRE de la serie/episodio (visto),
// nunca el progreso (segundos/duration: eso vive solo en localStorage).
let seriesViewRegistered = false;

async function registrarSerieVista() {
  if (seriesViewRegistered) return;

  const seriesId = window.seriesId;
  if (!seriesId) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const seriesName = getSeriesName();
    const ep = getCurrentEpisode();

    // Contador de vistas (solo QUÉ se vio, sin progreso)
    await registerView(user.id, seriesId, 'series');

    await saveSeriesProgress({
      seriesId,
      seriesName,
      episodeName: ep?.episodeCode || ep?.hiddenCode || ep?.title || '',
      poster: ep?.thumbnail || '',
      link: getLink()
    });

    seriesViewRegistered = true;
    console.log('✅ Serie guardada como vista en Supabase:', seriesId);
  } catch (error) {
    console.error('❌ Error registrando vista de serie:', error);
  }
}

// Escuchar el evento "play" INMEDIATAMENTE (no esperar a main()).
// Así no se pierde el primer play del botón "Ver ahora" o de la playlist.
const videoEl =
  document.getElementById('video_html5_api') ||
  document.querySelector('#video video') ||
  document.querySelector('video');
if (videoEl) {
  videoEl.addEventListener('play', registrarSerieVista);
}

const vjs = getPlayer();
if (vjs && typeof vjs.on === 'function') {
  vjs.on('play', registrarSerieVista);
}

// ---------- Mostrar el reproductor ----------
window.addEventListener('DOMContentLoaded', () => {
  const playerContainer = document.getElementById('player-container');
  if (playerContainer) playerContainer.style.display = 'block';
});

