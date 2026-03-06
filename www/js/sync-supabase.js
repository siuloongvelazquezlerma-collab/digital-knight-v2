// ================================
// 🔗 Cliente Supabase (UNO SOLO)
// ================================
import { supabase } from './supabaseClient.js';

// ================================
// 🧼 Limpiar datos al cambiar usuario
// (solo perfil local, nada más)
// ================================
function clearUserProfileFromLocalStorage() {
  localStorage.removeItem('profileImage');
  localStorage.removeItem('userName');
  localStorage.removeItem('backgroundImage');
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
      .from('profiles')
      .select('avatar, user_name, background')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ Error cargando perfil:', error);
      return;
    }

    if (!data) return;

    if (data.avatar) {
      localStorage.setItem('profileImage', data.avatar);
    }

    if (data.user_name) {
      localStorage.setItem('userName', data.user_name);
    }

    if (data.background) {
      localStorage.setItem('backgroundImage', data.background);
    }

  } catch (e) {
    console.warn('⚠️ Error cargando perfil:', e);
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

    const avatar = localStorage.getItem('profileImage') || null;
    const userName = localStorage.getItem('userName') || null;
    const background = localStorage.getItem('backgroundImage') || null;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        avatar,
        user_name: userName,
        background
      });

    if (error) {
      console.error('❌ Error guardando perfil:', error);
    } else {
      console.log('✅ Perfil sincronizado con Supabase');
    }

  } catch (e) {
    console.warn('⚠️ Error sincronizando perfil:', e);
  }
}
