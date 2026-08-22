// viewsTracker.js
import { supabase } from './js/supabaseClient.js';

// La tabla `user_views` puede NO existir en Supabase.
// En ese caso los errores se ignoran silenciosamente (una sola vez).
let tableMissingWarned = false;

function esTablaInexistente(error) {
  return error && (
    error.code === '42P01' ||
    /does not exist/i.test(error.message || '')
  );
}

/**
 * Registra una vista en la tabla `user_views` (si existe).
 * Solo guarda QUÉ se vio (id/tipo), NUNCA progreso (segundos/duración).
 * @param {string} userId - ID del usuario autenticado
 * @param {string} contentId - ID de la película o serie
 * @param {'movie'|'series'} contentType - Tipo de contenido
 */
export async function registerView(userId, contentId, contentType) {
  try {
    const { error } = await supabase
      .from('user_views')
      .insert([{
        user_id: userId,
        content_id: contentId,
        content_type: contentType
      }]);

    if (error) {
      if (esTablaInexistente(error)) {
        if (!tableMissingWarned) {
          console.warn('ℹ️ Tabla user_views no existe en Supabase — registro de vistas desactivado.');
          tableMissingWarned = true;
        }
        return;
      }
      console.error(`❌ Error registrando vista de ${contentType}:`, error);
    }
  } catch (e) {
    if (!esTablaInexistente(e)) {
      console.warn('⚠️ registerView falló:', e);
    }
  }
}

/**
 * (Eliminado) onPlayEpisode: registraba duración por episodio en `user_views`,
 * lo cual era un dato de progreso que NO debe ir a Supabase.
 * No se llama en ningún archivo de www.
 */

/**
 * (Eliminado) onPlayEpisode: registraba duración por episodio en `user_views`,
 * lo cual era un dato de progreso que NO debe ir a Supabase.
 * No se llama en ningún archivo de www.
 */
