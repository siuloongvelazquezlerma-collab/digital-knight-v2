// viewsTracker.js
import { supabase } from './js/sync-supabase.js';

/**
 * Registra una vista en la tabla `user_views`
 * @param {string} userId - ID del usuario autenticado
 * @param {string} contentId - ID de la película o serie
 * @param {'movie'|'series'} contentType - Tipo de contenido
 * @param {number} durationWatched - Duración vista en segundos
 */
export async function registerView(userId, contentId, contentType, durationWatched) {
  const { error } = await supabase
    .from('user_views')
    .insert([{
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      duration_watched: durationWatched
    }]);

  if (error) {
    console.error(`❌ Error registrando vista de ${contentType}:`, error);
  } else {
    console.log(`✅ Vista registrada para ${contentType}: ${contentId}`);
  }
}

/**
 * Registra una vista de episodio de serie
 * @param {string} userId - ID del usuario autenticado
 * @param {string} seriesId - ID de la serie
 * @param {string} episodeCode - Código único del episodio
 * @param {number} durationWatched - Duración vista en segundos
 */
export async function onPlayEpisode(userId, seriesId, episodeCode, durationWatched) {
  const { error } = await supabase
    .from('user_views')
    .insert([{
      user_id: userId,
      content_id: `${seriesId}_${episodeCode}`,
      content_type: 'series',
      duration_watched: durationWatched
    }]);

  if (error) {
    console.error(`❌ Error registrando vista de episodio:`, error);
  } else {
    console.log(`✅ Vista registrada para episodio: ${episodeCode}`);
  }
}
