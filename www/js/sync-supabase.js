// ================================
// 🔗 Cliente Supabase (UNO SOLO)
// ================================
import { supabase } from './supabaseClient.js';

// ================================
// 🧼 Limpiar datos al cambiar usuario
// (solo perfil local, nada más)
// ================================
function clearUserProfileFromLocalStorage() {
  localStorage.removeItem('profileAvatar');
localStorage.removeItem('profileName');
localStorage.removeItem('profileCover');
}

export let currentSession = null;

export async function initSession() {
  const { data } = await supabase.auth.getSession();
  currentSession = data.session;

  console.log("✅ initSession:", currentSession);
}
// ================================
// 👤 Detectar cambio de usuario
// ================================
(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    const lastUserId = localStorage.getItem('lastUserId');

    if (currentUserId && currentUserId !== lastUserId) {
      clearUserProfileFromLocalStorage();
      localStorage.setItem('lastUserId', currentUserId);
    }
  } catch (e) {
    console.warn('⚠️ Error detectando usuario:', e);
  }
})();

// ================================
// 📥 Cargar perfil desde Supabase
// (avatar, nombre, fondo)
// ================================
export async function loadProfileInfo() {

  try {

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("avatar, background, user_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("⚠️ Error cargando perfil:", error);
      return;
    }

    if (!data) return;

    if (data.avatar) {
      localStorage.setItem("profileAvatar", data.avatar);
    }

    if (data.background) {
      localStorage.setItem("profileCover", data.background);
    }

    if (data.user_name) {
      localStorage.setItem("profileName", data.user_name);
    }

  } catch (e) {
    console.warn("⚠️ Error:", e);
  }

}

// ================================
// ⬆️ Guardar perfil en Supabase
// (cuando el usuario cambia avatar/nombre)
// ================================
export async function saveProfileToSupabase() {

  try {

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return;

    const userId = session.user.id;
    const email = session.user.email;

    const avatar = localStorage.getItem("profileAvatar") || null;
    const userName = localStorage.getItem("profileName") || "Usuario";
    const background = localStorage.getItem("profileCover") || null;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email,
        user_name: userName,
        avatar,
        background
      });

    if (error) {
      console.error("❌ Error guardando perfil:", error);
    } else {
      console.log("✅ Perfil sincronizado");
    }

  } catch (e) {
    console.error("❌ Error:", e);
  }

}

// ================================
// 📺 Guardar progreso de series
// ================================
// ================================
// 📺 Registrar que el usuario está viendo una serie
// ================================
export async function saveSeriesProgress({
  seriesId,
  seriesName = '',
  episodeName = '',
  poster = '',
  link = ''
}) {

  console.log("📺 saveSeriesProgress EJECUTADO:", { seriesId, seriesName, episodeName });

  try {

    const { data: { session } } =
      await supabase.auth.getSession();

    if (!session?.user) {
      console.warn("⚠️ No hay sesión activa");
      return false;
    }

    const userId = session.user.id;

    // 🔒 Supabase SOLO guarda "lo visto" (el nombre de la serie/episodio).
    // El progreso real (tiempo/duration) es 100% local (localStorage).
    const ultimoVisto = {
      seriesTitle: seriesName || 'Serie',
      episodeTitle: episodeName || '',
      poster: poster || '',
      link: link || '',
      visto: true,
      updatedAt: Date.now()
    };

    const { error } = await supabase
      .from('progresos')
      .upsert({
        id: userId,
        series_id: seriesId,
        ultimo_visto: ultimoVisto,
        episodios: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id,series_id'
      });

    if (error) {
      console.error(
        "❌ Error registrando serie:",
        error
      );
      return false;
    }

    console.log(
      "✅ Serie (visto) registrada en Supabase:",
      seriesId
    );

    return true;

  } catch (e) {

    console.error(
      "❌ Error general registrando serie:",
      e
    );

    return false;
  }
}

export async function getContinueWatching() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from('progresos')
    .select('series_id, ultimo_visto')
    .eq('id', session.user.id);

  if (error) {
    console.error('❌ Error cargando continuar viendo:', error);
    return [];
  }

  return data
  .filter(item => item.ultimo_visto)
  .map(item => ({
    ...item.ultimo_visto,
    seriesId: item.series_id,
    tipo: 'series',
    updatedAt: item.ultimo_visto.updatedAt || 0
  }))
  .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadMostRecentProgress(seriesId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('progresos')
      .select('ultimo_visto, episodios, updated_at')
      .eq('id', session.user.id)
      .eq('series_id', seriesId)
      .maybeSingle();

    if (error || !data) return null;

    return data;

  } catch (e) {
    console.error('❌ Error cargando progreso:', e);
    return null;
  }
}

export async function syncContinueWatchingToLocal() {

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('progresos')
    .select('series_id, ultimo_visto')
    .eq('id', session.user.id);

  if (error || !data) {
    console.error("❌ Error descargando progresos:", error);
    return;
  }

  data.forEach(item => {

    if (!item.ultimo_visto) return;

    const visto = item.ultimo_visto;

    const continueKey = `continue_${item.series_id}`;

    // El progreso (segundos/duration) vive SOLO en localStorage.
    // Se fusiona la info "visto" (nombre) desde Supabase, pero NO
    // se sobreescribe el progreso local con datos de la nube.
    const local = JSON.parse(localStorage.getItem(continueKey) || '{}');

    localStorage.setItem(continueKey, JSON.stringify({
      seriesId: item.series_id,
      seriesTitle: visto.seriesTitle || local.seriesTitle || 'Serie',
      episodeTitle: visto.episodeTitle || local.episodeTitle || '',
      poster: visto.poster || local.poster || '',
      link: visto.link || local.link || '',
      progress: local.progress,
      duration: local.duration,
      videoUrl: local.videoUrl,
      season_index: local.season_index,
      episode_index: local.episode_index,
      visto: true,
      updatedAt: visto.updatedAt || Date.now()
    }));

    // NOTA: No se escriben progress_*/duration_* desde Supabase,
    // porque el progreso en segundos es exclusivo de localStorage.

  });

  console.log("✅ Continue Watching sincronizado desde Supabase");
}

// ================================
// 🎬 Guardar progreso de películas
// ================================
export async function saveMovieProgress({
  movieId,
  ultimoVisto
}) {

  console.log("🎬 saveMovieProgress EJECUTADO", {
    movieId,
    ultimoVisto
  });

  try {

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn("⚠️ No hay sesión activa");
      return false;
    }

    const userId = session.user.id;

    // 🔒 Supabase SOLO guarda "lo visto" (nombre), nunca el progreso.
    const { progress: _progreso, duration: _duracion, ...vistoInfo } = (ultimoVisto || {});

    const { data, error } = await supabase
  .from('progresos')
  .upsert({
    id: userId,
    series_id: `movie_${movieId}`,
    ultimo_visto: {
      ...vistoInfo,
      visto: true,
      updatedAt: new Date().toISOString()
    },
    episodios: null,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'id,series_id'
  })
  .select();

console.log("📦 Respuesta Supabase:", {
  data,
  error
});

    if (error) {
      console.error("❌ Error guardando película:", error);
      return false;
    }

    console.log("✅ Película sincronizada");

    return true;

  } catch (e) {

    console.error("❌ Error general:", e);
    return false;

  }

}

export async function getMovieContinueWatching() {

  const { data: { session } } = await supabase.auth.getSession();
  console.log("🔐 SESIÓN ACTUAL:", session);
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from('progresos')
    .select('series_id, ultimo_visto')
    .eq('id', session.user.id)
    .like('series_id', 'movie_%');

  if (error) {
    console.error('❌ Error cargando películas:', error);
    return [];
  }

  return data
    .filter(item => item.ultimo_visto)
    .map(item => ({
      ...item.ultimo_visto,
      movieId: item.series_id.replace('movie_', ''),
      tipo: 'movie',
      updatedAt: item.ultimo_visto.updatedAt || 0
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

// ================================
// 🗑️ Borrar progreso de Supabase
// ================================
// Borra una película específica de la tabla `progresos`
export async function deleteProgressFromSupabase(movieId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { error } = await supabase
      .from('progresos')
      .delete()
      .eq('id', session.user.id)
      .eq('series_id', `movie_${movieId}`);

    if (error) {
      console.error('❌ Error borrando progreso de película:', error);
      return false;
    }
    console.log('✅ Progreso de película borrado de Supabase:', movieId);
    return true;
  } catch (e) {
    console.error('❌ Error:', e);
    return false;
  }
}

// Borra TODO el progreso del usuario de Supabase
export async function deleteAllProgressFromSupabase() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const userId = session.user.id;

    const { data: deletedProgresos, error: progresosError } = await supabase
      .from('progresos')
      .delete()
      .eq('id', userId)
      .select();

    if (progresosError) {
      console.error('❌ Error borrando progresos (revisa políticas RLS):', progresosError);
    } else {
      console.log(`🗑️ ${deletedProgresos?.length ?? 0} filas borradas de 'progresos'`);
    }

    // user_views puede no existir — ignoramos ese caso silenciosamente
    try {
      const { error: viewsError } = await supabase
        .from('user_views')
        .delete()
        .eq('user_id', userId);

      if (viewsError && !/does not exist|42P01/i.test(viewsError.message || '')) {
        console.error('❌ Error borrando vistas:', viewsError);
      }
    } catch (_) { /* tabla no existe — ignorar */ }

    console.log('✅ Todo el progreso de Supabase borrado para usuario:', userId);
    return true;
  } catch (e) {
    console.error('❌ Error:', e);
    return false;
  }
}

// ================================
// 🔎 Verificar si contenido está completado
// ================================
// Una película está completada si progress >= duration * 0.9
export function isMovieCompleted(movieId) {
  const progress = parseFloat(localStorage.getItem(`progress_${movieId}`)) || 0;
  const duration = parseFloat(localStorage.getItem(`duration_${movieId}`)) || 0;
  if (!duration || duration <= 0) return false;
  return progress >= duration * 0.9;
}

// Una serie/episodio está completado SOLO si hay progreso local y llegó al final.
// Si NO hay datos locales, NO asumimos completado (para permitir sync entre dispositivos).
export function isSeriesCompleted(seriesId) {
  const itemData = JSON.parse(localStorage.getItem(`continue_${seriesId}`) || '{}');
  if (!itemData.progress || !itemData.duration) return false;
  return itemData.progress >= itemData.duration * 0.9;
}

window.saveProfileToSupabase = saveProfileToSupabase;
window.deleteAllProgressFromSupabase = deleteAllProgressFromSupabase;
window.isMovieCompleted = isMovieCompleted;