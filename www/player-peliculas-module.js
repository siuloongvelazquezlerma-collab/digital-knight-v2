import { supabase } from './js/supabaseClient.js';
import {
  loadProfileInfo,
  saveMovieProgress,
  initSession,
  markContentCompletedInSupabase,
  isMovieCompleted
} from './js/sync-supabase.js';
import { registerView } from './viewsTracker.js';

console.log("✅ Supabase listo:", !!supabase);
window.supabase = supabase;
window.saveMovieProgress = saveMovieProgress;
console.log("✅ saveMovieProgress:", saveMovieProgress);

const movieId = window.movieId || 'unknown-id';
const video =
  document.getElementById("video_html5_api") ||
  document.querySelector("#video video");
  console.log("VIDEO:", video);
console.log("TAG:", video?.tagName);
const progressBar = document.getElementById("watchProgressBar");
const restartButton = document.getElementById("restartButton");
let hasStarted = false;

// ☁️ (Eliminado) Supabase ya NO guardaba el progreso cada 5s.
// El progreso es 100% local; Supabase solo registra "lo visto".


(async () => {
  try {

    await initSession();

    const { data: { session } } = await supabase.auth.getSession();

    console.log("🔐 SESIÓN AL INICIAR PLAYER:", session);

    await loadProfileInfo();

    console.log('🧠 Datos cargados desde Supabase y perfil');

  } catch (e) {
    console.warn('⚠️ Error al inicializar sesión o cargar perfil:', e);
  }
})();

// 📌 Restaurar progreso si hay
video.addEventListener("loadedmetadata", () => {

  const savedTime = localStorage.getItem(`progress_${movieId}`);

  if (savedTime) {
    video.currentTime = parseFloat(savedTime);
  }

  const duration = video.duration || 1;
  const currentTime = video.currentTime;

  const percent = (currentTime / duration) * 100;

  if (progressBar) {

    progressBar.firstElementChild?.style.setProperty(
      "width",
      `${percent}%`
    );

    if (currentTime > 5 && currentTime < duration - 5) {
      progressBar.style.display = "block";
      showRestartButton();
    }
  }

});

console.log("🎬 TIMEUPDATE EJECUTANDO");
console.log("🎬 movieId:", movieId);


// 🔁 Guardar progreso
video.addEventListener("timeupdate", async () => {

  const currentTime = video.currentTime;
  const duration = video.duration || 1;
  const percent = (currentTime / duration) * 100;

  // 💾 Guardar progreso continuamente en localStorage
  localStorage.setItem(`progress_${movieId}`, currentTime);
  localStorage.setItem(`duration_${movieId}`, duration);
  localStorage.setItem(`hasStarted_${movieId}`, 'true');


  // 📊 Barra visual
  if (progressBar) {

    progressBar.firstElementChild?.style.setProperty(
      "width",
      `${percent}%`
    );

    if (currentTime > 5 && currentTime < duration - 5) {
      progressBar.style.display = "block";
      showRestartButton();
    }
  }


  // 🔘 Mostrar botón reiniciar
  if (
    currentTime > 5 &&
    currentTime < duration - 5 &&
    restartButton &&
    !restartButton.classList.contains('shown')
  ) {
    showRestartButton();
  }


  // 🎬 Datos completos de la película
  const title =
    document.querySelector(".title")?.textContent?.trim() ||
    document.getElementById("nombre")?.textContent?.trim() ||
    'Sin título';

  const subtitle =
    document.getElementById("episodeSubtitle")?.textContent?.trim() || '';

  const poster =
    document.getElementById("favoritoImagen")?.src || '';

  const link =
    document.getElementById("favoritoEnlace")?.href ||
    window.location.href;


  const movieData = {
    tipo: 'movie',
    id: movieId,
    title,
    subtitle,
    poster,
    link,
    progress: currentTime,
    duration,
    updatedAt: new Date().toISOString()
  };


  // 💾 Guardar objeto completo SOLO en localStorage
  localStorage.setItem(
    `movie_${movieId}`,
    JSON.stringify(movieData)
  );

  console.log("💾 Progreso guardado localmente:", currentTime);

  // ☁️ Eliminado: Supabase NO recibe el progreso (segundos/duration).
  // El registro "visto" (solo el nombre) se hace en el listener de "play".

});

// ⛳ Pantalla completa en el primer play + registrar "lo visto" en Supabase
function getPeliculaVisto() {
  return {
    tipo: 'movie',
    id: movieId,
    title:
      document.querySelector(".title")?.textContent?.trim() ||
      document.getElementById("nombre")?.textContent?.trim() ||
      "Sin título",
    subtitle: document.getElementById("episodeSubtitle")?.textContent?.trim() || '',
    poster: document.getElementById("favoritoImagen")?.src || '',
    link: document.getElementById("favoritoEnlace")?.href || window.location.href
  };
}

video.addEventListener('play', async () => {
  if (!hasStarted) {
    hasStarted = true;
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.msRequestFullscreen) video.msRequestFullscreen();

    // 🔒 No registrar como "visto" si la película ya está completada
    if (isMovieCompleted(movieId)) {
      console.log("🎬 Película ya completada — no se re-guarda en Supabase");
      return;
    }

    // 🔒 Supabase SOLO guarda "lo visto" (nombre de la película), nunca el progreso.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await saveMovieProgress({
          movieId,
          ultimoVisto: getPeliculaVisto()
        });
      }
    } catch (err) {
      console.warn("⚠️ No se pudo registrar la película vista en Supabase:", err);
    }
  }
});

// 🔘 Función para mostrar el botón de reinicio
function showRestartButton() {

  if (!restartButton) {
    console.warn("⚠️ restartButton no existe en esta página");
    return;
  }

  restartButton.style.display = 'flex';
  restartButton.classList.add('shown');

  const spacer = document.getElementById('restartSpacer');

  if (spacer) {
    spacer.style.height = '60px';
  }
}

// 🛰️ Registrar vista al finalizar la película
video.addEventListener('ended', async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Registrar vista en tabla de vistas (solo QUÉ se vio, sin progreso)
    await registerView(
      userId,
      movieId,
      'movie'
    );

    console.log('✅ Vista registrada:', movieId);

    // ✅ Marcar como COMPLETADO en Supabase (la fila SE CONSERVA para estadísticas,
    // pero con completado:true para que NO aparezca en Continuar Viendo en ningún dispositivo)
    const marked = await markContentCompletedInSupabase(`movie_${movieId}`);
    if (marked) {
      console.log('✅ Película marcada como completada:', movieId);
    }

    // Limpiar localStorage de progreso
    localStorage.removeItem(`progress_${movieId}`);
    localStorage.removeItem(`duration_${movieId}`);
    localStorage.removeItem(`hasStarted_${movieId}`);
    localStorage.removeItem(`movie_${movieId}`);

  } catch (err) {
    console.error('❌ Error al finalizar película:', err);
  }
});

// =========================================================
// 🔊 CONTROL DE VOLUMEN – botón + slider debajo de la barra de progreso
// =========================================================
(function initVolumeControl() {
  console.log('[DK-VOLUME] Iniciando control de volumen...');

  const style = document.createElement('style');
  style.textContent = `
    #dk-volume-control { display:flex !important; align-items:center; gap:8px; padding:8px 0; z-index:9999; }
    #dk-volume-icon { cursor:pointer; font-size:22px; user-select:none; color:#fff; }
    #dk-volume-slider-wrap { position:relative; display:none; align-items:center; gap:6px; padding:6px 8px; background:rgba(0,0,0,0.75); border-radius:8px; backdrop-filter:blur(4px); z-index:10000; }
    #dk-volume-slider { width:110px; height:4px; accent-color:#fff; cursor:pointer; }
    #dk-volume-slider-wrap:hover { display:flex !important; }
    #dk-volume-control:hover #dk-volume-slider-wrap { display:flex !important; }
    #dk-player-actions-row { position:relative; display:flex; align-items:center; justify-content:flex-start; min-height:40px; width:100%; pointer-events:auto; }
    #dk-player-actions-row #dk-volume-control { flex:0 0 auto; }
    #dk-player-actions-row .extra-controls { position:absolute; left:50%; transform:translateX(-50%); width:auto; justify-content:center; gap:clamp(18px, 8vw, 150px); margin:0; white-space:nowrap; }
  `;
  document.head.appendChild(style);

  let volWrapper, slider, sliderWrap, volIcon, lastVolume = 1, isDragging = false;

  function getVideoEl() {
    return document.getElementById('video_html5_api') || document.querySelector('#video video') || document.querySelector('video');
  }

  function updateIcon(vol) {
    if (!volIcon) return;
    if (vol <= 0) volIcon.textContent = 'volume_off';
    else if (vol < 0.5) volIcon.textContent = 'volume_down';
    else volIcon.textContent = 'volume_up';
  }

  function syncSlider() {
    const v = getVideoEl();
    if (!v || !slider) return;
    const val = Math.round((v.muted ? 0 : v.volume) * 100);
    slider.value = val;
    updateIcon(v.muted ? 0 : v.volume);
  }

  function toggleVolume() {
    const v = getVideoEl();
    if (!v) return;
    if (v.muted) { v.muted = false; if (lastVolume && lastVolume > 0) v.volume = lastVolume; if (slider) slider.value = Math.round(lastVolume * 100); updateIcon(lastVolume); }
    else { lastVolume = v.volume; v.muted = true; if (slider) slider.value = '0'; updateIcon(0); }
  }

  function createVolumeUI(container) {
    if (document.getElementById('dk-volume-control')) return true;
    volWrapper = document.createElement('div');
    volWrapper.id = 'dk-volume-control';
    volWrapper.style.cssText = 'display:flex !important; align-items:center; gap:8px; padding:8px 0; z-index:9999;';
    volIcon = document.createElement('span');
    volIcon.className = 'material-icons';
    volIcon.id = 'dk-volume-icon';
    volIcon.textContent = 'volume_up';
    volIcon.style.cssText = 'cursor:pointer; font-size:22px; user-select:none;';
    sliderWrap = document.createElement('div');
    sliderWrap.id = 'dk-volume-slider-wrap';
    slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'dk-volume-slider';
    slider.min = '0';
    slider.max = '100';
    slider.value = '100';
    slider.step = '1';
    sliderWrap.appendChild(slider);
    volWrapper.appendChild(volIcon);
    volWrapper.appendChild(sliderWrap);
    const progressContainer = container.querySelector('.progress-container');
    const extraControls = container.querySelector('.extra-controls');
    const actionsRow = document.createElement('div');
    actionsRow.id = 'dk-player-actions-row';
    actionsRow.appendChild(volWrapper);
    if (extraControls) actionsRow.appendChild(extraControls);
    if (progressContainer) progressContainer.insertAdjacentElement('afterend', actionsRow);
    else container.appendChild(actionsRow);
    slider.addEventListener('input', (e) => { const v = getVideoEl(); if (!v) return; isDragging = true; const val = parseInt(e.target.value, 10) / 100; v.muted = false; v.volume = val; lastVolume = val; updateIcon(val); });
    slider.addEventListener('change', () => { isDragging = false; });
    volIcon.addEventListener('click', toggleVolume);
    const v = getVideoEl();
    if (v) { v.addEventListener('volumechange', syncSlider); }
    volWrapper.addEventListener('mouseenter', () => { if (sliderWrap) sliderWrap.style.display = 'flex'; });
    volWrapper.addEventListener('mouseleave', () => { if (!isDragging && sliderWrap) sliderWrap.style.display = 'none'; });
    const cur = getVideoEl();
    if (cur) updateIcon(cur.muted ? 0 : cur.volume);
    console.log('[DK-VOLUME] UI creado e insertado');
    return true;
  }

  function tryCreate() {
    if (document.getElementById('dk-volume-control')) return true;
    let container = document.querySelector('#controls .bottom-bar');
    if (!container) container = document.querySelector('.bottom-bar');
    if (!container) container = document.body;
    if (!container) return false;
    return createVolumeUI(container);
  }

  if (tryCreate()) return;

  const observer = new MutationObserver(() => { if (tryCreate()) { observer.disconnect(); } });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  setTimeout(() => { if (!document.getElementById('dk-volume-control')) { tryCreate(); } }, 1500);
})();
// =========================================================
