import { loadMostRecentProgress, syncData, loadProfileInfo, throttledSyncData } from './js/sync-supabase.js';
import { onPlayEpisode } from './viewsTracker.js';
import { supabase } from './js/sync-supabase.js';

async function main() {
  await new Promise(resolve => window.requestAnimationFrame(resolve));
  await loadProfileInfo();

  if (typeof syncProgressFromSupabase === 'function') {
    await syncProgressFromSupabase();
  }

  const seriesId = window.seriesId;
  if (!seriesId) return;

  const resume = await loadMostRecentProgress(seriesId);

  // 🎥 Inicializa el reproductor
  const video = videojs('video');
  const videoElement = video.el().getElementsByTagName('video')[0];

  // 📺 Reanudar episodio más reciente
  if (resume?.videoUrl) {
    console.log('⏯️ Reanudando desde episodio:', resume.videoUrl);
    video.src({ src: resume.videoUrl, type: 'video/mp4' });

    video.on('loadedmetadata', () => {
      if (typeof resume.progress === 'number') {
        video.currentTime(resume.progress);
      }
      showPlayer();
    });
  } else {
    showPlayer();
  }

  // 🎬 REGISTRA CUANDO EL USUARIO EMPIEZA A VER
  video.on('play', async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("⚠️ No hay usuario logueado, no se registrará la reproducción.");
        return;
      }

      const titulo = document.querySelector(".title")?.textContent?.trim() || 'Episodio sin título';
      const episodio = video.currentSrc() || 'episodio-desconocido';
      const now = new Date().toISOString();

      await supabase.from('reproducciones_series').insert({
        id: user.id,
        series_id: seriesId,
        episodio,
        titulo,
        visto_en: now,
        progreso: video.currentTime() || 0,
        terminado: false
      });

      console.log(`🎬 Reproducción registrada en Supabase: ${titulo}`);
    } catch (err) {
      console.warn("❌ Error registrando reproducción:", err);
    }
  });

  // 🔄 Guarda progreso y registra vista al 80%
  let viewRegistered = false;
  video.on('timeupdate', async () => {
    const currentTime = video.currentTime();
    const duration = video.duration() || 1;

    // ⏱️ Sincroniza progreso con Supabase
    throttledSyncData(seriesId);

    // 🏆 Marca como “vista” si llegó al 80%
    if (!viewRegistered && currentTime / duration >= 0.8) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const currentEpisodeCode = videoElement.getAttribute('data-episode-code') || 'unknown';
          await onPlayEpisode(session.user.id, seriesId, currentEpisodeCode, Math.floor(currentTime));
          console.log(`✅ Vista registrada (80%) en Supabase para serie ${seriesId}`);
          viewRegistered = true;
        }
      } catch (err) {
        console.error('❌ Error registrando vista en Supabase:', err);
      }
    }
  });

  // 🏁 MARCAR EPISODIO COMO TERMINADO AL FINAL
  video.on('ended', async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('reproducciones_series')
        .update({ terminado: true })
        .eq('id', user.id)
        .eq('series_id', seriesId)
        .eq('episodio', video.currentSrc());

      console.log("🏁 Episodio marcado como terminado en Supabase.");
    } catch (err) {
      console.error("❌ Error al marcar episodio como terminado:", err);
    }
  });

  // 🔄 Sincronizar antes de salir de la página
  window.addEventListener('beforeunload', () => {
    if (typeof syncData === 'function') {
      console.log('👋 Usuario cerrando la página, sincronizando...');
      const dataToSync = syncData(seriesId, { async: false });
      if (navigator.sendBeacon && dataToSync) {
        navigator.sendBeacon('/sync-endpoint', JSON.stringify(dataToSync));
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', main);

// --- Mostrar el reproductor ---
function showPlayer() {
  const playerContainer = document.getElementById('player-container');
  if (playerContainer) playerContainer.style.display = 'block';
}
