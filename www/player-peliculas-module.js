import { supabase } from './js/supabaseClient.js';
import { throttledSyncData, loadData, loadProfileInfo } from './js/sync-supabase.js';
import { registerView } from './viewsTracker.js';

console.log("✅ Supabase listo:", !!supabase);

const movieId = window.movieId || 'unknown-id';
const video = document.getElementById("video");
const progressBar = document.getElementById("watchProgressBar");
const restartButton = document.getElementById("restartButton");
let hasStarted = false;

(async () => {
  try {
    await loadData();
    await loadProfileInfo();
    console.log('🧠 Datos cargados desde Supabase y perfil');
  } catch (e) {
    console.warn('⚠️ Error al cargar datos desde Supabase o perfil:', e);
  }
})();

// 📌 Restaurar progreso si hay
video.addEventListener("loadedmetadata", () => {
  const savedTime = localStorage.getItem(`progress_${movieId}`);
  if (savedTime) video.currentTime = parseFloat(savedTime);

  const duration = video.duration || 1;
  const currentTime = video.currentTime;

  const percent = (currentTime / duration) * 100;
  progressBar.firstElementChild?.style.setProperty("width", `${percent}%`);

  if (currentTime > 5 && currentTime < duration - 5) {
    progressBar.style.display = "block";
    showRestartButton();
  }

  // 🔄 Sincronizar apenas cargue
  throttledSyncData(movieId);
});

// 🔁 Guardar progreso y sincronizar
video.addEventListener("timeupdate", () => {
  const currentTime = video.currentTime;
  const duration = video.duration || 1;

  localStorage.setItem(`progress_${movieId}`, currentTime);
  localStorage.setItem(`duration_${movieId}`, duration);
  localStorage.setItem(`hasStarted_${movieId}`, 'true');

  // Barra visual
  if (progressBar) {
    const percent = (currentTime / duration) * 100;
    progressBar.firstElementChild?.style.setProperty("width", `${percent}%`);
    if (
      currentTime > 5 &&
      currentTime < duration - 0.5 &&
      progressBar.style.display !== "block"
    ) {
      progressBar.style.display = "block";
    }
  }

  // Mostrar botón reiniciar
  if (
    currentTime > 5 &&
    currentTime < duration - 5 &&
    !restartButton.classList.contains('shown')
  ) {
    showRestartButton();
  }

  // Guardar objeto completo de la película
  const title =
    document.querySelector(".title")?.textContent?.trim() ||
    document.getElementById("nombre")?.textContent?.trim() ||
    'Sin título';

  const subtitle =
    document.getElementById("episodeSubtitle")?.textContent?.trim() || '';

  const poster =
    document.getElementById("favoritoImagen")?.src || '';

  const link =
    document.getElementById("favoritoEnlace")?.href || window.location.href;

  const movieData = {
    tipo: 'movie',
    title,
    subtitle,
    poster,
    link,
    progress: currentTime,
    duration
  };

  localStorage.setItem(`movie_${movieId}`, JSON.stringify(movieData));

  // 🔄 Sincronizar con Supabase
  throttledSyncData(movieId);
});

// ⛳ Pantalla completa en el primer play
video.addEventListener('play', async () => {
  if (!hasStarted) {
    hasStarted = true;
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.msRequestFullscreen) video.msRequestFullscreen();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return console.warn("⚠️ No hay usuario logueado.");

    const titulo =
      document.querySelector(".title")?.textContent?.trim() || 'Sin título';

    await supabase.from('reproducciones').insert({
      id: user.id,
      movie_id: movieId,
      titulo,
      visto_en: new Date().toISOString(),
      progreso: video.currentTime || 0,
      terminado: false
    });

    console.log(`🎬 Reproducción registrada: ${titulo}`);
  } catch (err) {
    console.warn("❌ Error registrando reproducción:", err);
  }
});

// 🔘 Función para mostrar el botón de reinicio
function showRestartButton() {
  restartButton.style.display = 'flex';
  restartButton.classList.add('shown');
  const spacer = document.getElementById('restartSpacer');
  if (spacer) spacer.style.height = '60px';
}

// 🛰️ Registrar vista al finalizar la película
video.addEventListener('ended', async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Registrar vista en tabla de vistas
    await registerView(
      userId,
      movieId,
      'movie',
      Math.floor(video.duration)
    );

    console.log('✅ Vista registrada:', movieId);

    // Marcar como terminada
    await supabase
      .from('reproducciones')
      .update({ terminado: true })
      .eq('id', userId)
      .eq('movie_id', movieId);

    console.log('🏁 Película marcada como terminada.');

    // Última sincronización
    throttledSyncData(movieId);
  } catch (err) {
    console.error('❌ Error al finalizar película:', err);
  }
});
