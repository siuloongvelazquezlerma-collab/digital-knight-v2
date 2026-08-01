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
export async function saveSeriesProgress({
  seriesId,
  ultimoVisto,
  episodios
}) {
  console.log("🔥 saveSeriesProgress EJECUTADO", {
    seriesId,
    ultimoVisto,
    episodios
  });

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn("⚠️ No hay sesión activa, no se guarda progreso");
      return false;
    }

    const userId = session.user.id;

    // Obtener episodios ya guardados
const { data: existente, error: fetchError } = await supabase
  .from('progresos')
  .select('episodios')
  .eq('email', session.user.email)
  .eq('series_id', seriesId)
  .maybeSingle();

if (fetchError) {
      console.error("❌ Error leyendo progreso existente:", fetchError);
    }

    const episodiosCompletos = {
      ...(existente?.episodios || {}),
      ...(episodios || {})
    };

     console.log("📦 Datos finales a guardar:", {
      id: userId,
      series_id: seriesId,
      ultimo_visto: ultimoVisto,
      episodios: episodiosCompletos
    });

    const { error } = await supabase
      .from('progresos')
      .upsert({
        id: userId,
        series_id: seriesId,
        ultimo_visto: ultimoVisto,
        episodios: episodiosCompletos,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id,series_id'
      });

    if (error) {
      console.error("❌ Error guardando progreso:", error);
      return false;
    }

    console.log("✅ Progreso de serie sincronizado en Supabase");

    return true;

  } catch (e) {
    console.error("❌ Error general sincronizando progreso:", e);
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

    const ultimo = item.ultimo_visto;

    const continueKey = `continue_${item.series_id}`;

    localStorage.setItem(continueKey, JSON.stringify({
      seriesId: item.series_id,
      seriesTitle: ultimo.seriesTitle,
      episodeTitle: ultimo.episodeTitle,
      poster: ultimo.poster,
      link: ultimo.link,
      progress: ultimo.progress,
      duration: ultimo.duration,
      videoUrl: ultimo.videoUrl,
      season_index: ultimo.season_index,
      episode_index: ultimo.episode_index
    }));

    localStorage.setItem(
      `progress_${item.series_id}_${ultimo.videoUrl}`,
      ultimo.progress
    );

    localStorage.setItem(
      `duration_${item.series_id}_${ultimo.videoUrl}`,
      ultimo.duration
    );

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

    const { data, error } = await supabase
  .from('progresos')
  .upsert({
    id: userId,
    series_id: `movie_${movieId}`,
    ultimo_visto: ultimoVisto,
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

window.saveProfileToSupabase = saveProfileToSupabase;