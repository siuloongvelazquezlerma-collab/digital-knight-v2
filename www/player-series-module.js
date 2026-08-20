
console.log("🚀 player-series-module.js cargado");
import { supabase } from './js/supabaseClient.js';
import {
    saveSeriesProgress,
    loadMostRecentProgress,
    loadProfileInfo,
    initSession
} from './js/sync-supabase.js';
import { registerView } from './js/viewsTracker.js';
window.supabase = supabase;
window.saveSeriesProgress = saveSeriesProgress;
window.loadMostRecentProgress = loadMostRecentProgress;



async function main() {
  await initSession();
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
  let seriesViewRegistered = false;

  video.on('play', async () => {
  if (seriesViewRegistered) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await registerView(
  user.id,
  seriesId,
  'series',
  0
);

await saveSeriesProgress({
  seriesId
});

seriesViewRegistered = true;

    console.log('✅ Vista de serie registrada:', seriesId);

  } catch (error) {
    console.error('❌ Error registrando vista de serie:', error);
  }
});
 

  // 📺 Reanudar episodio más reciente (solo si el usuario aún no inició la reproducción)
  if (resume?.videoUrl && !window.__userStartedPlayback) {
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
