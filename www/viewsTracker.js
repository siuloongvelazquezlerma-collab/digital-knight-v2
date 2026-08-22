// viewsTracker.js
import { supabase } from './js/supabaseClient.js';

/**
 * Registra una vista en la tabla `user_views`
 * Solo guarda QUÉ se vio (id/tipo), NUNCA progreso (segundos/duración).
 * @param {string} userId - ID del usuario autenticado
 * @param {string} contentId - ID de la película o serie
 * @param {'movie'|'series'} contentType - Tipo de contenido
 */
export async function registerView(userId, contentId, contentType) {
  const { error } = await supabase
    .from('user_views')
    .insert([{
      user_id: userId,
      content_id: contentId,
      content_type: contentType
    }]);

  if (error) {
    console.error(`❌ Error registrando vista de ${contentType}:`, error);
  } else {
    console.log(`✅ Vista registrada para ${contentType}: ${contentId}`);
  }
}

/**
 * (Eliminado) onPlayEpisode: registraba duración por episodio en `user_views`,
 * lo cual era un dato de progreso que NO debe ir a Supabase.
 * No se llama en ningún archivo de www.
 */
