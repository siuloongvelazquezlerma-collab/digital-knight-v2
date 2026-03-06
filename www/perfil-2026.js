window.addEventListener('load', function () {
  const overlay = document.querySelector('.overlay-loader');
  const loader = document.getElementById('loader');

  // Se mantiene el loader visible por 1 segundo
  setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            overlay.classList.add('hidden');
        }, 300);
    }, 1000);
});

const STORAGE_KEY = "notifications_data";

// cargar al iniciar
let notifications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

/* ================= DEFAULTS ================= */
const DEFAULT_AVATAR = 'avatar.jpg';
const DEFAULT_COVER = 'cover.jpg';
const DEFAULT_NAME = 'Usuario';

let selectedAvatar = null;
let selectedCover = null;
let lastView = 'profile-view';
let profileChanged = false;

/* ================= INIT ================= */
function initProfileDefaults() {
  if (!localStorage.getItem('profileAvatar')) {
    localStorage.setItem('profileAvatar', DEFAULT_AVATAR);
  }

  if (!localStorage.getItem('profileCover')) {
    localStorage.setItem('profileCover', DEFAULT_COVER);
  }

  if (!localStorage.getItem('profileName')) {
    localStorage.setItem('profileName', DEFAULT_NAME);
  }
}

/* ================= VISTAS ================= */
function showView(id) {
  document.querySelectorAll('.view').forEach(v =>
    v.classList.remove('active')
  );

  const view = document.getElementById(id);
  if (view) {
    view.classList.add('active');
    lastView = id;
  }
}

/* ================= NOTIFICACIONES ================= */



/* ===== BADGE DEL MENÚ ===== */
function updateMenuNotificationBadge() {
  const badge = document.getElementById("menuNotificationBadge");
  if (!badge) return;

  const count = notifications.length;

  if (count > 0) {
    badge.style.display = "flex";
    badge.textContent = count;
  } else {
    badge.style.display = "none";
  }
}

const CLEARED_KEY = "notifications_cleared";
const VERSION_KEY = "notifications_version";
const NOTIFICATIONS_VERSION = "1.4"; // 🔥 CAMBIA ESTO CUANDO HAYA NUEVAS

/* ===== AÑADIR NOTIFICACIONES ===== */
function addNotification() {
  const savedVersion = localStorage.getItem(VERSION_KEY);

  // 👇 si ya está en esta versión, no hagas nada
  if (savedVersion === NOTIFICATIONS_VERSION) return;

  // 👇 nueva versión → reset controlado
  notifications = [];

  notifications.push(
    {
      href: "peliculas/poder-sin-limites.html",
      img: "https://image.tmdb.org/t/p/original/gnVj0anmHmk3S4tprHbBHXFCo5M.jpg",
      title: "Nueva Pelicula",
      text: "Poder sin limites.",
      seen: false
    },
    {
      href: "Animacion/goat-la-cabra-que-cambio-el-juego.html",
      img: "https://image.tmdb.org/t/p/original/6aAsTVPSsqyD2bqYfAnOdG9g4rF.jpg",
      title: "Nueva Pelicula",
      text: "GOAT: La cabra que cambió el juego.",
      seen: false
    },
    
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  localStorage.setItem(VERSION_KEY, NOTIFICATIONS_VERSION);

  // 👇 desbloquea aunque el usuario las haya borrado antes
  localStorage.removeItem(CLEARED_KEY);

  updateMenuNotificationBadge();
  renderNotifications();
}

/* ===== RENDERIZAR ===== */
function renderNotifications() {
  const container = document.getElementById("notificationsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (notifications.length === 0) {
    const p = document.createElement("p");
    p.textContent =
      "No tienes ninguna notificación nueva. Te enviaremos una notificación cuando tengamos alguna novedad que compartir!";
    container.appendChild(p);
    return;
  }

  notifications.forEach((n, index) => {
    const a = document.createElement("a");
    a.className = `notification-item ${n.seen ? "seen" : "new"}`;
    a.href = n.href;

    a.innerHTML = `
      <img src="${n.img}" class="notification-image">
      <div class="notification-text">
        <h3>${n.title}</h3>
        <p>${n.text}</p>
      </div>
    `;

    a.addEventListener("click", () => {
      notifications[index].seen = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      updateMenuNotificationBadge();
      renderNotifications();
    });

    container.appendChild(a);
  });
}

/* ===== ABRIR VISTA ===== */
function openView(viewId) {
  // usa el sistema original de vistas
  showView(viewId);

  // lógica extra solo para notificaciones
  if (viewId === "notifications-view") {
    renderNotifications();
  }
}


/* ===== BORRAR NOTIFICACIONES ===== */
function clearNotifications() {
  notifications = [];
  localStorage.removeItem(STORAGE_KEY);

  // 👇 el usuario decide borrarlas
  localStorage.setItem(CLEARED_KEY, "true");

  updateMenuNotificationBadge();
  renderNotifications();
}



function openManageProfile() {
  syncPreviewData();
  showView('manage-profile-view');
}

function openAvatarEdit() {
  syncPreviewData();
  showView('edit-avatar-view');
}

function openCoverEdit() {
  syncPreviewData();
  showView('edit-cover-view');
}

function openProfileEdit() {
  syncPreviewData();
  showView('edit-profile-view');
}

function closeEdit() {
  if (
    lastView === 'edit-avatar-view' ||
    lastView === 'edit-cover-view' ||
    lastView === 'edit-profile-view'
  ) {
    showView('manage-profile-view');
  } else {
    showView('profile-view');
  }
}

/* ================= AVATAR ================= */
function selectAvatar(img) {
  document
    .querySelectorAll('#edit-avatar-view .avatar-grid img')
    .forEach(i => i.classList.remove('selected'));

  img.classList.add('selected');
  selectedAvatar = img.src;

  if (window.avatarPreview) avatarPreview.src = img.src;

  markProfileAsChanged();
}

function saveAvatar() {
  const avatar =
    selectedAvatar ||
    localStorage.getItem('profileAvatar') ||
    DEFAULT_AVATAR;

  localStorage.setItem('profileAvatar', avatar);
  selectedAvatar = null;

  syncPreviewData();
  showView('manage-profile-view');
}

/* ================= FONDO ================= */
function selectCover(img) {
  document
    .querySelectorAll('#edit-cover-view .avatar-grid img')
    .forEach(i => i.classList.remove('selected'));

  img.classList.add('selected');
  selectedCover = img.src;

  if (window.coverPreviewTemp)
    coverPreviewTemp.style.backgroundImage = `url(${img.src})`;

  markProfileAsChanged();
}

function saveCover() {
  const cover =
    selectedCover ||
    localStorage.getItem('profileCover') ||
    DEFAULT_COVER;

  localStorage.setItem('profileCover', cover);
  selectedCover = null;

  syncPreviewData();
  showView('manage-profile-view');
}

/* ================= PERFIL ================= */
function saveFullProfile() {
  const nameInput = document.querySelector(
    '#manage-profile-view #profileNameInput'
  );

  const name = nameInput?.value.trim() || DEFAULT_NAME;

  const avatar =
    selectedAvatar ||
    localStorage.getItem('profileAvatar') ||
    DEFAULT_AVATAR;

  const cover =
    selectedCover ||
    localStorage.getItem('profileCover') ||
    DEFAULT_COVER;

  localStorage.setItem('profileName', name);
  localStorage.setItem('profileAvatar', avatar);
  localStorage.setItem('profileCover', cover);

  selectedAvatar = null;
  selectedCover = null;
  profileChanged = false;

  const btn = document.getElementById('saveProfileBtn');
  if (btn) {
    btn.disabled = true;
    btn.classList.remove('active', 'btn-light');
    btn.classList.add('btn-secondary');
  }

  syncPreviewData();
  showView('profile-view');
}

/* ================= SINCRONIZAR ================= */
function syncPreviewData() {
  const avatar = localStorage.getItem('profileAvatar') || DEFAULT_AVATAR;
  const cover  = localStorage.getItem('profileCover')  || DEFAULT_COVER;
  const name   = localStorage.getItem('profileName')   || DEFAULT_NAME;

  // AVATAR
  if (window.avatarMain) avatarMain.src = avatar;
  if (window.avatarPreview) avatarPreview.src = avatar;
  if (window.avatarCoverPreview) avatarCoverPreview.src = avatar;
  if (window.manageAvatar) manageAvatar.src = avatar;

  // FONDOS
  if (window.mainCover)
    mainCover.style.backgroundImage = `url(${cover})`;

  if (window.manageCover)
    manageCover.style.backgroundImage = `url(${cover})`;

  if (window.coverPreviewTemp)
    coverPreviewTemp.style.backgroundImage = `url(${cover})`;

  if (window.avatarEditCover)
    avatarEditCover.style.backgroundImage = `url(${cover})`;

  // NOMBRE
  if (window.profileName) profileName.textContent = name;
  if (window.manageProfileName) manageProfileName.textContent = name;
  if (window.editName) editName.textContent = name;
  if (window.editNameCover) editNameCover.textContent = name;

  // INPUTS
  const input = document.querySelector(
    '#manage-profile-view #profileNameInput, #edit-profile-view #profileNameInput'
  );
  if (input) input.value = name;

  // FOOTER ICON
const footerIcon = document.getElementById('footerIconImg');
if (footerIcon) footerIcon.src = avatar;

}

const footer = document.querySelector(".footer");

let lastScrollTop = 0;

function handleScroll(currentScroll) {
    if (currentScroll > lastScrollTop) {
        footer.classList.add("hidden"); // bajando
    } else {
        footer.classList.remove("hidden"); // subiendo
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}

/* 1️⃣ Detectar scroll en la página principal (window) */
window.addEventListener("scroll", function () {
    handleScroll(window.scrollY);
});

/* 2️⃣ Detectar scroll en contenedores internos */
document.querySelectorAll(".scroll-content, .scroll-view").forEach(container => {
    container.addEventListener("scroll", function () {
        handleScroll(container.scrollTop);
    });
});


/* ================= CAMBIOS ================= */
function markProfileAsChanged() {
  profileChanged = true;

  const btn = document.getElementById('saveProfileBtn');
  if (!btn) return;

  btn.disabled = false;
  btn.classList.add('active');
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-light');
}

/* ================= LOAD ================= */
window.addEventListener('load', () => {
  initProfileDefaults();
  syncPreviewData();

  const nameInput = document.querySelector(
    '#manage-profile-view #profileNameInput'
  );

  if (nameInput) {
    nameInput.addEventListener('input', markProfileAsChanged);
  }
});


function openDeleteProgressModal() {
  document.getElementById("deleteProgressOverlay").classList.remove("hidden");
}

function closeDeleteProgressModal() {
  document.getElementById("deleteProgressOverlay").classList.add("hidden");
}

function confirmDeleteProgress() {
  Object.keys(localStorage).forEach(key => {
    if (
      key.startsWith("progress_") ||
      key.startsWith("movie_") ||
      key.startsWith("series_") ||
      key.includes("-serie") ||
      key.includes("-bebop") ||
      key.includes("cowboy") ||
      key.includes("-") // 🔥 esto atrapará ids como cowboy-bebop
    ) {
      localStorage.removeItem(key);
    }
  });

  closeDeleteProgressModal();
  showToast("Progreso de reproducción eliminado");
}

/* ===== TOAST ===== */
function showToast(text) {
  const toast = document.getElementById("notificacion");
  const texto = document.getElementById("notificacionTexto");

  texto.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}



document.addEventListener("DOMContentLoaded", () => {
  renderNotifications();
  updateMenuNotificationBadge();

  // 👇 SOLO si no hay nada guardado
  if (!localStorage.getItem(STORAGE_KEY)) {
    addNotification();
  }
});


