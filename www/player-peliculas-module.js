import { supabase } from './js/supabaseClient.js';
import {
  loadProfileInfo,
  saveMovieProgress,
  initSession,
  deleteProgressFromSupabase,
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

    // 🗑️ Marcar como completada: borrar de la tabla progresos de Supabase
    // para que NO aparezca en "Continuar Viendo" al volver a cargar
    const deleted = await deleteProgressFromSupabase(movieId);
    if (deleted) {
      console.log('🗑️ Película borrada de "Continuar Viendo" en Supabase:', movieId);
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
