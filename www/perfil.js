

function openOpenDrivePage() {
  document.getElementById("openDrivePage").style.display = "block";
}

function closeOpenDrivePage() {
  document.getElementById("openDrivePage").style.display = "none";
}


  // Función para abrir la página de Pro
function openProPage() {
  document.getElementById("proPage").style.display = "block";
}

// Función para cerrar la página de Pro
function closeProPage() {
  document.getElementById("proPage").style.display = "none";
}



// Función para manejar la selección de archivo de imagen
function handleFileSelect(event) {
var file = event.target.files[0]; // Obtiene el archivo seleccionado
if (file) {
  var reader = new FileReader();
  reader.onload = function(e) {
      // Obtener la URL de la imagen seleccionada
      var newImageUrl = e.target.result;
      
      // Cambiar la imagen de perfil en todas las instancias correspondientes
      document.getElementById('editableProfile').src = newImageUrl;
      document.getElementById('editableProfileInModal').src = newImageUrl;
      document.getElementById('profileImage').src = newImageUrl;
      
      // Guardar la nueva imagen de perfil en localStorage
      localStorage.setItem('profileImage', newImageUrl);

      // Actualizar también la imagen en el footer
      updateProfileImage(newImageUrl);
  };
  reader.readAsDataURL(file); // Leer el archivo como una URL de datos
}
}

// Función para actualizar la imagen de perfil en el footer
function updateProfileImage(imageUrl) {
const ids = [
  "footerIconImg",
  "footerProfileImage",
  "profileImage",
  "editableProfile",
  "editableProfileInModal",
  "headerProfileIcon",
];

ids.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.src = imageUrl;
});

const defaultIcon = document.getElementById("defaultProfileIcon");
if (defaultIcon) defaultIcon.style.display = "none";

const defaultIconAlt = document.getElementById("defaultProfileIconAlt");
if (defaultIconAlt) defaultIconAlt.style.display = "none";

localStorage.setItem("profileImage", imageUrl);
}


  // Prevenir gestos táctiles no deseados
document.addEventListener('touchmove', function (event) {
      if (event.touches.length > 1) {
          event.preventDefault();
      }
  }, { passive: false });

// Función para abrir la página de compartir
function openSharePage() {
  document.getElementById('sharePage').style.display = 'block';
}

// Función para cerrar la página de compartir
function closeSharePage() {
  document.getElementById('sharePage').style.display = 'none';
}

  // Función para mostrar la página de "Sugerencias y soporte"
function openSuggestionsPage() {
  document.getElementById("suggestionsPage").style.display = "block";
}

// Función para cerrar la página de "Sugerencias y soporte"
function closeSuggestionsPage() {
  document.getElementById("suggestionsPage").style.display = "none";
}

// Función para mostrar la página de "Cómo transmitir a TV"
function openCastToTvPage() {
  document.getElementById("castToTvPage").style.display = "block";
}

// Función para cerrar la página de "Cómo transmitir a TV"
function closeCastToTvPage() {
  document.getElementById("castToTvPage").style.display = "none";
}

window.addEventListener("load", () => {
const overlay = document.querySelector(".overlay");
const loader = document.getElementById("loader");

setTimeout(() => {
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 300);
  }

  if (overlay) {
    overlay.classList.add("hidden");
    
  }
}, 1000);
});

function ocultarOverlay() {
  const overlay = document.querySelector(".overlay");
  const loader = document.getElementById("loader");

  if (loader) loader.style.opacity = "0";
  if (overlay) overlay.classList.add("hidden");
}


let initialProfileImage = document.getElementById('editableProfile').src;
let initialBackgroundImage = document.getElementById('editableBackground').src;
let notificationCount = 0;  // Inicializar contador de notificaciones

// Función para alternar la visibilidad del perfil editable
function toggleEditProfile() {
document.getElementById('editProfileSection').classList.toggle('visible');
}

// Función para mostrar o esconder el modal
function toggleModal(modalId) {
document.getElementById(modalId).classList.toggle('visible');
}

// Función para seleccionar la imagen de fondo y resaltar la imagen seleccionada
function selectBackgroundImage(imageUrl, imgElement) {
// Cambiar la imagen de fondo en la sección de edición
document.getElementById('editableBackground').src = imageUrl;
document.getElementById('editableBackgroundInModal').src = imageUrl;
document.getElementById('backgroundImage').src = imageUrl;

// Guardar la imagen seleccionada en localStorage para que persista después de cerrar la página
localStorage.setItem('backgroundImage', imageUrl);  

// Resaltar la imagen seleccionada
const allImages = document.querySelectorAll('.image-option-background');
allImages.forEach(img => img.classList.remove('selected-image-background'));
imgElement.classList.add('selected-image-background');

checkForChanges();
}

// Función para seleccionar la imagen de perfil y resaltar la imagen seleccionada
function selectProfileImage(imageUrl, imgElement) {
// Create a new Image object to handle loading
const profileImage = new Image();

// Set the image source and handle loading events
profileImage.src = imageUrl;
profileImage.onload = function() {
document.getElementById('editableProfile').src = imageUrl;
document.getElementById('editableProfileInModal').src = imageUrl;
document.getElementById('profileImage').src = imageUrl;

localStorage.setItem('profileImage', imageUrl);

const allImages = document.querySelectorAll('.image-option-profile');
allImages.forEach(img => img.classList.remove('selected-image-profile'));
imgElement.classList.add('selected-image-profile');

updateProfileImage(imageUrl);
checkForChanges();

saveProfileToSupabase(); // SOLO guarda avatar y fondo

};


// Handle potential errors during image loading
profileImage.onerror = function() {
// Optional: Show an error message or a placeholder image
console.error('Error loading profile image:', imageUrl);
};
}


async function saveProfileToSupabase() {
const profileImage = localStorage.getItem("profileImage");
const backgroundImage = localStorage.getItem("backgroundImage");

const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
const supabase = createClient(
    'https://wplyrhcszuoordgaphax.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
);

const { data: { session } } = await supabase.auth.getSession();
if (!session) return;

await supabase.from("profiles").upsert({
    id: session.user.id,
    avatar: profileImage,
    background: backgroundImage
});
}


window.addEventListener("load", async () => {
  ocultarOverlay();
  await cargarPerfilDesdeSupabase();
  updateNotificationCounter();
  checkForChanges();
});


// Cargar imagen de fondo si existe
const savedBackgroundImage = localStorage.getItem('backgroundImage');
if (savedBackgroundImage) {
  document.getElementById('backgroundImage').src = savedBackgroundImage;
  document.getElementById('editableBackground').src = savedBackgroundImage;
}

// Cargar nombre de usuario si existe
const savedUserName = localStorage.getItem('userName');
if (savedUserName) {
  document.getElementById('userNameDisplay').textContent = savedUserName;
  document.getElementById('usernameInput').value = savedUserName;
}
// Llamar a la función para actualizar el contador de notificaciones
updateNotificationCounter();

// Verificar si hay cambios
checkForChanges();



// Función para guardar los cambios y cerrar la sección de edición
function saveChanges() {
document.getElementById('saveButton').classList.remove('active');
saveUserName(); // 🔄 Aquí agregamos la sincronización del nombre
toggleEditProfile();  // Cerrar la sección de edición de perfil
}


// Función para verificar y habilitar el botón de guardar si hay cambios
function checkForChanges() {
const userName = document.getElementById('usernameInput').value;
const profileImage = document.getElementById('editableProfile').src;
const backgroundImage = document.getElementById('editableBackground').src;

const userNameChanged = userName !== localStorage.getItem('userName');
const profileImageChanged = profileImage !== initialProfileImage;
const backgroundImageChanged = backgroundImage !== initialBackgroundImage;

if (userNameChanged || profileImageChanged || backgroundImageChanged) {
  document.getElementById('saveButton').classList.add('active');
} else {
  document.getElementById('saveButton').classList.remove('active');
}
}



// Cargar imagen de fondo si existe en localStorage
if (localStorage.getItem('backgroundImage')) {
  let backgroundImageUrl = localStorage.getItem('backgroundImage');
  document.getElementById('backgroundImage').src = backgroundImageUrl;
  document.getElementById('editableBackground').src = backgroundImageUrl;
}


// 🔄 Cargar también desde Supabase si hay sesión activa
(async () => {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const supabase = createClient(
      'https://wplyrhcszuoordgaphax.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const { data, error } = await supabase
      .from("profiles")
      .select('avatar, user_name, background')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      if (data.avatar) {
        updateProfileImage(data.avatar);
        document.getElementById('profileImage').src = data.avatar;
        document.getElementById('editableProfile').src = data.avatar;
        document.getElementById('editableProfileInModal').src = data.avatar;
        localStorage.setItem('profileImage', data.avatar);
      }

      if (data.user_name) {
        document.getElementById('userNameDisplay').textContent = data.user_name;
        document.getElementById('usernameInput').value = data.user_name;
        localStorage.setItem('userName', data.user_name);
      }

      if (data.background) {
        document.getElementById('backgroundImage').src = data.background;
        document.getElementById('editableBackground').src = data.background;
        localStorage.setItem('backgroundImage', data.background);
      }
    }

    if (error) {
      console.warn('⚠️ Error al obtener datos del perfil:', error);
    }
  } catch (e) {
    console.warn('⚠️ No se pudo cargar datos desde Supabase:', e);
  }
})();


// Función para actualizar el nombre de usuario en tiempo real
let syncNameTimeout;
function updateUserName() {
const userNameInput = document.getElementById('usernameInput').value;
document.getElementById('userNameDisplay').textContent = userNameInput;
localStorage.setItem('userName', userNameInput);
checkForChanges();

clearTimeout(syncNameTimeout);
syncNameTimeout = setTimeout(() => {
  saveUserName(); // 🔄 Auto sincronizar tras 1 segundo sin escribir
}, 1000);
}


// Guardar el nombre en localStorage y sincronizar con Supabase
function saveUserName() {
const userName = document.getElementById('usernameInput').value;
localStorage.setItem('userName', userName);
document.getElementById('saveButton').classList.remove('active');

// También guardar en Supabase
(async () => {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const supabase = createClient(
      'https://wplyrhcszuoordgaphax.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const backgroundImage = localStorage.getItem('backgroundImage') || undefined;
const profileImage = localStorage.getItem('profileImage') || undefined;


    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        user_name: userName,
        avatar: profileImage,
        background: backgroundImage
      });

    if (error) {
      console.error('❌ Error al guardar perfil en Supabase:', error);
    } else {
      console.log('✅ Perfil sincronizado con Supabase');
    }
  } catch (e) {
    console.warn('⚠️ No se pudo sincronizar el perfil con Supabase:', e);
  }
})();
}


// Cerrar el modal
function closeModal() {
toggleModal('profileModal');
}

// Función para mostrar la página de Notificaciones
function openNotifications() {
updateNotificationCounter();  // Llamar para actualizar el contador cuando se abre la página de notificaciones
document.getElementById("notificationsPage").style.display = "block";
updateDeleteButton();
}

// Función para cerrar la página de Notificaciones
function closeNotifications() {
document.getElementById("notificationsPage").style.display = "none";
}

// Función para añadir una notificación y actualizar el contador
function addNotification() {
const newNotification = document.createElement('a');
newNotification.classList.add('notification-item');
newNotification.href = 'go:venom3';
newNotification.innerHTML = `        
  <img src="https://image.tmdb.org/t/p/original/jiWlhrR0jAQPy0zwfIYa2gqgMuA.jpg" alt="Nuevo Contenido" class="notification-image">
  <div class="notification-text">
      <h3>Nuevo Contenido</h3>
      <p>Descripción de la nueva notificación.</p>
  </div>
`;
document.getElementById('notificationsContainer').appendChild(newNotification);
updateNotificationCounter();  // Actualizar contador después de agregar una notificación
updateDeleteButton();  // Actualizar estado del botón
}

// Función para eliminar una notificación y actualizar el contador
function removeNotification() {
const notificationsContainer = document.getElementById("notificationsContainer");
const notificationItems = notificationsContainer.querySelectorAll(".notification-item");

// Eliminar la última notificación
if (notificationItems.length > 0) {
  notificationItems[notificationItems.length - 1].remove();
  updateNotificationCounter();  // Actualizar contador después de eliminar una notificación
  updateDeleteButton();  // Actualizar estado del botón
}
}

// Función para eliminar todas las notificaciones
function deleteAllNotifications() {
const notificationsContainer = document.getElementById("notificationsContainer");
notificationsContainer.innerHTML = "";
updateNotificationCounter();
updateDeleteButton();
}

// Función para actualizar el contador de notificaciones
function updateNotificationCounter() {
const notificationsContainer = document.getElementById("notificationsContainer");
const notificationItems = notificationsContainer.querySelectorAll(".notification-item");
const notificationCounter = document.getElementById("notificationCounter");

// Si hay más de 0 notificaciones, mostrar el contador
if (notificationItems.length > 0) {
  notificationCounter.style.display = "inline";
  notificationCounter.textContent = notificationItems.length;  // Actualizamos el número de notificaciones
} else {
  notificationCounter.style.display = "none";
  // Mostrar mensaje de que no hay notificaciones
  if (notificationsContainer.querySelectorAll('.notification-item').length === 0) {
      const noNotificationsMessage = document.createElement('p');
      noNotificationsMessage.textContent = 'No tienes ninguna notificación nueva. Te enviaremos una notificación cuando tengamos alguna novedad que compartir!';
      notificationsContainer.appendChild(noNotificationsMessage);
  }
}
}

// Función para actualizar la imagen del perfil en el footer
function updateProfileImage(imageUrl) {
const ids = [
  "footerIconImg",
  "footerProfileImage",
  "profileImage",
  "editableProfile",
  "editableProfileInModal",
  "headerProfileIcon",
];

ids.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.src = imageUrl;
});

// Ocultar iconos por defecto si existen
const defaultIcon = document.getElementById("defaultProfileIcon");
if (defaultIcon) defaultIcon.style.display = "none";

const defaultIconAlt = document.getElementById("defaultProfileIconAlt");
if (defaultIconAlt) defaultIconAlt.style.display = "none";

// Guardar en localStorage
localStorage.setItem("profileImage", imageUrl);
}

// Restaurar la imagen de perfil guardada al cargar la página
window.addEventListener("load", () => {
const storedProfileImage = localStorage.getItem("profileImage");
if (storedProfileImage) {
  updateProfileImage(storedProfileImage); // Reutilizamos la función
}
});

// Ocultar/mostrar footer al hacer scroll
let lastScrollTop = 0;
const footer = document.querySelector(".footer");

window.addEventListener("scroll", function () {
const currentScroll = window.scrollY;

if (currentScroll > lastScrollTop) {
  // Desliza hacia abajo -> Ocultar footer
  footer.classList.add("hidden");
} else {
  // Desliza hacia arriba -> Mostrar footer
  footer.classList.remove("hidden");
}

lastScrollTop = currentScroll;
});



function openPrivacyPolicy() {
document.getElementById("privacyPolicyPage").style.display = "block";
}

function closePrivacyPolicy() {
document.getElementById("privacyPolicyPage").style.display = "none";
}

function openDeleteProgressModal() {
  document.getElementById('deleteProgressOverlay').classList.remove('hidden');
}

function closeDeleteProgressModal() {
  document.getElementById('deleteProgressOverlay').classList.add('hidden');
}

async function confirmDeleteProgress() {
// 1. Borrar datos del localStorage
Object.keys(localStorage).forEach(key => {
  if (
    key.startsWith('progress-') ||   // series
    key.startsWith('progress_') ||   // películas
    key.startsWith('duration_') ||   // películas
    key.startsWith('movie_') ||      // películas
    key.startsWith('hasStarted_') || // películas
    key.startsWith('continue_') ||   // series
    key.startsWith('last-episode-')  // series
  ) {
    localStorage.removeItem(key);
  }
});

// 2. Borrar datos en Supabase si está logueado
try {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.warn('⚠️ No hay sesión activa. Solo se borró localStorage');
  } else {
    const userId = session.user.id;

    // Eliminar progreso de películas
    await supabase.from('progresos').delete().eq('id', userId);

    // Eliminar datos de continuar viendo
    await supabase.from('continuar_viendo').delete().eq('id', userId);

    // Opcional: eliminar favoritos también
    // await supabase.from('favoritos').delete().eq('id', userId);

    console.log('🗑️ Datos borrados en Supabase.');
  }
} catch (e) {
  console.error('❌ Error al borrar datos de Supabase:', e);
}

closeDeleteProgressModal();
mostrarNotificacion("Se borró todo el progreso de reproducción");
}


function mostrarNotificacion(mensaje) {
  const notificacion = document.getElementById('notificacion');
  const notificacionTexto = document.getElementById('notificacionTexto');

  if (!notificacion || !notificacionTexto) return;

  notificacionTexto.innerText = mensaje;
  notificacion.style.bottom = "80px"; // ajusta si tienes footer

  setTimeout(() => {
    notificacion.style.bottom = "-200px";
  }, 3000);
}


async function cargarPerfilDesdeSupabase() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');

  const supabase = createClient(
    'https://wplyrhcszuoordgaphax.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("avatar, background, user_name")
    .eq("id", session.user.id)
    .single();

  if (error || !data) return;

  if (data.avatar) {
    updateProfileImage(data.avatar);
    localStorage.setItem("profileImage", data.avatar);
  }

  if (data.background) {
    document.getElementById("backgroundImage").src = data.background;
    localStorage.setItem("backgroundImage", data.background);
  }

  if (data.user_name) {
    document.getElementById("userNameDisplay").textContent = data.user_name;
    document.getElementById("usernameInput").value = data.user_name;
    localStorage.setItem("userName", data.user_name);
  }
}


async function saveProfileToSupabase() {
  const avatar = localStorage.getItem("profileImage");
  const background = localStorage.getItem("backgroundImage");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from("profiles").upsert({
    id: session.user.id,
    avatar,
    background
  });
}


async function saveUserName() {
  const user_name = document.getElementById('usernameInput').value;
  localStorage.setItem('userName', user_name);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from("profiles").upsert({
    id: session.user.id,
    user_name
  });
}


async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = "login.html";
}
